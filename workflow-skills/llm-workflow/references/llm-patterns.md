# LLM Patterns

Advanced patterns for LLM calls in TD workflows via `http>`.

---

## Query Results as LLM Context

`store_last_results: true` stores **only the first row**. Choose the pattern based on result shape:

| Pattern | When to use |
|---|---|
| **Single row** | KPI snapshot, aggregated metrics — query returns exactly one row |
| **SQL aggregation** | Multi-row data compressed into one row via `array_join`/`listagg` |
| **py> formatting** | Large or complex tables — full control over formatting |

### Pattern 1: Single row (simplest)

Design the query to return one row of scalar values.

```yaml
+gather_data:
  td>: queries/daily_summary.sql
  store_last_results: true

+analyze:
  http>: ${llm_endpoint}
  method: POST
  headers:
    - x-api-key: ${secret:td.apikey}
    - anthropic-version: 2023-06-01
  content:
    model: claude-haiku-4-5-20251001
    max_tokens: 2048
    messages:
      - role: user
        content: "Analyze: revenue=${td.last_results.revenue}, orders=${td.last_results.orders}, avg_order_value=${td.last_results.avg_order_value}"
  content_format: json
  store_content: true
```

### Pattern 2: SQL aggregation (no py> needed)

Compress multiple rows into a single text column using string aggregation, then pass via `store_last_results`.

```yaml
+gather_data:
  td>: queries/aggregate_for_llm.sql
  store_last_results: true

+analyze:
  http>: ${llm_endpoint}
  method: POST
  headers:
    - x-api-key: ${secret:td.apikey}
    - anthropic-version: 2023-06-01
  content:
    model: claude-haiku-4-5-20251001
    max_tokens: 2048
    messages:
      - role: user
        content: |
          Analyze the following sales data by region and identify trends:
          ${td.last_results.report_text}
  content_format: json
  store_content: true
```

`queries/aggregate_for_llm.sql` (Trino):
```sql
select array_join(
  array_agg(
    region || ': revenue=' || cast(revenue as varchar)
    || ', orders=' || cast(orders as varchar)
    || ', avg_order=' || cast(avg_order_value as varchar)
  ),
  chr(10)
) as report_text
from (
  select
    region,
    sum(revenue) as revenue,
    count(*) as orders,
    round(avg(order_value), 2) as avg_order_value
  from sales
  where td_interval(time, '-7d')
  group by region
  order by revenue desc
)
```

This produces a single row like:
```
US: revenue=125000, orders=340, avg_order=367.65
EU: revenue=89000, orders=210, avg_order=423.81
AP: revenue=56000, orders=180, avg_order=311.11
```

**Tip:** For markdown table output, format with `|` separators:
```sql
select
  '| Region | Revenue | Orders |' || chr(10)
  || '|---|---|---|' || chr(10)
  || array_join(
    array_agg('| ' || region || ' | ' || cast(revenue as varchar) || ' | ' || cast(orders as varchar) || ' |'),
    chr(10)
  ) as report_text
from ...
```

### Pattern 3: py> formatting (full control)

Write query results to a table, then read with `py>` using pytd. Best for large result sets or complex formatting.

```yaml
+build_report_data:
  td>: queries/weekly_breakdown.sql
  create_table: tmp_llm_input

+format_for_llm:
  py>: tasks.LLMFormatter.run
  docker:
    image: "treasuredata/customscript-python:3.12.11-td1"
  _env:
    TD_API_KEY: ${secret:td.apikey}
  database: analytics
  table: tmp_llm_input

+analyze:
  http>: ${llm_endpoint}
  method: POST
  headers:
    - x-api-key: ${secret:td.apikey}
    - anthropic-version: 2023-06-01
  content:
    model: claude-haiku-4-5-20251001
    max_tokens: 2048
    messages:
      - role: user
        content: |
          Analyze this weekly performance data:
          ${llm_input_text}
  content_format: json
  store_content: true
```

`tasks/__init__.py`:
```python
import digdag
import os
import pytd


class LLMFormatter:
    def run(self):
        database = digdag.env.params["database"]
        table = digdag.env.params["table"]

        client = pytd.Client(
            apikey=os.environ["TD_API_KEY"],
            database=database,
        )
        result = client.query(f"select * from {table} order by date")

        # Format as markdown table
        headers = result["columns"]
        lines = ["| " + " | ".join(headers) + " |"]
        lines.append("| " + " | ".join(["---"] * len(headers)) + " |")
        for row in result["data"]:
            lines.append("| " + " | ".join(str(v) for v in row) + " |")

        digdag.env.store({"llm_input_text": "\n".join(lines)})
```

`tasks/requirements.txt`:
```
pytd
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

The HTML template references `${analysis_content}` (stored by `py>`) and `${td.last_results.*}` for raw KPIs. Use inline CSS only — email clients strip `<link>` tags.
