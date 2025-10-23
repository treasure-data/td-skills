---
name: digdag
description: Expert assistance for designing, implementing, and debugging digdag workflows for Treasure Data. Use this skill when users need help with digdag YAML configuration, workflow orchestration, error handling, or scheduling.
---

# Digdag Workflow Expert

Expert assistance for creating and managing digdag workflows in Treasure Data environments.

## When to Use This Skill

Use this skill when:
- Creating new digdag workflow definitions
- Debugging existing digdag workflows
- Implementing error handling and retry logic
- Setting up workflow schedules and dependencies
- Optimizing workflow performance
- Working with digdag operators (td, sh, py, etc.)

## Core Principles

### 1. Basic Workflow Structure

A digdag workflow is defined in a `.dig` file. **The filename becomes the workflow name** - for example, `hello_world.dig` creates a "hello_world" workflow.

```yaml
timezone: UTC

schedule:
  daily>: 02:00:00

_export:
  td:
    database: my_database

+start:
  echo>: "Workflow started at ${session_time}"

+query:
  td>: queries/my_query.sql

+finish:
  echo>: "Workflow completed"
```

**Key points:**
- `.dig` file extension required
- Workflow name = filename (without .dig)
- `timezone:` defaults to UTC if not specified
- Tasks are defined with `+` prefix and run top-to-bottom sequentially

### 2. Workflow Configuration

**Essential top-level configurations:**

```yaml
# Set timezone for schedule
timezone: Asia/Tokyo

# Schedule workflow execution
schedule:
  daily>: 02:00:00          # Daily at 2 AM
  # hourly>: 00:00          # Every hour
  # cron>: "0 */4 * * *"    # Every 4 hours
  # weekly>: "Mon,00:00:00" # Every Monday

# Export common parameters
_export:
  td:
    database: production_db
    engine: presto  # or hive
  my_param: "value"
```

### 3. Task Structure

Tasks are defined with `+task_name:` prefix. Tasks run sequentially from top to bottom and can be nested as children of other tasks.

```yaml
+task1:
  echo>: "This is task 1"

+task2:
  sh>: echo "This is task 2"

+parent_task:
  echo>: "Parent task"

  +child_task:
    echo>: "This runs as a child of parent_task"

  +another_child:
    echo>: "This also runs as a child"

+task3:
  td>: queries/query.sql
  create_table: result_table
```

**Important:** The syntax `foo>: bar` is syntactic sugar for setting both `_type: foo` and `_command: bar` parameters.

### 4. TD Operator

The `td>` operator runs TD queries:

**Inline SQL:**
```yaml
+analyze_events:
  td>:
    query: |
      SELECT
        TD_TIME_FORMAT(time, 'yyyy-MM-dd', 'JST') as date,
        COUNT(*) as event_count
      FROM events
      WHERE TD_TIME_RANGE(
        time,
        '${session_date_compact}',
        TD_TIME_ADD('${session_date_compact}', '1d')
      )
      GROUP BY 1
    database: analytics
    engine: presto
  create_table: daily_events
```

**External SQL file:**
```yaml
+run_query:
  td>: queries/analysis.sql
  database: analytics
  engine: presto
  create_table: analysis_results

  # Or insert into existing table
  # insert_into: existing_table

  # Or download results
  # download_file: results.csv
```

### 5. Session Variables

Digdag provides built-in session variables for dynamic workflows accessible via `${variable_name}` syntax:

**Always available variables:**

| Variable | Description | Example |
|----------|-------------|---------|
| `${timezone}` | Timezone of workflow | `America/Los_Angeles` |
| `${project_id}` | Project ID | `12345` |
| `${session_uuid}` | Unique session UUID | `414a8b9e-b365-4394-916a-f0ed9987bd2b` |
| `${session_id}` | Integer session ID | `2381` |
| `${session_time}` | Session timestamp with timezone | `2016-01-30T00:00:00-08:00` |
| `${session_date}` | Date part (YYYY-MM-DD) | `2016-01-30` |
| `${session_date_compact}` | Date part (YYYYMMDD) | `20160130` |
| `${session_local_time}` | Local time format | `2016-01-30 00:00:00` |
| `${session_tz_offset}` | Timezone offset | `-0800` |
| `${session_unixtime}` | Unix epoch seconds | `1454140800` |
| `${task_name}` | Full task name path | `+myworkflow+parent+child` |
| `${attempt_id}` | Integer attempt ID | `7` |

**Schedule-only variables** (when `schedule:` is configured):

| Variable | Hourly Schedule Example | Daily Schedule Example |
|----------|------------------------|------------------------|
| `${last_session_time}` | `2016-01-29T23:00:00-08:00` | `2016-01-29T00:00:00-08:00` |
| `${last_session_date}` | `2016-01-29` | `2016-01-29` |
| `${last_session_date_compact}` | `20160129` | `20160129` |
| `${last_session_local_time}` | `2016-01-29 23:00:00` | `2016-01-29 00:00:00` |
| `${last_session_tz_offset}` | `-0800` | `-0800` |
| `${last_session_unixtime}` | `1454137200` | `1454054400` |
| `${last_executed_session_time}` | `2016-01-29T23:00:00-08:00` | `2016-01-29T00:00:00-08:00` |
| `${last_executed_session_unixtime}` | `1454137200` | `1454054400` |
| `${next_session_time}` | `2016-01-30T01:00:00-08:00` | `2016-01-31T00:00:00-08:00` |
| `${next_session_date}` | `2016-01-30` | `2016-01-31` |
| `${next_session_date_compact}` | `20160130` | `20160131` |
| `${next_session_local_time}` | `2016-01-30 01:00:00` | `2016-01-31 00:00:00` |
| `${next_session_tz_offset}` | `-0800` | `-0800` |
| `${next_session_unixtime}` | `1454144400` | `1454227200` |

**Notes:**
- `last_session_time` = timestamp of last schedule (calculated, not actual execution)
- `last_executed_session_time` = timestamp of previously executed session
- Built-in variables cannot be overwritten

**Using variables in queries:**
```yaml
+daily_job:
  td>:
    query: |
      SELECT * FROM events
      WHERE TD_TIME_RANGE(
        time,
        '${session_date}',  -- YYYY-MM-DD format
        TD_TIME_ADD('${session_date}', '1d')
      )
```

**Calculating variables with JavaScript:**

You can use JavaScript expressions within `${...}` syntax. Digdag includes Moment.js for time calculations:

```yaml
timezone: America/Los_Angeles

+format_session_time:
  # "2016-09-24 00:00:00 -0700"
  echo>: ${moment(session_time).format("YYYY-MM-DD HH:mm:ss Z")}

+format_in_utc:
  # "2016-09-24 07:00:00"
  echo>: ${moment(session_time).utc().format("YYYY-MM-DD HH:mm:ss")}

+format_tomorrow:
  # "September 24, 2016 12:00 AM"
  echo>: ${moment(session_time).add(1, 'days').format("LLL")}

+get_execution_time:
  # Current execution time: "2016-09-24 05:24:49 -0700"
  echo>: ${moment().format("YYYY-MM-DD HH:mm:ss Z")}
```

### 6. Task Dependencies

**Sequential execution (default):**
```yaml
+step1:
  echo>: "First"

+step2:
  echo>: "Second (runs after step1)"
```

**Parallel execution:**

Use `_parallel: true` to run child tasks concurrently (only affects direct children, not grandchildren):

```yaml
+parallel_tasks:
  _parallel: true

  +task_a:
    echo>: "Runs in parallel"

  +task_b:
    echo>: "Runs in parallel"

  +task_c:
    echo>: "Runs in parallel"

+after_parallel:
  echo>: "Runs after all parallel tasks complete"
```

**Limited parallel execution:**

Use `_parallel: {limit: N}` to limit concurrent execution to N tasks:

```yaml
+prepare:
  # +data1 and +data2 run in parallel first
  # Then +data3 and +data4 run in parallel (after first two succeed)
  _parallel:
    limit: 2

  +data1:
    py>: tasks.PrepareWorkflow.prepare_data1

  +data2:
    py>: tasks.PrepareWorkflow.prepare_data2

  +data3:
    py>: tasks.PrepareWorkflow.prepare_data3

  +data4:
    py>: tasks.PrepareWorkflow.prepare_data4

+analyze:
  py>: tasks.AnalyzeWorkflow.analyze_prepared_data_sets
```

**Background execution:**

Use `_background: true` to run a task in parallel with previous tasks. The next task waits for background task completion:

```yaml
+prepare:
  +data1:
    py>: tasks.PrepareWorkflow.prepare_data1

  # +data1 and +data2 run in parallel
  +data2:
    _background: true
    py>: tasks.PrepareWorkflow.prepare_data2

  # +data3 runs after both +data1 and +data2 complete
  +data3:
    py>: tasks.PrepareWorkflow.prepare_data3

+analyze:
  py>: tasks.AnalyzeWorkflow.analyze_prepared_data_sets
```

### 7. Error Handling

**Group-level retry:**

If `_retry: N` is set on a group, it retries the entire group from the beginning when any child fails:

```yaml
+prepare:
  # If any child task fails, retry the entire group up to 3 times
  _retry: 3

  +erase_table:
    py>: tasks.PrepareWorkflow.erase_table

  +load_data:
    py>: tasks.PrepareWorkflow.load_data

  +check_loaded_data:
    py>: tasks.PrepareWorkflow.check_loaded_data

+analyze:
  py>: tasks.AnalyzeWorkflow.analyze_prepared_data_sets
```

**Task-level retry:**

Individual tasks can also use `_retry: N`, though some operators have their own retry options:

```yaml
+query_with_retry:
  td>: queries/important_query.sql
  _retry: 3
```

**Retry with intervals:**

Configure retry intervals with exponential or constant backoff:

```yaml
+prepare:
  _retry:
    limit: 3              # Number of retries
    interval: 10          # Interval in seconds
    interval_type: exponential  # or "constant"

  +load_data:
    py>: tasks.PrepareWorkflow.load_data
```

With `exponential` type:
- 1st retry: 10 seconds
- 2nd retry: 20 seconds (10 × 2^1)
- 3rd retry: 40 seconds (10 × 2^2)

With `constant` type (default):
- All retries: 10 seconds

**Error handling tasks:**

Use `_error:` to run operators when a workflow fails:

```yaml
# Runs when workflow fails
_error:
  py>: tasks.ErrorWorkflow.runs_when_workflow_failed

+main_task:
  td>: queries/analysis.sql

  _error:
    +send_alert:
      sh>: python scripts/send_slack_alert.py "Main task failed"

+another_task:
  py>: tasks.process_data
```

**Email notifications on error:**
```yaml
_error:
  mail>:
    from: workflow@example.com
    to: [alerts@example.com]
    subject: "Workflow ${task_name} failed"
    body: "Session: ${session_time}"
```

### 8. Defining Variables

**Using `_export:` directive:**

The `_export:` directive defines variables within a scope. Variables are available to the task and all its children:

```yaml
_export:
  foo: 1  # Available to all tasks

+prepare:
  py>: tasks.MyWorkflow.prepare
  # Can use ${foo}

+analyze:
  _export:
    bar: 2  # Only available to +analyze and its children

  +step1:
    py>: tasks.MyWorkflow.analyze_step1
    # Can use ${foo} and ${bar}

+dump:
  py>: tasks.MyWorkflow.dump
  # Can use ${foo}, but NOT ${bar}
```

**Key points:**
- Top-level `_export:` makes variables available to all tasks
- Task-level `_export:` makes variables available to that task and its children only
- Built-in variables cannot be overwritten

**Using API (Python):**

Variables can be set programmatically using language APIs:

```python
import digdag

class MyWorkflow(object):
  def prepare(self):
    # store() makes variables available to ALL following tasks
    digdag.env.store({"my_param": 2})

  def export_and_call_child(self):
    # export() makes variables available to children only
    digdag.env.export({"my_param": 2})
    digdag.env.add_subtask({'_type': 'call', '_command': 'child1.dig'})
```

**Differences:**
- `digdag.env.store(dict)` → Available to all following tasks (like task-level variable)
- `digdag.env.export(dict)` → Available to children only (like `_export:` in YAML)

**Parameter Store (secrets):**

Store and retrieve secrets securely from TD parameter store:

```yaml
_export:
  # Reference secrets from TD parameter store
  api_key: ${secret:api_credentials.api_key}
  db_password: ${secret:database.password}

+call_api:
  py>: scripts.api_caller.main
  api_key: ${api_key}
```

### 9. Including External Files

Use `!include` to organize complex workflows across multiple files:

```yaml
_export:
  mysql:
    !include : 'config/mysql.dig'
  hive:
    !include : 'config/hive.dig'

!include : 'tasks/foo.dig'
```

**Note:** A whitespace before `:` is required for valid YAML syntax.

**Example structure:**
```
my_workflow/
├── my_workflow.dig
├── config/
│   ├── mysql.dig
│   └── hive.dig
└── tasks/
    └── foo.dig
```

**config/mysql.dig:**
```yaml
host: mysql.example.com
port: 3306
database: production
```

**tasks/foo.dig:**
```yaml
+extract:
  td>: queries/extract.sql

+transform:
  td>: queries/transform.sql
```

### 10. Python Operator

Run Python scripts:

```yaml
+python_task:
  py>: scripts.data_processor.process
  database: ${td.database}
  table: events

  # Can pass parameters
  _env:
    TD_API_KEY: ${secret:td.apikey}
```

Python script structure (`scripts/data_processor.py`):
```python
def process(database, table):
    """
    Process data from TD table
    """
    import pytd

    client = pytd.Client(database=database)
    df = client.query(f"SELECT * FROM {table} LIMIT 1000")

    # Process data
    result = df.shape[0]

    # Return value to use in workflow
    return {'processed_count': result}
```

### 11. Shell Operator

Run shell commands:

```yaml
+shell_task:
  sh>: bash scripts/process_data.sh

+inline_shell:
  sh>: |
    echo "Starting process"
    date
    echo "Process complete"
```

## Common Patterns

### Daily ETL Pipeline

```yaml
timezone: Asia/Tokyo

schedule:
  daily>: 03:00:00

_export:
  td:
    database: analytics
    engine: presto

+start:
  echo>: "ETL started for ${session_date}"

+extract:
  td>: queries/extract_raw_events.sql
  create_table: raw_events_${session_date_compact}

+transform:
  td>: queries/transform_events.sql
  create_table: transformed_events_${session_date_compact}

+load:
  td>:
    query: |
      INSERT INTO events_daily
      SELECT * FROM transformed_events_${session_date_compact}

+cleanup:
  td>:
    query: |
      DROP TABLE IF EXISTS raw_events_${session_date_compact};
      DROP TABLE IF EXISTS transformed_events_${session_date_compact};

+notify:
  sh>: python scripts/send_completion_notification.py "${session_date}"

  _error:
    +alert_failure:
      sh>: python scripts/send_failure_alert.py "${session_date}"
```

### Parallel Data Processing

```yaml
timezone: UTC

schedule:
  hourly>: 00:00

_export:
  td:
    database: events
    engine: presto

+process_regions:
  _parallel: true

  +process_us:
    td>: queries/process_region.sql
    create_table: us_events_${session_date_compact}
    region: 'US'

  +process_eu:
    td>: queries/process_region.sql
    create_table: eu_events_${session_date_compact}
    region: 'EU'

  +process_asia:
    td>: queries/process_region.sql
    create_table: asia_events_${session_date_compact}
    region: 'ASIA'

+aggregate:
  td>:
    query: |
      SELECT * FROM us_events_${session_date_compact}
      UNION ALL
      SELECT * FROM eu_events_${session_date_compact}
      UNION ALL
      SELECT * FROM asia_events_${session_date_compact}
  create_table: global_events_${session_date_compact}
```

### Incremental Processing

```yaml
timezone: Asia/Tokyo

schedule:
  daily>: 01:00:00

_export:
  td:
    database: analytics
    engine: presto

+get_last_processed:
  td>:
    query: |
      SELECT MAX(processed_date) as last_date
      FROM processing_log
  store_last_results: true

+process_new_data:
  td>:
    query: |
      SELECT *
      FROM source_table
      WHERE TD_TIME_RANGE(
        time,
        COALESCE('${td.last_results.last_date}', '2024-01-01'),
        '${session_date}'
      )
  create_table: incremental_data

+update_log:
  td>:
    query: |
      INSERT INTO processing_log
      VALUES ('${session_date}', current_timestamp)
```

### Multi-stage Pipeline with Dependencies

```yaml
timezone: Asia/Tokyo

_export:
  td:
    database: production
    engine: presto

+stage1_extract:
  _parallel: true

  +extract_users:
    td>: queries/extract_users.sql
    create_table: staging_users

  +extract_events:
    td>: queries/extract_events.sql
    create_table: staging_events

+stage2_join:
  td>: queries/join_users_events.sql
  create_table: user_events

  # This runs only after all stage1 tasks complete

+stage3_aggregate:
  _parallel: true

  +daily_stats:
    td>: queries/daily_aggregation.sql
    create_table: daily_stats

  +user_segments:
    td>: queries/user_segmentation.sql
    create_table: user_segments

+stage4_export:
  td>: queries/final_export.sql
  download_file: export_${session_date_compact}.csv
```

## Workflow Project Structure

A TD workflow project typically follows this structure:

```
my_workflow/
├── workflow.dig           # Main workflow definition
├── queries/              # SQL query files
│   ├── query1.sql
│   └── query2.sql
└── scripts/              # Python/shell scripts (optional)
    └── process.py
```

**Key conventions:**
- Workflow files use `.dig` extension
- SQL queries are stored in `queries/` directory
- Python scripts go in `scripts/` directory
- Project name matches the workflow directory name

## TD CLI Workflow Commands

### Creating and Testing Workflows Locally

**Run workflow once from local machine:**
```bash
# Run workflow in TD environment (creates tables/runs queries)
td wf run my_workflow

# Run from within workflow directory
cd my_workflow
td wf run .
```

**Check workflow syntax:**
```bash
# Verify workflow file syntax
td wf check my_workflow.dig
```

**Verify created tables:**
```bash
# Show table details
td table:show database_name table_name

# List tables in database
td table:list database_name
```

### Pushing and Scheduling Workflows

**Register workflow with TD:**
```bash
# Push workflow to TD (registers and schedules if schedule: is defined)
td wf push my_workflow

# Push from within workflow directory
cd my_workflow
td wf push .
```

**Note:** When you push a workflow with a `schedule:` section, it automatically starts running on that schedule.

### Managing Workflows

**List registered workflows:**
```bash
# List all workflow projects
td wf list

# Show workflows in a specific project
td wf workflows my_workflow

# Show specific workflow definition
td wf workflows my_workflow workflow_name
```

**View workflow execution history:**
```bash
# List workflow sessions (runs)
td wf sessions my_workflow

# Show details of a specific session
td wf session my_workflow session_id

# View task logs
td wf log my_workflow session_id +task_name
```

**Delete workflows:**
```bash
# Delete a workflow project
td wf delete my_workflow
```

### Database Management

**Create database for workflows:**
```bash
# Create a new database
td db:create database_name

# List databases
td db:list

# Show database details
td db:show database_name
```

## Best Practices

1. **Use descriptive task names** with `+prefix`
2. **Always set timezone** at workflow level
3. **Use session variables** for dynamic dates
4. **Externalize SQL queries** into separate files in `queries/` directory
5. **Add error handlers** with `_error:` for critical tasks
6. **Use retry logic** for potentially flaky operations
7. **Implement parallel execution** where tasks are independent
8. **Store secrets** in TD parameter store, not in workflow files
9. **Add logging** with echo or shell tasks for debugging
10. **Test workflows locally** with `td wf run` before pushing
11. **Use `_export`** for common parameters (especially `td.database`)
12. **Document workflows** with comments
13. **Use `create_table:`** parameter to manage table creation/replacement
14. **Organize queries** in `queries/` directory, scripts in `scripts/`

## Workflow Development Cycle

The typical workflow development cycle:

1. **Create project directory** with workflow file and queries
2. **Test locally** - Run with `td wf run` to execute in TD environment
3. **Iterate** - Edit workflow and queries, re-run to test
4. **Verify results** - Check created tables with `td table:show`
5. **Push to TD** - Register and schedule with `td wf push`
6. **Monitor** - Check execution with `td wf sessions` and `td wf log`

**Example development workflow:**
```bash
# Create project directory
mkdir my_workflow && cd my_workflow

# Create workflow file
cat > my_workflow.dig << 'EOF'
timezone: UTC
schedule:
  daily>: 02:00:00

_export:
  td:
    database: analytics

+analyze:
  td>: queries/analysis.sql
  create_table: results
EOF

# Create queries directory
mkdir queries

# Create query file
cat > queries/analysis.sql << 'EOF'
SELECT COUNT(*) as cnt
FROM events
WHERE TD_INTERVAL(time, '-1d', 'UTC')
EOF

# Test workflow locally (runs in TD)
td wf run .

# Verify table was created
td table:show analytics results

# Push to TD to schedule
td wf push .
```

## Debugging Workflows

### Local Testing with TD CLI

Test workflow execution:
```bash
# Run workflow once in TD environment
td wf run my_workflow

# Check if tables were created
td table:show database_name table_name

# View recent job history in TD Console
# Jobs will appear at: console.treasuredata.com/app/jobs
```

### Common Issues

**"Task failed with exit code 1"**
- Check task logs in TD console or with `td wf log`
- Verify SQL syntax if using td> operator
- Check file paths for external scripts
- Verify database and table names

**"Session variable not found"**
- Ensure variable exists in session context
- Check variable syntax: `${variable_name}`
- Verify _export section

**"Parallel tasks not running in parallel"**
- Ensure `_parallel: true` is set
- Check task dependencies

**"Query timeout"**
- Increase query timeout in td> operator
- Optimize query performance
- Consider breaking into smaller tasks

**"Database not found"**
- Create database with `td db:create database_name`
- Verify database name in `_export.td.database`

### Monitoring Workflows

**Check workflow status:**
```bash
# List all workflow projects
td wf list

# List workflow runs (sessions)
td wf sessions my_workflow

# Show specific session details
td wf session my_workflow session_id

# View task logs
td wf log my_workflow session_id +task_name

# Check job status in TD Console
# Visit: console.treasuredata.com/app/jobs
```

**View workflow definition:**
```bash
# Show registered workflow
td wf workflows my_workflow workflow_name
```

## Advanced Features

### Event-Triggered Workflows

Start a workflow automatically when another workflow completes successfully using the `trigger:` directive:

```yaml
# subsequent_workflow.dig
# This workflow waits for test_workflow_1 to complete successfully

trigger:
  attempt>:
  dependent_workflow_name: test_workflow_1
  dependent_project_name: test_project_1

+start:
  echo>: "This runs after test_workflow_1 succeeds"

+process:
  td>: queries/process_data.sql
  create_table: processed_results
```

**Key points:**
- Add `trigger:` directive to the **subsequent workflow** (the one that waits)
- `attempt>:` parameter is required (allows future expansion of trigger types)
- `dependent_workflow_name`: Name of the workflow that must complete successfully
- `dependent_project_name`: Name of the project containing the dependent workflow
- Triggers only on **success** (not on failure)
- Works regardless of how the preceding workflow starts (manual, scheduled, or triggered)
- Cannot wait for multiple workflows (use `td_wait`, `s3_wait`, or `http` operators instead)
- SLA directive timing starts only after the preceding workflow finishes

**Example use case - Activation after segment refresh:**

```yaml
# activation_workflow.dig
# Triggers after daily segment refresh completes

timezone: Asia/Tokyo

trigger:
  attempt>:
  dependent_workflow_name: segment_refresh
  dependent_project_name: customer_segments

+activate_campaign:
  td>: queries/activate_to_destination.sql

+send_notification:
  sh>: python scripts/notify_completion.py
```

### Conditional Branching

```yaml
+check_data:
  td>:
    query: "SELECT COUNT(*) as cnt FROM source_table WHERE date = '${session_date}'"
  store_last_results: true

+process_if_data_exists:
  if>: ${td.last_results.cnt > 0}
  _do:
    +process:
      td>: queries/process_data.sql
  _else_do:
    +skip:
      echo>: "No data for ${session_date}, skipping"
```

### Loop Operator

```yaml
+process_multiple:
  for_each>:
    region: [US, EU, ASIA]
  _do:
    +process_region:
      td>: queries/process_by_region.sql
      create_table: ${region}_data
```

### Workflow Call

Call another workflow:
```yaml
+run_subworkflow:
  call>: common/data_validation.dig
  params:
    table_name: my_table
    date: ${session_date}
```

## Resources

- Digdag documentation: https://docs.digdag.io/
- TD workflow guide: Check internal TD documentation
- Operator reference: https://docs.digdag.io/operators.html
- Session variables: https://docs.digdag.io/workflow_definition.html#session-variables
