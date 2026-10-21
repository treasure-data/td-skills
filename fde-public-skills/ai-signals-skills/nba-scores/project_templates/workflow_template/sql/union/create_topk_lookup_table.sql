(select 
  channel_session as col_value,
  'channel' as col_name,
  count(*) as num_events
from ${src_union_table}_session
where channel_session is not null and channel_session != ''
group by 1, 2
order by 3 desc
limit ${topk_values}
)

union all 

(select
  source_session as col_value,
  'source' as col_name,
  count(*) as num_events
from ${src_union_table}_session
where source_session is not null and source_session != ''
group by 1, 2
order by 3 desc
limit ${topk_values}
)

union all 

(
select 
  campaign as col_value,
  'campaign' as col_name,
  count(*) as num_events
from ${src_union_table}_session
where campaign is not null and campaign != ''
group by 1, 2
order by 3 desc
limit ${topk_values}
)