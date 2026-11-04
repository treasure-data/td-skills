  select 
   ${globals.canonical_id},
   coalesce(min(recency_days),0) as recency,
   coalesce(sum(total_touchpoints),0) as frequency,
   if(coalesce(sum(total_spend),0) < 0, 0, coalesce(sum(total_spend),0)) as monetary_value 
from ${union_activity_table}
group by 1