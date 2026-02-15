# Auto-Generation Feature Guide

## Overview

The semantic layer sync tool includes **heuristic-based auto-generation** of field descriptions, tags, and PII detection. This approach uses pattern matching and naming conventions - **completely cost-free, no external API calls needed**.

✨ **Key Benefits**:
- Zero cost (no API calls)
- No external dependencies
- Fast execution (patterns match locally)
- Reliable for standard naming conventions

## Features

✅ **Pattern-Based Descriptions**: Generates descriptions from field naming conventions
✅ **Smart Tagging**: Auto-suggests tags based on field names and patterns
✅ **PII Detection**: Automatically detects PII fields (email, phone, name, address, DOB)
✅ **Content Preservation**: Never overwrites manual descriptions (configurable)
✅ **Extensible Patterns**: Easy to add custom patterns for your naming conventions

## How It Works

The auto-generation engine matches field names against configurable patterns to determine:
1. **Field Tags** - Semantic classification (ID, timestamp, metric, flag, dimension, etc.)
2. **Field Descriptions** - Natural language explanation based on the pattern
3. **PII Category** - Classification if the field contains personally identifiable information

### Example Patterns

| Field Name | Pattern | Tag | Description | PII |
|-----------|---------|-----|-------------|-----|
| `customer_id` | `.*_id` | ID | Identifier for entity | No |
| `is_active` | `is_.*` | flag | Boolean indicator | No |
| `created_at` | `.*_at` (timestamp) | timestamp | When entity was created | No |
| `account_balance` | `.*_balance` | metric | Numeric metric | No |
| `email_address` | `.*_email` | contact_info | Email for communication | YES (email) |
| `phone_number` | `.*_phone` | contact_info | Phone for contact | YES (phone) |
| `first_name` | `first_name` | personal_info | Personal name | YES (name) |
| `date_of_birth` | `date_of_birth` | personal_info | Date of birth | YES (dob) |

## Setup

### 1. Install Dependencies

```bash
pip install pyyaml pytd
```

No external API keys or special authentication needed!

### 2. Enable in Config

Edit `config.yaml`:

```yaml
auto_generation:
  enabled: true  # Set to true
```

### 3. Run the Sync

```bash
# Dry run (preview changes)
python semantic_layer_sync.py --config config.yaml --dry-run

# Apply changes
python semantic_layer_sync.py --config config.yaml --apply --approve
```

## Configuration

### Basic Settings

```yaml
auto_generation:
  enabled: true

  content_rules:
    # Mark auto-generated content with prefix
    prefix_auto_generated: "[AUTO]"

    # Control overwriting behavior
    overwrite_existing: false  # Never overwrite manual descriptions
    overwrite_auto_generated: false  # Never refresh old auto-generated content

    # Skip these field names (already well-documented)
    skip_fields_matching:
      - "time"
      - "td_*"

  generate:
    field_descriptions: true   # Generate from patterns
    tags: true                 # Generate tags
    pii_detection: true        # Detect PII fields
```

### Custom Patterns

Add new patterns to match your naming conventions:

```yaml
auto_generation:
  patterns:
    - name: "revenue_metrics"
      match:
        - pattern: ".*_revenue$"
        - pattern: ".*_mrr$"
      tag: "financial_metric"
      description_template: "Revenue metric for {entity}"
      pii_category: null

    - name: "internal_ids"
      match:
        - pattern: "^internal_.*_id$"
      tag: "ID"
      description_template: "Internal identifier"
      pii_category: null
```

## Sample Output

When auto-generation runs, it produces results like:

**Input field**: `customer_email`
**Generated:**
- Description: `[AUTO] Email address for communication`
- Tag: `contact_info`
- PII: `email`

**Input field**: `last_updated_at`
**Generated:**
- Description: `[AUTO] Timestamp indicating when entity was last updated`
- Tag: `timestamp`
- PII: None

**Input field**: `account_balance`
**Generated:**
- Description: `[AUTO] Numeric metric for account`
- Tag: `metric`
- PII: None

## Best Practices

1. **Review Generated Content**: Always review auto-generated descriptions for accuracy
2. **Customize Patterns**: Add patterns that match your company's naming conventions
3. **Manual Refinement**: For complex fields, manually refine descriptions while keeping `[AUTO]` prefix
4. **Start Small**: Test on a few tables before running across your entire semantic layer

## Extending Patterns

To add support for your naming conventions, update the `patterns` section in `config.yaml`:

```yaml
patterns:
  - name: "descriptive_name"
    match:
      - pattern: "regex_pattern_1"
      - pattern: "regex_pattern_2"
    tag: "semantic_tag"
    description_template: "Description for {entity}"
    pii_category: null  # or "email", "phone", "name", "dob", "address"
```

### Pattern Matching Rules

- Patterns use regex matching
- Multiple patterns can be defined for one rule set
- Field names are matched in order - first match wins
- Use `{entity}` placeholder in description templates (replaced with field name)

### Supported PII Categories

- `email` - Email addresses
- `phone` - Phone numbers
- `name` - Personal names
- `dob` - Dates of birth
- `address` - Physical addresses
- `ssn` - Social security numbers
- `null` - Not PII

## Troubleshooting

### Descriptions Not Generated

- Check if `generate.field_descriptions` is set to `true` in config
- Verify field name isn't in `skip_fields_matching` list
- Ensure `overwrite_existing` is `false` if field already has a description

### Incorrect Tags

- Add a new pattern that matches your field naming convention
- Check pattern regex is correct
- Patterns are matched in order - check if earlier pattern is matching instead

### PII Not Detected

- Verify the pattern includes `pii_category` setting
- Check supported PII categories above
- Consider adding a custom pattern for your field naming

## Cost Analysis

**Zero Cost** - The heuristic approach requires:
- No API calls
- No external services
- No conversation credits
- Only local regex pattern matching

## Future Enhancements

For even better descriptions, consider:
- **Phase 2**: Integrate with Anthropic Claude API for AI-powered descriptions
- **Phase 2**: Sample data analysis for better context
- **Phase 2**: Cross-table pattern learning
- **Phase 2**: Glossary term linking

For now, the heuristic approach provides a solid foundation for metadata population!
