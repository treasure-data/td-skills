# Probabilistic ID Unification — Workflow Template

## Overview

This Treasure Workflow project finds records that belong to the same person but were not merged by deterministic ID unification (typos, a changed email, a different phone or address format) and assigns them a shared probabilistic ID. It runs **after** deterministic unification and takes its canonical IDs as input.

- **Input table** — `sql/input_table.sql` builds one row per canonical ID with one column per dedupe column (email, phone, address, …).
- **Blocking** — MinHash LSH in SQL puts likely matches into the same block, so only IDs in the same block are compared.
- **Clustering** — the AI Signals `pidu` solution (ml-batch-api) scores every pair in a block as a weighted per-column similarity and clusters pairs above `cluster_threshold`. No Python runs in the workflow.
- **Dedup and merge** — an ID that landed in several clusters keeps its largest one; clusters sharing an ID are merged into the final `dedupe_<output_table>`.
- **Stats** — model parameters, cluster quality and the cluster-size histogram are written for dashboards.

TD project name: `prob_idu_ais` (from `tdx.json`). Entry point: `ml_prob_unification_launch.dig`. All parameters live in `config/global.yml`.

## Workflow Structure

```
ml_prob_unification_launch.dig                  # entry point: schedule, error email, the steps below
├── +check_thresholds                           # fails if jaccard_similarity_threshold > cluster_threshold
├── +create_input_table                         # 0. sql/input_table.sql → input_table
├── ml_prob_unification_presto_parallel.dig     # 1. MinHash blocking → blocking_table
├── ml_prob_ai_signal.dig                       # 2. drop output_table; POST /v1/runs (solution pidu); poll /status (408 while running)
├── +dedup_check / +if_dedup_needed             # 3. an ID in several clusters keeps its largest → output_table
├── +get_merge_columns / +merge_prob_ids        # 4. merge connected clusters → dedupe_<output_table>
└── ml_prob_unification_dashboard_stats.dig     # 5. stats tables
```

| Folder / file | Contents |
|---|---|
| `config/global.yml` | All parameters |
| `sql/` | `input_table.sql` is the project's input query (rewritten per project, `sql/README.md`); the rest is blocking, dedup, merge and stats SQL — do not edit |
| `body.txt` | Failure email body (used when the `_error` block in the entry point is enabled) |

## Configuration

All keys are in `config/global.yml`. Change the ones in **bold** for every project. `jaccard_similarity_threshold ≤ cluster_threshold` always — the workflow fails the run otherwise; start both high (0.90–0.95) and lower them in 0.05 steps.

### Input and output

| Parameter | What it does | How to choose it |
|---|---|---|
| **`sink_database`** | Database for the input, blocking, cluster and stats tables | The confirmed sink database. The `prob_*` stats tables have fixed names, so one sink database holds one project |
| **`source_database`**, **`source_table`** | What `sql/input_table.sql` reads | The deterministic-IDU output the Phase 1 discovery found |
| `input_table` | Table built by `sql/input_table.sql` | Keep the default unless the name clashes |
| **`id_col`** | Canonical ID column (one row per ID) | The ID the deterministic unification created (e.g. `persistent_id`) |
| `output_table` | Cluster table written by the AI Signals run; `dedupe_<output_table>` is the final merged table | Keep the default or use a project name |
| `exclude_overmerging` | Only recorded in `prob_model_table_params` | `'no'` |

### Dedupe columns

| Parameter | What it does | How to choose it |
|---|---|---|
| **`dedupe_columns`** | One entry per column: `name` (column of `input_table`), `type` (`string`, `email`, `phone`), `weight` | 2–4 identifier columns, each at most ~50% NULL. `type` selects the cleaning and blocking logic. Weights sum to 1.0: strong identifiers (email, phone) 0.30–0.40, fuzzy fields (name, address) 0.15–0.30 |

### Blocking

| Parameter | What it does | How to choose it |
|---|---|---|
| `blocking_table` | Table of blocks (`block_key` + one row per member ID) | Keep the default |
| `block_key_col` | Block column the AI Signals run reads | `block_key` |
| `hashes` | Number of MinHash functions | 16; 24–32 for noisy data (more recall, slower); 8–12 for clean data |
| `keygroups` | Hash values per signature; a divisor of `hashes` | 8; raise to 12 for missed matches, lower to 6 for too many false matches |
| **`jaccard_similarity_threshold`** | Minimum MinHash overlap for two IDs to share a block | 0.90 first; 0.85, then 0.75–0.80 when recall is low; must be ≤ `cluster_threshold` |
| `ngram_len` | Character n-gram size for the hashes | 2 for emails, phones and names; 3–4 for long addresses |
| `max_ids_per_cluster` | MinHash buckets with more IDs are dropped | 3000; lower (300–1000) when blocking runs out of memory |
| `max_ids_per_block` | Larger blocks are split into sub-blocks of this size | 3000; lower (30–500) to stop one user gathering dozens of variants |

### Clustering (AI Signals)

| Parameter | What it does | How to choose it |
|---|---|---|
| **`ml_batch_endpoint`** | AI Signals ml-batch-api base URL | The account's region: US `https://ml-batch-api.treasuredata.com`, Japan `https://ml-batch-api.treasuredata.co.jp`, EU `https://ml-batch-api.eu01.treasuredata.com`, AP `https://ml-batch-api.ap02.treasuredata.com` / `https://ml-batch-api.ap03.treasuredata.com` |
| `ml_batch_version` | AI Signals solution version | Confirm for the account; the template value is the one the solution was tested with |
| `cluster_col_name` | Cluster ID column written to `output_table` | `prob_id` |
| **`cluster_threshold`** | Minimum weighted similarity to cluster two IDs | 0.90–0.95 for precision (finance, compliance), 0.65–0.80 for marketing / CRM, 0.45–0.60 for recall; lower by 0.05 when matches are missed, raise when wrong IDs merge |
| `string_type` | Similarity for `string` columns: `fuzzy` or `jarowinkler` | `fuzzy` for long text (addresses); `jarowinkler` for names and short strings, and when runtime matters |
| `fill_missing` | Soft-impute NULLs (`True`) or give NULL zero similarity (`False`) | `True` below ~30% NULL; `False` above ~50% or when memory runs out |
| `max_block_rows` | Per-block row cap in the solution | `0` (off); set it to cut oversized blocks when runs fail on memory |

### Dashboard stats

| Parameter | What it does | How to choose it |
|---|---|---|
| `convergence_threshold` | Only recorded in `prob_model_table_params` | 0.01 |
| `avg_spend_per_user` | Annual marketing spend per ID, used for the estimated savings | The customer's figure, or keep 100 |

## Outputs

All tables are in `sink_database`. The `prob_*` stats tables are appended on every run and stamped with `session_id`; filter on the session you want (`prob_session_global_filter`, `session_rnk = 1` is the latest).

| Table | Contents |
|---|---|
| `input_table` | One row per `id_col` with the dedupe columns — replaced each run |
| `blocking_table` | `block_key` + member IDs and their columns — replaced each run |
| `output_table` | Clusters from the AI Signals run: `id_col`, `cluster_col_name`, `avg_cluster_similarity`, input columns — replaced each run |
| `dedupe_<output_table>` | Final merged clusters (2+ IDs only), one row per ID: `cluster_col_name`, `id_col`, `avg_cluster_similarity`, merged attributes — replaced each run |
| `prob_model_table_params` | Run configuration and pipeline counts (profiles, blocks, clusters, deduped IDs, estimated savings, duration) |
| `prob_uni_config_stats_table` | Cluster quality metrics and ratings per run |
| `prob_final_cluster_histogram` | Blocks and clusters by size |
| `prob_session_global_filter` | Sessions ranked newest first (`session_rnk`) |
| `prob_hash_table`, `prob_dedupe_blocking_schema` | Blocking helper tables |

## Secrets & Requirements

- **Secrets:** none to set. `ml_prob_ai_signal.dig` sends `${secret:td.apikey}` to the AI Signals ml-batch-api, which provides the key itself.
- **Account:** AI Signals must be enabled for the `pidu` solution.
- **Data:** deterministic ID unification already run; at least 2 identifier columns per ID with standardized formats and few placeholder values.
- **Permissions:** the project owner needs permission to create the sink database and tables, and read access to `source_database`.
- **Failure email:** the `_error` block in the entry point is commented out. To enable it, uncomment it and replace `your-team@example.com` with the alert address.
- **Schedule:** commented out in the entry point; uncomment it for scheduled runs.

## Customization Points

| Change | Where |
|---|---|
| Source of the IDs and identifier columns | `sql/input_table.sql` — always rewritten for the project (`sql/README.md`) |
| Input table built outside this workflow | Remove `+create_input_table` from the entry point; the table must keep the output contract |
| Extra address cleaning (abbreviations) | `sql/string_predicates.sql` |
| Failure email, schedule | `ml_prob_unification_launch.dig` |
| Blocking engine | `ml_prob_unification_presto_parallel.dig` runs the pair-generation steps on Hive (`engine: hive`); the rest on Trino |
