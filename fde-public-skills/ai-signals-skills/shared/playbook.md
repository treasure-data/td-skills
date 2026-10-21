# ML Solution Playbook

This plugin is an **orchestrator of templates**. Each solution ships read-only blueprints in `<solution_dir>/project_templates/`:

- `workflow_template/` — the TD workflow (single source of truth: its `README.md` explains it; its `config/` YAML defines the parameters)
- `agent_template/` — the customer analysis agent blueprint

During an engagement you copy those templates into the user's working directory (a Treasure AI Studio Work Folder or a local project folder) and customize the **copies**. The plugin itself is never modified.

| Layer | Location | Contents |
|---|---|---|
| Framework (read-only) | this plugin | instructions + templates |
| Engagement workspace | `agent_outputs/<project_slug>/` | workflow copy, project state, business context, requirements, docs, dashboards |
| Customer agent | `.claude/skills/<agent-name>/` | the project's analysis skill, built from `agent_template/` |

`<solution_dir>` is the folder containing the solution's `SKILL.md` — resolve it to an absolute path from the skill's base directory before copying anything.

## Shared files

| File | What it contains |
|------|-----------------|
| `local_outputs.md` | Workspace layout, slug rules, git-ignore bootstrap, template-copy rule, what may / may not be stored |
| `project_state.md` | Cross-session context store — format and update rules |
| `push_pattern_td_workflows.md` | Copy `workflow_template/`, sink-database gate, config edit, project-name gate, `tdx wf push`, run, monitor, validate |
| `customer_agent_pattern.md` | Build the customer agent from `agent_template/`: name gate, placeholders, hands-on build vs. final, interim and final guides, install, verify |
| `parent_segment_update.md` | Phase 5 Step 1 — Parent Segment attributes + example audiences ("how"; the solution's `references/parent_segment.md` is the "what") |
| `customer_docs_pattern.md` | Phase 5 — documentation set written to `docs/` |

## Default-then-confirm names

These names are proposed with a default and confirmed with `AskUserQuestion` — the project name on its own at the start, the two TD names together in the Phase 3 push-run-validate question. Record each answer in `project_state.md` and reuse it everywhere afterwards.

Before asking, check the default is free — the account may already hold another project of the same solution. If it is taken, say so and recommend a project-specific name instead, built from the project prefix with `-` → `_` (prefix `loyalty`: project `rfm_ais` → `rfm_ais_loyalty`; sink database `td_agents` → `rfm_loyalty`), so one project never overwrites another's tables or workflow. If the project has no prefix, ask the user for one (team or use case). The checks are in `local_outputs.md` (Step 2), `push_pattern_td_workflows.md` (Step 3a, Step 5) and `customer_agent_pattern.md` (Step 1).

| Name | Asked | Default |
|---|---|---|
| Project name | Entry Point, before anything is written | no prefix — `<project_slug>` = `<solution_slug>` (`local_outputs.md` Step 2) |
| Sink database | Phase 3 — checked before writing the config, confirmed in the push-run-validate question | `td_agents` |
| Workflow project name | Phase 3 — same question, before the first push | the template's default (solution Quick Reference) |
| Customer agent name | not asked — derived from the project name; asked only if taken (`customer_agent_pattern.md` Step 1) | `<project_slug>-agent` |

## Entry Point

**First reply — before any question or tool call:** introduce the setup in two or three sentences, then show the solution's Phase Summary table (solution `SKILL.md`) with its **Stage** column. For example: "I'd be happy to help you set up <Solution> step by step. Below is the plan. Phases 1–4 are **DEV**: we iterate on the model, the agent, the dashboard and the guides until you are confident in the results. Phase 5 is **PROD**: schedule, Parent Segment and audiences — we only start it when you say the model is ready. After each phase I update `project_state.md`, so we can resume later exactly where we left off." Then ask: **"Is this a new setup, or are you resuming an existing one?"**

- **New:** ask for the project name first (`local_outputs.md` Step 2) with `AskUserQuestion`: "Use the default `<solution_slug>` — agent `<solution_slug>-agent` (Recommended)" / "Add a project prefix" (a team or use case, e.g. `loyalty` → `loyalty-<solution_slug>-agent`, so several people can build their own models side by side). Recommend a prefix instead if the default is already used here. State the resulting project slug and agent name once and use them everywhere afterwards. Then ask once with `AskUserQuestion` whether to start: "Start Phase 1 (Recommended)" / "Change something first" / "Not now". "Not now" writes nothing; "Change something first" adjusts the plan, then asks again.
- **Resume:** list `agent_outputs/*/project_state.md` and keep those whose **Solution** is this one (see `project_state.md`), confirm the project, read it — "Current phase" + "Next Action" say where to pick up.

| User says | Likely phase |
|---|---|
| "the customer filled out their requirements" | Phase 4 |
| "push a fresh workflow for [project]" | Phase 1 → Phase 3 |
| "create the requirements doc" | Phase 2 |
| "build / update the customer agent", "build the dashboard", "write the workflow guide / setup walkthrough" | Phase 4 (hands-on kit) or Phase 5 (final) |
| "add the scores to the parent segment" / "create example audiences" | Phase 5 Step 1 |
| "write the customer facing / handoff docs" | Phase 5 |

When in doubt, **read `project_state.md` first**.

## Workflow Sequence

Rules for every phase:

- **Read files just in time.** In each phase, read only the files that phase names (here and in the solution `SKILL.md`). Do not open later-phase files early — for example, the requirements doc body is not needed in Phase 1; what to record there is listed in the solution's Phase 1 steps.
- **Update `project_state.md` after every phase, every part of a phase (Phase 4 Part A / Part B, each Phase 5 step) and every iteration round** — rewrite its header (Current phase, Next Action, Last updated) and log what was done, so an interrupted session can always resume from the file.
- **Keep moving.** After each step, continue straight to the next step of the same phase. At the end of a phase, give a short summary and ask with `AskUserQuestion` whether to continue, with the next phase as the `(Recommended)` option — except at the end of Phase 4 (see Phase 4: DEV → PROD). Never end a turn without either continuing or asking.
- **Phases 1–3 are a first pass.** Their goal is a validated first workflow run, fast. Use safe defaults, record every data caveat and assumption in `project_state.md` as "default — confirm in requirements", and do not investigate further unless the user asks or a validation check fails. A "basic" or "quick" request means defaults and no extra analysis — never skipping steps or the end-of-phase question.
- **No subagents, in any phase.** Do every step yourself — discovery, config, validation, agent build, guides — unless the user asks for a subagent. Background helpers leave the user looking at a silent chat and repeat work.
- **One command for independent work.** Separate tool calls can run one after another even when sent together, each with its own overhead, so never rely on parallel tool calls for speed. Combine the same check across tables into one query (`UNION ALL`, `information_schema`); when several commands are still needed, run them in one shell command (`cmd1 & cmd2 & wait`).
- **No extra checks or helper files.** The templates are pre-validated: do not read their SQL or `.dig` files to check or review them (filling the guides may read them for content), validate the copied config locally, run dry runs, or write helper scripts (`.py`, `.sh`, …) — use only the queries and checks the phase names. Investigate files only when a command fails.
- **Say when something takes a while.** Before a step that takes more than a minute (workflow run, agent build, guides), tell the user what is running, that it takes a few minutes, and that you'll report back when it's done — so a quiet chat never looks stuck.

### Phase 1: Data Exploration

> **The solution SKILL defines the discovery steps** — which databases to explore, how to classify tables, which columns to capture. Its last step is the business context draft below.

**Business context draft and review** (end of Phase 1, after discovery):

`business-context.md` holds what the customer knows about their business and the model can't learn from the data — business jargon, definitions (lead, high-value customer, conversion), buying cycles, data edge cases, goals and exclusion rules. It is the customer agent's main source of business meaning. How the model works does **not** belong here (that is in the solution's model guide, the agent's `data-dictionary.md` and the guides).

1. `local_outputs.md` Step 1 — bootstrap `agent_outputs/`; `project_state.md` — create the state file (if not already there).
2. Copy `<solution_dir>/project_templates/agent_template/references/business-context.template.md` to `agent_outputs/<project_slug>/business-context.md`, fill `{{project_name}}`, and follow its authoring rules: answer what the Phase 1 findings support with confidence, marked `[INFERRED — please confirm]`; leave every other question under its section marked `[NEEDS YOUR INPUT]`. Do not run extra queries for it.
3. Show the user a short summary — one line per section: what was inferred, and the open questions — then ask with `AskUserQuestion`: "Looks right — continue (Recommended)" / "I'll add context now" / "Change assumptions". "Looks right" confirms the inferences: remove their `[INFERRED — please confirm]` markers. Write any other answer into the file (answers replace inferences; remove the marker of each answered item). Use only the two standard markers, and keep the file to business knowledge — notes on how this setup is run (test scope, resources to leave alone) go in `project_state.md` and record "Business context: drafted / reviewed `<date>`" in `project_state.md`, with Current phase → "2 — requirements doc" and Next Action "Write the requirements doc".
4. Continue to Phase 2 — questions still marked `[NEEDS YOUR INPUT]` go to the customer through the requirements doc.

### Phase 2: Customer Requirements Doc

1. If not done in Phase 1: `local_outputs.md` Step 1 (bootstrap `agent_outputs/`) and `project_state.md` (create the state file).
2. If `agent_outputs/<project_slug>/requirements.md` already exists, read it and ask whether it is the customer's filled version — if yes, go to Phase 4.
3. Write `requirements.md` there from the solution's `references/requirements_doc.md` (title `<Project Name> Requirements`). It must read as a clean customer questionnaire — no "generated by" notes or discovery details (those belong in `project_state.md`).
4. End it with a **Business context** section: every question still marked `[NEEDS YOUR INPUT]` in `business-context.md`, except those the doc's own sections already ask, each with `> _Your answer:_`. Omit the section if none are left.
5. Tell the user in one line, as soon as the file is written: its path, that it is plain markdown to share with the customer in any format, and that the filled version must be saved back to the same path. Then update `project_state.md`: requirements doc "sent `<date>`", Current phase → "3 — minimal workflow", Next Action "Push and validate the first workflow run".
6. **Continue to Phase 3** — do not wait for the answers.

### Phase 3: Minimal Workflow

1. `push_pattern_td_workflows.md` + the solution's `references/workflow-setup.md` — copy `workflow_template/`, read its `README.md`, check the sink database and workflow project names, write the config from Phase 1 findings + any answers (safe defaults otherwise). Then show the config and names and ask one question — push, run and validate (Recommended) — and do all three on yes (`push_pattern_td_workflows.md` Step 5).
2. Validate the outputs per the "Validate" section of `references/workflow-setup.md`.
3. Update `project_state.md` (Current phase → "4 — hands-on kit and requirements").
4. **Offer the hands-on kit** — summarize the validated run, then ask with `AskUserQuestion` what to build now for Phase 4 testing:
   - "Agent, dashboard and both guides (Recommended)" — the customer agent, its HTML dashboard, `workflow-guide.md` and `model-setup-walkthrough.md`
   - "Agent and dashboard only"
   - "Not now — wait for the customer's requirements"

   Record the answer in `project_state.md` and continue with Phase 4 Part A (or stop at "Not now" with Next Action "Phase 4 — hands-on kit or requirements").

### Phase 4: Hands-on Testing and Customer Requirements

The hands-on kit lets non-technical users and the customer test the model and see how it works while the setup is iterated toward production.

**Part A — Hands-on kit** (right after Phase 3, or whenever the user asks for it):

1. `customer_agent_pattern.md` Steps 1–3 + the solution's `references/agent-setup.md` — confirm the agent name, build and install the customer agent.
2. Generate the dashboard once with the agent's dashboard command (`references/agent-setup.md` build checks). The bundled dashboard is pre-validated — check only that the file was written; no screenshots, QA scripts or edits.
3. If the guides were chosen: `customer_agent_pattern.md` Step 4 (**interim** guides) — fill `workflow-guide.md` and `model-setup-walkthrough.md` from the engagement files so far, marked interim, and reinstall the agent.
4. Tell the user what was built and how to use it: the agent is available in new chats in this folder; show the solution's **agent files** table (`references/agent-setup.md`) — what each file is for and a question it answers — and a starter prompt. Then update `project_state.md`: hands-on kit built `<date>` (files), Next Action "Phase 4 Part B — apply the customer's requirements when they return".

**Part B — Update from customer requirements** (usually a new session — **read `project_state.md` first**):

1. Read the filled `requirements.md` (if the customer returned it elsewhere, ask the user to save it to `agent_outputs/<project_slug>/requirements.md` first).
2. Map the answers with the mapping table at the end of the solution's `references/requirements_doc.md`, then present the planned config changes; wait for approval.
3. Edit the config in the workflow copy (`references/workflow-setup.md`), re-push, re-run, re-validate.
4. Merge the business answers (use case, Business context section, definitions in any answer) into `business-context.md` — customer answers replace inferences; remove the marker of each answered item.
5. Refresh the hands-on kit if it exists: rebuild the agent if the sink database, output tables or business context changed; regenerate the dashboard; refresh the interim guides (`customer_agent_pattern.md` Step 4).
6. Add the round to the **Phase 4 iterations** list in `project_state.md` (date, what changed, result) and set Next Action (another round, more testing, or "Phase 5 when the user says the model is ready").

Repeat Part B as often as the testing needs. After each round, offer another round or more testing with the kit — not Phase 5.

**DEV → PROD.** Phase 5 starts only when the user says the model is ready for production (schedule, Parent Segment, audiences). Never offer it before; it is normal for Phase 4 to take several rounds. When the user asks for it, summarize the current setup from `project_state.md` (sources, filters, scoring model, latest validation, iteration rounds, open questions) and ask with `AskUserQuestion` to confirm the move to Phase 5. If fewer than two Phase 4 rounds are recorded, say so in the summary. On yes, set Current phase → 5 in `project_state.md`.

### Phase 5: Parent Segment, Documentation, Final Agent

1. **Parent Segment** (solutions with a PS step) — `parent_segment_update.md` for the process; the solution's `references/parent_segment.md` for the "what", read only after the user approves the plan.
2. **Documentation** — `customer_docs_pattern.md` + the solution's `references/docs-setup.md` → `docs/`.
3. **Confirm the business context** — in `business-context.md`, remove every question still marked `[NEEDS YOUR INPUT]` (list them in `project_state.md` Key Decisions as "not answered") and any `[INFERRED — please confirm]` the user has confirmed; ask about inferences still unconfirmed. Record "Business context: confirmed `<date>`".
4. **Finalize the customer agent** — `customer_agent_pattern.md` Step 5 + `references/agent-setup.md` (build the agent first with Steps 1–3 if Phase 4 Part A was skipped).
5. **Offer the final guides** — ask with `AskUserQuestion`: "Update `workflow-guide.md` and `model-setup-walkthrough.md` with the final production setup? (Recommended)" / "Keep them as they are" (or "Create them now" / "Skip" if they were never built). On yes: `customer_agent_pattern.md` Step 4 (**final** guides) and reinstall the agent.
After each of steps 1–5, update `project_state.md` (step done, Next Action = the next step). Finally:
6. Update `project_state.md` → "complete — engagement live", Next Action "none — iterate through the customer agent or start a Phase 4 round".

## Solution folder reference

| Path | Contents |
|---|---|
| `SKILL.md` | Solution-specific context per phase |
| `project_templates/workflow_template/` | TD workflow template (`README.md` + `config/` = source of truth) |
| `project_templates/agent_template/` | Customer agent blueprint (`SKILL.template.md` + `references/`, incl. `business-context.template.md`) |
| `references/ai-signals-guide.md` | AI Signals model guide — input, API parameters, how it scores, outputs, common changes (AI Signals solutions) |
| `references/workflow-setup.md` | How to choose config values from the data, solution deploy details, output validation |
| `references/agent-setup.md` | Agent placeholders, build checks, guides and finalize-time files |
| `references/requirements_doc.md` | Requirements doc body |
| `references/docs-setup.md` | Documentation set content |
| `references/parent_segment.md` | Phase 5 Parent Segment spec (if applicable) |

Authoring rules for solutions live in `solution_standard.md` (maintainers only — not needed during an engagement).
