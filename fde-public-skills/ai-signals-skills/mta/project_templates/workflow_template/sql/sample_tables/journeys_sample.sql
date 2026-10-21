SELECT * FROM ${tbl} WHERE ${unique_user_id} IN (SELECT DISTINCT ${unique_user_id} FROM ${src_union_table}_sample)


