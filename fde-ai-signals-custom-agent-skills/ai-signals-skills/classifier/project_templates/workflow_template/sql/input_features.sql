-- Model input table: one row per entity and cutoff_date, written to ${train_input_table}
-- (mode = train) or ${pred_input_table} (mode = pred) by data_prep.dig.
-- EXAMPLE STRUCTURE — replace every <...> placeholder with the customer's tables and
-- columns before the first run (sql/README.md). Keep the output contract:
--   session_id          the Workflow session; train.dig trains on MAX(session_id)
--   cutoff_date         the snapshot date (in columns_to_drop)
--   ${user_id_column}   one row per entity per cutoff, never NULL
--   ${target_column}    0/1 label observed in [cutoff, cutoff + label_window_days) — always 0 when scoring
--   feature columns     computed only from data BEFORE the cutoff (no leakage)
-- Variables from data_prep.dig: mode, run_date, snapshot_k_min, snapshot_k_max, scan_start, scan_end

with cutoffs as (
  -- One row per snapshot; unix bounds keep the joins below simple range comparisons
  select cast(c as varchar)                                                        as cutoff_date,
         c                                                                         as cutoff_dt,
         to_unixtime(cast(date_add('day', -${feature_lookback_days}, c) as timestamp)) as feature_start_ts,
         to_unixtime(cast(c as timestamp))                                         as cutoff_ts,
         to_unixtime(cast(date_add('day', ${label_window_days}, c) as timestamp))  as label_end_ts
  from unnest(sequence(${snapshot_k_min}, ${snapshot_k_max})) as t(k)
  cross join unnest(array[date_add('day', -${spacing_days} * k, date '${run_date}')]) as d(c)
),

population as (
  -- Entities eligible at each cutoff: e.g. profiles created before it, open leads,
  -- active subscribers, customers active in the window (dataprep-guide.md §4)
  select c.cutoff_date, c.cutoff_dt, c.feature_start_ts, c.cutoff_ts, c.label_end_ts,
         p.<id_col> as ${user_id_column}
  from cutoffs c
  join <source_database>.<profile_table> p
    on p.<created_time_col> < c.cutoff_ts
  where p.<id_col> is not null
),

activity_features as (
  -- Behavior in the feature window [feature_start_ts, cutoff_ts) of each cutoff
  select c.cutoff_date,
         e.<id_col>                                                              as ${user_id_column},
         count(*)                                                                as events_cnt,
         count_if(e.<event_time_col> >= c.cutoff_ts - 30 * 86400)                as events_30d,
         count(distinct td_time_format(e.<event_time_col>, 'yyyy-MM-dd'))        as active_days,
         date_diff('day', date(from_unixtime(max(e.<event_time_col>))), c.cutoff_dt) as days_since_last_event
  from cutoffs c
  join <source_database>.<activity_table> e
    on e.<event_time_col> >= c.feature_start_ts
   and e.<event_time_col> <  c.cutoff_ts
  where td_time_range(e.<event_time_col>, '${scan_start}', '${scan_end}')
  group by c.cutoff_date, c.cutoff_dt, c.cutoff_ts, e.<id_col>
),

label as (
  -- Outcome in the label window [cutoff_ts, label_end_ts) of each cutoff
  select distinct c.cutoff_date, o.<id_col> as ${user_id_column}, 1 as ${target_column}
  from cutoffs c
  join <source_database>.<outcome_table> o
    on o.<outcome_time_col> >= c.cutoff_ts
   and o.<outcome_time_col> <  c.label_end_ts
  where td_time_range(o.<outcome_time_col>, '${scan_start}', '${scan_end}')
)

select '${session_id}'                                 as session_id,
       p.cutoff_date,
       p.${user_id_column},
       coalesce(a.events_cnt, 0)                        as events_cnt,
       coalesce(a.events_30d, 0)                        as events_30d,
       coalesce(a.active_days, 0)                       as active_days,
       a.days_since_last_event,
       cast(coalesce(l.${target_column}, 0) as bigint)  as ${target_column}
from population p
left join activity_features a on a.${user_id_column} = p.${user_id_column} and a.cutoff_date = p.cutoff_date
left join label l             on l.${user_id_column} = p.${user_id_column} and l.cutoff_date = p.cutoff_date
