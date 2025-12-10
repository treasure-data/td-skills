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

```sql
-- Yesterday, last 7 days, last 30 days, last 3 months, last hour
where td_interval(time, '-1d')   -- Yesterday
where td_interval(time, '-7d')   -- Last 7 days
where td_interval(time, '-30d')  -- Last 30 days
where td_interval(time, '-3M')   -- Last 3 months
where td_interval(time, '-1h')   -- Last hour
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

```sql
where td_interval(time, '-1d')                          -- UTC (default)
where td_interval(time, '-1d', 'JST')                   -- Japan Standard Time
where td_interval(time, '-1d', 'America/Los_Angeles')   -- Other timezones
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

-- Range from yesterday until now (today's current time)
where td_interval(time, '-1d/now')

-- Beginning of today (00:00:00) until now
where td_interval(time, '0d/now')

-- Beginning of this month until now
where td_interval(time, '0M/now')

-- Beginning of this year until now
where td_interval(time, '0y/now')

-- Last 7 days from beginning of this month
where td_interval(time, '-7d/0M')

-- Last 30 days from beginning of this year
where td_interval(time, '-30d/0y')

-- This month up to 7 days ago
where td_interval(time, '0M/-7d')
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

```sql
where td_time_range(time, '2025-01-01', '2025-02-01')              -- Specific month
where td_time_range(time, '2025-01-15', '2025-01-16')              -- Specific date
where td_time_range(time, '2025-01-15 09:00:00', '2025-01-15 17:00:00')  -- With time
where td_time_range(time, '2025-01-01', null)                      -- From date onwards
where td_time_range(time, null, '2025-01-01')                      -- Before date
where td_time_range(time, '2025-01-01', '2025-02-01', 'JST')       -- With timezone
```

## td_time_string: Easy Date Formatting

### Basic Syntax

```sql
td_time_string(time, 'format'[, 'timezone'])
```

Simplified date formatting using short format strings. See [full format reference](https://api-docs.treasuredata.com/en/tools/presto/api#td_time_string).

### Common Short Formats

```sql
-- With timezone (returns start of period with timezone)
select td_time_string(time, 'y', 'UTC')   -- 2018-01-01 00:00:00+0700
select td_time_string(time, 'M', 'JST')   -- 2018-09-01 00:00:00+0700
select td_time_string(time, 'd', 'UTC')   -- 2018-09-13 00:00:00+0700
select td_time_string(time, 'h', 'JST')   -- 2018-09-13 16:00:00+0700

-- Without timezone (truncated format with `!`)
select td_time_string(time, 'y!', 'UTC')  -- 2018
select td_time_string(time, 'M!', 'JST')  -- 2018-09
select td_time_string(time, 'd!', 'UTC')  -- 2018-09-13
select td_time_string(time, 'h!', 'JST')  -- 2018-09-13 16
select td_time_string(time, 's!', 'UTC')  -- 2018-09-13 16:45:34
```

### Usage in Queries

```sql
-- Group by date, hour, or month
select td_time_string(time, 'd!', 'JST') as date, count(*) from mydb.events where td_interval(time, '-7d', 'JST') group by 1
select td_time_string(time, 'h!', 'JST') as hour, count(*) from mydb.events where td_interval(time, '-1d', 'JST') group by 1
select td_time_string(time, 'M!', 'JST') as month, count(*) from mydb.events where td_interval(time, '-6M', 'JST') group by 1
```

## Choosing Between td_interval and td_time_range

**Use td_interval** for relative time (rolling windows, dashboards, scheduled workflows)
**Use td_time_range** for absolute time (specific periods, backfills, comparisons)

```sql
-- td_interval: Rolling 7-day report (reusable)
select date(from_unixtime(time)) as date, count(*) from mydb.events where td_interval(time, '-7d', 'JST') group by 1

-- td_time_range: Q4 2024 analysis (fixed period)
select date(from_unixtime(time)) as date, count(*) from mydb.events where td_time_range(time, '2024-10-01', '2025-01-01', 'JST') group by 1
```

## Performance Best Practices

```sql
-- BAD: No time filter (scans all data)
select * from mydb.events where user_id = 12345

-- GOOD: Time filter enables partition pruning
select * from mydb.events where td_interval(time, '-30d') and user_id = 12345

-- BAD: Functions on time column prevent partition pruning
where date(from_unixtime(time)) = '2025-01-15'

-- GOOD: Use td_time_range for date filtering
where td_time_range(time, '2025-01-15', '2025-01-16')

-- Best practice: Time filter first, then other filters
where td_interval(time, '-7d', 'JST') and event_type = 'purchase' and amount > 1000
```

## Common Patterns

```sql
-- Daily aggregation (last 30 days)
select td_time_string(time, 'yyyy-MM-dd', 'JST') as date, count(*) from mydb.events where td_interval(time, '-30d', 'JST') group by 1

-- Hourly aggregation (yesterday)
select td_time_string(time, 'yyyy-MM-dd HH:00:00', 'JST') as hour, count(*) from mydb.events where td_interval(time, '-1d', 'JST') group by 1

-- Month-over-month comparison
select 'This Month', count(*) from mydb.events where td_time_range(time, '2025-01-01', '2025-02-01', 'JST')
union all
select 'Last Month', count(*) from mydb.events where td_time_range(time, '2024-12-01', '2025-01-01', 'JST')

-- Rolling 7-day average
with daily_counts as (
  select td_time_string(time, 'yyyy-MM-dd', 'JST') as date, count(*) as events
  from mydb.events where td_interval(time, '-30d', 'JST') group by 1
)
select date, events, avg(events) over (order by date rows between 6 preceding and current row) as rolling_7day_avg
from daily_counts
```

## Troubleshooting

```sql
-- Query still slow? Check time filter syntax
where time > 1704067200                    -- BAD: Raw timestamp comparison
where td_interval(time, '-7d')             -- GOOD: Use td_interval

-- Query still slow? Ensure time column is used
where created_at > current_date - interval '7' day  -- BAD: Different column
where td_interval(time, '-7d')                      -- GOOD: Use time column

-- Query still slow? Reduce time range
where td_interval(time, '-365d')           -- BAD: Scanning 1 year
where td_interval(time, '-7d')             -- GOOD: Narrow range

-- Wrong timezone results? Specify timezone explicitly
where td_interval(time, '-1d', 'JST')      -- Specify JST for Japan data

-- Empty results? Verify data exists and check timezone
select min(time), max(time) from mydb.events
select count(*) from mydb.events where td_interval(time, '-1d')        -- Try UTC
select count(*) from mydb.events where td_interval(time, '-1d', 'JST') -- Try JST
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
