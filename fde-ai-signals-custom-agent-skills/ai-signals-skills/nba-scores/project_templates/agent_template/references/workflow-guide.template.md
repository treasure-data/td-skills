# NBA Engagement Scores — Workflow Guide (<project name>)

Use this document to answer questions about how **this customer's deployed** NBA workflow works end to end: its structure, execution order, configuration, source mappings, customizations and the tables each step writes. For what the metrics mean and table schemas, see `data-dictionary.md`; for this customer's business definitions, see `business-context.md`.

<!-- Build instructions (Phase 4 interim or Phase 5 final — remove this comment and every `fill` block when done):
- Interim (Phase 4): describe the setup deployed so far; mark assumed defaults "to confirm"; sections with nothing yet
  (e.g. Parent Segment) say "Not done yet — Phase 5". Final (Phase 5): update the interim file in place, keep the history.
- Save the filled copy as references/workflow-guide.md in the agent staging folder. Never install this .template.md file.
- Sources, in priority order: the deployed working copy (workflow/config/input_params.yml, workflow/*.dig for the pipeline; SQL
  files only if they were changed from the template — don't read unchanged SQL), project_state.md, docs/architecture.md, the latest validated run (nba_dash_model_metrics,
  nba_dash_source_tables). Describe what is DEPLOYED, never template defaults.
- Explain parameters in plain words (meanings from workflow/README.md) and quote exact values and expressions in backticks.
  No YAML blocks, no secrets, no personal names or email addresses (write the role or "alert recipient").
- Record "as of" dates. Refresh this file whenever the workflow config or .dig files change (Phase 4 or later).
-->

**Status:** <Interim — pre-production | Final — production>  ·  **As of:** <date of the deployed revision this guide describes>

---

## Workflow Overview

<!-- fill:
- One paragraph: what the workflow does for this customer (sources in, per-profile NBA scores out, Parent Segment use)
- TD workflow project name and ID, entry point (nba_eng_launch), last pushed revision and date (workflow/tdx.json)
- Sink database, unique_user_id (profile ID column), working copy path (<engagement dir>/workflow/)
- History window as deployed: time_filter_type and its dates or lookback_period, in plain words
- Session inactivity timeout (session_length), schedule (or "manual runs only"), failure alert (enabled / removed)
-->

## End-to-End Pipeline

<!-- fill:
- Tree of nba_eng_launch.dig as deployed: every step in run order, which sub-workflow it calls, which steps run in parallel
- Mark any step that is disabled, commented out or added for this customer (e.g. +create_sink_database), with the reason
- One line per stage on what it produces (union → three scoring steps → final join → dashboard stats → cleanup)
-->

## Source Tables

<!-- fill — one subsection per entry in aggregate_metrics_tables:
- Heading: `<src_table>` — role (touchpoint / conversion / add-to-cart), name used in the union
- Table: column role (unixtime_col, medium_col = channel, source_col, campaign_col, context_col, event_type,
  conversion_flag, item_price, url_col / referral_col) → exact expression → note on why it was chosen
- custom_filter in plain words (what is kept / excluded and why); apply_time_filter; query_type (custom SQL file if any)
- Latest validated volumes from nba_dash_source_tables: events, profiles, conversions, date range (session ID)
- Tables reviewed in Phase 1 but excluded, with the reason (from project_state.md)
-->

## Key Data-Prep Decisions

<!-- fill:
- Table: parameter → deployed value → what it means for this customer → why this value (from project_state.md decisions)
- Cover: time filter and window, session_length, backfill_partition_col, topk_values (`others` grouping),
  timeshift_change / timeshift_hours (which timezone the dashboard dates are in), cleanup_temp_tables
- Call out any value chosen because of data conditions (e.g. stale data → widened windows, range filter)
-->

## Channel Derivation

<!-- fill:
- How `channel` is set per source (UTM medium, traffic-source column, fixed labels) and how NULL channels are back-filled
- Final channel list seen in the latest run and which ones are grouped into `others`
- Paid / ad channels as deployed (ad_engagement_logic) and why those channels were chosen
- Known channel-quality caveats (e.g. low UTM coverage, channels the customer considers paid but are not tagged)
-->

## Scoring and Flags as Deployed

<!-- fill:
- Next Best Time: the dayparts and their hour ranges as deployed (day_breakdown), the hour basis (UTC time_hour or adjusted_hour)
- Scoring style (scoring_logic) for dayparts and for channels, and what a score value means with that style
- Flag windows: event_lookback, new_customers_days — in days, counted back from the run date
- Rules: conversion_logic, abandon_regexp (which event_type values match), ad_engagement_logic
- Next Best Campaign decision order as it applies to this customer
-->

## Step-by-Step Reference

<!-- fill — one subsection per .dig file that runs (nba_union_all_activity, nba_next_best_time_metrics,
nba_next_best_channel_metrics, nba_next_best_campaign_metrics, nba_metrics_table, nba_dash_stats, nba_cleanup_runner):
- Purpose in one sentence
- Steps in order → output table of each step
- Key SQL files and their logic — only those needed to explain behavior, plus every file changed for this customer
-->

## Customizations Beyond the Template

<!-- fill:
- Table: file → change → reason → date (from project_state.md and docs/runbook.md)
- Include .dig edits (schedule removed, alert removed, steps added), custom source SQL, changed scoring SQL
- If none: "No changes beyond config/input_params.yml."
-->

## Output Tables

<!-- fill:
- Table: table → produced by (.dig) → grain → purpose; mark the Parent Segment attribute table and the three
  nba_dash_* tables this agent reads; note which temp tables are dropped by cleanup
- Parent Segment name and how the final table is joined (key), if Phase 5 added it
-->

## Changing or Re-running the Workflow

<!-- fill:
- Pointer to runbook.md for the re-deploy, run and monitoring commands
- Which parameter to change for the common requests (window, paid channels, dayparts, add-to-cart rule)
- Reminder that after a config change this guide and the agent must be refreshed
-->
