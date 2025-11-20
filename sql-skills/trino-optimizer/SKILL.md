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

## Core Optimization Principles

### 1. Time-Based Partition Pruning (Most Important)

TD tables are partitioned by 1-hour buckets. **Always** filter on time for optimal performance.

**Use TD_INTERVAL or TD_TIME_RANGE:**
```sql
-- Good: Uses partition pruning
WHERE TD_INTERVAL(time, '-1d', 'JST')

-- Good: Explicit time range
WHERE TD_TIME_RANGE(time, '2024-01-01', '2024-01-31')

-- Bad: No time filter - scans entire table!
WHERE user_id = 123  -- Missing time filter
```

**Impact:** Without time filters, queries scan the entire table instead of just relevant partitions, dramatically increasing execution time and cost.

### 2. Column Selection

TD uses columnar storage format. **Select only needed columns.**

```sql
-- Good: Select specific columns
SELECT user_id, event_type, time
FROM events
WHERE TD_INTERVAL(time, '-1d', 'JST')

-- Bad: SELECT * reads all columns
SELECT *  -- Slower and more expensive
FROM events
WHERE TD_INTERVAL(time, '-1d', 'JST')
```

**Impact:** Each additional column increases I/O. Reading 10 columns vs 50 columns can make a significant performance difference.

### 3. Output Optimization

Use appropriate output methods for your use case.

**CREATE TABLE AS (CTAS) - 5x faster than SELECT:**
```sql
-- Best for large result sets
CREATE TABLE analysis_results AS
SELECT
  TD_TIME_STRING(time, 'd!', 'JST') as date,
  COUNT(*) as events
FROM events
WHERE TD_INTERVAL(time, '-1M', 'JST')
GROUP BY 1
```

**INSERT INTO - For appending to existing tables:**
```sql
INSERT INTO daily_summary
SELECT
  TD_TIME_STRING(time, 'd!', 'JST') as date,
  COUNT(*) as events
FROM events
WHERE TD_INTERVAL(time, '-1d', 'JST')
GROUP BY 1
```

**SELECT with LIMIT - For exploratory queries:**
```sql
-- Good for testing/exploration
SELECT *
FROM events
WHERE TD_INTERVAL(time, '-1d', 'JST')
LIMIT 1000
```

**Impact:** CTAS skips JSON serialization, directly writing to partitioned tables, providing 5x better performance.

### 4. REGEXP_LIKE vs Multiple LIKE Clauses

Replace chained LIKE clauses with REGEXP_LIKE for better performance.

```sql
-- Bad: Multiple LIKE clauses (slow)
WHERE (
  column LIKE '%android%'
  OR column LIKE '%ios%'
  OR column LIKE '%mobile%'
)

-- Good: Single REGEXP_LIKE (fast)
WHERE REGEXP_LIKE(column, 'android|ios|mobile')
```

**Impact:** Trino's optimizer cannot efficiently handle multiple LIKE clauses chained with OR, but can optimize REGEXP_LIKE.

### 5. Approximate Functions

Use APPROX_* functions for large-scale aggregations.

```sql
-- Fast: Approximate distinct count
SELECT APPROX_DISTINCT(user_id) as unique_users
FROM events
WHERE TD_INTERVAL(time, '-1M', 'JST')

-- Slow: Exact distinct count (memory intensive)
SELECT COUNT(DISTINCT user_id) as unique_users
FROM events
WHERE TD_INTERVAL(time, '-1M', 'JST')
```

**Available approximate functions:**
- `APPROX_DISTINCT(column)` - Approximate unique count
- `APPROX_PERCENTILE(column, percentile)` - Approximate percentile (e.g., 0.95 for p95)
- `APPROX_SET(column)` - Returns HyperLogLog sketch for set operations

**Impact:** Approximate functions use HyperLogLog algorithm, dramatically reducing memory usage with ~2% error rate.

### 6. JOIN Optimization

Order joins with smaller tables first when possible.

```sql
-- Good: Small table joined to large table
SELECT l.*, s.attribute
FROM large_table l
JOIN small_lookup s ON l.id = s.id
WHERE TD_INTERVAL(l.time, '-1d', 'JST')

-- Consider: If one table is very small, use a subquery to reduce it first
SELECT e.*
FROM events e
JOIN (
  SELECT user_id
  FROM premium_users
  WHERE subscription_status = 'active'
) p ON e.user_id = p.user_id
WHERE TD_INTERVAL(e.time, '-1d', 'JST')
```

**Magic Comments for Join Distribution:**

When joins fail with memory errors or run slowly, use magic comments to control join algorithm.

```sql
-- BROADCAST: Small right table fits in memory
-- set session join_distribution_type = 'BROADCAST'
SELECT *
FROM large_table, small_lookup
WHERE large_table.id = small_lookup.id
```

**Use BROADCAST when:** Right table is very small and fits in memory. Avoids partitioning overhead but uses more memory per node.

```sql
-- PARTITIONED: Both tables large or memory issues
-- set session join_distribution_type = 'PARTITIONED'
SELECT *
FROM large_table_a, large_table_b
WHERE large_table_a.id = large_table_b.id
```

**Use PARTITIONED when:** Both tables are large or right table doesn't fit in memory. Default algorithm that reduces memory per node.

**Tips:**
- Always include time filters on all tables in JOIN
- Consider using IN or EXISTS for single-column lookups
- Avoid FULL OUTER JOIN when possible (expensive)

### 7. GROUP BY Optimization

Use column positions in GROUP BY for complex expressions.

```sql
-- Good: Use column positions
SELECT
  TD_TIME_STRING(time, 'd!', 'JST') as date,
  event_type,
  COUNT(*) as cnt
FROM events
WHERE TD_INTERVAL(time, '-1M', 'JST')
GROUP BY 1, 2  -- Cleaner and avoids re-evaluation

-- Works but verbose:
GROUP BY TD_TIME_STRING(time, 'd!', 'JST'), event_type
```

### 8. Window Functions Optimization

Partition window functions appropriately to reduce memory usage.

```sql
-- Good: Partition by high-cardinality column
SELECT
  user_id,
  event_time,
  ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY event_time) as seq
FROM events
WHERE TD_INTERVAL(time, '-1d', 'JST')

-- Be careful: Window over entire dataset (memory intensive)
SELECT
  event_time,
  ROW_NUMBER() OVER (ORDER BY event_time) as global_seq
FROM events
WHERE TD_INTERVAL(time, '-1d', 'JST')
```

### 9. User-Defined Partitioning (UDP)

Hash partition tables on frequently queried columns for fast ID lookups and large joins.

```sql
-- Create UDP table with bucketing on customer_id
CREATE TABLE customer_events WITH (
  bucketed_on = array['customer_id'],
  bucket_count = 512
) AS
SELECT * FROM raw_events
WHERE TD_INTERVAL(time, '-30d', 'JST')
```

**When to use UDP:**
- Fast lookups by specific IDs (needle-in-a-haystack queries)
- Aggregations on specific columns
- Very large joins on same keys
- Tables with >100M rows

**Choosing bucketing columns:**
- High cardinality: `customer_id`, `user_id`, `email`, `account_number`
- Frequently used with equality predicates (`WHERE customer_id = 12345`)
- Supported types: int, long, string
- Maximum 3 columns

```sql
-- Accelerated: Equality on all bucketing columns
SELECT * FROM customer_events
WHERE customer_id = 12345
  AND TD_INTERVAL(time, '-7d', 'JST')

-- NOT accelerated: Missing bucketing column
SELECT * FROM customer_events
WHERE TD_INTERVAL(time, '-7d', 'JST')
```

**UDP for large joins:**
```sql
-- Both tables bucketed on same key enables colocated join
-- set session join_distribution_type = 'PARTITIONED'
-- set session colocated_join = 'true'
SELECT a.*, b.*
FROM customer_events_a a
JOIN customer_events_b b ON a.customer_id = b.customer_id
WHERE TD_INTERVAL(a.time, '-1d', 'JST')
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
3. Use LIMIT for testing before full run
4. Break into smaller queries with intermediate tables
5. Use approximate functions instead of exact aggregations

**Example fix:**
```sql
-- Before: Times out
SELECT COUNT(DISTINCT user_id)
FROM events
WHERE event_type = 'click'

-- After: Much faster
SELECT APPROX_DISTINCT(user_id)
FROM events
WHERE TD_INTERVAL(time, '-1d', 'JST')
  AND event_type = 'click'
```

### Issue: Memory Limit Exceeded

**Symptoms:**
- "Query exceeded per-node memory limit"
- "Query exceeded distributed memory limit"

**Solutions:**
1. Reduce data volume with time filters
2. Use APPROX_DISTINCT instead of COUNT(DISTINCT)
3. Reduce number of columns in SELECT
4. Limit GROUP BY cardinality
5. Optimize JOIN operations
6. Process data in smaller time chunks

**Example fix:**
```sql
-- Before: Memory exceeded
SELECT
  user_id,
  COUNT(DISTINCT session_id),
  COUNT(DISTINCT page_url),
  COUNT(DISTINCT referrer)
FROM events
WHERE TD_INTERVAL(time, '-1M', 'JST')
GROUP BY user_id

-- After: Uses approximate functions
SELECT
  user_id,
  APPROX_DISTINCT(session_id) as sessions,
  APPROX_DISTINCT(page_url) as pages,
  APPROX_DISTINCT(referrer) as referrers
FROM events
WHERE TD_INTERVAL(time, '-1M', 'JST')
GROUP BY user_id
```

### Issue: PAGE_TRANSPORT_TIMEOUT

**Symptoms:**
- Frequent PAGE_TRANSPORT_TIMEOUT errors
- Network-related query failures

**Solutions:**
1. Narrow TD_TIME_RANGE to reduce data volume
2. Reduce number of columns in SELECT
3. Break large queries into smaller time ranges
4. Use CTAS instead of SELECT for large results

**Example fix:**
```sql
-- Before: Transporting too much data
SELECT *
FROM events
WHERE TD_TIME_RANGE(time, '2024-01-01', '2024-12-31')

-- After: Process in chunks
SELECT user_id, event_type, time
FROM events
WHERE TD_INTERVAL(time, '-1d', 'JST')
```

### Issue: Slow Aggregations

**Symptoms:**
- COUNT(DISTINCT) taking very long
- Large GROUP BY queries slow

**Solutions:**
1. Use APPROX_DISTINCT instead of COUNT(DISTINCT)
2. Filter data with time range first
3. Consider pre-aggregating with intermediate tables
4. Reduce GROUP BY dimensions

**Example fix:**
```sql
-- Before: Slow exact count
SELECT
  TD_TIME_STRING(time, 'd!', 'JST') as date,
  COUNT(DISTINCT user_id) as dau
FROM events
WHERE TD_INTERVAL(time, '-1M', 'JST')
GROUP BY 1

-- After: Fast approximate count
SELECT
  TD_TIME_STRING(time, 'd!', 'JST') as date,
  APPROX_DISTINCT(user_id) as dau
FROM events
WHERE TD_INTERVAL(time, '-1M', 'JST')
GROUP BY 1
```

## Query Analysis Workflow

When optimizing a slow query, follow this workflow:

### Step 1: Add EXPLAIN

```sql
EXPLAIN
SELECT ...
FROM ...
WHERE ...
```

Look for:
- Full table scans (missing time filters)
- High cardinality GROUP BY
- Expensive JOINs
- Missing filters

### Step 2: Check Time Filters

```sql
-- Ensure time filter exists and is specific
WHERE TD_INTERVAL(time, '-1d', 'JST')
  OR TD_TIME_RANGE(time, '2024-01-01', '2024-01-31')
```

### Step 3: Reduce Column Count

```sql
-- Select only needed columns
SELECT user_id, event_type, time
-- Not SELECT *
```

### Step 4: Use Approximate Functions

```sql
-- Replace COUNT(DISTINCT) with APPROX_DISTINCT
-- Replace PERCENTILE with APPROX_PERCENTILE
```

### Step 5: Test with LIMIT

```sql
-- Test logic on small subset first
SELECT ...
FROM ...
WHERE TD_INTERVAL(time, '-1d', 'JST')
LIMIT 1000
```

### Step 6: Use CTAS for Large Results

```sql
-- For queries returning many rows
CREATE TABLE results AS
SELECT ...
```

## Advanced Optimization Techniques

### Pre-aggregation Strategy

For frequently-run queries, create pre-aggregated tables.

```sql
-- Daily aggregation job
CREATE TABLE daily_user_events AS
SELECT
  TD_TIME_STRING(time, 'd!', 'JST') as date,
  user_id,
  COUNT(*) as event_count,
  APPROX_DISTINCT(session_id) as sessions
FROM events
WHERE TD_INTERVAL(time, '-1d', 'JST')
GROUP BY 1, 2

-- Fast queries on pre-aggregated data
SELECT
  date,
  SUM(event_count) as total_events,
  SUM(sessions) as total_sessions
FROM daily_user_events
WHERE date >= '2024-01-01'
GROUP BY 1
```

### Incremental Processing

Process large time ranges incrementally.

```sql
-- Instead of processing 1 year at once
-- Process day by day and INSERT INTO result table

-- Day 1
INSERT INTO monthly_summary
SELECT ...
FROM events
WHERE TD_INTERVAL(time, '-1d', 'JST')

-- Day 2
INSERT INTO monthly_summary
SELECT ...
FROM events
WHERE TD_INTERVAL(time, '-2d/-1d', 'JST')

-- etc.
```

### Materialized Views Pattern

Create and maintain summary tables for common queries.

```sql
-- Create summary table once
CREATE TABLE user_daily_summary AS
SELECT
  TD_TIME_STRING(time, 'd!', 'JST') as date,
  user_id,
  COUNT(*) as events,
  APPROX_DISTINCT(page_url) as pages_visited
FROM events
WHERE TD_INTERVAL(time, '-30d', 'JST')
GROUP BY 1, 2

-- Query the summary (much faster)
SELECT
  date,
  AVG(events) as avg_events_per_user,
  AVG(pages_visited) as avg_pages_per_user
FROM user_daily_summary
GROUP BY 1
ORDER BY 1
```

## Best Practices Checklist

Before running a query, verify:

- [ ] Time filter added (TD_INTERVAL or TD_TIME_RANGE)
- [ ] Selecting specific columns (not SELECT *)
- [ ] Using APPROX_DISTINCT for unique counts
- [ ] Using REGEXP_LIKE instead of multiple LIKEs
- [ ] Tested with LIMIT on small dataset first
- [ ] Using CTAS for large result sets
- [ ] All joined tables have time filters
- [ ] GROUP BY uses reasonable cardinality
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
