with t1 as (
 select
regexp_replace(regexp_replace(regexp_replace(${utm_parcing.channel_column}, '(\w*social\w*)', 'social'),  '(\w*organic\w*)', 'organic'), '-| ', '_') as ${utm_parcing.channel_column},
count(*) as events, 
count(*) * 100.0 / sum(count(*)) over () as percent_total
from  ${utm_parcing.outputs.union_table}
where not regexp_like(${utm_parcing.channel_column}, '${utm_parcing.exclude_channel_regexp}')
group by 1
)
select distinct ${utm_parcing.channel_column} as adv_channel,
concat(${utm_parcing.channel_column}, '_ad_response_percentile') as var_name
from  t1
where percent_total > ${utm_parcing.min_percent}
