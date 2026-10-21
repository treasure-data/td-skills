# Classifier Model Summary Dashboard — Build & Data Guide

A 4-tab standalone HTML dashboard for the latest AI Signals classifier run: model quality, feature drivers (SHAP), the latest scores, and run history.

---

> **Use as-is.** The dashboard template and `generate-data.js` are pre-validated: run the command once and use the result as it is. Do not take screenshots, run browser, QA or validation scripts, re-check the data, or edit the generated HTML, and do not apply other visualization or design skills to it. If something looks wrong, tell the user instead of fixing it.

## 1. Generate with `generate-data.js`

`generate-data.js` queries `{{sink_database}}` via `tdx` in parallel, shapes the metrics, writes the insight bullets and bakes all data into the template.

```bash
# Run from the Work Folder root (where agent_outputs/ lives).
node ".claude/skills/{{agent_name}}/references/generate-data.js" {{sink_database}} {{project_slug}} "{{project_name}}" \
  -P {{pred_table}} -o "{{engagement_dir}}/dashboards/classifier_summary_dashboard.html"
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `SOURCE_DB` | Env / Arg 1 | Required | Sink database with the `classifier_*` tables and the predictions |
| `PROJECT_SLUG` | Env / Arg 2 | `classifier` | Project slug — default output folder `agent_outputs/<project_slug>/dashboards/` |
| `PROJECT_NAME` | Env / Arg 3 | Title-cased slug | Display name in the header |
| `PRED_TABLE` / `-P, --pred-table` | Env / Flag | `classifier_predictions` | The workflow's `pred_output_table` (here `{{pred_table}}`); `<pred_table>_latest` must exist |
| `-o, --output` | String | `agent_outputs/<project_slug>/dashboards/classifier_summary_dashboard.html` | Output file path |
| `-t, --template` | String | `dashboard_template.html` next to the script | Template path |
| `-v, --verbose` | Flag | `false` | Query timings and row counts |

Open the result with `open "{{engagement_dir}}/dashboards/classifier_summary_dashboard.html"` or, in Treasure Work, `mcp__work__open_file`. It needs internet access for the Plotly CDN.

## 2. Source queries (run by `generate-data.js`)

Every `classifier_*` table is appended: the latest run is `max_by(session_id, time)` of `classifier_run_log`, and artifact tables are reduced to their latest batch in that session.

| Query | Table | Powers |
|---|---|---|
| Q1 latest training metrics | `classifier_run_log` (latest row) | Header, Tab 1 KPIs, confusion matrix, threshold, PSI |
| Q2 training-split metrics | `classifier_train_run_log` (same session) | Train vs test chart, overfitting table |
| Q3 feature importance | `classifier_feature_importance` (top 15 by `rank`) | Tab 2 importance chart |
| Q4 directional SHAP | `classifier_shap_directional` (top 15 by `rank`) | Tab 2 direction chart and table |
| Q5 latest scored batch | `{{pred_table}}_latest` | Tab 3 KPIs |
| Q6 score buckets | `{{pred_table}}_latest` grouped by `score_bucket` | Tab 3 distribution |
| Q7 training history | `classifier_run_log` ordered by `time` | Tab 4 metric trend |
| Q8 scoring history | `{{pred_table}}` grouped by `session_id` (distinct users) | Tab 4 volume and positive-rate trend |

Scale rule: `auc_roc`, `aucpr` and `f1_score` are stored 0–100 and divided by 100; `precision`, `recall` and `fbeta` are 0–1.

## 3. Tabs

- **Header** — project, sink database, training session, run time, predictions table, model type, threshold, records scored, number of training runs.
- **Tab 1 — Model Performance** — AUC-ROC, AUC-PR, F-beta, precision, recall (test split); train vs test chart; confusion matrix; overfitting table with status from the gaps (AUC < 0.03 stable, < 0.05 monitor, else overfitting; F-beta < 0.05 / < 0.10); config (session, model type, threshold, strategy, beta, database, predictions table); insights.
- **Tab 2 — Feature Drivers** — SHAP importance and signed SHAP (teal pushes up, purple pushes down); direction table; insights incl. the proxy-for-the-label check.
- **Tab 3 — Scores** — latest batch: records scored, average score, predicted positive, score range, train-vs-test PSI pill (< 0.1 stable, ≤ 0.25 investigate, else shift / leakage); score buckets with their position vs. the threshold; insights (flags a scoring threshold that differs from the latest training threshold).
- **Tab 4 — Historic Tracker** — AUC-ROC, F-beta, precision, recall per training run; records scored and predicted positive rate per scoring run; a single-run callout until a second run exists.

## 4. Programmatic access (`window.RAW`)

```javascript
// { project: { name, slug, database, predTable },
//   meta: { sessionId, predSessionId, modelType, threshold, thresholdApplied, recordsScored, psi },
//   training: { latest, trainSplit, historic: [...] },
//   prediction: { latest, buckets: [...], historic: [...] },
//   features: { importance: [...], directional: [...] } }
```
