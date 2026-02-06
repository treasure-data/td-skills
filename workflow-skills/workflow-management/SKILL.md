---
name: workflow-management
description: TD workflow debugging and operations. Covers tdx wf commands for monitoring (sessions, attempt, logs), retry/backfill patterns, alerting (_error with Slack/email), and data quality checks.
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

```yaml
+critical_task:
  td>: queries/important.sql

  _error:
    +slack_alert:
      sh>: |
        curl -X POST ${secret:slack.webhook_url} \
        -H 'Content-Type: application/json' \
        -d '{"text": "Workflow failed: ${session_id}"}'
```

## Data Quality Checks

```yaml
+process:
  td>: queries/process.sql
  create_table: results

+validate:
  td>:
    query: |
      SELECT COUNT(*) as cnt,
             SUM(CASE WHEN id IS NULL THEN 1 ELSE 0 END) as nulls
      FROM results
  store_last_results: true

+check:
  if>: ${td.last_results.cnt == 0}
  _do:
    +fail:
      sh>: exit 1
```

## Wait for Data

```yaml
+wait_for_data:
  sh>: |
    for i in {1..30}; do
      COUNT=$(tdx query -d analytics "SELECT COUNT(*) FROM src WHERE date='${session_date}'" --format csv | tail -1)
      if [ "$COUNT" -gt 0 ]; then exit 0; fi
      sleep 60
    done
    exit 1
```

## Idempotent Operations

```yaml
+safe_insert:
  td>:
    query: |
      DELETE FROM target WHERE date = '${session_date}';
      INSERT INTO target SELECT * FROM source WHERE date = '${session_date}'
```

## Backfill Pattern

```yaml
+backfill:
  loop>:
    dates: ["2024-01-01", "2024-01-02", "2024-01-03"]
  _do:
    +process:
      call>: main_workflow.dig
      params:
        session_date: ${dates}
```

## Secrets

See **tdx-skills/workflow** for `tdx wf secrets` commands. Usage in .dig files:

```yaml
+task:
  sh>: curl -H "Authorization: ${secret:API_KEY}" https://api.example.com
```

## Common Issues

| Issue | Solution |
|-------|----------|
| Timeout | Add `timeout: 3600s`, `_retry: 2` |
| Intermittent failures | Add `_retry: 5` with exponential backoff |
| Out of memory | Reduce data volume, use approx functions |
| Duplicate runs | Use idempotent DELETE+INSERT pattern |
