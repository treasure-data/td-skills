WITH T1 AS (
 SELECT
REGEXP_REPLACE(REGEXP_REPLACE(REGEXP_REPLACE(${utm_parcing.channel_column}, '(\w*social\w*)', 'social'),  '(\w*organic\w*)', 'organic'), '-| ', '_') AS ${utm_parcing.channel_column},
count(*) as events, 
count(*) * 100.0 / sum(count(*)) OVER () as percent_total
from  ${utm_parcing.outputs.union_table}
WHERE NOT REGEXP_LIKE(${utm_parcing.channel_column}, '${utm_parcing.exclude_channel_regexp}')
group by 1
)
SELECT DISTINCT ${utm_parcing.channel_column} AS adv_channel,
concat(${utm_parcing.channel_column}, '_ad_response_percentile') as var_name
FROM  T1
WHERE percent_total > ${utm_parcing.min_percent}
