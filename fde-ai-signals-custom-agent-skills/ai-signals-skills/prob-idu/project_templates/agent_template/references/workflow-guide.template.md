# Probabilistic ID Unification — Workflow Guide (<project name>)

Use this document to answer questions about how **this customer's deployed** probabilistic ID unification workflow works end to end: its structure, execution order, the input table SQL, configuration, customizations and the tables each step writes. For how the matching works, see `ai-signals-guide.md`; for this customer's business definitions, see `business-context.md`; for table schemas, see `data-dictionary.md`.

<!-- Build instructions (Phase 4 interim or Phase 5 final — remove this comment and every `fill` block when done):
- Interim (Phase 4): describe the setup deployed so far; mark assumed defaults "to confirm"; sections with nothing yet
  say "Not done yet — Phase 5". Final (Phase 5): update the interim file in place, keep the history.
- Save the filled copy as references/workflow-guide.md in the agent staging folder. Never install this .template.md file.
- Sources, in priority order: the deployed working copy (workflow/config/global.yml, workflow/sql/input_table.sql — always read,
  it is project code — and workflow/*.dig), project_state.md, the latest validated run (prob_model_table_params,
  prob_uni_config_stats_table). Describe what is DEPLOYED, never template defaults.
- Explain parameters in plain words (meanings from workflow/README.md) and quote exact values in backticks.
  No YAML blocks, no secrets, no personal names or email addresses (write the role).
- Record "as of" dates. Refresh this file whenever the config, the input SQL or the .dig files change.
-->

**Status:** <Interim — pre-production | Final — production>  ·  **As of:** <date of the deployed revision this guide describes>

---

## Workflow Overview

<!-- fill:
- One paragraph: what is unified for this customer (the deterministic ID, the identifiers compared) and what the result feeds
- TD workflow project name and ID, entry point (ml_prob_unification_launch), last pushed revision and date (workflow/tdx.json)
- Sink database, input / blocking / output tables, working copy path (<engagement dir>/workflow/)
- The AI Signals endpoint (`ml_batch_endpoint`, region) and `ml_batch_version`
- Schedule (or "manual runs only"), failure alert (enabled / commented out)
-->

## End-to-End Pipeline

<!-- fill:
- Tree as deployed: create_input_table → blocking (hash tables, per-column predicates, MinHash, block merge) → AI Signals pidu
  (drop output, POST, poll) → dedup check → final merge → dashboard stats
- Mark any step that is disabled or added for this customer, with the reason
- One line per stage on what it produces
-->

## Input Table SQL

<!-- fill — from workflow/sql/input_table.sql:
- Source tables, the deterministic ID column (`id_col`), eligibility rule and exclusions
- One line per dedupe column: source field, type (`string` / `email` / `phone`), weight, cleaning applied before the workflow
- Tables reviewed in Phase 1 but not used, with the reason (from project_state.md)
-->

## Settings as Deployed

<!-- fill:
- Table: parameter → deployed value → what it means for this customer → why this value (from project_state.md decisions)
- Cover: column weights, blocking (`hashes`, `keygroups`, `jaccard_similarity_threshold`, `ngram_len`, `max_ids_per_cluster`,
  `max_ids_per_block`), clustering (`cluster_threshold`, `string_type`, `fill_missing`), `avg_spend_per_user`
- Latest validated results with the session ID: IDs in, clusters, IDs removed, average similarity, quality rating, largest cluster
-->

## Step-by-Step Reference

<!-- fill — one subsection per .dig file that runs (launch, presto_parallel, ai_signal, dashboard_stats):
- Purpose in one sentence
- Steps in order → output table of each step
- The failure points (empty blocking table, API run status, dedup check) and what they mean
-->

## Customizations Beyond the Template

<!-- fill:
- Table: file → change → reason → date (from project_state.md and docs/runbook.md)
- Always: `sql/input_table.sql`; plus .dig or SQL edits (schedule, alert, extra dedupe column types, polling)
-->

## Output Tables

<!-- fill:
- Table: table → produced by (.dig) → grain → purpose; note which are appended (prob_* stats) and which are replaced
  (input, blocking, cluster and dedupe tables)
- `dedupe_<output_table>` (matched IDs only) and how downstream consumers join it — or "Not done yet — Phase 5"
-->

## Changing or Re-running the Workflow

<!-- fill:
- Pointer to runbook.md for the re-deploy, run and monitoring commands
- Where to change the common requests: identifiers and weights (input SQL + `dedupe_columns`), stricter / looser matching
  (`cluster_threshold`, `jaccard_similarity_threshold`), memory errors (`max_ids_per_cluster`, `max_ids_per_block`, engine)
- Reminder that after a config or SQL change this guide and the agent must be refreshed
-->
