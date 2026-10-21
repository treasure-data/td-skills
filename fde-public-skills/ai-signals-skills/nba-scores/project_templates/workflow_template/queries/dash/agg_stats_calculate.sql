SELECT
  ${session_id} AS session_id,
  '${td.each.column_name}' as metric_name, 
  TRY(CAST(${td.each.column_name} AS VARCHAR)) as metric_value ,
  count(*) as profile_count,
  SUM(conversion_flag) as converted_users
  FROM ${final_nba_metrics_table}
  group by 1, 2, 3

