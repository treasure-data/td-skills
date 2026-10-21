-- SINK: exact distinct count at its display grain (one row per day, no dimensions).
-- Valid for "per day" values only: never sum it across days or slice it by dimension — a period or
-- per-dimension distinct count needs its own query (dashboard build: distinct-count handling).
SELECT
  event_date,
  COUNT(DISTINCT customer_id) AS active_customers
FROM ${project_prefix}_stg_events
GROUP BY 1
