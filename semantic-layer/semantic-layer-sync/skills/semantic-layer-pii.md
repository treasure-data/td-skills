---
name: semantic-layer-pii
description: Configure PII detection patterns and categorization for semantic layer. Use when adding PII patterns, configuring PII validation requirements, or managing sensitive data detection.
---

# Semantic Layer PII Skill

**Focused skill for configuring PII (Personally Identifiable Information) detection, categorization, and validation in the semantic layer.**

## Purpose

Configure PII detection and validation to:
- Add custom PII detection patterns
- Configure PII categorization
- Set PII validation requirements
- Manage sensitive data governance

## When to Use This Skill

✅ **Use this skill when:**
- "Add SSN pattern to PII detection"
- "Detect credit card numbers as PII"
- "Require PII fields to have owners"
- "Show me all PII categories"
- "Configure GDPR compliance for PII"

❌ **Don't use this skill for:**
- Adding non-PII patterns (use `semantic-layer-patterns`)
- Setting general validation rules (use `semantic-layer-validation`)
- Configuring database scope (use `semantic-layer-scope`)

## Configuration Sections

This skill manages PII-related config in two places:

### 1. PII Detection Patterns

```yaml
auto_generation:
  generate:
    pii_detection: bool                # Enable PII detection
  patterns:
    - name: string
      match:
        - pattern: string              # Regex pattern
      tag: string
      pii_category: string             # PII category
      confidence: int
```

### 2. PII Validation Requirements

```yaml
validation:
  require_owner_for_pii_fields: bool
  pii_validation:
    require_pii_category: bool
    require_owner: bool
    require_data_classification: bool
```

## Built-in PII Categories

| Category | Examples | Common Patterns | Compliance |
|----------|----------|-----------------|------------|
| `email` | Email addresses | `email`, `email_address` | GDPR, CCPA |
| `phone` | Phone numbers | `phone`, `telephone`, `mobile` | GDPR, CCPA |
| `name` | Personal names | `first_name`, `last_name`, `full_name` | GDPR, CCPA |
| `address` | Physical addresses | `street`, `city`, `zip_code` | GDPR, CCPA |
| `dob` | Date of birth | `date_of_birth`, `birth_date` | GDPR, HIPAA |
| `ssn` | Social security numbers | `ssn`, `social_security_number` | CCPA, HIPAA |
| `credit_card` | Payment cards | `card_number`, `credit_card` | PCI-DSS |
| `ip_address` | IP addresses | `ip_address`, `ip_addr` | GDPR |
| `patient_id` | Healthcare IDs | `mrn`, `patient_id` | HIPAA |
| `financial` | Bank accounts, routing | `account_number`, `routing_number` | SOX, PCI-DSS |

## Built-in PII Patterns

```yaml
auto_generation:
  patterns:
    # Email
    - name: "email"
      match:
        - pattern: "email|^mail$|.*_email$"
      tag: "contact_info"
      pii_category: "email"
      confidence: 95

    # Phone
    - name: "phone"
      match:
        - pattern: "phone|telephone|mobile|^tel$|.*_phone$"
      tag: "contact_info"
      pii_category: "phone"
      confidence: 95

    # Names
    - name: "names"
      match:
        - pattern: "^(first|last|full)_name$|^name$"
      tag: "personal_info"
      pii_category: "name"
      confidence: 90

    # Address
    - name: "address"
      match:
        - pattern: "address|street|city|state|zip|postal"
      tag: "location"
      pii_category: "address"
      confidence: 85

    # Date of Birth
    - name: "dob"
      match:
        - pattern: "dob|date_of_birth|birth_date|birthdate"
      tag: "personal_info"
      pii_category: "dob"
      confidence: 90
```

## Common Operations

### 1. Add SSN Detection

```yaml
auto_generation:
  patterns:
    - name: "ssn"
      match:
        - pattern: "^ssn$|social_security|.*_ssn$"
      tag: "sensitive_info"
      pii_category: "ssn"
      confidence: 95
```

**User Request**: "Add SSN pattern to PII detection"

### 2. Add Credit Card Detection

```yaml
auto_generation:
  patterns:
    - name: "credit_card"
      match:
        - pattern: "card_number|credit_card|cc_number|pan"
      tag: "payment_info"
      pii_category: "credit_card"
      confidence: 95
```

**User Request**: "Detect credit card fields as PII"

### 3. Require PII Owners

```yaml
validation:
  require_owner_for_pii_fields: true
  pii_validation:
    require_pii_category: true
    require_owner: true
    require_data_classification: true
```

**User Request**: "Require all PII fields to have owners and data classification"

### 4. Add Healthcare PII

```yaml
auto_generation:
  patterns:
    # Medical Record Number
    - name: "mrn"
      match:
        - pattern: "^mrn$|medical_record|patient_id"
      tag: "healthcare_identifier"
      pii_category: "patient_id"
      confidence: 95

    # Health Insurance
    - name: "insurance"
      match:
        - pattern: "insurance_number|policy_number|member_id"
      tag: "healthcare_info"
      pii_category: "insurance_id"
      confidence: 90
```

**User Request**: "Add HIPAA-compliant PII patterns for healthcare"

### 5. Add Financial PII

```yaml
auto_generation:
  patterns:
    # Bank Account
    - name: "bank_account"
      match:
        - pattern: "account_number|bank_account|iban"
      tag: "financial_info"
      pii_category: "financial_account"
      confidence: 95

    # Routing Number
    - name: "routing_number"
      match:
        - pattern: "routing_number|aba_number|swift"
      tag: "financial_info"
      pii_category: "financial_routing"
      confidence: 95
```

**User Request**: "Add patterns for bank accounts and routing numbers"

## Examples

### Example 1: GDPR Compliance

```yaml
auto_generation:
  generate:
    pii_detection: true
  patterns:
    # EU-specific PII
    - name: "email"
      pattern: "email|.*_email$"
      pii_category: "email"
      confidence: 95

    - name: "phone"
      pattern: "phone|mobile"
      pii_category: "phone"
      confidence: 95

    - name: "ip_address"
      pattern: "ip_address|ip_addr|user_ip"
      pii_category: "ip_address"
      confidence: 90

validation:
  require_owner_for_pii_fields: true
  pii_validation:
    require_pii_category: true
    require_owner: true
    require_data_classification: true
```

**Use Case**: EU-based company requiring GDPR compliance

### Example 2: HIPAA Compliance

```yaml
auto_generation:
  patterns:
    # Protected Health Information (PHI)
    - name: "mrn"
      pattern: "^mrn$|medical_record|patient_id"
      pii_category: "patient_id"
      confidence: 95

    - name: "ssn"
      pattern: "^ssn$|social_security"
      pii_category: "ssn"
      confidence: 95

    - name: "dob"
      pattern: "dob|date_of_birth|birth_date"
      pii_category: "dob"
      confidence: 90

    - name: "health_insurance"
      pattern: "insurance_number|policy_number|member_id"
      pii_category: "insurance_id"
      confidence: 90

validation:
  pii_validation:
    require_pii_category: true
    require_owner: true
    require_data_classification: true
```

**Use Case**: Healthcare organization requiring HIPAA compliance

### Example 3: PCI-DSS Compliance

```yaml
auto_generation:
  patterns:
    # Payment Card Industry
    - name: "credit_card"
      pattern: "card_number|cc_number|pan|credit_card"
      pii_category: "credit_card"
      confidence: 95

    - name: "cvv"
      pattern: "^cvv$|cvv2|card_security_code|cvc"
      pii_category: "cvv"
      confidence: 95

    - name: "expiry"
      pattern: "expiry|expiration|exp_date"
      pii_category: "card_expiry"
      confidence: 85

validation:
  pii_validation:
    require_pii_category: true
    require_owner: true
    require_data_classification: true
```

**Use Case**: E-commerce company processing payments

## PII Output

### Field Metadata Table

```sql
SELECT * FROM semantic_layer_v1.field_metadata WHERE is_pii = 1;
```

| database | table | field | pii_category | owner | data_classification | tags |
|----------|-------|-------|--------------|-------|---------------------|------|
| customers | users | email | email | data-team | Confidential | [contact_info, pii] |
| customers | users | phone | phone | data-team | Confidential | [contact_info, pii] |
| customers | users | ssn | ssn | security-team | Restricted | [sensitive_info, pii] |
| orders | payments | card_number | credit_card | payments-team | Restricted | [payment_info, pii] |

### PII Summary Report

```sql
-- PII fields by category
SELECT
    pii_category,
    COUNT(*) as field_count,
    COUNT(DISTINCT database_name || '.' || table_name) as table_count
FROM semantic_layer_v1.field_metadata
WHERE is_pii = 1
GROUP BY pii_category
ORDER BY field_count DESC;
```

## Data Classification Levels

| Level | Examples | Access | PII Categories |
|-------|----------|--------|----------------|
| **Public** | Marketing content | All employees | None |
| **Internal** | Business metrics | Employees only | None |
| **Confidential** | Customer data | Need-to-know | email, phone, name, address |
| **Restricted** | Sensitive PII | Authorized only | ssn, credit_card, patient_id |

## Testing

### Test PII Detection

```bash
# Dry-run to see detected PII
python semantic_layer_sync.py --config config.yaml --dry-run --show-pii
```

### Validate PII Configuration

```bash
# Check PII validation rules
python semantic_layer_sync.py --config config.yaml --validate-only
```

### Query PII Fields

```sql
-- Find all PII fields
SELECT
    database_name,
    table_name,
    field_name,
    pii_category,
    owner,
    data_classification
FROM semantic_layer_v1.field_metadata
WHERE is_pii = 1
ORDER BY database_name, table_name;
```

## Best Practices

### 1. High Confidence for PII

```yaml
# PII patterns should be very confident
auto_generation:
  patterns:
    - name: "ssn"
      pattern: "^ssn$|social_security"
      pii_category: "ssn"
      confidence: 95              # High confidence for PII
```

### 2. Always Require PII Owners

```yaml
validation:
  require_owner_for_pii_fields: true    # ALWAYS enforce
  pii_validation:
    require_pii_category: true
    require_owner: true
```

### 3. Use Specific Patterns

```yaml
# Good: Specific patterns
pattern: "^ssn$|^social_security_number$"

# Bad: Too broad
pattern: "ssn|social"
```

### 4. Document Compliance Requirements

```yaml
auto_generation:
  patterns:
    # GDPR Article 9 - Special Category Data
    # Rationale: EU personal data requiring explicit consent
    # Owner: Data Privacy Office
    - name: "email"
      pattern: "email|.*_email$"
      pii_category: "email"
```

### 5. Test Before Production

```bash
# Test PII detection on dev
python semantic_layer_sync.py --config config.dev.yaml --dry-run --show-pii
```

## Troubleshooting

### PII Not Detected

**Problem**: Sensitive fields not marked as PII

**Solution**:
1. Check field name matches pattern: `echo "email" | grep -E "email|.*_email$"`
2. Verify `pii_detection: true` in config
3. Check confidence threshold isn't too high
4. Add custom pattern for your naming convention

### False Positives

**Problem**: Non-PII fields marked as PII

**Solution**:
1. Make patterns more specific: `^email$` not `email`
2. Use negative lookahead: `(?!.*_test)email`
3. Increase confidence threshold for auto-approval
4. Manually correct in data_dictionary.yaml

### Missing PII Category

**Problem**: "PII field missing category" error

**Solution**:
1. Check pattern has `pii_category` field
2. Verify category is valid (see built-in categories)
3. Check validation requires PII category
4. Manually add category in data_dictionary.yaml

## Integration

### With Data Classification

```yaml
auto_generation:
  patterns:
    - name: "ssn"
      pii_category: "ssn"
      data_classification: "Restricted"    # Auto-set classification

validation:
  pii_validation:
    require_data_classification: true      # Validate classification
```

### With Access Control

```yaml
# PII fields requiring restricted access
SELECT
    database_name,
    table_name,
    field_name
FROM semantic_layer_v1.field_metadata
WHERE data_classification = 'Restricted'
```

### With Compliance Reporting

```sql
-- GDPR compliance report
SELECT
    'GDPR' as regulation,
    pii_category,
    COUNT(*) as field_count,
    COUNT(CASE WHEN owner IS NULL THEN 1 END) as missing_owner,
    COUNT(CASE WHEN data_classification IS NULL THEN 1 END) as missing_classification
FROM semantic_layer_v1.field_metadata
WHERE pii_category IN ('email', 'phone', 'name', 'address', 'ip_address')
GROUP BY pii_category;
```

## CLI Commands

```bash
# Show PII patterns
python semantic_layer_sync.py --config config.yaml --show-pii-patterns

# Test PII detection (dry-run)
python semantic_layer_sync.py --config config.yaml --dry-run --show-pii

# Apply PII detection
python semantic_layer_sync.py --config config.yaml --apply --approve

# Validate PII config
python semantic_layer_sync.py --config config.yaml --validate-only

# Query PII fields
tdx query "SELECT * FROM semantic_layer_v1.field_metadata WHERE is_pii = 1"
```

## Related Skills

- **semantic-layer-patterns** - Add non-PII patterns
- **semantic-layer-validation** - Set PII validation requirements
- **semantic-layer-tags** - Manage PII-related tags
- **semantic-config-master-skill** - Manage all config sections

---

**Status**: ✅ Production Ready
**Skill Type**: Focused / Single-Responsibility
**Last Updated**: 2026-02-16
**Compliance**: GDPR, CCPA, HIPAA, PCI-DSS, SOX
