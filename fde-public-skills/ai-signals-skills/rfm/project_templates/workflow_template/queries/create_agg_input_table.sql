  SELECT 
   ${globals.canonical_id},
   COALESCE(min(recency_days),0) AS recency,
   COALESCE(sum(total_touchpoints),0) as frequency,
   IF(COALESCE(sum(total_spend),0) < 0, 0, COALESCE(sum(total_spend),0)) as monetary_value 
FROM ${union_activity_table}
GROUP BY 1