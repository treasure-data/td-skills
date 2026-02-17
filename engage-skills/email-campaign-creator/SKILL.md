---
name: email-campaign-creator
description: Creates email campaigns using tdx engage campaign commands with basic configuration and lifecycle management.
---

# Email Campaign Creator

## Purpose

Creates email campaigns using `tdx engage campaign` commands. Handles basic campaign setup, configuration, and lifecycle operations.

## Prerequisites

- `tdx` CLI authenticated (`tdx auth status`)
- TD Engage workspace access
- Email templates available (use `email-template-creator`)

## Campaign Types

TD Engage supports two distinct campaign types with different use cases and behaviors:

### **Batch (One-off) Campaigns**
- Execute on schedule and automatically finish after delivery
- Best for: One-time promotions, scheduled announcements, newsletter broadcasts
- Status flow: `Draft → Active → Finished`

### **Always-On Campaigns**
- Remain Live indefinitely and accept multiple activations from journeys
- Best for: Welcome series, cart abandonment, behavioral triggers, milestone messages
- Status flow: `Draft → Live → Paused → Live → Finished`

## Campaign Creation

### Batch Campaign Setup
```bash
# Set workspace context
tdx engage workspace use "Marketing Team"

# Create batch email campaign (default behavior)
tdx engage campaign create --name "Newsletter Campaign" --type email

# Create scheduled batch campaign
tdx engage campaign create --name "Black Friday Sale" --type email \
  --start-at "2024-11-29T09:00:00" \
  --timezone "America/New_York" \
  --description "Limited time Black Friday promotion"

# Create with segment targeting
tdx engage campaign create --name "VIP Newsletter" --type email \
  --segment "Marketing/VIP Users" \
  --description "Monthly newsletter for VIP customers"
```

### Always-On Campaign Setup
```bash
# Create always-on campaign for journey activation
tdx engage campaign create --name "Welcome Series" --type email \
  --description "Continuous welcome emails triggered by journeys" \
  --parent-segment "Marketing Master"

# Always-on campaign for cart abandonment
tdx engage campaign create --name "Cart Recovery" --type email \
  --description "Automated cart abandonment recovery" \
  --parent-segment "E-commerce Master"

# Always-on campaign with sender configuration
tdx engage campaign create --name "Milestone Celebrations" --type email \
  --description "Birthday and anniversary messages" \
  --parent-segment "Customer 360" \
  --email-sender-id "celebration-sender-uuid"
```

### Campaign Configuration Options
```bash
# Email sender and template configuration
tdx engage campaign create --name "Product Updates" --type email \
  --email-sender-id "sender-uuid-123" \
  --json-columns "email,name,company,preferences"

# Advanced targeting (batch campaigns)
tdx engage campaign create --name "Segment-Specific Promo" --type email \
  --segment "Marketing/High Value Customers" \
  --description "Targeted promotion for high-value segment"
```

## Campaign Management

### View and Update Campaigns
```bash
# List campaigns
tdx engage campaign list

# Show campaign details
tdx engage campaign show "Campaign Name"
tdx engage campaign show "Campaign Name" --full

# Update campaign settings
tdx engage campaign update "Campaign Name" --name "New Name"
tdx engage campaign update "Campaign Name" --description "Updated description"
tdx engage campaign update "Campaign Name" --segment "New/Segment Path"
```

### Campaign Lifecycle Management

#### **Batch Campaign Lifecycle**
Status flow: `Draft → Active → Finished`

```bash
# Launch batch campaign (DRAFT → ACTIVE, auto-finishes after delivery)
tdx engage campaign launch "Newsletter Campaign"

# View campaign status
tdx engage campaign show "Newsletter Campaign"

# Duplicate completed campaign for reuse
tdx engage campaign duplicate "Newsletter Campaign"
```

#### **Always-On Campaign Lifecycle**
Status flow: `Draft → Live → Paused → Live → Finished`

```bash
# Launch always-on campaign (DRAFT → LIVE)
tdx engage campaign launch "Welcome Series"

# Pause campaign to make changes (LIVE → PAUSED)
tdx engage campaign pause "Welcome Series"

# Resume campaign after changes (PAUSED → LIVE)
tdx engage campaign resume "Welcome Series"

# Permanently finish always-on campaign (LIVE/PAUSED → FINISHED)
tdx engage campaign finish "Welcome Series"  # Permanent action!
```

#### **Universal Campaign Operations**
```bash
# Test any campaign type
tdx engage campaign test "Campaign Name" --email "test@treasuredata.com"

# Duplicate any campaign (creates new DRAFT)
tdx engage campaign duplicate "Campaign Name"

# Update campaign (only when DRAFT or PAUSED for always-on)
tdx engage campaign update "Campaign Name" --description "Updated description"
```

#### **Campaign Status Rules**
| Campaign Type | Draft | Active/Live | Paused | Finished |
|---------------|-------|-------------|--------|----------|
| **Batch** | ✅ Edit all | ❌ Read-only | N/A | ❌ Read-only |
| **Always-On** | ✅ Edit all | ❌ Read-only | ✅ Edit content | ❌ Read-only |

**Key Differences:**
- **Batch campaigns** automatically transition to Finished after delivery
- **Always-on campaigns** stay Live until manually paused or finished
- **Always-on campaigns** can be edited while Paused
- **Parent segment** cannot be changed after always-on campaign launch

### Campaign Testing
```bash
# Send test email
tdx engage campaign test "Campaign Name" --email "test@treasuredata.com"

# Test in specific workspace
tdx engage campaign test "Campaign Name" --email "test@example.com" --workspace "Marketing"
```

## Simple Workflows

### Quick Campaign Creation
```bash
# One-command campaign creation
create_basic_campaign() {
  local name="$1"
  local description="$2"

  tdx engage campaign create --name "$name" --type email --description "$description"
  echo "Campaign '$name' created in DRAFT status"
  echo "Next: Launch with 'tdx engage campaign launch \"$name\"'"
}

# Usage: create_basic_campaign "Monthly Newsletter" "Regular newsletter for subscribers"
```

### Campaign Status Check
```bash
# Check multiple campaign statuses
check_campaigns() {
  echo "Campaign Status Report:"
  tdx engage campaign list --format table | while read uuid name type status; do
    echo "$name: $status"
  done
}

# Usage: check_campaigns
```

### Bulk Operations
```bash
# Launch multiple draft campaigns
launch_drafts() {
  tdx engage campaign list --status DRAFT --format tsv | while read uuid name; do
    read -p "Launch '$name'? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
      tdx engage campaign launch "$name"
      echo "✅ Launched: $name"
    fi
  done
}

# Usage: launch_drafts
```

## Campaign Validation

### Pre-Launch Checks
```bash
# Basic campaign validation
validate_campaign() {
  local campaign_name="$1"

  # Check campaign exists
  if ! tdx engage campaign show "$campaign_name" >/dev/null 2>&1; then
    echo "❌ Campaign not found: $campaign_name"
    return 1
  fi

  # Check status
  status=$(tdx engage campaign show "$campaign_name" | grep -i status || echo "unknown")
  echo "Campaign status: $status"

  echo "✅ Campaign ready for testing or launch"
}

# Usage: validate_campaign "Newsletter Campaign"
```

## Best Practices

### Campaign Setup
- Use descriptive names that indicate purpose and audience
- Always include meaningful descriptions for team collaboration
- Set appropriate segments for targeting
- Configure sender IDs for deliverability

### Lifecycle Management
- Test campaigns before launching
- Use DRAFT status for setup and configuration
- Launch only when ready to send
- Monitor campaign status after launch

### Organization
- Use consistent naming conventions
- Group related campaigns with prefixes
- Clean up old or unused campaigns
- Document campaign purposes in descriptions

## Common Errors & Troubleshooting

### Campaign Creation Errors

| Error | Solution |
|-------|----------|
| "Workspace context not set" | Run `tdx engage workspace use "Marketing Team"` |
| "Parent segment not found" | Verify parent segment exists: `tdx ps list` |
| "Sender ID not found" | Check sender ID exists in workspace |
| "Invalid email address" | Verify email format in sender configuration |
| "Segment path not found" | Check segment path: `tdx sg list` |
| "Permission denied" | Contact workspace administrator for campaign permissions |

### Campaign Lifecycle Errors

| Error | Solution |
|-------|----------|
| "Cannot edit Live campaign" | Pause campaign first: `tdx engage campaign pause "Name"` |
| "Cannot launch Paused campaign" | Resume campaign: `tdx engage campaign resume "Name"` |
| "Parent segment mismatch" | Ensure journey uses same parent segment as campaign |
| "Campaign not accepting activations" | Check campaign is in Live status (not Paused/Finished) |
| "Cannot change parent segment" | Parent segment locked after launch - create new campaign |
| "Finish action is permanent" | Use pause instead if you need to restart later |

### Journey Integration Errors

| Error | Solution |
|-------|----------|
| "Always-on campaign not found in journey" | Ensure campaign is Live and parent segments match |
| "Activation failed - campaign paused" | Resume campaign or update journey to use different campaign |
| "Campaign type mismatch" | Journeys require always-on campaigns, not batch campaigns |

### Workspace & Permission Errors

| Error | Solution |
|-------|----------|
| "Workspace not accessible" | Verify workspace access: `tdx engage workspace list` |
| "Invalid workspace context" | Set workspace: `tdx engage workspace use "Name"` |
| "API key permissions insufficient" | Contact admin - need campaign create/manage permissions |

## Campaign Type Selection Guide

### Use **Batch Campaigns** When:
- ✅ One-time promotional messages
- ✅ Scheduled newsletter broadcasts
- ✅ Time-sensitive announcements
- ✅ Specific audience targeting
- ✅ Manual campaign execution

### Use **Always-On Campaigns** When:
- ✅ Welcome email sequences
- ✅ Cart abandonment recovery
- ✅ Behavioral trigger responses
- ✅ Milestone celebrations (birthdays, anniversaries)
- ✅ Re-engagement campaigns
- ✅ Journey-activated messaging

### Campaign Type Comparison

| Feature | Batch Campaigns | Always-On Campaigns |
|---------|----------------|---------------------|
| **Execution** | One-time scheduled | Continuous activation-triggered |
| **Status Flow** | Draft → Active → Finished | Draft → Live → Paused → Live → Finished |
| **Journey Integration** | ❌ Not supported | ✅ Primary use case |
| **Manual Scheduling** | ✅ Built-in scheduling | ❌ Journey/activation triggered only |
| **Editing While Active** | ❌ Read-only | ❌ Must pause first |
| **Parent Segment** | ❌ Direct segment selection | ✅ Required for activation |
| **Automatic Completion** | ✅ Auto-finishes after delivery | ❌ Remains live until manually finished |

## Validation & Pre-Launch Checklist

### Before Launching Any Campaign:
```bash
# 1. Verify workspace context
tdx context | grep engage_workspace

# 2. Check campaign configuration
tdx engage campaign show "Campaign Name" --full

# 3. Test campaign delivery
tdx engage campaign test "Campaign Name" --email "test@company.com"

# 4. Verify sender profile (if configured)
tdx engage campaign show "Campaign Name" | grep sender

# 5. Check parent segment (always-on campaigns)
tdx ps view "Parent Segment Name"
```

### Always-On Campaign Pre-Launch:
```bash
# Verify parent segment exists and is active
tdx ps view "Marketing Master" --json

# Check journey integration readiness
tdx journey list | grep "Journey Name"

# Confirm sender ID is verified
# (Use workspace UI or API to verify sender status)
```

## Related Skills

**Prerequisites:**
- **email-template-creator** - Create templates for campaigns

**Audience & Targeting:**
- **tdx-skills:segment** - Create audience segments for campaign targeting
- **tdx-skills:parent-segment** - Configure parent segments for journey integration

**Integration:**
- **email-testing-validator** - Test campaigns before launch
- **email-journey-builder** - Create simple email sequences using campaigns
- **tdx-skills:journey** - Advanced journey orchestration with campaign activations
- **Complete workflow**: email-template-creator → email-campaign-creator → email-journey-builder

**Management:**
- **email-template-manager** - Manage templates used in campaigns