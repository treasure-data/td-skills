---
name: semantic-layer-approval
description: Configure approval workflows for semantic layer changes. Use when setting up approval requirements, configuring approvers, or managing change control for sensitive metadata.
---

# Semantic Layer Approval Skill

**Focused skill for configuring approval workflows that require human review before applying sensitive metadata changes.**

## Purpose

Configure approval workflows to:
- Require approval for sensitive changes
- Define approval criteria and rules
- Set up approvers and approval chains
- Manage change control processes

## When to Use This Skill

✅ **Use this skill when:**
- "Require approval for PII field changes"
- "Set up approval workflow for production"
- "Configure who can approve metadata changes"
- "Require approval for description edits"
- "Set up multi-level approval chain"

❌ **Don't use this skill for:**
- Configuring notifications (use `semantic-layer-notifications`)
- Setting validation rules (use `semantic-layer-validation`)
- Managing conflict resolution (use `semantic-layer-conflicts`)

## Configuration Section

This skill manages the `approval` section of `config.yaml`:

```yaml
approval:
  enabled: bool
  require_approval_for: [string]        # Which changes require approval
  approvers: [string]                   # Email addresses of approvers
  approval_mode: string                 # "any", "all", "chain"
  auto_approve_below_confidence: int    # Auto-approve high confidence changes
  approval_timeout: string              # Timeout for approval (e.g., "24h", "7d")
  approval_method: string               # "slack", "email", "web", "cli"
```

## Approval Modes

| Mode | Behavior | Use Case | Example |
|------|----------|----------|---------|
| `any` | Any one approver can approve | Quick approvals | Small team, low risk |
| `all` | All approvers must approve | Critical changes | High-risk metadata |
| `chain` | Sequential approval chain | Hierarchical review | Multi-level governance |

## Changes Requiring Approval

| Change Type | Risk Level | Recommendation | Rationale |
|-------------|-----------|----------------|-----------|
| PII category changes | High | Always require | Compliance impact |
| Data classification changes | High | Always require | Access control impact |
| Owner changes | Medium | Recommended | Accountability impact |
| Description changes | Low | Optional | Business knowledge |
| Tag additions | Low | Auto-approve | Low risk |
| Type changes | Medium | Recommended | Query impact |
| Deprecation | Medium | Recommended | System impact |

## Common Operations

### 1. Basic Approval Setup

```yaml
approval:
  enabled: true
  require_approval_for:
    - pii_category
    - data_classification
    - owner
  approvers:
    - "data-governance@company.com"
  approval_mode: "any"
```

**User Request**: "Require approval for PII, classification, and owner changes"

### 2. Multi-Approver Setup

```yaml
approval:
  enabled: true
  require_approval_for:
    - pii_category
    - data_classification
  approvers:
    - "data-governance-lead@company.com"
    - "security-team@company.com"
    - "dpo@company.com"
  approval_mode: "all"     # All must approve
```

**User Request**: "Require all approvers to approve PII changes"

### 3. Approval Chain

```yaml
approval:
  enabled: true
  require_approval_for:
    - pii_category
    - data_classification
  approval_mode: "chain"
  approval_chain:
    - stage: 1
      approvers: ["data-team-lead@company.com"]
      required: 1
    - stage: 2
      approvers: ["security-lead@company.com", "dpo@company.com"]
      required: 1
    - stage: 3
      approvers: ["ciso@company.com"]
      required: 1
```

**User Request**: "Set up 3-stage approval chain for sensitive changes"

### 4. Confidence-Based Auto-Approval

```yaml
approval:
  enabled: true
  require_approval_for:
    - pii_category
    - tags
  approvers:
    - "data-governance@company.com"
  auto_approve_below_confidence: 95   # Auto-approve if confidence >= 95%
```

**User Request**: "Auto-approve high-confidence changes, require approval for low confidence"

### 5. Slack-Based Approval

```yaml
approval:
  enabled: true
  require_approval_for:
    - pii_category
    - data_classification
  approvers:
    - "data-governance@company.com"
  approval_method: "slack"
  slack:
    channel: "#data-governance-approvals"
    webhook_url: "${SLACK_WEBHOOK_URL}"
```

**User Request**: "Use Slack for approval workflow"

### 6. Approval Timeout

```yaml
approval:
  enabled: true
  require_approval_for:
    - pii_category
  approvers:
    - "data-governance@company.com"
  approval_timeout: "48h"              # Auto-reject after 48 hours
  approval_timeout_action: "reject"    # or "auto_approve"
```

**User Request**: "Set 48-hour timeout for approvals"

## Examples

### Example 1: Production Environment - Strict Approval

```yaml
approval:
  enabled: true
  require_approval_for:
    - pii_category
    - data_classification
    - owner
    - semantic_type
    - deprecation
  approvers:
    - "data-governance-lead@company.com"
    - "security-lead@company.com"
    - "dpo@company.com"
  approval_mode: "all"                 # All must approve
  approval_timeout: "24h"
  approval_timeout_action: "reject"
  approval_method: "slack"
  slack:
    channel: "#data-governance-approvals"
    webhook_url: "${SLACK_WEBHOOK_URL}"
```

**Use Case**: Production environment with strict change control

**Behavior**: All changes to sensitive fields require approval from all 3 approvers

### Example 2: Development Environment - Minimal Approval

```yaml
approval:
  enabled: true
  require_approval_for:
    - pii_category                     # Only PII requires approval
  approvers:
    - "data-team-lead@company.com"
  approval_mode: "any"
  auto_approve_below_confidence: 90    # Auto-approve high confidence
  approval_timeout: "72h"
  approval_timeout_action: "auto_approve"  # Auto-approve after timeout
```

**Use Case**: Development environment with relaxed approval

**Behavior**: Only PII changes require approval, high-confidence changes auto-approve

### Example 3: GDPR Compliance Workflow

```yaml
approval:
  enabled: true
  require_approval_for:
    - pii_category
    - data_classification
  approval_mode: "chain"
  approval_chain:
    # Stage 1: Data team review
    - stage: 1
      name: "Data Team Review"
      approvers: ["data-team-lead@company.com"]
      required: 1
      timeout: "24h"

    # Stage 2: DPO review
    - stage: 2
      name: "DPO Review"
      approvers: ["dpo@company.com"]
      required: 1
      timeout: "48h"

    # Stage 3: Legal review (for high-risk changes)
    - stage: 3
      name: "Legal Review"
      approvers: ["legal@company.com"]
      required: 1
      timeout: "72h"
      conditions:
        - field: "data_classification"
          value: "Restricted"

  approval_method: "email"
  email:
    smtp_host: "smtp.company.com"
    smtp_port: 587
    from_address: "data-governance@company.com"
```

**Use Case**: GDPR compliance with multi-stage approval

**Behavior**: Sequential approval through data team, DPO, and legal

## Approval Request Format

### Slack Approval Request

```markdown
**Approval Required: Semantic Layer Changes**

**Change Summary:**
- 3 PII category changes
- 2 data classification changes

**Details:**

1. **customers.email**
   - Change: Set PII category to "email"
   - Confidence: 95%
   - Impact: GDPR compliance tracking

2. **customers.phone**
   - Change: Set PII category to "phone"
   - Confidence: 95%
   - Impact: GDPR compliance tracking

3. **orders.billing_address**
   - Change: Set data classification to "Confidential"
   - Impact: Access control policies

**Approvers:** @data-governance-lead @security-lead @dpo
**Timeout:** 24 hours
**Run ID:** abc-123-def

[Approve] [Reject] [View Details]
```

### Email Approval Request

```
Subject: Approval Required: Semantic Layer Changes (Run ID: abc-123-def)

From: data-governance@company.com
To: data-governance-lead@company.com, security-lead@company.com, dpo@company.com

Approval Required: Semantic Layer Changes
==========================================

Run ID: abc-123-def
Environment: Production
Timestamp: 2026-02-16 14:30:00 UTC
Timeout: 24 hours

Change Summary
--------------
- 3 PII category changes
- 2 data classification changes
- 1 owner change

Detailed Changes
----------------

1. customers.email
   - Change Type: PII Category
   - Old Value: None
   - New Value: email
   - Confidence: 95%
   - Impact: GDPR compliance tracking
   - Rationale: Auto-detected email field pattern

2. customers.phone
   - Change Type: PII Category
   - Old Value: None
   - New Value: phone
   - Confidence: 95%
   - Impact: GDPR compliance tracking
   - Rationale: Auto-detected phone field pattern

3. orders.billing_address
   - Change Type: Data Classification
   - Old Value: Internal
   - New Value: Confidential
   - Impact: Access control policies will be updated
   - Rationale: Contains customer address (PII)

Actions
-------
To approve these changes, respond with: APPROVE abc-123-def
To reject these changes, respond with: REJECT abc-123-def

Or use the web interface:
https://semantic-layer.company.com/approvals/abc-123-def

This approval request will expire in 24 hours.
```

## Testing

### Test Approval Workflow

```bash
# Dry-run to see what would require approval
python semantic_layer_sync.py --config config.yaml --dry-run --show-approvals
```

### Simulate Approval

```bash
# Test approval workflow without sending notifications
python semantic_layer_sync.py --config config.yaml --test-approval-workflow
```

### Manual Approval

```bash
# Approve a pending change
python semantic_layer_sync.py --approve-run abc-123-def

# Reject a pending change
python semantic_layer_sync.py --reject-run abc-123-def
```

## Best Practices

### 1. Always Require Approval for PII

```yaml
approval:
  enabled: true
  require_approval_for:
    - pii_category         # ALWAYS require approval
    - data_classification  # ALWAYS require approval
```

**Why**: PII changes have compliance and legal implications

### 2. Use Appropriate Approval Mode

```yaml
# Low-risk: Any one approver
approval_mode: "any"
approvers: ["data-team@company.com", "analytics-team@company.com"]

# High-risk: All approvers
approval_mode: "all"
approvers: ["data-governance@company.com", "security@company.com", "dpo@company.com"]
```

### 3. Set Reasonable Timeouts

```yaml
approval:
  # Too short - people might miss it
  approval_timeout: "1h"   # ❌ Too short

  # Good - allows time for review
  approval_timeout: "24h"  # ✅ Good for urgent
  approval_timeout: "72h"  # ✅ Good for standard

  # Too long - blocks automation
  approval_timeout: "30d"  # ❌ Too long
```

### 4. Auto-Approve High-Confidence Changes

```yaml
approval:
  # Auto-approve changes with 95%+ confidence
  auto_approve_below_confidence: 95
  require_approval_for:
    - pii_category
    - tags
```

**Why**: Reduces approval burden while maintaining safety

### 5. Separate Development and Production

```yaml
# config.dev.yaml - Relaxed approval
approval:
  enabled: false  # Or minimal approval

# config.prod.yaml - Strict approval
approval:
  enabled: true
  require_approval_for:
    - pii_category
    - data_classification
    - owner
  approval_mode: "all"
```

### 6. Provide Context in Approval Requests

```yaml
approval:
  include_in_request:
    - change_summary
    - impact_analysis
    - confidence_score
    - similar_past_changes
    - affected_tables_count
    - rationale
```

## Troubleshooting

### Approval Requests Not Sent

**Problem**: Approvers not receiving approval requests

**Solution**:
1. Verify `enabled: true`
2. Check approver email addresses are correct
3. Test Slack webhook (if using Slack)
4. Check spam/junk folders for emails
5. Verify notification configuration
6. Check firewall/network access

### Approval Stuck in Pending

**Problem**: Approval request stuck, not proceeding

**Solution**:
1. Check approval timeout hasn't expired
2. Verify all required approvers have responded
3. Check approval mode (`any` vs `all`)
4. Review approval logs
5. Manually approve/reject if needed

### Auto-Approve Not Working

**Problem**: High-confidence changes not auto-approving

**Solution**:
1. Check `auto_approve_below_confidence` threshold
2. Verify confidence scores are calculated correctly
3. Check if field is in `require_approval_for` list
4. Review approval mode configuration
5. Check logs for auto-approval decisions

### Wrong Approvers Notified

**Problem**: Wrong people receiving approval requests

**Solution**:
1. Verify `approvers` list is correct
2. Check approval chain configuration
3. Review conditional approval rules
4. Test with `--show-approvals` flag
5. Update approver list and re-run

## Integration

### With Notifications

```yaml
approval:
  enabled: true
  require_approval_for:
    - pii_category

notifications:
  slack:
    enabled: true
    channel: "#data-governance"
    notify_on:
      - approval_required
    mention_users:
      - "@approvers"
```

### With Conflict Resolution

```yaml
conflict_resolution:
  strategy: "auto_merge"
  require_approval_for:
    - pii_category
    - data_classification

approval:
  enabled: true
  require_approval_for:
    - pii_category
    - data_classification
  approvers: ["data-governance@company.com"]
```

### With Validation

```yaml
validation:
  require_owner_for_pii_fields: true

approval:
  enabled: true
  require_approval_for:
    - pii_category
  # Validation runs before approval
```

## CLI Commands

```bash
# Show what requires approval (dry-run)
python semantic_layer_sync.py --config config.yaml --dry-run --show-approvals

# Apply with approval workflow
python semantic_layer_sync.py --config config.yaml --apply

# Approve a pending run
python semantic_layer_sync.py --approve-run abc-123-def

# Reject a pending run
python semantic_layer_sync.py --reject-run abc-123-def

# List pending approvals
python semantic_layer_sync.py --list-pending-approvals

# Test approval workflow
python semantic_layer_sync.py --config config.yaml --test-approval-workflow

# View approval history
tdx query "SELECT * FROM semantic_layer_v1.approval_history ORDER BY requested_at DESC LIMIT 50"
```

## Approval History

### Track Approvals

```sql
-- Approval history
SELECT
    run_id,
    change_type,
    requested_at,
    approved_by,
    approved_at,
    status,
    comments
FROM semantic_layer_v1.approval_history
ORDER BY requested_at DESC;
```

### Approval Metrics

```sql
-- Approval statistics
SELECT
    change_type,
    COUNT(*) as total_requests,
    SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
    SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected,
    AVG(EXTRACT(EPOCH FROM (approved_at - requested_at))/3600) as avg_approval_time_hours
FROM semantic_layer_v1.approval_history
GROUP BY change_type;
```

## Related Skills

- **semantic-layer-notifications** - Configure approval notifications
- **semantic-layer-conflicts** - Approval for conflict resolution
- **semantic-layer-validation** - Validation before approval
- **semantic-config-master-skill** - Manage all config sections

---

**Status**: ✅ Production Ready
**Skill Type**: Focused / Single-Responsibility
**Last Updated**: 2026-02-16
