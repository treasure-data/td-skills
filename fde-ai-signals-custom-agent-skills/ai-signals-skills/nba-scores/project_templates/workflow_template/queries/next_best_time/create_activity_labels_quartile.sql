with t1 as (
select *
from ${src_union_table}_final
where ${unique_user_id} is not null
),
t2 as (
select t1.*,
case
${td.last_results.case_logic}
end as ${next_best_time.outputs.activity_period_column}
from t1
), 
t3 as (
select t2.${unique_user_id},
${td.last_results.activity_logic}
from t2
group by ${unique_user_id}
),
t4 as (
select t3.*,
case greatest(morning_events, afternoon_events, evening_events, overnight_events)
          when morning_events      then 'morning'
          when afternoon_events     then 'afternoon'
          when evening_events    then 'evening'
          when overnight_events      then 'overnight'
      end as next_best_time,
${td.last_results.quartile_logic}
from t3
)
select t4.*,
if(morning_activity_quartile >= (select avg(morning_activity_quartile) from t4), 'Above AVG', 'Below AVG') as morning_engagement_score,
if(afternoon_activity_quartile >= (select avg(afternoon_activity_quartile) from t4), 'Above AVG', 'Below AVG') as afternoon_engagement_score,
if(evening_activity_quartile >= (select avg(evening_activity_quartile) from t4), 'Above AVG', 'Below AVG') as evening_engagement_score,
if(overnight_activity_quartile >= (select avg(overnight_activity_quartile) from t4), 'Above AVG', 'Below AVG') as overnight_engagement_score
from t4