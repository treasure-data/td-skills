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
tdx journey validate --file welcome-journey.yml

# Push journey to TD
tdx journey push --file welcome-journey.yml --description "Initial welcome series"

# View deployed journey
tdx journey view "Welcome Series"

# List all journeys
tdx journey list
```

### Journey Updates
```bash
# Update journey with changes
tdx journey push --file welcome-journey.yml --description "Updated email templates"

# Pull journey to local file
tdx journey pull --name "Welcome Series" --file updated-journey.yml
```

### Journey Monitoring
```bash
# Check journey status
tdx journey view "Welcome Series"

# View recent journey sessions
tdx journey sessions --name "Welcome Series" --limit 10

# Get journey metrics
tdx journey metrics --name "Welcome Series" --period "last_7_days"
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
  if ! tdx journey validate --file "$journey_file"; then
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
  local description="$2"

  # Validate first
  if ! validate_journey "$journey_file"; then
    echo "❌ Validation failed, aborting deployment"
    return 1
  fi

  # Deploy journey
  echo "Deploying journey: $journey_file"
  tdx journey push --file "$journey_file" --description "$description"

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

  # Check recent sessions
  echo "Recent sessions:"
  tdx journey sessions --name "$journey_name" --limit 5

  # Get performance metrics
  echo "Performance metrics:"
  tdx journey metrics --name "$journey_name" --period "last_7_days"
}

# Usage: monitor_journey "Welcome Series"
```

### Email Step Performance
```sql
-- Query email delivery by journey step
SELECT
  custom_event_id as journey_step,
  COUNT(CASE WHEN event_type = 'delivered' THEN 1 END) as delivered,
  COUNT(CASE WHEN event_type = 'opened' THEN 1 END) as opened,
  COUNT(CASE WHEN event_type = 'clicked' THEN 1 END) as clicked
FROM delivery_email_treasuredata_com.events
WHERE
  custom_event_id IN ('welcome_day_1', 'welcome_day_3', 'welcome_day_7')
  AND td_interval(time, '-30d')
GROUP BY custom_event_id
ORDER BY journey_step
```

## Best Practices

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
- **email-campaign-orchestration** - Connect journeys with campaigns
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