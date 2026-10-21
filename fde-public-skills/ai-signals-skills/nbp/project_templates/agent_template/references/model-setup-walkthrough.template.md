# NBP (Next Best Product) — Model Setup Walkthrough (<project name>)

Use this document to answer questions about **how this customer's NBP model was set up**: what data was explored, which decisions were made and why, what changed along the way, how the results were validated, and which artifacts exist. It is also the recipe for rebuilding or extending a customer-facing walkthrough presentation without repeating the discovery. For how the deployed workflow runs, see `workflow-guide.md`.

<!-- Build instructions (Phase 4 interim or Phase 5 final — remove this comment and every `fill` block when done):
- Interim (Phase 4): describe the setup deployed so far; mark assumed defaults "to confirm"; sections with nothing yet
  (e.g. Parent Segment) say "Not done yet — Phase 5". Final (Phase 5): update the interim file in place, keep the history.
- Save the filled copy as references/model-setup-walkthrough.md in the agent staging folder. Never install this .template.md file.
- Sources: project_state.md (Key Decisions per phase, validation results), requirements.md (questions and answers),
  docs/ (behavior, eval_results, runbook), the workflow working copy (workflow/config/input_params.yml, workflow/*.dig),
  the Parent Segment / segment YAML files, the latest run in {{table_prefix}}dash_model_param_stats_agg and
  {{table_prefix}}global_session_filter, and the chat history of this engagement when it is available.
- Every decision gets a reason. Every number gets its source (query or table) and the session ID / date it was taken from —
  numbers here are a BASELINE: when answering questions, re-query for current values and compare with the baseline.
- No secrets, no personal names or email addresses (write roles), no raw customer records — aggregates only.
- Keep it current: append to Decision Log and Accuracy Rules whenever a later chat changes the setup or finds a pitfall.
-->

**Status:** <Interim — pre-production | Final — production>  ·  **Engagement period:** <first phase date> → <latest update or finalize date>  ·  **Validated run:** <session ID, date>

---

## Engagement Summary

<!-- fill:
- Customer, solution, current status (phase, finalized date), business goals stated in requirements.md
- Timeline: one line per phase with its date and outcome
- Headline result of the validated run (users with recommendations, coverage rate, distinct items recommended, top
  recommended item and category) in two or three sentences
-->

## Artifacts

<!-- fill:
- Local files (paths relative to the Work Folder): workflow working copy, project_state.md, requirements.md, docs/*,
  dashboards/*, parent_segments/*.yml and segment YAML (if any), customer agent folder, presentation HTML (if any)
- TD objects: workflow project (name, ID), sink database, table prefix, {{user_master_table}} and dashboard tables,
  Parent Segment (name, ID), segments / folders created
- One line each on what the artifact is for and who it is for (customer / internal)
-->

## Phase 1 — Data Discovery

<!-- fill:
- Databases and tables reviewed; for each: included or excluded, role (transactions, item info / catalog, other), and the reason
- User ID column chosen and how it was checked (NULL rate, distinct counts, overlap with the Parent Segment key)
- Item ID, item name and item category columns chosen; item grain (SKU vs. product) and how names / categories were checked
  (one name per ID, NULL or empty categories)
- Event time column chosen (time vs. a real order timestamp) and the evidence
- Data coverage and freshness (first / last transaction, gap to run date), interactions per user, items per category,
  and their consequence for the config (window, algorithm)
- Key profiling queries that drove decisions — the SQL in a code block and the result that mattered
-->

## Phase 2 — Requirements

<!-- fill:
- Questions sent to the customer (from requirements.md) and the answer to each, or "assumed default — pending"
- Defaults that were assumed for the first push and whether the customer later confirmed them
-->

## Decision Log

<!-- fill — chronological table: date → phase → decision → alternatives considered → reason / evidence → config or file affected:
- Phase 3 initial config: source transaction and item info tables, column mappings, `transaction_filter`, `orders_lookback`,
  algorithm (`automl_model_type`) and why, ALS sampling, `max_recommended_items`, `filter_viewed`, exclusion filters (train /
  recs), test-set evaluation (`run_model_test_set`, `test_lookback`)
- Name-gate outcomes: sink database, table prefix, workflow project, agent name (and why a non-default was used)
- Changes to the template (.dig or SQL) and why
- Phase 4 changes from the customer's answers: before → after, and the re-run that confirmed them
-->

## Data Quality and Cleaning

<!-- fill:
- Every filter or exclusion applied to source data (order statuses, returns, test users, gift cards / services / fees,
  duplicates) with the rows / users / items removed and why the threshold was chosen (show the distribution that justifies it)
- Items removed from the recommendations by the post-model exclusion, and the business-context.md rule behind each
- Known data-quality limits that remain (e.g. missing categories, one SKU per size, stale data) and their effect on the recommendations
- If none: "No cleaning beyond the source filters listed in workflow-guide.md."
-->

## Runs and Validation

<!-- fill:
- Table of runs: session ID / attempt ID → date → algorithm → result (success / failed) → what was learned or fixed
- Validation checks of the final run (Validate section of the solution's workflow-setup.md): check → result → numbers
- Baseline for later comparison: source users, users with recommendations, coverage rate, distinct items recommended vs.
  catalog items, top rank-1 items and categories with their shares, model metrics (precision, recall, NDCG, MRR, MAP),
  test-set product / category match rates vs. random baselines
-->

## Benchmark Comparison

<!-- fill — only if the customer compared results with their own reference (existing recommender, bestseller list, analytics tool):
- The reference source, its scope and how it was made comparable (item grain, exclusions, denominator)
- Per-metric comparison: reference vs. model, gap, explanation, confidence rating
- If not done: "No benchmark comparison was made."
-->

## Parent Segment and Activation

<!-- fill:
- Parent Segment name / ID and the attributes added from {{user_master_table}} (Phase 5 Step 1) — or "Not done yet — Phase 5"
- Example audiences or segments created: name → rule in plain words → size at creation
- Activations or journeys that use the recommendations (email blocks, web placements), if any
-->

## Walkthrough Presentation Recipe

<!-- fill — only if a customer-facing walkthrough / presentation was built; otherwise "No walkthrough built yet." and
keep the headings below as the plan for one:
- Output file path and the date it was last generated
- One subsection per tab or section, in order: purpose → sources (files to read, tables) → queries (SQL in code blocks)
  → baseline results → layout (cards, charts, tables) → accuracy rules for that section
- Rule: always query fresh; use the baseline only to spot unexpected changes
-->

## Accuracy Rules and Lessons Learned

<!-- fill — append-only list of pitfalls found during the engagement, each with the correct approach:
- Exact value spellings and casing in the data (item names, categories, order statuses)
- Aggregation rules (sum `event_cnt` across item combinations, filter the latest `event_date` or `session_rnk = 1`)
- Columns or tables that look right but must not be used, and why
- Anything a future chat got wrong once and should not repeat
-->

## Open Items and Limitations

<!-- fill:
- Pending customer answers, known limitations, agreed follow-ups and who owns each (role, not name)
-->
