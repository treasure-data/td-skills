# RFM Customer Segmentation — Documentation Set Content

RFM content for the Phase 5 docs. File names, audience headers, create order and update rules are in `../../shared/customer_docs_pattern.md`. Docs go to `agent_outputs/<project_slug>/docs/`. Doc titles: `# <Project Name> <Doc Name>` (e.g. `# Loyalty RFM Runbook`).

Sources for every value: `project_state.md`, `requirements.md`, the deployed config `workflow/config/input_params.yml`, `workflow/rfm_launch.dig` (schedule, alert email), and the latest validation results. Describe what is deployed, not template defaults. Parameter meanings come from `workflow/README.md` — reword them for the audience instead of copying config syntax.

## 1. `docs/architecture.md` (customer)

- Data flow: each source table and what it adds (R and F; M for monetary sources) → union (one row per profile per source) → per-profile Recency / Frequency / Monetary → scoring (AI Signals RFM model) → output table → Parent Segment attribute → dashboard tables → customer agent
- TD workflow project name and entry point (`rfm_launch`), schedule (from the `.dig`), sink database
- Output tables (from the README Outputs section) with the output table marked as the Parent Segment attribute table
- Output columns the customer will use: `rfm_segment`, `rfm_score`, `rfm_quartile`, `r_quartile`, `f_quartile`, `m_quartile`

## 2. `docs/behavior.md` (customer)

Plain English, no YAML. For this customer:

- **History window** — which data is scored (all history, rolling window or date range) and that scores are recalculated every run
- **Recency** — days since the last activity in any source, counted from the run date
- **Frequency** — number of activity rows across all sources, with the exclusions applied (e.g. no email sends, no cancelled orders); note row-level counting (every page view or order line counts once)
- **Monetary** — which column on which source, and that other sources add nothing
- **Scores** — each dimension is split into four equal groups (1–4, 4 = best); `rfm_score` is their average; `rfm_quartile` is the combined code
- **Segments** — the ten segments with one line each (rules from `ai-signals-guide.md` §5; priorities from `business-context.md`), and their share in this run
- **Caveats** — e.g. no monetary data, stale data and large recency values, line-item counting
- **Using the scores** — the Parent Segment and the example audiences created in Phase 5 Step 1

## 3. `docs/eval_results.md` (customer)

- Date and session ID of the run validated
- Result of each check in the Validate section of `workflow-setup.md` (pass/fail + the numbers): profile counts input vs. output vs. Parent Segment, score spread, segment mix, per-source contribution, dashboard tables
- Per-source profiles, touchpoints, spend and date range (from the union table / `rfm_src_table_summary`)
- Known limitations and what would improve them

## 4. `docs/runbook.md` (internal)

- Working copy path and TD project name; re-deploy: edit `workflow/config/input_params.yml` → `( cd workflow && tdx wf push -y )` → `tdx wf run <project>.rfm_launch` → validate
- Monitoring: `tdx wf sessions <project>`, `tdx wf timeline <project>.rfm_launch --follow`, `tdx wf attempt <id> tasks` / `logs +<task>`
- Schedule and failure-alert recipient (from the `.dig`); how to change them (edit the `.dig`, re-push)
- Scoring: the AI Signals RFM model, the API endpoint used (region) and any optional API parameters set (`references/ai-signals-guide.md` §3); no secrets to manage
- The troubleshooting table from `workflow-setup.md`, filtered to what applies to this customer
- Customizations made beyond the config (from the README Customization Points), with file paths
- Rebuilding the customer agent after config changes (`../../shared/customer_agent_pattern.md`)

## 5. `docs/access_ownership.md` (internal)

Standard content per `../../shared/customer_docs_pattern.md`, plus: TD project name, sink database, Parent Segment name, customer agent name and path (`.claude/skills/<agent-name>/`).
