# MTA (Multi-Touch Attribution) — Customer Agent Setup

MTA specifics for `../../shared/customer_agent_pattern.md` (agent name, staging build, install, verify). Template: `<solution_dir>/project_templates/agent_template/`. Agent name: `<project_slug>-agent` (`mta-agent` by default).

## What the agent does

Answers questions about the deployed MTA run — which channels drive conversions under each model (First Touch, Last Touch, Linear, U-Shaped, Markov, Shapley), where the models agree or disagree, Markov removal effects and channel transitions, top conversion paths and Sankey flows, journey length and time to convert, source and channel-parsing checks, run-to-run changes, "how is attribution calculated" — by querying the MTA output tables in the sink database, and builds the standalone HTML dashboard with `references/generate-data.js`.

## Placeholders

Standard placeholders plus one MTA one, all in `.md` files:

| Placeholder | Value | Used in |
|---|---|---|
| `{{agent_name}}` | Confirmed agent name | `SKILL.md` frontmatter, generator path in `SKILL.md` and `references/dashboard_template.md` |
| `{{project_name}}` | Project display name (e.g. `Paid Media MTA`) | `SKILL.md` description and intro, dashboard command |
| `{{project_slug}}` | Project slug (e.g. `paid-media-mta`) | Dashboard command |
| `{{sink_database}}` | Confirmed sink database | `SKILL.md`, `references/` |
| `{{engagement_dir}}` | `agent_outputs/<project_slug>` | `SKILL.md`, `references/dashboard_template.md` |
| `{{customer_id_col}}` | `unique_user_id` from the deployed config (e.g. `canonical_id`) | Customer counts in `SKILL.md`, `references/data-dictionary.md`, `references/journey-agent.md`, dashboard command |

`references/generate-data.js` and `references/dashboard_template.html` are copied unchanged — their `{{…}}` tokens are filled by the script at run time.

Two files are copied in at every build (`../../shared/customer_agent_pattern.md` Step 2): the engagement's `business-context.md` (drafted from `references/business-context.template.md` in Phase 1 — the skeleton itself is never installed) and `<solution_dir>/references/ai-signals-guide.md`, unchanged.

`references/workflow-guide.template.md` and `references/model-setup-walkthrough.template.md` are **guide skeletons**: removed from every build and filled only when the user chose the guides — interim in Phase 4, final in Phase 5 (Guides, below).

## Agent files

Show this table to the user after every build (`../../shared/customer_agent_pattern.md` Step 6), with only the files the build contains, then a starter prompt.

| File | What it is for | Ask it, for example |
|---|---|---|
| `SKILL.md` | The agent's instructions: what it answers, which tables it queries, its accuracy rules | "What can you help me with?" |
| `references/business-context.md` | Your business knowledge — channel names and groupings, what a conversion is, buying cycle, data edge cases, goals and exclusion rules. Keep adding to it while you test: the more it says, the better the agent understands your data and jargon, and the less it guesses | "Which of our business definitions are still unconfirmed?" |
| `references/ai-signals-guide.md` | How the AI Signals Markov and Shapley models work: the input they need, their API parameters, how credit is calculated, how to validate the outputs, common changes | "Explain how Markov removal effect is calculated, and how I can check the results are ready for production" |
| `references/data-dictionary.md` | Every MTA output table and column, and what each metric means | "What is the difference between removal effect and attributed conversions?" |
| `references/mta-models-agent.md`, `references/journey-agent.md` | Query patterns for attribution models and for journeys, paths and Sankey flows | "Compare Markov and Last Touch by channel" · "Show the top 10 paths to conversion" |
| `references/workflow-guide.md` (if built) | The deployed workflow end to end: sources, channel expressions, conversion definition, config values, output tables | "How is a conversion defined?" |
| `references/model-setup-walkthrough.md` (if built) | What was decided during setup and why, the validation baseline and accuracy rules | "Why was the journey window set to 90 days?" |
| `references/dashboard_template.md`, `dashboard_template.html`, `generate-data.js`, `visualization-instructions.md` | The MTA Summary dashboard: the agent runs `generate-data.js` to fill the HTML template with the latest run, and follows the chart rules for answers in chat | "Show me the MTA dashboard" |
| `references/runbook.md` (Phase 5) | Operating the production workflow | "How do I re-run the workflow?" |

## Build checks (Phase 4 Part A)

After installing, from the Work Folder root:

1. `tdx query -d <sink_database> "SELECT MAX(run_time) FROM mta_markov_attribution_final"` returns the validated run.
2. Generate the dashboard once with the command in the installed `SKILL.md`. Pass = the command exits without an error and `ls -l agent_outputs/<project_slug>/dashboards/mta_summary_dashboard.html` shows the file. Nothing else — the dashboard template and `generate-data.js` are pre-validated: run the command once and use the result as it is. Do not take screenshots, run browser, QA or validation scripts, re-check the data, or edit the generated HTML, and do not apply other visualization or design skills to it. If something looks wrong, tell the user instead of fixing it. Requires `node`; if it is missing, tell the user the chat analysis still works and the HTML dashboard needs Node.js.

## Guides (Phase 4 interim, Phase 5 final)

Built only when the user chose them (Phase 3 end question for interim, Phase 5 question for final) — mechanics and the Interim / Final status line in `../../shared/customer_agent_pattern.md` Step 4:

| File | Content |
|---|---|
| `workflow-guide.md` | Fill `<solution_dir>/project_templates/agent_template/references/workflow-guide.template.md` — the as-built workflow: pipeline, config values, source mappings and channel expressions, conversion definition, journey settings, models, output tables. Follow the skeleton's build instructions |
| `model-setup-walkthrough.md` | Fill `<solution_dir>/project_templates/agent_template/references/model-setup-walkthrough.template.md` — discovery, requirements, decision log, data cleaning, runs and validation baseline, artifacts, presentation recipe, accuracy rules. Follow the skeleton's build instructions |

Interim guides describe the setup deployed so far — assumed defaults marked "to confirm", docs sections "Not done yet — Phase 5". They are already routed by the **How It Was Built** section of `SKILL.md`.

## Finalize (Phase 5)

Rebuild with the confirmed `business-context.md` (playbook Phase 5 step 3; Step 2 copies it), then add to the staging folder's `references/`:

| File | Content |
|---|---|
| `runbook.md` | Copy of `docs/runbook.md` |

Add `runbook.md` to the **Initialization** list in the staging `SKILL.md` as "read only for operations questions"; then ask about the final guides (Guides, above). Add one line under **Query Rules**: "When `workflow-guide.md` and the deployed config in `{{engagement_dir}}/workflow/config/input_params.yml` disagree, report the difference — the config reflects what actually runs." Run the placeholder check in `../../shared/customer_agent_pattern.md` Step 2 before installing.
