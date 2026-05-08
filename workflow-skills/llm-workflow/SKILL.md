---
name: llm-workflow
description: Use when building TD workflows that include LLM processing steps — data pipeline with LLM summarization, Slack/email notification, or any end-to-end automation. Covers patterns for query data, LLM analysis via TD LLM Proxy or TD Agent, and notification via Slack (Webhook/Bot API) or email. Also trigger on: LLM in workflow, workflow with Slack notification, automated report workflow, KPI summary pipeline, data-to-insight workflow.
---

# LLM Workflow

Build TD workflows that chain data queries, LLM processing, and notifications into end-to-end automation.

```
[td> / py> pipeline] → [LLM summarize] → [Slack / Mail notify]
```

For digdag syntax and operator reference, see the **digdag** skill.

## End-to-End Template

Steps 1-4 are shared. Step 5 depends on notification channel — **Slack** (requires Bot App) or **Mail** (no setup needed on TD).

### Steps 1-4: Pipeline + LLM (shared)

```yaml
timezone: Asia/Tokyo

schedule:
  daily>: "07:00:00"

_export:
  td:
    database: my_database
    engine: presto
  output_db: my_analytics
  llm_endpoint: "https://llm-proxy.us01.treasuredata.com/v1/messages"

# 1. Setup
+setup:
  td_ddl>:
    create_databases: ["${output_db}"]

# 2. Build tables
+build_tables:
  _parallel: true
  +summary_a:
    td>: queries/summary_a.sql
    database: ${output_db}
    create_table: summary_a
  +summary_b:
    td>: queries/summary_b.sql
    database: ${output_db}
    create_table: summary_b

# 3. Extract KPIs (single row for LLM context)
+extract_kpis:
  td>: queries/kpi_snapshot.sql
  store_last_results: true

# 4. LLM summarize
+llm_summarize:
  http>: ${llm_endpoint}
  method: POST
  timeout: 300
  headers:
    - x-api-key: ${secret:td.apikey}
    - anthropic-version: 2023-06-01
  content:
    model: claude-haiku-4-5-20251001
    max_tokens: 1024
    messages:
      - role: user
        content: |
          Summarize this daily KPI snapshot. Be concise (under 300 chars).
          Date: ${session_date}
          Metric A: ${td.last_results.metric_a}
          Metric B: ${td.last_results.metric_b}
  content_format: json
  store_content: true
```

### Step 5a: Notify via Slack (Bot API)

Requires Slack Bot App with `chat:write` scope. Add after step 4:

```yaml
_export:
  slack:
    post_url: "https://slack.com/api/chat.postMessage"
    channel: "C0XXXXXXXXX"

# 5. Post to Slack — JSON.parse extracts LLM text inline (no py> needed)
+post_to_slack:
  http>: ${slack.post_url}
  method: POST
  headers:
    - content-type: "application/json"
    - Authorization: "Bearer ${secret:slack.bot_user_oauth_token}"
  content:
    channel: ${slack.channel}
    text: ${JSON.parse(http.last_content).content[0].text}
  store_content: true

_error:
  +notify_failure:
    http>: ${slack.post_url}
    method: POST
    headers:
      - content-type: "application/json"
      - Authorization: "Bearer ${secret:slack.bot_user_oauth_token}"
    content:
      channel: ${slack.channel}
      text: "Workflow failed for ${session_date}"
```

### Step 5b: Notify via Email (no setup needed)

TD's built-in SMTP relay handles delivery — no secrets required. LLM response must be extracted via `py>` into a template variable:

```yaml
# 5. Extract LLM response and send email
+extract_summary:
  py>: tasks.ResponseExtractor.run
  docker:
    image: "treasuredata/customscript-python:3.12.11-td1"

+send_report:
  mail>: templates/report.html
  subject: "Daily Report ${session_date}"
  to: [team@example.com]
  html: true

_error:
  +notify_failure:
    mail>:
      data: "Workflow failed for ${session_date}"
    subject: "ALERT: workflow failure ${session_date}"
    to: [team@example.com]
```

`tasks/__init__.py`:
```python
import digdag
import json

class ResponseExtractor:
    def run(self):
        response = digdag.env.params.get("http", {}).get("last_content", "{}")
        body = json.loads(response) if isinstance(response, str) else response
        text = body.get("content", [{}])[0].get("text", "")
        digdag.env.store({"llm_summary": text})
```

`templates/report.html` — use inline CSS only (email clients strip `<link>` tags):
```html
<h2>Daily Report: ${session_date}</h2>
<div>${llm_summary}</div>
```

### Key patterns

- **`timeout: 300`** on LLM calls — `http>` defaults to 30s which is insufficient. Always set 300+ for LLM Proxy, 3600 for TD Agent
- **`store_last_results: true`** exposes `${td.last_results.*}` — design the query to return exactly one row
- **`store_content: true`** on `http>` stores the raw response in `${http.last_content}`
- **`${JSON.parse(http.last_content).content[0].text}`** extracts LLM text inline (Slack path, no py> needed)
- **`py>` extraction** needed for Mail path because `mail>` templates cannot use `JSON.parse()`

## Passing Query Results to LLM

`store_last_results: true` stores only the first row. For multi-row data, choose the right pattern:

| Pattern | When to use |
|---|---|
| **Single row** | KPI snapshot, aggregated metrics |
| **SQL aggregation** | Multi-row → one text column via `array_join`/`listagg` (no py> needed) |
| **py> formatting** | Large tables, complex formatting (markdown table, CSV) |

For detailed examples of each pattern: [llm-patterns.md](references/llm-patterns.md)

## LLM Summarize

Two options — **always ask the user which to use**:

| Option | Prerequisites | Best for |
|---|---|---|
| **Raw LLM** (TD LLM Proxy) | None — works with `td.apikey` | Summarization, classification, formatting |
| **TD Agent** (webhook) | Agent pre-created in TD Console | Complex tasks with tools, knowledge bases |

For detailed patterns (conditional branching, multi-step reasoning): [llm-patterns.md](references/llm-patterns.md)

### Raw LLM (TD LLM Proxy)

```yaml
+ask_llm:
  http>: ${llm_endpoint}
  method: POST
  timeout: 300
  headers:
    - x-api-key: ${secret:td.apikey}
    - anthropic-version: 2023-06-01
  content:
    model: claude-haiku-4-5-20251001
    max_tokens: 1024
    messages:
      - role: user
        content: "Summarize: revenue=${td.last_results.revenue}"
  content_format: json
  store_content: true
```

Available models: `claude-haiku-4-5-20251001`, `claude-sonnet-4-6`, `claude-opus-4-6`

| Region | Endpoint |
|---|---|
| US | `https://llm-proxy.us01.treasuredata.com/v1/messages` |
| JP | `https://llm-proxy.treasuredata.co.jp/v1/messages` |
| EU | `https://llm-proxy.eu01.treasuredata.com/v1/messages` |
| AP02 | `https://llm-proxy.ap02.treasuredata.com/v1/messages` |
| AP03 | `https://llm-proxy.ap03.treasuredata.com/v1/messages` |

### TD Agent (webhook)

Call a pre-built TD Agent via its webhook action URL. The user must provide:
1. **Agent created** in TD Console (with tools, knowledge bases, system prompt configured)
2. **Action ID** obtained from the agent's webhook settings

```yaml
_export:
  agent:
    endpoint: "https://llm-connect.treasuredata.com/api/actions"
    action_id: "YOUR_ACTION_ID"

+call_agent:
  http>: ${agent.endpoint}/${agent.action_id}/text
  method: POST
  headers:
    - Authorization: "Basic ${secret:td.webhook_key}"
    - Content-Type: "application/json"
  content:
    question: "Analyze sales activity for ${session_date}"
  store_content: true
  timeout: 3600
```

### Response parsing

**Inline (Slack path)** — `${JSON.parse(http.last_content).content[0].text}`

**Via py> (Mail path or complex parsing):**

```python
import digdag
import json

class ResponseExtractor:
    def run(self):
        response = digdag.env.params.get("http", {}).get("last_content", "{}")
        body = json.loads(response) if isinstance(response, str) else response
        text = body.get("content", [{}])[0].get("text", "")
        digdag.env.store({"llm_summary": text})
```

## Notification

| Channel | Setup required | Best for |
|---|---|---|
| **Email** (`mail>`) | None on TD platform | Reports, alerts — simplest path |
| **Slack Webhook** | Webhook URL | Simple fixed-channel posts |
| **Slack Bot API** | Bot App with `chat:write` | Dynamic channels, threads |

For detailed patterns: [notification-patterns.md](references/notification-patterns.md)

### Email

```yaml
+send_report:
  mail>: templates/report.html
  subject: "Daily Report ${session_date}"
  to: [team@example.com]
  html: true
```

### Slack Webhook

```yaml
+notify:
  http>: ${secret:slack.webhook}
  method: POST
  content:
    text: "Pipeline completed for ${session_date}"
```

### Slack Bot API

```yaml
+notify:
  http>: https://slack.com/api/chat.postMessage
  method: POST
  headers:
    - content-type: "application/json"
    - Authorization: "Bearer ${secret:slack.bot_user_oauth_token}"
  content:
    channel: "C0XXXXXXXXX"
    text: "Pipeline completed for ${session_date}"
  store_content: true
```

## Secrets

| Secret | Required for | How to set |
|---|---|---|
| `td.apikey` | LLM Proxy calls | `tdx wf secrets set <project> "td.apikey=YOUR_KEY"` |
| `td.webhook_key` | TD Agent calls | `tdx wf secrets set <project> "td.webhook_key=YOUR_WEBHOOK_KEY"` |
| `slack.webhook` | Slack Webhook | `tdx wf secrets set <project> "slack.webhook=YOUR_URL"` |
| `slack.bot_user_oauth_token` | Slack Bot API | `tdx wf secrets set <project> "slack.bot_user_oauth_token=YOUR_TOKEN"` |

Email (`mail>`) requires no secrets on TD platform.

## References

For digdag syntax, operators, and project setup — see the **digdag** skill and its references:

- Operator parameter reference: [operators.md](../digdag/references/operators.md)
- py> operator: [py-operator.md](../digdag/references/py-operator.md)
- ETL pipeline patterns: [patterns-etl.md](../digdag/references/patterns-etl.md)
- Control flow patterns: [patterns-control.md](../digdag/references/patterns-control.md)
- Project structure and deployment: [scaffold.md](../digdag/references/scaffold.md)
