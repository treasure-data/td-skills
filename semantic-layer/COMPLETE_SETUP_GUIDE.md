# Complete Setup Guide: Semantic Layer Config UI with Automatic Workflow Deployment

This guide explains how to set up the complete end-to-end solution where updating the schedule in the Config UI automatically deploys a new version of the TD Workflow.

## Architecture Overview

```
┌─────────────────────────────────────────────┐
│  1. User Updates Schedule in UI             │
│     - Changes frequency to "daily"          │
│     - Sets time to "03:00:00"               │
│     - Clicks Save                           │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│  2. Frontend (React)                        │
│     - POST /api/semantic-layer/config       │
│     - Body: { config, deploy_workflow }     │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│  3. Backend API (Flask)                     │
│     - Saves config.yaml                     │
│     - Runs workflow_generator.py --push     │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│  4. Workflow Generator (Python)             │
│     - Reads config.yaml                     │
│     - Generates semantic_layer_sync.dig     │
│     - Executes: tdx wf push                 │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│  5. Treasure Data                           │
│     - Workflow updated with new schedule    │
│     - Next execution uses new schedule      │
└─────────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│  6. UI Shows Success                        │
│     - "Configuration saved and workflow     │
│        deployed successfully"               │
└─────────────────────────────────────────────┘
```

## Prerequisites

- Node.js 16+ (for React frontend)
- Python 3.8+ (for backend and workflow generator)
- `tdx` CLI installed and configured
- Treasure Data account with API key

## Installation Steps

### Step 1: Clone and Setup Frontend

```bash
cd /Users/amit.erande/Documents/GitHub/td-skills/semantic-layer/Semantic-layer-Config-UI

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env

# Edit .env
cat > .env << 'EOF'
VITE_API_BASE_URL=http://localhost:5000/api
VITE_API_TIMEOUT=120000
EOF
```

### Step 2: Setup Backend API

```bash
# Create virtual environment
cd backend
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cat > .env << 'EOF'
CONFIG_PATH=../../semantic-layer-sync/config.yaml
WORKFLOW_GENERATOR_PATH=../../semantic-layer-sync/workflow_generator.py
WORKFLOW_PROJECT_NAME=semantic_layer_sync
PORT=5000
DEBUG=False
EOF
```

### Step 3: Configure Treasure Data

```bash
# Authenticate with TD
tdx auth setup

# Set your TD credentials
# Follow the prompts to enter your API key and endpoint

# Verify authentication
tdx databases --limit 5
```

### Step 4: Initialize Semantic Layer Database

```bash
cd ../semantic-layer-sync

# Create semantic layer database and tables
tdx query < 01_create_semantic_database.sql

# Verify
tdx tables semantic_layer_v1
```

### Step 5: Create Initial Configuration

```bash
# Create initial config.yaml
cat > config.yaml << 'EOF'
version: "1.0"
description: "Semantic Layer Configuration"

scope:
  databases:
    - "gld_*"
    - "golden_*"
  exclude_patterns:
    - "*.temp_*"
    - "*.staging_*"

definitions:
  data_dictionary_path: "data_dictionary.yaml"
  glossary_path: "glossary.md"
  relationships_path: "relationships.yaml"

semantic_database:
  name: "semantic_layer_v1"
  create_if_missing: true
  tables:
    field_metadata: "field_metadata"
    glossary: "glossary"
    field_lineage: "field_lineage"
    field_relationships: "field_relationships"
    field_usage: "field_usage"
    governance: "governance"
    sync_history: "sync_history"
    impact_analysis: "impact_analysis"

lineage:
  auto_detect:
    - type: "dbt"
      enabled: true
    - type: "workflow"
      enabled: true
    - type: "schema_changes"
      enabled: true
      track_new_tables: true
      track_new_columns: true
  confidence_thresholds:
    auto_detected_min: 0.7
    manual: 1.0
  generate_impact_analysis: true
  track_downstream_tables: true

conflict_handling:
  mode: "warn"
  auto_generate_for_missing: true
  overwrite_existing_descriptions: false
  on_schema_changes:
    new_fields: "warn"
    removed_fields: "warn"
    type_changes: "warn"

validation:
  require_table_description: false
  require_field_description: false
  require_owner_for_tables: false
  require_owner_for_pii_fields: true
  require_business_term_for_metrics: false
  pii_validation:
    require_pii_category: true
    require_owner: true
    require_data_classification: true
  custom_rules: []

auto_generation:
  enabled: true
  content_rules:
    prefix_auto_generated: "[AUTO]"
    overwrite_existing: false
    overwrite_auto_generated: true
    skip_fields_matching: []
  generate:
    field_descriptions: true
    tags: true
    pii_detection: true
    business_terms: false
    data_classification: true
  patterns: []

notifications:
  on_sync_complete:
    enabled: false
    channels: []
  on_error:
    enabled: false
    channels: []

approval:
  require_dry_run: false
  require_approval_for:
    field_removals: false
    type_changes: false
    owner_changes: false
    pii_reclassification: false
  auto_approve_for:
    description_updates: true
    tag_additions: true
    comment_updates: true

sync:
  merge_strategy: "manual_wins"
  create_backup: true
  dry_run_by_default: false
  audit_logging: true
  batch_size: 100
  sync_mode: "delta"
  schedule:
    enabled: false
    frequency: "manual"

testing:
  enabled: false
  sample_database: null
  report_level: "normal"
EOF
```

## Running the System

### Terminal 1: Start Backend API

```bash
cd Semantic-layer-Config-UI/backend
source venv/bin/activate
python api.py
```

You should see:
```
╔═══════════════════════════════════════════════════════════════╗
║  Semantic Layer Config API Server                             ║
╚═══════════════════════════════════════════════════════════════╝

📁 Config Path: ../../semantic-layer-sync/config.yaml
🔧 Workflow Generator: ../../semantic-layer-sync/workflow_generator.py
📦 Workflow Project: semantic_layer_sync
🌐 Port: 5000

Starting server...
```

### Terminal 2: Start Frontend

```bash
cd Semantic-layer-Config-UI
npm run dev
```

You should see:
```
  VITE v5.0.0  ready in 500 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

### Terminal 3: Monitor TD Workflows (Optional)

```bash
# Watch workflow sessions
watch -n 5 'tdx wf sessions semantic_layer_sync --limit 10'
```

## Usage Flow

### 1. Open the UI

Navigate to http://localhost:5173/

### 2. Configure Scope

- **Section**: Scope
- **Databases**: `gld_*`, `golden_*`
- **Exclude Patterns**: `*.temp_*`, `*.staging_*`

### 3. Enable Auto-Generation

- **Section**: Auto-Generation
- **Enabled**: ✅ Yes
- **Generate**: Descriptions, Tags, PII Detection
- **Overwrite Existing**: ❌ No (only fill missing)

### 4. Configure Schedule

- **Section**: Advanced → Sync Behavior
- **Sync Mode**: Delta (only new tables/columns)
- **Enable Scheduled Sync**: ✅ Yes
- **Frequency**: Daily
- **Time**: 03:00:00

### 5. Save Configuration

Click **Save** button

You'll see:
```
✅ Success!

Configuration saved and workflow deployed to Treasure Data.

Schedule: daily
```

### 6. Verify Workflow Deployment

```bash
# Check workflow project
tdx wf list

# Check workflow schedule
tdx wf sessions semantic_layer_sync --limit 5

# View generated workflow file
cat semantic-layer-sync/semantic_layer_sync.dig
```

You should see:
```yaml
timezone: UTC

schedule:
  daily>: 03:00:00

_export:
  td:
    database: semantic_layer_v1
  py:
    python: python3

+detect_schema_changes:
  py>: tasks.detect_schema_changes
  database: ${td.database}
  golden_pattern: "gld_*,golden_*"
  sync_mode: "delta"
  ...
```

## Testing the Complete Flow

### Test 1: Change Schedule Frequency

1. Open UI
2. Navigate to **Advanced → Sync Behavior**
3. Change **Frequency** from "Daily" to "Hourly"
4. Click **Save**
5. Verify: `cat semantic-layer-sync/semantic_layer_sync.dig` shows:
   ```yaml
   schedule:
     hourly>: 00:00
   ```

### Test 2: Enable Notifications

1. Open UI
2. Navigate to **Advanced → Notifications**
3. Enable **On Sync Complete**
4. Add Slack channel
5. Click **Save**
6. Verify: `.dig` file includes Slack notification block

### Test 3: Manual Workflow Run

```bash
# Trigger workflow manually
tdx wf run semantic_layer_sync --session now

# Monitor progress
tdx wf sessions semantic_layer_sync --limit 1

# Check logs
tdx wf logs semantic_layer_sync <session_id>
```

## Troubleshooting

### Issue: "Workflow deployment failed: tdx command not found"

**Solution:**
```bash
# Install tdx CLI
npm install -g @treasure-data/cli

# Or using pip
pip install pytd

# Verify installation
which tdx
tdx --version
```

### Issue: "Request timeout: API server took too long to respond"

**Solution:**
- Increase timeout in `.env`:
  ```
  VITE_API_TIMEOUT=180000  # 3 minutes
  ```
- Check TD API connectivity:
  ```bash
  tdx databases --limit 5
  ```

### Issue: "Config saved but workflow deployment failed"

**Solution:**
1. Check workflow generator script:
   ```bash
   python workflow_generator.py --config config.yaml --push --json
   ```

2. Manually push workflow:
   ```bash
   cd semantic-layer-sync
   tdx wf push semantic_layer_sync
   ```

3. Check backend logs for errors

### Issue: "Permission denied when running workflow_generator.py"

**Solution:**
```bash
chmod +x workflow_generator.py
```

## Advanced Configuration

### Custom Workflow Project Name

Edit backend `.env`:
```
WORKFLOW_PROJECT_NAME=my_custom_semantic_layer
```

### Multiple Environments

Create environment-specific configs:

```yaml
# config.yaml
environments:
  dev:
    scope:
      databases: ["dev_gld_*"]
    sync:
      schedule:
        frequency: "hourly"
  prod:
    scope:
      databases: ["gld_*"]
    sync:
      schedule:
        frequency: "daily"
        time: "02:00:00"
```

### CI/CD Integration

```yaml
# .github/workflows/deploy-semantic-layer.yml
name: Deploy Semantic Layer

on:
  push:
    branches: [main]
    paths:
      - 'config.yaml'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.9'

      - name: Install tdx
        run: npm install -g @treasure-data/cli

      - name: Configure TD credentials
        env:
          TD_API_KEY: ${{ secrets.TD_API_KEY }}
          TD_API_SERVER: ${{ secrets.TD_API_SERVER }}
        run: |
          tdx auth setup --apikey $TD_API_KEY --endpoint $TD_API_SERVER

      - name: Deploy Workflow
        run: |
          python workflow_generator.py --config config.yaml --push --json
```

## Monitoring and Maintenance

### Query Sync History

```sql
SELECT
  sync_time,
  status,
  tables_processed,
  fields_processed,
  fields_auto_generated,
  duration_seconds
FROM semantic_layer_v1.sync_history
ORDER BY sync_time DESC
LIMIT 20;
```

### Check for New Tables/Columns

```sql
SELECT
  table_name,
  column_name,
  created_at,
  CASE
    WHEN description LIKE '[AUTO]%' THEN 'Auto-Generated'
    ELSE 'Manual'
  END as metadata_source
FROM semantic_layer_v1.field_metadata
WHERE created_at > TD_TIME_ADD(TD_SCHEDULED_TIME(), '-1d')
  AND table_name LIKE 'gld_%'
ORDER BY created_at DESC;
```

### Monitor Workflow Executions

```bash
# List recent sessions
tdx wf sessions semantic_layer_sync --limit 20

# Get session details
tdx wf attempt semantic_layer_sync <session_id>

# View logs
tdx wf logs semantic_layer_sync <session_id>

# Check for failures
tdx wf sessions semantic_layer_sync --status error --limit 10
```

## Security Considerations

### API Key Management

**Never commit API keys to git:**

```bash
# .gitignore
.env
*.key
config.yaml  # if it contains secrets
```

**Use TD secrets for workflows:**

```bash
# Set secrets for workflow
tdx wf secrets set td_api_key <your_api_key>
tdx wf secrets set slack_webhook <your_webhook>

# List secrets
tdx wf secrets list
```

### Access Control

- Restrict backend API to internal network
- Use authentication middleware for production
- Enable HTTPS for production deployments

## Production Deployment

### Option 1: Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "5000:5000"
    environment:
      - CONFIG_PATH=/app/config.yaml
      - WORKFLOW_GENERATOR_PATH=/app/workflow_generator.py
    volumes:
      - ./semantic-layer-sync:/app
    env_file:
      - ./backend/.env

  frontend:
    build: ./Semantic-layer-Config-UI
    ports:
      - "3000:80"
    environment:
      - VITE_API_BASE_URL=http://backend:5000/api
    depends_on:
      - backend
```

### Option 2: Kubernetes

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for full Kubernetes manifests.

## Summary

You now have a complete end-to-end solution where:

1. ✅ Users configure schedules in the UI
2. ✅ Schedules are saved to config.yaml
3. ✅ Workflows are automatically generated and deployed
4. ✅ TD Workflow runs on the configured schedule
5. ✅ Delta detection only syncs new tables/columns
6. ✅ Auto-generation fills missing metadata
7. ✅ Users receive deployment status feedback

**Next Steps:**
- Customize validation rules
- Add custom auto-generation patterns
- Configure Slack notifications
- Set up monitoring dashboards
