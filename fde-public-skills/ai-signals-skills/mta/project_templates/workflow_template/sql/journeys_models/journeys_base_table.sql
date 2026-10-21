with base as (
select 
case 
    when max(if(sess_rank_desc = 1, time, null)) is not null then max(time)
    else min(time)
    end as time,
session_id, 
case 
    when max(if(sess_rank_desc = 1, date_time, null)) is not null then max(date_time)
    else min(date_time)
    end as date_time,
min(event_date) as event_date, min(${unique_user_id}) as ${unique_user_id}, min(src_table) as  src_table, min(url) as url,
min(path) as path, min(referral_domain) as referral_domain, 
event_type, 

case
when regexp_like(lower(channel_final), 'socia|facebook|linkedin|instagram|tik') then 'social' 
when regexp_like(lower(channel_final), 'search') then 'paid_search'
when regexp_like(lower(channel_final), 'video|youtube') then 'video'  
when regexp_like(lower(channel_final), 'display') then 'display' 
when regexp_like(lower(channel_final), 'web|referr') then 'referral'
else channel_final
end as channel_final,
source_final, 
campaign, context_col, 
count(*) as events_num, max(conversion_flag) as conversion_flag, max(item_price) as item_price,
-- min(sess_rank_asc) as first_event_rnk, MIN(sess_rank_desc) as last_event_rank, max(date_time) as max_touch_datetime, 
min(sess_rank_asc) as sess_rank_asc, min(sess_rank_desc) as sess_rank_desc
   from ${journeys_input_table}
  group by session_id, channel_final, event_type, source_final, campaign, context_col
  order by session_id,  sess_rank_asc
)
,
hist as (
select session_id,
max(time) - min(time) as session_length_sec,
-- GREATEST(MAX(sess_rank_asc), MAX(sess_rank_desc)) AS session_length,
sum(events_num) as session_length,
max(conversion_flag) as converted_session_flag,
least(sum(conversion_flag), 1) as total_conversions, 
max(item_price) as total_order_value,
filter(array_distinct(array_agg(channel_final order by date_time)), x -> x is not null) as channel_list_distinct,
filter(array_agg(concat(channel_final, ' : ', cast(events_num as varchar)) order by date_time), x -> x is not null) as channel_order,
-- ARRAY_JOIN(ARRAY_AGG(DISTINCT channel_final), ', ') as channel_list,
filter(array_agg(concat(source_final, ' : ', cast(events_num as varchar)) order by date_time), x -> x is not null) as source_order,
filter(array_agg(concat(campaign, ' : ', cast(events_num as varchar))  order by date_time), x -> x is not null) as campaign_order,
filter(array_agg(concat(context_col, ' : ', cast(events_num as varchar)) order by date_time), x -> x is not null) as context_order,
filter(array_agg(concat(event_type, ' : ', cast(events_num as varchar)) order by date_time), x -> x is not null) as event_order,
array_join(filter(array_agg(concat(channel_final, '(', event_type, ') : ',  cast(events_num as varchar)) order by date_time), x -> x is not null), ' -> ') as touchpoint_histogram
-- json_format(CAST(HISTOGRAM(channel_final || ' - ' || event_type ORDER BY date_time) AS JSON)) as touchpoint_histogram
from base
group by 1
)
select 
base.*,
case when base.sess_rank_asc = 1 then hist.session_length_sec else 0 end as session_length_sec,
case when base.sess_rank_asc = 1 then hist.session_length else 0 end as session_length,
-- HIST.session_length_events,
hist.converted_session_flag,  hist.total_conversions, base.item_price as total_order_value,
case when base.sess_rank_asc = 1 then hist.channel_list_distinct else null end as channel_list_distinct,
case when base.sess_rank_asc = 1 then hist.channel_order else null end as channel_order,
case when base.sess_rank_asc = 1 then hist.source_order else null end as source_order,
case when base.sess_rank_asc = 1 then hist.campaign_order else null end as campaign_order,
case when base.sess_rank_asc = 1 then hist.context_order else null end as context_order,
case when base.sess_rank_asc = 1 then hist.event_order else null end as event_order,
case when base.sess_rank_asc = 1 then hist.touchpoint_histogram else null end as touchpoint_histogram
from base
inner join hist
on base.session_id = hist.session_id
--- REMOVES JOURNEYS WHERE 'direct' is the only channel in the journey
where channel_list_distinct <> array['direct']






