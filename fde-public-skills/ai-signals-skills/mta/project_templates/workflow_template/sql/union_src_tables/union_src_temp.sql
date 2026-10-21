WITH USERS AS (
  SELECT ${unique_user_id}, MAX(conversion_flag) FROM ${src_union_table}_temp
  GROUP BY 1
  ${rule}
)

SELECT * FROM ${src_union_table}_temp WHERE ${unique_user_id} IN (SELECT ${unique_user_id} FROM USERS)