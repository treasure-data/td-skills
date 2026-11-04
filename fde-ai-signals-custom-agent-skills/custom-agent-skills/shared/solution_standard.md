# Custom Agent Solution Standard

**Audience: skill authors and maintainers — not read during a customer engagement.**
Read this when creating a new custom-agent-skills solution or changing an existing one. During an engagement, Claude follows `playbook.md` in this folder; this file defines the shape every solution must have so it plugs into that playbook the same way. `custom-audience-agent/` is the reference implementation.

A custom-agent solution ships **only an agent template** — no workflow, no model. The data already exists in the customer's CDP; the engagement fits the agent to the customer (exploration → business context → build → evaluation) and ends with an agent that met the production bar. Solutions with their own architecture (`custom-dashboard-builder`) are listed as exceptions in §5 and follow the principles in §4 within their own phase files.

---

## 1. Folder layout

```
custom-agent-skills/<solution_folder>/
├── SKILL.md                                  # solution orchestrator (section order in §2)
├── references/
│   ├── discovery.md                          # Phase 1 exploration commands and queries
│   ├── agent-setup.md                        # placeholders, build checks, agent files table, finalize-time files
│   ├── eval-setup.md                         # test categories, pass criteria, failure → fix table
│   ├── requirements_doc.md                   # Phase 2 requirements doc body + answer → file mapping
│   └── docs-setup.md                         # optional documentation set content
└── project_templates/
    └── agent_template/
        ├── SKILL.template.md                 # the agent itself — never named SKILL.md inside the plugin
        └── references/
            ├── business-context.template.md  # customer business knowledge skeleton
            ├── data-dictionary.template.md   # data structure skeleton
            └── …                             # analysis knowledge that is not customer-specific
```

- `<solution_slug>` (short, in the Quick Reference — e.g. `audience`) is the default `<project_slug>`; the agent is `<project_slug>-agent`.
- Register the solution folder in `.claude-plugin/marketplace.json`. Never register anything under `project_templates/`; no file named `SKILL.md` or `CLAUDE.md` may exist there. Treasure AI Studio installs only registered skill folders, so `shared/` is registered with a stub `SKILL.md` (name `fde-custom-agent-shared`, a description that points to the setup skills, `disable-model-invocation: true` and `user-invocable: false`) — never add instructions to that stub.
- Every file ≤ 1 MB (Treasure AI Studio drops larger files when skills are shared).

## 2. `SKILL.md` section order

1. Frontmatter — `name: fde-<solution folder name>` (e.g. `rfm/` → `fde-rfm`, `custom-audience-agent/` → `fde-custom-audience-agent`); `description` about **setup only** (set up, configure, change, rebuild, resume) with concrete trigger phrases — analysis of the results belongs to the installed project agent, so its phrases stay out of the setup skill's description. `How to Start` includes the **Setup skill vs. project agent** routing paragraph.
2. `# <Solution Name>` + 1–2 sentence summary.
3. `## How to Start` — "Read `../shared/playbook.md` … This file provides the <X>-specific context." Nothing between the title and this section.
4. `## Phase Summary` — exactly 5 rows, Phase 1–5, matching §4.
5. `## <X>-Specific Context by Phase` — one `### Phase N` per phase, in order, with explicit steps and the `references/` files to read **at that point**.
6. After the phase sections, in any order: `## How It Works`; `## Quick Reference` (solution slug, short name for project names, agent template path, default agent name, data source, key engagement files).

The agent's own behavior (analysis rules, SQL rules, guardrails) lives only in `SKILL.template.md` — never in the orchestrator.

## 3. Template rules

- `SKILL.template.md` is renamed to `SKILL.md` only when installed into `.claude/skills/<agent-name>/` (`customer_agent_pattern.md`). It reads `references/business-context.md` and `references/data-dictionary.md` at the start of every session; it has no setup, eval or export modes (those are the orchestrator's job).
- Placeholders use `{{name}}`. Always: `{{agent_name}}`, `{{project_name}}`, `{{project_slug}}`, `{{engagement_dir}}`; solution extras are listed in `references/agent-setup.md`. Placeholders appear only in `.md` files.
- `business-context.template.md` holds the customer's business knowledge only — terms and definitions, categories, compliance and exclusion rules, naming, goals, tone — each section with 3–5 "questions to consider" bullets and authoring rules in a leading comment (markers `[INFERRED — please confirm]` / `[NEEDS YOUR INPUT]`).
- `data-dictionary.template.md` holds structure and data quality only — tables, columns, types, null rates, values, time columns, existing objects.
- Neither skeleton is installed: their engagement copies (`agent_outputs/<project_slug>/…`) are copied into the agent at every build.

## 4. Phase contract

| Phase | Must | Must not |
|---|---|---|
| **1 — Data exploration** | Confirm the account; pick the data source with `AskUserQuestion`; explore schema, data quality and existing objects read-only; record findings in `project_state.md` | Write raw records to files; change anything in the account |
| **2 — Business context, data dictionary, requirements** | Draft `business-context.md` (markers) and fill `data-dictionary.md`; one review question; write `requirements.md`, give its path, **continue** | Block on the customer's answers |
| **3 — Build** | Staging build, placeholders filled, install to `.claude/skills/<agent-name>/`, build checks, agent files table | Install with unfilled placeholders |
| **4 — Evaluation** | 10 prompts from the customer's data and business context (≥ 3 on business-context rules) written to `eval.md`; approval before running; one fresh subagent per prompt; scored rounds recorded in `eval.md`; fixes only with approval; re-run until the bar is met | Run before approval; push or change anything during the eval |
| **5 — Production-ready** | Business context confirmed; bar still met after the last change; agent finalized; optional docs | Call the agent production-ready below the bar |

Production bar: **≥ 9/10 Pass and every Compliance case Pass** (`eval_pattern.md`).

Cross-cutting rules: questions only with `AskUserQuestion`; read-only by default, pushes only with explicit approval; outputs only under `agent_outputs/<project_slug>/` and `.claude/skills/<agent-name>/`; no Confluence, GitHub, internal names, real customer data or hard-coded databases in the plugin.

## 5. Allowed exceptions

| Solution | Exception | Reason |
|---|---|---|
| `custom-dashboard-builder` | 4-step setup (intake → data Q&A + recommendation → optional workflow → first-draft dashboard + dashboard skill), two extra templates (`workflow_template/`, `dashboard_template/`), skill named `<project_slug>-dashboard`; evaluation, requirements doc and docs only on request | Builds a dashboard (and optionally a pre-aggregating workflow) before the skill; first setup kept minimal — iteration happens through the installed skill |

## 6. Conformance checklist

- [ ] §1 layout; no `SKILL.md` / `CLAUDE.md` under `project_templates/`; every file ≤ 1 MB
- [ ] `SKILL.md` sections in §2 order; Phase Summary has 5 rows; no agent behavior in the orchestrator
- [ ] `agent_template/` has `SKILL.template.md`, `business-context.template.md`, `data-dictionary.template.md`; every placeholder is listed in `agent-setup.md`
- [ ] `eval-setup.md` categories cover discovery, analysis, the solution's write action, and business-context rules (incl. compliance)
- [ ] Every referenced path exists; manifest entries point to folders with a `SKILL.md`
