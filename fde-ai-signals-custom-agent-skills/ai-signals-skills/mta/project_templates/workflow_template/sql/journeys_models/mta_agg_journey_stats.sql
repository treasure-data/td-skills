select
if(conversion_value > 0, 'converted', 'non-converted') as journey_type,
'${agg_col}' as agg_col,
${agg_col} as col_value,
conversion_month,
max(conversion_flag) as conversion_flag,
sum(events_num) as total_events,
sum(conversion_flag) as conversions,
round(sum(conversion_value_total_sales), 2) as revenue,
approx_distinct(conversion_journey_id) as distinct_journeys,
approx_distinct(${unique_user_id}) as distinct_profiles,
min(journey_touchpoints_total) as min_journey_length,
sum(events_num) as total_journey_length,
max(journey_touchpoints_total) as max_journey_length,
round(avg(case when journey_index = 1 then journey_touchpoints_total else null end), 2) as avg_journey_length,
approx_percentile(journey_touchpoints_total, 0.5) as median_journey_length,
round(avg(case when journey_index = 1 then journey_duration_mins else null end), 2) as avg_journey_duration_mins,
round(avg(case when journey_index = 1 then journey_duration_days else null end), 2) as avg_journey_duration_days,
approx_percentile(journey_duration_days, 0.5) as median_journey_duration_days
from ${output_tables.journeys_table}
group by 1, 2, 3, 4



