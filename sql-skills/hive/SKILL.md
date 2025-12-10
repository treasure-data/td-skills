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
select * from database_name.table_name
```

### 2. Time-based Partitioning

TD Hive tables are partitioned by time. Always use time predicates:

```sql
select *
from database_name.table_name
where td_time_range(time, '2024-01-01', '2024-01-31', 'JST')
```

Unix timestamp format:
```sql
where time >= unix_timestamp('2024-01-01 00:00:00')
  and time < unix_timestamp('2024-01-02 00:00:00')
```

### 3. Performance Optimization

**Use columnar formats:**
- TD tables are typically stored in columnar format (ORC/Parquet)
- Select only needed columns to reduce I/O

**Partition pruning:**
```sql
-- Good: Uses partition columns
where td_time_range(time, '2024-01-01', '2024-01-02')

-- Good: Direct time filter
where time >= 1704067200 and time < 1704153600
```

**Limit during development:**
```sql
select * from table_name
where td_time_range(time, '2024-01-01')
limit 1000
```

### 4. Common TD Hive Functions

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

**Note:** td_interval simplifies relative time queries and is preferred over combining td_time_range with TD_DATE_TRUNC. Cannot accept TD_SCHEDULED_TIME as first argument, but including TD_SCHEDULED_TIME elsewhere in the query establishes the reference date.

**td_time_range** - Partition-aware time filtering (explicit dates):
```sql
td_time_range(time, '2024-01-01', '2024-01-31', 'JST')
td_time_range(time, '2024-01-01', null, 'JST')  -- Open-ended
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

### 5. join Optimization

**MapReduce join strategies:**

```sql
-- Map-side join for small tables (use /*+ MAPJOIN */ hint)
select /*+ MAPJOIN(small_table) */
  l.*,
  s.attribute
from large_table l
join small_table s on l.id = s.id
where td_time_range(l.time, '2024-01-01')
```

**Reduce-side join:**
```sql
-- Default for large-to-large joins
select *
from table1 t1
join table2 t2 on t1.key = t2.key
where td_time_range(t1.time, '2024-01-01')
  and td_time_range(t2.time, '2024-01-01')
```

### 6. Aggregations

**Standard aggregations:**
```sql
select
  TD_TIME_FORMAT(time, 'yyyy-MM-dd', 'JST') as date,
  count(*) as total_count,
  count(distinct user_id) as unique_users,
  avg(value) as avg_value,
  sum(amount) as total_amount
from database_name.events
where td_time_range(time, '2024-01-01', '2024-01-31')
GROUP BY TD_TIME_FORMAT(time, 'yyyy-MM-dd', 'JST')
```

**Approximate aggregations for large datasets:**
```sql
-- Not built-in, but can use sampling
select count(*) * 10 as estimated_count
from table_name
where td_time_range(time, '2024-01-01')
  and rand() < 0.1  -- 10% sample
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
  ROW_NUMBER() OVER (PARTITIon BY user_id ORDER BY event_time) as event_seq,
  LAG(event_time, 1) OVER (PARTITIon BY user_id ORDER BY event_time) as prev_event
from events
where td_time_range(time, '2024-01-01')
```

### 9. Array and Map Operations

**Array functions:**
```sql
select
  array_contains(tags, 'premium') as is_premium,
  size(tags) as tag_count,
  tags[0] as first_tag
from user_profiles
```

**Map functions:**
```sql
select
  map_keys(attributes) as attribute_names,
  map_values(attributes) as attribute_values,
  attributes['country'] as country
from events
```

## Common Patterns

### Daily Event Aggregation
```sql
select
  TD_TIME_FORMAT(time, 'yyyy-MM-dd', 'JST') as date,
  event_type,
  count(*) as event_count,
  count(distinct user_id) as unique_users
from database_name.events
where td_time_range(time, '2024-01-01', '2024-01-31', 'JST')
GROUP BY
  TD_TIME_FORMAT(time, 'yyyy-MM-dd', 'JST'),
  event_type
ORDER BY date, event_type
```

### User Segmentation
```sql
select
  case
    when purchase_count >= 10 then 'high_value'
    when purchase_count >= 5 then 'medium_value'
    else 'low_value'
  end as segment,
  count(*) as user_count,
  avg(total_spend) as avg_spend
from (
  select
    user_id,
    count(*) as purchase_count,
    sum(amount) as total_spend
  from database_name.purchases
  where td_time_range(time, '2024-01-01', '2024-01-31', 'JST')
  GROUP BY user_id
) user_stats
GROUP BY
  case
    when purchase_count >= 10 then 'high_value'
    when purchase_count >= 5 then 'medium_value'
    else 'low_value'
  end
```

### Session Analysis
```sql
select
  user_id,
  session_id,
  min(time) as session_start,
  MAX(time) as session_end,
  count(*) as events_in_session
from (
  select
    user_id,
    time,
    sum(is_new_session) OVER (
      PARTITIon BY user_id
      ORDER BY time
      ROWS BETWEEN UNBOUNDED PRECEDING and CURRENT ROW
    ) as session_id
  from (
    select
      user_id,
      time,
      case
        when time - LAG(time) OVER (PARTITIon BY user_id ORDER BY time) > 1800
          OR LAG(time) OVER (PARTITIon BY user_id ORDER BY time) IS null
        then 1
        else 0
      end as is_new_session
    from database_name.events
    where td_time_range(time, '2024-01-01', '2024-01-02', 'JST')
  ) with_session_flag
) with_session_id
GROUP BY user_id, session_id
```

### Cohort Analysis
```sql
WITH first_purchase AS (
  select
    user_id,
    TD_TIME_FORMAT(min(time), 'yyyy-MM', 'JST') as cohort_month
  from database_name.purchases
  where td_time_range(time, '2024-01-01', null, 'JST')
  GROUP BY user_id
),
monthly_purchases AS (
  select
    user_id,
    TD_TIME_FORMAT(time, 'yyyy-MM', 'JST') as purchase_month,
    sum(amount) as monthly_spend
  from database_name.purchases
  where td_time_range(time, '2024-01-01', null, 'JST')
  GROUP BY user_id, TD_TIME_FORMAT(time, 'yyyy-MM', 'JST')
)
select
  f.cohort_month,
  m.purchase_month,
  count(distinct m.user_id) as active_users,
  sum(m.monthly_spend) as total_spend
from first_purchase f
join monthly_purchases m on f.user_id = m.user_id
GROUP BY f.cohort_month, m.purchase_month
ORDER BY f.cohort_month, m.purchase_month
```

## Hive-Specific Features

### SerDe (Serializer/Deserializer)

When working with JSon data:
```sql
-- Usually handled automatically in TD, but awareness is important
-- JSon SerDe allows querying nested JSon structures
select
  get_json_object(json_column, '$.user.id') as user_id,
  get_json_object(json_column, '$.event.type') as event_type
from raw_events
```

### lateral view with explode

Flatten arrays:
```sql
select
  user_id,
  tag
from user_profiles
lateral view explode(tags) tags_table AS tag
where td_time_range(time, '2024-01-01')
```

Multiple lateral views:
```sql
select
  user_id,
  tag,
  category
from user_profiles
lateral view explode(tags) tags_table AS tag
lateral view explode(categories) cat_table AS category
```

### Dynamic Partitioning

When creating tables (less common in TD):
```sql
SET hive.exec.dynamic.partition = true;
SET hive.exec.dynamic.partition.mode = nonstrict;

INSERT OVERWRITE TABLE target_table PARTITIon(dt)
select *, TD_TIME_FORMAT(time, 'yyyy-MM-dd', 'JST') as dt
from source_table
where td_time_range(time, '2024-01-01', '2024-01-31')
```

## Error Handling

### Common Errors

**"FAILED: SemanticException Column time does not exist"**
- Check table schema
- Ensure table name is correct

**"OutOfMemoryError: Java heap space"**
- Reduce time range in query
- Use limit for testing
- Optimize joins (use MAPJOIN hint for small tables)

**"Too many dynamic partitions"**
- Reduce partition count
- Check dynamic partition settings

**"Expression not in GROUP BY key"**
- All non-aggregated columns must be in GROUP BY
- Or use aggregate functions (MAX, min, etc.)

## Best Practices

1. **Always use time filters** with td_time_range or direct time comparisons
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
3. **Add time filters** - Always include td_time_range
4. **Write base query** - Start simple
5. **Add transformations** - Aggregations, joins, etc.
6. **Optimize** - Use MAPJOIN hints, select only needed columns
7. **Test** - Run on small dataset first
8. **Scale** - Extend to full time range

## Resources

- Hive documentation: https://cwiki.apache.org/confluence/display/Hive
- TD Hive functions: Check internal TD documentation
- Consider migrating to Trino for better performance
