# ETL Patterns

Data pipeline patterns: extract-transform-load, idempotent writes, wait-then-process, parallel processing, backfill, modular workflows, and py> integration.

---

## Basic ETL Pipeline

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

## Idempotent Write (DELETE + INSERT)

**Do not combine DELETE and INSERT in a single `td>` job** — a single job does not guarantee transactions. If DELETE succeeds but INSERT fails, data is lost. Always split into separate tasks.

Group-level `_retry` ensures INSERT failure triggers re-execution from DELETE:

```yaml
+refresh_daily:
  _retry: 3

  +delete_records:
    td>:
      query: |
        delete from target
        where date = '${session_date}'
    database: my_database

  +insert_records:
    td>: queries/insert_session.sql
    insert_into: target
    database: my_database
```

For full table replacement, `create_table:` atomically replaces the entire table:

```yaml
+rebuild:
  td>: queries/full_rebuild.sql
  create_table: target
```

---

## Wait-Then-Process

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

For external systems, use `http>` with an API that returns `408` or `429` until conditions are met — `http>` retries on these status codes automatically (up to the 24h task limit).

**Do not use `loop>` for polling** — it creates a task per iteration and can hit the 1,000 task limit.

---

## Parallel Processing by Dimension

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

## Dynamic Iteration with td_for_each>

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

## Backfill with loop>

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

## py> with Custom Script Integration

Use `py>` for logic that SQL and `http>` cannot handle. See [py-operator.md](py-operator.md) for the full reference.

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

## Modular Workflow with call>

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
