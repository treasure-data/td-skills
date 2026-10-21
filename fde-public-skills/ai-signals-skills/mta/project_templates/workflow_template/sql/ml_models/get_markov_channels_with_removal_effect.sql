SELECT column_name FROM INFORMATION_SCHEMA.columns 
WHERE table_schema = '${sink_database}' AND table_name = '${transition_output_table}' 
AND column_name IN (SELECT DISTINCT lower(REGEXP_REPLACE(channels, '-| ', '_')) FROM ${markov_output_table} WHERE removal_effect > ${removal_effect_limit})

