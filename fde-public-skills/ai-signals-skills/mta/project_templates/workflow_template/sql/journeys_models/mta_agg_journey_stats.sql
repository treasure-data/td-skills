SELECT
IF(conversion_value > 0, 'converted', 'non-converted') AS journey_type,
'${agg_col}' as agg_col,
${agg_col} as col_value,
conversion_month,
MAX(conversion_flag) AS conversion_flag,
SUM(events_num) as total_events,
SUM(conversion_flag) as conversions,
ROUND(SUM(conversion_value_total_sales), 2) as revenue,
APPROX_DISTINCT(conversion_journey_id) as distinct_journeys,
APPROX_DISTINCT(${unique_user_id}) as distinct_profiles,
MIN(journey_touchpoints_total) as min_journey_length,
SUM(events_num) as total_journey_length,
MAX(journey_touchpoints_total) as max_journey_length,
ROUND(AVG(CASE WHEN journey_index = 1 THEN journey_touchpoints_total ELSE NULL END), 2) AS avg_journey_length,
APPROX_PERCENTILE(journey_touchpoints_total, 0.5) as median_journey_length,
ROUND(AVG(CASE WHEN journey_index = 1 THEN journey_duration_mins ELSE NULL END), 2) AS avg_journey_duration_mins,
ROUND(AVG(CASE WHEN journey_index = 1 THEN journey_duration_days ELSE NULL END), 2) AS avg_journey_duration_days,
APPROX_PERCENTILE(journey_duration_days, 0.5) as median_journey_duration_days
FROM ${output_tables.journeys_table}
GROUP BY 1, 2, 3, 4



