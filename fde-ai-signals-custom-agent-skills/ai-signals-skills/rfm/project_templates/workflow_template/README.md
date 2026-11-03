# RFM Customer Segmentation — Workflow Template

## Overview

This Treasure Workflow project unions customer activity from several source tables (web, email, CRM, orders, …), computes three values per profile and scores them with the AI Signals RFM model (ml-batch-api):

- **Recency** — days since the profile's most recent activity in any source (counted from the run time)
- **Frequency** — total number of activity rows across all sources
- **Monetary** — total order value across all sources (only sources with a real `order_amount` column add to it)

Each profile gets a 1–4 quartile score per dimension (`r_quartile`, `f_quartile`, `m_quartile`), a combined label (`rfm_quartile`, e.g. `R4F3M2`), an average score (`rfm_score`) and one of ten segments (`rfm_segment`: Champions, Loyal Customers, Potential Loyalists, Promising, New Customers, Cannot lose them, Need attention, Hibernating, High Value Sleeping, Lost customers).

The output table is added to a Parent Segment as an attribute table, so the segments can be used in Audience Studio. Each run also writes summary stats to the `rfm_stats*` dashboard tables, which the RFM insights agent reads.

TD project name: `rfm_ais` (from `tdx.json`). Entry point: `rfm_launch.dig`. All parameters live in `config/input_params.yml`.

## Workflow Structure

```
rfm_launch.dig                    # entry point: schedule, error email, runs the steps below in order
├── +create_sink_database         # 0. td_ddl> creates sink_database if it does not exist yet
├── rfm_union_all_activity.dig    # 1. (if built_union_activity = yes) one row per profile per source → union_activity_table;
│                                 #    per-source summary → rfm_src_table_summary; per-profile R/F/M values → input_table
├── rfm_ai_signals.dig            # 2. scoring with the AI Signals RFM model (ml-batch-api) → output_table
└── rfm_agg_stats.dig             # 3. dashboard stats: stats_table, _histogram, _model_params, _global_session_filter, _daily_agg
```

| Folder | Contents |
|---|---|
| `config/` | `input_params.yml` — the only file a standard deployment edits |
| `queries/` | Parameter parsing, input-table build and dashboard stats |
| `queries/union_src_tables/` | `insert_src_table.sql` — the generated per-source query (one row per profile per source) |
| `sql/union_src_tables/` | Custom per-source SQL, read when a source sets `query_type: custom` (see Customization Points) |
| `body.txt` | Failure email body |

## Configuration

All keys are in `config/input_params.yml`. The template values are a working example; change the ones in **bold** for every customer. Keys marked *not read* exist in the config but no workflow step uses them — leave them as they are.

### Global — `globals`

| Parameter | What it does | How to choose it |
|---|---|---|
| `globals` | Global settings section | — |
| **`globals.canonical_id`** | Name of the profile ID column in every table the workflow writes; each source's `join_key` is renamed to it | The ID the Parent Segment joins on (e.g. `canonical_id`, `td_customer_id`) |
| **`globals.sink_database`** | Database for every table the workflow writes | The confirmed sink database (sink-database gate). Created by the first run if it does not exist (`+create_sink_database`); the project owner needs permission to create databases, otherwise create it in the TD Console first |
| `globals.built_union_activity` | `yes` rebuilds the union and input tables before scoring; `no` re-scores the existing `input_table` | `yes`. `no` only to re-run scoring on unchanged inputs |
| **`ml_batch_api_endpoint`** | AI Signals ml-batch-api base URL, used by `rfm_ai_signals.dig` | The account's region (`tdx status`); the values are in `references/ai-signals-guide.md` §3 |
| `globals.num_bins` | Number of buckets in the dashboard histograms (`<stats_table>_histogram`). Does not change scoring — scores are always quartiles | Keep `10`; lower it for small populations |

### Output tables

| Parameter | What it does | How to choose it |
|---|---|---|
| `union_activity_table` | One row per profile per source (last event, touchpoints, spend, recency, top context values) | Keep the default unless the customer has a naming rule |
| `input_table` | One row per profile with `recency`, `frequency`, `monetary_value` — the scoring input | Keep the default |
| **`output_table`** | Final per-profile scores and segment — the Parent Segment attribute table | Keep the default unless the customer has a naming rule |
| `stats_table` | Base name of the dashboard tables (`<stats_table>`, `_histogram`, `_model_params`, `_global_session_filter`, `_daily_agg`) | Keep the default — the customer agent expects `rfm_stats` |

### Time filter

| Parameter | What it does | How to choose it |
|---|---|---|
| `apply_time_filter` | Label only: written to `<stats_table>_model_params` to describe the run. The filter itself is switched on per source | Keep it in line with the sources' `apply_time_filter` |
| **`time_filter_type`** | `interval` = `TD_INTERVAL(<unixtime_col>, '<lookback_period>/now')`; `range` = `TD_TIME_RANGE(<unixtime_col>, start, end)` | `interval` for scheduled runs. Use `range` for a fixed historical window — required when the data stops before today (demo or backfilled data) |
| `time_range_start_date` | Start date for `range` | First date of the window (YYYY-MM-DD) |
| `time_range_end_date` | End date for `range` (ignored by `interval`) | Last date of the window; a far-future date means "up to the latest data" |
| **`lookback_period`** | Window for `interval`, counted back from the run time | Long enough to see repeat purchases (6–24 months); shorter for very large accounts or Trino memory errors |

### Sources — `aggregate_metrics_tables` (one entry per source)

Inside these strings single quotes are doubled (`''…''`), because the value is pasted into another SQL string.

| Parameter | What it does | How to choose it |
|---|---|---|
| **`aggregate_metrics_tables`** | List of sources unioned into one activity table | One entry per activity table confirmed in Phase 1. Remove template entries the customer does not have |
| **`aggregate_metrics_tables[].src_table`** | Source table | `database.table` |
| `aggregate_metrics_tables[].name` | Source label (the `source` column); also the file name `sql/union_src_tables/<name>.sql` for `query_type: custom` | Short snake_case label (`pageviews`, `email_activity`, `order_events`) |
| **`aggregate_metrics_tables[].unixtime_col`** | Event time as UNIX seconds — drives Recency and the time filter | `time` only if it is the real event time; otherwise the event column, wrapped in `TD_TIME_PARSE(…)` if it is a string. Decide by comparing `time` with the event column: same range and a per-row gap under a day (or of exactly whole hours — a local-time string) → `time`; `time` clustered on a few load dates → the event column |
| **`aggregate_metrics_tables[].join_key`** | Profile ID column in this source | The column holding the Parent Segment ID in this table (usually the same name as `globals.canonical_id`) |
| **`aggregate_metrics_tables[].order_amount`** | Value summed into Monetary | Revenue column on order / purchase sources (e.g. `unit_price`, `total_amount`); `0.0` on every other source |
| `aggregate_metrics_tables[].context_col` | Descriptive column; its 10 most frequent values per profile are stored in `events_list` | Page title, item name, campaign name or topic. It must still vary after the source's `custom_filter` — never a status or event-type column, or a column the filter fixes to one value. Required — a blank value breaks the generated SQL |
| **`aggregate_metrics_tables[].custom_filter`** | SQL `WHERE` condition (without `WHERE`) | Exclude email sends/bounces, cancelled/returned orders, bots, test records. Blank = no filter |
| `aggregate_metrics_tables[].apply_time_filter` | `'yes'` applies the time filter to this source | `'yes'` on every source when a window is wanted; `'no'` on all to use all history |
| `aggregate_metrics_tables[].query_type` | Blank = SQL generated from these fields; `custom` = read `sql/union_src_tables/<name>.sql` | Blank unless the source needs joins, de-duplication or derived columns |

## Outputs

All tables are written to `globals.sink_database`.

| Table | Grain | Purpose |
|---|---|---|
| `output_table` (default `rfm_output_table`) | One row per profile | **Parent Segment attribute table.** Columns: profile ID, `recency`, `frequency`, `monetary_value`, `r_quartile`, `f_quartile`, `m_quartile`, `rfm_quartile`, `rfm_score`, `rfm_segment`. Replaced every run |
| `input_table` (default `rfm_input_table`) | One row per profile | Scoring input (`recency`, `frequency`, `monetary_value`) |
| `union_activity_table` (default `rfm_combined_user_events`) | One row per profile per source | Last event, `total_touchpoints`, `total_spend`, `recency_days`, `events_list` |
| `rfm_src_table_summary`, `rfm_input_params` | One row per source | Per-source volumes and date range; parsed source config |
| `<stats_table>` (default `rfm_stats`) | One row per segment + `ALL` | Segment size, share and R/F/M distribution for the latest run (replaced every run) |
| `<stats_table>_histogram` | (segment, metric, bin) | Histograms of recency, frequency, monetary for the latest run (replaced every run) |
| `<stats_table>_model_params` | One row per source per run | Run config and per-source stats — appended every run |
| `<stats_table>_daily_agg` | One row per segment per run | Segment stats with plain-English definitions — appended every run (segment trends) |
| `<stats_table>_global_session_filter` | One row per run | Run list with rank (latest = 1) |

## Secrets & Requirements

- **Secrets:** none to set. `rfm_ai_signals.dig` sends `${secret:td.apikey}` to the AI Signals batch API, which provides the key itself.
- **API endpoint:** `ml_batch_api_endpoint` in the config, US (`https://ml-batch-api.treasuredata.com`) by default. For other regions, set it to the regional base URL: Japan `ml-batch-api.treasuredata.co.jp`, EU `ml-batch-api.eu01.treasuredata.com`, AP `ml-batch-api.ap02.treasuredata.com` / `ml-batch-api.ap03.treasuredata.com`.
- **Failure email:** the `_error` block in `rfm_launch.dig` is commented out. To enable it, uncomment it, replace `your-team@example.com` with the customer's address and put the customer name in `subject`.
- **Schedule:** the `schedule:` block in `rfm_launch.dig` is commented out (example: monthly). Uncomment and set it if the customer wants scheduled runs.
- **Requirements:** `globals.sink_database` exists or can be created; every source has a profile ID column and a usable event timestamp; Trino (`presto`) engine. Large accounts may need a shorter `lookback_period`.

## Customization Points

Beyond `config/input_params.yml`, these are the only supported code changes. Record every one in the engagement docs.

| Change | Where |
|---|---|
| Source needs joins, de-duplication or a derived column | Set `query_type: custom` on the source and add `sql/union_src_tables/<name>.sql` returning the same columns as `queries/union_src_tables/insert_src_table.sql` (profile ID as `globals.canonical_id`, `time`, `latest_tstamp`, `source`, `total_touchpoints`, `total_spend`, `recency_days`, `events_list`) |
| Segment descriptions in the history table | `queries/stats_historic_agg.sql` |
| Failure email, schedule | `rfm_launch.dig` |
