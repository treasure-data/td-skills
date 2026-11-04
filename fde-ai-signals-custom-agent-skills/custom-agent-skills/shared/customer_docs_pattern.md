# Shared: Customer Documentation Pattern

Phase 5 (optional) writes a documentation set to `agent_outputs/<project_slug>/docs/` (see `local_outputs.md`). The solution's `references/docs-setup.md` supplies the content of each doc.

## Prerequisites

Read first: `project_state.md`, the engagement's `business-context.md`, `data-dictionary.md`, `eval.md` and `requirements.md`.

## Audience header

Each doc starts with a one-line audience marker so the user knows what can be shared as-is:

```markdown
> Audience: customer        ← safe to share with customer stakeholders
> Audience: internal        ← operator notes; review before sharing
```

Doc titles: `# <Project Name> <Doc Name>` (e.g. `# Loyalty Audience Agent Runbook`).

## The Docs

| # | File | Audience | Content |
|---|---|---|---|
| 1 | `docs/architecture.md` | customer | Data source and tables in scope; how the agent works (Claude skill in `.claude/skills/<agent-name>/` + its context files + the `tdx` CLI; read-only by default, changes only on approval) |
| 2 | `docs/behavior.md` | customer | Plain-English summary of what the agent knows for THIS customer: terms and definitions, priority data, naming conventions, exclusion and compliance rules, output preferences. No YAML/JSON |
| 3 | `docs/eval_summary.md` | customer | The latest passing round from `eval.md`: the 10 prompts, results, known limitations |
| 4 | `docs/runbook.md` | internal | Resume a session; refresh the data dictionary after data-source changes; update the business context; rebuild the agent; run an eval round; share the agent via Develop → Share; common failure → which file to edit |
| 5 | `docs/access_ownership.md` | internal | Agent owner, customer stakeholders, support contact, tdx account/site, engagement folder, escalation path |

## Create Order

1. Write the docs with the Write tool, referencing each other and `../requirements.md` / `../eval.md` by relative path.
2. Update `project_state.md`: doc paths.
3. Tell the user the `docs/` path and which files are customer-facing.

## Keeping Docs Current

| Doc | When to regenerate |
|---|---|
| Eval Summary | After each passing eval round |
| Behavior | Whenever `business-context.md` changes materially |
| Architecture | When the data source or tables in scope change |
| Runbook, Access & Ownership | When the operating procedure or ownership changes |
