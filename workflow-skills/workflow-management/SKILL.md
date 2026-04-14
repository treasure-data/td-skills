---
name: workflow-management
description: TD workflow debugging and operations. Covers tdx wf commands for monitoring (sessions, attempt, logs), retry/backfill patterns, alerting (_error with Slack/email), and data quality checks. Use when debugging failed workflows, checking session logs, retrying tasks, or setting up workflow alerts.
---

# TD Workflow Management

## Setup & CLI Commands

For full CLI reference, see **tdx-skills/workflow**. Quick start:

```bash
tdx wf use my_project                # Set default project for session
tdx wf pull my_project               # Pull project locally for editing
tdx wf push                          # Push changes with diff preview
```

## Debugging Steps

1. `tdx wf sessions --status error` - find failed sessions
2. `tdx wf timeline --session-id <id>` - visualize task execution
3. `tdx wf attempt <id> logs +failed_task` - read error logs
4. Verify query syntax if td> failed
5. Check time ranges - does data exist for session_date?
6. Validate parameter values
7. Check resource limits (memory, timeout)
8. `tdx wf attempt <id> retry --resume-from +failed_task` - retry from failure

## Alerting

Use `http>` with Slack webhook or Bot API. For detailed Slack patterns, see the **llm-workflow** skill.

```yaml
_error:
  +slack_alert:
    http>: ${secret:slack.webhook}
    method: POST
    content:
      text: "Workflow failed: ${session_date}"
```

## Data Quality Checks

```yaml
+process:
  td>: queries/process.sql
  create_table: results

+validate:
  td>:
    query: |
      select count(*) as cnt,
             sum(case when id is null then 1 else 0 end) as nulls
      from results
  store_last_results: true

+check:
  if>: ${td.last_results.cnt == 0}
  _do:
    +fail:
      fail>: "No rows produced — data quality check failed"
```

## Wait for Data

Use `td_wait_table>` to wait for data availability before processing.

```yaml
+wait_for_data:
  td_wait_table>: source_table
  database: analytics
  rows: 1
  interval: 120
```

For custom conditions, use `td_wait>` with a SQL query:

```yaml
+wait_for_condition:
  td_wait>: queries/check_ready.sql
  database: analytics
  interval: 120
```

`queries/check_ready.sql`:
```sql
select count(*) > 0
from source_table
where td_interval(time, '-1d')
```

## Idempotent Operations

Use `td_partial_delete>` before insert, or `create_table` to overwrite.

```yaml
# Option 1: Partial delete + insert
+delete_existing:
  td_partial_delete>: target_table
  from: ${session_date}
  to: ${next_session_date}

+insert_fresh:
  td>: queries/transform.sql
  insert_into: target_table

# Option 2: Overwrite with create_table
+overwrite:
  td>: queries/transform.sql
  create_table: target_table
```

## Backfill Pattern

```yaml
+backfill:
  loop>: 7
  _do:
    +process:
      call>: main_workflow.dig
```

Or use `for_each>` with explicit dates:

```yaml
+backfill:
  for_each>:
    target_date: ["2026-01-01", "2026-01-02", "2026-01-03"]
  _do:
    +process:
      td>: queries/process.sql
```

## Secrets

See **tdx-skills/workflow** for `tdx wf secrets` commands. Usage in .dig files:

```yaml
+call_api:
  http>: https://api.example.com/data
  method: GET
  headers:
    - Authorization: "Bearer ${secret:api_token}"
  store_content: true
```

## Common Issues

| Issue | Solution |
|-------|----------|
| Timeout | Add `timeout: 3600s`, `_retry: 2` |
| Intermittent failures | Add `_retry: 5` with exponential backoff |
| Out of memory | Reduce data volume, use approx functions |
| Duplicate runs | Use idempotent DELETE+INSERT or `create_table` pattern |
