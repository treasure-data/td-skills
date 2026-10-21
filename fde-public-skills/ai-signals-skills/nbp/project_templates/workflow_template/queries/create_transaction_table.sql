WITH item_info AS (
  SELECT DISTINCT 
    TRY(CAST(${original_item_id_column_name} AS VARCHAR)) as itemid, 
    ${original_item_name_column_name} as item_name,
    ${original_item_category_column_name} as item_category
  FROM ${in_db}.${original_item_info_table}
)

SELECT 
  tt.${original_user_id_column_name} as userid, 
  TRY(CAST(tt.${original_item_id_column_name} AS VARCHAR)) as itemid, 
  ii.item_name,
  ii.item_category,
  tt.${original_timestamp_name} as tstamp
FROM ${in_db}.${original_item_transactions_table} tt 

JOIN item_info ii 
ON TRY(CAST(tt.${original_item_id_column_name} AS VARCHAR)) = ii.itemid

WHERE TD_INTERVAL(tt.${original_timestamp_name}, '-${orders_lookback === '' ? 99999 : orders_lookback}d')
${transaction_filter}