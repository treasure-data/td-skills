---
name: semantic-layer-sync
description: Treasure Data semantic layer automation for syncing YAML definitions to TD metadata tables with heuristic-based auto-generation of descriptions, tags, and PII detection. Use when populating semantic layer metadata tables, auto-tagging fields, or detecting PII patterns.
---

# Semantic Layer Sync - Auto-Generation & Metadata Population

**Treasure Data Semantic Layer automation tool for syncing schema definitions from YAML to TD metadata tables with auto-generated descriptions, tags, and PII detection.**

## Overview

`semantic_layer_sync.py` is a comprehensive tool that:

1. **Manages semantic layer definitions** - Loads table/field definitions from YAML
2. **Auto-generates metadata** - Uses heuristic patterns to generate descriptions and tags
3. **Populates metadata tables** - Writes metadata to Treasure Data semantic layer tables
4. **Detects PII** - Automatically identifies and categorizes sensitive fields
5. **Validates schema** - Detects mismatches between YAML definitions and actual TD schema
6. **Tracks lineage** - Scans workflow files for data lineage
7. **Preserves existing data** - Never overwrites manual descriptions (configurable)

## Key Features

✅ **Heuristic-based auto-generation**
- Zero external API dependencies
- Fast pattern-matching (1-2 sec per field)
- Works offline completely

✅ **11 Metadata Tables**
- field_metadata - Field descriptions, tags, PII, ownership
- glossary - Business term definitions
- field_lineage - Source → transform → golden lineage
- governance - Data classification, retention, SLAs
- field_relationships - Foreign keys, joins, aggregations
- field_usage - Query statistics and deprecation tracking
- validation_errors - Validation issue tracking
- table_dependencies - Dependency graph
- impact_analysis - Downstream impact analysis
- sync_history - Audit log of all syncs
- config_versions - Configuration versioning

✅ **Content Preservation**
- Auto-generated content marked with `[AUTO]` prefix
- User-configurable overwrite rules (default: never overwrite)
- Distinguishes manual vs auto-generated content

✅ **PII Detection**
- Email, phone, names, address, DOB detection
- Automatic PII categorization
- Configurable patterns

✅ **Semantic Tagging**
- ID fields, timestamps, metrics, flags
- Dimension/fact table detection
- Custom pattern extensibility

## Installation

```bash
# Clone or navigate to the semantic-layer-sync directory
cd /path/to/semantic-layer-sync

# Install dependencies
pip install -r requirements.txt

# Authenticate with Treasure Data (if not already done)
tdx auth setup
```

## Configuration

### 1. Create semantic database in TD

```bash
# Using the provided schema
tdx query < 01_create_semantic_database.sql

# This creates 11 metadata tables in semantic_layer_v1 database
```

### 2. Configure config.yaml

```yaml
# Main settings
semantic_database:
  name: "semantic_layer_v1"

# Define what to process
scope:
  databases:
    - name: "your_database"
      tables:
        - table1
        - table2
      # or use "all_tables: true" to process all

# Enable auto-generation
auto_generation:
  enabled: true
  
  content_rules:
    overwrite_existing: false  # Default: never overwrite manual
    prefix_auto_generated: "[AUTO]"

  generate:
    field_descriptions: true
    table_descriptions: true
    tags: true
    pii_detection: true
```

### 3. Create data_dictionary.yaml

```yaml
tables:
  your_database.your_table:
    description: "Table description"
    owner: "team-name"
    fields:
      - name: customer_id
        description: ""  # Auto-generation will fill this
        tags: []
        is_pii: false
        pii_category: null
```

## Usage

### Dry-run (preview changes)
```bash
python semantic_layer_sync.py --config config.yaml --dry-run
```

Output shows:
- Schema detection results
- Auto-generated descriptions (with [AUTO] prefix)
- Validation report
- What would be written to TD (without applying)

### Apply changes
```bash
python semantic_layer_sync.py --config config.yaml --apply --approve
```

This:
1. Generates metadata for all fields
2. Inserts into semantic_layer_v1 tables
3. Writes to data_dictionary.yaml (updated with auto-generated content)
4. Shows final metadata table status

### With verbose logging
```bash
python semantic_layer_sync.py --config config.yaml --apply --approve -v
```

## Auto-Generation Patterns

The tool includes built-in heuristic patterns:

| Pattern | Detects | Tags | Description |
|---------|---------|------|-------------|
| `*_id$` | Identifier fields | ID | Auto-identifies primary/foreign keys |
| `^is_*` | Boolean flags | flag | Recognizes boolean indicators |
| `*_at$` | Timestamp fields | timestamp | Detects temporal fields |
| `*_date$` | Date fields | date | Date indicators |
| `email\|^mail` | Email fields | contact_info | Marks as PII: email |
| `phone\|^tel` | Phone numbers | contact_info | Marks as PII: phone |
| `^(first\|last)_name` | Names | personal_info | Marks as PII: name |
| `*_balance\|*_amount` | Numeric metrics | metric | Financial metrics |
| `*_status\|*_level` | Status fields | dimension | Categorical dimensions |

### Extend with custom patterns

Edit `config.yaml` to add custom patterns:

```yaml
auto_generation:
  strategies:
    - type: "naming_convention"
      patterns:
        - pattern: "^risk_.*"
          inferred_tag: "risk_metric"
          inferred_description: "Risk-related metric"
```

## Example Output

### Field Metadata (semantic_layer_v1.field_metadata)

```
database_name | table_name | field_name | description | tags | is_pii | pii_category
---|---|---|---|---|---|---
gld_cstore | loyalty | customer_id | [AUTO] Identifier for customer | [ID] | 0 | —
gld_cstore | loyalty | email | Customer email address | [contact_info, pii] | 1 | email
gld_cstore | loyalty | membership_points | [AUTO] Numeric metric for membership | [metric] | 0 | —
gld_cstore | loyalty | created_at | [AUTO] Timestamp field | [timestamp] | 0 | —
```

## Workflow Integration

### Automatic Lineage Detection

The tool scans `.dig` workflow files to detect data lineage:

```yaml
scope:
  lineage_detection:
    enabled: true
    workflow_paths:
      - "workflows/"
      - "dbt/models/"
```

## Best Practices

1. **Start with dry-run**
   - Always preview with `--dry-run` first
   - Review auto-generated descriptions
   - Verify PII detection accuracy

2. **Test on subset**
   - Test on a single database first
   - Verify results before scaling
   - Check 10-20 field samples

3. **Custom patterns**
   - Add domain-specific patterns for your organization
   - Document pattern rationale
   - Share patterns across team

4. **Version control**
   - Commit data_dictionary.yaml updates
   - Track config.yaml changes
   - Use sync_history table for audit trail

5. **Maintenance**
   - Run sync periodically (weekly/monthly)
   - Review failed generations
   - Update patterns as schema evolves

## Troubleshooting

### Only partial fields generated

**Problem**: Not all fields have descriptions after sync

**Solution**: Check:
1. `auto_generation.enabled: true` in config
2. Fields don't have existing descriptions (if `overwrite_existing: false`)
3. Check logs for field-specific errors
4. Verify patterns match your field naming conventions

### PII not detected

**Problem**: Sensitive fields not marked as PII

**Solution**:
1. Check field name matches PII patterns (email, phone, first_name, etc.)
2. Add custom PII patterns in config
3. Check `pii_detection: true` is enabled

### INSERT statements failing

**Problem**: "Failed to execute INSERT statement"

**Solution**:
1. Verify `semantic_layer_v1` database exists: `tdx tables semantic_layer_v1.field_metadata`
2. Check schema matches: `tdx describe semantic_layer_v1.field_metadata`
3. Run with `-v` flag to see full error messages
4. Check TD API key is set: `echo $TD_API_KEY`

### No changes applied in --apply mode

**Problem**: Sync completes but no data in metadata tables

**Solution**:
1. Check `--apply` flag is used (not just `--dry-run`)
2. Check `--approve` flag is provided
3. Verify INSERT statements were generated (check logs)
4. Check semantic database exists

## Data Quality Checks

The tool includes validation for:

- ✅ Field names match between YAML and actual schema
- ✅ Field types compatible with YAML definitions
- ✅ Required fields present (name, type)
- ✅ PII classifications sensible
- ✅ Tag suggestions realistic

Run validation:
```bash
python semantic_layer_sync.py --config config.yaml --validate-only
```

## Performance

- **Speed**: ~0.5-1 sec per field (heuristic generation)
- **Scalability**: 1000+ fields per database manageable
- **Memory**: <500MB for 100+ tables
- **Cost**: $0 (no external APIs)

## Output Files

After running with `--apply`:

1. **Updated data_dictionary.yaml**
   - Auto-generated descriptions added
   - [AUTO] prefix marks generated content
   - Ready for version control

2. **Semantic Layer Metadata Tables**
   - field_metadata - All field descriptions and tags
   - glossary - Business term definitions
   - field_lineage - Detected lineage relationships
   - sync_history - Audit trail of changes

3. **Logs**
   - Detailed execution logs
   - Error tracking
   - Performance metrics

## Advanced Usage

### Process multiple databases
```yaml
scope:
  databases:
    - name: "database1"
      all_tables: true
    - name: "database2"
      tables: [table1, table2]
```

### Custom validation rules
```yaml
validation:
  lenient_mode: true  # Warnings only, no errors
  skip_schema_detection: false
```

### Workflow lineage
```yaml
lineage_detection:
  enabled: true
  workflow_paths:
    - "workflows/"
    - "dbt/models/"
```

## Contributing

To extend the tool:

1. **Add new heuristic patterns**: Edit `config.yaml` patterns section
2. **Add new metadata tables**: Extend `schema_v1.sql`
3. **Custom generation logic**: Modify `AutoGenerator` class in Python
4. **Integration**: Use `populate_semantic_layer.py` as template

## References

- **Main Script**: `semantic_layer_sync.py`
- **Configuration Template**: `config.yaml`
- **Database Schema**: `01_create_semantic_database.sql`
- **Data Dictionary Template**: `data_dictionary.yaml`
- **Helper Scripts**: `annotate_table_schema.py`, `populate_semantic_layer.py`
- **Detailed Guide**: `AUTO_GENERATION_GUIDE.md`

## Support

For issues or questions:
1. Check AUTO_GENERATION_GUIDE.md for detailed documentation
2. Review AUTOGEN_TEST_RESULTS.md for test examples
3. Check troubleshooting section above
4. Review logs with `-v` verbose flag

---

**Status**: ✅ Production Ready  
**Last Updated**: 2026-02-15  
**Version**: 1.0.0
