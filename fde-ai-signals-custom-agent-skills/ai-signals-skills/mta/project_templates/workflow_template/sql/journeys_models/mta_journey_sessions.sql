with top_channels as (
select channel_final,
count(*)*1.0 / (select count(*) from mta_journeys_base) as perc_activity,
sum(total_conversions)*1.0 / (select sum(total_conversions) from mta_journeys_base) as perc_conv
from mta_journeys_base 
where channel_final is not null and channel_final != ''
group by 1
having (count(*)*1.0 / (select count(*) from mta_journeys_base)) > ${top_k_channel_perc} or sum(total_conversions)*1.0 / (select sum(total_conversions) from mta_journeys_base) > ${top_k_conv_perc}
)
,
base as (
select 
J.*,
-- session_id, date_time, conversion_flag, 
${unique_user_id} || '@' || cast(sum(conversion_flag) over (partition by ${unique_user_id}  order by time desc, context_col) as varchar) as conversion_journey_id,
-- total_conversions, converted_session_flag, channel_final, campaign, event_type, context_col, session_length, session_length_sec
-- -- breaking into subsequences delimited by conversions. We do this b/c once a customer converts, attribution should be reset.
-- -- At least this is the case for eCommerce where repeat purchases are expected. Probably applies less to SaaS for which the initial conversion matters most
(select array_agg(channel_final) from top_channels) as top_channels
from mta_journeys_base J
)
,
-- Filter touchpoints to only those within max_journey_days before the conversion event.
-- conversion_time = MAX(time) within the journey because journeys are ordered DESC
-- and the conversion event is always the most recent touchpoint in each journey bucket.
filtered as (
  select
    *,
    max(time) over (partition by conversion_journey_id) as conversion_time
  from base
)
,
jour as (
select
time,
date_time,
event_date,
td_time_string(max(time) over (partition by conversion_journey_id), 'M!') as conversion_month,
format_datetime(from_unixtime(time), 'EEEE') as day_of_week,
${unique_user_id},
src_table,
url,
-- referral_page as referrer,
referral_domain,
event_type,
events_num,
context_col,
event_type || ' | ' || context_col as event_context,
-- channel_orig,
if(contains(top_channels, channel_final), channel_final, 'other') as channel,
-- source_orig,
source_final as source,
campaign,
conversion_journey_id,
conversion_flag,
-- useful for calculating various attribution models
count(1) over (partition by conversion_journey_id) as journey_length,
row_number() over (partition by conversion_journey_id order by time) as journey_index,
approx_distinct(session_id) over (partition by conversion_journey_id) as total_sessions,
sum(session_length) over (partition by conversion_journey_id) as journey_touchpoints_total,
sum(session_length_sec) over (partition by conversion_journey_id) as journey_sessions_sec_total,
-- just "filling" in the conversion value for each session
max(total_conversions) over (partition by conversion_journey_id order by time desc) as conversion_value,
max(total_order_value) over (partition by conversion_journey_id order by time desc) as conversion_value_total_sales,
touchpoint_histogram,
session_id,
session_length_sec,
session_length,
sess_rank_asc,
sess_rank_desc,
top_channels,
array_distinct(transform(channel_list_distinct, x -> if(contains(top_channels, x), x, 'other'))) as channel_list_temp
from filtered
where time >= conversion_time - (${max_journey_days} * 86400)
order by time
)
,
-- Aggregate session-level data to the conversion journey level:
-- - Flatten all session channel arrays into a single distinct list per journey
-- - Build the touchpoint history string for the journey
-- - Capture journey start time for cumulative ordering in the next step
hist as (
  select conversion_journey_id,
  min(${unique_user_id}) as hist_user_id,
  array_join(array_agg(regexp_replace(touchpoint_histogram, '{|}|"', '') order by journey_index), ' -> ') as journey_history,
  array_distinct(flatten(array_agg(channel_list_temp))) as journey_channels,
  min(time) as journey_start_time,
  (max(time) - min(time)) / 60 as journey_duration_mins,
  (max(time) - min(time)) / 86400 as journey_duration_days
  from jour
  group by 1
)
,
-- Build a cumulative channel list that carries forward across conversion journeys:
-- For each journey, collect distinct channels from ALL prior journeys (ordered by time)
-- so that channels are never "lost" when a new conversion resets the journey boundary
hist_cumulative as (
  select conversion_journey_id,
  journey_history,
  array_join(
    array_distinct(flatten(
      array_agg(journey_channels) over (
        partition by hist_user_id
        order by journey_start_time
        rows between unbounded preceding and current row
      )
    )), ' > '
  ) as channel_list_final,
  journey_duration_mins,
  journey_duration_days
  from hist
)
select jour.*,
if(journey_index = 1, hist_cumulative.channel_list_final, null) as channel_list_final,
hist_cumulative.journey_history, hist_cumulative.journey_duration_mins, hist_cumulative.journey_duration_days
from jour
join hist_cumulative
on jour.conversion_journey_id = hist_cumulative.conversion_journey_id




