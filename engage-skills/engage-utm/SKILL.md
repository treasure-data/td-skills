---
name: engage-utm
description: UTM tracking configuration for TD Engage email campaigns using built-in UI settings and analytics queries for campaign performance measurement.
---

# Engage UTM Tracking

## Purpose

Provides guidance for TD Engage's built-in UTM tracking functionality and analytics queries for campaign performance measurement.

## Prerequisites

- TD Engage workspace access
- Email campaigns created in Engage Studio

## UTM Configuration (UI Only)

### Enable UTM Tracking
UTM tracking is configured per campaign in Engage Studio:

1. Open campaign in Engage Studio
2. Navigate to **UTM Tracking** tab
3. Enable UTM tracking
4. Configure available parameters:
   - **utm_campaign**: Campaign identifier (e.g., "spring_sale", "newsletter_jan2024")
   - **utm_marketing_tactic**: Targeting approach (e.g., "remarketing", "prospecting")

### Fixed UTM Parameters
TD Engage automatically sets these parameters (not configurable):
- `utm_source=treasuredata` (always)
- `utm_medium=email` (always)
- `utm_source_platform=treasuredata` (always)
- `utm_id={campaign_id}` (auto-generated)

### Automatic Link Processing
- System automatically appends UTM parameters to all email links
- Skips links with existing UTM parameters (no overwriting)
- Excludes `mailto:` and `#` anchor links

## Analytics & Performance Tracking

**Important:** UTM parameters are appended to link URLs, not stored as separate columns.
Use `click_link` to extract UTM values. Find your database with: `tdx databases "*delivery_email*"`

### Discover Event Table Schema
```bash
# Find delivery email database
tdx databases "*delivery_email*"

# View events table schema to see available columns
tdx describe events --in {delivery_email_database}

# Preview sample event data
tdx show events --in {delivery_email_database}
```

### Email Click Analysis with UTM
```sql
-- Analyze email clicks by UTM campaign (extracted from click_link URL)
SELECT
  regexp_extract(click_link, 'utm_campaign=([^&]+)', 1) as utm_campaign,
  regexp_extract(click_link, 'utm_marketing_tactic=([^&]+)', 1) as utm_marketing_tactic,
  COUNT(*) as total_clicks,
  COUNT(DISTINCT to_plain_address) as unique_clickers,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as click_percentage
FROM {delivery_email_database}.events
WHERE
  event_type = 'Click'
  AND td_interval(time, '-30d')
  AND click_link LIKE '%utm_campaign=%'
GROUP BY 1, 2
ORDER BY total_clicks DESC
```

### Campaign Performance Analysis
```sql
-- Campaign performance with open/click rates
-- Note: UTM params only exist on Click events (in click_link)
-- Use campaign_name for cross-event analysis
SELECT
  campaign_name,
  COUNT(CASE WHEN event_type = 'Delivery' THEN 1 END) as delivered,
  COUNT(CASE WHEN event_type = 'Open' THEN 1 END) as opened,
  COUNT(CASE WHEN event_type = 'Click' THEN 1 END) as clicked,
  COUNT(DISTINCT to_plain_address) as unique_recipients,
  ROUND(COUNT(CASE WHEN event_type = 'Open' THEN 1 END) * 100.0 /
    NULLIF(COUNT(CASE WHEN event_type = 'Delivery' THEN 1 END), 0), 2) as open_rate,
  ROUND(COUNT(CASE WHEN event_type = 'Click' THEN 1 END) * 100.0 /
    NULLIF(COUNT(CASE WHEN event_type = 'Open' THEN 1 END), 0), 2) as click_through_rate
FROM {delivery_email_database}.events
WHERE
  td_interval(time, '-7d')
  AND campaign_name IS NOT NULL
GROUP BY campaign_name
ORDER BY delivered DESC
```

### UTM Performance Query Helper
```bash
# Query UTM click performance for a specific campaign
tdx query "
SELECT
  regexp_extract(click_link, 'utm_campaign=([^&]+)', 1) as utm_campaign,
  regexp_extract(click_link, 'utm_marketing_tactic=([^&]+)', 1) as utm_marketing_tactic,
  COUNT(*) as clicks
FROM {delivery_email_database}.events
WHERE
  event_type = 'Click'
  AND td_interval(time, '-7d')
  AND click_link LIKE '%utm_campaign=your_campaign_name%'
GROUP BY 1, 2
"
```

## Best Practices

### UTM Naming Conventions
- Use lowercase, no spaces: `newsletter_jan2024`, `spring_sale_2024`
- Include time periods: `welcome_series_q1`, `promo_march2024`
- Keep values under 40 characters (TD Engage limit)

## Important Notes

- **No CLI commands exist** for UTM configuration - use Engage Studio UI only
- **No manual link building needed** - system handles automatically
- **No template-level UTM** - configuration is per campaign
- **No API access** for UTM settings - UI configuration only

## Related Skills

**Campaign Management:**
- **email-campaign-creator** - Create campaigns that support UTM tracking
- **email-template** - Create templates (UTM applied at campaign level)

**Analytics:**
- **sql-skills:trino** - Query email event data with UTM parameters
- **engage-deliverability** - Analyze deliverability alongside UTM performance