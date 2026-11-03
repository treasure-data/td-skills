select 
cast(${session_unixtime} as integer) as time,
td_time_string(${session_unixtime}, 's!') as run_time,
channels, '${td.each.column_name}' as to_channel, 
max(${td.each.column_name}) as trans_prob, 
max(_conversion_) as _conversion_ 
from ${transition_output_table}
where channels in (select distinct channels from ${markov_output_table} where removal_effect > ${removal_effect_limit})
group by 1, 2, 3, 4