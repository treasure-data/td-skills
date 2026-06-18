# Consent Audit Queries

SQL queries for monitoring consent compliance and generating audit reports.

## Consent Change Log

Track all consent changes over time:

```sql
SELECT
  customer_id,
  email,
  consent_type,
  consent_status,
  FROM_UNIXTIME(consent_timestamp) AS consent_date,
  consent_channel,
  consent_version,
  LAG(consent_status) OVER (
    PARTITION BY customer_id, consent_type
    ORDER BY consent_timestamp
  ) AS previous_status,
  CASE
    WHEN LAG(consent_status) OVER (
      PARTITION BY customer_id, consent_type
      ORDER BY consent_timestamp
    ) IS NULL THEN 'Initial Consent'
    WHEN LAG(consent_status) OVER (
      PARTITION BY customer_id, consent_type
      ORDER BY consent_timestamp
    ) != consent_status THEN 'Status Changed'
    ELSE 'Reconfirmed'
  END AS change_type
FROM customer_db.consent_tracking
WHERE td_interval(time, '-30d')
ORDER BY consent_timestamp DESC
```

## Compliance Dashboard Metrics

```sql
SELECT
  COUNT(DISTINCT customer_id) AS total_customers,
  COUNT(DISTINCT CASE WHEN email_marketing_consent = 'given' THEN customer_id END) AS email_opted_in,
  COUNT(DISTINCT CASE WHEN sms_consent = 'given' THEN customer_id END) AS sms_opted_in,
  COUNT(DISTINCT CASE WHEN profiling_consent = 'given' THEN customer_id END) AS profiling_allowed,

  -- Opt-in rates
  ROUND(
    100.0 * COUNT(DISTINCT CASE WHEN email_marketing_consent = 'given' THEN customer_id END) /
    NULLIF(COUNT(DISTINCT customer_id), 0),
    2
  ) AS email_opt_in_rate,

  -- Expired consents (GDPR: 2 years)
  COUNT(DISTINCT CASE
    WHEN consent_updated_at < CAST(EXTRACT(EPOCH FROM NOW() - INTERVAL '2' YEAR) AS BIGINT)
    THEN customer_id
  END) AS expired_consents

FROM customer_db.consent_wide
```

## Find Expired Consents

Identify customers needing consent renewal:

```sql
SELECT
  customer_id,
  email,
  consent_updated_at,
  FROM_UNIXTIME(consent_updated_at) AS last_consent_date,
  DATEDIFF(CURRENT_DATE, FROM_UNIXTIME(consent_updated_at)) AS days_since_consent
FROM customer_db.consent_wide
WHERE consent_updated_at < CAST(EXTRACT(EPOCH FROM NOW() - INTERVAL '24' MONTH) AS BIGINT)
  AND email_marketing_consent = 'given'
ORDER BY consent_updated_at ASC
LIMIT 100
```

## Activation Compliance Check

Find activations without valid consent:

```sql
SELECT
  a.customer_id,
  a.destination_name,
  a.activation_date,
  c.email_marketing_consent
FROM customer_db.activation_log a
LEFT JOIN customer_db.consent_wide c
  ON a.customer_id = c.customer_id
WHERE a.activation_type = 'email'
  AND (c.email_marketing_consent IS NULL OR c.email_marketing_consent != 'given')
  AND td_interval(a.time, '-7d')
```

## Consent by Channel

Analyze consent collection channels:

```sql
SELECT
  consent_channel,
  consent_type,
  COUNT(*) AS total_consents,
  COUNT(CASE WHEN consent_status = 'given' THEN 1 END) AS consents_given,
  COUNT(CASE WHEN consent_status = 'refused' THEN 1 END) AS consents_refused,
  ROUND(
    100.0 * COUNT(CASE WHEN consent_status = 'given' THEN 1 END) / COUNT(*),
    2
  ) AS opt_in_rate
FROM customer_db.consent_tracking
WHERE td_interval(time, '-30d')
GROUP BY consent_channel, consent_type
ORDER BY total_consents DESC
```

## Weekly Consent Report

```sql
SELECT
  DATE_FORMAT(FROM_UNIXTIME(consent_timestamp), '%Y-%U') AS week,
  consent_type,
  COUNT(*) AS total_events,
  COUNT(DISTINCT customer_id) AS unique_customers,
  COUNT(CASE WHEN consent_status = 'given' THEN 1 END) AS new_opt_ins,
  COUNT(CASE WHEN consent_status = 'withdrawn' THEN 1 END) AS opt_outs
FROM customer_db.consent_tracking
WHERE td_interval(time, '-90d')
GROUP BY week, consent_type
ORDER BY week DESC, consent_type
```
