-- SINK: additive measures at the grain of every dashboard filter dimension (+ day).
-- Only SUM / COUNT here — ratios and averages are recomputed from these columns in the dashboard.
-- Never put COUNT(DISTINCT ...) on this multi-dimension grain (it over-counts when rows are summed).
select
  event_date,
  region,
  channel,
  count(order_id)   as orders,
  sum(amount)       as revenue
from ${project_prefix}_stg_events
group by 1, 2, 3
