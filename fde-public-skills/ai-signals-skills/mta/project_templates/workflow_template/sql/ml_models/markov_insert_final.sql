SELECT
  CAST(${session_unixtime} AS INTEGER) AS time,
  TD_TIME_STRING(${session_unixtime}, 's!') as run_time,
  channels,
  attribution_markov_algorithmic,
  removal_effect
  FROM ${markov_output_table}