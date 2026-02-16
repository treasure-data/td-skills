---
name: semantic-config-master-skill
description: Master skill for managing all aspects of TD semantic layer configuration including scope, patterns, PII, lineage, validation, notifications, and sync behavior. Use for comprehensive config management or when you need to manage multiple configuration areas at once.
---

# Semantic Config Master Skill

**Comprehensive Treasure Data semantic layer configuration management - controls all aspects of semantic layer automation, metadata generation, and data governance.**

## Overview

The **semantic-config-master-skill** is the original comprehensive skill that manages the entire `config.yaml` for semantic layer automation. Use this skill when you need to:

1. **Configure multiple areas simultaneously**
2. **Set up semantic layer from scratch**
3. **Review entire configuration**
4. **Make cross-cutting changes**
5. **Understand full system behavior**

## When to Use This Skill

✅ **Use the Master Skill when:**
- Setting up semantic layer for the first time
- Making changes across multiple configuration sections
- Reviewing or auditing entire configuration
- Troubleshooting complex cross-section issues
- Migrating configuration between environments

❌ **Use Focused Skills when:**
- Making targeted changes to one configuration area
- Adding/updating specific patterns, rules, or settings
- Focused operations (e.g., "add PII pattern" → use `semantic-layer-pii`)

## Focused Skills Available

For targeted configuration management, use these specialized skills:

| Skill | Purpose | When to Use |
|-------|---------|-------------|
| [semantic-layer-scope](skills/semantic-layer-scope.md) | Database/table selection | Include/exclude databases, define processing scope |
| [semantic-layer-lineage](skills/semantic-layer-lineage.md) | Lineage detection | Configure dbt/workflow lineage tracking |
| [semantic-layer-validation](skills/semantic-layer-validation.md) | Validation rules | Set field/table requirements, custom rules |
| [semantic-layer-patterns](skills/semantic-layer-patterns.md) | Auto-gen patterns | Add/update heuristic patterns for metadata |
| [semantic-layer-pii](skills/semantic-layer-pii.md) | PII detection | Configure PII patterns and categorization |
| [semantic-layer-tags](skills/semantic-layer-tags.md) | Semantic tagging | Manage tag taxonomy and assignment |
| [semantic-layer-conflicts](skills/semantic-layer-conflicts.md) | Merge strategies | Configure conflict resolution |
| [semantic-layer-notifications](skills/semantic-layer-notifications.md) | Alerts | Set up Slack/email notifications |
| [semantic-layer-approval](skills/semantic-layer-approval.md) | Approval workflow | Configure change approval requirements |
| [semantic-layer-sync-config](skills/semantic-layer-sync-config.md) | Sync behavior | Manage batch size, audit logging, backups |
| [semantic-layer-testing](skills/semantic-layer-testing.md) | Test mode | Configure test/debug settings |

## Configuration Structure

The master skill manages this complete `config.yaml` structure:

```yaml
# 1. Scope - What to process
scope:
  databases:
    - name: string
      tables: [string] | all_tables: bool
  exclude_patterns: [string]

# 2. Semantic Database
semantic_database:
  name: string
  write_enabled: bool

# 3. Lineage Detection
lineage:
  auto_detect:
    - type: "dbt" | "workflow" | "schema_comments"
  confidence_thresholds:
    high: 90
    medium: 70
    low: 50
  generate_impact_analysis: bool
  track_downstream_tables: bool

# 4. Validation Rules
validation:
  require_table_description: bool
  require_field_description: bool
  require_owner_for_tables: bool
  require_owner_for_pii_fields: bool
  pii_validation:
    require_pii_category: bool
    require_owner: bool
    require_data_classification: bool
  custom_rules:
    - field_pattern: string
      should_have_tag: string
      hint: string

# 5. Auto-Generation
auto_generation:
  enabled: bool
  content_rules:
    overwrite_existing: bool
    prefix_auto_generated: "[AUTO]"
  generate:
    field_descriptions: bool
    table_descriptions: bool
    tags: bool
    pii_detection: bool
  patterns:
    - name: string
      match:
        - pattern: regex
      tag: string
      description_template: string
      pii_category: string

# 6. Conflict Handling
conflict_handling:
  mode: "fail" | "warn" | "auto_generate"
  auto_generate_for_missing: bool
  overwrite_existing_descriptions: bool
  on_schema_changes:
    new_fields: "warn" | "error" | "ignore"
    removed_fields: "warn" | "error" | "ignore"
    type_changes: "warn" | "error" | "ignore"

# 7. Notifications
notifications:
  on_sync_complete:
    enabled: bool
    channels:
      - type: "slack" | "email"
        channel: string
        message_template: string
  on_error:
    enabled: bool
    channels:
      - type: "slack" | "email"
        recipients: [string]

# 8. Approval Workflow
approval:
  require_dry_run: bool
  require_approval_for:
    field_removals: bool
    type_changes: bool
    owner_changes: bool
    pii_reclassification: bool
  auto_approve_for:
    description_updates: bool
    tag_additions: bool
    comment_updates: bool

# 9. Sync Configuration
sync:
  merge_strategy: "manual_wins" | "auto_overwrites" | "merge_both"
  create_backup: bool
  dry_run_by_default: bool
  audit_logging: bool
  batch_size: int
  sync_mode: "full" | "delta"
  schedule:
    enabled: bool
    frequency: "hourly" | "daily" | "weekly" | "custom"
    cron: string

# 10. Testing
testing:
  enabled: bool
  sample_database: string
  report_level: "quiet" | "normal" | "verbose" | "debug"
```

## Key Features

### 1. **Complete Configuration Management**
- All 10 configuration sections in one place
- Cross-section validation and consistency checks
- Comprehensive documentation

### 2. **11 Metadata Tables**
- field_metadata - Field descriptions, tags, PII, ownership
- glossary - Business term definitions
- field_lineage - Source → transform → golden lineage
- governance - Data classification, retention, SLAs
- field_relationships - Foreign keys, joins, aggregations
- field_usage - Query statistics, deprecation tracking
- validation_errors - Validation issue tracking
- table_dependencies - Dependency graph
- impact_analysis - Downstream impact analysis
- sync_history - Audit log of all syncs
- config_versions - Configuration versioning

### 3. **Heuristic Auto-Generation**
- Zero external API dependencies
- 50+ built-in patterns
- Fast pattern-matching (1-2 sec per field)
- Works completely offline

### 4. **Content Preservation**
- Auto-generated content marked with `[AUTO]` prefix
- Configurable overwrite rules (default: never overwrite manual)
- Distinguishes manual vs auto-generated content

### 5. **PII Detection**
- Email, phone, names, address, DOB detection
- Automatic PII categorization
- Configurable patterns

### 6. **Semantic Tagging**
- ID fields, timestamps, metrics, flags
- Dimension/fact table detection
- Custom pattern extensibility

## Installation

```bash
# Navigate to the semantic-layer-sync directory
cd /path/to/semantic-layer-sync

# Install dependencies
pip install -r requirements.txt

# Authenticate with Treasure Data
tdx auth setup
```

## Configuration Setup

### 1. Create Semantic Database in TD

```bash
# Create the 11 metadata tables
tdx query < 01_create_semantic_database.sql
```

### 2. Configure config.yaml

```bash
# Copy template
cp config.yaml.template config.yaml

# Edit configuration
# (Use focused skills for targeted sections)
```

### 3. Create Data Dictionary

```bash
# Copy template
cp data_dictionary.yaml.template data_dictionary.yaml

# Populate with your tables
# (Can be auto-generated in delta mode)
```

## Usage

### Dry-run (Preview Changes)

```bash
python semantic_layer_sync.py --config config.yaml --dry-run
```

**Output shows:**
- Schema detection results
- Auto-generated descriptions (with [AUTO] prefix)
- Validation report
- What would be written to TD (without applying)

### Apply Changes

```bash
python semantic_layer_sync.py --config config.yaml --apply --approve
```

**This does:**
1. Generates metadata for all fields
2. Inserts into semantic_layer_v1 tables
3. Updates data_dictionary.yaml with auto-generated content
4. Shows final metadata table status

### Verbose Logging

```bash
python semantic_layer_sync.py --config config.yaml --apply --approve -v
```

### Validation Only

```bash
python semantic_layer_sync.py --config config.yaml --validate-only
```

## Auto-Generation Patterns

Built-in heuristic patterns:

| Pattern | Detects | Tags | Auto-Generated Description |
|---------|---------|------|----------------------------|
| `*_id$` | Identifier fields | `[ID]` | "Identifier for [entity]" |
| `^is_*` | Boolean flags | `[flag]` | "Boolean flag indicating [condition]" |
| `*_at$` | Timestamps | `[timestamp]` | "Timestamp field" |
| `*_date$` | Date fields | `[date]` | "Date field" |
| `email\|^mail` | Email fields | `[contact_info, pii]` | Marks as PII: email |
| `phone\|^tel` | Phone numbers | `[contact_info, pii]` | Marks as PII: phone |
| `^(first\|last)_name` | Names | `[personal_info, pii]` | Marks as PII: name |
| `*_balance\|*_amount` | Metrics | `[metric]` | "Numeric metric" |
| `*_status\|*_level` | Dimensions | `[dimension]` | "Categorical field" |

### Extend with Custom Patterns

Use the [semantic-layer-patterns](skills/semantic-layer-patterns.md) skill to add custom patterns:

```yaml
auto_generation:
  patterns:
    - name: "risk_metrics"
      match:
        - pattern: "^risk_.*"
      tag: "risk_metric"
      description_template: "Risk-related metric: {field_name}"
```

## Example Output

### Field Metadata Table

```
database_name | table_name | field_name         | description                           | tags              | is_pii | pii_category
--------------+------------+--------------------+---------------------------------------+-------------------+--------+-------------
gld_cstore    | loyalty    | customer_id        | [AUTO] Identifier for customer        | [ID]              | 0      | —
gld_cstore    | loyalty    | email              | Customer email address                | [contact_info]    | 1      | email
gld_cstore    | loyalty    | membership_points  | [AUTO] Numeric metric                 | [metric]          | 0      | —
gld_cstore    | loyalty    | created_at         | [AUTO] Timestamp field                | [timestamp]       | 0      | —
gld_cstore    | loyalty    | is_active          | [AUTO] Boolean flag                   | [flag]            | 0      | —
```

## Workflow Integration

### Automatic Lineage Detection

```yaml
# Configure in lineage section
lineage:
  auto_detect:
    - type: "dbt"
      path: "dbt/models/"
    - type: "workflow"
      path: "workflows/"
  generate_impact_analysis: true
```

### Scheduled Execution

```yaml
# Configure in sync section
sync:
  schedule:
    enabled: true
    frequency: "daily"
    cron: "0 2 * * *"  # 2 AM daily
```

## Best Practices

### 1. Start with Dry-Run
- Always preview with `--dry-run` first
- Review auto-generated descriptions
- Verify PII detection accuracy

### 2. Test on Subset
- Test on a single database first
- Verify results before scaling
- Check 10-20 field samples

### 3. Use Focused Skills
- For targeted changes, use specific skills (e.g., `semantic-layer-patterns`)
- Use master skill for comprehensive setup or multi-section changes

### 4. Custom Patterns
- Add domain-specific patterns for your organization
- Document pattern rationale
- Share patterns across team

### 5. Version Control
- Commit data_dictionary.yaml updates
- Track config.yaml changes
- Use sync_history table for audit trail

### 6. Maintenance
- Run sync periodically (weekly/monthly)
- Review failed generations
- Update patterns as schema evolves

## Troubleshooting

### Only Partial Fields Generated

**Problem**: Not all fields have descriptions after sync

**Solution**: Check:
1. `auto_generation.enabled: true` in config
2. Fields don't have existing descriptions (if `overwrite_existing: false`)
3. Check logs for field-specific errors
4. Verify patterns match your field naming conventions

### PII Not Detected

**Problem**: Sensitive fields not marked as PII

**Solution**:
1. Check field name matches PII patterns (email, phone, first_name, etc.)
2. Add custom PII patterns in config (use `semantic-layer-pii` skill)
3. Check `pii_detection: true` is enabled

### INSERT Statements Failing

**Problem**: "Failed to execute INSERT statement"

**Solution**:
1. Verify `semantic_layer_v1` database exists: `tdx tables semantic_layer_v1.field_metadata`
2. Check schema matches: `tdx describe semantic_layer_v1.field_metadata`
3. Run with `-v` flag to see full error messages
4. Check TD API key is set: `echo $TD_API_KEY`

### No Changes Applied

**Problem**: Sync completes but no data in metadata tables

**Solution**:
1. Check `--apply` flag is used (not just `--dry-run`)
2. Check `--approve` flag is provided
3. Verify INSERT statements were generated (check logs)
4. Check semantic database exists

## Performance

- **Speed**: ~0.5-1 sec per field (heuristic generation)
- **Scalability**: 1000+ fields per database manageable
- **Memory**: <500MB for 100+ tables
- **Cost**: $0 (no external APIs)

## Output Files

After running with `--apply`:

### 1. Updated data_dictionary.yaml
- Auto-generated descriptions added
- [AUTO] prefix marks generated content
- Ready for version control

### 2. Semantic Layer Metadata Tables
- field_metadata - All field descriptions and tags
- glossary - Business term definitions
- field_lineage - Detected lineage relationships
- sync_history - Audit trail of changes

### 3. Logs
- Detailed execution logs
- Error tracking
- Performance metrics

## Advanced Usage

### Process Multiple Databases

```yaml
scope:
  databases:
    - name: "gld_cstore"
      all_tables: true
    - name: "staging_sales"
      tables: [orders, customers]
```

### Custom Validation Rules

```yaml
validation:
  custom_rules:
    - field_pattern: ".*_id$"
      should_have_tag: "ID"
      hint: "All ID fields should be tagged as ID"
```

### Workflow Lineage

```yaml
lineage:
  auto_detect:
    - type: "workflow"
      path: "workflows/"
    - type: "dbt"
      path: "dbt/models/"
  track_downstream_tables: true
```

## Related Documentation

| File | Purpose |
|------|---------|
| [README.md](README.md) | Setup and usage guide |
| [AUTO_GENERATION_GUIDE.md](AUTO_GENERATION_GUIDE.md) | Detailed pattern guide |
| [AUTOGEN_TEST_RESULTS.md](AUTOGEN_TEST_RESULTS.md) | Test examples |
| [COMPLETE_GUIDE.md](COMPLETE_GUIDE.md) | Comprehensive documentation |
| [QUICK_REFERENCE.md](QUICK_REFERENCE.md) | Command cheat sheet |
| [skills/README.md](skills/README.md) | Focused skills index |

## Contributing

To extend the tool:

1. **Add new patterns**: Use `semantic-layer-patterns` skill
2. **Add validation rules**: Use `semantic-layer-validation` skill
3. **Configure notifications**: Use `semantic-layer-notifications` skill
4. **Modify sync behavior**: Use `semantic-layer-sync-config` skill

## Support

For issues or questions:
1. Check focused skills for targeted configuration help
2. Review AUTO_GENERATION_GUIDE.md for detailed documentation
3. Review AUTOGEN_TEST_RESULTS.md for test examples
4. Check troubleshooting section above
5. Review logs with `-v` verbose flag

---

**Status**: ✅ Production Ready
**Last Updated**: 2026-02-16
**Version**: 2.0.0
**Skill Type**: Master / Comprehensive
