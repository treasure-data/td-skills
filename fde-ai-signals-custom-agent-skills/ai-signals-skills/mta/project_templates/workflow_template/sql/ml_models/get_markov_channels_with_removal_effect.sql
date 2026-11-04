select column_name from information_schema.columns 
where table_schema = '${sink_database}' and table_name = '${transition_output_table}' 
and column_name in (select distinct lower(regexp_replace(channels, '-| ', '_')) from ${markov_output_table} where removal_effect > ${removal_effect_limit})

