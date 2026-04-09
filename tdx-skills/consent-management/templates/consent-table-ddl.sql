-- Consent Management Table Schemas for Treasure Data
-- Creates tables for GDPR/CCPA compliant consent tracking

-- ============================================================
-- 1. CONSENT_TRACKING: Immutable Log of All Consent Events
-- ============================================================

CREATE TABLE IF NOT EXISTS customer_db.consent_tracking (
  -- Identity
  customer_id VARCHAR,
  email VARCHAR,

  -- Consent details
  consent_type VARCHAR,           -- email_marketing, sms, profiling, data_sharing, cookies
  consent_status VARCHAR,         -- given, refused, withdrawn
  consent_timestamp BIGINT,       -- Unix timestamp (milliseconds)

  -- Audit metadata
  consent_channel VARCHAR,        -- web, mobile, in_store, email, phone, api
  consent_version VARCHAR,        -- v1, v2 (track policy version changes)
  consent_ip_address VARCHAR,     -- For legal audit trail
  consent_user_agent VARCHAR,     -- Browser/device info

  -- TD required field
  time BIGINT                     -- Partition key (same as consent_timestamp)
) WITH (
  format = 'ORC',
  partitioned_by = ARRAY['time']
)

-- Index on customer_id for fast lookups
-- (Treasure Data auto-indexes on partition key)

-- ============================================================
-- 2. EMAIL_PREFERENCES: Customer Email Communication Preferences
-- ============================================================

CREATE TABLE IF NOT EXISTS customer_db.email_preferences (
  customer_id VARCHAR,
  email VARCHAR,

  -- Frequency preferences
  email_frequency VARCHAR,        -- daily, weekly, monthly, never
  preferred_send_time VARCHAR,    -- morning, afternoon, evening

  -- Topic preferences
  topics_of_interest VARCHAR,     -- JSON array: ["offers", "news", "events", "products"]

  -- Unsubscribe tracking
  is_unsubscribed BOOLEAN,
  unsubscribe_reason VARCHAR,
  unsubscribed_at BIGINT,

  -- Metadata
  last_updated BIGINT,
  time BIGINT
) WITH (
  format = 'ORC',
  partitioned_by = ARRAY['time']
)

-- ============================================================
-- 3. SMS_PREFERENCES: SMS Communication Preferences
-- ============================================================

CREATE TABLE IF NOT EXISTS customer_db.sms_preferences (
  customer_id VARCHAR,
  phone_number VARCHAR,

  -- Frequency preferences
  sms_frequency VARCHAR,          -- immediate, daily_digest, weekly_digest, never

  -- Campaign preferences
  sms_campaigns_allowed VARCHAR,  -- JSON array: ["promotions", "alerts", "reminders"]

  -- Quiet hours
  quiet_hours_enabled BOOLEAN,
  quiet_hours_start VARCHAR,      -- "22:00"
  quiet_hours_end VARCHAR,        -- "08:00"

  -- Metadata
  last_updated BIGINT,
  time BIGINT
) WITH (
  format = 'ORC',
  partitioned_by = ARRAY['time']
)

-- ============================================================
-- 4. PRIVACY_SETTINGS: GDPR/CCPA Privacy Controls
-- ============================================================

CREATE TABLE IF NOT EXISTS customer_db.privacy_settings (
  customer_id VARCHAR,

  -- CCPA compliance
  do_not_sell BOOLEAN,            -- CCPA: Right to opt-out of sale
  limit_use_sensitive BOOLEAN,    -- CCPA: Limit use of sensitive data

  -- GDPR compliance
  marketing_allowed BOOLEAN,
  analytics_allowed BOOLEAN,
  profiling_allowed BOOLEAN,
  third_party_sharing_allowed BOOLEAN,

  -- Cookie preferences
  cookie_consent_level VARCHAR,   -- essential, functional, analytics, advertising

  -- Metadata
  last_updated BIGINT,
  time BIGINT
) WITH (
  format = 'ORC',
  partitioned_by = ARRAY['time']
)

-- ============================================================
-- 5. CONSENT_WIDE (VIEW): Latest Consent Status (Pivoted)
-- ============================================================

CREATE OR REPLACE VIEW customer_db.consent_wide AS
WITH latest_consent AS (
  SELECT
    customer_id,
    email,
    consent_type,
    consent_status,
    consent_timestamp,
    consent_channel,
    consent_version,
    ROW_NUMBER() OVER (
      PARTITION BY customer_id, consent_type
      ORDER BY consent_timestamp DESC
    ) AS rn
  FROM customer_db.consent_tracking
  WHERE td_interval(time, '-2y')  -- GDPR: consent expires after 2 years
)
SELECT
  customer_id,
  email,
  MAX(CASE WHEN consent_type = 'email_marketing' THEN consent_status END) AS email_marketing_consent,
  MAX(CASE WHEN consent_type = 'sms' THEN consent_status END) AS sms_consent,
  MAX(CASE WHEN consent_type = 'profiling' THEN consent_status END) AS profiling_consent,
  MAX(CASE WHEN consent_type = 'data_sharing' THEN consent_status END) AS data_sharing_consent,
  MAX(CASE WHEN consent_type = 'cookies' THEN consent_status END) AS cookies_consent,
  MAX(consent_timestamp) AS consent_updated_at,
  MAX(consent_version) AS consent_version
FROM latest_consent
WHERE rn = 1
GROUP BY customer_id, email

-- ============================================================
-- 6. CONSENT_AUDIT (VIEW): Consent Change Tracking
-- ============================================================

CREATE OR REPLACE VIEW customer_db.consent_audit AS
SELECT
  customer_id,
  email,
  consent_type,
  consent_status,
  FROM_UNIXTIME(consent_timestamp) AS consent_date,
  consent_channel,
  consent_version,
  consent_ip_address,
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
WHERE td_interval(time, '-90d')

-- ============================================================
-- 7. ACTIVATION_LOG: Track Data Exports to Third Parties
-- ============================================================

CREATE TABLE IF NOT EXISTS customer_db.activation_log (
  activation_id VARCHAR,
  customer_id VARCHAR,

  -- Activation details
  destination_name VARCHAR,       -- SFMC, Google Ads, Facebook
  activation_type VARCHAR,        -- email, display_ad, crm_sync
  activation_date BIGINT,

  -- Consent validation
  consent_validated BOOLEAN,
  consent_status_at_activation VARCHAR,

  -- Data shared
  data_fields_shared VARCHAR,     -- JSON array: ["email", "name", "ltv"]
  activation_purpose VARCHAR,     -- marketing, analytics, crm_update

  -- Metadata
  time BIGINT
) WITH (
  format = 'ORC',
  partitioned_by = ARRAY['time']
)

-- ============================================================
-- 8. GDPR_DELETION_LOG: Audit Trail of Data Deletions
-- ============================================================

CREATE TABLE IF NOT EXISTS customer_db.gdpr_deletion_log (
  deletion_id VARCHAR,
  customer_id VARCHAR,
  email VARCHAR,

  -- Request details
  request_date BIGINT,
  request_source VARCHAR,         -- customer_portal, support_ticket, email
  request_ticket_id VARCHAR,

  -- Deletion execution
  deletion_date BIGINT,
  deletion_status VARCHAR,        -- completed, pending, failed

  -- Audit
  deleted_tables VARCHAR,         -- JSON array: ["customers", "events", "orders"]
  export_archived_to VARCHAR,     -- S3 path for audit backup

  -- Metadata
  time BIGINT
) WITH (
  format = 'ORC',
  partitioned_by = ARRAY['time']
)

-- ============================================================
-- SAMPLE DATA INSERTION QUERIES
-- ============================================================

-- Insert consent event
INSERT INTO customer_db.consent_tracking
VALUES (
  'cust_12345',                                  -- customer_id
  'user@example.com',                            -- email
  'email_marketing',                             -- consent_type
  'given',                                       -- consent_status
  CAST(EXTRACT(EPOCH FROM NOW()) AS BIGINT),    -- consent_timestamp
  'web',                                         -- consent_channel
  'v2',                                          -- consent_version
  '192.168.1.1',                                 -- consent_ip_address
  'Mozilla/5.0...',                              -- consent_user_agent
  CAST(EXTRACT(EPOCH FROM NOW()) AS BIGINT)     -- time
)

-- Insert email preferences
INSERT INTO customer_db.email_preferences
VALUES (
  'cust_12345',                                  -- customer_id
  'user@example.com',                            -- email
  'weekly',                                      -- email_frequency
  'morning',                                     -- preferred_send_time
  '["offers", "news"]',                          -- topics_of_interest
  FALSE,                                         -- is_unsubscribed
  NULL,                                          -- unsubscribe_reason
  NULL,                                          -- unsubscribed_at
  CAST(EXTRACT(EPOCH FROM NOW()) AS BIGINT),    -- last_updated
  CAST(EXTRACT(EPOCH FROM NOW()) AS BIGINT)     -- time
)

-- Insert privacy settings
INSERT INTO customer_db.privacy_settings
VALUES (
  'cust_12345',                                  -- customer_id
  FALSE,                                         -- do_not_sell
  FALSE,                                         -- limit_use_sensitive
  TRUE,                                          -- marketing_allowed
  TRUE,                                          -- analytics_allowed
  TRUE,                                          -- profiling_allowed
  FALSE,                                         -- third_party_sharing_allowed
  'analytics',                                   -- cookie_consent_level
  CAST(EXTRACT(EPOCH FROM NOW()) AS BIGINT),    -- last_updated
  CAST(EXTRACT(EPOCH FROM NOW()) AS BIGINT)     -- time
)
