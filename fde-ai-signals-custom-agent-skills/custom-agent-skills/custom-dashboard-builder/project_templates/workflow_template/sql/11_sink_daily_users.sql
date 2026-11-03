-- SINK: exact distinct count at its display grain (one row per day, no dimensions).
-- Valid for "per day" values only: never sum it across days or slice it by dimension — a period or
-- per-dimension distinct count needs its own query (dashboard build: distinct-count handling).
select
  event_date,
  count(distinct customer_id) as active_customers
from ${project_prefix}_stg_events
group by 1
