select channel, array_distinct(array_agg(source)) as source_list, array_distinct(array_agg(campaign)) as campaign_list,
count(*) as total_events, 
round((count(*)*1.0 / (select count(*) from mta_journeys))*100.0, 2) as perc_of_total_events,
sum(conversion_flag) as total_conversions,
round((sum(conversion_flag)*1.0 / (select sum(conversion_flag) from mta_journeys))*100.0, 2) as perc_of_total_conv,
sum(conversion_value_total_sales) as total_revenue,
round((sum(conversion_value_total_sales)*1.0 / (select sum(conversion_value_total_sales) from mta_journeys))*100.0, 2) as perc_of_total_revenue,
approx_distinct(conversion_journey_id) as distinct_journeys,
round(approx_distinct(conversion_journey_id)*1.0 / (select approx_distinct(conversion_journey_id) from mta_journeys)*100.0, 2) as perc_total_journeys,
approx_distinct(case when conversion_flag = 1.0 then conversion_journey_id else null end) as converted_journeys
from mta_journeys
group by 1