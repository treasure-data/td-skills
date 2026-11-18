# The 4 tables of the AI Voice export: column definitions

Definitions of the 4 tables that the Treasure AI Voice export to Treasure Data CDP writes. The source is the schema reference in the official Treasure AI Voice documentation, "Treasure Data CDP連携" (https://docs.treasure.ai/ja/products/ai-voice/cdp-integration).

Last checked against the documentation and a live export: 2026-11-16. The actual columns of the user's export always take priority over this file (see "Keeping the schema current" in SKILL.md).

## Overview of the tables

| Table | Contents | One row per |
|---|---|---|
| `recordings` | Metadata, the full transcript with speaker labels, AI summary, action items | recording |
| `transcript_segments` | The transcript split into individual timestamped utterances. Includes speaker attribution and per-segment language detection | utterance |
| `summaries` | The AI-generated summary and action items, separated out so they are easy to join. A row is generated only for recordings that have a summary | summarized recording |
| `devices` | The organization's PLAUD device fleet: assignment, status, firmware, last-seen timestamp | device |

Join keys:
- `recordings.id` = `transcript_segments.recording_id` = `summaries.recording_id`
- `recordings.device_serial_number` = `devices.serial_number`

## Columns present in every table

| Column | Type | Description |
|---|---|---|
| `time` | long | Unix epoch seconds that CDP uses for time partitioning. What it points to differs by table (see below) |
| `unique_id` | string | A stable identifier derived from the source record. The same source record always gets the same `unique_id` |
| `updated_at` | long | Last update time of the source record (Unix epoch seconds). For old records where the source update time was not kept, a substitute time that differs by table is stored |

CDP **appends** incoming events instead of replacing existing rows. A re-export can create multiple rows with the same `unique_id`. Use `updated_at` to identify the latest copy. Use `time` to narrow partitions, and use `updated_at` for freshness and deduplication.

## `recordings`

| Column | Type | Description |
|---|---|---|
| `time` | long | Unix epoch seconds of `recorded_at`. Used for time partitioning |
| `unique_id` | string | Stable identifier of this recording row. Combine with `updated_at` to deduplicate on re-runs |
| `updated_at` | long | Last update time of the source recording (Unix epoch seconds). For old records, `recorded_at` may be used as the substitute value |
| `id` | string | Recording ID (matches `recording_id` in the other tables) |
| `organization_id` | string | Organization identifier |
| `recorded_at` | string | ISO 8601 timestamp of when the recording was captured |
| `user_email` | string | Email address of the member who created the recording |
| `user_name` | string | Display name of the member who created the recording |
| `file_name` | string | Original file name of the recording |
| `duration_seconds` | long | Length of the recording (seconds) |
| `status` | string | Processing status (example: `COMPLETED`) |
| `transcription_language` | string | Main language detected in the transcription |
| `transcription_text` | string | The full transcript. Text with speaker labels, grouped by speaker, in the same format that an administrator sees when opening the recording in the AI Voice Console |
| `summary_text` | string | AI-generated summary of the recording |
| `action_items` | array&lt;string&gt; | Action items extracted by AI |
| `inferred_name` | string | Title of the recording inferred by AI |
| `tags` | array&lt;string&gt; | Tags applied to the recording |
| `device_serial_number` | string | Serial number of the PLAUD device used for the recording |
| `team_id` | string | Identifier of the team the recording is associated with. **Not populated yet: do not use it** for grouping, filtering or output |
| `external_metadata` | string | JSON string of metadata passed to the recording through a deep link (record reference key, session reference key, and so on). `null` for recordings without external metadata |

Note: if the transcript exceeds the 1 MB event size limit (usually recordings longer than 3 hours), the whole `recordings` row of that recording is rejected by the CDP Ingest API. The export continues and finishes with `partial` status. The rows in `transcript_segments` and `summaries` are not affected.

## `transcript_segments`

| Column | Type | Description |
|---|---|---|
| `time` | long | Unix epoch seconds of the recording datetime plus the start offset of the segment |
| `unique_id` | string | Stable identifier of this segment row. Combine with `updated_at` to deduplicate on re-runs |
| `updated_at` | long | Last update time of the parent recording (Unix epoch seconds). For old records, the recording datetime may be used as the substitute value |
| `recording_id` | string | ID of the parent recording. Join with `recordings.id` |
| `organization_id` | string | Organization identifier |
| `segment_index` | long | Position of the segment within the recording (zero-based) |
| `start_ms` | long | Start offset of the segment from the beginning of the recording (milliseconds) |
| `end_ms` | long | End offset of the segment from the beginning of the recording (milliseconds) |
| `speaker_id` | string | Raw speaker identifier from diarization (example: `spk_0`) |
| `speaker_label` | string | The speaker name if one was assigned in the AI Voice Console. Empty if none was assigned |
| `language` | string | Language detected in the segment |
| `language_probability` | double | Confidence of the language detection for the segment |
| `text` | string | Transcript text of the segment |

## `summaries`

| Column | Type | Description |
|---|---|---|
| `time` | long | Unix epoch seconds of `recorded_at` |
| `unique_id` | string | Stable identifier of this summary row. Combine with `updated_at` to deduplicate on re-runs |
| `updated_at` | long | Last update time of the parent recording (Unix epoch seconds). For old records, the recording datetime may be used as the substitute value |
| `recording_id` | string | The recording this summary belongs to. Join with `recordings.id` |
| `organization_id` | string | Organization identifier |
| `recorded_at` | string | ISO 8601 timestamp of the original recording |
| `summary_text` | string | AI-generated summary |
| `action_items` | array&lt;string&gt; | Action items extracted by AI |
| `inferred_name` | string | Title of the recording inferred by AI |

## `devices`

| Column | Type | Description |
|---|---|---|
| `time` | long | Unix epoch seconds of the last heartbeat (the provisioning time if the device has never reported) |
| `unique_id` | string | Stable identifier of this device row. Combine with `updated_at` to deduplicate on re-runs |
| `updated_at` | long | Last update time of the source device (Unix epoch seconds). For old records, a timestamp that represents the device content may be used as the substitute value |
| `serial_number` | string | Serial number of the device |
| `organization_id` | string | Organization identifier |
| `status` | string | Current device status (examples: `ACTIVE`, `LOCKED`) |
| `device_model` | string | Device model (examples: Note Pro, NotePin S) |
| `firmware_version` | string | Currently installed firmware version |
| `assigned_user_email` | string | Email address of the member the device is assigned to |
| `assigned_user_name` | string | Display name of the member the device is assigned to |
| `assigned_at` | string | ISO 8601 timestamp of when the device was assigned |
| `provisioned_at` | string | ISO 8601 timestamp of when the device was provisioned |
| `last_heartbeat_at` | string | ISO 8601 timestamp of the device's most recent status report |
| `last_sync_at` | string | ISO 8601 timestamp of the device's most recent sync with the mobile app |

## Export scope and limits

- `recordings`, `transcript_segments` and `summaries` reflect the recordings in the scope of that run. `devices` is not narrowed by recording datetime, and the first export may include all devices. In an incremental export, devices updated since the checkpoint are included.
- Recordings are included regardless of processing status. For recordings whose transcription or summary is not finished yet, `transcription_text`, `summary_text` and related columns are empty.
- Scheduled exports and exports without a date range use an incremental checkpoint. If "Re-export previously exported recordings" (「以前にエクスポートした録音を再エクスポート」) is selected, that run does not use the checkpoint and resends all records in the selected range (the same rows are appended again).
- A single recording event cannot exceed 1 MB, and a single batch cannot exceed 4 MB. The shortest interval for scheduled exports is 1 hour. Only one export can run at a time per organization. Rejected rows or worker time limits can make a run Partial.
