WITH EXC AS (
  SELECT ARRAY_AGG(DISTINCT itemid) as exclude_items
  FROM ${prefix}itemid_name_product_mapping
  WHERE REGEXP_LIKE(${recs_exclusion_column}, '${recs_exclusion_values}')
)

SELECT T1.user_id,
T1.rec_items as rec_items_original,
SLICE(array_except(T1.rec_items, (SELECT exclude_items FROM EXC)),1,${max_recommended_items}) as rec_items
FROM ${prefix}topk_recommended_items_temp T1
