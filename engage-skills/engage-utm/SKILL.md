---
name: engage-utm
description: Configures UTM tracking parameters for TD Engage email campaigns using tdx engage commands and API integration for campaign performance measurement and attribution.
---

# Engage UTM Tracking & Campaign Measurement

## Purpose

Configures UTM (Urchin Tracking Module) parameters for TD Engage campaigns to enable comprehensive campaign performance tracking, attribution analysis, and ROI measurement in analytics platforms.

## Prerequisites

- `tdx` CLI authenticated (`tdx auth status`)
- TD Engage workspace access
- Email campaigns created (use `email-campaign-creator`)
- Analytics platform configured (Google Analytics, Adobe Analytics, etc.)
- Understanding of UTM parameter structure

## UTM Parameter Overview

### Standard UTM Parameters
```bash
# UTM parameter structure for campaign tracking
utm_source=treasuredata          # Traffic source
utm_medium=email                 # Marketing medium
utm_campaign=spring_sale         # Campaign identifier
utm_term=premium_customers       # Paid keyword (optional)
utm_content=header_cta          # Content variation (A/B testing)
```

### TD Engage UTM Configuration
```bash
# Configure UTM tracking for campaign via API
tdx api "/workspaces/{workspace-id}/campaigns/{campaign-id}" --type engage --method PATCH --data '{
  "data": {
    "type": "campaigns",
    "id": "{campaign-id}",
    "attributes": {
      "utm_tracking": {
        "enabled": true,
        "utm_source": "treasuredata",
        "utm_medium": "email",
        "utm_campaign": "spring_sale_2024",
        "utm_term": "vip_customers",
        "utm_content": "primary_cta"
      }
    }
  }
}'
```

## Campaign UTM Configuration

### Basic UTM Setup for Email Campaigns
```bash
# Set workspace context
tdx use engage_workspace "Marketing Team"

# Enable UTM tracking for existing campaign
enable_utm_tracking() {
  local campaign_name="$1"
  local utm_campaign="$2"
  local utm_content="$3"

  # Get campaign ID
  campaign_id=$(tdx engage campaign show "$campaign_name" --json | jq '.data.id' -r)
  workspace_id=$(tdx engage workspace show --json | jq '.data.id' -r)

  echo "Enabling UTM tracking for: $campaign_name"
  echo "Campaign: $utm_campaign, Content: $utm_content"

  tdx api "/workspaces/$workspace_id/campaigns/$campaign_id" --type engage --method PATCH --data "{
    \"data\": {
      \"type\": \"campaigns\",
      \"id\": \"$campaign_id\",
      \"attributes\": {
        \"utm_tracking\": {
          \"enabled\": true,
          \"utm_source\": \"treasuredata\",
          \"utm_medium\": \"email\",
          \"utm_campaign\": \"$utm_campaign\",
          \"utm_content\": \"$utm_content\"
        }
      }
    }
  }"
}

# Usage: enable_utm_tracking "Newsletter Campaign" "monthly_newsletter_jan2024" "main_cta"
```

### Advanced UTM Configuration
```bash
# Configure UTM with all parameters
configure_advanced_utm() {
  local campaign_name="$1"
  local utm_campaign="$2"
  local utm_term="$3"
  local utm_content="$4"

  campaign_id=$(tdx engage campaign show "$campaign_name" --json | jq '.data.id' -r)
  workspace_id=$(tdx engage workspace show --json | jq '.data.id' -r)

  echo "Configuring advanced UTM tracking..."

  tdx api "/workspaces/$workspace_id/campaigns/$campaign_id" --type engage --method PATCH --data "{
    \"data\": {
      \"type\": \"campaigns\",
      \"id\": \"$campaign_id\",
      \"attributes\": {
        \"utm_tracking\": {
          \"enabled\": true,
          \"utm_source\": \"treasuredata\",
          \"utm_medium\": \"email\",
          \"utm_campaign\": \"$utm_campaign\",
          \"utm_term\": \"$utm_term\",
          \"utm_content\": \"$utm_content\",
          \"campaign_tactic\": \"remarketing\"
        }
      }
    }
  }"
}

# Usage: configure_advanced_utm "VIP Promotion" "vip_spring_sale" "premium_customers" "hero_banner"
```

## UTM Parameter Strategies

### Campaign Naming Conventions
```bash
# Consistent UTM campaign naming patterns
create_utm_campaign_name() {
  local campaign_type="$1"    # newsletter, promotion, announcement
  local time_period="$2"      # jan2024, q1_2024, spring_2024
  local audience="$3"         # vip, new_customers, all_users

  echo "${campaign_type}_${time_period}_${audience}"
}

# Examples:
# newsletter_jan2024_all_users
# promotion_spring2024_vip
# announcement_q1_2024_new_customers
```

### Content Variation Tracking
```bash
# A/B testing UTM content parameters
utm_content_patterns=(
  "hero_banner_a"
  "hero_banner_b"
  "sidebar_cta"
  "footer_link"
  "email_header"
  "product_grid"
  "text_link"
)

# Configure A/B test variations
setup_ab_test_utm() {
  local base_campaign="$1"
  local variant_a_content="$2"
  local variant_b_content="$3"

  echo "Setting up A/B test UTM tracking:"
  echo "Variant A: $variant_a_content"
  echo "Variant B: $variant_b_content"

  # Configure variant A
  configure_advanced_utm "${base_campaign}_A" "$base_campaign" "ab_test" "$variant_a_content"

  # Configure variant B
  configure_advanced_utm "${base_campaign}_B" "$base_campaign" "ab_test" "$variant_b_content"
}

# Usage: setup_ab_test_utm "spring_sale" "hero_banner_a" "hero_banner_b"
```

## UTM Link Generation & Validation

### Manual UTM Link Building
```bash
# Generate UTM-tagged URL
generate_utm_link() {
  local base_url="$1"
  local utm_source="$2"
  local utm_medium="$3"
  local utm_campaign="$4"
  local utm_content="$5"

  echo "${base_url}?utm_source=${utm_source}&utm_medium=${utm_medium}&utm_campaign=${utm_campaign}&utm_content=${utm_content}"
}

# Usage: generate_utm_link "https://company.com/product" "treasuredata" "email" "spring_sale" "cta_button"
```

### UTM Validation
```bash
# Validate UTM configuration for campaign
validate_utm_setup() {
  local campaign_name="$1"

  echo "Validating UTM setup for: $campaign_name"

  campaign_info=$(tdx engage campaign show "$campaign_name" --json)
  utm_enabled=$(echo "$campaign_info" | jq '.data.attributes.utm_tracking.enabled' 2>/dev/null)

  if [ "$utm_enabled" = "true" ]; then
    echo "✅ UTM tracking enabled"

    # Show UTM configuration
    echo "UTM Configuration:"
    echo "$campaign_info" | jq '.data.attributes.utm_tracking' 2>/dev/null || echo "UTM details not available"
  else
    echo "❌ UTM tracking not enabled"
    return 1
  fi
}

# Usage: validate_utm_setup "Newsletter Campaign"
```

## Campaign Performance Tracking

### Email Event UTM Analysis
```sql
-- Analyze email clicks with UTM parameters
SELECT
  utm_campaign,
  utm_content,
  COUNT(*) as total_clicks,
  COUNT(DISTINCT email) as unique_clickers,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as click_percentage
FROM delivery_email_treasuredata_com.events
WHERE
  event_type = 'clicked'
  AND td_interval(time, '-30d')
  AND utm_campaign IS NOT NULL
GROUP BY utm_campaign, utm_content
ORDER BY total_clicks DESC
```

### Campaign Attribution Analysis
```sql
-- Cross-campaign attribution analysis
WITH campaign_performance AS (
  SELECT
    utm_campaign,
    utm_medium,
    utm_content,
    COUNT(CASE WHEN event_type = 'delivered' THEN 1 END) as delivered,
    COUNT(CASE WHEN event_type = 'opened' THEN 1 END) as opened,
    COUNT(CASE WHEN event_type = 'clicked' THEN 1 END) as clicked,
    COUNT(DISTINCT email) as unique_recipients
  FROM delivery_email_treasuredata_com.events
  WHERE
    td_interval(time, '-7d')
    AND utm_campaign IS NOT NULL
  GROUP BY utm_campaign, utm_medium, utm_content
)
SELECT
  utm_campaign,
  utm_content,
  delivered,
  opened,
  clicked,
  unique_recipients,
  ROUND(opened * 100.0 / NULLIF(delivered, 0), 2) as open_rate,
  ROUND(clicked * 100.0 / NULLIF(opened, 0), 2) as click_through_rate
FROM campaign_performance
ORDER BY delivered DESC
```

## Integration with Analytics Platforms

### Google Analytics 4 (GA4) Integration
```bash
# Configure GA4-compatible UTM parameters
configure_ga4_utm() {
  local campaign_name="$1"
  local ga4_campaign_id="$2"
  local ga4_content_group="$3"

  echo "Configuring GA4-compatible UTM parameters..."

  campaign_id=$(tdx engage campaign show "$campaign_name" --json | jq '.data.id' -r)
  workspace_id=$(tdx engage workspace show --json | jq '.data.id' -r)

  tdx api "/workspaces/$workspace_id/campaigns/$campaign_id" --type engage --method PATCH --data "{
    \"data\": {
      \"type\": \"campaigns\",
      \"id\": \"$campaign_id\",
      \"attributes\": {
        \"utm_tracking\": {
          \"enabled\": true,
          \"utm_source\": \"treasuredata\",
          \"utm_medium\": \"email\",
          \"utm_campaign\": \"$ga4_campaign_id\",
          \"utm_content\": \"$ga4_content_group\",
          \"utm_id\": \"td_${campaign_id}\"
        }
      }
    }
  }"
}

# Usage: configure_ga4_utm "Holiday Sale" "holiday_2024" "email_promotion"
```

### Adobe Analytics Integration
```bash
# Configure Adobe Analytics-compatible tracking
configure_adobe_utm() {
  local campaign_name="$1"
  local adobe_tracking_code="$2"

  echo "Configuring Adobe Analytics UTM parameters..."

  campaign_id=$(tdx engage campaign show "$campaign_name" --json | jq '.data.id' -r)
  workspace_id=$(tdx engage workspace show --json | jq '.data.id' -r)

  tdx api "/workspaces/$workspace_id/campaigns/$campaign_id" --type engage --method PATCH --data "{
    \"data\": {
      \"type\": \"campaigns\",
      \"id\": \"$campaign_id\",
      \"attributes\": {
        \"utm_tracking\": {
          \"enabled\": true,
          \"utm_source\": \"treasuredata\",
          \"utm_medium\": \"email\",
          \"utm_campaign\": \"$adobe_tracking_code\",
          \"campaign_tactic\": \"email_marketing\"
        }
      }
    }
  }"
}

# Usage: configure_adobe_utm "Product Launch" "prod_launch_q1_2024"
```

## Bulk UTM Configuration

### Campaign UTM Batch Operations
```bash
# Apply UTM configuration to multiple campaigns
bulk_configure_utm() {
  local campaign_pattern="$1"  # Glob pattern for campaign names
  local utm_campaign_base="$2"
  local utm_term="$3"

  echo "Configuring UTM for campaigns matching: $campaign_pattern"

  # List matching campaigns
  tdx engage campaign list --format tsv | grep "$campaign_pattern" | while read -r uuid name; do
    echo "Configuring UTM for: $name"

    utm_campaign="${utm_campaign_base}_$(echo "$name" | tr ' ' '_' | tr '[:upper:]' '[:lower:]')"
    utm_content="email_$(date +%m%d%y)"

    configure_advanced_utm "$name" "$utm_campaign" "$utm_term" "$utm_content"

    sleep 1  # Rate limiting
  done
}

# Usage: bulk_configure_utm "Newsletter*" "newsletter_series" "subscribers"
```

### UTM Template Management
```bash
# Create UTM configuration templates
utm_templates=(
  "newsletter:newsletter_{date}:subscribers:main_content"
  "promotion:promo_{campaign_id}:targeted:cta_button"
  "announcement:announce_{type}:all_users:header_banner"
  "welcome:welcome_{sequence}:new_users:onboarding_link"
)

# Apply UTM template to campaign
apply_utm_template() {
  local campaign_name="$1"
  local template_type="$2"
  local campaign_id="$3"

  # Find matching template
  template=$(printf '%s\n' "${utm_templates[@]}" | grep "^${template_type}:")

  if [ -n "$template" ]; then
    IFS=':' read -r type utm_campaign utm_term utm_content <<< "$template"

    # Substitute variables
    utm_campaign="${utm_campaign/\{date\}/$(date +%b%Y)}"
    utm_campaign="${utm_campaign/\{campaign_id\}/$campaign_id}"

    echo "Applying $type template to $campaign_name"
    configure_advanced_utm "$campaign_name" "$utm_campaign" "$utm_term" "$utm_content"
  else
    echo "Template not found: $template_type"
    return 1
  fi
}

# Usage: apply_utm_template "Monthly Newsletter" "newsletter" "jan2024"
```

## Common Errors & Troubleshooting

### UTM Configuration Errors

| Error | Solution |
|-------|----------|
| "UTM tracking not enabled" | Enable UTM tracking in campaign configuration |
| "Invalid UTM parameter format" | Check UTM parameter values contain no spaces or special characters |
| "Campaign not found for UTM update" | Verify campaign name and workspace context |
| "UTM parameters too long" | Shorten UTM parameter values (max 255 characters each) |
| "Analytics platform not receiving data" | Verify UTM parameters match analytics configuration |

### Campaign Tracking Issues

| Error | Solution |
|-------|----------|
| "UTM parameters not appearing in links" | Check email template contains proper link formatting |
| "Duplicate UTM campaigns in analytics" | Use unique utm_campaign values for each campaign |
| "Missing click tracking data" | Ensure email template links include UTM parameters |
| "UTM content not differentiated" | Use unique utm_content values for A/B testing |

### Analytics Integration Issues

| Error | Solution |
|-------|----------|
| "GA4 not receiving campaign data" | Verify GA4 tracking ID configuration |
| "Adobe Analytics attribution missing" | Check Adobe tracking code format |
| "Cross-platform attribution conflicts" | Use consistent UTM parameter naming |
| "ROI calculation discrepancies" | Validate UTM parameter mapping in analytics platform |

## Best Practices

### UTM Parameter Naming
- Use consistent, descriptive naming conventions
- Avoid spaces and special characters in UTM values
- Keep UTM parameters under 255 characters each
- Use lowercase for consistency across platforms
- Include date/period identifiers for time-based analysis

### Campaign Tracking Strategy
- Create unique utm_campaign values for each distinct campaign
- Use utm_content to differentiate A/B test variations
- Apply utm_term for audience segmentation tracking
- Maintain UTM parameter documentation for team reference
- Implement UTM validation before campaign launch

### Analytics Integration
- Map UTM parameters to analytics platform requirements
- Set up custom dimensions for additional tracking needs
- Configure goal tracking for campaign conversion measurement
- Establish regular UTM performance review processes
- Document UTM-to-KPI mapping for stakeholders

## Validation & Reporting

### Pre-Launch UTM Validation
```bash
# Comprehensive UTM validation
validate_campaign_utm() {
  local campaign_name="$1"

  echo "Validating UTM configuration for: $campaign_name"

  # Check UTM configuration
  if ! validate_utm_setup "$campaign_name"; then
    return 1
  fi

  # Verify analytics integration
  echo "Checking analytics integration..."

  # Test UTM link generation
  campaign_info=$(tdx engage campaign show "$campaign_name" --json)
  utm_campaign=$(echo "$campaign_info" | jq '.data.attributes.utm_tracking.utm_campaign' -r)

  if [ "$utm_campaign" != "null" ]; then
    echo "✅ UTM campaign parameter configured: $utm_campaign"
  else
    echo "❌ UTM campaign parameter missing"
    return 1
  fi

  echo "✅ UTM validation complete"
}

# Usage: validate_campaign_utm "Spring Sale Campaign"
```

## Related Skills

**Campaign Integration:**
- **email-campaign-creator** - Configure UTM tracking for email campaigns
- **email-template-creator** - Ensure email templates support UTM parameter insertion

**Performance Analysis:**
- **engage-events** - Analyze email events with UTM attribution
- **sql-skills:trino** - Query campaign performance data with UTM filtering

**Journey Integration:**
- **email-journey-builder** - Configure UTM tracking for journey email steps
- **tdx-skills:journey** - Apply UTM parameters to journey activation steps

**Advanced Analytics:**
- **engage-deliverability** - Correlate deliverability metrics with UTM performance
- **engage-workspace-advanced** - Set workspace-level UTM defaults and policies