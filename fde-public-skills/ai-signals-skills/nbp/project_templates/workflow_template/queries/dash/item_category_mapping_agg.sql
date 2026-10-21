select 
  item_category, 
  array_join(array_sort(array_distinct(array_agg(item_name))), ', ') as item_list, 
  count(*) as item_count
from ${prefix}itemid_name_product_mapping
group by 1