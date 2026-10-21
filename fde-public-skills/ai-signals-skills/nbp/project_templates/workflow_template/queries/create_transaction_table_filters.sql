WITH exclude AS (
  SELECT itemid 
  FROM ${prefix}excluded
)
SELECT *
FROM ${prefix}transaction_unfiltered
WHERE itemid NOT IN (
  SELECT itemid FROM exclude
)