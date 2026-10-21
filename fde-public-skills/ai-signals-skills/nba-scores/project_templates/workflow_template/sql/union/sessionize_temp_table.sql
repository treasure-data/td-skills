with sesh as (
select
-- right now assuming that time between sessions = 60 min or 3600sec as the default 'session_length' param
td_sessionize_window(time, ${session_length}) over (partition by ${unique_user_id} order by time) || ${unique_user_id} as session_id,
base.*
from ${src_union_table}_temp base
)
,
step2 as (
select sesh.*, 
case 
    when regexp_like(lower(channel), 'web') then 'web_ads'
    when regexp_like(lower(channel), 'dsp|rtb|criteo|mediamath|thetradedesk|adobe|amazon|onetag|rubiconproject|xandr') then 'dsp_rtb'
    when regexp_like(lower(channel), 'call|center') then 'call_center'
    when regexp_like(lower(channel), 'mobile|device|push|app') then 'mobile'
    when regexp_like(lower(channel), 'email|sfmc|braze|klaviyo|mailchimp|sendgrid|constantcontact|getresponse|aweber|campaignmonitor') then 'email'
    when regexp_like(lower(channel), 'facebook|instagram|twitter|linkedin|snapchat|pinterest|tiktok|tik_tok|tik tok|youtube|reddit|quora|social|meta') then 'social'
    when regexp_like(lower(channel), 'google ads|google_ads|search|yahoo|baidu|duckduckgo|yandex|ask.com') then 'paid search'
    when regexp_like(lower(channel), 'display|digital|banner|creative') then 'display'
    when regexp_like(lower(channel), 'maddict') then 'maddict'
    else 
        -- Step Below looks for information in source column to backfill NULL values for channel
        case 
            when channel is null or channel in ('', 'none') then 
                case
                    when regexp_like(lower(source), 'web') then 'web_ads'
                    when regexp_like(lower(source), 'dsp|rtb|criteo|mediamath|thetradedesk|adobe|amazon|onetag|rubiconproject|xandr') then 'dsp_rtb'
                    when regexp_like(lower(source), 'call|center') then 'call_center'
                    when regexp_like(lower(source), 'mobile|device|push|app') then 'mobile'
                    when regexp_like(lower(source), 'email|sfmc|braze|klaviyo|mailchimp|sendgrid|constantcontact|getresponse|aweber|campaignmonitor') then 'email'
                    when regexp_like(lower(source), 'facebook|instagram|twitter|linkedin|snapchat|pinterest|tiktok|tik_tok|tik tok|youtube|reddit|quora|social|meta') then 'social'
                    when regexp_like(lower(source), 'google ads|google_ads|search|yahoo|baidu|duckduckgo|yandex|ask.com') then 'paid search'
                    when regexp_like(lower(source), 'display|digital|banner|creative') then 'display'
                    when regexp_like(lower(source), 'maddict') then 'maddict'
                    else coalesce(trim(lower(source)), 'organic')
                end
            else trim(lower(channel))
        end 
end as channel_new,
-- Step Below looks for information in channel or src_table columns to fill NULLs for source
case when coalesce(source, channel) is null then src_table
else trim(lower(source))
end as source_new
from sesh
)
-- ,channel_final_cte as(
-- --- Last step tries to backfill all remaining null values for channel and source with the previous non-null touchpoint in the journey, and if none are found flags as 'direct'
select 
time, session_id, date_time, event_date, ${unique_user_id}, src_table, event_type, td_market, td_brand, url, path, referral_page, 
channel as channel_orig, trim(lower(channel_final)) as channel_session,
source as source_orig, trim(lower(source_final)) as source_session,
campaign, context_col, conversion_flag, item_price, sess_rank_asc, sess_rank_desc
from  (
select step2.*,
        -- get index of the touchpoints in each session to 
        rank() over (partition by step2.session_id order by time asc, context_col asc) as sess_rank_asc,
        rank() over (partition by step2.session_id order by time desc, context_col desc) as sess_rank_desc,
        -- Use LAST_VALUE to get the latest non-null value in the window, ignoring nulls.
        -- The window is partitioned over each canonical_id, ordered by timestamp.
        coalesce(
          -- Below code backfills all NULL values with the first NON-NULL value it detects going in reverse time order 
          last_value(channel_new) ignore nulls over (
            partition by ${backfill_partition_col} order by date_time 
            rows between unbounded preceding and current row
        ), 'organic') as channel_final,
      coalesce(
        last_value(source_new) ignore nulls over (
            partition by ${backfill_partition_col} order by date_time 
            rows between unbounded preceding and current row
        ), src_table) as source_final
    from
        step2
)
