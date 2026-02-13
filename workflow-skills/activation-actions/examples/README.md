# Activation Actions Workflow Examples

This directory contains ready-to-use example workflows for common Activation Actions use cases.

## Examples Included

### 1. `simple_transformation.dig`
**Use Case**: Format phone numbers and clean email addresses

**What it does**:
- Standardizes email addresses (lowercase, trimmed)
- Formats phone numbers as +1-XXX-XXX-XXXX
- Capitalizes names properly
- Validates data before export

**Best for**: SMS/phone marketing campaigns, data quality improvement

---

### 2. `gdpr_compliance.dig`
**Use Case**: Filter out profiles with GDPR deletion requests or marketing opt-outs

**What it does**:
- Checks against deletion request tables
- Checks against marketing opt-out tables
- Logs excluded profiles for audit
- Creates compliance summary report

**Best for**: European markets, compliance-sensitive industries, email marketing

---

### 3. `multi_platform_export.dig`
**Use Case**: Export same segment to multiple platforms (Braze, Google Ads, Meta, SFMC)

**What it does**:
- Prepares platform-specific data formats
- Hashes emails/PII for privacy-focused platforms
- Exports to 4 platforms in parallel
- Logs export results per platform

**Best for**: Multi-channel campaigns, cross-platform audience sync

---

### 4. `email_validation.dig`
**Use Case**: Validate email addresses before export to email platforms

**What it does**:
- Validates email format (@ sign, domain, length)
- Blocks test/example domains
- Blocks disposable email services
- Analyzes email domains
- Creates validation report

**Best for**: Email marketing campaigns, data quality improvement

---

## How to Use These Examples

### Step 1: Choose Your Example
Pick the workflow that best matches your use case.

### Step 2: Customize Configuration
Edit the `_export` section to match your setup:

```yaml
_export:
  # Update authentication names
  compliance_database: "your_compliance_db"

  # Update connector URLs
  result_url: "platform://your-authentication-name"
```

### Step 3: Customize SQL Queries
Update table/column names to match your schema:

```yaml
+transform_data:
  td>: |
    SELECT
      your_customer_id AS customer_id,
      your_email AS email,
      -- Add your custom fields here
    FROM ${activation_output_database}.${activation_output_table}
```

### Step 4: Upload to Treasure Data

```bash
# Create workflow project (if needed)
mkdir my-activation-workflows
cd my-activation-workflows

# Copy example file
cp /path/to/simple_transformation.dig .

# Push to TD
tdx wf push my-activation-workflows
```

### Step 5: Set Permissions

1. Go to TD Console → Data Workbench → Workflows
2. Find your workflow
3. Settings → Permissions
4. Add View + Run permissions for activation creators

### Step 6: Assign to Activation

1. Go to Audience Studio → Segment → Activations
2. Create or edit activation
3. Details tab → Enable "Activation Actions"
4. Actions tab → Select your workflow

---

## Customization Tips

### Adding Custom Validation
```yaml
+custom_validation:
  td>: |
    SELECT
      *,
      CASE
        WHEN your_custom_field IS NULL THEN 'INVALID'
        WHEN your_custom_field < 0 THEN 'INVALID'
        ELSE 'VALID'
      END AS validation_status
    FROM your_table
```

### Adding Slack Notifications
```yaml
_export:
  slack_webhook: "https://hooks.slack.com/services/YOUR/WEBHOOK"

+notify_completion:
  http>:
    url: ${slack_webhook}
    method: POST
    content:
      text: "Activation ${activation_id} completed with ${profile_count} profiles"
```

### Adding Error Alerts
```yaml
_error:
  +log_error:
    echo>: "Workflow failed!"

  +notify_error:
    http>:
      url: ${slack_webhook}
      method: POST
      content:
        text: "⚠️ Activation ${activation_id} FAILED"
```

---

## Testing Checklist

Before using in production:

- [ ] Test with small segment (< 1000 profiles)
- [ ] Verify SQL queries work with your schema
- [ ] Check export connector authentication
- [ ] Validate exported data in destination platform
- [ ] Review workflow logs for errors
- [ ] Test error handling (intentionally fail a step)
- [ ] Verify cleanup removes temporary tables
- [ ] Check permissions are set correctly

---

## Common Modifications

### Change Export Destination
Replace the `result_url` with your platform:

```yaml
# Braze
result_url: "braze://your-braze-auth"

# Google Ads
result_url: "google_ads://your-gads-auth"

# Salesforce Marketing Cloud
result_url: "salesforce_marketing_cloud://your-sfmc-auth"

# Meta/Facebook
result_url: "facebook_custom_audiences://your-meta-auth"

# Custom HTTP endpoint
result_url: "https://api.yourplatform.com/import"
```

### Add Data Enrichment
```yaml
+enrich_data:
  td>: |
    SELECT
      a.*,
      b.customer_tier,
      b.lifetime_value,
      b.last_purchase_date
    FROM ${activation_output_database}.${activation_output_table} a
    LEFT JOIN customer_data.enrichment_table b
      ON a.customer_id = b.customer_id
  database: ${activation_output_database}
  create_table: enriched_profiles
```

### Add Conditional Logic
```yaml
+check_profile_count:
  td>: |
    SELECT COUNT(*) AS cnt
    FROM ${activation_output_database}.${activation_output_table}

+conditional_export:
  if>: ${td.last_results.cnt > 1000}
  _do:
    echo>: "Large segment - using optimized export"
    +export:
      td_result_export>: ...
  _else:
    echo>: "Small segment - using standard export"
    +export:
      td_result_export>: ...
```

---

## Need Help?

- Read the [full SKILL.md documentation](../SKILL.md)
- Check [Activation Actions docs](https://docs.treasuredata.com/products/customer-data-platform/audience-studio/activation/activation-actions)
- Contact your Customer Success Representative
- Open an issue in the td-skills repository

---

## Contributing

Have a useful Activation Actions workflow? Consider contributing:

1. Test thoroughly with multiple segments
2. Document configuration requirements
3. Add comments explaining key steps
4. Submit PR to td-skills repository
