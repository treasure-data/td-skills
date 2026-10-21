-- Guard read by +assert_staging: fails the run on an empty full load or rows without an event date.
SELECT
  COUNT(*)                      AS n_rows,
  COUNT_IF(event_date IS NULL)  AS null_dates,
  MIN(event_date)               AS first_day,
  MAX(event_date)               AS last_day
FROM ${project_prefix}_stg_events
