# TD Workflow Operators Reference

Full parameter reference for all operators available on the TD platform.
For the latest details, see https://docs.digdag.io/operators.html

---

## Treasure Data Operators

### td>: Run Queries

Execute Hive or Presto queries on Treasure Data.

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

**Result handling** (choose one):

| Parameter | Description |
|---|---|
| `create_table: NAME` | Create new table from results (drops existing) |
| `insert_into: NAME` | Append results to table (creates if not exists) |
| `download_file: NAME` | Export results as local CSV |
| `store_last_results: true` | Store first row to `${td.last_results}` |
| `preview: true` | Display sample results in log |
| `result_url: URL` | Route results to external URL |
| `result_connection: NAME` | Write results via configured connection |
| `result_settings: MAP` | Additional settings for result connection |

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

**Secrets:** `td.apikey`

---

### td_run>: Execute Saved Queries

```yaml
+run_saved:
  td_run>: my_saved_query
  # or by ID:
  td_run>: 12345
```

| Parameter | Default | Description |
|---|---|---|
| `td_run:` | (required) | Saved query name or numeric ID |
| `download_file:` | — | Export results as CSV |
| `store_last_results:` | false | Store first row to `${td.last_results}` |
| `preview:` | false | Display sample results |
| `session_time:` | — | Override execution time (e.g. `2026-01-01T00:00:00+00:00`) |

**Output variables:** Same as `td>`.

**Secrets:** `td.apikey`

---

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

**Secrets:** `td.apikey`

---

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

**Secrets:** `td.apikey`

---

### td_for_each>: Query Loop

Execute subtasks once per row returned by a query. Access row values via `${td.each.COLUMN_NAME}`.

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
| `td_for_each>:` | SQL template file |
| `_do:` | Subtasks to run per row |
| `_parallel:` | Run iterations concurrently |
| `database:` | Target database |
| `engine:` | `presto` or `hive` |
| `priority:` | -2 to 2 |
| `job_retry:` | Auto-retry count |

**Output variables:** `${td.last_job_id}`, `${td.last_job.num_records}`

**Secrets:** `td.apikey`

---

### td_wait>: Wait for Query Condition

Poll a query until it returns true.

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
| `td_wait>:` | (required) | SQL template file |
| `database:` | — | Target database |
| `engine:` | — | `presto` or `hive` |
| `interval:` | 30s | Polling frequency |
| `priority:` | 0 | Job priority |
| `job_retry:` | 0 | Auto-retry |

**Secrets:** `td.apikey`

---

### td_wait_table>: Wait for Table Records

Poll a table until it has enough records in the session time range.

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

**Secrets:** `td.apikey`

---

## Workflow Control Operators

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

---

### for_each>: Iterate Over Values

Creates a Cartesian product of all provided values.

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

---

### loop>: Repeat N Times

Exposes `${i}` (0-indexed) in each iteration.

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

---

### call>: Call Another Workflow

```yaml
+prepare:
  call>: sub/prepare.dig

+process:
  call>: sub/process.dig
```

Called workflow uses its subdirectory as working directory. Adjust relative file paths accordingly (e.g., `../queries/data.sql`).

---

### echo>: Log a Message

```yaml
+log:
  echo>: "Processing ${session_date} for database ${td.each.db_name}"
```

---

### fail>: Force Failure

```yaml
+abort:
  fail>: "Data validation failed: expected > 1000 rows"
```

---

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

**Secrets:** `http.authorization`, `http.user`, `http.password`

---

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

---

## py>: Python Custom Script

For the full `py>` reference (package installation, digdag Python API, argument mapping), see [py-operator.md](py-operator.md). Read it when building tasks that require Python — external API calls, HTML scraping, data transformation, or writing to TD tables.
