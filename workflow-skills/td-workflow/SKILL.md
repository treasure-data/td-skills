---
name: td-workflow
description: Create, build, and deploy data pipelines and workflows on Treasure Data using digdag. Use when the user wants to create a workflow, build a pipeline, set up scheduled ETL, automate data processing, combine SQL with LLM/mail/HTTP steps, or deploy a .dig project to TD. Also trigger on mentions of digdag, .dig files, td> operator, workflow manifest, or tdx wf push.
---

# TD Workflow (Digdag) Skill

Build Treasure Data workflows using digdag `.dig` files. This skill covers the correct syntax, TD-available operators, scheduling, variables, manifest-based lifecycle management, and deployment.

> **Official docs**: https://www.digdag.io/ — always consult for the latest syntax and operator details.

## TD Platform Constraints

**Available operators on TD:**

| Category | Operators |
|---|---|
| Workflow control | `call>`, `if>`, `for_each>`, `for_range>`, `loop>`, `fail>`, `echo>`, `wait>`, `http_call>`, `require>` |
| Treasure Data | `td>`, `td_run>`, `td_ddl>`, `td_load>`, `td_for_each>`, `td_wait>`, `td_wait_table>`, `td_partial_delete>`, `td_table_export>`, `td_result_export>` |
| Scripting | `py>` (Python via Custom Script Docker image) |
| Network | `http>`, `mail>` |

**Not available on TD** — the TD platform runs workflows in a managed environment without shell access, so these operators are unavailable:
- `sh>` (shell scripts)
- `rb>` (Ruby scripts)
- `embulk>` (bulk loader CLI)
- Any operator requiring direct command-line execution

Use `py>` with Custom Script Docker images for any logic that would otherwise require shell or Ruby. This is the escape hatch for arbitrary compute on TD.

## Common Pitfalls

Lessons learned from real workflow deployments on the TD platform.

### 1. `td.apikey` must be a Master API Key — set by the user, not the agent

The `td.apikey` workflow secret **must** be a Master API Key in `ACCOUNT_ID/KEY` format (e.g., `1234/abcdef01...`). OAuth tokens will cause `[401:Unauthorized]` errors on all TD operators. **The agent must never attempt to retrieve or handle API key values.** Instead, after pushing the workflow, present the user with the exact `tdx wf secrets set` commands and placeholder values so they can register secrets themselves. See [scaffold.md](references/scaffold.md) for the full procedure.

### 2. `mail>` works without SMTP configuration on TD

On the TD platform, `mail>` uses TD's built-in SMTP relay. You only need `to:`, `subject:`, and the body — no `mail.host`, `mail.port`, `mail.username`, or `mail.password` secrets are required. These secrets are only needed when running digdag locally or against a custom SMTP server.

```yaml
+send:
  mail>: templates/report.html
  subject: "Daily Report - ${session_date}"
  to: [team@example.com]
  html: true
  # No SMTP secrets needed on TD
```

### 3. Database creation requires a valid `td.apikey`

`td_ddl>` with `create_databases:` requires `td.apikey` to be set as a workflow secret. Without a valid Master API Key, it fails with 401. If you cannot set the secret yet, create the database beforehand via CLI or REST API:

```bash
# Via REST API with OAuth token
curl -s -X POST "https://api.treasuredata.com/v3/database/create/my_database" \
  -H "Authorization: Bearer $OAUTH_TOKEN"

# Then remove td_ddl> create_databases from the workflow
```

### 4. Hubspot association tables use `from_id`/`to_id`, not entity names

Hubspot association tables (e.g., `deals_to_companies_associations`) use generic column names:

| Column | Type | Description |
|---|---|---|
| `from_id` | `bigint` | Source entity ID (e.g., deal ID) |
| `to_id` | `bigint` | Target entity ID (e.g., company ID) |
| `association_type_id` | `bigint` | Association type |
| `association_category` | `varchar` | Category |
| `from_object` | `varchar` | Source object type |
| `to_object` | `varchar` | Target object type |

The main entity tables use `varchar` for `id`, so cast `from_id`/`to_id` when joining:

```sql
LEFT JOIN (
  SELECT CAST(from_id AS VARCHAR) AS deal_id,
         CAST(to_id AS VARCHAR) AS company_id,
         ROW_NUMBER() OVER (PARTITION BY from_id ORDER BY to_id) AS rn
  FROM deals_to_companies_associations
) dca ON d.id = dca.deal_id AND dca.rn = 1
```

### 5. Hubspot column naming is inconsistent

Hubspot table column names don't follow a single convention. Always run `tdx describe` before writing SQL:

| Table | Column | NOT |
|---|---|---|
| `owners` | `first_name`, `last_name` | ~~`firstname`~~, ~~`lastname`~~ |
| `contacts` | `firstname`, `lastname` | ~~`first_name`~~, ~~`last_name`~~ |
| `hubspot_reference_data` | `object_type = 'Deal Stage'` (title case) | ~~`dealstage`~~ |

```bash
# Always check schema first
tdx describe hubspot.owners --json
tdx describe hubspot.contacts --json
```

### 6. `store_last_results` only captures the first row

The `td>` operator with `store_last_results: true` stores only the first row of results as `${td.last_results.column_name}`. Design your KPI query to return a single row with all needed values using aggregation, `CROSS JOIN`, or subqueries.

## .dig File Structure

```yaml
timezone: Asia/Tokyo

schedule:
  daily>: "09:00:00"

_export:
  td:
    database: my_database
    engine: presto

+step1:
  td>: queries/extract.sql
  create_table: staging_table

+step2:
  td>: queries/transform.sql
  insert_into: result_table
```

### How .dig files work

- The filename becomes the workflow name (`etl_daily.dig` → workflow `etl_daily`), so name it descriptively
- Prefix task names with `+` — this is how digdag distinguishes tasks from configuration
- Tasks execute **sequentially** top-to-bottom by default; use `_parallel: true` to run children concurrently
- Nesting creates parent-child relationships where children run sequentially within their parent
- `type>: command` is shorthand for `_type: type`, `_command: command`

## Scheduling

```yaml
# Hourly at :30
schedule:
  hourly>: 30:00

# Daily at 9am JST
schedule:
  daily>: "09:00:00"

# Weekly on Monday
schedule:
  weekly>: Mon,09:00:00

# Monthly on the 1st
schedule:
  monthly>: 1,09:00:00

# Cron (every 15 min)
schedule:
  cron>: "*/15 * * * *"

# Every 30 minutes
schedule:
  minutes_interval>: 30
```

## Built-in Variables

### Session variables (always available)

| Variable | Example | Description |
|---|---|---|
| `${session_time}` | `2026-01-30T00:00:00+09:00` | Session time with timezone |
| `${session_date}` | `2026-01-30` | Date portion |
| `${session_date_compact}` | `20260130` | Compact date |
| `${session_local_time}` | `2026-01-30 00:00:00` | Local format |
| `${session_unixtime}` | `1738159200` | Unix epoch seconds |
| `${session_tz_offset}` | `+0900` | Timezone offset |
| `${session_uuid}` | (uuid) | Unique session UUID |
| `${task_name}` | `+step1` | Current task name |
| `${attempt_id}` | `12345` | Attempt integer ID |
| `${project_id}` | `67890` | Project ID |

### Scheduled workflow variables (only when schedule is set)

| Variable | Description |
|---|---|
| `${last_session_time}`, `${last_session_date}`, `${last_session_date_compact}` | Previous session |
| `${next_session_time}`, `${next_session_date}`, `${next_session_date_compact}` | Next session |
| `${last_executed_session_time}` | Last actually executed session |

### Moment.js expressions

Digdag bundles Moment.js for date calculations in `${...}`:

```yaml
+yesterday:
  td>: queries/daily.sql
  _export:
    target_date: ${moment(session_time).subtract(1, 'days').format("YYYY-MM-DD")}

+two_hours_ago:
  echo>: ${moment(session_time).subtract(2, 'hours').format("YYYY-MM-DD HH:mm:ss")}
```

## Variables and Parameters

### Defining variables with _export

```yaml
# Top-level: accessible by all tasks
_export:
  td:
    database: analytics
    engine: presto
  threshold: 100

+step1:
  _export:
    # Scoped: accessible only to step1 and its children
    batch_size: 1000
  td>: queries/step1.sql
```

### Passing variables at runtime

```bash
tdx wf start my_project my_workflow -p target_date=2026-04-01 -p mode=full
```

### Secrets (TD-managed)

```yaml
+notify:
  py>: tasks.Notifier.send
  docker:
    image: "treasuredata/customscript-python:3.12.11-td1"
  _env:
    SLACK_WEBHOOK: ${secret:slack.webhook}
    TD_API_KEY: ${secret:td.apikey}
```

Set secrets via CLI — **the user must run these commands themselves** (agent should present the commands with placeholders, never handle actual values):
```bash
# Master API Key — get from TD Console → My Settings → API Keys
tdx wf secrets set <project-name> "td.apikey=YOUR_MASTER_API_KEY"

# Optional: Slack webhook
tdx wf secrets set <project-name> "slack.webhook=YOUR_SLACK_WEBHOOK_URL"
```

## Parallel Execution

```yaml
# All children run in parallel
+parallel_step:
  _parallel: true
  +query_a:
    td>: queries/a.sql
  +query_b:
    td>: queries/b.sql

# Limit concurrency
+limited:
  _parallel:
    limit: 3
  +q1:
    td>: queries/q1.sql
  +q2:
    td>: queries/q2.sql
  +q3:
    td>: queries/q3.sql
  +q4:
    td>: queries/q4.sql
```

## Retry and Error Handling

```yaml
# Simple retry
+fragile_step:
  _retry: 3
  td>: queries/heavy.sql

# Exponential backoff
+with_backoff:
  _retry:
    limit: 3
    interval: 10
    interval_type: exponential
  td>: queries/heavy.sql

# Error notification
_error:
  http>: https://hooks.slack.com/services/xxx
  method: POST
  content:
    text: "Workflow ${task_name} failed at ${moment().format('YYYY-MM-DD HH:mm')}"
```

## Conditional Execution

```yaml
+check:
  td>: queries/check_data.sql
  store_last_results: true

+branch:
  if>: ${td.last_results.has_data}
  _do:
    +process:
      td>: queries/process.sql
  _else_do:
    +skip:
      echo>: "No data to process"
```

## Loops

```yaml
# for_each: iterate over values
+by_region:
  for_each>:
    region: [us, eu, ap]
  _do:
    +aggregate:
      td>: queries/aggregate_by_region.sql

# loop: repeat N times
+backfill:
  loop>: 7
  _do:
    +run:
      td>: queries/daily.sql
      _export:
        target_date: ${moment(session_time).subtract(i, 'days').format("YYYY-MM-DD")}
```

## py> with Custom Script

```yaml
+python_task:
  py>: tasks.MyTask.run
  docker:
    image: "treasuredata/customscript-python:3.12.11-td1"
  _env:
    TD_API_KEY: ${secret:td.apikey}
    LANGFUSE_PUBLIC_KEY: ${secret:langfuse.public}
    LANGFUSE_SECRET_KEY: ${secret:langfuse.secret}
```

Python file (`tasks/__init__.py`):
```python
import digdag

class MyTask:
    def run(self):
        # Business logic here
        result = {"status": "ok", "count": 42}
        digdag.env.store(result)  # Pass to subsequent tasks
```

## File Inclusion

Split large workflows into modules:

```yaml
# main.dig
+prepare:
  call>: sub/prepare.dig

+process:
  call>: sub/process.dig
```

## Calling LLM Agents via http>

Call the TD LLM Proxy directly from a workflow task using `http>` — no Python or Docker needed. The proxy exposes an Anthropic Messages API-compatible endpoint. Verified on TD production: completes in ~2 seconds.

```yaml
+ask_agent:
  http>: https://llm-proxy.us01.treasuredata.com/v1/messages
  method: POST
  headers:
    - x-api-key: ${secret:td.apikey}
    - anthropic-version: 2023-06-01
  content:
    model: claude-haiku-4-5-20251001
    max_tokens: 1024
    messages:
      - role: user
        content: "Summarize today's data quality report"
  content_format: json
  store_content: true
```

### Response variable: `${http.last_content}`

When `store_content: true` is set, the full response body is stored as a JSON string in `${http.last_content}`. Subsequent tasks can reference it directly.

The Anthropic Messages API response structure:

```json
{
  "id": "msg_...",
  "type": "message",
  "role": "assistant",
  "content": [{"type": "text", "text": "The agent's response text"}],
  "model": "claude-haiku-4-5-20251001",
  "stop_reason": "end_turn",
  "usage": {"input_tokens": 14, "output_tokens": 25}
}
```

To extract the text or branch on the response, pass `${http.last_content}` to a `py>` task for JSON parsing — the raw JSON string is too complex for inline `${...}` expressions.

### Required headers

| Header | Value | Notes |
|---|---|---|
| `x-api-key` | `${secret:td.apikey}` | TD API key, same as used for `td>` operator |
| `anthropic-version` | `2023-06-01` | Only production version available (the only alternative `2023-01-01` is deprecated) |

`Content-Type: application/json` is set automatically by `content_format: json` — do not add it to `headers` manually.

### Available models

The TD LLM Proxy passes model names through to the Anthropic backend without validation. Use the standard Anthropic API model IDs (without `td/` prefix):

| Model | API ID | Alias | Cost | Best for |
|---|---|---|---|---|
| Opus 4.6 | `claude-opus-4-6` | — | $5/$25 per MTok | Complex reasoning, agent tasks |
| Sonnet 4.6 | `claude-sonnet-4-6` | — | $3/$15 per MTok | Balanced speed and intelligence |
| Haiku 4.5 | `claude-haiku-4-5-20251001` | `claude-haiku-4-5` | $1/$5 per MTok | Fast, cost-efficient tasks |

Legacy models (`claude-sonnet-4-5`, `claude-opus-4-5`, `claude-sonnet-4-0`, etc.) are also available. For workflow tasks that run frequently (scheduled ETL analysis, data quality checks), prefer `claude-haiku-4-5` to minimize cost.

### Regional endpoints

| Region | Endpoint |
|---|---|
| US | `https://llm-proxy.us01.treasuredata.com/v1/messages` |
| JP | `https://llm-proxy.treasuredata.co.jp/v1/messages` |
| EU | `https://llm-proxy.eu01.treasuredata.com/v1/messages` |
| AP02 | `https://llm-proxy.ap02.treasuredata.com/v1/messages` |
| AP03 | `https://llm-proxy.ap03.treasuredata.com/v1/messages` |

See [patterns.md](references/patterns.md) for more advanced examples (query results as context, response parsing, conditional branching on agent output).

## Workflow Manifest and Local Registry

Every workflow **must** include a `manifest.yml` for lifecycle management. Workflows are stored locally in `~/.tdx/workflows/<name>/` and managed through Treasure Studio's TD Workflow panel.

### manifest.yml (required)

```yaml
name: daily_revenue_etl              # Must match .dig filename
project: pricing-watch-revenue-daily  # TD project name
owner: pricing-watch                  # Agent name or user
created: "2026-04-03"
purpose: "Aggregate daily revenue data into dim_revenue"
ttl: 90d                              # Review deadline: permanent / 30d / 90d / 180d
schedule: "daily 09:00 Asia/Tokyo"
tables:
  reads: [raw_data.events, raw_data.users]
  writes: [analytics.dim_revenue]
notify: "#data-alerts"
tags: [etl, revenue, production]
```

### Storage

Workflows are stored in `~/.tdx/workflows/` as directories:

```
~/.tdx/workflows/
  daily_revenue_etl/
    manifest.yml       # Metadata (validated by Studio)
    daily_revenue_etl.dig  # Workflow definition
    queries/           # SQL files
    tasks/             # Python files
```

Studio's TD Workflow panel automatically discovers all workflow directories and provides:
- **List view** with name, project, schedule, deploy/run status
- **Push** (deploy to TD via `tdx wf push`)
- **Run** (trigger via `tdx wf start`)
- **Edit** manifest.yml with validation

### Lifecycle

| Phase | Mechanism |
|---|---|
| **Create** | Agent creates workflow directory in `~/.tdx/workflows/` with manifest.yml + .dig files |
| **Deploy** | Push to TD via Studio panel or `tdx wf push` |
| **Run** | Scheduled on TD platform or manual via Studio panel / `tdx wf start` |
| **Review** | TTL expiry triggers owner notification; decide continue or archive |

### Agent Discovery

Agents can list workflows via the Studio workflow API, or by scanning `~/.tdx/workflows/`:

```bash
# List all local workflows
ls ~/.tdx/workflows/

# Check manifest for a specific workflow
cat ~/.tdx/workflows/daily_revenue_etl/manifest.yml
```

See [scaffold.md](references/scaffold.md) for full manifest spec and project structure.

## Deployment with tdx

```bash
# Push project to TD
tdx wf push my_project

# Set secrets (user must run these — see scaffold.md)
tdx wf secrets set my_project "td.apikey=YOUR_MASTER_API_KEY"

# Start a workflow manually
tdx wf start my_project my_workflow

# List workflows
tdx wf list my_project

# Monitor sessions
tdx wf sessions my_project my_workflow

# View attempt logs
tdx wf logs <attempt_id>
```

## References

Read these as needed — they provide deeper detail than what's in this file:

- [Operators reference](references/operators.md) — TD operators (`td>`, `td_ddl>`, etc.), workflow control (`if>`, `for_each>`, `loop>`, `call>`), and `http>`/`mail>`
- [py> operator](references/py-operator.md) — Python Custom Script: package installation, digdag Python API, argument mapping. Read only when building `py>` tasks
- [Workflow patterns](references/patterns.md) — Common ETL, branching, wait, backfill, agent, and registry patterns
- [Project scaffold](references/scaffold.md) — Directory structure, manifest spec, local storage, secrets, and deployment
- [lkr secret management](references/lkr.md) — Install lkr, register secrets, naming convention, .env mapping. Read when running scripts locally or deploying workflows
