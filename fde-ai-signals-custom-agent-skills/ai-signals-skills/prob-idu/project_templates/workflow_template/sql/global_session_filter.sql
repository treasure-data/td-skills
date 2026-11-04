with base as (
  select session_id,
  max(run_date) as event_time
  from prob_model_table_params
  group by 1
)
select session_id,
dense_rank() over (order by session_id desc) as session_rnk,
event_time
from  base
