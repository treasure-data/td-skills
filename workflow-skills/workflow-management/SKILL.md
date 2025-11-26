---
name: workflow-management
description: Expert assistance for managing, debugging, monitoring, and optimizing Treasure Data workflows. Use this skill when users need help troubleshooting workflow failures, improving performance, or implementing workflow best practices.
---

# Treasure Workflow Management Expert

Expert assistance for managing and optimizing Treasure Workflow (Treasure Data's workflow orchestration tool).

## When to Use This Skill

Use this skill when:
- Debugging workflow failures or errors
- Optimizing workflow performance
- Monitoring workflow execution
- Implementing workflow alerting and notifications
- Managing workflow dependencies
- Troubleshooting scheduling issues
- Performing workflow maintenance and updates

## Core Management Tasks

### 1. Workflow Monitoring

**Check workflow status:**
```bash
# List all workflow projects
tdx wf projects

# Show workflows in a specific project
tdx wf workflows <project_name>

# List recent runs (sessions)
tdx wf sessions <project_name>

# Filter sessions by status
tdx wf sessions <project_name> --status error
tdx wf sessions <project_name> --status running

# View specific attempt details
tdx wf attempt <attempt_id>
```

### 2. Debugging Failed Workflows

**Investigate failure:**
```bash
# Get attempt details
tdx wf attempt <attempt_id>

# Show tasks for an attempt
tdx wf tasks <attempt_id>

# View task logs
tdx wf logs <attempt_id> +task_name

# Include subtasks in task list
tdx wf tasks <attempt_id> --include-subtasks
```

**Common debugging steps:**

1. **Check error message** in logs
2. **Verify query syntax** if td> operator failed
3. **Check time ranges** - ensure data exists for session date
4. **Validate dependencies** - check if upstream tasks completed
5. **Review parameter values** - verify session variables are correct
6. **Check resource limits** - query memory, timeout issues

### 3. Query Performance Issues

**Identify slow queries:**
```yaml
+monitor_query:
  td>: queries/analysis.sql
  # Add job monitoring
  store_last_results: true

+check_performance:
  py>: scripts.check_query_performance.main
  job_id: ${td.last_job_id}
```

**Optimization checklist:**
- Add time filters (TD_TIME_RANGE)
- Use approximate aggregations (APPROX_DISTINCT)
- Reduce JOIN complexity
- Select only needed columns
- Add query hints for large joins
- Consider breaking into smaller tasks
- Use appropriate engine (Presto vs Hive)

### 4. Workflow Alerting

**Slack notification on failure:**
```yaml
+critical_task:
  td>: queries/important_analysis.sql

  _error:
    +send_slack_alert:
      sh>: |
        curl -X POST ${secret:slack.webhook_url} \
        -H 'Content-Type: application/json' \
        -d '{
          "text": "Workflow failed: '"${workflow_name}"'",
          "attachments": [{
            "color": "danger",
            "fields": [
              {"title": "Session", "value": "'"${session_id}"'", "short": true},
              {"title": "Date", "value": "'"${session_date}"'", "short": true}
            ]
          }]
        }'
```

**Email notification:**
```yaml
+notify_completion:
  py>: scripts.notifications.send_email
  recipients: ["team@example.com"]
  subject: "Workflow ${workflow_name} completed"
  body: "Session ${session_id} completed successfully"

  _error:
    +notify_failure:
      py>: scripts.notifications.send_email
      recipients: ["oncall@example.com"]
      subject: "ALERT: Workflow ${workflow_name} failed"
      body: "Session ${session_id} failed. Check logs immediately."
```

### 5. Data Quality Checks

**Implement validation tasks:**
```yaml
+main_processing:
  td>: queries/process_data.sql
  create_table: processed_data

+validate_results:
  td>:
    query: |
      SELECT
        COUNT(*) as total_rows,
        COUNT(DISTINCT user_id) as unique_users,
        SUM(CASE WHEN user_id IS NULL THEN 1 ELSE 0 END) as null_users
      FROM processed_data
  store_last_results: true

+check_quality:
  py>: scripts.data_quality.validate
  total_rows: ${td.last_results.total_rows}
  null_users: ${td.last_results.null_users}
  # Script should fail if quality checks don't pass
```

Python validation script:
```python
def validate(total_rows, null_users):
    """Validate data quality"""
    if total_rows == 0:
        raise Exception("No data processed")

    if null_users > total_rows * 0.01:  # More than 1% nulls
        raise Exception(f"Too many null users: {null_users}")

    return {"status": "passed"}
```

### 6. Dependency Management

**Workflow dependencies:**
```yaml
# workflows/upstream.dig
+produce_data:
  td>: queries/create_source_data.sql
  create_table: source_data_${session_date_compact}
```

```yaml
# workflows/downstream.dig
schedule:
  daily>: 04:00:00  # Runs after upstream (3:00)

_export:
  requires:
    - upstream_workflow  # Wait for upstream completion

+consume_data:
  td>:
    query: |
      SELECT * FROM source_data_${session_date_compact}
  create_table: processed_data
```

**Manual dependency with polling:**
```yaml
+wait_for_upstream:
  sh>: |
    for i in {1..60}; do
      if tdx describe production_db.source_data_${session_date_compact}; then
        exit 0
      fi
      sleep 60
    done
    exit 1
  retry: 3

+process_dependent_data:
  td>: queries/dependent_processing.sql
```

### 7. Backfill Operations

**Backfill for date range:**

Use the `tdx wf retry` command to re-run workflows for specific sessions, or use the TD Console to trigger manual runs with custom parameters.

```bash
# Retry a failed session
tdx wf retry session:<session_id>

# Retry from a specific task
tdx wf retry session:<session_id> --from-task +step_name

# Retry with parameter overrides
tdx wf retry attempt:<attempt_id> --params '{"session_date":"2024-01-15"}'
```

**Backfill workflow pattern:**
```yaml
# backfill.dig
+backfill:
  loop>:
    dates:
      - 2024-01-01
      - 2024-01-02
      - 2024-01-03
      # ... more dates
  _do:
    +process_date:
      call>: main_workflow.dig
      params:
        session_date: ${dates}
```

### 8. Workflow Versioning

**Best practices for updates:**

1. **Test in development environment first**
2. **Use version comments:**
```yaml
# Version: 2.1.0
# Changes: Added data quality validation
# Date: 2024-01-15

timezone: Asia/Tokyo
```

3. **Keep backup of working version:**
```bash
# Download current version from TD before making changes
tdx wf download my_workflow ./backup

# Or create local backup
cp workflow.dig workflow.dig.backup.$(date +%Y%m%d)
```

4. **Gradual rollout for critical workflows:**
```yaml
# Run new version in parallel with old version
+new_version:
  td>: queries/new_processing.sql
  create_table: results_v2

+old_version:
  td>: queries/old_processing.sql
  create_table: results_v1

+compare_results:
  td>:
    query: |
      SELECT
        (SELECT COUNT(*) FROM results_v1) as v1_count,
        (SELECT COUNT(*) FROM results_v2) as v2_count
  store_last_results: true
```

### 9. Resource Optimization

**Query resource management:**
```yaml
+large_query:
  td>: queries/heavy_processing.sql
  # Set query priority (lower = higher priority)
  priority: 0

  # Set result output size
  result_connection: ${td.database}:result_table

  # Engine settings
  engine: presto
  engine_version: stable
```

**Parallel task optimization:**
```yaml
# Limit parallelism to avoid resource exhaustion
+process_many:
  for_each>:
    batch: ["batch_1", "batch_2", "batch_3", "batch_4", "batch_5"]
  _parallel:
    limit: 2  # Only run 2 tasks in parallel
  _do:
    +process_batch:
      td>: queries/process_batch.sql
      create_table: ${batch}_results
```

### 10. Monitoring and Metrics

**Collect workflow metrics:**
```yaml
+workflow_start:
  py>: scripts.metrics.record_start
  workflow: ${workflow_name}
  session: ${session_id}

+main_work:
  td>: queries/main_query.sql

+workflow_end:
  py>: scripts.metrics.record_completion
  workflow: ${workflow_name}
  session: ${session_id}
  duration: ${session_duration}

  _error:
    +record_failure:
      py>: scripts.metrics.record_failure
      workflow: ${workflow_name}
      session: ${session_id}
```

**Metrics tracking script:**
```python
import pytd
from datetime import datetime

def record_start(workflow, session):
    client = pytd.Client(database='monitoring')
    client.query(f"""
        INSERT INTO workflow_metrics
        VALUES (
            '{workflow}',
            '{session}',
            {int(datetime.now().timestamp())},
            NULL,
            'running'
        )
    """)

def record_completion(workflow, session, duration):
    client = pytd.Client(database='monitoring')
    client.query(f"""
        UPDATE workflow_metrics
        SET end_time = {int(datetime.now().timestamp())},
            status = 'completed'
        WHERE workflow = '{workflow}'
          AND session_id = '{session}'
    """)
```

## Common Issues and Solutions

### Issue: Workflow Runs Too Long

**Solutions:**
1. Break into smaller parallel tasks
2. Optimize queries (add time filters, use APPROX functions)
3. Use incremental processing instead of full refresh
4. Consider Presto instead of Hive for faster execution
5. Add indexes if querying external databases

### Issue: Frequent Timeouts

**Solutions:**
```yaml
+long_running_query:
  td>: queries/complex_analysis.sql
  timeout: 3600s  # Increase timeout to 1 hour
  retry: 2
  retry_wait: 300s
```

### Issue: Intermittent Failures

**Solutions:**
```yaml
+flaky_task:
  td>: queries/external_api_call.sql
  retry: 5
  retry_wait: 60s
  retry_wait_multiplier: 2.0  # Exponential backoff
```

### Issue: Data Not Available

**Solutions:**
```yaml
+wait_for_data:
  sh>: |
    # Wait up to 30 minutes for data
    for i in {1..30}; do
      COUNT=$(tdx query -d analytics "SELECT COUNT(*) FROM source WHERE date='${session_date}'" --format csv | tail -1)
      if [ "$COUNT" -gt 0 ]; then
        exit 0
      fi
      sleep 60
    done
    exit 1

+process_data:
  td>: queries/process.sql
```

### Issue: Out of Memory

**Solutions:**
1. Reduce query complexity
2. Add better filters to reduce data volume
3. Use sampling for analysis
4. Split into multiple smaller queries
5. Increase query resources (contact TD admin)

### Issue: Duplicate Runs

**Solutions:**
```yaml
# Use idempotent operations
+safe_insert:
  td>:
    query: |
      DELETE FROM target_table
      WHERE date = '${session_date}';

      INSERT INTO target_table
      SELECT * FROM source_table
      WHERE date = '${session_date}'
```

## Best Practices

1. **Implement comprehensive error handling** for all critical tasks
2. **Add logging** at key workflow stages
3. **Monitor query performance** regularly
4. **Set up alerts** for failures and SLA violations
5. **Use idempotent operations** to handle reruns safely
6. **Document workflow dependencies** clearly
7. **Implement data quality checks** after processing
8. **Keep workflows modular** for easier maintenance
9. **Version control workflows** in git
10. **Test changes** in dev environment first
11. **Monitor resource usage** and optimize
12. **Set appropriate timeouts** and retries
13. **Use meaningful task names** for debugging
14. **Archive old workflow versions** for rollback capability

## Maintenance Checklist

Weekly:
- Review failed workflow sessions
- Check query performance trends
- Monitor resource utilization
- Review alert patterns

Monthly:
- Clean up old temporary tables
- Review and optimize slow workflows
- Update documentation
- Review and update dependencies
- Check for deprecated features

Quarterly:
- Performance audit of all workflows
- Review workflow architecture
- Update error handling patterns
- Security review (secrets, access)

## Resources

- TD Console: Access workflow logs and monitoring
- Treasure Workflow Quick Start: https://docs.treasuredata.com/articles/#!pd/treasure-workflow-quick-start-using-td-toolbelt-in-a-cli
- tdx CLI: Command-line workflow management using `tdx wf` commands
- Query performance: Use EXPLAIN for query optimization
- Internal docs: Check TD internal documentation for updates

## tdx Workflow Command Reference

| Command | Description |
|---------|-------------|
| `tdx wf projects` | List all workflow projects |
| `tdx wf workflows [project]` | List workflows (optionally for a project) |
| `tdx wf sessions [project]` | List workflow sessions |
| `tdx wf attempts [project]` | List workflow attempts |
| `tdx wf attempt <id>` | Show attempt details |
| `tdx wf tasks <attempt-id>` | Show tasks for an attempt |
| `tdx wf logs <attempt-id> <task>` | View task logs |
| `tdx wf kill <attempt-id>` | Kill a running attempt |
| `tdx wf retry session:<id>` | Retry a session |
| `tdx wf retry attempt:<id>` | Retry an attempt |
| `tdx wf download <project>` | Download workflow project |
| `tdx wf push <project>` | Push workflow to TD |
| `tdx wf delete <project>` | Delete workflow project |
