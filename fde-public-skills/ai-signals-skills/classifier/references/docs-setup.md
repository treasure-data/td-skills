# Classifier — Documentation Set Content

Classifier content for the Phase 5 docs. File names, audience headers, create order and update rules are in `../../shared/customer_docs_pattern.md`. Docs go to `agent_outputs/<project_slug>/docs/`. Doc titles: `# <Project Name> <Doc Name>` (e.g. `# Churn Classifier Runbook`).

Sources for every value: `project_state.md`, `requirements.md`, `business-context.md`, the deployed working copy (`workflow/config.yml`, `workflow/sql/input_features.sql`, `workflow/classify.dig` for schedule and alert email), and the latest validation results. Describe what is deployed, not template defaults. Parameter meanings come from `workflow/README.md` — reword them for the audience instead of copying config syntax.

## 1. `docs/architecture.md` (customer)

- Data flow: source tables → feature SQL (population, features before the cut-off, label after it) → training input → AI Signals classifier (train: search, threshold, evaluation, SHAP; model stored under `model_name`) → prediction input → predictions table → Parent Segment attributes → `classifier_*` diagnostic tables → customer agent and dashboard
- TD workflow project name and entry point (`classify`), schedules (from the `.dig` files), sink database, model name, predictions table
- Output tables (from the README Outputs section) with the predictions table marked as the Parent Segment attribute table
- Output columns the customer will use: `score`, `predicted_label`, `score_bucket`, `threshold_applied`

## 2. `docs/behavior.md` (customer)

Plain English, no YAML. For this customer:

- **Outcome** — what a positive means (the label rule and its window), the population scored, the records excluded
- **Features** — the sources and the kinds of signals used (no column lists unless asked), the history window, and that features are computed only from data before the cut-off
- **Model** — XGBoost or CatBoost in plain words, the tuning search, and how the decision threshold was chosen (the precision / recall preference); details in `ai-signals-guide.md`
- **Scores** — what `score` means (a ranking; inflated by balanced weighting unless calibrated), `predicted_label` (above the threshold), `score_bucket`; how often they refresh
- **Top drivers** — the five strongest features from the latest run and their direction (SHAP), in business words
- **Caveats** — e.g. few positives, stale data (`reference_date`), a time column that is the load time, Parent Segment attributes used as of today
- **Using the scores** — the Parent Segment and the example audiences created in Phase 5 Step 1

## 3. `docs/eval_results.md` (customer)

- Date and session ID of the run validated
- Result of each check in the Validate section of `workflow-setup.md` (pass/fail + the numbers): training rows and positive rate, test AUC-ROC / AUC-PR, precision / recall / F-beta at the threshold, train-vs-test gap, PSI, confusion matrix, entities scored and share predicted positive
- What the metrics mean for the planned action (e.g. "of 100 customers flagged, about N churn")
- That the test metrics describe the model before its final refit — the independent check is scoring a later window and comparing with actual outcomes
- Known limitations and what would improve them

## 4. `docs/runbook.md` (internal)

- Working copy path and TD project name; re-deploy: edit `workflow/config.yml` or `workflow/sql/input_features.sql` → `( cd workflow && tdx wf push -y )` → `tdx wf run <project>.classify` (or `.train` / `.predict`) → validate
- Monitoring: `tdx wf sessions <project>`, `tdx wf timeline <project>.classify --follow`, `tdx wf attempt <id> tasks` / `logs +<task>`
- Schedules and failure-alert recipient (from the `.dig` files); how to change them (edit the `.dig`, re-push)
- Model: the AI Signals classifier, `model_type`, `model_name` (retraining replaces it — use a versioned name for rollback), the API endpoint (region); no secrets to manage
- Retraining guidance: when to retrain (PSI over 0.25, metrics falling, a changed population or feature source) and how to compare two models (separate `model_name`s)
- The troubleshooting tables from `workflow-setup.md` and `ai-signals-guide.md` §7, filtered to what applies to this customer
- The feature SQL as deployed (path) and every change made beyond the config, with dates
- Rebuilding the customer agent after config or SQL changes (`../../shared/customer_agent_pattern.md`)

## 5. `docs/access_ownership.md` (internal)

Standard content per `../../shared/customer_docs_pattern.md`, plus: TD project name, sink database, model name, predictions table, Parent Segment name, customer agent name and path (`.claude/skills/<agent-name>/`).
