---
name: email-campaign-creator
description: Creates email campaigns using tdx engage campaign commands with basic configuration and lifecycle management.
---

# Email Campaign Creator

## Purpose

Creates email campaigns using `tdx engage campaign` commands. Handles campaign setup, configuration, and lifecycle operations.

## Prerequisites

- `tdx` CLI authenticated (`tdx auth status`)
- TD Engage workspace access
- Email templates available

## Campaign Types

TD Engage has two distinct campaign types:

### Batch Campaigns
- Execute once on schedule, auto-finish after delivery
- Status: `Draft → Active → Finished`
- Use for: One-time promotions, scheduled newsletters, announcements

### Always-On Campaigns
- Remain Live, accept multiple journey activations
- Status: `Draft → Live → Paused → Live → Finished`
- Use for: Welcome series, cart abandonment, behavioral triggers
- **Requires**: `--parent-segment` flag

## Campaign Creation

### Set Workspace Context
```bash
# Required before campaign operations
tdx engage workspace use "Marketing Team"
```

### Batch Campaign
```bash
# Basic batch campaign
tdx engage campaign create --name "Newsletter Campaign" --type email

# Scheduled batch campaign
tdx engage campaign create --name "Black Friday Sale" --type email \
  --start-at "2024-11-29T09:00:00" \
  --timezone "America/New_York" \
  --description "Limited time Black Friday promotion"

# With segment targeting
tdx engage campaign create --name "VIP Newsletter" --type email \
  --segment "Marketing/VIP Users" \
  --description "Monthly newsletter for VIP customers"
```

### Always-On Campaign
```bash
# Basic always-on (for journey activation)
tdx engage campaign create --name "Welcome Series" --type email \
  --description "Continuous welcome emails triggered by journeys" \
  --parent-segment "Marketing Master"

# With sender configuration
tdx engage campaign create --name "Cart Recovery" --type email \
  --description "Automated cart abandonment recovery" \
  --parent-segment "E-commerce Master" \
  --email-sender-id "sender-uuid-123"

# With JSON columns for personalization
tdx engage campaign create --name "Product Updates" --type email \
  --parent-segment "Customer 360" \
  --email-sender-id "sender-uuid-123" \
  --json-columns "email,name,company,preferences"
```

## Campaign Management

### View Campaigns
```bash
# List all campaigns
tdx engage campaign list

# List by status
tdx engage campaign list --status DRAFT
tdx engage campaign list --status ACTIVE
tdx engage campaign list --status LIVE

# Show campaign details
tdx engage campaign show "Campaign Name"
tdx engage campaign show "Campaign Name" --full

# Output formats
tdx engage campaign list --format table
tdx engage campaign list --format tsv
tdx engage campaign list --format json
```

### Update Campaigns
```bash
# Update name
tdx engage campaign update "Campaign Name" --name "New Name"

# Update description
tdx engage campaign update "Campaign Name" --description "Updated description"

# Update segment (batch campaigns only, when in DRAFT)
tdx engage campaign update "Campaign Name" --segment "New/Segment Path"

# Note: Parent segment cannot be changed for always-on campaigns after creation
```

## Campaign Lifecycle

### Batch Campaign Lifecycle
```bash
# Launch (DRAFT → ACTIVE)
tdx engage campaign launch "Newsletter Campaign"

# Auto-finishes after delivery (ACTIVE → FINISHED)

# Duplicate for reuse
tdx engage campaign duplicate "Newsletter Campaign"
```

### Always-On Campaign Lifecycle
```bash
# Launch (DRAFT → LIVE)
tdx engage campaign launch "Welcome Series"

# Pause to make changes (LIVE → PAUSED)
tdx engage campaign pause "Welcome Series"

# Resume after changes (PAUSED → LIVE)
tdx engage campaign resume "Welcome Series"

# Note: No CLI finish command - use TD Engage web interface
```

### Campaign Status Rules

| Type | Draft | Active/Live | Paused | Finished |
|------|-------|-------------|--------|----------|
| **Batch** | ✅ Edit | ❌ Read-only | N/A | ❌ Read-only |
| **Always-On** | ✅ Edit | ❌ Read-only | ✅ Edit | ❌ Read-only |

**Key TD-Specific Rules:**
- Batch campaigns auto-finish after delivery
- Always-on campaigns stay Live indefinitely
- Parent segment locked after always-on campaign launch
- Only paused always-on campaigns can be edited

## Campaign Functions

### Quick Campaign Creation
```bash
create_basic_campaign() {
  local name="$1"
  local description="$2"

  tdx engage campaign create --name "$name" --type email --description "$description"
  echo "Campaign '$name' created in DRAFT status"
  echo "Launch with: tdx engage campaign launch \"$name\""
}
```

### Campaign Status Check
```bash
# Check campaign status
get_campaign_status() {
  local campaign_name="$1"

  tdx engage campaign show "$campaign_name" --full | \
    jq -r '.data.attributes.status'
}

# Check multiple campaigns
tdx engage campaign list --format tsv | while IFS=$'\t' read -r uuid name status type; do
  echo "$name: $status ($type)"
done
```

### Bulk Launch with Confirmation
```bash
launch_drafts() {
  tdx engage campaign list --status DRAFT --format tsv | \
    while IFS=$'\t' read -r uuid name; do
      read -p "Launch '$name'? (y/N): " -n 1 -r
      echo
      if [[ $REPLY =~ ^[Yy]$ ]]; then
        tdx engage campaign launch "$name"
        echo "✅ Launched: $name"
      fi
    done
}
```

## TD-Specific Errors

### Campaign Creation
| Error | TD-Specific Solution |
|-------|---------------------|
| "Workspace context not set" | `tdx engage workspace use "Marketing Team"` |
| "Parent segment not found" | Verify with `tdx ps list` |
| "Sender ID not found" | Check workspace sender configuration |
| "Segment path not found" | Verify with `tdx sg list` |

### Campaign Lifecycle
| Error | TD-Specific Solution |
|-------|---------------------|
| "Cannot edit Live campaign" | Pause first: `tdx engage campaign pause "Name"` |
| "Cannot launch Paused campaign" | Resume first: `tdx engage campaign resume "Name"` |
| "Cannot change parent segment" | Parent segment locked after launch - create new campaign |
| "Campaign not accepting activations" | Check status is Live (not Paused/Finished) |

### Journey Integration
| Error | TD-Specific Solution |
|-------|---------------------|
| "Campaign type mismatch" | Journeys require always-on campaigns (with `--parent-segment`) |
| "Parent segment mismatch" | Journey and campaign must use same parent segment |
| "Activation failed - campaign paused" | Resume campaign or update journey reference |

## Campaign Type Selection

### Use Batch When:
- One-time promotions or announcements
- Scheduled newsletter broadcasts
- Time-sensitive messages
- Manual campaign execution

### Use Always-On When:
- Welcome email sequences
- Cart abandonment recovery
- Behavioral triggers
- Journey-activated messaging
- Continuous automated campaigns

### Key Differences

| Feature | Batch | Always-On |
|---------|-------|-----------|
| **Status Flow** | Draft → Active → Finished | Draft → Live → Paused → Finished |
| **Journey Use** | ❌ | ✅ Required |
| **Scheduling** | ✅ `--start-at` flag | ❌ Journey-triggered only |
| **Parent Segment** | ❌ Uses `--segment` | ✅ Uses `--parent-segment` |
| **Auto-Finish** | ✅ After delivery | ❌ Manual finish only |

## Pre-Launch Checklist

```bash
# 1. Verify workspace
tdx use | grep engage_workspace

# 2. Check campaign config
tdx engage campaign show "Campaign Name" --full

# 3. Verify template association
tdx engage campaign show "Campaign Name" --full | \
  jq '.data.relationships.template'

# 4. Check parent segment (always-on only)
tdx ps view "Parent Segment Name"

# 5. Test via web interface (no CLI test command)

# 6. Launch
tdx engage campaign launch "Campaign Name"
```

## Related Skills

**Prerequisites:**
- **email-template-creator** - Create templates for campaigns

**Targeting:**
- **tdx-skills:segment** - Create audience segments (batch campaigns)
- **tdx-skills:parent-segment** - Configure parent segments (always-on campaigns)

**Integration:**
- **email-testing-validator** - Validate before launch
- **email-journey-builder** - Use always-on campaigns in journeys
- **tdx-skills:journey** - Advanced journey orchestration

**Management:**
- **email-template-manager** - Manage templates used in campaigns
