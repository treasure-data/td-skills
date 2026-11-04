with purchases as (
  select try(cast(userid as varchar)) as userid, 
    itemid as bought, 
    item_category as bought_cat, 
    item_name as bought_product 
  from ${prefix}transaction
  where td_interval(tstamp, '-${test_params.test_lookback}')
  and userid is not null
)
,
combined as (
  select r.${original_user_id_column_name}, 
    product_skus as product_skus, 
    product_categories as product_categories, 
    product_recommendations as product_recommendations, 
    bought, 
    bought_cat, 
    bought_product,
    if(any_match(product_categories, x->x=bought_cat), 1, 0) as cat_match,
    if(any_match(product_skus, x->x=bought), 1, 0) as prod_match
  from ${user_master_attr_table} r 
  right join purchases p on p.userid=r.${original_user_id_column_name}
)
,
similarity as (select a.${original_user_id_column_name}, 
  max(case when a.bought=b.rec then 1
    else c.score end) as avg_similarity_score, 
    cast(any_match(array_agg(c.score), x->x>=${td.last_results.med}) as integer) as count_above_median
from combined a 
cross join unnest(a.product_skus) as b (rec)
join ${prefix}item_similarity c on a.bought=c.target_item_id and b.rec=c.item_id
group by a.${original_user_id_column_name}, a.bought),

similarity_grouped as (
  select ${original_user_id_column_name}, 
  avg(avg_similarity_score) as avg_similarity_score,
  sum(count_above_median) as count_above_median
  from similarity group by 1
)
,
combined_grouped as (
  select ${original_user_id_column_name}, 
    array_distinct(flatten(array_agg(product_skus))) as product_skus, 
    array_distinct(flatten(array_agg(product_categories))) as product_categories, 
    array_distinct(flatten(array_agg(product_recommendations))) as product_recommendations, 
    array_agg(bought) as bought_skus, 
    array_agg(bought_cat) as bought_categories, 
    array_agg(bought_product) as bought_products,
    sum(cat_match) as total_cat_match,
    sum(prod_match) as total_prod_match
  from combined
  group by 1
)

select combined_grouped.*,
  cast(total_cat_match as double)/cast(cardinality(bought_skus) as double) as cat_match_rate,
  similarity_grouped.avg_similarity_score,
  similarity_grouped.count_above_median,
  cardinality(bought_skus) as total_bought
from combined_grouped
left join similarity_grouped on 
  similarity_grouped.${original_user_id_column_name}=combined_grouped.${original_user_id_column_name}
where combined_grouped.${original_user_id_column_name} is not null 