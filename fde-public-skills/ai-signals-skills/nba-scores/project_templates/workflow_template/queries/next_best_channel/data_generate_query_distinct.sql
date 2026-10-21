SELECT DISTINCT array_join(array_agg(adv_channel), ', ') as channel_list,
array_join(array_agg(activity_logic), CONCAT(', ',chr(10))) AS activity_logic,
array_join(array_agg(case_logic), CONCAT(' ',chr(10))) AS case_logic,
array_join(array_agg(activity_logic_hive), CONCAT(', ',chr(10))) AS activity_logic_hive,
array_join(array_agg(percentile_logic), CONCAT(', ',chr(10))) AS percentile_logic,
array_join(array_agg(minmax_logic), CONCAT(', ',chr(10))) AS minmax_logic,
array_join(array_agg(avg_label), CONCAT(', ',chr(10))) AS avg_label,
array_join(array_agg(avg_label_minmax), CONCAT(', ',chr(10))) AS avg_label_minmax
FROM ${schema_tb}