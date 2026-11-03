with users as (
  select ${unique_user_id}, max(conversion_flag) from ${src_union_table}_temp
  group by 1
  ${rule}
)

select * from ${src_union_table}_temp where ${unique_user_id} in (select ${unique_user_id} from users)