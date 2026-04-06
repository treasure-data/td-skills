---
name: treasure-workflow
description: Treasure Workflow authoring and operational patterns. Use when creating, editing, or troubleshooting .dig workflows.
---

# Treasure Workflow

For operator reference, see **workflow-operators**. For `tdx wf` CLI commands, see **tdx-skills/workflow**.

## Unsupported Operators

These digdag operators are **not available** in Treasure Workflow:

`sh>`, `rb>`, `embulk>`, `emr>`, `param_get>`, `param_set>`

Common `sh>` alternatives:

| Instead of sh> for... | Use |
|---|---|
| HTTP requests / webhooks | `http>` |
| Failing a workflow | `fail>` |
| Waiting for data | `td_wait>`, `td_wait_table>`, `s3_wait>`, `gcs_wait>` |
| Data loading | `td_load>` |
| Python scripts | `py>` |

## Basic Structure

```yaml
timezone: Asia/Tokyo

schedule:
  daily>: 02:00:00

_export:
  td:
    database: my_database
    engine: presto

+extract:
  td>: queries/extract.sql
  create_table: raw_data

+transform:
  td>: queries/transform.sql
  create_table: results
```

**Key points:**
- `.dig` extension required; filename becomes workflow name
- Tasks run sequentially with `+task_name:` prefix

## Project Structure

```
workflows/
└── my_project/              # Created by tdx wf pull
    ├── tdx.json             # Sync tracking (auto-generated)
    ├── main.dig             # Workflow definition
    ├── queries/
    │   └── analysis.sql
    └── scripts/
        └── process.py
```

## Built-in Variables

| Variable | Example |
|----------|---------|
| `${session_time}` | `2024-01-30T00:00:00+09:00` |
| `${session_date}` | `2024-01-30` |
| `${session_date_compact}` | `20240130` |
| `${session_unixtime}` | `1706540400` |
| `${session_local_time}` | `2024-01-30 00:00:00` |
| `${session_tz_offset}` | `+0900` |
| `${session_uuid}` | Unique UUID of this session |
| `${session_id}` | Integer ID of this session |
| `${attempt_id}` | Integer ID of this attempt |
| `${task_name}` | `+my_workflow+parent+child` |
| `${project_id}` | Integer ID of this project |
| `${timezone}` | `Asia/Tokyo` |
| `${last_session_time}` | Previous scheduled session time |
| `${next_session_time}` | Next scheduled session time |

`last_session_*` / `next_session_*` variants (`_date`, `_date_compact`, `_unixtime`, etc.) are also available for scheduled workflows.

**Moment.js available:**
```yaml
+tomorrow:
  echo>: ${moment(session_time).add(1, 'days').format("YYYY-MM-DD")}
```

## Variables

Define variables with `_export` and reference with `${name}`. Child tasks can access parent variables.

```yaml
_export:
  target_table: daily_report
  threshold: 100

+step1:
  td>: queries/build.sql
  create_table: ${target_table}
```

**Important caveats:**
- Built-in variables (`session_time`, etc.) cannot be overwritten
- All variable values are converted to strings — arrays and maps cannot be stored as-is
- `_export` variables are evaluated at reference time (lazy), not at definition time
- To pass a list to `for_each>`, use string splitting: `${urls.split(",")}`

## Secrets

Secrets are referenced with `${secret:key}`. Unlike regular `${variable}` which the workflow engine expands, `${secret:key}` is left as-is by the engine. Each operator resolves it only in the fields it explicitly allows. Some operators also read named secrets automatically without `${secret:key}` syntax (e.g., `td_load>` reads `td.apikey`).

Which operators support `${secret:key}`, which fields resolve it, and which named secrets are auto-resolved — see **workflow-operators**.

## Schedule Options

| Schedule type | Example |
|---|---|
| `daily>: HH:MM:SS` | `daily>: 02:00:00` |
| `hourly>: MM:SS` | `hourly>: 00:00` |
| `weekly>: "Day,HH:MM:SS"` | `weekly>: "Mon,00:00:00"` |
| `monthly>: D,HH:MM:SS` | `monthly>: 1,02:00:00` |
| `minutes_interval>: M` | `minutes_interval>: 15` |
| `cron>: "expr"` | `cron>: "0 */4 * * *"` |

Optional controls:

| Option | Description |
|---|---|
| `start: "2024-01-01"` | Schedule active from this date |
| `end: "2024-12-31"` | Schedule active until this date (inclusive) |
| `skip_on_overtime: true` | Skip new session if previous is still running |
| `skip_delayed_by: 1h` | Skip sessions older than this duration |

## Event Triggers

```yaml
# Runs after another workflow succeeds (success only, not failure)
trigger:
  attempt>:
  dependent_workflow_name: build_reports
  dependent_project_name: reporting

+run_after:
  td>: queries/aggregate.sql
```

Note: `trigger` cannot wait for multiple preceding workflows. Use `td_wait>`, `s3_wait>`, or `http>` for that.

## Calling Shared Workflows

Use `require>` with `rerun_on: all` to call a shared workflow across projects. Without it, the result of a previous run is reused and no new attempt is created:

```yaml
+call_sub:
  require>: shared_workflow
  project_name: shared_project
  rerun_on: all
```

If multiple workflows call the same shared workflow concurrently, add `retry_attempt_name` to isolate their attempts.

## Parallel Execution

```yaml
+parallel_tasks:
  _parallel: true

  +task_a:
    td>: queries/a.sql

  +task_b:
    td>: queries/b.sql
```

**Limited concurrency:**
```yaml
+limited:
  _parallel:
    limit: 2
```

Note: `_parallel: {limit: N}` controls concurrency by adding task dependencies — it does not limit the number of actual parallel threads.

## Retry

There are two types of retry in Treasure Workflow:

### Operator-level retry

TD query operators (`td>`, `td_for_each>`, `td_wait>`, `td_wait_table>`) support `job_retry`, which retries the query within the same job. The task itself is not re-executed. `http>` also has its own `retry` option. See **workflow-operators** for details.

### `_retry` directive

`_retry` can be applied to any task or group. It automatically retries when the task fails.

```yaml
+call_api:
  http>: https://api.example.com/data
  method: POST
  _retry: 3
```

Full form with interval and backoff:

```yaml
+call_api:
  http>: https://api.example.com/data
  method: POST
  _retry:
    limit: 3
    interval: 10
    interval_type: exponential  # default: constant
```

When applied to a group task, `_retry` re-runs all child tasks from the beginning (see Safe Data Refresh Patterns).

**Known issue:** group-level `_retry` breaks "resume from failed task" on attempt retry due to duplicate internal task entries.

## Error Handling

`_error` runs a handler block when a task fails:

```yaml
+call_api:
  http>: https://api.example.com/data
  method: POST

  _error:
    +on_failure:
      http>: ${secret:webhook_url}
      method: POST
      content:
        text: "Task failed: ${task_name}"
```

## Notifications

Attempt failure emails are sent by default to the user who last saved (pushed) the workflow. For additional notifications, use `http>` or `mail>`. Example with `http>`:

```yaml
+aggregate:
  td>: queries/daily_report.sql
  create_table: daily_report

  _error:
    +on_failure:
      http>: ${secret:webhook_url}
      method: POST
      content:
        text: "Workflow failed: ${session_id}"

# Success notification — runs after all tasks complete
+on_success:
  http>: ${secret:webhook_url}
  method: POST
  content:
    text: "Workflow completed: ${session_id}"
```

## Data Quality Checks

Use `_check` to run validation after a task succeeds. If the `_check` block fails, the parent task is marked as failed:

```yaml
+process:
  td>: queries/process.sql
  create_table: results

  _check:
    +validate:
      td>:
        query: |
          select count(*) as cnt
          from results
          where id is not null
      store_last_results: true

    +assert:
      if>: ${td.last_results.cnt == 0}
      _do:
        +fail:
          fail>: "No valid records in results table"
```

## Wait for Data

Common pattern — wait for upstream data using `td_wait>` with a time-range check:

```sql
-- queries/check_data.sql
select count(*) > 0
from src
where td_time_range(time, '${session_date}',
  td_time_add('${session_date}', '1d'))
```

For wait operator syntax (`td_wait>`, `td_wait_table>`, `s3_wait>`, `gcs_wait>`), see **workflow-operators**.

For external systems, use `http>` with an API that returns `408` or `429` until conditions are met. `http>` retries on these status codes automatically (up to 24h task limit).

**Do not use `loop>` for polling** — it creates a task per iteration and can hit the 1,000 task limit.

## Safe Data Refresh Patterns

### Partial refresh (date/partition unit)

**Do not combine DELETE and INSERT in a single `td>` job** — a single job does not guarantee transactions. If DELETE succeeds but INSERT fails, data is lost.

Split them into separate workflow tasks. Group-level `_retry` ensures INSERT failure triggers re-execution from DELETE.

```yaml
+refresh_daily:
  _retry: 3

  +delete_records:
    td>:
      query: |
        delete from target
        where date = '${session_date}'
    database: my_database

  +insert_records:
    td>: queries/insert_session.sql
    insert_into: target
    database: my_database
```

### Full table replacement

`create_table:` atomically replaces the entire table:

```yaml
+rebuild:
  td>: queries/full_rebuild.sql
  create_table: target
```

## Limits

System limit: 24h per task, 7 days per attempt. For other limitations, see the [prerequisites and limitations](https://docs.treasuredata.com/requirements-and-limitations/treasure-workflow-prerequisites-and-limitations).

## Resources

- https://docs.treasuredata.com/products/customer-data-platform/data-workbench/workflows
