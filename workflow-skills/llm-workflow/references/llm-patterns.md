# LLM Patterns

Advanced patterns for LLM calls in TD workflows via `http>`.

---

## Query Results as LLM Context

Feed SQL results into an LLM for analysis.

```yaml
+gather_data:
  td>: queries/daily_summary.sql
  store_last_results: true
  database: analytics

+analyze:
  http>: https://llm-proxy.us01.treasuredata.com/v1/messages
  method: POST
  headers:
    - x-api-key: ${secret:td.apikey}
    - anthropic-version: 2023-06-01
  content:
    model: claude-haiku-4-5-20251001
    max_tokens: 2048
    messages:
      - role: user
        content: "Analyze these metrics and flag anomalies: revenue=${td.last_results.revenue}, orders=${td.last_results.orders}, avg_order_value=${td.last_results.avg_order_value}. Compare to yesterday: prev_revenue=${td.last_results.prev_revenue}."
  content_format: json
  store_content: true
```

---

## LLM Conditional Action

Ask a yes/no question and branch on the answer. Use `py>` to parse into a boolean.

```yaml
+gather_metrics:
  td>: queries/data_quality_metrics.sql
  store_last_results: true
  database: analytics

+ask_llm:
  http>: https://llm-proxy.us01.treasuredata.com/v1/messages
  method: POST
  headers:
    - x-api-key: ${secret:td.apikey}
    - anthropic-version: 2023-06-01
  content:
    model: claude-haiku-4-5-20251001
    max_tokens: 256
    messages:
      - role: user
        content: "Given null_rate=${td.last_results.null_rate}, duplicate_rate=${td.last_results.dup_rate}, row_count=${td.last_results.row_count}: is this data quality acceptable? Reply ONLY with 'yes' or 'no'."
  content_format: json
  store_content: true

+parse_response:
  py>: tasks.ResponseParser.parse_yes_no
  docker:
    image: "treasuredata/customscript-python:3.12.11-td1"

+branch:
  if>: ${agent_approved}
  _do:
    +publish:
      td>: queries/publish.sql
      insert_into: public_table
  _else_do:
    +alert:
      http>: https://slack.com/api/chat.postMessage
      method: POST
      headers:
        - content-type: "application/json"
        - Authorization: "Bearer ${secret:slack.bot_user_oauth_token}"
      content:
        channel: "C0XXXXXXXXX"
        text: "Data quality issue flagged for ${session_date}"
```

`tasks/__init__.py`:
```python
import digdag
import json


class ResponseParser:
    def parse_yes_no(self):
        response = digdag.env.params.get("http", {}).get("last_content", "{}")
        body = json.loads(response) if isinstance(response, str) else response
        text = body.get("content", [{}])[0].get("text", "").strip().lower()
        approved = text.startswith("yes")
        digdag.env.store({"agent_approved": approved})
```

---

## LLM Analysis to HTML Email Report

Query results feed the LLM, and the LLM analysis is embedded into HTML via `py>` + `digdag.env.store()`.

```yaml
+gather:
  td>: queries/daily_kpis.sql
  store_last_results: true

+analyze:
  http>: https://llm-proxy.us01.treasuredata.com/v1/messages
  method: POST
  headers:
    - x-api-key: ${secret:td.apikey}
    - anthropic-version: 2023-06-01
  content:
    model: claude-haiku-4-5-20251001
    max_tokens: 2048
    messages:
      - role: user
        content: "Analyze these KPIs and write an HTML <div> with key findings: revenue=${td.last_results.revenue}, churn=${td.last_results.churn_rate}%"
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

The HTML template references `${analysis_content}` (stored by `py>`) and `${td.last_results.*}` for raw KPIs. Use inline CSS only — email clients strip `<link>` tags.
