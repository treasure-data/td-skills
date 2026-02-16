---
name: engage-utm
description: Guidance for UTM tracking parameter management in TD Engage email campaigns using manual link building, template configuration, and verified analytics queries for campaign performance measurement.
---

# Engage UTM Tracking & Campaign Measurement Guide

## Purpose

Provides guidance for implementing UTM (Urchin Tracking Module) parameters in TD Engage campaigns using **template-level configuration**, **manual link building**, and **SQL analytics** for comprehensive campaign performance tracking and attribution analysis.

## Prerequisites

- `tdx` CLI authenticated (`tdx auth status`)
- TD Engage workspace access
- Email campaigns and templates created
- Analytics platform configured (Google Analytics, Adobe Analytics, etc.)
- Understanding of UTM parameter structure

## ⚠️ Important Note

**UTM configuration is primarily done through email template links**, not via dedicated CLI commands. This skill focuses on **manual UTM implementation** and **template integration** using verified tools.

## UTM Parameter Structure

### Standard UTM Parameters
```bash
# UTM parameter structure for campaign tracking
utm_source=treasuredata          # Traffic source identifier
utm_medium=email                 # Marketing medium (always "email" for TD Engage)
utm_campaign=spring_sale_2024    # Campaign identifier (unique per campaign)
utm_term=premium_customers       # Audience segment (optional)
utm_content=header_cta          # Content variation for A/B testing
```
### UTM Parameter Guidelines
```bash
# UTM naming conventions for TD Engage campaigns
generate_utm_parameters() {
  local campaign_name="$1"
  local content_type="$2"
  local audience="$3"

  # Clean campaign name for UTM use
  utm_campaign=$(echo "$campaign_name" | tr ' ' '_' | tr '[:upper:]' '[:lower:]')

  echo "UTM Parameters for: $campaign_name"
  echo "================================="
  echo "utm_source=treasuredata"
  echo "utm_medium=email"
  echo "utm_campaign=${utm_campaign}"
  echo "utm_content=${content_type}"
  echo "utm_term=${audience}"
}

# Usage: generate_utm_parameters "Newsletter Campaign" "header_cta" "subscribers"
```

## Manual UTM Link Generation

### UTM Link Builder
```bash
# Generate UTM-tagged URLs for email templates
build_utm_link() {
  local base_url="$1"
  local utm_source="$2"
  local utm_medium="$3"
  local utm_campaign="$4"
  local utm_content="$5"
  local utm_term="$6"

  # Build UTM parameters
  utm_params="utm_source=${utm_source}&utm_medium=${utm_medium}&utm_campaign=${utm_campaign}"

  if [ -n "$utm_content" ]; then
    utm_params="${utm_params}&utm_content=${utm_content}"
  fi

  if [ -n "$utm_term" ]; then
    utm_params="${utm_params}&utm_term=${utm_term}"
  fi

  # Combine URL and parameters
  if [[ "$base_url" == *"?"* ]]; then
    echo "${base_url}&${utm_params}"
  else
    echo "${base_url}?${utm_params}"
  fi
}

# Usage: build_utm_link "https://company.com/product" "treasuredata" "email" "spring_sale" "cta_button" "vip_customers"
```

### Bulk UTM Link Generation
```bash
# Generate multiple UTM links for a campaign
generate_campaign_links() {
  local campaign_name="$1"
  local base_domain="$2"

  # Convert campaign name to UTM format
  utm_campaign=$(echo "$campaign_name" | tr ' ' '_' | tr '[:upper:]' '[:lower:]')

  echo "UTM Links for Campaign: $campaign_name"
  echo "======================================"

  # Common landing pages with UTM parameters
  pages=(
    "homepage:/"
    "product:/product/features"
    "pricing:/pricing"
    "signup:/signup"
    "demo:/demo"
  )

  for page in "${pages[@]}"; do
    IFS=':' read -r content_type path <<< "$page"
    full_url="https://${base_domain}${path}"

    utm_link=$(build_utm_link "$full_url" "treasuredata" "email" "$utm_campaign" "$content_type")
    echo "$content_type: $utm_link"
  done
}

# Usage: generate_campaign_links "Newsletter Campaign" "company.com"
```

## Email Template UTM Integration

### Template UTM Configuration (Verified Commands)
```bash
# Prepare UTM links for email template integration
prepare_template_utm_links() {
  local campaign_name="$1"
  local template_name="$2"

  echo "UTM Link Configuration for Template: $template_name"
  echo "Campaign: $campaign_name"
  echo "================================================"

  # Set workspace context (verified command)
  tdx use engage_workspace "Marketing Team"

  # Display current template (verified command)
  echo "Current template structure:"
  tdx engage template show "$template_name"

  echo ""
  echo "UTM Integration Instructions:"
  echo "1. Update template via: tdx engage template update \"$template_name\" --html \"new-content\""
  echo "2. Replace links in HTML with UTM-tagged versions"
  echo "3. Use build_utm_link function to generate tracked URLs"

  # Generate common UTM links for this campaign
  utm_campaign=$(echo "$campaign_name" | tr ' ' '_' | tr '[:upper:]' '[:lower:]')

  echo ""
  echo "Sample UTM links for template:"
  echo "Main CTA: $(build_utm_link "https://company.com" "treasuredata" "email" "$utm_campaign" "main_cta")"
  echo "Learn More: $(build_utm_link "https://company.com/features" "treasuredata" "email" "$utm_campaign" "learn_more")"
  echo "Contact Us: $(build_utm_link "https://company.com/contact" "treasuredata" "email" "$utm_campaign" "contact_link")"
}

# Usage: prepare_template_utm_links "Newsletter Campaign" "Newsletter Template"
```

### Template Update with UTM Links (Verified Commands)
```bash
# Update template with UTM-tagged links using confirmed CLI commands
update_template_with_utm() {
  local template_name="$1"
  local html_file="$2"

  echo "Updating template with UTM links: $template_name"

  # Validate template exists (verified command)
  if ! tdx engage template show "$template_name" >/dev/null 2>&1; then
    echo "❌ Template not found: $template_name"
    return 1
  fi

  # Validate HTML file exists
  if [ ! -f "$html_file" ]; then
    echo "❌ HTML file not found: $html_file"
    return 1
  fi

  echo "Updating template HTML content..."
  # Update template using verified CLI command
  tdx engage template update "$template_name" --html "$(cat "$html_file")"

  if [ $? -eq 0 ]; then
    echo "✅ Template updated with UTM links"
  else
    echo "❌ Template update failed"
    return 1
  fi
}

# Usage: update_template_with_utm "Newsletter Template" "newsletter_with_utm.html"
```

## UTM Analytics & Performance Tracking

### Email Event Analysis with UTM Parameters (Verified SQL)
```sql
-- Analyze email clicks with UTM parameters using verified data tables
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

### Campaign Attribution Analysis (Verified SQL)
```sql
-- Cross-campaign attribution analysis using verified tables
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

### UTM Performance Query Helper
```bash
# Generate UTM performance query using verified CLI
query_utm_performance() {
  local campaign_utm="$1"
  local days="$2"

  echo "Querying UTM performance for: $campaign_utm (last $days days)"

  # Use verified tdx query command
  tdx query <<EOF
SELECT
  utm_campaign,
  utm_content,
  COUNT(CASE WHEN event_type = 'delivered' THEN 1 END) as delivered,
  COUNT(CASE WHEN event_type = 'opened' THEN 1 END) as opened,
  COUNT(CASE WHEN event_type = 'clicked' THEN 1 END) as clicked
FROM delivery_email_treasuredata_com.events
WHERE
  td_interval(time, '-${days}d')
  AND utm_campaign = '$campaign_utm'
GROUP BY utm_campaign, utm_content
ORDER BY delivered DESC
EOF
}

# Usage: query_utm_performance "newsletter_jan2024" "30"
```

## Campaign UTM Strategy

### UTM Naming Conventions
```bash
# Campaign-specific UTM strategies
create_utm_strategy() {
  local campaign_type="$1"  # newsletter, promotion, announcement, welcome
  local time_period="$2"    # jan2024, q1_2024, spring_2024
  local audience="$3"       # all_users, vip, new_customers

  utm_campaign="${campaign_type}_${time_period}_${audience}"

  echo "UTM Strategy for Campaign"
  echo "========================"
  echo "Campaign Type: $campaign_type"
  echo "Time Period: $time_period"
  echo "Audience: $audience"
  echo ""
  echo "UTM Parameters:"
  echo "utm_source=treasuredata"
  echo "utm_medium=email"
  echo "utm_campaign=$utm_campaign"
  echo ""
  echo "Content Variations:"
  echo "utm_content=hero_banner    # Main banner/header CTA"
  echo "utm_content=sidebar_cta    # Secondary sidebar links"
  echo "utm_content=footer_link    # Footer navigation"
  echo "utm_content=product_grid   # Product showcase links"
  echo "utm_content=text_link      # Inline text links"
}

# Usage: create_utm_strategy "newsletter" "jan2024" "subscribers"
```

### A/B Testing UTM Setup
```bash
# Setup UTM parameters for A/B testing
setup_ab_test_utm() {
  local campaign_base="$1"
  local variant_a="$2"
  local variant_b="$3"

  echo "A/B Testing UTM Configuration"
  echo "============================"
  echo "Base Campaign: $campaign_base"
  echo ""

  # Generate UTM for each variant
  utm_base=$(echo "$campaign_base" | tr ' ' '_' | tr '[:upper:]' '[:lower:]')

  echo "Variant A UTM Parameters:"
  echo "utm_campaign=${utm_base}_a"
  echo "utm_content=$variant_a"
  echo ""

  echo "Variant B UTM Parameters:"
  echo "utm_campaign=${utm_base}_b"
  echo "utm_content=$variant_b"
  echo ""

  echo "Sample Links:"
  echo "Variant A: $(build_utm_link "https://company.com" "treasuredata" "email" "${utm_base}_a" "$variant_a")"
  echo "Variant B: $(build_utm_link "https://company.com" "treasuredata" "email" "${utm_base}_b" "$variant_b")"
}

# Usage: setup_ab_test_utm "Spring Sale" "hero_banner_a" "hero_banner_b"
```

## Common Errors & Troubleshooting

### UTM Configuration Errors

| Error | Solution |
|-------|----------|
| "Template update failed with UTM links" | Verify HTML syntax and template exists |
| "UTM parameters not appearing in analytics" | Check analytics tracking code configuration |
| "Invalid UTM parameter format" | Use alphanumeric characters and underscores only |
| "Analytics platform not receiving UTM data" | Verify UTM parameters in actual email clicks |
| "Campaign UTM conflicts in analytics" | Use unique utm_campaign values for each campaign |

### Template Integration Issues

| Error | Solution |
|-------|----------|
| "Links not tracking in email templates" | Ensure all href attributes contain UTM parameters |
| "UTM parameters stripped from links" | Check email client handling and URL format |
| "Template HTML syntax errors with UTMs" | Validate HTML structure before template update |
| "Broken links after UTM addition" | Verify base URLs are accessible and properly encoded |

### Analytics & Tracking Issues

| Error | Solution |
|-------|----------|
| "No UTM data in email event queries" | Check if email events contain UTM fields |
| "UTM campaign attribution missing" | Verify landing page analytics implementation |
| "Cross-platform UTM discrepancies" | Use consistent UTM parameter naming |
| "A/B test UTM conflicts" | Ensure unique utm_content values for each variant |

### Workspace & Context Errors

| Error | Solution |
|-------|----------|
| "Template not found for UTM update" | Verify template exists: `tdx engage template list` |
| "Workspace context not set" | Run `tdx use engage_workspace "Marketing Team"` |
| "Template update permission denied" | Contact workspace admin for template edit permissions |

## Best Practices

### UTM Parameter Management
- Use consistent, lowercase naming conventions for utm_campaign
- Keep UTM parameters under 255 characters each
- Avoid spaces and special characters in UTM values
- Include date/period identifiers for time-based analysis
- Document UTM parameter standards for team reference

### Template Integration
- Always test UTM links before campaign launch
- Use absolute URLs in email templates
- Ensure all clickable elements include appropriate UTM parameters
- Maintain UTM parameter consistency across email variations
- Validate HTML syntax after adding UTM-tagged links

### Analytics Integration
- Map UTM parameters to analytics platform requirements
- Set up goal tracking for campaign conversion measurement
- Configure custom dimensions for additional tracking needs
- Establish regular UTM performance review processes
- Document UTM-to-KPI mapping for stakeholders

## Validation & Reporting

### Pre-Launch UTM Validation
```bash
# Validate UTM implementation before campaign launch
validate_utm_implementation() {
  local campaign_name="$1"
  local template_name="$2"

  echo "UTM Implementation Validation"
  echo "Campaign: $campaign_name"
  echo "Template: $template_name"
  echo "============================"

  # Verify template exists (verified command)
  if ! tdx engage template show "$template_name" >/dev/null 2>&1; then
    echo "❌ Template not found: $template_name"
    return 1
  fi

  # Get template content for UTM analysis
  template_content=$(tdx engage template show "$template_name" --full)

  # Check for UTM parameters in template links
  if echo "$template_content" | grep -q "utm_source=treasuredata"; then
    echo "✅ UTM source parameter found in template"
  else
    echo "⚠️  No UTM source parameter detected"
  fi

  if echo "$template_content" | grep -q "utm_campaign="; then
    echo "✅ UTM campaign parameter found in template"
  else
    echo "⚠️  No UTM campaign parameter detected"
  fi

  # Extract and display UTM links
  echo ""
  echo "UTM Links in Template:"
  echo "$template_content" | grep -o 'https://[^"]*utm_[^"]*' | head -5

  echo ""
  echo "✅ UTM validation completed"
  echo "Verify links work correctly before campaign launch"
}

# Usage: validate_utm_implementation "Newsletter Campaign" "Newsletter Template"
```

## Related Skills

**Template Integration:**
- **email-template-creator** - Create templates with UTM-tagged links
- **email-template-manager** - Manage templates containing UTM parameters

**Campaign Management:**
- **email-campaign-creator** - Launch campaigns with UTM-enabled templates
- **email-testing-validator** - Validate UTM links in campaign testing

**Analytics & Performance:**
- **sql-skills:trino** - Query email event data with UTM filtering
- **engage-deliverability** - Correlate deliverability metrics with UTM performance

**Journey Integration:**
- **email-journey-builder** - Configure UTM tracking for journey email steps
- **tdx-skills:journey** - Apply UTM parameters to journey activation steps
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