# Semantic Layer Sync Tool

**Automate metadata population in Treasure Data with heuristic-based description generation, tagging, and PII detection.**

## Quick Start

### 1. Setup

```bash
# Install dependencies
pip install -r requirements.txt

# Authenticate (if not already done)
tdx auth setup
```

### 2. Create metadata database in TD

```bash
# This creates 11 metadata tables (field_metadata, glossary, lineage, etc.)
tdx query < 01_create_semantic_database.sql
```

### 3. Configure your data

Edit `config.yaml` to specify which databases/tables to process:

```yaml
scope:
  databases:
    - name: "your_database"
      all_tables: true  # or specify specific tables
```

### 4. Run sync

```bash
# Preview (dry-run)
python semantic_layer_sync.py --config config.yaml --dry-run

# Apply changes
python semantic_layer_sync.py --config config.yaml --apply --approve
```

## What It Does

### Auto-generates for each field:

✅ **Descriptions** - Based on field naming patterns  
✅ **Tags** - Semantic classification (ID, metric, timestamp, etc.)  
✅ **PII Detection** - Email, phone, names, address, DOB  
✅ **Classification** - Marks sensitive fields  

### Example output:

```
Field: customer_id
  Description: [AUTO] Identifier for customer
  Tags: [ID]
  Is PII: false

Field: email  
  Description: Customer email address
  Tags: [contact_info, pii]
  Is PII: true
  PII Category: email

Field: membership_points
  Description: [AUTO] Numeric metric for membership
  Tags: [metric]
  Is PII: false
```

### Key features:

- ✅ Zero cost (no external APIs)
- ✅ Preserves existing manual descriptions
- ✅ Marks auto-generated content with [AUTO] prefix
- ✅ Configurable overwrite rules (default: never overwrite)
- ✅ Fast pattern-based matching
- ✅ 11 comprehensive metadata tables
- ✅ PII detection and categorization
- ✅ Workflow lineage detection

## Configuration

### Main settings (config.yaml)

```yaml
# Semantic layer database
semantic_database:
  name: "semantic_layer_v1"

# What to process
scope:
  databases:
    - name: "gld_cstore_prod"
      all_tables: true

# Auto-generation settings
auto_generation:
  enabled: true
  
  content_rules:
    overwrite_existing: false  # Never overwrite manual content
    prefix_auto_generated: "[AUTO]"
  
  generate:
    field_descriptions: true
    tags: true
    pii_detection: true
```

### Data dictionary (data_dictionary.yaml)

Define tables and fields:

```yaml
tables:
  your_database.your_table:
    description: "What this table contains"
    owner: "team-name"
    fields:
      - name: customer_id
        description: ""  # Auto-generation fills this
        type: string
        tags: []
        is_pii: false

glossary:
  - term: "Customer Lifetime Value"
    definition: "Total predicted revenue..."
    abbreviation: "CLV"
    owner: "analytics-team"
```

## Auto-generation Patterns

Built-in patterns detect:

| Pattern | Detects | Example |
|---------|---------|---------|
| `*_id` | ID fields | customer_id, order_id |
| `^is_*` | Boolean flags | is_active, is_deleted |
| `*_at` | Timestamps | created_at, updated_at |
| `email` | Email fields | email, secondary_email |
| `phone` | Phone numbers | phone_number |
| `*_name` | Names | first_name, last_name |
| `*_amount\|*_balance` | Metrics | total_balance, order_amount |
| `*_status` | Dimensions | membership_status |

### Add custom patterns

Edit `config.yaml`:

```yaml
auto_generation:
  strategies:
    - type: "naming_convention"
      patterns:
        - pattern: "^risk_.*"
          inferred_tag: "risk_metric"
          inferred_description: "Risk-related metric"
```

## Metadata Tables

After running, your semantic_layer_v1 database contains:

### field_metadata
Field-level documentation with descriptions, tags, PII, ownership

### glossary
Business term definitions and relationships

### field_lineage
Source → transformation → golden field lineage

### field_relationships
Join relationships and foreign keys

### field_usage
Query statistics and deprecation tracking

### governance
Data classification, retention, SLAs

And 5 more tracking tables for complete metadata coverage.

## Usage Examples

### Process single database

```bash
python semantic_layer_sync.py --config config.yaml --apply --approve
```

### Dry-run to preview

```bash
python semantic_layer_sync.py --config config.yaml --dry-run
```

### Verbose logging

```bash
python semantic_layer_sync.py --config config.yaml --apply --approve -v
```

### Skip apply, just validate

```bash
python semantic_layer_sync.py --config config.yaml --validate-only
```

## Test Results

See `AUTOGEN_TEST_RESULTS.md` for a complete test run on the loyalty_profile table showing:

- 28/30 fields auto-generated
- 56 field_metadata records inserted
- 5 glossary terms inserted
- All with [AUTO] prefix marking
- 100% success rate

## Troubleshooting

### Metadata table not found

```bash
# Verify table exists
tdx describe semantic_layer_v1.field_metadata

# If missing, recreate
tdx query < 01_create_semantic_database.sql
```

### No descriptions auto-generated

Check:
1. `auto_generation.enabled: true` in config.yaml
2. Fields don't have existing descriptions (if `overwrite_existing: false`)
3. Run with `-v` flag to see which patterns matched

### PII not detected

Add field name patterns to `config.yaml` if they don't match defaults:

```yaml
auto_generation:
  strategies:
    - type: "naming_convention"
      patterns:
        - pattern: "^my_custom_pii_.*"
          inferred_tag: "pii"
```

## Next Steps

1. **Review results**: Query metadata tables to validate
2. **Customize patterns**: Add domain-specific patterns
3. **Schedule syncs**: Run periodically to keep metadata fresh
4. **Integrate**: Use metadata in data governance workflows

## References

- **SKILL.md** - Detailed feature documentation
- **AUTO_GENERATION_GUIDE.md** - In-depth guide
- **AUTOGEN_TEST_RESULTS.md** - Complete test results
- **config.yaml** - Configuration template
- **data_dictionary.yaml** - Data structure template

---

**Status**: ✅ Production Ready  
**Version**: 1.0.0  
**Last Updated**: 2026-02-15
