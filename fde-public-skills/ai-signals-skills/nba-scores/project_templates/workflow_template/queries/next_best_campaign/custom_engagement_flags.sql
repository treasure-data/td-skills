WITH BASE AS (
SELECT ${unique_user_id},
MAX(IF(${next_best_campaign.ad_engagement_logic}, 1, 0)) AS ad_engagement_flag,
MAX(IF(${next_best_campaign.conversion_logic}, 1, 0)) as conversion_flag,
count(*) as num_visits,
MIN(date_time) AS first_visit,
MAX(date_time) AS last_visit,
MAX(CASE WHEN ${next_best_campaign.conversion_logic} THEN date_time END) AS last_purchase_date,
MAX(CASE WHEN ${next_best_campaign.ad_engagement_logic} THEN date_time END) AS last_ad_engagement_date,
MAX(CASE WHEN ${next_best_campaign.abandon_regexp} THEN date_time END) AS last_cart_add_date
FROM ${next_best_campaign.src_table}
GROUP BY 1
)
SELECT
BASE.*,
IF(ad_engagement_flag = 0 AND conversion_flag = 0, 1, 0) AS no_ads_or_purchases_flag,
IF(ad_engagement_flag = 0 AND conversion_flag = 0 AND date_diff('day', CAST(first_visit AS TIMESTAMP), CURRENT_TIMESTAMP) <= ${next_best_campaign.new_customers_days}, 1, 0) AS new_visitor_flag,
IF(date_diff('day', CAST(last_ad_engagement_date AS TIMESTAMP), CURRENT_TIMESTAMP) <= ${next_best_campaign.event_lookback}, 1, 0) AS recent_ad_engagement_flag,
IF(date_diff('day', CAST(last_purchase_date AS TIMESTAMP), CURRENT_TIMESTAMP) <= ${next_best_campaign.event_lookback}, 1, 0) AS recent_purchase_flag,
IF(last_cart_add_date > COALESCE(last_purchase_date, '1970-01-01') AND date_diff('day', CAST(last_cart_add_date AS TIMESTAMP), CURRENT_TIMESTAMP) <= ${next_best_campaign.event_lookback}, 1, 0) AS cart_abandon_flag
FROM BASE
