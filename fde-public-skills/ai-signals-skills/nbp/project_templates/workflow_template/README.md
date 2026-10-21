# NBP (Next Best Product) — Workflow Template

## Overview

This Treasure Workflow project turns a table of user–item interactions (order lines, purchases, item views) into a ranked list of recommended products per user, using the AI Signals NBP model (ml-batch-api):

- **Train** — the model learns from the user–item–time rows with the chosen algorithm: `als` (collaborative filtering, best for active users), `similar_to_latest` (items similar to the user's latest interaction) or `popular` (most popular items — cold-start fallback).
- **Predict** — the model writes the top `max_recommended_items` items per user.
- **Enrich** — item IDs are joined to item names and categories and written as one row per user with per-rank columns (`nbp_1`, `nbp_1_sku`, `nb_category_1`, …) for the Parent Segment.

Each run also writes dashboard tables (coverage, recommended-item distribution, catalog stats, optional test-set evaluation) that the NBP insights agent reads.

TD project name: `nbp_ais` (from `tdx.json`). Entry point: `nbp_launch.dig`. All parameters live in `config/input_params.yml`.

## Workflow Structure

```
nbp_launch.dig                    # entry point: schedule, error email, runs the steps below in order
├── +create_sink_database         # 0. td_ddl> creates sink_database if it does not exist yet
├── nbp_preprocessing.dig         # 1. transaction table (user, item, name, category, time) with filters → <prefix>transaction;
│                                 #    item → name / category mapping; optional training exclusions; user-item counts
├── nbp_ai_signals.dig            # 2. AI Signals NBP model: train (nbp_train) + predict (nbp_predict) → <prefix>topk_recommended_items;
│                                 #    optional recommendation exclusions; per-rank columns → user_master_attr_table
├── nbp_agg_model_stats.dig       # 3. dashboard tables: <prefix>dash_*, <prefix>global_session_filter; optional test-set evaluation
└── +cleanup_temp_tables          # 4. (if cleanup_temp_tables = yes) drops the temporary tables
```

| Folder | Contents |
|---|---|
| `config/` | `input_params.yml` — the only file a standard deployment edits |
| `queries/` | Transaction table build, exclusion filters, per-rank column build, model-parameter extraction |
| `queries/dash/` | Dashboard tables |

## Configuration

All keys are in `config/input_params.yml`. The template values are a working example; change the ones in **bold** for every customer. Keep `yes` / `no` values quoted — the workflow compares them as strings.

### Output

| Parameter | What it does | How to choose it |
|---|---|---|
| **`sink_database`** | Database for every table the workflow writes | The confirmed sink database. Created by the first run if it does not exist (`+create_sink_database`) |
| **`prefix`** | Prefix of every table the workflow writes, and of the AI Signals model name (`<prefix><automl_model_type>`) | Project-specific (e.g. `nbp_loyalty_`) whenever another NBP project could share the account or database; `nbp_` for a single project |
| `user_master_attr_table` | Final table: one row per user with the per-rank recommendation columns (no prefix applied) | `nbp_user_master`, or a project-specific name |
| `cleanup_temp_tables` | `'yes'` drops the temporary tables at the end of the run | `'no'` for the first runs (useful for debugging); `'yes'` in production |

### AI Signals model

| Parameter | What it does | How to choose it |
|---|---|---|
| **`automl_model_type`** | Algorithm the AI Signals model trains and predicts with | `similar_to_latest` (default, recency-weighted), `als` (collaborative filtering — best when users have several interactions), `popular` (same popular items for everyone — cold start) |
| **`ml_batch_api_endpoint`** | AI Signals ml-batch-api base URL | The account's region: US `https://ml-batch-api.treasuredata.com`, Japan `https://ml-batch-api.treasuredata.co.jp`, EU `https://ml-batch-api.eu01.treasuredata.com`, AP `https://ml-batch-api.ap02.treasuredata.com` / `https://ml-batch-api.ap03.treasuredata.com` |
| `als_sample_rate` | `als` only: share of users sampled for training (`1.0` = no sampling) | `1.0` under ~200K users; `0.5` for 200K–500K; `0.3` above |
| `als_max_users` | `als` only: maximum users after sampling | `100000` |
| `filter_viewed` | `true` leaves out items the user already purchased | `false` unless repeat purchases should not be recommended |

### Source tables and columns

| Parameter | What it does | How to choose it |
|---|---|---|
| **`in_db`** | Database of the source tables | The customer's source database |
| **`original_item_transactions_table`** | Interaction table — one row per user and item (order line, purchase, item view) | An item-level table; never an order-level or aggregated table |
| **`original_item_info_table`** | Table with item names and categories | The same table when it carries name and category for most items; otherwise the product catalog |
| **`original_user_id_column_name`** | User ID column; also the ID column of `user_master_attr_table` | The ID the Parent Segment joins on |
| **`original_item_id_column_name`** | Item ID column, joined to the item info table as VARCHAR | SKU or product ID — values must match between both tables |
| **`original_item_name_column_name`** | Item name shown in the recommendations | A human-readable name |
| **`original_item_category_column_name`** | Item category shown in the recommendations | The most useful level (department, category, brand) |
| **`original_timestamp_name`** | Interaction time (UNIX seconds) | `time` when it is the real event time; otherwise a UNIX-seconds event column |
| `orders_lookback` | Days of history to use; `''` = all history | `''` for a first setup; a number (e.g. `365`) for a rolling window |

### Exclusion filters

| Parameter | What it does | How to choose it |
|---|---|---|
| `transaction_filter` | Extra SQL appended to the transaction table's WHERE clause, starting with `AND` | e.g. `AND order_status = ''completed''`; `''` if none |
| `exclude_product_train` | `'yes'` removes matching items from the training data | Gift cards, memberships, test items |
| `exclusion_column` | Column matched by `exclusion_values` for the training exclusion | `itemid`, `item_name` or `item_category` |
| `exclusion_values` | Regex for the training exclusion, or `query` to use `queries/filter_products_training_query.sql` | e.g. `'Gift Card|Membership'` |
| `exclude_product_recs` | `'yes'` removes matching items from the recommendations | Discontinued or non-promotable items |
| `recs_exclusion_column` | Column matched by `recs_exclusion_values` | `itemid`, `item_name` or `item_category` |
| `recs_exclusion_values` | Regex for the recommendation exclusion, or `query` to use `queries/filter_products_recs_query.sql` | e.g. `'Discontinued'` |

### Recommendation output and evaluation

| Parameter | What it does | How to choose it |
|---|---|---|
| **`max_recommended_items`** | Recommendations per user — the model's top-K and the number of per-rank columns | `5`; up to the number of products a channel can show |
| `min_cooccurence_filter` | Dashboard user–item stats: keep pairs seen at least this often | `1` |
| `run_model_test_set` | `'yes'` compares the recommendations with the users' purchases in the last `test_lookback` | `'yes'` |
| `test_params`, `test_params.test_lookback` | Hold-out window of the test-set comparison | `30d` |

## Outputs

All tables are in `sink_database`; every name except `user_master_attr_table` starts with `prefix`.

| Table | Contents |
|---|---|
| `user_master_attr_table` (`nbp_user_master`) | One row per user: user ID, arrays `nbp_ranks`, `product_recommendations`, `product_categories`, `product_skus`, and per-rank columns `nbp_<n>`, `nbp_<n>_sku`, `nb_category_<n>` — the Parent Segment attribute table |
| `<prefix>topk_recommended_items` | Model output: `user_id`, `rec_items` (array of item IDs) |
| `<prefix>item_similarity` | Item–item similarity written by the model |
| `<prefix>transaction`, `<prefix>itemid_name_product_mapping`, `<prefix>user_item` | Model input, item mapping, user–item counts |
| `<prefix>dash_model_param_stats_agg` | One row per run: model parameters and metrics, coverage, item counts, time range, exclusions |
| `<prefix>dash_final_recs_stats_agg`, `<prefix>dash_final_recs_stats_daily` | Recommended items and categories per rank (history, latest day) |
| `<prefix>dash_most_ordered_items`, `<prefix>dash_item_category_mapping_agg`, `<prefix>dash_similarity_stats_agg` | Catalog popularity, category breakdown, item similarity |
| `<prefix>testset`, `<prefix>dash_testset`, `<prefix>dash_testset_numbers` | Test-set evaluation (if `run_model_test_set = yes`) |
| `<prefix>global_session_filter` | One row per run; `session_rnk = 1` is the latest |

## Secrets & Requirements

- **Secrets:** none to set. `nbp_ai_signals.dig` sends `${secret:td.apikey}` to the AI Signals ml-batch-api, which provides the key itself.
- **Data:** an item-level interaction table with a user ID, item ID and UNIX timestamp, plus item names and categories (same or separate table). As a minimum, more than 100 users, more than 10 items and more than one interaction per user on average.
- **Permissions:** the project owner needs permission to create the sink database and tables.
- **Failure email:** the `_error` block in `nbp_launch.dig` is commented out. To enable it, uncomment it and replace `your-team@example.com` with the alert address.
- **Schedule:** commented out in `nbp_launch.dig`; uncomment it for scheduled runs.

## Customization Points

Beyond `config/input_params.yml`, these are the only supported code changes. Record every one in the engagement docs.

| Change | Where |
|---|---|
| Training exclusion with custom logic (`exclusion_values: query`) | `queries/filter_products_training_query.sql` |
| Recommendation exclusion with custom logic (`recs_exclusion_values: query`) | `queries/filter_products_recs_query.sql` |
| Transaction table needs joins or derived columns | `queries/create_transaction_table.sql` — keep the output columns `userid`, `itemid`, `item_name`, `item_category`, `tstamp` |
| Failure email, schedule | `nbp_launch.dig` |
