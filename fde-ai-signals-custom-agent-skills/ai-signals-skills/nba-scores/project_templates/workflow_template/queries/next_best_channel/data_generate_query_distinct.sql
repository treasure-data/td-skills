select distinct array_join(array_agg(adv_channel), ', ') as channel_list,
array_join(array_agg(activity_logic), concat(', ',chr(10))) as activity_logic,
array_join(array_agg(case_logic), concat(' ',chr(10))) as case_logic,
array_join(array_agg(activity_logic_hive), concat(', ',chr(10))) as activity_logic_hive,
array_join(array_agg(percentile_logic), concat(', ',chr(10))) as percentile_logic,
array_join(array_agg(minmax_logic), concat(', ',chr(10))) as minmax_logic,
array_join(array_agg(avg_label), concat(', ',chr(10))) as avg_label,
array_join(array_agg(avg_label_minmax), concat(', ',chr(10))) as avg_label_minmax
from ${schema_tb}