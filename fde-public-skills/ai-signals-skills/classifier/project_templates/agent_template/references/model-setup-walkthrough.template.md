# Classifier — Model Setup Walkthrough (<project name>)

Use this document to answer questions about **how this customer's classifier was set up**: what data was explored, how the outcome and population were defined, which decisions were made and why, what changed along the way, how the results were validated, and which artifacts exist. It is also the recipe for rebuilding or extending a customer-facing walkthrough presentation without repeating the discovery. For how the deployed workflow runs, see `workflow-guide.md`.

<!-- Build instructions (Phase 4 interim or Phase 5 final — remove this comment and every `fill` block when done):
- Interim (Phase 4): describe the setup deployed so far; mark assumed defaults "to confirm"; sections with nothing yet
  (e.g. Parent Segment) say "Not done yet — Phase 5". Final (Phase 5): update the interim file in place, keep the history.
- Save the filled copy as references/model-setup-walkthrough.md in the agent staging folder. Never install this .template.md file.
- Sources: project_state.md (Key Decisions per phase, validation results), requirements.md (questions and answers),
  docs/ (behavior, eval_results, runbook), the workflow working copy (workflow/config.yml, workflow/sql/input_features.sql,
  workflow/*.dig), the Parent Segment / segment YAML files, the latest run in classifier_run_log and {{pred_table}}_latest,
  and the chat history of this engagement when it is available.
- Every decision gets a reason. Every number gets its source (query or table) and the session ID / date it was taken from —
  numbers here are a BASELINE: when answering questions, re-query for current values and compare with the baseline.
- No secrets, no personal names or email addresses (write roles), no raw customer records — aggregates only.
- Keep it current: append to Decision Log and Accuracy Rules whenever a later chat changes the setup or finds a pitfall.
-->

**Status:** <Interim — pre-production | Final — production>  ·  **Engagement period:** <first phase date> → <latest update or finalize date>  ·  **Validated run:** <session ID, date>

---

## Engagement Summary

<!-- fill:
- Customer, use case (the outcome predicted), current status (phase, finalized date), business goals from requirements.md
- Timeline: one line per phase with its date and outcome
- Headline result of the validated run (AUC-ROC, precision / recall at the threshold, entities scored and flagged, top three
  drivers) in two or three sentences
-->

## Artifacts

<!-- fill:
- Local files (paths relative to the Work Folder): workflow working copy (incl. sql/input_features.sql), project_state.md,
  requirements.md, docs/*, dashboards/*, parent_segments/*.yml and segment YAML (if any), customer agent folder,
  presentation HTML (if any)
- TD objects: workflow project (name, ID), sink database, model name, {{pred_table}} and {{pred_table}}_latest, the
  classifier_* tables, Parent Segment (name, ID), segments / folders created
- One line each on what the artifact is for and who it is for (customer / internal)
-->

## Phase 1 — Data Discovery

<!-- fill:
- Use case and target as first stated, and how the label location was decided (existing column vs derived)
- Databases and tables reviewed; for each: included or excluded, role (population, label, feature source, Parent Segment), reason
- ID column chosen and how it was checked (NULLs, distinct counts, overlap across sources); join keys that differed per source
- Event time column per source (time vs a real event timestamp) and the evidence
- Label balance at the cut-off (population, positives, positive rate) and its consequence for the setup
- Data coverage and freshness (first / last event, gap to the run date → `reference_date`)
- Key profiling queries that drove decisions — the SQL in a code block and the result that mattered
-->

## Phase 2 — Requirements

<!-- fill:
- Questions sent to the customer (from requirements.md) and the answer to each, or "assumed default — pending"
- Defaults that were assumed for the first push and whether the customer later confirmed them
-->

## Decision Log

<!-- fill — chronological table: date → phase → decision → alternatives considered → reason / evidence → config or file affected:
- Phase 3 initial setup: population, label rule and `label_window_days`, feature sources and `feature_lookback_days`,
  `columns_to_drop`, `model_type`, objective and threshold settings, search budget
- Name-gate outcomes: sink database, workflow project, model name, agent name (and why a non-default was used)
- Changes to the feature SQL or the .dig files and why (features added / removed, leakage fixes)
- Phase 4 changes from the customer's answers: before → after, and the re-run that confirmed them
-->

## Data Quality and Leakage Checks

<!-- fill:
- Every filter or exclusion applied to the population or sources (test accounts, NULL IDs, duplicates, refunds) with the
  rows / entities removed and why
- Leakage review: features checked against the cut-off, columns removed because they record the outcome, the top SHAP
  feature and its target correlation
- Known data-quality limits that remain and their effect on the scores
-->

## Runs and Validation

<!-- fill:
- Table of runs: session ID / attempt ID → date → model type / key settings → result (success / failed) → what was learned or fixed
- Validation checks of the final run (Validate section of the solution's workflow-setup.md): check → result → numbers
- Baseline for later comparison: training rows and positive rate, AUC-ROC, AUC-PR, precision / recall / F-beta at
  `best_threshold`, train-vs-test gap, PSI, top 10 features with direction, entities scored, share flagged, bucket distribution
-->

## Benchmark Comparison

<!-- fill — only if the customer compared the model with their own reference (an existing score, rules, a later window of
actual outcomes):
- The reference, its scope and how it was made comparable (population, outcome window)
- Per-metric comparison: reference vs model, gap, explanation, confidence rating
- If not done: "No benchmark comparison was made."
-->

## Parent Segment and Activation

<!-- fill:
- Parent Segment name / ID and the attributes added from {{pred_table}}_latest (Phase 5 Step 1) — or "Not done yet — Phase 5"
- Example audiences or segments created: name → rule in plain words → size at creation
- Activations or journeys that use the scores, if any
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
- Scales (auc_roc / aucpr / f1_score are 0–100), latest run by `time`, dedupe appended tables
- Exact value spellings in the data (statuses, plan names, score buckets)
- Columns or tables that look right but must not be used, and why (e.g. post-outcome fields)
- Anything a future chat got wrong once and should not repeat
-->

## Open Items and Limitations

<!-- fill:
- Pending customer answers, known limitations, agreed follow-ups and who owns each (role, not name)
-->
