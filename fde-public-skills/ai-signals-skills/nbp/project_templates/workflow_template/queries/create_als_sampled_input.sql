-- Samples users for ALS training to reduce compute cost.
-- Keeps all transactions for sampled users to preserve interaction patterns.
with sampled_users as (
  select distinct userid
  from ${prefix}transaction
  where rand() <= ${als_sample_rate}
  limit ${als_max_users}
)
select t.userid, t.itemid, t.item_name, t.item_category, t.tstamp
from ${prefix}transaction t
join sampled_users s on t.userid = s.userid
