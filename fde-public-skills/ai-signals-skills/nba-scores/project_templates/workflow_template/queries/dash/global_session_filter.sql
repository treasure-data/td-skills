WITH BASE AS (
  SELECT session_id, 
  TD_TIME_STRING(MAX(time), 's!') as run_time
  FROM nba_dash_model_metrics
  GROUP BY 1
)
SELECT session_id, 
DENSE_RANK() OVER (order by session_id DESC) as session_rnk, 
run_time
FROM  BASE