# AI Signals NBP — Model Guide

Read this for any task about the AI Signals NBP (Next Best Product) model: how it recommends, which algorithms and API parameters exist, testing other parameters, or changing the input or output tables. The workflow template (`nbp_ai_signals.dig`, `config/input_params.yml`) is the source of truth for what this setup sends today; this guide covers what the API accepts and how the model behaves.

**Public documentation:** https://docs.treasure.ai/products/customer-data-platform/machine-learning/ai-signals/nbp-ai-signals — after answering a question about the model from this guide, share this link and tell the user they can find more detail in the public AI Signals documentation.

## 1. What it does

Learns from user–item interactions and returns, for every user, a ranked list of recommended items. Two API solutions run one after the other: `nbp_train` builds and stores a model, `nbp_predict` uses it to write the top-K items per user. Three algorithms are available:

| Algorithm | How it recommends | Strengths | Limits |
|---|---|---|---|
| `popular` | The most popular items (by number of users), the same for everyone | Very fast; works for every user, including new ones | Not personalized |
| `als` | Matrix factorization (Alternating Least Squares) on the user–item matrix | Most personalized for users with several interactions | Slow on large data; recommends nothing for users not in the training data (cold start) |
| `similar_to_latest` | Items most similar to the user's latest interaction(s) | Personal and fast; works for any user with at least one interaction | Cannot recommend items that never appear in the training data |

For broad coverage, train each algorithm as a separate model (distinct `model_name`), predict with each, and merge outside the model in priority order: `als` for users in its training data → `similar_to_latest` for other users with an interaction → `popular` for users with no history. NBP never merges models in one task; this template runs one algorithm per run, so a merge means one project (or prefix) per algorithm plus a merge step. NBP picks *what* to recommend — it combines with NBA (*how and when* to promote it), and RFM or CLTV can decide *who* receives recommendations.

## 2. Input table

One row per user–item interaction. The column names are configurable (`user_column`, `item_column`, `tstamp_column`); this template builds `<prefix>transaction` with `userid`, `itemid`, `tstamp`.

| Column | Type | How the model uses it |
|---|---|---|
| user ID (`user_column`, default `userid`) | VARCHAR | The user to recommend for; the key of the output |
| item ID (`item_column`, default `itemid`) | VARCHAR | The item interacted with; recommendations are item IDs |
| time (`tstamp_column`, default `tstamp`) | LONG (UNIX seconds) | Order of interactions — `similar_to_latest` uses the latest ones; `popular` can limit to a period |
| rating (`rating_column`, optional) | number | Interaction weight; not used by this template |

Supply raw interaction rows, not per-user or per-item summaries — NBP aggregates internally (a customer with twelve purchases has twelve rows). There is no stated minimum history, but `als` benefits clearly from more of it. Items can be any asset (products, services, articles, videos); the model needs no item metadata — names and categories are joined by the template afterwards.

Prediction must use an input table of the same format as training. In this template both steps read `<prefix>transaction` (training reads `<prefix>als_sampled_input` when ALS sampling is on).

## 3. Parameters

Sent in the POST body. Top-level keys select the solution and tables; everything else goes under `solution_arguments`.

### Training — `solution_name: nbp_train`

| Parameter | Required | Default | When and how to change it |
|---|---|---|---|
| `input_table` | required | — | `db.table` of the interactions (§2) |
| `output_table` | required | — | `db.table` the training run writes; the template uses `<prefix>topk_recommended_items`, which prediction then overwrites |
| `model_name` | required | — | Name the model is stored under. **Unique per TD account — a new model with the same name overwrites the old one, whatever the algorithm.** The template uses `<prefix><algorithm>`, so keep `prefix` project-specific |
| `algorithm` | optional | `als` | `als`, `similar_to_latest` or `popular` — `automl_model_type` in the config |
| `user_column`, `item_column`, `tstamp_column` | optional | `userid`, `itemid`, `tstamp` | Only if the input uses other names |
| `rating_column` | optional | none | A weight column, if the input has one |
| `filter_num` | optional | `0` | Minimum users per item for the item to be trained on — raise it to shrink the model and speed up training; filtered items can never be recommended |
| `metrics_table` | optional | none | `db.table` that receives one row of training metrics per run (§6); the template uses `<prefix>metrics_temp` |
| `similar_items_table` | optional | none | `db.table` for the top similar items per item — `als` and `similar_to_latest` only; the template uses `<prefix>item_similarity` |
| `topk` | optional | `10` | `als` / `similar_to_latest`: similar items per item written to `similar_items_table`; also the K in the metric column names (`map_<k>`, …). Not used by `popular`. The template sends `max_recommended_items` |
| `filter_viewed` | optional | `false` | `true` leaves out items the user already interacted with |
| `tunable` | optional | `false` | `als` only: learn the best `factors` / `regularization` / `iterations` / `alpha` from the data — can improve quality but makes runtime and memory less predictable. The template sends `true` |
| `factors`, `regularization`, `iterations`, `alpha` | optional | `10`, `0.1`, `10`, `50` | `als` only, when `tunable` is off: latent factors, regularization, training iterations, confidence weight |
| `k`, `distance` | optional | `20`, `bm25` | `similar_to_latest` only: neighbours per item, and the similarity measure (`bm25`, `tf-idf`, `cosine`) |
| `popularity`, `period`, `begin_from` | optional | `n_users`, none, none | `popular` only: popularity measure (distinct users by default), a rolling window (pandas timedelta, e.g. `30D`) or a fixed start date — without either, all history counts |

Each algorithm ignores the others' parameters: `popular` uses none of `factors` … `alpha`, `tunable`, `k`, `distance`, `similar_items_table` or training `topk`; `als` ignores `k`, `distance` and the popularity ones; `similar_to_latest` ignores the `als` and popularity ones. Set `algorithm` explicitly — the API default is `als`.

### Prediction — `solution_name: nbp_predict`

| Parameter | Required | Default | When and how to change it |
|---|---|---|---|
| `model_name` | required | — | The model trained above (same name) |
| `input_table` | required | — | Users / interactions to predict for, same format as training |
| `output_table` | required | — | `db.table` of the recommendations (§6) |
| `output_mode` | optional | `overwrite` | `overwrite` for full-data predictions; `append` to keep history or add partial (daily, hourly) predictions |
| `algorithm`, `user_column`, `item_column`, `tstamp_column`, `rating_column` | optional | as in training | Keep them the same as in training |
| `topk` | optional | `10` | Recommendations per user, up to `100` |
| `lastk` | optional | `1` | `similar_to_latest` only: how many latest interactions seed the recommendations (`lastk × topk` candidates are ranked). Higher can help basket-style purchasing but costs time and memory |
| `filter_viewed` | optional | `false` | `true` leaves out items the user already interacted with — the template sends `filter_viewed` from the config |

Headers: `authorization: "TD1 ${secret:td.apikey}"` (required, exactly as in the template — the key is provided by the AI Signals architecture; no manual secret setup). Optional `X-TD-ML-SESSION-ID: ${session_id}` and `X-TD-ML-ATTEMPT-ID: ${attempt_id}` tag the API run with the workflow session and attempt for tracing.

### Endpoint by region

`ml_batch_api_endpoint` in the config, used by every call in `nbp_ai_signals.dig`:

| Region | Endpoint |
|---|---|
| US (us01) | `https://ml-batch-api.treasuredata.com` |
| Japan (Tokyo) | `https://ml-batch-api.treasuredata.co.jp` |
| EU (eu01) | `https://ml-batch-api.eu01.treasuredata.com` |
| AP (ap02) | `https://ml-batch-api.ap02.treasuredata.com` |
| AP (ap03) | `https://ml-batch-api.ap03.treasuredata.com` |

## 4. Workflow syntax

```yaml
+train:
  http>: ${ml_batch_api_endpoint}/v1/runs/
  method: POST
  headers:
    - authorization: "TD1 ${secret:td.apikey}"
    - X-TD-ML-SESSION-ID: ${session_id}       # optional
    - X-TD-ML-ATTEMPT-ID: ${attempt_id}       # optional
  store_content: true                         # needed: the poll step reads the run id from the response
  content:
    input_table: ${sink_database}.${prefix}transaction
    output_table: ${sink_database}.${prefix}topk_recommended_items
    solution_name: nbp_train
    solution_arguments:
      model_name: ${prefix}${automl_model_type}
      algorithm: ${automl_model_type}
      metrics_table: ${sink_database}.${prefix}metrics_temp
      user_column: userid
      item_column: itemid
      tstamp_column: tstamp
      tunable: true
      topk: ${max_recommended_items}
      similar_items_table: ${sink_database}.${prefix}item_similarity
      # filter_num: 5                         # optional — drop items with fewer users

+train_poll:
  # Returns 408 while the run is in progress; http> retries until 200
  http>: ${ml_batch_api_endpoint}/v1/runs/${JSON.parse(http.last_content)['id']}/status
  method: GET
  headers:
    - authorization: "TD1 ${secret:td.apikey}"

+pred:
  http>: ${ml_batch_api_endpoint}/v1/runs/
  method: POST
  headers:
    - authorization: "TD1 ${secret:td.apikey}"
  store_content: true
  content:
    input_table: ${sink_database}.${prefix}transaction
    output_table: ${sink_database}.${prefix}topk_recommended_items
    solution_name: nbp_predict
    solution_arguments:
      model_name: ${prefix}${automl_model_type}
      algorithm: ${automl_model_type}
      user_column: userid
      item_column: itemid
      tstamp_column: tstamp
      filter_viewed: ${filter_viewed}
      # topk: ${max_recommended_items}        # optional — default 10
      # lastk: 3                              # optional — similar_to_latest only

+pred_poll_status:
  http>: ${ml_batch_api_endpoint}/v1/runs/${JSON.parse(http.last_content)['id']}/status
  method: GET
  headers:
    - authorization: "TD1 ${secret:td.apikey}"
```

Keep each poll step directly after its POST — it reads the run id from the previous task's response. With ALS sampling on (`als` and `als_sample_rate < 1.0`), the training input is `<prefix>als_sampled_input` instead of `<prefix>transaction`.

## 5. How it works

1. **Train** — the model is built from all interactions in the input with the chosen algorithm and stored under `model_name` for the TD account. Training is always a full run (no incremental training). Stored models **expire after 6 months** — re-run training before then (a scheduled workflow does this on every run). Training can be less frequent than prediction (weekly to monthly); prediction with a saved model can run daily or hourly.
2. **Evaluate** — training metrics at K (precision, recall, nDCG, MAP, MRR) are written to `metrics_table`; `als` and `similar_to_latest` also write the top similar items per item to `similar_items_table`.
3. **Predict** — for each user in the prediction input, the model ranks candidate items and keeps the top `topk`: `popular` → the same popular items for everyone; `als` → items with the highest predicted affinity (users not in the training data get none); `similar_to_latest` → items most similar to the latest `lastk` interactions. With `filter_viewed`, items the user already interacted with are skipped.
4. **Template steps after the model** — optional recommendation exclusions (`exclude_product_recs`), then item names and categories are joined and the ranks become columns in `user_master_attr_table` (`nbp_<n>`, `nbp_<n>_sku`, `nb_category_<n>`).

Recommendations are relative to the data of each run: new interactions, a different time window or filters change them.

## 6. Output tables

**Recommendations** (`output_table` of `nbp_predict`, here `<prefix>topk_recommended_items`) — one row per user:

| Column | Type | Meaning |
|---|---|---|
| `user_id` | VARCHAR | User ID |
| `rec_items` | ARRAY | Recommended item IDs, best first |

**Similar items** (`similar_items_table`, here `<prefix>item_similarity`; `als` and `similar_to_latest` only): `target_item_id` (VARCHAR), `item_id` (VARCHAR), `score` (FLOAT) — higher = more similar. Empty with `popular`, so the dashboard's similarity stats are empty too.

**Training metrics** (`metrics_table`, here `<prefix>metrics_temp`): `session_id`, `model_params`, and `map_<k>`, `ndcg_<k>`, `precision_<k>`, `recall_<k>`, `mrr_<k>` for K = `topk`. The template copies them into `<prefix>dash_model_param_stats_agg` on every run.

### Validate

Run after each run (the pipeline checks — user table, coverage, dashboard tables, test set — are in `references/workflow-setup.md` §4). Replace `<db>`, `<p>`.

```sql
-- Model output: one row per user, top-K items, no empty lists
SELECT COUNT(*) AS users, COUNT(DISTINCT user_id) AS distinct_users,
       AVG(CARDINALITY(rec_items)) AS avg_items, COUNT_IF(CARDINALITY(rec_items) = 0) AS empty_lists
FROM <db>.<p>topk_recommended_items;

-- Variety: share of users whose first recommendation is the most common one
SELECT rec_items[1] AS first_item, COUNT(*) AS users
FROM <db>.<p>topk_recommended_items GROUP BY 1 ORDER BY 2 DESC LIMIT 10;

-- Training metrics of the latest run
SELECT * FROM <db>.<p>dash_model_param_stats_agg ORDER BY session_id DESC LIMIT 1;
```

Pass: `users = distinct_users`; `avg_items` close to `topk` (fewer with exclusions or `filter_viewed`); `empty_lists = 0`; with `als` or `similar_to_latest`, no single item first for most users (expected with `popular`).

### Interpret and use

- **The user table** (`user_master_attr_table`) is the main output — add it to the Parent Segment and use `nbp_1`, `nb_category_1` or the arrays (`product_recommendations` contains a product) in audiences: email product blocks, on-site carousels, cross-sell ads.
- **Metrics at K** (higher is better) — precision@K: share of recommended items that were relevant; recall@K: share of the user's relevant items that were recommended; MAP@K and nDCG@K reward the right items near the top (use them for carousels); MRR@K rewards the first hit (use it for a single featured product); recall suits a candidate list that is filtered later. Compare runs on the same K, and compare a personalized model with `popular`: if it doesn't beat the popularity baseline, its extra runtime isn't justified.
- **Activation** — the first item (`nbp_1`) fits a single featured-product slot; the full array fills a carousel or email block.
- **Item similarity** powers "customers who bought X also bought" — `target_item_id` → `item_id` by `score`.
- **Coverage** — users without recommendations are usually not in the training data (`als`), have no interactions in the window, or were dropped by sampling. Say so when presenting results.

### Diagnostics and limits

- **Cold start** — `als` recommends nothing for users not in its training data; `similar_to_latest` needs at least one interaction; only `popular` covers brand-new users.
- **Sparse data** — few interactions per user make `als` weak; `similar_to_latest` or `popular` usually do better. Check the test set against the random baseline.
- **One item everywhere** — expected with `popular`; with other algorithms it points to a narrow catalog or a dominant item (consider exclusions).
- **Model expiry** — models expire 6 months after training; a stopped schedule eventually breaks prediction.
- **Shared model names** — two projects using the same `model_name` overwrite each other's model; keep `prefix` project-specific.
- **New products** — `similar_to_latest` can't recommend an item with no training interactions, and `popular` only once it gets some; use merchandising rules for launches.
- **Sampling** — `similar_to_latest` and `popular` can be trained on a representative sample and still predict for everyone (the sample must contain every item for `similar_to_latest`); `als` needs the full user base in training, so the template's ALS sampling leaves sampled-out users without recommendations.
- **Scale** — below ~10 million profiles a single prediction task is fastest; above that, split prediction by user (never randomly — split users get duplicate recommendations).

## 7. Common changes

| Goal | Change |
|---|---|
| Compare algorithms without touching production | A second project (or prefix) with another `automl_model_type`; compare coverage, the test set and the metrics |
| More personalization for active users | `automl_model_type: als` (with `tunable: true`); keep a `similar_to_latest` or `popular` project for the rest |
| ALS runtime or memory unpredictable | `tunable: false` in `+train`, optionally with explicit `factors` / `iterations` |
| Popularity of recent weeks only (`popular`) | Add `period: 30D` (or `begin_from`) to `+train` |
| Better `similar_to_latest` recommendations | Add `lastk: 3` (or more) to `+pred`; check time and memory |
| Fewer, more reliable items | Add `filter_num` (e.g. `5`) to `+train` |
| Different similarity for `similar_to_latest` | Add `distance: tf-idf` or `cosine` (and `k`) to `+train` |
| Don't recommend items already bought | `filter_viewed: true` in the config |
| More or fewer recommendations | `max_recommended_items` in the config (up to 100); add `topk: ${max_recommended_items}` to `+pred` to request the same count from prediction |
| Keep recommendation history | `output_mode: append` in `+pred` — then filter by run when reading |
| Account outside the US | Regional `ml_batch_api_endpoint` (§3) |
| Large user base with `als` | `als_sample_rate` / `als_max_users` in the config — sampled-out users get no `als` recommendations |

### Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| POST returns 401/403 | The endpoint doesn't match the account's region, or the account has no AI Signals access | Check the regional endpoint (§3); otherwise ask the account admin about AI Signals access |
| A poll step fails reading `id` | `store_content: true` missing, or a task inserted between POST and poll | Restore the template order |
| Prediction fails: model not found | Training failed, the model expired (6 months), or `model_name` differs between train and predict | Re-run training; use the same `model_name` in both steps |
| Run fails on input | Missing or renamed column, wrong type | `tdx describe <db>.<p>transaction` — `userid`, `itemid` VARCHAR, `tstamp` UNIX seconds |
| Recommendations changed unexpectedly | Another project trained a model with the same name | Make `prefix` project-specific and re-run |
| Many users without recommendations | `als` cold start, ALS sampling, short time window | §5 step 3; try `similar_to_latest` or widen the window |
