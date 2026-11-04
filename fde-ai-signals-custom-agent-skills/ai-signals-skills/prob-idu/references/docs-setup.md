# Probabilistic ID Unification — Documentation Set Content

Probabilistic IDU content for the Phase 5 docs. File names, audience headers, create order and update rules are in `../../shared/customer_docs_pattern.md`. Docs go to `agent_outputs/<project_slug>/docs/`. Doc titles: `# <Project Name> <Doc Name>` (e.g. `# Customer Probabilistic IDU Runbook`).

Sources for every value: `project_state.md`, `requirements.md`, `business-context.md`, the deployed working copy (`workflow/config/global.yml`, `workflow/sql/input_table.sql`, `workflow/ml_prob_unification_launch.dig` for schedule and alert email), and the latest validation results. Describe what is deployed, not template defaults. Parameter meanings come from `workflow/README.md` — reword them for the audience instead of copying config syntax.

## 1. `docs/architecture.md` (customer)

- Data flow: deterministic IDU output → input table (one row per canonical ID) → MinHash blocking → AI Signals `pidu` clustering → final dedup and merge → `dedupe_<output_table>` → Parent Segment attributes; stats tables → customer agent and dashboard
- TD workflow project name and entry point (`ml_prob_unification_launch`), schedule, sink database, input / blocking / output table names
- Output tables (from the README Outputs section), with `dedupe_<output_table>` marked as the Parent Segment attribute table
- Output columns the customer will use: the cluster ID (`prob_id`), `avg_cluster_similarity`

## 2. `docs/behavior.md` (customer)

Plain English, no YAML. For this customer:

- **Identifiers** — which columns are compared, their type and weight, and why
- **Matching** — blocking in plain words (only likely matches are compared), how the weighted similarity is combined, the thresholds chosen and the precision / recall preference behind them
- **Results** — what a cluster ID means, what `avg_cluster_similarity` says about a match, that only IDs in a cluster of two or more appear in the final table
- **Exclusions and caveats** — excluded records, high-NULL columns, shared identifiers, the `experimental` solution version if still in use
- **Using the cluster IDs** — the Parent Segment and the example audiences created in Phase 5 Step 1

## 3. `docs/eval_results.md` (customer)

- Date and session ID of the run validated
- Result of each check in the Validate section of `workflow-setup.md` (pass/fail + the numbers): input rows, blocking-table size and blocks, clusters and IDs merged, cluster size histogram, average and low-similarity shares, estimated savings
- A manual review of a sample of clusters (50–100) with the share judged correct
- Known limitations and what would improve them

## 4. `docs/runbook.md` (internal)

- Working copy path and TD project name; re-deploy: edit `workflow/config/global.yml` or `workflow/sql/input_table.sql` → `( cd workflow && tdx wf push -y )` → `tdx wf run <project>.ml_prob_unification_launch` → validate
- Monitoring: `tdx wf sessions <project>`, `tdx wf timeline <project>.ml_prob_unification_launch --follow`, `tdx wf attempt <id> tasks` / `logs +<task>`
- Schedule and failure-alert recipient (from the launch `.dig`); how to change them (edit the `.dig`, re-push)
- Model: the AI Signals `pidu` solution, `ml_batch_version`, the API endpoint (region); no secrets to manage
- Tuning guidance: the symptom → fix tables in `workflow-setup.md`, how to compare two runs in `prob_model_table_params` / `prob_uni_config_stats_table`
- The troubleshooting tables from `workflow-setup.md` and `ai-signals-guide.md` §6, filtered to what applies to this customer
- The input SQL as deployed (path) and every change made beyond the config, with dates
- Rebuilding the customer agent after config or SQL changes (`../../shared/customer_agent_pattern.md`)

## 5. `docs/access_ownership.md` (internal)

Standard content per `../../shared/customer_docs_pattern.md`, plus: TD project name, sink database, output and dedupe table names, Parent Segment name, customer agent name and path (`.claude/skills/<agent-name>/`).
