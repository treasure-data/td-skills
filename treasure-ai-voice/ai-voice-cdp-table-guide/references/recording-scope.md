# Recording selection helper

`scripts/recording_scope.py` is a standard-library-only, local SQL-fragment builder. It does not query CDP, read credentials, resolve identity, change profiles, run workflows, write output files, or enforce service permissions. Its inputs are caller-supplied metadata and selection records, not verified authorization claims. Keep runtime inputs/outputs in a session scratch directory, not in the installed skill.

## Trust boundary and order

1. Establish actual database/organization read authorization through the environment's existing controls. A configured `policy_ref`, an email string, an organization ID, or user confirmation cannot grant entitlement. The helper does not accept policy/permission flags.
2. Resolve the requester email and the authorized organization; stop if either is unknown. Run the bounded metadata-only preview in Query 2, deduplicated before owner filtering. Default to the requester's recordings. No inferred titles, text, summaries, or actions may be fetched to construct the preview, even if later discarded locally.
3. If needed, preview the requested wider metadata scope and confirm the exact other-recorder IDs. Resolve ambiguity before selecting. Keep a record of the list and the user's response outside the helper. A returned CTE is not proof that this interaction occurred.
4. Pass the preview and exact selection to the helper. Bind the result to this purpose, database, organization, period, and cutoff in the session. Do not reuse it after scope/connection changes or materially changed recorder/time metadata; refresh metadata and confirmation instead.
5. Use the returned CTE and bounds in every content source as shown in the query collection. Never replace an error or empty result with a broader SQL predicate. Check/report excluded metadata and discovery limits. Stop when an explicitly selected ID cannot be admitted.

The helper intentionally has **no missing-parent override**. It does not inspect summaries or segments to infer ownership. Even a confirmed organization-wide request does not admit a recording whose parent is missing. An independent, approved historical mapping requires a separately reviewed adapter that establishes exact organization, ID, historical recorder, start/end bounds, provenance, authorization, and selection. A scalar reference or current device assignment is insufficient.

## Exact interface

Importable API:

```python
build_scope(payload: dict) -> dict  # raises ScopeError (a ValueError) on unresolved scope
```

The function is synchronous and has no service or filesystem side effects. The command-line interface reads one UTF-8 JSON object from a file, or stdin with `--input -`, and prints one JSON object:

```bash
python3 -I -B /path/to/ai-voice-cdp-table-guide/scripts/recording_scope.py --input /session/scratch/metadata-selection.json
```

Exit status is `0` on success and `2` on invalid JSON, unreadable input, or unresolved scope. Errors go to stderr and no scope is emitted. No query is executed. Do not continue to a content query on nonzero exit status.

### Input

The following is synthetic metadata, not exported customer data. The call begins at `2026-10-31 23:59:00 +09:00`, lasts three minutes, and crosses the month boundary.

```json
{
  "organization_id": "org-demo",
  "requester_email": "me@test.com",
  "metadata_rows": [
    {
      "organization_id": "org-demo",
      "recording_id": "demo-call-1",
      "recording_time": 1793458740,
      "recorder_email": "me@test.com",
      "duration_seconds": 180,
      "parent_metadata_present": true,
      "recorded_at": "2026-10-31 23:59:00 +09:00",
      "recorder_name": "Demo Recorder",
      "status": "COMPLETED"
    }
  ],
  "selected_recording_ids": ["demo-call-1"],
  "confirmed_other_recording_ids": []
}
```

Top-level keys:

| Key | Contract |
|---|---|
| `organization_id` | Required nonempty, unpadded string. An already established authorized organization, not proof of authorization. |
| `requester_email` | Required nonempty, unpadded string. Exact match to the recorder metadata, no implicit lowercasing or identity inference. |
| `metadata_rows` | Required list of objects from the bounded, deduplicated parent preview. No content fields. |
| `selected_recording_ids` | Optional list of unique, nonempty strings. If absent, select all admissible own recordings in **this preview only**, not all calls in the database. If present, must be nonempty; every ID must be admitted in the requested organization. |
| `confirmed_other_recording_ids` | Optional list, default `[]`. Every selected other-recorder ID must appear here and in the explicit selection. Only those IDs may appear. This records the caller's assertion of user selection, not permission or independently verified consent. |

Each metadata row requires `organization_id` and `recording_id`. Admission additionally requires `parent_metadata_present: true`, a nonempty `recorder_email`, integer epoch-second `recording_time >= 0`, and integer `duration_seconds > 0`. `recorded_at`, `recorder_name`, and `status` are optional display metadata. These are the only allowed row fields; unexpected content/configuration fields are rejected rather than used as evidence. The helper cannot prove that `parent_metadata_present` is truthful; the caller must obtain it from the actual parent preview, not invent it.

Rows from another organization cannot be selected. Duplicate IDs within the requested organization are errors (deduplication/conflicts must be resolved upstream). Missing parent, unknown recorder, or invalid timing metadata is excluded with a reason; explicitly selecting such a row is an error. Missing organization/ID and malformed input are errors. An empty default-own selection is an error. No error triggers a broad fallback.

### Output

- `organization_id`, `selected_recording_ids` (sorted by call start then ID), and `selected_count` describe the admitted fixed set.
- `excluded` lists inadmissible requested-organization metadata rows as `{recording_id, reason}`. Other-organization rows are not admitted or disclosed in this list. Valid but unselected rows are simply not in the CTE. An excluded row is not evidence of a missing call's contents.
- `recording_partition_start_utc`/`recording_partition_end_utc` span the selected start seconds (`min(start)` through `max(start) + 1`, exclusive). Use these for `recordings` and `summaries`.
- `segment_partition_start_utc`/`segment_partition_end_utc` span the full selected calls (`min(start)` through `max(start + duration_seconds + 1)`, exclusive). The additional second retains final-second segment timestamps at integer precision. Use these for `transcript_segments`, plus per-call bounds from the CTE. Do not intersect with the original calendar period.
- `recording_scope_cte` is a Trino-compatible literal `VALUES` CTE fragment, with no leading `with`. Its columns are `organization_id`, `recording_id`, `recorder_email`, `recording_time`, `segment_end_time`. String values are SQL-literal escaped; numeric bounds are validated integers. Paste only helper-generated SQL, never exported text masquerading as SQL.

For the synthetic row above, the recording bounds are `2026-10-31 14:59:00`–`2026-10-31 14:59:01` UTC. The segment end is `2026-10-31 15:02:01` UTC (`2026-11-01 00:02:01 +09:00`). The segment `time` already equals recording start plus utterance offset; display it directly with the timezone offset, not with the offset added twice.

## Local fixture checks and limits

From the td-skills repository root:

```bash
python3 -I -B -m unittest discover -s treasure-ai-voice/tests -p 'test_cdp_recording_scope.py' -v
```

The tests use synthetic metadata and standard-library SQLite analogues of the documented SQL, with explicitly substituted time/array/JSON functions. They check default-own selection, named other-recorder confirmation, empty/unknown scope rejection, organization/ID collisions, missing parents, deduplication, source-level ID joins, keyword search, action expansion, full text, current-versus-historical device identity, and full selected call context across midnight.

**These are NOT Trino execution, query-planner/I/O isolation proof, permission tests, or staging evidence.** Before production use, validate TD Trino syntax/types, partition pruning, the physical content-read boundary under deployed access controls, real export timestamp/duration precision, organization identity, and required database/organization authorization. Verify complete device heartbeat coverage separately. Any independent historical mapping remains an integration/approval prerequisite, not functionality claimed by this helper.
