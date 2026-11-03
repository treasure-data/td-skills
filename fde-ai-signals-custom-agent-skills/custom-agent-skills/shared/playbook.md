# Custom Agent Playbook

This plugin is an **orchestrator of agent templates**. Each custom-agent solution ships a read-only blueprint of a Claude skill in `<solution_dir>/project_templates/agent_template/`. Unlike the AI Signals solutions, there is no workflow and no model: the data already exists in the customer's CDP (a parent segment, databases), so the work is to **fit the agent to the customer** — explore their data, capture their business context, build the agent, and prove it with an evaluation.

During an engagement you copy the template into the user's working directory (a Treasure AI Studio Work Folder or a local project folder) and customize the **copy**. The plugin itself is never modified.

| Layer | Location | Contents |
|---|---|---|
| Framework (read-only) | this plugin | instructions + agent templates |
| Engagement workspace | `agent_outputs/<project_slug>/` | project state, business context, data dictionary, requirements, eval plan and results, docs, staging build |
| Customer agent | `.claude/skills/<agent-name>/` | the project's agent, built from `agent_template/` |

`<solution_dir>` is the folder containing the solution's `SKILL.md` — resolve it to an absolute path from the skill's base directory before copying anything.

Solutions with their own architecture (e.g. `custom-dashboard-builder`) follow their own phase files, with the same principles: template copied into the working directory, data exploration, business context, and an evaluation before the agent is called production-ready.

## Shared files

| File | What it contains |
|------|-----------------|
| `local_outputs.md` | Workspace layout, slug rules, git-ignore bootstrap, template-copy rule, what may / may not be stored |
| `project_state.md` | Cross-session context store — format and update rules |
| `customer_agent_pattern.md` | Build the customer agent from `agent_template/`: name, placeholders, staging build, install, finalize, verify |
| `eval_pattern.md` | The evaluation loop: write the plan to `eval.md`, approval, one fresh subagent per prompt, scoring, fixes, re-runs, the production bar |
| `customer_docs_pattern.md` | Optional documentation set written to `docs/` |

## Names

| Name | Asked | Default |
|---|---|---|
| Project name | Entry Point, before anything is written | no prefix — `<project_slug>` = the solution slug (`local_outputs.md` Step 2) |
| Customer agent name | not asked — derived from the project name; asked only if taken (`customer_agent_pattern.md` Step 1) | `<project_slug>-agent` |

Record both in `project_state.md` and reuse them everywhere afterwards.

## Entry Point

**First reply — before any question or tool call:** introduce the setup in two or three sentences, then show the solution's Phase Summary table (solution `SKILL.md`). For example: "I'd be happy to set up <Solution> for your data step by step. Below is the plan: we explore your data, capture your business context, build the agent, and test it with ten example prompts until it passes — then it is ready for production. After each phase I update `project_state.md`, so we can resume later exactly where we left off." Then ask: **"Is this a new setup, or are you resuming an existing one?"**

- **New:** ask for the project name first (`local_outputs.md` Step 2) with `AskUserQuestion`: "Use the default `<solution_slug>` — agent `<solution_slug>-agent` (Recommended)" / "Add a project prefix" (a brand, team or use case, e.g. `loyalty` → `loyalty-<solution_slug>-agent`, so several agents can live side by side). Recommend a prefix if the default is already used here. State the resulting project slug and agent name once. Then ask once with `AskUserQuestion` whether to start: "Start Phase 1 (Recommended)" / "Change something first" / "Not now". "Not now" writes nothing; "Change something first" adjusts the plan, then asks again.
- **Resume:** list `agent_outputs/*/project_state.md`, keep those whose **Solution** is this one, confirm the project, read it — "Current phase" + "Next Action" say where to pick up.

| User says | Likely phase |
|---|---|
| "set up the agent for [customer / parent segment]" | Phase 1 |
| "update the business context" / "the customer filled out the requirements" | Phase 2 (merge) → Phase 4 re-run |
| "rebuild the agent" | Phase 3 |
| "run the eval" / "test the agent" | Phase 4 |
| "make it production-ready" / "write the handoff docs" | Phase 5 |

When in doubt, **read `project_state.md` first**.

## Workflow Sequence

Rules for every phase:

- **Read files just in time.** In each phase, read only the files that phase names (here and in the solution `SKILL.md`).
- **Update `project_state.md` after every phase, every part of a phase (each eval round, each Phase 5 step) and every iteration round** — rewrite its header (Current phase, Next Action, Last updated) and log what was done, so an interrupted session can always resume from the file.
- **Keep moving.** After each step, continue straight to the next step of the same phase. At the end of a phase, give a short summary and ask with `AskUserQuestion` whether to continue, with the next phase as the `(Recommended)` option. Never end a turn without either continuing or asking.
- **Questions:** always `AskUserQuestion`, never plain-text lists — batches of up to 4, 2–4 options each, the recommended default marked `(Recommended)`, the implicit "Other" for free answers.
- **Read-only by default.** Exploration and evaluation never create, change or push anything in the customer's account. Pushing a segment (or any other object) needs the user's explicit approval in the chat.
- **No subagents** — except in Phase 4, where every test prompt runs in its own fresh subagent (`eval_pattern.md`).
- **One command for independent work.** Combine the same check across tables into one query (`UNION ALL`, `information_schema`); run independent commands in one shell command (`cmd1 & cmd2 & wait`).
- **Aggregates only.** Never write raw customer records into any file — column names, value lists, counts and statistics only.
- **Say when something takes a while** — before the exploration queries, the agent build and the eval runs.

### Phase 1: Data Exploration

1. Bootstrap `agent_outputs/` (`local_outputs.md` Step 1) and create `project_state.md` (`project_state.md`).
2. Follow the solution's discovery steps (solution `SKILL.md` + its `references/discovery.md`): confirm the account, pick the data source with `AskUserQuestion`, explore schema, data quality and existing objects.
3. Record the findings in `project_state.md` (source, tables, time columns, caveats) — Current phase → "2 — business context", Next Action "Draft business context and data dictionary".

### Phase 2: Business Context, Data Dictionary, Requirements

`business-context.md` holds what the customer knows about their business and the agent can't learn from the data — jargon, definitions (lead, conversion, VIP, churn), product categories, compliance and exclusion rules, naming conventions, goals. `data-dictionary.md` holds the structure: tables, columns, types, null rates, values, time columns, existing objects.

1. Copy `agent_template/references/business-context.template.md` and `data-dictionary.template.md` to `agent_outputs/<project_slug>/business-context.md` and `data-dictionary.md` (never overwrite existing copies), fill `{{…}}` values, and follow each file's authoring rules. Business context: answer what Phase 1 supports with confidence, marked `[INFERRED — please confirm]`; keep every other question under its section marked `[NEEDS YOUR INPUT]`. Data dictionary: fill it completely from Phase 1 — it holds facts, not guesses.
2. Show the user a short summary — one line per business-context section: what was inferred, and the open questions — then ask with `AskUserQuestion`: "Looks right — continue (Recommended)" / "I'll add context now" / "Change assumptions". "Looks right" confirms the inferences: remove their markers. Write any other answer into the file (answers replace inferences; remove the marker of each answered item).
3. **Requirements doc** — write `agent_outputs/<project_slug>/requirements.md` from the solution's `references/requirements_doc.md` (title `<Project Name> Requirements`): one section per open business-context question, the drafted answer, `> _Your answer:_`. It must read as a clean customer questionnaire — no "generated by" notes or discovery details. Tell the user in one line: its path, that it is plain markdown to share in any format, and that the filled version must be saved back to the same path.
4. Update `project_state.md`: business context "drafted / reviewed `<date>`", requirements "sent `<date>`", Current phase → "3 — build agent". **Continue to Phase 3** — do not wait for the customer's answers.

**When the customer returns `requirements.md`** (any later session): read `project_state.md`, then the filled doc; merge each answer into `business-context.md` (customer answers replace inferences; remove the marker of each answered item); show the user a summary of the changes; record "requirements returned `<date>`" and the changes under Key Decisions. Then rebuild the agent (Phase 3) and run a new eval round (Phase 4).

### Phase 3: Build the Agent

1. `customer_agent_pattern.md` Steps 1–3 + the solution's `references/agent-setup.md` — confirm the agent name, build in the staging folder, fill the placeholders, install to `.claude/skills/<agent-name>/`.
2. Run the solution's build checks (`references/agent-setup.md`) and `customer_agent_pattern.md` Step 5.
3. Show the **agent files** table (`references/agent-setup.md`) and tell the user the agent is available in new chats in this folder. Update `project_state.md` (agent "built `<date>`"), Current phase → "4 — evaluation".

### Phase 4: Evaluation

`eval_pattern.md` with the solution's `references/eval-setup.md`:

1. Write the test plan — 10 prompts built from the customer's own data dictionary and business context — to `agent_outputs/<project_slug>/eval.md`, show it, and ask for permission to run.
2. Run each prompt in a fresh subagent against the installed agent; score Pass / Partial / Fail.
3. Record the round in `eval.md`; propose fixes (business context, data dictionary, or the agent's `SKILL.md`), apply the approved ones, rebuild (Phase 3 Step 1), re-run.
4. Repeat until the production bar is met (`eval_pattern.md`). After every round update `project_state.md` (round, score, Current phase, Next Action — `eval_pattern.md` Step 5), then offer Phase 5.

A new eval round is due after every material change: customer answers merged, a context file edited, the data source changed, or the agent rebuilt from a newer template.

### Phase 5: Production-Ready

Only when the user asks to finalize, after the production bar was met.

1. **Confirm the business context** — the customer's answers are merged (Phase 2, returned requirements). Remove every question still marked `[NEEDS YOUR INPUT]` (list them in `project_state.md` Key Decisions as "not answered") and ask about any `[INFERRED — please confirm]` left. Record "Business context: confirmed `<date>`".
2. If the context changed since the last passing round, rebuild (Phase 3) and run a final eval round — the bar must still be met.
3. **Finalize the agent** — `customer_agent_pattern.md` Step 4 + `references/agent-setup.md` (Finalize).
4. **Documentation** (offer with `AskUserQuestion`; optional) — `customer_docs_pattern.md` + the solution's `references/docs-setup.md` → `docs/`.
After each of steps 1–4, update `project_state.md` (step done, Next Action = the next step). Finally:
5. Update `project_state.md` → "complete — agent live". Tell the user the agent can be shared to the account with Studio's Develop → Share.

## Solution folder reference

| Path | Contents |
|---|---|
| `SKILL.md` | Solution-specific context per phase |
| `project_templates/agent_template/` | Customer agent blueprint (`SKILL.template.md` + `references/`, incl. the business context and data dictionary skeletons) |
| `references/discovery.md` | Phase 1 exploration commands and queries |
| `references/agent-setup.md` | Agent placeholders, build checks, agent files table, finalize-time files |
| `references/eval-setup.md` | Test-prompt categories, pass criteria, failure → fix table |
| `references/requirements_doc.md` | Requirements doc body |
| `references/docs-setup.md` | Documentation set content (optional) |

Authoring rules for solutions live in `solution_standard.md` (maintainers only — not needed during an engagement).
