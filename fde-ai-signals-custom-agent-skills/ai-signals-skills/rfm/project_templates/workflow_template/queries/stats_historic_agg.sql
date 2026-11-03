select t1.*, td_time_string(time, 's!') as event_date, cast(time as double) as unixtime_tstamp,
case 
when rfm_segment = 'Champions' then 'Top customers. Bought recently, buy often and spend the most.'
when rfm_segment = 'Loyal Customers' then 'Spend good money. Responsive to promotions with high activity. These are very active and valuable customers.'
when rfm_segment = 'Potential Loyalists' then 'Recently engaged. Decent spend and frequency, but can be imporved over time.'
when rfm_segment = 'Promising' then 'Bought recently. Some of them spend above average, but many fall below AVG.'
when rfm_segment = 'New Customers' then 'Non-Buyers. Recently engaged with low frequency'
when rfm_segment = 'Cannot lose them' then 'High Spenders likely to Churn. Spend a lot in the past, but have not engaged in a long time.'
when rfm_segment = 'Need attention' then 'Active customers, but recency and spend is near or below AVG.'
when rfm_segment = 'Hibernating' then 'Non-Buyers. Below AVG Recency and Frequency. Not worth give attention to them.'
when rfm_segment = 'High Value Sleeping' then 'Past potential loyalist sleeping. Worth awaking their loosing interests again while they would be unresponsive.'
when rfm_segment = 'Lost customers' then 'Non-Buyers. Lowest recency, but with some past activity. This segment has the lowest priority.'
else 'All Customers'
end as segment_definition
from  ${stats_table} t1