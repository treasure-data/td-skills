-- @TD distribute_strategy: aggressive

with
-- Step 1: Direct feature generation
user_features as (
  select
    ${id_col},
    categorical_features(
      array(${td.last_results.column_list}),
      ${td.last_results.column_names}
    ) as features
  from ${sink_database}.prob_hash_table
),

-- Step 2: Generate MinHash signatures
user_hash_all as (
  select
    minhash(${id_col}, features, "-n ${hashes} -k ${keygroups}") as (clusterid, ${id_col})
  from user_features
),

-- Step 3: Keep clusters of 2..max_ids_per_cluster IDs
valid_clusters as (
  select
    clusterid,
    count(*) as cluster_size
  from user_hash_all
  group by clusterid
  having count(*) between 2 and ${max_ids_per_cluster}  -- Apply size limits early
)

-- DIGDAG_INSERT_LINE
-- Step 4: Final output with only valid clusters
select
  a.clusterid,
  a.${id_col}
from user_hash_all a
inner join valid_clusters b on a.clusterid = b.clusterid;
