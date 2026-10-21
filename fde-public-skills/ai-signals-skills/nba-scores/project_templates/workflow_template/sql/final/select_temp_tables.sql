SELECT table_name, ARRAY_JOIN(ARRAY_AGG(CONCAT('AGG.', column_name)), ', ') as agg_columns
FROM INFORMATION_SCHEMA.columns
WHERE table_schema = '${sink_database}' AND REGEXP_LIKE(table_name, 'next_best_time|next_best_channel|next_best_campaign') 
AND column_name not in ('time', '${unique_user_id}')
GROUP BY 1