WITH T1 AS (
  SELECT itemid, count(*) as times_ordered 
  FROM ${prefix}transaction
  GROUP BY 1
  ORDER BY 2 desc
  LIMIT 15
)

SELECT 
CAST(CURRENT_DATE AS VARCHAR) as event_date, 
T1.*,
T2.item_name
FROM T1
LEFT JOIN ${prefix}itemid_name_product_mapping T2
ON T1.itemid = T2.itemid