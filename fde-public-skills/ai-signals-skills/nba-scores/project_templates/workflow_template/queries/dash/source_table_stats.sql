select
  ${session_id} as session_id,
  src_table as source_table,
  approx_distinct(${unique_user_id}) as unique_profiles,
  count(*) as num_events,
  sum(conversion_flag) as total_conversions,
  round(sum(item_price), 3) as total_spend,
  date_diff('day', cast(min(adjusted_time) as timestamp), cast(max(adjusted_time) as timestamp)) as day_range,
  min(adjusted_time) as min_date,
  max(adjusted_time) as max_date
from ${src_union_table}_final
group by 1, 2