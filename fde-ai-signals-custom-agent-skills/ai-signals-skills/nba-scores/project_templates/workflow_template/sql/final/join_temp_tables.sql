select t1.*, ${td.each.agg_columns}
from ${final_nba_metrics_table} t1 left join ${td.each.table_name} agg 
on t1.${unique_user_id} = agg.${unique_user_id}