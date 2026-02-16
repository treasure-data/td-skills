---
name: email-campaign-orchestration
description: Orchestrates email campaigns by integrating segments, journeys, templates, and activations for TD Customer Journey Orchestration.
---

# Email Campaign Orchestration

## Purpose

Orchestrates complete email campaigns by connecting existing templates with segments, journeys, and activations. Focuses on campaign lifecycle and journey integration.

## Prerequisites

- `tdx` CLI authenticated (`tdx auth status`)
- Email templates already created (use `email-template-creator` skill)
- Segments configured (use `tdx-skills:segment` or `tdx-skills:parent-segment`)
- TD Engage workspace access

## Orchestration Planning

### Gather Required Components
Before orchestrating, verify these components exist:

```bash
# List available templates
tdx engage template list --workspace "Marketing Team"

# List available segments
tdx sg list

# List existing journeys
tdx journey list

# Check connections for activations
tdx connection list --type email
```

### Workspace Context
```bash
# Set workspace for campaigns
tdx use engage_workspace "Marketing Team"

# Verify workspace access and settings
tdx engage workspace show "Marketing Team"
```

## Campaign Creation & Orchestration

### Always-On Campaign for Journey Integration
```bash
# Create email campaign with existing template
tdx engage campaign create --name "Welcome Campaign" --type email \
  --description "Always-on welcome for journey activation" \
  --segment "segments/marketing/welcome_users" \
  --email-sender-id "verified-sender-uuid"

# Launch campaign to make it available for journey triggers
tdx engage campaign launch "Welcome Campaign"
```

### Campaign Configuration Verification
```bash
# Verify campaign configuration
tdx engage campaign show "Welcome Campaign" --full

# Check campaign status and template linkage
tdx engage campaign list --status ACTIVE --type email

# Test campaign with sample data
tdx engage campaign test "Welcome Campaign" \
  --email "test@treasuredata.com"
```

## Journey Integration & Orchestration

### Email Step Configuration in Journey
```yaml
# journey.yml - Email activation step
- name: "send_welcome_email"
  type: "activation"
  email:
    template_id: "welcome-day-1"
    sender_id: "verified-sender-uuid"
    custom_event_id: "onboarding_welcome"
  personalization:
    profile.first_name: "{{ customer.first_name }}"
    company.name: "Treasure Data"
    cta.url: "https://app.treasuredata.com/onboarding"
```

### Journey Orchestration Workflow
```bash
# 1. Validate journey configuration with email steps
tdx journey validate --file onboarding-journey.yml

# 2. Check segment alignment between campaign and journey
tdx sg view "welcome_users" --format table
tdx engage campaign show "Welcome Campaign" | grep segment

# 3. Deploy journey with email activations
tdx journey push --file onboarding-journey.yml \
  --description "Added welcome email activation"

# 4. Verify journey deployment
tdx journey view "onboarding" --full
```

### Multi-Step Email Journey Orchestration
```yaml
# Complex journey with email series
steps:
  - name: "day_1_welcome"
    type: "activation"
    email:
      template_id: "welcome-day-1"
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
      custom_event_id: "welcome_day_7"
```

## Testing and Validation

### Template Testing
```bash
# Show template details with test data
tdx engage template show "Welcome Day 1"

# Send test email
tdx engage campaign test "Welcome Campaign" \
  --email "test@treasuredata.com" \
  --template "Welcome Day 1"
```

### Journey Testing
```bash
# Test journey flow
tdx journey test --name "onboarding" \
  --customer-id "test_customer_123" \
  --dry-run
```

## Orchestration Monitoring & Performance

### End-to-End Campaign Performance
```sql
-- Monitor email delivery across journey steps
SELECT
  custom_event_id,
  event_type,
  COUNT(*) as count,
  COUNT(DISTINCT email) as unique_recipients,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM delivery_email_treasuredata_com.events
WHERE
  custom_event_id IN ('welcome_day_1', 'welcome_day_3', 'welcome_day_7')
  AND td_interval(time, '-7d', NULL)
GROUP BY custom_event_id, event_type
ORDER BY custom_event_id, event_type
```

### Journey & Campaign Health Check
```bash
# Check journey execution metrics
tdx journey metrics --name "onboarding" --period "last_7_days"

# Verify campaign performance
tdx engage campaign show "Welcome Campaign" --full | grep -E "(status|delivery)"

# Monitor recent journey sessions
tdx journey sessions --name "onboarding" --limit 10

# Check email delivery rates by step
tdx query -f table -q "
SELECT
  custom_event_id,
  SUM(CASE WHEN event_type = 'delivered' THEN 1 ELSE 0 END) as delivered,
  SUM(CASE WHEN event_type = 'opened' THEN 1 ELSE 0 END) as opened,
  SUM(CASE WHEN event_type = 'clicked' THEN 1 ELSE 0 END) as clicked
FROM delivery_email_treasuredata_com.events
WHERE td_interval(time, '-24h')
GROUP BY custom_event_id
"
```

## Orchestration Patterns

### Welcome Series Orchestration
```bash
# 1. Verify all templates exist
tdx engage template list | grep -E "(Welcome Day [137]|welcome-day-[137])"

# 2. Create always-on campaign for each template
tdx engage campaign create --name "Welcome Day 1 Campaign" --type email \
  --description "Always-on for welcome day 1" \
  --segment "segments/marketing/new_users"

tdx engage campaign create --name "Welcome Day 3 Campaign" --type email \
  --description "Always-on for welcome day 3" \
  --segment "segments/marketing/new_users"

tdx engage campaign create --name "Welcome Day 7 Campaign" --type email \
  --description "Always-on for welcome day 7" \
  --segment "segments/marketing/new_users"

# 3. Launch all campaigns
tdx engage campaign launch "Welcome Day 1 Campaign"
tdx engage campaign launch "Welcome Day 3 Campaign"
tdx engage campaign launch "Welcome Day 7 Campaign"

# 4. Deploy journey connecting all steps
tdx journey push --file welcome-series-journey.yml
```

### Abandoned Cart Recovery Orchestration
```bash
# Multi-step recovery campaign setup
tdx engage campaign create --name "Cart Reminder 1h Campaign" --type email \
  --segment "segments/ecommerce/abandoned_cart"

tdx engage campaign create --name "Cart Reminder 24h Campaign" --type email \
  --segment "segments/ecommerce/abandoned_cart"

tdx engage campaign create --name "Cart Reminder 3d Campaign" --type email \
  --segment "segments/ecommerce/abandoned_cart_discount"

# Journey orchestration with conditional paths
tdx journey push --file abandoned-cart-recovery-journey.yml
```

## Best Practices for Orchestration

### Campaign Architecture
- Create one always-on campaign per email template for journey flexibility
- Use descriptive campaign names that match journey step names
- Ensure parent segments align between campaigns and journeys
- Keep campaigns in ACTIVE status for journey triggers

### Journey Integration
- Set custom event IDs for tracking: `custom_event_id: "step_name"`
- Use consistent naming between journey steps and campaigns
- Test journey execution with small segments before full deployment
- Monitor email delivery events for each journey step

### Performance Optimization
- Monitor delivery rates across all journey email steps
- Set up alerts for campaign failures or low engagement
- Use A/B testing at the template level, not campaign level
- Regularly clean up unused campaigns and templates

## Related Skills

**Template Creation & Management:**
- **email-template-creator** - Create and customize email templates
- **email-template-manager** - Manage template library and versions

**Campaign & Audience:**
- **email-campaign-creator** - Create individual email campaigns
- **tdx-skills:segment** - Create and manage audience segments
- **tdx-skills:parent-segment** - Manage parent segment configurations

**Journey & Automation:**
- **email-journey-builder** - Design email-specific journey flows (simple patterns)
- **tdx-skills:journey** - Comprehensive CDP journey orchestration (advanced patterns)
  - **Use tdx-skills:journey when you need:**
    - Multi-channel journeys (email + SMS + push)
    - A/B testing different email content
    - Decision points based on customer behavior
    - Complex multi-stage journey architecture
    - Cross-journey navigation and jumps
  - **Use email-journey-builder for:**
    - Simple email sequences (welcome series, newsletters)
    - Rapid email workflow prototyping
    - Basic wait → email → wait patterns
- **tdx-skills:connector-config** - Configure email sender settings and advanced connectors
- **tdx-skills:validate-journey** - Validate complex journey YAML structures

**Testing & Optimization:**
- **email-testing-validator** - Test and validate email campaigns
- **email-performance-monitor** - Monitor email performance metrics

**Workflow Selection Guide:**

| Complexity Level | Recommended Skills Combination |
|-----------------|-------------------------------|
| **Basic Email Campaign** | email-template-creator → email-campaign-creator |
| **Simple Email Series** | email-template-creator → email-journey-builder → email-campaign-creator |
| **Complete Email Orchestration** | All engage-skills together (this skill) |
| **Advanced Multi-Channel** | engage-skills + **tdx-skills:journey** + **tdx-skills:connector-config** |
- **email-performance-monitor** - Monitor email performance metrics