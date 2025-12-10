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
select *
from database_name.table_name
where td_time_range(time, '2024-01-01', '2024-01-31')
```

Or use relative time ranges:
```sql
where td_time_range(time, td_time_add(td_scheduled_time(), '-7d'), td_scheduled_time())
```

### 3. Performance Optimization

**Use APPROX functions for large datasets:**
```sql
select
  approx_distinct(user_id) as unique_users,
  approx_percentile(response_time, 0.95) as p95_response
from database_name.events
where td_time_range(time, '2024-01-01')
```

**Partition pruning:**
```sql
-- Good: Filters on partition column
where td_time_range(time, '2024-01-01', '2024-01-02')

-- Avoid: Non-partition column filters without time filter
where event_type = 'click'  -- Missing time filter!
```

**Limit data scanned:**
```sql
-- Use LIMIT for exploratory queries
select * from table_name
where td_time_range(time, '2024-01-01')
LIMIT 1000
```

### 4. Common TD Functions

**td_interval** - Simplified relative time filtering (Recommended):
```sql
-- Current day
where td_interval(time, '1d', 'JST')

-- Yesterday
where td_interval(time, '-1d', 'JST')

-- Previous week
where td_interval(time, '-1w', 'JST')

-- Previous month
where td_interval(time, '-1M', 'JST')

-- 2 days ago (offset syntax)
where td_interval(time, '-1d/-1d', 'JST')

-- 3 months ago (combined offset)
where td_interval(time, '-1M/-2M', 'JST')
```

**Note:** td_interval simplifies relative time queries and is preferred over combining td_time_range with TD_DATE_TRUNC. Cannot accept td_scheduled_time as first argument, but including td_scheduled_time elsewhere in the query establishes the reference date.

**td_time_range** - Filter by time partitions (explicit dates):
```sql
td_time_range(time, '2024-01-01', '2024-01-31')
td_time_range(time, '2024-01-01')  -- Single day
```

**td_scheduled_time()** - Get scheduled execution time:
```sql
td_time_add(td_scheduled_time(), '-1d')  -- Yesterday
```

**td_time_string** - Format timestamps (Recommended):
```sql
-- Uses simple format codes instead of full format strings
td_time_string(time, 'd!', 'JST')     -- Returns: 2018-09-13
td_time_string(time, 's!', 'UTC')     -- Returns: 2018-09-13 16:45:34
td_time_string(time, 'M!', 'JST')     -- Returns: 2018-09 (year-month)
td_time_string(time, 'h!', 'UTC')     -- Returns: 2018-09-13 16 (year-month-day hour)

-- With timezone in output (without ! suffix)
td_time_string(time, 'd', 'JST')      -- Returns: 2018-09-13 00:00:00+0900
td_time_string(time, 's', 'UTC')      -- Returns: 2018-09-13 16:45:34+0000
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

**td_time_format** - Format timestamps (Legacy, use td_time_string instead):
```sql
td_time_format(time, 'yyyy-MM-dd HH:mm:ss', 'UTC')
```

**td_sessionize** - Sessionize events:
```sql
select td_sessionize(time, 1800, user_id) as session_id
from events
```

### 5. JOIN Optimization

**Put smaller table on the right side:**
```sql
-- Good
select *
from large_table l
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
select
  user_id,
  event_time,
  ROW_NUMBER() OVER (PARTITION BY user_id order by event_time) as event_seq,
  LAG(event_time) OVER (PARTITION BY user_id order by event_time) as prev_event
from events
where td_time_range(time, '2024-01-01')
```

## Common Patterns

### User Event Analysis
```sql
-- Using td_interval for last month
select
  td_time_string(time, 'd!', 'JST') as date,
  event_type,
  count(*) as event_count,
  approx_distinct(user_id) as unique_users
from database_name.events
where td_interval(time, '-1M', 'JST')
  AND event_type IN ('page_view', 'click', 'purchase')
group by 1, 2
order by 1, 2
```

**Alternative with explicit date range:**
```sql
select
  td_time_string(time, 'd!', 'JST') as date,
  event_type,
  count(*) as event_count,
  approx_distinct(user_id) as unique_users
from database_name.events
where td_time_range(time, '2024-01-01', '2024-01-31')
  AND event_type IN ('page_view', 'click', 'purchase')
group by 1, 2
order by 1, 2
```

### Conversion Funnel
```sql
WITH events_filtered AS (
  select
    user_id,
    event_type,
    time
  from database_name.events
  where td_time_range(time, '2024-01-01', '2024-01-31')
)
select
  count(distinct CASE WHEN event_type = 'page_view' THEN user_id END) as step1_users,
  count(distinct CASE WHEN event_type = 'add_to_cart' THEN user_id END) as step2_users,
  count(distinct CASE WHEN event_type = 'purchase' THEN user_id END) as step3_users
from events_filtered
```

### Daily Aggregation
```sql
-- Using td_interval for yesterday's data
select
  td_time_string(time, 'd!', 'JST') as date,
  count(*) as total_events,
  approx_distinct(user_id) as daily_active_users,
  avg(session_duration) as avg_session_duration
from database_name.events
where td_interval(time, '-1d', 'JST')
  AND td_scheduled_time() IS NOT NULL  -- Establishes reference date for td_interval
group by 1
order by 1
```

**For rolling 30-day window:**
```sql
select
  td_time_string(time, 'd!', 'JST') as date,
  count(*) as total_events,
  approx_distinct(user_id) as daily_active_users,
  avg(session_duration) as avg_session_duration
from database_name.events
where td_time_range(time, td_time_add(td_scheduled_time(), '-30d'), td_scheduled_time())
group by 1
order by 1
```

## Error Handling

### Common Errors

**"Line X:Y: Column 'time' cannot be resolved"**
- Ensure table name is correct
- Check that column exists in table schema

**"Query exceeded memory limit"**
- Add time filters with td_time_range
- Use approx_ functions instead of exact aggregations
- Reduce JOIN complexity or data volume

**"Partition not found"**
- Verify time range covers existing partitions
- Check td_time_range syntax

## Best Practices

1. **Always include time filters** using td_interval or td_time_range for partition pruning
   - Use td_interval for relative dates: `where td_interval(time, '-1d', 'JST')`
   - Use td_time_range for explicit dates: `where td_time_range(time, '2024-01-01', '2024-01-31')`
   - Never filter by formatted dates: ❌ `where td_time_string(time, 'd!', 'JST') = '2024-01-01'`
2. **Use td_time_string for display only**, not for filtering
   - ✅ `select td_time_string(time, 'd!', 'JST') as date`
   - ❌ `where td_time_string(time, 'd!', 'JST') = '2024-01-01'`
3. **Use APPROX functions** for large-scale aggregations (approx_distinct, approx_percentile)
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
4. **Write base query** - Start with simple select
5. **Add aggregations** - Use appropriate functions
6. **Optimize** - Apply performance best practices
7. **Test** - Validate results on small dataset first

## Resources

- Trino SQL documentation: https://trino.io/docs/current/
- TD-specific functions: Check internal TD documentation
- Query performance: Use EXPLAIN for query plans
