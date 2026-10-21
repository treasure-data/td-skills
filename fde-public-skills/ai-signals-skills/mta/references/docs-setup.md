# MTA (Multi-Touch Attribution) — Documentation Set Content

MTA content for the Phase 5 docs. File names, audience headers, create order and update rules are in `../../shared/customer_docs_pattern.md`. Docs go to `agent_outputs/<project_slug>/docs/`. Doc titles: `# <Project Name> <Doc Name>` (e.g. `# Paid Media MTA Runbook`). MTA has no Parent Segment step — attribution outputs are tables, not profile attributes.

Sources for every value: `project_state.md`, `requirements.md`, the deployed config `workflow/config/input_params.yml`, `workflow/mta_advanced_launch.dig` (schedule, alert email), and the latest validation results. Describe what is deployed, not template defaults. Parameter meanings come from `workflow/README.md` — reword them for the audience instead of copying config syntax.

## 1. `docs/architecture.md` (customer)

- Data flow: source tables → unified, sessionized touchpoints with channel backfill → journeys that end at a conversion → standard models (First Touch, Last Touch, Linear, U-Shaped) → AI Signals Markov and Shapley models → validation and journey tables → dashboard → customer agent
- TD workflow project name and entry point (`mta_advanced_launch`), schedule (from the `.dig`), sink database
- Source tables with their role (touchpoint or conversion) and the channel each represents
- Output tables (from the README Outputs section), marking the ones the customer will use: `mta_markov_attribution_final`, `mta_shapley_attribution_final`, `mta_models_standard`, `mta_top_conversion_journeys`, `mta_sankey_journeys`

## 2. `docs/behavior.md` (customer)

Plain English, no YAML. For this customer:

- **Touchpoints** — which sources and events count (e.g. email opens and clicks, not sends), how channel, source and campaign are derived (UTM parameters, fixed labels), and how missing channels are filled from earlier touchpoints
- **Conversions** — the conversion definition, its value (revenue or count) and the exclusions
- **Journeys** — session gap, how many days before a conversion are credited, that each conversion starts a new journey, how small channels are grouped as `other`
- **Models** — what each model credits in plain words (first touch, last touch, equal split, U-Shaped weights as deployed, Markov removal effect, Shapley fair share) and the AI Signals analysis window; details in `ai-signals-guide.md`
- **Caveats** — e.g. low UTM coverage, offline sales not tracked, cross-device journeys, a time column that is the load time
- **Using the results** — the dashboard, the customer agent and the questions they answer

## 3. `docs/eval_results.md` (customer)

- Date and session ID of the run validated
- Result of each check in the Validate section of `workflow-setup.md` (pass/fail + the numbers): touchpoints and conversions per source, channel shares, journey-length distribution, standard model totals, Markov and Shapley rows for the run
- A short comparison of the channel ranking across models (where they agree and differ)
- Known limitations and what would improve them

## 4. `docs/runbook.md` (internal)

- Working copy path and TD project name; re-deploy: edit `workflow/config/input_params.yml` → `( cd workflow && tdx wf push -y )` → `tdx wf run <project>.mta_advanced_launch` → validate
- Monitoring: `tdx wf sessions <project>`, `tdx wf timeline <project>.mta_advanced_launch --follow`, `tdx wf attempt <id> tasks` / `logs +<task>`
- Schedule and failure-alert recipient (from the `.dig`); how to change them (edit the `.dig`, re-push)
- Models: the AI Signals Markov and Shapley models, the API endpoint used (region) and the analysis window; no secrets to manage
- The troubleshooting table from `workflow-setup.md`, filtered to what applies to this customer
- Customizations made beyond the config (from the README Customization Points), with file paths
- Rebuilding the customer agent after config changes (`../../shared/customer_agent_pattern.md`)

## 5. `docs/access_ownership.md` (internal)

Standard content per `../../shared/customer_docs_pattern.md`, plus: TD project name, sink database, customer agent name and path (`.claude/skills/<agent-name>/`).
