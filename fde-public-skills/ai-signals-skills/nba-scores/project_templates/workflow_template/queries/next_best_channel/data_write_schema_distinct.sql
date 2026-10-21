insert into ${schema_tb}
select
'${td.each.adv_channel}_events' as adv_channel,
'COUNT_IF(${utm_parcing.channel_column} = ''${td.each.adv_channel}'') AS ${td.each.adv_channel}_events' as activity_logic,
'WHEN ${td.each.adv_channel}_events THEN ''${td.each.adv_channel}'' ' as case_logic,
'SUM(IF(${utm_parcing.channel_column} = ''${td.each.adv_channel}'', 1, 0)) AS ${td.each.adv_channel}_events' as activity_logic_hive,
'ROUND(PERCENT_RANK() OVER( ORDER BY ${td.each.adv_channel}_events), 3) AS ${td.each.adv_channel}_activity_perc' as percentile_logic,
'ROUND((${td.each.adv_channel}_events*1.0 - (select min(${td.each.adv_channel}_events) from T1))/((select max(${td.each.adv_channel}_events) from T1) - (select min(${td.each.adv_channel}_events) from T1)),3) AS ${td.each.adv_channel}_activity_minmax' as minmax_logic,
'rescale(${td.each.adv_channel}_events, min(${td.each.adv_channel}_events) over (), max(${td.each.adv_channel}_events) over ()) AS ${td.each.adv_channel}_activity_minmax' as minmax_logic_hive,
'IF(${td.each.adv_channel}_activity_perc >= (select avg(${td.each.adv_channel}_activity_perc) from T4), ''Above AVG'', ''Below AVG'') AS ${td.each.adv_channel}_engagement_score' as avg_label,
'IF(${td.each.adv_channel}_activity_minmax >= (select avg(${td.each.adv_channel}_activity_minmax) from T4), ''Above AVG'', ''Below AVG'') AS ${td.each.adv_channel}_engagement_score' as avg_label_minmax


