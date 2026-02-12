# Activation Actions - Quick Reference

## Required Parameters (Auto-Provided)

```yaml
_export:
  segment_id: ${segment_id}              # Segment ID
  activation_id: ${activation_id}        # Activation run ID
  activation_output_database: ${activation_output_database}  # Database name
  activation_output_table: ${activation_output_table}        # Table name
  profile_count: ${profile_count}        # Number of profiles
```

## Basic Workflow Template

```yaml
timezone: UTC

_export:
  segment_id: ${segment_id}
  activation_id: ${activation_id}
  activation_output_database: ${activation_output_database}
  activation_output_table: ${activation_output_table}

+process:
  td>: queries/process.sql
  database: ${activation_output_database}

+export:
  td_result_export>:
    database: ${activation_output_database}
    table: processed_data
    result_url: "platform://auth"
```

## Common Patterns

### Load Activation Data
```yaml
+load:
  td>: |
    SELECT * FROM ${activation_output_database}.${activation_output_table}
  database: working_db
  create_table: profiles
```

### Data Transformation
```yaml
+transform:
  td>: |
    SELECT
      LOWER(TRIM(email)) AS email,
      INITCAP(first_name) AS first_name,
      REGEXP_REPLACE(phone, '[^0-9]', '') AS phone_clean
    FROM ${activation_output_database}.${activation_output_table}
```

### Compliance Check
```yaml
+check_compliance:
  td>: |
    SELECT a.*
    FROM ${activation_output_database}.${activation_output_table} a
    LEFT JOIN compliance.optouts o ON a.email = o.email
    WHERE o.email IS NULL
```

### Export to Platform
```yaml
+export:
  td_result_export>:
    database: ${activation_output_database}
    table: export_data
    result_url: "braze://braze-auth"
```

### Cleanup
```yaml
+cleanup:
  td_ddl>:
  drop_tables: ["db.temp_table_${activation_id}"]
```

### Error Handling
```yaml
_error:
  echo>: "Activation ${activation_id} failed"
```

## Useful SQL Snippets

### Hash Email (Privacy)
```sql
SHA256(LOWER(TRIM(email))) AS email_hash
```

### Format Phone
```sql
CONCAT('+1-',
  SUBSTRING(REGEXP_REPLACE(phone, '[^0-9]', ''), 1, 3), '-',
  SUBSTRING(REGEXP_REPLACE(phone, '[^0-9]', ''), 4, 3), '-',
  SUBSTRING(REGEXP_REPLACE(phone, '[^0-9]', ''), 7, 4)
) AS phone_formatted
```

### Profile Hash (Change Detection)
```sql
MD5(CONCAT(
  COALESCE(first_name, ''),
  COALESCE(last_name, ''),
  COALESCE(phone, '')
)) AS profile_hash
```

### Validate Email
```sql
CASE
  WHEN email IS NULL THEN 'NULL'
  WHEN email NOT LIKE '%@%.%' THEN 'INVALID'
  ELSE 'VALID'
END AS email_status
```

## Export Platforms

| Platform | Result URL |
|----------|------------|
| Braze | `braze://auth-name` |
| Google Ads | `google_ads://auth-name` |
| Meta/Facebook | `facebook_custom_audiences://auth-name` |
| Salesforce Marketing Cloud | `salesforce_marketing_cloud://auth-name` |
| TikTok | `tiktok://auth-name` |
| Twilio | `twilio://auth-name` |

## Checklist

### Setup
- [ ] Create workflow with required parameters
- [ ] Implement processing logic
- [ ] Add export connector
- [ ] Set View + Run permissions
- [ ] Test with small segment

### Assign to Activation
- [ ] Open activation in Audience Studio
- [ ] Enable "Activation Actions"
- [ ] Select workflow in Actions tab
- [ ] Save and test

### Monitor
- [ ] Check workflow execution logs
- [ ] Verify data in destination
- [ ] Review delta/compliance summaries
- [ ] Monitor for errors

## Common Issues

| Issue | Solution |
|-------|----------|
| Parameters not found | Ensure workflow triggered BY activation |
| Permission denied | Grant View + Run permissions |
| Export fails | Check authentication, result_url format |
| Tables not cleaned | Add cleanup step with activation_id |

## Quick Commands

```bash
# Push workflow
tdx wf push project-name

# Test workflow manually (won't have activation params)
tdx wf run project-name workflow-name

# View logs
# Use TD Console → Data Workbench → Workflows → View Logs
```
