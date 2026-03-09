---
name: trino-optimizer
description: TD Trino query optimization - detects missing time filters, suggests approx functions, identifies inefficient JOINs, analyzes execution logs, provides engine-specific recommendations (Trino/Hive), and estimates performance improvements. Use when queries are slow, timing out, or need optimization.
---

# TD Trino Query Optimizer

Automatic query optimization for Treasure Data with execution log analysis and performance recommendations.

## When to Use

**Common scenarios:**
- "Optimize this query: [SQL]"
- "Why is my query timing out?"
- "Here's my query and execution log"
- Before executing analytical queries
- When CRITICAL performance issues are detected

---

## Query Log Analysis

### Key Metrics

**Execution Stats:**
```
Query Time: 300.5s → High (missing time filter likely)
Data Scanned: 125.4 GB for 100 rows → Inefficient
Partitions: 365 → Full year scan
Memory: 82% of 10GB → Near OOM
TableScan: 60% of time → Full table scan
```

---

## Critical Optimizations

### 1. Time Filters (CRITICAL)

```sql
-- ❌ Missing time filter
select customer_id, count(*) from sales_db.orders group by customer_id

-- ✅ With time filter (100-1000x faster)
select customer_id, count(*) from sales_db.orders
where td_interval(time, '-30d', 'JST')
group by customer_id
```

### 2. Approximate Functions

```sql
-- ❌ Exact (slow)
count(distinct customer_id)

-- ✅ Approx (10-50x faster, ~2% error)
approx_distinct(customer_id)
approx_percentile(amount, 0.95)
```

### 3. No Functions in WHERE

```sql
-- ❌ Prevents partition pruning
where td_time_string(time, 'd!', 'JST') = '2024-12-15'

-- ✅ Uses partition pruning (100x faster)
where td_time_range(time, '2024-12-15', '2024-12-16', 'JST')
```

### 4. Specific Columns

```sql
-- ❌ SELECT * (wasteful)
select * from large_table where td_interval(time, '-30d', 'JST')

-- ✅ Specific columns
select order_id, customer_id, amount from large_table where td_interval(time, '-30d', 'JST')
```

### 5. Filter Before JOIN

```sql
-- ❌ Filter after JOIN
select * from large_table l join small_table s on l.id = s.id
where td_interval(l.time, '-1d', 'JST')

-- ✅ Filter before JOIN (10-100x faster)
select * from (
  select * from large_table where td_interval(time, '-1d', 'JST')
) l join small_table s on l.id = s.id
```

### 6. Convert Correlated Subqueries

```sql
-- ❌ Correlated subquery (runs per row)
select order_id, (select count(*) from order_items where order_id = o.order_id)
from orders o where td_interval(time, '-30d', 'JST')

-- ✅ JOIN (100-1000x faster)
select o.order_id, count(oi.item_id) as item_count
from orders o left join order_items oi on o.order_id = oi.order_id
where td_interval(o.time, '-30d', 'JST') group by o.order_id
```

### 7. REGEXP_LIKE for Multiple Patterns

```sql
-- ❌ Multiple LIKE
where column like '%android%' or column like '%ios%'

-- ✅ Single REGEXP
where regexp_like(column, 'android|ios|mobile')
```

### 8. UNION ALL Over UNION

```sql
-- ❌ UNION (deduplicates)
select customer_id from orders_2023 union select customer_id from orders_2024

-- ✅ UNION ALL (2-5x faster if duplicates ok)
select customer_id from orders_2023 union all select customer_id from orders_2024
```

---

## Advanced Optimizations

### CTAS (5x Faster Output)

```sql
create table results as
select td_time_string(time, 'd!', 'JST') as date, count(*) as events
from events where td_interval(time, '-1M', 'JST') group by 1
```

### User-Defined Partitioning (UDP)

Fast ID lookups on tables >100M rows:
```sql
create table customer_events with (
  bucketed_on = array['customer_id'], bucket_count = 512
) as select * from raw_events where td_interval(time, '-30d', 'JST')
```

### Magic Comments for JOIN Distribution

Control how Trino distributes JOINs:
```sql
-- Force broadcast join (small table to all nodes)
select /*+ BROADCAST(s) */ l.*, s.*
from large_table l join small_table s on l.id = s.id
where td_interval(l.time, '-1d', 'JST')

-- Force partitioned join (repartition both tables)
select /*+ PARTITIONED(o, c) */ o.*, c.*
from orders o join customers c on o.customer_id = c.customer_id
where td_interval(o.time, '-7d', 'JST')
```

### Colocated Joins

For UDP tables bucketed on same key with same bucket count:
```sql
-- Both tables bucketed on customer_id with bucket_count=512
-- Trino performs local join without shuffling (10-100x faster)
select e.*, a.*
from customer_events e join customer_attributes a
  on e.customer_id = a.customer_id
where td_interval(e.time, '-1d', 'JST')
```

## Engine Migration

### Hive → Trino

**When:** Query >60s on Hive, window functions, complex JOINs, timeouts

```yaml
# Change in .dig file
td>: queries/my_query.sql
engine: presto  # Changed from "hive"
```

### Trino → Hive

**When:** Memory errors (>10GB), very large datasets (>500GB), high-cardinality GROUP BY

**Syntax changes:**

| Trino | Hive |
|-------|------|
| `td_time_string(time, 'd!', 'JST')` | `TD_TIME_FORMAT(time, 'yyyy-MM-dd', 'JST')` |
| `REGEXP_LIKE(col, pattern)` | `col RLIKE pattern` |
| `ARRAY_AGG(col)` | `COLLECT_LIST(col)` |
| `approx_distinct(col)` | `COUNT(DISTINCT col)` |

## Common Errors

| Error | Fix |
|-------|-----|
| Query exceeded memory limit | Add time filter, use approx functions, try Hive |
| PAGE_TRANSPORT_TIMEOUT | Reduce columns, use CTAS |
| Query timeout | Add time filter, reduce range |
| Too many partitions | Narrow time range |

---

## Optimization Checklist

- [ ] Time filter (`td_interval` or `td_time_range`)
- [ ] Specific columns (no `SELECT *`)
- [ ] Approximate functions for large data
- [ ] No `td_time_string` in WHERE
- [ ] JOINs filter before joining
- [ ] No correlated subqueries
- [ ] UNION ALL if duplicates ok
- [ ] ORDER BY with LIMIT

---

## Workflow

1. **Analyze:** Check for time filter, correlated subqueries, exact functions, SELECT *, inefficient JOINs
2. **Prioritize:** Critical (time filter, subqueries) > High (approx functions, JOINs) > Medium (SELECT *)
3. **Optimize:** Apply fixes with comments
4. **Estimate:** Speedup, data scanned, execution time

---

## Example

**Before:**
```sql
select product_id, sum(quantity) as total_sold
from sales_db.orders
group by product_id order by total_sold desc limit 10
```

**Issues:** No time filter (scans all data, 100-1000x slower)

**After:**
```sql
select product_id, sum(quantity) as total_sold
from sales_db.orders
where td_interval(time, '-30d', 'JST')  -- ✅ Added
group by product_id order by total_sold desc limit 10
```

**Impact:** 100x faster, 99% less data scanned

