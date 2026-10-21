# Classifier — Workflow Guide (<project name>)

Use this document to answer questions about how **this customer's deployed** classifier workflow works end to end: its structure, execution order, the feature SQL (population, features, label), configuration, model settings, customizations and the tables each step writes. For how the model works, see `ai-signals-guide.md`; for this customer's business definitions, see `business-context.md`; for table schemas, see `data-dictionary.md`.

<!-- Build instructions (Phase 4 interim or Phase 5 final — remove this comment and every `fill` block when done):
- Interim (Phase 4): describe the setup deployed so far; mark assumed defaults "to confirm"; sections with nothing yet
  (e.g. Parent Segment) say "Not done yet — Phase 5". Final (Phase 5): update the interim file in place, keep the history.
- Save the filled copy as references/workflow-guide.md in the agent staging folder. Never install this .template.md file.
- Sources, in priority order: the deployed working copy (workflow/config.yml, workflow/sql/input_features.sql — always read,
  it is project code — and workflow/*.dig: classify.dig, train.dig, predict.dig, data_prep.dig), project_state.md,
  docs/architecture.md, the latest validated run (classifier_run_log, {{pred_table}}_latest). Describe what is DEPLOYED,
  never template defaults.
- Explain parameters in plain words (meanings from workflow/README.md) and quote exact values and expressions in backticks.
  No YAML blocks, no secrets, no personal names or email addresses (write the role or "alert recipient").
- Record "as of" dates. Refresh this file whenever the workflow config, the feature SQL or the .dig files change.
-->

**Status:** <Interim — pre-production | Final — production>  ·  **As of:** <date of the deployed revision this guide describes>

---

## Workflow Overview

<!-- fill:
- One paragraph: what the workflow predicts for this customer (the outcome, the population, how the scores are used)
- TD workflow project name and ID, entry point (classify; train / predict if scheduled separately), last pushed revision
  and date (workflow/tdx.json)
- Sink database, model name (`model_name`), predictions table (`pred_output_table`, `<pred_output_table>_latest`),
  working copy path (<engagement dir>/workflow/)
- The AI Signals classifier: endpoint (`ml_batch_api_endpoint`, region), `model_type`
- Schedules (or "manual runs only"), failure alert (enabled / commented out)
-->

## End-to-End Pipeline

<!-- fill:
- Tree as deployed: classify → train (data_prep → check → train → poll → assert) → predict (data_prep → check → predict →
  poll → assert → latest_scores)
- Mark any step that is disabled, scheduled separately or added for this customer, with the reason
- One line per stage on what it produces
-->

## Feature SQL

<!-- fill — from workflow/sql/input_features.sql:
- Population: source table, eligibility rule and exclusions, the ID column (`user_id_column`)
- Label: the outcome rule in plain words, its table and columns, the window (`label_window_days`), the latest positive rate
- Features: one line per source CTE — table, what it measures, the window (`feature_lookback_days`), the feature names
- The windows as deployed: `reference_date` ('' = run date), cut-off for training and for scoring
- `columns_to_drop` and why each column is excluded
- Tables reviewed in Phase 1 but not used, with the reason (from project_state.md)
-->

## Model Settings as Deployed

<!-- fill:
- Table: parameter → deployed value → what it means for this customer → why this value (from project_state.md decisions)
- Cover: `model_type`, `model_name`, `test_size`, the objective (`optuna_metric`, `fbeta_beta`), the threshold
  (`threshold_strategy`, `min_metric_floor`, `fixed_threshold`), the search budget (`n_trials`, `cv_folds`,
  `early_stopping_rounds`), `class_balance_strategy`, `corr_threshold`, any changed search ranges
- Latest validated results with the session ID: AUC-ROC, AUC-PR, precision / recall at `best_threshold`, train-vs-test gap,
  PSI, entities scored and share flagged
-->

## Step-by-Step Reference

<!-- fill — one subsection per .dig file that runs (data_prep, train, predict):
- Purpose in one sentence
- Steps in order → output table of each step
- The guards (`+assert_*`) and what makes them fail
-->

## Customizations Beyond the Template

<!-- fill:
- Table: file → change → reason → date (from project_state.md and docs/runbook.md)
- Always: the feature SQL (`sql/input_features.sql`) and any added feature tables in data_prep.dig; plus .dig edits (schedule,
  alert, polling, added API parameters such as a catboost block or max_load_rows)
-->

## Output Tables

<!-- fill:
- Table: table → produced by (.dig) → grain → purpose; note which are appended (classifier_*, {{pred_table}}) and which are
  replaced (input tables, {{pred_table}}_latest)
- {{pred_table}}_latest (the Parent Segment attribute table): `user_id`, `score`, `predicted_label`, `score_bucket`
- The classifier_* tables this agent reads
- Parent Segment name and how {{pred_table}}_latest is joined (key) — or "Not done yet — Phase 5"
-->

## Changing or Re-running the Workflow

<!-- fill:
- Pointer to runbook.md for the re-deploy, run and monitoring commands
- Where to change the common requests: outcome definition or window (label CTE, `label_window_days`), population, features
  (SQL + `columns_to_drop`), precision / recall trade-off, model type, retrain vs scoring schedule
- Reminder that after a config or SQL change this guide and the agent must be refreshed
-->
