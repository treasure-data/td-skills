select * from ${tbl} where ${unique_user_id} in (select distinct ${unique_user_id} from ${src_union_table}_sample)


