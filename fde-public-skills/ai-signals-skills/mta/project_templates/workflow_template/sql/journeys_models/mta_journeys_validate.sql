SELECT channel, ARRAY_DISTINCT(ARRAY_AGG(source)) as source_list, ARRAY_DISTINCT(ARRAY_AGG(campaign)) as campaign_list,
COUNT(*) as total_events, 
ROUND((COUNT(*)*1.0 / (SELECT COUNT(*) FROM mta_journeys))*100.0, 2) AS perc_of_total_events,
SUM(conversion_flag) as total_conversions,
ROUND((SUM(conversion_flag)*1.0 / (SELECT SUM(conversion_flag) FROM mta_journeys))*100.0, 2) as perc_of_total_conv,
SUM(conversion_value_total_sales) as total_revenue,
ROUND((SUM(conversion_value_total_sales)*1.0 / (SELECT SUM(conversion_value_total_sales) FROM mta_journeys))*100.0, 2) as perc_of_total_revenue,
APPROX_DISTINCT(conversion_journey_id) as distinct_journeys,
ROUND(APPROX_DISTINCT(conversion_journey_id)*1.0 / (SELECT APPROX_DISTINCT(conversion_journey_id) FROM mta_journeys)*100.0, 2) AS perc_total_journeys,
APPROX_DISTINCT(CASE WHEN conversion_flag = 1.0 THEN conversion_journey_id ELSE NULL END) as converted_journeys
FROM mta_journeys
GROUP BY 1