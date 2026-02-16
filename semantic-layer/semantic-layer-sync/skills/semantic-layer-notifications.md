---
name: semantic-layer-notifications
description: Configure Slack and email notifications for semantic layer automation. Use when setting up alerts, configuring notification channels, or managing notification rules.
---

# Semantic Layer Notifications Skill

**Focused skill for configuring Slack and email notifications for semantic layer automation events.**

## Purpose

Configure notifications to:
- Send alerts to Slack channels
- Email stakeholders about changes
- Notify on errors and conflicts
- Track automation activity

## When to Use This Skill

✅ **Use this skill when:**
- "Send notifications to #data-governance Slack channel"
- "Email me when metadata changes are applied"
- "Notify on validation errors"
- "Alert when PII fields are detected"
- "Send daily summary of changes"

❌ **Don't use this skill for:**
- Configuring approval workflows (use `semantic-layer-approval`)
- Setting validation rules (use `semantic-layer-validation`)
- Managing conflict resolution (use `semantic-layer-conflicts`)

## Configuration Section

This skill manages the `notifications` section of `config.yaml`:

```yaml
notifications:
  slack:
    enabled: bool
    webhook_url: string                 # Slack webhook URL
    channel: string                     # Channel name (e.g., "#data-governance")
    notify_on: [string]                # Events to notify on
    mention_users: [string]            # Users to @mention
    notify_on_success: bool
    notify_on_errors: bool
    notify_on_conflicts: bool

  email:
    enabled: bool
    smtp_host: string
    smtp_port: int
    from_address: string
    to_addresses: [string]
    notify_on: [string]
    notify_on_success: bool
    notify_on_errors: bool
```

## Notification Events

| Event | When Triggered | Severity | Recommended Action |
|-------|----------------|----------|-------------------|
| `success` | Automation completes successfully | Info | Optional notification |
| `errors` | Validation or processing errors | High | Always notify |
| `conflicts` | Metadata conflicts detected | Medium | Notify for review |
| `pii_detected` | New PII fields found | High | Always notify |
| `schema_changes` | Schema changes detected | Medium | Notify stakeholders |
| `validation_failures` | Validation rules failed | High | Always notify |
| `approval_required` | Changes need approval | Medium | Notify approvers |
| `new_tables` | New tables discovered | Info | Optional notification |
| `deprecated_fields` | Fields marked deprecated | Low | Optional notification |

## Common Operations

### 1. Basic Slack Notifications

```yaml
notifications:
  slack:
    enabled: true
    webhook_url: "${SLACK_WEBHOOK_URL}"
    channel: "#data-governance"
    notify_on:
      - errors
      - conflicts
      - pii_detected
    notify_on_success: false
    notify_on_errors: true
```

**User Request**: "Send Slack notifications to #data-governance for errors and PII detection"

### 2. Comprehensive Slack Alerts

```yaml
notifications:
  slack:
    enabled: true
    webhook_url: "${SLACK_WEBHOOK_URL}"
    channel: "#data-governance"
    notify_on:
      - errors
      - conflicts
      - pii_detected
      - schema_changes
      - validation_failures
      - approval_required
    mention_users:
      - "@data-team"
      - "@governance-lead"
    notify_on_success: true
    notify_on_errors: true
    notify_on_conflicts: true
```

**User Request**: "Send comprehensive Slack alerts with user mentions"

### 3. Email Notifications

```yaml
notifications:
  email:
    enabled: true
    smtp_host: "smtp.gmail.com"
    smtp_port: 587
    from_address: "semantic-layer@company.com"
    to_addresses:
      - "data-team@company.com"
      - "governance@company.com"
    notify_on:
      - errors
      - pii_detected
      - validation_failures
    notify_on_success: false
    notify_on_errors: true
```

**User Request**: "Email data-team and governance on errors and PII detection"

### 4. Multi-Channel Notifications

```yaml
notifications:
  slack:
    enabled: true
    webhook_url: "${SLACK_WEBHOOK_URL}"
    channel: "#data-governance"
    notify_on:
      - errors
      - conflicts
      - pii_detected
    notify_on_errors: true

  email:
    enabled: true
    smtp_host: "smtp.company.com"
    smtp_port: 587
    from_address: "semantic-layer@company.com"
    to_addresses:
      - "data-governance@company.com"
    notify_on:
      - errors
      - pii_detected
      - approval_required
    notify_on_errors: true
```

**User Request**: "Send notifications to both Slack and email"

### 5. Success-Only Notifications

```yaml
notifications:
  slack:
    enabled: true
    webhook_url: "${SLACK_WEBHOOK_URL}"
    channel: "#data-updates"
    notify_on:
      - success
    notify_on_success: true
    notify_on_errors: false
```

**User Request**: "Only notify on successful completions"

### 6. PII Alert Notifications

```yaml
notifications:
  slack:
    enabled: true
    webhook_url: "${SLACK_WEBHOOK_URL}"
    channel: "#security-alerts"
    notify_on:
      - pii_detected
    mention_users:
      - "@security-team"
      - "@dpo"  # Data Protection Officer
    notify_on_success: false
    notify_on_errors: false
```

**User Request**: "Alert security team when PII is detected"

## Examples

### Example 1: Production Environment

```yaml
notifications:
  slack:
    enabled: true
    webhook_url: "${SLACK_WEBHOOK_URL_PROD}"
    channel: "#data-governance-prod"
    notify_on:
      - errors
      - conflicts
      - pii_detected
      - validation_failures
      - approval_required
    mention_users:
      - "@data-governance-lead"
      - "@on-call-data-engineer"
    notify_on_success: false
    notify_on_errors: true
    notify_on_conflicts: true

  email:
    enabled: true
    smtp_host: "smtp.company.com"
    smtp_port: 587
    from_address: "semantic-layer-prod@company.com"
    to_addresses:
      - "data-governance@company.com"
      - "data-engineering@company.com"
    notify_on:
      - errors
      - pii_detected
      - validation_failures
    notify_on_errors: true
```

**Use Case**: Production environment with comprehensive alerting

### Example 2: Development Environment

```yaml
notifications:
  slack:
    enabled: true
    webhook_url: "${SLACK_WEBHOOK_URL_DEV}"
    channel: "#data-dev"
    notify_on:
      - success
      - errors
    notify_on_success: true
    notify_on_errors: true
    notify_on_conflicts: false  # Dev conflicts are normal

  email:
    enabled: false  # No email in dev
```

**Use Case**: Development environment with minimal notifications

### Example 3: GDPR Compliance Monitoring

```yaml
notifications:
  slack:
    enabled: true
    webhook_url: "${SLACK_WEBHOOK_URL}"
    channel: "#gdpr-compliance"
    notify_on:
      - pii_detected
      - schema_changes  # Schema changes might affect PII
    mention_users:
      - "@dpo"          # Data Protection Officer
      - "@legal"
      - "@privacy-team"
    notify_on_success: false
    notify_on_errors: true

  email:
    enabled: true
    smtp_host: "smtp.company.com"
    smtp_port: 587
    from_address: "gdpr-alerts@company.com"
    to_addresses:
      - "dpo@company.com"
      - "legal@company.com"
      - "privacy-team@company.com"
    notify_on:
      - pii_detected
    notify_on_errors: true
```

**Use Case**: GDPR compliance with dedicated monitoring

## Notification Content

### Slack Message Format

```markdown
**Semantic Layer Sync - Completed Successfully**

**Summary:**
- Tables processed: 15
- Fields updated: 42
- New PII fields detected: 3
- Conflicts: 0

**PII Detected:**
- `customers.email` → Category: email
- `customers.phone` → Category: phone
- `orders.billing_address` → Category: address

**Environment:** Production
**Run ID:** abc-123-def
**Timestamp:** 2026-02-16 14:30:00 UTC
**Duration:** 2m 15s

[View Full Report](https://semantic-layer.company.com/runs/abc-123-def)
```

### Email Format

```
Subject: Semantic Layer Sync - PII Detected

From: semantic-layer@company.com
To: data-governance@company.com

Semantic Layer Sync Notification
=================================

Status: Completed with Alerts
Environment: Production
Timestamp: 2026-02-16 14:30:00 UTC
Run ID: abc-123-def

ALERT: New PII Fields Detected
-------------------------------
3 new PII fields were detected and require review:

1. customers.email
   - PII Category: email
   - Confidence: 95%
   - Tags: [pii, contact_info, gdpr]

2. customers.phone
   - PII Category: phone
   - Confidence: 95%
   - Tags: [pii, contact_info, gdpr]

3. orders.billing_address
   - PII Category: address
   - Confidence: 90%
   - Tags: [pii, location, gdpr]

Summary
-------
- Tables processed: 15
- Fields updated: 42
- PII fields detected: 3
- Conflicts: 0
- Duration: 2m 15s

Actions Required
----------------
1. Review and verify PII classifications
2. Assign data owners for new PII fields
3. Update data access policies if needed

View full report: https://semantic-layer.company.com/runs/abc-123-def
```

## Testing

### Test Slack Webhook

```bash
# Test Slack notification
curl -X POST -H 'Content-type: application/json' \
  --data '{"text":"Test notification from semantic layer automation"}' \
  $SLACK_WEBHOOK_URL
```

### Test Email Configuration

```bash
# Test SMTP connection
python -c "
import smtplib
from email.mime.text import MIMEText

msg = MIMEText('Test email from semantic layer automation')
msg['Subject'] = 'Test Notification'
msg['From'] = 'semantic-layer@company.com'
msg['To'] = 'your-email@company.com'

with smtplib.SMTP('smtp.company.com', 587) as server:
    server.starttls()
    server.login('username', 'password')
    server.send_message(msg)
print('Email sent successfully')
"
```

### Dry-Run with Notifications

```bash
# Test notifications without applying changes
python semantic_layer_sync.py --config config.yaml --dry-run --test-notifications
```

## Best Practices

### 1. Use Environment Variables for Secrets

```yaml
# Good: Use environment variables
notifications:
  slack:
    webhook_url: "${SLACK_WEBHOOK_URL}"

# Bad: Hard-code secrets
notifications:
  slack:
    webhook_url: "https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXX"
```

### 2. Separate Channels by Severity

```yaml
# High-priority alerts
notifications:
  slack:
    enabled: true
    webhook_url: "${SLACK_WEBHOOK_CRITICAL}"
    channel: "#data-critical-alerts"
    notify_on:
      - errors
      - pii_detected
      - validation_failures

# Low-priority updates
notifications:
  slack:
    enabled: true
    webhook_url: "${SLACK_WEBHOOK_INFO}"
    channel: "#data-updates"
    notify_on:
      - success
      - new_tables
```

### 3. Mention Relevant Teams

```yaml
notifications:
  slack:
    enabled: true
    channel: "#data-governance"
    mention_users:
      - "@data-team"        # For general issues
      - "@security-team"    # For PII/security issues
      - "@on-call"          # For critical errors
```

### 4. Filter Noise in Development

```yaml
# config.dev.yaml - Minimal notifications
notifications:
  slack:
    enabled: true
    notify_on:
      - errors  # Only errors in dev
    notify_on_success: false
    notify_on_conflicts: false

# config.prod.yaml - Comprehensive notifications
notifications:
  slack:
    enabled: true
    notify_on:
      - errors
      - conflicts
      - pii_detected
      - validation_failures
    notify_on_success: true
```

### 5. Include Actionable Information

```yaml
notifications:
  slack:
    enabled: true
    include_in_message:
      - summary_stats
      - error_details
      - action_items
      - links_to_dashboards
      - run_metadata
```

### 6. Test Notifications Before Production

```bash
# Test in dev first
python semantic_layer_sync.py --config config.dev.yaml --test-notifications

# Then enable in prod
python semantic_layer_sync.py --config config.prod.yaml --apply
```

## Troubleshooting

### Slack Notifications Not Sending

**Problem**: Notifications not appearing in Slack

**Solution**:
1. Verify webhook URL is correct
2. Test webhook with curl (see Testing section)
3. Check channel name includes `#`
4. Verify `enabled: true`
5. Check firewall/network access
6. Review Slack app permissions

### Email Notifications Failing

**Problem**: Emails not being sent

**Solution**:
1. Test SMTP connection (see Testing section)
2. Verify SMTP host and port
3. Check authentication credentials
4. Verify from/to addresses are valid
5. Check spam filters
6. Review email server logs

### Too Many Notifications

**Problem**: Getting spammed with notifications

**Solution**:
1. Set `notify_on_success: false` for routine runs
2. Reduce `notify_on` events list
3. Use different channels for different severities
4. Implement rate limiting
5. Use daily summary instead of per-run notifications

### Notifications Missing Details

**Problem**: Notifications lack important information

**Solution**:
1. Check notification template configuration
2. Ensure all relevant events are in `notify_on`
3. Review message format settings
4. Add custom fields to notification payload
5. Include links to full reports/dashboards

### User Mentions Not Working

**Problem**: @mentions in Slack not working

**Solution**:
1. Use correct mention format: `@username` or `@group`
2. Verify users/groups exist in workspace
3. Check Slack app has mention permissions
4. Use user IDs instead of names for reliability
5. Test with simple mention first

## Integration

### With Approval Workflows

```yaml
notifications:
  slack:
    enabled: true
    channel: "#data-governance"
    notify_on:
      - approval_required
    mention_users:
      - "@approvers"

approval:
  enabled: true
  require_approval_for_conflicts: true
  approvers: ["data-governance@company.com"]
```

### With Monitoring Tools

```yaml
notifications:
  # Send to monitoring/alerting platform
  webhook:
    enabled: true
    url: "https://monitoring.company.com/webhooks/semantic-layer"
    payload_format: "json"
```

### With Incident Management

```yaml
notifications:
  pagerduty:
    enabled: true
    integration_key: "${PAGERDUTY_KEY}"
    severity_mapping:
      errors: "critical"
      validation_failures: "warning"
      conflicts: "info"
```

## CLI Commands

```bash
# Test Slack webhook
curl -X POST -H 'Content-type: application/json' \
  --data '{"text":"Test from semantic layer"}' \
  $SLACK_WEBHOOK_URL

# Test notifications (dry-run)
python semantic_layer_sync.py --config config.yaml --dry-run --test-notifications

# Apply with notifications enabled
python semantic_layer_sync.py --config config.yaml --apply --approve

# Validate notification config
python semantic_layer_sync.py --config config.yaml --validate-only

# Send test notification
python semantic_layer_sync.py --config config.yaml --send-test-notification
```

## Notification Templates

### Success Template

```yaml
notification_templates:
  success:
    title: "Semantic Layer Sync - Success"
    color: "good"  # Green
    fields:
      - "Tables processed"
      - "Fields updated"
      - "Duration"
```

### Error Template

```yaml
notification_templates:
  error:
    title: "Semantic Layer Sync - Error"
    color: "danger"  # Red
    fields:
      - "Error message"
      - "Failed at step"
      - "Stack trace"
    mention_users: ["@on-call"]
```

### PII Detection Template

```yaml
notification_templates:
  pii_detected:
    title: "Semantic Layer Sync - PII Detected"
    color: "warning"  # Yellow
    fields:
      - "PII fields count"
      - "PII categories"
      - "Tables affected"
    mention_users: ["@security-team", "@dpo"]
```

## Related Skills

- **semantic-layer-approval** - Configure approval workflows triggered by notifications
- **semantic-layer-conflicts** - Notifications for conflicts
- **semantic-layer-validation** - Notifications for validation failures
- **semantic-config-master-skill** - Manage all config sections

---

**Status**: ✅ Production Ready
**Skill Type**: Focused / Single-Responsibility
**Last Updated**: 2026-02-16
