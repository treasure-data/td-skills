# MTA (Multi-Touch Attribution) — Model Setup Walkthrough (<project name>)

Use this document to answer questions about **how this customer's MTA model was set up**: what data was explored, which decisions were made and why, what changed along the way, how the results were validated, and which artifacts exist. It is also the recipe for rebuilding or extending a customer-facing walkthrough presentation without repeating the discovery. For how the deployed workflow runs, see `workflow-guide.md`.

<!-- Build instructions (Phase 4 interim or Phase 5 final — remove this comment and every `fill` block when done):
- Interim (Phase 4): describe the setup deployed so far; mark assumed defaults "to confirm"; sections with nothing yet
  say "Not done yet — Phase 5". Final (Phase 5): update the interim file in place, keep the history.
- Save the filled copy as references/model-setup-walkthrough.md in the agent staging folder. Never install this .template.md file.
- Sources: project_state.md (Key Decisions per phase, validation results), requirements.md (questions and answers),
  docs/ (behavior, eval_results, runbook), the workflow working copy (workflow/config/input_params.yml, workflow/*.dig),
  the latest run in journey_src_union_summary, mta_journeys_validate, mta_models_standard, mta_markov_attribution_final and
  mta_shapley_attribution_final (latest run_time), and the chat history of this engagement when it is available.
- Every decision gets a reason. Every number gets its source (query or table) and the session ID / run time it was taken
  from — numbers here are a BASELINE: when answering questions, re-query for current values and compare with the baseline.
- No secrets, no personal names or email addresses (write roles), no raw customer records — aggregates only.
- Keep it current: append to Decision Log and Accuracy Rules whenever a later chat changes the setup or finds a pitfall.
-->

**Status:** <Interim — pre-production | Final — production>  ·  **Engagement period:** <first phase date> → <latest update or finalize date>  ·  **Validated run:** <session ID, date>

---

## Engagement Summary

<!-- fill:
- Customer, solution, current status (phase, finalized date), business goals stated in requirements.md
- Timeline: one line per phase with its date and outcome
- Headline result of the validated run (sources, touchpoints, conversions, journeys; top channels under Last Touch, Markov
  and Shapley) in two or three sentences
-->

## Artifacts

<!-- fill:
- Local files (paths relative to the Work Folder): workflow working copy, project_state.md, requirements.md, docs/*,
  dashboards/*, customer agent folder, presentation HTML (if any)
- TD objects: workflow project (name, ID), sink database ({{sink_database}}), the output tables the agent reads
- One line each on what the artifact is for and who it is for (customer / internal)
-->

## Phase 1 — Data Discovery

<!-- fill:
- Databases and tables reviewed; for each: included or excluded, role (touchpoint, conversion, profile / system), the
  channel it represents, and the reason
- Customer ID chosen ({{customer_id_col}}) and how it was checked across sources (NULL rate, same column name everywhere)
- Event time column per source (time vs. a real event timestamp) and the evidence
- UTM coverage of the web sources and the channel, source and campaign values found
- Conversion candidates found (order statuses, conversion pages, form events) and the one chosen
- Data coverage and freshness per source (first / last event, gap to run date) and its consequence for the config
  (journey window, AI Signals window)
- Key profiling queries that drove decisions — the SQL in a code block and the result that mattered
-->

## Phase 2 — Requirements

<!-- fill:
- Questions sent to the customer (from requirements.md) and the answer to each, or "assumed default — pending"
- Defaults that were assumed for the first push and whether the customer later confirmed them
-->

## Decision Log

<!-- fill — chronological table: date → phase → decision → alternatives considered → reason / evidence → config or file affected:
- Phase 3 initial config: sources and their channel expressions, `custom_filter` per source, conversion definition and value,
  `session_length`, `max_journey_days`, small-channel thresholds, time filters, AI Signals window and limits,
  `shapley_lookback_window`, customer enrichment
- Name-gate outcomes: sink database, workflow project, agent name (and why a non-default was used)
- Changes to the template (.dig or SQL, custom source queries, channel grouping) and why
- Phase 4 changes from the customer's answers: before → after, and the re-run that confirmed them
-->

## Data Quality and Cleaning

<!-- fill:
- Every filter applied to source data (email sends, cancelled or test orders, bots, NULL IDs, language or market filters)
  with the rows / customers removed and why
- Channel values that were merged, renamed or grouped as `other`, and the business-context.md rule behind each
- Known data-quality limits that remain (e.g. low UTM coverage, untracked offline touchpoints, load-time timestamps) and
  their effect on the attribution
- If none: "No cleaning beyond the source filters listed in workflow-guide.md."
-->

## Runs and Validation

<!-- fill:
- Table of runs: session ID / attempt ID → date → result (success / failed) → what was learned or fixed
- Validation checks of the final run (Validate section of the solution's workflow-setup.md): check → result → numbers
- Baseline for later comparison: touchpoints and conversions per source, channel shares of events and conversions,
  journey-length distribution, conversions per standard model, Markov attribution and removal effect per channel, Shapley
  share per channel (with the run_time)
-->

## Benchmark Comparison

<!-- fill — only if the customer compared results with their own reference (platform attribution, analytics tool, last-click report):
- The reference source, its scope and how it was made comparable (conversion definition, window, channel names)
- Per-channel comparison: reference vs. model, gap, explanation, confidence rating
- If not done: "No benchmark comparison was made."
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
- Exact value spellings and casing in the data (channel names, `attribution_type` values, statuses)
- Aggregation rules (sum `conversions` across `conversion_month` in mta_sankey_journeys, latest `run_time` for Markov and
  Shapley, APPROX_DISTINCT(conversion_journey_id) for journeys)
- Columns or tables that look right but must not be used, and why
- Anything a future chat got wrong once and should not repeat
-->

## Open Items and Limitations

<!-- fill:
- Pending customer answers, known limitations, agreed follow-ups and who owns each (role, not name)
-->
