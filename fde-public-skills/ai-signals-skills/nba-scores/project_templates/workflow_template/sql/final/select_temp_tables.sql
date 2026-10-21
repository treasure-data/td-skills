select table_name, array_join(array_agg(concat('AGG.', column_name)), ', ') as agg_columns
from information_schema.columns
where table_schema = '${sink_database}' and regexp_like(table_name, 'next_best_time|next_best_channel|next_best_campaign') 
and column_name not in ('time', '${unique_user_id}')
group by 1