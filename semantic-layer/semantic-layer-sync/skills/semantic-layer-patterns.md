---
name: semantic-layer-patterns
description: Manage auto-generation heuristic patterns for semantic layer metadata. Use when adding/updating patterns for field descriptions, tags, or PII detection based on naming conventions.
---

# Semantic Layer Patterns Skill

**Focused skill for managing heuristic patterns that auto-generate metadata, tags, and PII classifications based on field naming conventions.**

## Purpose

Configure the `auto_generation.patterns` section to:
- Add custom metadata generation patterns
- Define tag assignments based on field names
- Configure PII detection patterns
- Extend built-in pattern library

## When to Use This Skill

✅ **Use this skill when:**
- "Add pattern for risk_* fields"
- "Create pattern for detecting timestamps"
- "Show me all current patterns"
- "Update the identifier pattern"
- "Add custom pattern for financial metrics"

❌ **Don't use this skill for:**
- Configuring PII validation requirements (use `semantic-layer-pii`)
- Setting which databases to process (use `semantic-layer-scope`)
- Defining validation rules (use `semantic-layer-validation`)

## Configuration Section

This skill manages patterns in `config.yaml`:

```yaml
auto_generation:
  enabled: bool
  patterns:
    - name: string                       # Pattern name
      match:                             # Match conditions
        - pattern: string                # Regex pattern
      tag: string                        # Tag to apply
      description_template: string       # Description template
      pii_category: string               # PII category (optional)
      confidence: int                    # Confidence score (0-100)
```

## Built-in Patterns

The tool includes 50+ built-in patterns:

| Category | Pattern | Detects | Tag | PII |
|----------|---------|---------|-----|-----|
| **Identifiers** | `.*_id$` | ID fields | `ID` | No |
| **Identifiers** | `^uuid$\|.*_uuid$` | UUIDs | `ID` | No |
| **Flags** | `^is_.*` | Boolean flags | `flag` | No |
| **Flags** | `^has_.*` | Boolean indicators | `flag` | No |
| **Timestamps** | `.*_at$` | Timestamp fields | `timestamp` | No |
| **Timestamps** | `.*_date$` | Date fields | `date` | No |
| **Timestamps** | `.*_time$` | Time fields | `time` | No |
| **Metrics** | `.*_balance$` | Financial metrics | `metric` | No |
| **Metrics** | `.*_amount$` | Amounts | `metric` | No |
| **Metrics** | `.*_total$` | Totals | `metric` | No |
| **Metrics** | `.*_count$` | Counts | `metric` | No |
| **Dimensions** | `.*_status$` | Status fields | `dimension` | No |
| **Dimensions** | `.*_type$` | Type fields | `dimension` | No |
| **Dimensions** | `.*_category$` | Categories | `dimension` | No |
| **PII** | `email\|^mail$` | Email addresses | `contact_info` | Yes (email) |
| **PII** | `phone\|^tel$` | Phone numbers | `contact_info` | Yes (phone) |
| **PII** | `^(first\|last)_name$` | Names | `personal_info` | Yes (name) |
| **PII** | `address\|street\|city\|zip` | Addresses | `location` | Yes (address) |

## Common Operations

### 1. Add Custom Pattern

```yaml
auto_generation:
  patterns:
    - name: "risk_metrics"
      match:
        - pattern: "^risk_.*"
      tag: "risk_metric"
      description_template: "Risk-related metric: {field_name}"
      confidence: 85
```

**User Request**: "Add pattern for risk_* fields - tag as risk_metric"

### 2. Add Financial Domain Pattern

```yaml
auto_generation:
  patterns:
    - name: "revenue_fields"
      match:
        - pattern: ".*(revenue|income|sales).*"
      tag: "financial_metric"
      description_template: "[AUTO] Financial metric: {field_name}"
      confidence: 80
```

**User Request**: "Create pattern for revenue fields"

### 3. Add Company-Specific Pattern

```yaml
auto_generation:
  patterns:
    - name: "acme_customer_id"
      match:
        - pattern: "^acme_.*_id$"
      tag: "acme_identifier"
      description_template: "[AUTO] ACME system identifier: {field_name}"
      confidence: 90
```

**User Request**: "Add pattern for ACME system identifiers (acme_*_id)"

### 4. Add Multi-Pattern Match

```yaml
auto_generation:
  patterns:
    - name: "temporal_fields"
      match:
        - pattern: ".*_(at|date|time|timestamp)$"
      tag: "temporal"
      description_template: "[AUTO] Temporal field: {field_name}"
      confidence: 85
```

**User Request**: "Create pattern for all temporal fields"

### 5. Override Built-in Pattern

```yaml
auto_generation:
  patterns:
    # Custom ID pattern (overrides built-in)
    - name: "identifier"
      match:
        - pattern: ".*_(id|uuid|key)$"
      tag: "identifier"
      description_template: "[AUTO] Unique identifier for {entity}"
      confidence: 95
```

**User Request**: "Update identifier pattern to include _key fields"

## Pattern Template Variables

Use these variables in `description_template`:

| Variable | Example Value | Description |
|----------|---------------|-------------|
| `{field_name}` | `customer_id` | Actual field name |
| `{entity}` | `customer` | Extracted from `{entity}_id` |
| `{table_name}` | `orders` | Table containing field |
| `{database}` | `analytics` | Database name |
| `{data_type}` | `bigint` | Field data type |

## Examples

### Example 1: E-Commerce Patterns

```yaml
auto_generation:
  patterns:
    # Product identifiers
    - name: "product_ids"
      match:
        - pattern: "^(sku|product_id|item_id)$"
      tag: "product_identifier"
      description_template: "[AUTO] Product identifier: {field_name}"

    # Order metrics
    - name: "order_metrics"
      match:
        - pattern: ".*(order_total|subtotal|tax|shipping).*"
      tag: "order_metric"
      description_template: "[AUTO] Order financial metric: {field_name}"

    # Customer segments
    - name: "customer_segments"
      match:
        - pattern: ".*(segment|cohort|tier).*"
      tag: "customer_dimension"
      description_template: "[AUTO] Customer segmentation field: {field_name}"
```

### Example 2: Healthcare Patterns

```yaml
auto_generation:
  patterns:
    # Patient identifiers
    - name: "patient_ids"
      match:
        - pattern: "^(patient_id|mrn|medical_record_number)$"
      tag: "patient_identifier"
      description_template: "[AUTO] Patient identifier"
      pii_category: "patient_id"
      confidence: 95

    # Clinical metrics
    - name: "clinical_metrics"
      match:
        - pattern: ".*(heart_rate|blood_pressure|temperature|weight).*"
      tag: "clinical_metric"
      description_template: "[AUTO] Clinical measurement: {field_name}"

    # Diagnosis codes
    - name: "diagnosis_codes"
      match:
        - pattern: ".*(icd|diagnosis_code|cpt).*"
      tag: "clinical_code"
      description_template: "[AUTO] Clinical code: {field_name}"
```

### Example 3: Marketing Patterns

```yaml
auto_generation:
  patterns:
    # Campaign identifiers
    - name: "campaign_ids"
      match:
        - pattern: ".*(campaign|ad|creative)_id$"
      tag: "marketing_identifier"
      description_template: "[AUTO] Marketing campaign identifier: {field_name}"

    # Engagement metrics
    - name: "engagement_metrics"
      match:
        - pattern: ".*(clicks|impressions|conversions|ctr|cpc).*"
      tag: "engagement_metric"
      description_template: "[AUTO] Marketing engagement metric: {field_name}"

    # Channels
    - name: "marketing_channels"
      match:
        - pattern: ".*(channel|source|medium|platform).*"
      tag: "marketing_dimension"
      description_template: "[AUTO] Marketing channel/source: {field_name}"
```

## Pattern Confidence Scoring

| Confidence Range | Meaning | Action |
|------------------|---------|--------|
| 90-100 | Extremely confident | Auto-apply, high priority |
| 75-89 | Confident | Auto-apply |
| 60-74 | Moderately confident | Auto-apply with [AUTO] prefix |
| <60 | Low confidence | Flag for manual review |

## Testing Patterns

### Test Pattern Match

```bash
# Dry-run to see pattern application
python semantic_layer_sync.py --config config.yaml --dry-run --show-patterns
```

### Test Specific Pattern

```python
import re

pattern = "^risk_.*"
test_fields = [
    "risk_score",
    "risk_level",
    "customer_risk",
    "revenue"
]

for field in test_fields:
    if re.match(pattern, field):
        print(f"✅ MATCH: {field}")
    else:
        print(f"❌ NO MATCH: {field}")
```

**Output:**
```
✅ MATCH: risk_score
✅ MATCH: risk_level
❌ NO MATCH: customer_risk
❌ NO MATCH: revenue
```

### Validate Pattern Syntax

```bash
# Validate configuration
python semantic_layer_sync.py --config config.yaml --validate-only
```

## Best Practices

### 1. Use Anchors for Precision

```yaml
# Good: Precise match
pattern: "^risk_.*"          # Only fields starting with risk_

# Bad: Too broad
pattern: "risk"              # Matches "at_risk", "risk_free", etc.
```

### 2. Order Patterns by Specificity

```yaml
auto_generation:
  patterns:
    # Most specific first
    - name: "acme_customer_id"
      pattern: "^acme_customer_id$"

    # Then more general
    - name: "customer_ids"
      pattern: ".*customer_id$"

    # Finally broad patterns
    - name: "all_ids"
      pattern: ".*_id$"
```

### 3. Use High Confidence for Critical Patterns

```yaml
# PII patterns should be very confident
- name: "email"
  pattern: "^email$|.*_email$"
  pii_category: "email"
  confidence: 95               # High confidence
```

### 4. Document Pattern Rationale

```yaml
auto_generation:
  patterns:
    # Pattern: Risk Metrics
    # Rationale: All risk-related fields follow risk_* naming
    # Owner: Risk Analytics Team
    # Added: 2026-02-15
    - name: "risk_metrics"
      match:
        - pattern: "^risk_.*"
      tag: "risk_metric"
      description_template: "Risk-related metric: {field_name}"
```

### 5. Test Before Production

```bash
# Test on dev database first
python semantic_layer_sync.py --config config.dev.yaml --dry-run
```

## Performance Considerations

- **Pattern Matching Speed**: ~0.1-0.5ms per field
- **Regex Compilation**: Patterns compiled once at startup
- **Large Pattern Sets**: 100+ patterns = negligible performance impact

## Troubleshooting

### Pattern Not Matching

**Problem**: Custom pattern not applying to expected fields

**Solution**:
1. Test regex independently: `echo "field_name" | grep -E "pattern"`
2. Check for typos in pattern
3. Use anchors (`^` and `$`) for precision
4. Check pattern order (more specific patterns first)

### Wrong Pattern Applying

**Problem**: Pattern matching unintended fields

**Solution**:
1. Add anchors to restrict match: `^risk_.*$`
2. Use negative lookahead: `(?!.*_test).*_id$`
3. Increase specificity of pattern
4. Reorder patterns (specific before general)

### Description Template Not Working

**Problem**: Variables in description_template not substituting

**Solution**:
1. Check variable syntax: `{field_name}` not `${field_name}`
2. Ensure variable is supported (see template variables table)
3. Check for typos in variable name
4. Use `--dry-run` to see generated descriptions

## Integration

### With PII Detection

```yaml
auto_generation:
  patterns:
    - name: "email"
      match:
        - pattern: "email\|^mail$"
      tag: "contact_info"
      pii_category: "email"      # Marks as PII
```

### With Validation

```yaml
auto_generation:
  patterns:
    - name: "identifier"
      pattern: ".*_id$"
      tag: "ID"

validation:
  custom_rules:
    - field_pattern: ".*_id$"
      should_have_tag: "ID"      # Validates auto-generated tag
```

## CLI Commands

```bash
# Show all patterns
python semantic_layer_sync.py --config config.yaml --show-patterns

# Test pattern application (dry-run)
python semantic_layer_sync.py --config config.yaml --dry-run

# Apply patterns
python semantic_layer_sync.py --config config.yaml --apply --approve

# Validate pattern syntax
python semantic_layer_sync.py --config config.yaml --validate-only
```

## Related Skills

- **semantic-layer-pii** - Configure PII-specific patterns
- **semantic-layer-validation** - Validate pattern results
- **semantic-layer-tags** - Manage tag taxonomy
- **semantic-config-master-skill** - Manage all config sections

---

**Status**: ✅ Production Ready
**Skill Type**: Focused / Single-Responsibility
**Last Updated**: 2026-02-16
