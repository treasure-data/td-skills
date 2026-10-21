with agg as (
  select
${unique_user_id}, time,  order_id, order_status, order_type, coupon_used, 
array_join(array_distinct(array_agg(item_name)), ', ') as item_name,
array_join(array_distinct(array_agg(item_category)), ', ') as item_category,
sum(unit_price) as total_spend
from ${td.each.src_table}
where order_status in ('COMPLETE', 'PROCESSING')
group by ${unique_user_id}, time,  order_id, order_status, order_type, coupon_used
)
select time,
  td_time_string(time, 's!') as date_time,
  td_time_string(time, 'd!') as event_date,
  ${unique_user_id},
  '${td.each.src_table}' as src_table,
  concat('Order - ', order_type)  as event_type,
  cast(null as varchar) as url,
  cast(null as varchar) as path,
  cast(null as varchar) as referral_page,
  cast(null as varchar) as referral_domain,
  cast(null as varchar) as channel,
  cast(null as varchar) as source,
  coupon_used as campaign,
  cast(null as varchar) as utm_mailing,
  order_type as context_col,
  1.0 as conversion_flag,
  total_spend as item_price
  from agg



