---
name: query-explainer
description: Converts SQL to natural language explanations with step-by-step breakdowns. Use to understand queries, debug issues, or document logic.
---

# Query Explainer

Transform SQL queries into clear explanations.

## Workflow

1. Explain query (what it does, step-by-step)
2. Detect performance issues
3. If CRITICAL issues found → Apply trino-optimizer recommendations
4. Return: Explanation + Issues + Optimized Query

**Job ID Analysis:**
```bash
tdx job show <job_id> -o json
```
Extract: SQL, engine, time, data scanned, errors → Explain + optimize

## Engine Migration

### Hive → Trino
**When:** Query >60s, window functions, complex JOINs, timeouts

**Migration:** Change `type: hive` to `type: presto`

### Trino → Hive
**When:** Memory errors (>10GB), large datasets (>500GB), high-cardinality GROUP BY

**Syntax changes:**
- `td_time_string()` → `TD_TIME_FORMAT()`
- `REGEXP_LIKE()` → `RLIKE`
- `ARRAY_AGG()` → `COLLECT_LIST()`

---

## Job Status

**Success (but slow):** Optimize for speed
**Failed (memory):** Use approx functions or switch to Hive
**Killed (timeout):** Add time filter or switch engine

## Explanation Format

**Summary:** One sentence describing what query does

**Step-by-Step:**
1. Data source and filtering
2. Grouping and aggregation
3. Sorting and limiting

**Data Flow:** table → filter → group → aggregate → sort → limit

**Performance:** Check for time filter, approx functions, efficient JOINs

---

## Performance Issue Detection

**Auto-check for:**
1. Missing time filter
2. Exact distinct on large data
3. Functions in WHERE (`td_time_string`)
4. SELECT *
5. Correlated subqueries
6. LIMIT without ORDER BY
7. UNION without ALL

**If CRITICAL/HIGH issues found → Apply trino-optimizer recommendations**

## Example Explanation

**Query:**
```sql
select customer_id, sum(amount) as total_spent
from sales_db.orders
where td_interval(time, '-30d', 'JST')
group by customer_id order by total_spent desc limit 10
```

**Explanation:**

**Summary:** Top 10 customers by spending in last 30 days

**Breakdown:**
1. Filter: Last 30 days (JST)
2. Group by customer_id
3. Sum amount per customer
4. Sort descending, limit 10

**Performance:** Well-optimized (has time filter, aggregates efficiently)

---

## CTE Handling

**Explain CTEs step-by-step:**
1. Explain each CTE independently (what data it produces)
2. Show how CTEs connect (which CTE uses which)
3. Explain final SELECT using CTE results

**Example:**
```sql
with monthly_sales as (
  select td_time_string(time, 'M!', 'JST') as month, sum(amount) as revenue
  from orders where td_interval(time, '-6M', 'JST')
  group by 1
)
select month, revenue, revenue - lag(revenue) over (order by month) as change
from monthly_sales
```

**Explanation:**
1. **CTE monthly_sales**: Aggregates order revenue by month over last 6 months
2. **Final SELECT**: Calculates month-over-month revenue change using LAG window function
3. **Data flow**: orders → monthly aggregation → change calculation

---

## Common Patterns

**JOIN optimization:**
```sql
-- Use INNER JOIN if HAVING filters nulls anyway
select c.customer_id, count(o.order_id) as orders
from customers c inner join orders o on c.customer_id = o.customer_id
where td_interval(o.time, '-90d', 'JST')
group by c.customer_id order by orders desc
```

**Avoid repeated subqueries - use CTE:**
```sql
with avg_calc as (select avg(amount) as avg from orders where td_interval(time, '-30d', 'JST'))
select o.*, a.avg from orders o cross join avg_calc a where o.amount > a.avg
```

## TD Patterns

**Time filtering:**
```sql
where td_interval(time, '-1d', 'JST')  -- Partition pruning, ALWAYS use
```

**Time formatting (SELECT only, NOT WHERE):**
```sql
select td_time_string(time, 'd!', 'JST') as date  -- Good
where td_time_string(...) = '2024-12-15'  -- Bad (no partition pruning)
```

**Approximate functions (10-50x faster, ~2% error):**
```sql
approx_distinct(customer_id)
approx_percentile(amount, 0.95)
```

