---
name: hive
description: Expert assistance for writing, analyzing, and optimizing Hive SQL queries for Treasure Data. Use this skill when users need help with Hive queries, MapReduce optimization, or legacy TD Hive workflows.
---

# Hive SQL Expert

Expert assistance for writing and optimizing Hive SQL queries for Treasure Data environments.

## When to Use This Skill

Use this skill when:
- Writing Hive SQL queries for TD
- Maintaining or updating legacy Hive workflows
- Optimizing Hive query performance
- Converting queries to/from Hive dialect
- Working with Hive-specific features (SerDes, UDFs, etc.)

## Core Principles

### 1. TD Table Access

Access TD tables using database.table notation:
```sql
select * FROM database_name.table_name
```

### 2. Time-based Partitioning

TD Hive tables are partitioned by time. Always use time predicates:

```sql
select *
FROM database_name.table_name
WHERE TD_TIME_RANGE(time, '2024-01-01', '2024-01-31', 'JST')
```

Unix timestamp format:
```sql
WHERE time >= unix_timestamp('2024-01-01 00:00:00')
  AND time < unix_timestamp('2024-01-02 00:00:00')
```

### 3. Performance Optimization

**Use columnar formats:**
- TD tables are typically stored in columnar format (ORC/Parquet)
- Select only needed columns to reduce I/O

**Partition pruning:**
```sql
-- Good: Uses partition columns
WHERE TD_TIME_RANGE(time, '2024-01-01', '2024-01-02')

-- Good: Direct time filter
WHERE time >= 1704067200 AND time < 1704153600
```

**Limit during development:**
```sql
select * FROM table_name
WHERE TD_TIME_RANGE(time, '2024-01-01')
LIMIT 1000
```

### 4. Common TD Hive Functions

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

**TD_TIME_RANGE** - Partition-aware time filtering (explicit dates):
```sql
TD_TIME_RANGE(time, '2024-01-01', '2024-01-31', 'JST')
TD_TIME_RANGE(time, '2024-01-01', NULL, 'JST')  -- Open-ended
```

**TD_SCHEDULED_TIME()** - Get workflow execution time:
```sql
select TD_SCHEDULED_TIME()
-- Returns Unix timestamp of scheduled run
```

**TD_TIME_FORMAT** - Format Unix timestamps:
```sql
select TD_TIME_FORMAT(time, 'yyyy-MM-dd HH:mm:ss', 'JST')
```

**TD_TIME_PARSE** - Parse string to Unix timestamp:
```sql
select TD_TIME_PARSE('2024-01-01', 'JST')
```

**TD_DATE_TRUNC** - Truncate timestamp to day/hour/etc:
```sql
select TD_DATE_TRUNC('day', time, 'JST')
select TD_DATE_TRUNC('hour', time, 'UTC')
```

### 5. JOIN Optimization

**MapReduce JOIN strategies:**

```sql
-- Map-side JOIN for small tables (use /*+ MAPJOIN */ hint)
select /*+ MAPJOIN(small_table) */
  l.*,
  s.attribute
FROM large_table l
JOIN small_table s ON l.id = s.id
WHERE TD_TIME_RANGE(l.time, '2024-01-01')
```

**Reduce-side JOIN:**
```sql
-- Default for large-to-large joins
select *
FROM table1 t1
JOIN table2 t2 ON t1.key = t2.key
WHERE TD_TIME_RANGE(t1.time, '2024-01-01')
  AND TD_TIME_RANGE(t2.time, '2024-01-01')
```

### 6. Aggregations

**Standard aggregations:**
```sql
select
  TD_TIME_FORMAT(time, 'yyyy-MM-dd', 'JST') as date,
  COUNT(*) as total_count,
  COUNT(DISTINCT user_id) as unique_users,
  AVG(value) as avg_value,
  SUM(amount) as total_amount
FROM database_name.events
WHERE TD_TIME_RANGE(time, '2024-01-01', '2024-01-31')
GROUP BY TD_TIME_FORMAT(time, 'yyyy-MM-dd', 'JST')
```

**Approximate aggregations for large datasets:**
```sql
-- Not built-in, but can use sampling
select COUNT(*) * 10 as estimated_count
FROM table_name
WHERE TD_TIME_RANGE(time, '2024-01-01')
  AND rand() < 0.1  -- 10% sample
```

### 7. Data Types and Casting

Hive type casting:
```sql
CAST(column_name AS BIGINT)
CAST(column_name AS STRING)
CAST(column_name AS DOUBLE)
CAST(column_name AS DECIMAL(10,2))
```

### 8. Window Functions

```sql
select
  user_id,
  event_time,
  ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY event_time) as event_seq,
  LAG(event_time, 1) OVER (PARTITION BY user_id ORDER BY event_time) as prev_event
FROM events
WHERE TD_TIME_RANGE(time, '2024-01-01')
```

### 9. Array and Map Operations

**Array functions:**
```sql
select
  array_contains(tags, 'premium') as is_premium,
  size(tags) as tag_count,
  tags[0] as first_tag
FROM user_profiles
```

**Map functions:**
```sql
select
  map_keys(attributes) as attribute_names,
  map_values(attributes) as attribute_values,
  attributes['country'] as country
FROM events
```

## Common Patterns

### Daily Event Aggregation
```sql
select
  TD_TIME_FORMAT(time, 'yyyy-MM-dd', 'JST') as date,
  event_type,
  COUNT(*) as event_count,
  COUNT(DISTINCT user_id) as unique_users
FROM database_name.events
WHERE TD_TIME_RANGE(time, '2024-01-01', '2024-01-31', 'JST')
GROUP BY
  TD_TIME_FORMAT(time, 'yyyy-MM-dd', 'JST'),
  event_type
ORDER BY date, event_type
```

### User Segmentation
```sql
select
  CASE
    WHEN purchase_count >= 10 THEN 'high_value'
    WHEN purchase_count >= 5 THEN 'medium_value'
    ELSE 'low_value'
  END as segment,
  COUNT(*) as user_count,
  AVG(total_spend) as avg_spend
FROM (
  select
    user_id,
    COUNT(*) as purchase_count,
    SUM(amount) as total_spend
  FROM database_name.purchases
  WHERE TD_TIME_RANGE(time, '2024-01-01', '2024-01-31', 'JST')
  GROUP BY user_id
) user_stats
GROUP BY
  CASE
    WHEN purchase_count >= 10 THEN 'high_value'
    WHEN purchase_count >= 5 THEN 'medium_value'
    ELSE 'low_value'
  END
```

### Session Analysis
```sql
select
  user_id,
  session_id,
  MIN(time) as session_start,
  MAX(time) as session_end,
  COUNT(*) as events_in_session
FROM (
  select
    user_id,
    time,
    SUM(is_new_session) OVER (
      PARTITION BY user_id
      ORDER BY time
      ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    ) as session_id
  FROM (
    select
      user_id,
      time,
      CASE
        WHEN time - LAG(time) OVER (PARTITION BY user_id ORDER BY time) > 1800
          OR LAG(time) OVER (PARTITION BY user_id ORDER BY time) IS NULL
        THEN 1
        ELSE 0
      END as is_new_session
    FROM database_name.events
    WHERE TD_TIME_RANGE(time, '2024-01-01', '2024-01-02', 'JST')
  ) with_session_flag
) with_session_id
GROUP BY user_id, session_id
```

### Cohort Analysis
```sql
WITH first_purchase AS (
  select
    user_id,
    TD_TIME_FORMAT(MIN(time), 'yyyy-MM', 'JST') as cohort_month
  FROM database_name.purchases
  WHERE TD_TIME_RANGE(time, '2024-01-01', NULL, 'JST')
  GROUP BY user_id
),
monthly_purchases AS (
  select
    user_id,
    TD_TIME_FORMAT(time, 'yyyy-MM', 'JST') as purchase_month,
    SUM(amount) as monthly_spend
  FROM database_name.purchases
  WHERE TD_TIME_RANGE(time, '2024-01-01', NULL, 'JST')
  GROUP BY user_id, TD_TIME_FORMAT(time, 'yyyy-MM', 'JST')
)
select
  f.cohort_month,
  m.purchase_month,
  COUNT(DISTINCT m.user_id) as active_users,
  SUM(m.monthly_spend) as total_spend
FROM first_purchase f
JOIN monthly_purchases m ON f.user_id = m.user_id
GROUP BY f.cohort_month, m.purchase_month
ORDER BY f.cohort_month, m.purchase_month
```

## Hive-Specific Features

### SerDe (Serializer/Deserializer)

When working with JSON data:
```sql
-- Usually handled automatically in TD, but awareness is important
-- JSON SerDe allows querying nested JSON structures
select
  get_json_object(json_column, '$.user.id') as user_id,
  get_json_object(json_column, '$.event.type') as event_type
FROM raw_events
```

### LATERAL VIEW with EXPLODE

Flatten arrays:
```sql
select
  user_id,
  tag
FROM user_profiles
LATERAL VIEW EXPLODE(tags) tags_table AS tag
WHERE TD_TIME_RANGE(time, '2024-01-01')
```

Multiple LATERAL VIEWs:
```sql
select
  user_id,
  tag,
  category
FROM user_profiles
LATERAL VIEW EXPLODE(tags) tags_table AS tag
LATERAL VIEW EXPLODE(categories) cat_table AS category
```

### Dynamic Partitioning

When creating tables (less common in TD):
```sql
SET hive.exec.dynamic.partition = true;
SET hive.exec.dynamic.partition.mode = nonstrict;

INSERT OVERWRITE TABLE target_table PARTITION(dt)
select *, TD_TIME_FORMAT(time, 'yyyy-MM-dd', 'JST') as dt
FROM source_table
WHERE TD_TIME_RANGE(time, '2024-01-01', '2024-01-31')
```

## Error Handling

### Common Errors

**"FAILED: SemanticException Column time does not exist"**
- Check table schema
- Ensure table name is correct

**"OutOfMemoryError: Java heap space"**
- Reduce time range in query
- Use LIMIT for testing
- Optimize JOINs (use MAPJOIN hint for small tables)

**"Too many dynamic partitions"**
- Reduce partition count
- Check dynamic partition settings

**"Expression not in GROUP BY key"**
- All non-aggregated columns must be in GROUP BY
- Or use aggregate functions (MAX, MIN, etc.)

## Best Practices

1. **Always use time filters** with TD_TIME_RANGE or direct time comparisons
2. **Select only needed columns** to reduce I/O
3. **Use MAPJOIN hint** for small table joins
4. **Test on small time ranges** before full runs
5. **Use appropriate timezone** (JST for Japan data)
6. **Avoid select *** in production queries
7. **Use CTEs (WITH clauses)** for complex queries
8. **Consider data volume** - Hive is batch-oriented
9. **Monitor query progress** in TD console
10. **Add comments** explaining business logic

## Migration Notes: Hive to Trino

When migrating from Hive to Trino:
- Most syntax is compatible
- Trino is generally faster for interactive queries
- Some Hive UDFs may need replacement
- Window functions syntax is similar
- Approximate functions (APPROX_*) are more efficient in Trino

## Example Workflow

When helping users write Hive queries:

1. **Understand requirements** - What analysis is needed?
2. **Identify tables** - Which TD tables to query?
3. **Add time filters** - Always include TD_TIME_RANGE
4. **Write base query** - Start simple
5. **Add transformations** - Aggregations, JOINs, etc.
6. **Optimize** - Use MAPJOIN hints, select only needed columns
7. **Test** - Run on small dataset first
8. **Scale** - Extend to full time range

## Resources

- Hive documentation: https://cwiki.apache.org/confluence/display/Hive
- TD Hive functions: Check internal TD documentation
- Consider migrating to Trino for better performance
