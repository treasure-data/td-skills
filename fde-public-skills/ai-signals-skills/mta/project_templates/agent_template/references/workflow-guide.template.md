# MTA (Multi-Touch Attribution) — Workflow Guide (<project name>)

Use this document to answer questions about how **this customer's deployed** MTA workflow works end to end: its structure, execution order, configuration, source mappings, channel expressions, the conversion definition, journey settings, the models, customizations and the tables each step writes. For how the Markov and Shapley models work, see `ai-signals-guide.md`; for this customer's business definitions, see `business-context.md`; for table schemas, see `data-dictionary.md`.

<!-- Build instructions (Phase 4 interim or Phase 5 final — remove this comment and every `fill` block when done):
- Interim (Phase 4): describe the setup deployed so far; mark assumed defaults "to confirm"; sections with nothing yet
  say "Not done yet — Phase 5". Final (Phase 5): update the interim file in place, keep the history.
- Save the filled copy as references/workflow-guide.md in the agent staging folder. Never install this .template.md file.
- Sources, in priority order: the deployed working copy (workflow/config/input_params.yml, workflow/*.dig for the pipeline —
  mta_advanced_launch.dig, mta_union_src_tables.dig, mta_journeys_and_models.dig, mta_markov_shapley_ai_signals.dig; SQL files
  only if they were changed from the template or are custom source queries — don't read unchanged SQL), project_state.md,
  docs/architecture.md, the latest validated run (mta_table_params, journey_src_union_summary, MAX(run_time) of
  mta_markov_attribution_final). Describe what is DEPLOYED, never template defaults.
- Explain parameters in plain words (meanings from workflow/README.md) and quote exact values and expressions in backticks.
  No YAML blocks, no secrets, no personal names or email addresses (write the role or "alert recipient").
- Record "as of" dates. Refresh this file whenever the workflow config or .dig files change (Phase 4 or later).
-->

**Status:** <Interim — pre-production | Final — production>  ·  **As of:** <date of the deployed revision this guide describes>

---

## Workflow Overview

<!-- fill:
- One paragraph: what the workflow does for this customer (which touchpoints and conversions in, which attribution views out,
  who uses them)
- TD workflow project name and ID, entry point (mta_advanced_launch), last pushed revision and date (workflow/tdx.json)
- Sink database ({{sink_database}}), customer ID (`unique_user_id` = {{customer_id_col}}), working copy path (<engagement dir>/workflow/)
- The AI Signals models: endpoint (`ml_batch_api_endpoint`, region), version (`ml_batch_api_version`)
- Schedule (or "manual runs only"), failure alert (enabled / commented out)
-->

## End-to-End Pipeline

<!-- fill:
- Tree of mta_advanced_launch.dig as deployed: every step in run order and the sub-workflow it calls
  (create sink database → mta_union_src_tables → mta_journeys_and_models → mta_markov_shapley_ai_signals)
- Inside mta_union_src_tables: per-source insert (standard or custom query), summary, sessionization and backfill, converted
  split, customer enrichment (on or off)
- Inside mta_markov_shapley_ai_signals: Markov and Shapley input, the two AI Signals runs in parallel, the *_final steps
- Mark any step that is disabled, skipped or added for this customer, with the reason
- One line per stage on what it produces
-->

## Source Tables and Channel Mapping

<!-- fill:
- Table: source (`name`) → `src_table` → role (touchpoint / conversion) → what one row means → latest validated volumes
  (touchpoints, customers, conversions, date range — from journey_src_union_summary with the session ID)
- Per source: event time column (`unixtime_col`) and why; channel (`medium_col`), source, campaign and context expressions in
  plain words; `custom_filter` in plain words (what is kept / excluded and why); `query_type` (standard or custom SQL file)
- UTM coverage of the web sources (from project_state.md) and how missing channels are backfilled (`backfill_partition_col`)
- Channel grouping rules beyond the template (journeys_base_table.sql), if any
- Tables reviewed in Phase 1 but excluded, with the reason (from project_state.md)
-->

## Conversion Definition

<!-- fill:
- Which source(s) produce conversions and the exact `conversion_flag` rule in plain words
- Conversion value (`item_price`): revenue column or count
- Exclusions (cancelled, returned, test) and the business-context.md rule behind each
-->

## Sessions, Journeys and Time Windows

<!-- fill:
- Table: parameter → deployed value → what it means for this customer → why this value (from project_state.md decisions)
- Cover: `session_length`, `max_journey_days`, `top_k_channel_perc` / `top_k_conv_perc` (which channels become `other`),
  `include_non_converted_channels`, the time filters (`time_filter_type`, dates or `lookback_period`, which sources apply them)
- That every conversion starts a new journey
- Call out any value chosen because of data conditions (e.g. stale data → wider AI Signals window, sparse touchpoints → longer sessions)
-->

## Attribution Models as Deployed

<!-- fill:
- Standard models: First Touch, Last Touch, Linear, U-Shaped with the deployed `u_shaped` weights
- AI Signals Markov: input (`markov_input_table`, one row per journey of mta_journeys), `markov_max_load_rows`,
  `removal_effect_limit`; outputs mta_markov_attribution_final and mta_markov_transition_final
- AI Signals Shapley: input (`shapley_input_table`, touches of multi-step, multi-channel journeys), `shapley_lookback_window`,
  `shapley_order`, `shapley_max_load_rows`;
  output mta_shapley_attribution_final
- Customer enrichment (`add_customer_analysis`, `customers_table`, `attributes_list`) — on or off
- Latest validated results, with the run time: top channels per model and where the models agree or differ
-->

## Step-by-Step Reference

<!-- fill — one subsection per .dig file that runs (mta_union_src_tables, mta_journeys_and_models, mta_markov_shapley_ai_signals):
- Purpose in one sentence
- Steps in order → output table of each step
- Key SQL files and their logic — only those needed to explain behavior, plus every file changed for this customer
-->

## Customizations Beyond the Template

<!-- fill:
- Table: file → change → reason → date (from project_state.md and docs/runbook.md)
- Include .dig edits (schedule, alert), custom source queries (sql/union_src_tables/<name>.sql), channel grouping changes,
  other changed SQL
- If none: "No changes beyond config/input_params.yml."
-->

## Output Tables

<!-- fill:
- Table: table → produced by (.dig) → grain → purpose; note which tables are replaced each run and which are appended (the
  *_final tables keep every run by run_time)
- Tables this agent reads: mta_models_standard, mta_markov_attribution_final, mta_markov_transition_final,
  mta_shapley_attribution_final, mta_journeys, mta_top_conversion_journeys, mta_sankey_journeys, mta_journeys_validate,
  mta_channel_parsing_validate, journey_src_union_summary, mta_table_params
-->

## Changing or Re-running the Workflow

<!-- fill:
- Pointer to runbook.md for the re-deploy, run and monitoring commands
- Which parameter to change for the common requests (add or remove a source, conversion definition, channel expressions,
  journey window, session gap, AI Signals window, Shapley touchpoints, small-channel threshold)
- Reminder that after a config change this guide and the agent must be refreshed
-->
