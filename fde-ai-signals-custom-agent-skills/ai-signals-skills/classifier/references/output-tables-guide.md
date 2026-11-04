# Classifier — Output Tables Guide

Every table the workflow writes, its columns and the query that reads it. Read it when validating a run beyond `workflow-setup.md` §4, writing the agent's data dictionary, building the dashboard, or answering "where is X stored?". `<db>` = `sink_database`, `<pred>` = `pred_output_table`.

## Rules for every query

1. **Every write appends** (except the input tables and `<pred>_latest`, replaced each run). Filter to the latest run: `WHERE time = (SELECT MAX(time) FROM <db>.<table>)`, or `session_id = (SELECT max_by(session_id, time) FROM <db>.<table>)` for multi-row runs.
2. **Train and predict have different `session_id`s** — each is the session of the run that built its input. Predictions don't record which training run produced the model. Use each table's own latest run.
3. **No `model_name` column.** The `classifier_*` names are fixed: one sink database holds one classifier project.
4. `time` (upload epoch seconds) is on every table; `created_at` / `prediction_timestamp` are strings. `count` is reserved — quote it: `"count"`. Row-level queries: `ORDER BY` + `LIMIT`.
5. Scales: run-log metrics (`auc_roc`, `aucpr`, `f1_score`, `precision`, `recall`, `fbeta`, `test_accuracy`) are 0–1; ROC `fpr` / `tpr` and `percentage` columns are 0–100.
6. Artifacts describe the **evaluation model** (train / test split); the stored model is refit on all rows with the same `best_params` and `best_threshold`.

## Tables at a glance

| Written by | Table | Grain |
|---|---|---|
| `data_prep.dig` | `train_input_table`, `pred_input_table` | One row per entity per cutoff — replaced each run |
| `classifier_train` | `classifier_run_log`, `classifier_train_run_log` | One row per training run (test / train split) |
| | `classifier_feature_list`, `classifier_feature_importance`, `classifier_shap_directional`, `classifier_xgboost_gain_importance` / `classifier_catboost_gain_importance` | One row per feature per run |
| | `classifier_roc_curve`, `classifier_prediction_bins` | ROC points / 10 score bins per run |
| | `classifier_target_correlations`, `classifier_feature_correlations`, `classifier_vif_scores`, `classifier_corr_drop_report` | Numeric diagnostics per run (`corr_drop_report` only when features were dropped) |
| | `classifier_optuna_trials` | One row per search trial (only if `n_trials > 0`) |
| `classifier_predict` | `<pred>` (default `classifier_predictions`) | One row per scored entity per run — appended |
| `predict.dig` `+latest_scores` | `<pred>_latest` | Latest batch, one row per `user_id` — the Parent Segment attribute table |

`train_output_table` is required by the API but never written. The model is stored by the AI Signals service under `model_name`, not in TD.

## Training tables

| Table | Columns | Notes |
|---|---|---|
| `classifier_run_log` | `session_id`, `model_type`, `test_accuracy`, `precision`, `recall`, `f1_score`, `fbeta`, `fbeta_beta`, `auc_roc`, `aucpr`, `best_threshold`, `true_negatives`, `false_positives`, `false_negatives`, `true_positives`, `confusion_matrix`, `test_samples`, `total_features`, `train_shape`, `test_shape`, `train_target_dist`, `test_target_dist`, `best_params`, `corr_threshold`, `min_metric_floor`, `optuna_metric`, `threshold_strategy`, `cv_folds`, `early_stopping_rounds`, `class_balance_strategy`, `eval_metric`, `log_likelihood_model`, `log_likelihood_null`, `chi_square`, `mcfadden_r2`, `cox_snell_r2`, `psi`, `time` | Test-split metrics, 1 row per run. `psi` = train-vs-test score PSI; `model_type` is the model family |
| `classifier_train_run_log` | Same schema | Train-split metrics (`test_*` columns hold train values, `psi` NULL). Gap vs run log above ~0.05 AUC or ~0.1 F-beta = overfitting |
| `classifier_feature_list` | `session_id`, `feature_name`, `feature_index`, `created_at` | Features used |
| `classifier_feature_importance` | `feature_name`, `mean_abs_shap_value`, `rank`, `session_id`, `created_at` | SHAP mean \|value\| |
| `classifier_shap_directional` | `feature_name`, `mean_shap`, `mean_abs_shap`, `median_shap`, `shap_std`, `pct_pushing_up`, `pct_pushing_down` (0–100), `direction_confidence` (0–1), `pearson_value_vs_shap`, `direction` (`increases score` / `decreases score` / `mixed / non-monotonic` / `weakly directional` / `neutral`), `rank`, `session_id`, `created_at` | SHAP direction per feature |
| `classifier_xgboost_gain_importance` / `classifier_catboost_gain_importance` | `feature_name`, `importance`, `rank`, `session_id`, `created_at` | Native importance — query the table matching `model_type` |
| `classifier_roc_curve` | `session_id`, `fpr`, `tpr`, `threshold`, `created_at` | ROC points, test split |
| `classifier_prediction_bins` | `session_id`, `bin_range` (`0.0-0.1` … `0.9-1.0`, all 10), `"count"`, `percentage`, `created_at` | Test-split score histogram |
| `classifier_target_correlations` | `feature`, `target_correlation`, `abs_target_correlation`, `rank` | \|corr\| near 1 → check for leakage |
| `classifier_feature_correlations` | `feature_a`, `feature_b`, `correlation`, `abs_correlation` | Redundant pairs |
| `classifier_vif_scores` | `feature`, `vif` | > 10 strong, 5–10 moderate multicollinearity |
| `classifier_corr_drop_report` | `kept_feature`, `dropped_feature`, `correlation` | Dropped above `corr_threshold`; missing table = nothing dropped |
| `classifier_optuna_trials` | `number`, `value` (CV objective), `datetime_start`, `datetime_complete`, `duration`, `state` (`COMPLETE` / `PRUNED` / `FAIL`), `params_<name>` per searched hyperparameter, `session_id`, `created_at` | Not written when `n_trials = 0` |

The four numeric diagnostics also carry `session_id`, `created_at`, `time`.

```sql
-- Run metrics (latest)
SELECT session_id, model_type, auc_roc, aucpr, precision, recall, f1_score, fbeta, best_threshold, psi,
       true_positives, false_positives, false_negatives, true_negatives, test_samples, FROM_UNIXTIME(time) AS run_time
FROM <db>.classifier_run_log WHERE time = (SELECT MAX(time) FROM <db>.classifier_run_log)

-- Train vs test
SELECT 'test' AS split, auc_roc, precision, recall, fbeta FROM <db>.classifier_run_log
WHERE time = (SELECT MAX(time) FROM <db>.classifier_run_log)
UNION ALL
SELECT 'train', auc_roc, precision, recall, fbeta FROM <db>.classifier_train_run_log
WHERE time = (SELECT MAX(time) FROM <db>.classifier_train_run_log)

-- Any per-run feature table (same pattern for shap_directional, *_gain_importance, target_correlations, roc_curve, prediction_bins)
SELECT feature_name, mean_abs_shap_value, rank FROM <db>.classifier_feature_importance
WHERE session_id = (SELECT max_by(session_id, time) FROM <db>.classifier_feature_importance)
ORDER BY rank LIMIT 15
```

## Prediction tables

**`<pred>`** — per-entity scores, appended per run. Columns: `session_id`, `model_type`, `user_id` (always named `user_id`, whatever `user_id_column` is), `score` (P(class = 1)), `predicted_label` (1 if `score >= threshold_applied`), `threshold_applied` (= `best_threshold`), `score_bucket` (`0.0-0.1` … `0.9-1.0`), `prediction_timestamp`, `time`. Large — aggregate or `LIMIT`.

**`<pred>_latest`** — same columns, latest batch only, one row per `user_id`. Use it for lookups, segments and the Parent Segment join (`parent_segment.md`).

```sql
-- Latest run summary
SELECT session_id, COUNT(*) AS scored, SUM(predicted_label) AS predicted_pos,
       ROUND(AVG(score), 4) AS score_mean, APPROX_PERCENTILE(score, 0.5) AS score_median, MAX(threshold_applied) AS threshold
FROM <db>.<pred> WHERE session_id = (SELECT max_by(session_id, time) FROM <db>.<pred>) GROUP BY 1

-- Score distribution
SELECT score_bucket, COUNT(*) AS cnt, ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 1) AS pct
FROM <db>.<pred>_latest GROUP BY 1 ORDER BY 1

-- One entity
SELECT user_id, score, predicted_label, threshold_applied, score_bucket
FROM <db>.<pred>_latest WHERE CAST(user_id AS VARCHAR) = '<id>'
```

### Drift — live scores vs the test split (PSI)

```sql
WITH t AS (
  SELECT bin_range, GREATEST(percentage / 100.0, 0.0001) AS e FROM <db>.classifier_prediction_bins
  WHERE session_id = (SELECT max_by(session_id, time) FROM <db>.classifier_prediction_bins)
), p AS (
  SELECT score_bucket AS bin_range, CAST(COUNT(*) AS DOUBLE) / SUM(COUNT(*)) OVER () AS a
  FROM <db>.<pred>_latest GROUP BY 1
), j AS (
  SELECT t.bin_range, t.e, GREATEST(COALESCE(p.a, 0), 0.0001) AS a FROM t LEFT JOIN p ON t.bin_range = p.bin_range
)
SELECT bin_range, ROUND(100 * e, 1) AS test_pct, ROUND(100 * a, 1) AS live_pct, SUM((a - e) * LN(a / e)) OVER () AS psi
FROM j ORDER BY bin_range
```

PSI bands: stable < 0.10, monitor 0.10–0.25, drift / retrain > 0.25. With `class_balance_strategy: balanced` the live distribution shifts up — compare shapes, not levels.

## Question → tables

| Question | Tables |
|---|---|
| Model overview | `classifier_run_log` + `<pred>` latest summary |
| Top drivers | `classifier_feature_importance` + `classifier_shap_directional` |
| Score distribution | `<pred>_latest` (+ `classifier_prediction_bins` for test vs live) |
| ROC curve | `classifier_roc_curve` + `auc_roc` |
| Drift | PSI query + `classifier_run_log.psi` |
| Overfitting | `classifier_run_log` UNION ALL `classifier_train_run_log` |
| Trend across runs | `classifier_run_log` by `time`; `<pred>` grouped by `session_id` |
| Correlations, multicollinearity | the four numeric diagnostics |
| Tuning | `classifier_optuna_trials` + `best_params` |
| Confusion matrix | `classifier_run_log` (TP / FP / FN / TN) |
| Why entity X scored high | `<pred>_latest` (score vs threshold) + `classifier_shap_directional` (global drivers) |
| Label rate per snapshot | `train_input_table` grouped by `cutoff_date` |

**Not available:** per-entity SHAP, row-level test predictions, a prediction run log, a model-store table in TD. Say so plainly.
