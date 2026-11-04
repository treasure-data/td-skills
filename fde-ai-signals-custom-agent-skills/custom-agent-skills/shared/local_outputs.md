# Shared: Local Outputs (`agent_outputs/`)

Every document and generated file produced during an engagement is written to a local `agent_outputs/` folder in the **user's current working directory** — never into the plugin's own folders, and never to an external service. Customer-specific information (context files, schema notes, requirements answers, eval results, docs) is allowed there because it stays in the user's Work Folder. The customer agent itself is installed separately, in `.claude/skills/<agent-name>/` (`customer_agent_pattern.md`).

## Rules

1. **Never write customer material inside the plugin.** Templates are read-only. Copy them into `agent_outputs/` and edit the copy.
2. **Bootstrap the ignore rules before the first write** (Step 1). `agent_outputs/` must never be committable.
3. **One folder per project.** Everything for an engagement lives under `agent_outputs/<project_slug>/`.
4. **Tell the user the path.** Whenever you create or update a file the user or customer needs to read or fill in, print its relative path.
5. **Stay in the working directory.** Never `cd` on its own; run anything that must execute elsewhere in a subshell: `( cd <dir> && <command> )`.

## Step 1: Bootstrap (once per working directory, before the first write)

```bash
mkdir -p agent_outputs
[ -f agent_outputs/.gitignore ] || printf '*\n' > agent_outputs/.gitignore
# If the working directory is inside a git repo, also ignore the folder at the repo level
if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  root=$(git rev-parse --show-toplevel)
  grep -qxF 'agent_outputs/' "$root/.gitignore" 2>/dev/null || printf '\nagent_outputs/\n' >> "$root/.gitignore"
fi
```

`agent_outputs/.gitignore` containing `*` makes the folder ignore itself, so its contents can't be committed even if the repo-level `.gitignore` changes or the folder is copied into another repo.

## Step 2: Project name and slugs

Asked at the Entry Point (`playbook.md`), before anything is written. Several people may build their own agent of the same solution in one account (e.g. `loyalty-audience-agent`, `email-audience-agent`), so the project — not the customer — is named.

| Name | Rule | Example (solution slug `audience`) |
|---|---|---|
| `<project_prefix>` | Optional: a brand, team or use case, lowercased, non-alphanumerics → `-` | `loyalty` |
| `<project_slug>` | `<solution_slug>` without a prefix; `<project_prefix>-<solution_slug>` with one | `audience` / `loyalty-audience` |
| `<project_name>` | Display name: prefix title-cased + the solution's short name (Quick Reference) | `Audience Agent` / `Loyalty Audience Agent` |
| Agent name | `<project_slug>-agent` | `audience-agent` / `loyalty-audience-agent` |

If `agent_outputs/<project_slug>/` already exists for a different project, recommend a prefix instead.

## Folder layout

```
agent_outputs/
├── .gitignore                    # "*"
└── <project_slug>/
    ├── project_state.md          # cross-session context store — project_state.md
    ├── business-context.md       # engagement copy of business-context.template.md (copied into the agent at every build)
    ├── data-dictionary.md        # engagement copy of data-dictionary.template.md (copied into the agent at every build)
    ├── schema.json               # schema snapshot of the data source (solution-specific)
    ├── requirements.md           # customer-fillable questionnaire (playbook Phase 2)
    ├── eval.md                   # test plan + results per round (eval_pattern.md)
    ├── agent_build/<agent-name>/ # staging build of the agent; previous installs as <agent-name>.prev-<timestamp>
    ├── segments/                 # solution working directories (e.g. segment YAML drafts)
    └── docs/                     # optional documentation set — customer_docs_pattern.md
```

Create sub-folders lazily, when the phase that needs them runs.

## What may / may not be stored

Store: context files, schema snapshot, requirements answers, project state, eval plans and results, drafts of objects to push (YAML), docs.

Never store:
- API keys or credentials — authentication lives in `tdx auth setup`, never in files
- Raw customer records from queries — only column names, value lists, counts and statistics
