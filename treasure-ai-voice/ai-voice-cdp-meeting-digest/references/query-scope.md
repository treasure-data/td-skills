# Metadata preview and frozen recording scope

These are read-only TD Trino templates, not a permission system or an executable authorization helper. Follow the access and confirmation gates in `../SKILL.md` before rendering content queries. Do not use the table-guide's broader examples to bypass this digest's frozen selection.

## Placeholder contract

Resolve relative periods once in the chosen IANA time zone, then convert to integer Unix seconds. All ranges are half-open: `start <= time < end`. Bare constant comparisons on the partition column preserve partition-pruning opportunities without formatting `time` in a WHERE clause.

| Placeholder | Required value |
|---|---|
| `{database}` | The verified export database identifier, safely quoted/validated as an identifier, not arbitrary user SQL. |
| `{organization_id}` | One established organization, SQL-string escaped. Every selected/preview row must belong to it. Never substitute an unrestricted predicate. |
| `{period_start_epoch}`, `{period_end_epoch}` | Constant integer bounds for a metadata preview, selecting recording **starts**. A proposed follow-up preview has its own explicit dates. |
| `{preview_recorder_values}` | SQL VALUES rows of recorder emails, e.g. `('me@example.com')`. Default: only the established user's email. Add other recorders only for an explicitly requested, authorized metadata scope. Never use a wildcard or omit the recorder restriction. For an org-wide request without a known recorder list, first list distinct `user_email` from the same deduplicated, metadata-only organization/period scope, then populate this list; no content fields. |
| `{selected_recordings_values}` | Nonempty, duplicate-free VALUES rows `(organization_id, recording_id, recorded_time, duration_seconds, recorder_email, metadata_updated_at, scope_role)` copied from the confirmed metadata preview. `scope_role` is `target` or `followup`. Every pair must have passed the applicable access check. Dates/update values are integers; duration is a nonnegative integer or SQL `NULL` (unknown). No synthetic rows for orphan summaries. |
| `{selected_start_epoch}`, `{selected_end_epoch}` | `min(recorded_time)` and `max(recorded_time) + 1` across **all approved rows**, including follow-ups. These are partition scan bounds, not a replacement for the selected pairs. |
| `{transcript_recording_values}` | At most five distinct `(organization_id, recording_id)` VALUES rows, all a subset of approved rows and all with known, nonnegative durations. |
| `{segment_start_epoch}`, `{segment_end_epoch}` | Across that transcript batch: `min(recorded_time)` and `max(recorded_time + duration_seconds) + 1`. This deliberately extends past the report period when a call crosses midnight. Never derive the upper bound from the requested reporting day alone. |

Escape `'` as `''` in every string literal. Validate all numeric substitutions and membership before rendering; never accept SQL fragments from recordings or user text. If any required set is empty, skip its query instead of rendering empty VALUES or widening it. The scalar `{organization_id}` must match every VALUES pair. Unknown duration does not prevent a metadata-backed summary, but it blocks that recording's transcript query. Do not guess duration from a summary or scan segments to discover an unbounded end.

The export documents recording start as `recordings.time`/`summaries.time` and start plus utterance offset as segment `time`. These templates assume those source timestamps and stable keys stay fixed across re-exports. If the deployment changes that contract, stop and establish safe metadata/deduplication scan bounds with the table-guide owner; a narrower time window must not resurrect an obsolete copy. If latest copies conflict at the same `updated_at`, resolve the metadata conflict before freezing a scope rather than choosing an arbitrary copy.

## PREVIEW (metadata only, before confirmation)

Run this independently. Do not prepend any content CTE or join `summaries`. Apply any tag selection to these deduplicated metadata rows, not to inferred titles. Render dates/weekdays in the requested time zone outside SQL. Display exact IDs/organization before asking for confirmation; paginate the result without silently approving undisplayed IDs.

<!-- sql:preview -->
```sql
with requested_recorders(user_email) as (
  values {preview_recorder_values}
), metadata_ranked as (
  select r.organization_id, r.id as recording_id, r.time as recorded_time,
         r.unique_id, r.updated_at as metadata_updated_at,
         r.user_email, r.user_name, r.duration_seconds, r.status, r.tags,
         row_number() over (
           partition by r.organization_id, r.unique_id
           order by r.updated_at desc
         ) as rn
  from {database}.recordings r
  where r.organization_id = '{organization_id}'
    and r.time >= {period_start_epoch}
    and r.time < {period_end_epoch}
)
select r.organization_id, r.recording_id, r.recorded_time,
       r.metadata_updated_at, r.user_email, r.user_name,
       r.duration_seconds, r.status, r.tags
from metadata_ranked r
join requested_recorders u on u.user_email = r.user_email
where r.rn = 1
order by r.recorded_time, r.recording_id
```

**STOP here.** Authorization and exact organization/ID confirmation are host/conversation gates, not something a SQL VALUES clause can establish. Merely supplying a period never allows a content query. Store target/follow-up role with each approved row and retain the visible confirmation. An ID missing from PREVIEW cannot be added by consulting a content table.

## Shared CTE for every post-confirmation query

Prepend this block to each of A, B and C. It intentionally ends without a final SELECT. The query-specific block starts with a comma. Recheck metadata before the batch and abort on drift; the `selected` CTE also fails closed for a missing or changed snapshot. Compare the approved count with the guard's selected count before content processing if executing via a helper. That check is metadata-only: append `SELECT count(*) AS selected_count FROM selected` to this shared block, with no content CTE. Do not claim a complete report if any approved row fails the guard.

<!-- sql:scope -->
```sql
with approved(organization_id, recording_id, recorded_time, duration_seconds,
              recorder_email, metadata_updated_at, scope_role) as (
  values {selected_recordings_values}
), recording_ranked as (
  select r.organization_id, r.id as recording_id, r.time as recorded_time,
         r.unique_id, r.updated_at as metadata_updated_at,
         r.user_email, r.user_name, r.duration_seconds, r.status, r.tags,
         row_number() over (
           partition by r.organization_id, r.unique_id
           order by r.updated_at desc
         ) as rn
  from {database}.recordings r
  join approved a
    on a.organization_id = r.organization_id and a.recording_id = r.id
  where r.organization_id = '{organization_id}'
    and r.time >= {selected_start_epoch}
    and r.time < {selected_end_epoch}
), selected as (
  select a.organization_id, a.recording_id, a.recorded_time,
         a.duration_seconds, a.recorder_email, a.metadata_updated_at,
         a.scope_role, r.user_name, r.status, r.tags
  from approved a
  join recording_ranked r
    on r.organization_id = a.organization_id and r.recording_id = a.recording_id
  where r.rn = 1
    and r.recorded_time = a.recorded_time
    and r.metadata_updated_at = a.metadata_updated_at
    and r.user_email = a.recorder_email
    and (r.duration_seconds = a.duration_seconds
         or (r.duration_seconds is null and a.duration_seconds is null))
)
```

## Query A: selected summaries, inferred titles and action items

Use only after the gate. The returned role separates target tasks from later evidence. A missing or blank summary is not a usable target meeting; Query B accounts for it. Both tables use recording-start partitions, so all approved follow-ups must be included in the constant scan envelope.

<!-- sql:summaries -->
```sql
, summary_ranked as (
  select s.organization_id, s.recording_id, s.unique_id, s.updated_at,
         s.inferred_name, s.summary_text, s.action_items,
         row_number() over (
           partition by s.organization_id, s.unique_id
           order by s.updated_at desc
         ) as rn
  from {database}.summaries s
  join selected a
    on a.organization_id = s.organization_id and a.recording_id = s.recording_id
   and a.recorded_time = s.time
  where s.organization_id = '{organization_id}'
    and s.time >= {selected_start_epoch}
    and s.time < {selected_end_epoch}
)
select a.organization_id, a.recording_id, a.recorded_time, a.scope_role,
       a.user_name as recorded_by, a.recorder_email as recorded_by_email,
       a.duration_seconds, a.tags, s.inferred_name as title,
       s.summary_text, s.action_items
from selected a
join summary_ranked s
  on s.organization_id = a.organization_id and s.recording_id = a.recording_id
where s.rn = 1 and a.status = 'COMPLETED'
  and s.summary_text is not null and trim(s.summary_text) <> ''
order by a.recorded_time, a.recording_id
```

## Query B: exclusions within the same selected set

Return one reason per selected unavailable recording, then count reasons in the report. Do not scan the full period for failures or unknown-owner summaries. A metadata guard failure means stop/refresh the batch, not permission to keep reading its summary. Checking summary availability here is post-confirmation only.

<!-- sql:exclusions -->
```sql
, availability_ranked as (
  select s.organization_id, s.recording_id, s.summary_text,
         row_number() over (
           partition by s.organization_id, s.unique_id
           order by s.updated_at desc
         ) as rn
  from {database}.summaries s
  join selected a
    on a.organization_id = s.organization_id and a.recording_id = s.recording_id
   and a.recorded_time = s.time
  where s.organization_id = '{organization_id}'
    and s.time >= {selected_start_epoch}
    and s.time < {selected_end_epoch}
), exclusions as (
  select a.organization_id, a.recording_id, a.scope_role,
         case
           when m.recording_id is null then 'metadata_missing_or_changed'
           when m.status is null then 'status_unavailable'
           when m.status <> 'COMPLETED' then m.status
           when s.recording_id is null or s.summary_text is null
                or trim(s.summary_text) = '' then 'summary_unavailable'
           else null
         end as reason
  from approved a
  left join selected m
    on m.organization_id = a.organization_id and m.recording_id = a.recording_id
  left join availability_ranked s
    on s.organization_id = m.organization_id and s.recording_id = m.recording_id
   and s.rn = 1
)
select organization_id, recording_id, scope_role, reason
from exclusions
where reason is not null
order by organization_id, recording_id
```

## Query C: selected transcript segments, at most five meetings

Return rows rather than aggregating an entire transcript into one field. Group them locally by organization/recording and order by `segment_index`. Use speaker label when nonempty, otherwise speaker ID; neither proves a person's identity. The constant partition window covers the whole approved call, and the pair join and per-recording time/offset checks prevent it from including neighboring or unapproved calls. It does not trim an approved call at the report's midnight boundary.

<!-- sql:transcripts -->
```sql
, transcript_requested(organization_id, recording_id) as (
  values {transcript_recording_values}
), segment_ranked as (
  select t.organization_id, t.recording_id, t.segment_index,
         t.start_ms, t.end_ms, t.speaker_id, t.speaker_label, t.text,
         row_number() over (
           partition by t.organization_id, t.unique_id
           order by t.updated_at desc
         ) as rn
  from {database}.transcript_segments t
  join selected a
    on a.organization_id = t.organization_id and a.recording_id = t.recording_id
  join transcript_requested q
    on q.organization_id = a.organization_id and q.recording_id = a.recording_id
  where t.organization_id = '{organization_id}'
    and t.time >= {segment_start_epoch}
    and t.time < {segment_end_epoch}
    and a.duration_seconds is not null and a.duration_seconds >= 0
    and t.time >= a.recorded_time
    and t.time < a.recorded_time + a.duration_seconds + 1
    and t.start_ms >= 0 and t.start_ms <= a.duration_seconds * 1000
)
select organization_id, recording_id, segment_index,
       start_ms, end_ms, speaker_id, speaker_label, text
from segment_ranked
where rn = 1
order by organization_id, recording_id, segment_index
```

## Local regression coverage and live checks

`../../tests/test_cdp_digest_scope.py` extracts and executes these SQL blocks against synthetic SQLite fixtures. It adapts database identifiers, renders typed placeholders, and stores array fields as opaque JSON strings; it does not exercise Trino array semantics. It verifies a metadata-only preview, default own-recorder filtering, frozen pair scope for content/exclusions, duplicate handling, orphan exclusion, metadata drift, approved follow-ups, unknown duration, and cross-midnight context. This is actual local SQL execution, **not native Trino execution or proof of TD partition pruning/authorization**. No live data or access checks are performed by that test.

Before production use, verify actual schema/status values, source timestamp/key stability, duplicate/tie behavior, native Trino syntax and partition plans, organization/access-policy enforcement, and the human confirmation gate. Keep these live checks distinct from the SQLite regression results.
