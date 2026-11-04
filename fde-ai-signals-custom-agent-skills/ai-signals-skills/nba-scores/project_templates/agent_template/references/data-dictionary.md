# NBA Engagement Scores — Data Dictionary

What each NBA score and flag means, and the schema of the three dashboard tables produced by `nba_dash_stats.dig` at the end of each NBA workflow run.

All tables live in `{{sink_database}}` (the `sink_database` in the workflow's `config/input_params.yml`).

> **Customer identifier portability:** These dashboard tables are run-level aggregates (`profile_count`, `unique_profiles`, and `profiles_scored`); they do not require an individual customer ID in dashboard SQL. If analysis expands to raw/profile-level data, resolve the configured `join_key` from `nba_dash_model_metrics` or run `DESCRIBE {{sink_database}}.<table>` first. Customer setups may use `td_consumer_id`, `cdp_profile_id`, `canonical_id`, `user_id`, or another configured identifier—never assume `canonical_id`.

---

## Metric Definitions — what each score and flag means

How each NBA output is derived and how to interpret it. Read before explaining any score, flag or run-to-run change.

### What the NBA Workflow Produces

For every unique profile in the customer's data, the workflow writes one row of NBA scores into `nba_combined_metrics_final`. The workflow is run periodically (usually monthly) and each run is identified by a `session_id`.

The NBA outputs span three groups:

* **Affinity scores** (sections 1–2) — multi-valued per-channel and per-daypart engagement scores.
* **Profile-level flags** (sections 3–8) — six boolean flags describing recency, engagement, and audience-segment membership. ALL six are produced by every run and ALL six matter when summarizing.
* **Per-event signal** (section 9) — `conversion_flag` from source data, surfaced both at the event level and aggregated up to a profile-level flag.

#### 1. Next Best Channel (NBC)

**Question it answers:** "Which marketing channel is this profile most likely to engage with?"

**How it's built:**
1. Every event in the unioned activity table is tagged with a `channel` (via UTM parsing on web data, hardcoded labels for email / sales-rep / order events, regex rules for known ad channels).
2. For each profile, count or aggregate activity per channel.
3. Apply the configured `scoring_logic` (`percentile`, `quartile`, or `minmax`) to convert raw counts into a comparable score per channel.

**Output columns** in the dashboard:
- `metric_name` like `next_best_channel_social`, `next_best_channel_email`, `next_best_channel_search`, `next_best_channel_paid_search`, etc.
- `metric_value` is the score / bucket. Format depends on `scoring_logic`:
  - `percentile` → numeric percentile (e.g. `"0.92"`)
  - `quartile` → bucket label (`"1"`, `"2"`, `"3"`, `"4"`)
  - `minmax` → 0-1 scaled value

#### 2. Next Best Time (NBT)

**Question it answers:** "What time of day is this profile most likely to engage?"

**How it's built:**
1. Every event timestamp is bucketed into one of four (configurable) dayparts based on `time_hour`:
   - `morning` (6 AM – 11:59 AM)
   - `afternoon` (12 PM – 5:59 PM)
   - `evening` (6 PM – 11:59 PM)
   - `overnight` (12 AM – 5:59 AM)
2. For each profile, count activity per daypart.
3. Apply the same `scoring_logic` as NBC.

**Output columns:** `metric_name` like `next_best_time_morning`, `next_best_time_evening`, etc.

**Timezone alignment:** The workflow shifts UTC timestamps by `timeshift_hours` (added or subtracted via `timeshift_change`) before bucketing. This matters when interpreting scores — "evening" means evening **in the customer's marketing timezone**, not UTC.

#### 3. Cart Abandon Flag

**Question it answers:** "Did this profile add something to cart in the last N days without purchasing?"

**How it's built:**
- Look in the unioned activity table for events matching `abandon_regexp` (default: `event_type` containing both `'add'` and `'cart'`).
- Track each profile's `last_cart_add_date` (most recent add-to-cart event) and `last_purchase_date`.
- Flag = `1` if `last_cart_add_date > last_purchase_date` AND `last_cart_add_date` is within `event_lookback` days. Otherwise `0`.

**Output column:** `metric_name = 'cart_abandon_flag'`, `metric_value` is `'0'` or `'1'`.

**Common tuning:** If the customer's add-to-cart event is named differently (e.g., `basket_add`, `cart_item_added`), update `abandon_regexp` and `abandon_regexp_string` in `next_best_campaign`. If `event_lookback` is too long, you'll over-flag people who eventually converted weeks later; too short and you'll under-flag genuine abandonment.

#### 4. New Visitor Flag

**Question it answers:** "Is this a recently-acquired profile that we haven't engaged with yet?"

**How it's built:** All three conditions must be true:
1. `ad_engagement_flag = 0` — has never engaged on a paid/ad channel matching `ad_engagement_logic`
2. `conversion_flag = 0` — has never converted
3. First visit ≤ `new_customers_days` ago

**Output column:** `metric_name = 'new_visitor_flag'`, `metric_value` is `'0'` or `'1'`.

**Why these conditions?** This isn't just "first-time visitor" — it specifically targets organic, low-engagement, unconverted profiles. Useful for "welcome series" campaigns where you don't want to spam someone who arrived via ad clicks (already heavily targeted) or already-converted profiles.

#### 5. Ad Engagement Flag

**Question it answers:** "Has this profile ever engaged with paid/ad channels in the data window?"

**How it's built:** `MAX(IF(channel IN <ad_engagement_logic>, 1, 0))` per profile across all events. The `ad_engagement_logic` config defaults to `channel IN ('paid search', 'tiktok', 'web ads', 'dsp_rtb', 'maddict', 'call center', 'others', 'display')`.

**Output column:** `metric_name = 'ad_engagement_flag'`, `metric_value` is `'0'` or `'1'`.

**Marketing meaning:** Lifetime indicator. Use to separate ad-responsive audiences from organic-only audiences. Combined with `new_visitor_flag` to identify cold leads.

#### 6. Recent Ad Engagement Flag

**Question it answers:** "Has this profile engaged with paid/ad channels recently?"

**How it's built:** Tracks each profile's `last_ad_engagement_date` (most recent event on a channel matching `ad_engagement_logic`). Flag = `1` if `last_ad_engagement_date` is within `event_lookback` days. Otherwise `0`.

**Output column:** `metric_name = 'recent_ad_engagement_flag'`, `metric_value` is `'0'` or `'1'`.

**Marketing meaning:** Action-ready signal. Profiles flagged here are warm — already responding to ads in the recency window, ideal for retargetting. The difference between `ad_engagement_flag` (lifetime) and `recent_ad_engagement_flag` (recency) tells you who's actively responsive vs. who's gone cold.

#### 7. Recent Purchase Flag

**Question it answers:** "Has this profile converted recently?"

**How it's built:** Tracks each profile's `last_purchase_date` (most recent event matching `conversion_logic`). Flag = `1` if `last_purchase_date` is within `event_lookback` days. Otherwise `0`.

**Output column:** `metric_name = 'recent_purchase_flag'`, `metric_value` is `'0'` or `'1'`.

**Marketing meaning:** Suppression / upsell signal. Profiles flagged here just converted — exclude from acquisition campaigns, target with cross-sell or post-purchase nurture. Distinct from `conversion_flag` which captures *any* conversion in the data window (lifetime), not just recent.

#### 8. No Ads or Purchases Flag

**Question it answers:** "Has this profile never engaged with paid channels and never converted?"

**How it's built:** `IF(ad_engagement_flag = 0 AND conversion_flag = 0, 1, 0)` per profile.

**Output column:** `metric_name = 'no_ads_or_purchases_flag'`, `metric_value` is `'0'` or `'1'`.

**Marketing meaning:** The "cold" or "dormant" audience. Different from `new_visitor_flag` (which adds a recency requirement) — these profiles may have been around a long time but never engaged with ads or converted. Candidates for re-activation campaigns, organic-channel nurture, or audience cleanup.

#### 9. Conversion Flag (per-event signal AND profile-level flag)

**Question it answers:** "Did this profile complete a defined conversion event in the data window?"

**How it's built:** During the union step, every source-table row gets tagged with a `conversion_flag`:
- Pageviews: `IF(REGEXP_LIKE(td_path, 'thank|download|order-received'), 1.0, 0.0)` (or whatever pattern was configured)
- Email events: `0.0`
- Sales-rep interactions: `0.0`
- Orders: `1.0` (filtered to valid statuses)

Per-profile, the dashboard's `converted_users` column counts how many profiles have at least one row with `conversion_flag > 0` in the relevant filter.

---

### How `scoring_logic` Affects Interpretation

| Strategy | Score format | "Top engagement" means | Best for |
|----------|--------------|------------------------|----------|
| `percentile` | Continuous 0-1 | Score ≥ `0.75` (top quartile by percentile rank) | Smooth distribution, granular targeting |
| `quartile` | Discrete `1`-`4` | `metric_value = '4'` | Marketers who want simple "top quartile only" segments |
| `minmax` | Continuous 0-1 (Hivemall scaled) | Score ≥ `0.75` | Heavily skewed activity distributions where a few power users dominate |

When summarizing distributions, ALWAYS check which `scoring_logic` was used (from `nba_dash_model_metrics`) before interpreting `metric_value` — `'4'` in quartile mode is the top engagement bucket; `'4'` in percentile mode would be a parsing error.

---

### How Run Config Drives What You See

The `nba_dash_model_metrics` table snapshots every config knob used for a given run. The most consequential ones for interpreting the dashboard:

| Config knob | What changes if you tune it |
|-------------|----------------------------|
| `scoring_logic` | Whole shape of distribution changes (continuous vs bucketed) |
| `time_filter_type` + `lookback_period` / date range | Which events feed the score — shorter window → fresher but noisier |
| `event_lookback_days` | Cart-abandon flag rate (longer = higher rate) |
| `new_customers_days` | New-visitor flag rate (longer window = higher rate) |
| `ad_engagement_logic` | What channels disqualify a profile from being "new" |
| `abandon_regexp` | Which events count as add-to-cart for cart-abandon |
| `topk_values` | How many distinct channels keep their name vs collapse to `'others'` |

**Practical rule:** When the user notices a metric changed run-over-run, ALWAYS pull the corresponding config column from both runs before attributing the change to real audience behavior. Most "weird" run-to-run changes are config changes.

---

### What This Workflow Does NOT Do

Be explicit when the user asks something the dashboard tables can't answer:

- **No revenue forecasting** — `total_spend` exists in `nba_dash_source_tables`, but it's a description of source-data volume, not a predicted ROI. Never project ROI from NBA scores.
- **No multi-touch attribution** — NBA scores measure per-profile affinity, not channel contribution to conversions. For attribution, route to MTA.
- **No per-event detail** — the dashboard tables are aggregated. To see individual events, query the source tables directly.
- **No real-time scoring** — scores come from the most recent batch run. `nba_combined_metrics_final` is only as fresh as the last `nba_eng_launch.dig` execution.
- **No causal inference** — high engagement on a channel doesn't mean engagement was caused by that channel. Profiles get a "Next Best Channel: social" tag because they engage most there, not because social drives them to convert.

If a question requires any of the above, say what the table can show vs what's actually being asked, and recommend the alternative skill or analysis path.

---

## Table 1: `nba_dash_stats_summary` — score / flag distributions per run

**Grain:** one row per `(session_id, metric_name, metric_value)`.

Use when the user asks about **distribution of scores** or **how many users fall into each bucket**.

| Column | Type | Description |
|--------|------|-------------|
| `session_id` | bigint | Identifier of the workflow run. Larger = more recent. |
| `metric_name` | varchar | Which NBA metric column this row describes. Three groups of values appear:<br>• **Affinity scores** — `next_best_channel_<channel>`, `next_best_time_<daypart>` (one row per channel or daypart per profile bucket).<br>• **Profile-level flags** — `conversion_flag`, `ad_engagement_flag`, `recent_ad_engagement_flag`, `recent_purchase_flag`, `cart_abandon_flag`, `new_visitor_flag`, `no_ads_or_purchases_flag`. All seven are emitted every run.<br>• **Pick fields** — `next_best_channel`, `next_best_time`, `next_best_campaign` (single best-pick label per profile). |
| `metric_value` | varchar | The score/flag value, as a string. For `quartile` scoring → `"1"`..`"4"`. For `percentile` / `minmax` → numeric string. For boolean flags → `"0"` / `"1"`. |
| `profile_count` | bigint | Number of unique profiles at that `metric_value` |
| `converted_users` | bigint | How many of those profiles had at least one conversion event in the data window |
| `time` | bigint | Run timestamp (UNIX). Convert to readable form with `TD_TIME_FORMAT(time, 'yyyy-MM-dd HH:mm', 'UTC')` |

### Common SQL patterns

**List metrics available in the latest run:**
```sql
SELECT DISTINCT metric_name FROM nba_dash_stats_summary
WHERE session_id = (SELECT MAX(session_id) FROM nba_dash_model_metrics)
ORDER BY 1
```

**Distribution of a specific metric with conversion rate:**
```sql
SELECT metric_value, profile_count, converted_users,
       ROUND(IF(profile_count > 0, 1.0 * converted_users / profile_count, 0), 4) AS conversion_rate
FROM nba_dash_stats_summary
WHERE session_id = (SELECT MAX(session_id) FROM nba_dash_model_metrics)
  AND metric_name = '<metric>'
ORDER BY TRY_CAST(metric_value AS DOUBLE)
```

**Cart-abandon / new-visitor / engagement / recent-purchase / dormant flag rates (all 7 flags):**
```sql
SELECT metric_name, metric_value, profile_count
FROM nba_dash_stats_summary
WHERE session_id = (SELECT MAX(session_id) FROM nba_dash_model_metrics)
  AND metric_name IN (
    'conversion_flag',
    'ad_engagement_flag',
    'recent_ad_engagement_flag',
    'recent_purchase_flag',
    'cart_abandon_flag',
    'new_visitor_flag',
    'no_ads_or_purchases_flag'
  )
ORDER BY metric_name, metric_value
```
Always pull all 7 — they describe non-overlapping audience segments and skipping any of them gives marketers an incomplete picture of the run.

---

## Table 2: `nba_dash_model_metrics` — run config snapshot

**Grain:** one row per run.

Use when the user asks **"how was the model configured?"**, **"what lookback was used?"**, **"what's the cart-abandon rule?"**, or wants to compare config across runs.

### Run-level columns

| Column | Description |
|--------|-------------|
| `session_id` | Run identifier |
| `profiles_scored` | Total distinct profiles that received at least one NBA score in this run |
| `cart_abandon_logic` | Exact regex/SQL used for cart-abandon detection (`abandon_regexp` from config) |
| `conversion_logic` | Exact rule for what counted as a conversion (`conversion_flag > 0` by default) |
| `ad_engagement_logic` | Channels that disqualify a profile from being "new" |
| `event_lookback_days` | Cart-abandon lookback window |
| `new_customers_days` | Max age of first visit for new-visitor flag |
| `time_filter_type` | `range` or `interval` |
| `time_range_start_date` / `time_range_end_date` | Used when `time_filter_type = 'range'` |
| `lookback_period` | Used when `time_filter_type = 'interval'` (e.g., `-180d`) |
| `time` | Run timestamp (UNIX) |

### Per-source columns (one set per source table in the run's config)

| Column | Description |
|--------|-------------|
| `src_table` | Full `database.table` of source |
| `event_name` | Short identifier (e.g., `pageviews`, `email_events`, `order_events`) |
| `event_type` | The `event_type` SQL expression used |
| `url_col` / `referral_col` | URL and referrer column names (or `NULL` for non-web sources) |
| `medium_col` / `source_col` / `campaign_col` | Channel-extraction expressions per source |
| `join_key` | Configured profile ID column; resolve its actual name from the run/config or source schema (do not assume `canonical_id`) |
| `conversion_flag` | Conversion flag expression for that source |
| `item_price` | Revenue column or constant |
| `custom_filter` | The SQL WHERE clause applied to that source |

### Common SQL patterns

**Snapshot of current config:**
```sql
SELECT * FROM nba_dash_model_metrics
WHERE session_id = (SELECT MAX(session_id) FROM nba_dash_model_metrics)
```

**Compare last two runs' config:**
```sql
SELECT session_id, event_lookback_days, new_customers_days, time_filter_type,
       lookback_period, profiles_scored
FROM nba_dash_model_metrics
ORDER BY session_id DESC
LIMIT 2
```

**Quote back a specific rule:**
```sql
SELECT cart_abandon_logic, ad_engagement_logic, conversion_logic
FROM nba_dash_model_metrics
WHERE session_id = (SELECT MAX(session_id) FROM nba_dash_model_metrics)
```

---

## Table 3: `nba_dash_source_tables` — per-source data volumes per run

**Grain:** one row per `(session_id, source_table)`.

Use when the user asks **"which source contributed the most?"**, **"how much data went into the latest run?"**, or **"what time range does this cover?"**.

| Column | Type | Description |
|--------|------|-------------|
| `session_id` | bigint | Run identifier |
| `source_table` | varchar | e.g., `enriched_pageviews`, `enriched_email_events`, `sales_rep_interactions`, `enriched_orders` |
| `unique_profiles` | bigint | `APPROX_DISTINCT` profiles seen in that source for this run |
| `num_events` | bigint | Total event/row count |
| `total_conversions` | bigint | `SUM(conversion_flag)` for that source |
| `total_spend` | double | `SUM(item_price)` — describes source-data volume only, NOT a predicted ROI |
| `day_range` | varchar | Human-readable date range (e.g. `"2024-01-01 to 2024-06-30"`) |
| `min_date` | varchar | Earliest event date |
| `max_date` | varchar | Latest event date |
| `time` | bigint | Run timestamp (UNIX) |

### Common SQL patterns

**Top sources by event volume in latest run:**
```sql
SELECT source_table, num_events, unique_profiles, total_conversions
FROM nba_dash_source_tables
WHERE session_id = (SELECT MAX(session_id) FROM nba_dash_model_metrics)
ORDER BY num_events DESC
```

**Date coverage of latest run:**
```sql
SELECT source_table, day_range, min_date, max_date
FROM nba_dash_source_tables
WHERE session_id = (SELECT MAX(session_id) FROM nba_dash_model_metrics)
```

**Source contribution change run-over-run:**
```sql
SELECT session_id, source_table, num_events
FROM nba_dash_source_tables
WHERE session_id IN (
  SELECT session_id FROM nba_dash_model_metrics ORDER BY session_id DESC LIMIT 3
)
ORDER BY session_id DESC, num_events DESC
```

---

## Cross-Table Patterns

### Full latest-run summary

Three queries in this order:
1. **Config:** `SELECT * FROM nba_dash_model_metrics WHERE session_id = <latest>`
2. **Volume:** `SELECT source_table, num_events, unique_profiles, total_conversions FROM nba_dash_source_tables WHERE session_id = <latest> ORDER BY num_events DESC`
3. **Distribution highlights:** `SELECT metric_name, metric_value, profile_count, converted_users FROM nba_dash_stats_summary WHERE session_id = <latest> AND metric_name IN ('cart_abandon_flag', 'new_visitor_flag') ORDER BY metric_name, metric_value`

### Run-over-run drift detection

For ANY metric change the user notices, always fetch the corresponding config columns alongside:
```sql
WITH latest_two AS (
  SELECT session_id FROM nba_dash_model_metrics ORDER BY session_id DESC LIMIT 2
)
SELECT m.session_id, m.metric_name, m.metric_value, m.profile_count,
       c.event_lookback_days, c.new_customers_days, c.lookback_period
FROM nba_dash_stats_summary m
JOIN nba_dash_model_metrics c ON m.session_id = c.session_id
WHERE m.session_id IN (SELECT session_id FROM latest_two)
  AND m.metric_name = '<metric_of_interest>'
ORDER BY m.session_id DESC, m.metric_value
```

This way you can attribute the change to either real audience drift or a config change.

---

## Data Quality Notes

- **`metric_value` is VARCHAR** — always `TRY_CAST` to numeric if you need to sort or aggregate numerically. Different `scoring_logic` settings produce different value formats.
- **`session_id` ordering** — larger numbers are more recent runs, but always confirm with `MAX(session_id)` rather than assuming a specific value.
- **`time` is UNIX bigint** — show with `TD_TIME_FORMAT(time, 'yyyy-MM-dd HH:mm', 'UTC')`. The customer's marketing timezone may differ — the workflow's `timeshift_hours` offset (in the workflow config, not in any output table) shifts the dashboard dates, while dayparts use UTC hours.
- **`total_spend` is descriptive, not predictive** — it's a `SUM(item_price)` from the source data. Do NOT project ROI or revenue forecasts from it.
- **Missing metrics** — if a metric_name you expect is absent from `nba_dash_stats_summary` for the latest session, check whether the metric was disabled in config or whether `topk_values` collapsed it into `'others'`.
