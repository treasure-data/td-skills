-- Staging: one row per source event in this run's window, cleaned. Replaced on every run.
-- Window: full = from history_start; incremental = from incr_start_day (the same day-truncated bound
-- the SINK DELETE uses). Partition pruning on native `time` first, then the business event day.
-- EXAMPLE columns (region, channel, customer_id, order_id, amount) — replace them with the confirmed
-- dimensions, ids and measures; keep event_date as the first column.
SELECT
  TD_TIME_FORMAT(${event_time_expr}, 'yyyy-MM-dd', 'UTC') AS event_date,
  COALESCE(region, 'Unknown')                           AS region,
  COALESCE(channel, 'Unknown')                          AS channel,
  customer_id,
  order_id,
  CAST(amount AS DOUBLE)                                AS amount
FROM ${source_database}.${source_table}
WHERE TD_TIME_RANGE(time, '${refresh_mode == "full" ? history_start : incr_start_day}', NULL, 'UTC')
  AND ${event_time_expr} IS NOT NULL
  AND TD_TIME_FORMAT(${event_time_expr}, 'yyyy-MM-dd', 'UTC') >= '${refresh_mode == "full" ? history_start : incr_start_day}'
  ${table_filter != "" ? "AND " + table_filter : ""}
