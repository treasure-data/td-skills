with t1 as (
  select  ${td.last_results.cols_to_select},
array_join(product_recommendations, ', ') as item_recs_combo,
array_join(product_categories, ', ') as category_recs_combo,
count(*) as event_cnt
from ${user_master_attr_table}
group by  ${td.last_results.cols_to_select}, product_recommendations, product_categories
)
select
cast(current_date as varchar) as event_date, 
${session_unixtime} as unixtime_tstamp,
t1.*
from t1 