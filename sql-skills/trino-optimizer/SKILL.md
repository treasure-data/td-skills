---
name: trino-optimizer
description: Expert assistance for optimizing Trino query performance in Treasure Data. Use this skill when users need help with slow queries, memory issues, timeouts, or performance tuning. Focuses on partition pruning, column selection, output optimization, and common performance bottlenecks.
---

# Trino Query Optimizer

Expert assistance for optimizing Trino query performance and troubleshooting performance issues in Treasure Data environments.

## When to Use This Skill

Use this skill when:
- Queries are running too slowly or timing out
- Encountering memory limit errors
- Optimizing existing queries for better performance
- Debugging PAGE_TRANSPORT_TIMEOUT errors
- Reducing query costs
- Analyzing query execution plans
- Joins between large and small tables need optimization (use Magic Comments)
- Frequent ID lookups on large tables (>100M rows) need optimization (use UDP)

## Core Optimization Principles

### 1. Time-Based Partition Pruning (Most Important)

TD tables are partitioned by 1-hour buckets. **Always** filter on time for optimal performance.

**Use TD_INTERVAL or TD_TIME_RANGE:**
```sql
-- Good: Uses partition pruning
where TD_INTERVAL(time, '-1d', 'JST')

-- Good: Explicit time range
where TD_TIME_RANGE(time, '2024-01-01', '2024-01-31')

-- Bad: No time filter - scans entire table!
where user_id = 123  -- Missing time filter
```

**Impact:** Without time filters, queries scan the entire table instead of just relevant partitions, dramatically increasing execution time and cost.

### 2. Column Selection

TD uses columnar storage format. **Select only needed columns.**

```sql
-- Good: Select specific columns
select user_id, event_type, time
from events
where TD_INTERVAL(time, '-1d', 'JST')

-- Bad: select * reads all columns
select *  -- Slower and more expensive
from events
where TD_INTERVAL(time, '-1d', 'JST')
```

**Impact:** Each additional column increases I/O. Reading 10 columns vs 50 columns can make a significant performance difference.

### 3. Output Optimization

Use appropriate output methods for your use case.

**create table AS (CTAS) - 5x faster than select:**
```sql
-- Best for large result sets
create table analysis_results AS
select
  TD_TIME_STRING(time, 'd!', 'JST') as date,
  count(*) as events
from events
where TD_INTERVAL(time, '-1M', 'JST')
group by 1
```

**insert into - For appending to existing tables:**
```sql
insert into daily_summary
select
  TD_TIME_STRING(time, 'd!', 'JST') as date,
  count(*) as events
from events
where TD_INTERVAL(time, '-1d', 'JST')
group by 1
```

**select with limit - For exploratory queries:**
```sql
-- Good for testing/exploration
select *
from events
where TD_INTERVAL(time, '-1d', 'JST')
limit 1000
```

**Impact:** CTAS skips JSON serialization, directly writing to partitioned tables, providing 5x better performance.

### 4. REGEXP_LIKE vs Multiple LIKE Clauses

Replace chained LIKE clauses with REGEXP_LIKE for better performance.

```sql
-- Bad: Multiple LIKE clauses (slow)
where (
  column LIKE '%android%'
  or column LIKE '%ios%'
  or column LIKE '%mobile%'
)

-- Good: Single REGEXP_LIKE (fast)
where REGEXP_LIKE(column, 'android|ios|mobile')
```

**Impact:** Trino's optimizer cannot efficiently handle multiple LIKE clauses chained with OR, but can optimize REGEXP_LIKE.

### 5. Approximate Functions

Use APPROX_* functions for large-scale aggregations.

```sql
-- Fast: Approximate distinct count
select APPROX_DISTINCT(user_id) as unique_users
from events
where TD_INTERVAL(time, '-1M', 'JST')

-- Slow: Exact distinct count (memory intensive)
select COUNT(DISTINCT user_id) as unique_users
from events
where TD_INTERVAL(time, '-1M', 'JST')
```

**Available approximate functions:**
- `APPROX_DISTINCT(column)` - Approximate unique count
- `APPROX_PERCENTILE(column, percentile)` - Approximate percentile (e.g., 0.95 for p95)
- `APPROX_SET(column)` - Returns HyperLogLog sketch for set operations

**Impact:** Approximate functions use HyperLogLog algorithm, dramatically reducing memory usage with ~2% error rate.

### 6. join Optimization

Order joins with smaller tables first when possible.

```sql
-- Good: Small table joined to large table
select l.*, s.attribute
from large_table l
join small_lookup s ON l.id = s.id
where TD_INTERVAL(l.time, '-1d', 'JST')

-- Consider: If one table is very small, use a subquery to reduce it first
select e.*
from events e
join (
  select user_id
  from premium_users
  where subscription_status = 'active'
) p ON e.user_id = p.user_id
where TD_INTERVAL(e.time, '-1d', 'JST')
```

**Magic Comments for Join Distribution:**

When joins fail with memory errors or run slowly, use magic comments to control join algorithm.

```sql
-- BROADCAST: Small right table fits in memory
-- set session join_distribution_type = 'BROADCAST'
select *
from large_table, small_lookup
where large_table.id = small_lookup.id
```

**Use BROADCAST when:** Right table is very small and fits in memory. Avoids partitioning overhead but uses more memory per node.

```sql
-- PARTITIONED: Both tables large or memory issues
-- set session join_distribution_type = 'PARTITIONED'
select *
from large_table_a, large_table_b
where large_table_a.id = large_table_b.id
```

**Use PARTITIONED when:** Both tables are large or right table doesn't fit in memory. Default algorithm that reduces memory per node.

**Tips:**
- Always include time filters on all tables in join
- Consider using IN or EXISTS for single-column lookups
- Avoid FULL OUTER join when possible (expensive)

### 7. group by Optimization

Use column positions in group by for complex expressions.

```sql
-- Good: Use column positions
select
  TD_TIME_STRING(time, 'd!', 'JST') as date,
  event_type,
  COUNT(*) as cnt
from events
where TD_INTERVAL(time, '-1M', 'JST')
group by 1, 2  -- Cleaner and avoids re-evaluation

-- Works but verbose:
group by TD_TIME_STRING(time, 'd!', 'JST'), event_type
```

### 8. Window Functions Optimization

Partition window functions appropriately to reduce memory usage.

```sql
-- Good: Partition by high-cardinality column
select
  user_id,
  event_time,
  ROW_NUMBER() OVER (PARTITION BY user_id order by event_time) as seq
from events
where TD_INTERVAL(time, '-1d', 'JST')

-- Be careful: Window over entire dataset (memory intensive)
select
  event_time,
  ROW_NUMBER() OVER (order by event_time) as global_seq
from events
where TD_INTERVAL(time, '-1d', 'JST')
```

### 9. User-Defined Partitioning (UDP)

Hash partition tables on frequently queried columns for fast ID lookups and large joins.

```sql
-- Create UDP table with bucketing on customer_id
create table customer_events WITH (
  bucketed_on = array['customer_id'],
  bucket_count = 512
) AS
select * from raw_events
where TD_INTERVAL(time, '-30d', 'JST')
```

**When to use UDP:**
- Fast lookups by specific IDs (needle-in-a-haystack queries)
- Aggregations on specific columns
- Very large joins on same keys
- Tables with >100M rows

**Choosing bucketing columns:**
- High cardinality: `customer_id`, `user_id`, `email`, `account_number`
- Frequently used with equality predicates (`where customer_id = 12345`)
- Supported types: int, long, string
- Maximum 3 columns

```sql
-- Accelerated: Equality on all bucketing columns
select * from customer_events
where customer_id = 12345
  AND TD_INTERVAL(time, '-7d', 'JST')

-- NOT accelerated: Missing bucketing column
select * from customer_events
where TD_INTERVAL(time, '-7d', 'JST')
```

**UDP for large joins:**
```sql
-- Both tables bucketed on same key enables colocated join
-- set session join_distribution_type = 'PARTITIONED'
-- set session colocated_join = 'true'
select a.*, b.*
from customer_events_a a
join customer_events_b b ON a.customer_id = b.customer_id
where TD_INTERVAL(a.time, '-1d', 'JST')
```

**Impact:** UDP scans only relevant buckets, dramatically improving performance for ID lookups and reducing memory for large joins.

## Common Performance Issues

### Issue: Query Timeout

**Symptoms:**
- Query exceeds maximum execution time
- "Query exceeded maximum time" error

**Solutions:**
1. Add or narrow time filters with TD_INTERVAL/TD_TIME_RANGE
2. Reduce selected columns
3. Use limit for testing before full run
4. Break into smaller queries with intermediate tables
5. Use approximate functions instead of exact aggregations

**Example fix:**
```sql
-- Before: Times out
select COUNT(DISTINCT user_id)
from events
where event_type = 'click'

-- After: Much faster
select APPROX_DISTINCT(user_id)
from events
where TD_INTERVAL(time, '-1d', 'JST')
  AND event_type = 'click'
```

### Issue: Memory Limit Exceeded

**Symptoms:**
- "Query exceeded per-node memory limit"
- "Query exceeded distributed memory limit"

**Solutions:**
1. Reduce data volume with time filters
2. Use APPROX_DISTINCT instead of COUNT(DISTINCT)
3. Reduce number of columns in select
4. Limit group by cardinality
5. Optimize join operations
6. Process data in smaller time chunks

**Example fix:**
```sql
-- Before: Memory exceeded
select
  user_id,
  COUNT(DISTINCT session_id),
  COUNT(DISTINCT page_url),
  COUNT(DISTINCT referrer)
from events
where TD_INTERVAL(time, '-1M', 'JST')
group by user_id

-- After: Uses approximate functions
select
  user_id,
  APPROX_DISTINCT(session_id) as sessions,
  APPROX_DISTINCT(page_url) as pages,
  APPROX_DISTINCT(referrer) as referrers
from events
where TD_INTERVAL(time, '-1M', 'JST')
group by user_id
```

### Issue: PAGE_TRANSPORT_TIMEOUT

**Symptoms:**
- Frequent PAGE_TRANSPORT_TIMEOUT errors
- Network-related query failures

**Solutions:**
1. Narrow TD_TIME_RANGE to reduce data volume
2. Reduce number of columns in select
3. Break large queries into smaller time ranges
4. Use CTAS instead of select for large results

**Example fix:**
```sql
-- Before: Transporting too much data
select *
from events
where TD_TIME_RANGE(time, '2024-01-01', '2024-12-31')

-- After: Process in chunks
select user_id, event_type, time
from events
where TD_INTERVAL(time, '-1d', 'JST')
```

### Issue: Slow Aggregations

**Symptoms:**
- COUNT(DISTINCT) taking very long
- Large group by queries slow

**Solutions:**
1. Use APPROX_DISTINCT instead of COUNT(DISTINCT)
2. Filter data with time range first
3. Consider pre-aggregating with intermediate tables
4. Reduce group by dimensions

**Example fix:**
```sql
-- Before: Slow exact count
select
  TD_TIME_STRING(time, 'd!', 'JST') as date,
  COUNT(DISTINCT user_id) as dau
from events
where TD_INTERVAL(time, '-1M', 'JST')
group by 1

-- After: Fast approximate count
select
  TD_TIME_STRING(time, 'd!', 'JST') as date,
  APPROX_DISTINCT(user_id) as dau
from events
where TD_INTERVAL(time, '-1M', 'JST')
group by 1
```

## Query Analysis Workflow

When optimizing a slow query, follow this workflow:

### Step 1: Add EXPLAIN

```sql
EXPLAIN
select ...
from ...
where ...
```

Look for:
- Full table scans (missing time filters)
- High cardinality group by
- Expensive joins
- Missing filters

### Step 2: Check Time Filters

```sql
-- Ensure time filter exists and is specific
where TD_INTERVAL(time, '-1d', 'JST')
  OR TD_TIME_RANGE(time, '2024-01-01', '2024-01-31')
```

### Step 3: Reduce Column Count

```sql
-- Select only needed columns
select user_id, event_type, time
-- Not select *
```

### Step 4: Use Approximate Functions

```sql
-- Replace COUNT(DISTINCT) with APPROX_DISTINCT
-- Replace PERCENTILE with APPROX_PERCENTILE
```

### Step 5: Test with limit

```sql
-- Test logic on small subset first
select ...
from ...
where TD_INTERVAL(time, '-1d', 'JST')
limit 1000
```

### Step 6: Use CTAS for Large Results

```sql
-- For queries returning many rows
create table results AS
select ...
```

## Advanced Optimization Techniques

### Pre-aggregation Strategy

For frequently-run queries, create pre-aggregated tables.

```sql
-- Daily aggregation job
create table daily_user_events AS
select
  TD_TIME_STRING(time, 'd!', 'JST') as date,
  user_id,
  COUNT(*) as event_count,
  APPROX_DISTINCT(session_id) as sessions
from events
where TD_INTERVAL(time, '-1d', 'JST')
group by 1, 2

-- Fast queries on pre-aggregated data
select
  date,
  SUM(event_count) as total_events,
  SUM(sessions) as total_sessions
from daily_user_events
where date >= '2024-01-01'
group by 1
```

### Incremental Processing

Process large time ranges incrementally.

```sql
-- Instead of processing 1 year at once
-- Process day by day and INSERT INTO result table

-- Day 1
INSERT INTO monthly_summary
select ...
from events
where TD_INTERVAL(time, '-1d', 'JST')

-- Day 2
INSERT INTO monthly_summary
select ...
from events
where TD_INTERVAL(time, '-2d/-1d', 'JST')

-- etc.
```

### Materialized Views Pattern

Create and maintain summary tables for common queries.

```sql
-- Create summary table once
create table user_daily_summary AS
select
  TD_TIME_STRING(time, 'd!', 'JST') as date,
  user_id,
  count(*) as events,
  APPROX_DISTINCT(page_url) as pages_visited
from events
where TD_INTERVAL(time, '-30d', 'JST')
group by 1, 2

-- Query the summary (much faster)
select
  date,
  AVG(events) as avg_events_per_user,
  AVG(pages_visited) as avg_pages_per_user
from user_daily_summary
group by 1
order by 1
```

## Best Practices Checklist

Before running a query, verify:

- [ ] Time filter added (TD_INTERVAL or TD_TIME_RANGE)
- [ ] Selecting specific columns (not select *)
- [ ] Using APPROX_DISTINCT for unique counts
- [ ] Using REGEXP_LIKE instead of multiple LIKEs
- [ ] Tested with limit on small dataset first
- [ ] Using CTAS for large result sets
- [ ] All joined tables have time filters
- [ ] group by uses reasonable cardinality
- [ ] Window functions partition appropriately

## Cost Optimization

Reducing query execution time also reduces cost:

1. **Time filters** - Scan less data
2. **Column selection** - Read less data
3. **Approximate functions** - Use less memory
4. **CTAS** - Avoid expensive JSON serialization
5. **Pre-aggregation** - Query summary tables instead of raw data

## Resources

- Use EXPLAIN to analyze query plans
- Monitor query execution in TD Console
- Check query statistics for memory and time usage
- Consider Trino 423+ features for better performance
