# MTA (Multi-Touch Attribution) — Workflow Template

## Overview

This Treasure Workflow project turns a customer's marketing touchpoints (web visits, email engagement, sales interactions, …) and conversion events (orders, thank-you pages, form submits) into customer journeys and measures how much each marketing channel contributes to conversions:

- **Union** — every source table in `aggregate_metrics_tables` is mapped to one touchpoint format (time, customer, channel, source, campaign, context, conversion flag, value) and combined.
- **Sessionize and build journeys** — touchpoints are grouped into sessions (`session_length`), missing channels are backfilled, and each customer's history is split into journeys that end at a conversion (`max_journey_days` back from it).
- **Standard models** — First Touch, Last Touch, Linear and U-Shaped attribution by channel, source and campaign.
- **AI Signals models** — the AI Signals ml-batch-api runs **Markov chain** attribution (removal effect per channel, transition matrix) and **Shapley value** attribution on the same journeys.

Each run also writes validation and journey tables (source summary, channel parsing, top conversion paths, Sankey paths) that the MTA insights agent and dashboard read.

TD project name: `mta_ais` (from `tdx.json`). Entry point: `mta_advanced_launch.dig`. All parameters live in `config/input_params.yml`.

## Workflow Structure

```
mta_advanced_launch.dig               # entry point: schedule, error email, runs the steps below in order
├── +create_sink_database             # 0. td_ddl> creates sink_database if it does not exist yet
├── mta_union_src_tables.dig          # 1. config → mta_table_params; one insert per source (or sql/union_src_tables/<name>.sql);
│                                     #    summary, sessionization + channel backfill → journey_src_union_final; converted split;
│                                     #    optional customer attributes (add_customer_analysis)
├── mta_journeys_and_models.dig       # 2. journeys → mta_journeys; aggregate stats; standard models → mta_models_standard;
│                                     #    validation tables, top conversion journeys, Sankey paths
└── mta_markov_shapley_ai_signals.dig # 3. AI Signals Markov (mta_markov) and Shapley (mta_shapley), in parallel;
                                      #    *_final tables append each run with its run_time
```

| Folder | Contents |
|---|---|
| `config/` | `input_params.yml` — the only file a standard deployment edits |
| `sql/union_src_tables/` | Source insert, sessionization and backfill, converted split, customer attributes; custom source queries (`<name>.sql`) |
| `sql/journeys_models/` | Journeys, standard models, aggregate and validation tables, Sankey paths |
| `sql/ml_models/` | Markov and Shapley input tables and the `*_final` output steps |
| `sql/sample_tables/` | Small sample tables for review |

## Configuration

All keys are in `config/input_params.yml`. The template values are a working example; change the ones in **bold** for every customer. Keep `yes` / `no` values quoted — the workflow compares them as strings. String literals inside SQL expressions use doubled single quotes (`''email''`), as in the template.

### Global

| Parameter | What it does | How to choose it |
|---|---|---|
| **`sink_database`** | Database for every table the workflow writes | The confirmed sink database. Created by the first run if it does not exist (`+create_sink_database`) |
| **`unique_user_id`** | Customer ID column; read under this name from **every** source table | The ID shared by all touchpoint and conversion tables (e.g. `canonical_id` after ID unification). A source that names it differently needs a custom query |
| `include_non_converted_channels` | `'yes'` keeps channels that never appear in a converted journey in the standard models; `'no'` drops them | `'yes'` to see every channel; `'no'` for a cleaner credit view |

### Customer enrichment

| Parameter | What it does | How to choose it |
|---|---|---|
| `add_customer_analysis` | `'yes'` joins customer attributes onto the touchpoints and journeys | `'yes'` only when a customer table (e.g. RFM output) exists and the analysis needs segments |
| `customers_table` | Customer table (`database.table`) joined on `unique_user_id` | One row per customer |
| `attributes_list` | Comma-separated columns added from `customers_table` | The segment or score columns the analysis needs |

### AI Signals Markov and Shapley models

| Parameter | What it does | How to choose it |
|---|---|---|
| **`ml_batch_api_endpoint`** | AI Signals ml-batch-api base URL, used by every model call in `mta_markov_shapley_ai_signals.dig` | From the `site` in `tdx status`: `us01` `https://ml-batch-api.treasuredata.com`, `jp01` `https://ml-batch-api.treasuredata.co.jp`, `eu01` `https://ml-batch-api.eu01.treasuredata.com`, `ap02` `https://ml-batch-api.ap02.treasuredata.com`, `ap03` `https://ml-batch-api.ap03.treasuredata.com` |
| `ml_batch_api_version` | AI Signals model version sent with each run | `stable` |
| `markov_max_load_rows` | Memory safety cap on the rows the Markov model loads (`0` = no cap); converting journeys are loaded first | `50000000` |
| `shapley_max_load_rows` | Memory safety cap on the journeys the Shapley model loads (`0` = no cap); also the `LIMIT` of the Shapley input query | `50000000`; a cap that cuts non-converting journeys inflates conversion rates |
| `shapley_lookback_window` | Shapley runs one model per size `0..N`: `0` = whole journey, `N` = last N unique channels | `4`; `3` for parity with older runs or short journeys; up to `10` only when journeys have many unique channels — cost grows with N |
| `shapley_order` | `true`: `email > social` and `social > email` are different coalitions; `false`: channel sets only | `true`; `false` when data is sparse for many channels or touch order is unreliable (many shared timestamps) |
| `removal_effect_limit` | Markov channels with a removal effect at or below this are left out of the transition-matrix output | `0.005` |
| `markov_input_table`, `shapley_input_table` | Model input tables built by `sql/ml_models/` | Keep the template values |
| `markov_output_table`, `transition_output_table`, `shapley_output_table` | Raw AI Signals outputs (replaced each run); each run is appended to `<name>_final` | Keep the template values — the insights agent and dashboard read `mta_markov_attribution_final`, `mta_markov_transition_final` and `mta_shapley_attribution_final` |
| `markov_user_id`, `markov_channel_colname`, `markov_conversion_col_name` | Markov input columns sent to the API: journey ID, ` > `-joined path, conversion flag | Keep the template values — they are the columns `mta_journey_agg.sql` writes |
| `user_id_col`, `channel_colname`, `shapley_conversion_col_name` | Shapley input columns sent to the API: customer ID, channel, conversion flag | Keep the template values (`user_id_col` follows `unique_user_id`) |
| `time_col` | Time column of both model inputs | `date_time` |

### Time, sessions and journeys

| Parameter | What it does | How to choose it |
|---|---|---|
| `time_filter_type` | `range` (start/end dates) or `interval` (`lookback_period` back from now); applied only to sources with `apply_time_filter: true` | `range` for a fixed analysis period; `interval` for a rolling window |
| `time_range_start_date` | Start date of the `range` filter (`YYYY-MM-DD`) | The first date worth analyzing |
| `time_range_end_date` | End date of the `range` filter | `2099-12-31` to always include the latest data |
| `lookback_period` | Window of the `interval` filter (`-180d`, `-6M`, …) | Long enough to cover a full buying cycle |
| **`session_length`** | Seconds of inactivity that start a new session | `3600`; longer (e.g. `86400`) when touchpoints are sparse (email, sales calls) |
| `backfill_partition_col` | Partition for backfilling missing channels from earlier touchpoints | `${unique_user_id}` (whole journey) or `session_id` (within a session only) |
| `top_k_channel_perc` | Channels below this share of touchpoints — and below `top_k_conv_perc` of conversions — become `other` | `0.01`; raise it to merge more small channels |
| `top_k_conv_perc` | Channels below this share of conversions — and below `top_k_channel_perc` of touchpoints — become `other` | `0.01` |
| **`max_journey_days`** | Days before a conversion whose touchpoints belong to its journey | The typical consideration period (e.g. `30` for retail, `180` for considered purchases) |
| `sample_tpoint_limit` | Journey length kept in the sample tables | `25` |
| `agg_analysis_cols` | Dimensions of `mta_journeys_agg_stats` and `mta_agg_pageview_stats` | `["event_context", "channel"]` |
| `summary_table_top_k` | Top values kept per column in `journey_src_union_summary` | `20` |

### Source tables (`aggregate_metrics_tables`, one entry per source)

| Parameter | What it does | How to choose it |
|---|---|---|
| **`aggregate_metrics_tables`** | List of touchpoint and conversion sources to union | One entry per confirmed source table |
| **`aggregate_metrics_tables[].src_table`** | Source table (`database.table`) | A table with one row per event, a customer ID and a UNIX time column |
| `aggregate_metrics_tables[].table_description` | Plain-language description, shown in the summary table | One short sentence |
| **`aggregate_metrics_tables[].name`** | Source alias; with `query_type: 'custom'` also the SQL file name | Short, lowercase (`pageviews`, `email_events`, `order_events`) |
| **`aggregate_metrics_tables[].unixtime_col`** | Event time (UNIX seconds) | `time` when it is the real event time; otherwise a UNIX-seconds event column |
| `aggregate_metrics_tables[].url_col` | Page URL (web sources) | The URL column; `CAST(NULL AS VARCHAR)` for non-web sources |
| `aggregate_metrics_tables[].referral_col` | Referrer (web) or a fixed channel label | The referrer column, a literal (`''email''`) or `CAST(NULL AS VARCHAR)` |
| **`aggregate_metrics_tables[].medium_col`** | Expression that becomes the **channel** | Web: the template's `utm_medium` COALESCE with the source's URL column (never default NULLs to a literal — the backfill fills them). Other sources: a literal (`''email''`) |
| `aggregate_metrics_tables[].source_col` | Expression for the traffic source | Web: the `utm_source` COALESCE; email: the ESP (`''sfmc''`); CRM: a column |
| `aggregate_metrics_tables[].campaign_col` | Expression for the campaign | Web: the `utm_campaign` COALESCE; email: the normalized campaign name |
| `aggregate_metrics_tables[].utm_mailing_col` | Expression for the mailing ID | Web: the `utm_mailing` COALESCE; email: the campaign or mailing column |
| `aggregate_metrics_tables[].context_col` | What the touchpoint was about (page title, email name, topic, order type) | The most descriptive column |
| `aggregate_metrics_tables[].event_type` | Event label expression | A literal or a `CONCAT` with the source's event column |
| `aggregate_metrics_tables[].custom_filter` | WHERE condition for the source | Always `${unique_user_id} IS NOT NULL`, plus exclusions (email sends, cancelled orders, bots) |
| **`aggregate_metrics_tables[].conversion_flag`** | `1.0` for a conversion, `0.0` otherwise (constant or expression) | `1.0` on the conversion table, an `IF(…)` on a web table with conversion pages, `0.0` on touchpoint-only sources |
| `aggregate_metrics_tables[].item_price` | Value of a conversion (revenue) | The revenue column on the conversion table; `1.0` (count) when there is none; `0.0` on touchpoint-only sources |
| `aggregate_metrics_tables[].apply_time_filter` | `true` applies the time filter above to this source | `false` unless the source is large and only a window is needed |
| `aggregate_metrics_tables[].query_type` | Blank = built from these parameters; `'custom'` = read from `sql/union_src_tables/<name>.sql` | Blank unless the source needs joins or derived columns |

### Union and output tables

| Parameter | What it does | How to choose it |
|---|---|---|
| `src_union_table` | Base name of the union tables (`<name>_final`, `_summary`, …) | `journey_src_union` |
| `src_union_base_to_session_table` | Table sessionized into `<src_union_table>_final` | Keep the template value |
| `journeys_input_table` | Table the journeys are built from | Keep the template value |
| `u_shaped`, `u_shaped.first_touch_att`, `u_shaped.last_touch_att` | U-Shaped credit for the first and last touchpoint; the rest is split across the middle | `0.35` each (30% for the middle touchpoints) |
| `output_tables`, `output_tables.journeys_table`, `output_tables.models_table`, `output_tables.agg_pageviews_table` | Names of the journeys, standard-models and page-stats tables | Keep the template values — the insights agent and dashboard read these names |

## Outputs

All tables are in `sink_database`.

| Table | Contents |
|---|---|
| `mta_markov_attribution_final` | Markov attribution per channel and run: `channels`, `attribution_markov_algorithmic`, `removal_effect`, `run_time` (appended each run) |
| `mta_markov_transition_final` | Markov channel-to-channel transition probabilities per run (appended) |
| `mta_shapley_attribution_final` | Shapley value per channel, step and run: `step` (the model's size — 0 = whole journey, N = last N unique channels), `channels`, `value`, `percentage` within the step, `run_time` (appended) |
| `mta_markov_attribution`, `mta_markov_transition`, `mta_shapley_attribution` | Latest AI Signals model output (replaced each run) |
| `mta_markov_input_table`, `mta_shapely_input_table` | Model inputs: one row per journey (Markov), one row per touchpoint (Shapley) |
| `mta_models_standard` | First Touch, Last Touch, Linear, U-Shaped conversions and sales by channel, source, campaign and month |
| `mta_journeys` | One row per touchpoint with journey context (journey ID, index, length, channel list, duration, conversion value) |
| `mta_journeys_agg_stats`, `mta_agg_pageview_stats` | Journey and touchpoint stats by the `agg_analysis_cols` dimensions |
| `mta_top_conversion_journeys`, `mta_sankey_journeys` | Most frequent paths of converted and non-converted journeys; step-by-step paths for Sankey charts |
| `mta_journeys_validate`, `mta_channel_parsing_validate`, `mta_journey_stats_yearly` | Channel summary, channel / source / campaign parsing, yearly journey stats |
| `journey_src_union_summary` | One row per source: events, profiles, conversions, date range, filter and channel expressions applied |
| `journey_src_union_final`, `journey_src_union_final_converted`, `mta_table_params` | Sessionized union of all sources, converted split, parsed source config |
| `*_sample` | Small samples of the union and journey tables |

## Secrets & Requirements

- **Secrets:** none to set. `mta_markov_shapley_ai_signals.dig` sends `${secret:td.apikey}` to the AI Signals ml-batch-api, which provides the key itself.
- **AI Signals access:** the account's enabled solutions must include `mta_markov` and `mta_shapley`; otherwise the ml-batch-api rejects the run.
- **Data:** at least one touchpoint source and one conversion source (or a web source with conversion pages), all with the same customer ID column name and a UNIX time column. Attribution needs multi-touch journeys: several channels and a few hundred conversions at least.
- **Permissions:** the project owner needs permission to create the sink database and tables.
- **Failure email:** the `_error` block in `mta_advanced_launch.dig` is commented out. To enable it, uncomment it and replace `your-team@example.com` with the alert address.
- **Schedule:** commented out in `mta_advanced_launch.dig`; uncomment it for scheduled runs.

## Customization Points

Beyond `config/input_params.yml`, these are the only supported code changes. Record every one in the engagement docs.

| Change | Where |
|---|---|
| A source needs joins, derived columns or another ID column name (`query_type: 'custom'`) | `sql/union_src_tables/<name>.sql` — return the same columns as `insert_src_table.sql`; `order_events.sql` is the example |
| Channel grouping rules (e.g. merge `facebook` and `instagram` into `social`) | The `CASE` on `channel_final` in `sql/journeys_models/journeys_base_table.sql` |
| Failure email, schedule | `mta_advanced_launch.dig` |
