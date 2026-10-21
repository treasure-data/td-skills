# AI Signals Classifier (Propensity Scoring) — Model Guide

Read this for any task about the AI Signals classifier model: how it trains and scores, which API parameters exist and how to set them, testing other parameter values, or changing the input or output tables. The workflow template (`train.dig`, `predict.dig`, `config.yml`) is the source of truth for what this setup sends today; this guide covers what the API accepts and how the model behaves.

**Public documentation:** https://docs.treasure.ai/products/customer-data-platform/machine-learning/ai-signals/propensity-ai-signals — after answering a question about the model from this guide, share this link and tell the user they can find more detail in the public AI Signals documentation.

## 1. What it does

A general-purpose binary classifier for tabular data. Given a flat table of features and a 0/1 target, it trains a gradient-boosted tree model, picks a decision threshold, and scores every entity (profile, lead, account) with the probability of the positive class. One model = one binary outcome = one score per entity. Batch only — no real-time scoring, no multi-class (train one model per class) and no regression.

Two API solutions:

- `classifier_train` — trains with an embedded hyperparameter search, evaluates on a held-out split, writes diagnostic tables and stores the model under `model_name`. Runs on a single node.
- `classifier_predict` — loads the model by `model_name` and scores every input row. Runs distributed: rows are sharded across workers by a hash of the user ID.

Typical use cases: lead or conversion propensity, churn, campaign response or purchase likelihood, upsell, renewal, any "will X happen?" with a labelled history.

Two model families share one interface, preprocessing, evaluation and output schema:

| | `xgboost` (default) | `catboost` |
|---|---|---|
| Choose when | Features are mostly numeric or low/medium-cardinality strings; the table is large; training time matters | Many categorical or high-cardinality string features (ordered target statistics resist overfitting on categories), or small to medium data |
| Categoricals | pandas `category` dtype, `enable_categorical`, `hist` trees | `cat_features` on raw strings |
| Class balance | `scale_pos_weight` = negatives / positives | `auto_class_weights = Balanced` |
| Model-specific search block | `xgboost`: subsample, colsample_bytree, min_child_weight, reg_alpha, reg_lambda, gamma | `catboost`: l2_leaf_reg, bagging_temperature, random_strength, border_count |
| Speed | Faster | Usually slower |

When in doubt, train both under different `model_name`s and compare `aucpr`, `fbeta` and `psi` in `classifier_run_log`.

## 2. Input table

A flat, one-row-per-observation table. Feature engineering, aggregation and joins happen upstream — in this template, the project's feature SQL (`sql/input_features.sql`, built by `data_prep.dig`).

| Item | Requirement |
|---|---|
| Grain | One row per entity per observation. Compute features as of a cut-off date and observe the label after it, so no feature leaks the outcome |
| Target (required) | `{0, 1}` as int, `0.0`/`1.0` or boolean; no NULLs; both classes present. Anything else (`yes`/`no`, `{1, 2}`, `{-1, 1}`, NULL labels, a single class) fails with a user-input error — the target is never re-encoded |
| Identity (recommended) | `user_id_column`: unique per row, non-NULL, never used as a feature. Stored with the model and inherited by every prediction run; distributed prediction needs it |
| Numeric features | int / double; NULLs pass through to the trees (no imputation); ±inf becomes NULL |
| Categorical features | Any non-numeric column; NULL and unseen values become `"missing"`. Avoid free text and very high-cardinality strings (emails, IDs, URLs) |
| Columns to exclude | TD's `time`, `session_id`, raw timestamps or date strings (turn them into numbers such as `days_since_x`), PII, anything derived from the label. List them in `columns_to_drop` — only `target_column` and `user_id_column` are excluded automatically (the public docs also mention `session_id`; this template drops it explicitly either way) |
| Prediction input | Same feature columns and types as training plus the ID column; the target is ignored if present. A missing numeric feature is filled with 0 — it silently changes scores, so keep the schema identical |

Have at least a few hundred positives in the training table for a stable CV and threshold.

## 3. Parameters

Passed under `solution_arguments`. This template sends the nested blocks (`tuning`, `threshold`, `metric`, `xgboost`); flat keys (`n_trials`, `threshold_strategy`, …) directly under `solution_arguments` are also accepted, and a nested block wins over a flat key. The `xgboost` and `catboost` ranges are nested-only. `session_id` is sent too — the service stamps it on every output row.

### Training — `solution_name: classifier_train`

Top level: `input_table` and `output_table` (both `db.table`, required — only the database part of `output_table` is used; the artifact tables get fixed `classifier_*` names).

| Parameter | API default | Allowed / range | Notes |
|---|---|---|---|
| `target_column` | required | column name | 0/1, both classes |
| `model_name` | null | string | Unique per TD account; prediction loads the model by it; retraining under the same name replaces it |
| `model_type` | `xgboost` | `xgboost`, `catboost` | |
| `user_id_column` | null | column name | Recommended — see §2 |
| `columns_to_drop` | null | pipe-separated | Saved with the model and reused at prediction |
| `test_size` | `0.2` | 0.05–0.5 | Hold-out share, stratified |
| `max_load_rows` | `10000000` | ≥ 0 (0 = off) | SQL `LIMIT` on rows loaded for training (memory guard) — not set by this template |

`tuning` block (both families):

| Parameter | API default | Allowed / range | Notes |
|---|---|---|---|
| `n_trials` | `30` | ≥ 0 | `0` skips the search and uses built-in defaults |
| `cv_folds` | `3` | 2–10 | Stratified folds per trial |
| `max_tuning_rows` | `1000000` | ≥ 0 (0 = off) | Stratified subsample used only for the search — not set by this template |
| `optuna_metric` | `fbeta` | `fbeta`, `auc_roc`, `auc_pr`, `precision`, `recall`, `log_loss` | Aliases: `auc`/`roc_auc` → `auc_roc`, `aucpr`/`pr_auc` → `auc_pr`, `logloss` → `log_loss` |
| `fbeta_beta` | `0.5` | 0.01–10.0 | < 1 favors precision, > 1 recall; also sets which floor applies |
| `early_stopping_rounds` | `0` | ≥ 0 (0 = off) | Uses the eval set during CV |
| `class_balance_strategy` | `balanced` | `balanced`, `none` | `balanced` = XGBoost `scale_pos_weight` / CatBoost Balanced weights |
| `n_estimators_min` / `_max` | 100 / 800 | int ≥ 10 | Trees (CatBoost iterations) |
| `max_depth_min` / `_max` | 3 / 10 | int ≥ 1 | Lower to regularize |
| `learning_rate_min` / `_max` | 0.01 / 0.3 | float | Log-uniform |

`threshold` block:

| Parameter | API default | Allowed / range | Notes |
|---|---|---|---|
| `strategy` | `precision_optimal` | `precision_optimal`, `f1_optimal`, `recall_optimal`, `youden_j`, `fixed` | Template key `threshold_strategy` |
| `min_metric_floor` | `0.35` | 0.0–1.0 | Minimum recall for `precision_optimal`, minimum precision for `recall_optimal`; ignored by the others. If no threshold meets it, the threshold falls back to **0.5** — check `best_threshold` |
| `fixed_threshold` | `0.5` | 0.0–1.0 | Only with `fixed` |

`metric` block:

| Parameter | API default | Allowed / range | Notes |
|---|---|---|---|
| `eval_metric` | `aucpr` | tree eval metric | Mapped for CatBoost (`aucpr` → PRAUC, `auc` → AUC, `logloss` → Logloss) |
| `corr_threshold` | `0.9` | 0.5–1.0 | Numeric features correlated above it are dropped (`classifier_corr_drop_report`) |
| `shap_max_samples` | `1000` | ≥ 10 | Test rows used for SHAP |

`xgboost` block (only with `model_type: xgboost`), each a `_min` / `_max` search range: `subsample` 0.6–1.0, `colsample_bytree` 0.6–1.0, `min_child_weight` 1–50, `reg_alpha` 0.001–10.0, `reg_lambda` 0.001–10.0, `gamma` 0.0–10.0.

`catboost` block (only with `model_type: catboost`): `l2_leaf_reg` 1.0–10.0, `bagging_temperature` 0.0–1.0, `random_strength` 1e-08–10.0, `border_count` 32–255. This template does not send a `catboost` block — with `catboost` the API defaults apply unless one is added to `train.dig`.

The template's own values (`config.yml`) differ from several API defaults on purpose (e.g. `cv_folds`, `fbeta_beta`, `optuna_metric`, `min_metric_floor`, `corr_threshold`, `shap_max_samples`); they are what this setup sends.

### Prediction — `solution_name: classifier_predict`

Top level: `input_table`, `output_table` (the predictions table).

| Parameter | API default | Notes |
|---|---|---|
| `model_name` | required | The model to load; config, threshold and preprocessing come from it (no `target_column` needed) |
| `user_id_column` | the model's | Overrides the column stored with the model; one of the two must resolve or the run fails. Rows with a NULL ID are excluded from distributed runs |
| `columns_to_drop` | — | Accepted but not applied: prediction reuses the list saved with the model, and extra input columns are dropped when the input is aligned to the trained features |
| `output_mode` | `append` | `append` or `overwrite`; distributed runs always append, so filter on the latest `session_id` |

### Endpoint by region

`ml_batch_api_endpoint` in `config.yml` — set it from the account's site (`tdx status`):

| Site | Endpoint |
|---|---|
| US (us01) | `https://ml-batch-api.treasuredata.com` |
| Japan (jp01) | `https://ml-batch-api.treasuredata.co.jp` |
| EU (eu01) | `https://ml-batch-api.eu01.treasuredata.com` |
| AP (ap02) | `https://ml-batch-api.ap02.treasuredata.com` |
| AP (ap03) | `https://ml-batch-api.ap03.treasuredata.com` |

Prerequisite: the account's AI Signals solutions include `classifier_train` and `classifier_predict`.

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

**Training (`classifier_train`):**

1. **Load** `SELECT * FROM input_table LIMIT max_load_rows`.
2. **Validate** the target (exists, no NULLs, exactly {0, 1}, both classes) and the ID column.
3. **Split** stratified train/test (`test_size`, fixed seed).
4. **Preprocess** — drop `columns_to_drop`, the ID and the target; non-numeric columns become native categoricals (NULL → `"missing"`); numeric NULLs pass through; numeric features correlated above `corr_threshold` are dropped; correlation and VIF diagnostics are computed.
5. **Tune** — Optuna (TPE sampler with a median pruner) runs `n_trials` trials, each scored by stratified `cv_folds`-fold CV on up to `max_tuning_rows` rows, optimizing `optuna_metric`. Every trial goes to `classifier_optuna_trials`.
6. **Fit** the training split with the best parameters; class weighting follows `class_balance_strategy`.
7. **Choose the threshold** on out-of-fold CV predictions of the training split (not on re-scored training rows, which boosted trees nearly memorize) with `threshold.strategy`.
8. **Evaluate** on the held-out test split (`classifier_run_log`) and the training split (`classifier_train_run_log`); compute train-vs-test PSI.
9. **Explain** with SHAP on up to `shap_max_samples` test rows.
10. **Refit** on all loaded rows (train + test) with the tuned parameters, keep the threshold from step 7, and store the model under `model_name`.

The reported test metrics describe the model fitted on the training split. The stored model has also seen the test rows, so to measure it independently, score a later time window and compare with the actual outcomes.

**Prediction (`classifier_predict`):**

1. Load the model by `model_name`; resolve the ID column (request first, then the model's).
2. Shard rows across workers by a hash of the user ID; rows with a NULL ID are excluded.
3. Apply the training preprocessing and align to the trained features — missing numeric features → 0, missing categoricals → `"missing"`, extra columns dropped, unseen category values treated as missing.
4. Score, label (`score >= threshold_applied`), bucket, and append to the output table.

**Choosing the objective** — match it to the business action:

| Goal | `optuna_metric` | `fbeta_beta` | `threshold_strategy` | `min_metric_floor` |
|---|---|---|---|---|
| Small, high-quality audience where each action is costly (sales call, discount) | `fbeta` | `0.5` | `precision_optimal` | 0.2–0.35 = minimum recall |
| Catch as many positives as possible where each action is cheap (churn save, email) | `fbeta` | `2.0` | `recall_optimal` | 0.2–0.4 = minimum precision |
| Balanced precision and recall | `fbeta` | `1.0` | `f1_optimal` | n/a |
| Ranking only (top-N, deciles); the label is not used | `auc_pr` (imbalanced) or `auc_roc` | n/a | any — use `score` / `score_bucket` | n/a |
| Probabilities used as-is (expected value, budget maths) | `log_loss` | n/a | any | n/a |
| Balanced TPR/FPR, no precision target | `auc_roc` | n/a | `youden_j` | n/a |
| The business already has a cut-off | any | n/a | `fixed` + `fixed_threshold` | n/a |

**Class imbalance:** keep `class_balance_strategy: balanced` for most propensity tasks, especially with positives under ~10%, and pair it with `auc_pr` or `fbeta`, never accuracy. Use `none` (with `log_loss`) when scores must be read as real probabilities — balanced weighting inflates them.

**Tuning budget presets:**

| Preset | Settings | Use for |
|---|---|---|
| Baseline / smoke | `n_trials: 0`, or `n_trials: 5`, `cv_folds: 2` | Pipeline validation, quick feasibility |
| Standard | `n_trials: 30`, `cv_folds: 3`, `max_tuning_rows: 1000000` | Most production models |
| Thorough | `n_trials: 75`–`100`, `cv_folds: 5`, `early_stopping_rounds: 50` | High-value models retrained rarely |
| Very large tables | Standard + `max_tuning_rows: 200000`–`500000`; raise `max_load_rows` only if memory allows | Tens of millions of rows |

Training cost grows roughly with `n_trials` × `cv_folds` model fits, plus `cv_folds` out-of-fold fits for the threshold and two final fits. The training instance is sized at about 2 GB per million rows.

## 6. Output tables

**Training** writes into the database of `output_table`, every table prefixed `classifier_`, stamped with `session_id` (most also with `created_at`; the two run logs only have `time`) and **appended on every run**:

| Table | Contents |
|---|---|
| `classifier_run_log` | One row per run, test split: `test_accuracy`, `precision`, `recall`, `fbeta` (0–1); `auc_roc`, `aucpr`, `f1_score` (**0–100**); `best_threshold`; `true_positives`, `true_negatives`, `false_positives`, `false_negatives`, `test_samples`; `train_target_dist`, `test_target_dist`; `best_params`; `mcfadden_r2`, `cox_snell_r2`, `chi_square`; `psi`; the run's tuning config (`optuna_metric`, `threshold_strategy`, `min_metric_floor`, `cv_folds`, `corr_threshold`, …) |
| `classifier_train_run_log` | Same schema on the training split (its `psi` is empty) |
| `classifier_feature_list` | Model features in order (`feature_name`, `feature_index`) |
| `classifier_feature_importance` | SHAP mean \|value\| per feature (`mean_abs_shap_value`, `rank`) |
| `classifier_shap_directional` | Per feature: `direction` (increases score / decreases score / mixed), `mean_shap`, `median_shap`, `shap_std`, `pct_pushing_up`, `pct_pushing_down`, `direction_confidence`, `pearson_value_vs_shap` |
| `classifier_roc_curve` | ROC points (`fpr`, `tpr` as 0–100, `threshold`) |
| `classifier_prediction_bins` | Test-score histogram: 10 buckets (`bin_range`, `count`, `percentage`) |
| `classifier_vif_scores`, `classifier_feature_correlations`, `classifier_target_correlations` | VIF per numeric feature, pairwise correlations, feature-vs-target correlations |
| `classifier_corr_drop_report` | Features dropped for correlation (only when any were) |
| `classifier_optuna_trials` | Every search trial: `params_*`, `value`, `state` (only if `n_trials > 0`) |
| `classifier_xgboost_gain_importance` / `classifier_catboost_gain_importance` | Native importance (`feature_name`, `importance`) |

**Prediction** appends to `output_table`: `session_id`, `model_type`, `user_id` (the resolved ID column, its type follows the input), `score` (P(positive), 6 dp), `predicted_label` (1 if `score >= threshold_applied`), `threshold_applied` (from training), `score_bucket` (10-way bin, e.g. `0.8-0.9`), `prediction_timestamp`.

The model itself (estimator, features, best params, threshold, category vocabularies, dropped features) is stored by the service under `model_name` — not in TD.

### Validate

- The latest `classifier_run_log` row has `auc_roc` (0–100) clearly above 50 and `aucpr` above the positive rate × 100.
- `best_threshold` is not exactly `0.5` unless `threshold_strategy: fixed` — 0.5 usually means the floor fell back (lower `min_metric_floor` or change the strategy).
- Train vs test (`classifier_train_run_log` vs `classifier_run_log`): an AUC gap above ~5 points or an F-beta gap above ~0.1 means overfitting.
- `psi` under 0.1 stable, 0.1–0.25 worth investigating, over 0.25 usually leakage or a population shift.
- No single feature dominates `classifier_feature_importance` and no feature-vs-target correlation is near 1 — otherwise check it is not a proxy for the label.
- Predictions: one row per input entity for the latest `session_id`, `threshold_applied` = `best_threshold`, scores spread across several buckets.

### Interpret and use

- `score` ranks entities; with `balanced` weighting it is inflated — read it as a ranking, not a calibrated probability, unless `class_balance_strategy: none`.
- `predicted_label` = `score >= threshold_applied` — the audience the threshold strategy chose. Ranking use cases (top-N, deciles) use `score` or `score_bucket` instead.
- SHAP direction explains *why* scores move: "increases score" features push toward the positive outcome as their value grows.
- Every `classifier_*` table and the predictions are appended — always filter on one `session_id` (the latest, ordered by `time`).

### Diagnostics and limits

- Training is capped by `max_load_rows` (default 10M rows); prediction is never capped.
- Overfitting: narrow `max_depth_max` (e.g. 6), raise `min_child_weight_min` / `reg_*_min` (or `l2_leaf_reg_min`), lower `learning_rate_max`.
- Small data (under ~10K rows): `max_depth` 3–6, `cv_folds` 5, consider `catboost`.
- `corr_threshold`: 0.9 works for most data; ~0.8 for a leaner, more interpretable model; 1.0 drops only perfect duplicates.

## 7. Common changes

| Change | How |
|---|---|
| Different outcome or label window | Rewrite the label CTE in `sql/input_features.sql`; set `label_window_days` |
| More or different features | Edit `sql/input_features.sql` (same columns in both modes); add non-features to `columns_to_drop` |
| Precision vs recall trade-off | `fbeta_beta`, `threshold_strategy`, `min_metric_floor` (table in §5) |
| CatBoost instead of XGBoost | `model_type: catboost` and a new `model_name`; add a `catboost` block to `train.dig` to tune its ranges |
| Compare two models | Train each under its own `model_name`, compare their `classifier_run_log` rows |
| Faster training | `n_trials: 0`–`5`, lower `cv_folds`; add `max_tuning_rows` to the `tuning` block for very large tables |
| Very large training table | Add `max_load_rows` (top level) and `max_tuning_rows` (`tuning`) to `train.dig` |
| Retrain weekly, score daily | Schedule `train.dig` and `predict.dig` separately; prediction always uses the model currently stored under `model_name` |
| Rollback or A/B | Train under versioned names (`…_v2`) and switch `model_name` in the scoring run |
| A clean predictions snapshot | Filter on the latest `session_id`, or drop the predictions table before scoring |

### Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `+assert_training_dataset` fails | Empty input, or only one class in the training window | Check the label CTE and `label_window_days`; for stale data set `reference_date` |
| Run fails with a user-input error | Target not {0, 1}, NULL labels, or a missing ID column | Cast the label to 0/1 BIGINT with `COALESCE(…, 0)`; check `user_id_column` |
| Train or predict returns 401/403 | `ml_batch_api_endpoint` does not match the region, or AI Signals is not enabled for the classifier | Set the regional endpoint; ask the account admin about access |
| Status poll gives up | Long training run | Raise `_retry` on `+wait_for_training`; lower `n_trials` / `cv_folds` |
| `best_threshold` = 0.5 | No threshold met `min_metric_floor` | Lower the floor or change `threshold_strategy` |
| Near-perfect AUC, one dominant feature | Leakage — a feature computed after the cut-off or derived from the outcome | Remove it or move its window before `cutoff_date` |
| Predict fails without an ID | No `user_id_column` in the request or the model | Set `user_id_column` in both runs |
| Scores shifted after a schema change | A feature missing at prediction (filled with 0) | Keep training and prediction SQL identical |
