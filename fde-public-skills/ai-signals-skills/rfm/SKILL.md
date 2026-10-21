---
name: fde-rfm
description: "Sets up RFM (Recency, Frequency, Monetary) customer segmentation on Treasure Data: a workflow that unions customer activity (pageviews, orders, email, sales), scores every profile with the AI Signals RFM model and assigns one of ten segments for Parent Segment attributes, then builds the project's RFM agent and dashboard. Use it to start, set up, configure, change, re-run or resume an RFM project and to build or rebuild its agent. Trigger on: set up RFM, start an RFM project, new RFM setup, segment my customers by value, find our best and at-risk customers, RFM segmentation setup, RFM workflow, configure RFM, rebuild the RFM agent, resume RFM setup, RFM runbook, RFM output tables. Once the project's RFM agent is installed, questions about the results go to it."
---

# RFM Customer Segmentation

Unions a customer's activity data (web, email, CRM, orders, …), scores every profile on **how recently**, **how often** and **how much** they engage and buy, and writes one table with R/F/M scores and a segment per profile, which is added to a Parent Segment for Audience Studio segmentation.

## How to Start

Read `../shared/playbook.md` — it defines the entry point (new vs. resume), the phase sequence, the name gates and when to read each shared pattern. Follow that flow. Read each referenced file once per conversation: when this skill is invoked again later in the same conversation, the playbook and any reference files already read are still in context — don't read them again; in a new session, read `project_state.md` to pick up. This file provides the RFM-specific context for each phase.

**AI Signals model questions:** when the user asks how the RFM model works or scores, or wants to try other API parameter values or change the model's input or output table, read `references/ai-signals-guide.md` first, and end the answer with the public documentation link at its top. It is not needed for the standard setup steps (Phases 1–3) — `references/workflow-setup.md` covers those.

**Setup skill vs. project agent:** this skill sets up, changes and rebuilds the solution; it is the same for every project. Once the project's own agent is installed in `.claude/skills/` (`<project_slug>-agent`), questions about its results are answered by that agent. If this skill is invoked with such a question, read the installed agent's `SKILL.md` and answer by its rules (or tell the user to ask the agent in a new chat); if no agent is installed yet, say so and offer the setup.

**Treasure AI Studio questions:** when the user asks how Treasure AI Studio works — Work Folders, permissions and access, sharing skills or agents, plugins and marketplaces, or where to find Studio documentation — answer from what you know, then share the official documentation: https://docs.treasure.ai/products/ai-studio/overview

## Phase Summary

| Phase | Stage | What happens |
|---|---|---|
| Phase 1 | DEV | Data exploration — list and classify tables, confirm the activity sources and which feed Monetary, run discovery queries; draft `business-context.md` and review it with the user |
| Phase 2 | DEV | `requirements.md`, ending with the open business-context questions — then continue without waiting |
| Phase 3 | DEV | Copy the workflow template, configure from Phase 1, push, run, validate; ask which hands-on kit to build |
| Phase 4 | DEV | Hands-on kit (customer agent, dashboard, interim workflow guide + setup walkthrough); apply the customer's requirements, re-push, re-run, re-validate, refresh the kit |
| Phase 5 | PROD — only when you say the model is ready | Parent Segment attributes + example audiences, documentation set, finalize the customer agent, offer the final guides |

---

## RFM-Specific Context by Phase

### Phase 1: Data Exploration

Use `tdx-skills:tdx-basic`. Do not search by table-name patterns.

1. **List every table** in the customer's source database: `tdx tables "<database>.*"`.
2. **Classify each table** from one column query for the whole database — not a `tdx describe` per table:
   `SELECT table_name, column_name, data_type FROM information_schema.columns WHERE table_schema = '<database>' ORDER BY table_name, ordinal_position`

   | Bucket | Criteria |
   |---|---|
   | Activity | Profile ID + timestamp; one row per event or interaction. RFM source candidate — any meaningful customer touchpoint adds to Recency and Frequency; when in doubt, include it and let the customer decide |
   | Profile / dimension | One row per customer (master, attributes, tiers). Not a source |
   | System / output | Workflow outputs, logs, ML results, aggregates. Not a source |

3. **Keep only customer-initiated activity**, and mark each kept table with the dimensions it feeds (R, F; plus M if it carries a purchase value):

   | Include | Exclude |
   |---|---|
   | Pageviews, clicks, searches | Bot or internal system events |
   | Email opens, clicks, replies, form fills | Email sends, deliveries, bounces |
   | Orders, purchases, services with a value (adds M) | Refunds, cancellations, returns |
   | Sales / CRM interactions, support tickets, store visits, app sessions, reviews | ETL audit rows, pre-aggregated tables |

4. **Confirm the list with `AskUserQuestion`** — first show a markdown table of every activity table with include/exclude, R/F/M contribution and a one-line reason, then ask one short question ("Confirm as listed" / "Change the list"). Do not put the table inside the question. Do not skip this.
5. **Run the discovery queries** in `references/workflow-setup.md` §1 yourself (no subagents): one `UNION ALL` profile query across all confirmed tables, then status / event-type breakdowns as parallel calls. Do not investigate caveats further — record them (step 6).
6. **Record** in `project_state.md`: table, profile ID column, event-time column with its evidence (`references/workflow-setup.md` §1 event-time rule), order value column (monetary sources), context column, filters needed, R/F/M contribution, first/last event date.
7. **Business context** — playbook Phase 1 "Business context draft and review": copy `project_templates/agent_template/references/business-context.template.md`, answer what steps 1–6 showed (e.g. sales channels from the sources, what counts as a purchase from the order statuses, amount column and currency, test or internal records seen in the filters), review it with the user, continue to Phase 2.

**Solution slug:** `rfm` — all engagement files live in `agent_outputs/<project_slug>/` (`rfm` by default, `<prefix>-rfm` with a project prefix — `../shared/local_outputs.md` Step 2).

### Phase 2: Requirements Doc

- Title: `<Project Name> Requirements`
- File: `agent_outputs/<project_slug>/requirements.md`
- Body: `references/requirements_doc.md` (pre-fill from Phase 1)

Tell the user its path in one line (playbook Phase 2 step 5) and continue to Phase 3.

### Phase 3: Minimal Workflow

1. Read `../shared/push_pattern_td_workflows.md` and `references/workflow-setup.md`.
2. Copy `project_templates/workflow_template/` to `agent_outputs/<project_slug>/workflow/` and read its `README.md`.
3. **Name checks** — sink database (default `td_agents`; it must hold no `rfm_*` tables from another project) and workflow project (default `rfm_ais`; it must not exist yet), both in one command. The first run creates the database if missing (`references/workflow-setup.md` §3).
4. Edit `workflow/config/input_params.yml` in place from Phase 1 findings, following `references/workflow-setup.md` §1–2 (minimal-push rule for anything not yet answered). Leave the schedule and failure email in `workflow/rfm_launch.dig` commented unless the user asks for them. Do not review the template's SQL or `.dig` files or validate the config locally — the template is pre-validated.
5. **Approve, push, run** — `../shared/push_pattern_td_workflows.md` Step 5: show the config and both names, ask once to push, run and validate (Recommended); then push, tell the user the run takes a few minutes, run, monitor. No secret setup: the AI Signals API key is provided by the AI Signals architecture — never ask the user to set `td.apikey`.
6. Validate with `references/workflow-setup.md` §4. If check 2 or 4 shows a missing monetary source or a source with no rows, fix the config and re-run before continuing.
7. Update `project_state.md` (names, scoring model, assumed defaults, validation results).
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
4. Edit the config (and `rfm_launch.dig` for schedule/alert email) in `workflow/`, re-push, re-run, re-validate (§4).
5. Merge the business answers into `business-context.md` (playbook Phase 4 Part B step 4).
6. Refresh the kit if it exists: rebuild the agent if the sink database, sources or business rules changed; regenerate the dashboard; refresh the interim guides. Add the round to **Phase 4 iterations** in `project_state.md` and offer another round — not Phase 5 (playbook Phase 4, DEV → PROD).

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

1. **Union** — every source in `aggregate_metrics_tables` is filtered and aggregated to one row per profile per source: last event, number of touchpoints, total spend, days since the last event.
2. **Compute R/F/M** — per profile: Recency = the lowest days-since-last-event across sources; Frequency = the sum of touchpoints; Monetary = the sum of spend (never below 0).
3. **Score** — `rfm_ai_signals.dig` sends the input table to the AI Signals batch API, which assigns 1–4 quartile scores and writes `r_quartile`, `f_quartile`, `m_quartile`, `rfm_quartile` (e.g. `R4F3M2`), `rfm_score`. API parameters, scoring and segment rules: `references/ai-signals-guide.md`.
4. **Segment** — each profile gets one of ten segments (Champions, Loyal Customers, Potential Loyalists, Promising, New Customers, Cannot lose them, Need attention, Hibernating, High Value Sleeping, Lost customers).
5. **Dashboard stats** — per-segment stats and histograms for the latest run, plus run config and segment stats appended every run, which the customer agent reads.

## Quick Reference

- **Solution slug:** `rfm`
- **Short name (project names):** `RFM` — e.g. `Loyalty RFM`
- **Workflow template:** `project_templates/workflow_template/` → working copy `agent_outputs/<project_slug>/workflow/`
- **Agent template:** `project_templates/agent_template/` → `.claude/skills/<agent-name>/`
- **Default workflow project name:** `rfm_ais`
- **Entry point:** `rfm_launch.dig`
- **Config file:** `config/input_params.yml`
- **Scoring model:** AI Signals only (`rfm_ai_signals.dig`) — the template has no other scoring option
- **Key outputs:** `rfm_output_table` (Parent Segment attributes); `rfm_stats`, `rfm_stats_histogram`, `rfm_stats_model_params`, `rfm_stats_daily_agg`
- **Agent name:** `<project_slug>-agent` — `rfm-agent` by default
- **Secrets:** none to set — `${secret:td.apikey}` in `rfm_ai_signals.dig` is provided by the AI Signals architecture
- **API endpoint:** `ml_batch_api_endpoint` in the config — US by default; other regions in `references/ai-signals-guide.md` §3
