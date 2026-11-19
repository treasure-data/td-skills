# Monitoring Databases — Schema Reference

**History tables (`*_history`) have the identical column schema to their base table** — same columns, same types. The only difference is `time`, which is the daily snapshot timestamp rather than the base table's ingestion time. They are not listed separately below.

---

## `basic_monitoring_<suffix>` — Jobs, Schedules, Connections, Users, Policies

| Table | What it contains |
|---|---|
| `jobs` | All jobs — status, duration, type, user, query |
| `schedules` | Scheduled queries — cron, database, user, result destination |
| `connections` | Connection names and URLs |
| `connections_details` | Connection IDs and names |
| `sources` | Data source configs — cron, database, table, connection config |
| `users` | Account users — roles, admin status, org details |
| `databases` | All databases — row count, timestamps |
| `policies` | Permission policies and user counts |
| `policies_detail` | Policy permission strings |
| `policies_assign_users` | Which users are assigned to each policy (JSON array) |
| `policies_detail_column` | Column-level permission rules per policy |
| `user_assign_policies` | Full permission map per user |
| `*_history` | Daily snapshots exist for: `connections`, `connections_details`, `databases`, `policies`, `policies_assign_users`, `policies_detail`, `policies_detail_column`, `schedules`, `sources`, `users`, `user_assign_policies`. **Note:** `jobs_history` does NOT exist — jobs are event-level and queried directly with time filters. |

**Columns — `jobs`** (24):
```
job_id (bigint), status (varchar), type (varchar), duration (double, seconds),
user_name (varchar), database (varchar), query (varchar),
start_at (varchar), end_at (varchar), created_at (varchar), updated_at (varchar),
num_records (double), result_size (double), priority (bigint), retry_limit (bigint),
cpu_time (varchar), organization (varchar), url (varchar), debug (varchar),
result (varchar), hive_result_schema (varchar),
linked_result_export_job_id (varchar), result_export_target_job_id (varchar),
time (bigint — Unixtime)
```

**Columns — `schedules`** (14):
```
name (varchar), cron (varchar), timezone (varchar), type (varchar),
database (varchar), user_name (varchar), next_time (varchar),
delay (bigint), query (varchar — full SQL), priority (bigint),
retry_limit (bigint), result (varchar — destination config, e.g. S3/Snapchat),
created_at (varchar), time (bigint — Unixtime)
```

**Columns — `connections`** (4):
```
name (varchar), url (varchar), organization (varchar), time (bigint — Unixtime)
```

**Columns — `connections_details`** (3):
```
id (bigint), name (varchar), time (bigint — Unixtime)
```

**Columns — `sources`** (11):
```
id (bigint), name (varchar), cron (varchar), timezone (varchar),
delay (bigint), start_at (varchar), database (varchar), table (varchar),
config (JSON — connection config with auth), config_diff (JSON),
time (bigint — Unixtime)
```

**Columns — `users`** (17):
```
id (bigint), email (varchar), name (varchar), first_name (varchar),
last_name (varchar), administrator (varchar), account_owner (varchar),
default_apikey_expiration_days (varchar), roles (varchar), organization (varchar),
phone (varchar), created_at (varchar), updated_at (varchar), identifier (varchar),
full_qualified_identifier (varchar), gravatar_url (varchar), time (bigint — Unixtime)
```

**Columns — `databases`** (9):
```
id (varchar), name (varchar), created_at (varchar), updated_at (varchar),
count (bigint), organization (varchar), delete_protected (varchar),
datatank (varchar), time (bigint — Unixtime)
```

**Columns — `policies`** (6):
```
id (bigint), account_id (bigint), name (varchar), description (varchar),
user_count (bigint), time (bigint — Unixtime)
```

**Columns — `policies_detail`** (3):
```
id (bigint), permissions (varchar — permission string), time (bigint — Unixtime)
```

**Columns — `policies_assign_users`** (3):
```
id (bigint), assign_users (JSON array: [{user_id, account_id, name}]), time (bigint — Unixtime)
```

**Columns — `policies_detail_column`** (3):
```
id (bigint), column_permissions (JSON array: [{tags, except}]), time (bigint — Unixtime)
```

**Columns — `user_assign_policies`** (3):
```
id (bigint), assign_policy (JSON: {account_id, user_id, permissions}), time (bigint — Unixtime)
```

---

## `cdp_monitoring_<suffix>` — Parent Segments, Entities, Journeys, Activations

Most CDP tables store rich metadata in a JSON `attributes` column — use `JSON_EXTRACT_SCALAR(attributes, '$.field')` to extract values. **`activations` is the exception: it's flat columns, no `attributes` column at all.**

| Table | What it contains |
|---|---|
| `parent_segments` | All parent segments — name, population, schedule (JSON `attributes` column) |
| `parent_segments_configuration` | Rich flat table — same segments with 27 named columns, no JSON needed. **⚠ Only exists in the non-suffixed `cdp_monitoring` database, not in `cdp_monitoring_<suffix>` deployments.** |
| `parent_segments_configuration_history` | Daily snapshots of the configuration table (non-suffixed DB only) |
| `entities` | CDP entity definitions — type includes `folder-segment` |
| `journey_summary` | Journey metadata — state, launch status, stages |
| `journey_statistics` | Journey audience sizes, completion rates, goal tracking |
| `journey_activation` | Activation steps within journeys — JSON `attributes` column, but its key fields are frequently null (see below) |
| `activations` | All activations — connection, schedule, validity, executions. **Flat columns — no `attributes` column.** |
| `*_history` | Daily snapshots exist for the main tables above |

**Columns — `parent_segments`** (5):
```
id (varchar), type (varchar), attributes (JSON), relationships (JSON),
time (bigint — Unixtime)
```
`attributes` — key JSON fields:
```
$.name            — segment name
$.population      — current audience size (cast to BIGINT)
$.scheduleType    — 'daily', 'hourly', 'none'
$.timezone        — timezone string
$.updatedAt       — ISO timestamp of last update
$.matrixUpdatedAt — ISO timestamp of last matrix build
$.allowActivationBehavior — boolean
```
`relationships` — JSON object, e.g.:
```json
{"parentSegmentFolder": {"data": {"id": "419914", "type": "folder-segment"}},
 "parentFolder": {"data": {"id": "419914", "type": "folder-segment"}}}
```

**Columns — `parent_segments_configuration`** (27 — flat, no JSON extraction needed for most fields):
```
id, name, description, scheduletype, scheduleoption, timezone,
createdat, updatedat, createdby, updatedby, matrixupdatedat,
population (varchar — float string e.g. '1.0', use CAST(CAST(population AS DOUBLE) AS BIGINT)),
maxactivationbehaviorrow (bigint), allowactivationbehavior, llmstate, llmenabled,
rootfolderid, master, workflowhiveonly, hiveengineversion, hivepoolname, prestopoolname,
attributes (JSON), behaviors (JSON), audiencefilters (JSON), customergroup, time (bigint)
```

**Columns — `entities`** (5):
```
id (varchar), type (varchar — e.g. 'folder-segment'),
attributes (JSON), relationships (JSON), time (bigint — Unixtime)
```

**Columns — `journey_summary`** (6):
```
id (varchar), type (varchar), attributes (JSON), relationships (JSON),
journey_id (varchar), time (bigint — Unixtime)
```
`attributes` — key JSON fields:
```
$.name            — journey name
$.state           — 'draft', 'launched', 'stopped'
$.paused          — boolean
$.launchedAt      — ISO timestamp or null
$.updatedAt       — ISO timestamp
$.audienceId      — linked parent segment ID
$.allowReentry    — boolean
$.reentryMode     — reentry strategy string
```
`relationships` — JSON object, e.g.:
```json
{"parentFolder": {"data": {"id": "361232", "type": "folder-segment"}},
 "createdBy": {"data": {"id": "7968", "type": "user"}},
 "updatedBy": {"data": {"id": "7968", "type": "user"}},
 "activations": {"data": [{"id": "135642", "type": "syndication"}]},
 "journeyActivationSteps": {"data": [{"id": "4009", "type": "journeyActivationStep"}]},
 "jumpFrom": {"data": []}, "jumpTo": {"data": []}}
```

**Columns — `journey_statistics`** (5):
```
id (varchar), type (varchar), attributes (JSON), journey_id (varchar — top-level, use for JOINs),
time (bigint — Unixtime)
```
`attributes` — key JSON fields:
```
$.journeyId       — journey ID (also in attributes)
$.size            — total audience in journey (BIGINT)
$.enteredSize     — users who entered (BIGINT)
$.completionRate  — 0.0–1.0 (cast to DOUBLE)
$.goalSize        — users who reached the goal (BIGINT)
$.exitOrJumpSize  — users who exited/jumped (BIGINT)
$.journeyStageStatistics — array of per-stage stats (complex JSON)
```

**Columns — `journey_activation`** (6):
```
id (varchar), type (varchar), journey_id (varchar),
attributes (JSON), relationships (JSON), time (bigint — Unixtime)
```
`attributes` — key JSON fields:
```
$.syndicationId   — links to activations.id
$.activationId    — links to activations.id
$.runStatus       — execution status of this activation step
$.lastUpdated     — ISO timestamp of last update
```
**⚠ These fields are frequently `null`** — they're only populated once the activation step has actually fired at least once. A journey step that hasn't run yet (or an activation added after the journey launched) will have `null` here even though the step is configured correctly. **Don't treat a null here as "broken" or "never configured."** For reliable execution-level data (status, errors, run history), join to the `activations` table on activation ID instead — see `activations.executions` below.

**Columns — `activations`** (21):
```
id (varchar), name (varchar), description (varchar),
segmentid (varchar — parent segment ID, same entity as ps_id),
audienceid (varchar), connectionid (varchar), activationtemplateid (varchar),
scheduletype (varchar — 'none'|'daily'|'weekly'|'monthly'|'run_after_ps_refresh'),
valid (varchar — 'true'/'false'; 'false' means the activation will not run),
allcolumns (varchar — 'true'/'false'),
columns (JSON array — per-column mapping,
  e.g. [{"column": "first_name", "source": {"column": "first_name", "functions": []}, "id": "..."}]),
connectorconfig (JSON), executions (JSON array — see below),
createdat (varchar), updatedat (varchar),
createdby (varchar), updatedby (varchar),
notifyon (varchar), emailrecipients (varchar),
ps_id (varchar — parent segment ID), time (bigint — Unixtime)
```
**No `attributes` column** — unlike most other CDP tables, every field above is a flat top-level column. Don't use `JSON_EXTRACT_SCALAR(attributes, ...)` against `activations`.

`executions` — JSON array of per-run execution objects, e.g. `[{"status": "error", "syndicationId": "...", "workflowId": "...", "errorMessage": "..."}]`. Key fields per object:
```
$.status        — 'success'|'error'|'running'|'canceled'
$.syndicationId — execution/syndication identifier
$.workflowId    — the workflow run that performed this execution
$.errorMessage  — present when $.status = 'error'
```
This is the only reliable source of execution-level failure data for activations — `journey_activation.attributes` is frequently null for the same information (see above). Query it with:
```sql
SELECT
  a.id AS activation_id,
  a.name AS activation_name,
  JSON_EXTRACT_SCALAR(e, '$.status') AS status,
  JSON_EXTRACT_SCALAR(e, '$.errorMessage') AS error_message
FROM <db>.activations a
CROSS JOIN UNNEST(CAST(JSON_PARSE(a.executions) AS ARRAY(JSON))) AS t(e)
WHERE a.executions != '[]' AND a.executions IS NOT NULL
```

---

## `workflow_monitoring_<suffix>` — Workflow Projects, Sessions, Attempts

**Important:** `project` and `workflow` columns in `attempts` and `sessions` are JSON strings. Use `JSON_EXTRACT_SCALAR` to extract names.

| Table | What it contains |
|---|---|
| `projects` | All workflow projects — name, revision, metadata |
| `workflows` | Workflow definitions per project — config (digdag YAML) |
| `sessions` | Workflow sessions (one per scheduled run) — last attempt status |
| `attempts` | Execution attempts — status, timing |
| `schedules` | Workflow schedules — next run time, disabled status |
| `revisions` | Project revision history — who pushed, when |
| `*_history` | Daily snapshots exist for: `projects`, `workflows`, `revisions`, `schedules`. **Note:** `attempts_history` and `sessions_history` do NOT exist — attempts/sessions are event-level, query directly with time filters. |

**Columns — `projects`** (10):
```
id (varchar), name (varchar), revision (varchar),
createdat (varchar), updatedat (varchar), deletedat (varchar),
archivetype (varchar), archivemd5 (varchar),
metadata (JSON array: [{key, value}]), time (bigint — Unixtime)
```

**Columns — `workflows`** (7):
```
id (varchar), name (varchar), revision (varchar), timezone (varchar),
project (varchar — JSON: {id, name}),
config (JSON — full digdag YAML), time (bigint — Unixtime)
```

**Columns — `sessions`** (7):
```
id (bigint), sessionuuid (varchar), sessiontime (varchar),
project (varchar — JSON: {id, name}),
workflow (varchar — JSON: {id, name}),
lastattempt (JSON: {id, done, success, retryAttemptName}), time (bigint — Unixtime)
```

**Columns — `schedules`** (7):
```
id (varchar), nextruntime (varchar), nextscheduletime (varchar),
disabledat (varchar — null/empty if enabled, ISO timestamp if disabled),
project (varchar — JSON: {id, name}),
workflow (varchar — JSON: {id, name}), time (bigint — Unixtime)
```

**Columns — `revisions`** (7):
```
revision (varchar — UUID), projectid (varchar),
createdat (varchar), archivetype (varchar), archivemd5 (varchar),
userinfo (JSON: {td: {user: {id, name}}}), time (bigint — Unixtime)
```

**Columns — `attempts`** (17):
```
id (bigint), index (bigint),
project (varchar — JSON: {"id": "...", "name": "..."}),
workflow (varchar — JSON: {"id": "...", "name": "..."}),
sessionid (varchar), sessionuuid (varchar), sessiontime (varchar),
retryattemptname (varchar — empty unless this is a retry),
status (varchar), done (varchar), success (varchar), cancelrequested (varchar),
params (JSON — session params, e.g. {"_td_.revision_created_user_id": ..., "last_session_time": ..., "next_session_time": ...}),
poolid (varchar), createdat (varchar — ISO timestamp), finishedat (varchar — ISO timestamp),
time (bigint — Unixtime)
```

**Extract project/workflow names from attempts:**
```sql
JSON_EXTRACT_SCALAR(project, '$.name') AS project_name,
JSON_EXTRACT_SCALAR(workflow, '$.name') AS workflow_name
```

**Duration calculation for attempts (ISO timestamps):**
```sql
date_diff('second',
  date_parse(createdat, '%Y-%m-%dT%H:%i:%SZ'),
  date_parse(finishedat, '%Y-%m-%dT%H:%i:%SZ')
) AS duration_sec
```

---

## `insights_monitoring_<suffix>` — Insights Data Models

| Table | What it contains |
|---|---|
| `datamodels` | All Insights data models — status, size, build times, dataset/relation composition |

**Columns — `datamodels`** (15):
```
oid (varchar), name (varchar), type (varchar),
status (varchar),          — 'done', 'failed', 'building'
last_built (varchar),      — ISO timestamp
last_updated (varchar),    — ISO timestamp
created_at (varchar), updated_at (varchar),
storage_size (double),     — bytes
created_by (bigint), updated_by (bigint),
description (varchar),
datasets (JSON array — dataset/table/column definitions backing the model, e.g.
  [{"oid", "name", "database", "type", "tables": [{"oid", "name", "columns": [{"oid","name","type","hidden","indexed",...}]}]}]),
relations (JSON array — join definitions between dataset tables, e.g.
  [{"oid", "definition": [{"table","column","dataset"}, ...]}]),
time (bigint — Unixtime)
```
