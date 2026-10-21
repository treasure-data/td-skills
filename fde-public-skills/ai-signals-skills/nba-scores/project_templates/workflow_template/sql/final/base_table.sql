select ${unique_user_id}, 
array_sort(array_distinct(array_agg(split(src_table, '.')[2]))) as activity_list
from ${src_union_table}_final
group by 1