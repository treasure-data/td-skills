select channel_final, array_distinct(array_agg(channel_orig)) as channel_orig_list, 
array_distinct(array_agg(source_orig)) as source_orig_list, array_distinct(array_agg(campaign)) as campaign_list,
count(*) as num_events 
from journey_src_union_final where channel_orig is not null 
group by 1
having count(*) > 500