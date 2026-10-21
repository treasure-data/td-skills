SELECT column_name FROM information_schema.columns 
WHERE table_schema='${sink_database}' AND table_name='${final_nba_metrics_table}' AND REGEXP_LIKE(lower(column_name),'next_best|_flag')