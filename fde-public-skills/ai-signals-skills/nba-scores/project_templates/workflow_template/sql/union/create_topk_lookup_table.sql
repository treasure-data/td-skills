(SELECT 
  channel_session AS col_value,
  'channel' AS col_name,
  count(*) as num_events
from ${src_union_table}_session
where channel_session IS NOT NULL AND channel_session != ''
group by 1, 2
ORDER BY 3 desc
LIMIT ${topk_values}
)

UNION ALL 

(SELECT
  source_session AS col_value,
  'source' AS col_name,
  count(*) as num_events
from ${src_union_table}_session
where source_session IS NOT NULL AND source_session != ''
group by 1, 2
ORDER BY 3 desc
LIMIT ${topk_values}
)

UNION ALL 

(
SELECT 
  campaign AS col_value,
  'campaign' AS col_name,
  count(*) as num_events
FROM ${src_union_table}_session
WHERE campaign IS NOT NULL AND campaign != ''
GROUP BY 1, 2
ORDER BY 3 desc
LIMIT ${topk_values}
)