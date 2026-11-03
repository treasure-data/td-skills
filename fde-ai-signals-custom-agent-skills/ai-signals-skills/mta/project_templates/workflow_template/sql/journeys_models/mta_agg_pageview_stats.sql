select
event_date,
'${agg_col}' as agg_col,
${agg_col} as col_value,
sum(events_num) as total_events,
approx_distinct(${unique_user_id}) as distinct_profiles,
approx_distinct(if(not regexp_like(conversion_journey_id, '0.0'), conversion_journey_id, null)) as num_conv_journeys_in,
sum(conversion_flag) as total_conversions,
round(sum(conversion_value_total_sales), 3) as total_order_value
from ${output_tables.journeys_table}
group by 1, 2, 3


