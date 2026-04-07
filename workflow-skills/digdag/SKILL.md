---
name: digdag
description: Write .dig workflow files for Treasure Workflow. Covers digdag YAML syntax, td> operator, session variables (session_date, session_date_compact), _parallel/_retry/_error directives, and TD platform constraints. Use when creating or editing .dig workflow definitions. Also trigger on mentions of digdag, .dig files, td> operator, or workflow scheduling.
---

# Treasure Workflow (Digdag)

Write `.dig` workflow files for Treasure Data.

> **Official docs**: https://docs.digdag.io/

## TD Platform Constraints

Full parameter reference for all operators: [operators.md](references/operators.md)

**Available operators:**

| Category | Operators |
|---|---|
| Workflow control | `call>`, `if>`, `for_each>`, `for_range>`, `loop>`, `fail>`, `echo>`, `wait>`, `http_call>`, `require>` |
| Treasure Data | `td>`, `td_run>`, `td_ddl>`, `td_load>`, `td_for_each>`, `td_wait>`, `td_wait_table>`, `td_partial_delete>`, `td_table_export>`, `td_result_export>` |
| Scripting | `py>` (Python via Custom Script Docker image) |
| Network | `http>`, `mail>` |

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

## Session Variables

| Variable | Example |
|---|---|
| `${session_time}` | `2026-01-30T00:00:00+09:00` |
| `${session_date}` | `2026-01-30` |
| `${session_date_compact}` | `20260130` |
| `${session_unixtime}` | `1738159200` |
| `${last_session_date}` | Previous scheduled date |
| `${next_session_date}` | Next scheduled date |

Date math via Moment.js: `${moment(session_time).subtract(1, 'days').format("YYYY-MM-DD")}`

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

## Variables and Secrets

For `py>` tasks — package installation, digdag Python API, argument mapping: [py-operator.md](references/py-operator.md)

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

Runtime params: `tdx wf start project workflow -p target_date=2026-04-01`

## mail> on TD

TD's built-in SMTP relay handles delivery. Do not configure `mail.host`, `mail.port`, `mail.username`, or `mail.password` secrets — they are not needed on the TD platform.

```yaml
+send_report:
  mail>: templates/report.html
  subject: "Daily Report ${session_date}"
  to: [team@example.com]
  html: true
```

## LLM in Workflows

LLM calls in TD workflows always go through `http>`. There are two options — **always ask the user which to use** before writing the workflow:

| Option | Prerequisites | Best for |
|---|---|---|
| **Raw LLM** (TD LLM Proxy) | None — works immediately with `td.apikey` | Simple summarization, classification, formatting |
| **TD Agent** (webhook) | Agent pre-created in TD Console, webhook URL obtained | Complex tasks requiring tools, knowledge bases, or multi-turn reasoning |

Do not use `py>`, external API calls, or direct Anthropic endpoints for LLM invocation.

For advanced patterns (response parsing, conditional branching, Slack/email reports): [patterns-llm.md](references/patterns-llm.md)

### Option 1: Raw LLM (no setup required)

Call TD LLM Proxy directly. Set the endpoint to match the user's TD region.

```yaml
_export:
  # Set to user's region: us01 | treasuredata.co.jp | eu01 | ap02 | ap03
  llm_endpoint: https://llm-proxy.us01.treasuredata.com/v1/messages

+ask_llm:
  http>: ${llm_endpoint}
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

Response in `${http.last_content}` (JSON string). Available models: `claude-haiku-4-5-20251001`, `claude-sonnet-4-6`, `claude-opus-4-6`.

| Region | Endpoint |
|---|---|
| US | `https://llm-proxy.us01.treasuredata.com` |
| JP | `https://llm-proxy.treasuredata.co.jp` |
| EU | `https://llm-proxy.eu01.treasuredata.com` |
| AP02 | `https://llm-proxy.ap02.treasuredata.com` |
| AP03 | `https://llm-proxy.ap03.treasuredata.com` |

### Option 2: TD Agent (requires pre-setup)

Call a pre-built TD Agent via its webhook URL. The user must provide:
1. **Agent created** in TD Console (with tools, knowledge bases, system prompt configured)
2. **Webhook URL** obtained from the agent settings

```yaml
+call_agent:
  http>: ${secret:agent.webhook_url}
  method: POST
  headers:
    - content-type: application/json
  content:
    message: "Analyze sales activity for ${session_date}"
  content_format: json
  store_content: true
```

## Common Pitfalls

- **`td.apikey` must be a Master API Key** in `ACCOUNT_ID/KEY` format. OAuth tokens cause 401. Never handle key values — present `tdx wf secrets set` commands with placeholders.
- **`td_ddl>` `create_databases` requires `td.apikey`** — create the database via CLI first if the secret isn't set yet.

## Schedule Options

```yaml
schedule:
  daily>: "09:00:00"
  # hourly>: 30:00
  # weekly>: Mon,09:00:00
  # monthly>: 1,09:00:00
  # cron>: "*/15 * * * *"
  # minutes_interval>: 30
```

## Building a Complete Pipeline

For ETL pipeline patterns (idempotent write, wait-then-process, backfill, modular workflows): [patterns-etl.md](references/patterns-etl.md)

For workflow registry governance (TTL review, duplicate detection, pre-deploy check): [patterns-registry.md](references/patterns-registry.md)

For deploying to TD (manifest.yml, project structure, secrets, deployment checklist): [scaffold.md](references/scaffold.md)
