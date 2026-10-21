SELECT 
  ARRAY_JOIN(ARRAY_SORT(ARRAY_AGG(DISTINCT column_name)), ', ') 
    as cols_to_select
FROM information_schema.columns 
WHERE table_schema = '${sink_database}' AND table_name = '${user_master_attr_table}' 
AND REGEXP_LIKE(column_name, 'nbp_|nb_category') AND NOT REGEXP_LIKE(column_name, 'sku|ranks')