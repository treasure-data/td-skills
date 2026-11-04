# ML Solution Standard

**Audience: skill authors and maintainers — not read during a customer engagement.**
Read this when creating a new ai-signals-skills solution or changing an existing one. During an engagement, Claude follows `playbook.md` in this folder (the runtime playbook); this file defines the shape every solution must have so it plugs into that playbook the same way. `nba-scores/` is the reference implementation.

The plugin is an **orchestrator of templates**: each solution ships a workflow template and an agent template, plus instructions for copying them into the user's working directory and customizing the copies. Templates are the single source of truth — instructions never restate what a template already defines.

---

## 1. Folder layout

```
ai-signals-skills/<solution_slug>/
├── SKILL.md                                  # solution orchestrator (section order in §2)
├── references/
│   ├── ai-signals-guide.md                   # AI Signals model guide — required for solutions that call the AI Signals API
│   ├── workflow-setup.md                     # how to choose config values from the data, deploy details, output validation
│   ├── agent-setup.md                        # agent placeholders + finalize-time files
│   ├── requirements_doc.md                   # Phase 2 body (questions + How-to-ask block)
│   ├── docs-setup.md                         # documentation set content
│   └── parent_segment.md                     # Phase 5 PS "what" — required if the solution adds PS attributes
└── project_templates/
    ├── workflow_template/                    # complete TD workflow project
    │   ├── README.md                         # standard sections — §3
    │   ├── config/…yml (or config.yml)       # parameters: names, structure, example values
    │   └── *.dig, queries/, sql/, python…    # workflow code
    └── agent_template/                       # customer agent blueprint
        ├── SKILL.template.md                 # never named SKILL.md inside the plugin
        └── references/ (+ scripts)           # business-context.template.md, data dictionary, dashboard template, generate-data.js, guide skeletons
```

- `<solution_slug>` = folder name = the default `<project_slug>` (`agent_outputs/<solution_slug>/`, agent `<solution_slug>-agent`) when the user adds no project prefix.
- Register the solution in `.claude-plugin/marketplace.json`. Never register anything under `project_templates/`, and no file named `SKILL.md` may exist there. Treasure AI Studio installs only registered skill folders, so `shared/` is registered with a stub `SKILL.md` (name `fde-ai-signals-shared`, a description that points to the setup skills, `disable-model-invocation: true` and `user-invocable: false`) — never add instructions to that stub.
- Every file ≤ 1 MB (Treasure AI Studio drops larger files when skills are shared).

## 2. `SKILL.md` section order

1. Frontmatter — `name: fde-<solution folder name>` (e.g. `rfm/` → `fde-rfm`, `custom-audience-agent/` → `fde-custom-audience-agent`); `description` about **setup only** (set up, configure, change, rebuild, resume) with concrete trigger phrases — analysis of the results belongs to the installed project agent, so its phrases stay out of the setup skill's description. `How to Start` includes the **Setup skill vs. project agent** routing paragraph.
2. `# <Solution Name>` + 1–2 sentence summary.
3. `## How to Start` — "Read `../shared/playbook.md` … This file provides the <X>-specific context." Nothing between the title and this section.
4. `## Phase Summary` — exactly 5 rows, Phase 1–5, matching §4.
5. `## <X>-Specific Context by Phase` — one `### Phase N` per phase, in order, with explicit steps, the `references/` files to read **at that point**, and solution values.
6. After the phase sections, in any order: optional solution reference sections; `## How It Works`; `## Quick Reference` (solution slug, short name for project names, both template paths, default workflow project name, entry point, config file, key outputs, default agent name).

## 3. Template rules

### `workflow_template/`
- It is the single source of truth for the workflow. `config/` YAML defines parameter names, structure and example values; nothing else restates them.
- `README.md` has these sections, in order:
  1. **Overview** — what the workflow does
  2. **Workflow Structure** — `.dig` files in run order, entry point, folders not to edit
  3. **Configuration** — config file path + one row per parameter: *parameter → what it does → how to choose it*. No syntax, nesting or default values (those live in the YAML)
  4. **Outputs** — tables created, one line each
  5. **Secrets & Requirements** — exact `${secret:…}` names, prerequisites
  6. **Customization Points** — e.g. custom SQL folder, alert email
- No `CLAUDE.md` inside the template (it would be picked up as instructions once copied into a working directory).
- Drift check (§6): README parameters ⇔ config keys.

### `agent_template/`
- `SKILL.template.md` is renamed to `SKILL.md` only when installed into `.claude/skills/<agent-name>/` (`shared/customer_agent_pattern.md`).
- Placeholders use `{{name}}`. Always: `{{agent_name}}`, `{{project_name}}`, `{{project_slug}}`, `{{sink_database}}`, `{{engagement_dir}}`; solution extras are listed in `references/agent-setup.md`.
- Build-time placeholders appear **only in `.md` files**. Scripts, HTML and data files are copied verbatim — they may use their own runtime tokens (e.g. the dashboard template's `{{session_id}}`, filled by `generate-data.js`) and take customer values as command-line arguments.
- Its `references/` hold analysis knowledge that is not customer-specific (output-table dictionary incl. what each output means, dashboard template, scripts). The engagement's `business-context.md` and the solution's `ai-signals-guide.md` are copied in at every build, the guides in Phase 4 / Phase 5 and the runbook at finalize time. There is no `customer-context.md`.
- It ships a **business context skeleton**, `references/business-context.template.md`: the customer's business knowledge only — never how the model works. Sections in this order, each with 3–5 "questions to consider" bullets: Business Overview, Customers and Identity, Key Terms and Definitions, Buying Cycle and Seasonality, Data Intricacies and Edge Cases, Goals and Use Cases, Rules and Exclusions, then one `<Solution> Definitions` section. Drafted in Phase 1 into `agent_outputs/<project_slug>/business-context.md` (`shared/playbook.md`), open questions carried into the requirements doc, confirmed in Phase 5.
- It ships two **guide skeletons** in `references/`: `workflow-guide.template.md` (as-built workflow: pipeline, config, mappings, customizations, output tables) and `model-setup-walkthrough.template.md` (discovery, decision log, cleaning, validation baseline, artifacts, presentation recipe, accuracy rules). Each is headings plus `<!-- fill … -->` blocks listing what to fetch and from where, tailored to the solution. They are removed from every build and filled only on request — as **interim** guides in Phase 4 (hands-on kit) and **final** guides in Phase 5 (`shared/customer_agent_pattern.md` Step 4).
- `SKILL.template.md` has a **How It Was Built** section that routes end-to-end workflow questions to `workflow-guide.md` and setup / decision questions to `model-setup-walkthrough.md`, with a fallback to `project_state.md` when they are not built yet.

### `references/workflow-setup.md`
- Starts by pointing to `workflow_template/README.md` (structure, parameter meaning) and the config YAML (exact syntax).
- Contains only what the template can't: how to choose values from the customer's data (table classification, discovery SQL, rules of thumb), solution-specific deploy details (secrets, schedule, push command), and a **Validate** section with the output checks.

## 4. Phase contract

| Phase | Must | Must not |
|---|---|---|
| **1 — Data exploration** | List every table (`tdx tables`), classify each (activity / profile / system), apply solution-specific classification, run discovery queries, confirm candidate tables via `AskUserQuestion`, record key columns; **draft `business-context.md`** and review it with the user in one `AskUserQuestion` | Ask config questions — see exceptions; run extra queries for the business context |
| **2 — Requirements doc** | Write `requirements.md` pre-filled from Phase 1, ending with the open business-context questions, give the user its path, **then continue to Phase 3** | Block on the customer's answers |
| **3 — Minimal workflow** | Copy `workflow_template/`, read its README, check the sink-database and project names, edit the config (safe defaults where answers are missing), show config + names and ask once to **push, run and validate**; update `project_state.md`; **ask which hands-on kit to build** (agent + dashboard + guides / agent + dashboard / not now) | Edit `project_templates/`; push without the approval; inspect or validate the template copy locally |
| **4 — Hands-on testing + requirements** | Part A (per the Phase 3 answer): build + install the agent `<project_slug>-agent`, generate the dashboard, interim guides if chosen, show the agent files table. Part B: read `project_state.md` + filled `requirements.md`, present planned changes for approval, edit the workflow copy, re-push, re-run, re-validate, merge business answers into `business-context.md`, refresh the kit, log the round | Change files before approval; install an agent with unfilled placeholders; offer Phase 5 before the user says the model is ready |
| **5 — Parent Segment, docs, final agent** (PROD, after the user confirms) | PS step via `../shared/parent_segment_update.md` + `references/parent_segment.md` (if applicable); docs via `../shared/customer_docs_pattern.md` + `references/docs-setup.md`; confirm `business-context.md`; finalize the agent; **ask whether to update the guides** with the final setup | Read `parent_segment.md` before the plan is approved |

Cross-cutting rules:
- **Questions:** always `AskUserQuestion`, never plain-text lists. Put the standard *How to ask* block (batches ≤ 4, 2–4 options, `(Recommended)` default, implicit Other) at the top of each question step.
- **Name gates:** project name at the Entry Point (optional prefix; `<project_slug>` = `[<prefix>-]<solution_slug>`), sink database (default `td_agents`) and workflow project name (template default) in Phase 3 — default-then-confirm, recorded in `project_state.md`. The customer agent is `<project_slug>-agent`, asked only if taken. Each default is checked for an existing project first; if taken, a project-specific name is recommended.
- **Outputs:** everything goes to `agent_outputs/<project_slug>/`, except the installed agent in `.claude/skills/<agent-name>/` (with its own `.gitignore`). Run commands from the working directory; subshells for anything elsewhere.
- **Secrets:** use the exact secret name the template reads; the user sets it themselves (`! tdx wf secrets set <project> <name>=…`).
- **No** Confluence, GitHub, internal names, real customer data, or hard-coded databases.

## 5. Allowed exceptions

Every deviation from §4 must be listed here and stated in the solution's `SKILL.md`.

| Solution | Exception | Reason |
|---|---|---|
| `mta` | Phase 5 has no Parent Segment step | Attribution outputs are tables, not profile attributes |
| `classifier` | Phase 1 Step 1 asks the use case, target variable and where the label lives before exploring | The target decides which tables and features matter and how the label is derived |
| `prob-idu` | Phase 3 writes the project's input query (`workflow_template/sql/input_table.sql`) in the working copy, besides the config | The input is project-specific (ID source, identifier columns); the template ships an example structure and the output contract (`sql/README.md`) |
| `prob-idu` | No standalone HTML dashboard or `generate-data.js`; the agent charts the stats tables in chat | The `prob_*` stats tables are the dashboard feed; one-off HTML adds nothing over in-chat charts |
| `classifier` | Phase 3 writes the project's feature SQL (`workflow_template/sql/input_features.sql`) in the working copy, besides the config | A classifier's input is project-specific (population, features, label); the template ships an example structure and the output contract (`sql/README.md`) |

## 6. Conformance checklist

- [ ] §1 layout; no `SKILL.md` and no `CLAUDE.md` under `project_templates/`; every file ≤ 1 MB
- [ ] `SKILL.md` sections in §2 order; Phase Summary has 5 rows
- [ ] `workflow_template/README.md` has the §3 sections; **every README parameter exists in the config and every config parameter is in the README**
- [ ] `workflow-setup.md` names only parameters that exist in the config; restates no syntax or defaults
- [ ] `agent_template/` has `SKILL.template.md`; every placeholder is listed in `agent-setup.md`
- [ ] `agent_template/references/` has `workflow-guide.template.md` and `model-setup-walkthrough.template.md`; `SKILL.template.md` has the **How It Was Built** section
- [ ] `agent_template/references/` has `business-context.template.md` with the §3 sections and no model mechanics; no plain `business-context.md` and no `customer-context.md` anywhere in the solution
- [ ] AI Signals solutions have `references/ai-signals-guide.md`, and `SKILL.md` + `SKILL.template.md` route model questions to it
- [ ] Phase 1 starts with `tdx tables` and ends with the business context draft; Phase 2 does not wait; Phase 3 checks the sink-database and project names, asks once to push, run and validate, and ends with the hands-on kit question; Phase 4 never offers Phase 5 on its own; Phase 5 ends with the final-guides question
- [ ] Secret names match `${secret:…}` in the template
- [ ] Every referenced path exists; manifest entries point to folders with a `SKILL.md`
