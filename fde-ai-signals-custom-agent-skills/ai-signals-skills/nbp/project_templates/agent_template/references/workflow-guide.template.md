# NBP (Next Best Product) — Workflow Guide (<project name>)

Use this document to answer questions about how **this customer's deployed** NBP workflow works end to end: its structure, execution order, configuration, source mappings, filters, the algorithm, customizations and the tables each step writes. For how the model works, see `ai-signals-guide.md`; for this customer's business definitions, see `business-context.md`; for table schemas, see `data-dictionary.md`.

<!-- Build instructions (Phase 4 interim or Phase 5 final — remove this comment and every `fill` block when done):
- Interim (Phase 4): describe the setup deployed so far; mark assumed defaults "to confirm"; sections with nothing yet
  (e.g. Parent Segment) say "Not done yet — Phase 5". Final (Phase 5): update the interim file in place, keep the history.
- Save the filled copy as references/workflow-guide.md in the agent staging folder. Never install this .template.md file.
- Sources, in priority order: the deployed working copy (workflow/config/input_params.yml, workflow/*.dig for the pipeline —
  nbp_launch.dig, nbp_preprocessing.dig, nbp_ai_signals.dig, nbp_agg_model_stats.dig; SQL files only if they were changed
  from the template — don't read unchanged SQL), project_state.md, docs/architecture.md, the latest validated run
  ({{table_prefix}}dash_model_param_stats_agg, {{table_prefix}}global_session_filter). Describe what is DEPLOYED, never template defaults.
- Explain parameters in plain words (meanings from workflow/README.md) and quote exact values and expressions in backticks.
  No YAML blocks, no secrets, no personal names or email addresses (write the role or "alert recipient").
- Record "as of" dates. Refresh this file whenever the workflow config or .dig files change (Phase 4 or later).
-->

**Status:** <Interim — pre-production | Final — production>  ·  **As of:** <date of the deployed revision this guide describes>

---

## Workflow Overview

<!-- fill:
- One paragraph: what the workflow does for this customer (transactions in, per-user ranked product recommendations out,
  Parent Segment use)
- TD workflow project name and ID, entry point (nbp_launch), last pushed revision and date (workflow/tdx.json)
- Sink database, table prefix (`prefix`), final user table (`user_master_attr_table`), working copy path (<engagement dir>/workflow/)
- The AI Signals NBP model: endpoint (`ml_batch_api_endpoint`, region), algorithm (`automl_model_type`)
- History window as deployed: all history or `orders_lookback` days, in plain words
- Schedule (or "manual runs only"), failure alert (enabled / commented out), `cleanup_temp_tables`
-->

## End-to-End Pipeline

<!-- fill:
- Tree of nbp_launch.dig as deployed: every step in run order and the sub-workflow it calls
  (create sink database → nbp_preprocessing → nbp_ai_signals → nbp_agg_model_stats → cleanup)
- Inside nbp_ai_signals: ALS sampling branch (taken or not), nbp_train, nbp_predict, post-model exclusion, final table
- Mark any step that is disabled, skipped (exclusion filters off, test set off) or added for this customer, with the reason
- One line per stage on what it produces
-->

## Source Tables

<!-- fill:
- Transaction table (`in_db`.`original_item_transactions_table`): what it records, latest validated volumes (users, items,
  rows, date range — from {{table_prefix}}dash_model_param_stats_agg with the session ID)
- Item info table (`original_item_info_table`): same table or a separate catalog, how item name and category are joined
- Table: column role (user ID, item ID, item name, item category, timestamp) → exact column → note on why it was chosen
  (`original_user_id_column_name`, `original_item_id_column_name`, `original_item_name_column_name`,
  `original_item_category_column_name`, `original_timestamp_name`)
- `transaction_filter` in plain words (what is kept / excluded and why)
- Tables reviewed in Phase 1 but excluded, with the reason (from project_state.md)
-->

## Key Data-Prep Decisions

<!-- fill:
- Table: parameter → deployed value → what it means for this customer → why this value (from project_state.md decisions)
- Cover: `orders_lookback` (time window), `transaction_filter`, the item grain (SKU vs. product), `min_cooccurence_filter`
- Exclusion filters: pre-model (`exclude_product_train`, `exclusion_column`, `exclusion_values` or the custom query) and
  post-model (`exclude_product_recs`, `recs_exclusion_column`, `recs_exclusion_values` or the custom query) — which items
  each removes and why (link to the business-context.md rule)
- Call out any value chosen because of data conditions (e.g. stale data → longer window, very large catalog)
-->

## Model and Recommendations as Deployed

<!-- fill:
- Algorithm (`automl_model_type`: als, similar_to_latest or popular) and why it was chosen for this customer
  (data volume, interactions per user, repeat purchases, cold start)
- ALS sampling: `als_sample_rate` and `als_max_users` (and whether the sampling branch runs)
- `max_recommended_items` (number of ranks written) and `filter_viewed` (already-purchased items left out or not)
- What the train step writes: {{table_prefix}}item_similarity (similar items), {{table_prefix}}metrics_temp (model metrics)
- Test-set evaluation: `run_model_test_set`, `test_params.test_lookback`, and the latest product / category match rates vs.
  the random baselines and the model metrics (precision, recall, NDCG, MRR, MAP), with the session ID
- Coverage of the latest validated run (users with recommendations / source users, distinct items recommended)
-->

## Step-by-Step Reference

<!-- fill — one subsection per .dig file that runs (nbp_preprocessing, nbp_ai_signals, nbp_agg_model_stats):
- Purpose in one sentence
- Steps in order → output table of each step
- Key SQL files and their logic — only those needed to explain behavior, plus every file changed for this customer
-->

## Customizations Beyond the Template

<!-- fill:
- Table: file → change → reason → date (from project_state.md and docs/runbook.md)
- Include .dig edits (schedule, alert), custom exclusion queries (filter_products_training_query.sql,
  filter_products_recs_query.sql), changed preprocessing or output SQL
- If none: "No changes beyond config/input_params.yml."
-->

## Output Tables

<!-- fill:
- Table: table → produced by (.dig) → grain → purpose; note which tables are replaced each run and which are appended (history)
- {{user_master_table}} (the Parent Segment attribute table): user ID column, `nbp_1` … `nbp_<n>`, `nbp_1_sku` …,
  `nb_category_1` …, and the arrays `nbp_ranks`, `product_recommendations`, `product_skus`, `product_categories`
- Model tables: {{table_prefix}}transaction, {{table_prefix}}topk_recommended_items, {{table_prefix}}item_similarity,
  {{table_prefix}}metrics_temp
- Dashboard tables this agent reads: {{table_prefix}}dash_model_param_stats_agg, {{table_prefix}}dash_final_recs_stats_daily,
  {{table_prefix}}dash_most_ordered_items, {{table_prefix}}dash_item_category_mapping_agg, {{table_prefix}}dash_similarity_stats_agg,
  {{table_prefix}}dash_testset, {{table_prefix}}dash_testset_numbers, {{table_prefix}}global_session_filter
- Parent Segment name and how {{user_master_table}} is joined (key) — or "Not done yet — Phase 5"
-->

## Changing or Re-running the Workflow

<!-- fill:
- Pointer to runbook.md for the re-deploy, run and monitoring commands
- Which parameter to change for the common requests (window, algorithm, number of recommendations, already-purchased items,
  items to exclude from training or from the recommendations, source tables or columns)
- Reminder that after a config change this guide and the agent must be refreshed
-->
