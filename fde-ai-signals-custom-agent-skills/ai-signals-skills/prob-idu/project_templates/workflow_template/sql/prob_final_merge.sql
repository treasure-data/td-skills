with base_cdp as (
  select
    ${cluster_col_name},
    ${id_col},
    split_part(${id_col}, '~', 1) as base_cdp_id,
    avg_cluster_similarity,
    ${td.last_results.merge_cols}
  from ${output_table}
),

-- Create union-find structure: each CDP points to all CDPs in same prob_id
cdp_neighbors as (
  select
    a.base_cdp_id,
    array_agg(distinct b.base_cdp_id) as neighbors
  from base_cdp a
  inner join base_cdp b on a.${cluster_col_name} = b.${cluster_col_name}
  group by a.base_cdp_id
),

-- Iteration 1
iter1 as (
  select
    cn.base_cdp_id,
    array_agg(distinct neighbor_of_neighbor) as extended_neighbors
  from cdp_neighbors cn
  cross join unnest(cn.neighbors) as t1(neighbor)
  left join cdp_neighbors cn2 on neighbor = cn2.base_cdp_id
  cross join unnest(coalesce(cn2.neighbors, array[neighbor])) as t2(neighbor_of_neighbor)
  group by cn.base_cdp_id
),

-- Iteration 2
iter2 as (
  select
    i1.base_cdp_id,
    array_agg(distinct neighbor_of_neighbor) as extended_neighbors
  from iter1 i1
  cross join unnest(i1.extended_neighbors) as t1(neighbor)
  left join iter1 i2 on neighbor = i2.base_cdp_id
  cross join unnest(coalesce(i2.extended_neighbors, array[neighbor])) as t2(neighbor_of_neighbor)
  group by i1.base_cdp_id
),

-- Iteration 3
iter3 as (
  select
    i1.base_cdp_id,
    array_agg(distinct neighbor_of_neighbor) as extended_neighbors
  from iter2 i1
  cross join unnest(i1.extended_neighbors) as t1(neighbor)
  left join iter2 i2 on neighbor = i2.base_cdp_id
  cross join unnest(coalesce(i2.extended_neighbors, array[neighbor])) as t2(neighbor_of_neighbor)
  group by i1.base_cdp_id
),

-- Assign cluster (minimum CDP in connected component)
cdp_to_cluster as (
  select
    base_cdp_id,
    array_min(extended_neighbors) as cluster_id
  from iter3
),

-- Count how many unique CDP IDs are in each cluster
cluster_sizes as (
  select
    cluster_id,
    count(distinct base_cdp_id) as cdp_count
  from cdp_to_cluster
  group by cluster_id
  having count(distinct base_cdp_id) >= 2  -- Only keep clusters with 2+ CDP IDs
),

-- Filter to only valid clusters
valid_clusters as (
  select
    ctc.base_cdp_id,
    ctc.cluster_id
  from cdp_to_cluster ctc
  inner join cluster_sizes cs on ctc.cluster_id = cs.cluster_id
),

-- Aggregate each CDP's own data (not the entire cluster)
cdp_aggregated_data as (
  select
    b.base_cdp_id,
    vc.cluster_id,
    max(b.avg_cluster_similarity) as avg_cluster_similarity,
    ${td.last_results.merge_agg_cols}
  from base_cdp b
  inner join valid_clusters vc on b.base_cdp_id = vc.base_cdp_id
  group by b.base_cdp_id, vc.cluster_id
),

-- Assign unified prob_id to the cluster
cluster_prob_id as (
  select
    vc.cluster_id,
    min(b.${cluster_col_name}) as unified_prob_id
  from base_cdp b
  inner join valid_clusters vc on b.base_cdp_id = vc.base_cdp_id
  group by vc.cluster_id
),

-- Final result: each CDP with its own data but same prob_id
final_result as (
  select
    cp.unified_prob_id as ${cluster_col_name},
    cad.base_cdp_id as ${id_col},
    cad.avg_cluster_similarity,
    ${td.last_results.merge_final_cols}
  from cdp_aggregated_data cad
  inner join cluster_prob_id cp on cad.cluster_id = cp.cluster_id
)

select * from final_result
