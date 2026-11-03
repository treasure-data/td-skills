# AI Signals Classifier (Propensity Scoring) — Model Guide

For any question about the model: how it trains and scores, API parameters, other parameter values or model types, changing its input or output tables. The template (`train.dig`, `predict.dig`, `config.yml`) is what this setup sends; this guide is what the API accepts and how the model behaves. `workflow-setup.md`, `dataprep-guide.md` and `output-tables-guide.md` are files of the setup skill (`fde-classifier`).

**Public documentation:** https://docs.treasure.ai/products/customer-data-platform/machine-learning/ai-signals/propensity-ai-signals — share it after answering from this guide.

## 1. What it does

Gradient-boosted binary classifier for tabular data: one model = one 0/1 outcome = one score per entity. Batch only; no multi-class (one model per class), no regression.

| Solution | Does | Runs |
|---|---|---|
| `classifier_train` | Tuning search, threshold, held-out evaluation, diagnostics, stores the model under `model_name` | Single node |
| `classifier_predict` | Loads the model, scores every row | Distributed, sharded by a hash of the user ID |

| | `xgboost` (default) | `catboost` |
|---|---|---|
| Choose when | Mostly numeric / low-cardinality features, large tables, speed matters | Many or high-cardinality string features, small–medium data |
| Categoricals | pandas `category`, `enable_categorical`, `hist` trees | `cat_features` on raw strings |
| Class balance | `scale_pos_weight` = neg / pos | `auto_class_weights = Balanced` |
| Search block | `subsample`, `colsample_bytree`, `min_child_weight`, `reg_alpha`, `reg_lambda`, `gamma` | `l2_leaf_reg`, `bagging_temperature`, `random_strength`, `border_count` |
| Speed | Faster | Slower |

Unsure → train both under different `model_name`s and compare `aucpr`, `fbeta`, `psi`.

## 2. Input table

Flat table; feature engineering happens upstream in `sql/input_features.sql` (`dataprep-guide.md`).

| Item | Requirement |
|---|---|
| Grain | One row per entity per observation (cutoff). Training stacks several cutoffs; scoring has one |
| Target | `{0, 1}` int / `0.0`, `1.0` / boolean; no NULLs; both classes. Anything else fails — never re-encoded |
| `user_id_column` | Non-NULL, never a feature; unique per row at prediction (once per cutoff in training). Stored with the model; needed for distributed scoring |
| Numeric features | int / double; NULLs pass through; ±inf → NULL |
| Categorical features | Any non-numeric; NULL / unseen → `"missing"`. Avoid free text, emails, IDs, URLs |
| Exclude | `time`, `session_id`, `cutoff_date`, raw dates (→ `days_since_x`), PII, label-derived columns — list in `columns_to_drop` (only target and ID are automatic) |
| Prediction input | Same features and types; target ignored. A missing numeric feature becomes 0 and silently shifts scores |

Have a few hundred positives at least.

## 3. Parameters

Under `solution_arguments`. The template sends nested blocks (`tuning`, `threshold`, `metric`, `xgboost`); flat keys also work, nested wins. Model-family ranges are nested-only. `session_id` is stamped on every output row.

### Training — `solution_name: classifier_train`

Top level: `input_table`, `output_table` (`db.table`; only the database of `output_table` is used — artifacts get fixed `classifier_*` names).

| Parameter | API default | Range | Notes |
|---|---|---|---|
| `target_column` | required | column | 0/1, both classes |
| `model_name` | null | string | Unique per account; retraining replaces it |
| `model_type` | `xgboost` | `xgboost`, `catboost` | |
| `user_id_column` | null | column | Recommended (§2) |
| `columns_to_drop` | null | pipe-separated | Saved with the model, reused at prediction |
| `test_size` | `0.2` | 0.05–0.5 | Stratified hold-out |
| `max_load_rows` | `10000000` | ≥ 0 (0 = off) | Row cap for training — not set by the template |

`tuning`:

| Parameter | API default | Range | Notes |
|---|---|---|---|
| `n_trials` | `30` | ≥ 0 | `0` = no search, built-in defaults |
| `cv_folds` | `3` | 2–10 | Stratified folds per trial |
| `max_tuning_rows` | `1000000` | ≥ 0 | Subsample for the search only — not set by the template |
| `optuna_metric` | `fbeta` | `fbeta`, `auc_roc`, `auc_pr`, `precision`, `recall`, `log_loss` | Aliases `auc`, `roc_auc`, `aucpr`, `pr_auc`, `logloss` |
| `fbeta_beta` | `0.5` | 0.01–10 | < 1 precision, > 1 recall |
| `early_stopping_rounds` | `0` | ≥ 0 | |
| `class_balance_strategy` | `balanced` | `balanced`, `none` | |
| `n_estimators_min` / `_max` | 100 / 800 | ≥ 10 | |
| `max_depth_min` / `_max` | 3 / 10 | ≥ 1 | Lower to regularize |
| `learning_rate_min` / `_max` | 0.01 / 0.3 | float | Log-uniform |

`threshold`:

| Parameter | API default | Range | Notes |
|---|---|---|---|
| `strategy` | `precision_optimal` | `precision_optimal`, `f1_optimal`, `recall_optimal`, `youden_j`, `fixed` | Template key `threshold_strategy` |
| `min_metric_floor` | `0.35` | 0–1 | Min recall (`precision_optimal`) / min precision (`recall_optimal`); unmet → threshold **0.5** |
| `fixed_threshold` | `0.5` | 0–1 | Only with `fixed` |

`metric`:

| Parameter | API default | Range | Notes |
|---|---|---|---|
| `eval_metric` | `aucpr` | tree metric | Mapped for CatBoost |
| `corr_threshold` | `0.9` | 0.5–1.0 | Numeric features correlated above it are dropped |
| `shap_max_samples` | `1000` | ≥ 10 | Test rows for SHAP |

Search ranges (`_min` / `_max`): `xgboost` — `subsample` 0.6–1.0, `colsample_bytree` 0.6–1.0, `min_child_weight` 1–50, `reg_alpha` / `reg_lambda` 0.001–10, `gamma` 0–10. `catboost` — `l2_leaf_reg` 1–10, `bagging_temperature` 0–1, `random_strength` 1e-08–10, `border_count` 32–255 (the template sends no `catboost` block; add one to `train.dig` to tune it).

The template's `config.yml` deliberately differs from several API defaults (`cv_folds`, `fbeta_beta`, `optuna_metric`, `min_metric_floor`, `corr_threshold`, `shap_max_samples`).

### Prediction — `solution_name: classifier_predict`

| Parameter | API default | Notes |
|---|---|---|
| `model_name` | required | Config, threshold, preprocessing come from the model |
| `user_id_column` | the model's | Overrides; must resolve; NULL IDs excluded |
| `columns_to_drop` | — | Ignored — the model's saved list is used |
| `output_mode` | `append` | Distributed runs always append |

### Endpoint by region (`ml_batch_api_endpoint`, from `tdx status`)

| Site | Endpoint |
|---|---|
| US (us01) | `https://ml-batch-api.treasuredata.com` |
| Japan (jp01) | `https://ml-batch-api.treasuredata.co.jp` |
| EU (eu01) | `https://ml-batch-api.eu01.treasuredata.com` |
| AP (ap02) | `https://ml-batch-api.ap02.treasuredata.com` |
| AP (ap03) | `https://ml-batch-api.ap03.treasuredata.com` |

Prerequisite: AI Signals includes `classifier_train` and `classifier_predict` for the account.

## 4. Workflow syntax

```yaml
+train_classifier:
  http>: ${ml_batch_api_endpoint}/v1/runs
  method: POST
  headers:
    - authorization: ${secret:td.apikey}      # keep exactly as in the template
  store_content: true                         # the poll step reads the run id from the response
  content:
    input_table: ${sink_database}.${train_input_table}
    output_table: ${sink_database}.${train_output_table}   # only the database is used
    solution_name: classifier_train
    version: ${ml_batch_api_version}
    solution_arguments:
      session_id: ${td.last_results.session_id}
      model_name: ${model_name}
      model_type: ${model_type}
      target_column: ${target_column}
      user_id_column: ${user_id_column}
      columns_to_drop: ${columns_to_drop}
      tuning: { n_trials: ${n_trials}, optuna_metric: ${optuna_metric}, fbeta_beta: ${fbeta_beta} }
      threshold: { strategy: ${threshold_strategy}, min_metric_floor: ${min_metric_floor} }

+wait_for_training:
  _retry: { limit: 5, interval: 60, interval_type: constant }
  http>: ${ml_batch_api_endpoint}/v1/runs/${JSON.parse(http.last_content)['id']}/status
  method: GET
  headers:
    - authorization: ${secret:td.apikey}
  store_content: true
```

- The status call answers **408** while the run is in progress (`http>` keeps retrying) and **200** when it has finished; `_retry` extends the wait for long runs. The template then asserts the returned `status` is not FAILED / ERROR / CANCELLED and `error_messages` is empty, because a finished-but-failed run can also return 200.
- Authentication: the key is provided by the AI Signals architecture — never ask the user to set `td.apikey`, and keep the header as in the template.
- Prediction is the same pattern with `solution_name: classifier_predict` and the prediction arguments.
- Optional request headers `X-TD-ML-SESSION-ID: ${session_id}` and `X-TD-ML-ATTEMPT-ID: ${attempt_id}` link the run to the Workflow session; the template does not send them.

## 5. How it works

**Training:**

| # | Step |
|---|---|
| 1 | Load `input_table` (up to `max_load_rows`) |
| 2 | Validate target ({0, 1}, no NULLs, both classes) and ID |
| 3 | Stratified train / test split (`test_size`, fixed seed) |
| 4 | Preprocess: drop `columns_to_drop`, ID, target; strings → categoricals; drop features correlated above `corr_threshold`; correlation + VIF diagnostics |
| 5 | Optuna search (TPE + median pruner): `n_trials` × `cv_folds` CV on ≤ `max_tuning_rows`, optimizing `optuna_metric` |
| 6 | Fit the training split with the best parameters (`class_balance_strategy`) |
| 7 | Threshold from out-of-fold CV predictions (`threshold.strategy`) |
| 8 | Evaluate test (`classifier_run_log`) and train (`classifier_train_run_log`) splits; PSI |
| 9 | SHAP on ≤ `shap_max_samples` test rows |
| 10 | Refit on all rows, keep the threshold, store under `model_name` |

Test metrics describe the pre-refit model. Independent check: score a later window and compare with actual outcomes (`workflow-setup.md` §4 check 6).

**Prediction:** load the model → resolve the ID → shard by ID hash (NULL IDs dropped) → align features (missing numeric → 0, missing / unseen categorical → `"missing"`, extras dropped) → `score`, `predicted_label` (`score >= threshold_applied`), `score_bucket` → append.

**Choosing the objective:**

| Goal | `optuna_metric` | `fbeta_beta` | `threshold_strategy` | `min_metric_floor` |
|---|---|---|---|---|
| Small high-quality audience, costly action | `fbeta` | `0.5` | `precision_optimal` | 0.2–0.35 (min recall) |
| Catch most positives, cheap action | `fbeta` | `2.0` | `recall_optimal` | 0.2–0.4 (min precision) |
| Balanced | `fbeta` | `1.0` | `f1_optimal` | — |
| Ranking only (top-N, deciles) | `auc_pr` (imbalanced) / `auc_roc` | — | any; use `score` / `score_bucket` | — |
| Probabilities used as-is | `log_loss` | — | any | — |
| Balanced TPR / FPR | `auc_roc` | — | `youden_j` | — |
| Existing business cut-off | any | — | `fixed` + `fixed_threshold` | — |

**Class imbalance:** keep `balanced` (positives < ~10%) with `auc_pr` / `fbeta`, never accuracy. `none` + `log_loss` when scores must be real probabilities — balanced weighting inflates them.

**Tuning presets:**

| Preset | Settings | Use for |
|---|---|---|
| Smoke | `n_trials: 0`, or `5` with `cv_folds: 2` | Pipeline check |
| Standard | `n_trials: 30`, `cv_folds: 3`, `max_tuning_rows: 1000000` | Most models |
| Thorough | `n_trials: 75`–`100`, `cv_folds: 5`, `early_stopping_rounds: 50` | High-value, rarely retrained |
| Very large | Standard + `max_tuning_rows: 200000`–`500000` | Tens of millions of rows |

Cost ≈ `n_trials` × `cv_folds` fits + `cv_folds` out-of-fold fits + 2 final fits; ~2 GB per million rows.

## 6. Output tables

Training appends fixed-name `classifier_*` tables to the database of `output_table`, stamped with `session_id`; prediction appends to `output_table`. All metrics are 0–1; ROC `fpr` / `tpr` and `percentage` columns are 0–100. The model itself is stored by the service, not in TD.

| Table | Contents |
|---|---|
| `classifier_run_log` / `classifier_train_run_log` | Test / train metrics, confusion counts, `best_threshold`, `best_params`, `psi`, run config |
| `classifier_feature_list` | Model features in order |
| `classifier_feature_importance`, `classifier_shap_directional` | SHAP importance and direction |
| `classifier_xgboost_gain_importance` / `classifier_catboost_gain_importance` | Native importance |
| `classifier_roc_curve`, `classifier_prediction_bins` | Test ROC points, 10-bin score histogram |
| `classifier_target_correlations`, `classifier_feature_correlations`, `classifier_vif_scores`, `classifier_corr_drop_report` | Numeric diagnostics; dropped features (only if any) |
| `classifier_optuna_trials` | Search trials (only if `n_trials > 0`) |
| Predictions | `session_id`, `model_type`, `user_id`, `score`, `predicted_label`, `threshold_applied`, `score_bucket`, `prediction_timestamp` |

Columns and queries: `output-tables-guide.md` (setup skill) / `data-dictionary.md` (project agent).

### Validate

| Check | Healthy |
|---|---|
| `auc_roc` | Clearly above 0.5; > ~0.98 → leakage |
| `aucpr` | Above the positive rate |
| `best_threshold` | Not exactly 0.5 (unless `fixed`) — 0.5 = floor fallback |
| Train vs test | AUC gap < ~0.05, F-beta gap < ~0.1 |
| `psi` | < 0.1 stable, 0.1–0.25 investigate, > 0.25 leakage or population shift |
| Drivers | No single dominant feature, no target correlation near 1 |
| Predictions | One row per entity, `threshold_applied` = `best_threshold`, several buckets |

### Interpret

- `score` ranks; with `balanced` it is inflated — not a calibrated probability unless `none`.
- `predicted_label` = the audience the threshold chose; ranking uses `score` / `score_bucket`.
- SHAP "increases score" = higher values push toward the positive outcome.
- Every table is appended — filter on one `session_id` (latest by `time`).

### Limits

- Training capped by `max_load_rows` (10M); prediction never capped.
- Overfitting → `max_depth_max` ~6, higher `min_child_weight_min` / `reg_*_min` (or `l2_leaf_reg_min`), lower `learning_rate_max`.
- < ~10K rows → depth 3–6, `cv_folds` 5, consider `catboost`.
- `corr_threshold`: 0.9 default, ~0.8 leaner, 1.0 only exact duplicates.

## 7. Common changes

| Change | How |
|---|---|
| Outcome or horizon | Label CTE in `sql/input_features.sql`; `label_window_days` (`dataprep-guide.md` §1) |
| Snapshots | `n_train_snapshots`, `spacing_days` — history check (`dataprep-guide.md` §2) |
| Features | `sql/input_features.sql` (same in both modes); non-features → `columns_to_drop` |
| Precision vs recall | `fbeta_beta`, `threshold_strategy`, `min_metric_floor` (§5) |
| CatBoost | `model_type: catboost` + new `model_name`; add a `catboost` block to tune ranges |
| Compare models | One `model_name` each; compare `classifier_run_log` rows |
| Faster training | `n_trials` 0–5, fewer `cv_folds`; `max_tuning_rows` for big tables |
| Very large table | `max_load_rows` (top level), `max_tuning_rows` (`tuning`) in `train.dig` |
| Retrain / score cadence | Separate schedules in `train.dig` / `predict.dig` (`dataprep-guide.md` §6) |
| Rollback / A/B | Versioned `model_name` (`…_v2`), switch it for scoring |

### Troubleshooting (model)

Workflow failures (data prep, 401/403, polling): `workflow-setup.md` §4.

| Symptom | Cause | Fix |
|---|---|---|
| User-input error | Target not {0, 1}, NULL labels, missing ID | `CAST(COALESCE(…, 0) AS BIGINT)`; check `user_id_column` |
| `best_threshold` = 0.5 | `min_metric_floor` not met | Lower the floor or change the strategy |
| Near-perfect AUC, one dominant feature | Leakage | Remove it or move its window before the cutoff |
| Predict fails without an ID | No `user_id_column` in request or model | Set it in both runs |
| Scores shifted after a schema change | Feature missing at prediction (filled with 0) | Keep train and predict SQL identical |
