---
name: time-filtering
description: Time-based filtering patterns for Treasure Data using TD_INTERVAL and TD_TIME_RANGE functions. Covers relative time filtering (yesterday, last 7 days), absolute time ranges, timezone handling (UTC/JST), and partition pruning for performance. Use when writing queries with time-based WHERE clauses or troubleshooting slow queries on time-series data.
---

# TD Time Filtering - Partition Pruning and Performance

Expert guidance for time-based filtering in Treasure Data using `TD_INTERVAL` and `TD_TIME_RANGE` functions for optimal partition pruning and query performance.

## When to Use This Skill

Use this skill when:
- Writing queries with time-based filters on TD tables
- Optimizing slow queries on time-series data
- Working with timezone-specific data (JST for Japan, UTC for global)
- Implementing relative time filters (yesterday, last 7 days, last month)
- Troubleshooting partition pruning issues

## Core Concepts

### The `time` Column

TD tables have a special `time` column:
- **Unix timestamp** (integer seconds since 1970-01-01 00:00:00 UTC)
- **Automatically indexed** for partition pruning
- **Required for performance** on large tables

```sql
-- time column contains values like: 1735689600 (2025-01-01 00:00:00 UTC)
SELECT time, FROM_UNIXTIME(time) AS datetime
FROM mydb.events
LIMIT 1
```

### Why Time Filtering Matters

**Without time filter** (scans all data):
```sql
-- BAD: Scans entire table
SELECT COUNT(*) FROM mydb.events WHERE status = 'completed'
```

**With time filter** (partition pruning):
```sql
-- GOOD: Only scans last 7 days of data
SELECT COUNT(*)
FROM mydb.events
WHERE TD_INTERVAL(time, '-7d')
  AND status = 'completed'
```

## TD_INTERVAL: Relative Time Filtering

### Basic Syntax

```sql
TD_INTERVAL(time, 'interval'[, 'timezone'])
```

- `time`: The time column
- `interval`: Relative time string (e.g., '-1d', '-7d', '-1M')
- `timezone`: Optional, defaults to UTC

### Common Patterns

**Yesterday's data**:
```sql
SELECT * FROM mydb.events
WHERE TD_INTERVAL(time, '-1d')
```

**Last 7 days**:
```sql
SELECT * FROM mydb.events
WHERE TD_INTERVAL(time, '-7d')
```

**Last 30 days**:
```sql
SELECT * FROM mydb.events
WHERE TD_INTERVAL(time, '-30d')
```

**Last 3 months**:
```sql
SELECT * FROM mydb.events
WHERE TD_INTERVAL(time, '-3M')
```

**Last hour**:
```sql
SELECT * FROM mydb.events
WHERE TD_INTERVAL(time, '-1h')
```

### Interval Units

- `s` - seconds
- `m` - minutes
- `h` - hours
- `d` - days
- `M` - months
- `y` - years

### Timezone Handling

**UTC (default)**:
```sql
-- These are equivalent
WHERE TD_INTERVAL(time, '-1d')
WHERE TD_INTERVAL(time, '-1d', 'UTC')
```

**JST (Japan Standard Time)**:
```sql
-- Yesterday in JST (9 hours ahead of UTC)
WHERE TD_INTERVAL(time, '-1d', 'JST')
```

**Other timezones**:
```sql
WHERE TD_INTERVAL(time, '-1d', 'America/Los_Angeles')
WHERE TD_INTERVAL(time, '-1d', 'Europe/London')
```

### With TD_SCHEDULED_TIME

For scheduled workflows, use `TD_SCHEDULED_TIME()` as reference:

```sql
-- Yesterday relative to workflow schedule time
SELECT * FROM mydb.events
WHERE TD_INTERVAL(time, '-1d', 'JST', TD_SCHEDULED_TIME())
```

## TD_TIME_RANGE: Absolute Time Filtering

### Basic Syntax

```sql
TD_TIME_RANGE(time, 'start', 'end'[, 'timezone'])
```

- `time`: The time column
- `start`: Start date/time (inclusive)
- `end`: End date/time (exclusive)
- `timezone`: Optional, defaults to UTC

### Common Patterns

**Specific month**:
```sql
SELECT * FROM mydb.events
WHERE TD_TIME_RANGE(time, '2025-01-01', '2025-02-01')
```

**Specific date**:
```sql
SELECT * FROM mydb.events
WHERE TD_TIME_RANGE(time, '2025-01-15', '2025-01-16')
```

**Date range**:
```sql
SELECT * FROM mydb.events
WHERE TD_TIME_RANGE(time, '2025-01-01', '2025-01-31')
```

**With time component**:
```sql
SELECT * FROM mydb.events
WHERE TD_TIME_RANGE(time,
  '2025-01-15 09:00:00',
  '2025-01-15 17:00:00'
)
```

**NULL for open-ended**:
```sql
-- All data from 2025-01-01 onwards
SELECT * FROM mydb.events
WHERE TD_TIME_RANGE(time, '2025-01-01', NULL)

-- All data before 2025-01-01
SELECT * FROM mydb.events
WHERE TD_TIME_RANGE(time, NULL, '2025-01-01')
```

### Timezone with TD_TIME_RANGE

**UTC (default)**:
```sql
WHERE TD_TIME_RANGE(time, '2025-01-01', '2025-02-01')
```

**JST**:
```sql
-- January 2025 in JST
WHERE TD_TIME_RANGE(time, '2025-01-01', '2025-02-01', 'JST')
```

## Choosing Between TD_INTERVAL and TD_TIME_RANGE

### Use TD_INTERVAL when:
- Filtering relative to current time or scheduled time
- Writing reusable queries ("last 7 days" works any time)
- Building dashboards with rolling time windows
- Working with scheduled workflows

**Example**: Daily report showing last 7 days
```sql
SELECT DATE(FROM_UNIXTIME(time)) AS date, COUNT(*) AS events
FROM mydb.events
WHERE TD_INTERVAL(time, '-7d', 'JST')
GROUP BY 1
ORDER BY 1
```

### Use TD_TIME_RANGE when:
- Filtering specific historical periods
- Comparing specific date ranges
- Backfilling data for specific dates
- Analyzing fixed time periods

**Example**: Q4 2024 analysis
```sql
SELECT DATE(FROM_UNIXTIME(time)) AS date, COUNT(*) AS events
FROM mydb.events
WHERE TD_TIME_RANGE(time, '2024-10-01', '2025-01-01', 'JST')
GROUP BY 1
ORDER BY 1
```

## Performance Best Practices

### 1. Always Include Time Filters

**Bad** (scans all data):
```sql
SELECT * FROM mydb.events WHERE user_id = 12345
```

**Good** (partition pruning):
```sql
SELECT * FROM mydb.events
WHERE TD_INTERVAL(time, '-30d')
  AND user_id = 12345
```

### 2. Time Filter First in WHERE Clause

Put time filter first for clarity (order doesn't affect performance):

```sql
SELECT * FROM mydb.events
WHERE TD_INTERVAL(time, '-7d', 'JST')  -- Time filter first
  AND status = 'completed'
  AND amount > 100
```

### 3. Avoid Functions on time Column

**Bad** (prevents partition pruning):
```sql
WHERE DATE(FROM_UNIXTIME(time)) = '2025-01-15'
```

**Good** (enables partition pruning):
```sql
WHERE TD_TIME_RANGE(time, '2025-01-15', '2025-01-16')
```

### 4. Combine with Other Filters

Time filters enable partition pruning; other filters reduce scanned data:

```sql
SELECT * FROM mydb.events
WHERE TD_INTERVAL(time, '-7d', 'JST')  -- Partition pruning
  AND event_type = 'purchase'           -- Filter after pruning
  AND amount > 1000                     -- Further filtering
```

## Common Patterns

### Pattern 1: Daily Aggregation (Last 30 Days)

```sql
SELECT
  DATE(FROM_UNIXTIME(time)) AS date,
  COUNT(*) AS total_events,
  COUNT(DISTINCT user_id) AS unique_users
FROM mydb.events
WHERE TD_INTERVAL(time, '-30d', 'JST')
GROUP BY 1
ORDER BY 1
```

### Pattern 2: Hourly Aggregation (Yesterday)

```sql
SELECT
  DATE_FORMAT(FROM_UNIXTIME(time), '%Y-%m-%d %H:00:00') AS hour,
  COUNT(*) AS events_per_hour
FROM mydb.events
WHERE TD_INTERVAL(time, '-1d', 'JST')
GROUP BY 1
ORDER BY 1
```

### Pattern 3: Month-over-Month Comparison

```sql
SELECT
  'This Month' AS period,
  COUNT(*) AS events
FROM mydb.events
WHERE TD_TIME_RANGE(time, '2025-01-01', '2025-02-01', 'JST')

UNION ALL

SELECT
  'Last Month' AS period,
  COUNT(*) AS events
FROM mydb.events
WHERE TD_TIME_RANGE(time, '2024-12-01', '2025-01-01', 'JST')
```

### Pattern 4: Rolling 7-Day Average

```sql
WITH daily_counts AS (
  SELECT
    DATE(FROM_UNIXTIME(time)) AS date,
    COUNT(*) AS events
  FROM mydb.events
  WHERE TD_INTERVAL(time, '-30d', 'JST')
  GROUP BY 1
)
SELECT
  date,
  events,
  AVG(events) OVER (
    ORDER BY date
    ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
  ) AS rolling_7day_avg
FROM daily_counts
ORDER BY date
```

## Troubleshooting

### Query Still Slow with Time Filter

**Check 1**: Verify time filter syntax
```sql
-- Bad: Missing TD_INTERVAL
WHERE time > 1704067200

-- Good: Using TD_INTERVAL
WHERE TD_INTERVAL(time, '-7d')
```

**Check 2**: Ensure time column is used
```sql
-- Bad: Using different column
WHERE created_at > CURRENT_DATE - INTERVAL '7' DAY

-- Good: Using time column
WHERE TD_INTERVAL(time, '-7d')
```

**Check 3**: Time range too large
```sql
-- Bad: Scanning 1 year
WHERE TD_INTERVAL(time, '-365d')

-- Good: Narrow to what you need
WHERE TD_INTERVAL(time, '-7d')
```

### Wrong Timezone Results

**Issue**: Getting data from wrong day

**Solution**: Specify timezone explicitly
```sql
-- If your data is in JST, specify JST
WHERE TD_INTERVAL(time, '-1d', 'JST')
```

### Empty Results with Time Filter

**Check 1**: Verify data exists
```sql
SELECT MIN(time), MAX(time) FROM mydb.events
```

**Check 2**: Check timezone
```sql
-- Try both UTC and JST
SELECT COUNT(*) FROM mydb.events WHERE TD_INTERVAL(time, '-1d')
SELECT COUNT(*) FROM mydb.events WHERE TD_INTERVAL(time, '-1d', 'JST')
```

## Related Skills

- **sql-skills/trino** - Advanced Trino query optimization
- **sql-skills/trino-optimizer** - Query performance tuning
- **tdx-skills/tdx-basic** - Execute queries with tdx CLI
- **workflow-skills/digdag** - Schedule time-filtered queries

## Resources

- [TD_INTERVAL Documentation](https://docs.treasuredata.com/)
- [TD_TIME_RANGE Documentation](https://docs.treasuredata.com/)
- [Timezone List](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones)
