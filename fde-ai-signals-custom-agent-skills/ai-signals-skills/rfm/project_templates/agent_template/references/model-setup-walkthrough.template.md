# RFM Customer Segmentation — Model Setup Walkthrough (<project name>)

Use this document to answer questions about **how this customer's RFM model was set up**: what data was explored, which decisions were made and why, what changed along the way, how the results were validated, and which artifacts exist. It is also the recipe for rebuilding or extending a customer-facing walkthrough presentation without repeating the discovery. For how the deployed workflow runs, see `workflow-guide.md`.

<!-- Build instructions (Phase 4 interim or Phase 5 final — remove this comment and every `fill` block when done):
- Interim (Phase 4): describe the setup deployed so far; mark assumed defaults "to confirm"; sections with nothing yet
  (e.g. Parent Segment) say "Not done yet — Phase 5". Final (Phase 5): update the interim file in place, keep the history.
- Save the filled copy as references/model-setup-walkthrough.md in the agent staging folder. Never install this .template.md file.
- Sources: project_state.md (Key Decisions per phase, validation results), requirements.md (questions and answers),
  docs/ (behavior, eval_results, runbook), the workflow working copy, the Parent Segment / segment YAML files, and the
  chat history of this engagement when it is available.
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
- Headline result of the validated run (profiles scored, largest and most valuable segments) in two or three sentences
-->

## Artifacts

<!-- fill:
- Local files (paths relative to the Work Folder): workflow working copy, project_state.md, requirements.md, docs/*,
  dashboards/*, parent_segments/*.yml and segment YAML (if any), customer agent folder, presentation HTML (if any)
- TD objects: workflow project (name, ID), sink database, output tables, Parent Segment (name, ID), segments / folders created
- One line each on what the artifact is for and who it is for (customer / internal)
-->

## Phase 1 — Data Discovery

<!-- fill:
- Databases and tables reviewed; for each: included or excluded, role, and the reason
- Profile ID column chosen and how it was checked (NULL rate, overlap across sources, distinct counts)
- Event time column chosen (time vs. a real event timestamp) and the evidence
- Data coverage and freshness per source (first / last event, gap to run date) and its consequence for the config
- Key profiling queries that drove decisions — the SQL in a code block and the result that mattered
-->

## Phase 2 — Requirements

<!-- fill:
- Questions sent to the customer (from requirements.md) and the answer to each, or "assumed default — pending"
- Defaults that were assumed for the first push and whether the customer later confirmed them
-->

## Decision Log

<!-- fill — chronological table: date → phase → decision → alternatives considered → reason / evidence → config or file affected:
- Phase 3 initial config: sources and mappings, which sources feed Monetary and with which column, filters, history window,
  scoring model (ai_signals or custom), context columns
- Name-gate outcomes: sink database, workflow project, agent name (and why a non-default was used)
- Changes to the template (.dig or SQL) and why
- Phase 4 changes from the customer's answers: before → after, and the re-run that confirmed them
-->

## Data Quality and Cleaning

<!-- fill:
- Every filter or exclusion applied to source data (event types, statuses, bots / test users, duplicates) with the
  rows / profiles / conversions removed and why the threshold was chosen (show the distribution that justifies it)
- Known data-quality limits that remain (e.g. no monetary data, line-item or page-load counting, stale data) and their effect on scores
- If none: "No cleaning beyond the source filters listed in workflow-guide.md."
-->

## Runs and Validation

<!-- fill:
- Table of runs: session ID / attempt ID → date → result (success / failed) → what was learned or fixed
- Validation checks of the final run (Validate section of the solution's workflow-setup.md): check → result → numbers
- Baseline distributions for later comparison: profiles scored, segment sizes and shares, R / F / M quartile spread,
  monetary cut-offs if known, per-source profiles and spend
-->

## Benchmark Comparison

<!-- fill — only if the customer compared results with their own reference (analytics tool, CRM report, previous model):
- The reference source, its scope and how it was made comparable (mappings, exclusions, denominator)
- Per-metric or per-segment comparison: reference vs. model, gap, explanation, confidence rating
- If not done: "No benchmark comparison was made."
-->

## Parent Segment and Activation

<!-- fill:
- Parent Segment name / ID and the attributes added from the RFM output table (Phase 5 Step 1)
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
- Exact value spellings and casing in the data (segment names such as `Cannot lose them`, event types, statuses)
- Aggregation rules (tables that must be summed across sessions / months, distinct counting)
- Columns or tables that look right but must not be used, and why
- Anything a future chat got wrong once and should not repeat
-->

## Open Items and Limitations

<!-- fill:
- Pending customer answers, known limitations, agreed follow-ups and who owns each (role, not name)
-->
