# LLM Patterns

Advanced patterns for LLM calls in TD workflows via `http>`.

## Base LLM Call

All patterns below use this structure. Only `messages.content` and surrounding steps vary.

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
        content: "YOUR PROMPT HERE"
  content_format: json
  store_content: true
```

Response stored in `${http.last_content}` (JSON string). Extract text with `${JSON.parse(http.last_content).content[0].text}` or via `py>`.

---

## Passing Query Results to LLM

`store_last_results: true` stores **only the first row**. Choose based on result shape:

### Pattern 1: Single row (simplest)

```yaml
+gather_data:
  td>: queries/daily_summary.sql
  store_last_results: true

# Base LLM call with prompt:
#   "Analyze: revenue=${td.last_results.revenue}, orders=${td.last_results.orders}"
```

### Pattern 2: SQL aggregation (no py> needed)

Compress multiple rows into a single text column, then pass via `store_last_results`.

```yaml
+gather_data:
  td>: queries/aggregate_for_llm.sql
  store_last_results: true

# Base LLM call with prompt:
#   "Analyze the following data:\n${td.last_results.report_text}"
```

`queries/aggregate_for_llm.sql` (Trino):
```sql
select array_join(
  array_agg(
    region || ': revenue=' || cast(revenue as varchar)
    || ', orders=' || cast(orders as varchar)
  ),
  chr(10)
) as report_text
from (
  select region, sum(revenue) as revenue, count(*) as orders
  from sales
  where td_interval(time, '-7d')
  group by region
  order by revenue desc
)
```

Produces:
```
US: revenue=125000, orders=340
EU: revenue=89000, orders=210
```

For markdown table output, format with `|` separators in the SQL.

### Pattern 3: py> formatting (full control)

Write query results to a table, then read with `py>` using pytd.

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

# Base LLM call with prompt:
#   "Analyze this data:\n${llm_input_text}"
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
        client = pytd.Client(apikey=os.environ["TD_API_KEY"], database=database)
        result = client.query(f"select * from {table} order by date")

        headers = result["columns"]
        lines = ["| " + " | ".join(headers) + " |"]
        lines.append("| " + " | ".join(["---"] * len(headers)) + " |")
        for row in result["data"]:
            lines.append("| " + " | ".join(str(v) for v in row) + " |")
        digdag.env.store({"llm_input_text": "\n".join(lines)})
```

---

## LLM Conditional Action

Ask a yes/no question and branch on the answer.

```yaml
+gather_metrics:
  td>: queries/data_quality_metrics.sql
  store_last_results: true

# Base LLM call (max_tokens: 256) with prompt:
#   "Given null_rate=${td.last_results.null_rate}, duplicate_rate=${td.last_results.dup_rate}:
#    is this data quality acceptable? Reply ONLY 'yes' or 'no'."

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
      mail>:
        data: "Data quality issue flagged for ${session_date}"
      subject: "ALERT: data quality ${session_date}"
      to: [team@example.com]
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
        digdag.env.store({"agent_approved": text.startswith("yes")})
```
