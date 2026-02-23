---
name: email-journey-builder
description: Creates journey YAML files with email steps using tdx journey commands for TD Journey Orchestration.
---

# Email Journey Builder

## Purpose

Creates journey YAML files with email activation steps using `tdx journey` commands. Focuses on simple email sequence patterns.

**For complex journeys** (decision points, A/B testing, multi-channel), use **tdx-skills:journey** instead.

## Prerequisites

- `tdx` CLI authenticated (`tdx auth status`)
- Email campaigns created (always-on campaigns)
- Parent segments configured

## Basic Journey YAML

### Email Sequence
```yaml
# welcome-journey.yml
name: "Welcome Series"
description: "Simple welcome email sequence"
parent_segment: "marketing_master"
folder: "Onboarding"

steps:
  - name: "send_welcome"
    type: "activation"
    email:
      template_id: "welcome-template"
      sender_id: "verified-sender-uuid"
      custom_event_id: "welcome_sent"
    next: "wait_2_days"

  - name: "wait_2_days"
    type: "wait"
    duration: "2d"
    next: "send_followup"

  - name: "send_followup"
    type: "activation"
    email:
      template_id: "followup-template"
      sender_id: "verified-sender-uuid"
      custom_event_id: "followup_sent"
```

Extend by adding more `wait` → `activation` pairs for multi-email sequences.

## Journey Commands

### Validate & Deploy
```bash
# Validate YAML syntax
tdx journey validate welcome-journey.yml

# Push journey to TD
tdx journey push welcome-journey.yml

# View deployed journey
tdx journey view "Welcome Series"

# View with execution statistics
tdx journey view "Welcome Series" --include-stats

# Open journey in web browser for visual inspection
tdx journey view "Welcome Series" -w

# List all journeys
tdx journey list

# Pull journey to local file
tdx journey pull "Welcome Series"

# Update journey
tdx journey push welcome-journey.yml
```

### Journey Lifecycle
```bash
# Pause a running journey
tdx journey pause "Welcome Series"

# Resume a paused journey
tdx journey resume "Welcome Series"
```

### Journey Monitoring
```bash
# Check journey status
tdx journey view "Welcome Series"

# View journey statistics
tdx journey stats "Welcome Series"

# View stats for a specific stage
tdx journey stats "Welcome Series" --stage "send_welcome"

# Extract journey to YAML
tdx journey pull "Welcome Series" --yes
```

## Journey Templates

### Welcome Series Generator
```bash
create_welcome_journey() {
  local parent_segment="$1"
  local sender_id="$2"

  cat > welcome-series.yml << EOF
name: "Welcome Series"
description: "3-email welcome sequence"
parent_segment: "$parent_segment"
folder: "Onboarding"

steps:
  - name: "day_1_welcome"
    type: "activation"
    email:
      template_id: "welcome-day-1"
      sender_id: "$sender_id"
      custom_event_id: "welcome_day_1"
    next: "wait_2_days"

  - name: "wait_2_days"
    type: "wait"
    duration: "2d"
    next: "day_3_features"

  - name: "day_3_features"
    type: "activation"
    email:
      template_id: "welcome-day-3"
      sender_id: "$sender_id"
      custom_event_id: "welcome_day_3"
    next: "wait_4_days"

  - name: "wait_4_days"
    type: "wait"
    duration: "4d"
    next: "day_7_success"

  - name: "day_7_success"
    type: "activation"
    email:
      template_id: "welcome-day-7"
      sender_id: "$sender_id"
      custom_event_id: "welcome_day_7"
EOF

  echo "Created: welcome-series.yml"
}

# Usage: create_welcome_journey "marketing_master" "sender-uuid"
```

## Journey Validation

### Pre-Deploy Validation
```bash
validate_journey() {
  local journey_file="$1"

  # Validate YAML syntax
  if ! tdx journey validate "$journey_file"; then
    echo "❌ YAML validation failed"
    return 1
  fi

  echo "✅ YAML valid"

  # Verify parent segment
  parent_segment=$(grep "parent_segment:" "$journey_file" | \
    sed 's/.*: *["'"'"']*\([^"'"'"']*\)["'"'"']*.*/\1/')

  if tdx ps view "$parent_segment" >/dev/null 2>&1; then
    echo "✅ Parent segment exists: $parent_segment"
  else
    echo "❌ Parent segment not found: $parent_segment"
    return 1
  fi

  echo "✅ Journey ready for deployment"
}

# Usage: validate_journey "welcome-series.yml"
```

### Template Dependency Check
```bash
check_journey_templates() {
  local journey_file="$1"

  # Extract template IDs
  template_ids=$(grep -A 5 "type: activation" "$journey_file" | \
    grep "template_id:" | \
    sed 's/.*: *["'"'"']*\([^"'"'"']*\)["'"'"']*.*/\1/' | \
    sort | uniq)

  for template_id in $template_ids; do
    if tdx engage template show "$template_id" >/dev/null 2>&1; then
      echo "✅ $template_id exists"
    else
      echo "❌ $template_id NOT FOUND"
      return 1
    fi
  done

  echo "✅ All templates exist"
}

# Usage: check_journey_templates "welcome-series.yml"
```

## Journey Deployment

### Deploy with Validation
```bash
deploy_journey() {
  local journey_file="$1"

  # Validate first
  if ! validate_journey "$journey_file"; then
    echo "❌ Validation failed"
    return 1
  fi

  # Deploy
  echo "Deploying: $journey_file"
  tdx journey push "$journey_file"

  if [ $? -eq 0 ]; then
    echo "✅ Journey deployed"
  else
    echo "❌ Deployment failed"
    return 1
  fi
}

# Usage: deploy_journey "welcome-series.yml"
```

## Email Performance Analysis

### Journey Email Metrics
```sql
-- Email delivery performance by journey step
-- Find database: tdx databases "*delivery_email*"
SELECT
  custom_event_id as journey_step,
  COUNT(CASE WHEN event_type = 'Delivery' THEN 1 END) as delivered,
  COUNT(CASE WHEN event_type = 'Open' THEN 1 END) as opened,
  COUNT(CASE WHEN event_type = 'Click' THEN 1 END) as clicked,
  ROUND(COUNT(CASE WHEN event_type = 'Open' THEN 1 END) * 100.0 /
    NULLIF(COUNT(CASE WHEN event_type = 'Delivery' THEN 1 END), 0), 2) as open_rate
FROM {delivery_email_database}.events
WHERE
  custom_event_id IN ('welcome_day_1', 'welcome_day_3', 'welcome_day_7')
  AND td_interval(time, '-30d')
GROUP BY custom_event_id
ORDER BY journey_step
```

## TD-Specific Errors

### YAML Validation
| Error | TD-Specific Solution |
|-------|---------------------|
| "YAML syntax error" | Validate indentation (2 spaces per level) |
| "Invalid step type" | Use 'activation' or 'wait' only |
| "Missing required field" | Required: name, parent_segment, steps |
| "Invalid duration format" | Use: '2d', '1h', '30m', '1w' |
| "Circular reference detected" | Check 'next' fields don't create loops |

### Deployment Errors
| Error | TD-Specific Solution |
|-------|---------------------|
| "Parent segment not found" | Verify with `tdx ps list` |
| "Template ID not found" | Verify with `tdx engage template list` |
| "Sender ID not verified" | Check sender verification in TD Engage UI |
| "Journey name already exists" | Use unique name or update existing |

### Email Activation Errors
| Error | TD-Specific Solution |
|-------|---------------------|
| "Template not found in activation" | Verify template_id matches template name |
| "Campaign not accepting activations" | Campaign must be in ACTIVE status (not PAUSED/COMPLETED) |
| "Invalid custom_event_id format" | Use alphanumeric and underscores only |

## TD-Specific Patterns

### Duration Formats
```yaml
# Valid duration formats
duration: "2d"   # 2 days
duration: "1h"   # 1 hour
duration: "30m"  # 30 minutes
duration: "1w"   # 1 week
```

### Custom Event IDs
```yaml
# Use descriptive, trackable event IDs
custom_event_id: "welcome_day_1"      # ✅ Good
custom_event_id: "welcome_email_1"    # ✅ Good
custom_event_id: "email1"             # ⚠️ Less descriptive
```

### Parent Segment Format
```yaml
# Parent segment must exist before journey deployment
parent_segment: "marketing_master"    # ✅ Underscore format
parent_segment: "Marketing Master"    # ❌ Spaces may cause issues
```

## Skill Comparison

| Use Case | Skill |
|----------|-------|
| Simple email sequences (welcome, newsletter) | **email-journey-builder** |
| Basic wait → email → wait patterns | **email-journey-builder** |
| Rapid prototyping email flows | **email-journey-builder** |
| Multi-channel journeys (email + SMS + push) | **tdx-skills:journey** |
| A/B testing email content | **tdx-skills:journey** |
| Decision points based on behavior | **tdx-skills:journey** |
| Cross-journey navigation (jumps) | **tdx-skills:journey** |

## Related Skills

**Prerequisites:**
- **email-template-creator** - Create templates for journey
- **email-campaign-creator** - Create always-on campaigns
- **tdx-skills:parent-segment** - Configure parent segments

**Advanced Journey:**
- **tdx-skills:journey** - Full journey orchestration with decision points
- **tdx-skills:validate-journey** - Validate complex journey YAML
- **tdx-skills:connector-config** - Configure activation connectors

**Monitoring:**
- **email-testing-validator** - Test journey components
- **sql-skills:trino** - Query email delivery metrics
