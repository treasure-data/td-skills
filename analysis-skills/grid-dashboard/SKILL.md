---
name: grid-dashboard
description: "Reference skill for building visual dashboards with preview_grid_dashboard. Defines YAML format, 6 cell types (markdown, chart, table, kpi, gauge, scores), grid layout, and cell merging. Use this when any analysis skill needs to output a structured visual dashboard."
---

# Grid Dashboard

Build visual dashboards rendered in the artifact panel via `preview_grid_dashboard`. The agent writes a YAML file defining a grid of typed cells; the MCP App renders it.

## YAML Structure

```yaml
title: "Dashboard Title"           # optional — shown as header
description: "Brief description"   # optional — shown below title
grid:
  columns: 3                       # number of columns
  rows: 3                          # number of rows
cells:
  - pos: "1-1"                     # row-column (1-based)
    type: kpi                      # cell type
    title: "Cell Title"            # optional — uppercase label above content
    kpi:                           # type-specific config
      value: "1,234"
      change: "+12%"
      trend: up
```

## Grid Layout

- `grid.columns` and `grid.rows` must be **numbers** (not strings, not `auto`)
- `pos: "row-col"` — 1-based coordinates (e.g., `"1-1"` = top-left)
- **Cell merging**: `pos: ["1-1", "1-3"]` merges from row 1 col 1 to row 1 col 3
- Each row has a fixed height range (120px–360px) — do not overfill cells

**Common grid sizes**:
- 3×3 — compact overview (9 cells)
- 4×4 — standard dashboard (16 cells)
- 4×6 — detailed analysis with tables (24 cells)

## Cell Types

### `kpi` — Metric Card

Large number with optional trend indicator. Use for headline metrics in the top row.

```yaml
- pos: "1-1"
  type: kpi
  title: "Total Revenue"
  kpi:
    value: "$1.2M"          # string or number — displayed large
    change: "+15.3%"         # optional — shown below value
    trend: up                # optional — up | down | flat (colors the change)
    subtitle: "vs. last quarter"  # optional — small text below change
```

### `gauge` — Half-Circle Meter

Score visualization with color thresholds. Use for scores, completion rates, health indicators.

```yaml
- pos: "2-1"
  type: gauge
  title: "Health Score"
  gauge:
    value: 72                # current value
    max: 100                 # maximum value
    label: "B"               # optional — displayed in center (defaults to value)
    thresholds:              # optional — color breakpoints (defaults: 33=red, 66=yellow, 100=green)
      - { limit: 40, color: "#ef4444" }
      - { limit: 70, color: "#f59e0b" }
      - { limit: 100, color: "#22c55e" }
```

### `scores` — Progress Bar List

Labeled horizontal bars showing value/max ratios. Use for dimension breakdowns, skill assessments, category comparisons.

```yaml
- pos: "2-2"
  type: scores
  title: "Score Breakdown"
  scores:
    - label: "Content Structure"
      value: 14
      max: 26
    - label: "Structured Data"
      value: 8
      max: 26
    - label: "E-E-A-T Signals"
      value: 16
      max: 21
```

Bar colors: green (≥75%), yellow (40–74%), red (<40%).

### `table` — Sortable Table

Structured data with click-to-sort columns. Use for data tables, rankings, comparisons.

```yaml
- pos: "3-1"
  type: table
  title: "Top Keywords"
  table:
    headers: ["Keyword", "Position", "Impressions", "CTR"]
    rows:
      - ["what is cdp", 11.2, 1840, "1.8%"]
      - ["cdp vs dmp", 8.5, 920, "3.2%"]
    sortable: true           # optional — defaults to true
```

### `chart` — Chart.js Chart

Any Chart.js chart type (bar, line, pie, doughnut, radar, etc.). Use for trends, distributions, comparisons.

```yaml
- pos: "3-2"
  type: chart
  title: "Traffic Trend"
  chart:
    type: line
    data:
      labels: ["Jan", "Feb", "Mar", "Apr"]
      datasets:
        - label: "Impressions"
          data: [1200, 1900, 3000, 2500]
          borderColor: "#4a6cf7"
          fill: false
    options:                 # optional — Chart.js options
      scales:
        y:
          beginAtZero: true
```

### `markdown` — Rich Text

GFM markdown rendered with marked.js. Use for summaries, recommendations, checklists, any text content.

```yaml
- pos: "4-1"
  type: markdown
  title: "Recommendations"
  content: |
    ### 1. Add BLUF to H2 sections
    **Impact**: High | **Dimension**: Content Structure

    > **Before**: "There are many ways to think about..."
    > **After**: "A CDP works by collecting first-party data..."

    ### 2. Add FAQPage schema
    **Impact**: High | **Dimension**: Structured Data
```

Markdown tables (GFM pipe syntax) are also styled with the dashboard theme.

## Rendering

Write the YAML file and call:

```
preview_grid_dashboard({ file_path: "/absolute/path/to/dashboard.yaml" })
```

The dashboard renders in the artifact panel with light/dark theme support.

## Fallback (No Artifact Panel)

When `preview_grid_dashboard` is not available (CLI mode), output the same information as formatted markdown instead.

## Layout Tips

- **KPIs in row 1**: Place 3–4 KPI cells across the top for at-a-glance metrics
- **Gauges + scores in row 2**: Pair a gauge with a scores breakdown
- **Full-width tables**: Merge across all columns with `pos: ["3-1", "3-4"]` for data tables
- **Mixed rows**: Split a row into halves (e.g., table on left, markdown on right)
- **Keep rows balanced**: Avoid putting a large table next to a small KPI in the same row
