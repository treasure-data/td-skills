---
name: semantic-layer-sync-config
description: Manage sync behavior and execution settings for semantic layer automation. Use when configuring sync mode, scheduling, batch processing, or performance settings.
---

# Semantic Layer Sync Config Skill

**Focused skill for configuring how semantic layer automation executes, including sync modes, scheduling, batching, and performance settings.**

## Purpose

Configure sync behavior to:
- Set sync mode (full vs delta)
- Configure scheduling and automation
- Manage batch processing
- Optimize performance settings
- Control execution behavior

## When to Use This Skill

✅ **Use this skill when:**
- "Configure daily sync schedule"
- "Enable delta sync mode"
- "Set batch size to 50 tables"
- "Schedule sync to run at midnight"
- "Configure parallel processing"

❌ **Don't use this skill for:**
- Defining which tables to sync (use `semantic-layer-scope`)
- Configuring validation rules (use `semantic-layer-validation`)
- Setting up notifications (use `semantic-layer-notifications`)

## Configuration Section

This skill manages the `sync` section of `config.yaml`:

```yaml
sync:
  mode: string                          # "full", "delta", "incremental"
  schedule: string                      # Cron expression or interval
  batch_size: int                       # Tables per batch
  parallel_workers: int                 # Number of parallel workers
  retry_on_failure: bool
  max_retries: int
  retry_delay: string                   # e.g., "5m", "1h"
  dry_run_by_default: bool
  auto_commit: bool
  checkpoint_enabled: bool
  checkpoint_interval: int              # Save state every N tables
```

## Sync Modes

| Mode | Behavior | Performance | Use Case | Data Freshness |
|------|----------|-------------|----------|----------------|
| `full` | Process all tables every run | Slow | Initial setup, comprehensive updates | Complete |
| `delta` | Process only changed tables | Fast | Production, frequent runs | Recent changes |
| `incremental` | Process new tables only | Very fast | Append-only scenarios | New data only |

### Full Sync

```yaml
sync:
  mode: "full"
  schedule: "0 2 * * 0"  # Weekly, Sunday 2 AM
```

**When to use:**
- Initial setup
- Major configuration changes
- Quarterly comprehensive refreshes
- After schema migrations

### Delta Sync

```yaml
sync:
  mode: "delta"
  schedule: "0 2 * * *"  # Daily at 2 AM
  delta_detection:
    method: "timestamp"   # or "checksum", "version"
    compare_field: "last_modified"
```

**When to use:**
- Production environments
- Daily/hourly syncs
- Large databases
- Frequent schema changes

### Incremental Sync

```yaml
sync:
  mode: "incremental"
  schedule: "0 * * * *"  # Hourly
```

**When to use:**
- Real-time metadata updates
- Append-only tables
- Event-driven architectures

## Common Operations

### 1. Configure Daily Sync

```yaml
sync:
  mode: "delta"
  schedule: "0 2 * * *"              # Daily at 2 AM
  batch_size: 100
  parallel_workers: 4
  retry_on_failure: true
  max_retries: 3
```

**User Request**: "Run semantic layer sync daily at 2 AM"

### 2. Configure Batch Processing

```yaml
sync:
  mode: "delta"
  batch_size: 50                     # Process 50 tables at a time
  parallel_workers: 2                # 2 parallel workers per batch
  checkpoint_enabled: true
  checkpoint_interval: 50            # Save state every 50 tables
```

**User Request**: "Process tables in batches of 50 with checkpointing"

### 3. Enable Parallel Processing

```yaml
sync:
  mode: "delta"
  parallel_workers: 8                # 8 parallel workers
  parallel_mode: "table"             # or "database", "field"
  max_concurrent_queries: 10
```

**User Request**: "Enable parallel processing with 8 workers"

### 4. Configure Retry Logic

```yaml
sync:
  retry_on_failure: true
  max_retries: 5
  retry_delay: "5m"                  # Wait 5 minutes between retries
  retry_backoff: "exponential"       # Exponential backoff
  retry_on_errors:
    - "connection_timeout"
    - "rate_limit"
```

**User Request**: "Retry failed tables up to 5 times with exponential backoff"

### 5. Configure Hourly Sync

```yaml
sync:
  mode: "delta"
  schedule: "0 * * * *"              # Every hour
  batch_size: 20
  parallel_workers: 2
  max_runtime: "45m"                 # Timeout after 45 minutes
```

**User Request**: "Run sync every hour, timeout after 45 minutes"

### 6. Manual Sync Only

```yaml
sync:
  mode: "delta"
  schedule: null                     # No automatic schedule
  dry_run_by_default: true          # Dry-run by default
  auto_commit: false                # Never auto-commit
```

**User Request**: "Disable automatic sync, require manual execution"

## Scheduling Examples

### Cron Expressions

```yaml
# Every day at 2 AM
schedule: "0 2 * * *"

# Every Monday at 3 AM
schedule: "0 3 * * 1"

# Every 6 hours
schedule: "0 */6 * * *"

# Every hour during business hours (9 AM - 5 PM)
schedule: "0 9-17 * * *"

# First day of month at midnight
schedule: "0 0 1 * *"

# Every weekday at 2 AM
schedule: "0 2 * * 1-5"
```

### Interval-Based

```yaml
# Every 30 minutes
schedule: "interval:30m"

# Every 2 hours
schedule: "interval:2h"

# Every 12 hours
schedule: "interval:12h"
```

## Performance Settings

### Optimize for Large Databases

```yaml
sync:
  mode: "delta"
  batch_size: 100                    # Larger batches
  parallel_workers: 8                # More workers
  parallel_mode: "database"          # Parallelize by database
  checkpoint_enabled: true
  checkpoint_interval: 100
  memory_limit: "8GB"
  query_timeout: "30m"
```

### Optimize for Speed

```yaml
sync:
  mode: "delta"
  batch_size: 200
  parallel_workers: 16
  cache_enabled: true
  cache_ttl: "1h"
  skip_validation: false             # Still validate!
  optimize_for: "speed"
```

### Optimize for Reliability

```yaml
sync:
  mode: "delta"
  batch_size: 20                     # Smaller batches
  parallel_workers: 2                # Fewer workers
  checkpoint_enabled: true
  checkpoint_interval: 10            # Frequent checkpoints
  retry_on_failure: true
  max_retries: 5
  optimize_for: "reliability"
```

## Examples

### Example 1: Production Environment - Daily Sync

```yaml
sync:
  mode: "delta"
  schedule: "0 2 * * *"              # Daily at 2 AM
  batch_size: 100
  parallel_workers: 4
  parallel_mode: "database"

  # Reliability
  retry_on_failure: true
  max_retries: 3
  retry_delay: "5m"
  retry_backoff: "exponential"

  # Checkpointing
  checkpoint_enabled: true
  checkpoint_interval: 100

  # Timeouts
  max_runtime: "2h"
  query_timeout: "10m"

  # Commit behavior
  auto_commit: false                 # Require approval
  dry_run_by_default: false
```

**Use Case**: Production environment with daily sync and reliability features

### Example 2: Development Environment - Manual Sync

```yaml
sync:
  mode: "full"
  schedule: null                     # No automatic schedule
  batch_size: 20
  parallel_workers: 1                # Single worker for debugging

  # Manual control
  dry_run_by_default: true          # Always dry-run first
  auto_commit: false                # Never auto-commit
  interactive_mode: true            # Prompt for confirmation

  # Fast failure
  retry_on_failure: false
  max_runtime: "30m"
```

**Use Case**: Development environment with manual control

### Example 3: Real-Time Sync - Hourly Updates

```yaml
sync:
  mode: "delta"
  schedule: "0 * * * *"              # Every hour
  batch_size: 50
  parallel_workers: 4

  # Fast execution
  max_runtime: "45m"                 # Must complete in 45 min
  query_timeout: "5m"
  optimize_for: "speed"

  # Delta detection
  delta_detection:
    method: "timestamp"
    compare_field: "last_modified"
    lookback_window: "2h"            # Check last 2 hours

  # Auto-commit for speed
  auto_commit: true
  dry_run_by_default: false
```

**Use Case**: Real-time environment with hourly updates

## Delta Detection

### Timestamp-Based

```yaml
sync:
  mode: "delta"
  delta_detection:
    method: "timestamp"
    compare_field: "last_modified"
    lookback_window: "24h"           # Check last 24 hours
```

### Checksum-Based

```yaml
sync:
  mode: "delta"
  delta_detection:
    method: "checksum"
    algorithm: "md5"                 # or "sha256"
    include_fields:
      - schema
      - column_names
      - column_types
```

### Version-Based

```yaml
sync:
  mode: "delta"
  delta_detection:
    method: "version"
    version_field: "schema_version"
    version_comparison: "greater_than"
```

## Testing

### Test Sync Configuration

```bash
# Dry-run to test config
python semantic_layer_sync.py --config config.yaml --dry-run

# Validate sync settings
python semantic_layer_sync.py --config config.yaml --validate-sync-config

# Test with single table
python semantic_layer_sync.py --config config.yaml --test-table customers.users
```

### Performance Testing

```bash
# Measure sync performance
python semantic_layer_sync.py --config config.yaml --apply --profile

# Test different batch sizes
for size in 10 50 100 200; do
  python semantic_layer_sync.py --config config.yaml --batch-size $size --profile
done
```

### Monitor Sync Execution

```sql
-- Sync execution history
SELECT
    run_id,
    started_at,
    completed_at,
    duration,
    tables_processed,
    mode,
    status
FROM semantic_layer_v1.sync_runs
ORDER BY started_at DESC
LIMIT 20;
```

## Best Practices

### 1. Use Delta Mode in Production

```yaml
# Good: Delta mode for efficiency
sync:
  mode: "delta"
  schedule: "0 2 * * *"

# Avoid: Full mode daily (too slow)
sync:
  mode: "full"
  schedule: "0 2 * * *"
```

### 2. Set Appropriate Batch Sizes

```yaml
# Small databases (< 100 tables)
batch_size: 50

# Medium databases (100-1000 tables)
batch_size: 100

# Large databases (> 1000 tables)
batch_size: 200
```

### 3. Enable Checkpointing

```yaml
sync:
  checkpoint_enabled: true
  checkpoint_interval: 100           # Every 100 tables
```

**Why**: Allows resuming from failure point, not starting over

### 4. Configure Reasonable Timeouts

```yaml
sync:
  max_runtime: "2h"                  # Total sync timeout
  query_timeout: "10m"               # Per-query timeout
```

### 5. Use Exponential Backoff

```yaml
sync:
  retry_on_failure: true
  retry_backoff: "exponential"       # Not linear
  max_retries: 5
```

**Why**: Prevents overwhelming systems during failures

### 6. Separate Dev and Prod Configs

```yaml
# config.dev.yaml
sync:
  mode: "full"
  schedule: null                     # Manual only
  dry_run_by_default: true

# config.prod.yaml
sync:
  mode: "delta"
  schedule: "0 2 * * *"              # Daily
  dry_run_by_default: false
```

## Performance Tuning

### Parallel Processing Impact

| Workers | Tables/Hour | CPU Usage | Memory Usage | Recommendation |
|---------|-------------|-----------|--------------|----------------|
| 1 | 100 | 25% | 2 GB | Development |
| 2 | 180 | 40% | 3 GB | Small prod |
| 4 | 320 | 70% | 5 GB | Medium prod |
| 8 | 500 | 90% | 8 GB | Large prod |
| 16 | 600 | 95% | 12 GB | Very large |

### Batch Size Impact

| Batch Size | Memory/Batch | Checkpoint Frequency | Recovery Time |
|------------|--------------|---------------------|---------------|
| 20 | 500 MB | Every 20 tables | Fast |
| 50 | 1 GB | Every 50 tables | Medium |
| 100 | 2 GB | Every 100 tables | Slower |
| 200 | 4 GB | Every 200 tables | Slow |

## Troubleshooting

### Sync Taking Too Long

**Problem**: Sync not completing within time window

**Solution**:
1. Increase `parallel_workers`
2. Increase `batch_size`
3. Switch to `delta` mode
4. Reduce scope (fewer tables)
5. Optimize database queries
6. Check network latency

### Sync Failing with Errors

**Problem**: Sync repeatedly failing

**Solution**:
1. Check error logs
2. Enable `retry_on_failure: true`
3. Reduce `batch_size` (smaller batches)
4. Reduce `parallel_workers` (less concurrency)
5. Check database connection limits
6. Verify table permissions

### Checkpoints Not Working

**Problem**: Sync restarting from beginning after failure

**Solution**:
1. Verify `checkpoint_enabled: true`
2. Check checkpoint storage location
3. Verify write permissions
4. Check `checkpoint_interval` is reasonable
5. Review checkpoint logs

### Schedule Not Running

**Problem**: Scheduled sync not executing

**Solution**:
1. Verify cron expression is correct
2. Check scheduler is running
3. Review scheduler logs
4. Test cron expression: https://crontab.guru
5. Verify timezone settings
6. Check system resources

## Integration

### With Monitoring

```yaml
sync:
  mode: "delta"
  schedule: "0 2 * * *"

  # Monitoring hooks
  monitoring:
    enabled: true
    metrics_endpoint: "http://monitoring.company.com/metrics"
    log_level: "INFO"
```

### With Notifications

```yaml
sync:
  mode: "delta"
  schedule: "0 2 * * *"

notifications:
  slack:
    enabled: true
    notify_on:
      - sync_started
      - sync_completed
      - sync_failed
```

### With Approval

```yaml
sync:
  mode: "delta"
  auto_commit: false                 # Don't auto-commit

approval:
  enabled: true
  require_approval_for:
    - pii_category
```

## CLI Commands

```bash
# Run sync with config
python semantic_layer_sync.py --config config.yaml --apply

# Override sync mode
python semantic_layer_sync.py --config config.yaml --mode full --apply

# Override batch size
python semantic_layer_sync.py --config config.yaml --batch-size 50 --apply

# Override parallel workers
python semantic_layer_sync.py --config config.yaml --workers 8 --apply

# Dry-run
python semantic_layer_sync.py --config config.yaml --dry-run

# Test schedule
python semantic_layer_sync.py --config config.yaml --test-schedule

# View sync history
tdx query "SELECT * FROM semantic_layer_v1.sync_runs ORDER BY started_at DESC LIMIT 10"

# View performance metrics
tdx query "
  SELECT
    mode,
    AVG(duration) as avg_duration,
    AVG(tables_processed) as avg_tables,
    AVG(tables_processed / EXTRACT(EPOCH FROM duration) * 60) as tables_per_minute
  FROM semantic_layer_v1.sync_runs
  WHERE status = 'completed'
  GROUP BY mode
"
```

## Monitoring Queries

### Sync Performance

```sql
-- Recent sync performance
SELECT
    run_id,
    mode,
    started_at,
    duration,
    tables_processed,
    ROUND(tables_processed / EXTRACT(EPOCH FROM duration) * 60, 2) as tables_per_minute,
    status
FROM semantic_layer_v1.sync_runs
ORDER BY started_at DESC
LIMIT 20;
```

### Failure Analysis

```sql
-- Sync failures
SELECT
    DATE_TRUNC('day', started_at) as date,
    mode,
    COUNT(*) as total_runs,
    SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_runs,
    ROUND(100.0 * SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) / COUNT(*), 2) as failure_rate
FROM semantic_layer_v1.sync_runs
GROUP BY DATE_TRUNC('day', started_at), mode
ORDER BY date DESC;
```

## Related Skills

- **semantic-layer-scope** - Define what to sync
- **semantic-layer-validation** - Validate synced metadata
- **semantic-layer-notifications** - Get notified of sync events
- **semantic-layer-testing** - Test sync configuration
- **semantic-config-master-skill** - Manage all config sections

---

**Status**: ✅ Production Ready
**Skill Type**: Focused / Single-Responsibility
**Last Updated**: 2026-02-16
