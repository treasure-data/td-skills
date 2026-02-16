---
name: semantic-layer-tags
description: Manage semantic tag generation and assignment for the semantic layer. Use when adding tags, configuring tag patterns, or managing field categorization and metadata organization.
---

# Semantic Layer Tags Skill

**Focused skill for configuring semantic tags that categorize and organize fields in the semantic layer.**

## Purpose

Configure tag generation and assignment to:
- Add semantic tags to fields based on patterns
- Organize fields into logical categories
- Enable tag-based discovery and filtering
- Support governance and compliance tagging

## When to Use This Skill

✅ **Use this skill when:**
- "Add 'customer_data' tag to all customer fields"
- "Tag all revenue fields with 'financial_metrics'"
- "Create tags for data governance categories"
- "Show me all available tags"
- "Tag PII fields automatically"

❌ **Don't use this skill for:**
- Setting PII categories (use `semantic-layer-pii`)
- Adding metadata patterns (use `semantic-layer-patterns`)
- Configuring validation rules (use `semantic-layer-validation`)

## Configuration Section

This skill manages tags in the `auto_generation.patterns` section:

```yaml
auto_generation:
  patterns:
    - name: string
      match:
        - pattern: string              # Regex pattern
      tag: string                      # Single tag
      tags: [string]                   # Multiple tags (alternative)
      confidence: int
```

## Built-in Tag Categories

| Category | Purpose | Examples | Use Cases |
|----------|---------|----------|-----------|
| **Domain** | Business domain | `customer_data`, `product_data`, `sales_data` | Organize by business area |
| **Type** | Data type/role | `identifier`, `metric`, `dimension`, `attribute` | Understand field purpose |
| **Sensitivity** | Data sensitivity | `pii`, `sensitive_info`, `public_data` | Governance and access control |
| **Source** | Data source | `crm_data`, `erp_data`, `third_party` | Track data lineage |
| **Quality** | Data quality | `verified`, `calculated`, `derived` | Understand data reliability |
| **Lifecycle** | Data lifecycle | `active`, `archived`, `deprecated` | Manage data evolution |
| **Compliance** | Regulatory | `gdpr`, `hipaa`, `pci_dss`, `sox` | Compliance tracking |

## Common Operations

### 1. Add Domain Tags

```yaml
auto_generation:
  patterns:
    # Customer data
    - name: "customer_fields"
      match:
        - pattern: "customer_|^cust_|.*_customer$"
      tag: "customer_data"
      confidence: 90

    # Product data
    - name: "product_fields"
      match:
        - pattern: "product_|^prod_|.*_product$"
      tag: "product_data"
      confidence: 90

    # Sales data
    - name: "sales_fields"
      match:
        - pattern: "sale_|revenue|^amount$|price"
      tag: "sales_data"
      confidence: 85
```

**User Request**: "Tag fields by business domain (customer, product, sales)"

### 2. Add Type Tags

```yaml
auto_generation:
  patterns:
    # Identifiers
    - name: "identifiers"
      match:
        - pattern: ".*_id$|^id$|.*_key$|^key$"
      tag: "identifier"
      confidence: 95

    # Metrics
    - name: "metrics"
      match:
        - pattern: "count|total|sum|avg|^amount$|revenue|profit"
      tag: "metric"
      confidence: 85

    # Dimensions
    - name: "dimensions"
      match:
        - pattern: "name|type|category|status|region|segment"
      tag: "dimension"
      confidence: 80
```

**User Request**: "Add tags to identify metrics, dimensions, and identifiers"

### 3. Add Multiple Tags

```yaml
auto_generation:
  patterns:
    # Revenue fields with multiple tags
    - name: "revenue_fields"
      match:
        - pattern: "revenue|^amount$|sales_amount"
      tags: ["financial_metrics", "sales_data", "metric"]
      confidence: 90

    # Customer ID with multiple tags
    - name: "customer_id"
      match:
        - pattern: "^customer_id$"
      tags: ["identifier", "customer_data", "primary_key"]
      confidence: 95
```

**User Request**: "Add multiple tags to revenue and customer ID fields"

### 4. Add Compliance Tags

```yaml
auto_generation:
  patterns:
    # GDPR-relevant fields
    - name: "gdpr_data"
      match:
        - pattern: "email|phone|name|address|ip_address"
      tags: ["gdpr", "pii", "personal_data"]
      confidence: 90

    # PCI-DSS fields
    - name: "pci_data"
      match:
        - pattern: "card_number|cvv|credit_card"
      tags: ["pci_dss", "payment_data", "restricted"]
      confidence: 95

    # HIPAA fields
    - name: "hipaa_data"
      match:
        - pattern: "patient_id|mrn|diagnosis|insurance"
      tags: ["hipaa", "phi", "healthcare_data"]
      confidence: 90
```

**User Request**: "Add compliance tags for GDPR, PCI-DSS, and HIPAA"

### 5. Add Quality Tags

```yaml
auto_generation:
  patterns:
    # Calculated fields
    - name: "calculated_fields"
      match:
        - pattern: ".*_calc$|calculated_|derived_"
      tag: "calculated"
      confidence: 90

    # Verified fields
    - name: "verified_fields"
      match:
        - pattern: "verified_|validated_|confirmed_"
      tag: "verified"
      confidence: 85

    # Deprecated fields
    - name: "deprecated_fields"
      match:
        - pattern: "deprecated_|legacy_|old_"
      tag: "deprecated"
      confidence: 95
```

**User Request**: "Tag calculated, verified, and deprecated fields"

### 6. Add Source Tags

```yaml
auto_generation:
  patterns:
    # CRM data
    - name: "crm_fields"
      match:
        - pattern: "sf_|salesforce_|hubspot_"
      tag: "crm_data"
      confidence: 90

    # ERP data
    - name: "erp_fields"
      match:
        - pattern: "sap_|oracle_|netsuite_"
      tag: "erp_data"
      confidence: 90

    # Third-party data
    - name: "third_party"
      match:
        - pattern: "vendor_|external_|third_party_"
      tag: "third_party_data"
      confidence: 85
```

**User Request**: "Tag fields based on data source (CRM, ERP, third-party)"

## Examples

### Example 1: E-Commerce Tagging Strategy

```yaml
auto_generation:
  patterns:
    # Domain tags
    - name: "customer_domain"
      match:
        - pattern: "customer_|^cust_"
      tags: ["customer_data", "domain:customer"]
      confidence: 90

    - name: "product_domain"
      match:
        - pattern: "product_|^prod_|sku|item"
      tags: ["product_data", "domain:product"]
      confidence: 90

    - name: "order_domain"
      match:
        - pattern: "order_|purchase_|transaction_"
      tags: ["order_data", "domain:orders"]
      confidence: 90

    # Type tags
    - name: "revenue_metrics"
      match:
        - pattern: "revenue|amount|price|total"
      tags: ["metric", "financial_metrics"]
      confidence: 85

    # Identifiers
    - name: "keys"
      match:
        - pattern: ".*_id$|.*_key$"
      tags: ["identifier", "join_key"]
      confidence: 95
```

**Use Case**: Comprehensive tagging for e-commerce data platform

### Example 2: Healthcare Data Governance

```yaml
auto_generation:
  patterns:
    # Protected Health Information (PHI)
    - name: "phi_data"
      match:
        - pattern: "patient_|mrn|diagnosis|medication|procedure"
      tags: ["hipaa", "phi", "restricted", "healthcare_data"]
      confidence: 95

    # Patient identifiers
    - name: "patient_ids"
      match:
        - pattern: "patient_id|mrn|member_id"
      tags: ["identifier", "phi", "hipaa", "patient_identifier"]
      confidence: 95

    # Clinical data
    - name: "clinical"
      match:
        - pattern: "lab_|test_|result_|diagnosis"
      tags: ["clinical_data", "healthcare_data", "protected"]
      confidence: 90

    # Billing data
    - name: "billing"
      match:
        - pattern: "charge|billing|insurance|claim"
      tags: ["financial_data", "billing_data", "restricted"]
      confidence: 85
```

**Use Case**: Healthcare organization with HIPAA compliance requirements

### Example 3: Financial Services Tagging

```yaml
auto_generation:
  patterns:
    # SOX-relevant metrics
    - name: "sox_metrics"
      match:
        - pattern: "revenue|expense|profit|assets|liabilities"
      tags: ["sox", "financial_metrics", "auditable"]
      confidence: 95

    # PCI-DSS payment data
    - name: "payment_data"
      match:
        - pattern: "card_|payment_|account_number"
      tags: ["pci_dss", "payment_data", "restricted"]
      confidence: 95

    # Customer financial data
    - name: "customer_financial"
      match:
        - pattern: "balance|credit_limit|account_status"
      tags: ["customer_data", "financial_data", "confidential"]
      confidence: 90
```

**Use Case**: Financial services company with SOX and PCI-DSS compliance

## Tag Output

### Field Metadata with Tags

```sql
SELECT
    database_name,
    table_name,
    field_name,
    tags
FROM semantic_layer_v1.field_metadata
WHERE 'customer_data' = ANY(tags);
```

### Tag Statistics

```sql
-- Most common tags
SELECT
    tag,
    COUNT(*) as field_count,
    COUNT(DISTINCT database_name || '.' || table_name) as table_count
FROM (
    SELECT
        database_name,
        table_name,
        field_name,
        UNNEST(tags) as tag
    FROM semantic_layer_v1.field_metadata
)
GROUP BY tag
ORDER BY field_count DESC;
```

### Tag Co-occurrence

```sql
-- Tags that appear together
SELECT
    t1.tag as tag1,
    t2.tag as tag2,
    COUNT(*) as co_occurrence
FROM (
    SELECT field_name, UNNEST(tags) as tag
    FROM semantic_layer_v1.field_metadata
) t1
JOIN (
    SELECT field_name, UNNEST(tags) as tag
    FROM semantic_layer_v1.field_metadata
) t2
ON t1.field_name = t2.field_name AND t1.tag < t2.tag
GROUP BY t1.tag, t2.tag
ORDER BY co_occurrence DESC
LIMIT 20;
```

## Testing

### Preview Tags

```bash
# See what tags will be assigned
python semantic_layer_sync.py --config config.yaml --dry-run --show-tags
```

### Validate Tag Configuration

```bash
# Check tag patterns are valid
python semantic_layer_sync.py --config config.yaml --validate-only
```

### Query Tags

```sql
-- Find fields with specific tag
SELECT * FROM semantic_layer_v1.field_metadata
WHERE 'customer_data' = ANY(tags);

-- Find fields with multiple tags
SELECT * FROM semantic_layer_v1.field_metadata
WHERE tags @> ARRAY['pii', 'customer_data'];
```

## Best Practices

### 1. Use Hierarchical Tags

```yaml
# Good: Hierarchical naming
tags: ["domain:customer", "type:identifier", "sensitivity:pii"]

# Avoid: Flat tags only
tags: ["customer", "id", "sensitive"]
```

### 2. Be Specific with Patterns

```yaml
# Good: Specific pattern
- name: "customer_id"
  match:
    - pattern: "^customer_id$|^cust_id$"
  tags: ["identifier", "customer_data", "primary_key"]
  confidence: 95

# Bad: Too broad
- name: "ids"
  match:
    - pattern: "id"
  tags: ["identifier"]
  confidence: 50
```

### 3. Consistent Naming Convention

```yaml
# Use consistent tag naming
tags:
  - "domain:customer"        # Business domain
  - "type:metric"           # Data type
  - "sensitivity:pii"       # Sensitivity level
  - "source:crm"            # Data source
  - "compliance:gdpr"       # Regulatory compliance
```

### 4. Tag for Discovery

```yaml
# Tags should support common search queries
auto_generation:
  patterns:
    # "Show me all revenue metrics"
    - name: "revenue"
      pattern: "revenue|sales_amount"
      tags: ["metric", "revenue", "financial_metrics"]

    # "Show me all customer identifiers"
    - name: "customer_ids"
      pattern: "customer_id|cust_id"
      tags: ["identifier", "customer_data", "join_key"]
```

### 5. Document Tag Taxonomy

```yaml
# config.yaml - Include tag taxonomy
# Tag Taxonomy:
# - domain:* - Business domain (customer, product, sales)
# - type:* - Data type (metric, dimension, identifier)
# - sensitivity:* - Sensitivity (public, internal, confidential, restricted)
# - compliance:* - Regulatory (gdpr, hipaa, pci_dss, sox)
# - source:* - Data source (crm, erp, third_party)

auto_generation:
  patterns:
    - name: "customer_revenue"
      pattern: "customer_revenue"
      tags: ["domain:customer", "type:metric", "source:crm"]
```

### 6. Use Tags for Access Control

```yaml
# Tag-based access policies
auto_generation:
  patterns:
    - name: "restricted_data"
      pattern: "ssn|credit_card|password"
      tags: ["sensitivity:restricted", "access:authorized_only"]
      confidence: 95
```

## Troubleshooting

### Tags Not Applied

**Problem**: Fields not getting expected tags

**Solution**:
1. Check pattern matches field name: `echo "customer_id" | grep -E "customer_"`
2. Verify confidence threshold
3. Check for conflicting patterns
4. Use `--dry-run --show-tags` to debug

### Too Many Tags

**Problem**: Fields have too many tags, making discovery difficult

**Solution**:
1. Review tag patterns and make them more specific
2. Remove redundant tags (e.g., both `pii` and `personal_data`)
3. Consolidate overlapping patterns
4. Use hierarchical tags to reduce clutter

### Tag Conflicts

**Problem**: Same field gets conflicting tags

**Solution**:
1. Review pattern precedence and confidence levels
2. Make patterns more specific to avoid overlap
3. Use pattern ordering (higher priority first)
4. Manually override in data_dictionary.yaml

### Missing Tag Coverage

**Problem**: Many fields have no tags

**Solution**:
1. Add catch-all patterns for common field types
2. Review field naming conventions
3. Add domain-specific patterns
4. Use lower confidence thresholds for broader matching

## Integration

### With PII Detection

```yaml
auto_generation:
  patterns:
    # PII fields get both PII category and tags
    - name: "email"
      pattern: "email|.*_email$"
      pii_category: "email"
      tags: ["pii", "contact_info", "gdpr"]
      confidence: 95
```

### With Validation

```yaml
validation:
  required_tags:
    - "domain:*"                    # All fields must have domain tag
  prohibited_tag_combinations:
    - ["public_data", "pii"]        # Can't be both public and PII
```

### With Search

```sql
-- Search by tags
SELECT * FROM semantic_layer_v1.field_metadata
WHERE tags @> ARRAY['customer_data', 'metric'];

-- Search by tag pattern
SELECT * FROM semantic_layer_v1.field_metadata
WHERE EXISTS (
    SELECT 1 FROM UNNEST(tags) t
    WHERE t LIKE 'domain:%'
);
```

## CLI Commands

```bash
# Show tag patterns
python semantic_layer_sync.py --config config.yaml --show-tag-patterns

# Preview tags (dry-run)
python semantic_layer_sync.py --config config.yaml --dry-run --show-tags

# Apply tags
python semantic_layer_sync.py --config config.yaml --apply --approve

# Validate tag config
python semantic_layer_sync.py --config config.yaml --validate-only

# Query tags
tdx query "SELECT DISTINCT UNNEST(tags) as tag FROM semantic_layer_v1.field_metadata ORDER BY tag"

# Tag statistics
tdx query "SELECT tag, COUNT(*) FROM (SELECT UNNEST(tags) as tag FROM semantic_layer_v1.field_metadata) GROUP BY tag ORDER BY COUNT(*) DESC"
```

## Related Skills

- **semantic-layer-patterns** - Add patterns for tag assignment
- **semantic-layer-pii** - Configure PII categories (different from tags)
- **semantic-layer-validation** - Validate tag requirements
- **semantic-config-master-skill** - Manage all config sections

---

**Status**: ✅ Production Ready
**Skill Type**: Focused / Single-Responsibility
**Last Updated**: 2026-02-16
