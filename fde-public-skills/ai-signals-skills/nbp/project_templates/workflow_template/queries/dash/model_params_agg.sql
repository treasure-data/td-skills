WITH FILTERS AS (
  SELECT
    item_name, 
    item_category
  FROM ${prefix}itemid_name_product_mapping
  WHERE TRY(TRIM(lower(itemid))) NOT IN (
    SELECT DISTINCT itemid FROM ${prefix}transaction
  )
),
ORDERS AS (
  SELECT 
    MIN(least_recent_event) as least_recent_event,
    MAX(most_recent_event) as most_recent_event,
    date_diff('day', CAST(MIN(least_recent_event) as TIMESTAMP), 
              CAST(MAX(most_recent_event) as TIMESTAMP)) AS time_range_days,
    APPROX_DISTINCT(itemid) AS distinct_items_transactions_table,
    APPROX_DISTINCT(item_name) AS distinct_categories_transactions_table
  FROM ${prefix}itemid_name_product_mapping
), 

SIM AS (
  SELECT avg(score) as mean_sim, 
    APPROX_PERCENTILE(score, 0.5) as median_sim,
    STDDEV(score) as std_sim
  FROM ${prefix}item_similarity
)

SELECT 
  -- model params
  ${session_id} as session_id,
  CAST(CURRENT_DATE AS VARCHAR) as event_date, 
  ${session_unixtime} as unixtime_tstamp,
  'Train: ' || '${exclude_product_train}' || ', Recs: ' || '${exclude_product_recs}' || ', Exclude Rules: ' || '${exclusion_values}' as exclusion_filters,
  '${td.last_results.model_params}' AS model_params,
  '${td.last_results.model_metrics}' AS model_metrics,
  CARDINALITY(ARRAY_DISTINCT(FLATTEN(ARRAY_AGG(rec_items)))) AS distinct_items_recommended,

  -- filtering params
  (SELECT COUNT(DISTINCT item_name) FROM FILTERS) as filtered_item_count,
  (SELECT ARRAY_JOIN(ARRAY_DISTINCT(ARRAY_AGG(item_category)), ', ')  FROM FILTERS) as filtered_categories,
  (SELECT ARRAY_JOIN(ARRAY_DISTINCT(ARRAY_AGG(item_name)), ', ')  FROM FILTERS) as filtered_products,
  (SELECT APPROX_DISTINCT(userid) FROM ${prefix}user_item) AS users_with_recs,
  APPROX_DISTINCT(user_id) AS users_with_recs_after_filter,

  -- transaction params
  (SELECT least_recent_event FROM ORDERS) AS least_recent_event,
  (SELECT most_recent_event FROM ORDERS) AS most_recent_event,
  (SELECT time_range_days FROM ORDERS) AS time_range_days,
  (SELECT APPROX_DISTINCT(userid) FROM ${prefix}transaction) AS distinct_users_transactions_table,
  (SELECT distinct_items_transactions_table FROM ORDERS) AS distinct_items_transactions_table,
  (SELECT distinct_categories_transactions_table FROM ORDERS) AS distinct_categories_transactions_table,
  
  -- similarity params
  (SELECT mean_sim FROM SIM) AS mean_sim,
  (SELECT median_sim FROM SIM) as median_sim,
  (SELECT std_sim FROM SIM) as std_sim
FROM ${prefix}topk_recommended_items