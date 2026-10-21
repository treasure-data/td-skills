with table_list as (
  select cast(json_parse('${aggregate_metrics_tables}') as array<json>) as yml_tbls
),
base as (
select
  json_extract_scalar(yml_tbl, '$.src_table') as src_table,
  json_extract_scalar(yml_tbl, '$.table_description') as table_description,
  json_extract_scalar(yml_tbl, '$.name') as event_name,
  json_extract_scalar(yml_tbl, '$.event_type') as event_type,
  json_extract_scalar(yml_tbl, '$.unixtime_col') as unixtime_col,
  json_extract_scalar(yml_tbl, '$.referral_col') as referral_col,
  json_extract_scalar(yml_tbl, '$.url_col') as url_col,
  json_extract_scalar(yml_tbl, '$.medium_col') as medium_col,
  json_extract_scalar(yml_tbl, '$.source_col') as source_col,
  json_extract_scalar(yml_tbl, '$.campaign_col') as campaign_col,
  json_extract_scalar(yml_tbl, '$.utm_mailing_col') as utm_mailing_col,
  json_extract_scalar(yml_tbl, '$.context_col') as context_col,
  json_extract_scalar(yml_tbl, '$.custom_filter') as custom_filter,
  json_extract_scalar(yml_tbl, '$.conversion_flag') as conversion_flag,
  json_extract_scalar(yml_tbl, '$.item_price') as item_price,
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
when apply_time_filter != 'true' and custom_filter is not null then 'WHERE ' || custom_filter
when (apply_time_filter = 'true' and time_filter_type = 'range')  and custom_filter is null then 'WHERE TD_TIME_RANGE(' || unixtime_col || ', ''' || time_range_start_date || ''', ''' ||  time_range_end_date || ''' )'
when (apply_time_filter = 'true' and time_filter_type = 'range')  and custom_filter is not null then 'WHERE TD_TIME_RANGE(' || unixtime_col || ', ''' || time_range_start_date || ''', ''' ||  time_range_end_date || ''' )' || ' AND ' || custom_filter
when (apply_time_filter = 'true' and time_filter_type = 'interval')  and custom_filter is null then 'WHERE TD_INTERVAL(' || unixtime_col || ', ''' || lookback_period || '/' || 'now' || ''' )'
when (apply_time_filter = 'true' and time_filter_type = 'interval')  and custom_filter is not null then 'WHERE TD_INTERVAL(' || unixtime_col || ', ''' || lookback_period || '/' || 'now' || ''' )' || ' AND ' || custom_filter
else ''
end as final_where_clause
from base

