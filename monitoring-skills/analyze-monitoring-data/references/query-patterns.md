# Common Query Patterns

All examples use `<db>` as a placeholder for the resolved database name (e.g. `basic_monitoring_demo`). Always substitute the actual database name — never use bare table names.

## basic_monitoring — Job Health

**Job status breakdown:**
```sql
SELECT status, type, COUNT(*) AS cnt,
  ROUND(AVG(duration), 1) AS avg_sec
FROM <db>.jobs
GROUP BY status, type
ORDER BY cnt DESC
```

**Failed jobs (recent):**
```sql
SELECT job_id, user_name, database, type, duration,
  created_at, query
FROM <db>.jobs
WHERE status = 'error'
ORDER BY created_at DESC
LIMIT 50
```

**Top users by job count:**
```sql
SELECT user_name, COUNT(*) AS total_jobs,
  SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) AS errors,
  ROUND(AVG(duration), 1) AS avg_sec
FROM <db>.jobs
GROUP BY user_name
ORDER BY total_jobs DESC
LIMIT 20
```

**Slowest jobs:**
```sql
SELECT job_id, user_name, type, database,
  ROUND(duration, 0) AS duration_sec, status, created_at
FROM <db>.jobs
ORDER BY duration DESC
LIMIT 20
```

**Schedules with result destinations:**
```sql
SELECT name, cron, timezone, type, database, user_name, next_time,
  JSON_EXTRACT_SCALAR(result, '$.type') AS result_destination
FROM <db>.schedules
WHERE cron IS NOT NULL AND cron != ''
ORDER BY name
```

**User permission map (user → policies):**
```sql
SELECT u.email, u.name, u.administrator,
  JSON_EXTRACT_SCALAR(uap.assign_policy, '$.permissions') AS permissions
FROM <db>.users u
JOIN <db>.user_assign_policies uap ON u.id = uap.id
ORDER BY u.email
```

**Policy membership (who's in each policy):**
```sql
SELECT p.name AS policy_name, p.user_count,
  pau.assign_users
FROM <db>.policies p
JOIN <db>.policies_assign_users pau ON p.id = pau.id
ORDER BY p.user_count DESC
```

**Job cost & retry analysis (cpu_time, retry_limit):**
```sql
SELECT user_name, type,
  COUNT(*) AS job_count,
  ROUND(SUM(CAST(cpu_time AS DOUBLE)), 1) AS total_cpu_time,
  ROUND(AVG(CAST(cpu_time AS DOUBLE)), 1) AS avg_cpu_time,
  SUM(CASE WHEN retry_limit > 0 THEN 1 ELSE 0 END) AS jobs_with_retries_enabled
FROM <db>.jobs
GROUP BY user_name, type
ORDER BY total_cpu_time DESC
LIMIT 20
```

---

## cdp_monitoring — Segments & Journeys

**Top parent segments by population:**
```sql
SELECT
  JSON_EXTRACT_SCALAR(attributes, '$.name') AS name,
  CAST(JSON_EXTRACT_SCALAR(attributes, '$.population') AS BIGINT) AS population,
  JSON_EXTRACT_SCALAR(attributes, '$.scheduleType') AS schedule_type,
  JSON_EXTRACT_SCALAR(attributes, '$.updatedAt') AS updated_at
FROM <db>.parent_segments
ORDER BY population DESC
LIMIT 20
```

**Schedule type breakdown with population totals:**
```sql
SELECT
  JSON_EXTRACT_SCALAR(attributes, '$.scheduleType') AS schedule_type,
  COUNT(*) AS cnt,
  SUM(CAST(JSON_EXTRACT_SCALAR(attributes, '$.population') AS BIGINT)) AS total_population,
  ROUND(AVG(CAST(JSON_EXTRACT_SCALAR(attributes, '$.population') AS DOUBLE)), 0) AS avg_population
FROM <db>.parent_segments
GROUP BY JSON_EXTRACT_SCALAR(attributes, '$.scheduleType')
ORDER BY cnt DESC
```

**Journey state summary:**
```sql
SELECT
  JSON_EXTRACT_SCALAR(attributes, '$.state') AS state,
  COUNT(*) AS cnt
FROM <db>.journey_summary
GROUP BY JSON_EXTRACT_SCALAR(attributes, '$.state')
ORDER BY cnt DESC
```

**Active journeys with audience sizes and goal tracking:**
```sql
SELECT
  js.journey_id,
  JSON_EXTRACT_SCALAR(js.attributes, '$.name') AS journey_name,
  CAST(JSON_EXTRACT_SCALAR(stat.attributes, '$.size') AS BIGINT) AS audience_size,
  CAST(JSON_EXTRACT_SCALAR(stat.attributes, '$.enteredSize') AS BIGINT) AS entered_size,
  CAST(JSON_EXTRACT_SCALAR(stat.attributes, '$.goalSize') AS BIGINT) AS goal_size,
  ROUND(CAST(JSON_EXTRACT_SCALAR(stat.attributes, '$.completionRate') AS DOUBLE) * 100, 1) AS completion_pct
FROM <db>.journey_summary js
JOIN <db>.journey_statistics stat ON js.journey_id = stat.journey_id
WHERE JSON_EXTRACT_SCALAR(js.attributes, '$.state') = 'launched'
ORDER BY audience_size DESC
LIMIT 20
```

**Activation health per parent segment:**
```sql
SELECT
  ps_id AS parent_segment_id,
  COUNT(*) AS activation_count,
  SUM(CASE WHEN valid = 'true' THEN 1 ELSE 0 END) AS valid_count,
  SUM(CASE WHEN valid = 'false' THEN 1 ELSE 0 END) AS invalid_count,
  COUNT(DISTINCT connectionid) AS unique_connections,
  COUNT(DISTINCT scheduletype) AS schedule_types
FROM <db>.activations
GROUP BY ps_id
ORDER BY activation_count DESC
LIMIT 20
```

**Activated columns per activation (audit which fields get exported):**
```sql
SELECT
  a.id AS activation_id,
  a.name AS activation_name,
  a.connectionid,
  JSON_EXTRACT_SCALAR(col, '$.column') AS activated_column
FROM <db>.activations a
CROSS JOIN UNNEST(CAST(JSON_PARSE(a.columns) AS ARRAY(JSON))) AS t(col)
ORDER BY a.id
```

**Recent activation execution failures (per-run detail, not just current `valid` state):**
```sql
SELECT
  a.id AS activation_id,
  a.name AS activation_name,
  a.ps_id AS parent_segment_id,
  JSON_EXTRACT_SCALAR(e, '$.status') AS status,
  JSON_EXTRACT_SCALAR(e, '$.errorMessage') AS error_message,
  JSON_EXTRACT_SCALAR(e, '$.workflowId') AS workflow_id
FROM <db>.activations a
CROSS JOIN UNNEST(CAST(JSON_PARSE(a.executions) AS ARRAY(JSON))) AS t(e)
WHERE a.executions != '[]' AND a.executions IS NOT NULL
  AND JSON_EXTRACT_SCALAR(e, '$.status') = 'error'
ORDER BY a.id
LIMIT 20
```
`activations.executions` is the only reliable source for execution-level status/errors — don't rely on `journey_activation.attributes` (`$.runStatus`, `$.syndicationId`, etc.) for this, since those fields are frequently null. See `references/schema.md` for the full column reference.

---

## workflow_monitoring — Errors & Performance

**Projects with most failures:**
```sql
SELECT
  JSON_EXTRACT_SCALAR(project, '$.name') AS project_name,
  COUNT(*) AS total,
  SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) AS errors,
  ROUND(100.0 * SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) / COUNT(*), 1) AS success_rate_pct
FROM <db>.attempts
GROUP BY JSON_EXTRACT_SCALAR(project, '$.name')
ORDER BY errors DESC
LIMIT 20
```

**Recent failed attempts:**
```sql
SELECT
  JSON_EXTRACT_SCALAR(project, '$.name') AS project_name,
  JSON_EXTRACT_SCALAR(workflow, '$.name') AS workflow_name,
  status, createdat, finishedat,
  date_diff('second',
    date_parse(createdat, '%Y-%m-%dT%H:%i:%SZ'),
    date_parse(finishedat, '%Y-%m-%dT%H:%i:%SZ')
  ) AS duration_sec
FROM <db>.attempts
WHERE status = 'error'
ORDER BY createdat DESC
LIMIT 50
```

**Workflow success rates:**
```sql
SELECT
  JSON_EXTRACT_SCALAR(workflow, '$.name') AS workflow_name,
  COUNT(*) AS total_runs,
  SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) AS successes,
  SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) AS failures
FROM <db>.attempts
GROUP BY JSON_EXTRACT_SCALAR(workflow, '$.name')
ORDER BY failures DESC
LIMIT 20
```

**Upcoming scheduled runs:**
```sql
SELECT
  JSON_EXTRACT_SCALAR(project, '$.name') AS project_name,
  JSON_EXTRACT_SCALAR(workflow, '$.name') AS workflow_name,
  nextruntime, nextscheduletime
FROM <db>.schedules
WHERE disabledat IS NULL OR disabledat = ''
ORDER BY nextruntime ASC
LIMIT 30
```

**Disabled workflows:**
```sql
SELECT
  JSON_EXTRACT_SCALAR(project, '$.name') AS project_name,
  JSON_EXTRACT_SCALAR(workflow, '$.name') AS workflow_name,
  disabledat
FROM <db>.schedules
WHERE disabledat IS NOT NULL AND disabledat != ''
ORDER BY disabledat DESC
```

**Recent session last-attempt status:**
```sql
SELECT
  JSON_EXTRACT_SCALAR(project, '$.name') AS project_name,
  JSON_EXTRACT_SCALAR(workflow, '$.name') AS workflow_name,
  sessiontime,
  JSON_EXTRACT_SCALAR(lastattempt, '$.done') AS done,
  JSON_EXTRACT_SCALAR(lastattempt, '$.success') AS success,
  JSON_EXTRACT_SCALAR(lastattempt, '$.retryAttemptName') AS retry_name
FROM <db>.sessions
ORDER BY sessiontime DESC
LIMIT 50
```

**Pool-level attempt health (poolid):**
```sql
SELECT
  poolid,
  COUNT(*) AS total_attempts,
  SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) AS errors,
  ROUND(100.0 * SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) / COUNT(*), 1) AS success_rate_pct,
  ROUND(AVG(date_diff('second',
    date_parse(createdat, '%Y-%m-%dT%H:%i:%SZ'),
    date_parse(finishedat, '%Y-%m-%dT%H:%i:%SZ')
  )), 1) AS avg_duration_sec
FROM <db>.attempts
GROUP BY poolid
ORDER BY errors DESC
```

---

## insights_monitoring — Data Model Health

**All models with status:**
```sql
SELECT name, status, type,
  last_built, last_updated,
  ROUND(storage_size / 1024 / 1024, 2) AS size_mb
FROM <db>.datamodels
ORDER BY last_built DESC
```

**Failed models:**
```sql
SELECT name, status, last_built, last_updated, description
FROM <db>.datamodels
WHERE status = 'failed'
ORDER BY last_built DESC
```
