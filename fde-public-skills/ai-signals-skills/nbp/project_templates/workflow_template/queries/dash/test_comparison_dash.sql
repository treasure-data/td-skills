WITH histo1 as 
(SELECT NUMERIC_HISTOGRAM(20, avg_similarity_score) FROM ${prefix}testset),
histo2 as (SELECT NUMERIC_HISTOGRAM(20, cat_match_rate) FROM ${prefix}testset)

SELECT ${session_id} as session_id,
 CAST(ROUND(bin_name, 4) as DOUBLE) as label,
 CAST(num_vals as DOUBLE) as bin_cnt,
 'sim_score' as type
FROM histo1 as x (hist)
CROSS JOIN UNNEST(hist) as t (bin_name, num_vals)
UNION ALL 
SELECT ${session_id} as session_id,
 CAST(ROUND(bin_name, 4) as DOUBLE) as label,
 CAST(num_vals as DOUBLE) as bin_cnt,
 'cat_match' as type
FROM histo2 as x (hist)
CROSS JOIN UNNEST(hist) as t (bin_name, num_vals)
