with base as (
select
  'ALL' as rfm_segment,
  'monetary' as metric_name,
 numeric_histogram(${globals.num_bins}, monetary_value) as hist
 from ${output_table}

union all

select   
'ALL' as rfm_segment,
'recency' as metric_name,
 numeric_histogram(${globals.num_bins}, recency) as hist
  from ${output_table}

union all

select   
'ALL' as rfm_segment,
'frequency' as metric_name,
 numeric_histogram(${globals.num_bins}, frequency) as hist
  from ${output_table}
)
,
base_seg as (
select
 rfm_segment,
 'monetary' as metric_name,
 numeric_histogram(${globals.num_bins}, monetary_value) as hist
 from ${output_table}
 group by 1

union all

select  
rfm_segment, 
'recency' as metric_name,
 numeric_histogram(${globals.num_bins}, recency) as hist
  from ${output_table}
  group by 1

union all

select
rfm_segment,   
'frequency' as metric_name,
 numeric_histogram(${globals.num_bins}, frequency) as hist
  from ${output_table}
  group by 1
)
,
final as (
select * from base
union all
select * from base_seg
)
select
${session_id} as session_id, 
rfm_segment,
metric_name,
position as bin_order,
'B' || cast(position as varchar) as bin_label,
 ceil(cast(round(bin_limit, 1) as double)) as bin_value,
 cast(num_vals as double) as profile_cnt
 from final
 cross join unnest(hist) with ordinality as t (bin_limit, num_vals, position)