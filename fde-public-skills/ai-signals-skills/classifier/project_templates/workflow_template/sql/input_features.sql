-- Model input table: one row per entity, written to ${train_input_table} (mode = train)
-- or ${pred_input_table} (mode = pred) by data_prep.dig.
-- EXAMPLE STRUCTURE — replace every <...> placeholder with the customer's tables and
-- columns before the first run (sql/README.md). Keep the output contract:
--   session_id          '${session_id}' — the Workflow session; train.dig trains on MAX(session_id)
--   ${user_id_column}   one row per entity, never NULL
--   ${target_column}    0/1 label observed AFTER cutoff_date (computed in both modes; ignored when scoring)
--   feature columns     computed only from data BEFORE cutoff_date (no leakage)
-- Variables from data_prep.dig: ${mode}, ${cutoff_date}, ${feature_start_date}, ${label_end_date}

WITH population AS (
  -- Entities to score: e.g. all profiles, open leads, active subscribers as of cutoff_date
  SELECT <id_col> AS ${user_id_column}
  FROM <source_database>.<profile_table>
  WHERE <id_col> IS NOT NULL
),

activity_features AS (
  -- Behavior in the feature window [feature_start_date, cutoff_date)
  SELECT <id_col> AS ${user_id_column},
         COUNT(*)                                                         AS events_cnt,
         COUNT(DISTINCT TD_TIME_FORMAT(<event_time_col>, 'yyyy-MM-dd'))   AS active_days,
         DATE_DIFF('day', FROM_UNIXTIME(MAX(<event_time_col>)), DATE '${cutoff_date}') AS days_since_last_event
  FROM <source_database>.<activity_table>
  WHERE TD_TIME_RANGE(<event_time_col>, '${feature_start_date}', '${cutoff_date}')
  GROUP BY 1
),

label AS (
  -- Outcome in the label window [cutoff_date, label_end_date)
  SELECT DISTINCT <id_col> AS ${user_id_column}, 1 AS ${target_column}
  FROM <source_database>.<outcome_table>
  WHERE TD_TIME_RANGE(<outcome_time_col>, '${cutoff_date}', '${label_end_date}')
)

SELECT '${session_id}'                                 AS session_id,
       p.${user_id_column},
       COALESCE(a.events_cnt, 0)                        AS events_cnt,
       COALESCE(a.active_days, 0)                       AS active_days,
       a.days_since_last_event,
       CAST(COALESCE(l.${target_column}, 0) AS BIGINT)  AS ${target_column}
FROM population p
LEFT JOIN activity_features a ON a.${user_id_column} = p.${user_id_column}
LEFT JOIN label l             ON l.${user_id_column} = p.${user_id_column}
