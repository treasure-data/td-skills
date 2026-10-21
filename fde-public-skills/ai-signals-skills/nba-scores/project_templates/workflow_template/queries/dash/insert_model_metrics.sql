select
${session_id} as session_id,
(select approx_distinct(${unique_user_id}) from ${final_nba_metrics_table}) as profiles_scored,
'${next_best_campaign.abandon_regexp_string}' as cart_abandon_logic,
'${next_best_campaign.conversion_logic}' as conversion_logic,
'${next_best_campaign.ad_engagement_logic_string}' as ad_engagement_logic,
'${next_best_campaign.event_lookback}' as event_lookback_days,
'${next_best_campaign.new_customers_days}' as new_customers_days,
params.*
from nba_table_params params


