# Workflow Setup (only when recommended)

Template: `<skill_dir>/project_templates/workflow_template/` — read its `README.md` (structure, customization, rules). This file adds the plan, the names, deploy and validation.

## 1. Plan (shown with the one approval question)

- **SINK tables** — one per data shape the dashboard reads, each with its grain and measures:
  - additive measures (SUM, COUNT) at day × every filter dimension of the widgets that use it;
  - ratios and averages stored as numerator + denominator; never SUM an average, a rate or a median;
  - distinct counts only on their display grain (e.g. per day without dimensions); per-period or per-dimension distinct counts need their own SINK table or a build-time source query;
  - semi-additive values (stock, balances) → last value / MAX per period;
  - no high-cardinality IDs in a grain; estimate rows first (target < 100 K per table, > 500 K needs the user's OK);
  - snapshot data (no time column) gets its own full-refresh table with no date filter.
- **Refresh** — full refresh (default). Mention incremental only for large tables (> 500 MB or ≥ 2 years at GB scale) and only after a validated full run.
- **Schedule** — proposed (e.g. daily 02:00 in the user's timezone, after the source data lands); enabled only after the first run is validated.
- **Names (defaults, accept or change):**
  - workflow project `<project_slug>_dashboard` (hyphens → underscores) — check `tdx wf projects <name>` returns nothing;
  - `sink_database` `<project_prefix>_dashboard` or an existing analytics database — `tdx tables --in <db>` must show no `<project_prefix>_*` tables of another project (they would be replaced); never the source database;
  - `project_prefix` = the project slug with underscores.

## 2. Build

```bash
d="agent_outputs/<project_slug>/workflows"
[ -d "$d" ] || { mkdir -p "$d" && cp -R "<skill_dir>/project_templates/workflow_template/." "$d/"; }
( cd "$d" && mv SLUG_launch.dig <project_prefix>_launch.dig && mv SLUG_data_prep.dig <project_prefix>_data_prep.dig )
```

Then edit the copy: `call>:` in the launch file; `input_params.yaml` (prefix, databases, source table, `event_time_expr`, `table_filter` with every confirmed exclusion, `history_start`); `sql/01_stage_events.sql` columns; one SQL file + one `+sink_*` task per SINK table (remove the examples you don't use).

Before pushing, run each SELECT once against real data (`tdx query -d <source_db> -f …` with the variables filled in by hand) and check it returns aggregated rows with plausible values.

## 3. Deploy, run, monitor

```bash
tdx query "CREATE SCHEMA IF NOT EXISTS <sink_database>"        # if the project owner may; otherwise the launch file's create step
( cd agent_outputs/<project_slug>/workflows && tdx wf upload --name <project> )   # first deploy; later: tdx wf push --yes
tdx wf run <project>.<project_prefix>_launch
tdx wf timeline <project>.<project_prefix>_launch --follow
```

On failure: `tdx wf attempt <id> tasks --include-subtasks`, then `tdx wf attempt <id> logs <task>`; fix the copy, re-push, and start a fresh run (an old session is bound to the old revision). Tell the user the first run takes several minutes.

## 4. Validate and report

- Every SINK table exists with rows > 0 (0 rows → `history_start` vs the source's MIN/MAX event date).
- No duplicate grain keys: `SELECT <grain>, COUNT(*) FROM t GROUP BY <grain> HAVING COUNT(*) > 1` returns nothing.
- `tdx describe` each SINK table — these column names and types are the contract for `generate-data.js`.
- NULL audit on every measure column.
- ≥ 3 metrics recomputed from the **source** for the same window match the SINK totals exactly (and the confirmed values from discovery).

Report in one short table (table, grain, rows, checks) and record the project name, database, tables and run in `project_state.md`. Then offer the schedule (one question) and continue to Step 4.

## Changing an existing workflow

Edit the copy in `agent_outputs/<project_slug>/workflows/`, re-push, run with `--param refresh_mode=full` once, and re-validate. Switch to incremental only after a validated full run: record row count and MIN/MAX date per SINK table first, run incremental once, and compare — MIN date unchanged, no duplicate grain keys, row delta as expected — before trusting it on the schedule.
