-- WITH BASE AS (
--   SELECT *,
--     LAG(channel) OVER (PARTITION BY conversion_journey_id ORDER BY time) AS prev_channel
--   FROM ${output_tables.journeys_table}
--   WHERE TD_INTERVAL(time, '-90d/now')
-- )

-- SELECT
--   td_time_string(MAX(time), 's!') AS date_time,
--   conversion_journey_id,
--   conversion_month,
--   array_join(
--     array_agg(channel ORDER BY time) 
--       FILTER (WHERE prev_channel IS NULL OR channel != prev_channel),
--     ' > '
--   ) AS journey,
--   MAX(channel_list_final) AS channel_list_final,
--   MAX(conversion_flag) AS conversion
-- FROM BASE
-- GROUP BY 2, 3



---- OLD query
  SELECT  td_time_string(max(time),'s!') as date_time,
conversion_journey_id ,
array_join(array_agg(channel order by time),' > ') as journey ,
 max(conversion_flag) as conversion
from ${output_tables.journeys_table}
group by 2
