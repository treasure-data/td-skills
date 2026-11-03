# Visualization Instructions

## Available Tools

### render_chart
For standard chart types. Parameters:
- `type` — bar, line, pie, area, scatter, horizontal-bar, stacked-bar, radar, sankey, treemap, funnel
- `title` — chart title
- `labels` — X-axis labels (bar/line/area), segments (pie/funnel), axes (radar)
- `datasets` — array of `{label, data}` objects for each series
- `x_axis_title`, `y_axis_title` — axis labels
- `treemap_data` — for treemap charts (`[{name, value}]`)

### render_react
For complex interactive dashboards requiring multiple coordinated charts or custom interactivity:
- Write a single component: `export default function ComponentName({ data })`
- React hooks (useState, useEffect, useMemo) and all Recharts components are available as globals — do NOT import them
- Use Tailwind CSS for styling with `dark:` variants for dark mode
- `isDark` boolean and `theme` string are available in scope
- Use for: multi-chart dashboards, heatmaps, complex layouts

## TD Color Palette

Primary (use in order for chart series):
```
["#B4E3E3", "#ABB3DB", "#D9BFDF", "#F8E1B0", "#8FD6D4", "#828DCA", "#C69ED0", "#F5D389", "#6AC8C6", "#5867B8", "#B37EC0", "#F1C461", "#44BAB8", "#2E41A6", "#8CC97E", "#A05EB0"]
```

## Chart Standards

- Legends must be visible for multi-series charts
- Always create **separate individual charts** — never combine into subplots
- Score values displayed as integers (e.g., 8, not 8.0)
- Percentage values with 1 decimal place (e.g., 32.5%)
- Monetary values formatted with currency prefix ($2.1M)
- Bold all metrics in text output
- Clear axis labels with business context
- Create 3-7 charts per analysis response

## Chart Type Selection for RFM Analysis

| Analysis Type | Tool & Type |
|---|---|
| Segment distribution (customer count) | `render_chart` type: "pie" or "treemap" |
| Segment comparison (R/F/M scores) | `render_chart` type: "radar" |
| Score distribution (histogram) | `render_chart` type: "bar" |
| R vs F score heatmap | `render_react` with Recharts heatmap |
| Monetary value by segment | `render_chart` type: "horizontal-bar" or "treemap" |
| Customer ranking (top-N) | `render_chart` type: "horizontal-bar" |
| Frequency vs Monetary scatter | `render_chart` type: "scatter" |
| Segment migration over time | `render_chart` type: "stacked-bar" |
| Score trend analysis | `render_chart` type: "line" or "area" |
| Segment funnel (engagement to purchase) | `render_chart` type: "funnel" |
| Multi-chart executive dashboard | `render_react` with multiple Recharts components |

## RFM-Specific Visualization Rules

### Segment Color Mapping
Use consistent colors for segments across all charts:
- Champions: `#44BAB8` (teal)
- Loyal Customers: `#5867B8` (blue)
- Potential Loyalists: `#8FD6D4` (light teal)
- Promising: `#B4E3E3` (light cyan)
- New Customers: `#8CC97E` (green)
- Cannot lose them: `#F1C461` (gold/warning)
- Need attention: `#F5D389` (light gold)
- Hibernating: `#D9BFDF` (lavender)
- High Value Sleeping: `#C69ED0` (purple)
- Lost customers: `#ABB3DB` (gray-blue)

### Radar Chart Standard
For segment comparison radar charts:
- Always use 3 axes: Recency, Frequency, Monetary
- Normalize quartile scores to 0-4 scale (NOT 0-10)
- Compare 2-4 segments per chart for readability

## Forbidden Patterns

- Pie charts with more than 8 segments (use treemap instead)
- Bar charts without segment context
- Missing score scales on axes
- Generic titles without RFM context
- Raw JSON data output instead of rendered charts
- Combining R, F, M into a single composite number without showing individual scores
