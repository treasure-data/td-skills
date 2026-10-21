SELECT
TD_TIME_STRING(${session_unixtime}, 's!') AS run_time,
${session_id} as session_id,
'ai_signals' as model_type, 
source as source_table,
'${apply_time_filter}' as time_filter,
CASE 
WHEN '${apply_time_filter}'  = 'no' THEN '-' || TRY(CAST(MAX(recency_days) as VARCHAR)) || 'd'
ELSE '${lookback_period}'
END AS lookback_days,
SUM(total_touchpoints) AS total_touchpoints,
MAX(recency_days) AS oldest_touchpoint,
MIN(recency_days) AS most_recent_touchpoint,
ROUND(SUM(total_spend), 3) AS total_spend,
TD_TIME_STRING(MIN(time), 's!') as min_date,
TD_TIME_STRING(MAX(time), 's!') as max_date
FROM ${union_activity_table}
GROUP BY 1, 2, 3, 4
