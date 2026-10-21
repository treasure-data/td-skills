select t1.*, ${attributes_list}
from ${input_table} t1
left join ${customers_table}
on t1.${unique_user_id} = ${customers_table}.${unique_user_id}

