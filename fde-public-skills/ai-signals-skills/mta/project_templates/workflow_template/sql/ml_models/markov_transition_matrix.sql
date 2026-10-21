SELECT 
CAST(${session_unixtime} AS INTEGER) AS time,
TD_TIME_STRING(${session_unixtime}, 's!') as run_time,
channels, '${td.each.column_name}' as to_channel, 
MAX(${td.each.column_name}) as trans_prob, 
MAX(_conversion_) as _conversion_ 
FROM ${transition_output_table}
WHERE channels IN (SELECT DISTINCT channels FROM ${markov_output_table} WHERE removal_effect > ${removal_effect_limit})
GROUP BY 1, 2, 3, 4