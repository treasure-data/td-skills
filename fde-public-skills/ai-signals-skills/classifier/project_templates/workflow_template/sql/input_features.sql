-- Model input table: one row per entity, written to ${train_input_table} (mode = train)
-- or ${pred_input_table} (mode = pred) by data_prep.dig.
-- EXAMPLE STRUCTURE — replace every <...> placeholder with the customer's tables and
-- columns before the first run (sql/README.md). Keep the output contract:
--   session_id          '${session_id}' — the Workflow session; train.dig trains on MAX(session_id)
--   ${user_id_column}   one row per entity, never NULL
--   ${target_column}    0/1 label observed AFTER cutoff_date (computed in both modes; ignored when scoring)
--   feature columns     computed only from data BEFORE cutoff_date (no leakage)
-- Variables from data_prep.dig: ${mode}, ${cutoff_date}, ${feature_start_date}, ${label_end_date}

with population as (
  -- Entities to score: e.g. all profiles, open leads, active subscribers as of cutoff_date
  select <id_col> as ${user_id_column}
  from <source_database>.<profile_table>
  where <id_col> is not null
),

activity_features as (
  -- Behavior in the feature window [feature_start_date, cutoff_date)
  select <id_col> as ${user_id_column},
         count(*)                                                         as events_cnt,
         count(distinct td_time_format(<event_time_col>, 'yyyy-MM-dd'))   as active_days,
         date_diff('day', from_unixtime(max(<event_time_col>)), date '${cutoff_date}') as days_since_last_event
  from <source_database>.<activity_table>
  where td_time_range(<event_time_col>, '${feature_start_date}', '${cutoff_date}')
  group by 1
),

label as (
  -- Outcome in the label window [cutoff_date, label_end_date)
  select distinct <id_col> as ${user_id_column}, 1 as ${target_column}
  from <source_database>.<outcome_table>
  where td_time_range(<outcome_time_col>, '${cutoff_date}', '${label_end_date}')
)

select '${session_id}'                                 as session_id,
       p.${user_id_column},
       coalesce(a.events_cnt, 0)                        as events_cnt,
       coalesce(a.active_days, 0)                       as active_days,
       a.days_since_last_event,
       cast(coalesce(l.${target_column}, 0) as bigint)  as ${target_column}
from population p
left join activity_features a on a.${user_id_column} = p.${user_id_column}
left join label l             on l.${user_id_column} = p.${user_id_column}
