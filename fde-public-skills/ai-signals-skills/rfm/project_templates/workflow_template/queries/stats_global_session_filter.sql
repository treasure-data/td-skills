with base as (
  select session_id, max(run_time) as run_time
  from ${stats_table}_model_params
  group by 1
)
select session_id, 
dense_rank() over (order by session_id desc) as session_rnk, 
run_time
from  base 
