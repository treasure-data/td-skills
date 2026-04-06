---
name: workflow-operators
description: Operator reference for Treasure Workflow. Use when looking up operator syntax, parameters, secrets, or available operators.
---

# Workflow Operators

For .dig syntax and operational patterns, see **treasure-workflow**.

This skill lists required parameters and secrets for each operator. For optional parameters, fetch the operator's documentation: `https://docs.treasuredata.com/products/customer-data-platform/data-workbench/workflows/operators/{operator_name}`.

## Treasure Data Operators

### td> — Run Queries

```yaml
+query:
  td>: queries/analysis.sql
  database: analytics
  engine: presto
  create_table: results
```

Inline SQL:

```yaml
+inline:
  td>:
    query: |
      select count(*) from my_table
      where td_time_range(time, '${session_date}', td_time_add('${session_date}', '1d'))
```

Note: `job_retry` is a server-side retry of the query job. Unlike `_retry`, it does not re-execute the entire task.

Output: `${td.last_job_id}`, `${td.last_results}`, `${td.last_job.num_records}`

### td_run> — Run Saved Queries

```yaml
+run_saved:
  td_run>: my_saved_query
  database: analytics
```

### td_ddl> — Table/Database Operations

```yaml
+setup:
  td_ddl>:
  create_tables: [staging_a, staging_b]
  database: my_database
```

Operations: `create_tables`, `drop_tables`, `empty_tables`, `rename_tables`, `create_databases`, `drop_databases`, `empty_databases`

### td_load> — Bulk Loading

```yaml
+load:
  td_load>: config/load.yml
  database: my_database
  table: raw_events
```

Secrets: `td.apikey`

### td_for_each> — Iterate with Query Results

```yaml
+for_each_db:
  td_for_each>: queries/list_targets.sql
  _do:
    +process:
      td>: queries/process_target.sql
```

Access columns via `${td.each.COLUMN_NAME}` in subtasks. Use `_parallel: true` to run iterations concurrently.

### td_wait> — Wait for Query Condition

Polls a query until it returns true.

```yaml
+wait_for_data:
  td_wait>: queries/check_data.sql
  database: analytics
  engine: presto
```

### td_wait_table> — Wait for Table Rows

```yaml
+wait_for_table:
  td_wait_table>: source_table
  database: analytics
  engine: presto
```

Note: does **not** support `wait_timeout` — polls indefinitely.

### td_table_export> — Export Table to S3

```yaml
+export:
  td_table_export>: my_database.my_table
  file_format: jsonl.gz
  from: "2024-01-01 00:00:00 +0900"
  to: "2024-01-02 00:00:00 +0900"
  s3_bucket: my-bucket
  s3_path_prefix: exports/
```

Secrets: `td.apikey`, `aws.s3.access_key_id`, `aws.s3.secret_access_key`

### td_result_export> — Export Query Results

```yaml
+export_results:
  td_result_export>: 12345
  result_connection: my_s3_connection
  result_settings:
    bucket: my-bucket
    path: /output/
```

Required: `result_connection`, `result_settings`

Secrets: `td.apikey`

## Network Operators

### http> — HTTP Requests

```yaml
+webhook:
  http>: ${secret:webhook_url}
  method: POST
  content:
    text: "Workflow completed: ${session_id}"
```

Note: `retry` defaults to true for GET/HEAD, false for others. Status `408` and `429` are always retried. Use `store_content: true` to access the response via `${http.last_content}`.

### http_call> — Dynamic Subtasks from HTTP

Fetches a URL returning YAML/JSON and uses the response as subtask definitions.

```yaml
+dynamic:
  http_call>: https://api.example.com/workflow-tasks
```

### mail> — Send Email

```yaml
+notify:
  mail>: body.txt
  subject: Daily Report
  to: [team@example.com]
```

Inline body:

```yaml
+notify_inline:
  mail>:
    data: "Report ready for ${session_date}"
  subject: Daily Report
  to: [team@example.com]
```

Required: `subject`, `to`

Secrets: `mail.host`, `mail.port`, `mail.username`, `mail.password`

## Control Operators

### if> — Conditional Execution

```yaml
+if_data:
  if>: ${td.last_results.cnt > 0}
  _do:
    +process:
      td>: queries/process.sql
```

### fail> — Stop Workflow with Error

```yaml
+stop:
  fail>: "Error message"
```

For data quality check patterns combining `if>` + `fail>`, see **treasure-workflow**.

### for_each> — Iterate Over Values

```yaml
+loop:
  for_each>:
    region: [US, EU, ASIA]
  _do:
    +process:
      td>: queries/by_region.sql
```

### loop> — Repeat N Times

```yaml
+repeat:
  loop>: 3
  _do:
    +step:
      echo>: "iteration ${i}"
```

### for_range> — Iterate Over Numeric Range

```yaml
+batch:
  for_range>:
    from: 0
    to: 10
    step: 2
  _do:
    +process:
      echo>: "range ${range.from} to ${range.to}"
```

Access `${range.from}`, `${range.to}`, `${range.index}` in subtasks.

### call> — Call Another Workflow

```yaml
+sub:
  call>: sub_workflow.dig
```

### require> — Depend on Another Workflow

Ensures the target workflow's session succeeds before continuing.

```yaml
+depend:
  require>: another_workflow
```

For cross-project patterns (`rerun_on`, `project_name`), see **treasure-workflow**.

### wait> — Wait for Duration

```yaml
+pause:
  wait>: 300
```

Value in seconds.

### echo> — Show Message

```yaml
+log:
  echo>: "Processing ${session_date}"
```

## Cloud Storage Operators

### s3_wait> — Wait for S3 File

```yaml
+wait_s3:
  s3_wait>: my-bucket/data/${session_date}/export.csv.gz
```

Polls with exponential backoff (5s → max 5min). Output: `${s3.last_object}`.

Secrets: `aws.s3.access_key_id`, `aws.s3.secret_access_key`

### s3_copy> / s3_delete> / s3_move>

```yaml
+copy:
  s3_copy>:
  source: source-bucket/path/
  destination: dest-bucket/path/
  recursive: true

+delete:
  s3_delete>: my-bucket/temp/
  recursive: true

+move:
  s3_move>:
  source: source-bucket/old/
  destination: dest-bucket/new/
```

Required: `s3_copy>`, `s3_move>` require `source`, `destination`. `s3_delete>` takes bucket/key directly.

**s3_move> is not atomic** — copies then deletes. Cannot move/copy a folder into itself.

Secrets: `aws.s3.access_key_id`, `aws.s3.secret_access_key`. Also supports `credential_provider: assume_role`.

### gcs_wait> — Wait for GCS File

```yaml
+wait_gcs:
  gcs_wait>: my-bucket/data/${session_date}/export.csv.gz
```

Secrets: `gcp.credential`

### bq> — BigQuery Queries

```yaml
+query:
  bq>: queries/analysis.sql
  destination_table: my_dataset.results
```

Secrets: `gcp.credential`

### bq_ddl> — BigQuery Dataset/Table Management

Operations: `create_datasets`, `delete_datasets`, `empty_datasets`, `create_tables`, `delete_tables`, `empty_tables`

Secrets: `gcp.credential`

### bq_load> / bq_extract> — BigQuery Import/Export

`bq_load>`: import GCS → BQ. Required: GCS URI, `destination_table`.

`bq_extract>`: export BQ → GCS. Required: BQ table, `destination` (GCS URI).

Secrets: `gcp.credential`

## Database Operators

### pg> — PostgreSQL

```yaml
+pg_query:
  pg>: queries/update.sql
  host: db.example.com
  user: myuser
  database: mydb
```

Required: `host`, `user`, `database`

Secrets: `pg.password`

Note: `strict_transaction` (default: true) uses a `__digdag_status` table for idempotency — set to `false` if CREATE TABLE is not allowed.

### snowflake> — Snowflake

```yaml
+sf_query:
  snowflake>: queries/transform.sql
  account_identifier: MYORG-MYACCOUNT
  user: myuser
  database: MY_DB
  schema: PUBLIC
  warehouse: COMPUTE_WH
```

Required: `account_identifier`, `user`

Secrets: `key_pair` auth (default) requires `snowflake.private_key`. `programmatic_access_token` auth requires `snowflake.programmatic_access_token`.

Note: supports multi-statement SQL separated by `;`.

### databricks> — Databricks

```yaml
+db_query:
  databricks>: queries/analysis.sql
  host: my-workspace.cloud.databricks.com
  warehouse_id: abc123def456
```

Required: `host` (without `https://`), `warehouse_id`

Secrets: `pat` auth (default) requires `databricks.pat`. `oauth` auth requires `databricks.client_id`, `databricks.client_secret`.

Note: does **not** support multiple statements in a single task.

### redshift> — Redshift Queries

```yaml
+rs_query:
  redshift>: queries/query.sql
  host: my-cluster.redshift.amazonaws.com
  user: myuser
  database: mydb
```

Required: `host`, `user`, `database`

Secrets: `aws.redshift.password`

### redshift_load> — Load S3 into Redshift

Required: `host`, `user`, `database`, `table`, `from` (S3 URI)

Secrets: `aws.redshift.password`, `aws.redshift_load.access_key_id`, `aws.redshift_load.secret_access_key`

### redshift_unload> — Unload Redshift to S3

Required: `host`, `user`, `database`, `query`, `to` (S3 URI)

Secrets: `aws.redshift.password`, `aws.redshift_unload.access_key_id`, `aws.redshift_unload.secret_access_key`

## Scripting Operators

### py> — Python Scripts

Runs Python in an isolated Docker container. A `docker.image` is required:

```yaml
_export:
  docker:
    image: "treasuredata/customscript-python:3.12.11-td1"

+run_script:
  py>: scripts.process.main
  param1: value1
  _env:
    TD_API_KEY: ${secret:td.apikey}
```

- Arguments are passed as method parameters
- Use `_env` to pass secrets as environment variables (`${secret:...}` does not work as direct arguments)
- Install custom packages in script: `os.system(f"{sys.executable} -m pip install package==1.0.0")`
- S3 file transfer: `s3_get` (download before execution), `s3_put` (upload after execution)

## Secrets Reference

`${secret:key}` is only expanded in specific operator fields. Some operators also read named secrets automatically without `${secret:key}` syntax.

| Operator | `${secret:key}` expanded in | Auto-resolved named secrets |
|---|---|---|
| `http>` | URI, headers, content | `http.authorization` (→ Authorization header), `http.user`, `http.password`, `http.uri` |
| `td>` | `result_url`, `result_settings` | `td.apikey` |
| `td_load>` | bulk load config | `td.apikey` |
| `td_result_export>` | `result_settings` | `td.apikey` |
| `td_table_export>` | — | `td.apikey`, `aws.s3.access_key_id`, `aws.s3.secret_access_key` |
| `mail>` | — | `mail.host`, `mail.port`, `mail.username`, `mail.password` |
| `s3_wait>`, `s3_copy>`, etc. | — | `aws.s3.access_key_id`, `aws.s3.secret_access_key` |
| `gcs_wait>` | — | `gcp.credential` |
| `py>` | **Not supported** | — (use `_env` instead) |

## Resources

- https://docs.treasuredata.com/products/customer-data-platform/data-workbench/workflows/operators
- https://docs.treasuredata.com/products/customer-data-platform/data-workbench/workflows/customscript
