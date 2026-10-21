---
name: fde-classifier
description: "Sets up a binary classification (propensity scoring) model on Treasure Data for any yes/no outcome — lead scoring, churn, conversion, campaign response, upsell, renewal: a workflow that builds the project's feature table, trains the AI Signals classifier (XGBoost or CatBoost with tuning, threshold selection and SHAP) and writes scores for Parent Segment attributes, then builds the project's classifier agent and dashboard. Use it to start, set up, configure, change, re-run or resume a propensity project and to build or rebuild its agent. Trigger on: set up a propensity model, start a propensity project, predict which customers will churn, score leads by likelihood to convert, predict campaign response, build a churn model, build a lead scoring model, classifier setup, classification workflow, configure the classifier, rebuild the classifier agent, resume classifier setup, classifier runbook. Once the project's classifier agent is installed, questions about model performance, drivers and scores go to it."
---

# Classifier (Propensity Scoring)

Trains and scores a binary classification model with the AI Signals classifier — the probability that each entity converts, churns, responds or does whatever the use case defines — from a project-specific feature table, and writes one score per entity that is added to a Parent Segment for Audience Studio segmentation and activation.

## How to Start

Read `../shared/playbook.md` — it defines the entry point (new vs. resume), the phase sequence, the name gates and when to read each shared pattern. Follow that flow. Read each referenced file once per conversation: when this skill is invoked again later in the same conversation, the playbook and any reference files already read are still in context — don't read them again; in a new session, read `project_state.md` to pick up. This file provides the Classifier-specific context for each phase.

**AI Signals model questions:** when the user asks how the classifier trains, tunes, picks the threshold or explains scores, or wants to try another model type or API parameter values, or change the model's input or output tables, read `references/ai-signals-guide.md` first, and end the answer with the public documentation link at its top. It is not needed for the standard setup steps (Phases 1–3) — `references/workflow-setup.md` covers those.

**Exceptions to the standard flow** (`../shared/solution_standard.md` §5): Phase 1 starts by asking the use case, the outcome and where the label lives; Phase 3 writes the project's feature SQL (`sql/input_features.sql`) in the workflow copy — the one template file besides the config that every Classifier deployment edits.

**Setup skill vs. project agent:** this skill sets up, changes and rebuilds the solution; it is the same for every project. Once the project's own agent is installed in `.claude/skills/` (`<project_slug>-agent`), questions about its results are answered by that agent. If this skill is invoked with such a question, read the installed agent's `SKILL.md` and answer by its rules (or tell the user to ask the agent in a new chat); if no agent is installed yet, say so and offer the setup.

**Treasure AI Studio questions:** when the user asks how Treasure AI Studio works — Work Folders, permissions and access, sharing skills or agents, plugins and marketplaces, or where to find Studio documentation — answer from what you know, then share the official documentation: https://docs.treasure.ai/products/ai-studio/overview

## Phase Summary

| Phase | Stage | What happens |
|---|---|---|
| Phase 1 | DEV | Use case and outcome first; data exploration — list and classify tables, confirm the population, label and feature sources, check the label balance; draft `business-context.md` and review it with the user |
| Phase 2 | DEV | `requirements.md`, ending with the open business-context questions — then continue without waiting |
| Phase 3 | DEV | Copy the workflow template, write the feature SQL and the config from Phase 1, push, train, score, validate; ask which hands-on kit to build |
| Phase 4 | DEV | Hands-on kit (customer agent, dashboard, interim workflow guide + setup walkthrough); apply the customer's requirements, re-push, re-run, re-validate, refresh the kit |
| Phase 5 | PROD — only when you say the model is ready | Parent Segment attributes + example audiences, documentation set, finalize the customer agent, offer the final guides |

---

## Classifier-Specific Context by Phase

### Phase 1: Data Exploration

Use `tdx-skills:tdx-basic` (and `tdx-skills:parent-segment-analysis` for a Parent Segment). Do not search by table-name patterns.

1. **Use case first** (the Classifier exception) — one `AskUserQuestion` batch:
   - "What should the model predict?" — options from the common use cases: lead conversion, churn, campaign response, upsell / renewal (Other: describe).
   - "What is one scored entity?" — profile / customer, lead, account.
   - "Where is the data?" — "A Parent Segment (Recommended if one exists)" / "Source databases only". Ask for the Parent Segment or database names next.
   Then, in plain words, note whether the outcome is likely a stored column (a status, a flag) or must be derived (an order after a date, no activity for N days) — the label rule is settled in step 5.
2. **List every table** in each database named: `tdx tables "<database>.*"`. For a Parent Segment, bootstrap `agent_outputs/` first (`../shared/local_outputs.md` Step 1), then `tdx ps desc "<name>" -o agent_outputs/<project_slug>/ps_schema.json` gives its output database.
3. **Classify each table** from one column query covering all databases — not a `tdx describe` per table:
   `SELECT table_schema, table_name, column_name, data_type FROM information_schema.columns WHERE table_schema IN ('<db1>', '<db2>') ORDER BY 1, 2, ordinal_position`

   | Bucket | Criteria |
   |---|---|
   | Population (candidate) | One row per entity with the ID — profiles, leads, accounts, subscriptions; a Parent Segment `customers` table |
   | Label source | Holds the outcome or the data to derive it — orders, conversions, cancellations, statuses; may also be a feature source |
   | Feature source | Behavior with an ID and a timestamp (events, orders, email, web, support) or stable profile attributes |
   | System / output | Workflow outputs, ML results, aggregates of other tables. Not a source |

4. **Pick** the population table and ID, the label rule (table, event or status, window — **First push:** 90 days for conversion / response, 180 for churn by inactivity) and 2–4 feature sources with the strongest signal (`references/workflow-setup.md` §1).
5. **Confirm with `AskUserQuestion`** — first show a markdown table: population (table, ID, eligibility), label rule and window, each feature source (table, what it records, ID, time column), with a one-line reason each; then ask one short question ("Confirm as listed" / "Change the label rule" / "Change the sources"). Do not put the table inside the question. Do not skip this.
6. **Run the discovery queries** in `references/workflow-setup.md` §1 yourself, all in one shell command (no subagents): source profile, label balance at one cut-off, ID overlap. Do not investigate caveats further — record them (step 7). If the label has only one class or very few positives, tell the user before continuing.
7. **Record** in `project_state.md`: use case, entity, population table and ID, label rule and window, positive rate, feature sources with their ID and event-time column (and the evidence), join-key differences, first/last event date, candidate features, leakage suspects (post-outcome columns).
8. **Business context** — playbook Phase 1 "Business context draft and review": copy `project_templates/agent_template/references/business-context.template.md`, answer what steps 1–7 showed (e.g. what the outcome means as an event in the data, who is in the population, the statuses seen, test accounts noticed), review it with the user, continue to Phase 2.

**Solution slug:** `classifier` — all engagement files live in `agent_outputs/<project_slug>/` (`classifier` by default, `<prefix>-classifier` with a project prefix — `../shared/local_outputs.md` Step 2). A use-case prefix (`churn`, `leads`) is recommended — several classifiers often live in one account.

### Phase 2: Requirements Doc

- Title: `<Project Name> Requirements`
- File: `agent_outputs/<project_slug>/requirements.md`
- Body: `references/requirements_doc.md` (pre-fill from Phase 1)

Tell the user its path in one line (playbook Phase 2 step 5) and continue to Phase 3.

### Phase 3: Minimal Workflow

1. Read `../shared/push_pattern_td_workflows.md` and `references/workflow-setup.md`.
2. Copy `project_templates/workflow_template/` to `agent_outputs/<project_slug>/workflow/` and read its `README.md` and `sql/README.md`.
3. **Name checks** — sink database (default `td_agents`; it must hold no `classifier_*` tables — the artifact names are fixed, so one sink database holds one classifier project; if taken, use `classifier_<project_prefix>`) and workflow project (default `classifier_ais`; it must not exist yet), both in one command. Set `model_name` to a project-specific name (`<project_prefix>_<model_type>` with `-` → `_`, or the template default without a prefix) — model names are unique per account. The first run creates the database if missing.
4. **Write the feature SQL** — rewrite `workflow/sql/input_features.sql` from the Phase 1 findings, following `references/workflow-setup.md` §1 (output contract in `workflow/sql/README.md`): population, label after the cut-off, 5–15 safe features before it. This is the one template file you write; do not review the other `.dig` files.
5. **Edit `workflow/config.yml`** in place: `sink_database`, `model_name`, `target_column`, `user_id_column`, `columns_to_drop`, the feature windows (`label_window_days`, `feature_lookback_days`, `reference_date` for data that ends in the past) and `ml_batch_api_endpoint` for the account's region; template values for the training parameters (`references/workflow-setup.md` §2). Leave the schedule and failure email in `workflow/classify.dig` commented unless the user asks for them. Do not validate the config locally — the template is pre-validated.
6. **Approve, push, run** — `../shared/push_pattern_td_workflows.md` Step 5: show the config, the feature SQL and both names, ask once to push, run and validate (Recommended); then push, tell the user the run takes several minutes (training with the tuning search is the longest step), run `classify`, monitor. No secret setup: the AI Signals API key is provided by the AI Signals architecture — never ask the user to set `td.apikey`.
7. Validate with `references/workflow-setup.md` §4. If `data_prep` fails, fix the SQL and re-run; if check 2 suggests leakage (AUC above ~98, one dominant feature), remove the feature and re-run before continuing.
8. Update `project_state.md` (names, model name, feature SQL summary, assumed defaults, validation results).
9. **Hands-on kit question** — playbook Phase 3 step 4: summarize the run, then ask whether to build the agent, dashboard and both guides (Recommended), the agent and dashboard only, or nothing yet. Continue with Phase 4 Part A.

### Phase 4: Hands-on Testing and Customer Requirements

**Part A — Hands-on kit** (per the Phase 3 answer, or whenever the user asks):

1. **Agent** `<project_slug>-agent` (asked only if taken) — build and install it: `../shared/customer_agent_pattern.md` Steps 1–3 + `references/agent-setup.md`.
2. Generate the dashboard and run the build checks in `references/agent-setup.md`.
3. If the guides were chosen: fill `workflow-guide.md` and `model-setup-walkthrough.md` as **interim** guides (`../shared/customer_agent_pattern.md` Step 4) and reinstall the agent.
4. Tell the user what was built and that testers can use the agent and dashboard in new chats in this folder; show the **agent files** table from `references/agent-setup.md` and a starter prompt; update `project_state.md`.

**Part B — Customer requirements** (when `requirements.md` comes back; repeat as testing needs):

1. Read `project_state.md`, then the filled `requirements.md`.
2. Map the answers with the table at the end of `references/requirements_doc.md`; choose values with `references/workflow-setup.md` §2 and the objective table in `references/ai-signals-guide.md` §5.
3. Present the planned changes (SQL and config); wait for approval.
4. Edit `sql/input_features.sql` and `config.yml` (and `classify.dig` for schedule / alert email) in `workflow/`, re-push, re-run, re-validate (§4). Compare the new run with the previous one in `project_state.md`.
5. Merge the business answers into `business-context.md` (playbook Phase 4 Part B step 4).
6. Refresh the kit if it exists: rebuild the agent if the sink database, predictions table, use case or business rules changed; regenerate the dashboard; refresh the interim guides. Add the round to **Phase 4 iterations** in `project_state.md` and offer another round — not Phase 5 (playbook Phase 4, DEV → PROD).

### Phase 5: Parent Segment, Documentation, Final Agent

Only after the user says the model is ready and confirms the move (playbook Phase 4, DEV → PROD).

1. **Parent Segment** — `../shared/parent_segment_update.md` for the process; `references/parent_segment.md` for the attributes and example audiences — read it only after the user approves the plan.
2. **Documentation** — `../shared/customer_docs_pattern.md` + `references/docs-setup.md` → `docs/`.
3. **Confirm the business context** — playbook Phase 5 step 3.
4. **Finalize the agent** — `../shared/customer_agent_pattern.md` Step 5 + `references/agent-setup.md` (Finalize). If Phase 4 Part A was skipped, build the agent first (Steps 1–3).
5. **Final guides question** — ask whether to update `workflow-guide.md` and `model-setup-walkthrough.md` with the final production setup (Recommended), or create them if they were never built; on yes, `../shared/customer_agent_pattern.md` Step 4 (final) and reinstall.
6. Update `project_state.md` → "complete — engagement live".

---

## How It Works

1. **Data prep** — the project's feature SQL builds one row per entity: features from the `feature_lookback_days` before a cut-off, and a 0/1 label from the `label_window_days` after it. Training uses a cut-off `label_window_days` before the run date; scoring uses the run date.
2. **Train** — `train.dig` sends the training table to the AI Signals ml-batch-api (`classifier_train`): stratified split, Optuna search, threshold chosen on out-of-fold predictions, test-split evaluation, SHAP, refit on all rows; the model is stored under `model_name`, the diagnostics go to the `classifier_*` tables.
3. **Predict** — `predict.dig` scores the prediction table with the stored model (`classifier_predict`): `score`, `predicted_label`, `score_bucket`, appended to `pred_output_table`; the latest batch is copied to `<pred_output_table>_latest`, one row per entity — the Parent Segment attribute table.
4. **Explain** — the customer agent and dashboard read the run logs, SHAP tables and scores.

API parameters, objectives, outputs and troubleshooting: `references/ai-signals-guide.md`.

## Quick Reference

- **Solution slug:** `classifier`
- **Short name (project names):** `Classifier` — e.g. `Churn Classifier`
- **Workflow template:** `project_templates/workflow_template/` → working copy `agent_outputs/<project_slug>/workflow/`
- **Agent template:** `project_templates/agent_template/` → `.claude/skills/<agent-name>/`
- **Default workflow project name:** `classifier_ais`
- **Entry point:** `classify.dig` (train, then predict); `train.dig` and `predict.dig` also run on their own
- **Config file:** `config.yml`
- **Project code:** `sql/input_features.sql` — rewritten for every project
- **Model:** AI Signals classifier only (`classifier_train` / `classifier_predict`), `xgboost` or `catboost`
- **Key outputs:** `<pred_output_table>_latest` (default `classifier_predictions_latest`, Parent Segment attributes); `pred_output_table` (scores per run); `classifier_*` training tables (fixed names)
- **Agent name:** `<project_slug>-agent` — `classifier-agent` by default
- **Secrets:** none to set — `${secret:td.apikey}` in `train.dig` / `predict.dig` is provided by the AI Signals architecture
- **API endpoint:** `ml_batch_api_endpoint` in the config — US by default; other regions in the template README and `references/ai-signals-guide.md`
