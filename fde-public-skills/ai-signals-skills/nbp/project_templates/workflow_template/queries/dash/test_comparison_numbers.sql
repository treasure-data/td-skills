select ${session_id} as session_id,
  sum(total_bought) as total_items_bought,
  count(*) as total_customers,
  sum(count_above_median) as total_bought_above_median,
  sum(total_prod_match) as total_product_matches,
  sum(total_cat_match) as total_category_matches,
  count_if(avg_similarity_score>=${td.last_results.med}) as customers_above_median,
  count_if(total_cat_match>0) as customers_cat_match,
  1.0/(select max_by(distinct_items_recommended, session_id) from ${prefix}dash_model_param_stats_agg) as random_item_rate,
  1.0/(select max_by(distinct_categories_transactions_table, session_id) from ${prefix}dash_model_param_stats_agg) as random_category_rate
from ${prefix}testset
