# manifest.yml Reference

`manifest.yml` defines metadata, triggers, tool permissions, and execution settings for a Graflow workflow. Studio scaffolds this file alongside `workflow.py` when you create a new agentic workflow.

## Full Schema

```yaml
# Required (user-authored)
name: my-workflow                     # Unique identifier (lowercase, hyphens), must match directory name
description: What this workflow does  # Human-readable description

# Studio-managed — DO NOT hand-author
profile: "@tdx-studio:<site>:<account-id>:<user-id>"  # Auto-stamped by Studio at create time. Omit to make the workflow visible under every Studio account (reserved for system-installed templates).

# Tool permissions — which tools Studio Agent calls may invoke.
permissions:
  allow:
    - "Write"                                    # Built-in Write tool (all invocations)
    - "Bash(gh:*)"                               # Argument-level pattern — only gh commands
    - "Bash"                                     # All Bash invocations (any command)
    - "mcp__work__slack_post_message"            # Full MCP tool name
    - "slack_post_message"                       # Short name — also matches mcp__work__slack_post_message
    - "mcp__td-docs__*"                          # Wildcard for all tools from an MCP server

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

# Results retention
results:
  max_retained: 30                    # Number of run results to keep (default: 30)
```

## Permissions

The `permissions.allow` list is the **single source of truth** for which tools the Studio Agent may call from this workflow. Studio enforces it server-side for every `agent.run()` call — individual tasks cannot widen the allowlist at runtime.

### Syntax

Each entry is a tool name, a Studio MCP short name, a full SDK tool name, or a wildcard. Studio supports **argument-level patterns** using the Claude Agent SDK `Tool(pattern:*)` form, which is useful for restricting shell access to specific CLI tools.

| Entry | Matches |
|---|---|
| `Bash` | All Bash invocations (any command) |
| `Bash(gh:*)` | Bash invocations where the command starts with `gh` |
| `Bash(tdx:*)` | Bash invocations where the command starts with `tdx` |
| `Read` | All `Read` tool invocations |
| `Write` | All `Write` tool invocations |
| `slack_post_message` | Short name — matches `mcp__work__slack_post_message` |
| `mcp__work__slack_post_message` | Full SDK name — also works |
| `mcp__td-docs__search` | Exact full SDK name for an external MCP server tool |
| `mcp__td-docs__*` | All tools from the `td-docs` external MCP server |

**Both short names and full names work** for Studio MCP tools. `slack_post_message` and `mcp__work__slack_post_message` are equivalent. Use whichever is clearer — short names are more readable, full names are more explicit.

**Argument-level patterns** like `Bash(gh:*)` are the preferred way to grant shell access because they limit the agent to a specific CLI tool rather than giving it unrestricted shell access. This is important for security — a prompt-injection vulnerability in upstream data could otherwise let the agent run arbitrary shell commands.

### Minimum viable allowlist

A workflow that posts a Slack message and calls a CLI tool needs:

```yaml
permissions:
  allow:
    - "slack_post_message"   # or mcp__work__slack_post_message
    - "Bash(gh:*)"           # restricted to gh commands only
```

Keep the allowlist as narrow as the workflow actually needs — every extra entry is extra attack surface if prompt-injection-tainted data reaches the agent.

### Always-allowed tools

A small set of read-only built-in tools (Read / Glob / Grep / TodoWrite / Skill and similar) is always enabled for agentic workflows and does not need to appear in `permissions.allow`. Tools **not** in that set — including `Write`, `Bash`, `WebFetch`, `WebSearch`, and every MCP tool — must be declared explicitly.

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

### Choosing the right timeout

The default 300s (5 minutes) works for simple workflows with 1-2 agent tasks. For longer pipelines, budget roughly **120 seconds per agent task** plus a small margin for subprocess and deterministic tasks.

| Workflow Shape | Recommended Timeout |
|---|---|
| 1 agent task + deterministic | 300 (default) |
| 2-3 agent tasks | 480–600 |
| 4-5 agent tasks | 600–900 |
| Workflows with large data volumes | 900+ (up to your judgment) |

Setting the timeout too low is a common failure mode — the workflow gets killed mid-run and produces no output. When in doubt, round up.

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
    - "slack_post_message"
triggers:
  - type: cron
    schedule: "0 8 * * 1-5"
execution:
  timeout: 300
```

All other fields use defaults (max_retries: 0, max_retained: 30).
