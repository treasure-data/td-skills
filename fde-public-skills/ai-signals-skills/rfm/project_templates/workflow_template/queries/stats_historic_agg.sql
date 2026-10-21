SELECT T1.*, TD_TIME_STRING(time, 's!') AS event_date, CAST(time AS DOUBLE) AS unixtime_tstamp,
CASE 
WHEN rfm_segment = 'Champions' THEN 'Top customers. Bought recently, buy often and spend the most.'
WHEN rfm_segment = 'Loyal Customers' THEN 'Spend good money. Responsive to promotions with high activity. These are very active and valuable customers.'
WHEN rfm_segment = 'Potential Loyalists' THEN 'Recently engaged. Decent spend and frequency, but can be imporved over time.'
WHEN rfm_segment = 'Promising' THEN 'Bought recently. Some of them spend above average, but many fall below AVG.'
WHEN rfm_segment = 'New Customers' THEN 'Non-Buyers. Recently engaged with low frequency'
WHEN rfm_segment = 'Cannot lose them' THEN 'High Spenders likely to Churn. Spend a lot in the past, but have not engaged in a long time.'
WHEN rfm_segment = 'Need attention' THEN 'Active customers, but recency and spend is near or below AVG.'
WHEN rfm_segment = 'Hibernating' THEN 'Non-Buyers. Below AVG Recency and Frequency. Not worth give attention to them.'
WHEN rfm_segment = 'High Value Sleeping' THEN 'Past potential loyalist sleeping. Worth awaking their loosing interests again while they would be unresponsive.'
WHEN rfm_segment = 'Lost customers' THEN 'Non-Buyers. Lowest recency, but with some past activity. This segment has the lowest priority.'
ELSE 'All Customers'
END as segment_definition
FROM  ${stats_table} T1