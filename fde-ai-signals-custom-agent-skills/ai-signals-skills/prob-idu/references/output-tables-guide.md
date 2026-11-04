# Probabilistic ID Unification — Output Tables Guide

All tables are in `sink_database`. Column meaning for the agent: `agent_template/references/data-dictionary.md`.

## 1. Result tables

| Table | One row per | Use |
|---|---|---|
| `dedupe_<output_table>` | ID in a cluster of 2+ IDs | **The result.** `cluster_col_name` (`prob_id`) groups the IDs of one person; `avg_cluster_similarity` is the cluster's match confidence. Join to the customer table on `id_col`. IDs without a match are not in it |
| `output_table` | ID per block cluster, before the final merge | Raw AI Signals output; read it only when debugging |
| `blocking_table` | Block member | Candidate pairs from MinHash; debugging recall |

`output_table`, `dedupe_<output_table>`, `input_table` and `blocking_table` are replaced each run.

## 2. Stats tables

Appended every run and stamped with `session_id`. The latest session is `prob_session_global_filter` with `session_rnk = 1`.

| Table | Contents |
|---|---|
| `prob_model_table_params` | The run's parameters (`hashes`, `keygroups`, thresholds, `dedupe_col_params`) and counts: `raw_record_cnt`, `num_profiles_block_table`, `num_blocks`, `num_final_clusters`, `deduped_ids`, `estimated_savings`, `run_duration_mins` |
| `prob_uni_config_stats_table` | Quality of `dedupe_<output_table>`: `unification_compression_ratio`, similarity statistics, share of records per similarity band, `cluster_purity_pct`, `overall_quality_rating`, `precision_rating`, `composite_efficiency_score` |
| `prob_final_cluster_histogram` | Blocks and clusters by size (`num_records_per_block`, `block_cnt`, `num_records_per_cluster`, `cluster_cnt`) |
| `prob_session_global_filter` | `session_id`, `session_rnk`, `event_time` |

## 3. Reading the results

| Indicator | Good | Check when |
|---|---|---|
| `avg_similarity_score` | ≥ 0.90 | below 0.85 — thresholds too low |
| `excellent_precision_pct` / `very_good_plus_pct` | most records ≥ 0.95 similarity | `poor_precision_pct` high — raise `cluster_threshold` |
| `cluster_density_ratio` | 2–3 IDs per cluster | above ~5 or `max_cluster_size` in the hundreds — over-merging, placeholder values |
| `deduped_ids` (parameters table) | > 0 and plausible for the data | 0 or very small — thresholds too high |
| Histogram | mostly clusters of 2–3 | a long tail of large clusters |

Similarity bands (`avg_cluster_similarity`): ≥ 0.98 excellent, 0.95–0.98 very good, 0.90–0.95 good, 0.85–0.90 fair, below 0.85 poor.

## 4. Tuning from the results

`jaccard_similarity_threshold` must always stay ≤ `cluster_threshold` (the workflow fails otherwise). After 3 or more runs the agent's `tuning-advisor.md` recommends the best thresholds and weights. Change one parameter at a time, by 0.05, re-run and compare sessions in `prob_uni_config_stats_table`.

| Finding | Change |
|---|---|
| Unrelated IDs merged, giant clusters | Raise `cluster_threshold` and `jaccard_similarity_threshold` (keep Jaccard ≤ cluster); clean placeholders; lower `max_ids_per_block`; raise weight of the most reliable column |
| Obvious duplicates missed, mostly size-2 clusters or none | Lower `cluster_threshold` and `jaccard_similarity_threshold`; raise `hashes` (16 → 24) and `keygroups` (8 → 12); `fill_missing: True`; check column weights |
| Out of memory, long runtime | Raise `jaccard_similarity_threshold`; lower `max_ids_per_block`, `max_ids_per_cluster`, `hashes`; `string_type: jarowinkler`; `fill_missing: False` |

Compare runs by sampling 50–100 clusters by hand: the same person, or not? Recall cannot be read from the tables — only from known duplicates.

## 5. Using the result

- **Parent Segment:** add `dedupe_<output_table>` as an attribute table keyed by `id_col` (`parent_segment.md`).
- **Activation:** treat IDs sharing `cluster_col_name` as one person; suppress duplicates across the cluster.
- **Review:** low-similarity clusters (`avg_cluster_similarity` < 0.90) are the ones to check by hand first.
