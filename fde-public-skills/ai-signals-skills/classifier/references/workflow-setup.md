# Classifier — Workflow Setup

Use with `../../shared/push_pattern_td_workflows.md` (copy, gates, push, run). Three files in the working copy are the source of truth — read them before editing anything:

- `<workdir>/README.md` — workflow structure, what every parameter does and how to choose it, outputs, customization points
- `<workdir>/config.yml` — exact parameter names and syntax (edit in place; keep every key)
- `<workdir>/sql/README.md` — the output contract of the feature SQL

`<workdir>` = `agent_outputs/<project_slug>/workflow`. This file adds only what the template can't: how to turn the Phase 1 findings into the feature SQL and config values, Classifier deploy details, and the output checks.

> **Classifier exception — the feature SQL is project code.** Unlike the other solutions, the Classifier template has no generic data prep: `sql/input_features.sql` ships as an example structure and is **rewritten in the working copy for every project** (§1). This is the only template file besides the config that a standard deployment edits (`../../shared/solution_standard.md` §5).

> **Minimal push first (Phase 3, before requirements come back).** Build the feature SQL from the population, label and feature sources confirmed in Phase 1; take the "First push" default of every rule below; template values for everything else; schedule and failure email left commented. Record each assumed value and data caveat in `project_state.md` as "default — confirm in requirements" and move on — caveats are resolved in Phase 4, not before the first run.

---

## 1. Write the feature SQL

The model reads one flat table: one row per entity, a 0/1 label observed after a cut-off date, and features computed before it. `data_prep.dig` runs the same `sql/input_features.sql` for training (`cutoff_date` = run date − `label_window_days`) and scoring (`cutoff_date` = run date).

| Part | From Phase 1 | Config |
|---|---|---|
| Population — the entities to score | Profile table (or Parent Segment `customers`) and its eligibility rule (all profiles, open leads, active subscribers) | `user_id_column` |
| Label — the outcome after the cut-off | Outcome table + rule (conversion event, cancellation, inactivity) and the outcome window | `target_column`, `label_window_days` |
| Features — behavior before the cut-off | Activity tables (events, orders, email, web, support) + stable profile attributes | `feature_lookback_days`, `columns_to_drop` |

Rules:
- **One CTE per source**, aggregated to one row per ID, `LEFT JOIN`ed to the population. Keep the template's final `SELECT` shape: `'${session_id}' AS session_id`, the ID, the features, the label as `CAST(COALESCE(…, 0) AS BIGINT)`.
- **First push: a small, safe feature set** — 5–15 features from the strongest sources: counts and active days in the window, recency (`days_since_last_*` against `DATE '${cutoff_date}'`), monetary sums when orders exist, one or two stable profile attributes. Leave everything else for Phase 4.
- **No leakage.** Every feature window ends at `cutoff_date`; the label window starts there. Never use a column that records the outcome (cancellation date, current status, lifetime totals, Parent Segment recency attributes — `sql/README.md`).
- **Label derived, not assumed.** If no 0/1 column exists, derive it: conversion = an outcome row in `[cutoff_date, label_end_date)`; churn = no activity in that window among entities active before the cut-off (restrict the population to them).
- **Event time:** the window filters use a UNIX-seconds column. Use `time` when it is the real event time; otherwise the event column (`TD_TIME_PARSE(<col>)` for a string) — decide per table from the Phase 1 profile.
- **Join keys** may differ per source; join through the lookup table confirmed in Phase 1 when they do.
- `columns_to_drop`: `time|session_id` plus every other non-feature column the SELECT outputs (dates, raw IDs). The ID and the label are excluded automatically.

### Discovery queries

Run with `tdx query` against the source databases — yourself, not through subagents. Replace the placeholders with the real names from the Phase 1 column query. Don't start the SQL with a `--` comment: `tdx query` reads it as an option and fails. Run them in **one shell command** (`tdx query … & tdx query … & wait`), not as separate tool calls.

**1. Source profile** — one `UNION ALL` block per candidate table: rows, distinct IDs, ID NULLs and date range (`<ts>` = the event-time column as UNIX seconds):

```sql
SELECT '<table>' AS src, COUNT(*) AS n_rows, COUNT(DISTINCT <id_col>) AS ids,
       COUNT_IF(<id_col> IS NULL) AS null_ids,
       TD_TIME_FORMAT(MIN(<ts>), 'yyyy-MM-dd') AS first_event, TD_TIME_FORMAT(MAX(<ts>), 'yyyy-MM-dd') AS last_event
FROM <source_database>.<table>
UNION ALL
SELECT '<next table>', … FROM …
```

**2. Label balance at one cut-off** — the label rule applied once, with the cut-off placed `label_window_days` before the last event date (`<last_date>` from query 1):

```sql
WITH pop AS (SELECT DISTINCT <id_col> AS id FROM <source_database>.<population_table> WHERE <eligibility>),
lbl AS (SELECT DISTINCT <id_col> AS id FROM <source_database>.<outcome_table>
        WHERE TD_TIME_RANGE(<outcome_ts>, '<cutoff>', '<last_date>') AND <outcome_rule>)
SELECT COUNT(*) AS population, COUNT(l.id) AS positives,
       ROUND(100.0 * COUNT(l.id) / COUNT(*), 2) AS positive_pct
FROM pop p LEFT JOIN lbl l ON l.id = p.id
```

Pass: both classes, at least a few hundred positives, positive rate ≥ 1%. Below 1%: note it — `balanced` weighting plus `auc_pr` / `fbeta` is the setup, and the requirements doc asks whether a wider label window or population is acceptable. Too few positives → tell the user the model will be unstable.

**3. ID overlap** — share of population IDs present in each feature source (one `UNION ALL` block per source) — a low share means a join-key mismatch:

```sql
SELECT '<table>' AS src, COUNT(DISTINCT p.id) AS pop_ids, COUNT(DISTINCT s.<id_col>) AS matched
FROM (SELECT DISTINCT <id_col> AS id FROM <source_database>.<population_table>) p
LEFT JOIN <source_database>.<table> s ON s.<id_col> = p.id
```

Record the tables, columns, label rule, windows, positive rate and caveats in `project_state.md` (Phase 1) — they are needed again in Phase 3 and 4.

## 2. Choose the other values

| Decision | Rule |
|---|---|
| `label_window_days` | The business outcome window ("within 90 days"). **First push:** `90` for conversion / response, `180` for churn by inactivity |
| `feature_lookback_days` | **First push:** `365`; shorter (`180`) when the data covers less than ~18 months |
| `reference_date` | **First push:** `''`. When the data ends before today (demo, paused feed), set it to the last event date from discovery query 1 — the windows count back from it |
| `model_type` | **First push:** `xgboost`. `catboost` when most features are strings or the data is under ~10K rows |
| Objective (`optuna_metric`, `fbeta_beta`, `threshold_strategy`, `min_metric_floor`) | **First push:** template values. Phase 4: from the precision / recall answer — guide §5 table |
| `n_trials`, `cv_folds` | **First push:** template values (`30`, `5`); `n_trials: 5` when the user asks for a quick run |
| `model_name` | Project-specific when another classifier could share the account — e.g. `<project_prefix>_<model_type>` with `-` → `_`. Two projects with the same `model_name` overwrite each other's model |
| `pred_output_table` | `classifier_predictions`, or a use-case name (`churn_scores`) |
| `sink_database` | One classifier project per sink database — the `classifier_*` artifact names are fixed |
| Failure email | Uncomment the `_error` block in `classify.dig` and set the address from the requirements, or leave it commented. Put the project name in `subject` |

## 3. Deploy details

| Item | Value |
|---|---|
| Default project name | `classifier_ais` (from `tdx.json`) |
| Entry point | `classify` (train, then predict); `train` and `predict` also run on their own |
| Secrets | None to set. `train.dig` / `predict.dig` send `${secret:td.apikey}`, which the AI Signals architecture provides — never ask the user to set it, and keep the header exactly as in the template |
| API endpoint | `ml_batch_api_endpoint` — the account's region (`tdx status`); values in the template README |
| Sink database | Created by `+create_sink_database` (in `data_prep.dig`) if missing. If the project owner can't create databases, the user creates it in the TD Console first |
| Sink database check | `tdx tables "<sink_database>.classifier_*"` must return nothing from another project |
| Schedule | Commented out in `classify.dig`. Ask whether the customer wants scheduled runs (or separate retrain / scoring schedules); leave it commented for a test account |

Push and run with the shared pattern (`tdx wf push -y` from `<workdir>`, `tdx wf run <project>.classify` after the one approval). Training takes the longest — several minutes with the default search.

## 4. Validate

Run after every run (Phase 3 and Phase 4), as direct `tdx query -d <db>` calls in one shell command — never through a script you write. `<db>` = `sink_database`, `<pred>` = `pred_output_table`. Every artifact table is appended, so each check picks the latest run by `time`. Record the results in `project_state.md`.

**1. Training input** — rows, positives, both classes:

```sql
SELECT session_id, COUNT(*) AS n_rows, COUNT(DISTINCT <user_id_column>) AS ids, SUM(<target_column>) AS positives
FROM <db>.<train_input_table> GROUP BY 1
```
Pass: `n_rows = ids`; positives between ~1% and 99% of rows.

**2. Training run metrics** — test split vs training split:

```sql
SELECT r.session_id, r.model_type, r.auc_roc, r.aucpr, r.precision, r.recall, r.fbeta, r.best_threshold, r.psi,
       r.test_samples, r.total_features, t.auc_roc AS train_auc_roc, t.fbeta AS train_fbeta
FROM <db>.classifier_run_log r
LEFT JOIN <db>.classifier_train_run_log t ON t.session_id = r.session_id
WHERE r.time = (SELECT MAX(time) FROM <db>.classifier_run_log)
ORDER BY t.time DESC LIMIT 1
```
Pass: `session_id` = the run's session; `auc_roc` (0–100) above ~60; `train_auc_roc − auc_roc` under ~5 points; `best_threshold` not exactly 0.5 (unless `fixed`); `psi` under 0.25. `auc_roc` above ~98 → check for leakage (check 3).

**3. Feature drivers** — top features of the run:

```sql
SELECT feature_name, mean_abs_shap_value, rank
FROM <db>.classifier_feature_importance
WHERE time = (SELECT MAX(time) FROM <db>.classifier_feature_importance)
ORDER BY rank LIMIT 10
```
Pass: plausible business drivers; no single feature far above the rest that could be a proxy for the label.

**4. Predictions** — the scored batch:

```sql
SELECT session_id, COUNT(*) AS n_rows, COUNT(DISTINCT user_id) AS ids, SUM(predicted_label) AS predicted_pos,
       ROUND(AVG(score), 4) AS avg_score, MAX(threshold_applied) AS threshold, COUNT(DISTINCT score_bucket) AS buckets
FROM <db>.<pred>
WHERE session_id = (SELECT max_by(session_id, time) FROM <db>.<pred>)
GROUP BY 1
```
Pass: `ids` = rows of `pred_input_table`; `n_rows = ids` (a retried run can append twice — `<pred>_latest` dedupes by `user_id`); `threshold` = `best_threshold` of check 2; several buckets; `predicted_pos` > 0.

**5. Latest-scores table** (the Parent Segment source):

```sql
SELECT COUNT(*) AS n_rows, COUNT(DISTINCT user_id) AS ids, MAX(session_id) AS session_id FROM <db>.<pred>_latest
```
Pass: `n_rows = ids` = `ids` of check 4, same `session_id`.

### Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `data_prep` fails | A placeholder or column name left in `sql/input_features.sql`, or an undefined `${…}` (also inside SQL comments — Digdag renders them) | `tdx wf attempt <id> tasks`, then `logs +<failed task>`; fix the SQL |
| `+assert_training_dataset` fails | Empty input, or one class only in the window | Check the label rule, `label_window_days` and `reference_date` (stale data) |
| Train or predict step returns 401/403 | Endpoint region mismatch, or AI Signals not enabled for the classifier | Set the regional endpoint; ask the account admin about access |
| Status poll gives up | Long training run | Raise `_retry` on `+wait_for_training`; lower `n_trials` / `cv_folds` |
| Predictions fewer than input rows | NULL IDs (excluded) | Filter NULL IDs in the population CTE |
| Metrics far apart between runs | Different windows, features or population | Compare the config and SQL of both runs before attributing the change to the data |

More symptoms (threshold fallback, leakage, missing features) are in `ai-signals-guide.md` §7.
