# Deployment & Integration Guide

## Overview

This guide covers deploying the semantic-layer-sync tool in your Treasure Data environment.

## Pre-requisites

- ✅ Treasure Data account with API access
- ✅ `tdx` CLI installed and authenticated
- ✅ Python 3.7+
- ✅ Git access to td-skills repo

## Installation

### 1. Clone or update the repository

```bash
cd /path/to/td-skills
git pull origin main

# Navigate to the tool
cd semantic-layer/semantic-layer-sync
```

### 2. Create Python environment (recommended)

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 3. Verify TD authentication

```bash
tdx databases  # Should list your databases
echo $TD_API_KEY  # Should show your API key
```

## Configuration

### Step 1: Create semantic layer database in TD

```bash
# One-time setup
tdx query < 01_create_semantic_database.sql

# Verify tables were created
tdx describe semantic_layer_v1.field_metadata
```

### Step 2: Configure for your environment

Edit `config.yaml`:

```yaml
# Set your database(s) to process
scope:
  databases:
    - name: "your_production_database"
      all_tables: true

# Customize auto-generation rules
auto_generation:
  enabled: true
  content_rules:
    overwrite_existing: false  # Safe default
```

### Step 3: Create or update data_dictionary.yaml

Option A: Auto-generate from existing schema

```bash
python annotate_table_schema.py --database your_database > data_dictionary.yaml
```

Option B: Use provided template and customize

```bash
cp data_dictionary.yaml data_dictionary.YOUR_DB.yaml
# Edit to match your tables/fields
```

## First Run (Test Mode)

### 1. Dry-run to preview

```bash
python semantic_layer_sync.py --config config.yaml --dry-run -v
```

This shows:
- Schema detection status
- What metadata will be generated
- Validation results
- No actual writes to TD

### 2. Review output

Check the report for:
- ✅ All expected tables detected
- ✅ Fields correctly parsed
- ✅ Tags assigned appropriately
- ⚠️ Any validation warnings
- ❌ Any errors to resolve

### 3. Fix any issues

- Add missing fields to data_dictionary.yaml
- Update naming conventions in config.yaml
- Resolve schema mismatches

## Production Deployment

### 1. Full test with actual write

```bash
# Small test first (single table)
python semantic_layer_sync.py --config config.yaml --apply --approve -v

# Verify data in TD
tdx query "SELECT COUNT(*) FROM semantic_layer_v1.field_metadata"
```

### 2. Review results in TD

```bash
# Check field metadata
tdx query "SELECT * FROM semantic_layer_v1.field_metadata LIMIT 10"

# Check for [AUTO] prefix
tdx query "SELECT field_name, description FROM semantic_layer_v1.field_metadata WHERE description LIKE '[AUTO]%'"
```

### 3. Full database deployment

```bash
# Update config.yaml for all databases
python semantic_layer_sync.py --config config.yaml --apply --approve

# Monitor execution
tail -f semantic_layer_sync.log
```

## Scheduling Regular Syncs

### Option 1: Treasure Workflow (digdag)

Create `sync_semantic_layer.dig`:

```yaml
_require:
  - name: semantic-layer-sync
    version: 1.0.0

+sync:
  td>: semantic_layer_v1
  query: |
    SELECT COUNT(*) FROM field_metadata
  # Can add metadata update queries here
```

### Option 2: Cron job

```bash
# Schedule weekly sync at 2 AM
crontab -e

0 2 * * 0 cd /path/to/semantic-layer-sync && python semantic_layer_sync.py --config config.yaml --apply --approve >> sync.log 2>&1
```

### Option 3: CI/CD pipeline

Add to your CI/CD (GitHub Actions, GitLab CI, etc.):

```yaml
- name: Sync Semantic Layer
  run: |
    cd semantic-layer/semantic-layer-sync
    pip install -r requirements.txt
    python semantic_layer_sync.py --config config.yaml --apply --approve
  env:
    TD_API_KEY: ${{ secrets.TD_API_KEY }}
```

## Monitoring & Maintenance

### Check sync history

```bash
tdx query "SELECT * FROM semantic_layer_v1.sync_history ORDER BY synced_at DESC LIMIT 20"
```

### Validate data quality

```bash
# Count fields with missing descriptions
tdx query "SELECT COUNT(*) FROM semantic_layer_v1.field_metadata WHERE description = ''"

# Find PII fields
tdx query "SELECT field_name, pii_category FROM semantic_layer_v1.field_metadata WHERE is_pii = 1"

# Check validation errors
tdx query "SELECT * FROM semantic_layer_v1.validation_errors ORDER BY created_at DESC"
```

### Update patterns as needed

If you notice fields not being tagged correctly:

1. Edit `config.yaml` patterns
2. Run dry-run to test: `python semantic_layer_sync.py --config config.yaml --dry-run`
3. Deploy when satisfied

## Troubleshooting Deployment

### Tables already exist

If getting "table already exists" error:

```bash
# Option 1: Use IF NOT EXISTS (recommended)
# Already in provided schema

# Option 2: Drop and recreate (caution!)
tdx query "DROP TABLE semantic_layer_v1.field_metadata"
tdx query < 01_create_semantic_database.sql
```

### API key issues

```bash
# Verify key is set
echo $TD_API_KEY

# Re-authenticate if needed
tdx auth setup

# Check permissions
tdx databases  # Should work if auth is correct
```

### Schema mismatch

If fields don't match between YAML and actual schema:

```bash
# Get actual schema
tdx describe your_database.your_table

# Update data_dictionary.yaml to match
# Run dry-run to verify
python semantic_layer_sync.py --config config.yaml --dry-run
```

### Performance issues

For large databases:

1. Process one table at a time
2. Increase query timeout in config.yaml
3. Consider disabling workflow lineage detection

```yaml
lineage_detection:
  enabled: false  # Skip if not needed
```

## Best Practices

✅ **Do:**
- Start with dry-run
- Test on subset first
- Keep data_dictionary.yaml in version control
- Document custom patterns
- Monitor sync_history table
- Schedule regular syncs

❌ **Don't:**
- Skip dry-run on first run
- Set `overwrite_existing: true` unless intended
- Deploy without testing patterns
- Mix manual and auto-generation without [AUTO] prefix
- Delete metadata tables directly

## Rollback Procedure

If something goes wrong:

### 1. Stop current sync

```bash
Ctrl+C to stop running process
```

### 2. Check sync_history

```bash
tdx query "SELECT * FROM semantic_layer_v1.sync_history WHERE status = 'FAILED'"
```

### 3. Revert to previous state

Option A: Restore from backup (if available)

```bash
# Requires backup strategy to be in place
```

Option B: Re-run with correct configuration

```bash
# Fix config, then re-run
python semantic_layer_sync.py --config config.yaml --apply --approve
```

## Support & Resources

- **SKILL.md** - Feature documentation
- **AUTO_GENERATION_GUIDE.md** - Detailed guide
- **README.md** - Quick start
- **AUTOGEN_TEST_RESULTS.md** - Example results
- **config.yaml** - Configuration reference

---

**Status**: ✅ Ready for Deployment  
**Version**: 1.0.0  
**Last Updated**: 2026-02-15
