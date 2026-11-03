# RFM Model Summary Dashboard — Build & Data Guide

The RFM Model Summary Dashboard is an executive-ready, 3-tab HTML dashboard that provides zero-latency visualization of customer segmentation, behavioral distributions, and data source telemetry.

---

> **Use as-is.** The dashboard template and `generate-data.js` are pre-validated: run the command once and use the result as it is. Do not take screenshots, run browser, QA or validation scripts, re-check the data, or edit the generated HTML, and do not apply other visualization or design skills to it. If something looks wrong, tell the user instead of fixing it.

## 1. Fast Generation via `generate-data.js`

Instead of manually executing queries and substituting tokens, use `generate-data.js` to automatically query the customer's `sink_database` via `tdx`, calculate statistics, and bake all data directly into the dashboard in seconds.

### Commands

```bash
# Run from the Work Folder root (where agent_outputs/ lives).
node ".claude/skills/{{agent_name}}/references/generate-data.js" {{sink_database}} {{project_slug}} "{{project_name}}" \
  -o "{{engagement_dir}}/dashboards/rfm_summary_dashboard.html"
```

### Options & Environment Variables

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `SOURCE_DB` | Env / Arg 1 | Required | Customer's sink database where RFM output tables live |
| `PROJECT_SLUG` | Env / Arg 2 | `rfm` | Project slug — default output folder `agent_outputs/<project_slug>/dashboards/` |
| `PROJECT_NAME` | Env / Arg 3 | Title-cased slug | Display name in dashboard header |
| `CUSTOMER_ID_COL` / `-c, --customer-id-col` | Env / Flag | Auto-detected | Customer identifier column in `rfm_combined_user_events` (e.g., `td_consumer_id`, `canonical_id`) |
| `-o, --output` | String | `agent_outputs/<slug>/rfm/dashboards/rfm_summary_dashboard.html` (relative to cwd) | Custom output file path |
| `-t, --template` | String | `dashboard_template.html` next to the script | Path to template file |
| `-v, --verbose` | Flag | `false` | Prints SQL statements and execution times |

### Output

The generated dashboard is saved to:
```
{{engagement_dir}}/dashboards/rfm_summary_dashboard.html
```
Open it immediately using:
```bash
open "{{engagement_dir}}/dashboards/rfm_summary_dashboard.html"
# Or in Treasure Work:
mcp__work__open_file path: "{{engagement_dir}}/dashboards/rfm_summary_dashboard.html"
```

---

## 2. Source Queries (Automated by `generate-data.js`)

These 7 queries are executed against the customer's `sink_database`:

### Q1 — Latest Session KPIs (Header & Model Overview Cards)
```sql
SELECT session_id, segment_size AS total_profiles, avg_rfm, avg_recency,
       avg_frequency, avg_monetary,
       TD_TIME_FORMAT(time, 'yyyy-MM-dd HH:mm', 'UTC') AS run_time
FROM {{sink_database}}.rfm_stats
WHERE session_id = (SELECT MAX(session_id) FROM {{sink_database}}.rfm_stats)
  AND rfm_segment = 'ALL'
LIMIT 1
```

### Q2 — Previous Run Profile Count (% Change KPI)
```sql
SELECT segment_size AS prev_total_profiles
FROM {{sink_database}}.rfm_stats_daily_agg
WHERE rfm_segment = 'ALL'
  AND session_id = (
    SELECT MAX(session_id) FROM {{sink_database}}.rfm_stats_daily_agg
    WHERE session_id < (SELECT MAX(session_id) FROM {{sink_database}}.rfm_stats_daily_agg)
  )
LIMIT 1
```
*Note: If `rfm_stats_daily_agg` is empty or first run, fallback checks `rfm_stats` or sets delta to "N/A (first run)".*

### Q3 — Historic Segment Sizes for Trend Chart (Model Overview)
```sql
SELECT session_id, rfm_segment, segment_size,
       TD_TIME_FORMAT(time, 'yyyy-MM-dd', 'UTC') AS run_date
FROM {{sink_database}}.rfm_stats_daily_agg
WHERE rfm_segment != 'ALL'
ORDER BY session_id ASC
```
*Builds one line series per segment across distinct run dates.*

### Q4 — Data Sources Summary (Source Contribution Tab)
```sql
SELECT event_name AS source_name, total_profiles, total_events,
       avg_events_per_person, total_spend, avg_spend_per_person,
       min_date, max_date, months_range, table_filters
FROM {{sink_database}}.rfm_src_table_summary
ORDER BY total_profiles DESC
```
*Fallback: If `rfm_src_table_summary` is not present, derives source metrics from `rfm_stats_model_params` or `rfm_combined_user_events`.*

### Q5 — Segment Distribution & Metrics (Segment Analysis Tab)
```sql
SELECT s.rfm_segment, s.segment_size, s.population_percent,
       s.avg_recency, s.avg_frequency, s.avg_monetary, s.avg_rfm,
       s.quartile_list,
       COALESCE(d.segment_definition, '') AS segment_definition
FROM {{sink_database}}.rfm_stats s
LEFT JOIN (
  SELECT rfm_segment, segment_definition
  FROM {{sink_database}}.rfm_stats_daily_agg
  WHERE session_id = (SELECT MAX(session_id) FROM {{sink_database}}.rfm_stats_daily_agg)
) d ON s.rfm_segment = d.rfm_segment
WHERE s.session_id = (SELECT MAX(session_id) FROM {{sink_database}}.rfm_stats)
  AND s.rfm_segment != 'ALL'
ORDER BY s.segment_size DESC
```

### Q6 — Score Histograms for All Profiles (Segment Analysis Tab)
```sql
SELECT metric_name, bin_order, bin_label, bin_value, profile_cnt
FROM {{sink_database}}.rfm_stats_histogram
WHERE session_id = (SELECT MAX(session_id) FROM {{sink_database}}.rfm_stats_histogram)
  AND rfm_segment = 'ALL'
ORDER BY metric_name, bin_order ASC
```
*Bins populate Recency, Frequency, and Monetary distribution bar charts.*

### Q7 — Source Contribution & Reach (Source Contribution Tab)
```sql
SELECT source,
       COUNT(DISTINCT <customer_id_col>) AS profile_count,
       ROUND(AVG(total_touchpoints), 2) AS avg_touchpoints
FROM {{sink_database}}.rfm_combined_user_events
GROUP BY source
ORDER BY profile_count DESC
```

Use the configured `globals.canonical_id` from the workflow or run `DESCRIBE {{sink_database}}.rfm_combined_user_events` first. Do not assume `customer_id` or `canonical_id`; substitute the actual `<customer_id_col>` (for example, `td_consumer_id`).

---

## 3. Dashboard Structure & Components

### Tab 1 — Model Overview
- **5 KPI Cards**: Total Profiles Scored (with % delta vs previous session), Average RFM Score (quartile scale 1–4), Average Recency (days), Average Frequency (touchpoints), Average Monetary Value ($ spend).
- **Historic Segment Trend (Plotly Line Chart)**: Tracks population growth or shrinkage across each customer segment over all recorded sessions.
- **Run Configuration Table**: Key/value summary of Session ID, Profiles Scored, Scoring Model (`ai_signals`), Run Time (UTC), Time Filter, Source Table Count, and Sink Database.
- **Executive Summary (Dynamic Bullets)**: 5 automated strategic insights highlighting high-value core segments, churn prevention priorities (e.g. 'Cannot lose them'), growth opportunities (e.g. 'Potential Loyalists'), and dormancy.

### Tab 2 — Segment Analysis
- **Segment Distribution (Side-by-side Visualizations)**:
  - Horizontal Bar Chart: Customer count per segment sorted ascending (largest at top) with formatted counts and percentages.
  - Donut Chart: Segment share of the total customer base (%).
- **Segment Metrics (Interactive Table)**:
  - Columns: Segment Name (colored pills), Definition, Quartile Combinations, Customers, % of Base, Avg Recency (d), Avg Frequency, Avg Monetary ($), Avg RFM Score.
- **Score Distributions (3 Side-by-side Histograms)**:
  - Recency Histogram: Profiles by days since last activity.
  - Frequency Histogram: Profiles by total touchpoints.
  - Monetary Histogram: Profiles by spend tier ($).

### Tab 3 — Source Contribution
- **Data Sources Used Table**:
  - Columns: Source Name, Profiles Reached, Total Events, Avg Events/Profile, Total Spend, Avg Spend/Profile, Date Range, Months Range, Filters Applied.
- **Profiles & Engagement (Side-by-side Visualizations)**:
  - Left: Distinct profiles reached per source (horizontal bar).
  - Right: Average touchpoints per profile by source (vertical bar).
- **Source Insights & Observations**:
  - Observations on channel coverage, transaction data fidelity, event intensity, and behavioral window consistency.
