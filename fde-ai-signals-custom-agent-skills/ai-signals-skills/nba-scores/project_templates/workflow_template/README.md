# NBA Engagement Scores — Workflow Template

## Overview

This Treasure Workflow project unions customer activity from several source tables (web, email, CRM, orders, …), sessionizes it, and writes **one row per profile** with Next Best Action engagement scores:

- **Next Best Time** — the daypart each profile is most active in, plus a per-daypart score
- **Next Best Channel** — the channel each profile responds to most, plus a per-channel score
- **Next Best Campaign** — one recommended campaign type per profile (`Cart Abandon`, `Next Best Product`, `Retargetting`, `Prospecting`)
- **Engagement flags** — `conversion_flag`, `ad_engagement_flag`, `recent_ad_engagement_flag`, `recent_purchase_flag`, `cart_abandon_flag`, `new_visitor_flag`, `no_ads_or_purchases_flag`

The final table is added to a Parent Segment as an attribute table, so the scores can be used in Audience Studio segments. Each run also appends summary stats to three dashboard tables, which the NBA insights agent reads.

TD project name: `nba_eng_prod` (from `tdx.json`). Entry point: `nba_eng_launch.dig`. All parameters live in `config/input_params.yml`.

## Workflow Structure

```
nba_eng_launch.dig                    # entry point: schedule, error email, runs the steps below in order
├── +create_sink_database             # 0. td_ddl> creates sink_database if it does not exist yet
├── nba_union_all_activity.dig        # 1. union every aggregate_metrics_tables source → sessionize → top-k channels → <src_union_table>_final
├── (parallel)
│   ├── nba_next_best_time_metrics.dig      # 2a. daypart counts + scores → temporary_tables.next_best_time
│   ├── nba_next_best_channel_metrics.dig   # 2b. channel counts + scores → temporary_tables.next_best_channel
│   └── nba_next_best_campaign_metrics.dig  # 2c. flags → custom_flags_table → temporary_tables.next_best_campaign
├── nba_metrics_table.dig             # 3. join the three temp tables per profile → final_nba_metrics_table
├── nba_dash_stats.dig                # 4. append this run's stats to nba_dash_* tables
└── nba_cleanup_runner.dig            # 5. drop temporary_tables.table_list (only if cleanup_temp_tables = 'yes')
```

| Folder | Contents |
|---|---|
| `config/` | `input_params.yml` — the only file a standard deployment edits |
| `sql/union/` | Source union, sessionization, top-k lookup. `sql/union/<name>.sql` is read instead of the generated SQL when a source sets `query_type: custom` (`order_events.sql` is an example) |
| `sql/final/` | Final per-profile join |
| `queries/next_best_time/`, `queries/next_best_channel/`, `queries/next_best_campaign/` | Scoring SQL per metric |
| `queries/dash/` | Dashboard stats |
| `body.txt` | Failure email body |

## Configuration

All keys are in `config/input_params.yml`. The template values are a working example; change the ones in **bold** for every customer. Keys marked *not read* exist in the config but no active workflow step uses them — leave them as they are.

### Global

| Parameter | What it does | How to choose it |
|---|---|---|
| **`sink_database`** | Database for every table the workflow writes | The confirmed sink database (sink-database gate). Created by the first run if it does not exist (`+create_sink_database`); the project owner needs permission to create databases, otherwise create it in the TD Console first |
| **`unique_user_id`** | Profile ID column used to group and join every source | The ID column all source tables share and the Parent Segment joins on (e.g. `canonical_id`, `td_customer_id`). Check it exists in every source with `DESCRIBE` |
| `cleanup_temp_tables` | `'yes'` drops the per-metric temp tables after the run | `'yes'` in production; `'no'` while debugging scores |
| `prefix` | Prefix for the next-best-time staging table | Keep `nba` |

### Time filter, sessions, scoring

| Parameter | What it does | How to choose it |
|---|---|---|
| **`time_filter_type`** | `interval` = `TD_INTERVAL(time, '<lookback_period>/now')`; `range` = `TD_TIME_RANGE(start, end)`. Only applied to sources with `apply_time_filter: true` | `interval` for scheduled runs. Use `range` for a fixed historical window — required when the data stops before today (demo or backfilled data) |
| `time_range_start_date` | Start date for `range` | First date of the window (YYYY-MM-DD) |
| `time_range_end_date` | End date for `range` (ignored by `interval`) | Last date of the window; a far-future date means "up to the latest data" |
| **`lookback_period`** | Window for `interval`, counted back from the run date | Long enough to see repeat behavior (6–12 months); shorter for very large accounts or Trino memory errors |
| `session_length` | Seconds of inactivity that start a new session | Keep the template value unless the customer defines sessions differently |
| `backfill_partition_col` | Scope used to fill NULL channels from neighboring touchpoints | `${unique_user_id}` to fill across the whole journey; `session_id` to fill within a session only |
| `timeshift_change`, `timeshift_hours` | Builds `adjusted_time` / `adjusted_hour` = UTC time shifted by ± N hours. `adjusted_time` drives the dashboard date range | Set to the customer's marketing timezone offset. Dayparts use UTC `time_hour` unless `day_breakdown` is written against `adjusted_hour` (see below) |
| **`scoring_logic`** | Scoring for per-daypart and per-channel scores: `quartile`, `percentile` or `minmax`. Next Best Channel supports only `percentile`; any other value scores channels with `minmax` | `quartile` for simple "top 25%" segments; `percentile` for evenly spread activity; `minmax` when a few power users dominate |
| `topk_values` | Number of most frequent channels (and sources, campaigns) that keep their name; all others become `others` | Raise it when too many profiles land in `others` |

### Output tables

| Parameter | What it does | How to choose it |
|---|---|---|
| `src_union_table` | Base name of the union tables (`_temp`, `_session`, `_final`, `_sample`) | Keep the default unless the customer has a naming rule |
| `final_nba_metrics_table` | Final per-profile table — the one joined to the Parent Segment | Keep the default unless the customer has a naming rule |

### Sources — `aggregate_metrics_tables` (one entry per source)

Inside these strings single quotes are doubled (`''…''`), because the value is pasted into another SQL string. Fields that do not apply to a source are filled with a literal (`"''email''"`) or `CAST(NULL AS VARCHAR)`.

| Parameter | What it does | How to choose it |
|---|---|---|
| **`aggregate_metrics_tables`** | List of sources unioned into one activity table | One entry per touchpoint or conversion table found in Phase 1. Remove template entries the customer does not have |
| **`aggregate_metrics_tables[].src_table`** | Source table | `database.table` |
| `aggregate_metrics_tables[].name` | Source label; also the file name `sql/union/<name>.sql` for `query_type: custom` | Short snake_case label (`pageviews`, `email_events`, `order_events`) |
| `aggregate_metrics_tables[].unixtime_col` | Event time as UNIX seconds | `time` only if it is the real event time; otherwise the event column, wrapped in `TD_TIME_PARSE(…)` if it is a string |
| `aggregate_metrics_tables[].join_key` | Profile ID column in this source | `${unique_user_id}` unless this source names the ID differently |
| `aggregate_metrics_tables[].market_col`, `aggregate_metrics_tables[].brand_col` | Optional market / brand labels | A column if the customer runs several markets or brands, else `"''none''"` |
| `aggregate_metrics_tables[].url_col` | Page URL | Web: URL column (e.g. `td_url`); other sources: `CAST(NULL AS VARCHAR)` |
| `aggregate_metrics_tables[].referral_col` | Referrer; also searched for `utm_medium` when `medium_col` is empty | Web: referrer column; email: `"''email''"`; others: `CAST(NULL AS VARCHAR)` |
| **`aggregate_metrics_tables[].medium_col`** | Channel of each event — the basis of Next Best Channel | Web: `url_extract_parameter(LOWER(<url>),''utm_medium'')`; other sources: a fixed channel label |
| `aggregate_metrics_tables[].source_col` | Marketing source | Web: `utm_source`; email: the ESP name; CRM: a source column |
| `aggregate_metrics_tables[].campaign_col` | Campaign | Web: `utm_campaign`; email: normalized campaign name |
| `aggregate_metrics_tables[].context_col` | Extra context (device, email name, topic, order type) | Any useful descriptive column |
| `aggregate_metrics_tables[].event_type` | Event label — `abandon_regexp` is matched against it | Web: `"''web_activity''"` or the event column if add-to-cart events are tracked there; others: `CONCAT(''<source>_'', <type column>)` |
| **`aggregate_metrics_tables[].custom_filter`** | SQL `WHERE` condition | Always `${unique_user_id} IS NOT NULL`; exclude email sends/bounces, cancelled/refunded orders, bots, test records |
| **`aggregate_metrics_tables[].conversion_flag`** | 1.0 = the row is a conversion | Orders/purchases: `1.0`; web: `IF(REGEXP_LIKE(lower(<path>), ''<confirmation pattern>''), 1.0, 0.0)`; email/CRM: `0.0` |
| `aggregate_metrics_tables[].item_price` | Revenue per row (dashboard `total_spend`) | Revenue column on the conversion source; `0.0` elsewhere |
| `aggregate_metrics_tables[].apply_time_filter` | Applies the time filter to this source | `true` on every source when a window is wanted; `false` on all to use all history |
| `aggregate_metrics_tables[].query_type` | Blank = SQL generated from these fields; `custom` = read `sql/union/<name>.sql` | Blank unless the source needs joins or de-duplication (e.g. one row per order line) |

### Next Best Time — `next_best_time`

| Parameter | What it does | How to choose it |
|---|---|---|
| `next_best_time` | Daypart scoring section | — |
| `next_best_time.outputs` | Inputs and outputs of the daypart step | — |
| `next_best_time.outputs.database` | *Not read* | Leave as `${sink_database}` |
| `next_best_time.outputs.union_table` | Activity table the step reads | Keep `<src_union_table>_final` |
| `next_best_time.outputs.activity_period_column` | Name of the daypart label column | Keep `activity_period` |
| `next_best_time.outputs.day_breakdown` | List of dayparts | Keep the four template dayparts; change only the hour ranges |
| `day_breakdown[].period` | Daypart name | Must stay `morning`, `afternoon`, `evening`, `overnight` — the scoring SQL uses these names (see Customization Points) |
| `day_breakdown[].logic` | Trino condition that assigns an event to the daypart | Uses `time_hour` (UTC hour). For local-time dayparts write it against `adjusted_hour` instead and set `timeshift_*`. Ranges must cover 0–23 without overlap |

### Next Best Channel — `utm_parcing`

| Parameter | What it does | How to choose it |
|---|---|---|
| `utm_parcing` | Channel scoring section | — |
| `utm_parcing.date_field` | *Not read* | Leave as is |
| `utm_parcing.channel_column` | Channel column in the activity table | Keep `channel` |
| `utm_parcing.source_column` | Source column in the activity table | Keep `source` |
| `utm_parcing.exclude_channel_regexp` | Channel values matching this regex are ignored (junk UTM values) | Add characters seen in junk values |
| `utm_parcing.min_percent` | A channel gets its own score column only if it has more than this % of all events | Lower it to score more small channels |
| `utm_parcing.outputs` | Output section | — |
| `utm_parcing.outputs.union_table` | Activity table the step reads | Keep `<src_union_table>_final` |

### Next Best Campaign and flags — `next_best_campaign`

| Parameter | What it does | How to choose it |
|---|---|---|
| `next_best_campaign` | Flags and campaign section | — |
| `next_best_campaign.database`, `next_best_campaign.join_key`, `next_best_campaign.date_field` | *Not read* | Leave as is |
| `next_best_campaign.src_table` | Activity table the flags are computed from | Keep `<src_union_table>_final` |
| **`abandon_regexp`** | Condition on `event_type` that marks an add-to-cart event | Match the customer's real add-to-cart `event_type` values; check with `SELECT DISTINCT event_type` on the union table |
| `abandon_regexp_string` | Same condition with doubled quotes, stored in the dashboard | Always identical to `abandon_regexp` with `'` → `''` |
| `conversion_logic` | Condition that marks a conversion | Keep `conversion_flag > 0` |
| **`ad_engagement_logic`** | Condition on `channel` that marks paid/ad engagement | List the paid channels as they appear in `channel` after the first run (lower-case) |
| `ad_engagement_logic_string` | Same condition with doubled quotes, stored in the dashboard | Always identical to `ad_engagement_logic` with `'` → `''` |
| **`event_lookback`** | Days back (from the run date) for the recent-purchase, recent-ad and cart-abandon flags | Match the campaign cadence (30–90). When the data ends before today, increase it or these flags are all 0 |
| **`new_customers_days`** | Max days since first visit for `new_visitor_flag` | Match the welcome-journey length (30–60). Same run-date caveat |
| `custom_flags_table` | Table with the per-profile flags | Keep the default |

### Temporary tables — `temporary_tables`

| Parameter | What it does | How to choose it |
|---|---|---|
| `temporary_tables` | Temp table names | — |
| `temporary_tables.next_best_time`, `temporary_tables.next_best_channel`, `temporary_tables.next_best_campaign` | Per-metric temp tables joined into the final table | Keep the defaults — the final join finds them by name pattern (`next_best_time\|next_best_channel\|next_best_campaign`) |
| `temporary_tables.cart_abandon`, `temporary_tables.new_visitors` | *Not read* (legacy names; also listed in `table_list`) | Leave as is |
| `table_list` | Tables dropped when `cleanup_temp_tables: 'yes'` | Keep the default; add any custom temp table |

## Outputs

All tables are written to `sink_database`.

| Table | Grain | Purpose |
|---|---|---|
| `final_nba_metrics_table` (default `nba_combined_metrics_final`) | One row per `unique_user_id` | **Parent Segment attribute table.** Columns: `activity_list`; `next_best_time`, `<daypart>_events`, `<daypart>_activity_<scoring>`, `<daypart>_engagement_score`; `next_best_channel` and per-channel score columns; the 7 flags; `next_best_campaign`; `num_visits`, `first_visit`, `last_visit`, `last_purchase_date`, `last_ad_engagement_date`, `last_cart_add_date` |
| `nba_dash_stats_summary` | (session_id, metric_name, metric_value) | Distribution of every `next_best*` and `*_flag` column, appended each run |
| `nba_dash_model_metrics` | One row per source per run | Config used in the run (source fields, time filter, flag rules) and `profiles_scored` |
| `nba_dash_source_tables` | One row per source per run | Events, profiles, conversions, spend and date range per `src_table` |
| `nba_dash_session_filter` | One row per run | Run list with rank (latest = 1) |
| `<src_union_table>_final`, `_session`, `_temp`, `_sample`; `nba_table_params`; `nba_topk_values_lookup`; `custom_flags_table` | — | Intermediate tables, kept after the run (useful for debugging) |

The three `nba_dash_*` tables keep history: each run appends rows under its `session_id`.

## Secrets & Requirements

- **Secrets:** none. The workflow uses only `td>` / `td_ddl>` operators with the project owner's credentials.
- **Failure email:** `nba_eng_launch.dig` `_error` sends to `your-team@example.com` — replace it with the customer's address or remove the `_error` block. Update `subject` with the customer name.
- **Schedule:** `nba_eng_launch.dig` runs monthly (`monthly>: 3,06:15:00` UTC). Change or remove before the first push if the customer wants a different cadence.
- **Requirements:** `sink_database` exists and is writable; every source has a profile ID column and a usable event timestamp; Trino (`presto`) engine. Large accounts may need a shorter `lookback_period`.

## Customization Points

Beyond `config/input_params.yml`, these are the only supported code changes. Record every one in the engagement docs.

| Change | Where |
|---|---|
| Source needs joins, de-duplication or a different column shape | Set `query_type: custom` on the source and add `sql/union/<name>.sql` returning the same columns as `sql/union/insert_src_table.sql` |
| Rename or add dayparts | `queries/next_best_time/create_activity_labels_{quartile,percentile,minmax}.sql` (the four daypart names are written into these queries), then `day_breakdown` |
| Different campaign-type rules | `queries/next_best_campaign/final_table_custom.sql` |
| New flag | `queries/next_best_campaign/custom_engagement_flags.sql` — name it `*_flag` so the dashboard stats pick it up |
| Channel name normalization (e.g. merge `facebook`/`fb`) | `queries/next_best_channel/load_distinct_channels.sql` |
| Failure email, schedule | `nba_eng_launch.dig` |
