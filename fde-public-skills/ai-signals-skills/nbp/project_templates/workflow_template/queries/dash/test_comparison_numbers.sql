SELECT ${session_id} as session_id,
  SUM(total_bought) as total_items_bought,
  COUNT(*) as total_customers,
  SUM(count_above_median) as total_bought_above_median,
  SUM(total_prod_match) as total_product_matches,
  SUM(total_cat_match) as total_category_matches,
  COUNT_IF(avg_similarity_score>=${td.last_results.med}) as customers_above_median,
  COUNT_IF(total_cat_match>0) as customers_cat_match,
  1.0/(SELECT MAX_BY(distinct_items_recommended, session_id) FROM ${prefix}dash_model_param_stats_agg) as random_item_rate,
  1.0/(SELECT MAX_BY(distinct_categories_transactions_table, session_id) FROM ${prefix}dash_model_param_stats_agg) as random_category_rate
FROM ${prefix}testset
