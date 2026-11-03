# AI Signals Probabilistic ID Unification — Model Guide

Read this for any task about the AI Signals `pidu` solution: how it clusters, which API parameters exist and how to set them, changing the input or output tables, or troubleshooting a run. The workflow template (`ml_prob_ai_signal.dig`, `config/global.yml`) is the source of truth for what this setup sends today; this guide covers what the API accepts and how the clustering behaves.

**Public documentation:** https://docs.treasure.ai/products/customer-data-platform/machine-learning/ai-signals (general AI Signals page — no `pidu`-specific page is published) — after answering a question about the model from this guide, share this link and tell the user they can find more detail in the public AI Signals documentation.

## 1. What it does

Probabilistic ID Unification (IDU) links canonical IDs that deterministic unification left apart (the same person with a different email spelling, a second phone, a typo in the address). It does not replace deterministic IDU — it runs after it and works on its canonical IDs.

The pipeline has two parts:

1. **Blocking (SQL in the workflow)** — MinHash LSH on the dedupe columns groups likely matches into blocks, so only IDs inside a block are compared. The result is the blocking table (`block_key` + one row per ID in the block + the input columns).
2. **Clustering (AI Signals `pidu` solution)** — compares the IDs inside each block column by column, combines the column similarities with the weights, and groups IDs above `cluster_threshold` into clusters.

The workflow then collapses IDs that landed in several clusters, merges clusters that share an ID and writes the stats tables.

## 2. How clustering works

- **Weighted similarity** — each dedupe column gets a similarity per ID pair (`email`, `phone`: exact / near-exact on the cleaned value; `string`: fuzzy text). The pair score is the weighted sum (weights sum to 1.0).
- **Threshold** — pairs with a score ≥ `cluster_threshold` are linked; connected IDs form a cluster with a `cluster_col_name` ID. Higher = fewer, tighter clusters.
- **`string_type`** — `fuzzy` suits long text (full addresses); `jarowinkler` is cheaper and suits short strings (names).
- **`fill_missing`** — `True` soft-imputes NULLs to improve scoring; `False` gives zero similarity when a value is NULL. With more than ~50% NULLs in a column, use `False` or drop the column.
- **`max_block_rows`** — caps rows per block; `0` = no cap. Oversized blocks are already split by `max_ids_per_block` in the SQL.
- **`jaccard_similarity_threshold` ≤ `cluster_threshold`** — blocking must be at least as permissive as clustering, otherwise candidate pairs are lost before they are scored.

## 3. API call

`ml_prob_ai_signal.dig` calls the ml-batch-api with `http>`; no Python runs in the workflow.

| Request field | Value |
|---|---|
| `POST {ml_batch_endpoint}/v1/runs/` | Submits the run; the response holds the run `id` |
| `solution_name` | `pidu` |
| `version` | `ml_batch_version` — the template uses `experimental` (taken from the tested development setup); confirm the version for the account |
| `input_table` | `<sink_database>.<blocking_table>` |
| `output_table` | `<sink_database>.<output_table>` |
| `solution_arguments` | `block_key_col`, `id_col`, `cluster_col_name`, `dedupe_columns` (list of `name` / `type` / `weight`), `string_type`, `cluster_threshold`, `fill_missing`, `max_block_rows` |
| Headers | `authorization: TD1 ${secret:td.apikey}` (provided by AI Signals — no secret to set), `X-TD-ML-SESSION-ID`, `X-TD-ML-ATTEMPT-ID` |

Polling: `GET {ml_batch_endpoint}/v1/runs/{id}/status` — `408` while running, `200` when done; `http>` retries until then.

The solution **always appends** to the output table, so the workflow drops it first (`+drop_output`); otherwise a re-run doubles every row.

### Endpoint by region

`ml_batch_endpoint` in `config/global.yml` — set it from the account's site (`tdx status`):

| Site | Endpoint |
|---|---|
| US (us01) | `https://ml-batch-api.treasuredata.com` |
| Japan (jp01) | `https://ml-batch-api.treasuredata.co.jp` |
| EU (eu01) | `https://ml-batch-api.eu01.treasuredata.com` |
| AP (ap02) | `https://ml-batch-api.ap02.treasuredata.com` |
| AP (ap03) | `https://ml-batch-api.ap03.treasuredata.com` |

Prerequisite: the account's AI Signals solutions include `pidu`.

## 4. Output table

`output_table` (default `prob_idu_clusters`): one row per ID that was matched, with `cluster_col_name` (the cluster ID), `avg_cluster_similarity`, the `id_col` and the input columns carried through. Table details and the downstream tables are in `output-tables-guide.md`.

## 5. Choosing values

Start strict (`cluster_threshold` and `jaccard_similarity_threshold` 0.90–0.95), review 50–100 clusters by hand, then move both in 0.05 steps. Tuning scenarios and symptom → fix tables are in `workflow-setup.md`.

## 6. Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `+cluster` returns 401/403 | `ml_batch_endpoint` does not match the region, or `pidu` is not enabled | Set the regional endpoint; ask the account admin about access |
| `+cluster` returns 4xx naming the solution or version | `ml_batch_version` unavailable for the account | Confirm the available `pidu` version with the AI Signals team and set `ml_batch_version` |
| Run status FAILED / user-input error | Dedupe column missing from the blocking table, weights not summing to 1.0, wrong `block_key_col` / `id_col` | Compare `dedupe_columns` with the input table columns; check the weights |
| Output table empty | Blocking table empty or thresholds too high | Check `blocking_table` has rows; lower `jaccard_similarity_threshold` and `cluster_threshold` |
| Duplicated rows in the output | Output table not dropped before the run | Keep `+drop_output` in `ml_prob_ai_signal.dig` |
| Poll gives up / very long run | Large blocks | Raise `jaccard_similarity_threshold`, lower `max_ids_per_block` / `max_ids_per_cluster`, or set `max_block_rows` |
| Memory error in the blocking SQL | Too many candidate pairs | Raise `jaccard_similarity_threshold`, lower `hashes`; the Hive steps are already set to `engine: hive` |
