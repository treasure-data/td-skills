WITH TOP_CHANNELS AS (
SELECT channel_final,
count(*)*1.0 / (SELECT COUNT(*) FROM mta_journeys_base) as perc_activity,
SUM(total_conversions)*1.0 / (SELECT SUM(total_conversions) FROM mta_journeys_base) as perc_conv
FROM mta_journeys_base 
WHERE channel_final IS NOT NULL AND channel_final != ''
GROUP BY 1
HAVING (count(*)*1.0 / (SELECT COUNT(*) FROM mta_journeys_base)) > ${top_k_channel_perc} OR SUM(total_conversions)*1.0 / (SELECT SUM(total_conversions) FROM mta_journeys_base) > ${top_k_conv_perc}
)
,
BASE AS (
SELECT 
J.*,
-- session_id, date_time, conversion_flag, 
${unique_user_id} || '@' || CAST(SUM(conversion_flag) OVER (PARTITION BY ${unique_user_id}  ORDER BY time DESC, context_col) AS VARCHAR) AS conversion_journey_id,
-- total_conversions, converted_session_flag, channel_final, campaign, event_type, context_col, session_length, session_length_sec
-- -- breaking into subsequences delimited by conversions. We do this b/c once a customer converts, attribution should be reset.
-- -- At least this is the case for eCommerce where repeat purchases are expected. Probably applies less to SaaS for which the initial conversion matters most
(SELECT ARRAY_AGG(channel_final) FROM TOP_CHANNELS) as top_channels
FROM mta_journeys_base J
)
,
-- Filter touchpoints to only those within max_journey_days before the conversion event.
-- conversion_time = MAX(time) within the journey because journeys are ordered DESC
-- and the conversion event is always the most recent touchpoint in each journey bucket.
FILTERED AS (
  SELECT
    *,
    MAX(time) OVER (PARTITION BY conversion_journey_id) AS conversion_time
  FROM BASE
)
,
JOUR AS (
SELECT
time,
date_time,
event_date,
TD_TIME_STRING(MAX(time) OVER (PARTITION BY conversion_journey_id), 'M!') AS conversion_month,
format_datetime(from_unixtime(time), 'EEEE') AS day_of_week,
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
IF(CONTAINS(top_channels, channel_final), channel_final, 'other') AS channel,
-- source_orig,
source_final as source,
campaign,
conversion_journey_id,
conversion_flag,
-- useful for calculating various attribution models
COUNT(1) OVER (PARTITION BY conversion_journey_id) AS journey_length,
ROW_NUMBER() OVER (PARTITION BY conversion_journey_id ORDER BY time) AS journey_index,
APPROX_DISTINCT(session_id) OVER (PARTITION BY conversion_journey_id) AS total_sessions,
SUM(session_length) OVER (PARTITION BY conversion_journey_id) as journey_touchpoints_total,
SUM(session_length_sec) OVER (PARTITION BY conversion_journey_id) as journey_sessions_sec_total,
-- just "filling" in the conversion value for each session
MAX(total_conversions) OVER (PARTITION BY conversion_journey_id ORDER BY time DESC) AS conversion_value,
MAX(total_order_value) OVER (PARTITION BY conversion_journey_id ORDER BY time DESC) AS conversion_value_total_sales,
touchpoint_histogram,
session_id,
session_length_sec,
session_length,
sess_rank_asc,
sess_rank_desc,
top_channels,
ARRAY_DISTINCT(TRANSFORM(channel_list_distinct, x -> IF(CONTAINS(top_channels, x), x, 'other'))) as channel_list_temp
FROM FILTERED
WHERE time >= conversion_time - (${max_journey_days} * 86400)
ORDER BY time
)
,
-- Aggregate session-level data to the conversion journey level:
-- - Flatten all session channel arrays into a single distinct list per journey
-- - Build the touchpoint history string for the journey
-- - Capture journey start time for cumulative ordering in the next step
HIST AS (
  SELECT conversion_journey_id,
  MIN(${unique_user_id}) as hist_user_id,
  ARRAY_JOIN(ARRAY_AGG(REGEXP_REPLACE(touchpoint_histogram, '{|}|"', '') ORDER BY journey_index), ' -> ') as journey_history,
  ARRAY_DISTINCT(FLATTEN(ARRAY_AGG(channel_list_temp))) as journey_channels,
  MIN(time) as journey_start_time,
  (MAX(time) - MIN(time)) / 60 as journey_duration_mins,
  (MAX(time) - MIN(time)) / 86400 as journey_duration_days
  FROM JOUR
  GROUP BY 1
)
,
-- Build a cumulative channel list that carries forward across conversion journeys:
-- For each journey, collect distinct channels from ALL prior journeys (ordered by time)
-- so that channels are never "lost" when a new conversion resets the journey boundary
HIST_CUMULATIVE AS (
  SELECT conversion_journey_id,
  journey_history,
  ARRAY_JOIN(
    ARRAY_DISTINCT(FLATTEN(
      ARRAY_AGG(journey_channels) OVER (
        PARTITION BY hist_user_id
        ORDER BY journey_start_time
        ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
      )
    )), ' > '
  ) as channel_list_final,
  journey_duration_mins,
  journey_duration_days
  FROM HIST
)
SELECT JOUR.*,
IF(journey_index = 1, HIST_CUMULATIVE.channel_list_final, NULL) AS channel_list_final,
HIST_CUMULATIVE.journey_history, HIST_CUMULATIVE.journey_duration_mins, HIST_CUMULATIVE.journey_duration_days
FROM JOUR
JOIN HIST_CUMULATIVE
ON JOUR.conversion_journey_id = HIST_CUMULATIVE.conversion_journey_id




