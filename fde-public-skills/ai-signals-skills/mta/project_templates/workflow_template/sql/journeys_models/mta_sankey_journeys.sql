with cte as(
SELECT target, conversion_month, journey_steps, SPLIT(journey_steps, ' > ') || target as steps, conversions, total_events, avg_journey_length
FROM mta_top_conversion_journeys
)
,cte2 as(
SELECT
    target,
    conversion_month,
    journey_steps,
    lag(step_with_index) OVER (partition by target, conversion_month, journey_steps ORDER BY step_index) AS from_step,
    step_with_index AS to_step,
    total_events,
    conversions,
    avg_journey_length
FROM (
    SELECT
        target,
        conversion_month,
        journey_steps,
        -- if(step='conversion' or step='churn',step,CONCAT(cast(step_index as varchar), '-', step)) AS step_with_index,
        if(step='churn', step, CONCAT(cast(step_index as varchar), '-', step)) AS step_with_index,
        total_events,
        conversions,
        avg_journey_length,
        step_index
    FROM
        cte
    CROSS JOIN UNNEST(steps) WITH ORDINALITY AS t(step, step_index)
) subquery
)
,
AGG AS (
select
target,
conversion_month,
journey_steps,
from_step,
to_step,
sum(conversions) as conversions, sum(total_events) as total_events, AVG(avg_journey_length) AS avg_journey_length from cte2
where from_step is not NUll
group by 1,2,3,4,5
)
SELECT
AGG.target, AGG.conversion_month, AGG.from_step, AGG.to_step, AGG.conversions, AGG.total_events, AGG.avg_journey_length,
ROUND(AGG.conversions*1.0 / (SELECT SUM(conversions) FROM cte WHERE cte.conversion_month = AGG.conversion_month), 3) as conv_perc,
DENSE_RANK() OVER (partition by target, conversion_month ORDER BY total_events desc) AS rnk
FROM AGG
