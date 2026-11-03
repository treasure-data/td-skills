# MTA Data Dictionary

All tables are in `{{sink_database}}`. Read the description of the tables and columns before doing any analysis.

---

## Table 1: journey_src_union_summary
**Purpose:** Source metadata - event/channel distributions, filtering logic, date ranges.

| Column Name | Data Type | Description |
|------------|-----------|-------------|
| `src_table` | varchar | Original source table name |
| `events_list` | varchar | JSON string of event types with counts |
| `channel_list` | varchar | JSON string of channels with counts |
| `source_list` | varchar | JSON string of traffic sources with counts |
| `campaign_list` | varchar | JSON string of campaigns with counts |
| `utm_mailing_list` | varchar | JSON string of UTM mailing parameters with counts |
| `context_list` | varchar | JSON string of context values with counts |
| `total_profiles` | bigint | Count of unique customer profiles |
| `total_events` | bigint | Total event count |
| `conversion_events` | double | Count of conversion events |
| `min_date` | varchar | Earliest event date in source |
| `max_date` | varchar | Latest event date in source |
| `table_description` | varchar | Human-readable description of table contents |
| `final_where_clause` | varchar | SQL WHERE clause used to filter source data |
---

## TABLE 2: mta_sankey_journeys
**Purpose**: Pre-aggregated journey flows for path analysis and Sankey visualizations. Every path terminates at a `conversion` or `churn` node — use this table (NOT `mta_markov_transition_final`) for all Sankey diagrams.

**Key Columns:**

| Column | Description |
|--------|-------------|
| `target` | Journey outcome: `'conversion'` or `'churn'` |
| `conversion_month` | Month of conversion — rows are split per month, so always SUM(conversions) when aggregating |
| `from_step` | Origin node in format `"N-channel"` where N is the 1-indexed position in the journey (e.g. `"1-organic"`, `"2-crm"`) |
| `to_step` | Destination node in same format, or `"N-conversion"` / `"N-churn"` when the path ends (e.g. `"2-conversion"`, `"3-conversion"`) |
| `conversions` | Number of journeys following this edge in this conversion_month — **must be summed across months** |
| `total_events` | Total events for these journeys |
| `avg_journey_length` | Average total touchpoints in these journeys |
| `conv_perc` | Conversion rate for journeys following this path |
| `rnk` | Rank of the **complete journey pattern** by volume. All rows sharing the same `rnk` are edges of one single path |

**Critical: How `rnk` works — tracing a complete path**

Each `rnk` value = one complete journey pattern. All edges of that pattern share the same `rnk`. To reconstruct a path, collect all rows for a given `rnk` in step order:

```
rnk=4: "1-non-brand sem" → "2-organic"      (edge 1 of this pattern)
rnk=4: "2-organic"       → "3-conversion"   (edge 2 of this pattern — terminates at conversion)
```

This means the same channel label (e.g. `"2-organic"`) appears as both a `to_step` in one row and a `from_step` in the next — that is what creates the connected multi-step flow.

**Critical: Duplicate rows per month**

The table stores one row per `(rnk, from_step, to_step, conversion_month)`. When building a Sankey, always aggregate:
```sql
SELECT from_step, to_step, SUM(conversions) AS flow
FROM mta_sankey_journeys
WHERE target = 'conversion' AND rnk <= 10
GROUP BY from_step, to_step
ORDER BY SUM(conversions) DESC
```

**Critical: Sankey node naming — preserve the `N-` prefix**

Always use `from_step` and `to_step` values as-is (e.g. `"1-organic"`, `"2-conversion"`) as Sankey node names. Do NOT strip the numeric prefix. This preserves journey position so the same channel at different steps (e.g. `"2-organic"` vs `"3-organic"`) renders as distinct nodes in the flow.

**Usage:** Filter `target='conversion' AND rnk <= 10` for top 10 conversion paths. The `to_step` always ends in `N-conversion` — every path visibly terminates at the conversion event.

---

## Table 3: mta_journeys
**Purpose:** Event-level journey data with touchpoints, sessions and journey context (plus customer attributes when enrichment is on).

| Column Name | Data Type | Description |
|------------|-----------|-------------|
| `date_time` | varchar | Timestamp of event |
| `event_date` | varchar | Date of event |
| `conversion_month` | varchar | Month in which conversion occurred |
| `day_of_week` | varchar | Day name |
| `{{customer_id_col}}` | varchar | Customer identifier (`unique_user_id` of the deployed workflow) |
| `url` | varchar | Page URL visited |
| `referral_domain` | varchar | Referring domain |
| `event_type` | varchar | Type of event |
| `events_num` | bigint | Number of events in this record |
| `context_col` | varchar | Context column name used |
| `event_context` | varchar | Actual context value |
| `channel` | varchar | Marketing channel |
| `source` | varchar | Traffic source |
| `campaign` | varchar | Campaign identifier |
| `conversion_journey_id` | varchar | Unique conversion journey ID |
| `conversion_flag` | double | 1.0 if conversion event, 0.0 otherwise |
| `journey_length` | bigint | Total touchpoints in conversion journey |
| `journey_index` | bigint | Position of this event in journey (1-indexed) |
| `journey_touchpoints_total` | bigint | Total touchpoints across journey |
| `conversion_value_total_sales` | double | |
| `touchpoint_histogram` | varchar | Distribution of touchpoints by channel |
| `sess_rank_asc` | bigint | Session rank ascending (first = 1) |
| `top_channels` | array(varchar) | Array of channels used in journey |
| `channel_list_final` | varchar | Deduplicated channel sequence, where a multi-channel journey will have the distinct channel values separated by '>' |
| `journey_history` | varchar | Full journey path with timestamps |
| `journey_duration_mins` | bigint | Journey duration in minutes |
| `journey_duration_days` | bigint | Journey duration in days |
| *customer attributes* | | Only when the workflow runs with `add_customer_analysis: 'yes'`: the `attributes_list` columns (e.g. `recency`, `frequency`, `monetary_value`, `rfm_segment` from an RFM table). Check with `DESCRIBE mta_journeys` before using them |

**Key Columns:**
- `conversion_flag` - 1.0 on the touchpoint that is the conversion event
- 'conversion_journey_id' - Unique journey ID, so use APPROX_DISTINCT(conversion_journey_id) when counting how many journeys meet a criteria in a GROUP BY analysis
- `channel_list_final` - If a distinct journey_id contains multiple channel touchpoints, they will be separated by '>' in order of occurrence. Single channel journeys meet criteria "WHERE NOT REGEXP_LIKE(channel_list_final, '>') ".
- 'conversion_value' - when >0 THEN this means this is a converted journey, but do NOT sum this to get count of converted journeys, instead you should do "APPROX_DISTINCT(conversion_journey_id) WHERE conversion_value > 0"

**Usage:** When trying to answer journey related questions to find patterns of channels that appear in converted vs. non converted journeys etc.

---

## Table 4: mta_models_standard
**Purpose:** Rule-based attribution models (first-touch, last-touch, linear, U-shaped) by channel/source/campaign.

| Column Name | Data Type | Description |
|------------|-----------|-------------|
| `attribution_type` | varchar | Attribution model used |
| `conversion_month` | varchar | Month in which conversion occurred |
| `channel` | varchar | Marketing channel receiving attribution |
| `source` | varchar | Traffic source |
| `campaign` | varchar | Campaign identifier |
| `total_conversions` | double | Number of conversions attributed |
| `total_sales` | double | Revenue attributed |

---

## Table 5: mta_markov_attribution_final (Markov Chain Attribution)
**Purpose:** Algorithmic attribution using Markov chains. Measures each channel's incremental impact via removal effect (0-1 scale).

| Column Name | Data Type | Description |
|------------|-----------|-------------|
| `run_time` | varchar | timestamp when model was ran|
| `channels` | varchar | Marketing channel |
| `attribution_markov_algorithmic` | double | Conversions credited to the channel; the column sums to the number of converting journeys, not to 100% |
| `removal_effect` | double | Removal effect, 0–1. Non-converting journeys carry no weight, so in practice it is the share of converting paths that pass through the channel — not a measured drop in conversion rate |

**Usage:** High removal_effect (>0.20) indicates critical channels; use for budget prioritization. Channels seen only in non-converting journeys appear with 0 credit and 0 removal effect — expected. Use MAX(run_time) to fetch the latest metrics.

---

## Table 6: mta_shapley_attribution_final (Shapley Value Attribution)
**Purpose:** Game theory-based fair credit distribution using Shapley values. Evaluates all channel combinations and marginal contributions.

| Column Name | Data Type | Description |
|------------|-----------|-------------|
| `run_time` | varchar | timestamp when model was ran|
| `step` | bigint | Lookback size of the model: `0` = whole journey, `N` = only the last N unique channels before the conversion (one result set per step, 0 to `shapley_lookback_window`) |
| `channels` | varchar | Marketing channel |
| `value` | double | Shapley value (credited conversions) |
| `percentage` | double | Share of the credit within the same `step` (sums to 1 per step and run) |

**Usage:** Always filter one `step` — `step = 0` for the whole-journey view that compares with Markov and the standard models; small steps (1–3) show which channels matter most just before conversion. Never sum across steps. Use MAX(run_time) to fetch the latest metrics.
---

## Table 7: mta_journey_stats_yearly (Journey Stats Summary by Year)
**Purpose:** Provide summary of important journey stats broken by year
**Usage:** Validate high-level statistics for the mta_journeys table aggregated at the yearly level
---

## Table 8: mta_markov_transition_final (Markov Transition Matrix)
**Purpose:** Channel-to-channel transition probabilities from the Markov model, one row per `channels` → `to_channel` pair and run. Only channels with a removal effect above `removal_effect_limit` are kept.

| Column Name | Data Type | Description |
|------------|-----------|-------------|
| `run_time` | varchar | Timestamp when the model ran |
| `channels` | varchar | From channel (or `(start)`) |
| `to_channel` | varchar | To channel |
| `trans_prob` | double | Probability of moving from `channels` to `to_channel` |
| `_conversion_` | double | Probability of converting directly after `channels` |

**Usage:** Channel sequencing and which channels hand over to which. Use MAX(run_time) for the latest run. Not for Sankey charts — use `mta_sankey_journeys`.

---

## Table 9: mta_top_conversion_journeys
**Purpose:** Most frequent journey patterns, split by `target` (`conversion` / `churn`) and `conversion_month`.

| Column Name | Data Type | Description |
|------------|-----------|-------------|
| `target` | varchar | `conversion` (converted journey) or `churn` (no conversion) |
| `conversion_month` | varchar | Month of the journey's conversion |
| `journey_steps` | varchar | Channel sequence, steps separated by ` > ` |
| `conversions` | bigint | Journeys following this pattern |
| `total_events` | bigint | Touchpoints in these journeys |
| `avg_journey_length`, `median_journey_length` | double | Steps per journey |
| `avg_journey_duration_days`, `median_journey_duration_days`, `avg_journey_duration_mins` | double | Time from first touch to the end of the journey |

---

## Table 10: mta_journeys_validate and mta_channel_parsing_validate
**Purpose:** Channel-level validation. `mta_journeys_validate` has one row per channel: `total_events`, `perc_of_total_events`, `total_conversions`, `perc_of_total_conv`, `total_revenue`, `perc_of_total_revenue`, `distinct_journeys`, `converted_journeys`, `source_list`, `campaign_list`. `mta_channel_parsing_validate` shows which source and campaign values were parsed into each channel.

**Usage:** Channel parsing questions and data validation only.

---

## Table 11: mta_table_params
**Purpose:** The deployed source configuration as a table — one row per source: `src_table`, `table_description`, `event_name`, `conversion_flag`, `final_where_clause`, time filter settings and the channel expressions.

**Usage:** "How is a conversion defined?", "which filters are applied?" — the config that actually ran.

---


## Cross-Table Analysis Patterns

### Attribution Model Comparison
Combine mta_models_standard, mta_markov_attribution_final and mta_shapley_attribution_final (latest `run_time`) to see how credit allocation changes across methodologies.

### Historic Trends Analysis
- GROUP BY 'conversion_month' when asked to show historic trends of channel performance
- For Markov and Shapley tables use MAX(run_time) to show the latest metric, and when asked to show how attribution % change across historic runs use `run_time' timestamp column to show changing trends in attribution % over time

---

## Data Quality Notes

**Characteristics:** Channel naming uses lowercase with underscores (e.g. `paid_search_google`); percentages stored as decimals (0.25 = 25%); some channels may not appear in all models if insufficient data.

**Edge Cases:** Customer-specific caveats (offline tracking, cross-device journeys, channel naming) are in `business-context.md`.
