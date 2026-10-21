# Classifier (Propensity Scoring) — Workflow Template

## Overview

This Treasure Workflow project trains and scores a binary classification model — the probability that each entity (profile, lead, account) does something: converts, churns, responds, renews, … — with the AI Signals Propensity model (ml-batch-api `classifier_train` / `classifier_predict`). No Python runs in the workflow: training, tuning, threshold selection, SHAP and scoring all happen in the AI Signals service.

- **Data prep** — the project's feature SQL (`sql/`) builds a flat model input table: one row per entity with a `session_id`, the features computed before a cut-off date and (training) a 0/1 label observed after it.
- **Train** — XGBoost (default) or CatBoost with an embedded Optuna search, a decision threshold chosen on out-of-fold predictions, test-set evaluation, SHAP explanations and diagnostic tables. The model is stored by the service under `model_name`.
- **Predict** — the stored model scores every row of the prediction input table: `score` (probability), `predicted_label` (score ≥ threshold) and `score_bucket`; the latest batch is copied to `<pred_output_table>_latest`, one row per entity — the Parent Segment attribute table.

Any binary use case fits, as long as a labelled history exists: lead or conversion scoring, churn, campaign response, upsell, renewal, trial-to-paid, fraud, escalation. Multi-class problems need one model per class; continuous targets need a different workflow.

TD project name: `classifier_ais` (from `tdx.json`). Entry point: `classify.dig`. All parameters live in `config.yml`.

## Workflow Structure

```
classify.dig                       # entry point: schedule, error email, train then predict
├── train.dig                      # mode = train
│   ├── data_prep.dig              # 0. +create_sink_database; sql/input_features.sql → train_input_table
│   ├── +check_training_dataset    # 1. latest batch (MAX(session_id)) non-empty, both classes present — else fail
│   ├── +train_classifier          # 2. POST /v1/runs, solution classifier_train
│   ├── +wait_for_training         #    polls /v1/runs/{id}/status (408 while running, 200 when done)
│   └── +assert_training_succeeded #    fails on FAILED / ERROR / CANCELLED or error_messages
└── predict.dig                    # mode = pred
    ├── data_prep.dig              # 0. sql/input_features.sql → pred_input_table
    ├── +check_prediction_dataset  # 1. non-empty — else fail
    ├── +predict_classifier        # 2. POST /v1/runs, solution classifier_predict, latest model under model_name
    ├── +wait_for_prediction       #    polls the status
    ├── +assert_prediction_succeeded
    └── +latest_scores             # 3. latest batch, one row per user → <pred_output_table>_latest
```

`train.dig` and `predict.dig` also run on their own — schedule them separately when retraining and scoring have different cadences (e.g. weekly retrain, daily scoring).

| Folder / file | Contents |
|---|---|
| `config.yml` | All parameters |
| `sql/` | The project's feature SQL — `input_features.sql` ships as an example structure and is rewritten for every project (`sql/README.md` has the output contract) |
| `body.txt` | Failure email body (used when the `_error` block in `classify.dig` is enabled) |

## Configuration

All keys are in `config.yml`. The template values are a working example; change the ones in **bold** for every project. Tuning values are passed to the API as they are — the API's own defaults are listed in the AI Signals guide.

### Output and model

| Parameter | What it does | How to choose it |
|---|---|---|
| **`sink_database`** | Database for the model input tables, every `classifier_*` output table and the predictions | The confirmed sink database. Created by the first run if it does not exist. The `classifier_*` table names are fixed, so one sink database holds one classifier project |
| `description` | Free-text note on the model; not sent to the API | One line on the use case |
| **`model_name`** | Name the trained model is stored under; predict loads it | Unique per TD account — retraining under the same name replaces the model. Project-specific (e.g. `loyalty_churn_xgb`) |
| **`model_type`** | Model family | `xgboost` (default — mostly numeric or low-cardinality features, large tables); `catboost` for many or high-cardinality string features, or small data |
| **`ml_batch_api_endpoint`** | AI Signals ml-batch-api base URL | The account's region: US `https://ml-batch-api.treasuredata.com`, Japan `https://ml-batch-api.treasuredata.co.jp`, EU `https://ml-batch-api.eu01.treasuredata.com`, AP `https://ml-batch-api.ap02.treasuredata.com` / `https://ml-batch-api.ap03.treasuredata.com` |
| `ml_batch_api_version` | AI Signals solution version | `stable` |

### Tables and columns

| Parameter | What it does | How to choose it |
|---|---|---|
| `train_input_table`, `pred_input_table` | Model input tables written by `data_prep.dig` | Keep the defaults unless the names clash |
| `train_output_table` | Required by the training API; only its database is used (artifact tables are written there under fixed `classifier_*` names) | Keep the default |
| **`pred_output_table`** | Predictions table, appended on every scoring run; also names the latest-scores table `<pred_output_table>_latest` | `classifier_predictions`, or a use-case name (e.g. `churn_scores`) |
| **`target_column`** | 0/1 label column in the training input | The label name the feature SQL writes (e.g. `converted`, `churned`) |
| **`user_id_column`** | Entity ID: excluded from features, stored with the model, written to the predictions as `user_id`; required for distributed scoring | The ID the Parent Segment joins on |
| **`columns_to_drop`** | Pipe-separated non-feature columns; saved with the model and reused at prediction | Every column of the input table that is not a feature or the label/ID: `time`, `session_id`, dates, raw timestamps, emails, other IDs |

### Feature windows (read by the feature SQL)

| Parameter | What it does | How to choose it |
|---|---|---|
| **`label_window_days`** | Length of the outcome window after the training cut-off: training features end `label_window_days` before the run date, the label is observed after | The business definition of the outcome (e.g. "converted within 90 days" → `90`, "churned = no purchase in 180 days" → `180`) |
| **`feature_lookback_days`** | History used for the features before the cut-off | Long enough to cover a buying cycle (`180`–`730`) |
| `reference_date` | Run date used for the windows; `''` = the session date | `''` for live data; a `YYYY-MM-DD` date near the end of the data for demo or stale data |

### Training

| Parameter | What it does | How to choose it |
|---|---|---|
| `test_size` | Hold-out share for the test metrics | `0.2`; `0.3` for small data |
| `n_trials` | Optuna trials; `0` skips tuning and uses built-in defaults | `30`; `0`–`5` for a smoke test; `75`–`100` for a high-value model retrained rarely |
| `cv_folds` | Stratified CV folds per trial | `3`–`5`; `5` for small data |
| **`optuna_metric`** | Objective of the search: `fbeta`, `auc_roc`, `auc_pr`, `precision`, `recall`, `log_loss` | `fbeta` with `fbeta_beta` when the label is acted on; `auc_pr` for rare positives or ranking only; `log_loss` when scores must be read as probabilities |
| **`fbeta_beta`** | Beta of F-beta: below 1 favors precision, above 1 recall | `0.5` costly actions (sales calls, discounts); `1.0` balanced; `2.0` cheap actions where missing a positive is worse (churn save, email) |
| `early_stopping_rounds` | Rounds without improvement before a fit stops; `0` = off | `50` |
| `class_balance_strategy` | `balanced` weights the positive class; `none` keeps raw probabilities | `balanced` (positives under ~10%); `none` with `log_loss` when probabilities must stay calibrated |
| `n_estimators_min`, `n_estimators_max` | Search range of the number of trees | Template values; widen for more capacity |
| `max_depth_min`, `max_depth_max` | Search range of tree depth | Lower the max (e.g. `6`) when the model overfits or the data is small |
| `learning_rate_min`, `learning_rate_max` | Search range of the learning rate | Lower the max when the model overfits |
| `subsample_min`, `subsample_max`, `colsample_bytree_min`, `colsample_bytree_max` | XGBoost row / feature sampling ranges | Template values |
| `min_child_weight_min`, `min_child_weight_max`, `reg_alpha_min`, `reg_alpha_max`, `reg_lambda_min`, `reg_lambda_max`, `gamma_min`, `gamma_max` | XGBoost regularization ranges | Template values; raise the `_min` values when the model overfits |

### Threshold and diagnostics

| Parameter | What it does | How to choose it |
|---|---|---|
| **`threshold_strategy`** | How the score → label cut-off is chosen: `precision_optimal`, `f1_optimal`, `recall_optimal`, `youden_j`, `fixed` | Match the action: `precision_optimal` small high-quality audience; `recall_optimal` catch most positives; `f1_optimal` balanced; `fixed` when the business has a cut-off |
| `min_metric_floor` | Minimum recall for `precision_optimal`, minimum precision for `recall_optimal`; if no threshold meets it, the threshold falls back to 0.5 | `0.2`–`0.45`; check `best_threshold` after the run |
| `fixed_threshold` | Threshold used with `threshold_strategy: fixed` | The business cut-off |
| `eval_metric` | Boosting evaluation metric | `aucpr` |
| `corr_threshold` | Numeric features correlated above it are dropped | `0.85`–`0.9`; `0.8` for a leaner model; `1.0` drops only perfect duplicates |
| `shap_max_samples` | Test rows used for SHAP | `1000`–`2000` |

### Prediction

| Parameter | What it does | How to choose it |
|---|---|---|
| `pred_output_mode` | Write mode of the predictions table | `append` — distributed scoring always appends; filter on the latest `session_id` |

## Outputs

All tables are in `sink_database`. The model tables are appended on every run and stamped with the run's `session_id` (the Workflow session that built the input). Always filter on the `session_id` you want — or the latest one.

| Table | Contents |
|---|---|
| `train_input_table`, `pred_input_table` | Model input built by `data_prep.dig` — replaced each run |
| `classifier_run_log` | One row per training run: test-split metrics (`precision`, `recall`, `fbeta`, `test_accuracy` as 0–1; `auc_roc`, `aucpr`, `f1_score` as 0–100), confusion counts, `best_threshold`, `best_params`, `psi`, the run's tuning config |
| `classifier_train_run_log` | Same metrics on the training split — the train-vs-test overfitting check |
| `classifier_feature_list` | Features the model uses |
| `classifier_feature_importance`, `classifier_shap_directional` | SHAP importance and direction (increases / decreases / mixed) per feature |
| `classifier_xgboost_gain_importance` (or `classifier_catboost_gain_importance`) | Native model importance |
| `classifier_roc_curve`, `classifier_prediction_bins` | Test-split ROC points (0–100) and test-score histogram |
| `classifier_target_correlations`, `classifier_feature_correlations`, `classifier_vif_scores`, `classifier_corr_drop_report` | Numeric feature diagnostics; correlated features dropped (only if any) |
| `classifier_optuna_trials` | Hyperparameter search history (only if `n_trials > 0`) |
| `pred_output_table` (`classifier_predictions`) | One row per scored entity and run: `session_id`, `model_type`, `user_id`, `score`, `predicted_label`, `threshold_applied`, `score_bucket`, `prediction_timestamp` — appended |
| `<pred_output_table>_latest` | The latest scored batch, one row per `user_id` (same columns) — replaced each run; the Parent Segment attribute table |

The trained model is stored by the AI Signals service under `model_name` (not in TD).

## Secrets & Requirements

- **Secrets:** none to set. `train.dig` and `predict.dig` send `${secret:td.apikey}` to the AI Signals ml-batch-api, which provides the key itself.
- **Account:** AI Signals must be enabled for `classifier_train` and `classifier_predict`.
- **Data:** a labelled history — at least a few hundred positives and both classes in the training window — and features available for the entities to score.
- **Permissions:** the project owner needs permission to create the sink database and tables, and read access to the source databases the feature SQL uses.
- **Failure email:** the `_error` block in `classify.dig` is commented out. To enable it, uncomment it and replace `your-team@example.com` with the alert address.
- **Schedule:** commented out in `classify.dig`; uncomment it for scheduled runs (or schedule `train.dig` and `predict.dig` separately).

## Customization Points

| Change | Where |
|---|---|
| Features, population, label definition | `sql/input_features.sql` — always rewritten for the project (output contract in `sql/README.md`) |
| Extra feature tables built in parallel | A `_parallel` block in `data_prep.dig`, joined in `sql/input_features.sql` |
| Input tables built outside this workflow | Remove the `+data_prep` call from `train.dig` and `predict.dig`; the tables must keep the output contract |
| Failure email, schedule | `classify.dig` (or `train.dig` / `predict.dig` when scheduled separately) |
| Longer polling for large tables | `_retry` of `+wait_for_training` / `+wait_for_prediction` |
