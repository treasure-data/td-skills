with dedup as (
  select ${cluster_col_name}, count(*) as num_ids
  from ${output_table}
  group by 1
)
,
g as (
  select f.*, dedup.num_ids
  from ${output_table} f
  join dedup on f.${cluster_col_name} = dedup.${cluster_col_name}
)

select max_by(${cluster_col_name}, num_ids) as ${cluster_col_name},
  max_by(avg_cluster_similarity, num_ids) as avg_cluster_similarity,
  ${td.last_results.cols}
from g
group by ${td.last_results.cols}
