WITH T1 AS (
  SELECT user_id as ${original_user_id_column_name}, itemid, product_rec_rank
  FROM ${prefix}topk_recommended_items
  CROSS JOIN UNNEST (rec_items) WITH ORDINALITY as t (itemid, product_rec_rank)
),
T3 as (
  SELECT T1.*,
    T2.item_name AS next_best_product,
    T2.item_category as next_best_category
  FROM T1
  JOIN ${prefix}itemid_name_product_mapping T2
    ON T1.itemid=T2.itemid
  ORDER BY ${original_user_id_column_name}, product_rec_rank asc
),
T4 AS (
  SELECT ${original_user_id_column_name},
  ARRAY_AGG(product_rec_rank ORDER BY product_rec_rank) as nbp_ranks,
  ARRAY_AGG(next_best_product ORDER BY product_rec_rank) as product_recommendations,
  ARRAY_AGG(next_best_category ORDER BY product_rec_rank) as product_categories,
  ARRAY_AGG(itemid ORDER BY product_rec_rank) as product_skus
  FROM T3
  GROUP BY ${original_user_id_column_name}
)
SELECT
  ${original_user_id_column_name},
  nbp_ranks,
  product_recommendations,
  product_categories,
  product_skus,
  ${td.last_results.query_syntax}
FROM T4
