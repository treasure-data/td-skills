# Notification Patterns

Slack and email notification patterns for TD workflows.

---

## Slack Webhook

Simplest method. The webhook URL contains the auth token — just POST a JSON payload.

```yaml
# Store webhook URL as a secret, not inline
# tdx wf secrets set <project> "slack.webhook=https://hooks.slack.com/services/..."

+notify_success:
  http>: ${secret:slack.webhook}
  method: POST
  content:
    text: "Pipeline completed for ${session_date}"
```

### Error notification with webhook

```yaml
_error:
  http>: ${secret:slack.webhook}
  method: POST
  content:
    text: "Workflow failed for ${session_date}"
```

---

## Slack Bot API

Use `chat.postMessage` for dynamic channels, thread replies, or richer message control. Requires a Slack Bot with `chat:write` scope.

```yaml
_export:
  slack:
    post_url: "https://slack.com/api/chat.postMessage"
    channel: "C0XXXXXXXXX"

+notify:
  http>: ${slack.post_url}
  method: POST
  headers:
    - content-type: "application/json"
    - Authorization: "Bearer ${secret:slack.bot_user_oauth_token}"
  content:
    channel: ${slack.channel}
    text: "Pipeline completed for ${session_date}"
  store_content: true
```

### LLM response to Slack (no py> needed)

Chain `http>` calls: LLM response stored via `store_content: true`, then parsed inline with `JSON.parse()`.

```yaml
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
        content: "Summarize: metric_a=${td.last_results.metric_a}"
  content_format: json
  store_content: true

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
```

### Error notification with Bot API

```yaml
_error:
  +notify_failure:
    http>: https://slack.com/api/chat.postMessage
    method: POST
    headers:
      - content-type: "application/json"
      - Authorization: "Bearer ${secret:slack.bot_user_oauth_token}"
    content:
      channel: "C0XXXXXXXXX"
      text: "Workflow failed for ${session_date}"
```

### Success + failure notification pattern

Centralize Slack config in `_export` so both success and error handlers share the same settings.

```yaml
_export:
  slack:
    post_url: "https://slack.com/api/chat.postMessage"
    channel: "C0XXXXXXXXX"

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

# ... pipeline steps ...

+notify_success:
  http>: ${slack.post_url}
  method: POST
  headers:
    - content-type: "application/json"
    - Authorization: "Bearer ${secret:slack.bot_user_oauth_token}"
  content:
    channel: ${slack.channel}
    text: "Pipeline completed for ${session_date}"
  store_content: true
```

---

## Email via mail>

TD's built-in SMTP relay handles delivery. Do not configure `mail.host`, `mail.port`, `mail.username`, or `mail.password` secrets — they are not needed on TD platform.

### Plain text

```yaml
+send_report:
  mail>: templates/report.txt
  subject: "Daily Report ${session_date}"
  to: [team@example.com]
```

### HTML with LLM content

Use `py>` to store the LLM analysis into a variable, then reference it in the HTML template.

```yaml
+analyze:
  http>: ${llm_endpoint}
  method: POST
  timeout: 300
  headers:
    - x-api-key: ${secret:td.apikey}
    - anthropic-version: 2023-06-01
  content:
    model: claude-haiku-4-5-20251001
    max_tokens: 2048
    messages:
      - role: user
        content: "Write an HTML summary of: revenue=${td.last_results.revenue}"
  content_format: json
  store_content: true

+extract:
  py>: tasks.ResponseExtractor.run
  docker:
    image: "treasuredata/customscript-python:3.12.11-td1"

+send_report:
  mail>: templates/report.html
  subject: "Daily Report ${session_date}"
  to: [team@example.com]
  html: true
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
        digdag.env.store({"analysis_content": text})
```

`templates/report.html`:
```html
<h2>Daily Report: ${session_date}</h2>
<div>${analysis_content}</div>
```

Use inline CSS only — email clients strip `<link>` tags.

---

## Secrets Reference

| Secret | Method | How to set |
|---|---|---|
| `slack.webhook` | Slack Webhook | `tdx wf secrets set <project> "slack.webhook=YOUR_URL"` |
| `slack.bot_user_oauth_token` | Slack Bot API | `tdx wf secrets set <project> "slack.bot_user_oauth_token=YOUR_TOKEN"` |

Slack Bot setup: Create a Slack App, add `chat:write` scope, install to workspace, copy Bot User OAuth Token.
