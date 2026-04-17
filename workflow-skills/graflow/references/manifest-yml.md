# manifest.yml Reference

`manifest.yml` defines metadata, triggers, tool permissions, and execution settings for a Graflow workflow. Studio scaffolds this file alongside `workflow.py` when you create a new agentic workflow.

## Full Schema

```yaml
# Required
name: my-workflow                     # Unique identifier (lowercase, hyphens), must match directory name
description: What this workflow does  # Human-readable description

# Tool permissions — which tools Studio Agent calls may invoke
permissions:
  allow:
    - "Read"                          # Built-in Read tool (all invocations)
    - "Write"                         # Built-in Write tool
    - "Bash(git:*)"                   # Bash tool, only for commands starting with "git"
    - "mcp__hubspot__*"               # All HubSpot MCP tools
    - "mcp__slack__post_message"      # Specific Slack MCP tool

# Triggers — when the workflow should run
triggers:
  - type: cron
    schedule: "0 9 * * *"             # 5-field vixie cron (minimum 5-minute interval)

  - type: webhook                     # Phase 2
    path: /my-endpoint                # POST http://localhost:9876/webhooks/{path}

  - type: slack                       # Phase 2
    channel: "#channel-name"
    keywords:
      - "run health check"
      - "account scan"

# Execution settings
execution:
  timeout: 300                        # Max execution time in seconds (default: 300)
  max_retries: 2                      # Retry on failure (default: 0)

# HITL settings (Phase 2 — not yet wired into Studio runtime; see warning below)
hitl:
  enabled: false
  approval_channel: slack             # slack | studio
  timeout: 3600                       # Wait time for human response (seconds)

# Results retention
results:
  max_retained: 30                    # Number of run results to keep (default: 30)
```

## Permissions

The `permissions.allow` list is the **single source of truth** for which tools the Studio Agent may call from this workflow. Studio enforces it server-side for every `agent.run()` call — individual tasks cannot widen the allowlist at runtime.

### Syntax

Each entry is either a tool name, a tool name with a parenthesized argument pattern, or a glob. Patterns follow the Claude Agent SDK permission-rule format.

| Entry | Matches |
|---|---|
| `Read` | All `Read` tool invocations |
| `Write` | All `Write` tool invocations |
| `Bash(git:*)` | `Bash` invocations whose command starts with `git` |
| `Bash(ls:*)` | `Bash` invocations whose command starts with `ls` |
| `mcp__hubspot__*` | Any HubSpot MCP tool |
| `mcp__slack__post_message` | Only the `post_message` Slack MCP tool |

### Minimum viable allowlist

A workflow that only does HubSpot → analysis → Slack needs:

```yaml
permissions:
  allow:
    - "mcp__hubspot__*"
    - "mcp__slack__post_message"
```

Keep the allowlist as narrow as the workflow actually needs — every extra entry is extra attack surface if prompt-injection-tainted data reaches the agent.

### Always-allowed tools

A small set of built-in tools (Read / Glob / Grep / TodoWrite and similar) is always enabled for agentic workflows and does not need to appear in `permissions.allow`. Tools **not** in that set — including `Write`, `Bash`, `WebFetch`, `WebSearch`, and every MCP tool — must be declared explicitly.

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
    schedule: "0 9 * * *"
  - type: webhook
    path: /force-run
  - type: slack
    channel: "#ops"
    keywords: ["run now"]
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
permissions:
  allow:
    - "mcp__hubspot__*"
    - "mcp__slack__post_message"
triggers:
  - type: cron
    schedule: "0 8 * * 1-5"
```

All other fields use defaults (timeout: 300, max_retries: 0, max_retained: 30).
