# NBP — Data Dictionary

Schema reference for the output and dashboard tables produced by the NBP workflow on each run, and what each output means.

All tables live in `{{sink_database}}` and use the table prefix `{{table_prefix}}` (the `prefix` key of `workflow/config/input_params.yml`). The final user table is `{{user_master_table}}` (the `user_master_attr_table` key).

> **Customer identifier portability:** NBP dashboard tables are session-level aggregates and expose user counts rather than individual IDs, so dashboard SQL does not assume `canonical_id` or `customer_id`. For a profile-level drill-down, take `original_user_id_column_name` from `workflow/config/input_params.yml` or run `DESCRIBE {{sink_database}}.{{user_master_table}}` first. The configured identifier may be `td_consumer_id`, `td_canonical_id`, `canonical_id`, `cdp_profile_id`, `user_id`, or another customer-specific column.

---

## Metric Definitions — what each output means

How each NBP output is derived and how to interpret it. Read before explaining any recommendation, coverage figure or run-to-run change.

### What the NBP Workflow Produces

For every unique user in the customer's transaction data, the workflow writes a row of ranked product recommendations into `{{user_master_table}}`. Each workflow run is identified by a `session_id` tracked in `{{table_prefix}}global_session_filter`.

The NBP outputs span two groups:

- **Ranked recommendations** — per-rank product name, SKU, and category columns (`nbp_1`, `nbp_1_sku`, `nb_category_1`, ...) plus the arrays `nbp_ranks`, `product_recommendations`, `product_skus`, `product_categories`, written to `{{user_master_table}}` for Parent Segment ingestion.
- **Dashboard aggregations** — run-level stats, item popularity, category breakdowns, recommendation distributions, item-item similarity and (optionally) test set evaluation results.

### How the Recommendations Are Made — AI Signals NBP Model

**Question it answers:** "Based on what this user has bought, which products should we recommend next?"

The workflow trains an AI Signals model (`nbp_train`) on the user–item–time rows and then scores every user (`nbp_predict`). The train step also writes the model's similar-items output (`{{table_prefix}}item_similarity`, source of `dash_similarity_stats_agg`) and its own evaluation metrics (`model_metrics`). The algorithm is the config key `automl_model_type`:

| Algorithm | How it works | Best for |
|-----------|-------------|----------|
| `als` | Alternating Least Squares matrix factorization — learns latent user and item factors from interaction history | Strong personalization; best when users have several interactions |
| `similar_to_latest` | Recommends items most similar to the user's most recent interaction | Lighter than ALS; good when recency is the primary signal |
| `popular` | Recommends the globally most-ordered items; identical output for all users | Cold-start baseline; ensures broad user coverage |

**Cold-start behavior:** `popular` covers all users including those with very little history. `als` and `similar_to_latest` may leave users with little history without recommendations.

**`filter_viewed` toggle:** When `true`, items the user already purchased are left out of the recommendations.

### Key Metrics and What They Mean

#### Coverage Rate

`users_with_recs / distinct_users_transactions_table`

The share of source-data users who received at least one recommendation. Healthy coverage is **≥ 80%**. Below 80%, investigate:
- Is the algorithm `als` or `similar_to_latest`, which can leave users with little history uncovered?
- Are exclusion filters removing too many items, leaving users without scorable products?
- Is the `orders_lookback` so short that most users' history was excluded?

#### Recommendation Concentration

The share of users receiving the same top-1 recommendation. High concentration (>30% of users getting the same `nbp_1`) suggests the model has low differentiation — it's behaving more like a popularity ranker than a personalized recommender. This is expected for the `popular` algorithm but is a signal worth flagging for `als` or `similar_to_latest`.

#### Item Coverage Breadth

`distinct_items_recommended / distinct_items_transactions_table`

How much of the product catalog appears in the recommendation output. Low breadth means the long tail is being ignored — because training data is sparse across categories, the training exclusion filters removed items, or the algorithm favors popular items.

#### Item-Item Similarity

`dash_similarity_stats_agg.similarity` and `mean_sim` / `median_sim` / `std_sim` in `dash_model_param_stats_agg` summarize the AI Signals model's similar-items output (0–1, higher = more similar). The test set uses `median_sim` as the cut-off for "a recommended item close to an item the user bought".

#### Model Metrics

`dash_model_param_stats_agg.model_metrics` holds the model's own precision, recall, NDCG, MRR and MAP at `max_recommended_items`, as reported by the AI Signals train step.

#### Test Set Metrics (when `run_model_test_set: 'yes'`)

The test set compares each user's recommendations with what they bought in the last `test_params.test_lookback` (default `30d`). Those purchases are also part of the training window, so treat the match rates as an in-sample check, not a strict holdout.

| Metric | What it measures | Healthy threshold |
|--------|-----------------|-------------------|
| Product match rate vs. `random_item_rate` | Exact product recommendation quality | > 2× random |
| Category match rate vs. `random_category_rate` | Category-level preference capture | > 3× random |

`random_item_rate` = 1 / distinct items recommended; `random_category_rate` = 1 / distinct categories. Good category match with poor product match is expected for diverse catalogs — the model captures what kind of thing the user wants, even if the exact item is hard to predict.

### How Run Config Drives What You See

The `dash_model_param_stats_agg.model_params` column captures the algorithm and parameters used per run. The most consequential config knobs for interpreting dashboard data:

| Config knob | What changes if you tune it |
|-------------|----------------------------|
| `automl_model_type` | Entire recommendation strategy changes |
| `orders_lookback` | Shorter window → fresher signal but fewer users qualify; longer → more stable but potentially stale |
| `transaction_filter` | Narrows which transaction rows feed the model (e.g. only completed orders) |
| `als_sample_rate` / `als_max_users` (ALS only) | Sampling reduces training data for large datasets — may lower precision |
| `filter_viewed` | Toggling changes whether already-purchased items appear and what rank-1 looks like |
| `max_recommended_items` | Number of ranks written (`nbp_1` … `nbp_<n>`) and the `topk` of the model metrics |
| Exclusion filters (`exclude_product_train`, `exclude_product_recs`) | Wide exclusions reduce catalog diversity and may drop high-volume items |

**Practical rule:** When a coverage or distribution metric changes run-over-run, ALWAYS pull `model_params` and `exclusion_filters` from both runs before attributing the change to real user behavior or catalog changes.

### What This Workflow Does NOT Do

Be explicit when the user asks something the tables can't answer:

- **No revenue forecasting** — the dashboard tracks recommendation coverage and item distributions, not predicted uplift from acting on recommendations. Never project ROI.
- **No per-user recommendation lookup in the dash tables** — they are aggregated. To see what a specific user was recommended, query `{{user_master_table}}` directly.
- **No real-time scoring** — recommendations come from the most recent batch run. `{{user_master_table}}` is only as fresh as the last `nbp_launch.dig` execution.
- **No affinity scores** — NBP outputs ranked items, not engagement probability scores. For engagement channel/time scoring, route to NBA.
- **No channel attribution** — NBP tells you what to recommend, not which channel drove the behavior. For attribution, route to MTA.

If a question requires any of the above, say what the table can show vs. what's actually being asked, and recommend the alternative skill or analysis path.

---

## Output Table: `{{user_master_table}}` — per-user recommendations (Parent Segment attributes)

**Grain:** one row per user. Replaced every run.

| Column | Type | Description |
|--------|------|-------------|
| `<original_user_id_column_name>` | varchar | User identifier, named as in the source transaction table |
| `nbp_ranks` | array(bigint) | Rank positions 1 … `max_recommended_items` |
| `product_recommendations` | array(varchar) | Recommended item names, in rank order |
| `product_skus` | array(varchar) | Recommended item IDs, in rank order |
| `product_categories` | array(varchar) | Recommended item categories, in rank order |
| `nbp_1` … `nbp_<n>` | varchar | Recommended item name at each rank |
| `nbp_1_sku` … `nbp_<n>_sku` | varchar | Recommended item ID at each rank |
| `nb_category_1` … `nb_category_<n>` | varchar | Recommended item category at each rank |

---

## Table 1: `{{table_prefix}}global_session_filter` — session inventory

**Grain:** one row per workflow run.

Use this as the **central filter table**. Always join other tables on `session_id`, and use `session_rnk = 1` to get the latest run.

| Column | Type | Description |
|--------|------|-------------|
| `session_id` | bigint | Workflow session identifier. Larger = more recent. |
| `session_rnk` | bigint | Run rank: `1` = most recent, `2` = second-most-recent, etc. |
| `run_time` | varchar | Human-readable run timestamp (e.g., `"2026-04-18 06:00:00"`) |
| `time` | bigint | Run timestamp (UNIX). Convert with `TD_TIME_FORMAT(time, 'yyyy-MM-dd HH:mm', 'UTC')` |

### Common SQL patterns

**Get the latest session ID:**
```sql
SELECT session_id FROM {{table_prefix}}global_session_filter WHERE session_rnk = 1
```

**List all runs in reverse chronological order:**
```sql
SELECT session_id, session_rnk, run_time FROM {{table_prefix}}global_session_filter ORDER BY session_rnk ASC
```

---

## Table 2: `{{table_prefix}}dash_model_param_stats_agg` — run config and coverage stats

**Grain:** one row per workflow run.

Use when the user asks about **coverage**, **model config**, **training data size**, or wants to **compare runs**.

| Column | Type | Description |
|--------|------|-------------|
| `event_date` | varchar | Date of the workflow run (e.g., `"2026-04-18"`) |
| `unixtime_tstamp` | bigint | Unix timestamp of `event_date` |
| `session_id` | bigint | Run identifier. Join to `global_session_filter` for rank/timestamp. |
| `distinct_users_transactions_table` | bigint | Distinct users in the source transaction table (before model) |
| `users_with_recs` | bigint | Users who received at least one recommendation |
| `users_with_recs_after_filter` | bigint | Users with recs after exclusion filtering |
| `distinct_items_recommended` | bigint | Distinct items that appear anywhere in the recommendation output |
| `distinct_items_transactions_table` | bigint | Distinct items in the source transaction table |
| `distinct_categories_transactions_table` | bigint | Distinct categories in the source data |
| `time_range_days` | bigint | Days spanned by the training data |
| `least_recent_event` | varchar | Oldest event date in the training data |
| `most_recent_event` | varchar | Most recent event date in the training data |
| `model_params` | varchar | Algorithm and parameters of the run: `Algorithm: <automl_model_type>, Params: ...` |
| `exclusion_filters` | varchar | Description of applied exclusion filters |
| `filtered_item_count` | bigint | Number of items excluded by filters |
| `filtered_categories` | varchar | Categories excluded |
| `filtered_products` | varchar | Products excluded |
| `mean_sim` | double | Mean item-item similarity score in the model's similar-items output |
| `median_sim` | double | Median item-item similarity score (cut-off used by the test set) |
| `std_sim` | double | Std deviation of similarity scores |
| `model_metrics` | varchar | Model evaluation from the train step: `Precision: …, Recall: …, NDCG: …, MRR: …, MAP: …` at `max_recommended_items` |
| `time` | bigint | Run timestamp (UNIX) |

### Common SQL patterns

**Latest run coverage summary:**
```sql
SELECT users_with_recs, distinct_users_transactions_table,
       ROUND(100.0 * users_with_recs / NULLIF(distinct_users_transactions_table, 0), 1) AS coverage_pct,
       distinct_items_recommended, time_range_days, least_recent_event, most_recent_event,
       model_params, exclusion_filters
FROM {{table_prefix}}dash_model_param_stats_agg
WHERE session_id = (SELECT session_id FROM {{table_prefix}}global_session_filter WHERE session_rnk = 1)
```

**Compare last two runs:**
```sql
SELECT s.session_id, s.run_time,
       m.users_with_recs, m.distinct_users_transactions_table,
       ROUND(100.0 * m.users_with_recs / NULLIF(m.distinct_users_transactions_table, 0), 1) AS coverage_pct,
       m.distinct_items_recommended, m.time_range_days, m.model_params
FROM {{table_prefix}}dash_model_param_stats_agg m
JOIN {{table_prefix}}global_session_filter s ON m.session_id = s.session_id
WHERE s.session_rnk <= 2
ORDER BY s.session_rnk ASC
```

---

## Table 3: `{{table_prefix}}dash_final_recs_stats_daily` — recommendation distribution

**Grain:** one row per (event_date, item/category combination). Aggregated recommendation output.

Use when the user asks about **which items/categories are most commonly recommended** or **rank distribution**.

| Column | Type | Description |
|--------|------|-------------|
| `event_date` | varchar | Date of the workflow run |
| `unixtime_tstamp` | bigint | Unix timestamp of `event_date` |
| `nbp_1` through `nbp_5` | varchar | Recommended item name at each rank |
| `nb_category_1` through `nb_category_5` | varchar | Recommended item category at each rank |
| `item_recs_combo` | varchar | Concatenated full item recommendation string (all ranks) |
| `category_recs_combo` | varchar | Concatenated full category recommendation string |
| `event_cnt` | bigint | Number of users who received this item/category combination |
| `time` | bigint | TD time column (UNIX) |

Note: Only ranks up to `max_recommended_items` (config key, default 5) are populated.

### Common SQL patterns

**Top-10 most recommended items at rank 1:**
```sql
SELECT nbp_1, SUM(event_cnt) AS user_count
FROM {{table_prefix}}dash_final_recs_stats_daily
WHERE event_date = (SELECT MAX(event_date) FROM {{table_prefix}}dash_final_recs_stats_daily)
GROUP BY nbp_1 ORDER BY user_count DESC LIMIT 10
```

**Category distribution at rank 1:**
```sql
SELECT nb_category_1 AS category, SUM(event_cnt) AS user_count
FROM {{table_prefix}}dash_final_recs_stats_daily
WHERE event_date = (SELECT MAX(event_date) FROM {{table_prefix}}dash_final_recs_stats_daily)
GROUP BY nb_category_1 ORDER BY user_count DESC
```

**Category spread across all ranks (rank 1 through 3):**
```sql
SELECT 'rank_1' AS rank_label, nb_category_1 AS category, SUM(event_cnt) AS user_count
FROM {{table_prefix}}dash_final_recs_stats_daily
WHERE event_date = (SELECT MAX(event_date) FROM {{table_prefix}}dash_final_recs_stats_daily)
GROUP BY nb_category_1
UNION ALL
SELECT 'rank_2', nb_category_2, SUM(event_cnt)
FROM {{table_prefix}}dash_final_recs_stats_daily
WHERE event_date = (SELECT MAX(event_date) FROM {{table_prefix}}dash_final_recs_stats_daily)
GROUP BY nb_category_2
UNION ALL
SELECT 'rank_3', nb_category_3, SUM(event_cnt)
FROM {{table_prefix}}dash_final_recs_stats_daily
WHERE event_date = (SELECT MAX(event_date) FROM {{table_prefix}}dash_final_recs_stats_daily)
GROUP BY nb_category_3
ORDER BY rank_label, user_count DESC
```

---

## Table 4: `{{table_prefix}}dash_most_ordered_items` — historical item popularity

**Grain:** one row per item. Reflects source transaction data, not model output.

Use when the user asks about **item popularity in the historical data** or wants to compare recommended items vs. most-purchased items.

| Column | Type | Description |
|--------|------|-------------|
| `event_date` | varchar | Date of the workflow run |
| `itemid` | varchar | Item identifier (the column mapped by `original_item_id_column_name`) |
| `item_name` | varchar | Human-readable item name |
| `times_ordered` | bigint | Total times this item was ordered in the training data |
| `time` | bigint | TD time column (UNIX) |

### Common SQL patterns

**Most popular items in source data:**
```sql
SELECT item_name, times_ordered
FROM {{table_prefix}}dash_most_ordered_items
ORDER BY times_ordered DESC LIMIT 20
```

**Items recommended most vs. purchased most (popularity vs. rec divergence):**
```sql
-- Most recommended (rank 1 only)
SELECT nbp_1 AS item, SUM(event_cnt) AS rec_count
FROM {{table_prefix}}dash_final_recs_stats_daily
WHERE event_date = (SELECT MAX(event_date) FROM {{table_prefix}}dash_final_recs_stats_daily)
GROUP BY nbp_1 ORDER BY rec_count DESC LIMIT 10
```
Then compare against `dash_most_ordered_items` — divergence between the two lists shows the model is surfacing personalized long-tail items (desirable) rather than just recommending popular items.

---

## Table 5: `{{table_prefix}}dash_item_category_mapping_agg` — catalog category breakdown

**Grain:** one row per category.

Use when the user asks about **product catalog structure** or **category diversity**.

| Column | Type | Description |
|--------|------|-------------|
| `item_category` | varchar | Category name |
| `item_list` | varchar | Comma-separated list of items in this category |
| `item_count` | bigint | Number of distinct items in this category |
| `time` | bigint | TD time column (UNIX) |

### Common SQL patterns

**Category breakdown:**
```sql
SELECT item_category, item_count
FROM {{table_prefix}}dash_item_category_mapping_agg
ORDER BY item_count DESC
```

---

## Table 6: `{{table_prefix}}dash_similarity_stats_agg` — item-item similarity pairs

**Grain:** one row per item pair.

Item-item similarity from the AI Signals model's similar-items output (`{{table_prefix}}item_similarity`, written by the train step), with item IDs mapped to names. Replaced every run. If it is empty for the run's algorithm, say so.

Use when the user asks **"what's similar to item X?"** or wants to understand the model's similarity structure.

| Column | Type | Description |
|--------|------|-------------|
| `event_date` | varchar | Date of the workflow run |
| `item_pair` | varchar | The two item names, sorted and joined (e.g., `"Item A || Item B"`) |
| `item_name` | varchar | Name of the first item |
| `other_item_name` | varchar | Name of the second item |
| `similarity` | double | Similarity score from the model (0–1). Higher = more similar. |
| `time` | bigint | TD time column (UNIX) |

### Common SQL patterns

**Top similar item pairs:**
```sql
SELECT item_name, other_item_name, similarity
FROM {{table_prefix}}dash_similarity_stats_agg
ORDER BY similarity DESC LIMIT 20
```

**Items most similar to a specific item:**
```sql
SELECT other_item_name, similarity
FROM {{table_prefix}}dash_similarity_stats_agg
WHERE item_name = '<item_name>'
ORDER BY similarity DESC LIMIT 10
```

---

## Table 7: `{{table_prefix}}dash_testset` — precision/recall histograms (testset only)

**Grain:** one row per (session_id, bin_label, metric_type).

Only present when `run_model_test_set: 'yes'` in `workflow/config/input_params.yml`. Verify existence before querying.

| Column | Type | Description |
|--------|------|-------------|
| `session_id` | bigint | Workflow session ID |
| `label` | double | Bin label (e.g., 0.0, 0.2, 0.4, ...) |
| `bin_cnt` | double | Count of users in this bin |
| `type` | varchar | Metric type: `precision` or `recall` |
| `time` | bigint | TD time column (UNIX) |

### Common SQL patterns

**Precision/recall histogram for latest run:**
```sql
SELECT t.label, t.bin_cnt, t.type
FROM {{table_prefix}}dash_testset t
JOIN {{table_prefix}}global_session_filter s ON t.session_id = s.session_id
WHERE s.session_rnk = 1
ORDER BY t.type, t.label
```

---

## Table 8: `{{table_prefix}}dash_testset_numbers` — aggregate test set metrics (testset only)

**Grain:** one row per session.

Only present when `run_model_test_set: 'yes'`. Verify existence before querying.

| Column | Type | Description |
|--------|------|-------------|
| `session_id` | bigint | Workflow session ID |
| `total_items_bought` | bigint | Total items bought in the test window (`test_lookback`) |
| `total_customers` | bigint | Total customers in the test set |
| `total_bought_above_median` | bigint | Bought items with at least one recommended item at or above the median similarity |
| `total_product_matches` | bigint | Exact product-level matches between recs and actual purchases |
| `total_category_matches` | bigint | Category-level matches between recs and actual purchases |
| `customers_above_median` | bigint | Customers whose average similarity between bought and recommended items is at or above the median |
| `customers_cat_match` | bigint | Customers with at least one category match |
| `random_item_rate` | double | Expected match rate for random item recommendations (baseline) |
| `random_category_rate` | double | Expected match rate for random category recommendations (baseline) |
| `time` | bigint | TD time column (UNIX) |

### Common SQL patterns

**Aggregate test set metrics for latest run:**
```sql
SELECT n.*
FROM {{table_prefix}}dash_testset_numbers n
JOIN {{table_prefix}}global_session_filter s ON n.session_id = s.session_id
WHERE s.session_rnk = 1
```

**Test set trend across runs:**
```sql
SELECT s.session_id, s.run_time,
       ROUND(100.0 * n.total_product_matches / NULLIF(n.total_items_bought, 0), 2) AS product_match_rate,
       ROUND(100.0 * n.total_category_matches / NULLIF(n.total_items_bought, 0), 2) AS category_match_rate,
       ROUND(n.random_item_rate * 100, 2) AS random_item_baseline_pct
FROM {{table_prefix}}dash_testset_numbers n
JOIN {{table_prefix}}global_session_filter s ON n.session_id = s.session_id
ORDER BY s.session_rnk ASC
```

---

## Join Relationships

```
{{table_prefix}}global_session_filter.session_id  -->  {{table_prefix}}dash_model_param_stats_agg.session_id
{{table_prefix}}global_session_filter.session_id  -->  {{table_prefix}}dash_testset_numbers.session_id      (testset only)
{{table_prefix}}global_session_filter.session_id  -->  {{table_prefix}}dash_testset.session_id              (testset only)
```

`dash_final_recs_stats_daily`, `dash_most_ordered_items`, `dash_item_category_mapping_agg`, and `dash_similarity_stats_agg` are filtered by `event_date` (use `MAX(event_date)` for the latest run).

---

## Data Quality Notes

- **Table names use the configured `prefix`** — here `{{table_prefix}}`. If `workflow/config/input_params.yml` shows another prefix, trust the config and say the agent needs a rebuild.
- **`session_rnk = 1` is always the latest run** — prefer this over `MAX(session_id)` for clarity.
- **`model_params` is a string** — parse `Algorithm: <automl_model_type>` and the parameters from it. Don't assume the algorithm from context alone.
- **Testset tables may not exist** — check with `SHOW TABLES` before querying; don't assume they're present.
- **`dash_similarity_stats_agg` comes from the model's similar-items output** — written only by `als` and `similar_to_latest`; empty with `popular` (so are `mean_sim` / `median_sim` / `std_sim`). Check it has rows for the run before using it.
- **`time` is UNIX bigint** — show with `TD_TIME_FORMAT(time, 'yyyy-MM-dd HH:mm', 'UTC')`.
- **`event_date` vs `session_id`** — `dash_final_recs_stats_daily` and item tables are filtered by `event_date` (varchar), not `session_id`. Use `MAX(event_date)` for the latest run in those tables.
