select
if(conversion_value_total_sales > 0, 'conversion', 'churn') as target,
conversion_month,
channel_list_final as journey_steps,
count_if(conversion_value_total_sales > 0) as conversions,
count(*) as total_events,
round(avg(journey_touchpoints_total), 2) as avg_journey_length,
approx_percentile(journey_touchpoints_total, 0.5) as median_journey_length,
min(date_time) as min_datetime,
max(date_time) as max_datetime,
round(avg(journey_duration_mins), 2) as avg_journey_duration_mins,
round(avg(journey_duration_days), 2) as avg_journey_duration_days,
approx_percentile(journey_duration_days, 0.5) as median_journey_duration_days,
round(avg(journey_touchpoints_total)*1.0/avg(regexp_count(channel_list_final, '>') + 1), 2) as touchpoints_per_distinct_step
from ${output_tables.journeys_table}
where journey_index = 1
group by 1, 2, 3
