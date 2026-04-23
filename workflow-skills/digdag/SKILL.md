---
name: digdag
description: Write .dig workflow files for Treasure Workflow. Covers creating new workflows (create_workflow MCP tool), importing existing workflows (register_workflow), digdag YAML syntax, td> operator, built-in variables, _parallel/_retry/_error directives, and TD platform constraints. Use when creating, editing, or deploying TD workflows. Also trigger on mentions of digdag, .dig files, td> operator, workflow scheduling, or any request to build a new data ETL pipeline on Treasure Data. For workflows with LLM processing or Slack/email notification, see the llm-workflow skill.
---

# Treasure Workflow (Digdag)

Write `.dig` workflow files for Treasure Data.

> **Official docs**: https://docs.treasure.ai/products/customer-data-platform/data-workbench/workflows

## Workflow Lifecycle

### Creating a New Workflow

Use `create_workflow` MCP tool to scaffold a new workflow. This creates `manifest.yml`, a template `.dig` file, and `queries/main.sql`. When a workspace is active, the workflow is created in `{workspace}/workflows/{name}/` by default; otherwise in `~/.tdx/workflows/{name}/`. Use the `scope` parameter to override.

After creation, edit the `.dig` file and queries to define the workflow logic, then deploy with `tdx wf push`.

### Importing an Existing Workflow from TD

Use `tdx wf pull` to download, then `register_workflow` MCP tool to copy the files and generate `manifest.yml`. Same scope rules as `create_workflow`.

### Lookup Order

When the user asks about an existing workflow, check **local first**:

1. **Local check**: Call `workflow_list` MCP tool to see workflows from both global (`~/.tdx/workflows/`) and workspace (`{workspace}/workflows/`) sources
2. **If found locally**: Use `workflow_get` MCP tool for manifest details and `.dig` content. For execution history, use `tdx wf sessions <project>` or check the Studio TD Workflows panel.
3. **If NOT found locally**: Use `tdx wf workflows <project>` and `tdx wf sessions` to query TD platform

## TD Platform Constraints

TD-platform operator notes (authentication, `s3_move>`/`loop>`/`py>` caveats), common output variables, and Secrets Reference: [operators.md](references/operators.md). Parameter details are in the official TD docs.

**Available operators:**

| Category | Operators |
|---|---|
| Control | `call>`, `http_call>`, `require>`, `loop>`, `for_each>`, `for_range>`, `if>`, `fail>`, `echo>`, `wait>` |
| Treasure Data | `td>`, `td_run>`, `td_ddl>`, `td_load>`, `td_for_each>`, `td_wait>`, `td_wait_table>`, `td_table_export>`, `td_result_export>` |
| Network | `mail>`, `http>` |
| Database | `databricks>`, `pg>`, `snowflake>` |
| Amazon Web Services | `s3_wait>`, `s3_copy>`, `s3_delete>`, `s3_move>`, `redshift>`, `redshift_load>`, `redshift_unload>` |
| Google Cloud Platform | `gcs_wait>`, `bq>`, `bq_ddl>`, `bq_load>`, `bq_extract>` |
| Scripting | `py>` (Python via Custom Script Docker image) |

**Not available on TD** (no shell access): `sh>`, `rb>`, `embulk>`.
Use `py>` with Custom Script Docker images for arbitrary compute.

## Basic Structure

```yaml
timezone: Asia/Tokyo

schedule:
  daily>: "09:00:00"

_export:
  td:
    database: my_database
    engine: presto

+extract:
  td>: queries/extract.sql
  create_table: staging_table

+transform:
  td>: queries/transform.sql
  insert_into: result_table
```

- Filename becomes workflow name (`etl_daily.dig` → `etl_daily`)
- Tasks prefixed with `+`, execute top-to-bottom
- `type>: command` is shorthand for `_type: type`, `_command: command`

## Built-in Variables

**Session:**

| Variable | Example |
|---|---|
| `${session_time}` | `2026-01-30T00:00:00+09:00` |
| `${session_date}` | `2026-01-30` |
| `${session_date_compact}` | `20260130` |
| `${session_unixtime}` | `1738159200` |
| `${session_local_time}` | `2026-01-30 00:00:00` |
| `${session_tz_offset}` | `+0900` |
| `${session_uuid}` | Unique UUID of this session |
| `${session_id}` | Integer ID of this session |
| `${last_session_time}` | Previous scheduled session time |
| `${next_session_time}` | Next scheduled session time |

`last_session_*` / `next_session_*` variants (`_date`, `_date_compact`, `_unixtime`, etc.) are also available for scheduled workflows.

Date math via Moment.js: `${moment(session_time).subtract(1, 'days').format("YYYY-MM-DD")}`

**Runtime:**

| Variable | Example |
|---|---|
| `${attempt_id}` | Integer ID of this attempt |
| `${task_name}` | `+my_workflow+parent+child` |
| `${project_id}` | Integer ID of this project |
| `${timezone}` | `Asia/Tokyo` |

## TD Operator

```yaml
+query:
  td>: queries/analysis.sql
  database: analytics
  engine: presto
  create_table: results      # or insert_into: existing_table
```

Inline SQL:
```yaml
+inline:
  td>:
    query: |
      SELECT * FROM events
      WHERE TD_TIME_RANGE(time, '${session_date}', '${next_session_date}')
```

`store_last_results: true` stores **only the first row** as `${td.last_results.column}`. Design KPI queries to return a single row.

## Parallel, Retry, Error Handling

For full pipeline examples with retry + error notification: [patterns-control.md](references/patterns-control.md)

```yaml
+parallel_tasks:
  _parallel: true
  +task_a:
    td>: queries/a.sql
  +task_b:
    td>: queries/b.sql

+fragile_step:
  _retry:
    limit: 3
    interval: 10
    interval_type: exponential
  td>: queries/heavy.sql

_error:
  http>: https://hooks.slack.com/services/xxx
  method: POST
  content:
    text: "Workflow failed at ${moment().format('YYYY-MM-DD HH:mm')}"
```

For the distinction between `job_retry` (operator-level) and `_retry` (task-level) and related runtime caveats, see [runtime.md](references/runtime.md#retry-semantics).

## Conditionals and Loops

```yaml
+check:
  td>: queries/count.sql
  store_last_results: true

+branch:
  if>: ${td.last_results.cnt > 0}
  _do:
    +process:
      td>: queries/process.sql

+by_region:
  for_each>:
    region: [us, eu, ap]
  _do:
    +aggregate:
      td>: queries/by_region.sql
```

## py> Tasks

For `py>`, pass secrets via `_env` since the operator does not expand `${secret:}` in its own parameters.

```yaml
_export:
  td:
    database: production
  my_param: value

+task:
  py>: tasks.MyTask.run
  docker:
    image: "treasuredata/customscript-python:3.12.11-td1"
  _env:
    TD_API_KEY: ${secret:td.apikey}
```

For `py>` details — package installation, digdag Python API, argument mapping: [py-operator.md](references/py-operator.md). For secret expansion rules, variable behavior, and related runtime caveats: [runtime.md](references/runtime.md).

## mail> on TD

TD's built-in SMTP relay handles delivery. No SMTP secrets needed on TD platform.

```yaml
+send_report:
  mail>: templates/report.html
  subject: "Daily Report ${session_date}"
  to: [team@example.com]
  html: true
```

## LLM and Notification

For LLM calls (TD LLM Proxy, TD Agent) and notification patterns (Slack, email), see the **llm-workflow** skill. It covers end-to-end patterns: data pipeline → LLM summarize → Slack/Mail notify.

## Common Pitfalls

- **`td.apikey` must be a Master API Key** in `ACCOUNT_ID/KEY` format. OAuth tokens cause 401. Never handle key values — present `tdx wf secrets set` commands with placeholders.
- **`td_ddl>` `create_databases` requires `td.apikey`** — create the database via CLI first if the secret isn't set yet.

## Further References

- [operators.md](references/operators.md) — TD-platform operator notes, output variables, Secrets Reference
- [patterns-etl.md](references/patterns-etl.md) — ETL pipeline patterns (idempotent write, wait-then-process, data quality checks, modular workflows)
- [scheduling.md](references/scheduling.md) — Schedule types, options (`start`/`end`, `skip_on_overtime`), SLA configuration
- [runtime.md](references/runtime.md) — Variable behavior, retry semantics, secret expansion, concurrency, system limits
- [scaffold.md](references/scaffold.md) — Deploying to TD (manifest.yml, project structure, secrets, deployment checklist)
