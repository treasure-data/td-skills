WITH purchases as (
  SELECT TRY(CAST(userid as VARCHAR)) as userid, 
    itemid as bought, 
    item_category as bought_cat, 
    item_name as bought_product 
  FROM ${prefix}transaction
  WHERE TD_INTERVAL(tstamp, '-${test_params.test_lookback}')
  AND userid IS NOT NULL
)
,
combined as (
  SELECT r.${original_user_id_column_name}, 
    product_skus as product_skus, 
    product_categories as product_categories, 
    product_recommendations as product_recommendations, 
    bought, 
    bought_cat, 
    bought_product,
    IF(ANY_MATCH(product_categories, x->x=bought_cat), 1, 0) as cat_match,
    IF(ANY_MATCH(product_skus, x->x=bought), 1, 0) as prod_match
  FROM ${user_master_attr_table} r 
  RIGHT JOIN purchases p on p.userid=r.${original_user_id_column_name}
)
,
similarity as (SELECT a.${original_user_id_column_name}, 
  MAX(CASE WHEN a.bought=b.rec THEN 1
    ELSE c.score END) as avg_similarity_score, 
    CAST(ANY_MATCH(ARRAY_AGG(c.score), x->x>=${td.last_results.med}) as INTEGER) as count_above_median
FROM combined a 
CROSS JOIN UNNEST(a.product_skus) AS b (rec)
JOIN ${prefix}item_similarity c ON a.bought=c.target_item_id AND b.rec=c.item_id
GROUP BY a.${original_user_id_column_name}, a.bought),

similarity_grouped as (
  SELECT ${original_user_id_column_name}, 
  AVG(avg_similarity_score) as avg_similarity_score,
  SUM(count_above_median) as count_above_median
  FROM similarity GROUP BY 1
)
,
combined_grouped as (
  SELECT ${original_user_id_column_name}, 
    ARRAY_DISTINCT(FLATTEN(ARRAY_AGG(product_skus))) as product_skus, 
    ARRAY_DISTINCT(FLATTEN(ARRAY_AGG(product_categories))) as product_categories, 
    ARRAY_DISTINCT(FLATTEN(ARRAY_AGG(product_recommendations))) as product_recommendations, 
    ARRAY_AGG(bought) as bought_skus, 
    ARRAY_AGG(bought_cat) as bought_categories, 
    ARRAY_AGG(bought_product) as bought_products,
    SUM(cat_match) as total_cat_match,
    SUM(prod_match) as total_prod_match
  FROM combined
  GROUP BY 1
)

SELECT combined_grouped.*,
  CAST(total_cat_match as DOUBLE)/CAST(CARDINALITY(bought_skus) as DOUBLE) as cat_match_rate,
  similarity_grouped.avg_similarity_score,
  similarity_grouped.count_above_median,
  CARDINALITY(bought_skus) as total_bought
FROM combined_grouped
LEFT JOIN similarity_grouped ON 
  similarity_grouped.${original_user_id_column_name}=combined_grouped.${original_user_id_column_name}
WHERE combined_grouped.${original_user_id_column_name} IS NOT NULL 