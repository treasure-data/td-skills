# MTA Model Summary Dashboard — Build & Data Guide

The MTA Model Summary Dashboard is an executive-ready, 5-tab HTML dashboard that provides zero-latency visualization of multi-touch attribution models (Rule-Based, Markov, and Shapley), customer conversion journeys, source health, and channel transition flows.

---

> **Use as-is.** The dashboard template and `generate-data.js` are pre-validated: run the command once and use the result as it is. Do not take screenshots, run browser, QA or validation scripts, re-check the data, or edit the generated HTML, and do not apply other visualization or design skills to it. If something looks wrong, tell the user instead of fixing it.

## 1. Fast Generation via `generate-data.js`

Instead of manually executing queries and substituting tokens, use `generate-data.js` to automatically query `{{sink_database}}` via `tdx` in parallel, calculate statistics, synthesize executive insights, and bake all data directly into the dashboard in seconds.

### Commands

```bash
# Run from the Work Folder root (where agent_outputs/ lives).
node ".claude/skills/{{agent_name}}/references/generate-data.js" {{sink_database}} {{project_slug}} "{{project_name}}" \
  -c {{customer_id_col}} -o "{{engagement_dir}}/dashboards/mta_summary_dashboard.html"
```

### Options & Environment Variables

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `SOURCE_DB` | Env / Arg 1 | Required | Sink database where the MTA output tables live |
| `PROJECT_SLUG` | Env / Arg 2 | `mta` | Project slug — default output folder `agent_outputs/<project_slug>/dashboards/` |
| `PROJECT_NAME` | Env / Arg 3 | Title-cased slug | Display name in dashboard header |
| `CUSTOMER_ID_COL` / `-c, --customer-id-col` | Env / Flag | Auto-detected | Customer identifier column in `mta_journeys` (the workflow's `unique_user_id`, here `{{customer_id_col}}`) |
| `-o, --output` | String | `agent_outputs/<project_slug>/dashboards/mta_summary_dashboard.html` (relative to cwd) | Custom output file path |
| `-t, --template` | String | `dashboard_template.html` next to the script | Path to template file |
| `-v, --verbose` | Flag | `false` | Prints SQL statements and execution times |
| `-h, --help` | Flag | `false` | Shows CLI usage guide |

### Output

The generated dashboard is saved to:
```
{{engagement_dir}}/dashboards/mta_summary_dashboard.html
```
Open it immediately using:
```bash
open "{{engagement_dir}}/dashboards/mta_summary_dashboard.html"
# Or in Treasure Work:
mcp__work__open_file path: "{{engagement_dir}}/dashboards/mta_summary_dashboard.html"
```

---

## 2. Parallel Source Queries (Automated by `generate-data.js`)

`{{customer_id_col}}` below is the customer identifier column of `mta_journeys` (the workflow's `unique_user_id`).

All independent queries are dispatched concurrently in parallel using `Promise.all`:

### Q1 — Parameters & Run Configuration (Header Metadata)
```sql
SELECT src_table, table_description, event_name, conversion_flag,
       apply_time_filter, time_filter_type, lookback_period,
       final_where_clause, time
FROM {{sink_database}}.mta_table_params
```
*Powers: Header metadata tags (Lookback Window, Unique User ID, Verified Conversion Source).*

### Q2 — Headline KPIs & Journey Aggregates (Header & Tab 1/Tab 4 KPIs)
```sql
SELECT
  COUNT(*) AS total_touchpoints,
  COUNT(DISTINCT {{customer_id_col}}) AS unique_customers
  CAST(SUM(conversion_flag) AS BIGINT) AS total_conversions,
  COUNT(DISTINCT conversion_journey_id) AS distinct_journeys,
  ROUND(AVG(journey_length), 1) AS avg_journey_steps,
  ROUND(AVG(journey_duration_days), 1) AS avg_journey_days,
  MIN(event_date) AS min_date,
  MAX(event_date) AS max_date,
  DATE_DIFF('day', DATE(MIN(event_date)), DATE(MAX(event_date))) AS window_days,
  COUNT(CASE WHEN url IS NOT NULL AND (url LIKE '%utm_%' OR url LIKE '%utm_source%') THEN 1 END) AS utm_web_count,
  COUNT(CASE WHEN url IS NOT NULL THEN 1 END) AS total_web_count
FROM {{sink_database}}.mta_journeys
```
*Powers: Total Conversions, Unique Customers, Avg Journey Steps, Avg Duration (days), Total Touchpoints, Observation Window, and Web UTM Coverage %.*

### Q3 — Standard Model Attribution (Tab 1 Attribution Overview)
```sql
SELECT attribution_type, channel,
       ROUND(SUM(total_conversions), 1) AS total_conv
FROM {{sink_database}}.mta_models_standard
GROUP BY 1, 2
ORDER BY 1, 3 DESC
```
*Powers: First Touch vs Last Touch grouped bar chart, All Models Side-by-Side comparison chart, and Model Comparison Table across First Touch, Linear, U-Shaped, and Last Touch.*

### Q4 — Markov Attribution Share (Tab 2 ML Models)
```sql
SELECT channels AS ch,
       ROUND(SUM(attribution_markov_algorithmic) * 100.0 / SUM(SUM(attribution_markov_algorithmic)) OVER (), 2) AS v,
       ROUND(AVG(removal_effect) * 100, 1) AS re
FROM {{sink_database}}.mta_markov_attribution_final
WHERE run_time = (SELECT MAX(run_time) FROM {{sink_database}}.mta_markov_attribution_final)
GROUP BY channels
ORDER BY v DESC
```
*Powers: Top Markov Channel KPI (attribution share), Markov Attribution % horizontal bar chart, and the ML attribution table (attribution share and removal effect).*

### Q5 — Shapley Attribution (Tab 2 ML Models)
```sql
SELECT channels AS ch,
       ROUND(SUM(value), 1) AS total_attributed,
       ROUND(SUM(percentage) * 100, 2) AS v
FROM {{sink_database}}.mta_shapley_attribution_final
WHERE run_time = (SELECT MAX(run_time) FROM {{sink_database}}.mta_shapley_attribution_final)
  AND step = 0
GROUP BY channels
ORDER BY total_attributed DESC
```
*Powers: Top Shapley Channel KPI, Shapley % (step 0 = whole journey), Negative Shapley anomaly counter, Shapley horizontal bar chart, and ML attribution table.*

### Q6 — Top Conversion Journeys (Tab 3 Top Conversion Journeys)
```sql
SELECT journey_steps,
       SUM(conversions) AS conversions,
       ROUND(AVG(avg_journey_length), 1) AS avg_steps,
       ROUND(AVG(avg_journey_duration_days), 1) AS avg_days
FROM {{sink_database}}.mta_top_conversion_journeys
WHERE LOWER(target) LIKE '%conv%'
GROUP BY journey_steps
ORDER BY conversions DESC
LIMIT 10
```
*Powers: Top Conversion Journey Patterns table and Pattern Share donut chart.*

### Q7 — Converted vs Churn Aggregates (Tab 3 Top Conversion Journeys)
```sql
SELECT target,
       COUNT(*) AS pattern_count,
       COALESCE(SUM(conversions), 0) AS total_conversions,
       ROUND(AVG(avg_journey_length), 1) AS avg_steps,
       ROUND(AVG(avg_journey_duration_days), 1) AS avg_days
FROM {{sink_database}}.mta_top_conversion_journeys
GROUP BY target
```
*Powers: Conversion Patterns KPI, Churn Patterns KPI, Avg Conv Steps/Days, Avg Churn Steps/Days, and Converted vs Churn comparison bar chart.*

### Q8 — Source Table Summary (Tab 4 Source & Channel Health)
```sql
SELECT src_table, total_profiles, total_events,
       CAST(conversion_events AS BIGINT) AS conversion_events,
       min_date, max_date, table_description
FROM {{sink_database}}.journey_src_union_summary
ORDER BY total_events DESC
```
*Powers: Source Table Summary table and Event Volume horizontal bar chart.*

### Q9 — Channel Distribution & Validation (Tab 4 Source & Channel Health)
```sql
SELECT channel AS ch, total_events,
       ROUND(perc_of_total_events, 1) AS pct_events,
       CAST(total_conversions AS BIGINT) AS conversions,
       perc_of_total_conv, total_revenue
FROM {{sink_database}}.mta_journeys_validate
ORDER BY total_events DESC
```
*Powers: Channel Share donut chart, Channel Distribution in Journeys table with automated funnel role classification pills.*

### Q10 — Markov Transition Flows (Tab 5 Journey Flow Sankey)
```sql
SELECT channels AS from_channel, to_channel,
       ROUND(AVG(trans_prob) * 100, 0) AS flow
FROM {{sink_database}}.mta_markov_transition_final
WHERE run_time = (SELECT MAX(run_time) FROM {{sink_database}}.mta_markov_transition_final)
GROUP BY 1, 2
ORDER BY flow DESC
LIMIT 15
```
*Powers: Strongest Flow KPI, Top Feeder to Email KPI, Second Strongest Flow KPI, Terminal Node KPI, and the interactive Chart.js Sankey diagram.*

---

## 3. Dashboard Structure & Tab-by-Tab Breakdown

### Tab 1 — Attribution Overview
- **4 Headline KPIs**: Total Conversions (with conversion source subtitle), Unique Customers (with lookback window), Avg Journey Length (steps), Avg Journey Duration (days).
- **First Touch vs Last Touch (Grouped Bar Chart)**: Contrasts channel power in initiating customer awareness versus closing final conversions.
- **All Models Side by Side (Bar Chart)**: Compares First Touch, Linear, U-Shaped, and Last Touch across top channels to highlight attribution distribution differences.
- **Model Comparison Table**: Channel-by-channel breakdown across First Touch, Linear, U-Shaped, and Last Touch attributed conversions.
- **Attribution Model Interpretation Table**: Reference guide explaining when and why each attribution framework should be used.
- **Dynamic Executive Insights**: Automated strategic bullets detailing journey initiators, closers, assist channels, complexity metrics, and overall reach.

### Tab 2 — ML Models (Markov & Shapley)
- **4 Headline KPIs**: Top Markov Channel (with removal effect %), Top Shapley Channel (with daily share %), Channels Analysed count, Negative Shapley anomaly counter with channel names.
- **Markov Attribution (Horizontal Bar Chart)**: Each channel's share of the Markov-credited conversions (sums to 100%, comparable with Shapley %). The removal effect (share of converting paths through the channel) is in the ML attribution table.
- **Shapley Attribution, whole journey (Horizontal Bar Chart)**: Displays fair game-theoretic marginal contribution percentages across all coalitions.
- **Markov vs Shapley vs Linear Comparison (Bar Chart)**: Benchmarks algorithmic models against balanced linear attribution.
- **Full ML Attribution Table**: Detailed comparison table with Markov Attr. %, Markov Removal %, Shapley % (step 0 = whole journey), Shapley Total Attributed, and Linear Conv reference values.
- **Dynamic ML Insights**: Algorithmic linchpins, marginal credit distribution, channel fatigue warnings, and synergy callouts.

### Tab 3 — Top Conversion Journeys
- **4 Headline KPIs**: Conversion Patterns count, Avg Steps to Convert, Avg Days to Convert, Churn Patterns count with dropout velocity metrics.
- **Top Conversion Journey Patterns Table**: Top 10 customer pathways with sequence codes, conversion counts, avg steps, and avg days.
- **Converted vs Churn Comparison (Bar Chart)**: Direct comparison of touchpoints and duration between converting journeys and non-converting dropouts.
- **Top Patterns Share (Donut Chart)**: Distribution of top journey paths vs remainder.
- **Dynamic Journey Insights**: Pathway dominance, drop-off risk factors, funnel velocity comparisons, and automation recommendations.

### Tab 4 — Source & Channel Health
- **4 Headline KPIs + SVG Gauge**: Total Touchpoints, Observation Window, Web UTM Tracking Coverage SVG gauge with percentage label, Conversion Source.
- **Source Table Summary Table**: Profiles, Total Events, Conversion Events, and Date Ranges per touchpoint source.
- **Event Volume by Source (Horizontal Bar Chart)**: Raw event contribution across tables.
- **Channel Share (Donut Chart)**: Share of total unified events by channel.
- **Channel Distribution Table**: Channel events, % share, conversions, and automated funnel role badges (`Primary Closer`, `Introducer (Awareness)`, `Multi-Touch Nurturer`, `Conversion Action`, `Supporting Channel`).
- **Dynamic Data Health Insights**: Ingestion volume, tracking integrity, channel density, and observation completeness.

### Tab 5 — Journey Flow (Sankey)
- **4 Headline KPIs**: Strongest Transition Flow (probability %), Top Feeder to Email, Second Strongest Flow, Terminal Node destination.
- **Channel-to-Channel Transition Flow (Interactive Sankey)**: Multi-channel flow diagram powered by `chartjs-chart-sankey` visualizing path transitions between channels with color-coded nodes.
- **Dynamic Flow Insights**: Channel transition velocity, core nurture hubs, funnel acceleration points, and terminal conversion convergence.
