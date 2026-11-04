# Classifier — Workflow Setup

Use with `../../shared/push_pattern_td_workflows.md`. Source of truth in the working copy (`<workdir>` = `agent_outputs/<project_slug>/workflow`):

| File | Defines |
|---|---|
| `<workdir>/README.md` | Structure, what each parameter does, outputs, customization points |
| `<workdir>/config.yml` | Exact keys and syntax — edit in place, keep every key |
| `<workdir>/sql/README.md` | Feature SQL output contract and variables |

This file adds only: Phase 1 findings → SQL and config values, deploy details, output checks, troubleshooting.

**Classifier exception:** `sql/input_features.sql` is project code — an example structure rewritten for every project (`../../shared/solution_standard.md` §5).

**Minimal push first (Phase 3):** SQL from the Phase 1 confirmation, "First push" values below, template values for the rest, schedule and alert email commented. Record each assumption in `project_state.md` as "default — confirm in requirements"; resolve caveats in Phase 4.

---

## 1. Write the feature SQL

One row per entity **per cutoff**: features before the cutoff, 0/1 label after it. Design and patterns: `dataprep-guide.md`.

| Part | From Phase 1 | Config |
|---|---|---|
| Cutoffs | Horizon, observation window, snapshots, history check (`dataprep-guide.md` §2) | `label_window_days`, `feature_lookback_days`, `n_train_snapshots`, `spacing_days`, `reference_date` |
| Population | Profile table (or Parent Segment `customers`) + eligibility per cutoff | `user_id_column` |
| Label | Outcome table + rule (event, cancellation, inactivity) | `target_column` |
| Features | Activity tables + stable profile attributes | `columns_to_drop` |

Rules:
- **Shape:** `cutoffs` → `population` → one CTE per source → `label` → final SELECT (`'${session_id}' AS session_id`, `cutoff_date`, ID, features, label as `CAST(COALESCE(…, 0) AS BIGINT)`). Join every CTE on ID **and** `cutoff_date`.
- **First push:** 5–15 features — window counts, active days, recency vs `cutoff_dt`, monetary sums, 1–2 stable profile attributes.
- **No leakage:** features end at the cutoff, the label starts there; no outcome-recording columns (`dataprep-guide.md` §2 checklist).
- **Label derived** when no 0/1 column exists — variants in `dataprep-guide.md` §1, §4.
- **Event time:** UNIX seconds — `time` if it is the real event time, else `TD_TIME_PARSE(<col>)`. Keep `TD_TIME_RANGE(…, '${scan_start}', '${scan_end}')` on every scan.
- **Join keys** differ per source → join through the lookup table from Phase 1.
- **`columns_to_drop`:** `time|session_id|cutoff_date` + every other non-feature column (ID and label are excluded automatically).

### Discovery queries

Run yourself (no subagents), all in one shell command (`tdx query … & tdx query … & wait`). Never start SQL with a `--` comment (`tdx query` reads it as an option).

**1. Source profile** — one `UNION ALL` block per table:

```sql
SELECT '<table>' AS src, COUNT(*) AS n_rows, COUNT(DISTINCT <id_col>) AS ids, COUNT_IF(<id_col> IS NULL) AS null_ids,
       TD_TIME_FORMAT(MIN(<ts>), 'yyyy-MM-dd') AS first_event, TD_TIME_FORMAT(MAX(<ts>), 'yyyy-MM-dd') AS last_event
FROM <source_database>.<table>
UNION ALL SELECT '<next table>', … FROM …
```

**2. Label balance at one cutoff** (`<cutoff>` = `<last_date>` − `label_window_days`):

```sql
WITH pop AS (SELECT DISTINCT <id_col> AS id FROM <source_database>.<population_table> WHERE <eligibility>),
lbl AS (SELECT DISTINCT <id_col> AS id FROM <source_database>.<outcome_table>
        WHERE TD_TIME_RANGE(<outcome_ts>, '<cutoff>', '<last_date>') AND <outcome_rule>)
SELECT COUNT(*) AS population, COUNT(l.id) AS positives, ROUND(100.0 * COUNT(l.id) / COUNT(*), 2) AS positive_pct
FROM pop p LEFT JOIN lbl l ON l.id = p.id
```

| Result | Action |
|---|---|
| Both classes, a few hundred+ positives, rate ≥ 1% | Continue |
| Rate < 1% | Note it: `balanced` + `auc_pr` / `fbeta`; more snapshots (`dataprep-guide.md` §2); ask in requirements about a wider window or population |
| One class / very few positives | Tell the user — the model will be unstable |

**3. ID overlap** — one block per feature source; a low `matched` share = join-key mismatch:

```sql
SELECT '<table>' AS src, COUNT(DISTINCT p.id) AS pop_ids, COUNT(DISTINCT s.<id_col>) AS matched
FROM (SELECT DISTINCT <id_col> AS id FROM <source_database>.<population_table>) p
LEFT JOIN <source_database>.<table> s ON s.<id_col> = p.id
```

## 2. Choose the other values

| Key | First push | Change when |
|---|---|---|
| `label_window_days` | `90` conversion / response, `180` churn by inactivity | The business outcome window differs |
| `feature_lookback_days` | `365` | Data covers < ~18 months → `180` |
| `n_train_snapshots`, `spacing_days` | Per use case (`dataprep-guide.md` §2 "Choosing the snapshots") | History check fails → fewer |
| `reference_date` | `''` | Data ends before today → last event date (query 1) |
| `model_type` | `xgboost` | Mostly string features or < ~10K rows → `catboost` |
| `optuna_metric`, `fbeta_beta`, `threshold_strategy`, `min_metric_floor` | Template values | Phase 4 precision / recall answer → `ai-signals-guide.md` §5 |
| `n_trials`, `cv_folds` | `30`, `5` | Quick run → `n_trials: 5` |
| `model_name` | `<project_prefix>_<model_type>` | Never shared — same name overwrites the other model |
| `pred_output_table` | `classifier_predictions` | Use-case name (`churn_scores`) |
| Failure email | Commented | Requirements give an address → uncomment `_error` in `classify.dig`, project name in `subject` |

## 3. Deploy details

| Item | Value |
|---|---|
| Project / entry point | `classifier_ais` (`tdx.json`) / `classify`; `train`, `predict` run alone |
| Secrets | None — `${secret:td.apikey}` is provided by AI Signals; never ask for it; keep the header as is |
| API endpoint | `ml_batch_api_endpoint` for the region (`tdx status`; values in the template README) |
| Sink database | Created by `+create_sink_database`; owner can't create databases → user creates it in the Console. `tdx tables "<sink_database>.classifier_*"` must be empty |
| Schedule | Commented; ask; different cadences → `train.dig` / `predict.dig` (`dataprep-guide.md` §6) |
| Push / run | `tdx wf push -y` from `<workdir>`, then `tdx wf run <project>.classify` after the one approval; training takes several minutes |

## 4. Validate

After every run: direct `tdx query -d <db>` calls in one shell command (no scripts). `<db>` = `sink_database`, `<pred>` = `pred_output_table`; latest run by `time`. Record results in `project_state.md`. Column details: `output-tables-guide.md`.

| # | Check | Pass |
|---|---|---|
| 1 | Training input per cutoff | `n_train_snapshots` cutoffs; `n_rows = ids` each; positives ~1–99%, stable across cutoffs. Off → `dataprep-guide.md` §5 |
| 2 | Run metrics | `auc_roc` > ~0.6; train − test AUC < ~0.05; `best_threshold` ≠ 0.5 (unless `fixed`); `psi` < 0.25; `auc_roc` > ~0.98 → leakage |
| 3 | Drivers | Plausible; no single feature far above the rest |
| 4 | Predictions | `ids` = `pred_input_table` rows = `n_rows`; `threshold` = `best_threshold`; several buckets; `predicted_pos` > 0 |
| 5 | `<pred>_latest` | `n_rows = ids` = check 4, same `session_id` |
| 6 | Live performance (once `label_window_days` passed since a scoring run) | Precision at the threshold and positive rate rising with the bucket — near the test metrics |

```sql
-- 1
SELECT session_id, cutoff_date, COUNT(*) AS n_rows, COUNT(DISTINCT <user_id_column>) AS ids, SUM(<target_column>) AS positives
FROM <db>.<train_input_table> GROUP BY 1, 2 ORDER BY 2

-- 2
SELECT r.session_id, r.model_type, r.auc_roc, r.aucpr, r.precision, r.recall, r.fbeta, r.best_threshold, r.psi,
       r.test_samples, r.total_features, t.auc_roc AS train_auc_roc, t.fbeta AS train_fbeta
FROM <db>.classifier_run_log r LEFT JOIN <db>.classifier_train_run_log t ON t.session_id = r.session_id
WHERE r.time = (SELECT MAX(time) FROM <db>.classifier_run_log) ORDER BY t.time DESC LIMIT 1

-- 3
SELECT feature_name, mean_abs_shap_value, rank FROM <db>.classifier_feature_importance
WHERE time = (SELECT MAX(time) FROM <db>.classifier_feature_importance) ORDER BY rank LIMIT 10

-- 4
SELECT session_id, COUNT(*) AS n_rows, COUNT(DISTINCT user_id) AS ids, SUM(predicted_label) AS predicted_pos,
       ROUND(AVG(score), 4) AS avg_score, MAX(threshold_applied) AS threshold, COUNT(DISTINCT score_bucket) AS buckets
FROM <db>.<pred> WHERE session_id = (SELECT max_by(session_id, time) FROM <db>.<pred>) GROUP BY 1

-- 5
SELECT COUNT(*) AS n_rows, COUNT(DISTINCT user_id) AS ids, MAX(session_id) AS session_id FROM <db>.<pred>_latest

-- 6: scores of an earlier run (<scored_date>) vs the actual outcome in the following label_window_days
WITH s AS (SELECT user_id, score_bucket, predicted_label FROM <db>.<pred> WHERE session_id = '<old_session_id>'),
o AS (SELECT DISTINCT <id_col> AS user_id FROM <source_database>.<outcome_table>
      WHERE TD_TIME_RANGE(<outcome_ts>, '<scored_date>', TD_TIME_ADD('<scored_date>', '<label_window_days>d')) AND <outcome_rule>)
SELECT s.score_bucket, COUNT(*) AS n, ROUND(AVG(IF(o.user_id IS NULL, 0.0, 1.0)), 4) AS actual_rate,
       SUM(IF(s.predicted_label = 1 AND o.user_id IS NOT NULL, 1, 0)) AS true_pos, SUM(s.predicted_label) AS flagged
FROM s LEFT JOIN o ON o.user_id = s.user_id GROUP BY 1 ORDER BY 1
```

For churn by inactivity, `o` = entities **with** activity and the actual rate = 1 − `actual_rate`.

### Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `data_prep` fails | `<...>` placeholder or unknown column left; undefined `${…}` (also in SQL comments) | `tdx wf attempt <id> tasks`, `logs +<task>`; fix the SQL |
| `+assert_training_dataset` fails | Empty input or one class | Check label rule, `label_window_days`, `reference_date` |
| 401 / 403 on train or predict | Wrong regional endpoint, or AI Signals not enabled | Fix `ml_batch_api_endpoint`; ask the account admin |
| Status poll gives up | Long training | Raise `_retry` on `+wait_for_training`; lower `n_trials` / `cv_folds` |
| Predictions < input rows | NULL IDs are excluded | Filter NULL IDs in the population CTE |
| Metrics jump between runs | Different windows, snapshots, features or population | Diff config and SQL of both runs first |

Input-table symptoms (cutoffs, duplicates, label rate): `dataprep-guide.md` §5. Model symptoms (threshold 0.5, leakage, user-input errors): `ai-signals-guide.md` §7.
