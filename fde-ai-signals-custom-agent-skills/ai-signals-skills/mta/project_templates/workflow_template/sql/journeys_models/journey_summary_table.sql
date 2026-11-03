select substr(event_date, 1, 4) as journey_year, count(*) as distinct_events, sum(events_num) as touchpoints, approx_distinct(conversion_journey_id) as distinct_journeys, round(avg(journey_length), 2) as avg_journey_touchpoints, approx_distinct(channel) as distinct_channels,
sum(conversion_flag) as conversions 
from mta_journeys
group by 1
order by 1 