# DSAR Workflows - Detailed Implementation Guide

Complete implementation patterns for Data Subject Access Requests (GDPR/CCPA).

## Right to Access (Data Export)

### Complete Customer Data Export

```sql
-- Export all customer data
SELECT
  c.customer_id,
  c.email,
  c.first_name,
  c.last_name,
  c.created_at,

  -- Consent preferences
  ct.email_marketing_consent,
  ct.sms_consent,
  ct.profiling_consent,
  ct.data_sharing_consent,
  ct.consent_updated_at,

  -- Purchase history
  p.order_count,
  p.lifetime_value,
  p.last_purchase_date,

  -- Behavioral data
  b.page_views_30d,
  b.last_login_date

FROM customer_db.customers c
LEFT JOIN customer_db.consent_wide ct ON c.customer_id = ct.customer_id
LEFT JOIN customer_db.purchase_summary p ON c.customer_id = p.customer_id
LEFT JOIN customer_db.behavioral_summary b ON c.customer_id = b.customer_id

WHERE c.email = 'user@example.com'
  OR c.customer_id = 'cust_12345'
```

See `examples/dsar-export.sql` for complete queries.

## Right to Deletion (Data Purge)

### Anonymization Workflow

```yaml
# dsar-deletion.dig
+export_for_audit:
  td>: queries/export_customer_data.sql
  database: customer_db
  store_last_results: all

+archive_to_s3:
  s3_put>: s3://compliance-archive/dsar/${customer_id}.json
  content: ${JSON.stringify(td.last_results)}

+delete_consent_records:
  td>: |
    DELETE FROM customer_db.consent_tracking
    WHERE customer_id = '${customer_id}'

+anonymize_master:
  td>: |
    UPDATE customer_db.customers
    SET
      email = CONCAT('deleted_', customer_id, '@anonymized.com'),
      first_name = 'DELETED',
      last_name = 'DELETED',
      phone = NULL,
      gdpr_deleted = TRUE,
      gdpr_deleted_at = CURRENT_TIMESTAMP
    WHERE customer_id = '${customer_id}'

+trigger_downstream_deletion:
  http>: https://api.company.com/dsar/delete
  method: POST
  content:
    customer_id: ${customer_id}
```

## Right to Rectification

### Update Consent Status

```sql
-- Correct consent status
INSERT INTO customer_db.consent_tracking
VALUES (
  'cust_12345',
  'user@example.com',
  'email_marketing',
  'withdrawn',                             -- corrected status
  CAST(EXTRACT(EPOCH FROM NOW()) AS BIGINT),
  'manual_correction',
  'v2',
  NULL,
  'Support Ticket #12345',
  CAST(EXTRACT(EPOCH FROM NOW()) AS BIGINT)
)
```

Then refresh parent segment:
```bash
tdx ps run "Customer 360"
```

## GDPR Timeline Requirements

- **Right to Access**: 30 days (1 month)
- **Right to Deletion**: 30 days (1 month)
- **Right to Rectification**: 30 days (1 month)
- **Data Breach Notification**: 72 hours

## CCPA Timeline Requirements

- **Right to Know**: 45 days (can extend 45 more days)
- **Right to Delete**: 45 days
- **Do Not Sell Opt-Out**: 15 business days
