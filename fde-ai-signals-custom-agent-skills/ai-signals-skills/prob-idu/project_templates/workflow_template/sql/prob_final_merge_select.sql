-- Builds the column lists for prob_final_merge.sql from whatever attribute columns exist in ${output_table}
select
  array_join(array_agg(column_name order by ordinal_position), ', ') as merge_cols,
  array_join(array_agg(
    'ARRAY_JOIN(ARRAY_AGG(DISTINCT CAST(b.' || column_name || ' AS VARCHAR)) FILTER (WHERE b.' || column_name
    || ' IS NOT NULL AND TRIM(CAST(b.' || column_name || ' AS VARCHAR)) NOT IN ('''', '','')), chr(59) || '' '') AS ' || column_name
    order by ordinal_position), ', ') as merge_agg_cols,
  array_join(array_agg('cad.' || column_name order by ordinal_position), ', ') as merge_final_cols
from information_schema.columns
where table_schema = '${sink_database}'
  and table_name = '${output_table}'
  and column_name not in ('time', '${cluster_col_name}', '${id_col}', 'avg_cluster_similarity')
