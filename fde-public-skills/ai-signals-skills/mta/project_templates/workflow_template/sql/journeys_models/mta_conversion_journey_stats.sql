SELECT
IF(conversion_value_total_sales > 0, 'conversion', 'churn') as target,
conversion_month,
channel_list_final as journey_steps,
COUNT_IF(conversion_value_total_sales > 0) AS conversions,
COUNT(*) as total_events,
ROUND(AVG(journey_touchpoints_total), 2) as avg_journey_length,
APPROX_PERCENTILE(journey_touchpoints_total, 0.5) as median_journey_length,
MIN(date_time) as min_datetime,
MAX(date_time) as max_datetime,
ROUND(AVG(journey_duration_mins), 2) as avg_journey_duration_mins,
ROUND(AVG(journey_duration_days), 2) as avg_journey_duration_days,
APPROX_PERCENTILE(journey_duration_days, 0.5) as median_journey_duration_days,
ROUND(AVG(journey_touchpoints_total)*1.0/AVG(REGEXP_COUNT(channel_list_final, '>') + 1), 2) as touchpoints_per_distinct_step
FROM ${output_tables.journeys_table}
WHERE journey_index = 1
GROUP BY 1, 2, 3
