---
name: shared-project-state
description: |
  Cross-session context store for an engagement. Defines the local `agent_outputs/<project_slug>/project_state.md` file format and the rule that every resumed session reads it first. Used by every solution under ai-signals-skills/.
---

# Shared: Project State

Engagements span multiple sessions. `agent_outputs/<project_slug>/project_state.md` is the cross-session context store — a running summary of what's been done, the key decisions, and the paths of every artifact created. See `local_outputs.md` for the folder layout.

## Rules

1. **Create early.** `project_state.md` is the first file created for an engagement (end of Phase 1, with the business context draft).
2. **Update at the end of every phase, every part of a phase and every iteration round.** Phase completion, date, key paths, key decisions, Current phase, Next Action — the file must always say where to resume.
3. **Read first on resume.** When starting a new session, list existing engagements and read the matching file:
   ```bash
   grep -l '^- \*\*Solution:\*\* <Solution Name>' agent_outputs/*/project_state.md 2>/dev/null
   ```
   If several match, ask the user which one with `AskUserQuestion`. The "Current phase" + "Next Action" fields determine where to pick up.
4. **Authoritative.** When in doubt, the state file wins.
5. **Rewrite, don't append.** Update by re-rendering the whole file with the new values in one Write at the end of each phase — not many small Edits — keeping Key Decisions cumulative.
6. **Keep it short** — a resume summary, not a log: under about 80 lines, one line per decision or artifact. Record names, paths, the chosen values and why, assumed defaults, caveats and the latest validation result (counts, pass/fail). Leave out job IDs, command transcripts, timings and other evidence — except the workflow session ID of the latest run.

## Template

```markdown
# Project State - <Project Name>

Living context store. Update at the end of every phase. New sessions read this file first.

## Status
- **Solution:** <Solution Name>
- **Current phase:** <number + short description>
- **Last updated:** <YYYY-MM-DD>

## Project
- **Project:** <project name> (`<project_slug>`)
- **TD account / region:** <tdx profile or API endpoint>
- **TD workflow project:** <confirmed name> (pushed <date> | pending)
- **Sink database:** <confirmed name, default td_agents | pending>
- **Customer agent name:** <project_slug>-agent (or the name chosen if that was taken)
- **Parent Segment:** <name + ID | pending>

## Artifacts (paths relative to the working directory)
- Business context: agent_outputs/<project_slug>/business-context.md (<drafted <date> | reviewed <date> | confirmed <date>>)
- Requirements doc: agent_outputs/<project_slug>/requirements.md (<pending | sent <date> | returned <date>>)
- Workflow working copy: agent_outputs/<project_slug>/workflow/
- Hands-on kit (Phase 3 end answer): <agent + dashboard + guides | agent + dashboard | not now>
- Customer agent: .claude/skills/<agent-name>/ (<pending | hands-on <date> | final <date>>)
- Guides: workflow-guide.md, model-setup-walkthrough.md in the agent's references/ (<not built | interim <date> | final <date>>)
- Docs: agent_outputs/<project_slug>/docs/ (<pending | list of files>)
- Dashboards: agent_outputs/<project_slug>/dashboards/ (<pending | list of files>)

## Key Decisions
<none yet — append per phase>

## Phase 4 iterations
<none yet — one line per Part B round: date, what changed, validation result>

## Next Action
<one-sentence handoff for the next session>
```

## Phase-by-phase update conventions

| Phase complete | Update fields |
|---|---|
| Phase 1 data exploration | Current phase → 2, Key Decisions: confirmed source tables + key columns; business context "drafted / reviewed <date>" |
| Phase 2 requirements doc written | Current phase → 3, requirements doc status "sent <date>" |
| Phase 3 minimal workflow pushed + validated | Current phase → 4, TD workflow project + push date, sink database, validation summary, hands-on kit answer |
| Phase 4 Part A hands-on kit built | Customer agent "hands-on <date>", dashboard path, guides "interim <date>" (if chosen) |
| Phase 4 Part B workflow updated from requirements | Phase 4 iterations: one line for the round; requirements doc status "returned <date>", business answers merged into business-context.md, parameter changes in Key Decisions, Round 2 validation summary, kit refreshed |
| Phase 5 Parent Segment + docs + agent finalized | Current phase → "complete — engagement live", Parent Segment, business context "confirmed <date>" (unanswered questions in Key Decisions), all doc paths, customer agent final, guides final (if updated) |
