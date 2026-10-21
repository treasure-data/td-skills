with t1 as (
  select td_time_string(tstamp, 's!') as event_tstamp,
    itemid, item_name, item_category
  from ${prefix}transaction
  )
select itemid, 
  item_category, 
  max_by(item_name, event_tstamp) as item_name, 
  min(event_tstamp) as least_recent_event,
  max(event_tstamp) as most_recent_event
from t1
group by 1, 2