with cte as(
select target, conversion_month, journey_steps, split(journey_steps, ' > ') || target as steps, conversions, total_events, avg_journey_length
from mta_top_conversion_journeys
)
,cte2 as(
select
    target,
    conversion_month,
    journey_steps,
    lag(step_with_index) over (partition by target, conversion_month, journey_steps order by step_index) as from_step,
    step_with_index as to_step,
    total_events,
    conversions,
    avg_journey_length
from (
    select
        target,
        conversion_month,
        journey_steps,
        -- if(step='conversion' or step='churn',step,CONCAT(cast(step_index as varchar), '-', step)) AS step_with_index,
        if(step='churn', step, concat(cast(step_index as varchar), '-', step)) as step_with_index,
        total_events,
        conversions,
        avg_journey_length,
        step_index
    from
        cte
    cross join unnest(steps) with ordinality as t(step, step_index)
) subquery
)
,
agg as (
select
target,
conversion_month,
journey_steps,
from_step,
to_step,
sum(conversions) as conversions, sum(total_events) as total_events, avg(avg_journey_length) as avg_journey_length from cte2
where from_step is not NUll
group by 1,2,3,4,5
)
select
agg.target, agg.conversion_month, agg.from_step, agg.to_step, agg.conversions, agg.total_events, agg.avg_journey_length,
round(agg.conversions*1.0 / (select sum(conversions) from cte where cte.conversion_month = agg.conversion_month), 3) as conv_perc,
dense_rank() over (partition by target, conversion_month order by total_events desc) as rnk
from agg
