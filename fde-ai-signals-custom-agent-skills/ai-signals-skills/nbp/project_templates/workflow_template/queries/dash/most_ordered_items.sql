with t1 as (
  select itemid, count(*) as times_ordered 
  from ${prefix}transaction
  group by 1
  order by 2 desc
  limit 15
)

select 
cast(current_date as varchar) as event_date, 
t1.*,
t2.item_name
from t1
left join ${prefix}itemid_name_product_mapping t2
on t1.itemid = t2.itemid