-- DSAR (Data Subject Access Request) Queries
-- Complete customer data export for GDPR/CCPA compliance

-- ============================================================
-- 1. RIGHT TO ACCESS: Export All Customer Data
-- ============================================================

-- Complete customer profile export
SELECT
  -- Identity
  c.customer_id,
  c.email,
  c.first_name,
  c.last_name,
  c.phone,
  c.created_at,
  c.status,

  -- Consent preferences
  ct.email_marketing_consent,
  ct.sms_consent,
  ct.profiling_consent,
  ct.data_sharing_consent,
  ct.consent_updated_at,

  -- Email preferences
  ep.email_frequency,
  ep.topics_of_interest,
  ep.preferred_send_time,

  -- Privacy settings
  ps.do_not_sell,
  ps.marketing_allowed,
  ps.analytics_allowed,
  ps.third_party_sharing_allowed,

  -- Purchase history
  ph.order_count,
  ph.lifetime_value,
  ph.last_purchase_date,
  ph.average_order_value,

  -- Behavioral summary
  bs.page_views_30d,
  bs.sessions_30d,
  bs.last_login_date

FROM customer_db.customers c

-- Join consent data
LEFT JOIN customer_db.consent_wide ct
  ON c.customer_id = ct.customer_id

-- Join email preferences
LEFT JOIN customer_db.email_preferences ep
  ON c.email = ep.email

-- Join privacy settings
LEFT JOIN customer_db.privacy_settings ps
  ON c.customer_id = ps.customer_id

-- Join purchase summary
LEFT JOIN customer_db.purchase_summary ph
  ON c.customer_id = ph.customer_id

-- Join behavioral summary
LEFT JOIN customer_db.behavioral_summary bs
  ON c.customer_id = bs.customer_id

WHERE c.email = 'user@example.com'  -- Or use c.customer_id = 'cust_12345'

-- ============================================================
-- 2. CONSENT HISTORY: All Consent Changes
-- ============================================================

SELECT
  customer_id,
  email,
  consent_type,
  consent_status,
  FROM_UNIXTIME(consent_timestamp) AS consent_date,
  consent_channel,
  consent_version,
  consent_ip_address,
  consent_user_agent
FROM customer_db.consent_tracking
WHERE customer_id = 'cust_12345'
  AND td_interval(time, '-3y')  -- Last 3 years
ORDER BY consent_timestamp DESC

-- ============================================================
-- 3. PURCHASE HISTORY: All Transactions
-- ============================================================

SELECT
  order_id,
  customer_id,
  order_date,
  order_total,
  order_status,
  payment_method,
  shipping_address,
  items_purchased
FROM customer_db.orders
WHERE customer_id = 'cust_12345'
  AND td_interval(time, '-3y')
ORDER BY order_date DESC

-- ============================================================
-- 4. BEHAVIORAL EVENTS: Website/App Activity
-- ============================================================

SELECT
  event_id,
  customer_id,
  event_type,
  event_timestamp,
  page_url,
  device_type,
  browser,
  ip_address,
  session_id
FROM customer_db.events
WHERE customer_id = 'cust_12345'
  AND td_interval(time, '-90d')  -- Last 90 days (configurable)
ORDER BY event_timestamp DESC
LIMIT 1000  -- Limit for performance

-- ============================================================
-- 5. EMAIL ENGAGEMENT: All Email Interactions
-- ============================================================

SELECT
  email,
  event_type,  -- sent, opened, clicked, bounced, unsubscribed
  campaign_name,
  subject_line,
  event_timestamp,
  link_url,
  user_agent
FROM customer_db.email_events
WHERE email = 'user@example.com'
  AND td_interval(time, '-1y')
ORDER BY event_timestamp DESC

-- ============================================================
-- 6. SEGMENT MEMBERSHIP: Current Segments
-- ============================================================

-- Note: This requires querying segment membership tables
-- Example pattern:
SELECT
  segment_name,
  segment_id,
  joined_date,
  segment_type
FROM customer_db.segment_membership
WHERE customer_id = 'cust_12345'
  AND is_active = TRUE

-- ============================================================
-- 7. THIRD-PARTY ACTIVATIONS: Data Shared with Partners
-- ============================================================

SELECT
  destination_name,
  activation_date,
  data_fields_shared,
  activation_purpose
FROM customer_db.activation_log
WHERE customer_id = 'cust_12345'
  AND td_interval(time, '-1y')
ORDER BY activation_date DESC

-- ============================================================
-- RIGHT TO DELETION: Anonymization Queries
-- ============================================================

-- Step 1: Anonymize customer master record
UPDATE customer_db.customers
SET
  email = CONCAT('deleted_', customer_id, '@anonymized.com'),
  first_name = 'DELETED',
  last_name = 'DELETED',
  phone = NULL,
  address = NULL,
  city = NULL,
  state = NULL,
  zip = NULL,
  date_of_birth = NULL,
  gdpr_deleted = TRUE,
  gdpr_deleted_at = CURRENT_TIMESTAMP
WHERE customer_id = 'cust_12345'

-- Step 2: Delete consent records
DELETE FROM customer_db.consent_tracking
WHERE customer_id = 'cust_12345'

-- Step 3: Delete email preferences
DELETE FROM customer_db.email_preferences
WHERE email = 'user@example.com'

-- Step 4: Delete privacy settings
DELETE FROM customer_db.privacy_settings
WHERE customer_id = 'cust_12345'

-- Step 5: Anonymize or delete events (choose based on retention policy)
-- Option A: Delete events
DELETE FROM customer_db.events
WHERE customer_id = 'cust_12345'
  AND td_interval(time, '-3y')

-- Option B: Anonymize events (preserve analytics)
UPDATE customer_db.events
SET
  customer_id = 'anonymized',
  email = NULL,
  ip_address = NULL,
  user_agent = NULL
WHERE customer_id = 'cust_12345'
  AND td_interval(time, '-3y')

-- Step 6: Anonymize order history
UPDATE customer_db.orders
SET
  customer_id = 'anonymized',
  email = NULL,
  shipping_address = NULL,
  billing_address = NULL,
  phone = NULL
WHERE customer_id = 'cust_12345'

-- ============================================================
-- RIGHT TO RECTIFICATION: Update Consent
-- ============================================================

-- Correct consent status
INSERT INTO customer_db.consent_tracking
VALUES (
  'cust_12345',                                              -- customer_id
  'user@example.com',                                        -- email
  'email_marketing',                                         -- consent_type
  'withdrawn',                                               -- consent_status (corrected)
  CAST(EXTRACT(EPOCH FROM NOW()) AS BIGINT),                -- consent_timestamp
  'manual_correction',                                       -- consent_channel
  'v2',                                                      -- consent_version
  NULL,                                                      -- consent_ip_address
  'Support Ticket #12345',                                   -- consent_user_agent (tracking source)
  CAST(EXTRACT(EPOCH FROM NOW()) AS BIGINT)                 -- time
)

-- ============================================================
-- AUDIT QUERIES: Compliance Monitoring
-- ============================================================

-- Find customers with expired consent (need renewal)
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

-- Find activations without consent
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

-- Consent coverage report
SELECT
  COUNT(DISTINCT customer_id) AS total_customers,
  COUNT(DISTINCT CASE WHEN email_marketing_consent = 'given' THEN customer_id END) AS email_opted_in,
  COUNT(DISTINCT CASE WHEN sms_consent = 'given' THEN customer_id END) AS sms_opted_in,
  ROUND(
    100.0 * COUNT(DISTINCT CASE WHEN email_marketing_consent = 'given' THEN customer_id END) /
    NULLIF(COUNT(DISTINCT customer_id), 0),
    2
  ) AS email_opt_in_rate,
  COUNT(DISTINCT CASE
    WHEN consent_updated_at < CAST(EXTRACT(EPOCH FROM NOW() - INTERVAL '24' MONTH) AS BIGINT)
    THEN customer_id
  END) AS expired_consents
FROM customer_db.consent_wide
