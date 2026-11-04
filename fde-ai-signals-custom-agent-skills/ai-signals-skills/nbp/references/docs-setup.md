# NBP (Next Best Product) — Documentation Set Content

NBP content for the Phase 5 docs. File names, audience headers, create order and update rules are in `../../shared/customer_docs_pattern.md`. Docs go to `agent_outputs/<project_slug>/docs/`. Doc titles: `# <Project Name> <Doc Name>` (e.g. `# Loyalty NBP Runbook`).

Sources for every value: `project_state.md`, `requirements.md`, the deployed config `workflow/config/input_params.yml`, `workflow/nbp_launch.dig` (schedule, alert email), and the latest validation results. Describe what is deployed, not template defaults. Parameter meanings come from `workflow/README.md` — reword them for the audience instead of copying config syntax.

## 1. `docs/architecture.md` (customer)

- Data flow: interaction table (and item info table) → transaction table with filters and training exclusions → AI Signals NBP model (train, then predict top-K per user) → recommendation exclusions → item names and categories joined → per-user table with per-rank columns → Parent Segment attribute → dashboard tables → customer agent
- TD workflow project name and entry point (`nbp_launch`), schedule (from the `.dig`), sink database, table prefix
- Output tables (from the README Outputs section) with the user table marked as the Parent Segment attribute table
- Output columns the customer will use: `nbp_<n>`, `nb_category_<n>`, `nbp_<n>_sku`, `product_recommendations`, `product_categories`

## 2. `docs/behavior.md` (customer)

Plain English, no YAML. For this customer:

- **Input** — which interactions count (table, filter, e.g. completed purchases only), the history window, and that recommendations are recalculated every run
- **Model** — the algorithm in plain words (similar to the latest purchase, collaborative filtering on purchase patterns, or most popular products) and why it was chosen; details in `ai-signals-guide.md`
- **Recommendations** — how many per customer, whether already-purchased products can appear, and which products are excluded from training and from the recommendations
- **Coverage** — share of customers with recommendations in this run, and why some get none (no history in the window, sampling)
- **Caveats** — e.g. sparse data, a narrow catalog, a time column that is the load time
- **Using the recommendations** — the Parent Segment and the example audiences created in Phase 5 Step 1

## 3. `docs/eval_results.md` (customer)

- Date and session ID of the run validated
- Result of each check in the Validate section of `workflow-setup.md` (pass/fail + the numbers): users in the input vs. the model output vs. the user table vs. the Parent Segment, share with recommendations, item variety, dashboard tables
- Test-set results (precision / recall against the random baseline) if `run_model_test_set` is on
- Known limitations and what would improve them

## 4. `docs/runbook.md` (internal)

- Working copy path and TD project name; re-deploy: edit `workflow/config/input_params.yml` → `( cd workflow && tdx wf push -y )` → `tdx wf run <project>.nbp_launch` → validate
- Monitoring: `tdx wf sessions <project>`, `tdx wf timeline <project>.nbp_launch --follow`, `tdx wf attempt <id> tasks` / `logs +<task>`
- Schedule and failure-alert recipient (from the `.dig`); how to change them (edit the `.dig`, re-push)
- Model: the AI Signals NBP model, the algorithm, the API endpoint used (region) and the model name (`<prefix><algorithm>`); no secrets to manage
- The troubleshooting table from `workflow-setup.md`, filtered to what applies to this customer
- Customizations made beyond the config (from the README Customization Points), with file paths
- Rebuilding the customer agent after config changes (`../../shared/customer_agent_pattern.md`)

## 5. `docs/access_ownership.md` (internal)

Standard content per `../../shared/customer_docs_pattern.md`, plus: TD project name, sink database, table prefix, Parent Segment name, customer agent name and path (`.claude/skills/<agent-name>/`).
