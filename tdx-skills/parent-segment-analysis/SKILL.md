---
name: parent-segment-analysis
description: Query and analyze CDP parent segment database data. Use `tdx ps desc -o` to get output database schema, then query customers and behavior tables. Use when exploring parent segment data, building reports, or analyzing customer attributes and behaviors.
---

# tdx Parent-Segment-Analysis - CDP Parent Segment Data Analysis

## Workflow

1. Get output database schema
2. **Read ALL columns** from the schema file to understand available data
3. Identify relevant columns for the analysis (use sub-agent if schema is large)
4. Query customers or behavior tables

## Get Output Database Schema

Parent segments generate an output database (`cdp_audience_{id}`) with:
- `customers` table - master + all attributes joined
- `behavior_{name}` tables - one per behavior

```bash
# Save schema to file (recommended for large schema data)
tdx ps desc "Customer 360" -o customer_360_schema.json

# Output summary:
# Schema saved to customer_360_schema.json
#   Database: cdp_audience_12345
#   Tables: 1 customers + 5 behaviors
#   Columns: 42 total
```

## Schema JSON Structure

One column per line for grep and progressive disclosure:

```json
{
  "database": "cdp_audience_12345",
  "parent_segment": "Customer 360",
  "parent_id": "12345",
  "customers": {
    "table": "customers",
    "columns": [
      { "name": "cdp_customer_id", "type": "varchar" },
      { "name": "email", "type": "varchar" }
    ]
  },
  "behaviors": [
    {
      "table": "behavior_purchases",
      "columns": [
        { "name": "cdp_customer_id", "type": "varchar" },
        { "name": "amount", "type": "double" }
      ]
    }
  ]
}
```

## Discovering Relevant Columns

**IMPORTANT:** Always read the full schema file first to understand what data is available. After reviewing the schema, you can use grep/search to find specific columns.

- For small schemas (<50 columns): Read the file directly
- For large schemas (50+ columns): Summarize the schema in multiple passes to discover relevant columns for your analysis goal

## Analysis Guidelines

- Check null ratios for identified customer columns and exclude null values from aggregations to ensure accurate analysis.
- Build queries incrementally rather than attempting everything at once.
- Provide an extremely brief summary of key findings in one sentence.
- Always be very explicit and detailed about the data sources you are using, including table names, column names.

## Array Columns

- **For SQL queries needing array analysis/aggregation**: Use CROSS JOIN UNNEST.
  ```sql
  SELECT
    tag,
    count(0) AS cnt
  FROM customers
  CROSS JOIN UNNEST(tags) AS t(tag)
  GROUP BY 1 ORDER BY 2 DESC LIMIT 10
  ```
- Don't use the same name for alias as column name (e.g., use `tag` not `tags` for the alias)
- Never use `ARRAY_CONTAINS` — use `contains(array_column, value)` or filter via CROSS JOIN UNNEST

## Time Function Usage

Always first check the format of the time column before applying time functions.

Time functions:
- `td_interval(time, '-1d')` — filter records within a time interval
- `td_time_parse('2024-01-01', 'UTC')` — parse a time string into Unix timestamp (seconds)

## Related Skills

- **parent-segment** - Manage parent segment configuration
- **segment** - Create child segments from parent segment data
- **trino** - Trino SQL syntax and TD-specific functions
