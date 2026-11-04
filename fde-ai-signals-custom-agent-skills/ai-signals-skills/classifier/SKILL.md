---
name: fde-classifier
description: "Sets up AI Signals binary classification (propensity scoring) on Treasure Data for churn, lead scoring, conversion, campaign response, upsell or renewal. Builds leakage-safe stacked training snapshots, trains XGBoost/CatBoost with tuning, threshold selection and SHAP, writes Parent Segment scores, and builds the project agent and dashboard. Use to start, configure, change, re-run or resume a project or rebuild its agent. Trigger on: set up a propensity model, start a propensity project, ai signals propensity model, propensity model, propensity scoring, how does propensity model work, predict which customers will churn, score leads by likelihood to convert, predict campaign response, build a churn model, build a lead scoring model, classifier setup, classification workflow, configure the classifier, classifier data prep, training snapshots, classifier output tables, rebuild the classifier agent, resume classifier setup, classifier runbook. Project agents answer performance, drivers and scores questions."
---

# Classifier (Propensity Scoring)

Trains and scores a binary model with the AI Signals classifier from a project-specific feature table, and writes one score per entity to a Parent Segment for segmentation and activation.

## How to Start

Read `../shared/playbook.md` and follow its flow (entry point, phases, name gates, shared patterns). Read each referenced file once per conversation; in a new session, resume from `project_state.md`. This file adds the Classifier-specific context.

| Question or task | Read |
|---|---|
| Label, horizon, population, snapshots, feature SQL patterns, input checks, schedules | `references/dataprep-guide.md` |
| Config values from the data, deploy, output checks, troubleshooting | `references/workflow-setup.md` |
| How the model trains / tunes / picks the threshold, API parameters, other model types | `references/ai-signals-guide.md` — end the answer with its public docs link |
| Columns of an output table, queries that read it | `references/output-tables-guide.md` |
| **Setup skill vs. project agent** — results of an installed project (performance, drivers, scores) | This skill only sets up and changes; results go to the installed `<project_slug>-agent` — read its `SKILL.md` and answer by its rules, or tell the user to ask it in a new chat. No agent yet → say so and offer the setup |
| How Treasure AI Studio works (Work Folders, access, sharing, plugins) | Answer from what you know, then share https://docs.treasure.ai/products/ai-studio/overview |

**Exceptions to the standard flow** (`../shared/solution_standard.md` §5): Phase 1 asks the use case first; Phase 3 writes the project's feature SQL (`sql/input_features.sql`) besides the config.

## Phase Summary

| Phase | Stage | What happens |
|---|---|---|
| Phase 1 | DEV | Use case first; list and classify tables; confirm population, label, windows, snapshots and feature sources; check label balance and history; draft `business-context.md` |
| Phase 2 | DEV | `requirements.md` with the open business-context questions — continue without waiting |
| Phase 3 | DEV | Copy the template, write the feature SQL and config, push, train, score, validate; ask which hands-on kit to build |
| Phase 4 | DEV | Hands-on kit (agent, dashboard, interim guides); apply the customer's requirements in rounds |
| Phase 5 | PROD — only when the user says the model is ready | Parent Segment attributes + example audiences, docs, final agent, final guides |

---

## Classifier-Specific Context by Phase

### Phase 1: Data Exploration

Use `tdx-skills:tdx-basic` (`tdx-skills:parent-segment-analysis` for a Parent Segment). Never search by table-name patterns.

1. **Use case** — one `AskUserQuestion` batch:
   - What to predict: lead conversion / churn / campaign response / upsell or renewal (Other).
   - Scored entity: profile / lead / account.
   - Data location: Parent Segment (Recommended if one exists) / source databases — then ask the names.
   - Note whether the outcome is a stored column or must be derived (settled in step 5).
2. **List tables** — `tdx tables "<database>.*"` per database. Parent Segment: bootstrap `agent_outputs/` (`../shared/local_outputs.md` Step 1), then `tdx ps desc "<name>" -o agent_outputs/<project_slug>/ps_schema.json`.
3. **Classify** from one column query (not `tdx describe` per table):
   `SELECT table_schema, table_name, column_name, data_type FROM information_schema.columns WHERE table_schema IN ('<db1>', '<db2>') ORDER BY 1, 2, ordinal_position`

   | Bucket | Criteria |
   |---|---|
   | Population | One row per entity with the ID — profiles, leads, accounts, subscriptions, Parent Segment `customers` |
   | Label source | Holds the outcome or the data to derive it — orders, conversions, cancellations, statuses |
   | Feature source | Behavior with ID + timestamp (events, orders, email, web, support) or stable profile attributes |
   | System / output | Workflow outputs, ML results, aggregates. Not a source |

4. **Pick** (`references/dataprep-guide.md` §1–§2):

   | Decision | First push |
   |---|---|
   | Population table, ID, eligibility | Per use case (§1 label templates) |
   | Label rule + horizon | 90 days conversion / response, 180 churn by inactivity |
   | Observation window | 365 days |
   | Snapshots + spacing | Chosen per use case, label balance and history (§2 "Choosing the snapshots"), with a one-line reason; must pass the history check |
   | Feature sources | 2–4 with the strongest signal |

5. **Confirm** — show a markdown table (population, label rule + horizon, window, snapshots, each source with ID and time column, one-line reason each), then one `AskUserQuestion`: Confirm as listed / Change the label rule / Change the sources. Never skip.
6. **Discovery queries** — `references/workflow-setup.md` §1, all in one shell command, no subagents. One class or very few positives → tell the user. Record caveats; don't investigate further.
7. **Record** in `project_state.md`: use case, entity, population + ID, label rule, horizon, window, snapshots + reason, history check, positive rate, sources (ID, time column), join-key differences, first / last event date, candidate features, leakage suspects.
8. **Business context** — playbook Phase 1: fill `project_templates/agent_template/references/business-context.template.md` from steps 1–7, review with the user, continue.

**Solution slug:** `classifier` → `agent_outputs/<project_slug>/` (`<prefix>-classifier` with a prefix — `../shared/local_outputs.md` Step 2). Recommend a use-case prefix (`churn`, `leads`); accounts often have several classifiers.

### Phase 2: Requirements Doc

- File: `agent_outputs/<project_slug>/requirements.md`, title `<Project Name> Requirements`
- Body: `references/requirements_doc.md`, pre-filled from Phase 1
- Tell the user the path in one line and continue to Phase 3.

### Phase 3: Minimal Workflow

1. Read `../shared/push_pattern_td_workflows.md` and `references/workflow-setup.md`.
2. Copy `project_templates/workflow_template/` → `agent_outputs/<project_slug>/workflow/`; read its `README.md` and `sql/README.md`.
3. **Name checks** (one command):
   - Sink database: default `td_agents`, must hold no `classifier_*` tables (fixed names = one project per database); taken → `classifier_<project_prefix>`. Created by the first run.
   - Workflow project: default `classifier_ais`, must not exist.
   - `model_name`: `<project_prefix>_<model_type>` (`-` → `_`) — unique per account.
4. **Feature SQL** — rewrite `workflow/sql/input_features.sql`: cutoffs → population → feature CTEs → label → final SELECT, 5–15 safe features (`references/workflow-setup.md` §1, patterns in `references/dataprep-guide.md` §4). Don't review the `.dig` files.
5. **Config** — edit `workflow/config.yml` in place: `sink_database`, `model_name`, `target_column`, `user_id_column`, `columns_to_drop`, `label_window_days`, `feature_lookback_days`, `n_train_snapshots`, `spacing_days`, `reference_date` (stale data), `ml_batch_api_endpoint` (region). Template values for training (`workflow-setup.md` §2). Schedule and alert email stay commented unless asked. No local validation.
6. **Approve, push, run** — `../shared/push_pattern_td_workflows.md` Step 5: show config, SQL and names; ask once; push; run `classify` (several minutes); monitor. Never ask for `td.apikey` — AI Signals provides it.
7. **Validate** — `references/workflow-setup.md` §4 (+ `dataprep-guide.md` §5 if check 1 looks off). `data_prep` fails → fix the SQL, re-run. Leakage (AUC above ~0.98, one dominant feature) → drop the feature, re-run.
8. Update `project_state.md`: names, model name, SQL summary, assumed defaults, validation results.
9. **Hands-on kit question** (playbook Phase 3 step 4): agent + dashboard + guides (Recommended) / agent + dashboard / not now.

### Phase 4: Hands-on Testing and Customer Requirements

**Part A — Hands-on kit** (per the Phase 3 answer, or on request):

1. Build and install `<project_slug>-agent`: `../shared/customer_agent_pattern.md` Steps 1–3 + `references/agent-setup.md`.
2. Generate the dashboard; run the build checks in `references/agent-setup.md`.
3. Guides chosen → fill `workflow-guide.md` and `model-setup-walkthrough.md` as **interim** (`customer_agent_pattern.md` Step 4); reinstall.
4. Show the **agent files** table (`agent-setup.md`) and a starter prompt; update `project_state.md`.

**Part B — Customer requirements** (when `requirements.md` returns; repeat as needed):

1. Read `project_state.md`, then the filled `requirements.md`.
2. Map answers with the table in `references/requirements_doc.md`; values from `workflow-setup.md` §2, `dataprep-guide.md` (label, population, snapshots §2, schedules §6), `ai-signals-guide.md` §5 (objective).
3. Present planned SQL and config changes; wait for approval.
4. Edit `workflow/` (`sql/input_features.sql`, `config.yml`, schedules in `train.dig` / `predict.dig` or `classify.dig`), re-push, re-run, re-validate; compare with the previous run in `project_state.md`.
5. Merge business answers into `business-context.md`.
6. Refresh the kit: rebuild the agent if the sink database, predictions table, use case or business rules changed; regenerate the dashboard and interim guides. Log the round under **Phase 4 iterations**; offer another round — never Phase 5.

### Phase 5: Parent Segment, Documentation, Final Agent

Only after the user says the model is ready and confirms the move.

1. **Parent Segment** — process: `../shared/parent_segment_update.md`; attributes and audiences: `references/parent_segment.md` (read after the plan is approved).
2. **Docs** — `../shared/customer_docs_pattern.md` + `references/docs-setup.md` → `docs/`. Customer docs in business language for non-technical readers (`docs-setup.md` writing style).
3. **Confirm the business context** — playbook Phase 5 step 3.
4. **Finalize the agent** — `customer_agent_pattern.md` Step 5 + `agent-setup.md` (Finalize); build it first if Part A was skipped.
5. **Final guides question** — update (or create) both guides with the production setup (Recommended); on yes, `customer_agent_pattern.md` Step 4 (final) and reinstall.
6. `project_state.md` → "complete — engagement live".

---

## How It Works

| Step | What happens |
|---|---|
| Data prep | `sql/input_features.sql` builds one row per entity per cutoff: features from the `feature_lookback_days` before it, a 0/1 label from the `label_window_days` after it. Training: `n_train_snapshots` cutoffs `spacing_days` apart, every label fully observed. Scoring: one cutoff = run date |
| Train | `classifier_train`: stratified split, Optuna search, threshold on out-of-fold predictions, test evaluation, SHAP, refit on all rows; model stored under `model_name`; diagnostics in `classifier_*` |
| Predict | `classifier_predict`: `score`, `predicted_label`, `score_bucket` appended to `pred_output_table`; latest batch → `<pred_output_table>_latest` (Parent Segment table) |
| Explain | The project agent and dashboard read the run logs, SHAP tables and scores |

## Quick Reference

| Item | Value |
|---|---|
| Solution slug / short name | `classifier` / `Classifier` (e.g. `Churn Classifier`) |
| Workflow template | `project_templates/workflow_template/` → `agent_outputs/<project_slug>/workflow/` |
| Agent template | `project_templates/agent_template/` → `.claude/skills/<agent-name>/` |
| Workflow project / entry point | `classifier_ais` / `classify.dig` (train → predict); `train.dig`, `predict.dig` run alone |
| Config / project code | `config.yml` / `sql/input_features.sql` (rewritten per project) |
| Model | AI Signals `classifier_train` / `classifier_predict`, `xgboost` or `catboost` |
| Key outputs | `<pred_output_table>_latest` (Parent Segment), `pred_output_table` (per run), `classifier_*` (fixed names) |
| Agent name | `<project_slug>-agent` (`classifier-agent` by default) |
| Secrets | None — `${secret:td.apikey}` is provided by AI Signals |
| API endpoint | `ml_batch_api_endpoint` — US default; regions in the template README |
