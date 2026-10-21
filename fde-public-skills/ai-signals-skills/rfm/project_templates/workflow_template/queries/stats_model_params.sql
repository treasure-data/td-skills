select
td_time_string(${session_unixtime}, 's!') as run_time,
${session_id} as session_id,
'ai_signals' as model_type, 
source as source_table,
'${apply_time_filter}' as time_filter,
case 
when '${apply_time_filter}'  = 'no' then '-' || try(cast(max(recency_days) as varchar)) || 'd'
else '${lookback_period}'
end as lookback_days,
sum(total_touchpoints) as total_touchpoints,
max(recency_days) as oldest_touchpoint,
min(recency_days) as most_recent_touchpoint,
round(sum(total_spend), 3) as total_spend,
td_time_string(min(time), 's!') as min_date,
td_time_string(max(time), 's!') as max_date
from ${union_activity_table}
group by 1, 2, 3, 4
