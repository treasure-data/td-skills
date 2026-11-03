-- Single Comprehensive Analysis Query for Probabilistic Unification Table
-- Fixed for Presto compatibility
with base_stats as (
    select
        cast(count(*) as double) as total_records,
        cast(count(distinct ${cluster_col_name}) as double) as unique_prob_ids,
        cast(count(distinct ${id_col}) as double) as unique_${id_col}s,
        avg(avg_cluster_similarity) as avg_similarity_score,
        stddev(avg_cluster_similarity) as similarity_std_dev,
        min(avg_cluster_similarity) as min_similarity,
        max(avg_cluster_similarity) as max_similarity,
        approx_percentile(avg_cluster_similarity, 0.5) as median_similarity,
        approx_percentile(avg_cluster_similarity, 0.25) as q1_similarity,
        approx_percentile(avg_cluster_similarity, 0.75) as q3_similarity
    from dedupe_${output_table}
),
quality_distribution as (
    select
        cast(sum(case when avg_cluster_similarity >= 0.98 then 1 else 0 end) as double) as excellent_records,
        cast(sum(case when avg_cluster_similarity >= 0.95 and avg_cluster_similarity < 0.98 then 1 else 0 end) as double) as very_good_records,
        cast(sum(case when avg_cluster_similarity >= 0.90 and avg_cluster_similarity < 0.95 then 1 else 0 end) as double) as good_records,
        cast(sum(case when avg_cluster_similarity >= 0.85 and avg_cluster_similarity < 0.90 then 1 else 0 end) as double) as fair_records,
        cast(sum(case when avg_cluster_similarity < 0.85 then 1 else 0 end) as double) as poor_records,
        cast(count(*) as double) as total_for_pct
    from dedupe_${output_table}
),
cluster_analysis as (
    select
        avg(cast(cluster_size as double)) as avg_cluster_size,
        stddev(cast(cluster_size as double)) as cluster_size_variance,
        min(cluster_size) as min_cluster_size,
        max(cluster_size) as max_cluster_size,
        avg(cast(${id_col}s_per_cluster as double)) as avg_${id_col}s_per_cluster,
        cast(sum(case when ${id_col}s_per_cluster = 1 then 1 else 0 end) as double) as pure_clusters,
        cast(count(*) as double) as total_clusters,
        avg(avg_cluster_sim) as avg_intra_cluster_similarity
    from (
        select
            ${cluster_col_name},
            count(*) as cluster_size,
            count(distinct ${id_col}) as ${id_col}s_per_cluster,
            avg(avg_cluster_similarity) as avg_cluster_sim
        from dedupe_${output_table}
        group by ${cluster_col_name}
    ) cluster_metrics
)
select
${session_id} as session_id,
    -- Configuration identifier
    'dedupe_${output_table}' as table_name,

    -- CORE METRICS FOR COMPARISON
    cast(bs.total_records as bigint) as total_records,
    cast(bs.unique_prob_ids as bigint) as unique_prob_ids,
    cast(bs.unique_${id_col}s as bigint) as unique_${id_col}s,

    -- UNIFICATION EFFICIENCY (Higher = Better)
    round(bs.total_records / bs.unique_${id_col}s, 2) as unification_compression_ratio,
    round(bs.total_records / bs.unique_prob_ids, 2) as cluster_density_ratio,

    -- SIMILARITY QUALITY METRICS
    round(bs.avg_similarity_score, 4) as avg_similarity_score,
    round(bs.similarity_std_dev, 4) as similarity_consistency,
    round(bs.median_similarity, 4) as median_similarity,
    round(bs.min_similarity, 4) as min_similarity,
    round(bs.max_similarity, 4) as max_similarity,

    -- PRECISION PERCENTAGES (Higher = Better)
    round(qd.excellent_records * 100.0 / qd.total_for_pct, 2) as excellent_precision_pct,
    round((qd.excellent_records + qd.very_good_records) * 100.0 / qd.total_for_pct, 2) as very_good_plus_pct,
    round((qd.excellent_records + qd.very_good_records + qd.good_records) * 100.0 / qd.total_for_pct, 2) as acceptable_precision_pct,
    round(qd.poor_records * 100.0 / qd.total_for_pct, 2) as poor_precision_pct,

    -- CLUSTER QUALITY METRICS
    round(ca.avg_cluster_size, 2) as avg_cluster_size,
    round(ca.cluster_size_variance, 2) as cluster_size_consistency,
    ca.min_cluster_size,
    ca.max_cluster_size,
    round(ca.avg_${id_col}s_per_cluster, 2) as avg_${id_col}s_per_cluster,
    round(ca.pure_clusters * 100.0 / ca.total_clusters, 2) as cluster_purity_pct,
    round(ca.avg_intra_cluster_similarity, 4) as avg_intra_cluster_similarity,

    -- RECORD DISTRIBUTION
    cast(qd.excellent_records as bigint) as excellent_records,
    cast(qd.very_good_records as bigint) as very_good_records,
    cast(qd.good_records as bigint) as good_records,
    cast(qd.fair_records as bigint) as fair_records,
    cast(qd.poor_records as bigint) as poor_records,

    -- KEY PERFORMANCE INDICATORS (KPIs) for Easy Comparison
    case
        when bs.avg_similarity_score >= 0.95 then 'Excellent'
        when bs.avg_similarity_score >= 0.90 then 'Very Good'
        when bs.avg_similarity_score >= 0.85 then 'Good'
        when bs.avg_similarity_score >= 0.80 then 'Fair'
        else 'Needs Improvement'
    end as overall_quality_rating,

    case
        when (qd.excellent_records + qd.very_good_records) * 100.0 / qd.total_for_pct >= 80 then 'High Precision'
        when (qd.excellent_records + qd.very_good_records + qd.good_records) * 100.0 / qd.total_for_pct >= 70 then 'Good Precision'
        else 'Low Precision'
    end as precision_rating,


    -- EFFICIENCY SCORE (Composite metric for ranking configurations)
    round(
        (bs.avg_similarity_score * 0.4) +
        ((qd.excellent_records + qd.very_good_records) / qd.total_for_pct * 0.3) +
        (ca.pure_clusters / ca.total_clusters * 0.2) +
        (least(bs.total_records / bs.unique_${id_col}s / 10, 1.0) * 0.1), 4
    ) as composite_efficiency_score

from base_stats bs
cross join quality_distribution qd
cross join cluster_analysis ca;
