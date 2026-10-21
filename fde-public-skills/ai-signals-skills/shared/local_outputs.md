---
name: shared-local-outputs
description: |
  Where every engagement artifact is written: a local, git-ignored `agent_outputs/` folder in the user's working directory. Defines the folder layout, project name and slug rules, the mandatory git-ignore bootstrap, and what may / may not be stored there. Used by every solution under ai-signals-skills/.
---

# Shared: Local Outputs (`agent_outputs/`)

Every document, working copy, and generated file produced during an engagement is written to a local `agent_outputs/` folder in the **user's current working directory** — never into the plugin's own folders, and never to an external service. Customer-specific information (requirements answers, table names, configs, docs, dashboards) is allowed there because it stays on the user's machine or server.

## Rules

1. **Never write customer material inside the plugin.** `project_templates/` and `references/` are read-only templates. Copy them into `agent_outputs/` and edit the copy.
2. **Bootstrap the ignore rules before the first write** (Step 1 below). `agent_outputs/` must never be committable.
3. **One folder per project.** Everything for an engagement lives under `agent_outputs/<project_slug>/`. Several people can run their own projects of the same solution side by side (e.g. `loyalty-rfm/` and `email-marketing-rfm/`).
4. **Tell the user the path.** Whenever you create or update a file the user or customer needs to read or fill in, print its relative path.

## Step 1: Bootstrap (run once per working directory, before the first write)

```bash
mkdir -p agent_outputs
[ -f agent_outputs/.gitignore ] || printf '*\n' > agent_outputs/.gitignore
# If the working directory is inside a git repo, also ignore the folder at the repo level
if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  root=$(git rev-parse --show-toplevel)
  grep -qxF 'agent_outputs/' "$root/.gitignore" 2>/dev/null || printf '\nagent_outputs/\n' >> "$root/.gitignore"
fi
git check-ignore -q agent_outputs/probe 2>/dev/null && echo "agent_outputs is git-ignored" || echo "not a git repo (agent_outputs/.gitignore still protects it)"
```

`agent_outputs/.gitignore` containing `*` makes the folder ignore itself, so its contents can't be committed even if the repo-level `.gitignore` is later changed or the folder is copied into another repo.

## Step 2: Project name and slug

Asked at the start of a new engagement (`playbook.md` Entry Point), before anything is written, so the slug is never guessed. The user works in their own account, so the project — not the company — is what needs a name: several people may each build their own model and agent for the same solution.

- `<project_prefix>` — optional, chosen by the user to tell projects of the same solution apart (team, use case, brand), e.g. `loyalty`, `email-marketing`. Empty by default.
- `<project_slug>` — `<project_prefix>-<solution_slug>`, or just `<solution_slug>` without a prefix. Lowercase the user's input, replace non-alphanumerics by `-`, collapse runs of `-`, strip leading/trailing `-`; if the input already contains the solution slug as a word (`loyalty-rfm`, `rfm-retail-test`), keep it as typed — don't add it twice.
- `<project_name>` — display name: the prefix in title case plus the solution's short name (solution Quick Reference), or the short name alone.

| User input | `<project_slug>` | `<project_name>` | Agent name |
|---|---|---|---|
| no prefix | `rfm` | `RFM` | `rfm-agent` |
| `Loyalty` | `loyalty-rfm` | `Loyalty RFM` | `loyalty-rfm-agent` |
| `Email Marketing RFM` | `email-marketing-rfm` | `Email Marketing RFM` | `email-marketing-rfm-agent` |

Before confirming, check the slug is free: `ls -d agent_outputs/<project_slug> .claude/skills/<project_slug>-agent 2>/dev/null`. If either exists for a different project, say so and recommend a prefix (or resuming that project). Record the name and slug in `project_state.md`.

`<solution_slug>` — the calling solution's folder name: `rfm`, `mta`, `classifier`, `nba-scores`, `nbp`.

## Folder layout

```
agent_outputs/
├── .gitignore                         # "*"
└── <project_slug>/
    ├── project_state.md               # cross-session context store — see project_state.md
    ├── business-context.md            # customer business knowledge for the agent — drafted Phase 1, confirmed Phase 5 (playbook.md)
    ├── requirements.md                # customer-fillable requirements doc — see playbook.md Phase 2
    ├── workflow/                      # working copy of project_templates/workflow_template/ — config edited, `tdx wf push` runs here
    ├── segments/                      # `tdx sg pull` working directory — see parent_segment_update.md
    ├── agent_build/<agent-name>/      # staging copy of project_templates/agent_template/ — see customer_agent_pattern.md
    ├── dashboards/                    # generated HTML dashboards (customer agent)
    └── docs/                          # final documentation set — see customer_docs_pattern.md
```

Create sub-folders lazily, when the phase that needs them starts.

## Templates

Each solution ships two read-only templates in `<solution_dir>/project_templates/` (`<solution_dir>` = the folder containing the solution's `SKILL.md`; resolve it to an absolute path — the working directory is usually not the plugin directory):

| Template | Copied to | How |
|---|---|---|
| `workflow_template/` | `agent_outputs/<project_slug>/workflow/` | `push_pattern_td_workflows.md` + the solution's `references/workflow-setup.md` |
| `agent_template/` | `.claude/skills/<agent-name>/` (via `agent_build/`) | `customer_agent_pattern.md` + the solution's `references/agent-setup.md` |

Never overwrite an existing working copy — it holds the customer's edits. To pick up a newer template version later, diff the template against the working copy and port the changes with the user's approval.

The customer agent is the one engagement artifact outside `agent_outputs/`: it must live in `.claude/skills/` to be loaded as a skill. It carries its own `.gitignore` (`*`) so it is never committable either.

## What may / may not be stored

Store:
- Edited workflow configs (`input_params.yml`, `params.yml`, `config.yml`), `tdx.json` with the customer's project name
- Requirements answers, project state, validation results, docs, dashboards

Never store:
- API keys or credentials — authentication lives in `tdx auth setup` / workflow secrets, never in files
- Raw data dumps from exploration queries — summarize findings in `project_state.md` or the docs instead
