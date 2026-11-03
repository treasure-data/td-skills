select
  cast(${session_unixtime} as integer) as time,
  td_time_string(${session_unixtime}, 's!') as run_time,
  channels,
  attribution_markov_algorithmic,
  removal_effect
  from ${markov_output_table}