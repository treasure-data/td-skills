-- Samples users for ALS training to reduce compute cost.
-- Keeps all transactions for sampled users to preserve interaction patterns.
WITH sampled_users AS (
  SELECT DISTINCT userid
  FROM ${prefix}transaction
  WHERE RAND() <= ${als_sample_rate}
  LIMIT ${als_max_users}
)
SELECT t.userid, t.itemid, t.item_name, t.item_category, t.tstamp
FROM ${prefix}transaction t
JOIN sampled_users s ON t.userid = s.userid
