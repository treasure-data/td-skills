SELECT 
  userid,
  itemid,
  max(tstamp) as tstamp,
  count(1) as count
FROM
  ${prefix}transaction
GROUP BY
  userid, itemid
HAVING count(userid) >= ${min_cooccurence_filter}
