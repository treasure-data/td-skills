# Shared: Project State

Engagements span multiple sessions. `agent_outputs/<project_slug>/project_state.md` is the cross-session context store — what's been done, the key decisions, and the path of every artifact. See `local_outputs.md` for the folder layout.

## Rules

1. **Create early** — in Phase 1, before any other engagement file.
2. **Update at the end of every phase** and after every eval round, approved push, context merge and rebuild: date, file status, key decisions, Current phase, Next Action.
3. **Read first on resume.** List existing engagements and keep those of this solution:
   ```bash
   grep -l "^\*\*Solution:\*\* <solution_slug>" agent_outputs/*/project_state.md 2>/dev/null
   ```
   If several match, ask the user which one with `AskUserQuestion`. "Current phase" + "Next Action" say where to pick up.
4. **Authoritative.** When in doubt, the state file wins.
5. **Rewrite, don't append.** Re-render the whole file with the new values (Write tool), keeping Key Decisions and the eval history cumulative.

## Template

```markdown
# Project State — <Project Name>

**Solution:** <solution_slug>

Living context store. New sessions read this file first.

## Status
- **Current phase:** <the solution's phase or step name — audience agent: 1 — data exploration | 2 — business context | 3 — build agent | 4 — evaluation | 5 — production-ready | complete — agent live; dashboard builder: 1 — intake | 2 — data discovery | 3 — workflow | 4 — dashboard + skill | complete — dashboard skill live>
- **Last updated:** <YYYY-MM-DD>

## Project
- **Project:** <Project Name> (`<project_slug>`), agent `<agent-name>`
- **TD account / site:** <tdx user + site>
- **Data source:** <solution-specific — e.g. parent segment name (ID), output database>

## Files (paths relative to the working directory)
- Business context: agent_outputs/<project_slug>/business-context.md (<drafted | reviewed <date> | confirmed <date>>)
- Data dictionary: agent_outputs/<project_slug>/data-dictionary.md (<date>)
- Requirements: agent_outputs/<project_slug>/requirements.md (<sent <date> | returned <date> | merged <date>>)
- Agent: .claude/skills/<agent-name>/ (<built <date> | finalized <date>>)
- Eval: agent_outputs/<project_slug>/eval.md (<plan written | round <n> <date> — <pass>/10, compliance <ok | failing>>)
- Docs: agent_outputs/<project_slug>/docs/ (<not built | list>)

## Discovery Findings
<tables, time columns, data caveats from Phase 1 — aggregates only>

## Pushed Objects
<none yet — name, ID, link, date (only with the user's approval)>

## Key Decisions
<none yet — append: date, decision, reason>

## Next Action
<one-sentence handoff for the next session>
```
