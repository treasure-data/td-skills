---
name: fde-nbp
description: "Sets up NBP (Next Best Product) recommendations on Treasure Data: a workflow that reads item-level purchase or interaction data, trains the AI Signals NBP model (ALS, similar-to-latest or popular) and writes the top products and categories per user for Parent Segment attributes, then builds the project's NBP agent and dashboard. Use it to start, set up, configure, change, re-run or resume an NBP project and to build or rebuild its agent. Trigger on: set up NBP, start an NBP project, new NBP setup, recommend products to each customer, personalized product recommendations, cross-sell and upsell recommendations setup, next best product setup, NBP workflow, configure NBP, rebuild the NBP agent, resume NBP setup, NBP runbook, NBP output tables. Once the project's NBP agent is installed, questions about the recommendations go to it."
---

# NBP (Next Best Product)

Reads a customer's user–item interactions (order lines, purchases, item views), trains the AI Signals NBP model, and writes one row per user with the top recommended products and their categories, which is added to a Parent Segment for Audience Studio segmentation and activation.

## How to Start

Read `../shared/playbook.md` — it defines the entry point (new vs. resume), the phase sequence, the name gates and when to read each shared pattern. Follow that flow. Read each referenced file once per conversation: when this skill is invoked again later in the same conversation, the playbook and any reference files already read are still in context — don't read them again; in a new session, read `project_state.md` to pick up. This file provides the NBP-specific context for each phase.

**AI Signals model questions:** when the user asks how the NBP model works or recommends, or wants to try another algorithm or API parameter values, or change the model's input or output table, read `references/ai-signals-guide.md` first, and end the answer with the public documentation link at its top. It is not needed for the standard setup steps (Phases 1–3) — `references/workflow-setup.md` covers those.

**Setup skill vs. project agent:** this skill sets up, changes and rebuilds the solution; it is the same for every project. Once the project's own agent is installed in `.claude/skills/` (`<project_slug>-agent`), questions about its results are answered by that agent. If this skill is invoked with such a question, read the installed agent's `SKILL.md` and answer by its rules (or tell the user to ask the agent in a new chat); if no agent is installed yet, say so and offer the setup.

**Treasure AI Studio questions:** when the user asks how Treasure AI Studio works — Work Folders, permissions and access, sharing skills or agents, plugins and marketplaces, or where to find Studio documentation — answer from what you know, then share the official documentation: https://docs.treasure.ai/products/ai-studio/overview

## Phase Summary

| Phase | Stage | What happens |
|---|---|---|
| Phase 1 | DEV | Data exploration — list and classify tables, confirm the interaction table and item info source, run discovery queries; draft `business-context.md` and review it with the user |
| Phase 2 | DEV | `requirements.md`, ending with the open business-context questions — then continue without waiting |
| Phase 3 | DEV | Copy the workflow template, configure from Phase 1, push, run, validate; ask which hands-on kit to build |
| Phase 4 | DEV | Hands-on kit (customer agent, dashboard, interim workflow guide + setup walkthrough); apply the customer's requirements, re-push, re-run, re-validate, refresh the kit |
| Phase 5 | PROD — only when you say the model is ready | Parent Segment attributes + example audiences, documentation set, finalize the customer agent, offer the final guides |

---

## NBP-Specific Context by Phase

### Phase 1: Data Exploration

Use `tdx-skills:tdx-basic`. Do not search by table-name patterns.

1. **List every table** in the customer's source database: `tdx tables "<database>.*"`.
2. **Classify each table** from one column query for the whole database — not a `tdx describe` per table:
   `SELECT table_name, column_name, data_type FROM information_schema.columns WHERE table_schema = '<database>' ORDER BY table_name, ordinal_position`

   | Bucket | Criteria |
   |---|---|
   | Interaction (candidate) | User ID + item ID + timestamp; one row per user and item (order line, purchase, item view, rating) |
   | Item info | One row per item with name and category (product catalog, item master) |
   | Order-level / profile / system | Orders without an item column, customer profiles, aggregates, workflow outputs. Not a source |

3. **Pick one interaction table and one item info source**: the item-level table with the strongest preference signal (purchase > add-to-cart > view), and the same table for item info when it carries name and category, otherwise the catalog whose item ID matches (`references/workflow-setup.md` §1).
4. **Confirm with `AskUserQuestion`** — first show a markdown table: interaction table, what one row means, user ID, item ID, time column, item name and category columns, item info source, and a one-line reason; then ask one short question ("Confirm as listed" / "Use a different table"). Do not put the table inside the question. Do not skip this.
5. **Run the discovery queries** in `references/workflow-setup.md` §1 yourself, all in one shell command (no subagents): interaction-table profile (size, granularity, NULLs, event-time decision, date range), item info coverage, one breakdown query (event types / statuses, categories, exclusion candidates). Do not investigate caveats further — record them (step 6).
6. **Record** in `project_state.md`: interaction table, user ID, item ID, event-time column with its evidence (`references/workflow-setup.md` §1 event-time rule), item info source and coverage, filter needed (statuses / event types), exclusion candidates, users / items / rows per user, first/last event date.
7. **Business context** — playbook Phase 1 "Business context draft and review": copy `project_templates/agent_template/references/business-context.template.md`, answer what steps 1–6 showed (e.g. what one interaction means, which statuses count as a purchase, the category levels, gift cards or test items seen in the data), review it with the user, continue to Phase 2.

**Solution slug:** `nbp` — all engagement files live in `agent_outputs/<project_slug>/` (`nbp` by default, `<prefix>-nbp` with a project prefix — `../shared/local_outputs.md` Step 2).

### Phase 2: Requirements Doc

- Title: `<Project Name> Requirements`
- File: `agent_outputs/<project_slug>/requirements.md`
- Body: `references/requirements_doc.md` (pre-fill from Phase 1)

Tell the user its path in one line (playbook Phase 2 step 5) and continue to Phase 3.

### Phase 3: Minimal Workflow

1. Read `../shared/push_pattern_td_workflows.md` and `references/workflow-setup.md`.
2. Copy `project_templates/workflow_template/` to `agent_outputs/<project_slug>/workflow/` and read its `README.md`.
3. **Name checks** — sink database (default `td_agents`; it must hold no `nbp_*` tables from another project) and workflow project (default `nbp_ais`; it must not exist yet), both in one command. With a project prefix, also set the config `prefix` to `nbp_<project_prefix>_` (and `user_master_attr_table` to `nbp_<project_prefix>_user_master`) so tables and the AI Signals model name are project-specific. The first run creates the database if missing (`references/workflow-setup.md` §3).
4. Edit `workflow/config/input_params.yml` in place from Phase 1 findings, following `references/workflow-setup.md` §1–2 (minimal-push rule for anything not yet answered), with `ml_batch_api_endpoint` set to the account's region. Leave the schedule and failure email in `workflow/nbp_launch.dig` commented unless the user asks for them. Do not review the template's SQL or `.dig` files or validate the config locally — the template is pre-validated.
5. **Approve, push, run** — `../shared/push_pattern_td_workflows.md` Step 5: show the config and both names, ask once to push, run and validate (Recommended); then push, tell the user the run takes a few minutes (training is the longest step), run, monitor. No secret setup: the AI Signals API key is provided by the AI Signals architecture — never ask the user to set `td.apikey`.
6. Validate with `references/workflow-setup.md` §4. If check 1 or 2 shows an empty user table or a broken item-name join, fix the config and re-run before continuing.
7. Update `project_state.md` (names, prefix, algorithm, assumed defaults, validation results).
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
4. Edit the config (and `nbp_launch.dig` for schedule/alert email) in `workflow/`, re-push, re-run, re-validate (§4).
5. Merge the business answers into `business-context.md` (playbook Phase 4 Part B step 4).
6. Refresh the kit if it exists: rebuild the agent if the sink database, prefix, user table or business rules changed; regenerate the dashboard; refresh the interim guides. Add the round to **Phase 4 iterations** in `project_state.md` and offer another round — not Phase 5 (playbook Phase 4, DEV → PROD).

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

1. **Prepare** — the interaction table is reduced to user, item, item name, category and timestamp, with the time window, `transaction_filter` and optional training exclusions applied.
2. **Train** — `nbp_ai_signals.dig` sends the transaction table to the AI Signals ml-batch-api (`nbp_train`) with the chosen algorithm (`als`, `similar_to_latest` or `popular`); ALS can train on a user sample.
3. **Predict** — the model (`nbp_predict`) writes the top `max_recommended_items` items per user; optional recommendation exclusions remove items afterwards.
4. **Enrich** — item IDs are joined to names and categories and written as one row per user with arrays and per-rank columns (`nbp_1`, `nbp_1_sku`, `nb_category_1`, …) — the Parent Segment attribute table.
5. **Dashboard stats** — coverage, model parameters, recommended-item and category distribution, catalog popularity, item similarity and the optional test-set evaluation, which the customer agent reads.

API parameters, algorithms and outputs: `references/ai-signals-guide.md`.

## Quick Reference

- **Solution slug:** `nbp`
- **Short name (project names):** `NBP` — e.g. `Loyalty NBP`
- **Workflow template:** `project_templates/workflow_template/` → working copy `agent_outputs/<project_slug>/workflow/`
- **Agent template:** `project_templates/agent_template/` → `.claude/skills/<agent-name>/`
- **Default workflow project name:** `nbp_ais`
- **Entry point:** `nbp_launch.dig`
- **Config file:** `config/input_params.yml`
- **Model:** AI Signals only (`nbp_ai_signals.dig`) — the template has no other recommendation engine
- **Key outputs:** `user_master_attr_table` (default `nbp_user_master`, Parent Segment attributes); `<prefix>dash_*` dashboard tables, `<prefix>global_session_filter`
- **Agent name:** `<project_slug>-agent` — `nbp-agent` by default
- **Secrets:** none to set — `${secret:td.apikey}` in `nbp_ai_signals.dig` is provided by the AI Signals architecture
- **API endpoint:** `ml_batch_api_endpoint` in the config — US by default; other regions in the template README and `references/ai-signals-guide.md`
