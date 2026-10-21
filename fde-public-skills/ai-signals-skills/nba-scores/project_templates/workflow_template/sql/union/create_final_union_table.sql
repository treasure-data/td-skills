SELECT 
time, date_time, event_date, 
hour(CAST(from_unixtime(time) AS TIMESTAMP)) as time_hour,
TRY(CAST(CAST(from_unixtime(time) AS TIMESTAMP) ${timeshift_change} interval '${timeshift_hours}' hour AS VARCHAR)) AS adjusted_time,
hour(CAST(from_unixtime(time) AS TIMESTAMP) ${timeshift_change} interval '${timeshift_hours}' hour)  AS adjusted_hour,
${unique_user_id}, src_table, td_market, td_brand, event_type,
--- select TOP-K channels by count and standerdize rest to 'others' 
CASE 
WHEN channel_session IN (SELECT col_value FROM nba_topk_values_lookup WHERE col_name = 'channel') THEN channel_session
ELSE 'others'
END AS channel, 
source_session as source,
campaign,
context_col,
conversion_flag,
item_price
FROM ${src_union_table}_session
