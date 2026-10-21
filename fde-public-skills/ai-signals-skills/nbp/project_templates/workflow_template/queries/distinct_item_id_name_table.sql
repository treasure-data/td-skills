WITH T1 AS (
  SELECT TD_TIME_STRING(tstamp, 's!') as event_tstamp,
    itemid, item_name, item_category
  FROM ${prefix}transaction
  )
SELECT itemid, 
  item_category, 
  MAX_BY(item_name, event_tstamp) as item_name, 
  MIN(event_tstamp) AS least_recent_event,
  MAX(event_tstamp) AS most_recent_event
FROM T1
GROUP BY 1, 2