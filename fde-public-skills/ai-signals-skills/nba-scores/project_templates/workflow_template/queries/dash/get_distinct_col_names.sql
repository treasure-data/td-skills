select column_name from information_schema.columns 
where table_schema='${sink_database}' and table_name='${final_nba_metrics_table}' and regexp_like(lower(column_name),'next_best|_flag')