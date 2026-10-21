WITH T1 AS (
  SELECT  ${td.last_results.cols_to_select},
ARRAY_JOIN(product_recommendations, ', ') as item_recs_combo,
ARRAY_JOIN(product_categories, ', ') as category_recs_combo,
COUNT(*) as event_cnt
FROM ${user_master_attr_table}
GROUP BY  ${td.last_results.cols_to_select}, product_recommendations, product_categories
)
SELECT
CAST(CURRENT_DATE AS VARCHAR) as event_date, 
${session_unixtime} as unixtime_tstamp,
T1.*
FROM T1 