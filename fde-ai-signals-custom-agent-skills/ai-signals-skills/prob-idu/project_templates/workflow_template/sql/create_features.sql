with t1 as (
select column_name from information_schema.columns
where table_name = 'prob_hash_table' and table_schema = '${sink_database}'
and column_name not in ('time','${id_col}','unified_contact_id','td_client_id')
)
select
array_join(array_sort(array_distinct(filter(array_agg(column_name), x -> x is not null))), ', ') as column_names,
array_join(array_sort(array_distinct(filter(array_agg(concat('"', column_name, '"')), x -> x is not null))), ', ') as column_list

from t1
