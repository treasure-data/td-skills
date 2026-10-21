select
  cast(${session_unixtime} as integer) as time,
  td_time_string(${session_unixtime}, 's!') as run_time,
  channels, 
  round(value, 2) as value,
  round(value / sum(value) over (partition by size), 3) as percentage,
  size as step
from 
  ${shapley_output_table}
  where channels is not null
order by 
  step, 
  channels;