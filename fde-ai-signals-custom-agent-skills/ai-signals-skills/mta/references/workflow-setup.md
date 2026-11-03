# MTA (Multi-Touch Attribution) — Workflow Setup

Use with `../../shared/push_pattern_td_workflows.md` (copy, gates, push, run). Two other files are the source of truth — read both in the working copy before editing anything:

- `<workdir>/README.md` — workflow structure, what every parameter does and how to choose it, outputs, customization points
- `<workdir>/config/input_params.yml` — exact parameter names, nesting and syntax (edit this file in place; keep every key)

`<workdir>` = `agent_outputs/<project_slug>/workflow`. This file adds only what the template can't: how to pick values from the customer's data, MTA deploy details, and the output checks.

> **Minimal push first (Phase 3, before requirements come back).** Configure the real source tables, customer ID, channel expressions and conversion definition from Phase 1; take the "First push" default of every rule below; template values for everything else; schedule and failure email left commented. Record each assumed value and data caveat in `project_state.md` as "default — confirm in requirements" and move on — caveats are resolved in Phase 4, not before the first run.

---

## 1. Map Phase 1 tables to the config

MTA reads **several event tables** — one `aggregate_metrics_tables` entry each — and needs at least one **conversion** source. Every entry maps the source to the same touchpoint format.

| Source type | Recognize it by | `conversion_flag` | `item_price` |
|---|---|---|---|
| Web activity (pageviews) | URL, referrer, path columns (`td_url`, `page_url`, `td_referrer`) | `IF(…)` on conversion pages (thank-you, confirmation, application submitted), else `0.0` | `1.0` |
| Email events | `event_type` with open / click / send, campaign or email name | `0.0` | `0.0` |
| Sales / CRM interactions | `source`, `topic`, rep or activity columns | `0.0` | `0.0` |
| Ads, SMS, push, events, support | Channel or campaign column per row | `0.0` | `0.0` |
| Orders / conversions | Order status, revenue column — these **are** the conversions | `1.0` | Revenue column (`1.0` if none) |

Rules:
- **One row per event.** Profile, aggregate and system tables are not sources. Each source needs the customer ID under the same column name as `unique_user_id`; a source with another ID name needs a custom query (README Customization Points).
- **Conversion definition.** At least one source must produce conversions. **First push:** completed orders when an order table exists (exclude cancelled, returned, failed and test orders in `custom_filter`); otherwise the clearest conversion page on the web table. Record any other candidate (form submit, application, subscription) for the requirements doc.
- **Channel expressions (web).** `medium_col`, `source_col`, `campaign_col` and `utm_mailing_col` keep the template's `COALESCE(url_extract_parameter(LOWER(<url_col>), ''utm_…''), …)` pattern with the source's URL column — never default NULLs to a literal like `''direct''`, the workflow backfills them from earlier touchpoints. Decide from the UTM coverage query (discovery query 2), never from a few sample URLs.
- **Channel expressions (other sources).** A literal channel per source (`''email''`, `''sales_rep_interactions''`, `''sms''`), the provider or a column as source, and the campaign or topic column as campaign. Normalize names with `REGEXP_REPLACE(lower(<col>), ''[- ]'', ''_'')` when they mix case and separators.
- **Channel labels.** Channel values become column names of the Markov transition matrix: keep them short, lowercase, without spaces or punctuation (`paid_search`, not `Paid Search (Google)`) — normalize them in the channel expressions. Aim for about 15 channels or fewer; small ones become `other` (`top_k_channel_perc`).
- **Context.** `context_col` = the most descriptive column of the touchpoint: the page **title or path** for web (not `event_type`), the email name, the interaction topic, the order type.
- **Email filter.** Keep engagement only: exclude sends, deliveries, bounces and spam reports in `custom_filter`; keep opens, clicks and unsubscribes.
- **Event time:** `unixtime_col` drives sessions, journeys and the time filters, so it must be a UNIX-seconds column. Decide per table in Phase 1 whether TD's `time` is the real event time or only the load time:

  | Profile shows | Meaning | Use |
  |---|---|---|
  | Same range as the candidate event column, median gap under ~1 day (or exactly whole hours — a local-time string) | `time` is the event time | `time` |
  | `time` spans days while the candidate spans months, few distinct `time` values, or `time` always later | `time` is the load time | A UNIX-seconds event column (`TD_TIME_PARSE(<col>)` inside `unixtime_col` for a string) |
  | No candidate column | Only `time` exists | `time`, noted as a caveat |

  Record the choice and its evidence in `project_state.md`.
- **Quotes:** string literals inside the SQL expressions use doubled single quotes, as in the template; keep `yes` / `no` values quoted.

### Discovery queries

Run with `tdx query` against the source database — yourself, not through subagents. Replace the placeholders with the real column names from the Phase 1 column query. Don't start the SQL with a `--` comment: `tdx query` reads it as an option and fails. Run all of them in **one shell command** (`tdx query … & tdx query … & wait`), not as separate tool calls.

**1. Profile of every candidate source** — one `UNION ALL` block per table: size, customers, NULL IDs, date range, event-time decision. `<event_time>` is the candidate event column as UNIX seconds; use `time` for both when it is the only timestamp:

```sql
SELECT '<table>' AS tbl, COUNT(*) AS total_rows, COUNT(DISTINCT <id_col>) AS customers,
       COUNT_IF(<id_col> IS NULL) AS null_ids,
       TD_TIME_FORMAT(MIN(time), 'yyyy-MM-dd') AS time_first, TD_TIME_FORMAT(MAX(time), 'yyyy-MM-dd') AS time_last,
       TD_TIME_FORMAT(MIN(<event_time>), 'yyyy-MM-dd') AS event_first, TD_TIME_FORMAT(MAX(<event_time>), 'yyyy-MM-dd') AS event_last,
       APPROX_PERCENTILE(ABS(time - <event_time>), 0.5) AS median_gap_s
FROM <source_database>.<table>
UNION ALL
SELECT '<next table>', … FROM <source_database>.<next table>
```

**2. UTM coverage of each web table** — required before choosing the channel expressions:

```sql
SELECT COUNT(*) AS total_rows,
       COUNT_IF(url_extract_parameter(<url_col>, 'utm_medium') IS NOT NULL) AS has_utm_medium,
       COUNT_IF(url_extract_parameter(<url_col>, 'utm_source') IS NOT NULL) AS has_utm_source,
       COUNT_IF(url_extract_parameter(<url_col>, 'utm_campaign') IS NOT NULL) AS has_utm_campaign,
       COUNT_IF(<referrer_col> IS NOT NULL AND <referrer_col> <> '') AS has_referrer
FROM <source_database>.<web_table>
```

**3. One breakdown query** — channel values and conversion candidates: top UTM mediums and sources (web), conversion-looking paths (`REGEXP_LIKE(lower(<path_col>), 'thank|confirm|success|complete|submit')`), email event types, order statuses. One `UNION ALL`, one block per column:

```sql
SELECT '<table>.<col>' AS col, CAST(<col> AS VARCHAR) AS value, COUNT(*) AS n
FROM <source_database>.<table> GROUP BY 1, 2
UNION ALL
SELECT '<next>', CAST(<next col> AS VARCHAR), COUNT(*) FROM … GROUP BY 1, 2
ORDER BY col, n DESC
```

Minimum viable data: at least two channels, a few hundred conversions, and customers with more than one touchpoint before converting. Below that, tell the user attribution won't add much value over last touch.

Record the column names and findings in `project_state.md` (Phase 1) — they are needed again in Phase 4.

## 2. Choose the other values

| Decision | Rule |
|---|---|
| `session_length` | **First push:** `3600`. Longer (`86400`) when most touchpoints are email or offline and a "session" should mean a day |
| `max_journey_days` | **First push:** `180`, or the buying cycle stated in the business context (shorter for retail, longer for considered purchases) |
| Source time filters | **First push:** `apply_time_filter: false` on every source (all history). Turn it on with a window only for very large sources |
| Markov and Shapley input | No separate window: Markov reads every journey in `mta_journeys`, Shapley the multi-step, multi-channel journeys (at most `shapley_max_load_rows` rows). To analyze a shorter period, use the source time filters (`apply_time_filter`, `time_filter_type`) |
| `shapley_lookback_window` | **First push:** `4`; `3` for short journeys (median under 3 unique channels) or slow runs |
| `shapley_order` | **First push:** `true`; `false` when many channels have little data or touches share timestamps |
| Small channels (`top_k_channel_perc`, `top_k_conv_perc`) | **First push:** `0.01`; raise when the channel list is long and noisy |
| `include_non_converted_channels` | **First push:** `'yes'` |
| Customer enrichment | **First push:** `add_customer_analysis: 'no'`. `'yes'` only when the customer has a scored customer table (e.g. an RFM project's output) and wants journeys by segment |
| `ml_batch_api_endpoint` | From the `site` in `tdx status` (`us01`, `jp01`, `eu01`, `ap02`, `ap03`) → the endpoint in the README / `ai-signals-guide.md` §3. Set it once in the config — every AI Signals call in the `.dig` reads it; never edit the URL in the `.dig` |
| Failure email | Uncomment the `_error` block in `mta_advanced_launch.dig` and set the address from the requirements, or leave it commented if none is given. Put the project name in `subject` |

## 3. Deploy details

| Item | Value |
|---|---|
| Default project name | `mta_ais` (from `tdx.json`) |
| Entry point | `mta_advanced_launch` — never run the sub-workflows on their own; each needs the previous one's tables |
| Secrets | None to set. `mta_markov_shapley_ai_signals.dig` sends `${secret:td.apikey}`, which the AI Signals architecture provides — never ask the user to set it, and keep the header exactly as in the template |
| API endpoint | `ml_batch_api_endpoint` in the config, from the `tdx status` site (§2) |
| Schedule | Commented out in `mta_advanced_launch.dig`. Ask whether the customer wants scheduled runs; leave it commented for a test account |
| Sink database | Created by `+create_sink_database` if missing. If the project owner can't create databases, the user creates it in the TD Console before the first run |

Push and run with the shared pattern (`tdx wf push -y` from `<workdir>`, `tdx wf run <project>.mta_advanced_launch` after the one approval). Tell the user the run takes several minutes — the Markov and Shapley models are the longest steps.

## 4. Validate

Run after every run (Phase 3 and Phase 4), as direct `tdx query` calls in one shell command (`tdx query … & tdx query … & wait`) — never through a script you write. Replace `<db>` with `sink_database` and `<id>` with `unique_user_id`. Record the results in `project_state.md`.

**1. Every source flowed in; only conversion sources convert**

```sql
SELECT src_table, COUNT(*) AS touchpoints, COUNT(DISTINCT <id>) AS customers,
       CAST(SUM(conversion_flag) AS BIGINT) AS conversions
FROM <db>.journey_src_union_final GROUP BY 1 ORDER BY 2 DESC
```
Pass: one row per configured source; `conversions > 0` only for the conversion source(s). A missing source returned no rows after `custom_filter` or the time filter; zero conversions overall means the `conversion_flag` expression matches nothing.

**2. Channels resolved**

```sql
SELECT channel, total_events, ROUND(perc_of_total_events * 100, 1) AS pct_events,
       CAST(total_conversions AS BIGINT) AS conversions, ROUND(perc_of_total_conv * 100, 1) AS pct_conv,
       distinct_journeys, converted_journeys
FROM <db>.mta_journeys_validate ORDER BY total_events DESC
```
Pass: recognizable channel names; `other` or empty below ~70% of events; no single channel with more than ~90% of conversions. Check `mta_channel_parsing_validate` for the source and campaign values behind each channel.

**3. Journeys are multi-touch**

```sql
SELECT journey_length, COUNT(DISTINCT conversion_journey_id) AS journeys
FROM <db>.mta_journeys GROUP BY 1 ORDER BY 1 LIMIT 20
```
Pass: not almost all length 1 (that leaves attribution equal to last touch); journeys over 50 steps rare. All length 1 → check `session_length`, `max_journey_days` and that every source uses a real event time.

**4. Standard models and top paths**

```sql
SELECT attribution_type, COUNT(DISTINCT channel) AS channels, ROUND(SUM(total_conversions), 1) AS conversions
FROM <db>.mta_models_standard GROUP BY 1 ORDER BY 1
```
Pass: four models (First Touch, Last Touch, Linear, U-Shaped) with about the same conversion total. `mta_top_conversion_journeys` has both `target` values (`conversion`, `churn`).

**5. AI Signals models wrote this run**

```sql
SELECT 'markov' AS model, COUNT(*) AS channels, ROUND(SUM(attribution_markov_algorithmic), 1) AS credit, MAX(run_time) AS run_time
FROM <db>.mta_markov_attribution_final WHERE run_time = (SELECT MAX(run_time) FROM <db>.mta_markov_attribution_final)
UNION ALL
SELECT 'shapley', COUNT(DISTINCT channels), ROUND(SUM(value), 1), MAX(run_time)
FROM <db>.mta_shapley_attribution_final
WHERE run_time = (SELECT MAX(run_time) FROM <db>.mta_shapley_attribution_final) AND step = 0
```
Pass: both rows have the latest run time and one entry per main channel; Markov `credit` about equals the converting journeys in `mta_markov_input_table`; Markov `removal_effect > 0` for the channels that appear in converted journeys (channels seen only in non-converting journeys have 0 — expected); `mta_shapley_attribution_final` has steps 0 to `shapley_lookback_window` for this run; `mta_markov_transition_final` has rows for this run. Empty, or the same numbers as the previous run → a model run failed (Troubleshooting).

### Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `journey_src_union_final` empty | Run failed early, or every source was filtered out | `tdx wf attempt <id> tasks`, then `logs +<failed task>`; check `custom_filter` and the time filters |
| A source missing in check 1 | `custom_filter` or time filter removes all rows, or the ID column has another name | Relax the filter; custom query for another ID name |
| No conversions | `conversion_flag` expression matches nothing | Query the conversion column's distinct values; check case and exact strings |
| Everything is `other` or empty | Low UTM coverage or wrong URL column | Discovery query 2; use the referrer or a literal channel; lower `top_k_channel_perc` |
| Journeys all length 1 | `session_length` / `max_journey_days` too short, or load time used as event time | Widen them; use the real event column |
| Markov / Shapley `*_final` empty for the run | The model input was empty (no journeys after the source filters; for Shapley, no multi-step, multi-channel journeys) | Check `mta_markov_input_table` / `mta_shapely_input_table` row counts; relax the source time filters |
| Model step returns 401/403 or the run is rejected | `ml_batch_api_endpoint` doesn't match the account's region, or `mta_markov` / `mta_shapley` are not enabled for the account | Set the regional endpoint; otherwise ask the account admin to enable the AI Signals MTA solutions |
| Workflow succeeds but a `*_final` table repeats the previous run's numbers | The status call returns 200 with a failed terminal status (e.g. zero conversions, NULL-only channels, Markov input without ` > `), so the raw table kept the previous output | Read the status response in the poll task's log (`error_messages`); fix the input and re-run |
| Model step slow or times out | Input too large | Narrow the source time filters, lower `shapley_lookback_window`, or lower `shapley_max_load_rows` |
