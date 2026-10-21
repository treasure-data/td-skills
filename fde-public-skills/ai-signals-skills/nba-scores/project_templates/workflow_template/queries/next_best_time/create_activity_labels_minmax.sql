WITH T1 AS (
SELECT *
FROM ${next_best_time.outputs.union_table}
WHERE ${unique_user_id} IS NOT NULL
),
T2 AS (
SELECT T1.*,
CASE
${td.last_results.case_logic}
END as ${next_best_time.outputs.activity_period_column}
FROM T1
), 
T3 as (
SELECT T2.${unique_user_id},
${td.last_results.activity_logic}
FROM T2
GROUP BY ${unique_user_id}
),
T4 AS (
SELECT T3.*,
CASE greatest(morning_events, afternoon_events, evening_events, overnight_events)
          WHEN morning_events  THEN 'morning'
          WHEN afternoon_events  THEN 'afternoon'
          WHEN evening_events  THEN 'evening'
          WHEN overnight_events   THEN 'overnight'
      END AS next_best_time,
${td.last_results.minmax_logic}
FROM T3
)
SELECT T4.*,
IF(morning_activity_minmax >= (select avg(morning_activity_minmax) from T4), 'Above AVG', 'Below AVG') AS morning_engagement_score,
IF(afternoon_activity_minmax >= (select avg(afternoon_activity_minmax) from T4), 'Above AVG', 'Below AVG') AS afternoon_engagement_score,
IF(evening_activity_minmax >= (select avg(evening_activity_minmax) from T4), 'Above AVG', 'Below AVG') AS evening_engagement_score,
IF(overnight_activity_minmax >= (select avg(overnight_activity_minmax) from T4), 'Above AVG', 'Below AVG') AS overnight_engagement_score
FROM T4