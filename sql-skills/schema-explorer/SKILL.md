---
name: schema-explorer
description: USE THIS SKILL BY DEFAULT for all database schema queries, table discovery, column exploration, and PII detection. Lists databases with metadata, explores table schemas with data types, searches for tables/columns by keyword, discovers PII fields across databases, and shows table relationships. Automatically invoke for questions like "what tables", "find tables", "show schema", "describe table", "list databases", "find PII", "discover data", "what columns", or any schema-related query.
---

# Schema Explorer

Intelligent database and table discovery for data analysts. Explore schemas, search for relevant tables, and understand data structure before analysis.

## 🔴 DEFAULT USAGE - AUTOMATIC INVOCATION

**CRITICAL: This skill is the DEFAULT for ALL schema-related queries.**

**Automatically invoke this skill when users ask:**
- "What databases are available?" / "List databases"
- "What tables are in [database]?" / "Show me tables"
- "What's the schema for [table]?" / "Describe [table]"
- "Find tables with [keyword]" / "Search for tables"
- "Which tables have [column_type]?" / "Find PII columns"
- "List all databases" / "Explore database structure"
- Any question about databases, tables, columns, schema, or structure

**No explicit skill invocation needed** - this skill should be used automatically whenever schema exploration is requested.

## When to Use This Skill

Use when analysts need to:
- Discover available databases and tables
- Understand table schemas and column types
- Find tables containing specific data (e.g., "customer", "revenue")
- Explore data structure before writing queries
- Get table metadata (row counts, last updated, size)

**Example prompts:**
- "What databases are available?"
- "Show me all tables in sales_db"
- "Find tables with email addresses"
- "What's the schema for users table?"
- "Which tables contain transaction data?"

## Core Commands

### List Databases

```bash
# List all databases
tdx databases

# List with JSON output for parsing
tdx databases --json

# Filter databases by pattern
tdx databases "prod_*"

# Specific site
tdx databases --site jp01
```

**Output format:**
```
database_name_1
database_name_2
database_name_3
```

### List Tables

```bash
# Set database context first
tdx use database sales_db

# List all tables
tdx tables

# Filter tables
tdx tables "user_*"

# List tables from specific database
tdx tables "sales_db.*"

# JSON output for metadata
tdx tables --json
```

**Output format:**
```
table_name_1
table_name_2
table_name_3
```

### Describe Table Schema

```bash
# Show table schema
tdx describe sales_db.orders

# With database context set
tdx use database sales_db
tdx describe orders
```

**Output format:**
```
Column Name       Type        Description
-----------       ----        -----------
order_id          bigint
customer_id       bigint
amount            double
currency          varchar
time              bigint      (Unix timestamp)
created_at        varchar
```

### Preview Table Data

```bash
# Show sample records
tdx show sales_db.orders --limit 10

# With specific columns
tdx query "select order_id, customer_id, amount from sales_db.orders where td_interval(time, '-1d') limit 10"
```

## Search Patterns

### Find Tables by Keyword

**Pattern:** Search table names for keywords

```bash
# Find all tables with "customer" in name
tdx tables "*customer*"

# Find all tables with "event" in any database
tdx tables "*.event*"

# Find tables starting with "fact_"
tdx tables "fact_*"
```

**Example workflow:**
1. User: "Find tables with customer data"
2. Execute: `tdx tables "*customer*"`
3. Execute: `tdx tables "*user*"`
4. Present: Combined list with database context

### Find Columns by Type

**Pattern:** Describe tables and filter by column characteristics

```bash
# Get schema for candidate tables
tdx describe database_name.table_name --json

# Parse JSON to find columns by:
# - Data type (varchar for emails, bigint for IDs)
# - Name pattern (email, user_id, revenue)
```

**Example workflow:**
1. User: "Which tables have email addresses?"
2. Get table list: `tdx tables --json`
3. For each table: `tdx describe table_name --json`
4. Filter: columns with type=varchar and name contains "email"
5. Present: Organized results

## Discovery Workflows

### Workflow 1: Database Overview

**User prompt:** "What data is available?"

**Steps:**
1. List databases: `tdx databases --json`
2. For key databases, list tables: `tdx tables "database_name.*"`
3. Present organized summary:

```markdown
## Available Databases

### sales_db (45 tables)
- orders, order_items, customers, products
- transactions, payments, refunds

### marketing_db (23 tables)
- campaigns, events, user_events
- conversions, attributions

### analytics_db (12 tables)
- user_sessions, page_views
- daily_metrics, weekly_rollups
```

### Workflow 2: Table Deep Dive

**User prompt:** "Show me the schema for sales_db.orders"

**Steps:**
1. Describe table: `tdx describe sales_db.orders`
2. Get sample data: `tdx query "select * from sales_db.orders where td_interval(time, '-1d') limit 5"`
3. Get row count estimate: `tdx query "select approx_distinct(order_id) as approx_orders from sales_db.orders where td_interval(time, '-30d')"`
4. Present comprehensive view:

```markdown
## sales_db.orders Schema

| Column | Type | Sample Values |
|--------|------|---------------|
| order_id | bigint | 123456, 123457, 123458 |
| customer_id | bigint | 9001, 9002, 9003 |
| amount | double | 129.99, 49.50, 299.00 |
| currency | varchar | USD, JPY, EUR |
| time | bigint | 1705334400 (2024-01-15) |
| status | varchar | completed, pending, cancelled |

**Recent Activity:** ~15,000 orders (last 30 days)
**Time Range:** 2023-01-01 to present
```

### Workflow 3: Column Search

**User prompt:** "Find all tables with customer_id column"

**Steps:**
1. Get all tables: `tdx tables --json`
2. For each table: `tdx describe table_name --json`
3. Filter tables with "customer_id" column
4. Present results:

```markdown
## Tables with customer_id Column

### Transactional Data
- **sales_db.orders** (bigint) - Primary customer reference
- **sales_db.payments** (bigint) - Payment customer ID
- **sales_db.refunds** (bigint) - Refund customer reference

### Event Data
- **analytics_db.user_events** (varchar) - Event customer identifier
- **marketing_db.conversions** (bigint) - Conversion customer ID

### Master Data
- **core_db.customers** (bigint, PRIMARY KEY) - Customer master table
```

## Smart Recommendations

### Suggest Related Tables

When user explores a table, suggest related tables:

**Example:** User explores `sales_db.orders`

**Suggestions:**
```markdown
## Related Tables You Might Need

**Customer Details:**
- `core_db.customers` - Customer master data (join on customer_id)

**Order Items:**
- `sales_db.order_items` - Line item details (join on order_id)

**Product Information:**
- `sales_db.products` - Product catalog (join via order_items.product_id)

**Payment Data:**
- `sales_db.payments` - Payment transactions (join on order_id)
```

### Table Metadata Summary

Provide context about tables:

```bash
# Get table statistics
tdx query "select
  approx_distinct(order_id) as approx_orders,
  min(from_unixtime(time)) as earliest_date,
  max(from_unixtime(time)) as latest_date,
  approx_distinct(customer_id) as approx_customers
from sales_db.orders
where td_interval(time, '-90d')"
```

**Present as:**
```markdown
## sales_db.orders Statistics (Last 90 Days)

- **Total Orders:** ~125,000
- **Unique Customers:** ~8,500
- **Date Range:** 2024-10-15 to 2025-01-15
- **Update Frequency:** Real-time (streaming ingestion)
```

## Best Practices

1. **Always use time filters** when sampling data - avoid full table scans
2. **Use approx_distinct()** for row counts - faster than count(distinct)
3. **Set database context** with `tdx use database` to simplify commands
4. **Cache results** when exploring multiple tables in same database
5. **Provide context** - show sample data with schema descriptions

## Output Formatting

### Database List

Present databases with context:

```markdown
## Available Databases

| Database | Tables | Primary Use |
|----------|--------|-------------|
| sales_db | 45 | Transactional sales data |
| marketing_db | 23 | Marketing campaigns and events |
| analytics_db | 12 | User behavior and metrics |
| core_db | 8 | Master data (customers, products) |
```

### Table Schema

Use consistent table format:

```markdown
## Table: sales_db.orders

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| order_id | bigint | NO | Unique order identifier |
| customer_id | bigint | NO | Customer reference |
| amount | double | NO | Order total amount |
| currency | varchar | YES | Currency code (USD, JPY, EUR) |
| time | bigint | NO | Order timestamp (Unix epoch) |
| status | varchar | YES | Order status |

**Primary Key:** order_id
**Foreign Keys:** customer_id → core_db.customers.customer_id
```

### Search Results

Group by relevance:

```markdown
## Search Results: "customer"

### Exact Matches (3)
- `core_db.customers` - Customer master table
- `core_db.customer_segments` - Customer segmentation
- `analytics_db.customer_metrics` - Aggregated customer KPIs

### Partial Matches (7)
- `sales_db.orders` - Contains customer_id column
- `sales_db.payments` - Contains customer_id column
- `marketing_db.customer_journey` - Customer touchpoints
...
```

## Integration with Other Skills

**Chain with:**
- **data-profiler** - After discovery, profile interesting tables
- **smart-sampler** - Sample data from discovered tables
- **analytical-query** - Generate queries using discovered schema

**Example flow:**
```
User: "What customer data is available?"
→ schema-explorer: Find customer-related tables
→ data-profiler: Profile customers table
→ smart-sampler: Show sample customer records
→ analytical-query: "Count customers by segment"
```

## Common Patterns

### Pattern 1: New Database Exploration

```bash
# Step 1: List databases
tdx databases

# Step 2: Explore target database
tdx use database sales_db
tdx tables

# Step 3: Understand key tables
tdx describe orders
tdx describe customers
tdx describe products

# Step 4: Sample data
tdx show orders --limit 5
```

### Pattern 2: Find Data for Analysis

**User need:** "I need to analyze customer purchase behavior"

**Discovery steps:**
1. Search for customer tables: `tdx tables "*customer*"`
2. Search for order/purchase tables: `tdx tables "*order*"`, `tdx tables "*purchase*"`
3. Describe promising tables
4. Identify join keys (customer_id)
5. Present table relationship map

### Pattern 3: Schema Validation

**User need:** "Does the orders table have shipping_address?"

**Steps:**
1. Describe table: `tdx describe sales_db.orders`
2. Parse schema for column name
3. Present result with data type and sample values if exists

### Pattern 4: PII (Personally Identifiable Information) Discovery

**User need:** "Find all tables with PII fields across my databases"

**Comprehensive PII Types Searched:**
- EMAIL: email, email_address, mail, contact_email, primary_email, secondary_email, work_email
- PHONE: phone, phone_number, mobile, mobile_phone, cell_phone, cell, telephone, contact_phone
- ADDRESS: address, street_address, street, addr, address_line, addr_line, mailing_address, home_address, business_address, zip, postal_code, zipcode, postcode, city, state, province, country
- NAME: first_name, last_name, full_name, given_name, family_name, surname, middle_name, name
- IDENTIFIER: ssn, social_security, driver_license, license, driver_license_number, passport, passport_number, national_id
- FINANCIAL: credit_card, card_number, bank_account, account_number, routing_number, iban
- BIOMETRIC: dob, date_of_birth, birth_date, date_of_birth, mother_name, maiden_name
- HEALTH: medical_record, health_id, health_number, insurance_id, insurance_number
- CONSENT: consent, opt_in, opt_out, marketing_consent, email_consent, privacy_consent, gdpr_consent

**Discovery Steps:**
1. List all databases or filter by pattern: `tdx databases`
2. For each database, list tables: `tdx use database <db> && tdx tables`
3. For tables matching PII patterns, describe schema: `tdx describe <db>.<table>`
4. Parse column names against comprehensive PII patterns
5. Consolidate findings by PII category
6. Generate risk assessment and statistics

**Output Format (Consolidated, NO DATA VALUES):**

```markdown
## PII Discovery Report - <date>

### Executive Summary
- **Total PII columns found:** X
- **Total tables with PII:** Y
- **Total databases with PII:** Z
- **Highest risk database:** <database_name> (N PII columns in M tables)

### PII Statistics by Type

| PII Category | Column Count | Affected Tables | Risk Level |
|--------------|--------------|-----------------|-----------|
| EMAIL | X | Y | HIGH |
| PHONE | X | Y | HIGH |
| ADDRESS | X | Y | HIGH |
| NAME | X | Y | MEDIUM |
| IDENTIFIER | X | Y | CRITICAL |
| FINANCIAL | X | Y | CRITICAL |

### Top 10 Tables with Most PII

| Database | Table | PII Columns | PII Types | Risk Level |
|----------|-------|-------------|-----------|-----------|
| <db> | <table> | X | EMAIL, PHONE, ADDRESS, NAME | CRITICAL |
| <db> | <table> | X | EMAIL, NAME | HIGH |
| ... | ... | ... | ... | ... |

### Detailed PII Inventory (SCHEMA ONLY - NO DATA)

#### Database: <database_name>

**Table: <table_name>** (X total columns, Y PII columns)

| Column Name | Data Type | PII Category | Sensitivity |
|-------------|-----------|--------------|-------------|
| email | varchar | EMAIL | HIGH |
| phone_number | varchar | PHONE | HIGH |
| address_line_1 | varchar | ADDRESS | HIGH |
| first_name | varchar | NAME | MEDIUM |
| ssn | varchar | IDENTIFIER | CRITICAL |
| credit_card | varchar | FINANCIAL | CRITICAL |

---

**Table: <table_name>** (X total columns, Y PII columns)
[Similar format as above]

---

### Risk Assessment by Database

#### 🔴 CRITICAL Databases
- **<database_name>** (X PII columns in Y tables)
  - Contains FINANCIAL data (credit cards, bank accounts)
  - Contains IDENTIFIER data (SSN, passport, driver license)
  - Recommendation: Implement encryption, access controls, audit logging

#### 🟠 HIGH Risk Databases
- **<database_name>** (X PII columns in Y tables)
  - Contains EMAIL and PHONE data linked across multiple tables
  - Recommendation: Implement RLS, masking in dev/test environments

#### 🟡 MEDIUM Risk Databases
- **<database_name>** (X PII columns in Y tables)
  - Contains NAME and ADDRESS data
  - Recommendation: Data classification, access control review

### Governance Recommendations

1. **Data Classification:** Tag all tables with PII fields as SENSITIVE or CONFIDENTIAL
2. **Access Control:** Implement role-based access control (RBAC) for high-risk databases
3. **Data Masking:** Enable masking in development/test environments for all PII columns
4. **Encryption:** Implement column-level encryption for CRITICAL PII types
5. **Audit Logging:** Enable audit logging for all PII table access
6. **Data Retention:** Review retention policies for PII-containing tables
7. **GDPR/CCPA:** Implement right-to-be-forgotten (erasure) workflows
```

**Example Workflow Execution:**

```bash
# Step 1: List high-risk databases
tdx databases | grep -E "^(test_|prod_|marketing_|ml_)"

# Step 2: For each high-risk database
tdx use database test_gurbaksh

# Step 3: List all tables
tdx tables

# Step 4: For tables matching PII patterns (customer*, contact*, user*, profile*)
tdx describe test_gurbaksh.customers
tdx describe test_gurbaksh.contacts
tdx describe test_gurbaksh.user_profile

# Step 5: Parse and consolidate results
# - Extract column names and data types
# - Match against PII patterns
# - Categorize by PII type
# - Calculate statistics
# - Generate consolidated report
```

**Security Best Practices:**

⚠️ **IMPORTANT: Never Display Actual PII Data**
- Only show schema information (table name, column name, data type, PII category)
- Use masked or sample indicators (e.g., "3 email columns found" not actual emails)
- Document column usage and sensitivity but NOT values
- Always run PII discovery in read-only mode
- Log all PII discovery queries for audit purposes

**Integration with Data Governance:**

- **Link to data-profiler:** After identifying PII tables, use data-profiler to understand data quality (null %, unique %)
- **Link to smart-sampler:** Sample non-PII columns only to understand table structure
- **Link to analytical-query:** Generate GDPR-compliant queries that use anonymization/pseudonymization

**Common PII Discovery Scenarios:**

1. **Compliance Audit:** "Find all PII tables to assess GDPR/CCPA compliance"
2. **Data Governance:** "Identify tables needing masking in dev environments"
3. **Security Assessment:** "Find highest-risk tables with financial/health data"
4. **Data Lineage:** "Trace PII data flows between source and target systems"
5. **Access Control Review:** "Identify who has access to PII-containing tables"

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Table not found" | Verify database context with `tdx status` |
| "Permission denied" | Check site with `tdx databases --site jp01` |
| No tables returned | Use wildcard pattern: `tdx tables "*"` |
| Describe fails | Ensure table exists: `tdx tables "table_name"` |

## Example Interactions

### Example 1: Beginner Exploration

**User:** "I'm new here, what data can I analyze?"

**Response:**
```bash
# Execute
tdx databases --json
tdx tables "sales_db.*"
tdx tables "analytics_db.*"
```

**Present:**
```markdown
Welcome! Here's an overview of available data:

## Sales Data (sales_db)
- **orders** - Customer orders and transactions
- **customers** - Customer master data
- **products** - Product catalog
- **order_items** - Order line items

## Analytics Data (analytics_db)
- **user_sessions** - User session tracking
- **page_views** - Website page views
- **conversions** - Conversion events

**Recommended starting point:** Explore `sales_db.orders` for transaction analysis
or `analytics_db.user_sessions` for behavior analysis.
```

### Example 2: Specific Search

**User:** "Find tables with email columns"

**Response:**
```bash
# Execute for each table
tdx tables --json
# For each table: tdx describe <table> --json
# Filter results
```

**Present:**
```markdown
## Tables with Email Columns

| Table | Column Name | Type | Notes |
|-------|-------------|------|-------|
| core_db.customers | email | varchar | Primary email |
| core_db.customers | secondary_email | varchar | Optional |
| marketing_db.subscribers | email_address | varchar | Newsletter email |
| marketing_db.campaigns | sender_email | varchar | Campaign sender |
| analytics_db.user_profiles | contact_email | varchar | User contact |

**Data Privacy Note:** Email columns may contain PII. Ensure compliance when querying.
```

## Related Skills

- **trino** - Core Trino SQL reference
- **tdx-basic** - tdx CLI fundamentals
- **data-profiler** - Deep table analysis
- **smart-sampler** - Data sampling
- **analytical-query** - Query generation

## Resources

- tdx CLI: https://tdx.treasuredata.com/
- TD Data Types: https://docs.treasuredata.com/
