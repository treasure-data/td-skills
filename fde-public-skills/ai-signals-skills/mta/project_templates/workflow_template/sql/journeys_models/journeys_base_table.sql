WITH BASE AS (
SELECT 
CASE 
    WHEN MAX(IF(sess_rank_desc = 1, time, NULL)) IS NOT NULL THEN MAX(time)
    ELSE MIN(time)
    END AS time,
session_id, 
CASE 
    WHEN MAX(IF(sess_rank_desc = 1, date_time, NULL)) IS NOT NULL THEN MAX(date_time)
    ELSE MIN(date_time)
    END AS date_time,
min(event_date) as event_date, min(${unique_user_id}) as ${unique_user_id}, min(src_table) AS  src_table, min(url) as url,
min(path) as path, min(referral_domain) AS referral_domain, 
event_type, 

CASE
WHEN REGEXP_LIKE(lower(channel_final), 'socia|facebook|linkedin|instagram|tik') THEN 'social' 
WHEN REGEXP_LIKE(lower(channel_final), 'search') THEN 'paid_search'
WHEN REGEXP_LIKE(lower(channel_final), 'video|youtube') THEN 'video'  
WHEN REGEXP_LIKE(lower(channel_final), 'display') THEN 'display' 
WHEN REGEXP_LIKE(lower(channel_final), 'web|referr') THEN 'referral'
ELSE channel_final
END AS channel_final,
source_final, 
campaign, context_col, 
count(*) as events_num, MAX(conversion_flag) AS conversion_flag, MAX(item_price) as item_price,
-- min(sess_rank_asc) as first_event_rnk, MIN(sess_rank_desc) as last_event_rank, max(date_time) as max_touch_datetime, 
min(sess_rank_asc) as sess_rank_asc, min(sess_rank_desc) as sess_rank_desc
   FROM ${journeys_input_table}
  GROUP BY session_id, channel_final, event_type, source_final, campaign, context_col
  ORDER BY session_id,  sess_rank_asc
)
,
HIST AS (
SELECT session_id,
MAX(time) - MIN(time) AS session_length_sec,
-- GREATEST(MAX(sess_rank_asc), MAX(sess_rank_desc)) AS session_length,
SUM(events_num) as session_length,
MAX(conversion_flag) as converted_session_flag,
LEAST(SUM(conversion_flag), 1) as total_conversions, 
MAX(item_price) AS total_order_value,
FILTER(ARRAY_DISTINCT(array_agg(channel_final ORDER BY date_time)), x -> x IS NOT NULL) as channel_list_distinct,
FILTER(array_agg(CONCAT(channel_final, ' : ', CAST(events_num AS VARCHAR)) ORDER BY date_time), x -> x IS NOT NULL) as channel_order,
-- ARRAY_JOIN(ARRAY_AGG(DISTINCT channel_final), ', ') as channel_list,
FILTER(array_agg(CONCAT(source_final, ' : ', CAST(events_num AS VARCHAR)) ORDER BY date_time), x -> x IS NOT NULL) as source_order,
FILTER(array_agg(CONCAT(campaign, ' : ', CAST(events_num AS VARCHAR))  ORDER BY date_time), x -> x IS NOT NULL) as campaign_order,
FILTER(array_agg(CONCAT(context_col, ' : ', CAST(events_num AS VARCHAR)) ORDER BY date_time), x -> x IS NOT NULL) as context_order,
FILTER(array_agg(CONCAT(event_type, ' : ', CAST(events_num AS VARCHAR)) ORDER BY date_time), x -> x IS NOT NULL) as event_order,
ARRAY_JOIN(FILTER(array_agg(CONCAT(channel_final, '(', event_type, ') : ',  CAST(events_num AS VARCHAR)) ORDER BY date_time), x -> x IS NOT NULL), ' -> ') as touchpoint_histogram
-- json_format(CAST(HISTOGRAM(channel_final || ' - ' || event_type ORDER BY date_time) AS JSON)) as touchpoint_histogram
FROM BASE
GROUP BY 1
)
SELECT 
BASE.*,
CASE WHEN BASE.sess_rank_asc = 1 THEN HIST.session_length_sec ELSE 0 END AS session_length_sec,
CASE WHEN BASE.sess_rank_asc = 1 THEN HIST.session_length ELSE 0 END AS session_length,
-- HIST.session_length_events,
HIST.converted_session_flag,  HIST.total_conversions, BASE.item_price AS total_order_value,
CASE WHEN BASE.sess_rank_asc = 1 THEN HIST.channel_list_distinct ELSE NULL END AS channel_list_distinct,
CASE WHEN BASE.sess_rank_asc = 1 THEN HIST.channel_order ELSE NULL END AS channel_order,
CASE WHEN BASE.sess_rank_asc = 1 THEN HIST.source_order ELSE NULL END AS source_order,
CASE WHEN BASE.sess_rank_asc = 1 THEN HIST.campaign_order ELSE NULL END AS campaign_order,
CASE WHEN BASE.sess_rank_asc = 1 THEN HIST.context_order ELSE NULL END AS context_order,
CASE WHEN BASE.sess_rank_asc = 1 THEN HIST.event_order ELSE NULL END AS event_order,
CASE WHEN BASE.sess_rank_asc = 1 THEN HIST.touchpoint_histogram ELSE NULL END AS touchpoint_histogram
FROM BASE
INNER JOIN HIST
ON BASE.session_id = HIST.session_id
--- REMOVES JOURNEYS WHERE 'direct' is the only channel in the journey
WHERE channel_list_distinct <> ARRAY['direct']






