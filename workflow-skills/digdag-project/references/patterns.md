# TD Workflow Patterns

Common workflow patterns for Treasure Data. All examples use only TD-available operators.

---

## 1. Basic ETL Pipeline

Sequential extract-transform-load with staging table.

```yaml
timezone: Asia/Tokyo

schedule:
  daily>: "09:00:00"

_export:
  td:
    database: analytics
    engine: presto

+prepare:
  td_ddl>:
  empty_tables: [staging_events]

+extract:
  td>: queries/extract.sql
  create_table: staging_events

+transform:
  td>: queries/transform.sql
  insert_into: daily_summary

+cleanup:
  td_ddl>:
  drop_tables: [staging_events]
```

---

## 2. Idempotent Write (DELETE + INSERT)

Safely re-run without duplicates using `td_partial_delete>` + `td>`.

```yaml
+delete_existing:
  td_partial_delete>: daily_summary
  database: analytics
  from: ${session_date}
  to: ${next_session_date}

+insert_fresh:
  td>: queries/daily_summary.sql
  insert_into: daily_summary
```

Alternative using Presto (DELETE + INSERT in one workflow):

```yaml
+delete_existing:
  td>: queries/delete_partition.sql
  # DELETE FROM daily_summary WHERE TD_TIME_RANGE(time, '${session_date}', '${next_session_date}')

+insert_fresh:
  td>: queries/daily_summary.sql
  insert_into: daily_summary
```

---

## 3. Wait-Then-Process

Wait for upstream data before processing.

```yaml
+wait_for_data:
  td_wait_table>: incoming_events
  database: raw_data
  rows: 1
  interval: 60

+process:
  td>: queries/process_events.sql
  create_table: processed_events
```

With custom condition using `td_wait>`:

```yaml
+wait_for_enough_data:
  td_wait>: queries/check_threshold.sql
  database: raw_data
  interval: 120
```

`queries/check_threshold.sql`:
```sql
SELECT COUNT(*) > 10000
FROM incoming_events
WHERE TD_TIME_RANGE(time, '${session_time}')
```

---

## 4. Conditional Branching

Branch workflow based on query results.

```yaml
+check:
  td>: queries/check_data_quality.sql
  store_last_results: true
  database: analytics

+branch:
  if>: ${td.last_results.is_valid}
  _do:
    +publish:
      td>: queries/publish.sql
      insert_into: public_table
  _else_do:
    +alert:
      http>: https://hooks.slack.com/services/xxx
      method: POST
      content:
        text: "Data quality check failed for ${session_date}"
    +stop:
      fail>: "Data quality validation failed"
```

`queries/check_data_quality.sql`:
```sql
SELECT
  COUNT(*) > 0 AS is_valid,
  COUNT(*) AS row_count
FROM daily_summary
WHERE TD_TIME_RANGE(time, '${session_date}', '${next_session_date}')
  AND revenue >= 0
```

---

## 5. Parallel Processing by Dimension

Process multiple segments in parallel.

```yaml
+aggregate_by_region:
  for_each>:
    region: [us, eu, ap, other]
  _parallel: true
  _do:
    +aggregate:
      td>: queries/aggregate_region.sql
      insert_into: regional_summary
```

`queries/aggregate_region.sql`:
```sql
SELECT
  '${region}' AS region,
  COUNT(*) AS event_count,
  SUM(revenue) AS total_revenue
FROM events
WHERE TD_TIME_RANGE(time, '${session_date}', '${next_session_date}')
  AND region = '${region}'
```

---

## 6. Dynamic Iteration with td_for_each>

Query-driven loop: iterate over results of a query.

```yaml
+list_active_clients:
  td_for_each>: queries/active_clients.sql
  database: crm
  _do:
    +process_client:
      td>: queries/client_report.sql
      create_table: report_${td.each.client_id}
  _parallel:
    limit: 5
```

`queries/active_clients.sql`:
```sql
SELECT DISTINCT client_id
FROM contracts
WHERE status = 'active'
```

---

## 7. Backfill with loop>

Reprocess past N days.

```yaml
+backfill:
  loop>: 30
  _do:
    +process_day:
      td>: queries/daily_etl.sql
      insert_into: daily_metrics
      _export:
        target_date: ${moment(session_time).subtract(i, 'days').format("YYYY-MM-DD")}
        target_date_next: ${moment(session_time).subtract(i - 1, 'days').format("YYYY-MM-DD")}
```

`queries/daily_etl.sql`:
```sql
SELECT
  '${target_date}' AS dt,
  COUNT(*) AS cnt
FROM events
WHERE TD_TIME_RANGE(time, '${target_date}', '${target_date_next}')
```

---

## 8. Multi-Step ETL with Error Notification

Full pipeline with retry and Slack alert on failure.

```yaml
timezone: Asia/Tokyo

schedule:
  daily>: "02:00:00"

_export:
  td:
    database: warehouse
    engine: presto

_error:
  http>: https://hooks.slack.com/services/xxx
  method: POST
  content:
    text: ":rotating_light: Workflow `warehouse_etl` failed at ${moment().utc().format('YYYY-MM-DD HH:mm')} UTC"

+wait:
  td_wait_table>: raw_events
  database: ingestion
  rows: 100
  interval: 120

+extract:
  _retry: 3
  td>: queries/extract.sql
  create_table: stg_events

+transform:
  _parallel: true

  +user_metrics:
    td>: queries/user_metrics.sql
    create_table: stg_user_metrics

  +revenue_metrics:
    td>: queries/revenue_metrics.sql
    create_table: stg_revenue_metrics

+load:
  +insert_users:
    td>: queries/load_users.sql
    insert_into: dim_users

  +insert_revenue:
    td>: queries/load_revenue.sql
    insert_into: fact_revenue

+notify_success:
  http>: https://hooks.slack.com/services/xxx
  method: POST
  content:
    text: ":white_check_mark: `warehouse_etl` completed for ${session_date}"
```

---

## 9. py> with Custom Script Integration

Use `py>` for logic that SQL and `http>` cannot handle — external API calls with complex auth, HTML scraping, data transformation, writing to TD tables, etc.

Note: third-party packages (e.g., `httpx`, `pytd`, `pandas`) are not pre-installed in the Custom Script Docker image. Place `requirements.txt` at the project root and install at runtime inside `run()` before importing. See [py-operator.md](py-operator.md) for the full pattern.

```yaml
+fetch_external:
  py>: tasks.ExternalFetcher.run
  docker:
    image: "treasuredata/customscript-python:3.12.11-td1"
  _env:
    TD_API_KEY: ${secret:td.apikey}
    API_TOKEN: ${secret:external.api_token}

+process_results:
  if>: ${fetch_success}
  _do:
    +aggregate:
      td>: queries/aggregate_fetched.sql
      create_table: external_summary
```

`tasks/__init__.py`:
```python
import digdag
import json
import os
import urllib.request

class ExternalFetcher:
    def run(self):
        req = urllib.request.Request(
            "https://api.example.com/data",
            headers={"Authorization": f"Bearer {os.environ['API_TOKEN']}"},
        )
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = json.loads(resp.read().decode("utf-8"))

        # Write to TD table
        import pytd
        client = pytd.Client(apikey=os.environ["TD_API_KEY"], database="raw_data")
        import pandas as pd
        df = pd.DataFrame(data)
        client.load_table_from_dataframe(df, "external_events", if_exists="append")

        # Pass status to next task
        digdag.env.store({"fetch_success": True, "row_count": len(data)})
```

---

## 10. Modular Workflow with call>

Split complex workflows into reusable sub-workflows.

```yaml
# main.dig
timezone: Asia/Tokyo

schedule:
  daily>: "06:00:00"

_export:
  td:
    database: analytics
    engine: presto

+ingest:
  call>: sub/ingest.dig

+transform:
  call>: sub/transform.dig

+publish:
  call>: sub/publish.dig
```

```yaml
# sub/ingest.dig
+wait:
  td_wait_table>: raw_events
  database: ingestion
  rows: 1

+load:
  td>: ../queries/ingest.sql
  create_table: staging
```

Note: called workflows use their subdirectory as working directory — use `../` to reference files in the parent.

---

## 11. Scheduled Report with Email

Generate and email a report.

```yaml
schedule:
  weekly>: Mon,08:00:00

_export:
  td:
    database: analytics
    engine: presto

+generate_report:
  td>: queries/weekly_summary.sql
  store_last_results: true

+send_report:
  mail>: templates/weekly_report.txt
  subject: "Weekly Report: ${last_session_date} - ${session_date}"
  to: [team@example.com]
  html: true
```

---

## 12. SLA Monitoring

Alert if workflow exceeds expected duration.

```yaml
schedule:
  daily>: "03:00:00"

sla:
  duration: 02:00:00
  +sla_alert:
    http>: https://hooks.slack.com/services/xxx
    method: POST
    content:
      text: ":warning: Workflow exceeded 2h SLA for ${session_date}"
```

---

## 13. Workflow Registry: TTL Review

Detect workflows past their TTL and notify owners.

```yaml
# ttl_review.dig
timezone: Asia/Tokyo

schedule:
  weekly>: Mon,10:00:00

_export:
  td:
    database: tdx_workflow_registry
    engine: presto

+find_expired:
  td>: queries/expired_workflows.sql
  store_last_results: true

+notify_if_expired:
  if>: ${td.last_results.expired_count > 0}
  _do:
    +alert:
      http>: ${secret:slack.webhook}
      method: POST
      content:
        text: ":hourglass: ${td.last_results.expired_count} workflow(s) past TTL need review. Run: SELECT * FROM tdx_workflow_registry.manifests WHERE status = 'review'"

    +mark_review:
      td>: queries/mark_review.sql
```

`queries/expired_workflows.sql`:
```sql
SELECT COUNT(*) AS expired_count
FROM manifests
WHERE status = 'active'
  AND ttl != 'permanent'
  AND DATE_ADD('day',
    CAST(REGEXP_EXTRACT(ttl, '(\d+)') AS INTEGER),
    DATE_PARSE(created, '%Y-%m-%d')
  ) < CURRENT_DATE
```

`queries/mark_review.sql`:
```sql
-- Update expired workflows to 'review' status
-- Note: Presto on TD does not support UPDATE, so use DELETE + INSERT pattern
-- This is handled via py> in production; shown here as logic reference
```

---

## 14. Workflow Registry: Duplicate Detection

Find multiple workflows writing to the same table.

```yaml
+check_duplicates:
  td>: queries/duplicate_writes.sql
  database: tdx_workflow_registry
  store_last_results: true

+alert_duplicates:
  if>: ${td.last_results.dup_count > 0}
  _do:
    +warn:
      http>: ${secret:slack.webhook}
      method: POST
      content:
        text: ":warning: ${td.last_results.dup_count} table(s) have multiple active workflows writing to them"
```

`queries/duplicate_writes.sql`:
```sql
WITH expanded AS (
  SELECT
    name,
    project,
    owner,
    CAST(json_parse(writes) AS ARRAY(VARCHAR)) AS write_tables
  FROM manifests
  WHERE status = 'active'
),
flattened AS (
  SELECT name, project, owner, t AS target_table
  FROM expanded
  CROSS JOIN UNNEST(write_tables) AS x(t)
)
SELECT
  COUNT(DISTINCT target_table) AS dup_count
FROM (
  SELECT target_table
  FROM flattened
  GROUP BY target_table
  HAVING COUNT(*) > 1
)
```

---

## 15. Workflow Registry: Pre-deploy Check

Before creating a new workflow, check if a similar one already exists.

```yaml
+check_existing:
  td>: queries/check_existing.sql
  database: tdx_workflow_registry
  store_last_results: true

+guard:
  if>: ${td.last_results.exists}
  _do:
    +abort:
      fail>: "A workflow writing to the same table already exists: ${td.last_results.existing_name}"
  _else_do:
    +proceed:
      call>: sub/main_pipeline.dig
```

`queries/check_existing.sql`:
```sql
SELECT
  COUNT(*) > 0 AS exists,
  COALESCE(ELEMENT_AT(ARRAY_AGG(name), 1), '') AS existing_name
FROM manifests
WHERE status = 'active'
  AND writes LIKE '%analytics.dim_revenue%'
  AND name != 'daily_revenue_etl'
```

---

## 16. Call LLM Agent via http>

Call the TD LLM Proxy (Anthropic Messages API-compatible) directly from a digdag task. No Python required. `http>` completes in ~2 seconds vs ~60 seconds for `py>` (Docker startup), so prefer this approach for agent tasks.

The `${secret:...}` syntax works in `http>` headers — verified on TD production. The response is stored in `${http.last_content}` as a JSON string when `store_content: true`.

```yaml
_export:
  llm_endpoint: https://llm-proxy.us01.treasuredata.com/v1/messages

+ask_agent:
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
        content: "Summarize the key trends from today's sales data"
  content_format: json
  store_content: true

# Response is available as ${http.last_content} in subsequent tasks
+log:
  echo>: "Agent response: ${http.last_content}"
```

Set the secret: `tdx wf secrets set test-agent-workflow "td.apikey=YOUR_KEY"`

---

## 17. LLM Agent with Query Results as Context

Feed SQL query results into an LLM agent for analysis. Run a query first, store results, then pass them as context to the agent.

```yaml
+gather_data:
  td>: queries/daily_summary.sql
  store_last_results: true
  database: analytics

+analyze_with_agent:
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

## 18. LLM Agent with Conditional Action

Ask the agent a yes/no question and branch the workflow based on its answer. Use `py>` to parse the agent response into a boolean.

```yaml
+gather_metrics:
  td>: queries/data_quality_metrics.sql
  store_last_results: true
  database: analytics

+ask_agent:
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
      http>: ${secret:slack.webhook}
      method: POST
      content:
        text: ":warning: Agent flagged data quality issue for ${session_date}"
```

`tasks/__init__.py`:
```python
import digdag
import json


class ResponseParser:
    def parse_yes_no(self):
        # store_content puts the response body into params
        response = digdag.env.params.get("http", {}).get("last_content", "{}")
        body = json.loads(response) if isinstance(response, str) else response
        text = body.get("content", [{}])[0].get("text", "").strip().lower()
        approved = text.startswith("yes")
        digdag.env.store({"agent_approved": approved})
```

---

## 19. LLM Agent for Slack Notification Drafting

Have the agent draft a human-readable summary, then post it to Slack.

```yaml
+gather:
  td>: queries/weekly_stats.sql
  store_last_results: true
  database: analytics

+draft_summary:
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
        content: "Write a concise Slack message (use markdown, under 500 chars) summarizing: revenue=${td.last_results.revenue}, WoW_change=${td.last_results.wow_pct}%, top_product=${td.last_results.top_product}, active_users=${td.last_results.active_users}."
  content_format: json
  store_content: true

+extract_text:
  py>: tasks.SlackFormatter.extract
  docker:
    image: "treasuredata/customscript-python:3.12.11-td1"

+post_to_slack:
  http>: ${secret:slack.webhook}
  method: POST
  content:
    text: ${agent_message}
  content_format: json
```

`tasks/__init__.py`:
```python
import digdag
import json


class SlackFormatter:
    def extract(self):
        response = digdag.env.params.get("http", {}).get("last_content", "{}")
        body = json.loads(response) if isinstance(response, str) else response
        text = body.get("content", [{}])[0].get("text", "")
        digdag.env.store({"agent_message": text})
```
