SELECT 
  item_category, 
  ARRAY_JOIN(ARRAY_SORT(ARRAY_DISTINCT(ARRAY_AGG(item_name))), ', ') as item_list, 
  COUNT(*) as item_count
FROM ${prefix}itemid_name_product_mapping
GROUP BY 1