# Visualization Instructions

## Available Tools

### `render_chart`

For standard chart types. Parameters:
- `type` — bar, line, pie, area, scatter, horizontal-bar, stacked-bar, treemap, funnel
- `title` — chart title
- `labels` — X-axis labels (bar/line/area), segments (pie/funnel)
- `datasets` — array of `{label, data}` objects per series
- `x_axis_title`, `y_axis_title` — axis labels
- `treemap_data` — for treemap charts: `[{name, value}]`

### `render_react`

Use ONLY when the user explicitly asks for a React/dashboard layout to be rendered **inline in the Treasure Work chat** — not for shareable/exportable artifacts.

- Write a single component: `export default function ComponentName({ data })`
- React hooks (useState, useEffect, useMemo) and all Recharts components are available as globals — do NOT import them
- Tailwind CSS for styling, with `dark:` variants for dark mode
- `isDark` boolean and `theme` string available in scope
- Default to `render_chart` first; reach for `render_react` only when needed.

### Templated HTML dashboard (`generate-data.js`)

Use this when the user asks for a **shareable, exportable, standalone HTML dashboard** (an artifact they can email, host, or open offline). Don't reach for `render_react` for this — that's chat-only.

- Run `generate-data.js` from the Work Folder root — exact command in `references/dashboard_template.md`
- Script queries output tables concurrently in parallel via `tdx`, derives metrics & insights, and writes to `{{engagement_dir}}/dashboards/nba_summary_dashboard.html`
- Open with `mcp__work__open_file`
- See `references/dashboard_template.md` and SKILL.md for details
- Keep TD palette, layout CSS, and chart shapes intact

## TD Color Palette

Always use this palette for chart series, in order:

```
["#B4E3E3", "#ABB3DB", "#D9BFDF", "#F8E1B0", "#8FD6D4",
 "#828DCA", "#C69ED0", "#F5D389", "#6AC8C6", "#5867B8",
 "#B37EC0", "#F1C461", "#44BAB8", "#2E41A6", "#8CC97E", "#A05EB0"]
```

Never substitute another palette. NBA dashboards live next to MTA / RFM / other Treasure Data outputs and need to look consistent.

## Chart Standards

- Legends visible for any multi-series chart
- Always create **separate individual charts** — never combine into Plotly subplots
- Score values displayed with 1 decimal place (e.g., `32.5%`)
- Counts formatted with thousands separators (`125,000 profiles`)
- Bold all metrics in text output
- Clear axis labels with business context (e.g., `"Engagement Score (Quartile)"`, not just `"score"`)
- 3-7 charts per analysis response

## Chart Type Selection

| Analysis | Tool & type |
|----------|-------------|
| Score distribution within a single metric (e.g., `next_best_channel_social`) | `render_chart` type: `bar` or `horizontal-bar` |
| Comparing channel/daypart counts | `render_chart` type: `bar` (categorical x-axis) |
| Per-source contribution breakdown | `render_chart` type: `horizontal-bar` (sorted by `num_events`) |
| Flag rates (cart-abandon / new-visitor — share of profiles flagged) | `render_chart` type: `pie` or `bar` |
| Run-over-run trends (profiles_scored, flag rate, score distribution) | `render_chart` type: `line` |
| Score distribution as continuous range (`percentile` / `minmax`) | `render_chart` type: `area` |
| Channel contribution to total volume | `render_chart` type: `treemap` |
| Conversion rate per score bucket | `render_chart` type: `bar` (with conversion_rate as the y-axis) |
| Multi-chart "summarize the latest run" dashboard | `render_react` (only when user explicitly asks for a dashboard) |

## NBA-Specific Visualization Patterns

### Score Distribution (e.g., next_best_channel_social)

When `scoring_logic` is `quartile`:
- 4 bars on x-axis (`"1"`, `"2"`, `"3"`, `"4"`), `profile_count` on y-axis
- Annotate `metric_value = '4'` as the highest-engagement bucket

When `scoring_logic` is `percentile` or `minmax`:
- Bin the `metric_value` into ~10 buckets in SQL before charting (the raw distribution has too many discrete points)
- Use a histogram-style bar chart or area chart

### Cart-Abandon / New-Visitor Flag Rate

Always show as a pie chart or 2-bar comparison: `flag = 1` vs `flag = 0`.
- Annotate the flag rate prominently in the chart title (e.g., `"Cart-Abandon Flag Rate: 8.2% of profiles"`)
- Optionally show the absolute count alongside the percentage

### Per-Source Contribution

Horizontal bar chart sorted descending by `num_events`. Include a secondary metric next to the bar — usually `total_conversions` — so the user sees both volume and conversion contribution.

### Run-over-Run Comparison

Line chart with `session_id` (or run timestamp from `TD_TIME_FORMAT(time, 'yyyy-MM-dd', 'UTC')`) on the x-axis. One line per metric being compared. ALWAYS annotate the relevant config change (e.g., "`event_lookback_days` was changed from 60 to 90 between Run 4 and Run 5") in the chart title or as a callout.

### Top Channels / Top Dayparts

When the user asks "which channel gets the most affinity?" — chart `profile_count` per `metric_value = '4'` (top quartile) across all `next_best_channel_*` metrics. This shows which channel has the largest top-quartile audience.

```sql
SELECT REPLACE(metric_name, 'next_best_channel_', '') AS channel, profile_count
FROM nba_dash_stats_summary
WHERE session_id = (SELECT MAX(session_id) FROM nba_dash_model_metrics)
  AND metric_name LIKE 'next_best_channel_%'
  AND metric_value = '4'
ORDER BY profile_count DESC
LIMIT 10
```

## Forbidden Patterns

- **Don't use Plotly subplots** — always separate individual charts so each can be referenced independently
- **Don't visualize raw `metric_value` strings** when `scoring_logic` is continuous — bin them in SQL first
- **Don't render a chart with fewer than 2 data points** — show the value in text instead
- **Don't show `total_spend` as a "revenue" chart** — it's source-data volume, not revenue. Label it explicitly as "source data spend" or skip it.
- **Don't present a percentile distribution without normalizing the bucket count first** — picking bin count drives interpretability
- **Don't dump raw query JSON** — only rendered charts
- **Don't approximate** (`32.5%` not `~33%`)
