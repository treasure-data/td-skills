# TD Workflow Operators Reference

Parameter reference for operators available on the TD platform. For full details on each operator, see: `https://docs.treasuredata.com/products/customer-data-platform/data-workbench/workflows/operators/{operator_name}`

## Control Operators

### call>: Call Another Workflow

```yaml
+prepare:
  call>: sub/prepare.dig

+process:
  call>: sub/process.dig
```

Called workflow uses its subdirectory as working directory. Adjust relative file paths accordingly (e.g., `../queries/data.sql`).

### http_call>: Dynamic Subtasks from HTTP

Fetch YAML/JSON from a URL and use the response as subtask definitions. Supports the same parameters as `http>` except `store_content`. Response Content-Type must be `application/json` or `application/x-yaml` (use `content_type_override` if needed).

```yaml
+dynamic:
  http_call>: https://api.example.com/workflow-tasks
```

### require>: Depend on Another Workflow

Wait for another workflow's session to succeed before continuing.

```yaml
+wait_for_etl:
  require>: daily_etl
  project_name: data_pipeline
```

| Parameter | Default | Description |
|---|---|---|
| `require>:` | (required) | Workflow name |
| `project_name:` | — | Project name (for cross-project) |
| `project_id:` | — | Project ID (alternative to `project_name`) |
| `session_time:` | — | Override session time (ISO 8601 with timezone) |
| `rerun_on:` | none | `none`: skip if already succeeded, `failed`: re-run on failure, `all`: always re-run |
| `ignore_failure:` | false | Succeed even if dependent workflow fails |
| `retry_attempt_name:` | — | Custom attempt name (not inherited from parent) |
| `params:` | — | Parameters map to pass to the workflow |

Without `rerun_on: all`, the result of a previous run is reused. When multiple workflows `require>` the same target concurrently, one creates the attempt and others wait for it — set `retry_attempt_name` if each caller needs its own independent attempt.

### loop>: Repeat N Times

`${i}` is 0-indexed.

```yaml
+repeat:
  loop>: 7
  _do:
    +daily:
      td>: queries/daily.sql
      _export:
        d: ${moment(session_time).subtract(i, 'days').format("YYYY-MM-DD")}
```

| Parameter | Description |
|---|---|
| `loop>:` | Number of iterations |
| `_do:` | Subtasks per iteration |
| `_parallel:` | Run iterations concurrently |

### for_each>: Iterate Over Values

```yaml
+matrix:
  for_each>:
    region: [us, eu, ap]
    env: [staging, prod]
  _do:
    +run:
      echo>: "Deploy ${region} ${env}"
  _parallel: true
```

| Parameter | Description |
|---|---|
| `for_each>:` | Map of key: [values] |
| `_do:` | Subtasks per combination |
| `_parallel:` | Run iterations concurrently |

### for_range>: Iterate Over Numeric Range

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

| Parameter | Default | Description |
|---|---|---|
| `from:` | (required) | Start value |
| `to:` | (required) | End value (exclusive) |
| `step:` | 1 | Increment |
| `_do:` | (required) | Subtasks per iteration |
| `_parallel:` | false | Run iterations concurrently |

**Output variables:** `${range.from}`, `${range.to}`, `${range.index}`

### if>: Conditional Execution

```yaml
+branch:
  if>: ${td.last_results.row_count > 0}
  _do:
    +process:
      td>: queries/process.sql
  _else_do:
    +notify_empty:
      echo>: "No rows found"
```

| Parameter | Description |
|---|---|
| `if>:` | Boolean expression |
| `_do:` | Tasks when true |
| `_else_do:` | Tasks when false (optional) |

At least one of `_do` or `_else_do` is required.

### fail>: Force Failure

```yaml
+abort:
  fail>: "Data validation failed: expected > 1000 rows"
```

### echo>: Log a Message

```yaml
+log:
  echo>: "Processing ${session_date} for database ${td.each.db_name}"
```

### wait>: Wait for Duration

```yaml
+pause:
  wait>: 300
```

## Treasure Data Operators

All TD operators use **secret** `td.apikey`. If not set, TD operators fall back to the workflow owner's (last `tdx wf push` user) default key.

### td>: Run Queries

```yaml
+query:
  td>: queries/aggregate.sql
  database: analytics
  engine: presto
  create_table: result_table
```

**Query definition** (choose one):

| Parameter | Description |
|---|---|
| `td>: FILE.sql` | SQL template file (supports `${...}` variable expansion) |
| `query:` | Inline SQL template (supports `${...}`) |
| `data:` | Inline SQL string (no variable expansion) |

**Result destination** (choose one):

| Parameter | Description |
|---|---|
| `create_table: NAME` | Create new table from results (drops existing) |
| `insert_into: NAME` | Append results to table (creates if not exists) |
| `download_file: NAME` | Export results as local CSV |
| `result_url: URL` | Route results to external URL |
| `result_connection: NAME` | Write results via configured connection |
| `result_settings: MAP` | Additional settings (requires `result_connection`) |

**Result options** (can combine with above):

| Parameter | Default | Description |
|---|---|---|
| `store_last_results:` | false | Store first row to `${td.last_results}` |
| `preview:` | false | Display sample results in log |

**Execution options:**

| Parameter | Default | Description |
|---|---|---|
| `database:` | (from _export) | Target database |
| `engine:` | presto | `presto` or `hive` |
| `priority:` | 0 | -2 (very low) to 2 (very high) |
| `job_retry:` | 0 | Auto-retry count (max 10 recommended) |
| `presto_pool_name:` | — | Resource pool for Presto |
| `hive_pool_name:` | — | Resource pool for Hive |
| `engine_version:` | — | Engine version |

**Output variables:**

| Variable | Description |
|---|---|
| `${td.last_job_id}` / `${td.last_job.id}` | Job ID |
| `${td.last_results}` | First row as map (requires `store_last_results: true`) |
| `${td.last_job.num_records}` | Output record count |

### td_run>: Execute Saved Queries

```yaml
+run_saved:
  td_run>: my_saved_query
  # or by ID:
  td_run>: 12345
```

| Parameter | Default | Description |
|---|---|---|
| `td_run>:` | (required) | Saved query name or numeric ID |
| `download_file:` | — | Export results as CSV |
| `store_last_results:` | false | Store first row to `${td.last_results}` |
| `preview:` | false | Display sample results |
| `session_time:` | — | Override execution time (e.g. `2026-01-01T00:00:00+00:00`) |

**Output variables:** Same as `td>`.

### td_ddl>: Table and Database Operations

```yaml
+setup:
  td_ddl>:
  create_tables: [staging, output]
  database: analytics
```

**Table operations:**

| Parameter | Description |
|---|---|
| `create_tables: [t1, t2]` | Create tables if not exist |
| `empty_tables: [t1, t2]` | Drop and recreate tables |
| `drop_tables: [t1, t2]` | Drop tables if exist |
| `rename_tables: [{from: a, to: b}]` | Rename tables (overwrites destination) |

**Database operations:**

| Parameter | Description |
|---|---|
| `create_databases: [db1]` | Create databases if not exist |
| `empty_databases: [db1]` | Drop and recreate databases |
| `drop_databases: [db1]` | Drop databases if exist |

**Options:** `database:`, `endpoint:`, `use_ssl:`

### td_load>: Bulk Loading

```yaml
+load:
  td_load>: config/s3_import.yml
  database: raw_data
  table: events
```

| Parameter | Description |
|---|---|
| `td_load>:` | YAML config file path or connector unique ID |
| `database:` | Target database |
| `table:` | Target table |

**Output variables:** `${td.last_job_id}`, `${td.last_job.num_records}`

### td_for_each>: Query Loop

Run subtasks for each row returned by a query. Access row values via `${td.each.COLUMN_NAME}`.

```yaml
+for_each_db:
  td_for_each>: queries/list_databases.sql
  database: metadata
  _do:
    +process:
      td>: queries/process.sql
      _export:
        target_db: ${td.each.db_name}
```

| Parameter | Description |
|---|---|
| `td_for_each>:` | SQL template file (supports `${...}`) |
| `_do:` | Subtasks to run per row |
| `_parallel:` | Run iterations concurrently |
| `database:` | Target database |
| `engine:` | `presto` or `hive` |
| `priority:` | -2 to 2 |
| `job_retry:` | Auto-retry count |

**Output variables:** `${td.last_job_id}`, `${td.last_job.num_records}`

### td_wait>: Wait for Query Condition

Run a query periodically until it returns true.

```yaml
+wait_for_data:
  td_wait>: queries/check_fresh_data.sql
  database: analytics
  engine: presto
  interval: 60
```

Example SQL (`queries/check_fresh_data.sql`):
```sql
SELECT COUNT(*) > 0
FROM events
WHERE TD_TIME_RANGE(time, '${session_time}')
```

| Parameter | Default | Description |
|---|---|---|
| `td_wait>:` | (required) | SQL template file (supports `${...}`) |
| `database:` | — | Target database |
| `engine:` | — | `presto` or `hive` |
| `interval:` | 30s | Polling frequency |
| `wait_timeout:` | — | Timeout for wait (e.g., `120s`) |
| `priority:` | 0 | Job priority |
| `job_retry:` | 0 | Auto-retry |

### td_wait_table>: Wait for Table Records

Wait until a table has enough records in the session time range.

```yaml
+wait:
  td_wait_table>: incoming_events
  database: raw_data
  rows: 1
  interval: 60
```

| Parameter | Default | Description |
|---|---|---|
| `td_wait_table>:` | (required) | Table name |
| `rows:` | 0 | Minimum row count |
| `database:` | — | Target database |
| `interval:` | 30s | Polling frequency |
| `engine:` | — | `presto` or `hive` |

### td_table_export>: Export Table to S3

```yaml
+export:
  td_table_export>: my_database.my_table
  file_format: jsonl.gz
  from: "${session_date} 00:00:00 +0900"
  to: "${next_session_date} 00:00:00 +0900"
  s3_bucket: my-bucket
  s3_path_prefix: exports/
```

| Parameter | Description |
|---|---|
| `td_table_export>:` | `database.table` to export |
| `file_format:` | `tsv.gz`, `jsonl.gz`, `json.gz`, `line-json.gz` |
| `from:` | Start time (inclusive) |
| `to:` | End time (exclusive) |
| `s3_bucket:` | S3 bucket name |
| `s3_path_prefix:` | S3 key prefix |

**Output variables:** `${td.last_job_id}`, `${td.last_job.num_records}`

**Additional secrets:** `aws.s3.access_key_id`, `aws.s3.secret_access_key`

### td_result_export>: Export Query Results

Export results of a previous job via a result connection.

```yaml
+export_results:
  td_result_export>: ${td.last_job_id}
  result_connection: my_s3_connection
  result_settings:
    bucket: my-bucket
    path: /output/
```

| Parameter | Description |
|---|---|
| `td_result_export>:` | Job ID to export |
| `result_connection:` | Connection name (created in web console) |
| `result_settings:` | Additional settings map for the connection |

**Output variables:** `${td.last_job_id}`, `${td.last_job.num_records}`

## Network Operators

### mail>: Send Email

```yaml
+alert:
  mail>: templates/alert.txt
  subject: "Workflow alert: ${session_date}"
  to: [team@example.com]
  html: true
```

| Parameter | Description |
|---|---|
| `mail>:` | Body template file or `{data: "inline text"}` |
| `subject:` | Subject line |
| `to:` | Recipient list |
| `cc:`, `bcc:` | CC/BCC lists |
| `from:` | Sender address |
| `html:` | Enable HTML body (default: false) |
| `attach_files:` | File attachment list |

**Secrets:** `mail.host`, `mail.port`, `mail.username`, `mail.password`, `mail.tls`

### http>: HTTP Request

```yaml
+webhook:
  http>: https://hooks.slack.com/services/xxx
  method: POST
  content:
    text: "Workflow completed for ${session_date}"
  content_format: json
```

| Parameter | Default | Description |
|---|---|---|
| `http>:` | (required) | URL (supports `${...}`) |
| `method:` | GET | HTTP method |
| `content:` | — | Request body (string, object, array) |
| `content_format:` | — | `text`, `json`, or `form` |
| `content_type:` | — | Override Content-Type header |
| `headers:` | — | Custom header map |
| `store_content:` | false | Store response for downstream tasks |
| `timeout:` | 30 | Timeout in seconds |
| `retry:` | true (GET) | Auto-retry on failure |

**Output variables:** `${http.last_status}` (status code), `${http.last_content}` (response body, requires `store_content: true`)

**Secrets:** `http.authorization`, `http.user`, `http.password`

## Database Operators

### databricks>: Run Databricks Queries

```yaml
+db_query:
  databricks>: queries/analysis.sql
  host: my-workspace.cloud.databricks.com
  warehouse_id: abc123def456
```

| Parameter | Default | Description |
|---|---|---|
| `databricks>:` | (required) | SQL file path |
| `host:` | (required) | Workspace host (without `https://`) |
| `warehouse_id:` | (required) | SQL warehouse ID |
| `catalog:` | — | Unity Catalog name |
| `schema:` | — | Schema name |
| `store_last_results:` | false | Store first row to `${databricks.last_results}` |

Does **not** support multiple statements in a single task.

**Output variables:** `${databricks.last_statement.id}`, `${databricks.last_statement.num_records}`

**Secrets:** `pat` auth (default) requires `databricks.pat`. `oauth` auth requires `databricks.client_id`, `databricks.client_secret`.

### pg>: Run PostgreSQL Queries

```yaml
+pg_query:
  pg>: queries/update.sql
  host: db.example.com
  user: myuser
  database: mydb
```

| Parameter | Default | Description |
|---|---|---|
| `pg>:` | (required) | SQL file path |
| `host:` | (required) | PostgreSQL host |
| `user:` | (required) | User name |
| `database:` | (required) | Database name |
| `port:` | 5432 | Port number |
| `ssl:` | false | Enable SSL |
| `strict_transaction:` | true | Use `__digdag_status` table for idempotency |
| `store_last_results:` | false | Store first row to `${pg.last_results}` |

Set `strict_transaction: false` if CREATE TABLE is not allowed.

**Secrets:** `pg.password`

### snowflake>: Run Snowflake Queries

```yaml
+sf_query:
  snowflake>: queries/transform.sql
  account_identifier: MYORG-MYACCOUNT
  user: myuser
  database: MY_DB
  schema: PUBLIC
  warehouse: COMPUTE_WH
```

| Parameter | Default | Description |
|---|---|---|
| `snowflake>:` | (required) | SQL file path |
| `account_identifier:` | (required) | Snowflake account (MYORG-MYACCOUNT) |
| `user:` | (required) | User name |
| `database:` | — | Database name |
| `schema:` | — | Schema name |
| `warehouse:` | — | Warehouse name |
| `role:` | — | Role name |
| `store_last_results:` | false | Store first row to `${snowflake.last_results}` |

Supports multi-statement SQL separated by `;`.

**Output variables:** `${snowflake.last_statement.handle}`, `${snowflake.last_statement.num_records}`

**Secrets:** `key_pair` auth (default) requires `snowflake.private_key`. `programmatic_access_token` auth requires `snowflake.programmatic_access_token`.

## Amazon Web Services Operators

S3 operators require **secrets** `aws.s3.access_key_id`, `aws.s3.secret_access_key`. Redshift operators require **secret** `aws.redshift.password`.

### s3_wait>: Wait for S3 File

Wait for an S3 object to appear. Polls with exponential backoff (5s → max 5min).

```yaml
+wait_s3:
  s3_wait>: my-bucket/data/${session_date}/export.csv.gz
```

| Parameter | Default | Description |
|---|---|---|
| `s3_wait>:` | (required) | S3 bucket/key path |
| `region:` | — | AWS region |
| `timeout:` | — | Max wait duration (e.g., `120s`) |
| `continue_on_timeout:` | false | Succeed on timeout (`s3.last_object` will be empty) |

**Output variables:** `${s3.last_object}`

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

| Parameter | Description |
|---|---|
| `source:` | Source bucket/key path (`s3_copy>`, `s3_move>`) |
| `destination:` | Destination bucket/key path (`s3_copy>`, `s3_move>`) |
| `recursive:` | Process all keys under prefix (default: false) |

**s3_move> is not atomic** — copies then deletes. Cannot move/copy a folder into itself.

Also supports `credential_provider: assume_role`.

### redshift>: Run Redshift Queries

```yaml
+rs_query:
  redshift>: queries/query.sql
  host: my-cluster.redshift.amazonaws.com
  user: myuser
  database: mydb
```

| Parameter | Default | Description |
|---|---|---|
| `redshift>:` | (required) | SQL file path |
| `host:` | (required) | Redshift cluster endpoint |
| `user:` | (required) | User name |
| `database:` | (required) | Database name |
| `port:` | 5439 | Port number |
| `ssl:` | false | Enable SSL |
| `store_last_results:` | false | Store first row to `${redshift.last_results}` |

### redshift_load>: Load S3 into Redshift

| Parameter | Description |
|---|---|
| `host:` | Redshift cluster endpoint |
| `user:` | User name |
| `database:` | Database name |
| `table:` | Target table |
| `from:` | S3 URI |

**Additional secrets:** `aws.redshift_load.access_key_id`, `aws.redshift_load.secret_access_key`

### redshift_unload>: Unload Redshift to S3

| Parameter | Description |
|---|---|
| `host:` | Redshift cluster endpoint |
| `user:` | User name |
| `database:` | Database name |
| `query:` | SQL query to unload |
| `to:` | S3 URI |

**Additional secrets:** `aws.redshift_unload.access_key_id`, `aws.redshift_unload.secret_access_key`

## Google Cloud Platform Operators

All GCP operators require **secret** `gcp.credential`.

### gcs_wait>: Wait for GCS File

```yaml
+wait_gcs:
  gcs_wait>: my-bucket/data/${session_date}/export.csv.gz
```

**Output variables:** `${gcs_wait.last_object}`

### bq>: BigQuery Queries

```yaml
+query:
  bq>: queries/analysis.sql
  destination_table: my_dataset.results
```

| Parameter | Default | Description |
|---|---|---|
| `bq>:` | (required) | SQL file path |
| `destination_table:` | — | Target dataset.table |
| `write_disposition:` | WRITE_TRUNCATE | `WRITE_TRUNCATE`, `WRITE_APPEND`, `WRITE_EMPTY` |
| `create_disposition:` | CREATE_IF_NEEDED | `CREATE_IF_NEEDED`, `CREATE_NEVER` |
| `store_last_results:` | false | Store first row to `${bq.last_results}` |

### bq_ddl>: BigQuery Dataset/Table Management

| Parameter | Description |
|---|---|
| `create_datasets:` | Create datasets if not exist |
| `delete_datasets:` | Delete datasets |
| `empty_datasets:` | Drop and recreate datasets |
| `create_tables:` | Create tables if not exist |
| `delete_tables:` | Delete tables |
| `empty_tables:` | Drop and recreate tables |

### bq_load>: Import GCS to BigQuery

| Parameter | Description |
|---|---|
| `bq_load>:` | GCS URI (e.g., `gs://bucket/path/*.csv`) |
| `destination_table:` | Target dataset.table |
| `source_format:` | `CSV`, `NEWLINE_DELIMITED_JSON`, `AVRO`, `PARQUET` |

### bq_extract>: Export BigQuery to GCS

| Parameter | Description |
|---|---|
| `bq_extract>:` | Source dataset.table |
| `destination:` | GCS URI (e.g., `gs://bucket/path/export_*.csv`) |
| `destination_format:` | `CSV`, `NEWLINE_DELIMITED_JSON`, `AVRO` |

## Scripting Operators

### py>: Python Custom Script

For the full `py>` reference (package installation, digdag Python API, argument mapping), see [py-operator.md](py-operator.md). Read it when building tasks that require Python — external API calls, HTML scraping, data transformation, or writing to TD tables.

## Secrets Reference

`${secret:key}` is only expanded in specific operator fields. Some operators also read named secrets automatically.

| Operator | `${secret:key}` expanded in | Auto-resolved named secrets |
|---|---|---|
| `http>` | URI, query, headers, content | `http.authorization` (→ Authorization header), `http.user`, `http.password`, `http.uri` |
| `td>` | `result_url`, `result_settings` | `td.apikey` |
| `td_load>` | bulk load config | `td.apikey` |
| `td_result_export>` | `result_settings` | `td.apikey` |
| `td_table_export>` | — | `td.apikey`, `aws.s3.access_key_id`, `aws.s3.secret_access_key` |
| `mail>` | — | `mail.host`, `mail.port`, `mail.username`, `mail.password`, `mail.tls`, `mail.ssl` |
| `s3_wait>`, `s3_copy>`, `s3_delete>`, `s3_move>` | — | `aws.s3.access_key_id`, `aws.s3.secret_access_key` |
| `gcs_wait>` | — | `gcp.credential` |
| `py>` | **Not supported** | — (use `_env` instead) |
