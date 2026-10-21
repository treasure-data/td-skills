SELECT
${session_id} as session_id,
(SELECT APPROX_DISTINCT(${unique_user_id}) FROM ${final_nba_metrics_table}) as profiles_scored,
'${next_best_campaign.abandon_regexp_string}' AS cart_abandon_logic,
'${next_best_campaign.conversion_logic}' AS conversion_logic,
'${next_best_campaign.ad_engagement_logic_string}' AS ad_engagement_logic,
'${next_best_campaign.event_lookback}' AS event_lookback_days,
'${next_best_campaign.new_customers_days}' AS new_customers_days,
PARAMS.*
FROM nba_table_params PARAMS


