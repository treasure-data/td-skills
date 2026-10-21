# NBA Engagement Scores Model Summary Dashboard — Build & Data Guide

The NBA Engagement Scores Model Summary Dashboard is an executive-ready, 3-tab HTML dashboard providing zero-latency visualization of customer affinity scores, behavioral engagement flags, source telemetry, and run-over-run model stability.

---

> **Use as-is.** The dashboard template and `generate-data.js` are pre-validated: run the command once and use the result as it is. Do not take screenshots, run browser, QA or validation scripts, re-check the data, or edit the generated HTML, and do not apply other visualization or design skills to it. If something looks wrong, tell the user instead of fixing it.

## 1. Fast Generation via `generate-data.js`

Instead of manually executing queries and substituting tokens in context, use `generate-data.js` to automatically query the customer's `sink_database` via `tdx` in parallel, shape metrics, synthesize dynamic executive insights, and bake all data directly into the dashboard in seconds.

### Commands

```bash
# Run from the Work Folder root (the folder that contains .claude/ and agent_outputs/)
node ".claude/skills/{{agent_name}}/references/generate-data.js" {{sink_database}} {{project_slug}} "{{project_name}}" \
  -o "{{engagement_dir}}/dashboards/nba_summary_dashboard.html"
```

### Options & Environment Variables

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `SOURCE_DB` | Env / Arg 1 | Required | Customer's sink database where NBA output tables reside (e.g., `nba_output`) |
| `PROJECT_SLUG` | Env / Arg 2 | `nba-scores` | Project slug — default output folder `agent_outputs/<project_slug>/dashboards/` |
| `PROJECT_NAME` | Env / Arg 3 | Title-cased slug | Display name in dashboard header |
| `SCORING_LOGIC` | Env | `quartile` | Scoring strategy used (`percentile`, `quartile`, `minmax`) |
| `-o, --output` | String | `./agent_outputs/<slug>/nba-scores/dashboards/nba_summary_dashboard.html` | Custom output file destination |
| `-t, --template` | String | `dashboard_template.html` next to the script | Path to template file |
| `-v, --verbose` | Flag | `false` | Prints individual query timings and row counts |
| `-h, --help` | Flag | `false` | Shows CLI usage guide |

### Output

The generated dashboard is saved to the git-ignored engagement folder:
```
{{engagement_dir}}/dashboards/nba_summary_dashboard.html
```

Open it immediately using:
```bash
open "{{engagement_dir}}/dashboards/nba_summary_dashboard.html"
# Or in Treasure AI Studio:
mcp__work__open_file path: "{{engagement_dir}}/dashboards/nba_summary_dashboard.html"
```

---

## 2. Parallel Source Queries (Automated by `generate-data.js`)

> These dashboard queries use run-level aggregates and profile counts. They do not assume or interpolate a customer ID column. If a profile-level drill-down is added, resolve the configured `join_key` with `DESCRIBE` or the workflow configuration before writing SQL.

All independent database queries are dispatched concurrently in parallel using `Promise.all`:

### Q1 — Latest Session Config & Metadata (Header & Tab 1 Snapshot)
```sql
SELECT session_id, profiles_scored, event_lookback_days, new_customers_days,
       time_filter_type, lookback_period, time_range_start_date,
       time_range_end_date,
       TD_TIME_FORMAT(time, 'yyyy-MM-dd HH:mm', 'UTC') AS run_time
FROM {{sink_database}}.nba_dash_model_metrics
WHERE session_id = (SELECT MAX(session_id) FROM {{sink_database}}.nba_dash_model_metrics)
LIMIT 1
```
*Powers: Session ID, Run Time (UTC), Behavioral Lookback Days, New Customer Window Days, Time Filter Summary.*

### Q2 — Per-Source Volumes for Latest Run (Tab 1 Source Coverage)
```sql
SELECT source_table, num_events, unique_profiles, total_conversions, total_spend,
       day_range, min_date, max_date
FROM {{sink_database}}.nba_dash_source_tables
WHERE session_id = (SELECT MAX(session_id) FROM {{sink_database}}.nba_dash_model_metrics)
ORDER BY num_events DESC
```
*Powers: Total Events Ingested, Source Table Count, Date Coverage (days + range), Source Events horizontal bar chart, Unique Profiles horizontal bar chart, and Source Table with conversion badges.*

### Q3 — All 7 Engagement Flags for Latest Run (Tab 2 Flags & KPIs)
```sql
SELECT metric_name, metric_value, profile_count, converted_users
FROM {{sink_database}}.nba_dash_stats_summary
WHERE session_id = (SELECT MAX(session_id) FROM {{sink_database}}.nba_dash_model_metrics)
  AND metric_name IN ('conversion_flag','ad_engagement_flag',
      'recent_ad_engagement_flag','recent_purchase_flag','cart_abandon_flag',
      'new_visitor_flag','no_ads_or_purchases_flag')
ORDER BY metric_name, metric_value
```
*Powers: True Scored Profile Count (sum of `conversion_flag`), Headline KPIs (Converted %, Cart-Abandon %, Recent Ad Engagement %, Cold/Dormant %), Grouped Flag Bar Chart, and Detailed Flags Table.*

### Q4 — NBA Pick Fields for Latest Run (Tab 2 Recommendations)
```sql
SELECT metric_name, metric_value, profile_count, converted_users
FROM {{sink_database}}.nba_dash_stats_summary
WHERE session_id = (SELECT MAX(session_id) FROM {{sink_database}}.nba_dash_model_metrics)
  AND metric_name IN ('next_best_channel','next_best_time','next_best_campaign')
ORDER BY metric_name, profile_count DESC
```
*Powers: Next Best Channel horizontal bar chart (top 10), Next Best Time daypart bar chart (morning, afternoon, evening, overnight), and Next Best Campaign donut chart.*

### Q5 — Run Inventory for Historic Tracker (Tab 3 Runs)
```sql
SELECT m.session_id,
       TD_TIME_FORMAT(MAX(m.time), 'yyyy-MM-dd', 'UTC') AS run_date,
       COALESCE(MAX(s.total_profiles), MAX(m.profiles_scored)) AS profiles_scored
FROM {{sink_database}}.nba_dash_model_metrics m
LEFT JOIN (
  SELECT session_id, SUM(profile_count) AS total_profiles
  FROM {{sink_database}}.nba_dash_stats_summary
  WHERE metric_name = 'conversion_flag'
  GROUP BY session_id
) s ON m.session_id = s.session_id
GROUP BY m.session_id
ORDER BY m.session_id ASC
```
*Powers: Run dates timeline, Profiles Scored line chart, and Single-run callout toggle (`run_count == 1`).*

### Q6 — Pick-Field Distributions Across All Runs (Tab 3 Distribution Trends)
```sql
SELECT session_id, metric_name, metric_value, profile_count
FROM {{sink_database}}.nba_dash_stats_summary
WHERE metric_name IN ('next_best_channel','next_best_time','next_best_campaign')
ORDER BY session_id ASC, metric_name, profile_count DESC
```
*Powers: Next Best Channel trend lines (top 5 channels run-over-run), Next Best Time daypart trend lines (4 dayparts), and Next Best Campaign stacked area mix chart.*

### Q7 — Flag Rates Across All Runs (Tab 3 Flag Rate Trends)
```sql
SELECT session_id, metric_name, profile_count, converted_users
FROM {{sink_database}}.nba_dash_stats_summary
WHERE metric_value = '1'
  AND metric_name IN ('conversion_flag','ad_engagement_flag',
      'recent_ad_engagement_flag','recent_purchase_flag','cart_abandon_flag',
      'new_visitor_flag','no_ads_or_purchases_flag')
ORDER BY session_id ASC, metric_name
```
*Powers: Historical engagement flag rates trend lines (% of scored audience flagged = 1).*

---

## 3. Dashboard Structure & Tab Breakdown

### Header & Metadata Strip
- **Customer Identity**: Customer display name, sink database name, and latest session ID.
- **Run Metadata**: Run timestamp (UTC), true profiles scored, time filter specification, scoring strategy, cart-abandon lookback window, and new visitor qualification window.

### Tab 1 — Input Data
- **KPI Summary Grid**: Source Tables Count, Total Events Ingested, Profiles Scored, Temporal Date Coverage.
- **Source Contribution Visualizations**:
  - Horizontal Bar Chart: Ingested events per source table (sorted ASC so highest appears at top).
  - Horizontal Bar Chart: Unique customer profiles reached per source table.
  - Interactive Source Table: Source table name, event count, unique profiles, goal conversions (with `<span class="pill">conversion</span>` badges), and date range.
- **Configuration Snapshot**: Clean 4-row key-value table verifying parameters of the active run.
- **Executive Insights & Recommendations**: 6 dynamically synthesized findings assessing primary volume drivers, cross-table reach, conversion capture, data freshness, and touchpoint density.

### Tab 2 — NBA Scores Summary
- **Headline KPIs**:
  1. Profiles Scored (Total audience scored)
  2. Converted (Lifetime conversion count and %)
  3. Cart-Abandon Audience (Active recovery target count and %)
  4. Recent Ad Engagement (Actionable retargeting pool count and %)
  5. Cold / Dormant (Unengaged audience count and %)
- **Top-Pick NBA Recommendations (3 Coordinated Visualizations)**:
  - Next Best Channel: Top channel affinity volume and audience percentage (Plotly horizontal bar).
  - Next Best Time: Profile volume across 4 standardized dayparts (`morning`, `afternoon`, `evening`, `overnight`) (Plotly bar chart).
  - Next Best Campaign: Recommendation portfolio mix across `Next Best Product`, `Prospecting`, `Cart Abandon`, and `Retargetting` (Plotly donut chart).
- **Profile-Level Engagement Flags (All 7 Flags)**:
  - Grouped Bar Chart: Flagged population size vs. confirmed converters in each flag cohort.
  - Full Details Table: Flag name, marketing meaning, flagged count, % of total audience, converter count, and segment conversion rate.
- **Executive Insights & Recommendations**: 7 dynamically synthesized findings evaluating channel affinity concentration, optimal outbound schedule, cart abandonment win-back opportunity, conversion ground truth, and cold list management.

### Tab 3 — Historic Tracker
- **Single-Run Graceful Degradation**: When only 1 run exists, displays a prominent callout informing users that trend lines will populate after subsequent scheduled runs, while rendering the baseline snapshot cleanly.
- **Trend Visualizations**:
  - Profiles Scored Over Time: Total addressable audience trajectory across workflow sessions.
  - Next Best Channel Run-over-Run: Multi-line chart tracking profile volumes for top 5 channels.
  - Next Best Time Run-over-Run: Multi-line chart tracking daypart stability.
  - Next Best Campaign Mix: Stacked area chart showing evolution of campaign recommendation proportions.
  - Engagement Flag Rates Over Time: Multi-line percentage chart tracking drift across all 7 engagement flags.
- **Executive Insights & Recommendations**: Synthesizes 6 findings:
  - In single-run mode: Establishes baseline metrics, acceptable stability bands (±5pp), outbound scheduling control groups, and monitoring priorities.
  - In multi-run mode: Quantifies population deltas, drift detection, channel migration, and flag rate shifts.

---

## 4. Programmatic Data Access (`window.RAW`)

Every generated dashboard inlines a structured JSON payload in `<head>` accessible via browser console or automated scripts:

```javascript
console.log(window.RAW);
// Structure:
// {
//   customer: { name, slug, database },
//   meta: { sessionId, runTime, profilesScored, scoringLogic, eventLookbackDays, newCustomersDays, timeFilterSummary, runCount },
//   sources: [...],
//   picks: { nextBestChannel, nextBestTime, nextBestCampaign },
//   flags: [...],
//   historic: { runs, sessions, profilesScored, nbcSeries, nbtSeries, nbcampSeries, flagsRates }
// }
```
