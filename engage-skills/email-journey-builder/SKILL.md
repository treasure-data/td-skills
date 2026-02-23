---
name: email-journey-builder
description: Creates journey YAML files with email steps using tdx journey commands for TD Journey Orchestration.
---

# Email Journey Builder

## Purpose

Creates customer journey YAML files with email activation steps using `tdx journey` commands. Focuses on email-specific journey patterns and YAML structure.

## Prerequisites

- `tdx` CLI authenticated (`tdx auth status`)
- Email campaigns created (`email-campaign-creator`)
- Parent segments available for targeting
- Basic understanding of journey YAML structure

## Basic Journey Structure

### Simple Email Journey
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

### Journey with Multiple Emails
```yaml
# newsletter-series.yml
name: "Newsletter Series"
description: "Weekly newsletter sequence"
parent_segment: "newsletter_master"
folder: "Newsletter"

steps:
  - name: "week_1_newsletter"
    type: "activation"
    email:
      template_id: "newsletter-week-1"
      sender_id: "newsletter-sender-uuid"
      custom_event_id: "newsletter_week_1"
    next: "wait_1_week"

  - name: "wait_1_week"
    type: "wait"
    duration: "7d"
    next: "week_2_newsletter"

  - name: "week_2_newsletter"
    type: "activation"
    email:
      template_id: "newsletter-week-2"
      sender_id: "newsletter-sender-uuid"
      custom_event_id: "newsletter_week_2"
```

## Journey Management

### Create and Validate Journey
```bash
# Validate journey YAML syntax
tdx journey validate welcome-journey.yml

# Push journey to TD
tdx journey push welcome-journey.yml

# View deployed journey
tdx journey view "Welcome Series"

# List all journeys
tdx journey list
```

### Journey Updates
```bash
# Update journey with changes
tdx journey push welcome-journey.yml

# Pull journey to local file
tdx journey pull "Welcome Series"
```

### Journey Monitoring
```bash
# Check journey status
tdx journey view "Welcome Series"

# View journey statistics
tdx journey stats "Welcome Series"
```

## Email Journey Patterns

### Welcome Series Template
```bash
# Generate welcome series journey file
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

  echo "Welcome series journey created: welcome-series.yml"
}

# Usage: create_welcome_journey "marketing_master" "sender-uuid"
```

### Newsletter Journey Template
```bash
# Generate newsletter journey
create_newsletter_journey() {
  local parent_segment="$1"
  local sender_id="$2"

  cat > newsletter-journey.yml << EOF
name: "Newsletter Journey"
description: "Automated newsletter delivery"
parent_segment: "$parent_segment"
folder: "Newsletter"

steps:
  - name: "send_newsletter"
    type: "activation"
    email:
      template_id: "monthly-newsletter"
      sender_id: "$sender_id"
      custom_event_id: "newsletter_sent"
EOF

  echo "Newsletter journey created: newsletter-journey.yml"
}

# Usage: create_newsletter_journey "newsletter_master" "newsletter-sender-uuid"
```

## Journey Validation

### Pre-Deploy Checks
```bash
# Validate journey before deploying
validate_journey() {
  local journey_file="$1"

  echo "Validating journey file: $journey_file"

  # Check YAML syntax
  if ! tdx journey validate "$journey_file"; then
    echo "❌ YAML validation failed"
    return 1
  fi

  echo "✅ YAML syntax valid"

  # Extract parent segment and verify
  parent_segment=$(grep "parent_segment:" "$journey_file" | sed 's/.*: *"*\([^"]*\)"*/\1/')
  if tdx ps view "$parent_segment" >/dev/null 2>&1; then
    echo "✅ Parent segment exists: $parent_segment"
  else
    echo "❌ Parent segment not found: $parent_segment"
    return 1
  fi

  echo "Journey ready for deployment"
}

# Usage: validate_journey "welcome-series.yml"
```

### Journey Deployment
```bash
# Deploy journey with validation
deploy_journey() {
  local journey_file="$1"

  # Validate first
  if ! validate_journey "$journey_file"; then
    echo "❌ Validation failed, aborting deployment"
    return 1
  fi

  # Deploy journey
  echo "Deploying journey: $journey_file"
  tdx journey push "$journey_file"

  if [ $? -eq 0 ]; then
    echo "✅ Journey deployed successfully"
  else
    echo "❌ Journey deployment failed"
    return 1
  fi
}

# Usage: deploy_journey "welcome-series.yml" "Initial deployment"
```

## Journey Monitoring

### Check Journey Performance
```bash
# Monitor journey execution
monitor_journey() {
  local journey_name="$1"

  echo "Journey Status: $journey_name"

  # Check journey details and statistics
  echo "Journey details:"
  tdx journey view "$journey_name"

  # Get journey statistics
  echo "Journey statistics:"
  tdx journey stats "$journey_name"
}

# Usage: monitor_journey "Welcome Series"
```

### Email Step Performance
```sql
-- Note: Database name is derived from your Engage sending domain
-- Format: delivery_email_<your_domain_with_underscores>
-- Find yours with: tdx databases "*delivery_email*"
SELECT
  custom_event_id as journey_step,
  COUNT(CASE WHEN event_type = 'Delivery' THEN 1 END) as delivered,
  COUNT(CASE WHEN event_type = 'Open' THEN 1 END) as opened,
  COUNT(CASE WHEN event_type = 'Click' THEN 1 END) as clicked
FROM {delivery_email_database}.events
WHERE
  custom_event_id IN ('welcome_day_1', 'welcome_day_3', 'welcome_day_7')
  AND td_interval(time, '-30d')
GROUP BY custom_event_id
ORDER BY journey_step
```

## Common Errors & Troubleshooting

### Journey YAML Validation Errors

| Error | Solution |
|-------|----------|
| "YAML syntax error" | Validate YAML structure and indentation |
| "Invalid step type" | Use valid step types: 'activation', 'wait', 'decision' |
| "Missing required field" | Ensure all required fields are present: name, parent_segment, steps |
| "Invalid duration format" | Use valid formats: '2d', '1h', '30m', '1w' |
| "Circular reference detected" | Check step 'next' fields don't create loops |
| "Parent segment not found" | Verify parent segment exists: `tdx ps list` |

### Journey Deployment Errors

| Error | Solution |
|-------|----------|
| "Journey push failed" | Check network connection and authentication |
| "Parent segment access denied" | Verify permissions for parent segment |
| "Template ID not found" | Ensure template exists: `tdx engage template list` |
| "Sender ID not verified" | Complete sender profile verification |
| "Journey name already exists" | Use unique journey name or update existing |
| "Invalid folder path" | Check folder exists or create new folder |

### Email Activation Step Errors

| Error | Solution |
|-------|----------|
| "Template not found in activation" | Verify template_id matches existing template |
| "Sender profile not configured" | Set valid sender_id in email activation |
| "Campaign not accepting activations" | Ensure referenced campaign is in Live status |
| "Invalid custom_event_id format" | Use alphanumeric characters and underscores only |
| "Email activation timeout" | Check campaign and template configuration |

### Journey Runtime Errors

| Error | Solution |
|-------|----------|
| "Journey session failed" | Check journey step configuration and dependencies |
| "Email send failed in journey" | Verify campaign, template, and sender settings |
| "Step timeout exceeded" | Review wait durations and system capacity |
| "No eligible users for step" | Check parent segment population and filters |
| "Journey execution stopped" | Review journey logs for specific error details |

### File Management Errors

| Error | Solution |
|-------|----------|
| "YAML file not found" | Verify file path: `ls -la *.yml` |
| "File permission denied" | Check file permissions: `chmod 644 journey-file.yml` |
| "Invalid file encoding" | Ensure UTF-8 encoding: `file -bi journey-file.yml` |
| "YAML parsing failed" | Validate YAML syntax online or with `yamllint` |

## Advanced Troubleshooting

### Comprehensive Journey Validation
```bash
# Complete journey validation workflow
comprehensive_journey_validation() {
  local journey_file="$1"

  echo "Comprehensive validation for: $journey_file"

  # 1. Check file exists and is readable
  if [ ! -f "$journey_file" ]; then
    echo "❌ Journey file not found: $journey_file"
    return 1
  fi

  if [ ! -r "$journey_file" ]; then
    echo "❌ Journey file not readable: $journey_file"
    return 1
  fi

  echo "✅ File exists and is readable"

  # 2. Basic YAML syntax validation
  echo "Validating YAML syntax..."
  if command -v yamllint >/dev/null; then
    if yamllint "$journey_file" >/dev/null 2>&1; then
      echo "✅ YAML syntax valid"
    else
      echo "❌ YAML syntax errors detected:"
      yamllint "$journey_file"
      return 1
    fi
  else
    echo "⚠️  yamllint not available, skipping syntax check"
  fi

  # 3. TDX journey validation
  echo "Validating with tdx journey..."
  if tdx journey validate "$journey_file"; then
    echo "✅ TDX journey validation passed"
  else
    echo "❌ TDX journey validation failed"
    return 1
  fi

  # 4. Extract and validate parent segment
  echo "Validating parent segment..."
  parent_segment=$(grep -E "^parent_segment:" "$journey_file" | sed 's/.*: *["'"'"']*\([^"'"'"']*\)["'"'"']*.*/\1/')

  if [ -n "$parent_segment" ]; then
    if tdx ps view "$parent_segment" >/dev/null 2>&1; then
      echo "✅ Parent segment exists: $parent_segment"
    else
      echo "❌ Parent segment not found: $parent_segment"
      echo "Available parent segments:"
      tdx ps list
      return 1
    fi
  else
    echo "❌ Parent segment not specified in YAML"
    return 1
  fi

  # 5. Validate email activation steps
  echo "Validating email activation steps..."
  template_ids=$(grep -A 5 "type: activation" "$journey_file" | grep "template_id:" | sed 's/.*: *["'"'"']*\([^"'"'"']*\)["'"'"']*.*/\1/')

  for template_id in $template_ids; do
    if [ -n "$template_id" ]; then
      echo "Checking template: $template_id"
      if tdx engage template show "$template_id" >/dev/null 2>&1; then
        echo "  ✅ Template exists: $template_id"
      else
        echo "  ❌ Template not found: $template_id"
        return 1
      fi
    fi
  done

  # 6. Validate sender IDs
  echo "Validating sender IDs..."
  sender_ids=$(grep -A 5 "type: activation" "$journey_file" | grep "sender_id:" | sed 's/.*: *["'"'"']*\([^"'"'"']*\)["'"'"']*.*/\1/')

  for sender_id in $sender_ids; do
    if [ -n "$sender_id" ]; then
      echo "Checking sender: $sender_id"
      # Note: Direct sender validation requires workspace API access
      echo "  ⚠️  Manual sender verification recommended"
    fi
  done

  echo "✅ Comprehensive validation completed"
}

# Usage: comprehensive_journey_validation "welcome-series.yml"
```

### Journey Debugging & Diagnostics
```bash
# Debug journey execution issues
debug_journey_execution() {
  local journey_name="$1"

  echo "Debugging journey execution: $journey_name"

  # Check if journey exists
  if ! tdx journey view "$journey_name" >/dev/null 2>&1; then
    echo "❌ Journey not found: $journey_name"
    echo "Available journeys:"
    tdx journey list
    return 1
  fi

  # Get journey details
  echo "Journey configuration:"
  journey_info=$(tdx journey view "$journey_name")
  echo "$journey_info"

  # Check journey statistics
  echo -e "\nJourney statistics:"
  journey_stats=$(tdx journey stats "$journey_name" 2>/dev/null)

  if [ -n "$journey_stats" ]; then
    echo "$journey_stats"
  else
    echo "No statistics available"
  fi

  # Check parent segment status
  echo -e "\nParent segment analysis:"
  parent_segment=$(echo "$journey_info" | grep -i "parent.segment" | awk '{print $2}' 2>/dev/null)

  if [ -n "$parent_segment" ]; then
    echo "Parent segment: $parent_segment"
    if tdx ps view "$parent_segment" >/dev/null 2>&1; then
      segment_size=$(tdx ps view "$parent_segment" | grep -i "size\|count" 2>/dev/null)
      echo "Segment status: $segment_size"
    else
      echo "❌ Parent segment not accessible"
    fi
  fi

  # Check for common issues
  echo -e "\nCommon issue checks:"
  echo "1. Verify all referenced templates exist"
  echo "2. Ensure sender profiles are verified"
  echo "3. Check parent segment has eligible users"
  echo "4. Verify journey steps don't have circular references"

  echo "✅ Journey debugging completed"
}

# Usage: debug_journey_execution "Welcome Series"
```

### Email Template Dependency Check
```bash
# Verify all templates referenced in journey exist
check_journey_templates() {
  local journey_file="$1"

  echo "Checking template dependencies for: $journey_file"

  if [ ! -f "$journey_file" ]; then
    echo "❌ Journey file not found"
    return 1
  fi

  # Extract template IDs from YAML
  template_ids=$(grep -A 5 "type: activation" "$journey_file" | grep "template_id:" | sed 's/.*: *["'"'"']*\([^"'"'"']*\)["'"'"']*.*/\1/' | sort | uniq)

  if [ -z "$template_ids" ]; then
    echo "⚠️  No email activation steps found in journey"
    return 0
  fi

  echo "Verifying templates:"

  missing_templates=""
  for template_id in $template_ids; do
    echo "Checking: $template_id"

    if tdx engage template show "$template_id" >/dev/null 2>&1; then
      echo "  ✅ $template_id exists"
    else
      echo "  ❌ $template_id NOT FOUND"
      missing_templates="$missing_templates $template_id"
    fi
  done

  if [ -n "$missing_templates" ]; then
    echo ""
    echo "❌ Missing templates detected:$missing_templates"
    echo "Create missing templates with: tdx engage template create"
    return 1
  else
    echo "✅ All templates exist"
    return 0
  fi
}

# Usage: check_journey_templates "welcome-series.yml"
```

### Journey Performance Analysis
```bash
# Analyze journey step performance
analyze_journey_performance() {
  local journey_name="$1"
  local days="$2"

  echo "Journey Performance Analysis: $journey_name"
  echo "Period: Last $days days"
  echo "================================"

  # Get journey statistics
  journey_stats=$(tdx journey stats "$journey_name" 2>/dev/null)

  if [ -n "$journey_stats" ]; then
    echo "Journey Statistics:"
    echo "$journey_stats"
  else
    echo "No statistics available from tdx journey stats"
  fi

  # Pull journey configuration to get step details
  journey_file="temp_journey_$(date +%s).yml"
  if tdx journey pull "$journey_name" --yes >/dev/null 2>&1; then
    echo -e "\nEmail step analysis:"

    # Extract custom_event_ids
    custom_events=$(grep -A 5 "type: activation" "$journey_file" | grep "custom_event_id:" | sed 's/.*: *["'"'"']*\([^"'"'"']*\)["'"'"']*.*/\1/' | sort | uniq)

    if [ -n "$custom_events" ]; then
      echo "Custom event IDs found: $custom_events"
      echo "Use SQL queries to analyze email delivery by custom_event_id"
    else
      echo "No custom_event_ids found in journey steps"
    fi

    # Clean up
    rm -f "$journey_file"
  else
    echo "Unable to pull journey configuration for analysis"
  fi

  echo "✅ Performance analysis completed"
}

# Usage: analyze_journey_performance "Welcome Series" "30"
```

### Journey Design
- Use descriptive step names that indicate the email purpose
- Set appropriate wait durations between emails (2-7 days typical)
- Include custom_event_id for tracking email delivery
- Use consistent folder organization

### Email Configuration
- Ensure template_id matches actual template names
- Use verified sender_id for deliverability
- Set unique custom_event_id for each email step
- Test journeys with small parent segments first

### YAML Structure
- Keep journey files organized in logical folders
- Use consistent naming conventions
- Include meaningful descriptions
- Validate YAML before deploying

## Related Skills

**Prerequisites:**
- **email-template-creator** - Create templates referenced in journey
- **email-campaign-creator** - Set up campaigns for email delivery
- **tdx-skills:parent-segment** - Configure parent segments

**Advanced Journey Orchestration:**
- **tdx-skills:journey** - Comprehensive CDP journey orchestration
  - **Use when you need:** Decision points, A/B testing, multi-stage journeys, behavior segmentation
  - **Upgrade path:** Start with email-journey-builder, migrate to tdx-skills:journey for complex workflows
  - **Key differences:** Full YAML structure vs simplified email patterns
- **tdx-skills:validate-journey** - Validate complex journey YAML structures
- **tdx-skills:connector-config** - Configure advanced activation connectors

**Integration:**
- **email-campaign-creator** - Create campaigns for journey activations
- **email-template-creator** → **email-campaign-creator** - Complete workflow setup
- **tdx-skills:segment** - Create segments for journey decision points

**Monitoring:**
- **email-testing-validator** - Test journey components
- SQL skills for email delivery analysis

**Skill Selection Guide:**

| Use Case | Recommended Skill |
|----------|-------------------|
| Simple email sequence (welcome, newsletter) | **email-journey-builder** (this skill) |
| Multi-channel journeys with SMS/push | **tdx-skills:journey** |
| A/B testing email content | **tdx-skills:journey** |
| Decision points based on behavior | **tdx-skills:journey** |
| Cross-journey navigation (jumps) | **tdx-skills:journey** |
| Basic wait → email → wait patterns | **email-journey-builder** (this skill) |
| Rapid prototyping email flows | **email-journey-builder** (this skill) |
- SQL skills for email delivery analysis