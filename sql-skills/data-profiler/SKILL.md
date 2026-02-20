---
name: data-profiler
description: Automated data quality and distribution analysis with professional Plotly visualizations. Generates column-level statistics (count, nulls, unique values, min/max), distribution charts (histograms, box plots), percentile analysis, and data quality metrics. Use when analysts need to understand data characteristics, distributions, or quality before analysis.
---

# Data Profiler

**CRITICAL: This skill MUST be used for ALL table profiling requests. Follow the MANDATORY WORKFLOW exactly as specified.**

Comprehensive data profiling with automatic data type detection (JSON, ARRAY, nested structures), distribution visualizations, and actionable quality insights.

## 🔴 DEFAULT USAGE - AUTOMATIC INVOCATION

**CRITICAL: This skill is the DEFAULT for ALL profiling, analysis, and data quality queries.**

**Automatically invoke this skill when users ask:**
- "Profile [table/database]" / "Analyze [table/database]"
- "Show me stats for [table]" / "Get statistics"
- "What's in [table]?" / "Describe data in [table]"
- "Data quality check" / "Check data quality"
- "Show distributions" / "Analyze data quality"
- "Profile this table" / "Give me table statistics"
- Any question about profiling, analyzing, stats, quality, or distributions

**No explicit skill invocation needed** - this skill should be used automatically whenever profiling or analysis is requested.

## When to Use This Skill (ALWAYS)

**MANDATORY**: Use this skill whenever users request:
- "Profile [table_name]"
- "Analyze [table_name]"
- "Show me stats for [table_name]"
- "What's in [table_name]?"
- "Data quality check for [table_name]"
- Any request to understand table contents, distributions, or quality

**Example prompts:**
- "Profile the orders table from sales_db"
- "Show me data quality metrics for user_events in the last 7 days"
- "What's the distribution of revenue in transactions table?"
- "Analyze the customer_age column from customers table"
- "Profile all numeric columns in sales_db.orders"

## 🔴 MANDATORY WORKFLOW - FOLLOW EXACTLY

When profiling ANY table, you MUST complete ALL steps below. Do NOT skip steps or deviate from this workflow.

### ✅ PROFILING CHECKLIST (REQUIRED)

Execute these steps in order:

- [ ] **Step 1**: Get table schema with `tdx describe [database.table]`
- [ ] **Step 2**: Get comprehensive statistics (row count, date range, null analysis)
- [ ] **Step 3**: Detect data types for EACH column (JSON, Array, Nested, Numeric, Categorical, Timestamp)
- [ ] **Step 4**: Extract sample values for EACH column (3-5 examples)
- [ ] **Step 4b**: 🔴 **MANDATORY FOR JSON COLUMNS**: Sample 20+ JSON records and PARSE them to discover ALL key paths
- [ ] **Step 4c**: 🔴 **MANDATORY FOR JSON COLUMNS**: List ALL discovered key paths ($.key, $.parent.child notation)
- [ ] **Step 4d**: 🔴 **MANDATORY FOR JSON COLUMNS**: Profile EACH discovered key (completeness, unique values, samples, data type)
- [ ] **Step 4e**: 🔴 **MANDATORY: PII Detection** - Identify PII columns by name patterns and content analysis
- [ ] **Step 4f**: 🔴 **MANDATORY: PII Profiling** - Profile EACH PII column (type, completeness, format validation, masking status)
- [ ] **Step 5**: Generate distribution queries for key columns
- [ ] **Step 6**: Create visualizations (completeness chart, distributions, type breakdown, PII summary)
- [ ] **Step 7**: 🔴 **MANDATORY: NULL/NOT NULL Breakdown Tables** - Generate breakdown tables showing NULL vs NOT NULL counts/percentages for ALL columns (PII and non-PII)
- [ ] **Step 8**: Calculate overall data quality score
- [ ] **Step 9**: Generate actionable recommendations (including PII handling and NULL value issues)
- [ ] **Step 10**: Present formatted report with ALL sections including JSON key profiling, PII analysis, and NULL/NOT NULL breakdown tables

### 📊 REQUIRED OUTPUT SECTIONS

Your final report MUST include:

1. **Overview Summary** (total records, columns, date range, quality score, PII column count)
2. **Data Type Detection** (actual content type: JSON, Array, String, etc.)
3. **Column Statistics Table** (with sample values for EACH column)
4. **🔴 JSON Key Profiling** (MANDATORY for any JSON columns - profile ALL keys)
5. **🔴 PII Analysis** (MANDATORY - identify PII columns, types, quality metrics, compliance status)
6. **🔴 NULL/NOT NULL Breakdown Tables** (MANDATORY - show NULL vs NOT NULL counts/percentages for ALL columns, separate tables for PII columns and all data types)
7. **Data Quality Analysis** (completeness, uniqueness, validity scores, PII data quality)
8. **Distribution Visualizations** (at least 2-3 charts, including PII distribution)
9. **Key Findings** (strengths and issues, including PII handling and NULL value concerns)
10. **Actionable Recommendations** (specific, prioritized, including PII compliance actions and NULL value resolution)

## Core Capabilities

### 1. Advanced Data Type Detection

**CRITICAL**: Always detect ACTUAL data type based on content, not schema type.

**Detect and report these types:**

**JSON Columns** (varchar containing JSON):
- Detect: Look for values starting with `{` or `[`
- Report as: "JSON Object" or "JSON Array"
- Show: Sample JSON structure (pretty-printed)
- Extract: Top-level keys, nested depth
- Count: Valid vs malformed JSON

**Array Columns** (varchar containing arrays or actual arrays):
- Detect: Look for values like `[1,2,3]` or array types
- Report as: "ARRAY<type>"
- Show: Sample array values
- Calculate: Avg array length, min/max length
- Extract: Element types

**Nested Structures** (JSON with nested objects):
- Detect: Multi-level JSON structures
- Report as: "Nested JSON (depth: N)"
- Show: Flattened structure map
- List: All nested paths

**Timestamp Columns** (bigint containing epoch):
- Detect: Large integers (>1000000000) that convert to valid dates
- Report as: "Unix Timestamp (bigint)" not just "bigint"
- Show: Converted date samples
- Validate: Check for future dates, corrupted values

**PII Columns** (sensitive personal information):
- Detect: Column names and content patterns indicating PII
- Report as: PII type (EMAIL, PHONE, ADDRESS, NAME, IDENTIFIER, FINANCIAL, BIOMETRIC, HEALTH, CONSENT)
- Show: Format validation, masking status, sample count (NEVER show actual PII values)
- Validate: Check format compliance, null rate, encryption status

**Numeric Columns:**
- Count (total, non-null, null)
- Unique values (approximate)
- Min, Max, Mean, Median
- Percentiles (p25, p50, p75, p90, p95, p99)
- Standard deviation
- Outlier count

**Categorical Columns** (low cardinality varchar):
- Count (total, non-null, null)
- Unique values (approximate)
- Most common values (top 10 with counts)
- Empty string count
- Cardinality ratio (unique/total)

**High Cardinality Strings**:
- Min/max length
- Length distribution
- Character set analysis
- Pattern detection (email, phone, URL)

### 2. Sample Value Extraction (MANDATORY)

**REQUIRED**: For EVERY column, extract 3-5 sample values.

```sql
-- Sample extraction query
select
  column_name,
  count(*) as sample_count
from table_name
where column_name is not null
group by column_name
order by count(*) desc
limit 5
```

**For JSON columns:**
```sql
-- Extract JSON sample
select
  json_column,
  json_extract(json_column, '$.key') as extracted_value
from table_name
where json_column is not null
limit 3
```

**For Array columns:**
```sql
-- Extract array sample
select
  array_column,
  cardinality(array_column) as array_length
from table_name
where array_column is not null
limit 3
```

### 3. Distribution Visualizations (REQUIRED)

Generate AT LEAST 2-3 visualizations:

**MANDATORY Visualization 1: Data Completeness Chart**
- Bar chart showing % completeness for each column
- ALWAYS create this first

**Additional Visualizations** (choose based on data):
- **Histogram** - For numeric data distribution
- **Box Plot** - Show quartiles and outliers
- **Bar Chart** - Top N values for categorical data
- **Pie Chart** - Type distribution or category breakdown
- **Time Series** - Volume over time for timestamp columns
- **Heatmap** - Data quality dimensions

## 🔄 PROFILING WORKFLOWS (MANDATORY)

### WORKFLOW 1: Complete Table Profile (DEFAULT - USE THIS)

**When to use**: ALL table profiling requests unless specifically asked for single column

**STEP 1: Get Schema and Row Count**

```bash
# Get schema
tdx describe [database].[table]

# Get basic stats
tdx query "
select
  count(*) as total_rows,
  min(from_unixtime(time)) as earliest_date,
  max(from_unixtime(time)) as latest_date
from [database].[table]
"
```

**STEP 2: Detect Data Types by Sampling**

For EACH VARCHAR column, sample values to detect actual type:

```sql
-- Sample values to detect type
select
  column_name,
  case
    when column_name like '{%' then 'JSON_OBJECT'
    when column_name like '[%' then 'JSON_ARRAY'
    when column_name RLIKE '^\\d{10,}$' then 'TIMESTAMP_BIGINT'
    else 'STRING'
  end as detected_type
from [database].[table]
where column_name is not null
limit 10
```

**STEP 3: Comprehensive Statistics Query**

Execute this query to get all column stats in one go:

```sql
select
  count(*) as total_rows,

  -- For EACH column: count, nulls, unique values
  count(col1) as col1_count,
  count(*) - count(col1) as col1_nulls,
  approx_distinct(col1) as col1_unique,

  count(col2) as col2_count,
  count(*) - count(col2) as col2_nulls,
  approx_distinct(col2) as col2_unique,

  -- For numeric columns: add min, max, avg, median
  min(numeric_col) as numeric_col_min,
  max(numeric_col) as numeric_col_max,
  avg(numeric_col) as numeric_col_avg,
  approx_percentile(numeric_col, 0.5) as numeric_col_median,

  -- For timestamp columns: convert and show range
  min(from_unixtime(time_col)) as time_col_earliest,
  max(from_unixtime(time_col)) as time_col_latest

from [database].[table]
where td_interval(time, '-30d') -- adjust time range as needed
```

**STEP 4: Extract Sample Values**

For EACH column, get sample values:

```sql
-- For regular columns
select distinct column_name
from [database].[table]
where column_name is not null
limit 5

-- For JSON columns - show pretty samples
select
  column_name,
  json_format(try(json_parse(column_name))) as formatted_json
from [database].[table]
where column_name is not null
  and column_name like '{%'
limit 3

-- For array detection
select
  column_name,
  length(column_name) as value_length
from [database].[table]
where column_name like '[%'
limit 3
```

**STEP 5: Distribution Queries**

For categorical columns (cardinality < 50):

```sql
select
  column_name,
  count(*) as count,
  round(count(*) * 100.0 / sum(count(*)) over (), 2) as percentage
from [database].[table]
where column_name is not null
group by column_name
order by count desc
limit 20
```

For numeric columns:

```sql
select
  floor(numeric_col / bucket_size) * bucket_size as bucket,
  count(*) as frequency
from [database].[table]
where numeric_col is not null
group by floor(numeric_col / bucket_size) * bucket_size
order by bucket
limit 50
```

**STEP 6: Create Visualizations**

REQUIRED visualizations:

1. **Data Completeness Bar Chart** (% non-null for each column)
2. **Type Distribution Pie/Bar Chart** (if applicable)
3. **Top Value Distribution** (for key categorical columns)
4. **Null Count Bar Chart** (columns with most nulls)

Use `mcp__tdx-studio__render_chart` tool for all visualizations.

**STEP 7: Calculate Quality Score**

```
Overall Quality Score = (
  Completeness (40%) +
  Uniqueness (30%) +
  Validity (30%)
) / 100

Where:
- Completeness = Avg % of non-null values across all columns
- Uniqueness = % of columns with appropriate cardinality
- Validity = % of values passing type validation
```

**STEP 8: Format Output Report**

Use this EXACT structure:

```markdown
# 📊 Data Profile: [database].[table]

## Overview Summary
- Total Records: X
- Total Columns: Y
- Date Range: [earliest] to [latest]
- Overall Quality Score: X%

## 📋 Data Type Detection

| Column | Schema Type | Detected Type | Sample Values | Notes |
|--------|-------------|---------------|---------------|-------|
| col1 | varchar | JSON Object | {"key": "value"} | Contains nested data |
| col2 | bigint | Unix Timestamp | 1699564800 (2023-11-10) | Time column |
| col3 | varchar | String | "example" | Plain text |

## 📊 Column Statistics

[Detailed stats table with nulls, unique values, samples]

## 📈 Visualizations

[3+ charts embedded]

## 🔍 Key Findings

### ✅ Strengths
[List good quality aspects]

### ⚠️ Issues
[List problems with severity]

## 💡 Recommendations

[Prioritized, actionable recommendations]
```

### WORKFLOW 2: JSON Column Analysis (MANDATORY FOR JSON COLUMNS)

**🔴 CRITICAL: When VARCHAR columns contain JSON, you MUST extract and profile ALL JSON keys**

**When to use**: When VARCHAR columns contain JSON data

**STEP 1: Detect JSON columns**

```sql
-- Check if column contains JSON
select
  column_name,
  case
    when column_name like '{%}' then 'JSON_OBJECT'
    when column_name like '[%]' then 'JSON_ARRAY'
    else 'NOT_JSON'
  end as json_type,
  length(column_name) as json_length
from [database].[table]
where column_name is not null
limit 10
```

**STEP 2: Extract ALL JSON Keys from Random Sample**

**🔴 MANDATORY**: For each JSON column, discover ALL key paths by parsing actual JSON:

**Method: Sample and Parse JSON to Discover All Keys**

```sql
-- Step 2a: Sample random JSON records
select
  json_column
from [database].[table]
where json_column like '{%'
  and json_column is not null
order by rand()
limit 20
```

**🔴 CRITICAL STEP: Manually inspect the JSON samples above to identify ALL key paths**

You MUST:
1. Look at the actual JSON strings returned
2. Identify EVERY key at EVERY level (including nested keys)
3. List ALL discovered key paths in dot notation ($.key, $.parent.child, etc.)
4. Include keys even if they appear in only 1 record

**Example of discovering keys:**

Sample JSON:
```json
{
  "emailAddress": "test@example.com",
  "contactPreferenceType": "EMAIL",
  "preferences": {
    "marketing": true,
    "notifications": false
  }
}
```

Discovered key paths:
- `$.emailAddress`
- `$.contactPreferenceType`
- `$.preferences` (object)
- `$.preferences.marketing` (nested)
- `$.preferences.notifications` (nested)

**For Arrays of JSON:**
```sql
-- If JSON column contains arrays, sample them
select
  json_array_column
from [database].[table]
where json_array_column like '[%'
limit 10
```

Discover:
- Array element structure
- Keys within array elements ($.array[*].key notation)

**STEP 3: Profile Each JSON Key**

**🔴 YOU MUST PROFILE EVERY KEY YOU DISCOVERED IN STEP 2**

For EACH key path found, run these queries:

```sql
-- Profile key: $.emailAddress
select
  count(*) as total_records,
  count(json_extract_scalar(emailpreference, '$.emailAddress')) as key_present_count,
  round((count(*) - count(json_extract_scalar(emailpreference, '$.emailAddress'))) * 100.0 / count(*), 2) as key_missing_pct,
  approx_distinct(json_extract_scalar(emailpreference, '$.emailAddress')) as key_unique_values
from [database].[table]
where emailpreference is not null

-- Get sample values
select distinct
  json_extract_scalar(emailpreference, '$.emailAddress') as sample_value
from [database].[table]
where json_extract_scalar(emailpreference, '$.emailAddress') is not null
limit 5

-- Profile key: $.contactPreferenceType
select
  count(*) as total_records,
  count(json_extract_scalar(emailpreference, '$.contactPreferenceType')) as key_present_count,
  round((count(*) - count(json_extract_scalar(emailpreference, '$.contactPreferenceType'))) * 100.0 / count(*), 2) as key_missing_pct,
  approx_distinct(json_extract_scalar(emailpreference, '$.contactPreferenceType')) as key_unique_values
from [database].[table]
where emailpreference is not null

-- Repeat for EVERY discovered key path...
```

**For nested keys:**
```sql
-- Profile nested key: $.preferences.marketing
select
  count(*) as total_records,
  count(json_extract_scalar(json_column, '$.preferences.marketing')) as key_present_count,
  round((count(*) - count(json_extract_scalar(json_column, '$.preferences.marketing'))) * 100.0 / count(*), 2) as key_missing_pct
from [database].[table]
where json_column is not null
```

**🔴 CRITICAL**: You must profile EVERY key path you discovered in Step 2, including:
- All top-level keys
- All nested keys (2+ levels deep)
- Keys that appear in only 1-2 records
- Keys with null/empty values

**STEP 4: Detect Nested JSON Keys**

For nested JSON structures:

```sql
-- Example: Extract nested keys from customerpreference
select distinct
  json_extract_scalar(customerpreference, '$.customerId.idType') as nested_value,
  length(customerpreference) as json_size
from [database].[table]
where customerpreference like '{%'
  and customerpreference is not null
limit 10
```

**STEP 5: Count Valid vs Invalid JSON**

```sql
select
  case
    when try(json_parse(column_name)) is not null then 'VALID_JSON'
    else 'INVALID_JSON'
  end as json_validity,
  count(*) as count,
  round(count(*) * 100.0 / sum(count(*)) over (), 2) as percentage
from [database].[table]
where column_name is not null
group by case when try(json_parse(column_name)) is not null then 'VALID_JSON' else 'INVALID_JSON' end
```

**📊 REQUIRED JSON KEY PROFILING OUTPUT**

For EVERY JSON column, generate this report section:

```markdown
### JSON Column: [column_name]

**JSON Structure Overview:**
- Valid JSON: XX% (X/X records)
- Invalid JSON: XX% (X/X records)
- Average JSON size: XXX bytes
- Nested depth: X levels

**Discovered JSON Keys:**

| Key Path | Data Type | Present in % | Unique Values | Sample Values | Notes |
|----------|-----------|--------------|---------------|---------------|-------|
| $.emailAddress | string | 94.1% | 12 | "krishna@nordstrom.com", "test@example.com" | Email format |
| $.contactPreferenceType | string | 85.3% | 3 | "EMAIL", "SMS", "PHONE" | Categorical |
| $.customerDataSource | string | 15.7% | 2 | "WEB_CUSTOMER_ACCOUNT_PROFILE" | Mostly null |
| $.preferences.marketing | boolean | 100% | 2 | true, false | Boolean flag |
| $.customerId.idType | string | 22.2% | 1 | "OPERATIONAL_CUSTOMER_PROFILE" | Nested object |

**Key Quality Issues:**
- ⚠️ `customerDataSource` only present in 15.7% of records
- ⚠️ `customerId.idType` is nested and sparse (22.2%)
- ✅ `emailAddress` has good coverage (94.1%)
```

**Report JSON columns with:**
- Detected type: "JSON Object" or "JSON Array"
- Sample JSON (pretty-printed, truncated if long)
- **ALL top-level AND nested keys extracted** 🔴 MANDATORY
- Valid vs malformed count and percentage
- **Per-key data quality metrics** 🔴 MANDATORY
- Avg/max JSON size in bytes
- Sample values for EACH key
- Nested structure depth

### WORKFLOW 3: Array Column Analysis

**When to use**: When columns contain array data

**Detect array columns:**

```sql
-- Check for array patterns
select
  column_name,
  case
    when column_name like '[%]' then 'STRING_ARRAY'
    when typeof(column_name) like 'array%' then 'NATIVE_ARRAY'
    else 'NOT_ARRAY'
  end as array_type
from [database].[table]
where column_name is not null
limit 10
```

**Array statistics:**

```sql
-- For native arrays
select
  cardinality(array_column) as array_length,
  count(*) as frequency
from [database].[table]
where array_column is not null
group by cardinality(array_column)
order by array_length
limit 20

-- Array element samples
select
  array_column,
  cardinality(array_column) as length,
  element_at(array_column, 1) as first_element
from [database].[table]
where array_column is not null
limit 5
```

**Report Array columns with:**
- Detected type: "ARRAY<element_type>"
- Min/max/avg array length
- Sample arrays (show 2-3 examples)
- Element type consistency check
- Empty array count

### WORKFLOW 4: Timestamp Validation

**When to use**: For bigint columns that might be timestamps

**Detect timestamp columns:**

```sql
-- Check if bigint is likely a timestamp
select
  column_name,
  min(column_name) as min_value,
  max(column_name) as max_value,
  -- Try converting to date
  min(from_unixtime(column_name)) as min_date,
  max(from_unixtime(column_name)) as max_date,
  -- Check if dates are reasonable (between 1970 and 2100)
  case
    when min(column_name) > 0 and max(column_name) < 4102444800 then 'VALID_TIMESTAMP'
    else 'INVALID_TIMESTAMP'
  end as validation
from [database].[table]
where column_name is not null
```

**Report Timestamp columns with:**
- Detected type: "Unix Timestamp (bigint)" instead of just "bigint"
- Date range in human-readable format
- Flag corrupt dates (far future/past)
- Timezone assumption (UTC)

### WORKFLOW 5: PII Detection and Profiling (MANDATORY)

**🔴 CRITICAL: When profiling ANY table, you MUST detect and profile PII columns**

**When to use**: For EVERY table profile - MANDATORY step

**STEP 1: Detect PII Columns by Name Pattern**

Use column name patterns to identify potential PII:

```sql
-- PII column name detection patterns
-- Run tdx describe to get all column names, then check against patterns
```

**PII Detection Patterns by Type:**

**EMAIL (High Priority)**
- Column name patterns: `email`, `e_mail`, `mail`, `email_address`, `contact_email`, `user_email`
- Content validation: Check for `@` symbol and domain pattern
- Format: `someone@example.com`

**PHONE (High Priority)**
- Column name patterns: `phone`, `telephone`, `mobile`, `cell`, `contact_number`, `phone_number`
- Content validation: Check for digit patterns (10-15 digits with optional +, -, (), spaces)
- Format: `+1-555-123-4567`, `555.123.4567`

**ADDRESS (High Priority)**
- Column name patterns: `address`, `street`, `city`, `state`, `zip`, `postal_code`, `country`, `location`
- Content validation: Check for street numbers, state abbreviations
- Format: `123 Main St`, `New York`, `90210`

**NAME (High Priority)**
- Column name patterns: `name`, `first_name`, `last_name`, `full_name`, `given_name`, `surname`, `customer_name`, `user_name`
- Content validation: Check for capitalized words, length 2-50 chars
- Format: `John Doe`, `Smith`

**IDENTIFIER (Critical)**
- Column name patterns: `ssn`, `social_security`, `passport`, `license`, `tax_id`, `national_id`, `ein`, `itin`
- Content validation: Check for format patterns (SSN: XXX-XX-XXXX, Passport: alphanumeric)
- Format: `123-45-6789`, `AB1234567`

**FINANCIAL (Critical)**
- Column name patterns: `credit_card`, `card_number`, `account_number`, `bank_account`, `routing_number`, `iban`, `swift`
- Content validation: Check for 13-19 digit patterns, Luhn algorithm
- Format: `4111-1111-1111-1111`, `ACH123456789`

**BIOMETRIC (Critical)**
- Column name patterns: `dob`, `date_of_birth`, `birth_date`, `age`, `biometric`, `fingerprint`, `facial`
- Content validation: Check for date formats, age ranges
- Format: `1990-01-15`, `DOB:01/15/1990`

**HEALTH (Critical)**
- Column name patterns: `medical`, `health`, `diagnosis`, `prescription`, `insurance`, `patient_id`, `mrn`
- Content validation: Check for medical record format
- Format: `MRN-123456`, `INS-ABC123`

**CONSENT (Medium Priority)**
- Column name patterns: `consent`, `gdpr`, `opt_in`, `opt_out`, `marketing_consent`, `privacy_consent`
- Content validation: Check for boolean or status values
- Format: `true/false`, `Y/N`, `GRANTED/DENIED`

**STEP 2: Validate PII Content Format**

For each detected PII column, validate format:

```sql
-- Email validation
select
  count(*) as total,
  sum(case when email like '%@%.%' then 1 else 0 end) as valid_format_count,
  sum(case when email not like '%@%.%' then 1 else 0 end) as invalid_format_count,
  round(sum(case when email like '%@%.%' then 1 else 0 end) * 100.0 / count(*), 2) as valid_pct
from [database].[table]
where email is not null

-- Phone validation
select
  count(*) as total,
  sum(case when REGEXP_LIKE(phone, '^[+]?[0-9() -]{10,20}$') then 1 else 0 end) as valid_format_count,
  round(sum(case when REGEXP_LIKE(phone, '^[+]?[0-9() -]{10,20}$') then 1 else 0 end) * 100.0 / count(*), 2) as valid_pct
from [database].[table]
where phone is not null

-- SSN validation (check format XXX-XX-XXXX or XXXXXXXXX)
select
  count(*) as total,
  sum(case when REGEXP_LIKE(ssn, '^[0-9]{3}-[0-9]{2}-[0-9]{4}$') or REGEXP_LIKE(ssn, '^[0-9]{9}$') then 1 else 0 end) as valid_format_count,
  round(sum(case when REGEXP_LIKE(ssn, '^[0-9]{3}-[0-9]{2}-[0-9]{4}$') or REGEXP_LIKE(ssn, '^[0-9]{9}$') then 1 else 0 end) * 100.0 / count(*), 2) as valid_pct
from [database].[table]
where ssn is not null
```

**STEP 3: Check PII Masking Status**

Check if PII is properly masked/encrypted:

```sql
-- Check for masking patterns
select
  column_name,
  case
    when column_name like '%***%' then 'MASKED'
    when column_name like '%XXX%' then 'MASKED'
    when column_name RLIKE '^[*]+$' then 'FULLY_MASKED'
    when column_name RLIKE '^[X]+$' then 'FULLY_MASKED'
    when length(column_name) = 64 and column_name RLIKE '^[0-9A-Fa-f]+$' then 'HASHED_SHA256'
    when length(column_name) = 32 and column_name RLIKE '^[0-9A-Fa-f]+$' then 'HASHED_MD5'
    else 'PLAINTEXT'
  end as masking_status,
  count(*) as count
from [database].[table]
where column_name is not null
group by column_name,
  case
    when column_name like '%***%' then 'MASKED'
    when column_name like '%XXX%' then 'MASKED'
    when column_name RLIKE '^[*]+$' then 'FULLY_MASKED'
    when column_name RLIKE '^[X]+$' then 'FULLY_MASKED'
    when length(column_name) = 64 and column_name RLIKE '^[0-9A-Fa-f]+$' then 'HASHED_SHA256'
    when length(column_name) = 32 and column_name RLIKE '^[0-9A-Fa-f]+$' then 'HASHED_MD5'
    else 'PLAINTEXT'
  end
limit 10
```

**STEP 4: Calculate PII Data Quality Metrics**

For EACH PII column, calculate:

```sql
-- PII quality metrics
select
  count(*) as total_records,
  count(pii_column) as non_null_count,
  count(*) - count(pii_column) as null_count,
  round((count(*) - count(pii_column)) * 100.0 / count(*), 2) as null_pct,
  approx_distinct(pii_column) as unique_values,
  round(approx_distinct(pii_column) * 100.0 / count(pii_column), 2) as uniqueness_pct,
  -- Format validation (example for email)
  sum(case when pii_column like '%@%.%' then 1 else 0 end) as valid_format_count,
  round(sum(case when pii_column like '%@%.%' then 1 else 0 end) * 100.0 / count(pii_column), 2) as valid_format_pct
from [database].[table]
where pii_column is not null
```

**STEP 5: Generate PII Summary Report**

**📊 REQUIRED PII PROFILING OUTPUT**

For EVERY table with PII columns, generate this report section:

```markdown
## 🔐 PII Analysis

**PII Summary:**
- Total PII Columns: X
- PII Column Types: EMAIL (2), PHONE (1), ADDRESS (3), NAME (2), IDENTIFIER (1)
- Masked PII Columns: X/X (XX%)
- Plaintext PII Columns: X/X (XX%) ⚠️ COMPLIANCE RISK

**PII Columns Detected:**

| Column Name | PII Type | Format Valid % | Completeness % | Uniqueness % | Masking Status | Compliance Risk |
|-------------|----------|----------------|----------------|--------------|----------------|-----------------|
| email | EMAIL | 98.5% | 95.2% | 89.3% | PLAINTEXT | ⚠️ HIGH RISK |
| phone_number | PHONE | 92.1% | 88.7% | 85.1% | PARTIAL_MASK | ⚠️ MEDIUM RISK |
| ssn | IDENTIFIER | 100% | 99.8% | 99.9% | HASHED_SHA256 | ✅ LOW RISK |
| first_name | NAME | 100% | 96.5% | 45.2% | PLAINTEXT | ⚠️ HIGH RISK |
| last_name | NAME | 100% | 96.5% | 38.7% | PLAINTEXT | ⚠️ HIGH RISK |
| street_address | ADDRESS | 95.3% | 87.2% | 82.1% | PLAINTEXT | ⚠️ HIGH RISK |
| credit_card | FINANCIAL | 99.1% | 92.5% | 91.8% | PARTIAL_MASK | ⚠️ MEDIUM RISK |
| date_of_birth | BIOMETRIC | 100% | 94.3% | 78.5% | PLAINTEXT | 🔴 CRITICAL RISK |

**⚠️ CRITICAL: Never display actual PII values in samples - only show counts, percentages, and format validation**

**PII Quality Issues:**
- 🔴 **CRITICAL**: `date_of_birth` stored in PLAINTEXT - GDPR/CCPA violation risk
- ⚠️ **HIGH**: `email`, `first_name`, `last_name`, `street_address` unmasked
- ⚠️ **MEDIUM**: `phone_number` and `credit_card` only partially masked
- ⚠️ **Format Issues**: `phone_number` has 7.9% invalid formats
- ⚠️ **Completeness**: `phone_number` missing in 11.3% of records
```

**STEP 6: Database-Level PII Summary (if profiling database)**

When profiling an entire database, aggregate PII metrics:

```markdown
## 🔐 Database-Level PII Summary: [database_name]

**Overall PII Statistics:**
- Tables with PII: X/Y (XX%)
- Total PII Columns: XXX across YY tables
- Most Common PII Types: EMAIL (45 columns), NAME (38 columns), PHONE (22 columns)
- Masked PII: XX% (X/XXX columns)
- Plaintext PII: XX% (X/XXX columns) ⚠️

**PII Distribution by Type:**

| PII Type | Column Count | Tables | Avg Completeness | Masked % | Risk Level |
|----------|--------------|--------|------------------|----------|------------|
| EMAIL | 45 | 12 | 93.2% | 25% | ⚠️ HIGH |
| PHONE | 22 | 8 | 88.5% | 40% | ⚠️ MEDIUM |
| ADDRESS | 67 | 15 | 85.1% | 10% | 🔴 CRITICAL |
| NAME | 38 | 10 | 95.8% | 15% | ⚠️ HIGH |
| IDENTIFIER | 8 | 5 | 99.2% | 90% | ✅ LOW |
| FINANCIAL | 12 | 4 | 91.7% | 75% | ⚠️ MEDIUM |
| BIOMETRIC | 5 | 3 | 92.3% | 20% | 🔴 CRITICAL |
| HEALTH | 3 | 2 | 88.9% | 80% | ⚠️ MEDIUM |
| CONSENT | 15 | 7 | 76.4% | N/A | ✅ LOW |

**PII Data Quality by Database:**
- Overall PII Completeness: XX.X%
- Overall PII Format Validity: XX.X%
- Overall PII Masking Coverage: XX.X%

**Compliance Status:**
- ✅ GDPR Compliant Tables: X/Y (consent + masked PII)
- ⚠️ GDPR At-Risk Tables: X/Y (plaintext PII without consent)
- ⚠️ CCPA Compliance: X/Y tables have do-not-sell flags
- 🔴 PCI-DSS Violations: X tables with unmasked credit cards
```

**STEP 7: 🔴 CRITICAL - NULL/NOT NULL Breakdown Tables (MANDATORY)**

**This is MANDATORY for ALL profiling requests (database-level and table-level)**

### For Database-Level Profiling

When profiling an entire database, generate **PII Breakdown Table** showing which tables contain PII and their NULL/NOT NULL statistics:

**Query Pattern:**
```sql
-- For each table with PII columns, calculate NULL/NOT NULL breakdown
select
  count(*) as total_records,
  count(pii_column_1) as pii_col1_not_null,
  count(*) - count(pii_column_1) as pii_col1_null,
  round((count(*) - count(pii_column_1)) * 100.0 / count(*), 2) as pii_col1_null_pct,
  round(count(pii_column_1) * 100.0 / count(*), 2) as pii_col1_not_null_pct,
  count(pii_column_2) as pii_col2_not_null,
  count(*) - count(pii_column_2) as pii_col2_null,
  round((count(*) - count(pii_column_2)) * 100.0 / count(*), 2) as pii_col2_null_pct,
  round(count(pii_column_2) * 100.0 / count(*), 2) as pii_col2_not_null_pct
from [database].[table]
```

**MANDATORY OUTPUT FORMAT for Database-Level:**

```markdown
## 📊 Database NULL/NOT NULL Breakdown: [database_name]

### 🔐 PII Columns Breakdown by Table

**Summary:**
- Total Tables: XX
- Tables with PII: XX
- Total PII Columns: XXX
- PII Columns with >10% NULL: XX ⚠️

| Table Name | PII Column Name | PII Type | Total Records | NULL Count | NOT NULL Count | NULL % | NOT NULL % | Data Quality |
|------------|-----------------|----------|---------------|------------|----------------|--------|------------|--------------|
| customers | email | EMAIL | 209,934 | 0 | 209,934 | 0% | 100% | ✅ Excellent |
| customers | phone_number | PHONE | 209,934 | 0 | 209,934 | 0% | 100% | ✅ Excellent |
| customers | first_name | NAME | 209,934 | 0 | 209,934 | 0% | 100% | ✅ Excellent |
| customers | last_name | NAME | 209,934 | 0 | 209,934 | 0% | 100% | ✅ Excellent |
| customers | address | ADDRESS | 209,934 | 0 | 209,934 | 0% | 100% | ✅ Excellent |
| customers | city | ADDRESS | 209,934 | 0 | 209,934 | 0% | 100% | ✅ Excellent |
| customers | postal_code | ADDRESS | 209,934 | 0 | 209,934 | 0% | 100% | ✅ Excellent |
| customers | date_of_birth | BIOMETRIC | 209,934 | 0 | 209,934 | 0% | 100% | ✅ Excellent |
| transactions | customer_id | IDENTIFIER | 954,600 | 12,500 | 942,100 | 1.3% | 98.7% | ✅ Good |
| transactions | payment_method | FINANCIAL | 954,600 | 45,000 | 909,600 | 4.7% | 95.3% | ⚠️ Fair |
| gdpr_requests | email | EMAIL | 2,089 | 150 | 1,939 | 7.2% | 92.8% | ⚠️ Fair |
| gdpr_requests | request_date | CONSENT | 2,089 | 0 | 2,089 | 0% | 100% | ✅ Excellent |

### 📋 All Data Types Breakdown by Table

**Summary:**
- Total Columns Analyzed: XXX
- Columns with >10% NULL: XX ⚠️
- Columns with 100% Completeness: XX ✅

| Table Name | Column Name | Data Type | PII Type | Total Records | NULL Count | NOT NULL Count | NULL % | NOT NULL % | Data Quality |
|------------|-------------|-----------|----------|---------------|------------|----------------|--------|------------|--------------|
| customers | customer_id | bigint | IDENTIFIER | 209,934 | 0 | 209,934 | 0% | 100% | ✅ Excellent |
| customers | email | varchar | EMAIL | 209,934 | 0 | 209,934 | 0% | 100% | ✅ Excellent |
| customers | phone_number | varchar | PHONE | 209,934 | 0 | 209,934 | 0% | 100% | ✅ Excellent |
| customers | first_name | varchar | NAME | 209,934 | 0 | 209,934 | 0% | 100% | ✅ Excellent |
| customers | last_name | varchar | NAME | 209,934 | 0 | 209,934 | 0% | 100% | ✅ Excellent |
| customers | age | int | - | 209,934 | 5,234 | 204,700 | 2.5% | 97.5% | ✅ Good |
| customers | registration_date | timestamp | - | 209,934 | 0 | 209,934 | 0% | 100% | ✅ Excellent |
| customers | loyalty_points | int | - | 209,934 | 15,678 | 194,256 | 7.5% | 92.5% | ⚠️ Fair |
| transactions | transaction_id | varchar | - | 954,600 | 0 | 954,600 | 0% | 100% | ✅ Excellent |
| transactions | customer_id | bigint | IDENTIFIER | 954,600 | 12,500 | 942,100 | 1.3% | 98.7% | ✅ Good |
| transactions | amount | double | - | 954,600 | 0 | 954,600 | 0% | 100% | ✅ Excellent |
| transactions | payment_method | varchar | FINANCIAL | 954,600 | 45,000 | 909,600 | 4.7% | 95.3% | ⚠️ Fair |
| transactions | transaction_date | timestamp | - | 954,600 | 0 | 954,600 | 0% | 100% | ✅ Excellent |
| gdpr_requests | request_id | varchar | - | 2,089 | 0 | 2,089 | 0% | 100% | ✅ Excellent |
| gdpr_requests | customer_id | bigint | IDENTIFIER | 2,089 | 0 | 2,089 | 0% | 100% | ✅ Excellent |
| gdpr_requests | email | varchar | EMAIL | 2,089 | 150 | 1,939 | 7.2% | 92.8% | ⚠️ Fair |
| gdpr_requests | request_type | varchar | CONSENT | 2,089 | 0 | 2,089 | 0% | 100% | ✅ Excellent |
| gdpr_requests | request_date | timestamp | CONSENT | 2,089 | 0 | 2,089 | 0% | 100% | ✅ Excellent |

**Data Quality Legend:**
- ✅ Excellent: 0-2% NULL
- ✅ Good: 2-5% NULL
- ⚠️ Fair: 5-10% NULL
- ❌ Poor: >10% NULL

**Key Findings:**
- ⚠️ **HIGH NULL RATE**: `customers.loyalty_points` has 7.5% NULL (15,678 records)
- ⚠️ **MEDIUM NULL RATE**: `transactions.payment_method` has 4.7% NULL (45,000 records)
- ⚠️ **PII DATA QUALITY**: `gdpr_requests.email` has 7.2% NULL (150 records) - may affect compliance
- ✅ **STRONG PII COVERAGE**: All PII columns in `customers` table have 100% completeness
```

### For Table-Level Profiling

When profiling a single table, generate **detailed NULL/NOT NULL breakdown** for ALL columns:

**Query Pattern:**
```sql
-- Calculate NULL/NOT NULL for all columns in a single query
select
  count(*) as total_records,
  -- For each column
  count(col1) as col1_not_null,
  count(*) - count(col1) as col1_null,
  round((count(*) - count(col1)) * 100.0 / count(*), 2) as col1_null_pct,
  round(count(col1) * 100.0 / count(*), 2) as col1_not_null_pct,
  count(col2) as col2_not_null,
  count(*) - count(col2) as col2_null,
  round((count(*) - count(col2)) * 100.0 / count(*), 2) as col2_null_pct,
  round(count(col2) * 100.0 / count(*), 2) as col2_not_null_pct
  -- Repeat for ALL columns
from [database].[table]
```

**MANDATORY OUTPUT FORMAT for Table-Level:**

```markdown
## 📊 Table NULL/NOT NULL Breakdown: [database].[table]

### Overview
- Total Records: XXX,XXX
- Total Columns: XX
- PII Columns: XX
- Columns with NULL values: XX/XX
- Overall Completeness: XX.X%

### 🔐 PII Columns Breakdown

| Column Name | PII Type | Data Type | Total Records | NULL Count | NOT NULL Count | NULL % | NOT NULL % | Format Valid % | Masking Status | Data Quality |
|-------------|----------|-----------|---------------|------------|----------------|--------|------------|----------------|----------------|--------------|
| email | EMAIL | varchar | 209,934 | 0 | 209,934 | 0% | 100% | 98.5% | PLAINTEXT | ✅ Excellent |
| phone_number | PHONE | varchar | 209,934 | 0 | 209,934 | 0% | 100% | 95.2% | PLAINTEXT | ✅ Excellent |
| first_name | NAME | varchar | 209,934 | 0 | 209,934 | 0% | 100% | 100% | PLAINTEXT | ✅ Excellent |
| last_name | NAME | varchar | 209,934 | 0 | 209,934 | 0% | 100% | 100% | PLAINTEXT | ✅ Excellent |
| address | ADDRESS | varchar | 209,934 | 0 | 209,934 | 0% | 100% | 92.3% | PLAINTEXT | ✅ Excellent |
| city | ADDRESS | varchar | 209,934 | 0 | 209,934 | 0% | 100% | 100% | PLAINTEXT | ✅ Excellent |
| postal_code | ADDRESS | varchar | 209,934 | 0 | 209,934 | 0% | 100% | 97.8% | PLAINTEXT | ✅ Excellent |
| country | ADDRESS | varchar | 209,934 | 0 | 209,934 | 0% | 100% | 100% | PLAINTEXT | ✅ Excellent |
| date_of_birth | BIOMETRIC | date | 209,934 | 0 | 209,934 | 0% | 100% | 100% | PLAINTEXT | ✅ Excellent |

### 📋 All Columns Breakdown (Including Non-PII)

| Column Name | Data Type | PII Type | Total Records | NULL Count | NOT NULL Count | NULL % | NOT NULL % | Unique Values | Data Quality |
|-------------|-----------|----------|---------------|------------|----------------|--------|------------|---------------|--------------|
| customer_id | bigint | IDENTIFIER | 209,934 | 0 | 209,934 | 0% | 100% | 209,934 | ✅ Excellent |
| email | varchar | EMAIL | 209,934 | 0 | 209,934 | 0% | 100% | 205,432 | ✅ Excellent |
| phone_number | varchar | PHONE | 209,934 | 0 | 209,934 | 0% | 100% | 198,765 | ✅ Excellent |
| first_name | varchar | NAME | 209,934 | 0 | 209,934 | 0% | 100% | 5,234 | ✅ Excellent |
| last_name | varchar | NAME | 209,934 | 0 | 209,934 | 0% | 100% | 12,456 | ✅ Excellent |
| address | varchar | ADDRESS | 209,934 | 0 | 209,934 | 0% | 100% | 198,123 | ✅ Excellent |
| city | varchar | ADDRESS | 209,934 | 0 | 209,934 | 0% | 100% | 1,234 | ✅ Excellent |
| postal_code | varchar | ADDRESS | 209,934 | 0 | 209,934 | 0% | 100% | 8,567 | ✅ Excellent |
| country | varchar | ADDRESS | 209,934 | 0 | 209,934 | 0% | 100% | 45 | ✅ Excellent |
| date_of_birth | date | BIOMETRIC | 209,934 | 0 | 209,934 | 0% | 100% | 23,456 | ✅ Excellent |
| gender | varchar | - | 209,934 | 5,234 | 204,700 | 2.5% | 97.5% | 3 | ✅ Good |
| age | int | - | 209,934 | 5,234 | 204,700 | 2.5% | 97.5% | 85 | ✅ Good |
| registration_date | timestamp | - | 209,934 | 0 | 209,934 | 0% | 100% | 1,456 | ✅ Excellent |
| loyalty_tier | varchar | - | 209,934 | 15,678 | 194,256 | 7.5% | 92.5% | 4 | ⚠️ Fair |
| loyalty_points | int | - | 209,934 | 15,678 | 194,256 | 7.5% | 92.5% | 56,789 | ⚠️ Fair |
| marketing_consent | boolean | CONSENT | 209,934 | 0 | 209,934 | 0% | 100% | 2 | ✅ Excellent |
| email_consent | boolean | CONSENT | 209,934 | 0 | 209,934 | 0% | 100% | 2 | ✅ Excellent |

**Data Quality Legend:**
- ✅ Excellent: 0-2% NULL, high unique values
- ✅ Good: 2-5% NULL
- ⚠️ Fair: 5-10% NULL
- ❌ Poor: >10% NULL

**Key Findings:**
- ✅ **PII COMPLETENESS**: All 9 PII columns have 100% completeness (0% NULL)
- ⚠️ **NULL VALUES**: 2 columns have >5% NULL: `loyalty_tier` (7.5%), `loyalty_points` (7.5%)
- ✅ **UNIQUE IDENTIFIERS**: `customer_id` is 100% unique (perfect primary key)
- ⚠️ **COMPLIANCE CONCERN**: All PII stored in PLAINTEXT - recommend masking/encryption
- ✅ **CONSENT TRACKING**: All consent columns have 100% completeness

**Recommendations:**
1. **CRITICAL**: Encrypt/mask PII columns (email, phone, address, DOB) - GDPR/CCPA compliance risk
2. **HIGH**: Investigate why 7.5% of records missing loyalty data - may affect segmentation
3. **MEDIUM**: Consider adding default values for loyalty_tier (e.g., "STANDARD" for new customers)
```

**🔴 CRITICAL REQUIREMENTS:**

1. **For Database-Level Profiling**:
   - MUST generate TWO breakdown tables:
     - Table 1: PII columns breakdown by table
     - Table 2: ALL columns (PII + non-PII) breakdown by table
   - Show which tables contain PII
   - Show NULL/NOT NULL counts and percentages for EACH PII column
   - Show NULL/NOT NULL counts and percentages for ALL data types

2. **For Table-Level Profiling**:
   - MUST generate TWO breakdown tables:
     - Table 1: PII columns breakdown
     - Table 2: ALL columns breakdown (including PII + non-PII)
   - Show column name, data type, PII type (if applicable)
   - Show NULL count, NOT NULL count, NULL %, NOT NULL %
   - Include unique value counts
   - Add data quality assessment

3. **Data Quality Thresholds**:
   - ✅ Excellent: 0-2% NULL
   - ✅ Good: 2-5% NULL
   - ⚠️ Fair: 5-10% NULL
   - ❌ Poor: >10% NULL

4. **Always Include**:
   - Summary statistics (total records, columns, PII columns, null counts)
   - Key findings highlighting high NULL rates
   - Compliance concerns for PII columns
   - Specific recommendations for data quality issues

**Report PII columns with:**
- **PII Type Classification** (EMAIL, PHONE, ADDRESS, NAME, IDENTIFIER, FINANCIAL, BIOMETRIC, HEALTH, CONSENT)
- **Format Validation %** (percentage of values matching expected format)
- **Completeness %** (non-null percentage)
- **Uniqueness %** (distinct value percentage)
- **Masking Status** (PLAINTEXT, PARTIAL_MASK, FULLY_MASKED, HASHED)
- **Compliance Risk Level** (LOW, MEDIUM, HIGH, CRITICAL)
- **Sample Count ONLY** - NEVER show actual PII values
- **Format examples** (generic format description, not actual data)

**🔴 SECURITY WARNING: NEVER display actual PII values in output**
- Show only aggregated statistics (counts, percentages, distributions)
- Show only format patterns (e.g., "email format: user@domain.com")
- Show only masked samples (e.g., "j***@example.com", "555-***-1234")
- Log warning if plaintext PII detected

## 🔍 Data Type Detection Patterns (MANDATORY)

**CRITICAL**: Always detect ACTUAL content type, not just schema type.

### Detection Logic

Apply this detection logic for EVERY VARCHAR column:

```sql
-- Type detection query
select
  column_name,
  count(*) as sample_size,
  -- JSON Object detection
  sum(case when column_name like '{%' then 1 else 0 end) as json_object_count,
  -- JSON Array detection
  sum(case when column_name like '[%' then 1 else 0 end) as json_array_count,
  -- Numeric string detection
  sum(case when column_name RLIKE '^[0-9]+$' then 1 else 0 end) as numeric_string_count,
  -- Empty/null detection
  sum(case when column_name = '' then 1 else 0 end) as empty_string_count,
  -- Sample values
  min(column_name) as sample_1,
  max(column_name) as sample_2
from [database].[table]
where column_name is not null
```

### Type Classification Rules

**Rule 1: JSON Detection**
- IF > 80% of values start with `{` → Report as "JSON Object"
- IF > 80% of values start with `[` → Report as "JSON Array"
- Show sample JSON (pretty-printed)
- Extract and list top-level keys
- Report valid vs invalid JSON count

**Rule 2: Array Detection**
- IF schema type is `array<*>` → Report as "ARRAY<element_type>"
- IF VARCHAR starts with `[` and contains `,` → Report as "String Array"
- Show sample arrays with lengths
- Calculate min/max/avg array length

**Rule 3: Timestamp Detection (for bigint)**
- IF bigint column AND values between 946684800 (2000-01-01) and 4102444800 (2100-01-01)
  → Report as "Unix Timestamp (bigint)"
- Convert and show date range
- Flag any corrupt timestamps (far future/past)

**Rule 4: High Cardinality ID**
- IF unique_count > 90% of total_count → Report as "Identifier (High Cardinality)"
- Don't generate distributions
- Just show sample values and cardinality

**Rule 5: Categorical**
- IF unique_count < 100 → Report as "Categorical (Low Cardinality)"
- Generate bar/pie charts
- Show top 10 values with counts

**Rule 6: Free Text**
- IF avg_length > 100 AND unique_count > 1000 → Report as "Free Text"
- Show min/max/avg length
- Sample values only

### Reporting Format

For EVERY column, report in this format:

| Column | Schema Type | Detected Type | Sample Values | Cardinality | Nulls (%) |
|--------|-------------|---------------|---------------|-------------|-----------|
| user_id | varchar | Identifier | "USR001", "USR002" | 10,523 (98%) | 0.5% |
| preferences | varchar | **JSON Object** | `{"email": true, "sms": false}` | 156 | 5.2% |
| tags | varchar | **JSON Array** | `["tag1", "tag2"]` | 892 | 12.3% |
| created_at | bigint | **Unix Timestamp** | 1699564800 (2023-11-10) | 10,892 | 0% |
| status | varchar | Categorical | "active", "pending", "cancelled" | 3 | 1.2% |

## Visualization Examples

### 1. Numeric Distribution - Histogram

**Query:**
```sql
select
  floor(amount / 100) * 100 as amount_bucket,
  count(*) as frequency
from sales_db.orders
where td_interval(time, '-30d', 'JST')
  and amount is not null
group by floor(amount / 100) * 100
order by amount_bucket
```

**Visualization:**
```json
{
  "data": [{
    "type": "bar",
    "x": [0, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000],
    "y": [145, 320, 456, 389, 234, 178, 95, 43, 21, 8, 3],
    "marker": {"color": "#44BAB8"},
    "text": [145, 320, 456, 389, 234, 178, 95, 43, 21, 8, 3],
    "textposition": "outside",
    "textfont": {"size": 11, "color": "black"}
  }],
  "layout": {
    "title": {
      "text": "Order Amount Distribution (Last 30 Days)",
      "x": 0.5,
      "font": {"size": 18, "color": "#2E41A6"}
    },
    "height": 500,
    "showlegend": false,
    "xaxis": {
      "title": {"text": "Amount ($)", "font": {"size": 14, "color": "#2E41A6"}}
    },
    "yaxis": {
      "title": {"text": "Frequency", "font": {"size": 14, "color": "#2E41A6"}}
    },
    "margin": {"t": 80, "b": 80, "l": 80, "r": 80},
    "font": {"family": "Arial", "size": 12},
    "plot_bgcolor": "white",
    "paper_bgcolor": "white"
  }
}
```

### 2. Box Plot - Outlier Detection

**Query:**
```sql
select
  approx_percentile(amount, 0.00) as min,
  approx_percentile(amount, 0.25) as q1,
  approx_percentile(amount, 0.50) as median,
  approx_percentile(amount, 0.75) as q3,
  approx_percentile(amount, 1.00) as max
from sales_db.orders
where td_interval(time, '-30d', 'JST')
```

**Visualization:**
```json
{
  "data": [{
    "type": "box",
    "y": [10, 45, 78, 95, 120, 145, 178, 234, 389, 456, 520, 678, 890, 1200, 1450],
    "name": "Order Amount",
    "marker": {"color": "#44BAB8"},
    "boxmean": true,
    "boxpoints": "outliers"
  }],
  "layout": {
    "title": {
      "text": "Order Amount Box Plot (Last 30 Days)",
      "x": 0.5,
      "font": {"size": 18, "color": "#2E41A6"}
    },
    "height": 500,
    "showlegend": false,
    "yaxis": {
      "title": {"text": "Amount ($)", "font": {"size": 14, "color": "#2E41A6"}}
    },
    "margin": {"t": 80, "b": 80, "l": 80, "r": 80},
    "font": {"family": "Arial", "size": 12},
    "plot_bgcolor": "white",
    "paper_bgcolor": "white"
  }
}
```

### 3. Categorical Distribution - Bar Chart

**Query:**
```sql
select
  status,
  count(*) as count
from sales_db.orders
where td_interval(time, '-30d', 'JST')
group by status
order by count desc
```

**Visualization:**
```json
{
  "data": [{
    "type": "bar",
    "x": ["completed", "pending", "shipped", "cancelled", "refunded"],
    "y": [8520, 1240, 890, 234, 78],
    "marker": {"color": "#44BAB8"},
    "text": ["8,520", "1,240", "890", "234", "78"],
    "textposition": "outside",
    "textfont": {"size": 11, "color": "black"}
  }],
  "layout": {
    "title": {
      "text": "Order Status Distribution (Last 30 Days)",
      "x": 0.5,
      "font": {"size": 18, "color": "#2E41A6"}
    },
    "height": 500,
    "showlegend": false,
    "xaxis": {
      "title": {"text": "Status", "font": {"size": 14, "color": "#2E41A6"}}
    },
    "yaxis": {
      "title": {"text": "Count", "font": {"size": 14, "color": "#2E41A6"}}
    },
    "margin": {"t": 80, "b": 80, "l": 80, "r": 80},
    "font": {"family": "Arial", "size": 12},
    "plot_bgcolor": "white",
    "paper_bgcolor": "white"
  }
}
```

### 4. Categorical Distribution - Pie Chart

**For percentage breakdown:**

```json
{
  "data": [{
    "type": "pie",
    "values": [8520, 1240, 890, 234, 78],
    "labels": ["Completed", "Pending", "Shipped", "Cancelled", "Refunded"],
    "marker": {
      "colors": ["#44BAB8", "#8FD6D4", "#DAF1F1", "#828DCA", "#EEB53A"]
    },
    "textinfo": "label+percent",
    "textposition": "auto",
    "textfont": {"size": 14, "color": "black"},
    "hovertemplate": "<b>%{label}</b><br>Count: %{value}<br>Percentage: %{percent}<extra></extra>"
  }],
  "layout": {
    "title": {
      "text": "Order Status Distribution (Last 30 Days)",
      "x": 0.5,
      "font": {"size": 18, "color": "#2E41A6"}
    },
    "height": 500,
    "showlegend": true,
    "legend": {
      "orientation": "v",
      "yanchor": "middle",
      "y": 0.5,
      "xanchor": "left",
      "x": 1.02,
      "font": {"size": 12}
    },
    "margin": {"t": 80, "b": 80, "l": 80, "r": 150},
    "paper_bgcolor": "white"
  }
}
```

### 5. Time-Based Volume - Line Chart

**Query:**
```sql
select
  td_time_string(time, 'd!', 'JST') as date,
  count(*) as order_count
from sales_db.orders
where td_interval(time, '-30d', 'JST')
group by td_time_string(time, 'd!', 'JST')
order by date
```

**Visualization:**
```json
{
  "data": [{
    "type": "scatter",
    "mode": "lines+markers",
    "x": ["2024-12-15", "2024-12-16", "2024-12-17", "..."],
    "y": [345, 389, 412, 378, 456],
    "line": {"color": "#44BAB8", "width": 3},
    "marker": {"color": "#44BAB8", "size": 8}
  }],
  "layout": {
    "title": {
      "text": "Daily Order Volume (Last 30 Days)",
      "x": 0.5,
      "font": {"size": 18, "color": "#2E41A6"}
    },
    "height": 500,
    "showlegend": false,
    "xaxis": {
      "title": {"text": "Date", "font": {"size": 14, "color": "#2E41A6"}}
    },
    "yaxis": {
      "title": {"text": "Order Count", "font": {"size": 14, "color": "#2E41A6"}}
    },
    "margin": {"t": 80, "b": 80, "l": 80, "r": 80},
    "font": {"family": "Arial", "size": 12},
    "plot_bgcolor": "white",
    "paper_bgcolor": "white"
  }
}
```

### 6. Data Quality Heatmap

**Query:**
```sql
select
  'order_id' as column_name,
  count(*) as total,
  count(order_id) as non_null,
  count(*) - count(order_id) as null_count,
  cast((count(*) - count(order_id)) as double) / count(*) * 100 as null_pct
from sales_db.orders
where td_interval(time, '-30d', 'JST')

union all

select
  'customer_id' as column_name,
  count(*),
  count(customer_id),
  count(*) - count(customer_id),
  cast((count(*) - count(customer_id)) as double) / count(*) * 100
from sales_db.orders
where td_interval(time, '-30d', 'JST')
-- Repeat for other columns
```

**Visualization:**
```json
{
  "data": [{
    "type": "heatmap",
    "x": ["Completeness", "Uniqueness", "Validity"],
    "y": ["order_id", "customer_id", "amount", "currency", "status"],
    "z": [
      [100, 100, 100],
      [99.8, 85.2, 99.8],
      [98.5, 45.3, 95.2],
      [97.2, 3.1, 92.1],
      [96.8, 5.2, 94.5]
    ],
    "colorscale": [
      [0, "#EEB53A"],
      [0.5, "#8FD6D4"],
      [1, "#44BAB8"]
    ],
    "showscale": true,
    "colorbar": {
      "title": {"text": "Quality %", "font": {"size": 12}},
      "titleside": "right"
    },
    "text": [
      [100, 100, 100],
      [99.8, 85.2, 99.8],
      [98.5, 45.3, 95.2],
      [97.2, 3.1, 92.1],
      [96.8, 5.2, 94.5]
    ],
    "texttemplate": "%{text:.1f}%",
    "textfont": {"size": 12, "color": "black"},
    "hovertemplate": "<b>%{y}</b> - <b>%{x}</b><br>Quality: %{z:.1f}%<extra></extra>"
  }],
  "layout": {
    "title": {
      "text": "Data Quality Metrics (Last 30 Days)",
      "x": 0.5,
      "font": {"size": 18, "color": "#2E41A6"}
    },
    "height": 500,
    "xaxis": {
      "title": {"text": "Quality Dimension", "font": {"size": 14, "color": "#2E41A6"}}
    },
    "yaxis": {
      "title": {"text": "Column", "font": {"size": 14, "color": "#2E41A6"}}
    },
    "margin": {"t": 80, "b": 80, "l": 120, "r": 100},
    "font": {"family": "Arial", "size": 12},
    "plot_bgcolor": "white",
    "paper_bgcolor": "white"
  }
}
```

## Profile Output Format (MANDATORY TEMPLATE)

### Complete Table Profile

Present comprehensive profile with ALL sections:

1. **Overview Summary** ✅ REQUIRED
2. **Data Type Detection Table** ✅ REQUIRED
3. **Column Statistics Table** ✅ REQUIRED
4. **Distribution Visualizations** ✅ REQUIRED (minimum 2-3)
5. **Data Quality Metrics** ✅ REQUIRED
6. **Key Findings** ✅ REQUIRED
7. **Recommendations** ✅ REQUIRED

**EXACT OUTPUT TEMPLATE:**

```markdown
# 📊 Data Profile: [database].[table]

## Overview Summary

| Metric | Value |
|--------|-------|
| **Total Records** | X,XXX |
| **Total Columns** | XX |
| **Date Range** | YYYY-MM-DD to YYYY-MM-DD (X days) |
| **Overall Quality Score** | XX.X% [✅ Excellent / ⚠️ Good / ❌ Poor] |

---

## 📋 Data Type Detection

**CRITICAL**: Shows ACTUAL content type, not just schema type

| Column | Schema Type | Detected Type | Sample Values | Cardinality | Nulls (%) | Notes |
|--------|-------------|---------------|---------------|-------------|-----------|-------|
| id | bigint | Identifier | 1001, 1002, 1003 | 10,523 (100%) | 0% | ✅ Unique |
| preferences | varchar | **JSON Object** | `{"email": true, "sms": false}` | 156 | 5.2% | Contains nested data |
| tags | varchar | **JSON Array** | `["tag1", "tag2", "tag3"]` | 892 | 12.3% | Avg length: 2.5 |
| created_at | bigint | **Unix Timestamp** | 1699564800 (2023-11-10 14:00:00) | 10,892 | 0% | Valid date range |
| status | varchar | Categorical | "active", "pending", "cancelled" | 3 | 1.2% | Low cardinality |
| notes | varchar | Free Text | "Customer requested..." | 8,234 (82%) | 15.3% | Avg length: 245 chars |

---

## 📊 Column Statistics

### Identifier Columns

| Column | Type | Count | Nulls | Null % | Unique Values | Uniqueness |
|--------|------|-------|-------|--------|---------------|------------|
| id | bigint | 10,523 | 0 | 0% | 10,523 | 100% ✅ |
| user_id | varchar | 10,489 | 34 | 0.3% | 8,234 | 78% |

### Preference Columns (JSON)

| Column | Type | Count | Nulls | Null % | Valid JSON | Sample Structure |
|--------|------|-------|-------|--------|------------|------------------|
| preferences | JSON Object | 9,975 | 548 | 5.2% | 9,850 (98.7%) | `{"email": bool, "sms": bool, "phone": bool}` |
| settings | JSON Object | 8,234 | 2,289 | 21.7% | 8,100 (98.4%) | `{"theme": string, "lang": string}` |

### Timestamp Columns

| Column | Type | Count | Nulls | Null % | Date Range | Data Freshness |
|--------|------|-------|-------|--------|------------|----------------|
| created_at | Unix Timestamp | 10,523 | 0 | 0% | 2023-01-15 to 2024-11-15 | ✅ Up to date |
| updated_at | Unix Timestamp | 10,523 | 0 | 0% | 2024-10-01 to 2024-11-15 | ✅ Recent |

### Categorical Columns

| Column | Type | Count | Nulls | Null % | Unique Values | Top Values (%) |
|--------|------|-------|-------|--------|---------------|----------------|
| status | varchar | 10,397 | 126 | 1.2% | 3 | active (78%), pending (15%), cancelled (7%) |
| country | varchar | 9,856 | 667 | 6.3% | 45 | US (45%), JP (22%), UK (12%), ... |

---

## 📈 Visualizations

[Visualization 1: Data Completeness Bar Chart]
[Visualization 2: Type Distribution]
[Visualization 3: Key Metric Distribution]

---

## 🔍 Key Findings

### ✅ Strengths

1. **Excellent ID Coverage**: `id` column is 100% unique and complete (perfect for primary key)
2. **Good Timestamp Quality**: All timestamp columns have valid dates in expected range
3. **Well-Structured JSON**: Preferences column has 98.7% valid JSON
4. **Recent Data**: Data freshness is good with updates within last 30 days

### ⚠️ Data Quality Issues

#### Critical Issues

1. **JSON Column Name**: [Issue description]
   - Impact: [High/Medium/Low]
   - Records affected: X,XXX (XX%)
   - **Recommendation**: [Specific action]

2. **Timestamp Corruption**: [Issue description]
   - Impact: [High/Medium/Low]
   - Records affected: X,XXX (XX%)
   - **Recommendation**: [Specific action]

#### Medium Priority Issues

3. **High Null Rate**: Column `xyz` has XX% nulls
   - **Recommendation**: Investigate why data is missing, add validation

4. **Array Length Variation**: Arrays range from 0 to 1000 elements
   - **Recommendation**: Consider size limits or pagination

---

## 📊 Data Quality Score Breakdown

| Quality Dimension | Score | Assessment | Details |
|------------------|-------|------------|---------|
| **Completeness** | 87.3% | ⚠️ Good | 3 columns with >10% nulls |
| **Uniqueness** | 95.2% | ✅ Excellent | All ID columns properly unique |
| **Validity** | 82.1% | ⚠️ Good | Some corrupt timestamps, invalid JSON |
| **Consistency** | 88.5% | ⚠️ Good | Mostly consistent formats |

**Overall Quality Score**: **88.3%** - Good (Needs Minor Improvements)

---

## 💡 Actionable Recommendations

### Immediate Actions (Priority 1)

1. **Fix Timestamp Conversion**
   - Issue: `lastupdatedtime` shows year +56837 (corrupt)
   - Action: Review epoch conversion logic, likely needs division by 1000
   - Impact: Affects date-based queries and reporting

2. **Validate JSON Structure**
   - Issue: 1.3% of preference JSON is malformed
   - Action: Add JSON validation before insertion
   - Impact: Prevents application errors when parsing

### Short-term Improvements (Priority 2)

3. **Handle Missing Preferences**
   - Issue: 5.2% of records missing preferences
   - Action: Define default preferences or make field required
   - Impact: Improves data completeness

4. **Parse JSON into Columns**
   - Issue: JSON stored as text makes querying hard
   - Action: Extract common keys into separate columns
   - Impact: Better query performance and easier analysis

### Long-term Enhancements (Priority 3)

5. **Add Data Validation**
   - Add constraints for required fields
   - Validate array lengths (max 100 elements)
   - Ensure timestamp ranges are reasonable

6. **Monitor Data Quality**
   - Set up automated profiling (weekly)
   - Alert on quality score drops below 80%
   - Track completeness trends over time

---

**Profile Generated**: YYYY-MM-DD HH:MM
**Query Performance**: All queries < X seconds
**Data Freshness**: Last updated YYYY-MM-DD (X days ago)
```

## Smart Profiling Features

### Auto-Detect Column Types

Automatically determine profiling strategy:

**Numeric columns** → Histogram, box plot, percentiles
**Categorical (low cardinality)** → Bar chart, pie chart
**Categorical (high cardinality)** → Top N values, cardinality count
**Timestamp** → Time series, date range
**Boolean** → Simple count/percentage

### Intelligent Bucketing

Choose appropriate bucket sizes:

```python
# Pseudo-logic
if max - min < 10:
    bucket_size = 1
elif max - min < 100:
    bucket_size = 10
elif max - min < 1000:
    bucket_size = 100
else:
    bucket_size = 1000
```

### Outlier Detection

Flag statistical outliers:

```sql
-- Identify outliers using IQR method
with stats as (
  select
    approx_percentile(amount, 0.25) as q1,
    approx_percentile(amount, 0.75) as q3
  from sales_db.orders
  where td_interval(time, '-30d', 'JST')
)
select
  count(*) as outlier_count,
  min(amount) as min_outlier,
  max(amount) as max_outlier
from sales_db.orders, stats
where td_interval(time, '-30d', 'JST')
  and (amount < q1 - 1.5 * (q3 - q1) or amount > q3 + 1.5 * (q3 - q1))
```

## ⚠️ MANDATORY REQUIREMENTS

**YOU MUST:**

1. ✅ **Use this skill for ALL profiling requests** - No exceptions
2. ✅ **Follow WORKFLOW 1 completely** - Do not skip steps
3. ✅ **Detect actual data types** - Not just schema types (JSON, Array, Timestamp)
4. ✅ **Extract sample values** - For EVERY column (3-5 samples minimum)
5. ✅ **🔴 CRITICAL: Profile JSON keys** - Extract ALL keys from JSON columns and profile EACH key
6. ✅ **🔴 CRITICAL: Detect PII columns** - Identify PII by name patterns and content analysis for ALL tables
7. ✅ **🔴 CRITICAL: Profile PII data quality** - Calculate format validity, masking status, completeness for EACH PII column
8. ✅ **🔴 CRITICAL: Generate NULL/NOT NULL breakdown tables** - Show NULL vs NOT NULL counts/percentages for ALL columns (database-level: by table, table-level: by column)
9. ✅ **Create visualizations** - Minimum 2-3 charts (completeness is mandatory, PII distribution recommended)
10. ✅ **Calculate quality score** - Using the formula provided, including PII quality metrics
11. ✅ **Generate recommendations** - Specific, actionable, prioritized (including PII compliance actions and NULL value resolution)
12. ✅ **Use exact output format** - Follow the template structure with JSON key profiling, PII analysis, and NULL/NOT NULL breakdown sections

**YOU MUST NOT:**

1. ❌ Skip data type detection
2. ❌ Report schema type without checking actual content
3. ❌ Skip sample value extraction
4. ❌ 🔴 Skip JSON key extraction and profiling - THIS IS CRITICAL
5. ❌ List only top-level JSON keys - MUST extract nested keys too
6. ❌ 🔴 Skip PII detection - MANDATORY for ALL table profiles
7. ❌ 🔴 Display actual PII values - SECURITY VIOLATION (only show counts and masked samples)
8. ❌ Skip PII quality metrics (format validity, masking status, completeness)
9. ❌ 🔴 Skip NULL/NOT NULL breakdown tables - CRITICAL requirement from user
10. ❌ Create incomplete reports missing required sections
11. ❌ Deviate from the workflow without explicit user request

## Best Practices

1. **ALWAYS follow the MANDATORY WORKFLOW** - Complete all steps in order
2. **Always use time filters** - Profile recent data to avoid full scans (unless user specifies otherwise)
3. **Always detect actual content types** - Check for JSON, arrays, timestamps in VARCHAR columns
4. **Always show samples** - 3-5 sample values for every column
5. **Use approx functions** - Fast estimates for large datasets (approx_distinct, approx_percentile)
6. **Smart sampling** - For very large tables (>10M rows), sample first then profile
7. **Choose appropriate visualizations** - Match chart type to detected data type
8. **Include context** - Show time range, row counts, data freshness
9. **Highlight quality issues** - Make problems obvious with ⚠️ warnings
10. **Provide actionable insights** - Not just numbers, but specific recommendations with priority

## Performance Optimization

### For Large Tables

```sql
-- Sample first, then profile
with sample as (
  select *
  from large_table
  where td_interval(time, '-7d', 'JST')
    and rand() < 0.1  -- 10% sample
)
select
  count(*) * 10 as estimated_total,
  approx_distinct(column) * 10 as estimated_unique
from sample
```

### Parallel Profiling

Profile multiple columns in single query:

```sql
select
  -- Column 1
  count(col1) as col1_count,
  approx_distinct(col1) as col1_unique,
  min(col1) as col1_min,
  max(col1) as col1_max,
  -- Column 2
  count(col2) as col2_count,
  approx_distinct(col2) as col2_unique,
  -- Column 3
  count(col3) as col3_count,
  approx_distinct(col3) as col3_unique
from table_name
where td_interval(time, '-30d', 'JST')
```

## Integration with Other Skills

**Before profiling:**
- **schema-explorer** - Discover tables to profile

**After profiling:**
- **smart-sampler** - Sample interesting data segments
- **analytical-query** - Deep dive into findings
- **query-optimizer** - Optimize queries based on cardinality

## Common Queries

### Null Analysis
```sql
select
  sum(case when col1 is null then 1 else 0 end) as col1_nulls,
  sum(case when col2 is null then 1 else 0 end) as col2_nulls,
  sum(case when col3 is null then 1 else 0 end) as col3_nulls,
  count(*) as total
from table_name
where td_interval(time, '-30d', 'JST')
```

### Cardinality Check
```sql
select
  approx_distinct(col1) as col1_cardinality,
  approx_distinct(col2) as col2_cardinality,
  count(*) as total_rows,
  cast(approx_distinct(col1) as double) / count(*) as col1_uniqueness_ratio
from table_name
where td_interval(time, '-30d', 'JST')
```

### Top Values
```sql
select
  column_name,
  count(*) as frequency,
  count(*) * 100.0 / sum(count(*)) over () as percentage
from table_name
where td_interval(time, '-30d', 'JST')
group by column_name
order by frequency desc
limit 10
```

## 📚 Complete Example: Profiling with JSON/Array Detection

### Example Request

**User**: "Profile the src_kris.communication_preference table"

### Step-by-Step Execution

**STEP 1: Get Schema**

```bash
tdx describe src_kris.communication_preference
```

Result: 13 columns including `emailpreference`, `telephonepreference`, `customerpreference` (all varchar)

**STEP 2: Sample and Detect Types**

```sql
-- Check emailpreference content
select emailpreference
from src_kris.communication_preference
where emailpreference is not null
limit 5
```

Result: Values start with `{` → **Detected as JSON Object**

**STEP 3: Validate JSON Structure**

```sql
select
  case when try(json_parse(emailpreference)) is not null then 'VALID' else 'INVALID' end as validity,
  count(*) as count
from src_kris.communication_preference
where emailpreference is not null
group by case when try(json_parse(emailpreference)) is not null then 'VALID' else 'INVALID' end
```

Result: 17 VALID, 0 INVALID → 100% valid JSON

**STEP 4: Extract JSON Keys**

```sql
select distinct
  json_extract_scalar(emailpreference, '$.emailAddress') as email,
  json_extract_scalar(emailpreference, '$.contactPreferenceType') as pref_type
from src_kris.communication_preference
where emailpreference like '{%'
limit 3
```

Result: Keys found: `emailAddress`, `contactPreferenceType`, `customerDataSource`

**STEP 5: Report in Data Type Detection Table**

| Column | Schema Type | Detected Type | Sample Values | Cardinality | Nulls (%) | Notes |
|--------|-------------|---------------|---------------|-------------|-----------|-------|
| emailpreference | varchar | **JSON Object** | `{"emailAddress":"krishna@nordstrom.com","contactPreferenceType":"EMAIL"}` | 5 | 5.56% | Valid JSON: 100% |
| telephonepreference | varchar | Categorical | Empty string | 1 | 83.33% | ⚠️ Mostly null |
| enterpriseid | varchar | Identifier | "ENT001" | 1 | 94.44% | ⚠️ Almost all null |
| time | bigint | **Unix Timestamp** | 1699564800 (2024-11-13 14:07:01) | 18 | 0% | ✅ Valid dates |

**STEP 6: Create Visualizations**

1. Completeness chart showing JSON columns vs regular columns
2. Type distribution pie chart (EMAIL vs CUSTOMER types)
3. Null count bar chart highlighting sparse columns

**STEP 7: Generate Recommendations**

```markdown
## 💡 Recommendations

### Immediate Actions

1. **Parse JSON Preferences into Columns**
   - Current: Email preferences stored as JSON text
   - Action: Extract `emailAddress`, `contactPreferenceType` into separate columns
   - Benefit: Faster queries, easier filtering, better indexing

2. **Fix lastupdatedtime Corruption**
   - Current: Shows year +56837 (invalid timestamp)
   - Action: Divide by 1000 or fix epoch conversion
   - Impact: Breaks date filtering and reporting
```

## Related Skills

- **schema-explorer** - Table discovery
- **smart-sampler** - Data sampling
- **analytical-query** - Query generation
- **field-agent-visualization** - Plotly standards
- **trino** - SQL reference

## Resources

- Trino Statistics: https://trino.io/docs/current/functions/aggregate.html
- Trino JSON Functions: https://trino.io/docs/current/functions/json.html
- Plotly Charts: https://plotly.com/python/
- TD Best Practices: https://docs.treasuredata.com/
