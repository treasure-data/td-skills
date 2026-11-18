# Query collection for AI Voice export data

Replace `{database}` with the name of the database that AI Voice exports to, and `{tz}` with the time zone (default `Asia/Tokyo`; use the IANA name of another zone if the user asks for one). The queries are written for Trino (the default of `tdx query`). Every query keeps **only the latest rows** by keeping, for each `unique_id`, the row with the largest `updated_at` (the reason is in "3 rules" in SKILL.md). Narrow the period in the form `td_interval(time, '-30d/now', '{tz}')` (adjust the range and time zone; for a calendar month use `td_time_range(time, '2026-10-01', '2026-11-01', '{tz}')`).

## 1. Basic form: keep only the latest rows

A pattern that works for any table. Example with `recordings`:

```sql
select * from (
  select *, row_number() over (partition by unique_id order by updated_at desc) as rn
  from {database}.recordings
  where td_interval(time, '-30d/now', '{tz}')
) where rn = 1
```

In the following queries, this pattern is used in `with` clauses named `r` (recordings), `s` (summaries), `seg` (transcript_segments) and `d` (devices).

## 2. List of recent recordings

```sql
with r as (
  select * from (
    select *, row_number() over (partition by unique_id order by updated_at desc) as rn
    from {database}.recordings
    where td_interval(time, '-30d/now', '{tz}')
  ) where rn = 1
)
select
  td_time_string(time, 'm!', '{tz}') as recorded_at,
  inferred_name as title,
  user_name,
  round(duration_seconds / 60.0) as minutes,
  status
from r
order by time desc
limit 20
```

## 3. See summaries and action items together with recording information

```sql
with s as (
  select * from (
    select *, row_number() over (partition by unique_id order by updated_at desc) as rn
    from {database}.summaries
    where td_interval(time, '-30d/now', '{tz}')
  ) where rn = 1
),
r as (
  select * from (
    select *, row_number() over (partition by unique_id order by updated_at desc) as rn
    from {database}.recordings
    where td_interval(time, '-30d/now', '{tz}')
  ) where rn = 1
)
select
  td_time_string(s.time, 'm!', '{tz}') as recorded_at,
  s.inferred_name as title,
  r.user_name,
  r.tags,
  s.summary_text,
  s.action_items
from s
left join r on r.id = s.recording_id
order by s.time desc
```

The reason for `left join` is that a very long recording (usually over 3 hours) may have no row in `recordings` and rows only in `summaries` and `transcript_segments`.

## 4. Read one recording in the order of utterances

```sql
select
  segment_index,
  start_ms / 1000 as start_sec,
  coalesce(nullif(speaker_label, ''), speaker_id) as speaker,
  text
from (
  select *, row_number() over (partition by unique_id order by updated_at desc) as rn
  from {database}.transcript_segments
  where td_interval(time, '-30d/now', '{tz}')
    and recording_id = '<録音ID>'
) where rn = 1
order by segment_index
```

(`<録音ID>` is a placeholder for the recording ID. Replace it with the actual ID.)

The `time` of `transcript_segments` is "recording datetime + start position of the utterance", so if you know the recording date, narrowing around it is faster.

## 5. Talk time per speaker

```sql
select
  coalesce(nullif(speaker_label, ''), speaker_id) as speaker,
  count(*) as segments,
  round(sum(end_ms - start_ms) / 1000.0) as talk_seconds
from (
  select *, row_number() over (partition by unique_id order by updated_at desc) as rn
  from {database}.transcript_segments
  where td_interval(time, '-30d/now', '{tz}')
    and recording_id = '<録音ID>'
) where rn = 1
group by 1
order by talk_seconds desc
```

`speaker_label` is filled only when a speaker name was set in the AI Voice Console. If none was set it is empty, so fall back to `speaker_id` (such as `spk_0`).

## 6. Find utterances that contain a keyword

```sql
with seg as (
  select * from (
    select *, row_number() over (partition by unique_id order by updated_at desc) as rn
    from {database}.transcript_segments
    where td_interval(time, '-30d/now', '{tz}')
  ) where rn = 1
),
r as (
  select * from (
    select *, row_number() over (partition by unique_id order by updated_at desc) as rn
    from {database}.recordings
    where td_interval(time, '-30d/now', '{tz}')
  ) where rn = 1
)
select
  td_time_string(seg.time, 'm!', '{tz}') as at,
  r.inferred_name as title,
  coalesce(nullif(seg.speaker_label, ''), seg.speaker_id) as speaker,
  seg.text
from seg
left join r on r.id = seg.recording_id
where seg.text like '%価格改定%'
  and r.user_email = '<user email>'  -- default scope: the user's own recordings (see "Whose recordings to read" in SKILL.md)
order by seg.time
limit 50
```

(`価格改定` in the `like` condition is an example keyword, meaning "price revision". Replace it with the user's keyword.)

Remove the `user_email` line only after the user has confirmed that they want to include recordings made by other people. Without it, the query also returns very long recordings that have no row in `recordings` (`title` is then empty); with it, those recordings are left out.

## 7. Expand action items into one row each

```sql
with s as (
  select * from (
    select *, row_number() over (partition by unique_id order by updated_at desc) as rn
    from {database}.summaries
    where td_interval(time, '-30d/now', '{tz}')
  ) where rn = 1
)
select
  td_time_string(s.time, 'm!', '{tz}') as recorded_at,
  s.inferred_name as title,
  t.item as action_item
from s
cross join unnest(s.action_items) as t(item)
order by s.time desc
```

`action_items` and `tags` are arrays. To get one row per element, use `cross join unnest(...)`.

## 8. Number of recordings per tag

```sql
with r as (
  select * from (
    select *, row_number() over (partition by unique_id order by updated_at desc) as rn
    from {database}.recordings
    where td_interval(time, '-30d/now', '{tz}')
  ) where rn = 1
)
select t.tag, count(*) as recordings
from r
cross join unnest(r.tags) as t(tag)
group by 1
order by recordings desc
```

## 9. Link recordings to the device used and the person it is assigned to

```sql
with r as (
  select * from (
    select *, row_number() over (partition by unique_id order by updated_at desc) as rn
    from {database}.recordings
    where td_interval(time, '-30d/now', '{tz}')
  ) where rn = 1
),
d as (
  select * from (
    select *, row_number() over (partition by unique_id order by updated_at desc) as rn
    from {database}.devices
  ) where rn = 1
)
select
  r.inferred_name as title,
  r.device_serial_number,
  d.device_model,
  d.assigned_user_name,
  d.status as device_status
from r
left join d on d.serial_number = r.device_serial_number
order by r.time desc
limit 20
```

Do not filter `devices` by time (its `time` is the time of the last heartbeat, not the recording datetime).

## 10. Count by processing status (checking failed or in-progress recordings)

```sql
with r as (
  select * from (
    select *, row_number() over (partition by unique_id order by updated_at desc) as rn
    from {database}.recordings
    where td_interval(time, '-30d/now', '{tz}')
  ) where rn = 1
)
select status, count(*) as recordings
from r
group by 1
order by recordings desc
```

## 11. Extract external metadata (values passed through deep links)

`external_metadata` is a JSON string holding the keys and values passed to the recording through a deep link. It is `null` for recordings where none was passed. The key names are decided by the user (example: `recordRef`).

```sql
with r as (
  select * from (
    select *, row_number() over (partition by unique_id order by updated_at desc) as rn
    from {database}.recordings
    where td_interval(time, '-30d/now', '{tz}')
  ) where rn = 1
)
select
  id,
  inferred_name as title,
  json_extract_scalar(external_metadata, '$.recordRef') as record_ref
from r
where external_metadata is not null
```
