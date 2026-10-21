with t1 as
(
select ${unique_user_id},
${td.last_results.activity_logic}
from ${utm_parcing.outputs.union_table}
group by ${unique_user_id}
),
t4 as (
select t1.*,
case greatest(${td.last_results.channel_list})
${td.last_results.case_logic}
      end as next_best_channel,
${td.last_results.percentile_logic}
from t1
)
select t4.*,
${td.last_results.avg_label}
from t4