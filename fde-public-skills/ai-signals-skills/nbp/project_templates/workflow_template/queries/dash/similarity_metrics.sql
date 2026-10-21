WITH BASE AS (
  SELECT 
  CAST(CURRENT_DATE AS VARCHAR) as event_date,
  T1.target_item_id,
  T2.item_name as item_name,
  T1.item_id,
  T3.item_name as other_item_name,
  ARRAY_JOIN(ARRAY_SORT(ARRAY [T2.item_name, T3.item_name]), ' || ') as item_pair,
  ROUND(T1.score, 4) as similarity
  FROM ${prefix}item_similarity T1
  LEFT JOIN ${prefix}itemid_name_product_mapping T2
  ON T1.target_item_id = T2.itemid
  LEFT JOIN ${prefix}itemid_name_product_mapping T3
  ON T1.item_id = T3.itemid
)
SELECT event_date, item_pair, MIN(item_name) AS item_name, MAX(other_item_name) AS other_item_name, MAX(similarity) AS similarity 
FROM BASE
GROUP BY 1, 2