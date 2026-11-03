with item_info as (
  select distinct 
    try(cast(${original_item_id_column_name} as varchar)) as itemid, 
    ${original_item_name_column_name} as item_name,
    ${original_item_category_column_name} as item_category
  from ${in_db}.${original_item_info_table}
)

select 
  tt.${original_user_id_column_name} as userid, 
  try(cast(tt.${original_item_id_column_name} as varchar)) as itemid, 
  ii.item_name,
  ii.item_category,
  tt.${original_timestamp_name} as tstamp
from ${in_db}.${original_item_transactions_table} tt 

join item_info ii 
on try(cast(tt.${original_item_id_column_name} as varchar)) = ii.itemid

where td_interval(tt.${original_timestamp_name}, '-${orders_lookback === '' ? 99999 : orders_lookback}d')
${transaction_filter}