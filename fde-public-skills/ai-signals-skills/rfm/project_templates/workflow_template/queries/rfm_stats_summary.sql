SELECT
     ${session_id} as session_id
    ,rfm_segment
    ,COUNT(1) as segment_size
    ,ROUND(CAST(COUNT(1) AS DOUBLE)*100 / (SELECT COUNT(1)  from ${output_table}), 2) AS population_percent  
    ,ARRAY_JOIN(ARRAY_DISTINCT(ARRAY_AGG(rfm_quartile)), ', ') as quartile_list
    ,ROUND(MIN(rfm_score),3) as min_rfm
    ,ROUND(APPROX_PERCENTILE(RFM_score,0.25),3) as q1_rfm
    ,ROUND(APPROX_PERCENTILE(RFM_score,0.5),3) as median_rfm
    ,ROUND(AVG(RFM_score),3) as avg_rfm
    ,ROUND(APPROX_PERCENTILE(RFM_score,0.75),3) as q3_rfm
    ,ROUND(MAX(RFM_score),3) as max_rfm
    ,ROUND(min(recency), 2) as min_recency, ROUND(APPROX_PERCENTILE(recency, 0.25), 2) as q1_recency, ROUND(avg(recency), 2) as avg_recency, ROUND(APPROX_PERCENTILE(recency, 0.75), 2) AS q3_recency, max(recency) as max_recency 
    ,ROUND(min(FREQUENCY), 2) as min_frequency, ROUND(APPROX_PERCENTILE(frequency, 0.25), 2) as q1_frequency, ROUND(avg(FREQUENCY), 2) as avg_frequency, ROUND(APPROX_PERCENTILE(frequency, 0.75), 2) AS q3_frequency, ROUND(max(FREQUENCY), 2) as max_frequency 
    ,ROUND(min(monetary_value),2) as min_monetary, ROUND(APPROX_PERCENTILE(monetary_value, 0.25), 2) as q1_monetary, ROUND(avg(monetary_value), 2) as avg_monetary, ROUND(APPROX_PERCENTILE(monetary_value, 0.75), 2) AS q3_monetary, ROUND(max(monetary_value), 2) as max_monetary
    ,ROUND(CORR(RFM_score, monetary_value),3) as corr_rfm_monetary
    ,TD_TIME_STRING(${session_unixtime} - CAST(86400*MAX(recency) AS INTEGER), 'd!') as min_date
    ,TD_TIME_STRING(${session_unixtime} - CAST(86400*MIN(recency) AS INTEGER), 'd!') as max_date
FROM ${output_table}
GROUP BY 1, 2

UNION ALL

SELECT
     ${session_id} as session_id
    ,'ALL' AS rfm_segment
    ,COUNT(1) as segment_size
    ,ROUND(CAST(COUNT(1) AS DOUBLE)*100 / (SELECT COUNT(1)  from ${output_table}), 2) AS population_percent  
    ,ARRAY_JOIN(ARRAY_DISTINCT(ARRAY_AGG(rfm_quartile)), ', ') as quartile_list
    ,ROUND(MIN(rfm_score),3) as min_rfm
    ,ROUND(APPROX_PERCENTILE(RFM_score,0.25),3) as q1_rfm
    ,ROUND(APPROX_PERCENTILE(RFM_score,0.5),3) as median_rfm
    ,ROUND(AVG(RFM_score),3) as avg_rfm
    ,ROUND(APPROX_PERCENTILE(RFM_score,0.75),3) as q3_rfm
    ,ROUND(MAX(RFM_score),3) as max_rfm
    ,ROUND(min(recency), 2) as min_recency, ROUND(APPROX_PERCENTILE(recency, 0.25), 2) as q1_recency, ROUND(avg(recency), 2) as avg_recency, ROUND(APPROX_PERCENTILE(recency, 0.75), 2) AS q3_recency, max(recency) as max_recency 
    ,ROUND(min(FREQUENCY), 2) as min_frequency, ROUND(APPROX_PERCENTILE(frequency, 0.25), 2) as q1_frequency, ROUND(avg(FREQUENCY), 2) as avg_frequency, ROUND(APPROX_PERCENTILE(frequency, 0.75), 2) AS q3_frequency, ROUND(max(FREQUENCY), 2) as max_frequency 
    ,ROUND(min(monetary_value),2) as min_monetary, ROUND(APPROX_PERCENTILE(monetary_value, 0.25), 2) as q1_monetary, ROUND(avg(monetary_value), 2) as avg_monetary, ROUND(APPROX_PERCENTILE(monetary_value, 0.75), 2) AS q3_monetary, ROUND(max(monetary_value), 2) as max_monetary
    ,ROUND(CORR(RFM_score, monetary_value),3) as corr_rfm_monetary
    ,TD_TIME_STRING(${session_unixtime} - CAST(86400*MAX(recency) AS INTEGER), 'd!') as min_date
    ,TD_TIME_STRING(${session_unixtime} - CAST(86400*MIN(recency) AS INTEGER), 'd!') as max_date
FROM ${output_table}
GROUP BY 1, 2


