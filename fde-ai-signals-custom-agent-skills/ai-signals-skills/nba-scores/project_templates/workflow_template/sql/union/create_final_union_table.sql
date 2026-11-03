select 
time, date_time, event_date, 
hour(cast(from_unixtime(time) as timestamp)) as time_hour,
try(cast(cast(from_unixtime(time) as timestamp) ${timeshift_change} interval '${timeshift_hours}' hour as varchar)) as adjusted_time,
hour(cast(from_unixtime(time) as timestamp) ${timeshift_change} interval '${timeshift_hours}' hour)  as adjusted_hour,
${unique_user_id}, src_table, td_market, td_brand, event_type,
--- select TOP-K channels by count and standerdize rest to 'others' 
case 
when channel_session in (select col_value from nba_topk_values_lookup where col_name = 'channel') then channel_session
else 'others'
end as channel, 
source_session as source,
campaign,
context_col,
conversion_flag,
item_price
from ${src_union_table}_session
