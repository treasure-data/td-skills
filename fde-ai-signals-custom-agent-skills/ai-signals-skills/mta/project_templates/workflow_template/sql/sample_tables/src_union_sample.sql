with base as (
(select ${unique_user_id}, approx_distinct(src_table) as num_tables, sum(conversion_flag) as num_conversions
from ${src_union_table}_final
group by 1
---- SELECT Users with minimum of 2 sessions, maximum of n-touchpoints and most source_tables/conversions activity
having max(conversion_flag) > 0 and approx_distinct(src_table) > 1 and approx_distinct(session_id) > 1 and count(*) <= ${sample_tpoint_limit}
order by 2 desc, 3 desc
limit 2)
union all
(select ${unique_user_id}, approx_distinct(src_table) as num_tables, sum(conversion_flag) as num_conversions
from ${src_union_table}_final
group by 1
---- SELECT Users with minimum of 2 sessions, maximum of n-touchpoints and no conversion activity
having max(conversion_flag) < 1 and approx_distinct(src_table) > 1 and approx_distinct(session_id) > 1 and count(*) <= ${sample_tpoint_limit}
order by 2 desc
limit 2)
)
select * from ${src_union_table}_final where ${unique_user_id} in (select distinct ${unique_user_id} from base)