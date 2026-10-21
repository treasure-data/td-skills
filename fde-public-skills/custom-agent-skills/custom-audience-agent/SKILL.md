---
name: fde-custom-audience-agent
description: "Sets up a customer-specific audience agent on any Treasure AI CDP parent segment: explores attributes, behaviors and existing segments, drafts the business context (key terms, conversion events, product categories, lead definitions, compliance and exclusion rules) and data dictionary, builds the agent into the Work Folder's .claude/skills/, and evaluates it with ten customer-specific test prompts until it is production-ready. Use it to start, set up, update, rebuild or evaluate the audience agent. Trigger on: set up an audience agent, start an audience agent project, an AI analyst for our parent segment, help our marketers analyze customers and build segments, build an audience agent for [customer], custom audience agent setup, parent segment agent setup, update audience agent business context, rebuild the audience agent, run audience agent eval, test the audience agent. Once the project's audience agent is installed, audience and segment analysis questions go to it."
---

# Custom Audience Agent

Fits the audience-agent template to one customer's parent segment — data exploration, business context, build, evaluation — and installs it as the project's own skill. The data already exists in CDP: there is no workflow and no model.

## How to Start

Read `../shared/playbook.md` — it defines the entry point (new vs. resume), the phase sequence, the names and when to read each shared pattern. Follow that flow. Read each referenced file once per conversation; in a new session, read `project_state.md` to pick up. This file provides the audience-agent-specific context for each phase.

**Setup skill vs. project agent:** this skill sets up, changes and rebuilds the solution; it is the same for every project. Once the project's own agent is installed in `.claude/skills/` (`<project_slug>-agent`), questions about its results are answered by that agent. If this skill is invoked with such a question, read the installed agent's `SKILL.md` and answer by its rules (or tell the user to ask the agent in a new chat); if no agent is installed yet, say so and offer the setup.

**Treasure AI Studio questions:** when the user asks how Treasure AI Studio works — Work Folders, permissions and access, sharing skills or agents, plugins and marketplaces, or where to find Studio documentation — answer from what you know, then share the official documentation: https://docs.treasure.ai/products/ai-studio/overview

## Phase Summary

| Phase | What happens |
|---|---|
| Phase 1 | Data exploration — confirm the account, pick the parent segment, explore attributes, behaviors and existing segments (read-only) |
| Phase 2 | Draft `business-context.md` (inferred definitions, categories, compliance rules — flagged for review) and fill `data-dictionary.md`; review with the user; write `requirements.md` for the customer — then continue without waiting |
| Phase 3 | Build the agent from the template and install it to `.claude/skills/<project_slug>-agent/` |
| Phase 4 | Evaluation — 10 customer-specific test prompts in `eval.md`, run on approval (one fresh subagent each), scored, fixed and re-run until ≥ 9/10 pass with every compliance test passing |
| Phase 5 | Production-ready — customer answers merged and confirmed, final eval round, agent finalized, optional handoff docs |

---

## Audience-Specific Context by Phase

### Phase 1: Data Exploration

Use `tdx-skills:tdx-basic` and `tdx-skills:parent-segment-analysis`. Follow `references/discovery.md`:

1. **Account and parent segment** — `tdx auth status`, `tdx ps list`; ask which parent segment with `AskUserQuestion`.
2. **Schema and segments** — `tdx ps desc "<PS>" -o agent_outputs/<project_slug>/schema.json`, `tdx sg list -r …`; read all of `schema.json`.
3. **Attributes** — row count and null % of every `customers` column in one query; top values and numeric ranges.
4. **Behaviors** — rows, profiles and date ranges of every behavior table in one query; the real event time column per table; top values of event-type, status, category and channel columns.
5. **Flags** — PII, consent / opt-out and test-account columns, status and tier columns, conversion-like events, category columns, data that ends in the past (`references/discovery.md` §5).
6. Record the findings in `project_state.md` (parent segment, ID, output database, profiles, tables, event time columns, data range, caveats).

**Solution slug:** `audience` — engagement files in `agent_outputs/<project_slug>/` (`audience` by default, `<prefix>-audience` with a project prefix — `../shared/local_outputs.md` Step 2). A brand or team prefix is recommended when the account has several parent segments.

### Phase 2: Business Context, Data Dictionary, Requirements

1. Copy `project_templates/agent_template/references/business-context.template.md` and `data-dictionary.template.md` to `agent_outputs/<project_slug>/business-context.md` and `data-dictionary.md`; fill `{{project_name}}`, `{{parent_segment}}`, `{{parent_segment_id}}`, `{{output_database}}`, `{{engagement_dir}}`.
2. **Data dictionary** — every `customers` column, every behavior table with its event time column, existing segments, data quality notes — complete, from Phase 1.
3. **Business context** — answer what the data supports, marked `[INFERRED — please confirm]`: channel and category values, draft definitions from status / tier / lifecycle columns, candidate conversion events, draft exclusion rules for PII, consent and test-account columns, the naming convention seen in existing segments. Leave every other question `[NEEDS YOUR INPUT]` — especially the exact lead and conversion definitions and the compliance rules, which only the customer can confirm.
4. Review and requirements doc — playbook Phase 2 steps 2–4, body from `references/requirements_doc.md`. Continue to Phase 3.

### Phase 3: Build the Agent

`../shared/customer_agent_pattern.md` Steps 1–3 and 5 + `references/agent-setup.md` (placeholders, build checks, agent files table). The agent reads the two context files at every session; segment drafts go to `agent_outputs/<project_slug>/segments/`.

### Phase 4: Evaluation

`../shared/eval_pattern.md` + `references/eval-setup.md`:

1. Build the 10 prompts from the category mix in `eval-setup.md` — at least 3 on the customer's definitions, categories and compliance rules, at least 2 Compliance cases — with concrete pass criteria; write `agent_outputs/<project_slug>/eval.md`; show it; ask for permission to run.
2. Run each prompt in its own fresh subagent against `.claude/skills/<agent-name>/` (read-only; segment prompts stop at validate + dry-run).
3. Score, record the round, propose fixes with the failure → fix table, apply on approval, rebuild, re-run — until ≥ 9/10 Pass and every Compliance case Pass.

Run a new round after the customer's `requirements.md` answers are merged (playbook Phase 2, "When the customer returns `requirements.md`"), updating the prompts that test changed definitions first.

### Phase 5: Production-Ready

Playbook Phase 5: confirm the business context (no `[NEEDS YOUR INPUT]` left in Key Terms and Definitions or Exclusion and Compliance Rules — if any remain, say what is missing and do not finalize), final eval round if anything changed, finalize with `references/agent-setup.md` (Finalize), optional docs with `references/docs-setup.md`.

---

## How It Works

1. **Template** — `project_templates/agent_template/SKILL.template.md` is the agent: discovery order, null-ratio rules, Trino SQL rules, segment analysis on top of `tdx sg sql`, segment creation as YAML with validate + dry-run and push only on approval, guardrails.
2. **Context** — two engagement files make it customer-specific: `business-context.md` (meaning and rules) and `data-dictionary.md` (structure). They are copied into the agent's `references/` at every build, so editing them and rebuilding is how the agent learns.
3. **Evaluation** — ten prompts built from those files prove the agent finds the right data, applies the definitions and never breaks a compliance rule; every failure turns into a context or instruction fix.

## Quick Reference

- **Solution slug:** `audience`
- **Short name (project names):** `Audience Agent` — e.g. `Loyalty Audience Agent`
- **Agent template:** `project_templates/agent_template/` → `.claude/skills/<agent-name>/`
- **Agent name:** `<project_slug>-agent` — `audience-agent` by default
- **Data source:** one parent segment — its `customers` and `behavior_*` tables in `cdp_audience_<parent_id>`
- **Engagement files:** `agent_outputs/<project_slug>/` — `project_state.md`, `business-context.md`, `data-dictionary.md`, `schema.json`, `requirements.md`, `eval.md`, `segments/`, `docs/`
- **Production bar:** ≥ 9/10 Pass, every Compliance case Pass
