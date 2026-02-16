# Dynamic Workflow Generation Approach

This document explains how to make TD Workflows inherit scheduling from config.yaml.

## Architecture Overview

```
User Updates Schedule in UI
    ↓
Config API saves to config.yaml
    ↓
Webhook/Event triggers workflow-generator
    ↓
workflow-generator.py reads config.yaml
    ↓
Generates/updates semantic_layer_sync.dig
    ↓
Automatically pushes to TD via tdx wf push
    ↓
TD Workflow schedule updated
```

## Implementation Components

### 1. Workflow Generator Script

**File: `workflow-generator.py`**

```python
#!/usr/bin/env python3
"""
Generates TD Workflow .dig file from config.yaml
Automatically syncs schedule changes to Treasure Data
"""

import yaml
import subprocess
import os
from typing import Dict, Any

def load_config(config_path: str = "config.yaml") -> Dict[str, Any]:
    """Load semantic layer config"""
    with open(config_path, 'r') as f:
        return yaml.safe_load(f)

def generate_schedule_block(schedule_config: Dict[str, Any]) -> str:
    """
    Generate digdag schedule block from config

    Input config.yaml:
      sync:
        schedule:
          enabled: true
          frequency: "daily"  # or "hourly", "weekly", "custom"
          time: "02:00:00"
          cron_expression: "0 */6 * * *"  # for custom

    Output .dig schedule block
    """
    if not schedule_config.get('enabled', False):
        return "# Manual execution only - no schedule\n"

    frequency = schedule_config.get('frequency', 'manual')

    if frequency == 'manual':
        return "# Manual execution only\n"

    elif frequency == 'hourly':
        return "schedule:\n  hourly>: 00:00\n"

    elif frequency == 'daily':
        time = schedule_config.get('time', '02:00:00')
        return f"schedule:\n  daily>: {time}\n"

    elif frequency == 'weekly':
        time = schedule_config.get('time', '02:00:00')
        day = schedule_config.get('day_of_week', 'Monday')
        return f"schedule:\n  weekly>: {day},{time}\n"

    elif frequency == 'custom':
        cron = schedule_config.get('cron_expression', '0 2 * * *')
        return f"schedule:\n  cron>: \"{cron}\"\n"

    else:
        raise ValueError(f"Unknown frequency: {frequency}")

def generate_workflow_file(config: Dict[str, Any], output_path: str = "semantic_layer_sync.dig"):
    """Generate complete .dig workflow file"""

    sync_config = config.get('sync', {})
    schedule_config = sync_config.get('schedule', {})
    notifications = config.get('notifications', {})

    # Generate schedule block
    schedule_block = generate_schedule_block(schedule_config)

    # Generate notification block
    error_notification = ""
    if notifications.get('on_error', {}).get('enabled', False):
        channels = notifications['on_error'].get('channels', [])
        for channel in channels:
            if channel['type'] == 'slack':
                webhook = channel.get('channel', '${secret:slack_webhook}')
                error_notification = f"""
_error:
  slack:
    webhook_url: {webhook}
    message: |
      ❌ Semantic Layer Sync Failed
      Session: ${{session_id}}
      Attempt: ${{attempt_id}}
      Workflow: ${{workflow_name}}
"""

    # Determine sync mode
    sync_mode = sync_config.get('sync_mode', 'full')

    # Build .dig file content
    dig_content = f"""# ============================================================================
# Semantic Layer Sync Workflow
# Generated automatically from config.yaml
# DO NOT EDIT MANUALLY - Changes will be overwritten
# ============================================================================

timezone: UTC

{schedule_block}
_export:
  td:
    database: {config['semantic_database']['name']}
  py:
    python: python3
{error_notification}

# ============================================================================
# Workflow Tasks
# ============================================================================

+detect_changes:
  py>: tasks.detect_schema_changes
  database: ${{td.database}}
  golden_pattern: "{','.join(config['scope']['databases'])}"
  sync_mode: "{sync_mode}"
  docker:
    image: "python:3.9"
  _env:
    TD_API_KEY: ${{secret:td_api_key}}
    TD_API_SERVER: ${{secret:td_api_server}}

+check_changes:
  if>: ${{detect_changes.has_changes}}
  _do:
    +sync_metadata:
      sh>: python semantic_layer_sync.py --config config.yaml --apply --approve -v
      docker:
        image: "python:3.9"
      _env:
        TD_API_KEY: ${{secret:td_api_key}}
        TD_API_SERVER: ${{secret:td_api_server}}

    +generate_report:
      td>: queries/delta_report.sql
      database: ${{td.database}}
      store_last_results: true
"""

    # Add success notification if enabled
    if notifications.get('on_sync_complete', {}).get('enabled', False):
        channels = notifications['on_sync_complete'].get('channels', [])
        for channel in channels:
            if channel['type'] == 'slack':
                webhook = channel.get('channel', '${secret:slack_webhook}')
                dig_content += f"""
    +notify_success:
      slack:
        webhook_url: {webhook}
        message: |
          ✅ Semantic Layer Synced
          New Tables: ${{sync_metadata.new_tables}}
          New Columns: ${{sync_metadata.new_columns}}
          Auto-Generated: ${{sync_metadata.auto_gen_count}}
"""

    # Add no-changes branch
    dig_content += """
+no_changes:
  if>: ${!detect_changes.has_changes}
  _do:
    echo>: "No schema changes detected. Skipping sync."
"""

    # Write to file
    with open(output_path, 'w') as f:
        f.write(dig_content)

    print(f"✅ Generated workflow file: {output_path}")
    return output_path

def push_workflow_to_td(workflow_path: str, project_name: str = "semantic_layer_sync"):
    """Push generated workflow to Treasure Data"""

    # Check if workflow file exists
    if not os.path.exists(workflow_path):
        raise FileNotFoundError(f"Workflow file not found: {workflow_path}")

    # Check if tdx is installed
    result = subprocess.run(['which', 'tdx'], capture_output=True)
    if result.returncode != 0:
        raise EnvironmentError("tdx CLI not found. Please install tdx.")

    # Push workflow
    print(f"📤 Pushing workflow to TD project: {project_name}")
    result = subprocess.run(
        ['tdx', 'wf', 'push', project_name],
        cwd=os.path.dirname(workflow_path) or '.',
        capture_output=True,
        text=True
    )

    if result.returncode == 0:
        print(f"✅ Workflow pushed successfully")
        print(result.stdout)
        return True
    else:
        print(f"❌ Failed to push workflow")
        print(result.stderr)
        return False

def main():
    """Main entry point"""
    import argparse

    parser = argparse.ArgumentParser(description='Generate TD Workflow from config.yaml')
    parser.add_argument('--config', default='config.yaml', help='Path to config.yaml')
    parser.add_argument('--output', default='semantic_layer_sync.dig', help='Output .dig file')
    parser.add_argument('--push', action='store_true', help='Automatically push to TD')
    parser.add_argument('--project', default='semantic_layer_sync', help='TD workflow project name')

    args = parser.parse_args()

    # Load config
    print(f"📖 Loading config from {args.config}")
    config = load_config(args.config)

    # Generate workflow
    print(f"⚙️  Generating workflow...")
    workflow_path = generate_workflow_file(config, args.output)

    # Push to TD if requested
    if args.push:
        push_workflow_to_td(workflow_path, args.project)
    else:
        print(f"\n💡 To push to TD, run:")
        print(f"   python workflow-generator.py --config {args.config} --push")

if __name__ == '__main__':
    main()
```

### 2. Config API Integration

**Update the Config UI backend API to trigger workflow generation:**

```typescript
// Backend API endpoint (Node.js/Express example)
app.post('/api/semantic-layer/config', async (req, res) => {
  const config = req.body;

  // 1. Validate config
  const validation = validateConfig(config);
  if (!validation.valid) {
    return res.status(400).json({ error: validation.errors });
  }

  // 2. Save config.yaml
  await fs.writeFile('config.yaml', yaml.dump(config));

  // 3. If schedule changed, regenerate workflow
  const scheduleChanged = hasScheduleChanged(config);
  if (scheduleChanged) {
    console.log('Schedule changed - regenerating workflow...');

    const result = await exec('python workflow-generator.py --config config.yaml --push');

    if (result.code !== 0) {
      console.error('Failed to update workflow:', result.stderr);
      return res.status(500).json({
        error: 'Config saved but workflow update failed',
        details: result.stderr
      });
    }
  }

  res.json({
    success: true,
    workflowUpdated: scheduleChanged
  });
});
```

### 3. Usage Flow

**Developer/User Perspective:**

```bash
# 1. User updates schedule in UI
#    - Changes frequency from "daily" to "hourly"
#    - Saves configuration

# 2. Backend automatically:
#    - Saves config.yaml
#    - Detects schedule change
#    - Runs: python workflow-generator.py --config config.yaml --push
#    - Pushes updated .dig file to TD

# 3. TD Workflow schedule updated
#    - No manual intervention required
#    - Next execution uses new schedule
```

**Manual Usage (for testing):**

```bash
# Generate workflow from config
python workflow-generator.py --config config.yaml

# Review generated file
cat semantic_layer_sync.dig

# Push to TD manually
tdx wf push semantic_layer_sync

# Or generate and push in one command
python workflow-generator.py --config config.yaml --push
```

### 4. Example Generated Workflow

**Input config.yaml:**
```yaml
sync:
  schedule:
    enabled: true
    frequency: "daily"
    time: "03:00:00"
  sync_mode: "delta"

scope:
  databases: ["gld_*", "golden_*"]

notifications:
  on_sync_complete:
    enabled: true
    channels:
      - type: slack
        channel: "https://hooks.slack.com/..."
```

**Generated semantic_layer_sync.dig:**
```yaml
timezone: UTC

schedule:
  daily>: 03:00:00

_export:
  td:
    database: semantic_layer_v1
  py:
    python: python3

_error:
  slack:
    webhook_url: https://hooks.slack.com/...
    message: |
      ❌ Semantic Layer Sync Failed
      Session: ${session_id}

+detect_changes:
  py>: tasks.detect_schema_changes
  database: ${td.database}
  golden_pattern: "gld_*,golden_*"
  sync_mode: "delta"
  # ... rest of workflow
```

## Pros and Cons

### Pros:
- ✅ Single source of truth (config.yaml)
- ✅ UI controls everything including schedule
- ✅ Automatic workflow updates
- ✅ Version control friendly (track config.yaml changes)
- ✅ Consistent configuration management

### Cons:
- ❌ More complex architecture
- ❌ Requires backend integration
- ❌ Workflow file is "generated" (can't manually edit)
- ❌ Additional error handling needed
- ❌ Requires workflow-generator script maintenance

## Deployment Considerations

1. **Version Control**
   - Check in config.yaml
   - Add `semantic_layer_sync.dig` to `.gitignore` (it's generated)
   - Check in workflow-generator.py

2. **CI/CD Integration**
   ```yaml
   # .github/workflows/deploy-semantic-layer.yml
   - name: Generate workflow
     run: python workflow-generator.py --config config.yaml --push
   ```

3. **Error Handling**
   - If workflow push fails, notify user
   - Keep backup of previous .dig file
   - Rollback capability

4. **Testing**
   - Test workflow generation locally
   - Validate generated .dig syntax
   - Test TD workflow execution

## Recommendation

**For most use cases, Option 1 (separate concerns) is better** because:
- Simpler architecture
- Standard TD Workflow pattern
- Easier to debug
- Less tooling complexity

**Use Option 2 (dynamic generation) only if:**
- You have many workflows to manage
- Schedule changes frequently
- You want a single control plane
- You have engineering resources to maintain the generator
