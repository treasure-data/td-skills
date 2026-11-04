with agg as (
  select
${unique_user_id}, time,  order_id, order_status, order_type, coupon_used, 
array_join(array_distinct(array_agg(item_name)), ', ') as item_name,
array_join(array_distinct(array_agg(item_category)), ', ') as item_category,
sum(unit_price) as total_spend
from ${td.each.src_table}
${td.each.final_where_clause}
group by ${unique_user_id}, time,  order_id, order_status, order_type, coupon_used
)
select time,
  td_time_string(time, 's!') as date_time,
  td_time_string(time, 'd!') as event_date,
  ${unique_user_id},
  '${td.each.src_table}' as src_table,
  concat('Order - ', order_type)  as event_type,
  ${td.each.market_col} as td_market,
  ${td.each.brand_col} as td_brand,
  'none' as url,
  'none' as path,
  'none' as referral_page,
  cast(null as varchar) as channel,
  cast(null as varchar) as source,
  coupon_used as campaign,
  ${td.each.context_col} as context_col,
  1.0 as conversion_flag,
  total_spend as item_price
  from agg
  

