# workflow.yaml Reference

The `workflow.yaml` file defines metadata, triggers, and execution settings for a Graflow workflow.

## Full Schema

```yaml
# Required
name: my-workflow                    # Unique identifier (lowercase, hyphens)
description: What this workflow does  # Human-readable description

# Triggers — when the workflow should run
triggers:
  - type: cron
    schedule: "0 9 * * *"           # 5-field vixie cron (minimum 5-minute interval)
  
  - type: webhook                    # Phase 2
    path: /my-endpoint               # POST http://localhost:9876/webhooks/{path}
  
  - type: slack                      # Phase 2
    channel: "#channel-name"         # Slack channel to monitor
    keywords:                        # Trigger on messages containing these
      - "run health check"
      - "account scan"

# Execution settings
execution:
  timeout: 300                       # Max execution time in seconds (default: 300)
  max_retries: 2                     # Retry on failure (default: 0)

# HITL settings (Phase 2)
hitl:
  enabled: false                     # Enable human-in-the-loop
  approval_channel: slack            # slack | studio
  timeout: 3600                      # Wait time for human response (seconds)

# Results retention
results:
  max_retained: 30                   # Number of run results to keep (default: 30)
```

## Triggers

### Cron Trigger

Standard 5-field vixie cron syntax. Minimum interval: 5 minutes.

```yaml
triggers:
  - type: cron
    schedule: "0 9 * * *"       # Daily at 9:00 AM
```

**Common schedules**:

| Schedule | Cron Expression |
|---|---|
| Every hour | `0 * * * *` |
| Daily at 9am | `0 9 * * *` |
| Weekdays at 8am | `0 8 * * 1-5` |
| Every Monday at 6am | `0 6 * * 1` |
| First day of month | `0 0 1 * *` |
| Every 15 minutes | `*/15 * * * *` |

### Webhook Trigger (Phase 2)

HTTP endpoint that triggers the workflow when called.

```yaml
triggers:
  - type: webhook
    path: /health-check
```

Trigger: `POST http://localhost:9876/webhooks/health-check`

The request body is passed as workflow input via the channel.

### Slack Trigger (Phase 2)

Monitors a Slack channel for messages containing specific keywords.

```yaml
triggers:
  - type: slack
    channel: "#cs-ops"
    keywords: ["health check", "scan accounts"]
```

The message context (user, thread, text) is passed as workflow input.

### Multiple Triggers

A workflow can have multiple triggers. Any trigger can start it.

```yaml
triggers:
  - type: cron
    schedule: "0 9 * * *"       # Runs daily
  - type: webhook
    path: /force-run             # Also runnable via HTTP
  - type: slack
    channel: "#ops"
    keywords: ["run now"]        # Also triggerable from Slack
```

## Execution Settings

```yaml
execution:
  timeout: 300       # Kill workflow after 300 seconds (default)
  max_retries: 2     # Retry up to 2 times on failure (default: 0)
```

## Results Retention

```yaml
results:
  max_retained: 30   # Keep last 30 run results (default)
```

Results are stored in `{workflow-dir}/results/{run-id}/`:
- `result.json` — workflow output
- `logs.txt` — stdout/stderr

Older results are automatically pruned when `max_retained` is exceeded.

## Minimal Example

```yaml
name: daily-report
description: Generate and send daily report
triggers:
  - type: cron
    schedule: "0 8 * * 1-5"
```

All other fields use defaults (timeout: 300, max_retries: 0, max_retained: 30).
