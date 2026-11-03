# Data Dictionary — Probabilistic ID Unification Outputs

All tables are in `{{sink_database}}`. The four `prob_*` stats tables are **appended on every run** and carry the run's `session_id` (the Workflow session, a number). The cluster tables hold the latest run only (`drop` / `create` each run). `<id_col>` below is the workflow's `id_col` (`{{id_col}}`); a few column names embed it.

## Picking a run

```sql
-- latest run
SELECT session_id FROM prob_session_global_filter WHERE session_rnk = 1
```

`prob_session_global_filter` ranks runs by `session_id` (rank 1 = latest). Filter every stats query on one `session_id`.

## Result tables

### `{{output_table}}` — clusters from the AI Signals run
One row per input ID after the final dedup. An ID that landed in several clusters keeps the largest one.

| Column | Meaning |
|---|---|
| `{{id_col}}` | The deterministic canonical ID |
| `{{cluster_col_name}}` | Cluster ID shared by IDs judged to be the same person. Singletons also get an ID |
| `avg_cluster_similarity` | Average similarity (0–1) of the ID to the other members of its cluster |
| other columns | Attributes carried from the input table (the dedupe columns and any others) |

### `dedupe_{{output_table}}` — merged result
Only IDs in a cluster of **2 or more** distinct base IDs (the ID before any `~` suffix) are written. Clusters connected through shared IDs are joined (three neighbour hops) and take the smallest `{{cluster_col_name}}` of the group. Unmatched IDs are not in this table.

| Column | Meaning |
|---|---|
| `{{cluster_col_name}}` | Unified cluster ID |
| `{{id_col}}` | The base ID |
| `avg_cluster_similarity` | Highest similarity of the ID's rows |
| other columns | Distinct non-empty values of the carried attributes, joined with `; ` |

## Stats tables (one row per run unless noted)

### `prob_model_table_params` — settings and volumes
| Column | Meaning |
|---|---|
| `session_id`, `run_date`, `run_duration_mins` | Run key, timestamp, minutes from session start to this step |
| `dedupe_col_params` | `column: weight` list of the dedupe columns |
| `hashes`, `keygroups`, `jaccard_sim_threshold` | Blocking settings |
| `cluster_threshold`, `string_similarity_algo`, `fill_missing`, `convergence_threshold` | Clustering settings (`convergence_threshold` is recorded, not sent to the API) |
| `exclude_overmerging` | Recorded from the config only |
| `annual_marketing_spend_per_user`, `daily_…`, `weely_…` (sic) | Spend inputs for the savings estimate |
| `raw_record_cnt` | Rows in the input table |
| `blocking_table_cnt`, `num_profiles_block_table`, `num_blocks` | Rows, distinct IDs and blocks in the blocking table |
| `final_cluster_table_cnt`, `num_final_clusters` | Rows and distinct cluster IDs in `{{output_table}}` |
| `deduped_ids` | Rows − distinct clusters: IDs that collapse into another |
| `estimated_savings` | `deduped_ids` × annual spend per user — a planning estimate |

### `prob_uni_config_stats_table` — match quality (computed on `dedupe_{{output_table}}`)
| Column | Meaning |
|---|---|
| `session_id`, `table_name` | Run key and the table measured |
| `total_records`, `unique_prob_ids`, `unique_<id_col>s` | Rows, clusters and distinct IDs |
| `unification_compression_ratio`, `cluster_density_ratio` | Rows per distinct ID, rows per cluster |
| `avg_similarity_score`, `similarity_consistency`, `median_similarity`, `min_similarity`, `max_similarity` | Distribution of `avg_cluster_similarity` (`similarity_consistency` = standard deviation) |
| `excellent_records` … `poor_records` | Rows per band: ≥ 0.98, 0.95–0.98, 0.90–0.95, 0.85–0.90, < 0.85 |
| `excellent_precision_pct`, `very_good_plus_pct`, `acceptable_precision_pct`, `poor_precision_pct` | Share of rows in the top band, top two, top three, and the poor band |
| `avg_cluster_size`, `cluster_size_consistency`, `min_cluster_size`, `max_cluster_size` | Cluster size statistics |
| `avg_<id_col>s_per_cluster`, `cluster_purity_pct`, `avg_intra_cluster_similarity` | IDs per cluster, share of clusters with one distinct ID, mean cluster similarity |
| `overall_quality_rating` | `avg_similarity_score` ≥ 0.95 Excellent, ≥ 0.90 Very Good, ≥ 0.85 Good, ≥ 0.80 Fair, else Needs Improvement |
| `precision_rating` | High Precision if top two bands ≥ 80%; Good Precision if top three ≥ 70%; else Low Precision |
| `composite_efficiency_score` | 0.4 × avg similarity + 0.3 × top-two-band share + 0.2 × purity + 0.1 × capped compression — for ranking runs, not an absolute score |

### `prob_final_cluster_histogram` — size distributions (several rows per run)
| Column | Meaning |
|---|---|
| `session_id` | Run key |
| `num_records_per_block`, `block_cnt` | Block size and how many blocks have it |
| `num_records_per_cluster`, `cluster_cnt` | Cluster size and how many clusters have it (from `dedupe_{{output_table}}`) |

Block and cluster sides are full-outer-joined on equal size, so either pair can be NULL on a row.

### `prob_session_global_filter`
| Column | Meaning |
|---|---|
| `session_id`, `session_rnk`, `event_time` | Run key, rank (1 = latest), run date |

## Input and helper tables

| Table | Contents |
|---|---|
| `<input_table>` | One row per `{{id_col}}` plus the dedupe columns, built by `sql/input_table.sql` (replaced each run) |
| `<blocking_table>` | `block_key`, the ID and its carried columns — IDs the MinHash step put in the same block (replaced each run) |
| `prob_hash_table` | Per-ID cleaned values and n-gram hashes of the dedupe columns (replaced each run) |
| `prob_dedupe_blocking_schema` | One row per dedupe column: its cleaning and hashing SQL and weight (replaced each run) |

## Reading the numbers

- Similarity bands judge how closely the members of a cluster agree on the weighted columns. They are not an accuracy: no ground truth is stored.
- A high `max_cluster_size` or a long tail in the histogram points to over-merging; a mean cluster size near 2 with a low `deduped_ids` points to under-merging.
- Compare runs only after checking which settings changed (`prob_model_table_params`).

## Example queries

```sql
-- quality bands of the latest run
SELECT excellent_records, very_good_records, good_records, fair_records, poor_records
FROM prob_uni_config_stats_table WHERE session_id = (SELECT session_id FROM prob_session_global_filter WHERE session_rnk = 1)

-- biggest clusters
SELECT {{cluster_col_name}}, COUNT(*) AS ids, MIN(avg_cluster_similarity) AS min_sim
FROM dedupe_{{output_table}} GROUP BY 1 ORDER BY 2 DESC LIMIT 20

-- how many input IDs were matched
SELECT (SELECT COUNT(*) FROM dedupe_{{output_table}}) AS matched, (SELECT COUNT(*) FROM {{output_table}}) AS clustered
```
