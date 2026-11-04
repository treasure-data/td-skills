# Visualization Instructions — Classification Model

## Available Tools

### render_chart
For standard chart types. Parameters:
- `type` — bar, line, pie, area, scatter, horizontal-bar, stacked-bar, radar, funnel
- `title` — chart title
- `labels` — X-axis labels (bar/line/area), segments (pie/funnel)
- `datasets` — array of `{label, data}` objects for each series
- `x_axis_title`, `y_axis_title` — axis labels

### render_react
For complex interactive dashboards using Recharts + Tailwind CSS inside the Treasure Work chat (not for shareable/exportable files):
- Write a single component: `export default function ComponentName({ data })`
- React hooks (useState, useEffect, useMemo) and all Recharts components are available as globals — do NOT import them
- Use Tailwind CSS for styling with `dark:` variants for dark mode
- `isDark` boolean and `theme` string are available in scope
- Use for: multi-chart dashboards, waterfall charts, heatmaps, complex layouts

### Templated HTML dashboard (`dashboard_template.html`)
Use this when the user asks for a **shareable, exportable, standalone HTML dashboard** (an artifact they can email, host, or open offline). Don't reach for `render_react` for this — that's chat-only.

- Template lives at `references/dashboard_template.html`
- Header comment in the template documents every `{{TOKEN}}` + the eight SQL queries that feed each section
- Run `references/generate-data.js` from the user's working directory; it executes all eight queries concurrently, resolves the optional profile identifier from the output schema, substitutes tokens, validates the HTML, and writes to `agent_outputs/<customer_slug>/classifier/dashboards/classifier_summary_dashboard.html` (git-ignored)
- Open the generated file with `mcp__work__open_file`
- See SKILL.md "Generate an HTML model-summary dashboard" pattern for the full procedure
- Keep TD palette, layout CSS, and chart shapes intact — only the data behind the tokens changes

## TD Color Palette

Primary (use in order for chart series):
```
["#B4E3E3", "#ABB3DB", "#D9BFDF", "#F8E1B0", "#8FD6D4", "#828DCA", "#C69ED0", "#F5D389", "#6AC8C6", "#5867B8", "#B37EC0", "#F1C461", "#44BAB8", "#2E41A6", "#8CC97E", "#A05EB0"]
```

Semantic colors for classification:
```
TP (True Positive):  "#44BAB8" (teal)
TN (True Negative):  "#B4E3E3" (light teal)
FP (False Positive): "#F1C461" (amber)
FN (False Negative): "#A05EB0" (purple)
Positive SHAP:       "#44BAB8" (teal — pushes score UP)
Negative SHAP:       "#A05EB0" (purple — pushes score DOWN)
Threshold line:      "#2E41A6" (dark blue)
```

## Chart Standards

- Legends must be visible for multi-series charts
- Always create **separate individual charts** — never combine into subplots
- Metric values displayed with 4 decimal places (e.g., 0.8471)
- Percentages displayed with 1 decimal place (e.g., 72.3%)
- Scores displayed with 2 decimal places (e.g., 0.75)
- Bold all metrics in text output
- Clear axis labels with business context
- Create 3-7 charts per analysis response

## Chart Type Selection for Classification

| Analysis Type | Tool & Type |
|---|---|
| Train vs test metrics comparison | `render_chart` type: "bar" (grouped bar) |
| Feature importance (top 20) | `render_chart` type: "horizontal-bar" |
| SHAP directional (positive/negative) | `render_react` diverging bar chart |
| Score distribution histogram | `render_chart` type: "bar" |
| ROC curve | `render_chart` type: "line" |
| Precision-Recall curve | `render_chart` type: "line" |
| Confusion matrix | `render_react` heatmap |
| Score distribution overlay (train vs pred) | `render_chart` type: "bar" (stacked or grouped) |
| PSI over time | `render_chart` type: "line" |
| Feature correlation heatmap | `render_react` heatmap |
| Individual SHAP waterfall | `render_react` waterfall chart |
| Optuna trial scatter | `render_chart` type: "scatter" |
| Metric trends across runs | `render_chart` type: "line" |
| Outcome class distribution | `render_chart` type: "pie" |
| Score bucket counts | `render_chart` type: "bar" |

## Visualization Templates

### Feature Importance (Horizontal Bar)
```
render_chart:
  type: horizontal-bar
  title: "Top 20 Features by SHAP Importance"
  labels: [feature names ordered by importance]
  datasets: [{label: "Mean |SHAP|", data: [values]}]
  x_axis_title: "Mean Absolute SHAP Value"
  y_axis_title: "Feature"
```

### Train vs Test Metrics (Grouped Bar)
```
render_chart:
  type: bar
  title: "Train vs Test Performance Metrics"
  labels: ["AUC-ROC", "Precision", "Recall", "F-beta", "F1"]
  datasets:
    - {label: "Train", data: [values]}
    - {label: "Test", data: [values]}
  y_axis_title: "Score"
```

### Score Distribution (Histogram)
```
render_chart:
  type: bar
  title: "Prediction Score Distribution"
  labels: ["0.0-0.1", "0.1-0.2", ..., "0.9-1.0"]
  datasets: [{label: "Records", data: [counts]}]
  x_axis_title: "Score Range"
  y_axis_title: "Count"
```

### SHAP Waterfall (Individual Record — render_react)
Show base value → feature contributions → final prediction score.
Use teal (#44BAB8) for positive SHAP contributions and purple (#A05EB0) for negative.
Display feature name, feature value, and SHAP value for each bar.
