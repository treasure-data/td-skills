-- Staging: one row per source event in this run's window, cleaned. Replaced on every run.
-- Window: full = from history_start; incremental = from incr_start_day (the same day-truncated bound
-- the SINK DELETE uses). Partition pruning on native `time` first, then the business event day.
-- EXAMPLE columns (region, channel, customer_id, order_id, amount) — replace them with the confirmed
-- dimensions, ids and measures; keep event_date as the first column.
select
  td_time_format(${event_time_expr}, 'yyyy-MM-dd', 'UTC') as event_date,
  coalesce(region, 'Unknown')                           as region,
  coalesce(channel, 'Unknown')                          as channel,
  customer_id,
  order_id,
  cast(amount as double)                                as amount
from ${source_database}.${source_table}
where td_time_range(time, '${refresh_mode == "full" ? history_start : incr_start_day}', null, 'UTC')
  and ${event_time_expr} is not null
  and td_time_format(${event_time_expr}, 'yyyy-MM-dd', 'UTC') >= '${refresh_mode == "full" ? history_start : incr_start_day}'
  ${table_filter != "" ? "AND " + table_filter : ""}
