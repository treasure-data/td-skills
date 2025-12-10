---
name: trino
description: Expert assistance for writing, analyzing, and optimizing Trino SQL queries for Treasure Data. Use this skill when users need help with Trino queries, performance optimization, or TD-specific SQL patterns.
---

# Trino SQL Expert

Expert assistance for writing and optimizing Trino SQL queries for Treasure Data environments.

## When to Use This Skill

Use this skill when:
- Writing new Trino SQL queries for TD
- Optimizing existing Trino queries for performance
- Debugging Trino query errors or issues
- Converting queries from other SQL dialects to Trino
- Implementing TD best practices for data processing

## Core Principles

### 1. TD Table Naming Conventions

Always use the TD table format:
```sql
select * from database_name.table_name
```

### 2. Partitioning and Time-based Queries

TD tables are typically partitioned by time. Always include time filters for performance:

```sql
SELECT *
FROM database_name.table_name
WHERE TD_TIME_RANGE(time, '2024-01-01', '2024-01-31')
```

Or use relative time ranges:
```sql
WHERE TD_TIME_RANGE(time, TD_TIME_ADD(TD_SCHEDULED_TIME(), '-7d'), TD_SCHEDULED_TIME())
```

### 3. Performance Optimization

**Use APPROX functions for large datasets:**
```sql
SELECT
  APPROX_DISTINCT(user_id) as unique_users,
  APPROX_PERCENTILE(response_time, 0.95) as p95_response
FROM database_name.events
WHERE TD_TIME_RANGE(time, '2024-01-01')
```

**Partition pruning:**
```sql
-- Good: Filters on partition column
WHERE TD_TIME_RANGE(time, '2024-01-01', '2024-01-02')

-- Avoid: Non-partition column filters without time filter
WHERE event_type = 'click'  -- Missing time filter!
```

**Limit data scanned:**
```sql
-- Use LIMIT for exploratory queries
SELECT * FROM table_name
WHERE TD_TIME_RANGE(time, '2024-01-01')
LIMIT 1000
```

### 4. Common TD Functions

**TD_INTERVAL** - Simplified relative time filtering (Recommended):
```sql
-- Current day
WHERE TD_INTERVAL(time, '1d', 'JST')

-- Yesterday
WHERE TD_INTERVAL(time, '-1d', 'JST')

-- Previous week
WHERE TD_INTERVAL(time, '-1w', 'JST')

-- Previous month
WHERE TD_INTERVAL(time, '-1M', 'JST')

-- 2 days ago (offset syntax)
WHERE TD_INTERVAL(time, '-1d/-1d', 'JST')

-- 3 months ago (combined offset)
WHERE TD_INTERVAL(time, '-1M/-2M', 'JST')
```

**Note:** TD_INTERVAL simplifies relative time queries and is preferred over combining TD_TIME_RANGE with TD_DATE_TRUNC. Cannot accept TD_SCHEDULED_TIME as first argument, but including TD_SCHEDULED_TIME elsewhere in the query establishes the reference date.

**TD_TIME_RANGE** - Filter by time partitions (explicit dates):
```sql
TD_TIME_RANGE(time, '2024-01-01', '2024-01-31')
TD_TIME_RANGE(time, '2024-01-01')  -- Single day
```

**TD_SCHEDULED_TIME()** - Get scheduled execution time:
```sql
TD_TIME_ADD(TD_SCHEDULED_TIME(), '-1d')  -- Yesterday
```

**TD_TIME_STRING** - Format timestamps (Recommended):
```sql
-- Uses simple format codes instead of full format strings
TD_TIME_STRING(time, 'd!', 'JST')     -- Returns: 2018-09-13
TD_TIME_STRING(time, 's!', 'UTC')     -- Returns: 2018-09-13 16:45:34
TD_TIME_STRING(time, 'M!', 'JST')     -- Returns: 2018-09 (year-month)
TD_TIME_STRING(time, 'h!', 'UTC')     -- Returns: 2018-09-13 16 (year-month-day hour)

-- With timezone in output (without ! suffix)
TD_TIME_STRING(time, 'd', 'JST')      -- Returns: 2018-09-13 00:00:00+0900
TD_TIME_STRING(time, 's', 'UTC')      -- Returns: 2018-09-13 16:45:34+0000
```

**Format codes:**
- `y!` = yyyy (year only)
- `q!` = yyyy-MM (quarter start)
- `M!` = yyyy-MM (month)
- `w!` = yyyy-MM-dd (week start)
- `d!` = yyyy-MM-dd (day)
- `h!` = yyyy-MM-dd HH (hour)
- `m!` = yyyy-MM-dd HH:mm (minute)
- `s!` = yyyy-MM-dd HH:mm:ss (second)
- Without the exclamation mark suffix, timezone offset is included

**TD_TIME_FORMAT** - Format timestamps (Legacy, use TD_TIME_STRING instead):
```sql
TD_TIME_FORMAT(time, 'yyyy-MM-dd HH:mm:ss', 'UTC')
```

**TD_SESSIONIZE** - Sessionize events:
```sql
SELECT TD_SESSIONIZE(time, 1800, user_id) as session_id
FROM events
```

### 5. JOIN Optimization

**Put smaller table on the right side:**
```sql
-- Good
SELECT *
FROM large_table l
JOIN small_table s ON l.id = s.id

-- Consider table size when joining
```

**Use appropriate JOIN types:**
```sql
-- INNER JOIN for matching records only
-- LEFT JOIN when you need all records from left table
-- Avoid FULL OUTER JOIN when possible (expensive)
```

### 6. Data Types and Casting

Be explicit with data types:
```sql
CAST(column_name AS BIGINT)
CAST(column_name AS VARCHAR)
CAST(column_name AS DOUBLE)
TRY_CAST(column_name AS BIGINT)  -- Returns NULL on failure
```

### 7. Window Functions

```sql
SELECT
  user_id,
  event_time,
  ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY event_time) as event_seq,
  LAG(event_time) OVER (PARTITION BY user_id ORDER BY event_time) as prev_event
FROM events
WHERE TD_TIME_RANGE(time, '2024-01-01')
```

## Common Patterns

### User Event Analysis
```sql
-- Using TD_INTERVAL for last month
SELECT
  TD_TIME_STRING(time, 'd!', 'JST') as date,
  event_type,
  COUNT(*) as event_count,
  APPROX_DISTINCT(user_id) as unique_users
FROM database_name.events
WHERE TD_INTERVAL(time, '-1M', 'JST')
  AND event_type IN ('page_view', 'click', 'purchase')
GROUP BY 1, 2
ORDER BY 1, 2
```

**Alternative with explicit date range:**
```sql
SELECT
  TD_TIME_STRING(time, 'd!', 'JST') as date,
  event_type,
  COUNT(*) as event_count,
  APPROX_DISTINCT(user_id) as unique_users
FROM database_name.events
WHERE TD_TIME_RANGE(time, '2024-01-01', '2024-01-31')
  AND event_type IN ('page_view', 'click', 'purchase')
GROUP BY 1, 2
ORDER BY 1, 2
```

### Conversion Funnel
```sql
WITH events_filtered AS (
  SELECT
    user_id,
    event_type,
    time
  FROM database_name.events
  WHERE TD_TIME_RANGE(time, '2024-01-01', '2024-01-31')
)
SELECT
  COUNT(DISTINCT CASE WHEN event_type = 'page_view' THEN user_id END) as step1_users,
  COUNT(DISTINCT CASE WHEN event_type = 'add_to_cart' THEN user_id END) as step2_users,
  COUNT(DISTINCT CASE WHEN event_type = 'purchase' THEN user_id END) as step3_users
FROM events_filtered
```

### Daily Aggregation
```sql
-- Using TD_INTERVAL for yesterday's data
SELECT
  TD_TIME_STRING(time, 'd!', 'JST') as date,
  COUNT(*) as total_events,
  APPROX_DISTINCT(user_id) as daily_active_users,
  AVG(session_duration) as avg_session_duration
FROM database_name.events
WHERE TD_INTERVAL(time, '-1d', 'JST')
  AND TD_SCHEDULED_TIME() IS NOT NULL  -- Establishes reference date for TD_INTERVAL
GROUP BY 1
ORDER BY 1
```

**For rolling 30-day window:**
```sql
SELECT
  TD_TIME_STRING(time, 'd!', 'JST') as date,
  COUNT(*) as total_events,
  APPROX_DISTINCT(user_id) as daily_active_users,
  AVG(session_duration) as avg_session_duration
FROM database_name.events
WHERE TD_TIME_RANGE(time, TD_TIME_ADD(TD_SCHEDULED_TIME(), '-30d'), TD_SCHEDULED_TIME())
GROUP BY 1
ORDER BY 1
```

## Error Handling

### Common Errors

**"Line X:Y: Column 'time' cannot be resolved"**
- Ensure table name is correct
- Check that column exists in table schema

**"Query exceeded memory limit"**
- Add time filters with TD_TIME_RANGE
- Use APPROX_ functions instead of exact aggregations
- Reduce JOIN complexity or data volume

**"Partition not found"**
- Verify time range covers existing partitions
- Check TD_TIME_RANGE syntax

## Best Practices

1. **Always include time filters** using TD_INTERVAL or TD_TIME_RANGE for partition pruning
   - Use TD_INTERVAL for relative dates: `WHERE TD_INTERVAL(time, '-1d', 'JST')`
   - Use TD_TIME_RANGE for explicit dates: `WHERE TD_TIME_RANGE(time, '2024-01-01', '2024-01-31')`
   - Never filter by formatted dates: ❌ `WHERE TD_TIME_STRING(time, 'd!', 'JST') = '2024-01-01'`
2. **Use TD_TIME_STRING for display only**, not for filtering
   - ✅ `SELECT TD_TIME_STRING(time, 'd!', 'JST') as date`
   - ❌ `WHERE TD_TIME_STRING(time, 'd!', 'JST') = '2024-01-01'`
3. **Use APPROX functions** for large-scale aggregations (APPROX_DISTINCT, APPROX_PERCENTILE)
4. **Limit exploratory queries** to reduce costs and scan time
5. **Test queries on small time ranges** before running on full dataset
6. **Use CTEs (WITH clauses)** for complex queries to improve readability
7. **Add comments** explaining business logic
8. **Consider materialized results** for frequently-run queries

## Example Workflow

When helping users write Trino queries:

1. **Understand the requirement** - What data do they need?
2. **Identify tables** - Which TD tables contain the data?
3. **Add time filters** - What time range is needed?
4. **Write base query** - Start with simple SELECT
5. **Add aggregations** - Use appropriate functions
6. **Optimize** - Apply performance best practices
7. **Test** - Validate results on small dataset first

## Resources

- Trino SQL documentation: https://trino.io/docs/current/
- TD-specific functions: Check internal TD documentation
- Query performance: Use EXPLAIN for query plans
