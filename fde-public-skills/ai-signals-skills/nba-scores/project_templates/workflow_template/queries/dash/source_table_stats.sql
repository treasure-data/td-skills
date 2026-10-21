SELECT
  ${session_id} as session_id,
  src_table as source_table,
  APPROX_DISTINCT(${unique_user_id}) as unique_profiles,
  COUNT(*) as num_events,
  SUM(conversion_flag) AS total_conversions,
  ROUND(SUM(item_price), 3) AS total_spend,
  date_diff('day', CAST(MIN(adjusted_time) AS TIMESTAMP), CAST(MAX(adjusted_time) AS TIMESTAMP)) AS day_range,
  MIN(adjusted_time) as min_date,
  MAX(adjusted_time) as max_date
FROM ${src_union_table}_final
GROUP BY 1, 2