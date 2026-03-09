---
name: analytical-query
description: Converts natural language to TD-optimized Trino SQL with auto schema discovery, optimization, execution, and Plotly visualization. Triggers on analytical keywords (summarize, aggregate, top N, trends, metrics) and sampling keywords (show records, sample, preview).
---

# SQL Analytical Query

Natural language → Trino SQL → Execution → Visualization

## Workflow

1. **Parse** - Extract table, fields, time range
2. **Optimize** - Apply trino-optimizer best practices
3. **Execute** - Run via `tdx query --json`
4. **Visualize** - Table + 2-3 Plotly charts

**For sampling:** Apply smart-sampler strategies

## Requirements

Always include:
- Time filters (`td_interval` or `td_time_range`)
- Trino-optimizer best practices before execution
- `approx_distinct()` for large datasets
- TD color palette for visualizations

---



## Examples

**Auto schema discovery:**
- "Top 10 products by revenue last month" → Finds sales/product tables
- "Daily user signups" → Finds user/signup tables

**Direct analysis:**
- "Top 10 from sales_db.orders by revenue, last 30 days"

## Smart Workflow

1. Parse question → Extract intent, tables, fields, time
2. If no table → Use schema-explorer to find tables
3. Generate SQL → TD-optimized with time filters
4. Optimize → Apply trino-optimizer best practices
5. Execute → `tdx query --json`
6. Visualize → Table + Plotly charts

## Query Patterns

**Time filter (ALWAYS required):**
```sql
where td_interval(time, '-30d', 'JST')
```

**Aggregation:**
```sql
select td_time_string(time, 'd!', 'JST') as date, count(*), approx_distinct(user_id)
from events where td_interval(time, '-7d', 'JST') group by 1 order by date
```

**Top N:**
```sql
select category, sum(revenue) as total from sales
where td_interval(time, '-1M', 'JST') group by category order by total desc limit 10
```

**Comparison:**
```sql
select channel, count(*) as events, approx_distinct(user_id) as users
from campaigns where td_interval(time, '-1d', 'JST') group by channel
```

## Execution

```bash
tdx query --json "SELECT ..."
```

## Visualization

Generate Plotly visualizations as needed:
- Distribution → Pie chart
- Trend → Line chart
- Top N → Bar chart
- Comparison → Grouped bar chart

Use TD color palette: `#44BAB8`, `#8FD6D4`, `#DAF1F1`, `#2E41A6`, `#828DCA`, `#8CC97E`, `#EEB53A`

## Example Workflow

**User:** "Top 10 products by revenue last month"

1. Parse → "top 10", "products", "revenue", "last month"
2. Schema-explorer → Finds sales_db.orders, sales_db.products
3. Generate SQL:
```sql
select p.product_name, sum(o.revenue) as total_revenue
from sales_db.orders o join sales_db.products p on o.product_id = p.product_id
where td_interval(o.time, '-1M', 'JST')
group by p.product_name order by total_revenue desc limit 10
```
4. Trino-optimizer → Review and optimize
5. Execute → `tdx query --json`
6. Visualize → Table + bar chart

---

## Best Practices

1. Always include time filters (`td_interval`)
2. Use `approx_distinct()` for large data
3. JST timezone for Japan data
4. `td_time_string()` in SELECT only, not WHERE
5. Use TD color palette

## Validation

- [ ] Time filter present
- [ ] Lowercase keywords
- [ ] No `td_time_string()` in WHERE
- [ ] LIMIT for large results

