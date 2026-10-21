with base as (
select ${unique_user_id},
max(if(${next_best_campaign.ad_engagement_logic}, 1, 0)) as ad_engagement_flag,
max(if(${next_best_campaign.conversion_logic}, 1, 0)) as conversion_flag,
count(*) as num_visits,
min(date_time) as first_visit,
max(date_time) as last_visit,
max(case when ${next_best_campaign.conversion_logic} then date_time end) as last_purchase_date,
max(case when ${next_best_campaign.ad_engagement_logic} then date_time end) as last_ad_engagement_date,
max(case when ${next_best_campaign.abandon_regexp} then date_time end) as last_cart_add_date
from ${next_best_campaign.src_table}
group by 1
)
select
base.*,
if(ad_engagement_flag = 0 and conversion_flag = 0, 1, 0) as no_ads_or_purchases_flag,
if(ad_engagement_flag = 0 and conversion_flag = 0 and date_diff('day', cast(first_visit as timestamp), current_timestamp) <= ${next_best_campaign.new_customers_days}, 1, 0) as new_visitor_flag,
if(date_diff('day', cast(last_ad_engagement_date as timestamp), current_timestamp) <= ${next_best_campaign.event_lookback}, 1, 0) as recent_ad_engagement_flag,
if(date_diff('day', cast(last_purchase_date as timestamp), current_timestamp) <= ${next_best_campaign.event_lookback}, 1, 0) as recent_purchase_flag,
if(last_cart_add_date > coalesce(last_purchase_date, '1970-01-01') and date_diff('day', cast(last_cart_add_date as timestamp), current_timestamp) <= ${next_best_campaign.event_lookback}, 1, 0) as cart_abandon_flag
from base
