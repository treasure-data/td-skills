# Workflow Registry Patterns

Governance patterns using the `tdx_workflow_registry` database: TTL review, duplicate detection, and pre-deploy checks.

---

## TTL Review

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

## Duplicate Detection

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

## Pre-deploy Check

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
