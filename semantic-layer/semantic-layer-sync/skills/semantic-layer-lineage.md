---
name: semantic-layer-lineage
description: Configure data lineage detection and tracking for dbt models, TD workflows, and schema comments. Use when enabling lineage, setting confidence thresholds, or generating impact analysis.
---

# Semantic Layer Lineage Skill

**Focused skill for configuring data lineage detection and tracking in the semantic layer.**

## Purpose

Configure the `lineage` section of semantic layer automation to:
- Auto-detect lineage from dbt, workflows, and schema comments
- Set confidence thresholds for auto-detected lineage
- Generate downstream impact analysis
- Track table dependencies

## When to Use This Skill

✅ **Use this skill when:**
- "Enable dbt lineage detection"
- "Track workflow transformations"
- "Set lineage confidence threshold to 80%"
- "Generate impact analysis for downstream tables"
- "Show me lineage detection configuration"

❌ **Don't use this skill for:**
- Adding databases to scope (use `semantic-layer-scope`)
- Configuring metadata patterns (use `semantic-layer-patterns`)
- Setting validation rules (use `semantic-layer-validation`)

## Configuration Section

This skill manages the `lineage` section of `config.yaml`:

```yaml
lineage:
  auto_detect:
    - type: string                     # "dbt" | "workflow" | "schema_comments"
      path: string                     # Path to scan
  confidence_thresholds:
    high: int                          # 90+ for auto-approval
    medium: int                        # 70-89 requires review
    low: int                           # 50-69 flagged for manual review
  generate_impact_analysis: bool       # Enable downstream impact
  track_downstream_tables: bool        # Track dependencies
```

## Lineage Detection Types

### 1. **dbt Lineage**

Detects lineage from dbt model files (`.sql` in `models/` directory):

```yaml
lineage:
  auto_detect:
    - type: "dbt"
      path: "dbt/models/"
```

**What it detects:**
- Column-level lineage from `ref()` and `source()` macros
- Model dependencies
- Test coverage
- Documentation completeness

**Example dbt model:**
```sql
-- models/customer_360.sql
{{ config(materialized='table') }}

SELECT
    c.customer_id,
    c.email,
    o.order_count,
    o.total_revenue
FROM {{ ref('customers') }} c
LEFT JOIN {{ ref('order_summary') }} o
    ON c.customer_id = o.customer_id
```

**Detected lineage:**
```
customers.customer_id → customer_360.customer_id
customers.email → customer_360.email
order_summary.order_count → customer_360.order_count
order_summary.total_revenue → customer_360.total_revenue
```

### 2. **Workflow Lineage**

Detects lineage from TD workflow `.dig` files:

```yaml
lineage:
  auto_detect:
    - type: "workflow"
      path: "workflows/"
```

**What it detects:**
- Table transformations in `td>` operators
- INSERT/CREATE TABLE statements
- Upstream/downstream dependencies

**Example workflow:**
```dig
+create_customer_360:
  td>: queries/customer_360.sql
  database: analytics

  # Detected: customers, orders → customer_360
```

### 3. **Schema Comments**

Detects lineage from SQL schema comments:

```yaml
lineage:
  auto_detect:
    - type: "schema_comments"
```

**What it detects:**
- `COMMENT ON` statements
- Inline comments with lineage hints

**Example:**
```sql
COMMENT ON COLUMN customer_360.email IS
'Customer email address. Source: customers.email';
```

## Confidence Thresholds

Configure how confident the tool must be before auto-accepting lineage:

```yaml
lineage:
  confidence_thresholds:
    high: 90      # 90%+ accuracy - auto-accept
    medium: 70    # 70-89% - flag for review
    low: 50       # 50-69% - manual verification required
```

### Confidence Scoring

| Score | Meaning | Action | Example |
|-------|---------|--------|---------|
| 95% | Explicit lineage (`ref()`, `source()`) | Auto-accept | `{{ ref('customers') }}` |
| 80% | Strong pattern match | Auto-accept (if >70) | `FROM customers c JOIN orders o` |
| 60% | Weak pattern match | Flag for review | `-- Based on customer data` |
| 30% | Guessed from naming | Requires manual verification | `customer_id` field in both tables |

## Common Operations

### 1. Enable dbt Column-Level Lineage

```yaml
lineage:
  auto_detect:
    - type: "dbt"
      path: "dbt/models/"
  confidence_thresholds:
    high: 90
    medium: 70
    low: 50
  track_downstream_tables: true
```

**User Request**: "Enable dbt lineage detection with column-level tracking"

### 2. Enable Workflow Lineage

```yaml
lineage:
  auto_detect:
    - type: "workflow"
      path: "workflows/"
    - type: "dbt"
      path: "dbt/models/"
  generate_impact_analysis: true
```

**User Request**: "Track lineage from both dbt and TD workflows"

### 3. Set Conservative Confidence

```yaml
lineage:
  confidence_thresholds:
    high: 95      # Very strict
    medium: 85
    low: 70
```

**User Request**: "Set lineage confidence threshold to 95% for auto-approval"

### 4. Enable Impact Analysis

```yaml
lineage:
  generate_impact_analysis: true
  track_downstream_tables: true
```

**User Request**: "Generate downstream impact analysis for all tables"

### 5. Disable Auto-Detection

```yaml
lineage:
  auto_detect: []               # Empty list = disabled
```

**User Request**: "Disable automatic lineage detection"

## Examples

### Example 1: dbt-Only Setup

```yaml
lineage:
  auto_detect:
    - type: "dbt"
      path: "dbt/models/"
  confidence_thresholds:
    high: 90
    medium: 70
    low: 50
  generate_impact_analysis: true
  track_downstream_tables: true
```

**Use Case**: Organization using dbt for all transformations

### Example 2: Multi-Source Lineage

```yaml
lineage:
  auto_detect:
    - type: "dbt"
      path: "dbt/models/"
    - type: "workflow"
      path: "workflows/"
    - type: "schema_comments"
  confidence_thresholds:
    high: 85
    medium: 65
    low: 45
  generate_impact_analysis: true
```

**Use Case**: Mixed environment (dbt + TD workflows + legacy SQL)

### Example 3: Conservative Manual Review

```yaml
lineage:
  auto_detect:
    - type: "workflow"
      path: "workflows/"
  confidence_thresholds:
    high: 95      # Very strict
    medium: 85
    low: 75
  generate_impact_analysis: false   # Manual only
```

**Use Case**: Compliance-heavy environment requiring manual verification

## Output

### Lineage Table (`field_lineage`)

```sql
-- Example lineage records
SELECT * FROM semantic_layer_v1.field_lineage;
```

| source_database | source_table | source_field | target_database | target_table | target_field | confidence | lineage_type |
|-----------------|--------------|--------------|-----------------|--------------|--------------|------------|--------------|
| raw_data | customers | email | analytics | customer_360 | email | 95 | dbt_ref |
| raw_data | orders | order_id | analytics | customer_360 | last_order_id | 85 | dbt_ref |
| staging | events | user_id | analytics | behavior_events | customer_id | 70 | workflow |

### Impact Analysis Table (`impact_analysis`)

```sql
-- Downstream impact
SELECT * FROM semantic_layer_v1.impact_analysis
WHERE source_table = 'customers';
```

| source_table | affected_table | impact_level | downstream_count |
|--------------|----------------|--------------|------------------|
| customers | customer_360 | HIGH | 12 |
| customers | order_summary | MEDIUM | 5 |
| customers | marketing_campaigns | LOW | 2 |

## Validation

The skill validates:
- ✅ Lineage paths exist and are readable
- ✅ Confidence thresholds are between 0-100
- ✅ At least one detection type is enabled (if auto_detect configured)
- ✅ Paths point to valid directories

## Testing

### Preview Detected Lineage

```bash
# Dry-run to see detected lineage
python semantic_layer_sync.py --config config.yaml --dry-run --show-lineage
```

### Validate Lineage Config

```bash
# Validate configuration
python semantic_layer_sync.py --config config.yaml --validate-only
```

### Query Lineage Results

```sql
-- Check lineage detection results
SELECT
    source_table,
    source_field,
    target_table,
    target_field,
    confidence,
    lineage_type
FROM semantic_layer_v1.field_lineage
WHERE confidence >= 70
ORDER BY confidence DESC
LIMIT 20;
```

## Best Practices

### 1. Start with High Confidence

```yaml
lineage:
  confidence_thresholds:
    high: 90
    medium: 70
    low: 50
```

Lower thresholds after observing accuracy.

### 2. Enable Multiple Sources

```yaml
lineage:
  auto_detect:
    - type: "dbt"
      path: "dbt/models/"
    - type: "workflow"
      path: "workflows/"
```

Better coverage = more accurate lineage.

### 3. Review Medium Confidence

```bash
# Query medium-confidence lineage for review
tdx query "
SELECT * FROM semantic_layer_v1.field_lineage
WHERE confidence >= 70 AND confidence < 90
ORDER BY confidence DESC
" -d semantic_layer_v1
```

### 4. Enable Impact Analysis

```yaml
lineage:
  generate_impact_analysis: true
```

Essential for understanding downstream effects of changes.

## Performance Considerations

| Detection Type | Speed | Accuracy | Cost |
|----------------|-------|----------|------|
| dbt | Fast (2-5 sec) | Very High (95%+) | Low |
| workflow | Medium (5-15 sec) | High (85%+) | Low |
| schema_comments | Fast (1-2 sec) | Medium (70%+) | Low |

## Troubleshooting

### No Lineage Detected

**Problem**: "No lineage found after enabling detection"

**Solution**:
1. Check paths exist: `ls dbt/models/`, `ls workflows/`
2. Check file permissions: `ls -la dbt/models/`
3. Verify file formats (`.sql` for dbt, `.dig` for workflows)
4. Use `--show-lineage` flag for debugging

### Low Confidence Scores

**Problem**: All lineage flagged as low confidence

**Solution**:
1. Check SQL quality (explicit `ref()`, clear table names)
2. Add schema comments for hints
3. Use qualified table names in SQL (`database.table`)
4. Lower `confidence_thresholds.low` temporarily

### Missing Column-Level Lineage

**Problem**: Table-level lineage detected but not column-level

**Solution**:
1. Use explicit column mappings in SQL (not `SELECT *`)
2. Add column aliases clearly
3. Document transformations in comments
4. Check dbt model uses `ref()` macro

## Integration

### With Validation

```yaml
lineage:
  generate_impact_analysis: true

validation:
  custom_rules:
    - field_pattern: ".*"
      should_have: "lineage"
      hint: "All fields should have documented lineage"
```

### With Notifications

```yaml
lineage:
  generate_impact_analysis: true

notifications:
  on_sync_complete:
    enabled: true
    message_template: "Lineage detected: {lineage_count} relationships"
```

## CLI Commands

```bash
# Show lineage configuration
python semantic_layer_sync.py --config config.yaml --show-lineage-config

# Detect and preview lineage
python semantic_layer_sync.py --config config.yaml --dry-run --show-lineage

# Apply lineage detection
python semantic_layer_sync.py --config config.yaml --apply --approve

# Query lineage results
tdx query "SELECT * FROM semantic_layer_v1.field_lineage LIMIT 100"
```

## Related Skills

- **semantic-layer-scope** - Define what to track lineage for
- **semantic-layer-validation** - Validate lineage completeness
- **semantic-layer-notifications** - Alert on lineage changes
- **semantic-config-master-skill** - Manage all config sections

---

**Status**: ✅ Production Ready
**Skill Type**: Focused / Single-Responsibility
**Last Updated**: 2026-02-16
