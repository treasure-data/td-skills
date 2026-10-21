select
  ${session_id} as session_id,
  '${td.each.column_name}' as metric_name, 
  try(cast(${td.each.column_name} as varchar)) as metric_value ,
  count(*) as profile_count,
  sum(conversion_flag) as converted_users
  from ${final_nba_metrics_table}
  group by 1, 2, 3

