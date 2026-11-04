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

- Run the command in `references/dashboard_template.md` from the Work Folder root (where `agent_outputs/` lives): `node ".claude/skills/{{agent_name}}/references/generate-data.js" {{sink_database}} {{project_slug}} "{{project_name}}" -p {{table_prefix}} -o "{{engagement_dir}}/dashboards/nbp_summary_dashboard.html"`
- Script queries output tables concurrently in parallel via `tdx`, derives metrics & insights, and writes to `{{engagement_dir}}/dashboards/nbp_summary_dashboard.html`
- Open with `mcp__work__open_file`
- See `references/dashboard_template.md` and `SKILL.md` for details
- Keep TD palette, layout CSS, and chart shapes intact

## TD Color Palette

Always use this palette for chart series, in order:

```
["#B4E3E3", "#ABB3DB", "#D9BFDF", "#F8E1B0", "#8FD6D4",
 "#828DCA", "#C69ED0", "#F5D389", "#6AC8C6", "#5867B8",
 "#B37EC0", "#F1C461", "#44BAB8", "#2E41A6", "#8CC97E", "#A05EB0"]
```

Never substitute another palette. NBP dashboards live next to MTA / NBA / RFM / other Treasure Data outputs and need to look consistent.

## Chart Standards

- Legends visible for any multi-series chart
- Always create **separate individual charts** — never combine into Plotly subplots
- Percentages displayed with 1 decimal place (e.g., `82.5%`)
- Counts formatted with thousands separators (`125,000 users`)
- Bold all metrics in text output
- Clear axis labels with business context (e.g., `"Users Receiving Recommendation"`, not just `"count"`)
- 3-7 charts per analysis response

## Chart Type Selection

| Analysis | Tool & type |
|----------|-------------|
| Top recommended items (rank 1) | `render_chart` type: `horizontal-bar` (sorted descending by user_count) |
| Category distribution of recommendations | `render_chart` type: `pie` or `bar` |
| Item popularity from source data | `render_chart` type: `horizontal-bar` (sorted by times_ordered) |
| Recommendation coverage rate (users with recs vs. total) | `render_chart` type: `pie` or 2-bar comparison |
| Category spread across ranks | `render_chart` type: `stacked-bar` (one bar per rank, colored by category) |
| Item catalog breakdown by category | `render_chart` type: `treemap` (sized by item_count) |
| Run-over-run coverage / item diversity trends | `render_chart` type: `line` |
| Test set precision/recall histograms | `render_chart` type: `bar` (separate charts for precision and recall) |
| Item-item similarity distribution | `render_chart` type: `area` or `bar` (binned by similarity score) |
| Multi-chart "summarize the latest run" dashboard | `render_react` (only when user explicitly asks for a dashboard) |

## NBP-Specific Visualization Patterns

### Recommendation Coverage

Show as a two-segment pie chart: users with recommendations vs. users without. Annotate the coverage percentage in the chart title (e.g., `"Recommendation Coverage: 87.3% of users"`).

If `users_with_recs_after_filter < users_with_recs`, show both bars in a side-by-side comparison to make the exclusion filter impact visible.

### Top Recommended Items

Horizontal bar chart sorted descending by `user_count`. Show `nbp_1` on the y-axis. Annotate with `event_cnt` values. If a single item exceeds 30% of all users, call this out as a concentration risk in the insights.

### Category Distribution at Each Rank

Stacked bar chart with one bar per rank position (rank 1 through 3 or however many `max_recommended_items` were configured). Each bar segment represents a category. Sorts categories by their rank-1 share descending.

This chart answers: "Does the model diversify into different categories as rank increases, or does it keep recommending from the same category?"

### Item Popularity vs. Recommendation Overlap

Two horizontal bar charts side by side (or in sequence):
1. Most recommended items (`dash_final_recs_stats_daily`, group by `nbp_1`)
2. Most ordered items from source data (`dash_most_ordered_items`)

Show both and call out which items appear in both lists (converging = popularity-driven recs) vs. which appear only in recommendations (long-tail personalization at work).

### Test Set Performance

Two bar charts — one for precision histogram, one for recall histogram — from `dash_testset`. Show `bin_cnt` on the y-axis and `label` (bin boundaries) on the x-axis. Add a reference line or annotation for `random_item_rate` / `random_category_rate` from `dash_testset_numbers`.

If `run_count >= 2`, add a line chart showing `total_product_matches` and `total_category_matches` trend across sessions.

### Run-Over-Run Trend

Line chart with `run_time` (from `global_session_filter`) on the x-axis. One line per metric: `users_with_recs`, `distinct_items_recommended`, coverage rate. If config changed between runs, annotate the change directly on the chart.

### Item-Item Similarity Distribution

Histogram-style bar chart from `dash_similarity_stats_agg`. Bin the `similarity` values into ~10 buckets (e.g., 0.0–0.1, 0.1–0.2, ...) and show item pair count per bucket. The pairs come from the AI Signals model's similar-items output. This shows the shape of the similarity graph — a mass of low scores means weak item-item signal (sparse interactions), a cluster near 1.0 can point to duplicate items (one product under several IDs).

## Forbidden Patterns

- **Don't use Plotly subplots** — always separate individual charts so each can be referenced independently
- **Don't render a chart with fewer than 2 data points** — show the value in text instead
- **Don't show `times_ordered` as a "revenue" chart** — it's order counts, not revenue. Label explicitly as "times ordered" or "order frequency"
- **Don't approximate** (`32.5%` not `~33%`)
- **Don't dump raw query JSON** — only rendered charts
- **Don't project ROI or uplift** — NBP outputs are recommendations, not revenue forecasts
