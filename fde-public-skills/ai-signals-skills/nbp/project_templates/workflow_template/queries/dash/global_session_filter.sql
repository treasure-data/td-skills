with base as (
  select session_id, 
    max(cast(from_unixtime(unixtime_tstamp) as varchar)) as run_time
  from ${prefix}dash_model_param_stats_agg
  group by 1
)

select session_id, 
  dense_rank() over (order by session_id desc) as session_rnk, 
  run_time
from base