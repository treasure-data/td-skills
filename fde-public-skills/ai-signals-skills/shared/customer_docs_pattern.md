---
name: shared-customer-docs-pattern
description: |
  Reusable Phase 5 documentation set, written as local markdown files to `agent_outputs/<project_slug>/docs/`. Defines the standard doc files (Architecture, Behavior, Eval Results, Runbook, Access & Ownership), their create order, and the "what changes when X" rules. Used by every solution under ai-signals-skills/.
---

# Shared: Customer-Specific Documentation Pattern

After the production workflow is validated (and, for solutions with a Parent Segment step, after Phase 5 Step 1), every engagement writes a documentation set to `agent_outputs/<project_slug>/docs/` (see `local_outputs.md`). The file set below is the default; the *content* of each file — and any solution-specific substitutions — come from the calling solution's `references/` directory.

## When to use

Phase 5 — after the Parent Segment update (Step 2+), or as the first step for solutions without one (e.g. MTA).

## Prerequisites

- Read `project_state.md` first to recover the project name, sink database, Parent Segment, and paths.
- Read `requirements.md` and the workflow config in `workflow/` so the docs reflect the deployed configuration.

## Audience header

Each doc starts with a one-line audience marker so the user knows what can be shared as-is:

```markdown
> Audience: customer        ← safe to share with customer stakeholders
> Audience: internal        ← operator notes; review before sharing
```

## The Doc Files

| # | File | Audience | Content (calling SKILL provides specifics) |
|---|---|---|---|
| 1 | `docs/architecture.md` | customer | Data flow from source tables → workflow → output tables → Parent Segment; TD workflow project name; schedule; output table schema |
| 2 | `docs/behavior.md` | customer | Plain-English summary of how the model/scores behave for THIS customer — configuration choices from the requirements doc, segment definitions, known caveats. Avoid YAML/JSON |
| 3 | `docs/eval_results.md` | customer | Output validation results from the final run (row counts, distributions, pass/fail of each `eval.md` check), date of last run, known limitations |
| 4 | `docs/runbook.md` | internal | Re-deploy procedure (edit config in the working copy → `tdx wf push`), re-run + monitoring commands, common failure modes mapped to which parameter to change |
| 5 | `docs/access_ownership.md` | internal | Solution owner, customer stakeholders with access, support contact, location of the workflow working copy, escalation path for platform issues |

Doc titles inside each file: `# <Project Name> <Doc Name>`.

## Create Order

1. Write all doc files with the Write tool.
2. In each doc, reference `../requirements.md` and the other docs by relative path so navigation works when the folder is shared.
3. Update `project_state.md`: mark Phase 5 complete, list all doc paths, set status to "engagement live".
4. Tell the user the `docs/` path and which files are customer-facing.

## Keeping Docs Current

| Doc | When to regenerate |
|---|---|
| Eval Results | After each production run whose validation results change materially |
| Behavior | Whenever workflow parameters or segment definitions change |
| Architecture | When source tables, output tables, or schedule change |
| Runbook | When the deployment procedure changes |
| Access & Ownership | When ownership or access changes |
