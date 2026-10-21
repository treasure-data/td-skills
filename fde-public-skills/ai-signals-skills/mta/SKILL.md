---
name: fde-mta
description: "Sets up MTA (Multi-Touch Attribution) on Treasure Data: a workflow that builds customer journeys from marketing touchpoints and conversions, runs the standard attribution models and the AI Signals Markov and Shapley models, then builds the project's MTA agent and dashboard. Use it to start, set up, configure, change, re-run or resume an MTA project and to build or rebuild its agent. Trigger on: set up MTA, start an MTA project, new MTA setup, measure which channels drive conversions, marketing attribution setup, multi-touch attribution setup, attribution workflow, configure MTA, rebuild the MTA agent, resume MTA setup, MTA runbook, MTA output tables. Once the project's MTA agent is installed, questions about channel contribution and journeys go to it."
---

# MTA (Multi-Touch Attribution)

Combines a customer's touchpoint and conversion tables into journeys, then credits each marketing channel for the conversions with four rule-based models and the AI Signals Markov and Shapley models. The outputs are attribution and journey tables read by a customer agent and dashboard — not Parent Segment attributes.

## How to Start

Read `../shared/playbook.md` — it defines the entry point (new vs. resume), the phase sequence, the name gates and when to read each shared pattern. Follow that flow. Read each referenced file once per conversation: when this skill is invoked again later in the same conversation, the playbook and any reference files already read are still in context — don't read them again; in a new session, read `project_state.md` to pick up. This file provides the MTA-specific context for each phase.

**AI Signals model questions:** when the user asks how the Markov or Shapley model works or credits channels, or wants to try other API parameter values, or change the models' input or output tables, read `references/ai-signals-guide.md` first, and end the answer with the documentation note at its top (AI Signals overview link; no public MTA page yet). It is not needed for the standard setup steps (Phases 1–3) — `references/workflow-setup.md` covers those.

**Exception (`../shared/solution_standard.md` §5):** MTA has no Parent Segment step in Phase 5 — attribution outputs are tables, not profile attributes.

**Setup skill vs. project agent:** this skill sets up, changes and rebuilds the solution; it is the same for every project. Once the project's own agent is installed in `.claude/skills/` (`<project_slug>-agent`), questions about its results are answered by that agent. If this skill is invoked with such a question, read the installed agent's `SKILL.md` and answer by its rules (or tell the user to ask the agent in a new chat); if no agent is installed yet, say so and offer the setup.

**Treasure AI Studio questions:** when the user asks how Treasure AI Studio works — Work Folders, permissions and access, sharing skills or agents, plugins and marketplaces, or where to find Studio documentation — answer from what you know, then share the official documentation: https://docs.treasure.ai/products/ai-studio/overview

## Phase Summary

| Phase | Stage | What happens |
|---|---|---|
| Phase 1 | DEV | Data exploration — list and classify tables, confirm touchpoint and conversion sources, check UTM coverage and conversion candidates; draft `business-context.md` and review it with the user |
| Phase 2 | DEV | `requirements.md`, ending with the open business-context questions — then continue without waiting |
| Phase 3 | DEV | Copy the workflow template, configure from Phase 1, push, run, validate; ask which hands-on kit to build |
| Phase 4 | DEV | Hands-on kit (customer agent, dashboard, interim workflow guide + setup walkthrough); apply the customer's requirements, re-push, re-run, re-validate, refresh the kit |
| Phase 5 | PROD — only when you say the model is ready | Documentation set, finalize the customer agent, offer the final guides (no Parent Segment step) |

---

## MTA-Specific Context by Phase

### Phase 1: Data Exploration

Use `tdx-skills:tdx-basic`. Do not search by table-name patterns.

1. **List every table** in the customer's source database: `tdx tables "<database>.*"`. If several databases could hold the source data (e.g. a sink database of another solution next to the source), confirm the source database with `AskUserQuestion` first.
2. **Classify each table** from one column query for the whole database — not a `tdx describe` per table:
   `SELECT table_name, column_name, data_type FROM information_schema.columns WHERE table_schema = '<database>' ORDER BY table_name, ordinal_position`

   | Bucket | Criteria |
   |---|---|
   | Touchpoint (candidate) | Customer ID + time + one row per marketing interaction: pageviews, email events, sales / CRM activity, ad, SMS or push events |
   | Conversion (candidate) | Customer ID + time + one row per order, application, sign-up or other goal event, often with status and revenue |
   | Profile / system | One row per customer, aggregates, workflow outputs. Not a source |

3. **Pick the sources**: every touchpoint table that represents a marketing channel, plus the conversion table (or the web table's conversion pages), by the source types in `references/workflow-setup.md` §1.
4. **Confirm with `AskUserQuestion`** — first show a markdown table: table, source type, channel it represents, customer ID, time column, include / exclude and a one-line reason, with the proposed conversion definition below it; then ask one short question ("Confirm as listed" / "Change the sources or conversion"). Do not put the table inside the question. Do not skip this.
5. **Run the discovery queries** in `references/workflow-setup.md` §1 yourself, all in one shell command (no subagents): source profiles (size, customers, NULL IDs, event-time decision, date range), UTM coverage of each web table, one breakdown query (UTM values, conversion-looking paths, email event types, order statuses). Do not investigate caveats further — record them (step 6).
6. **Record** in `project_state.md`: each source with its customer ID, event-time column and evidence, URL / referrer / channel / campaign / context columns and filters; the UTM coverage; the conversion definition and value column; customers, touchpoints and conversions per source; first/last event date.
7. **Business context** — playbook Phase 1 "Business context draft and review": copy `project_templates/agent_template/references/business-context.template.md`, answer what steps 1–6 showed (e.g. the channels in the data and how they are tagged, what a conversion is, the email events that count, test accounts or cancelled orders seen), review it with the user, continue to Phase 2.

**Solution slug:** `mta` — all engagement files live in `agent_outputs/<project_slug>/` (`mta` by default, `<prefix>-mta` with a project prefix — `../shared/local_outputs.md` Step 2).

### Phase 2: Requirements Doc

- Title: `<Project Name> Requirements`
- File: `agent_outputs/<project_slug>/requirements.md`
- Body: `references/requirements_doc.md` (pre-fill from Phase 1)

Tell the user its path in one line (playbook Phase 2 step 5) and continue to Phase 3.

### Phase 3: Minimal Workflow

1. Read `../shared/push_pattern_td_workflows.md` and `references/workflow-setup.md`.
2. Copy `project_templates/workflow_template/` to `agent_outputs/<project_slug>/workflow/` and read its `README.md`.
3. **Name checks** — sink database (default `td_agents`; it must hold no `mta_*` or `journey_src_union*` tables from another project — MTA table names are fixed, so a second MTA project needs its own sink database) and workflow project (default `mta_ais`; it must not exist yet), both in one command. The first run creates the database if missing (`references/workflow-setup.md` §3).
4. Edit `workflow/config/input_params.yml` in place from Phase 1 findings, following `references/workflow-setup.md` §1–2 (minimal-push rule for anything not yet answered), with `ml_batch_api_endpoint` set from the `site` in `tdx status` (endpoint table in the template README and `references/ai-signals-guide.md` §3) — it is the only place the endpoint is set; every AI Signals call in `mta_markov_shapley_ai_signals.dig` reads it. Replace the template's example sources with the confirmed ones; keep `sql/union_src_tables/order_events.sql` only if a source uses `query_type: 'custom'` with that name. Leave the schedule and failure email in `workflow/mta_advanced_launch.dig` commented unless the user asks for them. Do not review the template's SQL or `.dig` files or validate the config locally — the template is pre-validated.
5. **Approve, push, run** — `../shared/push_pattern_td_workflows.md` Step 5: show the config and both names, ask once to push, run and validate (Recommended); then push, tell the user the run takes several minutes (the Markov and Shapley models are the longest steps), run, monitor. No secret setup: the AI Signals API key is provided by the AI Signals architecture — never ask the user to set `td.apikey`.
6. Validate with `references/workflow-setup.md` §4. If check 1 shows a missing source or no conversions, or check 5 shows empty model output, fix the config and re-run before continuing.
7. Update `project_state.md` (names, sources, conversion definition, assumed defaults, validation results).
8. **Hands-on kit question** — playbook Phase 3 step 4: summarize the run, then ask whether to build the agent, dashboard and both guides (Recommended), the agent and dashboard only, or nothing yet. Continue with Phase 4 Part A.

### Phase 4: Hands-on Testing and Customer Requirements

**Part A — Hands-on kit** (per the Phase 3 answer, or whenever the user asks):

1. **Agent** `<project_slug>-agent` (asked only if taken) — build and install it: `../shared/customer_agent_pattern.md` Steps 1–3 + `references/agent-setup.md`.
2. Generate the dashboard and run the build checks in `references/agent-setup.md`.
3. If the guides were chosen: fill `workflow-guide.md` and `model-setup-walkthrough.md` as **interim** guides (`../shared/customer_agent_pattern.md` Step 4) and reinstall the agent.
4. Tell the user what was built and that testers can use the agent and dashboard in new chats in this folder; show the **agent files** table from `references/agent-setup.md` and a starter prompt; update `project_state.md`.

**Part B — Customer requirements** (when `requirements.md` comes back; repeat as testing needs):

1. Read `project_state.md`, then the filled `requirements.md`.
2. Map the answers with the table at the end of `references/requirements_doc.md`; choose values with `references/workflow-setup.md` §2.
3. Present the planned changes; wait for approval.
4. Edit the config (and `mta_advanced_launch.dig` for schedule/alert email) in `workflow/`, re-push, re-run, re-validate (§4).
5. Merge the business answers into `business-context.md` (playbook Phase 4 Part B step 4).
6. Refresh the kit if it exists: rebuild the agent if the sink database, customer ID or business rules changed; regenerate the dashboard; refresh the interim guides. Add the round to **Phase 4 iterations** in `project_state.md` and offer another round — not Phase 5 (playbook Phase 4, DEV → PROD).

### Phase 5: Documentation, Final Agent

Only after the user says the model is ready and confirms the move (playbook Phase 4, DEV → PROD). No Parent Segment step.

1. **Documentation** — `../shared/customer_docs_pattern.md` + `references/docs-setup.md` → `docs/`.
2. **Confirm the business context** — playbook Phase 5 step 3.
3. **Finalize the agent** — `../shared/customer_agent_pattern.md` Step 5 + `references/agent-setup.md` (Finalize). If Phase 4 Part A was skipped, build the agent first (Steps 1–3).
4. **Final guides question** — ask whether to update `workflow-guide.md` and `model-setup-walkthrough.md` with the final production setup (Recommended), or create them if they were never built; on yes, `../shared/customer_agent_pattern.md` Step 4 (final) and reinstall.
5. Update `project_state.md` → "complete — engagement live".

---

## How It Works

1. **Union** — each source in `aggregate_metrics_tables` is mapped to one touchpoint format (time, customer, channel from UTM medium or a fixed label, source, campaign, context, conversion flag, value) and combined.
2. **Sessionize** — touchpoints are grouped into sessions by `session_length`; missing channels are filled from the customer's earlier touchpoints.
3. **Build journeys** — each customer's history is split at every conversion; touchpoints more than `max_journey_days` before the conversion are dropped; small channels become `other`.
4. **Standard models** — First Touch, Last Touch, Linear and U-Shaped credit by channel, source, campaign and month (`mta_models_standard`).
5. **AI Signals models** — `mta_markov_shapley_ai_signals.dig` sends the journeys to the AI Signals ml-batch-api (Markov: every journey; Shapley: multi-step, multi-channel journeys): `mta_markov` (removal effect, transition matrix) and `mta_shapley` (fair share across the last touchpoints), in parallel; the `*_final` tables keep every run by `run_time`.
6. **Journey tables** — top conversion paths, Sankey paths and validation tables, which the customer agent and dashboard read.

API parameters, models and outputs: `references/ai-signals-guide.md`.

## Quick Reference

- **Solution slug:** `mta`
- **Short name (project names):** `MTA` — e.g. `Paid Media MTA`
- **Workflow template:** `project_templates/workflow_template/` → working copy `agent_outputs/<project_slug>/workflow/`
- **Agent template:** `project_templates/agent_template/` → `.claude/skills/<agent-name>/`
- **Default workflow project name:** `mta_ais`
- **Entry point:** `mta_advanced_launch.dig`
- **Config file:** `config/input_params.yml`
- **Models:** First Touch, Last Touch, Linear, U-Shaped (SQL); Markov and Shapley via AI Signals only (`mta_markov_shapley_ai_signals.dig`)
- **Key outputs:** `mta_markov_attribution_final`, `mta_markov_transition_final`, `mta_shapley_attribution_final`, `mta_models_standard`, `mta_journeys`, `mta_top_conversion_journeys`, `mta_sankey_journeys`, `journey_src_union_summary`
- **Agent name:** `<project_slug>-agent` — `mta-agent` by default
- **Secrets:** none to set — `${secret:td.apikey}` in `mta_markov_shapley_ai_signals.dig` is provided by the AI Signals architecture
- **API endpoint:** `ml_batch_api_endpoint` in the config — US by default; other regions in the template README and `references/ai-signals-guide.md`
