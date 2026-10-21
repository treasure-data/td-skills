WITH BASE AS (
  SELECT session_id, 
    MAX(CAST(FROM_UNIXTIME(unixtime_tstamp) as VARCHAR)) as run_time
  FROM ${prefix}dash_model_param_stats_agg
  GROUP BY 1
)

SELECT session_id, 
  DENSE_RANK() OVER (order by session_id DESC) as session_rnk, 
  run_time
FROM BASE