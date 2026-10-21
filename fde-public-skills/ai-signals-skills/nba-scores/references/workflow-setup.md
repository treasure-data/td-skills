# NBA Engagement Scores — Workflow Setup

Use with `../../shared/push_pattern_td_workflows.md` (copy, gates, push, run). Two other files are the source of truth — read both in the working copy before editing anything:

- `<workdir>/README.md` — workflow structure, what every parameter does and how to choose it, outputs, customization points
- `<workdir>/config/input_params.yml` — exact parameter names, nesting and syntax (edit this file in place; keep every key)

`<workdir>` = `agent_outputs/<project_slug>/workflow`. This file adds only what the template can't: how to pick values from the customer's data, NBA deploy details, and the output checks.

---

## 1. Map Phase 1 tables to sources

Each confirmed activity table becomes one entry in `aggregate_metrics_tables`. Replace the template's example entries; remove the ones the customer doesn't have. Every entry fills the same fields — use a fixed label or `CAST(NULL AS VARCHAR)` where a field doesn't apply.

| Source type | Role | Channel fields | `conversion_flag` | Must-have filter |
|---|---|---|---|---|
| Web / pageviews | Channel + time signals; conversions via URL pattern | From UTM parameters in the URL | Confirmation-page regex → 1.0, else 0.0 | Non-null profile ID; bots/other languages if present |
| Email events | Channel + time signals | Fixed `email` medium, ESP as source, campaign name | `0.0` | Exclude send, delivered, bounce, spam |
| CRM / sales / support | Channel + time signals | Fixed medium label, real source/topic columns | `0.0` | Exclude internal/test records |
| Orders / purchases | Conversions | All channel fields NULL | `1.0` | Only valid statuses (complete, processing, paid, shipped, delivered) |
| Other (app, store, survey…) | Decide: touchpoint (0.0) or conversion (1.0) | Fixed medium label | As decided | Non-null profile ID |

Rules:
- **Event time:** Next Best Time, the flag windows and the time filter are computed from `unixtime_col`. Decide per table in Phase 1 whether TD's `time` column is the real event time or only the load / insert time:
  1. **Candidate event columns** — from the column query: timestamp or date types, or names like `*_at`, `*_time`, `*_date`, `event_timestamp`, `order_date`. Skip columns about the record rather than the event (`updated_at`, `ingested_at`, `_load*`).
  2. **Compare** `time` with the best candidate in the profile query below: both date ranges, `COUNT(DISTINCT time)` vs. rows, and the median per-row gap.
  3. **Decide:**

     | Profile shows | Meaning | Use |
     |---|---|---|
     | Same range, median gap under ~1 day | `time` is the event time | `time` — already UNIX seconds, filters on it read only the matching data, no time-zone guess |
     | Median gap of exactly whole hours (e.g. `14400` = 4 h) | The same events; the candidate string is local time without a time zone | `time` (true UTC) — note the offset — it is the customer's time zone for `timeshift_hours` (§2) |
     | `time` spans days while the candidate spans months, few distinct `time` values, or `time` always later than the candidate | `time` is the load time | The candidate — `TD_TIME_PARSE(<col>)` if it is a string (a string without a time zone is read as UTC; note it) |
     | No candidate column | Only `time` exists | `time`, noted as a caveat and asked in the requirements doc |
     | Several plausible candidates (e.g. `order_date`, `shipped_at`) | Unclear which event counts | The one matching the activity (order placed, not shipped), recorded as "default — confirm in requirements" |

  4. **Record** the choice and its evidence per table in `project_state.md` (e.g. "`time` = event time: same range, median gap 0 s").
- **Profile ID:** every source must carry the same ID as `unique_user_id`. If a source names it differently, set that source's `join_key` to its column.
- **Filters:** only the must-have filters above, plus fixes for problems the profile query actually found. Do not add NULL-ID or timestamp-parse guards when the profile query shows none.
- **Quotes:** string literals inside config values use doubled single quotes, as in the template.
- **De-duplication:** if orders have one row per line item, conversions are counted per line. Either accept it (say so in the docs) or set `query_type: custom` and write `sql/union/<name>.sql` (copy the column list of the template's `sql/union/order_events.sql`).

### Discovery queries

Run with `tdx query` against the source database — yourself, not through subagents. Replace `<url>`, `<path>` etc. with the real column names from the Phase 1 column query. Don't start the SQL with a `--` comment: `tdx query` reads it as an option and fails. Run all discovery queries below in **one shell command** (`tdx query … & tdx query … & wait`), not as separate tool calls.

Profile query for all confirmed tables — one `UNION ALL`, one block per table (ID coverage, event-time decision, data date range — §2 time filter). Omit `event_*` / `median_gap_s` for tables whose only timestamp is `time`; `<event_time>` is the candidate event column as UNIX seconds (`TD_TIME_PARSE(<col>)` for a string):

```sql
SELECT '<table>' AS src,
       COUNT(*) AS total_rows, COUNT(<id>) AS rows_with_id, APPROX_DISTINCT(<id>) AS profiles,
       TD_TIME_FORMAT(MIN(time), 'yyyy-MM-dd') AS time_first, TD_TIME_FORMAT(MAX(time), 'yyyy-MM-dd') AS time_last,
       TD_TIME_FORMAT(MIN(<event_time>), 'yyyy-MM-dd') AS event_first, TD_TIME_FORMAT(MAX(<event_time>), 'yyyy-MM-dd') AS event_last,
       COUNT(DISTINCT time) AS time_distinct,
       APPROX_PERCENTILE(ABS(time - <event_time>), 0.5) AS median_gap_s
FROM <source_database>.<table>
UNION ALL
SELECT '<next table>' AS src, …
```

UTM coverage on web data — **always run it**; clean-looking sample URLs often still carry UTMs:

```sql
SELECT COUNT(*) AS total_rows,
       COUNT_IF(url_extract_parameter(<url>, 'utm_source') IS NOT NULL) AS has_utm_source,
       COUNT_IF(url_extract_parameter(<url>, 'utm_medium') IS NOT NULL) AS has_utm_medium,
       COUNT_IF(url_extract_parameter(<url>, 'utm_campaign') IS NOT NULL) AS has_utm_campaign
FROM <source_database>.<web_table>
```

Below ~30% coverage, Next Best Channel will be dominated by web traffic without a channel — tell the user. If a referrer column exists, the workflow also extracts `utm_medium` from it.

UTM values (become channel names):

```sql
SELECT LOWER(url_extract_parameter(<url>, 'utm_medium')) AS medium, COUNT(*) AS n
FROM <source_database>.<web_table>
GROUP BY 1 ORDER BY 2 DESC LIMIT 30
```

Conversion and add-to-cart pages:

```sql
SELECT <path>, COUNT(*) AS n
FROM <source_database>.<web_table>
WHERE REGEXP_LIKE(LOWER(<path>), 'thank|confirm|success|order|receipt|cart|basket|checkout')
GROUP BY 1 ORDER BY 2 DESC LIMIT 30
```

Event types and statuses (email, CRM, orders) — one `UNION ALL`, one block per column:

```sql
SELECT '<table>' AS src, '<col>' AS col, CAST(<col> AS VARCHAR) AS value, COUNT(*) AS n
FROM <source_database>.<table> GROUP BY 1, 2, 3
UNION ALL
SELECT '<next table>', '<col>', CAST(<col> AS VARCHAR), COUNT(*) FROM … GROUP BY 1, 2, 3
ORDER BY src, col, n DESC
```

Record the column names and findings in `project_state.md` (Phase 1) — they are needed again in Phase 4.

## 2. Choose the other values

| Decision | Rule |
|---|---|
| Time filter | Data ends within the last few days → `interval` with a `lookback_period` long enough for repeat behavior (6–12 months). Data ends earlier (demo, backfill, paused feed) → `range` covering the data, because `interval` counts back from the run date. Set `apply_time_filter` the same on every source |
| Flag windows | `event_lookback` and `new_customers_days` also count back from the **run date**. If the latest event is older than the window, the recent-purchase, recent-ad, cart-abandon and new-visitor flags are all 0 — for stale data, set them to cover the gap (days since last event + intended window) and note it in `project_state.md` |
| Add-to-cart | `abandon_regexp` is matched against the unioned `event_type`. If add-to-cart is visible only in the URL, make the web source's `event_type` an expression that labels those rows (e.g. `IF(REGEXP_LIKE(LOWER(<path>), ''cart''), ''add_cart'', ''web_activity'')`) and match that label. Keep `abandon_regexp_string` identical with doubled quotes |
| Paid channels | `ad_engagement_logic` matches values of the unioned `channel` column (lower-case medium values; spaces and hyphens become `_` only in score column names). First push: use the paid media values from the UTM query. After the first run, check the real values (§4) and correct it. Keep `ad_engagement_logic_string` identical with doubled quotes |
| Scoring | `quartile` unless the requirements say otherwise. Channel scores support only `percentile`; any other value scores channels with min-max — explain this if the customer picks `quartile` |
| Timezone | Non-UTC customers: set `timeshift_change`/`timeshift_hours` to the offset **and** rewrite each `day_breakdown[].logic` against `adjusted_hour` instead of `time_hour`. Keep the four daypart names |
| Top channels | Start with the template's `topk_values`. If many profiles get `next_best_channel = others`, raise it |
| Failure email | Replace `your-team@example.com` in `nba_eng_launch.dig` with the address from the requirements, or remove the `_error` block if none is given. Put the customer name in `subject` |

**Minimal push (Phase 3, before requirements come back):** real sources, IDs, timestamps, filters and conversion flags from Phase 1; the time filter per the rule above; template values for everything else; the failure email removed or set to the user's address. Note every assumed value in `project_state.md` as "default — confirm in requirements".

## 3. Deploy details

| Item | Value |
|---|---|
| Default project name | `nba_eng_prod` (from `tdx.json`) |
| Entry point | `nba_eng_launch` |
| Secrets | None |
| Schedule | `nba_eng_launch.dig` ships with a monthly schedule. Before the first push ask whether to keep it; for a test account remove the `schedule:` block so it does not run unattended |
| Sink database | Created by the first step of `nba_eng_launch.dig` (`+create_sink_database`, `td_ddl>`) if missing. Keep that step and the `td: database:` export above it — `td_ddl>` in the launch file fails with "Parameter 'database' is required" without it. If the project owner can't create databases, the user creates it in the TD Console before the first run |

Push and run with the shared pattern (`tdx wf push -y` from `<workdir>`, `tdx wf run nba_eng_prod.nba_eng_launch` after asking).

## 4. Validate

Run after every run (Phase 3 and Phase 4), as direct `tdx query` calls in one shell command (`tdx query … & tdx query … & wait`) — never through a script you write. Replace `<db>` with `sink_database`, `<id>` with `unique_user_id`, `<final>` with `final_nba_metrics_table`. Record the results in `project_state.md`.

**1. Final table populated and one row per profile**

```sql
SELECT COUNT(*) AS rows_, COUNT(DISTINCT <id>) AS profiles FROM <db>.<final>
```
Pass: `rows_ = profiles > 0` (one extra row means NULL IDs got through — tighten `custom_filter`), and `profiles` is close to the profiles with activity in the sources (compare with the Parent Segment size — a large gap means ID mismatches or over-tight filters).

**2. Picks are populated and meaningful**

```sql
SELECT next_best_time, next_best_channel, next_best_campaign, COUNT(*) AS n
FROM <db>.<final> GROUP BY 1, 2, 3 ORDER BY n DESC LIMIT 30
```
Pass: all four dayparts appear; `next_best_channel` shows real channel names, with `others` and NULL not the majority; more than one campaign type appears.

**3. Flags are not all 0 or all 1**

```sql
SELECT SUM(conversion_flag) AS converted, SUM(ad_engagement_flag) AS ad_engaged,
       SUM(recent_ad_engagement_flag) AS recent_ad, SUM(recent_purchase_flag) AS recent_purchase,
       SUM(cart_abandon_flag) AS cart_abandon, SUM(new_visitor_flag) AS new_visitor,
       SUM(no_ads_or_purchases_flag) AS no_ads_or_purchases, COUNT(*) AS profiles
FROM <db>.<final>
```
Pass: each flag is between 0 and `profiles` (exclusive) — except where the data truly has none (e.g. no paid channels). An all-0 recent/cart/new-visitor flag usually means stale data vs. the run date (§2).

**4. Paid-channel and add-to-cart rules match the data**

```sql
SELECT channel, COUNT(*) AS n FROM <db>.<src_union_table>_final GROUP BY 1 ORDER BY 2 DESC LIMIT 30;
SELECT event_type, COUNT(*) AS n FROM <db>.<src_union_table>_final GROUP BY 1 ORDER BY 2 DESC LIMIT 30;
```
Pass: every paid channel in the first result is listed in `ad_engagement_logic`; the add-to-cart event type is matched by `abandon_regexp`. Fix the config and re-run if not.

**5. Dashboard tables have this run**

```sql
SELECT session_id, COUNT(*) AS sources, MAX(profiles_scored) AS profiles_scored
FROM <db>.nba_dash_model_metrics GROUP BY 1 ORDER BY 1 DESC LIMIT 3;

SELECT source_table, num_events, unique_profiles, total_conversions, min_date, max_date
FROM <db>.nba_dash_source_tables
WHERE session_id = (SELECT MAX(session_id) FROM <db>.nba_dash_model_metrics)
ORDER BY num_events DESC;

SELECT COUNT(DISTINCT metric_name) AS metrics
FROM <db>.nba_dash_stats_summary
WHERE session_id = (SELECT MAX(session_id) FROM <db>.nba_dash_model_metrics);
```
Pass: the latest session has one `nba_dash_model_metrics` row per configured source; every source appears in `nba_dash_source_tables` with events > 0 and a plausible date range; conversions appear only on conversion sources; `nba_dash_stats_summary` has rows (pick and flag metrics).

### Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `Table not found` / `Column not found` in the union step | Wrong `src_table` or column name | `tdx describe` the source; fix the entry |
| A source missing from `nba_dash_source_tables` | 0 rows after `custom_filter` + time filter | Run the source's filter as a `COUNT(*)`; widen the window or filter |
| Most profiles `next_best_channel = others` | Low UTM coverage or `topk_values` too small | Check UTM coverage; raise `topk_values` |
| Recent / cart-abandon / new-visitor flags all 0 | Data older than the windows (counted from run date) or `abandon_regexp` doesn't match | §2 flag windows; validation check 4 |
| `new_visitor_flag` far too high | Paid channels missing from `ad_engagement_logic` | Validation check 4 |
| Final table much smaller than the Parent Segment | Different ID across sources or NULL IDs | Check `join_key` per source and NULL rates |
| Trino memory error | Window too long for the data volume | Shorten `lookback_period` (or the `range`) and re-run |
| Dayparts look shifted | Non-UTC customer with `day_breakdown` still on `time_hour` | §2 timezone rule |
