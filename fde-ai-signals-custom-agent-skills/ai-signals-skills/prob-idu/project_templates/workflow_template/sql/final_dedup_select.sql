select array_join(array_agg(column_name),',') as cols
from information_schema.columns
where table_schema='${sink_database}' and table_name='${output_table}'
and column_name not in ('time', '${cluster_col_name}', 'avg_cluster_similarity')
