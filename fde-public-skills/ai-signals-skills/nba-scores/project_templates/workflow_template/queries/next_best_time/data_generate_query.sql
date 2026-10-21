SELECT DISTINCT array_join(array_agg(case_logic), CONCAT(' ',chr(10))) AS case_logic,
array_join(array_agg(activity_logic), CONCAT(', ',chr(10))) AS activity_logic,
array_join(array_agg(activity_logic_hive), CONCAT(', ',chr(10))) AS activity_logic_hive,
array_join(array_agg(percentile_logic), CONCAT(', ',chr(10))) AS percentile_logic,
array_join(array_agg(minmax_logic), CONCAT(', ',chr(10))) AS minmax_logic,
array_join(array_agg(quartile_logic), CONCAT(', ',chr(10))) AS quartile_logic
FROM ${schema_tb}
