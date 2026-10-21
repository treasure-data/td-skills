# Dashboard Skill Setup

Builds `<project_slug>-dashboard` from `<skill_dir>/project_templates/agent_template/` with `<skill_dir>/../shared/customer_agent_pattern.md` (Steps 2, 3, 5). Name: `<project_slug>-dashboard` instead of the pattern's `-agent` suffix; ask for another name only if `.claude/skills/<name>/` belongs to another project.

## 1. Knowledge files (master copies in `agent_outputs/<project_slug>/`)

Copy the four skeletons from `agent_template/references/*.template.md` (never overwrite an existing copy) and fill them from `project_state.md`, the spec and the dashboard files:

| File | Content |
|---|---|
| `business-context.md` | The business behind the dashboard: purpose and audience, terms, metric meaning, data caveats, exclusion and compliance rules, output preferences. What the user said = plain facts; what was inferred from the data = `[INFERRED — please confirm]`; open questions = `- [NEEDS YOUR INPUT] …` |
| `data-dictionary.md` | Every table and column the dashboard reads, grain, event time column and timezone, data-quality notes |
| `metrics-catalog.md` | Every KPI: formula, source, exclusions, validated value with date (the spot-checks), tab / widget |
| `sql-templates.md` | Every `QUERIES` entry, the workflow SQL (if any), source-table fallbacks |

## 2. Build in staging

`customer_agent_pattern.md` Step 2, then add the dashboard files next to the knowledge files:

```bash
d="agent_outputs/<project_slug>"; stage="$d/agent_build/<project_slug>-dashboard"
cp "$d/metrics-catalog.md" "$d/sql-templates.md" "$stage/references/"
cp "$d/dashboards/"{dashboard.template.html,generate-data.js,chart.umd.min.js} "$stage/references/"
```

Placeholders in `SKILL.md`:

| Placeholder | Value |
|---|---|
| `{{agent_name}}` | `<project_slug>-dashboard` |
| `{{project_name}}` | Project display name (e.g. `Sales Performance`) |
| `{{engagement_dir}}` | `agent_outputs/<project_slug>` |
| `{{dashboard_title}}` | The dashboard title (`CONFIG.title`) |
| `{{data_database}}` | The database the dashboard reads (SINK on the workflow path, otherwise source) |
| `{{data_source_note}}` | `pre-aggregated by workflow <project>` or `queried directly from the source tables` |
| `{{source_database}}`, `{{sink_database}}` | Confirmed databases (sink = source on the direct path) |
| `{{trigger_phrases}}` | 3–5 natural phrases from the title and goal (e.g. "sales dashboard", "show me sales performance") |

Never copy `dashboard.html`, query output or `*.template.md` files into the skill.

## 3. Register (after the user says yes)

`customer_agent_pattern.md` Step 3 to `.claude/skills/<project_slug>-dashboard/`, then check from the Work Folder root:

1. The refresh command in the installed `SKILL.md` exits without error and rewrites `agent_outputs/<project_slug>/dashboards/dashboard.html`; nothing new appears in `.claude/skills/<project_slug>-dashboard/`.
2. `grep -c "INFERRED\|NEEDS YOUR INPUT" .claude/skills/<project_slug>-dashboard/references/business-context.md` — tell the user how many business-context items are still open and that the skill answers "which definitions are unconfirmed?".

Tell the user: the skill is available in new chats in this folder (and can be shared with Studio's Develop → Share); try "Show me the dashboard", "How is <KPI> calculated?", "Add <metric> to the overview tab".

## Rebuilds

Whenever a master copy changes (business context answered, a metric added through the skill, a workflow change): repeat Step 2 (the staging `SKILL.md` keeps earlier fixes) and Step 3. No new question for a refresh of the same skill.
