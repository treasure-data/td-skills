# NBA Engagement Scores — Customer Agent Setup

NBA specifics for `../../shared/customer_agent_pattern.md` (agent name, staging build, install, verify). Template: `<solution_dir>/project_templates/agent_template/`. Agent name: `<project_slug>-agent` (`nba-scores-agent` by default).

## What the agent does

Answers questions about the deployed NBA run — latest-run summary, score and flag distributions, run-to-run comparison, source volumes, "how is X scored" — by querying the three `nba_dash_*` tables in the sink database, and builds the standalone HTML dashboard with `references/generate-data.js`.

## Placeholders

Only the standard placeholders are used, all in `.md` files:

| Placeholder | Value | Used in |
|---|---|---|
| `{{agent_name}}` | Confirmed agent name | `SKILL.md` frontmatter, generator path in `SKILL.md` and `references/dashboard_template.md` |
| `{{project_name}}` | Project display name (e.g. `Loyalty NBA Scores`) | `SKILL.md` description and intro, dashboard command |
| `{{project_slug}}` | Project slug (e.g. `loyalty-nba-scores`) | Dashboard command |
| `{{sink_database}}` | Confirmed sink database | `SKILL.md`, `references/data-dictionary.md`, `references/dashboard_template.md` |
| `{{engagement_dir}}` | `agent_outputs/<project_slug>` | `SKILL.md`, `references/dashboard_template.md`, `references/visualization-instructions.md` |

`references/generate-data.js` and `references/dashboard_template.html` are copied unchanged — their `{{…}}` tokens are filled by the script at run time.

The engagement's `business-context.md` is copied in at every build (`../../shared/customer_agent_pattern.md` Step 2) — drafted from `references/business-context.template.md` in Phase 1; the skeleton itself is never installed. What each score and flag means lives in `references/data-dictionary.md` (Metric Definitions).

`references/workflow-guide.template.md` and `references/model-setup-walkthrough.template.md` are **guide skeletons**: removed from every build and filled only when the user chose the guides — interim in Phase 4, final in Phase 5 (Guides, below).

## Agent files

Show this table to the user after every build (`../../shared/customer_agent_pattern.md` Step 6), with only the files the build contains, then a starter prompt.

| File | What it is for | Ask it, for example |
|---|---|---|
| `SKILL.md` | The agent's instructions: what it answers, which tables it queries, its accuracy rules | "What can you help me with?" |
| `references/business-context.md` | Your business knowledge — terms, definitions (conversion, cart abandonment, channel names), data edge cases, goals and exclusion rules. Keep adding to it while you test: the more it says, the better the agent understands your data and jargon, and the less it guesses | "Which of our business definitions are still unconfirmed?" |
| `references/data-dictionary.md` | Every NBA dashboard table and column, and what each score and flag means (Next Best Channel, Time, Campaign, cart-abandon, new-visitor) | "How is the Next Best Channel chosen for a profile?" |
| `references/workflow-guide.md` (if built) | The deployed workflow end to end: sources, filters, config values, output tables | "Which channels count as paid, and why?" |
| `references/model-setup-walkthrough.md` (if built) | What was decided during setup and why, the validation baseline and accuracy rules | "Why is the cart-abandon window set to this value?" |
| `references/dashboard_template.md`, `dashboard_template.html`, `generate-data.js`, `visualization-instructions.md` | The NBA Model Summary dashboard: the agent runs `generate-data.js` to fill the HTML template with the latest run, and follows the chart rules for answers in chat | "Show me the NBA dashboard" |
| `references/runbook.md` (Phase 5) | Operating the production workflow | "How do I re-run the workflow?" |

## Build checks (Phase 4 Part A)

After installing, from the Work Folder root:

1. `tdx query -d <sink_database> "SELECT MAX(session_id) FROM nba_dash_model_metrics"` returns the validated run.
2. Generate the dashboard once with the command in the installed `SKILL.md`. Pass = the command exits without an error and `ls -l agent_outputs/<project_slug>/dashboards/nba_summary_dashboard.html` shows the file. Nothing else — the dashboard template and `generate-data.js` are pre-validated: run the command once and use the result as it is. Do not take screenshots, run browser, QA or validation scripts, re-check the data, or edit the generated HTML, and do not apply other visualization or design skills to it. If something looks wrong, tell the user instead of fixing it. Requires `node`; if it is missing, tell the user the chat analysis still works and the HTML dashboard needs Node.js.

## Guides (Phase 4 interim, Phase 5 final)

Built only when the user chose them (Phase 3 end question for interim, Phase 5 question for final) — mechanics and the Interim / Final status line in `../../shared/customer_agent_pattern.md` Step 4:

| File | Content |
|---|---|
| `workflow-guide.md` | Fill `<solution_dir>/project_templates/agent_template/references/workflow-guide.template.md` — the as-built workflow: pipeline, config values, source mappings, channel / scoring / flag rules, customizations, output tables. Follow the skeleton's build instructions |
| `model-setup-walkthrough.md` | Fill `<solution_dir>/project_templates/agent_template/references/model-setup-walkthrough.template.md` — discovery, requirements, decision log, data cleaning, runs and validation baseline, Parent Segment, artifacts, presentation recipe, accuracy rules. Follow the skeleton's build instructions |

Interim guides describe the setup deployed so far — assumed defaults marked "to confirm", Parent Segment and docs sections "Not done yet — Phase 5". They are already routed by the **How It Was Built** section of `SKILL.md`.

## Finalize (Phase 5)

Rebuild with the confirmed `business-context.md` (playbook Phase 5 step 3; Step 2 copies it), then add to the staging folder's `references/`:

| File | Content |
|---|---|
| `runbook.md` | Copy of `docs/runbook.md` |

Add `runbook.md` to the **Initialization** list in the staging `SKILL.md` as "read only for operations questions"; then ask about the final guides (Guides, above). Add one line under **Critical Rules**: "When `workflow-guide.md` and the run config in `nba_dash_model_metrics` disagree, report the difference — the table reflects what actually ran." Run the placeholder check in `../../shared/customer_agent_pattern.md` Step 2 before installing.
