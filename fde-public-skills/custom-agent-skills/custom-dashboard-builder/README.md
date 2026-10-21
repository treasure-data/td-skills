# Custom Dashboard Builder — User Guide

Build a custom HTML dashboard on your Treasure Data data — new, or converted from an existing dashboard — and get a **dashboard skill** for your project that opens it, explains every number and adds metrics when you ask. Everything stays in your Treasure AI Studio Work Folder: no uploads, no hosting.

## Getting started

1. Enable the `custom-agent-skills` plugin from the `fde-public-skills` marketplace in Treasure AI Studio.
2. Open (or create) a Work Folder for the project, e.g. *Sales Dashboard*.
3. In a new chat: *"Build a custom sales dashboard"*, or *"Convert this dashboard into a TAIS HTML dashboard"* with the file attached.

## What happens

1. **Intake** — attach an existing dashboard (`.dash` export, HTML file or screenshot) or list the metrics and filters you want, and name the database. The project name is taken from the dashboard title.
2. **Data check and recommendation** — the builder explores the tables, validates every metric on live data (time column, exclusions, joins, data quality, size) and recommends either building directly from the source tables or setting up a workflow that pre-aggregates the data first. You accept or switch.
3. **Workflow** (only when recommended) — you see the plan and the suggested workflow project name and output database, change them if you like, and approve one build-and-run. The output tables are validated against the source and summarized for you.
4. **First draft** — the dashboard is built (`dashboard.html`, works offline), key numbers are checked against the source, and the dashboard skill is prepared with what the builder learned: business context (assumptions flagged for your review), data dictionary, metrics catalog and SQL. You decide whether to register it as a skill in the Work Folder.

From then on, use the skill in any chat in the folder:

- *"Show me the sales dashboard"* — refreshes the data and opens it
- *"How is average order value calculated?"*, *"Why did revenue drop in March?"*
- *"Which region grew fastest this quarter?"* — questions beyond the dashboard
- *"Add a return-rate KPI to the overview tab"*, *"Which business definitions are still unconfirmed?"*

On request the builder can also test the skill with ten prompts, write a questionnaire for your stakeholders about the open business-context items, or write handoff docs.

## Files

```
<Work Folder>/
├── agent_outputs/<project>/          # project files (git-ignored)
│   ├── project_state.md              # where things stand — ask "where are we?" to resume
│   ├── business-context.md, data-dictionary.md, metrics-catalog.md, sql-templates.md
│   ├── intake/                       # extracted spec of an existing dashboard
│   ├── workflows/                    # workflow files, if one was built
│   └── dashboards/                   # generate-data.js, dashboard.template.html, dashboard.html
└── .claude/skills/<project>-dashboard/   # the dashboard skill
```

Every number in `dashboard.html` can be read by anyone who opens the file — it never contains personal data rows. Very large or real-time data needs a different approach; the builder tells you at intake.

## For maintainers

| Path | Contents |
|---|---|
| `SKILL.md` | The 4-step flow and rules |
| `references/` | `intake.md`, `data-discovery.md`, `workflow-setup.md`, `dashboard-build.md`, `agent-setup.md`; on request: `eval-setup.md`, `requirements_doc.md`, `handoff-docs.md` |
| `project_templates/` | `workflow_template/` (with README), `dashboard_template/` (generic renderer + `generate-data.js` + vendored Chart.js 4.4.0, MIT), `agent_template/` (dashboard skill) |
| `tools/dash_to_html.py` | `.dash` export → `widget_audit.json` spec |

Shared patterns: `../shared/local_outputs.md`, `project_state.md`, `customer_agent_pattern.md`, `eval_pattern.md`.
