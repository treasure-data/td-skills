WITH T1 as
(
SELECT ${unique_user_id},
${td.last_results.activity_logic}
FROM ${utm_parcing.outputs.union_table}
GROUP BY ${unique_user_id}
),
T4 AS (
SELECT T1.*,
CASE greatest(${td.last_results.channel_list})
${td.last_results.case_logic}
      END AS next_best_channel,
${td.last_results.percentile_logic}
FROM T1
)
SELECT T4.*,
${td.last_results.avg_label}
FROM T4