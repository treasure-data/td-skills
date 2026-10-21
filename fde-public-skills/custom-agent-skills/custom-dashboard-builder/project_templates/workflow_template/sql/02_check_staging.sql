-- Guard read by +assert_staging: fails the run on an empty full load or rows without an event date.
select
  count(*)                      as n_rows,
  count_if(event_date is null)  as null_dates,
  min(event_date)               as first_day,
  max(event_date)               as last_day
from ${project_prefix}_stg_events
