--############## LAST TOUCH #################
SELECT
'Last Touch' AS attribution_type,
conversion_month,
channel, source, campaign,
SUM(conversion_value) AS total_conversions,
ROUND(SUM(conversion_value)*1.0 / SUM(SUM(conversion_flag)) OVER (PARTITION BY conversion_month), 3) AS total_conv_attr_perc,
ROUND(SUM(conversion_value_total_sales), 3) AS total_sales,
ROUND(SUM(conversion_value_total_sales)*1.0 / (SUM(SUM(conversion_value_total_sales)) OVER (PARTITION BY conversion_month) + 0.01), 3) AS total_sales_attr_perc
FROM ${output_tables.journeys_table}
WHERE journey_index=journey_length
GROUP BY 1, 2, 3, 4, 5

UNION ALL

--############## FIRST TOUCH #################
SELECT
'First Touch' AS attribution_type,
conversion_month,
channel, source, campaign,
SUM(conversion_value) AS total_conversions,
ROUND(SUM(conversion_value)*1.0 / SUM(SUM(conversion_flag)) OVER (PARTITION BY conversion_month), 7) AS total_conv_attr_perc,
ROUND(SUM(conversion_value_total_sales), 3) AS total_sales,
ROUND(SUM(conversion_value_total_sales)*1.0 / (SUM(SUM(conversion_value_total_sales)) OVER (PARTITION BY conversion_month) + 0.01), 7) AS total_sales_attr_perc
FROM ${output_tables.journeys_table}
WHERE journey_index=1
GROUP BY 1, 2, 3, 4, 5

UNION ALL

-----############## LINEAR TOUCH #################
SELECT
'Linear' AS attribution_type,
conversion_month,
channel, source, campaign,
ROUND(SUM(conversion_value*1.0/journey_length), 3) AS total_conversions,
ROUND(SUM(conversion_value*1.0/journey_length) / SUM(SUM(conversion_flag)) OVER (PARTITION BY conversion_month), 7) AS total_conv_attr_perc,
ROUND(SUM(conversion_value_total_sales*1.0/journey_length), 3) AS total_sales,
ROUND(SUM(conversion_value_total_sales*1.0/journey_length) / (SUM(SUM(conversion_value_total_sales)) OVER (PARTITION BY conversion_month) + 0.01), 7) AS total_sales_attr_perc
FROM ${output_tables.journeys_table}
GROUP BY 1, 2, 3, 4, 5

UNION ALL

--############## U-SHAPED #################
SELECT
'U-Shaped' AS attribution_type,
conversion_month,
channel, source, campaign,
ROUND(SUM(1.0*conversion_value*
CASE
WHEN journey_length = 1 THEN 1.0
WHEN journey_length = 2 THEN 0.5
ELSE
CASE
WHEN journey_index = 1 THEN ${u_shaped.first_touch_att}
WHEN journey_index = journey_length THEN ${u_shaped.last_touch_att}
ELSE (1.0-(${u_shaped.first_touch_att} + ${u_shaped.last_touch_att}))/(journey_length-2)
END
END), 3) AS total_conversions,
ROUND(
SUM(1.0*conversion_value*
CASE
WHEN journey_length = 1 THEN 1.0
WHEN journey_length = 2 THEN 0.5
ELSE
CASE
WHEN journey_index = 1 THEN ${u_shaped.first_touch_att}
WHEN journey_index = journey_length THEN ${u_shaped.last_touch_att}
ELSE (1.0-(${u_shaped.first_touch_att} + ${u_shaped.last_touch_att}))/(journey_length-2)
END
END)
/ SUM(SUM(conversion_flag)) OVER (PARTITION BY conversion_month)
, 3) AS total_conv_attr_perc,
ROUND(SUM(1.0*conversion_value_total_sales*
CASE
WHEN journey_length = 1 THEN 1.0
WHEN journey_length = 2 THEN 0.5
ELSE
CASE
WHEN journey_index = 1 THEN ${u_shaped.first_touch_att}
WHEN journey_index = journey_length THEN ${u_shaped.last_touch_att}
ELSE (1.0-(${u_shaped.first_touch_att} + ${u_shaped.last_touch_att}))/(journey_length-2)
END
END), 3) AS total_sales,
ROUND(
SUM(1.0*conversion_value_total_sales*
CASE
WHEN journey_length = 1 THEN 1.0
WHEN journey_length = 2 THEN 0.5
ELSE
CASE
WHEN journey_index = 1 THEN ${u_shaped.first_touch_att}
WHEN journey_index = journey_length THEN ${u_shaped.last_touch_att}
ELSE (1.0-(${u_shaped.first_touch_att} + ${u_shaped.last_touch_att}))/(journey_length-2)
END
END)
/ (SUM(SUM(conversion_value_total_sales)) OVER (PARTITION BY conversion_month) + 0.01)
, 3) AS total_sales_attr_perc
FROM ${output_tables.journeys_table}
GROUP BY 1, 2, 3, 4, 5
