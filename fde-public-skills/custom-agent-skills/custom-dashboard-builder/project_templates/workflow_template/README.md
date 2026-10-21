# Dashboard Workflow Template

Pre-aggregates source data into SINK tables that the dashboard's `generate-data.js` reads. Copied to `agent_outputs/<project_slug>/workflows/` and customized there; never edited in the plugin.

## Structure

```
SLUG_launch.dig        # entry point: create sink database → data prep + SINK → optional staging cleanup
SLUG_data_prep.dig     # 1. stage events  2. check staging (fails the run)  3. one task per SINK table
input_params.yaml      # all parameters (top-level keys only)
sql/
  01_stage_events.sql      # cleaned source rows for this run's window (example columns — replace)
  02_check_staging.sql     # row count / NULL-date guard
  10_sink_daily_metrics.sql# additive measures at day × filter dimensions
  11_sink_daily_users.sql  # exact distinct count per day (date-only grain)
```

## Customize

1. Rename `SLUG_launch.dig` / `SLUG_data_prep.dig` to `<project_prefix>_launch.dig` / `<project_prefix>_data_prep.dig` and update the `call>:` line.
2. `input_params.yaml`: `project_prefix`, `sink_database`, `source_database`, `source_table`, `event_time_expr`, `table_filter` (the confirmed exclusions), `history_start`.
3. `01_stage_events.sql`: replace the example columns with the confirmed dimensions (`COALESCE(dim, 'Unknown')`), ids and measures.
4. One SINK table per data shape the dashboard needs: copy a `+sink_*` task pair in `SLUG_data_prep.dig` and a SQL file; remove the examples you don't need. Table names: `<project_prefix>_sink_<group>`.

## Rules

- SQL files are plain SELECTs; the `.dig` writes them (`create_table:` = replace, `insert_into:` = append).
- **Full refresh is the default and always the first run.** Incremental (`refresh_mode: 'incremental'`) only after a validated full run, only for SINK tables keyed by `event_date` with additive measures, and only when the event time is close to the load time (the lookback must cover late data). Cumulative, window, cohort and snapshot tables stay full.
- Incremental = DELETE the window, then append it — never `create_table:` there (it deletes all older history). The staging window and the DELETE use the same day bound (`incr_start_day`).
- Additive measures only on multi-dimension grains; distinct counts on their display grain only.
- No hard-coded databases; every `${var}` must exist in `input_params.yaml`.

## Outputs

| Table | Contents |
|---|---|
| `<prefix>_stg_events` | Staging rows of the last run (dropped if `cleanup_staging: 'yes'`) |
| `<prefix>_sink_daily_metrics` | `event_date`, filter dimensions, additive measures |
| `<prefix>_sink_daily_users` | `event_date`, distinct count per day |

## Run

First deploy `tdx wf upload --name <project>` from the workflow folder (creates `tdx.json`), later `tdx wf push --yes`; run `tdx wf run <project>.<project_prefix>_launch` (`--param refresh_mode=full` for a one-off full rebuild); monitor `tdx wf timeline <project>.<project_prefix>_launch --follow`; debug `tdx wf attempt <id> tasks --include-subtasks` and `tdx wf attempt <id> logs <task>`. The schedule in `SLUG_launch.dig` stays commented until the first run is validated and the user approves it.
