---
name: schema-explorer
description: Database schema discovery - lists databases, explores table schemas, searches tables/columns by keyword, discovers PII fields. Triggers for "what tables", "find tables", "show schema", "describe table", "list databases", "find PII", or any schema query.
---

# Schema Explorer

Database and table discovery for data analysts.

## Core Commands

```bash
# List databases
tdx databases
tdx databases --json
tdx databases "prod_*"

# List tables
tdx use database sales_db
tdx tables
tdx tables "user_*"
tdx tables "sales_db.*"

# Describe schema
tdx describe sales_db.orders

# Preview data
tdx show sales_db.orders --limit 10
```

## Search Patterns

```bash
# Find tables by keyword
tdx tables "*customer*"
tdx tables "*.event*"
tdx tables "fact_*"

# Find columns: Describe tables and filter by type/name
tdx describe table_name --json
# Parse for: type=varchar and name contains "email"
```

## Workflows

### Database Overview

```bash
tdx databases --json
tdx tables "database_name.*"
```

Present: Organized database/table summary

### Table Deep Dive

```bash
tdx describe sales_db.orders
tdx query "select * from sales_db.orders where td_interval(time, '-1d') limit 5"
```

### Column Search

```bash
tdx tables --json
tdx describe table_name --json
# Filter for column name/type
```

---

## Output Format

### Database List

```markdown
| Database | Tables | Use |
|----------|--------|-----|
| sales_db | 45 | Transactional |
| marketing_db | 23 | Campaigns |
```

### Table Schema

```markdown
## sales_db.orders

| Column | Type | Description |
|--------|------|-------------|
| order_id | bigint | Unique ID |
| customer_id | bigint | Customer ref |
| amount | double | Total |
```

---

## Best Practices

1. Use time filters when sampling
2. Use approx_distinct() for counts
3. Set database context with `tdx use database`

---

## Common Patterns

```bash
# New database exploration
tdx databases
tdx use database sales_db
tdx tables
tdx describe orders

# Find data for analysis
tdx tables "*customer*"
tdx tables "*order*"
tdx describe promising_table

# Schema validation
tdx describe sales_db.orders
# Check for column
```

### Pattern 4: PII Discovery

**PII Types:**
- EMAIL, PHONE, ADDRESS, NAME (HIGH)
- IDENTIFIER (ssn, passport), FINANCIAL (credit_card, bank_account) (CRITICAL)
- BIOMETRIC (dob), HEALTH, CONSENT (MEDIUM)

**Discovery:**
```bash
tdx databases
tdx use database <db> && tdx tables
tdx describe <db>.<table>
# Parse column names against PII patterns
```

**Output (SCHEMA ONLY - NO DATA):**

```markdown
## PII Discovery Report

**Summary:** X PII columns in Y tables across Z databases

| PII Type | Columns | Tables | Risk |
|----------|---------|--------|------|
| EMAIL | 12 | 5 | HIGH |
| IDENTIFIER | 3 | 2 | CRITICAL |

| Database | Table | PII Columns | Types | Risk |
|----------|-------|-------------|-------|------|
| customers_db | users | 5 | EMAIL, PHONE, NAME | HIGH |

**Recommendations:**
1. Data classification & access control
2. Masking in dev/test environments
3. Encryption for CRITICAL types
4. Audit logging
```

⚠️ **Never display actual PII values** - only schema metadata

