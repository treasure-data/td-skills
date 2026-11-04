---
name: fde-prob-idu
description: "Sets up probabilistic ID unification on Treasure Data: finds duplicate people missed by deterministic IDU (typos, changed emails or inconsistent phone/address formats). Builds the input table, blocks likely matches with MinHash, clusters them with the AI Signals pidu solution, writes merged clusters and match confidence for Parent Segment attributes, and builds the project agent. Use to start, configure, tune, change, re-run or resume a project or rebuild its agent. Trigger on: set up probabilistic id unification, probabilistic IDU, ai signals prob idu, fuzzy id matching, merge duplicate profiles, find duplicate customers, match customers across systems, unify records after deterministic IDU, tune cluster threshold, prob idu setup, rebuild the prob-idu agent, resume prob-idu setup. Installed project agents answer questions about clusters, match quality and results."
---

# Probabilistic ID Unification

Groups records that belong to the same person but carry different canonical IDs — using fuzzy similarity of email, phone, name or address — with the AI Signals `pidu` solution, and writes one cluster ID plus a match confidence per ID. The result is added to a Parent Segment for Audience Studio and activation, to suppress duplicates and build a single customer view.

## How to Start

Read `../shared/playbook.md` — it defines the entry point (new vs. resume), the phase sequence, the name gates and when to read each shared pattern. Follow that flow. Read each referenced file once per conversation: when this skill is invoked again later in the same conversation, the playbook and any reference files already read are still in context — don't read them again; in a new session, read `project_state.md` to pick up. This file provides the Prob-IDU-specific context for each phase.

**AI Signals model questions:** when the user asks how the clustering works, which API parameters exist, how to tune thresholds or weights, or wants to change the model's input or output tables, read `references/ai-signals-guide.md` first, and end the answer with the public documentation link at its top. It is not needed for the standard setup steps (Phases 1–3) — `references/workflow-setup.md` covers those.

**Exceptions to the standard flow** (`../shared/solution_standard.md` §5): Phase 3 writes the project's input query (`sql/input_table.sql`) in the workflow copy, besides the config; there is no standalone HTML dashboard — the agent answers with in-chat charts from the stats tables, so "dashboard" in the playbook's hands-on kit options means that.

**Setup skill vs. project agent:** this skill sets up, changes and rebuilds the solution; it is the same for every project. Once the project's own agent is installed in `.claude/skills/` (`<project_slug>-agent`), questions about its results are answered by that agent. If this skill is invoked with such a question, read the installed agent's `SKILL.md` and answer by its rules (or tell the user to ask the agent in a new chat); if no agent is installed yet, say so and offer the setup.

**Treasure AI Studio questions:** when the user asks how Treasure AI Studio works — Work Folders, permissions and access, sharing skills or agents, plugins and marketplaces, or where to find Studio documentation — answer from what you know, then share the official documentation: https://docs.treasure.ai/products/ai-studio/overview

## Phase Summary

| Phase | Stage | What happens |
|---|---|---|
| Phase 1 | DEV | Data exploration — find the deterministic-IDU output and the identifier sources, check fill rates and reused values, pick the dedupe columns; draft `business-context.md` and review it with the user |
| Phase 2 | DEV | `requirements.md`, ending with the open business-context questions — then continue without waiting |
| Phase 3 | DEV | Copy the workflow template, write the input query and the config from Phase 1, push, run, validate; ask which hands-on kit to build |
| Phase 4 | DEV | Hands-on kit (customer agent with in-chat charts, interim guides); apply the customer's requirements, tune thresholds, re-push, re-run, re-validate, refresh the kit |
| Phase 5 | PROD — only when you say the unification is ready | Parent Segment attributes + example audiences, documentation set, finalize the customer agent, offer the final guides |

---

## Prob-IDU-Specific Context by Phase

### Phase 1: Data Exploration

Use `tdx-skills:tdx-basic` (and `tdx-skills:parent-segment-analysis` for a Parent Segment). Do not search by table-name patterns.

1. **List every table** in each database the user names: `tdx tables "<database>.*"`. For a Parent Segment, bootstrap `agent_outputs/` first (`../shared/local_outputs.md` Step 1), then `tdx ps desc "<name>" -o agent_outputs/<project_slug>/ps_schema.json` gives its output database.
2. **Classify each table** from one column query covering all databases — not a `tdx describe` per table:
   `SELECT table_schema, table_name, column_name, data_type FROM information_schema.columns WHERE table_schema IN ('<db1>', '<db2>') ORDER BY 1, 2, ordinal_position`

   | Bucket | Criteria |
   |---|---|
   | ID source | One row per canonical ID from deterministic unification (`persistent_id`, `unified_id`, …), or a Parent Segment `customers` table |
   | Identifier source | Profile / contact data per ID with email, phone, name, address or device attributes |
   | System / output | Workflow outputs, ML results, aggregates of other tables. Not a source |

3. **Ask once** with `AskUserQuestion`: has deterministic ID unification run, and what is the canonical ID column? Which person-level question is this for (merge duplicate customers, one view across systems, suppress duplicate sends)? If deterministic unification has not run, tell the user it comes first.
4. **Run the discovery queries** in `references/workflow-setup.md` §1 yourself, all in one shell command (no subagents): ID grain, fill rate per candidate column, most reused values.
5. **Confirm with `AskUserQuestion`** — first show a markdown table: the ID source (table, ID, rows), each dedupe column (source, type email / phone / string, fill rate, proposed weight), with a one-line reason each; then ask one short question ("Confirm as listed" / "Change the columns" / "Change the weights"). Do not put the table inside the question. Do not skip this.
6. **Record** in `project_state.md`: ID source and column, row count, dedupe columns with source, type, fill rate and weight, reused / placeholder values found, test accounts to exclude, join-key differences.
7. **Business context** — playbook Phase 1 "Business context draft and review": copy `project_templates/agent_template/references/business-context.template.md`, answer what steps 1–6 showed (e.g. which systems the IDs come from, what a "same person" means, placeholder values), review it with the user, continue to Phase 2.

**Solution slug:** `prob-idu` — all engagement files live in `agent_outputs/<project_slug>/` (`prob-idu` by default, `<prefix>-prob-idu` with a project prefix — `../shared/local_outputs.md` Step 2).

### Phase 2: Requirements Doc

- Title: `<Project Name> Requirements`
- File: `agent_outputs/<project_slug>/requirements.md`
- Body: `references/requirements_doc.md` (pre-fill from Phase 1)

Tell the user its path in one line (playbook Phase 2 step 5) and continue to Phase 3.

### Phase 3: Minimal Workflow

1. Read `../shared/push_pattern_td_workflows.md`, `references/workflow-setup.md` and `references/dataprep-guide.md`.
2. Copy `project_templates/workflow_template/` to `agent_outputs/<project_slug>/workflow/` and read its `README.md` and `sql/README.md`.
3. **Name checks** — sink database (default `td_agents`; it must hold no `prob_*` tables — they have fixed names; if taken, use `prob_idu_<project_prefix>`) and workflow project (default `prob_idu_ais`; it must not exist yet), both in one command. The first run creates the database if missing.
4. **Write the input query** — rewrite `workflow/sql/input_table.sql` from the Phase 1 findings, following `references/dataprep-guide.md` (output contract in `workflow/sql/README.md`). This is the one template file you write; do not review the other `.dig` files.
5. **Edit `workflow/config/global.yml`** in place: `sink_database`, `source_database`, `source_table`, `id_col`, `dedupe_columns` and `ml_batch_endpoint` for the account's region; template values for blocking and clustering (`references/workflow-setup.md` §2). Leave the schedule and failure email in `workflow/ml_prob_unification_launch.dig` commented unless the user asks for them. Do not validate the config locally — the template is pre-validated.
6. **Approve, push, run** — `../shared/push_pattern_td_workflows.md` Step 5: show the config, the input query and both names, ask once to push, run and validate (Recommended); then push, tell the user the run takes minutes to hours depending on the ID count, run `ml_prob_unification_launch`, monitor. No secret setup: the AI Signals API key is provided by the AI Signals architecture — never ask the user to set `td.apikey`.
7. Validate with `references/workflow-setup.md` §4. If the input query fails, fix the SQL and re-run; if clusters are giant or empty, tune per `references/output-tables-guide.md` §4 before continuing.
8. Update `project_state.md` (names, input query summary, assumed defaults, validation results, sampled cluster quality).
9. **Hands-on kit question** — playbook Phase 3 step 4: summarize the run, then ask whether to build the agent and both guides (Recommended), the agent only, or nothing yet. Continue with Phase 4 Part A.

### Phase 4: Hands-on Testing and Customer Requirements

**Part A — Hands-on kit** (per the Phase 3 answer, or whenever the user asks):

1. **Agent** `<project_slug>-agent` (asked only if taken) — build and install it: `../shared/customer_agent_pattern.md` Steps 1–3 + `references/agent-setup.md`. No dashboard file is generated.
2. If the guides were chosen: fill `workflow-guide.md` and `model-setup-walkthrough.md` as **interim** guides (`../shared/customer_agent_pattern.md` Step 4) and reinstall the agent.
3. Tell the user what was built and that testers can use the agent in new chats in this folder; show the **agent files** table from `references/agent-setup.md` and a starter prompt; update `project_state.md`.

**Part B — Customer requirements and tuning** (when `requirements.md` comes back; repeat as testing needs):

1. Read `project_state.md`, then the filled `requirements.md`.
2. Map the answers with the table at the end of `references/requirements_doc.md`; tune thresholds and weights with `references/output-tables-guide.md` §4 and `references/ai-signals-guide.md`. After 3 or more runs, follow `project_templates/agent_template/references/tuning-advisor.md` to recommend the best thresholds and weights. Always keep `jaccard_similarity_threshold` ≤ `cluster_threshold`.
3. Present the planned changes (input query and config); wait for approval.
4. Edit `sql/input_table.sql` and `config/global.yml` (and `ml_prob_unification_launch.dig` for schedule / alert email) in `workflow/`, re-push, re-run, re-validate (§4). Compare the new session with the previous one in `prob_uni_config_stats_table` and in `project_state.md`.
5. Merge the business answers into `business-context.md` (playbook Phase 4 Part B step 4).
6. Refresh the kit if it exists: rebuild the agent if the sink database, output tables or business rules changed; refresh the interim guides. Add the round to **Phase 4 iterations** in `project_state.md` and offer another round — not Phase 5 (playbook Phase 4, DEV → PROD).

### Phase 5: Parent Segment, Documentation, Final Agent

Only after the user says the unification is ready and confirms the move (playbook Phase 4, DEV → PROD).

1. **Parent Segment** — `../shared/parent_segment_update.md` for the process; `references/parent_segment.md` for the attributes and example audiences — read it only after the user approves the plan.
2. **Documentation** — `../shared/customer_docs_pattern.md` + `references/docs-setup.md` → `docs/`.
3. **Confirm the business context** — playbook Phase 5 step 3.
4. **Finalize the agent** — `../shared/customer_agent_pattern.md` Step 5 + `references/agent-setup.md` (Finalize). If Phase 4 Part A was skipped, build the agent first (Steps 1–3).
5. **Final guides question** — ask whether to update `workflow-guide.md` and `model-setup-walkthrough.md` with the final production setup (Recommended), or create them if they were never built; on yes, `../shared/customer_agent_pattern.md` Step 4 (final) and reinstall.
6. Update `project_state.md` → "complete — engagement live".

---

## How It Works

1. **Input table** — `sql/input_table.sql` builds one row per canonical ID with the dedupe columns.
2. **Blocking** — the dedupe columns are cleaned by type and hashed into character n-grams; MinHash (`hashes`, `keygroups`) puts IDs with enough overlap (`jaccard_similarity_threshold`) into the same block, so only IDs in a block are compared.
3. **Clustering** — the workflow sends the blocking table to the AI Signals ml-batch-api (`pidu`): per-column similarity (email, phone, `fuzzy` / `jarowinkler` string), combined with the column weights; pairs above `cluster_threshold` form clusters; NULLs are soft-imputed when `fill_missing`.
4. **Dedup and merge** — an ID in several clusters keeps its largest; clusters that share an ID are merged into `dedupe_<output_table>` (2+ IDs only) with `avg_cluster_similarity`.
5. **Explain** — the customer agent reads the stats tables and the clusters.

API parameters, tuning and troubleshooting: `references/ai-signals-guide.md`. Table columns and quality indicators: `references/output-tables-guide.md`.

## Quick Reference

- **Solution slug:** `prob-idu`
- **Short name (project names):** `Prob IDU` — e.g. `Customer Prob IDU`
- **Workflow template:** `project_templates/workflow_template/` → working copy `agent_outputs/<project_slug>/workflow/`
- **Agent template:** `project_templates/agent_template/` → `.claude/skills/<agent-name>/`
- **Default workflow project name:** `prob_idu_ais`
- **Entry point:** `ml_prob_unification_launch.dig`
- **Config file:** `config/global.yml`
- **Project code:** `sql/input_table.sql` — rewritten for every project
- **Model:** AI Signals `pidu` solution only (`ml_batch_version` in the config)
- **Key outputs:** `dedupe_<output_table>` (default `dedupe_prob_idu_clusters`, Parent Segment attributes); `prob_model_table_params`, `prob_uni_config_stats_table`, `prob_final_cluster_histogram`, `prob_session_global_filter` (fixed names)
- **Agent name:** `<project_slug>-agent` — `prob-idu-agent` by default
- **Secrets:** none to set — `${secret:td.apikey}` in `ml_prob_ai_signal.dig` is provided by the AI Signals architecture
- **API endpoint:** `ml_batch_endpoint` in the config — US by default; other regions in the template README and `references/ai-signals-guide.md`
