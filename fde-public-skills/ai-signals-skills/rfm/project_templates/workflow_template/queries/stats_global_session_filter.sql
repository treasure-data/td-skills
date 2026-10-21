WITH BASE AS (
  SELECT session_id, MAX(run_time) as run_time
  FROM ${stats_table}_model_params
  GROUP BY 1
)
SELECT session_id, 
DENSE_RANK() OVER (order by session_id DESC) as session_rnk, 
run_time
FROM  BASE 
