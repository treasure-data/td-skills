--############## LAST TOUCH #################
select
'Last Touch' as attribution_type,
conversion_month,
channel, source, campaign,
sum(conversion_value) as total_conversions,
round(sum(conversion_value)*1.0 / sum(sum(conversion_flag)) over (partition by conversion_month), 3) as total_conv_attr_perc,
round(sum(conversion_value_total_sales), 3) as total_sales,
round(sum(conversion_value_total_sales)*1.0 / (sum(sum(conversion_value_total_sales)) over (partition by conversion_month) + 0.01), 3) as total_sales_attr_perc
from ${output_tables.journeys_table}
where journey_index=journey_length
group by 1, 2, 3, 4, 5

union all

--############## FIRST TOUCH #################
select
'First Touch' as attribution_type,
conversion_month,
channel, source, campaign,
sum(conversion_value) as total_conversions,
round(sum(conversion_value)*1.0 / sum(sum(conversion_flag)) over (partition by conversion_month), 7) as total_conv_attr_perc,
round(sum(conversion_value_total_sales), 3) as total_sales,
round(sum(conversion_value_total_sales)*1.0 / (sum(sum(conversion_value_total_sales)) over (partition by conversion_month) + 0.01), 7) as total_sales_attr_perc
from ${output_tables.journeys_table}
where journey_index=1
group by 1, 2, 3, 4, 5

union all

-----############## LINEAR TOUCH #################
select
'Linear' as attribution_type,
conversion_month,
channel, source, campaign,
round(sum(conversion_value*1.0/journey_length), 3) as total_conversions,
round(sum(conversion_value*1.0/journey_length) / sum(sum(conversion_flag)) over (partition by conversion_month), 7) as total_conv_attr_perc,
round(sum(conversion_value_total_sales*1.0/journey_length), 3) as total_sales,
round(sum(conversion_value_total_sales*1.0/journey_length) / (sum(sum(conversion_value_total_sales)) over (partition by conversion_month) + 0.01), 7) as total_sales_attr_perc
from ${output_tables.journeys_table}
group by 1, 2, 3, 4, 5

union all

--############## U-SHAPED #################
select
'U-Shaped' as attribution_type,
conversion_month,
channel, source, campaign,
round(sum(1.0*conversion_value*
case
when journey_length = 1 then 1.0
when journey_length = 2 then 0.5
else
case
when journey_index = 1 then ${u_shaped.first_touch_att}
when journey_index = journey_length then ${u_shaped.last_touch_att}
else (1.0-(${u_shaped.first_touch_att} + ${u_shaped.last_touch_att}))/(journey_length-2)
end
end), 3) as total_conversions,
round(
sum(1.0*conversion_value*
case
when journey_length = 1 then 1.0
when journey_length = 2 then 0.5
else
case
when journey_index = 1 then ${u_shaped.first_touch_att}
when journey_index = journey_length then ${u_shaped.last_touch_att}
else (1.0-(${u_shaped.first_touch_att} + ${u_shaped.last_touch_att}))/(journey_length-2)
end
end)
/ sum(sum(conversion_flag)) over (partition by conversion_month)
, 3) as total_conv_attr_perc,
round(sum(1.0*conversion_value_total_sales*
case
when journey_length = 1 then 1.0
when journey_length = 2 then 0.5
else
case
when journey_index = 1 then ${u_shaped.first_touch_att}
when journey_index = journey_length then ${u_shaped.last_touch_att}
else (1.0-(${u_shaped.first_touch_att} + ${u_shaped.last_touch_att}))/(journey_length-2)
end
end), 3) as total_sales,
round(
sum(1.0*conversion_value_total_sales*
case
when journey_length = 1 then 1.0
when journey_length = 2 then 0.5
else
case
when journey_index = 1 then ${u_shaped.first_touch_att}
when journey_index = journey_length then ${u_shaped.last_touch_att}
else (1.0-(${u_shaped.first_touch_att} + ${u_shaped.last_touch_att}))/(journey_length-2)
end
end)
/ (sum(sum(conversion_value_total_sales)) over (partition by conversion_month) + 0.01)
, 3) as total_sales_attr_perc
from ${output_tables.journeys_table}
group by 1, 2, 3, 4, 5
