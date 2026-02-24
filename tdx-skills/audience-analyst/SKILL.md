---
name: audience-analyst
description: Marketing analysis orchestrator for CDP audience data. Guides a 5-stage workflow — schema discovery, data quality assessment (null ratio thresholds), incremental Trino SQL analysis, chart visualization with render_chart, and actionable recommendations. Use when users want to explore customer attributes, analyze behavioral trends, or visualize audience insights before deciding on next steps.
---

# Audience Analyst

## Workflow Overview

Discovery → Planning → Execution & Analysis → Visualization → Segment Creation

## Stage 1: Discovery

```bash
# Get parent segment schema
tdx ps desc "Parent Segment Name" -o schema.json

# List existing segments and available fields
tdx sg list -r
tdx sg fields
```

**Data quality check** — run for every column you plan to use:

```sql
SELECT
  'column_name' AS col,
  COUNT(*) AS total,
  COUNT(column_name) AS non_null,
  ROUND(1.0 - CAST(COUNT(column_name) AS DOUBLE) / COUNT(*), 3) AS null_ratio
FROM cdp_audience_{id}.customers
```

| null_ratio | Action |
|---|---|
| > 0.7 | Do not use. Suggest alternatives. |
| 0.5–0.7 | Warn user, get confirmation. |
| < 0.5 | OK — mention limitation. |

## Stage 2: Execution & Analysis

```bash
tdx query "SELECT ... FROM cdp_audience_{id}.customers ..."
```

**Segment size counting** — ALWAYS join customers table:

```sql
-- CORRECT
SELECT COUNT(DISTINCT c.cdp_customer_id)
FROM cdp_audience_{id}.customers c
JOIN cdp_audience_{id}.behavior_purchases b ON c.cdp_customer_id = b.cdp_customer_id
WHERE b.amount > 100

-- WRONG: never count from behavior tables alone
SELECT COUNT(DISTINCT cdp_customer_id) FROM cdp_audience_{id}.behavior_purchases WHERE amount > 100
```

**Existing segment analysis:**

```bash
tdx sg sql "Segment Name" | tdx query -
```

**Array columns** — use CROSS JOIN UNNEST:

```sql
SELECT tag, COUNT(0) AS cnt
FROM cdp_audience_{id}.customers
CROSS JOIN UNNEST(tags) AS t(tag)
GROUP BY 1 ORDER BY 2 DESC LIMIT 10
-- alias must differ from column name; never use ARRAY_CONTAINS
```

**Defaults:** last 3 months time range, exclude NULLs from aggregations, state timezone.

## Stage 3: Visualization

Use `render_chart` to visualize results:

| Data Pattern | Chart Type |
|---|---|
| Category comparison | `bar` or `horizontal-bar` |
| Trend over time | `line` or `area` |
| Proportions (≤ 8 categories) | `pie` |
| Correlation | `scatter` |
| Part-to-whole breakdown | `stacked-bar` or `treemap` |
| Multi-dimensional comparison | `radar` |
| Flow / conversion | `sankey` or `funnel` |

## Stage 4: Segment Creation

1. Query and confirm segment size (join customers table)
2. Get user confirmation on definition
3. Generate YAML — use **segment** skill for syntax reference
4. Validate and push:

```bash
tdx sg use "Parent Segment Name"
tdx sg validate path/to/segment.yml
tdx sg push --dry-run
tdx sg push
```

## Related Skills

- **parent-segment-analysis** — Schema discovery and data querying
- **segment** — YAML syntax, operators, activations
- **validate-segment** — YAML validation rules
- **trino** — Trino SQL functions and patterns
- **time-filtering** — td_interval and partition pruning
