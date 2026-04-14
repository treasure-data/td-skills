# Notification Patterns

Email and Slack notification patterns for TD workflows.

---

## Email via mail>

TD's built-in SMTP relay handles delivery — no secrets needed on TD platform. Simplest notification path.

### Plain text alert

```yaml
+send_alert:
  mail>:
    data: "Pipeline completed for ${session_date}"
  subject: "Daily Pipeline ${session_date}"
  to: [team@example.com]
```

### HTML report with LLM content

Extract LLM response via `py>`, then reference the variable in the HTML template.

```yaml
# Assumes LLM call already ran with store_content: true

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

`templates/report.html` — use inline CSS only (email clients strip `<link>` tags):
```html
<h2>Daily Report: ${session_date}</h2>
<div>${llm_summary}</div>
```

### Error notification

```yaml
_error:
  +notify_failure:
    mail>:
      data: "Workflow failed for ${session_date}"
    subject: "ALERT: workflow failure ${session_date}"
    to: [team@example.com]
```

---

## Slack Webhook

Webhook URL contains the auth token — just POST a JSON payload.

```yaml
+notify:
  http>: ${secret:slack.webhook}
  method: POST
  content:
    text: "Pipeline completed for ${session_date}"
```

Error notification:

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

Centralize config in `_export` so both success and error handlers share the same settings:

```yaml
_export:
  slack:
    post_url: "https://slack.com/api/chat.postMessage"
    channel: "C0XXXXXXXXX"
```

### Basic notification

```yaml
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

`JSON.parse()` extracts the LLM response text inline:

```yaml
# Assumes LLM call already ran with store_content: true

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

### Error notification

```yaml
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

---

## Shared py> Helper

Used by both email and Slack patterns when `py>` extraction is needed:

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
