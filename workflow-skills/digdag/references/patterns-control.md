# Control Flow Patterns

Conditional branching, multi-step ETL with error notification, scheduled reports, and SLA monitoring.

---

## Conditional Branching

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

## Multi-Step ETL with Error Notification

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

## Scheduled Report with Email

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

## SLA Monitoring

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
