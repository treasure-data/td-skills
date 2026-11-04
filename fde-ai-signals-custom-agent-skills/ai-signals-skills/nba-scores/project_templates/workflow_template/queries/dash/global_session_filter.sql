with base as (
  select session_id, 
  td_time_string(max(time), 's!') as run_time
  from nba_dash_model_metrics
  group by 1
)
select session_id, 
dense_rank() over (order by session_id desc) as session_rnk, 
run_time
from  base