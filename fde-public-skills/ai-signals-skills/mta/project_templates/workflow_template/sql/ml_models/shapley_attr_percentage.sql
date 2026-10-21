SELECT
  CAST(${session_unixtime} AS INTEGER) AS time,
  TD_TIME_STRING(${session_unixtime}, 's!') as run_time,
  channels, 
  ROUND(value, 2) as value,
  round(value / SUM(value) OVER (PARTITION BY size), 3) AS percentage,
  size AS step
FROM 
  ${shapley_output_table}
  where channels is not null
ORDER BY 
  step, 
  channels;