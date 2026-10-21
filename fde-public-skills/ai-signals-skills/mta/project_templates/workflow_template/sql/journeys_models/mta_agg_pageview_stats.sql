SELECT
event_date,
'${agg_col}' as agg_col,
${agg_col} as col_value,
SUM(events_num) as total_events,
APPROX_DISTINCT(${unique_user_id}) as distinct_profiles,
APPROX_DISTINCT(IF(NOT REGEXP_LIKE(conversion_journey_id, '0.0'), conversion_journey_id, NULL)) as num_conv_journeys_in,
SUM(conversion_flag) as total_conversions,
ROUND(SUM(conversion_value_total_sales), 3) as total_order_value
FROM ${output_tables.journeys_table}
GROUP BY 1, 2, 3


