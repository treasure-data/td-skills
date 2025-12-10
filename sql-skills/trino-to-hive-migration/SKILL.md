---
name: trino-to-hive-migration
description: Expert guidance for migrating queries from Trino to Hive when encountering memory errors, timeouts, or performance issues. Use this skill when Trino queries fail with memory limits or when batch processing requirements make Hive a better choice.
---

# Trino to Hive Migration Guide

Expert assistance for converting Trino queries to Hive to resolve memory errors, timeouts, and resource constraints.

## When to Use This Skill

Use this skill when:
- Trino queries fail with memory limit exceeded errors
- Queries time out in Trino despite optimization
- Processing very large datasets (months/years of data)
- Running batch ETL jobs that don't require interactive speed
- Encountering "Query exceeded per-node memory limit" errors
- Need more stable execution for complex aggregations
- Cost optimization for long-running queries

## Why Hive Often Solves Memory Problems

### Key Differences

**Trino (Fast but Memory-Intensive):**
- In-memory processing for speed
- Limited by node memory (per-node limits)
- Best for interactive queries on moderate data volumes
- Fast failures when memory exceeded

**Hive with Tez (Slower but More Scalable):**
- TD's Hive uses Apache Tez execution engine (not traditional MapReduce)
- Tez provides faster performance than classic MapReduce
- Disk-based processing with memory spilling
- Can handle much larger datasets
- Spills to disk when memory insufficient
- More fault-tolerant for large jobs
- Better for batch processing

### When Hive is Better

✅ Use Hive when:
- Processing > 1 month of data at once
- Memory errors in Trino
- Complex multi-way JOINs
- High cardinality GROUP BY operations
- Batch ETL (scheduled daily/hourly jobs)
- Query doesn't need to be interactive

❌ Use Trino when:
- Interactive/ad-hoc queries
- Need results quickly (< 5 minutes)
- Small to moderate data volumes
- Real-time dashboards

## Migration Workflow

### Step 1: Identify the Problem

**Trino memory error example:**
```
Query exceeded per-node memory limit of 10GB
Query exceeded distributed memory limit of 100GB
```

**When you see this:**
1. First try Trino optimization (see trino-optimizer skill)
2. If optimization doesn't help, migrate to Hive

### Step 2: Convert Query Syntax

Most Trino queries work in Hive with minor changes.

## Syntax Conversion Guide

### Basic SELECT (Usually Compatible)

```sql
-- Trino
SELECT
  user_id,
  COUNT(*) as event_count
FROM events
WHERE td_interval(time, '-1M', 'JST')
GROUP BY user_id

-- Hive (same syntax)
SELECT
  user_id,
  COUNT(*) as event_count
FROM events
WHERE td_interval(time, '-1M', 'JST')
GROUP BY user_id
```

### Time Functions

**td_time_string (Trino only):**
```sql
-- Trino
SELECT td_time_string(time, 'd!', 'JST') as date

-- Hive: Use td_time_format instead
SELECT td_time_format(time, 'yyyy-MM-dd', 'JST') as date
```

**td_time_range (Compatible):**
```sql
-- Both Trino and Hive
WHERE td_time_range(time, '2024-01-01', '2024-01-31', 'JST')
```

**td_interval (Compatible):**
```sql
-- Both Trino and Hive
WHERE td_interval(time, '-1M', 'JST')
```

### Approximate Functions

**APPROX_DISTINCT (Compatible via Hivemall!):**
```sql
-- Trino
SELECT APPROX_DISTINCT(user_id) as unique_users

-- Hive: SAME SYNTAX! approx_distinct is available via Hivemall
SELECT approx_distinct(user_id) as unique_users
-- Also available as: approx_count_distinct(user_id)
-- Uses HyperLogLog algorithm, same as Trino

-- Hive Option 2: Exact count (slower but accurate)
SELECT COUNT(DISTINCT user_id) as unique_users

-- Hive Option 3: Sample for estimation
SELECT COUNT(DISTINCT user_id) * 10 as estimated_users
FROM table_name
WHERE td_interval(time, '-1M', 'JST')
  AND rand() < 0.1  -- 10% sample
```

**Good news:** `approx_distinct()` works in both Trino and Hive! Hivemall provides this function (along with `approx_count_distinct()` as an alias) using the same HyperLogLog algorithm, so you often don't need to change this function when migrating.

**APPROX_PERCENTILE (Trino) → PERCENTILE (Hive):**
```sql
-- Trino
SELECT APPROX_PERCENTILE(response_time, 0.95) as p95

-- Hive
SELECT PERCENTILE(response_time, 0.95) as p95
```

### Array and String Functions

**ARRAY_AGG (Trino) → COLLECT_LIST (Hive):**
```sql
-- Trino
SELECT ARRAY_AGG(product_id) as products

-- Hive
SELECT COLLECT_LIST(product_id) as products
```

**STRING_AGG (Trino) → CONCAT_WS + COLLECT_LIST (Hive):**
```sql
-- Trino
SELECT STRING_AGG(name, ', ') as names

-- Hive
SELECT CONCAT_WS(', ', COLLECT_LIST(name)) as names
```

**SPLIT (Compatible but different behavior):**
```sql
-- Trino: Returns array
SELECT SPLIT(text, ',')[1]  -- 0-indexed

-- Hive: Returns array
SELECT SPLIT(text, ',')[0]  -- Also 0-indexed (compatible)
```

### REGEXP Functions

**REGEXP_EXTRACT (Compatible):**
```sql
-- Both Trino and Hive
SELECT REGEXP_EXTRACT(url, 'product_id=([0-9]+)', 1)
```

**REGEXP_LIKE (Trino) → RLIKE (Hive):**
```sql
-- Trino
WHERE REGEXP_LIKE(column, 'pattern')

-- Hive
WHERE column RLIKE 'pattern'
```

### Window Functions (Mostly Compatible)

```sql
-- Both support similar syntax
SELECT
  user_id,
  event_time,
  ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY event_time) as seq,
  LAG(event_time) OVER (PARTITION BY user_id ORDER BY event_time) as prev_event
FROM events
WHERE td_interval(time, '-1d', 'JST')
```

### JOINs (Compatible)

**MAPJOIN hint in Hive for small tables:**
```sql
-- Trino (automatic small table optimization)
SELECT *
FROM large_table l
JOIN small_table s ON l.id = s.id

-- Hive (explicit hint for better performance)
SELECT /*+ MAPJOIN(small_table) */ *
FROM large_table l
JOIN small_table s ON l.id = s.id
```

### CAST Functions (Mostly Compatible)

```sql
-- Both Trino and Hive
CAST(column AS BIGINT)
CAST(column AS VARCHAR)
CAST(column AS DOUBLE)

-- Trino: TRY_CAST (returns NULL on failure)
TRY_CAST(column AS BIGINT)

-- Hive: No TRY_CAST, use CAST with NULL handling
CAST(column AS BIGINT)  -- Returns NULL on failure in Hive
```

## Complete Migration Examples

### Example 1: Memory Error with Large Aggregation

**Original Trino query (fails with memory error):**
```sql
SELECT
  user_id,
  td_time_string(time, 'd!', 'JST') as date,
  APPROX_DISTINCT(session_id) as sessions,
  COUNT(*) as events
FROM events
WHERE td_time_range(time, '2024-01-01', '2024-12-31')
GROUP BY user_id, td_time_string(time, 'd!', 'JST')
```

**Converted to Hive (works):**
```sql
SELECT
  user_id,
  td_time_format(time, 'yyyy-MM-dd', 'JST') as date,
  approx_distinct(session_id) as sessions,  -- Hivemall - same as Trino!
  COUNT(*) as events
FROM events
WHERE td_time_range(time, '2024-01-01', '2024-12-31', 'JST')
GROUP BY user_id, td_time_format(time, 'yyyy-MM-dd', 'JST')
```

### Example 2: Complex Multi-Way JOIN

**Original Trino query (times out):**
```sql
SELECT
  e.user_id,
  u.user_name,
  p.product_name,
  o.order_total
FROM events e
JOIN users u ON e.user_id = u.user_id
JOIN products p ON e.product_id = p.product_id
JOIN orders o ON e.order_id = o.order_id
WHERE td_interval(e.time, '-3M', 'JST')
  AND REGEXP_LIKE(e.event_type, 'purchase|checkout')
```

**Converted to Hive (works):**
```sql
SELECT
  e.user_id,
  u.user_name,
  p.product_name,
  o.order_total
FROM events e
JOIN users u ON e.user_id = u.user_id
JOIN products p ON e.product_id = p.product_id
JOIN orders o ON e.order_id = o.order_id
WHERE td_interval(e.time, '-3M', 'JST')
  AND e.event_type RLIKE 'purchase|checkout'
```

### Example 3: High Cardinality GROUP BY

**Original Trino query (memory exceeded):**
```sql
SELECT
  user_id,
  session_id,
  page_url,
  referrer,
  COUNT(*) as page_views
FROM page_views
WHERE td_interval(time, '-6M', 'JST')
GROUP BY user_id, session_id, page_url, referrer
```

**Converted to Hive (works):**
```sql
-- Same syntax, but Hive handles high cardinality better
SELECT
  user_id,
  session_id,
  page_url,
  referrer,
  COUNT(*) as page_views
FROM page_views
WHERE td_interval(time, '-6M', 'JST')
GROUP BY user_id, session_id, page_url, referrer
```

## Common Syntax Differences Summary

| Feature | Trino | Hive |
|---------|-------|------|
| Execution engine | In-memory | Tez (optimized MapReduce) |
| Time formatting | `td_time_string(time, 'd!', 'JST')` | `td_time_format(time, 'yyyy-MM-dd', 'JST')` |
| Approximate distinct | `APPROX_DISTINCT(col)` | `approx_distinct(col)` (Hivemall - compatible!) |
| Approximate percentile | `APPROX_PERCENTILE(col, 0.95)` | `PERCENTILE(col, 0.95)` |
| Array aggregation | `ARRAY_AGG(col)` | `COLLECT_LIST(col)` |
| String aggregation | `STRING_AGG(col, ',')` | `CONCAT_WS(',', COLLECT_LIST(col))` |
| Regex matching | `REGEXP_LIKE(col, 'pattern')` | `col RLIKE 'pattern'` |
| Try cast | `TRY_CAST(col AS type)` | `CAST(col AS type)` (returns NULL on failure) |
| Small table join hint | Automatic | `/*+ MAPJOIN(table) */` |

## Migration Checklist

Before converting from Trino to Hive:

- [ ] Confirm memory error or timeout in Trino
- [ ] Try Trino optimization first (time filters, column reduction, APPROX functions)
- [ ] Replace `td_time_string` with `td_time_format`
- [ ] Keep `approx_distinct` as-is (compatible via Hivemall!) or use `COUNT(DISTINCT)` for exact counts
- [ ] Replace `REGEXP_LIKE` with `RLIKE`
- [ ] Replace `ARRAY_AGG` with `COLLECT_LIST`
- [ ] Replace `STRING_AGG` with `CONCAT_WS` + `COLLECT_LIST`
- [ ] Add `/*+ MAPJOIN */` hints for small lookup tables
- [ ] Test query on small time range first
- [ ] Verify results match expected output

**Note:** TD's Hive uses Apache Tez for execution (faster than classic MapReduce) and includes Hivemall library for machine learning and approximate functions.

## Performance Tips for Hive

Once migrated to Hive, optimize with these techniques:

### 1. Use MAPJOIN for Small Tables

```sql
SELECT /*+ MAPJOIN(small_table) */ *
FROM large_table l
JOIN small_table s ON l.id = s.id
WHERE td_interval(l.time, '-1M', 'JST')
```

### 2. Enable Dynamic Partitioning

```sql
SET hive.exec.dynamic.partition = true;
SET hive.exec.dynamic.partition.mode = nonstrict;

INSERT OVERWRITE TABLE target_table PARTITION(dt)
SELECT *, td_time_format(time, 'yyyy-MM-dd', 'JST') as dt
FROM source_table
WHERE td_interval(time, '-1M', 'JST')
```

### 3. Process in Chunks for Very Large Datasets

```sql
-- Process 1 day at a time instead of entire year
INSERT INTO summary_table
SELECT ...
FROM events
WHERE td_interval(time, '-1d', 'JST')
-- Run daily, much more stable than processing full year
```

### 4. Use LIMIT During Development

```sql
-- Test logic first
SELECT ...
FROM events
WHERE td_interval(time, '-1d', 'JST')
LIMIT 1000
```

## When Migration Doesn't Help

If Hive also fails or is too slow:

1. **Break into smaller time ranges**: Process monthly instead of yearly
2. **Pre-aggregate data**: Create intermediate summary tables
3. **Reduce dimensions**: Fewer GROUP BY columns
4. **Sample data**: Use `rand() < 0.1` for 10% sample
5. **Incremental processing**: Process new data only, merge with historical

## Switching Between Engines in TD

### In TD Console:
- Change "Engine" dropdown from "Presto" to "Hive"

### In Digdag Workflows:
```yaml
# Trino
+query_trino:
  td>: queries/analysis.sql
  engine: presto  # or trino

# Hive
+query_hive:
  td>: queries/analysis.sql
  engine: hive
```

### In TD Toolbelt:
```bash
# Trino
td query -d database_name -T presto "SELECT ..."

# Hive
td query -d database_name -T hive "SELECT ..."
```

## Best Practices

1. **Start with Trino**: Try optimization first before switching to Hive
2. **Use Hive for batch jobs**: Schedule heavy processing in Hive
3. **Keep interactive queries in Trino**: Better for ad-hoc analysis
4. **Test conversions**: Verify results match between engines
5. **Document engine choice**: Note why Hive was needed (for future reference)
6. **Monitor execution**: Check Hive job progress in TD Console
7. **Set expectations**: Hive takes longer but handles larger data

## Common Issues After Migration

### Issue: Query Still Fails in Hive

**Solutions:**
- Reduce time range further
- Process incrementally (day by day)
- Reduce GROUP BY cardinality
- Use sampling for estimation

### Issue: Hive Much Slower Than Expected

**Solutions:**
- Add MAPJOIN hints for small tables
- Ensure time filters are present
- Select only needed columns
- Check if Trino optimization would work after all

### Issue: Results Different Between Trino and Hive

**Check:**
- Approximate vs exact functions
- NULL handling differences
- Timezone in time functions
- Array/string function behavior

## Examples: Memory Error Resolution

### Before (Trino - Memory Error):
```
Query exceeded per-node memory limit
```

### After (Hive - Success):
```sql
-- Same query structure, just use Hive engine
-- Typically 2-5x slower but completes successfully
```

### Typical Timeline:
- Trino: Fails after 5 minutes with memory error
- Hive: Completes in 20-30 minutes successfully

## Resources

- TD Console: Switch between engines easily
- Check query logs to see memory usage patterns
- Use EXPLAIN in both engines to understand execution plans
- Monitor long-running Hive jobs in TD Console
