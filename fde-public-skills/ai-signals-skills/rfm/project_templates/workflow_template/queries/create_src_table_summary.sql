WITH T2 AS (
SELECT source, APPROX_DISTINCT(${globals.canonical_id}) as total_profiles, SUM(total_touchpoints) as total_events, 
ROUND(SUM(total_spend), 2) as total_spend,
ROUND(SUM(total_touchpoints)*1.0 / APPROX_DISTINCT(${globals.canonical_id}), 2) as avg_events_per_person,
ROUND(SUM(total_spend)*1.0 / APPROX_DISTINCT(${globals.canonical_id}), 2) as avg_spend_per_person,
SUBSTRING(MIN(latest_tstamp), 1, 10) as min_date, SUBSTRING(MAX(latest_tstamp), 1, 10) as max_date,
DATE_DIFF('month', CAST(MIN(latest_tstamp) AS TIMESTAMP), CAST(MAX(latest_tstamp) AS TIMESTAMP)) as months_range
FROM ${union_activity_table}
GROUP BY 1
)
SELECT T1.src_table, T1.event_name, T2.total_profiles, T2.total_events, T2.total_spend, T2.avg_events_per_person, T2.avg_spend_per_person, T2.min_date, T2.max_date, T2.months_range,
T1.unixtime_col, T1.order_amount, T1.final_where_clause AS table_filters 
FROM rfm_input_params T1
LEFT JOIN T2 ON T1.event_name = T2.source