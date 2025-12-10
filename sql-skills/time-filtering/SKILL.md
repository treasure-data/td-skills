---
name: time-filtering
description: Time-based filtering using `td_interval()`, `td_time_range()`, and `td_time_string()` for Treasure Data queries. Covers relative filtering (-1d=yesterday, -7d=last week), offset dates (absolute/relative/now), time range verification, date formatting (date/date_hour/iso), and partition pruning. Use when writing time-based WHERE clauses, troubleshooting slow time-series queries, or formatting dates in SELECT.
---

# TD Time Filtering - Partition Pruning and Performance

Expert guidance for time-based filtering in Treasure Data using `td_interval`, `td_time_range`, and `td_time_string` functions for optimal partition pruning and query performance.

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
select time, from_unixtime(time) as datetime
from mydb.events
limit 1
```

### Why Time Filtering Matters

**Without time filter** (scans all data):
```sql
-- BAD: Scans entire table
select count(*) from mydb.events where status = 'completed'
```

**With time filter** (partition pruning):
```sql
-- GOOD: Only scans last 7 days of data
select count(*)
from mydb.events
where td_interval(time, '-7d')
  and status = 'completed'
```

## td_interval: Relative Time Filtering

### Basic Syntax

```sql
td_interval(time, 'interval'[, 'timezone'])
```

- `time`: The time column
- `interval`: Relative time string (e.g., '-1d', '-7d', '-1M')
- `timezone`: Optional, defaults to UTC

### Common Patterns

**Yesterday's data**:
```sql
select * from mydb.events
where td_interval(time, '-1d')
```

**Last 7 days**:
```sql
select * from mydb.events
where td_interval(time, '-7d')
```

**Last 30 days**:
```sql
select * from mydb.events
where td_interval(time, '-30d')
```

**Last 3 months**:
```sql
select * from mydb.events
where td_interval(time, '-3M')
```

**Last hour**:
```sql
select * from mydb.events
where td_interval(time, '-1h')
```

### Interval Units

- `s` - seconds
- `m` - minutes
- `h` - hours
- `d` - days
- `w` - weeks
- `M` - months
- `q` - quarters
- `y` - years

### Timezone Handling

**UTC (default)**:
```sql
-- These are equivalent
where td_interval(time, '-1d')
where td_interval(time, '-1d', 'UTC')
```

**JST (Japan Standard Time)**:
```sql
-- Yesterday in JST (9 hours ahead of UTC)
where td_interval(time, '-1d', 'JST')
```

**Other timezones**:
```sql
where td_interval(time, '-1d', 'America/Los_Angeles')
where td_interval(time, '-1d', 'Europe/London')
```

### With Offset Date (Reference Date)

Use offset date syntax to specify a reference date instead of current time. The offset can be:
- Absolute date: `2025-10-01`
- Relative time range: `-1d`, `-7d`, etc.
- `now` keyword for current time

```sql
-- Yesterday relative to 2025-10-01
where td_interval(time, '-1d/2025-10-01')

-- Last 7 days from 2025-10-01
where td_interval(time, '-7d/2025-10-01')

-- Last month from 2025-10-01 in JST
where td_interval(time, '-1M/2025-10-01', 'JST')

-- Yesterday relative to 7 days ago
where td_interval(time, '-1d/-7d')

-- Last 7 days from yesterday
where td_interval(time, '-7d/-1d')

-- Yesterday relative to now (same as '-1d')
where td_interval(time, '-1d/now')
```

### With td_scheduled_time

For scheduled workflows, use `td_scheduled_time()` as reference:

```sql
-- Yesterday relative to workflow schedule time
select * from mydb.events
where td_interval(time, '-1d', 'JST', td_scheduled_time())
```

### Verify Time Range with td_interval_range

Use `td_interval_range()` to confirm the exact time range that td_interval will use:

```sql
-- Check what time range '-7d' covers
SELECT td_interval_range('-7d', 'UTC')
-- Returns: [start_timestamp, end_timestamp]

-- Check time range with offset date
SELECT td_interval_range('-1d/2025-10-01', 'JST')

-- Verify yesterday's range
SELECT td_interval_range('-1d', 'JST')
```

This is useful for:
- Debugging time filter issues
- Verifying timezone calculations
- Confirming offset date behavior

## td_time_range: Absolute Time Filtering

### Basic Syntax

```sql
td_time_range(time, 'start', 'end'[, 'timezone'])
```

- `time`: The time column
- `start`: Start date/time (inclusive)
- `end`: End date/time (exclusive)
- `timezone`: Optional, defaults to UTC

### Common Patterns

**Specific month**:
```sql
select * from mydb.events
where td_time_range(time, '2025-01-01', '2025-02-01')
```

**Specific date**:
```sql
select * from mydb.events
where td_time_range(time, '2025-01-15', '2025-01-16')
```

**Date range**:
```sql
select * from mydb.events
where td_time_range(time, '2025-01-01', '2025-01-31')
```

**With time component**:
```sql
select * from mydb.events
where td_time_range(time,
  '2025-01-15 09:00:00',
  '2025-01-15 17:00:00')
```

**NULL for open-ended**:
```sql
-- All data from 2025-01-01 onwards
select * from mydb.events
where td_time_range(time, '2025-01-01', null)

-- All data before 2025-01-01
select * from mydb.events
where td_time_range(time, null, '2025-01-01')
```

### Timezone with td_time_range

**UTC (default)**:
```sql
where td_time_range(time, '2025-01-01', '2025-02-01')
```

**JST**:
```sql
-- January 2025 in JST
where td_time_range(time, '2025-01-01', '2025-02-01', 'JST')
```

## td_time_string: Easy Date Formatting

### Basic Syntax

```sql
td_time_string(time, 'format'[, 'timezone'])
```

Simplified date formatting using short format strings. See [full format reference](https://api-docs.treasuredata.com/en/tools/presto/api#td_time_string).

### Common Short Formats

**With timezone (returns start of period with timezone)**:
```sql
-- Year start: 2018-01-01 00:00:00+0700
select td_time_string(time, 'y', 'UTC')

-- Month start: 2018-09-01 00:00:00+0700
select td_time_string(time, 'M', 'JST')

-- Day start: 2018-09-13 00:00:00+0700
select td_time_string(time, 'd', 'UTC')

-- Hour start: 2018-09-13 16:00:00+0700
select td_time_string(time, 'h', 'JST')

-- Exact second: 2018-09-13 16:45:34+0700
select td_time_string(time, 's', 'UTC')
```

**Without timezone (truncated format with `!`)**:
```sql
-- Year only: 2018
select td_time_string(time, 'y!', 'UTC')

-- Year-month: 2018-09
select td_time_string(time, 'M!', 'JST')

-- Date: 2018-09-13
select td_time_string(time, 'd!', 'UTC')

-- Date with hour: 2018-09-13 16
select td_time_string(time, 'h!', 'JST')

-- Date with minute: 2018-09-13 16:45
select td_time_string(time, 'm!', 'UTC')

-- Full timestamp: 2018-09-13 16:45:34
select td_time_string(time, 's!', 'JST')
```

### Usage in Queries

**Group by date**:
```sql
select
  td_time_string(time, 'd!', 'JST') as date,
  count(*) as events
from mydb.events
where td_interval(time, '-7d', 'JST')
group by 1
order by 1
```

**Group by hour**:
```sql
select
  td_time_string(time, 'h!', 'JST') as hour,
  count(*) as events
from mydb.events
where td_interval(time, '-1d', 'JST')
group by 1
order by 1
```

**Group by month**:
```sql
select
  td_time_string(time, 'M!', 'JST') as month,
  count(*) as events
from mydb.events
where td_interval(time, '-6M', 'JST')
group by 1
order by 1
```

## Choosing Between td_interval and td_time_range

### Use td_interval when:
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
select * from mydb.events
where td_interval(time, '-30d')
  and user_id = 12345
```

### 2. Time Filter First in WHERE Clause

Put time filter first for clarity (order doesn't affect performance):

```sql
select * from mydb.events
where td_interval(time, '-7d', 'JST')  -- Time filter first
  and status = 'completed'
  and amount > 100
```

### 3. Avoid Functions on time Column

**Bad** (prevents partition pruning):
```sql
where date(from_unixtime(time)) = '2025-01-15'
```

**Good** (enables partition pruning):
```sql
where td_time_range(time, '2025-01-15', '2025-01-16')
```

### 4. Combine with Other Filters

Time filters enable partition pruning; other filters reduce scanned data:

```sql
select * from mydb.events
where td_interval(time, '-7d', 'JST')  -- Partition pruning
  and event_type = 'purchase'           -- Filter after pruning
  and amount > 1000                     -- Further filtering
```

## Common Patterns

### Pattern 1: Daily Aggregation (Last 30 Days)

```sql
select
  td_time_string(time, 'yyyy-MM-dd', 'JST') as date,
  count(*) as total_events,
  count(distinct user_id) as unique_users
from mydb.events
where td_interval(time, '-30d', 'JST')
group by 1
order by 1
```

### Pattern 2: Hourly Aggregation (Yesterday)

```sql
select
  td_time_string(time, 'yyyy-MM-dd HH:00:00', 'JST') as hour,
  count(*) as events_per_hour
from mydb.events
where td_interval(time, '-1d', 'JST')
group by 1
order by 1
```

### Pattern 3: Month-over-Month Comparison

```sql
select
  'This Month' as period,
  count(*) as events
from mydb.events
where td_time_range(time, '2025-01-01', '2025-02-01', 'JST')

union all

select
  'Last Month' as period,
  count(*) as events
from mydb.events
where td_time_range(time, '2024-12-01', '2025-01-01', 'JST')
```

### Pattern 4: Rolling 7-Day Average

```sql
with daily_counts as (
  select
    td_time_string(time, 'yyyy-MM-dd', 'JST') as date,
    count(*) as events
  from mydb.events
  where td_interval(time, '-30d', 'JST')
  group by 1
)
select
  date,
  events,
  avg(events) over (
    order by date
    rows between 6 preceding and current row
  ) as rolling_7day_avg
from daily_counts
order by date
```

## Troubleshooting

### Query Still Slow with Time Filter

**Check 1**: Verify time filter syntax
```sql
-- Bad: Missing td_interval
where time > 1704067200

-- Good: Using td_interval
where td_interval(time, '-7d')
```

**Check 2**: Ensure time column is used
```sql
-- Bad: Using different column
where created_at > current_date - interval '7' day

-- Good: Using time column
where td_interval(time, '-7d')
```

**Check 3**: Time range too large
```sql
-- Bad: Scanning 1 year
where td_interval(time, '-365d')

-- Good: Narrow to what you need
where td_interval(time, '-7d')
```

### Wrong Timezone Results

**Issue**: Getting data from wrong day

**Solution**: Specify timezone explicitly
```sql
-- If your data is in JST, specify JST
where td_interval(time, '-1d', 'JST')
```

### Empty Results with Time Filter

**Check 1**: Verify data exists
```sql
select min(time), max(time) from mydb.events
```

**Check 2**: Check timezone
```sql
-- Try both UTC and JST
select count(*) from mydb.events where td_interval(time, '-1d')
select count(*) from mydb.events where td_interval(time, '-1d', 'JST')
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
