with base as (
  select 
  cast(current_date as varchar) as event_date,
  t1.target_item_id,
  t2.item_name as item_name,
  t1.item_id,
  t3.item_name as other_item_name,
  array_join(array_sort(array [t2.item_name, t3.item_name]), ' || ') as item_pair,
  round(t1.score, 4) as similarity
  from ${prefix}item_similarity t1
  left join ${prefix}itemid_name_product_mapping t2
  on t1.target_item_id = t2.itemid
  left join ${prefix}itemid_name_product_mapping t3
  on t1.item_id = t3.itemid
)
select event_date, item_pair, min(item_name) as item_name, max(other_item_name) as other_item_name, max(similarity) as similarity 
from base
group by 1, 2