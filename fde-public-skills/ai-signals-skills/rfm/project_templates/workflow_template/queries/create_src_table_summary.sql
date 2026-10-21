with t2 as (
select source, approx_distinct(${globals.canonical_id}) as total_profiles, sum(total_touchpoints) as total_events, 
round(sum(total_spend), 2) as total_spend,
round(sum(total_touchpoints)*1.0 / approx_distinct(${globals.canonical_id}), 2) as avg_events_per_person,
round(sum(total_spend)*1.0 / approx_distinct(${globals.canonical_id}), 2) as avg_spend_per_person,
substring(min(latest_tstamp), 1, 10) as min_date, substring(max(latest_tstamp), 1, 10) as max_date,
date_diff('month', cast(min(latest_tstamp) as timestamp), cast(max(latest_tstamp) as timestamp)) as months_range
from ${union_activity_table}
group by 1
)
select t1.src_table, t1.event_name, t2.total_profiles, t2.total_events, t2.total_spend, t2.avg_events_per_person, t2.avg_spend_per_person, t2.min_date, t2.max_date, t2.months_range,
t1.unixtime_col, t1.order_amount, t1.final_where_clause as table_filters 
from rfm_input_params t1
left join t2 on t1.event_name = t2.source