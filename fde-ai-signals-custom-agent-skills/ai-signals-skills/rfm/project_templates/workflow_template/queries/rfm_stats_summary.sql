select
     ${session_id} as session_id
    ,rfm_segment
    ,count(1) as segment_size
    ,round(cast(count(1) as double)*100 / (select count(1)  from ${output_table}), 2) as population_percent  
    ,array_join(array_distinct(array_agg(rfm_quartile)), ', ') as quartile_list
    ,round(min(rfm_score),3) as min_rfm
    ,round(approx_percentile(RFM_score,0.25),3) as q1_rfm
    ,round(approx_percentile(RFM_score,0.5),3) as median_rfm
    ,round(avg(RFM_score),3) as avg_rfm
    ,round(approx_percentile(RFM_score,0.75),3) as q3_rfm
    ,round(max(RFM_score),3) as max_rfm
    ,round(min(recency), 2) as min_recency, round(approx_percentile(recency, 0.25), 2) as q1_recency, round(avg(recency), 2) as avg_recency, round(approx_percentile(recency, 0.75), 2) as q3_recency, max(recency) as max_recency 
    ,round(min(frequency), 2) as min_frequency, round(approx_percentile(frequency, 0.25), 2) as q1_frequency, round(avg(frequency), 2) as avg_frequency, round(approx_percentile(frequency, 0.75), 2) as q3_frequency, round(max(frequency), 2) as max_frequency 
    ,round(min(monetary_value),2) as min_monetary, round(approx_percentile(monetary_value, 0.25), 2) as q1_monetary, round(avg(monetary_value), 2) as avg_monetary, round(approx_percentile(monetary_value, 0.75), 2) as q3_monetary, round(max(monetary_value), 2) as max_monetary
    ,round(corr(RFM_score, monetary_value),3) as corr_rfm_monetary
    ,td_time_string(${session_unixtime} - cast(86400*max(recency) as integer), 'd!') as min_date
    ,td_time_string(${session_unixtime} - cast(86400*min(recency) as integer), 'd!') as max_date
from ${output_table}
group by 1, 2

union all

select
     ${session_id} as session_id
    ,'ALL' as rfm_segment
    ,count(1) as segment_size
    ,round(cast(count(1) as double)*100 / (select count(1)  from ${output_table}), 2) as population_percent  
    ,array_join(array_distinct(array_agg(rfm_quartile)), ', ') as quartile_list
    ,round(min(rfm_score),3) as min_rfm
    ,round(approx_percentile(RFM_score,0.25),3) as q1_rfm
    ,round(approx_percentile(RFM_score,0.5),3) as median_rfm
    ,round(avg(RFM_score),3) as avg_rfm
    ,round(approx_percentile(RFM_score,0.75),3) as q3_rfm
    ,round(max(RFM_score),3) as max_rfm
    ,round(min(recency), 2) as min_recency, round(approx_percentile(recency, 0.25), 2) as q1_recency, round(avg(recency), 2) as avg_recency, round(approx_percentile(recency, 0.75), 2) as q3_recency, max(recency) as max_recency 
    ,round(min(frequency), 2) as min_frequency, round(approx_percentile(frequency, 0.25), 2) as q1_frequency, round(avg(frequency), 2) as avg_frequency, round(approx_percentile(frequency, 0.75), 2) as q3_frequency, round(max(frequency), 2) as max_frequency 
    ,round(min(monetary_value),2) as min_monetary, round(approx_percentile(monetary_value, 0.25), 2) as q1_monetary, round(avg(monetary_value), 2) as avg_monetary, round(approx_percentile(monetary_value, 0.75), 2) as q3_monetary, round(max(monetary_value), 2) as max_monetary
    ,round(corr(RFM_score, monetary_value),3) as corr_rfm_monetary
    ,td_time_string(${session_unixtime} - cast(86400*max(recency) as integer), 'd!') as min_date
    ,td_time_string(${session_unixtime} - cast(86400*min(recency) as integer), 'd!') as max_date
from ${output_table}
group by 1, 2


