SELECT T1.*, ${attributes_list}
FROM ${input_table} T1
LEFT JOIN ${customers_table}
ON T1.${unique_user_id} = ${customers_table}.${unique_user_id}

