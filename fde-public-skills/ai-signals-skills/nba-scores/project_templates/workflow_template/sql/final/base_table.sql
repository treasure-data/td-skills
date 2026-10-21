SELECT ${unique_user_id}, 
ARRAY_SORT(ARRAY_DISTINCT(ARRAY_AGG(SPLIT(src_table, '.')[2]))) as activity_list
FROM ${src_union_table}_final
GROUP BY 1