-- SINK: additive measures at the grain of every dashboard filter dimension (+ day).
-- Only SUM / COUNT here — ratios and averages are recomputed from these columns in the dashboard.
-- Never put COUNT(DISTINCT ...) on this multi-dimension grain (it over-counts when rows are summed).
SELECT
  event_date,
  region,
  channel,
  COUNT(order_id)   AS orders,
  SUM(amount)       AS revenue
FROM ${project_prefix}_stg_events
GROUP BY 1, 2, 3
