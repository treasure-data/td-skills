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
- Understanding of UTM parameters for analytics

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

### Email Event Analysis with UTM
```sql
-- Analyze email clicks by UTM campaign
SELECT
  utm_campaign,
  utm_marketing_tactic,
  COUNT(*) as total_clicks,
  COUNT(DISTINCT email) as unique_clickers,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as click_percentage
FROM delivery_email_treasuredata_com.events
WHERE
  event_type = 'clicked'
  AND td_interval(time, '-30d')
  AND utm_campaign IS NOT NULL
GROUP BY utm_campaign, utm_marketing_tactic
ORDER BY total_clicks DESC
```

### Campaign Performance Analysis
```sql
-- Campaign attribution with open/click rates
SELECT
  utm_campaign,
  utm_marketing_tactic,
  COUNT(CASE WHEN event_type = 'delivered' THEN 1 END) as delivered,
  COUNT(CASE WHEN event_type = 'opened' THEN 1 END) as opened,
  COUNT(CASE WHEN event_type = 'clicked' THEN 1 END) as clicked,
  COUNT(DISTINCT email) as unique_recipients,
  ROUND(COUNT(CASE WHEN event_type = 'opened' THEN 1 END) * 100.0 /
    NULLIF(COUNT(CASE WHEN event_type = 'delivered' THEN 1 END), 0), 2) as open_rate,
  ROUND(COUNT(CASE WHEN event_type = 'clicked' THEN 1 END) * 100.0 /
    NULLIF(COUNT(CASE WHEN event_type = 'opened' THEN 1 END), 0), 2) as click_through_rate
FROM delivery_email_treasuredata_com.events
WHERE
  td_interval(time, '-7d')
  AND utm_campaign IS NOT NULL
GROUP BY utm_campaign, utm_marketing_tactic
ORDER BY delivered DESC
```

### UTM Performance Query Helper
```bash
# Query UTM performance for specific campaign
tdx query "
SELECT
  utm_campaign,
  utm_marketing_tactic,
  COUNT(CASE WHEN event_type = 'delivered' THEN 1 END) as delivered,
  COUNT(CASE WHEN event_type = 'opened' THEN 1 END) as opened,
  COUNT(CASE WHEN event_type = 'clicked' THEN 1 END) as clicked
FROM delivery_email_treasuredata_com.events
WHERE
  td_interval(time, '-7d')
  AND utm_campaign = 'your_campaign_name'
GROUP BY utm_campaign, utm_marketing_tactic
"
```

## Best Practices

### UTM Naming Conventions
- Use lowercase, descriptive campaign names: `newsletter_jan2024`, `spring_sale_2024`
- Avoid spaces and special characters in UTM values
- Include time periods for easier analysis: `welcome_series_q1`, `promo_march2024`
- Keep values under 40 characters (TD Engage limit)

### Analytics Integration
- UTM parameters automatically work with Google Analytics 4 (GA4)
- Configure custom dimensions in GA4 for `utm_source_platform` and `utm_marketing_tactic`
- Use TD event data for detailed email-specific analytics
- Set up regular UTM performance review processes

## Important Notes

- **No CLI commands exist** for UTM configuration - use Engage Studio UI only
- **No manual link building needed** - system handles automatically
- **No template-level UTM** - configuration is per campaign
- **No API access** for UTM settings - UI configuration only

## Related Skills

**Campaign Management:**
- **email-campaign-creator** - Create campaigns that support UTM tracking
- **email-template-creator** - Create templates (UTM applied at campaign level)

**Analytics:**
- **sql-skills:trino** - Query email event data with UTM parameters
- **engage-deliverability** - Analyze deliverability alongside UTM performance