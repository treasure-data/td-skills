WITH AGG AS (
  SELECT
${unique_user_id}, time,  order_id, order_status, order_type, coupon_used, 
ARRAY_JOIN(ARRAY_DISTINCT(ARRAY_AGG(item_name)), ', ') AS item_name,
ARRAY_JOIN(ARRAY_DISTINCT(ARRAY_AGG(item_category)), ', ') AS item_category,
SUM(unit_price) as total_spend
FROM ${td.each.src_table}
WHERE order_status IN ('COMPLETE', 'PROCESSING')
GROUP BY ${unique_user_id}, time,  order_id, order_status, order_type, coupon_used
)
SELECT time,
  TD_TIME_STRING(time, 's!') AS date_time,
  TD_TIME_STRING(time, 'd!') AS event_date,
  ${unique_user_id},
  '${td.each.src_table}' AS src_table,
  CONCAT('Order - ', order_type)  AS event_type,
  CAST(NULL AS VARCHAR) AS url,
  CAST(NULL AS VARCHAR) AS path,
  CAST(NULL AS VARCHAR) AS referral_page,
  CAST(NULL AS VARCHAR) AS referral_domain,
  CAST(NULL AS VARCHAR) as channel,
  CAST(NULL AS VARCHAR) as source,
  coupon_used as campaign,
  CAST(NULL AS VARCHAR) as utm_mailing,
  order_type AS context_col,
  1.0 AS conversion_flag,
  total_spend AS item_price
  FROM AGG



