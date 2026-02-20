---
name: activation-actions
description: "Create custom digdag workflows triggered by TD Activation Actions. Covers auto-provided parameters, td_result_export patterns, incremental/delta exports, compliance filtering, and multi-platform delivery. Use when building activation workflows for Audience Studio."
---

# Activation Actions Workflows

Custom digdag workflows that run automatically during TD activations to transform, validate, or route profile data before export.

## Auto-Provided Parameters

Every Activation Actions workflow receives these parameters automatically:

```yaml
_export:
  segment_id: ${segment_id}
  activation_id: ${activation_id}
  activation_output_database: ${activation_output_database}
  activation_output_table: ${activation_output_table}
  profile_count: ${profile_count}
```

## Basic Template

```yaml
timezone: UTC

_export:
  segment_id: ${segment_id}
  activation_id: ${activation_id}
  activation_output_database: ${activation_output_database}
  activation_output_table: ${activation_output_table}
  td:
    database: ${activation_output_database}

+process:
  td>: |
    SELECT LOWER(TRIM(email)) AS email, first_name, last_name
    FROM ${activation_output_database}.${activation_output_table}
    WHERE email IS NOT NULL
  create_table: processed_profiles

+export:
  td_result_export>:
    database: ${activation_output_database}
    table: processed_profiles
    result_url: "braze://your-auth-name"

+cleanup:
  td_ddl>:
  drop_tables: ["${activation_output_database}.processed_profiles"]

_error:
  echo>: "Activation ${activation_id} failed"
```

## Export Connector URLs

| Platform | result_url Format |
|----------|-------------------|
| Braze | `braze://auth-name` |
| Google Ads | `google_ads://auth-name` |
| Meta/Facebook | `facebook_custom_audiences://auth-name` |
| Salesforce MC | `salesforce_marketing_cloud://auth-name` |
| TikTok | `tiktok://auth-name` |
| Twilio | `twilio://auth-name` |

## Common Patterns

### Incremental/Delta Export

Only export new or changed profiles using snapshot comparison:

```yaml
+load_current:
  td>: |
    SELECT *, MD5(CONCAT(
      COALESCE(first_name,''), COALESCE(last_name,''), COALESCE(phone,'')
    )) AS profile_hash
    FROM ${activation_output_database}.${activation_output_table}
  create_table: current_profiles

+find_changes:
  td>: |
    SELECT curr.*, CASE
      WHEN prev.email IS NULL THEN 'NEW'
      WHEN curr.profile_hash != prev.profile_hash THEN 'UPDATED'
      ELSE 'UNCHANGED'
    END AS change_type
    FROM current_profiles curr
    LEFT JOIN segment_${segment_id}_snapshot prev ON curr.email = prev.email
  create_table: delta_profiles

+export_changes:
  td>: |
    SELECT * FROM delta_profiles WHERE change_type IN ('NEW', 'UPDATED')
  create_table: profiles_to_export

+update_snapshot:
  td>: |
    INSERT INTO segment_${segment_id}_snapshot SELECT * FROM current_profiles
```

### Compliance Filtering

```yaml
+filter_compliant:
  td>: |
    SELECT a.*
    FROM ${activation_output_database}.${activation_output_table} a
    LEFT JOIN compliance.gdpr_deletion_requests g ON a.email = g.email
    LEFT JOIN compliance.marketing_optouts o ON a.email = o.email
    WHERE g.email IS NULL AND o.email IS NULL
  create_table: compliant_profiles

+log_excluded:
  td>: |
    SELECT '${activation_id}' AS activation_id, a.email, 'EXCLUDED' AS status
    FROM ${activation_output_database}.${activation_output_table} a
    LEFT JOIN compliant_profiles c ON a.email = c.email
    WHERE c.email IS NULL
  insert_into: compliance.exclusion_log
```

### Multi-Platform Export

```yaml
+export_to_platforms:
  _parallel: true

  +to_braze:
    td_result_export>:
      database: ${activation_output_database}
      table: export_data
      result_url: "braze://braze-auth"

  +prepare_google:
    td>: |
      SELECT SHA256(LOWER(TRIM(email))) AS hashed_email, country
      FROM export_data
    create_table: google_ads_data

  +to_google:
    td_result_export>:
      database: ${activation_output_database}
      table: google_ads_data
      result_url: "google_ads://gads-auth"
```

### Useful SQL Snippets

```sql
-- Hash email for privacy-required platforms
SHA256(LOWER(TRIM(email))) AS email_hash

-- Format US phone
CONCAT('+1-',
  SUBSTRING(REGEXP_REPLACE(phone,'[^0-9]',''),1,3), '-',
  SUBSTRING(REGEXP_REPLACE(phone,'[^0-9]',''),4,3), '-',
  SUBSTRING(REGEXP_REPLACE(phone,'[^0-9]',''),7,4)
) AS phone_formatted

-- Profile change detection hash
MD5(CONCAT(COALESCE(first_name,''), COALESCE(last_name,''), COALESCE(phone,''))) AS profile_hash
```

## Setup

1. Create workflow with `_export` parameters above
2. Push: `tdx wf push project-name`
3. Grant **View + Run** permissions to activation creators (Workflow Settings > Permissions)
4. In Audience Studio: Activation > Details tab > enable "Activation Actions"
5. In Actions tab: select your workflow project and name

## Constraints

- Workflow must be triggered BY the activation (parameters won't exist if run manually)
- Both activation and workflow must succeed for overall success
- Always clean up temp tables using `td_ddl>` with `${activation_id}` in table names
- Snapshot tables for incremental export must be pre-created on first run (use `td_ddl>: create_tables`)

## Reference Files

- [QUICK_REFERENCE.md](QUICK_REFERENCE.md) - cheat sheet with SQL snippets and checklist
- [examples/](examples/) - production-ready .dig files (transformation, GDPR, multi-platform, email validation)
