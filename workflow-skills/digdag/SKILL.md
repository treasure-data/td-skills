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

A digdag workflow is defined in a `.dig` file:

```yaml
timezone: Asia/Tokyo

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

Tasks are defined with `+task_name:` prefix:

```yaml
+task1:
  echo>: "This is task 1"

+task2:
  sh>: echo "This is task 2"

+task3:
  td>: queries/query.sql
  create_table: result_table
```

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

Digdag provides session variables for dynamic workflows:

**Time-based variables:**
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

**Common session variables:**
- `${session_time}` - Session timestamp (ISO 8601)
- `${session_date}` - Session date (YYYY-MM-DD)
- `${session_date_compact}` - Session date (YYYYMMDD)
- `${session_unixtime}` - Unix timestamp
- `${session_uuid}` - Unique session ID
- `${timezone}` - Workflow timezone

### 6. Task Dependencies

**Sequential execution (default):**
```yaml
+step1:
  echo>: "First"

+step2:
  echo>: "Second (runs after step1)"
```

**Parallel execution:**
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

**Conditional execution:**
```yaml
+check_condition:
  sh>: test -f /tmp/flag.txt

+run_if_success:
  echo>: "Runs only if check_condition succeeds"

+cleanup:
  _background: true
  echo>: "Runs regardless of previous task results"
```

### 7. Error Handling

**Retry logic:**
```yaml
+query_with_retry:
  td>: queries/important_query.sql
  retry: 3
  retry_wait: 30s
```

**Error handling tasks:**
```yaml
+main_task:
  td>: queries/analysis.sql

  _error:
    +send_alert:
      sh>: python scripts/send_slack_alert.py "Main task failed"
```

**Check tasks (run after completion):**
```yaml
+risky_task:
  td>: queries/complex_query.sql

  _check:
    +verify_results:
      td>:
        query: |
          SELECT COUNT(*) as cnt FROM ${td.last_results.table}
          WHERE cnt > 0
```

### 8. Parameter Store

Store and retrieve secrets securely:

```yaml
_export:
  # Reference secrets from TD parameter store
  api_key: ${secret:api_credentials.api_key}

+call_api:
  py>: scripts.api_caller.main
  api_key: ${api_key}
```

### 9. Python Operator

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

### 10. Shell Operator

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

## Best Practices

1. **Use descriptive task names** with `+prefix`
2. **Always set timezone** at workflow level
3. **Use session variables** for dynamic dates
4. **Externalize SQL queries** into separate files for complex queries
5. **Add error handlers** with `_error:` for critical tasks
6. **Use retry logic** for potentially flaky operations
7. **Implement parallel execution** where tasks are independent
8. **Store secrets** in TD parameter store, not in workflow files
9. **Add logging** with echo or shell tasks for debugging
10. **Test workflows** with manual runs before scheduling
11. **Use `_export`** for common parameters
12. **Document workflows** with comments

## Debugging Workflows

### Local Testing

Test workflow syntax locally:
```bash
# Check syntax
digdag check workflow.dig

# Run locally (dry run)
digdag run workflow.dig --dry-run

# Run with specific session time
digdag run workflow.dig -p session_date=2024-01-15
```

### Common Issues

**"Task failed with exit code 1"**
- Check task logs in TD console
- Verify SQL syntax if using td> operator
- Check file paths for external scripts

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

### Monitoring

Check workflow status:
```bash
# List workflow runs
digdag workflows

# Show workflow details
digdag show <workflow_name>

# View task logs
digdag log <session_id> +task_name
```

## Advanced Features

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
