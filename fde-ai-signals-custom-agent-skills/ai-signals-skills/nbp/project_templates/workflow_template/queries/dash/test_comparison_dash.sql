with histo1 as 
(select numeric_histogram(20, avg_similarity_score) from ${prefix}testset),
histo2 as (select numeric_histogram(20, cat_match_rate) from ${prefix}testset)

select ${session_id} as session_id,
 cast(round(bin_name, 4) as double) as label,
 cast(num_vals as double) as bin_cnt,
 'sim_score' as type
from histo1 as x (hist)
cross join unnest(hist) as t (bin_name, num_vals)
union all 
select ${session_id} as session_id,
 cast(round(bin_name, 4) as double) as label,
 cast(num_vals as double) as bin_cnt,
 'cat_match' as type
from histo2 as x (hist)
cross join unnest(hist) as t (bin_name, num_vals)
