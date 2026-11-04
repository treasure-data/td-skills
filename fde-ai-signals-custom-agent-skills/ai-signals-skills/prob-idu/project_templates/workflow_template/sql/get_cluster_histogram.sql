with t1 as (
select
${cluster_col_name}, count(*) as num_records_per_cluster
from dedupe_${output_table}
group by 1
)
,
clust as (
select
num_records_per_cluster,
count(${cluster_col_name}) as cluster_cnt
from t1
group by 1
),
t2 as (
select
${block_key_col}, count(*) as num_records_per_block
from ${blocking_table}
group by 1
)
,
block as (
select
${session_id} as session_id,
num_records_per_block,
count(${block_key_col}) as block_cnt
from t2
group by 2
)
select
block.*,
clust.num_records_per_cluster,
clust.cluster_cnt
from block
full outer join clust
on block.num_records_per_block = clust.num_records_per_cluster
