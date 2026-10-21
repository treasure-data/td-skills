with filters as (
  select
    item_name, 
    item_category
  from ${prefix}itemid_name_product_mapping
  where try(trim(lower(itemid))) not in (
    select distinct itemid from ${prefix}transaction
  )
),
orders as (
  select 
    min(least_recent_event) as least_recent_event,
    max(most_recent_event) as most_recent_event,
    date_diff('day', cast(min(least_recent_event) as timestamp), 
              cast(max(most_recent_event) as timestamp)) as time_range_days,
    approx_distinct(itemid) as distinct_items_transactions_table,
    approx_distinct(item_name) as distinct_categories_transactions_table
  from ${prefix}itemid_name_product_mapping
), 

sim as (
  select avg(score) as mean_sim, 
    approx_percentile(score, 0.5) as median_sim,
    stddev(score) as std_sim
  from ${prefix}item_similarity
)

select 
  -- model params
  ${session_id} as session_id,
  cast(current_date as varchar) as event_date, 
  ${session_unixtime} as unixtime_tstamp,
  'Train: ' || '${exclude_product_train}' || ', Recs: ' || '${exclude_product_recs}' || ', Exclude Rules: ' || '${exclusion_values}' as exclusion_filters,
  '${td.last_results.model_params}' as model_params,
  '${td.last_results.model_metrics}' as model_metrics,
  cardinality(array_distinct(flatten(array_agg(rec_items)))) as distinct_items_recommended,

  -- filtering params
  (select count(distinct item_name) from filters) as filtered_item_count,
  (select array_join(array_distinct(array_agg(item_category)), ', ')  from filters) as filtered_categories,
  (select array_join(array_distinct(array_agg(item_name)), ', ')  from filters) as filtered_products,
  (select approx_distinct(userid) from ${prefix}user_item) as users_with_recs,
  approx_distinct(user_id) as users_with_recs_after_filter,

  -- transaction params
  (select least_recent_event from orders) as least_recent_event,
  (select most_recent_event from orders) as most_recent_event,
  (select time_range_days from orders) as time_range_days,
  (select approx_distinct(userid) from ${prefix}transaction) as distinct_users_transactions_table,
  (select distinct_items_transactions_table from orders) as distinct_items_transactions_table,
  (select distinct_categories_transactions_table from orders) as distinct_categories_transactions_table,
  
  -- similarity params
  (select mean_sim from sim) as mean_sim,
  (select median_sim from sim) as median_sim,
  (select std_sim from sim) as std_sim
from ${prefix}topk_recommended_items