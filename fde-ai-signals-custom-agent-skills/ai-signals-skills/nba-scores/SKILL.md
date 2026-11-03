---
name: fde-nba-scores
description: "Sets up NBA (Next Best Action) engagement scores on Treasure Data: a workflow that unions customer activity and writes per-profile next best time, channel and campaign scores plus engagement flags for Parent Segment attributes, then builds the project's NBA agent and dashboard. Use it to start, set up, configure, change, re-run or resume an NBA project and to build or rebuild its agent. Trigger on: set up NBA, start an NBA project, new NBA setup, best time and channel to contact each customer, personalize send time and channel, next best action setup, engagement scores setup, NBA workflow, configure NBA, rebuild the NBA agent, resume NBA setup, NBA runbook. Once the project's NBA agent is installed, questions about the scores and flags go to it."
---

# NBA Engagement Scores

Unions a customer's touchpoint data (web, email, CRM, orders, …), scores every profile on **when** (time of day), **where** (channel) and **what** (campaign type) to engage, and writes one table that is added to a Parent Segment for Audience Studio segmentation.

## How to Start

Read `../shared/playbook.md` — it defines the entry point (new vs. resume), the phase sequence, the name gates and when to read each shared pattern. Follow that flow. Read each referenced file once per conversation: when this skill is invoked again later in the same conversation, the playbook and any reference files already read are still in context — don't read them again; in a new session, read `project_state.md` to pick up. This file provides the NBA-specific context for each phase.

**Setup skill vs. project agent:** this skill sets up, changes and rebuilds the solution; it is the same for every project. Once the project's own agent is installed in `.claude/skills/` (`<project_slug>-agent`), questions about its results are answered by that agent. If this skill is invoked with such a question, read the installed agent's `SKILL.md` and answer by its rules (or tell the user to ask the agent in a new chat); if no agent is installed yet, say so and offer the setup.

**Treasure AI Studio questions:** when the user asks how Treasure AI Studio works — Work Folders, permissions and access, sharing skills or agents, plugins and marketplaces, or where to find Studio documentation — answer from what you know, then share the official documentation: https://docs.treasure.ai/products/ai-studio/overview

## Phase Summary

| Phase | Stage | What happens |
|---|---|---|
| Phase 1 | DEV | Data exploration — list and classify tables, confirm the touchpoint and conversion sources, run discovery queries; draft `business-context.md` and review it with the user |
| Phase 2 | DEV | `requirements.md`, ending with the open business-context questions — then continue without waiting |
| Phase 3 | DEV | Copy the workflow template, configure from Phase 1, push, run, validate; ask which hands-on kit to build |
| Phase 4 | DEV | Hands-on kit (customer agent, dashboard, interim workflow guide + setup walkthrough); apply the customer's requirements, re-push, re-run, re-validate, refresh the kit |
| Phase 5 | PROD — only when you say the model is ready | Parent Segment attributes + example audiences, documentation set, finalize the customer agent, offer the final guides |

---

## NBA-Specific Context by Phase

### Phase 1: Data Exploration

Use `tdx-skills:tdx-basic`. Do not search by table-name patterns.

1. **List every table** in the customer's source database: `tdx tables "<database>.*"`.
2. **Classify each table** from one column query for the whole database — not a `tdx describe` per table:
   `SELECT table_name, column_name, data_type FROM information_schema.columns WHERE table_schema = '<database>' ORDER BY table_name, ordinal_position`

   | Bucket | Criteria |
   |---|---|
   | Activity | Profile ID + timestamp; one row per event or interaction. NBA source candidate |
   | Profile / dimension | One row per customer (master, attributes, tiers). Not a source |
   | System / output | Workflow outputs, logs, ML results, aggregates. Not a source |

3. **Keep only customer-initiated activity**, and mark each kept table as a touchpoint or a conversion source:

   | Include | Exclude |
   |---|---|
   | Pageviews, clicks, searches, add-to-cart | Bot or internal system events |
   | Email opens, clicks, unsubscribes | Email sends, deliveries, bounces |
   | Orders, purchases, reservations (conversions) | Refunds, cancellations |
   | Support tickets, chats, store visits, app sessions, surveys | ETL audit rows, pre-aggregated tables |

4. **Confirm the list with `AskUserQuestion`** — show every activity table with include/exclude, touchpoint/conversion and a one-line reason ("Confirm as listed" / "Change the list"). Do not skip this.
5. **Run the discovery queries** in `references/workflow-setup.md` §1 yourself, all in one shell command (no subagents): one profile query across all confirmed tables (IDs, event-time decision, date range), UTM coverage and values, conversion and add-to-cart patterns, one event-type/status breakdown. Do not investigate caveats further — record them (step 6).
6. **Record** in `project_state.md`: table, profile ID column, event-time column with its evidence (`references/workflow-setup.md` §1 event-time rule), URL/referrer/path columns, UTM coverage, conversion signal, add-to-cart signal, filters needed, first/last event date.
7. **Business context** — playbook Phase 1 "Business context draft and review": copy `project_templates/agent_template/references/business-context.template.md`, answer what steps 1–6 showed (e.g. channels from UTM values and sources, what counts as a conversion and an add-to-cart, test or internal records seen in the filters, time zone of the event timestamps), review it with the user, continue to Phase 2.

**Solution slug:** `nba-scores` — all engagement files live in `agent_outputs/<project_slug>/` (`nba-scores` by default, `<prefix>-nba-scores` with a project prefix — `../shared/local_outputs.md` Step 2).

### Phase 2: Requirements Doc

- Title: `<Project Name> Requirements`
- File: `agent_outputs/<project_slug>/requirements.md`
- Body: `references/requirements_doc.md` (pre-fill from Phase 1)

Tell the user its path in one line (playbook Phase 2 step 5) and continue to Phase 3.

### Phase 3: Minimal Workflow

1. Read `../shared/push_pattern_td_workflows.md` and `references/workflow-setup.md`.
2. Copy `project_templates/workflow_template/` to `agent_outputs/<project_slug>/workflow/` and read its `README.md`.
3. **Name checks** — sink database (default `td_agents`; it must hold no `nba_*` tables from another project) and workflow project (default `nba_eng_prod`; it must not exist yet), both in one command. The first run creates the database if missing (`references/workflow-setup.md` §3).
4. Edit `workflow/config/input_params.yml` in place from Phase 1 findings, following `references/workflow-setup.md` §1–2 (minimal-push rule for anything not yet answered). Set or remove the failure email and decide on the schedule in `workflow/nba_eng_launch.dig`. Do not review the template's SQL or `.dig` files or validate the config locally — the template is pre-validated.
5. **Approve, push, run** — `../shared/push_pattern_td_workflows.md` Step 5: show the config and both names, ask once to push, run and validate (Recommended); then push, tell the user the run takes a few minutes, run, monitor.
6. Validate with `references/workflow-setup.md` §4. If check 4 shows the paid channels or add-to-cart rule do not match, fix the config and re-run before continuing.
7. Update `project_state.md` (names, assumed defaults, validation results).
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
4. Edit the config (and `nba_eng_launch.dig` for schedule/alert email) in `workflow/`, re-push, re-run, re-validate (§4).
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

1. **Union** — every source in `aggregate_metrics_tables` is filtered, mapped to a common column set and unioned; events are sessionized and missing channels back-filled; only the most frequent channels keep their name (others → `others`).
2. **Next Best Time** — events are assigned to four dayparts; each profile gets per-daypart counts and scores and a top daypart.
3. **Next Best Channel** — each channel above a minimum share gets per-profile counts and scores; each profile gets a top channel.
4. **Flags + Next Best Campaign** — seven profile flags from conversion, paid-channel and add-to-cart rules with windows counted from the run date; the campaign type follows cart abandon → recent purchase → recent ad engagement → prospecting.
5. **Combine** — one row per profile in the final table (Parent Segment attribute table).
6. **Dashboard stats** — run config, per-source volumes and score/flag distributions appended to the `nba_dash_*` tables, which the customer agent reads.

## Quick Reference

- **Solution slug:** `nba-scores`
- **Short name (project names):** `NBA Scores` — e.g. `Loyalty NBA Scores`
- **Workflow template:** `project_templates/workflow_template/` → working copy `agent_outputs/<project_slug>/workflow/`
- **Agent template:** `project_templates/agent_template/` → `.claude/skills/<agent-name>/`
- **Default workflow project name:** `nba_eng_prod`
- **Entry point:** `nba_eng_launch.dig`
- **Config file:** `config/input_params.yml`
- **Key outputs:** `nba_combined_metrics_final` (Parent Segment attributes); `nba_dash_stats_summary`, `nba_dash_model_metrics`, `nba_dash_source_tables`
- **Agent name:** `<project_slug>-agent` — `nba-scores-agent` by default
- **Secrets:** none
