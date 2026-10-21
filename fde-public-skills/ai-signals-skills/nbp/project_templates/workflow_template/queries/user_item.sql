select 
  userid,
  itemid,
  max(tstamp) as tstamp,
  count(1) as count
from
  ${prefix}transaction
group by
  userid, itemid
having count(userid) >= ${min_cooccurence_filter}
