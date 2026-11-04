# Probabilistic ID Unification — Model Setup Walkthrough (<project name>)

Use this document to answer questions about **how this customer's probabilistic ID unification was set up**: what data was explored, which identifiers and weights were chosen, which decisions were made and why, how the results were validated, and which artifacts exist. For how the deployed workflow runs, see `workflow-guide.md`.

<!-- Build instructions (Phase 4 interim or Phase 5 final — remove this comment and every `fill` block when done):
- Interim (Phase 4): describe the setup deployed so far; mark assumed defaults "to confirm"; sections with nothing yet
  say "Not done yet — Phase 5". Final (Phase 5): update the interim file in place, keep the history.
- Save the filled copy as references/model-setup-walkthrough.md in the agent staging folder. Never install this .template.md file.
- Sources: project_state.md (Key Decisions per phase, validation results), requirements.md, docs/, the workflow working copy
  (workflow/config/global.yml, workflow/sql/input_table.sql, workflow/*.dig), the latest run in the prob_* stats tables,
  and the chat history of this engagement when it is available.
- Every decision gets a reason. Every number gets its source (query or table) and the session ID / date it was taken from —
  numbers here are a BASELINE: re-query for current values and compare with the baseline.
- No secrets, no personal names or email addresses (write roles), no raw customer records — aggregates only.
- Keep it current: append to Decision Log and Accuracy Rules whenever a later chat changes the setup or finds a pitfall.
-->

**Status:** <Interim — pre-production | Final — production>  ·  **Engagement period:** <first phase date> → <latest update or finalize date>  ·  **Validated run:** <session ID, date>

---

## Engagement Summary

<!-- fill:
- Customer, goal of the unification, current status (phase, finalized date), business goals from requirements.md
- Timeline: one line per phase with its date and outcome
- Headline result of the validated run (IDs in, IDs removed, average similarity, quality rating) in two or three sentences
-->

## Artifacts

<!-- fill:
- Local files (paths relative to the Work Folder): workflow working copy (incl. sql/input_table.sql), project_state.md,
  requirements.md, docs/*, customer agent folder
- TD objects: workflow project (name, ID), sink database, input / blocking / cluster / dedupe tables, prob_* stats tables
- One line each on what the artifact is for and who it is for (customer / internal)
-->

## Phase 1 — Data Discovery

<!-- fill:
- Databases and tables reviewed; for each: included or excluded, role (deterministic ID source, identifier source), reason
- The deterministic ID column and how it was checked (NULLs, distinct counts)
- Identifier columns considered: fill rate, distinct count, shared or placeholder values found, why each was kept or dropped
- Key profiling queries that drove decisions — the SQL in a code block and the result that mattered
-->

## Phase 2 — Requirements

<!-- fill:
- Questions sent to the customer (from requirements.md) and the answer to each, or "assumed default — pending"
- Defaults assumed for the first push and whether the customer later confirmed them
-->

## Decision Log

<!-- fill — chronological table: date → phase → decision → alternatives considered → reason / evidence → config or file affected:
- Phase 3 initial setup: dedupe columns, types and weights, `jaccard_similarity_threshold`, `cluster_threshold`, `string_type`,
  `fill_missing`, block size limits
- Name-gate outcomes: sink database, workflow project, agent name (and why a non-default was used)
- Phase 4 tuning rounds: setting before → after, the evidence (sampled clusters, histogram, quality bands) and the re-run
-->

## Data Cleaning and Quality Checks

<!-- fill:
- Every filter or normalization applied in the input SQL (test accounts, placeholder values, NULL handling) with the IDs removed
- Over-merge and under-merge checks: clusters sampled, largest clusters inspected, what was found
- Known data-quality limits that remain and their effect on the matches
-->

## Runs and Validation

<!-- fill:
- Table of runs: session ID / attempt ID → date → key settings → result (success / failed) → what was learned or fixed
- Validation checks of the final run (Validate section of the solution's workflow-setup.md): check → result → numbers
- Baseline for later comparison: input rows, clusters, `deduped_ids`, average similarity, quality bands, `cluster_purity_pct`,
  `max_cluster_size`, histogram shape
-->

## Downstream Use

<!-- fill:
- How the unified ID is used (join to the profile table, Parent Segment, suppression) and by whom — or "Not done yet — Phase 5"
- Any consumers' checks (audience size before / after, duplicate rate in campaigns)
-->

## Walkthrough Presentation Recipe

<!-- fill — only if a customer-facing walkthrough was built; otherwise "No walkthrough built yet." and keep the headings as the plan:
- One subsection per section, in order: purpose → tables and queries (SQL in code blocks) → baseline results → layout (charts, tables)
- Rule: always query fresh; use the baseline only to spot unexpected changes
-->

## Accuracy Rules and Lessons Learned

<!-- fill — append-only list of pitfalls found during the engagement, each with the correct approach:
- Latest run through `prob_session_global_filter`; stats tables are appended
- `dedupe_<output_table>` holds matched IDs only
- Exact value spellings and placeholder values in the identifiers
- Anything a future chat got wrong once and should not repeat
-->

## Open Items and Limitations

<!-- fill:
- Pending customer answers, known limitations, agreed follow-ups and who owns each (role, not name)
-->
