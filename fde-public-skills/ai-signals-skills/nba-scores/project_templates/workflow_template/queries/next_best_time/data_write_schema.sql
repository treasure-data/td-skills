INSERT INTO ${schema_tb}
SELECT 
'WHEN ${time_logic.logic} THEN ''${time_logic.period}'' ' as case_logic,
'COUNT_IF(${next_best_time.outputs.activity_period_column} = ''${time_logic.period}'') as ${time_logic.period}_events' as activity_logic,
'SUM(IF(${next_best_time.outputs.activity_period_column} = ''${time_logic.period}'', 1, 0)) as ${time_logic.period}_events' as activity_logic_hive,
'ROUND(PERCENT_RANK() OVER( ORDER BY ${time_logic.period}_events), 3) AS ${time_logic.period}_activity_perc' as percentile_logic,
'ROUND((${time_logic.period}_events*1.0 - (select min(${time_logic.period}_events) from T3))/((select max(${time_logic.period}_events) from T3) - (select min(${time_logic.period}_events) from T3)),3) AS ${time_logic.period}_activity_minmax' as minmax_logic,
'ROUND(${time_logic.period}_events, min(${time_logic.period}_events) over (), max(${time_logic.period}_events) over ()) AS ${time_logic.period}_activity_minmax' as minmax_logic_hive,
'IF(${time_logic.period}_events < 1, 1, NTILE(4) OVER (ORDER BY ${time_logic.period}_events)) AS ${time_logic.period}_activity_quartile' as quartile_logic

