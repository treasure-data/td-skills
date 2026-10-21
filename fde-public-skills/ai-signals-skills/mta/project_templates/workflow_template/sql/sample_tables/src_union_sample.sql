WITH BASE AS (
(SELECT ${unique_user_id}, APPROX_DISTINCT(src_table) as num_tables, SUM(conversion_flag) as num_conversions
FROM ${src_union_table}_final
GROUP BY 1
---- SELECT Users with minimum of 2 sessions, maximum of n-touchpoints and most source_tables/conversions activity
HAVING MAX(conversion_flag) > 0 AND APPROX_DISTINCT(src_table) > 1 AND APPROX_DISTINCT(session_id) > 1 AND count(*) <= ${sample_tpoint_limit}
ORDER BY 2 desc, 3 desc
LIMIT 2)
UNION ALL
(SELECT ${unique_user_id}, APPROX_DISTINCT(src_table) as num_tables, SUM(conversion_flag) as num_conversions
FROM ${src_union_table}_final
GROUP BY 1
---- SELECT Users with minimum of 2 sessions, maximum of n-touchpoints and no conversion activity
HAVING MAX(conversion_flag) < 1 AND APPROX_DISTINCT(src_table) > 1 AND APPROX_DISTINCT(session_id) > 1 AND count(*) <= ${sample_tpoint_limit}
ORDER BY 2 desc
LIMIT 2)
)
SELECT * FROM ${src_union_table}_final WHERE ${unique_user_id} IN (SELECT DISTINCT ${unique_user_id} FROM BASE)