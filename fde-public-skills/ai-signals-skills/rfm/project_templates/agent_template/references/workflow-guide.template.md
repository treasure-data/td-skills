# RFM Customer Segmentation — Workflow Guide (<project name>)

Use this document to answer questions about how **this customer's deployed** RFM workflow works end to end: its structure, execution order, configuration, source mappings, scoring, customizations and the tables each step writes. For how the model scores, see `ai-signals-guide.md`; for this customer's business definitions, see `business-context.md`; for table schemas, see `data-dictionary.md`.

<!-- Build instructions (Phase 4 interim or Phase 5 final — remove this comment and every `fill` block when done):
- Interim (Phase 4): describe the setup deployed so far; mark assumed defaults "to confirm"; sections with nothing yet
  (e.g. Parent Segment) say "Not done yet — Phase 5". Final (Phase 5): update the interim file in place, keep the history.
- Save the filled copy as references/workflow-guide.md in the agent staging folder. Never install this .template.md file.
- Sources, in priority order: the deployed working copy (workflow/config/input_params.yml, workflow/*.dig for the pipeline; SQL
  files only if they were changed from the template — don't read unchanged SQL), project_state.md, docs/architecture.md, the latest validated run (rfm_stats_model_params,
  rfm_src_table_summary, rfm_stats). Describe what is DEPLOYED, never template defaults.
- Explain parameters in plain words (meanings from workflow/README.md) and quote exact values and expressions in backticks.
  No YAML blocks, no secrets, no personal names or email addresses (write the role or "alert recipient").
- Record "as of" dates. Refresh this file whenever the workflow config or .dig files change (Phase 4 or later).
-->

**Status:** <Interim — pre-production | Final — production>  ·  **As of:** <date of the deployed revision this guide describes>

---

## Workflow Overview

<!-- fill:
- One paragraph: what the workflow does for this customer (sources in, per-profile R/F/M scores and segment out, Parent Segment use)
- TD workflow project name and ID, entry point (rfm_launch), last pushed revision and date (workflow/tdx.json)
- Sink database, globals.canonical_id (profile ID column), working copy path (<engagement dir>/workflow/)
- Scoring with the AI Signals RFM model: endpoint (region) and any optional API parameters set in rfm_ai_signals.dig
- History window as deployed: all history, or time_filter_type with its dates or lookback_period, in plain words
- Schedule (or "manual runs only"), failure alert (enabled / commented out)
-->

## End-to-End Pipeline

<!-- fill:
- Tree of rfm_launch.dig as deployed: every step in run order and the sub-workflow it calls (union → scoring → stats)
- Mark any step that is disabled, skipped (built_union_activity = no) or added for this customer, with the reason
- One line per stage on what it produces
-->

## Source Tables

<!-- fill — one subsection per entry in aggregate_metrics_tables:
- Heading: `<src_table>` — what it records, name used in the union, which of R / F / M it feeds
- Table: column role (join_key, unixtime_col, order_amount, context_col) → exact expression → note on why it was chosen
- custom_filter in plain words (what is kept / excluded and why); apply_time_filter; query_type (custom SQL file if any)
- Latest validated volumes from rfm_src_table_summary: profiles, events, spend, date range (session ID)
- Tables reviewed in Phase 1 but excluded, with the reason (from project_state.md)
-->

## Key Data-Prep Decisions

<!-- fill:
- Table: parameter → deployed value → what it means for this customer → why this value (from project_state.md decisions)
- Cover: time filter and window, monetary source and column, row-level counting (page views, order lines), num_bins
- Call out any value chosen because of data conditions (e.g. stale data → range filter, large recency values)
-->

## Scoring and Segments as Deployed

<!-- fill:
- How recency, frequency and monetary_value are computed per profile (min recency across sources, sum of touchpoints, sum of spend)
- Scoring: the AI Signals RFM model (quartiles on the 25th/50th/75th percentiles; with mv_threshold set, monetary cut-offs
  come from profiles above it — ai-signals-guide.md §5) — and the cut-off values seen in the latest run if known
- rfm_score and rfm_quartile, and the segment rules (the ten segments, fixed by the model)
- Segment mix of the latest validated run (from rfm_stats), with the session ID
-->

## Step-by-Step Reference

<!-- fill — one subsection per .dig file that runs (rfm_union_all_activity, rfm_ai_signals, rfm_agg_stats):
- Purpose in one sentence
- Steps in order → output table of each step
- Key SQL files and their logic — only those needed to explain behavior, plus every file changed for this customer
-->

## Customizations Beyond the Template

<!-- fill:
- Table: file → change → reason → date (from project_state.md and docs/runbook.md)
- Include .dig edits (schedule, alert), custom source SQL, changed scoring or segment SQL
- If none: "No changes beyond config/input_params.yml."
-->

## Output Tables

<!-- fill:
- Table: table → produced by (.dig) → grain → purpose; mark the Parent Segment attribute table (output_table) and the
  rfm_stats* tables this agent reads; note which tables are replaced each run and which are appended (history)
- Parent Segment name and how the output table is joined (key), if Phase 5 added it
-->

## Changing or Re-running the Workflow

<!-- fill:
- Pointer to runbook.md for the re-deploy, run and monitoring commands
- Which parameter to change for the common requests (window, sources, filters, monetary column, scoring model)
- Reminder that after a config change this guide and the agent must be refreshed
-->
