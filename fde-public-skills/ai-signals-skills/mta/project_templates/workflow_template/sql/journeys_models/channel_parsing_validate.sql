SELECT channel_final, ARRAY_DISTINCT(ARRAY_AGG(channel_orig)) as channel_orig_list, 
ARRAY_DISTINCT(ARRAY_AGG(source_orig)) as source_orig_list, ARRAY_DISTINCT(ARRAY_AGG(campaign)) as campaign_list,
count(*) as num_events 
FROM journey_src_union_final WHERE channel_orig IS NOT NULL 
GROUP BY 1
HAVING count(*) > 500