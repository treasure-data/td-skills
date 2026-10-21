select 
  array_join(array_sort(array_agg(distinct column_name)), ', ') 
    as cols_to_select
from information_schema.columns 
where table_schema = '${sink_database}' and table_name = '${user_master_attr_table}' 
and regexp_like(column_name, 'nbp_|nb_category') and not regexp_like(column_name, 'sku|ranks')