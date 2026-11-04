with t1 as (
  select user_id as ${original_user_id_column_name}, itemid, product_rec_rank
  from ${prefix}topk_recommended_items
  cross join unnest (rec_items) with ordinality as t (itemid, product_rec_rank)
),
t3 as (
  select t1.*,
    t2.item_name as next_best_product,
    t2.item_category as next_best_category
  from t1
  join ${prefix}itemid_name_product_mapping t2
    on t1.itemid=t2.itemid
  order by ${original_user_id_column_name}, product_rec_rank asc
),
t4 as (
  select ${original_user_id_column_name},
  array_agg(product_rec_rank order by product_rec_rank) as nbp_ranks,
  array_agg(next_best_product order by product_rec_rank) as product_recommendations,
  array_agg(next_best_category order by product_rec_rank) as product_categories,
  array_agg(itemid order by product_rec_rank) as product_skus
  from t3
  group by ${original_user_id_column_name}
)
select
  ${original_user_id_column_name},
  nbp_ranks,
  product_recommendations,
  product_categories,
  product_skus,
  ${td.last_results.query_syntax}
from t4
