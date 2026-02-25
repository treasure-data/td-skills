---
name: engage-deliverability
description: Email deliverability guidance for TD Engage campaigns using built-in authentication and monitoring tools for domain configuration, reputation tracking, and performance optimization.
---

# Engage Email Deliverability

## Purpose

Provides guidance for TD Engage's built-in email deliverability features including automatic authentication setup, domain configuration, and performance monitoring.

## Prerequisites

- TD Engage workspace access with domain management permissions
- Domain ownership and DNS configuration access
- IT team coordination for DNS record updates

## Domain Authentication Setup

**For domain configuration steps, use the `engage-sender` skill.**

TD Engage Studio automatically handles SPF, DKIM, DMARC, and IP warming (via Amazon SES) once domains are properly configured.

## Monitoring & Analytics

**Note:** Find your database with: `tdx databases "*delivery_email*"`

### Discover Event Table Schema
```bash
# Find delivery email database
tdx databases "*delivery_email*"

# View events table columns (event_type, to_plain_address, click_link, etc.)
tdx describe events --in {delivery_email_database}

# Preview sample event data
tdx show events --in {delivery_email_database}
```

### Delivery Performance Analysis
```sql
-- Email delivery performance by campaign
SELECT
  campaign_name,
  COUNT(CASE WHEN event_type = 'Delivery' THEN 1 END) as delivered,
  COUNT(CASE WHEN event_type = 'Open' THEN 1 END) as opened,
  COUNT(CASE WHEN event_type = 'Click' THEN 1 END) as clicked,
  COUNT(CASE WHEN event_type = 'Bounce' THEN 1 END) as bounced,
  COUNT(CASE WHEN event_type = 'Complaint' THEN 1 END) as complained,
  COUNT(DISTINCT to_plain_address) as unique_recipients,
  ROUND(COUNT(CASE WHEN event_type = 'Open' THEN 1 END) * 100.0 /
    NULLIF(COUNT(CASE WHEN event_type = 'Delivery' THEN 1 END), 0), 2) as open_rate,
  ROUND(COUNT(CASE WHEN event_type = 'Bounce' THEN 1 END) * 100.0 /
    COUNT(*), 2) as bounce_rate
FROM {delivery_email_database}.events
WHERE td_interval(time, '-30d')
GROUP BY campaign_name
ORDER BY delivered DESC
```

### Domain Reputation Monitoring
```sql
-- Domain reputation metrics by sending domain
SELECT
  email_domain,
  COUNT(*) as total_emails,
  COUNT(CASE WHEN event_type = 'Delivery' THEN 1 END) as delivered,
  COUNT(CASE WHEN event_type = 'Bounce' THEN 1 END) as bounced,
  COUNT(CASE WHEN event_type = 'Complaint' THEN 1 END) as complained,
  ROUND(COUNT(CASE WHEN event_type = 'Delivery' THEN 1 END) * 100.0 / COUNT(*), 2) as delivery_rate,
  ROUND(COUNT(CASE WHEN event_type = 'Bounce' THEN 1 END) * 100.0 / COUNT(*), 2) as bounce_rate,
  ROUND(COUNT(CASE WHEN event_type = 'Complaint' THEN 1 END) * 100.0 / COUNT(*), 2) as complaint_rate
FROM {delivery_email_database}.events
WHERE td_interval(time, '-7d')
GROUP BY email_domain
ORDER BY total_emails DESC
```

### Performance Query Helper
```bash
# Query deliverability metrics for specific timeframe
tdx query "
SELECT
  DATE(FROM_UNIXTIME(time)) as date,
  COUNT(CASE WHEN event_type = 'Delivery' THEN 1 END) as delivered,
  COUNT(CASE WHEN event_type = 'Bounce' THEN 1 END) as bounced,
  COUNT(CASE WHEN event_type = 'Complaint' THEN 1 END) as complained,
  ROUND(COUNT(CASE WHEN event_type = 'Delivery' THEN 1 END) * 100.0 / COUNT(*), 2) as delivery_rate
FROM {delivery_email_database}.events
WHERE td_interval(time, '-14d')
GROUP BY DATE(FROM_UNIXTIME(time))
ORDER BY date DESC
"
```

## TD Target Metrics

| Metric | Good Target | Action Required |
|--------|-------------|-----------------|
| Bounce Rate | < 2% | Remove invalid addresses |
| Complaint Rate | < 0.1% | Review content and targeting |
| Delivery Rate | > 98% | Check authentication setup |

## Built-in Monitoring Tools

### Engage Studio Features
- **Domain verification status** in Sending Configurations
- **Email delivery events** tracking in campaigns
- **Bounce/complaint reports** in campaign analytics
- **Authentication record status** monitoring

## Troubleshooting

### Common Issues
| Problem | Likely Cause | Solution |
|---------|--------------|----------|
| Emails to spam | Authentication failure | Verify DNS records in TD console |
| High bounce rate (>5%) | Poor list quality | Remove invalid addresses, implement validation |
| Low engagement | Content/timing issues | A/B test subject lines, segment by behavior |
| Domain not verified | DNS propagation | Wait up to 72 hours, check with IT team |

## Important Notes

- **No manual authentication setup needed** - TD handles SPF, DKIM, DMARC automatically
- **No IP warming required** - Amazon SES manages IP allocation and reputation
- **No CLI commands for deliverability** - use Engage Studio UI for domain management
- **DNS records auto-generated** - copy from TD console, don't create manually

## Related Skills

**Domain Setup:**
- **engage-sender** - Configure domains and verify DNS records (required first)

**Email Operations:**
- **email-campaign-creator** - Create campaigns with proper sender configuration

**Monitoring & Analytics:**
- **sql-skills:trino** - Query email delivery events with advanced filtering
- **engage-utm** - Track campaign performance with UTM parameters