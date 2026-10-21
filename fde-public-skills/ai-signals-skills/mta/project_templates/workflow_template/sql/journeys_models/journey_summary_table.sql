SELECT SUBSTR(event_date, 1, 4) as journey_year, COUNT(*) as distinct_events, SUM(events_num) as touchpoints, APPROX_DISTINCT(conversion_journey_id) as distinct_journeys, ROUND(AVG(journey_length), 2) as avg_journey_touchpoints, APPROX_DISTINCT(channel) as distinct_channels,
SUM(conversion_flag) as conversions 
FROM mta_journeys
GROUP BY 1
ORDER BY 1 