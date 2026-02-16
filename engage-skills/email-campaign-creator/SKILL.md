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

## Campaign Creation

### Basic Campaign Setup
```bash
# Set workspace context
tdx use engage_workspace "Marketing Team"

# Create basic email campaign
tdx engage campaign create --name "Newsletter Campaign" --type email

# Create with description
tdx engage campaign create --name "Welcome Series" --type email \
  --description "Automated welcome emails for new users"
```

### Campaign with Targeting
```bash
# Create campaign with segment
tdx engage campaign create --name "VIP Promotion" --type email \
  --segment "Marketing/VIP Users" \
  --description "Exclusive offers for VIP customers"

# Create with email configuration
tdx engage campaign create --name "Product Updates" --type email \
  --email-sender-id "sender-uuid-123" \
  --json-columns "email,name,company"
```

### Scheduled Campaigns
```bash
# Create campaign with future delivery
tdx engage campaign create --name "Black Friday Sale" --type email \
  --start-at "2024-11-29T09:00:00" \
  --timezone "America/New_York"

# Create for different timezone
tdx engage campaign create --name "APAC Newsletter" --type email \
  --start-at "2024-12-01T08:00:00" \
  --timezone "Asia/Tokyo"
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

### Campaign Lifecycle
```bash
# Launch campaign (DRAFT → ACTIVE)
tdx engage campaign launch "Campaign Name"

# Pause campaign (ACTIVE → PAUSED)
tdx engage campaign pause "Campaign Name"

# Resume campaign (PAUSED → ACTIVE)
tdx engage campaign resume "Campaign Name"

# Duplicate campaign
tdx engage campaign duplicate "Campaign Name"
```

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

## Related Skills

**Prerequisites:**
- **email-template-creator** - Create templates for campaigns

**Integration:**
- **email-testing-validator** - Test campaigns before launch
- **email-campaign-orchestration** - Integrate with journeys

**Management:**
- **email-template-manager** - Manage templates used in campaigns