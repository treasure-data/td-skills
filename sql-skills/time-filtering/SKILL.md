---
name: time-filtering
description: Advanced td_interval patterns including offset dates (-1d/2025-10-01, -7d/-1d, 0M/now), td_interval_range for debugging, and partition pruning optimization.
---

# TD Time Filtering - Advanced Patterns

## td_interval Offset Date Syntax

Reference date can be absolute, relative, or `now`:

```sql
-- Absolute reference date
where td_interval(time, '-1d/2025-10-01')       -- Yesterday relative to Oct 1
where td_interval(time, '-7d/2025-10-01', 'JST')

-- Relative reference date
where td_interval(time, '-1d/-7d')              -- Yesterday relative to 7 days ago
where td_interval(time, '-7d/-1d')              -- Last 7 days from yesterday

-- now keyword
where td_interval(time, '-1d/now')              -- Yesterday until now
where td_interval(time, '0d/now')               -- Beginning of today until now
where td_interval(time, '0M/now')               -- Beginning of this month until now
where td_interval(time, '0y/now')               -- Beginning of this year until now

-- Combined patterns
where td_interval(time, '-7d/0M')               -- Last 7 days from month start
where td_interval(time, '0M/-7d')               -- This month up to 7 days ago
```

## Interval Units

`s`=seconds, `m`=minutes, `h`=hours, `d`=days, `w`=weeks, `M`=months, `q`=quarters, `y`=years

## td_interval_range for Debugging

```sql
select td_interval_range('-7d', 'UTC')              -- Returns [start, end] timestamps
select td_interval_range('-1d/2025-10-01', 'JST')   -- Check offset date range
select td_interval_range('0M/now', 'JST')           -- Verify month-to-date range
```

## td_scheduled_time Reference

In workflows, include `td_scheduled_time()` to establish reference time:

```sql
select td_scheduled_time(), *
from mydb.events
where td_interval(time, '-1d', 'JST')
```

## Partition Pruning Gotchas

```sql
-- BAD: Functions on time prevent pruning
where date(from_unixtime(time)) = '2025-01-15'

-- GOOD: Use td_time_range
where td_time_range(time, '2025-01-15', '2025-01-16')

-- BAD: Raw timestamp comparison
where time > 1704067200

-- GOOD: Use td_interval
where td_interval(time, '-7d')

-- BAD: Different column
where created_at > current_date - interval '7' day

-- GOOD: Use time column
where td_interval(time, '-7d')
```

## Troubleshooting Empty Results

```sql
-- Check data range
select min(time), max(time) from mydb.events

-- Try different timezones
select count(*) from mydb.events where td_interval(time, '-1d')        -- UTC
select count(*) from mydb.events where td_interval(time, '-1d', 'JST') -- JST
```

## Resources

- https://api-docs.treasuredata.com/en/tools/presto/api#td_interval
