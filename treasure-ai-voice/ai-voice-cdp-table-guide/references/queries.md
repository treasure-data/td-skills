# Query collection for AI Voice export data

These are Trino templates, not live results. Confirm the actual schema first. All source tables are database-qualified, scans have explicit partition bounds, and projections contain no source `select *`. Deduplication keeps the largest `updated_at` per `(organization_id, unique_id)`.

## Parameters and execution order

- Resolve `{database}` from the supplied name or table-name discovery. Establish actual database/organization authorization separately from recording selection. Unknown organization or requester identity means stop, not broaden.
- `{organization_id}` is the authorized organization; `{requester_email}` defines the own-recordings default, not authenticated identity. Use trusted identifier substitution for the database; quote/escape SQL string values (`'` becomes `''`) or bind them if supported. Never interpolate raw query text from exported metadata.
- `{period_start}` and `{period_end}` are fixed, half-open recording-start bounds in `{tz}` (default `Asia/Tokyo`). For October, for example, use `2026-10-01` and `2026-11-01`. Resolve relative periods once; do not let separate `now` evaluations change the selection.
- **Queries 1 and 2 are metadata-only discovery.** By default they select the latest rows whose recorder is the requester. Only for a requested wider metadata preview may the final owner predicate be replaced with the requested bounded recorder set or explicitly requested organization metadata scope. Keep organization and time constraints. Preview only IDs, dates, recorder, duration, status; no inferred titles, transcript, summary, action items, tags, or arbitrary external metadata.
- **Queries 3–7 (including 4b) and 11 read content or content-derived fields.** First select exact IDs from the metadata preview. Other people's IDs require confirmation of the named list; an ambiguous list requires clarification. Do not search content to construct that list. A keyword/title request selects a topic to search **within** approved recordings, not permission to inspect unselected calls.
- Build `{recording_scope_cte}` and the four `{..._partition_..._utc}` values with `scripts/recording_scope.py` as described in [recording-scope.md](recording-scope.md). The CTE is a literal, nonempty `(organization_id, recording_id)` allowlist with recorder and full-call bounds. Paste the returned fragment verbatim after `with`, without adding another `with`. It is a selection mechanism, not an entitlement check. Do not replace it with an unrestricted subquery over source tables.
- Content queries join that CTE at **each** content source before projecting content. The UTC partition bounds prune scans; equality on organization plus recording ID is the selection gate. Per-call time bounds are additional constraints, not a substitute for the ID gate. Selected recording start times bound `recordings`/`summaries`; full call spans bound segments, even across midnight.
- Missing parent metadata is excluded, including when the user selected other people's recordings. The helper has no orphan override. An independent approved historical mapping needs a separately reviewed adapter; removing the owner condition, a current device assignment, or setting a scalar policy reference is not such a mapping.
- **Queries 8 and 10 are aggregate metadata statistics**, not content selection. They may cover the explicitly requested database-authorized organization population; say so and distinguish it from any selected-content population. Add a recorder predicate after deduplication for own-only counts. Query 9 is own-recording metadata with separately labeled current device state.

## 1. Basic form: deduplicate metadata without fetching content

Use only the columns needed for the question, even in the inner projection. The owner predicate comes after deduplication so an older export copy cannot establish ownership.

```sql
-- q1: metadata-dedup
with ranked_metadata as (
  select r.organization_id, r.unique_id, r.updated_at, r.id,
         r.time, r.user_email, r.duration_seconds, r.status,
         row_number() over (
           partition by r.organization_id, r.unique_id order by r.updated_at desc
         ) as rn
  from {database}.recordings r
  where r.organization_id = '{organization_id}'
    and td_time_range(r.time, '{period_start}', '{period_end}', '{tz}')
)
select organization_id, id as recording_id, time as recording_time,
       user_email as recorder_email, duration_seconds, status
from ranked_metadata
where rn = 1 and user_email = '{requester_email}'
order by time desc, id
limit 20
```

## 2. Metadata-only preview of recent recordings

This is the preview for content selection. Show the IDs with date, recorder, duration, and status. Do not add `inferred_name` for convenient titles. Keep the numeric `recording_time` and `parent_metadata_present` in the local metadata input to the helper. A `limit` is a discovery boundary, not proof of full-period coverage; page deterministically or ask to narrow before claiming completeness.

```sql
-- q2: metadata-preview
with ranked_metadata as (
  select r.organization_id, r.unique_id, r.updated_at, r.id, r.time,
         r.user_email, r.user_name, r.duration_seconds, r.status,
         row_number() over (
           partition by r.organization_id, r.unique_id order by r.updated_at desc
         ) as rn
  from {database}.recordings r
  where r.organization_id = '{organization_id}'
    and td_time_range(r.time, '{period_start}', '{period_end}', '{tz}')
)
select organization_id, id as recording_id, time as recording_time,
       td_time_string(time, 's', '{tz}') as recorded_at,
       user_email as recorder_email, user_name as recorder_name,
       duration_seconds, status, true as parent_metadata_present
from ranked_metadata
where rn = 1 and user_email = '{requester_email}'
order by time desc, id
limit 20
```

A supplied ID is an additional metadata filter, not a reason to skip validation. A wider preview may include other recorders only as metadata. After the user confirms, freeze the exact selected IDs; never reuse the widened preview predicate as a content gate.

## 3. Summaries and action items with optional recording information

Only the selected summaries are read. The `left join` enriches already-admitted rows; it does not admit orphan summaries. The recorder email is the one established in the scope preview.

```sql
-- q3: selected-summaries
with {recording_scope_cte},
s_ranked as (
  select s.organization_id, s.recording_id, s.time, s.inferred_name,
         s.summary_text, s.action_items,
         row_number() over (
           partition by s.organization_id, s.unique_id order by s.updated_at desc
         ) as rn
  from {database}.summaries s
  join recording_scope sc
    on s.organization_id = sc.organization_id and s.recording_id = sc.recording_id
  where td_time_range(s.time, '{recording_partition_start_utc}', '{recording_partition_end_utc}', 'UTC')
    and s.time = sc.recording_time
),
r_ranked as (
  select r.organization_id, r.id, r.user_name, r.tags,
         row_number() over (
           partition by r.organization_id, r.unique_id order by r.updated_at desc
         ) as rn
  from {database}.recordings r
  join recording_scope sc
    on r.organization_id = sc.organization_id and r.id = sc.recording_id
  where td_time_range(r.time, '{recording_partition_start_utc}', '{recording_partition_end_utc}', 'UTC')
    and r.time = sc.recording_time
)
select s.organization_id, s.recording_id,
       td_time_string(s.time, 's', '{tz}') as recorded_at,
       s.inferred_name as title, sc.recorder_email, r.user_name, r.tags,
       s.summary_text, s.action_items
from s_ranked s
join recording_scope sc
  on s.organization_id = sc.organization_id and s.recording_id = sc.recording_id
left join r_ranked r
  on r.organization_id = s.organization_id and r.id = s.recording_id and r.rn = 1
where s.rn = 1
order by s.time desc, s.recording_id
```

## 4. Read selected recordings in utterance order

For a single call, build a one-ID scope. `time` already includes `start_ms`; `utterance_at` displays that absolute segment time with a timezone offset. Do not add `start_ms` again. The selected full-call bounds retain after-midnight utterances even when the call was selected from the preceding day.

```sql
-- q4: selected-utterances
with {recording_scope_cte},
seg_ranked as (
  select seg.organization_id, seg.recording_id, seg.time, seg.segment_index,
         seg.start_ms, seg.speaker_label, seg.speaker_id, seg.text,
         row_number() over (
           partition by seg.organization_id, seg.unique_id order by seg.updated_at desc
         ) as rn
  from {database}.transcript_segments seg
  join recording_scope sc
    on seg.organization_id = sc.organization_id and seg.recording_id = sc.recording_id
  where td_time_range(seg.time, '{segment_partition_start_utc}', '{segment_partition_end_utc}', 'UTC')
    and seg.time >= sc.recording_time and seg.time < sc.segment_end_time
)
select organization_id, recording_id, segment_index,
       td_time_string(time, 's', '{tz}') as utterance_at,
       start_ms / 1000.0 as start_sec,
       coalesce(nullif(speaker_label, ''), speaker_id) as speaker, text
from seg_ranked
where rn = 1
order by recording_id, segment_index
```

### 4b. Full transcript stored on the selected parent recording

Use when the speaker-labeled full text is needed instead of segment detail (for example a CDP fallback for minutes). Do not fetch both by default. For a parent missing because of the event-size limit, do not broaden; explain the gap and follow the independent-mapping rule before any segment/summary fallback. Bound output and process long selected transcripts in chunks.

```sql
-- q4b: selected-full-transcript
with {recording_scope_cte},
r_ranked as (
  select r.organization_id, r.id, r.status, r.transcription_text,
         row_number() over (
           partition by r.organization_id, r.unique_id order by r.updated_at desc
         ) as rn
  from {database}.recordings r
  join recording_scope sc
    on r.organization_id = sc.organization_id and r.id = sc.recording_id
  where td_time_range(r.time, '{recording_partition_start_utc}', '{recording_partition_end_utc}', 'UTC')
    and r.time = sc.recording_time
)
select organization_id, id as recording_id, status, transcription_text
from r_ranked
where rn = 1
order by id
```

## 5. Talk time per speaker in selected calls

No transcript text is needed. Speaker labels remain scoped to the selected calls. Keep recording IDs in the grouping so `spk_0` from different calls is not treated as one person. Summed segment duration is not wall-clock duration when utterances overlap; for overlap-aware talk analysis use the dedicated skill.

```sql
-- q5: selected-talk-time
with {recording_scope_cte},
seg_ranked as (
  select seg.organization_id, seg.recording_id, seg.start_ms, seg.end_ms,
         seg.speaker_label, seg.speaker_id,
         row_number() over (
           partition by seg.organization_id, seg.unique_id order by seg.updated_at desc
         ) as rn
  from {database}.transcript_segments seg
  join recording_scope sc
    on seg.organization_id = sc.organization_id and seg.recording_id = sc.recording_id
  where td_time_range(seg.time, '{segment_partition_start_utc}', '{segment_partition_end_utc}', 'UTC')
    and seg.time >= sc.recording_time and seg.time < sc.segment_end_time
)
select organization_id, recording_id,
       coalesce(nullif(speaker_label, ''), speaker_id) as speaker,
       count(*) as segments,
       round(sum(end_ms - start_ms) / 1000.0) as talk_seconds
from seg_ranked
where rn = 1
group by 1, 2, 3
order by recording_id, talk_seconds desc
```

`speaker_label` is filled only when a name was assigned in AI Voice Console. The label is not verified employment identity.

## 6. Find utterances containing a keyword in selected recordings

Perform the keyword search **after** scope selection and deduplication. This is literal substring search, not a search of every accessible call. Replace `{keyword}` with the safely escaped user keyword (for example `価格改定`, "price revision"). State the selected population when reporting no matches.

```sql
-- q6: selected-keyword-search
with {recording_scope_cte},
seg_ranked as (
  select seg.organization_id, seg.recording_id, seg.time, seg.segment_index,
         seg.start_ms, seg.speaker_label, seg.speaker_id, seg.text,
         row_number() over (
           partition by seg.organization_id, seg.unique_id order by seg.updated_at desc
         ) as rn
  from {database}.transcript_segments seg
  join recording_scope sc
    on seg.organization_id = sc.organization_id and seg.recording_id = sc.recording_id
  where td_time_range(seg.time, '{segment_partition_start_utc}', '{segment_partition_end_utc}', 'UTC')
    and seg.time >= sc.recording_time and seg.time < sc.segment_end_time
),
r_ranked as (
  select r.organization_id, r.id, r.inferred_name,
         row_number() over (
           partition by r.organization_id, r.unique_id order by r.updated_at desc
         ) as rn
  from {database}.recordings r
  join recording_scope sc
    on r.organization_id = sc.organization_id and r.id = sc.recording_id
  where td_time_range(r.time, '{recording_partition_start_utc}', '{recording_partition_end_utc}', 'UTC')
    and r.time = sc.recording_time
)
select seg.organization_id, seg.recording_id,
       td_time_string(seg.time, 's', '{tz}') as utterance_at,
       seg.start_ms / 1000.0 as start_sec, r.inferred_name as title,
       coalesce(nullif(seg.speaker_label, ''), seg.speaker_id) as speaker, seg.text
from seg_ranked seg
left join r_ranked r
  on r.organization_id = seg.organization_id and r.id = seg.recording_id and r.rn = 1
where seg.rn = 1 and strpos(seg.text, '{keyword}') > 0
order by seg.time, seg.recording_id, seg.segment_index
limit 50
```

## 7. Expand selected action items into one row each

`action_items` and `tags` are arrays. Use `cross join unnest(...)`, but only after narrowing the content source to the selected IDs. AI action items are generated evidence, not proof of completion.

```sql
-- q7: selected-action-items
with {recording_scope_cte},
s_ranked as (
  select s.organization_id, s.recording_id, s.time, s.inferred_name, s.action_items,
         row_number() over (
           partition by s.organization_id, s.unique_id order by s.updated_at desc
         ) as rn
  from {database}.summaries s
  join recording_scope sc
    on s.organization_id = sc.organization_id and s.recording_id = sc.recording_id
  where td_time_range(s.time, '{recording_partition_start_utc}', '{recording_partition_end_utc}', 'UTC')
    and s.time = sc.recording_time
)
select s.organization_id, s.recording_id,
       td_time_string(s.time, 's', '{tz}') as recorded_at,
       s.inferred_name as title, t.item as action_item
from s_ranked s
cross join unnest(s.action_items) as t(item)
where s.rn = 1
order by s.time desc, s.recording_id
```

## 8. Aggregate metadata: number of recordings per tag

This is an explicitly requested organization-level metadata count under database authorization. It does not read transcript, summary, actions, or inferred title, and does not establish a selected content scope. Tags are user-supplied metadata; do not use arbitrary tags to bypass the preview gate. For own-only counts, add `and r.user_email = '{requester_email}'` to the final `where`.

```sql
-- q8: aggregate-tags
with r_ranked as (
  select r.organization_id, r.user_email, r.tags,
         row_number() over (
           partition by r.organization_id, r.unique_id order by r.updated_at desc
         ) as rn
  from {database}.recordings r
  where r.organization_id = '{organization_id}'
    and td_time_range(r.time, '{period_start}', '{period_end}', '{tz}')
)
select t.tag as tag, count(*) as recordings
from r_ranked r
cross join unnest(r.tags) as t(tag)
where r.rn = 1
group by 1
order by recordings desc
```

## 9. Link recording metadata to current device assignment

No inferred title or conversation content is fetched. The default is the user's own recording metadata. The current assignee is device inventory information, **not the historical recorder or a participant**. Never fill missing recorder identity from this join.

`{device_scan_start_utc}`/`{device_scan_end_utc}` are a separately approved heartbeat-history interval through the device snapshot cutoff, not the recording period. Choose a sufficiently complete permitted interval from known device/export retention history; if unavailable, omit device enrichment or report it as unknown/incomplete. No match does not mean "unassigned." Do not silently issue an unbounded device scan or claim an old bounded snapshot is current.

```sql
-- q9: recording-and-current-device-metadata
with r_ranked as (
  select r.organization_id, r.id, r.time, r.user_email, r.device_serial_number,
         row_number() over (
           partition by r.organization_id, r.unique_id order by r.updated_at desc
         ) as rn
  from {database}.recordings r
  where r.organization_id = '{organization_id}'
    and td_time_range(r.time, '{period_start}', '{period_end}', '{tz}')
),
d_ranked as (
  select d.organization_id, d.serial_number, d.device_model, d.status,
         d.assigned_user_name, d.assigned_user_email,
         row_number() over (
           partition by d.organization_id, d.unique_id order by d.updated_at desc
         ) as rn
  from {database}.devices d
  where d.organization_id = '{organization_id}'
    and td_time_range(d.time, '{device_scan_start_utc}', '{device_scan_end_utc}', 'UTC')
)
select r.organization_id, r.id as recording_id,
       r.user_email as recorder_email_at_recording, r.device_serial_number,
       d.device_model, d.assigned_user_name as current_assigned_user_name,
       d.assigned_user_email as current_assigned_user_email, d.status as device_status
from r_ranked r
left join d_ranked d
  on d.organization_id = r.organization_id and d.serial_number = r.device_serial_number and d.rn = 1
where r.rn = 1 and r.user_email = '{requester_email}'
order by r.time desc, r.id
limit 20
```

## 10. Aggregate metadata: counts by processing status

The explicitly requested organization-level population is separate from selected content. Failed/in-progress status can be counted without reading empty transcript/summary columns. To count own recordings only, add the recorder predicate after deduplication.

```sql
-- q10: aggregate-status
with r_ranked as (
  select r.organization_id, r.user_email, r.status,
         row_number() over (
           partition by r.organization_id, r.unique_id order by r.updated_at desc
         ) as rn
  from {database}.recordings r
  where r.organization_id = '{organization_id}'
    and td_time_range(r.time, '{period_start}', '{period_end}', '{tz}')
)
select status, count(*) as recordings
from r_ranked
where rn = 1
group by 1
order by recordings desc
```

## 11. Inspect external metadata on selected recordings

`external_metadata` is arbitrary JSON passed through deep links, not an authorization source. Keys are user-defined (example `recordRef`). Inspect only the selected recordings. Preserve identifier strings, including leading zeros and case; do not infer CRM state, ownership, or scope from a key. `try` returns null for malformed JSON; distinguish missing/malformed metadata when completeness matters rather than inventing a value.

```sql
-- q11: selected-external-metadata
with {recording_scope_cte},
r_ranked as (
  select r.organization_id, r.id, r.inferred_name, r.external_metadata,
         row_number() over (
           partition by r.organization_id, r.unique_id order by r.updated_at desc
         ) as rn
  from {database}.recordings r
  join recording_scope sc
    on r.organization_id = sc.organization_id and r.id = sc.recording_id
  where td_time_range(r.time, '{recording_partition_start_utc}', '{recording_partition_end_utc}', 'UTC')
    and r.time = sc.recording_time
)
select organization_id, id as recording_id, inferred_name as title,
       try(json_extract_scalar(external_metadata, '$.recordRef')) as record_ref
from r_ranked
where rn = 1 and external_metadata is not null
order by id
```
