with table_list as (
  select cast(json_parse('${aggregate_metrics_tables}') as array<json>) as yml_tbls
),

base as (
select
  json_extract_scalar(yml_tbl, '$.src_table') as src_table,
  json_extract_scalar(yml_tbl, '$.name') as event_name,
  json_extract_scalar(yml_tbl, '$.unixtime_col') as unixtime_col,
  json_extract_scalar(yml_tbl, '$.join_key') as join_key,
  json_extract_scalar(yml_tbl, '$.order_amount') as order_amount,
  json_extract_scalar(yml_tbl, '$.context_col') as context_col,
  json_extract_scalar(yml_tbl, '$.custom_filter') as custom_filter,
  json_extract_scalar(yml_tbl, '$.apply_time_filter') as apply_time_filter,
  json_extract_scalar(yml_tbl, '$.query_type') as query_type,
  '${time_filter_type}' as time_filter_type,
  '${time_range_start_date}' as time_range_start_date,
  '${time_range_end_date}' as time_range_end_date,
  '${lookback_period}' as lookback_period
from table_list
cross join unnest(yml_tbls) as t(yml_tbl)
)
select base.*,
case
when apply_time_filter != 'yes' and custom_filter is not null then 'WHERE ' || custom_filter
when (apply_time_filter = 'yes' and time_filter_type = 'range')  and custom_filter is null then 'WHERE  TD_TIME_RANGE(' || unixtime_col || ', ''' || time_range_start_date || ''', ''' ||  time_range_end_date || ''' )'
when (apply_time_filter = 'yes' and time_filter_type = 'range')  and custom_filter is not null then 'WHERE  TD_TIME_RANGE(' || unixtime_col || ', ''' || time_range_start_date || ''', ''' ||  time_range_end_date || ''' )' || ' AND ' || custom_filter
when (apply_time_filter = 'yes' and time_filter_type = 'interval')  and custom_filter is null then 'WHERE  TD_INTERVAL(' || unixtime_col || ', ''' || lookback_period || '/' || 'now' || ''' )'
when (apply_time_filter = 'yes' and time_filter_type = 'interval')  and custom_filter is not null then 'WHERE  TD_INTERVAL(' || unixtime_col || ', ''' || lookback_period || '/' || 'now' || ''' )' || ' AND ' || custom_filter
else ''
end as final_where_clause
from base
