# Activation Actions Workflows

## Purpose
Create custom digdag workflows that run automatically during Treasure Data activations to transform data, perform validation, implement incremental exports, or enforce compliance before sending profiles to external platforms.

## When to Use This Skill
- Creating incremental/delta activation workflows to reduce platform costs
- Implementing data transformation before exporting to marketing platforms
- Adding compliance checks (GDPR, CCPA) before profile export
- Building custom validation logic for activation data
- Enriching profiles with additional attributes before export
- Creating multi-destination export workflows
- Implementing advanced filtering or segmentation logic

## Prerequisites
- Access to Treasure Data Workflow (digdag)
- Permission to create and edit workflows
- Permission to create and edit activations in Audience Studio
- Understanding of TD activation parameters
- Familiarity with SQL and result export connectors

## Core Concepts

### What are Activation Actions?

Activation Actions enable you to run a custom workflow automatically during each activation. The workflow:
1. **Receives activation data** as input parameters
2. **Processes the data** according to your business logic
3. **Controls activation success** - both must succeed for overall success

```
Segment → Activation → Your Workflow → Export → External Platform
                       ↓
              (Transform/Validate/Filter)
```

### Activation Lifecycle with Actions

```
1. Segment activation triggered (manual or scheduled)
   ↓
2. TD generates activation output table
   ↓
3. Your workflow automatically triggered with parameters
   ↓
4. Workflow processes data and performs export
   ↓
5. Activation marked successful only if workflow succeeds
```

## Instructions

### Step 1: Understand Required Parameters

Every Activation Actions workflow automatically receives these parameters:

| Parameter | Description | Example | Use For |
|-----------|-------------|---------|---------|
| `segment_id` | ID of the activated segment | `12345` | Identifying source segment |
| `activation_id` | Unique activation instance ID | `67890` | Tracking/logging |
| `activation_output_database` | Database with activation results | `activation_results` | Reading activation data |
| `activation_output_table` | Table with current profiles | `segment_12345_act_67890` | Source data table |
| `profile_count` | Number of profiles in activation | `150000` | Validation/logging |

**Example accessing in workflow:**
```yaml
_export:
  segment_id: ${segment_id}
  activation_id: ${activation_id}
  source_db: ${activation_output_database}
  source_table: ${activation_output_table}

+load_activation_data:
  td>: queries/process_activation.sql
  database: ${source_db}
```

### Step 2: Choose Your Workflow Pattern

**Common Patterns:**

#### Pattern A: Incremental/Delta Activation
**Purpose**: Export only changed profiles to reduce costs

**When to use**:
- Destination charges per profile (Braze, Google Ads, Meta)
- Large segments with infrequent changes
- Platform has rate limits

**Key steps**:
1. Load current activation data
2. Compare with previous snapshot
3. Identify NEW, UPDATED, DELETED profiles
4. Export only deltas
5. Save new snapshot

#### Pattern B: Data Transformation
**Purpose**: Reformat data for destination requirements

**When to use**:
- Platform requires specific data formats
- Need to hash emails for privacy
- Combining/splitting fields
- Converting data types

**Key steps**:
1. Load activation data
2. Apply transformations (SQL/Python)
3. Validate transformed data
4. Export to destination

#### Pattern C: Compliance & Validation
**Purpose**: Enforce data governance before export

**When to use**:
- GDPR/CCPA compliance required
- Need opt-in/opt-out checking
- Data quality validation
- Custom business rules

**Key steps**:
1. Load activation data
2. Check compliance status
3. Filter non-compliant profiles
4. Log filtered profiles
5. Export compliant profiles only

#### Pattern D: Multi-Destination Export
**Purpose**: Send same data to multiple platforms

**When to use**:
- Syncing across multiple marketing tools
- A/B testing different platforms
- Backup/redundancy requirements

**Key steps**:
1. Load activation data
2. Transform for each destination
3. Export in parallel to all platforms
4. Aggregate results

### Step 3: Create Workflow Structure

**Basic Template:**

```yaml
# workflow_name.dig
timezone: UTC

_export:
  # Activation parameters (auto-provided)
  segment_id: ${segment_id}
  activation_id: ${activation_id}
  activation_output_database: ${activation_output_database}
  activation_output_table: ${activation_output_table}
  profile_count: ${profile_count}

  # Your custom configuration
  td:
    database: ${activation_output_database}

  # Workflow-specific settings
  working_database: "activation_processing"

+start:
  echo>: "Processing activation ${activation_id} for segment ${segment_id}"

+process_data:
  td>: queries/process.sql
  database: ${working_database}
  create_table: processed_data

+export_to_destination:
  td_result_export>:
    database: ${working_database}
    table: processed_data
    result_url: "platform://your-authentication"

+cleanup:
  td_ddl>:
  drop_tables: ["${working_database}.processed_data"]

+finish:
  echo>: "Activation ${activation_id} completed successfully"

_error:
  echo>: "Activation ${activation_id} failed. Check logs."
```

### Step 4: Implement Your Pattern

Choose your pattern and implement:

**For Incremental Activation:**
```yaml
+identify_deltas:
  _parallel: true

  +find_new_profiles:
    td>: queries/find_new.sql
    database: ${working_database}
    create_table: new_profiles

  +find_updated_profiles:
    td>: queries/find_updated.sql
    database: ${working_database}
    create_table: updated_profiles

  +find_deleted_profiles:
    td>: queries/find_deleted.sql
    database: ${working_database}
    create_table: deleted_profiles

+export_deltas:
  td>: queries/prepare_delta_export.sql
  database: ${working_database}
  create_table: export_data

+save_snapshot:
  td>: queries/save_snapshot.sql
  database: ${working_database}
  insert_into: snapshot_table
```

**For Data Transformation:**
```yaml
+transform_data:
  td>: queries/transform.sql
  database: ${working_database}
  create_table: transformed_data

+validate_transformation:
  td>: queries/validate.sql
  database: ${working_database}

+export_transformed:
  td_result_export>:
    database: ${working_database}
    table: transformed_data
    result_url: "destination://auth"
```

**For Compliance Checking:**
```yaml
+check_compliance:
  td>: queries/compliance_check.sql
  database: ${working_database}
  create_table: compliant_profiles

+log_filtered:
  td>: queries/log_non_compliant.sql
  database: ${working_database}
  create_table: compliance_log_${activation_id}

+export_compliant_only:
  td_result_export>:
    database: ${working_database}
    table: compliant_profiles
    result_url: "destination://auth"
```

### Step 5: Set Workflow Permissions

**Critical**: Activation creators must have View and Run permissions on your workflow.

```bash
# Using TD Console:
# 1. Navigate to Data Workbench → Workflows
# 2. Find your workflow
# 3. Click Settings → Permissions
# 4. Add users/groups with "View" and "Run" permissions

# Or using API/CLI if available
```

### Step 6: Assign Workflow to Activation

1. **Open TD Console** → Audience Studio
2. **Navigate** to Segment → Activations
3. **Create or Edit** an activation
4. **Details Tab**:
   - Enable "Activation Actions"
   - Select authentication
5. **Actions Tab**:
   - Select Workflow Project
   - Select Workflow Name
6. **Save** activation

### Step 7: Test Your Workflow

**Testing checklist**:
- [ ] Workflow accepts all required parameters
- [ ] SQL queries reference correct tables/databases
- [ ] Export connector configured correctly
- [ ] Cleanup steps remove temporary tables
- [ ] Error handling works correctly
- [ ] Permissions are set properly

**Test activation**:
```bash
# Run activation manually first
# Check workflow execution logs
# Verify export succeeded
# Check destination platform
```

## Best Practices

### 1. Always Use Provided Parameters
```yaml
# GOOD - Uses activation parameters
+load_data:
  td>: |
    SELECT * FROM ${activation_output_database}.${activation_output_table}

# BAD - Hardcoded values
+load_data:
  td>: |
    SELECT * FROM activation_results.my_table
```

### 2. Include Logging and Monitoring
```yaml
+log_start:
  echo>: |
    Activation ID: ${activation_id}
    Segment ID: ${segment_id}
    Profile Count: ${profile_count}
    Started: ${moment().format('YYYY-MM-DD HH:mm:ss')}

+create_audit_log:
  td>: queries/create_log.sql
  database: audit_logs
  create_table: activation_log_${activation_id}
```

### 3. Implement Proper Error Handling
```yaml
_error:
  +log_error:
    echo>: "Workflow failed for activation ${activation_id}"

  +send_alert:
    http>:
      url: "${slack_webhook_url}"
      method: POST
      content:
        text: "Activation ${activation_id} failed. Check logs."
```

### 4. Clean Up Temporary Tables
```yaml
+cleanup:
  td_ddl>:
  drop_tables:
    - ${working_database}.temp_table_1
    - ${working_database}.temp_table_2
    - ${working_database}.temp_table_3
```

### 5. Use Parallel Processing When Possible
```yaml
+process_multiple_steps:
  _parallel: true

  +transform_emails:
    td>: queries/transform_emails.sql

  +transform_phones:
    td>: queries/transform_phones.sql

  +calculate_scores:
    td>: queries/calculate_scores.sql
```

### 6. Validate Data Before Export
```yaml
+validate_before_export:
  td>: |
    SELECT
      COUNT(*) as total_profiles,
      COUNT(CASE WHEN email IS NULL THEN 1 END) as missing_email,
      COUNT(CASE WHEN email NOT LIKE '%@%' THEN 1 END) as invalid_email
    FROM ${working_database}.export_data

  # Fail if too many invalid emails
  assert>: ${td.last_results.missing_email} < 100
```

### 7. Version Your Queries
```yaml
# Store queries in separate files
+process:
  td>: queries/process_activation_v2.sql  # Version in filename

# Or use git tags/branches for workflow versions
```

### 8. Document Configuration
```yaml
# Include documentation in workflow
_export:
  # Configuration
  delta_key: "email"              # Primary key for delta detection
  export_mode: "add_updated"      # Export mode: add_only, add_updated, replace
  destination: "braze"            # Target platform

  # Owner and maintenance info
  workflow_owner: "marketing-ops-team"
  last_updated: "2024-01-15"
  version: "2.1.0"
```

## Common Patterns

### Pattern 1: Simple Data Transformation

**Use case**: Format phone numbers before sending to SMS platform

```yaml
# simple_transformation.dig
timezone: UTC

_export:
  segment_id: ${segment_id}
  activation_id: ${activation_id}
  activation_output_database: ${activation_output_database}
  activation_output_table: ${activation_output_table}

+transform_phones:
  td>: |
    SELECT
      email,
      first_name,
      last_name,
      -- Remove all non-numeric characters from phone
      REGEXP_REPLACE(phone, '[^0-9]', '') AS phone_clean,
      -- Format as +1-XXX-XXX-XXXX
      CONCAT(
        '+1-',
        SUBSTRING(REGEXP_REPLACE(phone, '[^0-9]', ''), 1, 3),
        '-',
        SUBSTRING(REGEXP_REPLACE(phone, '[^0-9]', ''), 4, 3),
        '-',
        SUBSTRING(REGEXP_REPLACE(phone, '[^0-9]', ''), 7, 4)
      ) AS phone_formatted
    FROM ${activation_output_database}.${activation_output_table}
    WHERE phone IS NOT NULL
  database: ${activation_output_database}
  create_table: transformed_profiles

+export:
  td_result_export>:
    database: ${activation_output_database}
    table: transformed_profiles
    result_url: "twilio://your-twilio-auth"
```

### Pattern 2: GDPR Compliance Check

**Use case**: Filter out profiles that have requested data deletion

```yaml
# gdpr_compliance.dig
timezone: UTC

_export:
  segment_id: ${segment_id}
  activation_id: ${activation_id}
  activation_output_database: ${activation_output_database}
  activation_output_table: ${activation_output_table}

  # Reference to GDPR opt-out table
  gdpr_database: "compliance"
  gdpr_optout_table: "gdpr_deletion_requests"

+check_gdpr_status:
  td>: |
    SELECT
      a.*,
      CASE
        WHEN g.email IS NOT NULL THEN 'EXCLUDED'
        ELSE 'COMPLIANT'
      END AS gdpr_status
    FROM ${activation_output_database}.${activation_output_table} a
    LEFT JOIN ${gdpr_database}.${gdpr_optout_table} g
      ON a.email = g.email
  database: ${activation_output_database}
  create_table: gdpr_checked

+filter_compliant:
  td>: |
    SELECT *
    FROM ${activation_output_database}.gdpr_checked
    WHERE gdpr_status = 'COMPLIANT'
  database: ${activation_output_database}
  create_table: compliant_profiles

+log_excluded:
  td>: |
    SELECT
      '${activation_id}' AS activation_id,
      email,
      'GDPR_DELETION_REQUEST' AS exclusion_reason,
      CURRENT_TIMESTAMP AS logged_at
    FROM ${activation_output_database}.gdpr_checked
    WHERE gdpr_status = 'EXCLUDED'
  database: compliance
  insert_into: exclusion_log

+export_compliant:
  td_result_export>:
    database: ${activation_output_database}
    table: compliant_profiles
    result_url: "destination://auth"
```

### Pattern 3: Multi-Platform Export

**Use case**: Send same segment to Braze, Google Ads, and Facebook

```yaml
# multi_platform_export.dig
timezone: UTC

_export:
  segment_id: ${segment_id}
  activation_id: ${activation_id}
  activation_output_database: ${activation_output_database}
  activation_output_table: ${activation_output_table}

+prepare_common_data:
  td>: |
    SELECT
      email,
      first_name,
      last_name,
      phone,
      country
    FROM ${activation_output_database}.${activation_output_table}
  database: ${activation_output_database}
  create_table: common_export_data

+export_to_platforms:
  _parallel: true

  +export_to_braze:
    td_result_export>:
      database: ${activation_output_database}
      table: common_export_data
      result_url: "braze://braze-auth"

  +export_to_google_ads:
    td>: |
      SELECT
        SHA256(LOWER(TRIM(email))) AS hashed_email,
        country
      FROM ${activation_output_database}.common_export_data
    database: ${activation_output_database}
    create_table: google_ads_data

  +send_to_google_ads:
    td_result_export>:
      database: ${activation_output_database}
      table: google_ads_data
      result_url: "google_ads://gads-auth"

  +export_to_facebook:
    td>: |
      SELECT
        SHA256(LOWER(TRIM(email))) AS email_hash,
        phone,
        country
      FROM ${activation_output_database}.common_export_data
    database: ${activation_output_database}
    create_table: facebook_data

  +send_to_facebook:
    td_result_export>:
      database: ${activation_output_database}
      table: facebook_data
      result_url: "facebook_custom_audiences://fb-auth"

+log_exports:
  td>: |
    SELECT
      '${activation_id}' AS activation_id,
      'Braze' AS platform,
      COUNT(*) AS profiles_exported,
      CURRENT_TIMESTAMP AS exported_at
    FROM ${activation_output_database}.common_export_data
  database: analytics
  insert_into: export_log
```

### Pattern 4: Email Validation & Enrichment

**Use case**: Validate emails and enrich with additional data

```yaml
# email_validation.dig
timezone: UTC

_export:
  segment_id: ${segment_id}
  activation_id: ${activation_id}
  activation_output_database: ${activation_output_database}
  activation_output_table: ${activation_output_table}

+validate_emails:
  td>: |
    SELECT
      *,
      CASE
        WHEN email IS NULL THEN 'NULL'
        WHEN email NOT LIKE '%@%' THEN 'NO_AT_SIGN'
        WHEN email NOT LIKE '%.%' THEN 'NO_DOMAIN'
        WHEN LENGTH(email) < 5 THEN 'TOO_SHORT'
        WHEN email LIKE '%@example.com' THEN 'EXAMPLE_DOMAIN'
        WHEN email LIKE '%@test.com' THEN 'TEST_DOMAIN'
        ELSE 'VALID'
      END AS email_status,

      -- Extract email domain
      SUBSTRING(email, POSITION('@' IN email) + 1) AS email_domain

    FROM ${activation_output_database}.${activation_output_table}
  database: ${activation_output_database}
  create_table: email_validated

+filter_valid:
  td>: |
    SELECT *
    FROM ${activation_output_database}.email_validated
    WHERE email_status = 'VALID'
  database: ${activation_output_database}
  create_table: valid_profiles

+log_invalid:
  td>: |
    SELECT
      '${activation_id}' AS activation_id,
      email,
      email_status,
      CURRENT_TIMESTAMP AS logged_at
    FROM ${activation_output_database}.email_validated
    WHERE email_status != 'VALID'
  database: analytics
  insert_into: invalid_email_log

+export_valid:
  td_result_export>:
    database: ${activation_output_database}
    table: valid_profiles
    result_url: "destination://auth"
```

### Pattern 5: Incremental Activation (Simplified)

**Use case**: Export only new and changed profiles

```yaml
# incremental_activation.dig
timezone: UTC

_export:
  segment_id: ${segment_id}
  activation_id: ${activation_id}
  activation_output_database: ${activation_output_database}
  activation_output_table: ${activation_output_table}

  snapshot_database: "activation_snapshots"
  snapshot_table: "segment_${segment_id}_snapshot"

+load_current:
  td>: |
    SELECT
      email,
      first_name,
      last_name,
      phone,
      -- Hash all attributes for change detection
      MD5(CONCAT(
        COALESCE(first_name, ''),
        COALESCE(last_name, ''),
        COALESCE(phone, '')
      )) AS profile_hash
    FROM ${activation_output_database}.${activation_output_table}
  database: ${snapshot_database}
  create_table: current_profiles

+find_new_and_updated:
  td>: |
    SELECT
      curr.*,
      CASE
        WHEN prev.email IS NULL THEN 'NEW'
        WHEN curr.profile_hash != prev.profile_hash THEN 'UPDATED'
        ELSE 'UNCHANGED'
      END AS change_type
    FROM ${snapshot_database}.current_profiles curr
    LEFT JOIN ${snapshot_database}.${snapshot_table} prev
      ON curr.email = prev.email
  database: ${snapshot_database}
  create_table: delta_analysis

+export_changes:
  td>: |
    SELECT
      email,
      first_name,
      last_name,
      phone,
      change_type
    FROM ${snapshot_database}.delta_analysis
    WHERE change_type IN ('NEW', 'UPDATED')
  database: ${snapshot_database}
  create_table: profiles_to_export

+export:
  td_result_export>:
    database: ${snapshot_database}
    table: profiles_to_export
    result_url: "destination://auth"

+update_snapshot:
  td>: |
    DELETE FROM ${snapshot_database}.${snapshot_table};

    INSERT INTO ${snapshot_database}.${snapshot_table}
    SELECT * FROM ${snapshot_database}.current_profiles
```

## Troubleshooting

### Issue: Workflow doesn't receive activation parameters

**Symptoms**:
- Workflow fails with "variable not defined" errors
- Parameters like `${segment_id}` are empty

**Solution**:
1. Ensure workflow is assigned in Activation Actions tab (not just run manually)
2. Check parameter names match exactly (case-sensitive)
3. Verify workflow is triggered BY the activation, not run independently

```yaml
# CORRECT - Uses parameters
_export:
  segment_id: ${segment_id}

# WRONG - Tries to set default
_export:
  segment_id: ${segment_id:-'12345'}  # Don't do this
```

### Issue: Permission denied when creating activation

**Symptoms**:
- Workflow not visible in dropdown
- "You don't have permission" error

**Solution**:
1. Go to Workflow → Settings → Permissions
2. Grant "View" and "Run" permissions to activation creators
3. Consider creating a user group for activation users

### Issue: Export fails but workflow succeeds

**Symptoms**:
- Workflow completes successfully
- But data doesn't appear in destination platform

**Solution**:
1. Check export connector authentication
2. Verify result_url format is correct
3. Check destination platform logs for errors
4. Ensure exported table has required columns

```yaml
# Verify export table structure
+validate_export_schema:
  td>: |
    SELECT
      COLUMN_NAME,
      DATA_TYPE
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 'export_data'
```

### Issue: Activation marked as failed but workflow succeeded

**Symptoms**:
- Workflow logs show success
- Activation status shows failed

**Solution**:
This shouldn't happen - both should be coupled. If it does:
1. Check for database connection issues
2. Verify cleanup steps didn't fail
3. Look for timeout errors in activation logs
4. Contact TD support

### Issue: Temporary tables not cleaned up

**Symptoms**:
- Database filling up with temp tables
- Performance degradation

**Solution**:
1. Always include cleanup step
2. Use unique table names with `${activation_id}`
3. Consider scheduled cleanup workflow

```yaml
+cleanup:
  td_ddl>:
  drop_tables:
    - ${working_database}.temp_*  # Drop all temp tables
    - ${working_database}.activation_${activation_id}_*
```

### Issue: Snapshot comparison fails on first run

**Symptoms**:
- First activation fails
- "Table not found" error for snapshot

**Solution**:
Create snapshot table if it doesn't exist:

```yaml
+create_snapshot_if_needed:
  td_ddl>:
  create_tables: ["${snapshot_database}.${snapshot_table}"]

+check_snapshot_exists:
  td>: |
    SELECT COUNT(*) as snapshot_exists
    FROM ${snapshot_database}.${snapshot_table}

+handle_first_run:
  if>: ${td.last_results.snapshot_exists == 0}
  _do:
    echo>: "First run - full export"
  _else:
    echo>: "Incremental run"
```

## Examples

### Example 1: High-Value Customer Activation

**Scenario**: Export only customers who spent >$10,000, with compliance checking

```yaml
# high_value_customers.dig
timezone: UTC

_export:
  segment_id: ${segment_id}
  activation_id: ${activation_id}
  activation_output_database: ${activation_output_database}
  activation_output_table: ${activation_output_table}

+filter_high_value:
  td>: |
    SELECT
      a.*,
      b.total_lifetime_value,
      b.last_purchase_date
    FROM ${activation_output_database}.${activation_output_table} a
    JOIN customer_data.purchase_summary b
      ON a.customer_id = b.customer_id
    WHERE b.total_lifetime_value > 10000
      AND b.email_opt_in = true
  database: ${activation_output_database}
  create_table: high_value_customers

+export:
  td_result_export>:
    database: ${activation_output_database}
    table: high_value_customers
    result_url: "salesforce://sfdc-auth"
```

### Example 2: A/B Test Split Export

**Scenario**: Split segment 50/50 for A/B testing across platforms

```yaml
# ab_test_split.dig
timezone: UTC

_export:
  segment_id: ${segment_id}
  activation_id: ${activation_id}
  activation_output_database: ${activation_output_database}
  activation_output_table: ${activation_output_table}

+assign_test_group:
  td>: |
    SELECT
      *,
      CASE
        WHEN MOD(ABS(HASH(email)), 2) = 0 THEN 'VARIANT_A'
        ELSE 'VARIANT_B'
      END AS test_group
    FROM ${activation_output_database}.${activation_output_table}
  database: ${activation_output_database}
  create_table: test_assigned

+export_variants:
  _parallel: true

  +export_variant_a:
    td>: |
      SELECT * FROM ${activation_output_database}.test_assigned
      WHERE test_group = 'VARIANT_A'
    database: ${activation_output_database}
    create_table: variant_a

  +send_variant_a:
    td_result_export>:
      database: ${activation_output_database}
      table: variant_a
      result_url: "braze://braze-variant-a"

  +export_variant_b:
    td>: |
      SELECT * FROM ${activation_output_database}.test_assigned
      WHERE test_group = 'VARIANT_B'
    database: ${activation_output_database}
    create_table: variant_b

  +send_variant_b:
    td_result_export>:
      database: ${activation_output_database}
      table: variant_b
      result_url: "braze://braze-variant-b"
```

### Example 3: Churn Prevention with Scoring

**Scenario**: Calculate churn risk score and export high-risk customers

```yaml
# churn_prevention.dig
timezone: UTC

_export:
  segment_id: ${segment_id}
  activation_id: ${activation_id}
  activation_output_database: ${activation_output_database}
  activation_output_table: ${activation_output_table}

+calculate_churn_score:
  td>: |
    SELECT
      a.*,
      -- Calculate churn risk score (0-100)
      LEAST(100, GREATEST(0,
        -- Days since last purchase (max 90 days = 40 points)
        (DATE_DIFF('day', DATE(b.last_purchase_date), CURRENT_DATE) / 90.0) * 40 +
        -- Declining engagement (max 30 points)
        (CASE WHEN b.sessions_last_30d < b.sessions_prev_30d THEN 30 ELSE 0 END) +
        -- Low spend trend (max 30 points)
        (CASE WHEN b.spend_last_30d < b.spend_prev_30d * 0.5 THEN 30 ELSE 0 END)
      )) AS churn_risk_score
    FROM ${activation_output_database}.${activation_output_table} a
    JOIN customer_data.engagement_metrics b
      ON a.customer_id = b.customer_id
  database: ${activation_output_database}
  create_table: churn_scored

+segment_by_risk:
  td>: |
    SELECT
      *,
      CASE
        WHEN churn_risk_score >= 70 THEN 'HIGH_RISK'
        WHEN churn_risk_score >= 40 THEN 'MEDIUM_RISK'
        ELSE 'LOW_RISK'
      END AS risk_tier
    FROM ${activation_output_database}.churn_scored
  database: ${activation_output_database}
  create_table: risk_segmented

+export_high_risk:
  td>: |
    SELECT * FROM ${activation_output_database}.risk_segmented
    WHERE risk_tier = 'HIGH_RISK'
  database: ${activation_output_database}
  create_table: high_risk_customers

+export:
  td_result_export>:
    database: ${activation_output_database}
    table: high_risk_customers
    result_url: "retention_campaign://auth"
```

## Reference

### Key SQL Functions for Activation Workflows

| Function | Use Case | Example |
|----------|----------|---------|
| `MD5()` | Profile change detection | `MD5(CONCAT(first_name, last_name))` |
| `SHA256()` | Email hashing for privacy | `SHA256(LOWER(TRIM(email)))` |
| `REGEXP_REPLACE()` | Data cleaning | `REGEXP_REPLACE(phone, '[^0-9]', '')` |
| `COALESCE()` | Handle nulls | `COALESCE(email, 'unknown')` |
| `DATE_DIFF()` | Time calculations | `DATE_DIFF('day', last_purchase, CURRENT_DATE)` |
| `HASH()` | Deterministic grouping | `MOD(ABS(HASH(email)), 10)` |

### Common Export Connectors

| Platform | result_url Format | Notes |
|----------|-------------------|-------|
| Braze | `braze://auth-name` | Supports upsert |
| Google Ads | `google_ads://auth-name` | Requires hashed emails |
| Meta/Facebook | `facebook_custom_audiences://auth-name` | Requires hashed PII |
| Salesforce Marketing Cloud | `salesforce_marketing_cloud://auth-name` | Supports replace mode |
| TikTok | `tiktok://auth-name` | Limited remove support |
| Twilio | `twilio://auth-name` | For SMS campaigns |

### Workflow Operators Reference

| Operator | Purpose | Example |
|----------|---------|---------|
| `td>` | Run TD query | `td>: queries/process.sql` |
| `td_ddl>` | Create/drop tables | `td_ddl>: create_tables: ["table1"]` |
| `td_result_export>` | Export data | `td_result_export>: result_url: "..."` |
| `echo>` | Logging | `echo>: "Processing ${activation_id}"` |
| `_parallel:` | Parallel execution | `_parallel: true` |
| `_error:` | Error handling | `_error: +notify_failure:` |
| `if>` | Conditional logic | `if>: ${profile_count > 1000}` |

### Related Skills

- `workflow-skills:digdag` - General Treasure Workflow creation
- `workflow-skills:workflow-management` - Managing and debugging workflows
- `sql-skills:trino` - Writing Trino SQL queries
- `tdx-skills:workflow` - Managing workflows via tdx CLI

## Additional Resources

- [Activation Actions Documentation](https://docs.treasuredata.com/products/customer-data-platform/audience-studio/activation/activation-actions)
- [Activation Actions Parameters](https://docs.treasuredata.com/products/customer-data-platform/audience-studio/activation/activation-actions-parameters)
- [Incremental Activation Guide](https://docs.treasuredata.com/products/customer-data-platform/audience-studio/activation/incremental-activation-overview)
- [Treasure Workflow Reference](https://docs.treasuredata.com/products/customer-data-platform/data-workbench/workflows)
- [Result Export Connectors](https://docs.treasuredata.com/smart/project-integrations)
