WITH BASE AS (
SELECT
  'ALL' AS rfm_segment,
  'monetary' as metric_name,
 NUMERIC_HISTOGRAM(${globals.num_bins}, monetary_value) as hist
 FROM ${output_table}

UNION ALL

SELECT   
'ALL' AS rfm_segment,
'recency' as metric_name,
 NUMERIC_HISTOGRAM(${globals.num_bins}, recency) as hist
  FROM ${output_table}

UNION ALL

SELECT   
'ALL' AS rfm_segment,
'frequency' as metric_name,
 NUMERIC_HISTOGRAM(${globals.num_bins}, frequency) as hist
  FROM ${output_table}
)
,
BASE_SEG AS (
SELECT
 rfm_segment,
 'monetary' as metric_name,
 NUMERIC_HISTOGRAM(${globals.num_bins}, monetary_value) as hist
 FROM ${output_table}
 GROUP BY 1

UNION ALL

SELECT  
rfm_segment, 
'recency' as metric_name,
 NUMERIC_HISTOGRAM(${globals.num_bins}, recency) as hist
  FROM ${output_table}
  GROUP BY 1

UNION ALL

SELECT
rfm_segment,   
'frequency' as metric_name,
 NUMERIC_HISTOGRAM(${globals.num_bins}, frequency) as hist
  FROM ${output_table}
  GROUP BY 1
)
,
FINAL AS (
SELECT * FROM BASE
UNION ALL
SELECT * FROM BASE_SEG
)
SELECT
${session_id} as session_id, 
rfm_segment,
metric_name,
position as bin_order,
'B' || CAST(position AS VARCHAR) AS bin_label,
 CEIL(CAST(ROUND(bin_limit, 1) as DOUBLE)) as bin_value,
 CAST(num_vals as DOUBLE) as profile_cnt
 FROM FINAL
 CROSS JOIN UNNEST(hist) WITH ORDINALITY AS t (bin_limit, num_vals, position)