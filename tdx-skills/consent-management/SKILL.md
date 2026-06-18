---
name: consent-management
description: Manage customer consent preferences and GDPR/CCPA compliance using TD parent segments, SDK privacy controls, and privacy-aware segmentation. Covers consent data modeling, preference centers, DSAR workflows, and activation compliance. Use when implementing privacy compliance, building preference centers, or creating consent-aware segments.
---

# CDP Consent & Preference Management

Implement privacy-first customer data management using Treasure Data's architecture. Store consent in parent segments, capture preferences via TD SDK, create compliant segments, and handle data subject requests.

## When to Use This Skill

Use this skill when:
- Implementing GDPR, CCPA, or other privacy regulations
- Building customer preference centers for email, SMS, and privacy controls
- Creating segments that respect consent preferences
- Processing data subject access requests (DSARs)
- Syncing consent across activation channels
- Auditing consent changes and compliance status

## TD Privacy Architecture

Treasure Data's consent management follows an **architecture-first** approach:

```
Browser/Mobile → TD JS SDK → consent_tracking table → Parent Segment Attributes
    → Privacy-Compliant Segments → Activations (with Trust enforcement)
```

**Key Principles:**
1. **Centralized Storage**: Consent stored as parent segment attributes
2. **Real-Time Enforcement**: Consent checked at activation time
3. **Fine-Grained Metadata**: Track timestamp, channel, version for audit
4. **Unified Profile**: Consent part of customer 360 view

## Quick Start

### 1. Create Consent Tables

```sql
-- Consent event log
CREATE TABLE customer_db.consent_tracking (
  customer_id VARCHAR,
  email VARCHAR,
  consent_type VARCHAR,           -- email_marketing, sms, profiling, data_sharing
  consent_status VARCHAR,         -- given, refused, withdrawn
  consent_timestamp BIGINT,
  consent_channel VARCHAR,        -- web, mobile, in_store
  consent_version VARCHAR,        -- v1, v2
  consent_ip_address VARCHAR,
  consent_user_agent VARCHAR,
  time BIGINT
) WITH (format = 'ORC', partitioned_by = ARRAY['time']);
```

See `templates/consent-table-ddl.sql` for complete schemas.

### 2. Add to Parent Segment

```yaml
attributes:
  - name: "Consent Preferences"
    source:
      database: customer_db
      table: consent_wide
    join:
      parent_key: customer_id
      child_key: customer_id
    columns:
      - column: email_marketing_consent
        type: string
      - column: sms_consent
        type: string
      - column: consent_updated_at
        type: long
```

See `examples/consent-parent-segment.yml` for complete configuration.

### 3. Create Privacy-Compliant Segment

```yaml
name: Email Marketing - Opted In
kind: batch

rule:
  type: And
  conditions:
    # Email consent given
    - type: Value
      attribute: email_marketing_consent
      operator:
        type: Equal
        value: "given"

    # Consent not expired (GDPR: 24 months)
    - type: Value
      attribute: consent_updated_at
      operator:
        type: TimeWithinPast
        value: 24
        unit: month
```

See `examples/consent-segment-rules.yml` for 8 segment patterns.

## Consent Data Model

### Latest Consent View (Required)

Create view to get latest consent per customer:

```sql
CREATE VIEW customer_db.consent_wide AS
WITH latest AS (
  SELECT
    customer_id,
    consent_type,
    consent_status,
    consent_timestamp,
    ROW_NUMBER() OVER (
      PARTITION BY customer_id, consent_type
      ORDER BY consent_timestamp DESC
    ) AS rn
  FROM customer_db.consent_tracking
  WHERE td_interval(time, '-2y')  -- GDPR: expires after 2 years
)
SELECT
  customer_id,
  MAX(CASE WHEN consent_type = 'email_marketing' THEN consent_status END) AS email_marketing_consent,
  MAX(CASE WHEN consent_type = 'sms' THEN consent_status END) AS sms_consent,
  MAX(CASE WHEN consent_type = 'profiling' THEN consent_status END) AS profiling_consent,
  MAX(CASE WHEN consent_type = 'data_sharing' THEN consent_status END) AS data_sharing_consent,
  MAX(consent_timestamp) AS consent_updated_at
FROM latest
WHERE rn = 1
GROUP BY customer_id
```

## Consent Collection (TD JS SDK)

### Initialize SDK

```javascript
var td = new Treasure({
  database: 'customer_db',
  writeKey: '1234/xxxxxxxx',
  host: 'us01.records.in.treasuredata.com'
});
td.consentManager.configure({ storageKey: 'td_consent', defaultConsent: false });
```

### Capture Consent

```javascript
function saveConsent(consentType, isGranted) {
  td.consentManager.saveConsent(consentType, {
    status: isGranted ? td.consentManager.states.GIVEN : td.consentManager.states.REFUSED
  });
  td.addRecord('consent_tracking', {
    customer_id: userId,
    consent_type: consentType,
    consent_status: isGranted ? 'given' : 'refused',
    consent_timestamp: Date.now()
  });
}
```

**Privacy Controls:** `setAnonymousMode()`, `setSignedMode()`, `blockEvents()`, `unblockEvents()`, `resetUUID()`

See `examples/preference-center.html` and `references/sdk-integration.md` for complete implementation.

## Privacy-Compliant Segmentation

### Essential Patterns

**1. Email Marketing with Consent:**
```yaml
rule:
  type: And
  conditions:
    - type: Value
      attribute: email_marketing_consent
      operator:
        type: Equal
        value: "given"
    - type: Value
      attribute: consent_updated_at
      operator:
        type: TimeWithinPast
        value: 24
        unit: month
```

**2. Multi-Channel Consent:**
```yaml
rule:
  type: And
  conditions:
    - type: Value
      attribute: email_marketing_consent
      operator:
        type: Equal
        value: "given"
    - type: Value
      attribute: sms_consent
      operator:
        type: Equal
        value: "given"
```

**3. CCPA Do Not Sell Exclusion:**
```yaml
rule:
  type: And
  conditions:
    - type: Value
      attribute: third_party_sharing_allowed
      operator:
        type: Equal
        value: true
    - type: Value
      attribute: do_not_sell
      operator:
        type: Equal
        value: false
```

**4. Exclude Withdrawn Consent:**
```yaml
rule:
  type: And
  conditions:
    - type: Value
      attribute: email_marketing_consent
      operator:
        type: NotIn
        value: ["refused", "withdrawn"]
```

See `examples/consent-segment-rules.yml` for complete patterns.

## Activation Compliance

### Pre-Activation Validation

Add consent filter to all marketing activations:

```yaml
activations:
  - name: SFMC Email Campaign
    connection: salesforce-marketing
    columns:
      - email
      - first_name
    schedule:
      type: daily
    connector_config:
      de_name: EmailMarketingList

# Segment rule MUST filter by consent
rule:
  type: And
  conditions:
    - type: Value
      attribute: email_marketing_consent
      operator:
        type: Equal
        value: "given"
```

### Consent Validation Workflow

```yaml
# consent-validation.dig
+validate_consent:
  td>: |
    SELECT
      COUNT(*) AS total_rows,
      COUNT(CASE WHEN email_marketing_consent != 'given' THEN 1 END) AS invalid
    FROM segment s
    LEFT JOIN customer_db.consent_wide c ON s.customer_id = c.customer_id
  store_last_results: true

+check_compliance:
  if>: ${td.last_results.invalid > 0}
  _do:
    fail>: "Blocked: ${td.last_results.invalid} records without consent"

+proceed_with_activation:
  if>: ${td.last_results.invalid == 0}
  _do:
    td_load>: config/sfmc_export.yml
```

See `templates/consent-sync-workflow.dig` for complete workflow.

## DSAR Workflows

### Right to Access (Export)

```sql
SELECT
  c.customer_id,
  c.email,
  c.first_name,
  ct.email_marketing_consent,
  ct.sms_consent,
  ct.consent_updated_at,
  p.lifetime_value,
  b.page_views_30d
FROM customer_db.customers c
LEFT JOIN customer_db.consent_wide ct ON c.customer_id = ct.customer_id
LEFT JOIN customer_db.purchase_summary p ON c.customer_id = p.customer_id
LEFT JOIN customer_db.behavioral_summary b ON c.customer_id = b.customer_id
WHERE c.email = 'user@example.com'
```

### Right to Deletion (Anonymize)

```sql
UPDATE customer_db.customers
SET
  email = CONCAT('deleted_', customer_id, '@anonymized.com'),
  first_name = 'DELETED',
  last_name = 'DELETED',
  phone = NULL,
  gdpr_deleted = TRUE,
  gdpr_deleted_at = CURRENT_TIMESTAMP
WHERE customer_id = 'cust_12345'
```

### Right to Rectification

```sql
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
);
```

Then refresh parent segment:
```bash
tdx ps run "Customer 360"
```

See `examples/dsar-export.sql` for complete queries.
See `references/dsar-workflows.md` for detailed workflows.

## Consent Auditing

### Find Expired Consents

```sql
SELECT
  customer_id,
  email,
  FROM_UNIXTIME(consent_updated_at) AS last_consent_date,
  DATEDIFF(CURRENT_DATE, FROM_UNIXTIME(consent_updated_at)) AS days_since
FROM customer_db.consent_wide
WHERE consent_updated_at < CAST(EXTRACT(EPOCH FROM NOW() - INTERVAL '24' MONTH) AS BIGINT)
  AND email_marketing_consent = 'given'
LIMIT 100
```

### Compliance Metrics

```sql
SELECT
  COUNT(DISTINCT customer_id) AS total_customers,
  COUNT(DISTINCT CASE WHEN email_marketing_consent = 'given' THEN customer_id END) AS email_opted_in,
  ROUND(
    100.0 * COUNT(DISTINCT CASE WHEN email_marketing_consent = 'given' THEN customer_id END) /
    NULLIF(COUNT(DISTINCT customer_id), 0),
    2
  ) AS email_opt_in_rate,
  COUNT(DISTINCT CASE
    WHEN consent_updated_at < CAST(EXTRACT(EPOCH FROM NOW() - INTERVAL '24' MONTH) AS BIGINT)
    THEN customer_id
  END) AS expired_consents
FROM customer_db.consent_wide
```

See `references/audit-queries.md` for complete audit queries.

## Best Practices

**Consent Capture:** Double opt-in, store timestamp/channel/IP, version consent, granular options

**Data Model:** Immutable event log, latest consent view, parent segment attributes, 24-month filter

**Segmentation:** Always filter by consent, check expiry, exclude withdrawn/refused

**Activations:** Validate consent, monitor failures, log with status, sync to destinations

**DSAR:** Export within 30 days, archive for audit, anonymize (not delete), trigger downstream deletion

## Consent Types Reference

| Type | Purpose | GDPR | CCPA | Expiry |
|------|---------|------|------|--------|
| email_marketing | Promotional emails | Opt-in required | Notice only | 24 months |
| sms | Text messages | Opt-in required | Opt-in required (TCPA) | 18-24 months |
| profiling | Personalization | Opt-in required | Notice only | 24 months |
| data_sharing | Third-party sharing | Opt-in required | Opt-out (Do Not Sell) | 12-24 months |
| cookies | Analytics/ads | Opt-in (EU) | Notice only | 12 months |

See `references/consent-categories.md` for detailed guide.

## Common Issues

| Issue | Solution |
|-------|----------|
| Consent not syncing to segments | Re-run parent segment: `tdx ps run "Customer 360"` |
| Activation includes non-consented users | Add consent filter to segment rule |
| DSAR query too slow | Use `td_interval(time, '-3y')` to limit scan |
| Consent expired but user active | Set up workflow to request renewal |
| Duplicate consents | Use `ROW_NUMBER()` window function for latest |

## Compliance Checklist

Before going live:

- [ ] Consent tracking table created
- [ ] Parent segment includes consent attributes
- [ ] consent_wide view filters for 24-month expiry
- [ ] Preference center deployed
- [ ] All marketing segments filter by consent
- [ ] Activations include consent validation
- [ ] DSAR workflows documented
- [ ] Audit queries scheduled
- [ ] Consent renewal workflow configured
- [ ] Downstream systems sync consent

## Related Skills

- **parent-segment** - Configure consent as parent segment attributes
- **segment** - Create consent-aware segment rules
- **td-javascript-sdk** - Capture consent via browser SDK
- **schema-auto-tagger** - Auto-tag PII for compliance
- **workflow** - Automate consent sync and DSAR workflows

## Resources

### Examples
- `examples/consent-parent-segment.yml` - Parent segment config
- `examples/consent-segment-rules.yml` - 8 segment patterns
- `examples/preference-center.html` - Complete preference center
- `examples/dsar-export.sql` - DSAR queries

### Templates
- `templates/consent-table-ddl.sql` - Database schemas
- `templates/consent-sync-workflow.dig` - Compliance workflow

### References
- `references/consent-categories.md` - GDPR/CCPA consent types
- `references/dsar-workflows.md` - Detailed DSAR implementation
- `references/sdk-integration.md` - TD JS SDK patterns
- `references/audit-queries.md` - Compliance monitoring queries

### External
- TD Consent Manager: https://api-docs.treasuredata.com/en/sdk/js-sdk/consent-manager/
- TD Trust for CDP: https://docs.treasuredata.com/trust
- Parent Segment API: https://api-docs.treasuredata.com/pages/audience_api_v1/tag/Parent-Segment-Configurations/
