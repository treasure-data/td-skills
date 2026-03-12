---
name: smart-sampler
description: Intelligent data sampling - representative sampling, time-based (recent, random periods), stratified by dimensions, edge case sampling (nulls, extremes, duplicates). Use for quick data exploration without full table scans.
---

# Smart Sampler

Intelligent sampling strategies for fast data exploration.

## Sampling Strategies

### 1. Random Sample

```sql
select * from sales_db.orders
where td_interval(time, '-7d', 'JST') and rand() < 0.01
limit 100
```

### 2. Time-Based

```sql
-- Recent data
select * from sales_db.orders
where td_interval(time, '-1d', 'JST')
order by time desc limit 100

-- Specific period
select * from sales_db.orders
where td_time_string(time, 'd!', 'JST') = '2024-12-05' limit 100
```

### 3. Stratified (Balanced)

```sql
-- Sample N per category
with ranked as (
  select *, row_number() over (partition by status order by rand()) as rn
  from sales_db.orders where td_interval(time, '-30d', 'JST')
)
select * from ranked where rn <= 20
```

### 4. Edge Cases

```sql
-- Nulls
select * from customers where td_interval(time, '-30d', 'JST') and email is null limit 100

-- Outliers (top 1%)
with p as (select approx_percentile(amount, 0.99) as p99 from orders where td_interval(time, '-30d', 'JST'))
select o.* from orders o, p where td_interval(o.time, '-30d', 'JST') and o.amount >= p.p99 limit 100

-- Duplicates
select * from (
  select *, count(*) over (partition by email) as cnt from customers
) where cnt > 1 limit 100
```

## Sample Workflows

### Quick Preview

```sql
select order_id, customer_id, amount, currency, status,
  td_time_string(time, 's!', 'JST') as order_time
from sales_db.orders where td_interval(time, '-1d', 'JST')
order by time desc limit 100
```

### High-Value Transactions

```sql
-- Fixed threshold
select * from sales_db.orders
where td_interval(time, '-1M', 'JST') and amount > 500
order by rand() limit 50

-- Percentile-based
with p as (select approx_percentile(amount, 0.90) over () as p90 from sales_db.orders where td_interval(time, '-1M', 'JST'))
select o.* from sales_db.orders o, p where td_interval(o.time, '-1M', 'JST') and o.amount >= p.p90 order by rand() limit 50
```

### Data Quality Issues

```sql
select 'Missing Currency' as issue, * from orders where td_interval(time, '-30d', 'JST') and currency is null limit 20
union all
select 'Negative Amount', * from orders where td_interval(time, '-30d', 'JST') and amount < 0 limit 20
```

---

## Best Practices

1. Always use time filters - avoid full scans
2. Use ORDER BY rand() for randomness
3. Show sample metadata (size, time range)
4. Balance speed vs. accuracy

---

## Output Format

```markdown
| order_id | customer_id | amount | status |
|----------|-------------|--------|--------|
| 150234 | 8901 | 129.99 | completed |

**Sample:** 100 of 10,892 records (0.9%), Last 24 hours
```

---

## Common Queries

```sql
-- Recent N
select * from table where td_interval(time, '-1d', 'JST') order by time desc limit 100

-- Random %
select * from table where td_interval(time, '-7d', 'JST') and rand() < 0.05

-- Top N
select * from table where td_interval(time, '-30d', 'JST') order by amount desc limit 100

-- Balanced
with ranked as (
  select *, row_number() over (partition by category order by rand()) as rn
  from table where td_interval(time, '-30d', 'JST')
) select * from ranked where rn <= 50
```

