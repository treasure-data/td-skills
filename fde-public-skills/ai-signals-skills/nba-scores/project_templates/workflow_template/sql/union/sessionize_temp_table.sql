WITH SESH AS (
SELECT
-- right now assuming that time between sessions = 60 min or 3600sec as the default 'session_length' param
TD_SESSIONIZE_WINDOW(time, ${session_length}) OVER (PARTITION BY ${unique_user_id} ORDER BY time) || ${unique_user_id} AS session_id,
BASE.*
FROM ${src_union_table}_temp BASE
)
,
STEP2 AS (
SELECT SESH.*, 
CASE 
    WHEN REGEXP_LIKE(lower(channel), 'web') THEN 'web_ads'
    WHEN REGEXP_LIKE(lower(channel), 'dsp|rtb|criteo|mediamath|thetradedesk|adobe|amazon|onetag|rubiconproject|xandr') THEN 'dsp_rtb'
    WHEN REGEXP_LIKE(lower(channel), 'call|center') THEN 'call_center'
    WHEN REGEXP_LIKE(lower(channel), 'mobile|device|push|app') THEN 'mobile'
    WHEN REGEXP_LIKE(lower(channel), 'email|sfmc|braze|klaviyo|mailchimp|sendgrid|constantcontact|getresponse|aweber|campaignmonitor') THEN 'email'
    WHEN REGEXP_LIKE(lower(channel), 'facebook|instagram|twitter|linkedin|snapchat|pinterest|tiktok|tik_tok|tik tok|youtube|reddit|quora|social|meta') THEN 'social'
    WHEN REGEXP_LIKE(lower(channel), 'google ads|google_ads|search|yahoo|baidu|duckduckgo|yandex|ask.com') THEN 'paid search'
    WHEN REGEXP_LIKE(lower(channel), 'display|digital|banner|creative') THEN 'display'
    WHEN REGEXP_LIKE(lower(channel), 'maddict') THEN 'maddict'
    ELSE 
        -- Step Below looks for information in source column to backfill NULL values for channel
        CASE 
            WHEN channel IS NULL OR channel IN ('', 'none') THEN 
                CASE
                    WHEN REGEXP_LIKE(lower(source), 'web') THEN 'web_ads'
                    WHEN REGEXP_LIKE(lower(source), 'dsp|rtb|criteo|mediamath|thetradedesk|adobe|amazon|onetag|rubiconproject|xandr') THEN 'dsp_rtb'
                    WHEN REGEXP_LIKE(lower(source), 'call|center') THEN 'call_center'
                    WHEN REGEXP_LIKE(lower(source), 'mobile|device|push|app') THEN 'mobile'
                    WHEN REGEXP_LIKE(lower(source), 'email|sfmc|braze|klaviyo|mailchimp|sendgrid|constantcontact|getresponse|aweber|campaignmonitor') THEN 'email'
                    WHEN REGEXP_LIKE(lower(source), 'facebook|instagram|twitter|linkedin|snapchat|pinterest|tiktok|tik_tok|tik tok|youtube|reddit|quora|social|meta') THEN 'social'
                    WHEN REGEXP_LIKE(lower(source), 'google ads|google_ads|search|yahoo|baidu|duckduckgo|yandex|ask.com') THEN 'paid search'
                    WHEN REGEXP_LIKE(lower(source), 'display|digital|banner|creative') THEN 'display'
                    WHEN REGEXP_LIKE(lower(source), 'maddict') THEN 'maddict'
                    ELSE COALESCE(trim(lower(source)), 'organic')
                END
            ELSE trim(lower(channel))
        END 
END AS channel_new,
-- Step Below looks for information in channel or src_table columns to fill NULLs for source
CASE WHEN COALESCE(source, channel) IS NULL THEN src_table
ELSE trim(lower(source))
END AS source_new
FROM SESH
)
-- ,channel_final_cte as(
-- --- Last step tries to backfill all remaining null values for channel and source with the previous non-null touchpoint in the journey, and if none are found flags as 'direct'
SELECT 
time, session_id, date_time, event_date, ${unique_user_id}, src_table, event_type, td_market, td_brand, url, path, referral_page, 
channel AS channel_orig, TRIM(LOWER(channel_final)) AS channel_session,
source AS source_orig, TRIM(LOWER(source_final)) AS source_session,
campaign, context_col, conversion_flag, item_price, sess_rank_asc, sess_rank_desc
FROM  (
SELECT STEP2.*,
        -- get index of the touchpoints in each session to 
        RANK() OVER (PARTITION BY STEP2.session_id ORDER BY time ASC, context_col ASC) as sess_rank_asc,
        RANK() OVER (PARTITION BY STEP2.session_id ORDER BY time DESC, context_col DESC) as sess_rank_desc,
        -- Use LAST_VALUE to get the latest non-null value in the window, ignoring nulls.
        -- The window is partitioned over each canonical_id, ordered by timestamp.
        COALESCE(
          -- Below code backfills all NULL values with the first NON-NULL value it detects going in reverse time order 
          LAST_VALUE(channel_new) IGNORE NULLS OVER (
            PARTITION BY ${backfill_partition_col} ORDER BY date_time 
            ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
        ), 'organic') AS channel_final,
      COALESCE(
        LAST_VALUE(source_new) IGNORE NULLS OVER (
            PARTITION BY ${backfill_partition_col} ORDER BY date_time 
            ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
        ), src_table) AS source_final
    FROM
        STEP2
)
