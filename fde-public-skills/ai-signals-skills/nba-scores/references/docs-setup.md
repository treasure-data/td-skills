# NBA Engagement Scores — Documentation Set Content

NBA content for the Phase 5 docs. File names, audience headers, create order and update rules are in `../../shared/customer_docs_pattern.md`. Docs go to `agent_outputs/<project_slug>/docs/`. Doc titles: `# <Project Name> <Doc Name>` (e.g. `# Loyalty NBA Scores Runbook`).

Sources for every value: `project_state.md`, `requirements.md`, the deployed config `workflow/config/input_params.yml`, `workflow/nba_eng_launch.dig` (schedule, alert email), and the latest validation results. Describe what is deployed, not template defaults. Parameter meanings come from `workflow/README.md` — reword them for the audience instead of copying config syntax.

## 1. `docs/architecture.md` (customer)

- Data flow: each source table and its role (touchpoint or conversion) → union and sessionization → the three scoring steps (time, channel, campaign + flags) → final table → Parent Segment attribute → dashboard tables → customer agent
- TD workflow project name and entry point (`nba_eng_launch`), schedule (from the `.dig`), sink database
- Output tables (from the README Outputs section) with the final table marked as the Parent Segment attribute table
- Final table columns the customer will use: `next_best_time`, `next_best_channel`, `next_best_campaign`, per-daypart and per-channel scores, the 7 flags

## 2. `docs/behavior.md` (customer)

Plain English, no YAML. For this customer:

- **History window** — which data is scored (rolling window or date range) and that it is recalculated every run
- **Next Best Time** — the four dayparts with the deployed hours and timezone; how a profile's top daypart and per-daypart scores are set; what the scoring style (`scoring_logic`) means for reading a score
- **Next Best Channel** — where channels come from (UTM medium, fixed labels for email/CRM), that rare channels are grouped as `others`, which channels got their own score
- **Next Best Campaign** — the decision order: cart abandon → recent purchase (Next Best Product) → recent ad engagement (Retargetting) → otherwise Prospecting
- **Flags** — one line each with the deployed windows: conversion, ad engagement (list the paid channels), recent ad engagement, recent purchase, cart abandon (add-to-cart event used), new visitor (days since first visit; no ads, no conversion), no ads or purchases. State that windows count back from the run date
- **Caveats** — e.g. low UTM coverage, line-item order counting, demo/stale data windows
- **Using the scores** — the Parent Segment and the example audiences created in Phase 5 Step 1

## 3. `docs/eval_results.md` (customer)

- Date and session ID of the run validated
- Result of each check in the Validate section of `workflow-setup.md` (pass/fail + the numbers): profile count vs. Parent Segment, pick distributions, flag counts, paid-channel / add-to-cart rule check, dashboard tables
- Per-source events, profiles, conversions and date range (from `nba_dash_source_tables`)
- Known limitations and what would improve them

## 4. `docs/runbook.md` (internal)

- Working copy path and TD project name; re-deploy: edit `workflow/config/input_params.yml` → `( cd workflow && tdx wf push -y )` → `tdx wf run <project>.nba_eng_launch` → validate
- Monitoring: `tdx wf sessions <project>`, `tdx wf timeline <project>.nba_eng_launch --follow`, `tdx wf attempt <id> tasks` / `logs +<task>`
- Schedule and failure-alert recipient (from the `.dig`); how to change them (edit the `.dig`, re-push)
- Secrets: none
- The troubleshooting table from `workflow-setup.md`, filtered to what applies to this customer
- Customizations made beyond the config (from the README Customization Points), with file paths
- Rebuilding the customer agent after config changes (`../../shared/customer_agent_pattern.md`)

## 5. `docs/access_ownership.md` (internal)

Standard content per `../../shared/customer_docs_pattern.md`, plus: TD project name, sink database, Parent Segment name, customer agent name and path (`.claude/skills/<agent-name>/`).
