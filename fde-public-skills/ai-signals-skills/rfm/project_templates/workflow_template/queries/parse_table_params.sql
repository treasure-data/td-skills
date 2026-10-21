with table_list as (
  select cast(json_parse('${aggregate_metrics_tables}') AS ARRAY<JSON>) as yml_tbls
),

BASE AS (
SELECT
  json_extract_scalar(yml_tbl, '$.src_table') as src_table,
  json_extract_scalar(yml_tbl, '$.name') as event_name,
  json_extract_scalar(yml_tbl, '$.unixtime_col') AS unixtime_col,
  json_extract_scalar(yml_tbl, '$.join_key') AS join_key,
  json_extract_scalar(yml_tbl, '$.order_amount') AS order_amount,
  json_extract_scalar(yml_tbl, '$.context_col') AS context_col,
  json_extract_scalar(yml_tbl, '$.custom_filter') AS custom_filter,
  json_extract_scalar(yml_tbl, '$.apply_time_filter') AS apply_time_filter,
  json_extract_scalar(yml_tbl, '$.query_type') AS query_type,
  '${time_filter_type}' AS time_filter_type,
  '${time_range_start_date}' AS time_range_start_date,
  '${time_range_end_date}' AS time_range_end_date,
  '${lookback_period}' AS lookback_period
FROM table_list
CROSS JOIN UNNEST(yml_tbls) AS t(yml_tbl)
)
SELECT BASE.*,
CASE
WHEN apply_time_filter != 'yes' AND custom_filter IS NOT NULL THEN 'WHERE ' || custom_filter
WHEN (apply_time_filter = 'yes' AND time_filter_type = 'range')  AND custom_filter IS NULL THEN 'WHERE  TD_TIME_RANGE(' || unixtime_col || ', ''' || time_range_start_date || ''', ''' ||  time_range_end_date || ''' )'
WHEN (apply_time_filter = 'yes' AND time_filter_type = 'range')  AND custom_filter IS NOT NULL THEN 'WHERE  TD_TIME_RANGE(' || unixtime_col || ', ''' || time_range_start_date || ''', ''' ||  time_range_end_date || ''' )' || ' AND ' || custom_filter
WHEN (apply_time_filter = 'yes' AND time_filter_type = 'interval')  AND custom_filter IS NULL THEN 'WHERE  TD_INTERVAL(' || unixtime_col || ', ''' || lookback_period || '/' || 'now' || ''' )'
WHEN (apply_time_filter = 'yes' AND time_filter_type = 'interval')  AND custom_filter IS NOT NULL THEN 'WHERE  TD_INTERVAL(' || unixtime_col || ', ''' || lookback_period || '/' || 'now' || ''' )' || ' AND ' || custom_filter
ELSE ''
END AS final_where_clause
FROM BASE
