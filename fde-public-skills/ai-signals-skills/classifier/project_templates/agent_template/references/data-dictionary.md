# Data Dictionary — Classifier (Propensity Scoring) Output Tables

All tables live in `{{sink_database}}`. The AI Signals classifier writes the training tables under **fixed names** (`classifier_*`, no project prefix) and the predictions to `{{pred_table}}`. Every table except `{{pred_table}}_latest` and the two input tables is **appended on every run** and stamped with `session_id` (the Workflow session that built the model input) — always filter on one run.

## Picking a run

| Need | Filter |
|---|---|
| Latest training run | `session_id = (SELECT max_by(session_id, time) FROM classifier_run_log)` |
| One batch of an artifact table (a retried run can append twice) | add `AND time = (SELECT MAX(time) FROM <table> WHERE session_id = <that session>)` |
| Latest scores, one row per entity | `{{pred_table}}_latest` (no filter needed) |
| A past scoring run | `{{pred_table}} WHERE session_id = '<session>'` — dedupe by `user_id` |

`session_id` is VARCHAR. Never use `MAX(session_id)` to find the latest run — order by `time`. A run started with `classify.dig` has the same `session_id` for training and scoring.

## Scales — read before comparing metrics

| Columns | Scale |
|---|---|
| `precision`, `recall`, `fbeta`, `test_accuracy`, `best_threshold`, `score`, `threshold_applied` | 0–1 |
| `auc_roc`, `aucpr`, `f1_score` (run logs) and `fpr`, `tpr` (ROC curve) | **0–100** — divide by 100 before putting them next to 0–1 metrics |
| `percentage` (prediction bins), `pct_pushing_up`, `pct_pushing_down` | 0–100 |

---

## What the outputs mean

| Term | Meaning | Good / watch |
|---|---|---|
| **Score** | Model probability of the positive outcome. With `class_balance_strategy: balanced` it is inflated — read it as a ranking | Spread across buckets; a pile-up in one bucket means weak features |
| **Threshold** (`best_threshold`, `threshold_applied`) | Score at or above which `predicted_label = 1`, chosen in training by the threshold strategy on out-of-fold predictions | Exactly 0.5 with a non-`fixed` strategy = the metric floor was not met (fallback) |
| **AUC-ROC** | Probability that a random positive scores above a random negative | 50 = random; 70–80 useful; 80–90 strong; above ~98 suspect leakage |
| **AUC-PR** | Precision–recall area — the honest metric for rare positives | Compare with the positive rate × 100 (the random baseline) |
| **Precision / recall at the threshold** | Of those flagged, share truly positive / of the positives, share flagged | The trade-off chosen by `fbeta_beta` and the strategy |
| **F-beta** | Weighted mean of precision and recall; `fbeta_beta` < 1 favors precision, > 1 recall | — |
| **Train vs test gap** | `classifier_train_run_log` minus `classifier_run_log` | AUC gap under ~0.03 (3 points) stable; above ~0.05 overfitting |
| **PSI** (`classifier_run_log.psi`) | Population stability between train and test score distributions | < 0.1 stable; 0.1–0.25 investigate; > 0.25 leakage or population shift |
| **SHAP importance** | Mean absolute contribution of a feature to the score | One feature far above all others → check it is not a proxy for the label |
| **SHAP direction** | Whether higher feature values push the score up or down | `increases score`, `decreases score`, `mixed / non-monotonic` |

The test metrics describe the model fitted on the training split; the stored model is refit on all rows. An independent check is to score a later window and compare with actual outcomes.

---

## Training tables (written by `classifier_train`)

### `classifier_run_log` — one row per training run, test split

| Column | Type | Description |
|---|---|---|
| `session_id` | varchar | Run identifier |
| `model_type` | varchar | `xgboost` or `catboost` |
| `test_accuracy`, `precision`, `recall`, `fbeta` | double | Test metrics at the threshold (0–1) |
| `fbeta_beta` | double | Beta used for F-beta |
| `f1_score`, `auc_roc`, `aucpr` | double | Test metrics (**0–100**) |
| `best_threshold` | double | Decision threshold chosen in training |
| `true_positives`, `true_negatives`, `false_positives`, `false_negatives` | bigint | Confusion counts on the test split |
| `confusion_matrix` | varchar | Same as text |
| `test_samples`, `total_features` | bigint | Test rows; features used |
| `train_shape`, `test_shape`, `train_target_dist`, `test_target_dist` | varchar | Split sizes and class counts (e.g. `{0: 1686, 1: 714}`) |
| `best_params` | varchar | Tuned hyperparameters |
| `corr_threshold`, `min_metric_floor`, `optuna_metric`, `threshold_strategy`, `cv_folds`, `early_stopping_rounds`, `class_balance_strategy`, `eval_metric` | mixed | Config of the run |
| `log_likelihood_model`, `log_likelihood_null`, `chi_square`, `mcfadden_r2`, `cox_snell_r2` | double | Fit statistics |
| `psi` | double | Train-vs-test score PSI |
| `train_start_date`, `train_end_date` | varchar | Often empty |
| `time` | bigint | Write time (UNIX) — the run logs have no `created_at` |

### `classifier_train_run_log` — same schema, training split

Use with `classifier_run_log` for the overfitting check. Its `psi` is empty.

### `classifier_feature_importance`

`feature_name`, `mean_abs_shap_value` (note: not `mean_abs_shap`), `rank` (1 = most important), `session_id`, `created_at`, `time`.

### `classifier_shap_directional`

`feature_name`, `direction`, `mean_shap` (signed), `mean_abs_shap`, `median_shap`, `shap_std`, `pct_pushing_up`, `pct_pushing_down` (0–100), `direction_confidence` (0–1), `pearson_value_vs_shap` (correlation of the feature value with its SHAP value), `rank`, `session_id`, `created_at`, `time`.

### `classifier_xgboost_gain_importance` (or `classifier_catboost_gain_importance`)

`feature_name`, `importance` (native model gain), `rank`, `session_id`, `created_at`, `time`. Only the table of the run's `model_type` exists.

### `classifier_feature_list`

`feature_name`, `feature_index` — the features the model uses, in order.

### `classifier_roc_curve`

`fpr`, `tpr` (0–100), `threshold` (the first point has `Infinity`), `session_id`, `created_at`, `time` — test split.

### `classifier_prediction_bins`

`bin_range` (`0.0-0.1` … `0.9-1.0`), `count`, `percentage` (0–100) — histogram of **test-split** scores in training, not of the scored population.

### `classifier_target_correlations`, `classifier_feature_correlations`, `classifier_vif_scores`

- `classifier_target_correlations`: `feature`, `target_correlation`, `abs_target_correlation`, `rank` — numeric features only. Near ±1 → leakage suspect.
- `classifier_feature_correlations`: `feature_a`, `feature_b`, `correlation`, `abs_correlation`.
- `classifier_vif_scores`: `feature`, `vif` — above ~10 = strong multicollinearity.

### `classifier_corr_drop_report`

Features dropped because they were correlated above `corr_threshold` — exists only when any were dropped.

### `classifier_optuna_trials`

One row per search trial: `number`, `value` (objective), `state`, `params_*` (one column per tuned hyperparameter), `datetime_start`, `datetime_complete`, `duration`. Exists only when `n_trials > 0`.

---

## Prediction tables

### `{{pred_table}}` — appended on every scoring run

| Column | Type | Description |
|---|---|---|
| `session_id` | varchar | Scoring run |
| `model_type` | varchar | Model family that scored |
| `user_id` | follows the input | The entity ID (`user_id_column` of the workflow, renamed `user_id`) |
| `score` | double | Probability of the positive outcome, 6 dp |
| `predicted_label` | bigint | 1 if `score >= threshold_applied` |
| `threshold_applied` | double | Threshold of the model that scored |
| `score_bucket` | varchar | 10-way bin, e.g. `0.8-0.9` |
| `prediction_timestamp` | varchar | Scoring time |
| `time` | bigint | Write time (UNIX) |

### `{{pred_table}}_latest` — latest batch, one row per `user_id`

Same columns (except `time`), replaced on every scoring run. The Parent Segment attribute table and the default for "who is scored high" questions.

### Model input tables

`train_input_table` / `pred_input_table` from the workflow config (defaults `classify_final_features_train` / `classify_final_features_pred`): the features per entity built by the project's feature SQL, replaced each run. Use them to describe the population or compare feature values of high and low scorers — join on the ID column (`user_id_column` in `{{engagement_dir}}/workflow/config.yml`).

---

## Cross-table patterns

- **Model performance:** `classifier_run_log` (latest) + `classifier_train_run_log` (same session) + `classifier_roc_curve`.
- **Overfitting:** AUC and F-beta gap between the two run logs; then `best_params` (depth, learning rate).
- **Drivers:** `classifier_feature_importance` ⨝ `classifier_shap_directional` on `feature_name` (same session and batch).
- **Leakage check:** top SHAP feature + its `classifier_target_correlations` value + an AUC above ~98.
- **Who scores high and why:** `{{pred_table}}_latest` ⨝ the prediction input table on the ID; compare feature averages between `predicted_label` 1 and 0. Per-record SHAP is not written — explain individuals with their feature values and the global directions.
- **Run-over-run:** `classifier_run_log` ordered by `time`; scoring runs from `{{pred_table}}` grouped by `session_id`.
