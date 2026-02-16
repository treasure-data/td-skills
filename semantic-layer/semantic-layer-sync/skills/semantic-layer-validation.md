---
name: semantic-layer-validation
description: Configure validation rules and requirements for semantic layer metadata. Use when setting field/table description requirements, custom validation rules, or PII validation policies.
---

# Semantic Layer Validation Skill

**Focused skill for configuring validation rules and governance requirements for semantic layer metadata.**

## Purpose

Configure the `validation` section of semantic layer automation to:
- Require descriptions for tables and fields
- Enforce owner assignment for tables and PII fields
- Create custom validation rules based on patterns
- Configure PII-specific validation requirements

## When to Use This Skill

✅ **Use this skill when:**
- "Require descriptions for all fields"
- "Make table owners mandatory"
- "Add validation rule for ID fields"
- "Require PII fields to have owners"
- "Create custom validation rule for naming conventions"

❌ **Don't use this skill for:**
- Defining metadata generation patterns (use `semantic-layer-patterns`)
- Configuring PII detection (use `semantic-layer-pii`)
- Setting up lineage tracking (use `semantic-layer-lineage`)

## Configuration Section

This skill manages the `validation` section of `config.yaml`:

```yaml
validation:
  require_table_description: bool          # Require all tables to have descriptions
  require_field_description: bool          # Require all fields to have descriptions
  require_owner_for_tables: bool           # Require all tables to have owners
  require_owner_for_pii_fields: bool       # Require PII fields to have owners

  pii_validation:
    require_pii_category: bool             # Require PII fields to have category
    require_owner: bool                    # Require PII fields to have owner
    require_data_classification: bool      # Require data classification for PII

  custom_rules:
    - field_pattern: string                # Regex pattern to match field names
      should_have_tag: string              # Required tag
      hint: string                         # Helpful hint for users
```

## Common Operations

### 1. Require Field Descriptions

```yaml
validation:
  require_field_description: true
```

**User Request**: "Require descriptions for all fields in semantic layer"

**Effect**: Sync will fail if any field lacks a description (auto-generated descriptions count)

### 2. Require Table Owners

```yaml
validation:
  require_owner_for_tables: true
```

**User Request**: "Make table owners mandatory"

**Effect**: All tables must have an `owner` field populated

### 3. Add Custom ID Field Rule

```yaml
validation:
  custom_rules:
    - field_pattern: ".*_id$"
      should_have_tag: "ID"
      hint: "All ID fields should be tagged as ID"
```

**User Request**: "Add validation rule: fields ending in _id should have ID tag"

### 4. Enforce PII Governance

```yaml
validation:
  require_owner_for_pii_fields: true
  pii_validation:
    require_pii_category: true
    require_owner: true
    require_data_classification: true
```

**User Request**: "Require PII fields to have category, owner, and classification"

### 5. Multiple Custom Rules

```yaml
validation:
  custom_rules:
    - field_pattern: ".*_id$"
      should_have_tag: "ID"
      hint: "Identifier fields need ID tag"

    - field_pattern: ".*_at$"
      should_have_tag: "timestamp"
      hint: "Timestamp fields need timestamp tag"

    - field_pattern: "^is_.*"
      should_have_tag: "flag"
      hint: "Boolean flags need flag tag"
```

**User Request**: "Add validation rules for ID, timestamp, and flag fields"

## Examples

### Example 1: Strict Governance

```yaml
validation:
  require_table_description: true
  require_field_description: true
  require_owner_for_tables: true
  require_owner_for_pii_fields: true

  pii_validation:
    require_pii_category: true
    require_owner: true
    require_data_classification: true

  custom_rules:
    - field_pattern: ".*"
      should_have_tag: "at_least_one"
      hint: "All fields should have at least one semantic tag"
```

**Use Case**: Compliance-heavy organization (finance, healthcare)

### Example 2: Relaxed Development

```yaml
validation:
  require_table_description: false
  require_field_description: false
  require_owner_for_tables: false
  require_owner_for_pii_fields: true    # PII still strict

  pii_validation:
    require_pii_category: true
    require_owner: true
    require_data_classification: false
```

**Use Case**: Development environment with PII safeguards

### Example 3: Naming Convention Enforcement

```yaml
validation:
  custom_rules:
    # ID fields
    - field_pattern: ".*_id$"
      should_have_tag: "ID"
      hint: "Use _id suffix for identifiers"

    # Timestamps
    - field_pattern: ".*_(at|date|time)$"
      should_have_tag: "timestamp"
      hint: "Use _at, _date, or _time suffix for temporal fields"

    # Metrics
    - field_pattern: ".*(amount|balance|total|count|sum).*"
      should_have_tag: "metric"
      hint: "Numeric aggregations should be tagged as metrics"

    # Dimensions
    - field_pattern: ".*(status|type|category|level).*"
      should_have_tag: "dimension"
      hint: "Categorical fields should be tagged as dimensions"
```

**Use Case**: Standardize naming conventions across organization

## Validation Output

### Validation Errors Table

```sql
SELECT * FROM semantic_layer_v1.validation_errors;
```

| database | table | field | error_type | error_message | severity | detected_at |
|----------|-------|-------|------------|---------------|----------|-------------|
| analytics | customers | customer_id | missing_tag | Field ending in _id should have ID tag | ERROR | 2026-02-16 |
| analytics | orders | email | missing_owner | PII field requires owner | ERROR | 2026-02-16 |
| staging | temp_data | — | missing_description | Table requires description | WARNING | 2026-02-16 |

### Validation Report (Dry-Run)

```bash
python semantic_layer_sync.py --config config.yaml --dry-run
```

**Output:**
```
=== VALIDATION REPORT ===

✅ PASSED (234 fields)
- All have descriptions
- All have appropriate tags
- PII fields have owners

❌ FAILED (12 fields)
- analytics.customers.customer_id: Missing ID tag (expected by pattern .*_id$)
- analytics.orders.email: PII field missing owner
- staging.temp_data: Table missing description

⚠️  WARNINGS (5 fields)
- staging.test_table: No owner assigned (non-PII)

VALIDATION ERRORS: 12
WARNINGS: 5
```

## Validation Severity

| Severity | Behavior | Use Case |
|----------|----------|----------|
| **ERROR** | Blocks sync with `--apply` | Required fields, PII governance |
| **WARNING** | Logs but allows sync | Best practices, recommendations |
| **INFO** | Informational only | Suggestions, optimization hints |

## Testing

### Validate Configuration

```bash
# Check validation rules syntax
python semantic_layer_sync.py --config config.yaml --validate-only
```

### Dry-Run with Validation

```bash
# See what would fail validation
python semantic_layer_sync.py --config config.yaml --dry-run
```

### Override Validation (Testing)

```bash
# Skip validation for testing (NOT recommended for prod)
python semantic_layer_sync.py --config config.yaml --apply --approve --skip-validation
```

## Best Practices

### 1. Start with Warnings

```yaml
validation:
  require_field_description: false    # Start with warning
  # After team adopts, change to true
```

Monitor adoption, then enforce strictly.

### 2. Document Custom Rules

```yaml
validation:
  custom_rules:
    # Rule 1: ID Field Convention
    # Rationale: Standardize identifier naming across org
    # Owner: Data Governance Team
    - field_pattern: ".*_id$"
      should_have_tag: "ID"
      hint: "All identifier fields must end with _id and be tagged as ID"
```

### 3. PII Always Strict

```yaml
validation:
  require_owner_for_pii_fields: true    # ALWAYS enforce for PII
  pii_validation:
    require_pii_category: true          # ALWAYS enforce
    require_owner: true                 # ALWAYS enforce
```

### 4. Test Rules Before Enforcing

```bash
# Test new validation rule
python semantic_layer_sync.py --config config.test.yaml --dry-run
```

### 5. Gradual Rollout

```yaml
# Week 1: Warnings only
validation:
  require_field_description: false

# Week 2: Enforce for new fields only
validation:
  require_field_description: true
  skip_existing_fields: true

# Week 3: Full enforcement
validation:
  require_field_description: true
```

## Performance Considerations

- **Validation Speed**: ~0.1-0.2 sec per field
- **Custom Rules**: Regex matching is fast (<1ms per field)
- **Large Datasets**: 1000+ fields validated in <5 seconds

## Troubleshooting

### Validation Blocking Sync

**Problem**: "Cannot sync due to validation errors"

**Solution**:
1. Run `--dry-run` to see all errors
2. Fix errors in data_dictionary.yaml
3. Or temporarily relax validation
4. Check validation_errors table for history

### Custom Rule Not Working

**Problem**: Custom validation rule not triggering

**Solution**:
1. Test regex pattern: `echo "customer_id" | grep -E ".*_id$"`
2. Check field names match pattern exactly
3. Verify `should_have_tag` matches actual tag names
4. Use `--dry-run` to see rule evaluation

### Too Many False Positives

**Problem**: Validation rule triggers incorrectly

**Solution**:
1. Refine regex pattern (use anchors `^` and `$`)
2. Add exclusions to pattern: `(?!.*_temp).*_id$`
3. Adjust hint to clarify intent
4. Consider multiple specific rules instead of one broad rule

## Integration

### With Auto-Generation

```yaml
auto_generation:
  enabled: true
  generate:
    tags: true                # Auto-generate tags

validation:
  custom_rules:
    - field_pattern: ".*_id$"
      should_have_tag: "ID"   # Validate auto-generated tags
```

Auto-generation satisfies validation requirements.

### With PII Detection

```yaml
auto_generation:
  generate:
    pii_detection: true       # Auto-detect PII

validation:
  pii_validation:
    require_pii_category: true  # Validate detected PII
    require_owner: true         # Require owner for detected PII
```

### With Notifications

```yaml
validation:
  require_field_description: true

notifications:
  on_error:
    enabled: true
    message_template: "Validation failed: {error_count} errors"
```

Get alerted when validation fails.

## CLI Commands

```bash
# Validate configuration syntax
python semantic_layer_sync.py --config config.yaml --validate-only

# Dry-run to see validation results
python semantic_layer_sync.py --config config.yaml --dry-run

# Apply with validation
python semantic_layer_sync.py --config config.yaml --apply --approve

# Skip validation (testing only)
python semantic_layer_sync.py --config config.yaml --apply --approve --skip-validation

# Query validation errors
tdx query "SELECT * FROM semantic_layer_v1.validation_errors ORDER BY detected_at DESC LIMIT 50"
```

## Related Skills

- **semantic-layer-patterns** - Define patterns that validation rules check
- **semantic-layer-pii** - Configure PII detection that validation verifies
- **semantic-layer-notifications** - Alert on validation failures
- **semantic-config-master-skill** - Manage all config sections

---

**Status**: ✅ Production Ready
**Skill Type**: Focused / Single-Responsibility
**Last Updated**: 2026-02-16
