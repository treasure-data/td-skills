---
name: grid-dashboard
description: "YAML format reference for grid dashboards rendered via preview_grid_dashboard. MUST be read before writing any dashboard YAML — defines the page structure, 6 cell types (kpi, gauge, scores, table, chart, markdown), grid layout rules, cell merging syntax, and incremental build workflow. Required by seo-analysis and any skill that produces visual data dashboards."
---

# Grid Dashboard

Build visual dashboards rendered in the artifact panel via `preview_grid_dashboard`. The agent writes a YAML file defining pages of grid cells; the MCP App renders them with a page selector.

(IMPORTANT): Include all analysis findings in the dashboard — do not omit relevant insights, metrics, or supporting facts. Build incrementally (see "Building YAML Incrementally" below).

## YAML Structure

The YAML is **page-based**: top-level `pages` object where each key is a page identifier (e.g., URL, label) and each value defines a grid with cells.

```yaml
pages:
  "Page A":
    title: "Page A Dashboard"        # optional — shown as header
    description: "Brief description"  # optional — shown below title
    grid:
      columns: 3                     # number of columns
      rows: 3                        # number of rows
    cells:
      - pos: "1-1"                   # row-column (1-based)
        type: kpi                    # cell type
        title: "Cell Title"          # optional — uppercase label above content
        kpi:                         # type-specific config
          value: "1,234"
          change: "+12%"
          trend: up

  "Page B":
    title: "Page B Dashboard"
    grid:
      columns: 4
      rows: 8
    cells:
      - pos: "1-1"
        type: kpi
        # ...
```

The UI renders a **select box** at the top to switch between pages.

## Building YAML Incrementally

**CRITICAL**: Large dashboards MUST be built incrementally. Do NOT attempt to write the entire YAML in a single tool call — this causes output truncation mid-generation.

**Multi-page dashboards** — build one page at a time:

1. **Write** the file with `pages:` header and the first page's complete grid + cells
2. **Edit** the file to append the next page
3. Repeat step 2 until all pages are written
4. Call `preview_grid_dashboard` **once** at the end

**Single pages with many cells (12+ rows)** — build in row batches:

1. **Write** the file with `pages:` header, grid config, and the first 4–6 rows of cells
2. **Edit** to append the next 4–6 rows at the end of the `cells` array
3. Repeat until all rows are written
4. Call `preview_grid_dashboard` once at the end

Each tool call should produce a manageable amount of YAML. Never write more than ~6 grid rows in a single tool call.

## Grid Layout

**This is NOT a CSS framework 12-column grid (like Bootstrap).** `columns` is the literal number of columns displayed. If you want 3 columns, set `columns: 3` — do NOT set `columns: 12` and merge cells to simulate 3 columns. The tool validates cell positions and will return errors for invalid formats.

- `grid.columns` and `grid.rows` must be **numbers** matching the actual cell count (not strings, not `auto`). Do not declare more rows/columns than cells occupy
- `pos: "row-col"` — 1-based coordinates (e.g., `"1-1"` = top-left)
- **Cell merging**: `pos: ["1-1", "1-3"]` merges from row 1 col 1 to row 1 col 3. **MUST be a YAML array** of two strings
- Each row has a fixed height range (120px–360px) — do not overfill cells
- **Horizontal merging is useful** — tables and charts benefit from full-width display (e.g., `pos: ["3-1", "3-4"]`)
- **Vertical merging is rarely needed** — each row is at least 120px tall, so spanning 3 rows creates 360px+ of height, which is excessive for most content. Only merge vertically for very long markdown or tables with many rows. In most cases, let each cell occupy a single row.

**Correct pos format**:
```yaml
pos: "1-1"              # single cell at row 1, column 1
pos: ["1-1", "1-3"]     # merged cell from (1,1) to (1,3)
pos: ["3-1", "5-4"]     # merged cell spanning rows 3-5 and columns 1-4
```

**WRONG — these will cause tool errors**:
```yaml
pos: "1-1:1-3"          # ✗ colon separator
pos: "1-1to1-3"         # ✗ "to" separator
pos: "1-1,1-3"          # ✗ comma in string
pos: [1, 1]             # ✗ numbers instead of "row-col" strings
```

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
    thresholds:              # optional — color breakpoints (use hex values, NOT color names)
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

Structured data with click-to-sort columns. Two formats accepted:

**Format 1 — Flat arrays** (compact):
```yaml
- pos: ["3-1", "3-4"]            # merged across columns 1-4
  type: table
  title: "Top Keywords"
  table:
    headers: ["Keyword", "Position", "Impressions", "CTR"]
    rows:
      - ["what is cdp", 11.2, 1840, "1.8%"]
      - ["cdp vs dmp", 8.5, 920, "3.2%"]
    sortable: true           # optional — defaults to true
```

**Format 2 — Column definitions** (readable, preferred for many columns):
```yaml
- pos: "3-1"
  type: table
  title: "Top Keywords"
  table:
    columns:
      - key: query
        label: "Keyword"
      - key: position
        label: "Position"
      - key: impressions
        label: "Impressions"
      - key: ctr
        label: "CTR"
    rows:
      - query: "what is cdp"
        position: 11.2
        impressions: 1840
        ctr: "1.8%"
      - query: "cdp vs dmp"
        position: 8.5
        impressions: 920
        ctr: "3.2%"
    sortable: true
```

### `chart` — Chart.js Chart

Pass standard Chart.js config (`type`, `data`, `options`). Any chart type supported.

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

GFM markdown content. Use `content` or `markdown` key — **must be a top-level string, NOT a nested object**.

```yaml
- pos: "4-1"
  type: markdown
  title: "Summary"
  content: |
    ### Key Finding
    **Impact**: High — content depth is 1/6 of competitors
```

**WRONG** — `markdown.content` nested object will cause a tool error:
```yaml
  markdown:
    content: |       # ✗ nested under markdown — must be a top-level key
      Some text
```

## Rendering

Write the YAML file and call:

```
preview_grid_dashboard({ file_path: "/absolute/path/to/dashboard.yaml" })
```

The dashboard renders in the artifact panel with light/dark theme support and a page selector dropdown.

## Fallback (No Artifact Panel)

When `preview_grid_dashboard` is not available (CLI mode), output the same information as formatted markdown instead.

## Layout Tips

- **KPIs in row 1**: Place 3–4 KPI cells across the top for at-a-glance metrics
- **Gauges + scores in row 2**: Pair a gauge with a scores breakdown
- **Full-width tables**: Merge across all columns with `pos: ["3-1", "3-4"]` for data tables
- **Mixed rows**: Split a row into halves (e.g., table on left, markdown on right)
- **Keep rows balanced**: Avoid putting a large table next to a small KPI in the same row
