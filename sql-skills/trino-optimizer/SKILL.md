---
name: trino-optimizer
description: Comprehensive TD Trino query optimization - detects missing time filters, suggests approx functions, identifies inefficient JOINs, analyzes execution logs, provides engine-specific recommendations (Trino/Hive), and estimates performance improvements. Use when queries are slow, timing out, or need optimization.
---

# TD Trino Query Optimizer

Automatic query optimization for Treasure Data with TD-specific performance recommendations and execution log analysis.

## 🔴 MANDATORY ENFORCEMENT - REQUIRED FOR ANALYTICAL-QUERY

**This skill MUST be automatically invoked by the analytical-query skill BEFORE executing any generated query.**

### Critical Requirement

- ✅ **NEVER execute an analytical query without optimization first**
- ✅ **analytical-query MUST call trino-optimizer BEFORE tdx query execution**
- ✅ **This is non-negotiable for all users, all environments**

### Why It's Mandatory

Queries without optimization can:
- ❌ Cause memory errors (OOM)
- ❌ Timeout (exceed max query duration)
- ❌ Scan unnecessary data (unnecessary cost)
- ❌ Use inefficient JOIN patterns (poor performance)
- ❌ Miss time filters (full table scans)

**Optimization BEFORE execution prevents these issues.**

---

## 🔴 When to Use This Skill

**DIRECT INVOCATION:**
- User explicitly asks to "optimize this query"
- User provides query + execution log or job ID
- User mentions timeout, memory error, or slow performance
- User asks to "make it faster" or "reduce cost"
- Query has performance problems

**AUTOMATIC INVOCATION (by other skills):**
- `query-explainer` detects CRITICAL issues
- `analytical-query` generates queries (auto-optimize)
- User provides Job ID or job link

**Example prompts:**
- "Optimize this query: [SQL]"
- "Why is my query timing out?"
- "How can I make this query faster?"
- "Here's my query and the execution log - what's wrong?"
- "This query took 5 minutes and scanned 100GB - optimize it"

---

## Query Log Analysis

When users provide query execution logs or performance statistics, analyze them to identify specific bottlenecks.

### What to Look for in Query Logs

**1. Execution Time Metrics:**
```
Query Time: 300.5s
Planning Time: 0.2s
Execution Time: 300.3s
CPU Time: 245.1s
```

**Analysis:**
- High execution time (300s) indicates performance issue
- Low planning time (0.2s) - query structure is fine
- High CPU time (245s) - compute-intensive operations
- **Likely issues:** Missing time filter, inefficient aggregations

**2. Data Scan Metrics:**
```
Data Scanned: 125.4 GB
Rows Scanned: 1,250,000,000
Rows Returned: 100
Partitions Scanned: 365
```

**Analysis:**
- Scanned 125GB for 100 rows - extremely inefficient
- 365 partitions = ~1 year of data scanned
- **Primary issue:** Missing or ineffective time filter

**3. Memory Usage:**
```
Peak Memory: 8.2 GB
Allocated Memory: 10 GB
Memory Limit: 10 GB
Memory Usage: 82%
```

**Analysis:**
- Using 82% of memory limit - close to OOM
- **Likely issues:** Large JOINs, high-cardinality GROUP BY

**4. Operator Statistics:**
```
TableScan: 180.2s (60% of total)
Aggregate: 95.3s (32% of total)
Join: 15.8s (5% of total)
Sort: 9.2s (3% of total)
```

**Analysis:**
- TableScan dominates (60%) - full table scan
- Aggregate is slow (32%) - likely exact distinct
- **Primary fix:** Add time filter to reduce TableScan

---

## Optimization Checks

### 1. Time Filter Detection (CRITICAL)

**❌ Bad:**
```sql
select customer_id, count(*) as order_count
from sales_db.orders
group by customer_id
```

**Issue:** Full table scan - scans ALL historical data

**✅ Fixed:**
```sql
select customer_id, count(*) as order_count
from sales_db.orders
where td_interval(time, '-30d', 'JST')  -- ✅ Added time filter
group by customer_id
```

**Impact:** 100-1000x faster

---

### 2. Approximate vs. Exact Functions

**❌ Slow:**
```sql
select count(distinct customer_id) as unique_customers
from sales_db.orders
where td_interval(time, '-1y', 'JST')
```

**✅ Fast:**
```sql
select approx_distinct(customer_id) as unique_customers
from sales_db.orders
where td_interval(time, '-1y', 'JST')
```

**Impact:** 10-50x faster, ~2% error (acceptable for large counts)

**Other approximate functions:**
- `approx_percentile()` instead of exact percentile
- `approx_distinct()` instead of count(distinct)
- `approx_set()` for set operations

---

### 3. Time Formatting in WHERE Clause

**❌ Bad:**
```sql
select *
from sales_db.orders
where td_time_string(time, 'd!', 'JST') = '2024-12-15'
```

**Issue:** Cannot use partition pruning

**✅ Fixed:**
```sql
select *
from sales_db.orders
where td_time_range(time, '2024-12-15', '2024-12-16', 'JST')
```

**Impact:** 100x faster (uses partition pruning)

---

### 4. SELECT * Anti-Pattern

**❌ Wasteful:**
```sql
select *
from large_table
where td_interval(time, '-30d', 'JST')
```

**✅ Efficient:**
```sql
select order_id, customer_id, amount, status
from large_table
where td_interval(time, '-30d', 'JST')
```

**Impact:** Faster and cheaper

---

### 5. Inefficient JOINs

**❌ Slow:**
```sql
select *
from large_table l
join small_table s on l.id = s.id
where td_interval(l.time, '-1d', 'JST')  -- Filter AFTER join
```

**✅ Fast:**
```sql
select *
from (
  select * from large_table
  where td_interval(time, '-1d', 'JST')  -- Filter BEFORE join
) l
join small_table s on l.id = s.id
```

**Impact:** 10-100x faster

---

### 6. Subquery Optimization

**❌ Very Slow:**
```sql
select
  order_id,
  (select count(*) from order_items where order_id = o.order_id) as item_count
from orders o
where td_interval(time, '-30d', 'JST')
```

**Issue:** Subquery runs for EACH row

**✅ Fast:**
```sql
select
  o.order_id,
  count(oi.item_id) as item_count
from orders o
left join order_items oi on o.order_id = oi.order_id
where td_interval(o.time, '-30d', 'JST')
group by o.order_id
```

**Impact:** 100-1000x faster

---

### 7. REGEXP_LIKE vs Multiple LIKE

**❌ Inefficient:**
```sql
where column like '%android%'
   or column like '%ios%'
   or column like '%mobile%'
```

**✅ Efficient:**
```sql
where regexp_like(column, 'android|ios|mobile')
```

---

### 8. UNION vs UNION ALL

**❌ Slower:**
```sql
select customer_id from orders_2023
union
select customer_id from orders_2024
```

**Issue:** Deduplicates results (extra processing)

**✅ Faster:**
```sql
select customer_id from orders_2023
union all
select customer_id from orders_2024
```

**Impact:** 2-5x faster (if duplicates acceptable)

---

## Advanced Trino Optimizations

### Output Optimization - CTAS

**CTAS is 5x faster than SELECT** (skips JSON serialization):

```sql
create table results as
select td_time_string(time, 'd!', 'JST') as date, count(*) as events
from events
where td_interval(time, '-1M', 'JST')
group by 1
```

---

### User-Defined Partitioning (UDP)

Hash partition for fast ID lookups on large tables (>100M rows):

```sql
create table customer_events with (
  bucketed_on = array['customer_id'],
  bucket_count = 512
) as
select * from raw_events
where td_interval(time, '-30d', 'JST')
```

**Accelerated queries** (equality on all bucketing columns):
```sql
select * from customer_events
where customer_id = 12345
  and td_interval(time, '-7d', 'JST')
```

**UDP for colocated joins:**
```sql
-- set session join_distribution_type = 'PARTITIONED'
-- set session colocated_join = 'true'
select a.*, b.*
from customer_events_a a
join customer_events_b b on a.customer_id = b.customer_id
```

---

### Magic Comments for Join Distribution

```sql
-- BROADCAST: Small right table fits in memory
-- set session join_distribution_type = 'BROADCAST'
select * from large_table, small_lookup
where large_table.id = small_lookup.id

-- PARTITIONED: Both tables large or memory issues
-- set session join_distribution_type = 'PARTITIONED'
select * from large_table_a, large_table_b
where large_table_a.id = large_table_b.id
```

---

## Engine-Specific Optimization

### Hive → Trino Migration

**Recommend when:**
- ✅ Job execution time >60s on Hive for simple query
- ✅ Query uses window functions (Trino 10-50x faster)
- ✅ Complex JOINs (Trino better optimizer)
- ✅ Need interactive query response
- ✅ Hive timeout (>4 hours)

**Migration steps:**
1. **Change engine in workflow**
   ```yaml
   # In .dig file
   td>: queries/my_query.sql
   engine: presto  # Change from "hive" to "presto"
   ```

2. **For ad-hoc queries**
   ```bash
   tdx query -t presto -f query.sql
   ```

3. **Test on small date range first**
   ```sql
   WHERE td_interval(time, '-1d', 'JST')
   ```

---

### Trino → Hive Migration

**Recommend when:**
- ❌ Trino memory errors (exceeded 10GB limit)
- ❌ Very large datasets (>500GB scanned)
- ❌ High-cardinality GROUP BY causing OOM
- ❌ Approximate functions not acceptable

**Syntax differences:**

| Trino | Hive | Notes |
|-------|------|-------|
| `td_time_string(time, 'd!', 'JST')` | `TD_TIME_FORMAT(time, 'yyyy-MM-dd', 'JST')` | Date formatting |
| `REGEXP_LIKE(col, pattern)` | `col RLIKE pattern` | Regex matching |
| `ARRAY_AGG(col)` | `COLLECT_LIST(col)` | Array aggregation |
| `ARRAY_AGG(DISTINCT col)` | `COLLECT_SET(col)` | Distinct array |
| `approx_distinct(col)` | `COUNT(DISTINCT col)` | Hive uses exact |

---

## Common Errors

| Error | Fix |
|-------|-----|
| Query exceeded memory limit | Narrow time range, use approx functions, try PARTITIONED join, migrate to Hive |
| PAGE_TRANSPORT_TIMEOUT | Reduce columns, use CTAS, process in smaller chunks |
| Query timeout | Add time filters, use limit for testing |
| Too many partitions | Reduce time range |

---

## Optimization Checklist

Before running any query, verify:

- [ ] **Time filter present** - Uses `td_interval()` or `td_time_range()`
- [ ] **Time range appropriate** - Not overly broad
- [ ] **Specific columns** - No `SELECT *` unless necessary
- [ ] **Approximate functions** - For large datasets
- [ ] **No td_time_string in WHERE** - Use time functions directly
- [ ] **JOINs optimized** - Smaller dataset first
- [ ] **No correlated subqueries** - Convert to JOINs
- [ ] **ORDER BY with LIMIT** - Deterministic results
- [ ] **UNION ALL over UNION** - If duplicates acceptable
- [ ] **Efficient window functions** - Minimize different partitions

---

## Optimization Workflow

### Step 1: Analyze Query

Check for:
1. ❌ Missing time filters
2. ❌ Exact functions on large datasets
3. ❌ Functions in WHERE clause
4. ❌ SELECT *
5. ❌ Inefficient JOINs
6. ❌ Correlated subqueries
7. ❌ High-cardinality GROUP BY
8. ❌ Missing ORDER BY with LIMIT

### Step 2: Prioritize Fixes

**Critical (10-1000x impact):**
- Add time filters
- Fix correlated subqueries
- Use approximate functions

**High Impact (2-10x):**
- Optimize JOINs
- Remove SELECT *
- Fix window functions

### Step 3: Apply Optimizations

Generate optimized query with:
- All critical fixes applied
- High-impact improvements
- Comments explaining changes

### Step 4: Estimate Impact

Provide:
- Expected speedup (2x, 10x, 100x)
- Data scanned (before/after)
- Estimated execution time

---

## Optimization Examples

### Example 1: Missing Time Filter

**Original:**
```sql
select product_id, sum(quantity) as total_sold
from sales_db.orders
group by product_id
order by total_sold desc
limit 10
```

**Analysis:**
```markdown
⚠️ **CRITICAL ISSUE:** No time filter
- Scans: ENTIRE table (years of data)
- Risk: Query timeout, high cost
- Impact: 100-1000x slower than necessary
```

**Optimized:**
```sql
-- Added time filter for performance
select product_id, sum(quantity) as total_sold
from sales_db.orders
where td_interval(time, '-30d', 'JST')  -- ✅ ADDED
group by product_id
order by total_sold desc
limit 10
```

**Impact:**
- **Before:** Scans 1B+ rows (2+ years)
- **After:** Scans ~10M rows (30 days)
- **Speedup:** ~100x faster
- **Cost:** 100x cheaper

---

### Example 2: Approximate Functions

**Original:**
```sql
select
  td_time_string(time, 'd!', 'JST') as date,
  count(distinct customer_id) as unique_customers
from sales_db.orders
where td_interval(time, '-90d', 'JST')
group by td_time_string(time, 'd!', 'JST')
```

**Optimized:**
```sql
select
  td_time_string(time, 'd!', 'JST') as date,
  approx_distinct(customer_id) as unique_customers  -- ✅ CHANGED
from sales_db.orders
where td_interval(time, '-90d', 'JST')
group by td_time_string(time, 'd!', 'JST')
```

**Impact:**
- **Before:** 60 seconds
- **After:** 6 seconds
- **Speedup:** 10x faster
- **Accuracy:** ~98% (2% error acceptable)

---

### Example 3: Correlated Subquery

**Original:**
```sql
select
  o.order_id,
  o.amount,
  (select sum(quantity) from order_items oi where oi.order_id = o.order_id) as total_items
from orders o
where td_interval(o.time, '-7d', 'JST')
```

**Optimized:**
```sql
select
  o.order_id,
  o.amount,
  coalesce(sum(oi.quantity), 0) as total_items  -- ✅ CONVERTED TO JOIN
from orders o
left join order_items oi on o.order_id = oi.order_id
where td_interval(o.time, '-7d', 'JST')
group by o.order_id, o.amount
```

**Impact:**
- **Before:** 300+ seconds
- **After:** 3 seconds
- **Speedup:** 100x faster

---

## Integration with Other Skills

**Invoked by:**
- `query-explainer` - When performance issues detected
- `analytical-query` - Auto-optimize generated queries

**Invokes:**
- Uses `trino`, `hive`, `time-filtering` patterns

---

## Related Skills

- **query-explainer** - Understand queries
- **trino** - TD SQL reference
- **time-filtering** - Time filter patterns
- **analytical-query** - Natural language to SQL

## Resources

- Trino Performance: https://trino.io/docs/current/admin/performance.html
- TD Best Practices: https://docs.treasuredata.com/
