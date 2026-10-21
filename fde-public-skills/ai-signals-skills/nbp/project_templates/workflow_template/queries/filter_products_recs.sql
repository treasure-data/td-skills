with exc as (
  select array_agg(distinct itemid) as exclude_items
  from ${prefix}itemid_name_product_mapping
  where regexp_like(${recs_exclusion_column}, '${recs_exclusion_values}')
)

select t1.user_id,
t1.rec_items as rec_items_original,
slice(array_except(t1.rec_items, (select exclude_items from exc)),1,${max_recommended_items}) as rec_items
from ${prefix}topk_recommended_items_temp t1
