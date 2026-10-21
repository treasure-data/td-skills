SELECT T1.*, ${td.each.agg_columns}
FROM ${final_nba_metrics_table} T1 LEFT JOIN ${td.each.table_name} AGG 
ON T1.${unique_user_id} = AGG.${unique_user_id}