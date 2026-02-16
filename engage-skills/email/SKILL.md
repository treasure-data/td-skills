---
name: email
description: End-to-end email creation workflow combining segment data, journey context, email templates via tdx engage, and journey activations for TD Customer Journey Orchestration.
---

# Email Workflow Automation

## Prerequisites

Before using this skill, ensure you have:
- `tdx` CLI installed and authenticated (`tdx auth status`)
- Access to TD Engage with appropriate workspace permissions
- Parent segments configured for email campaigns

## Workflow Overview

Complete email campaign creation combining:
- Segment data for targeting
- Journey context for timing
- Template creation via `tdx engage`
- Journey integration for activation

## Context Gathering

```bash
# Get segment information
tdx sg list marketing
tdx sg view "welcome_users"

# Get journey details
tdx journey list
tdx journey view "onboarding"

# Set workspace context
tdx use engage_workspace "Marketing Team"
```

## Email Template Creation

### Basic Template
```bash
tdx engage template create --name "Welcome Day 1" \
  --subject "Welcome {{ profile.first_name }}!" \
  --html "$(cat templates/welcome.html)" \
  --plaintext "Welcome {{ profile.first_name }}! Get started: {{ cta.url }}" \
  --workspace "Marketing Team"
```

### Template with Personalization
```html
<!-- templates/welcome.html -->
<html>
<body style="font-family: Arial; max-width: 600px; margin: 0 auto;">
  <h1>Welcome {{ profile.first_name }}!</h1>
  <p>Thank you for joining {{ company.name }}.</p>

  <div style="text-align: center; margin: 30px 0;">
    <a href="{{ cta.url }}"
       style="background: #007cba; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px;">
      Get Started
    </a>
  </div>

  <p><a href="{{ unsubscribe.url }}">Unsubscribe</a></p>
</body>
</html>
```

### Template Management
```bash
# List templates
tdx engage template list --workspace "Marketing Team"

# View template details
tdx engage template show "Welcome Day 1" --full

# Update template
tdx engage template update "Welcome Day 1" \
  --subject "New: Welcome {{ profile.first_name }}!"
```

## Campaign Creation

### Always-On Campaign for Journey Integration
```bash
# Create email campaign
tdx engage campaign create --name "Welcome Campaign" --type email \
  --description "Always-on welcome for journey activation" \
  --segment "segments/marketing/welcome_users" \
  --email-sender-id "verified-sender-uuid"

# Launch campaign
tdx engage campaign launch "Welcome Campaign"
```

### Campaign Management
```bash
# List campaigns
tdx engage campaign list --type email --status ACTIVE

# View campaign details
tdx engage campaign show "Welcome Campaign" --full

# Pause/resume campaigns
tdx engage campaign pause "Welcome Campaign"
tdx engage campaign resume "Welcome Campaign"
```

## Journey Integration

### Email Step Configuration
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

### Journey Deployment
```bash
# Validate journey with email step
tdx journey validate --file onboarding-journey.yml

# Push journey configuration
tdx journey push --file onboarding-journey.yml \
  --description "Added welcome email activation"
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

## Performance Monitoring

### Email Metrics Query
```sql
-- Query email delivery metrics
SELECT
  event_type,
  COUNT(*) as count,
  COUNT(DISTINCT email) as unique_recipients
FROM delivery_email_treasuredata_com.events
WHERE
  custom_event_id = 'onboarding_welcome'
  AND td_interval(time, '-7d', NULL)
GROUP BY event_type
```

### Journey Performance
```bash
# Monitor journey metrics
tdx journey metrics --name "onboarding" --period "last_7_days"

# Check recent journey sessions
tdx journey sessions --name "onboarding" --limit 10
```

## Email Workflow Patterns

### Welcome Series (3 emails)
```bash
# Day 1: Welcome + setup
tdx engage template create --name "Welcome Day 1" \
  --subject "Welcome {{ profile.first_name }}!" \
  --html "$(cat welcome-day1.html)"

# Day 3: Feature introduction
tdx engage template create --name "Welcome Day 3" \
  --subject "Explore {{ product.name }} features" \
  --html "$(cat welcome-day3.html)"

# Day 7: Success tips
tdx engage template create --name "Welcome Day 7" \
  --subject "Tips for success with {{ product.name }}" \
  --html "$(cat welcome-day7.html)"
```

### Abandoned Cart Recovery
```bash
# 1 hour after
tdx engage template create --name "Cart Reminder 1h" \
  --subject "Did you forget something?"

# 24 hours after
tdx engage template create --name "Cart Reminder 24h" \
  --subject "Complete your purchase"

# 3 days with discount
tdx engage template create --name "Cart Reminder 3d" \
  --subject "Last chance - 10% off"
```

## Common Email Merge Tags

| Tag | Description | Example |
|-----|-------------|---------|
| `{{ profile.first_name }}` | Customer first name | John |
| `{{ profile.email }}` | Customer email | john@example.com |
| `{{ company.name }}` | Company name | Treasure Data |
| `{{ product.name }}` | Product name | Customer Data Platform |
| `{{ cta.url }}` | Call-to-action URL | https://app.treasuredata.com |
| `{{ unsubscribe.url }}` | Unsubscribe link | Auto-generated |

## Best Practices

### Email Content
- Keep subject lines under 50 characters
- Include both HTML and plaintext versions
- Use single, clear call-to-action
- Personalize with customer data
- Test across email clients

### Technical Implementation
- Set custom event IDs for tracking: `custom_event_id: "campaign_name"`
- Use descriptive template names: "Welcome Series - Day 1"
- Align parent segments between campaigns and journeys
- Test email rendering before production

### Journey Integration
- Create always-on campaigns for journey activation
- Use same parent segment for campaigns and journeys
- Configure proper sender authentication
- Monitor email delivery events table

## Troubleshooting

### Template Issues
```bash
# Template not found
tdx engage template list --workspace "Marketing Team"  # Verify exists

# Personalization not working
tdx engage template show "Template Name"  # Check template content and merge tags
```

### Campaign Problems
```bash
# Campaign not launching
tdx engage campaign show "Campaign Name" --full  # Check status and config

# Low delivery rates
# Check sender authentication and email reputation
```

### Journey Integration
```bash
# Email step not triggering
tdx journey view "journey_name"  # Verify parent segment alignment
tdx engage campaign show "campaign_name"    # Check campaign is active
```

## Related Skills

- **tdx-skills/segment** - Segment creation and management
- **tdx-skills/journey** - Customer Journey Orchestration
- **tdx-skills/connector-config** - External platform activations