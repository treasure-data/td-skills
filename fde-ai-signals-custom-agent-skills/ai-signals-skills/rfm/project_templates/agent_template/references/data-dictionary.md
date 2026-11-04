# Data Dictionary Guide

## Read description of available tables/columns before doing any analysis

All tables are in `{{sink_database}}`.

---

## Table 1: rfm_output_table
**Purpose:** Per-profile RFM scores and segment assignments. This is the primary output table.

| Column Name | Data Type | Description |
|------------|-----------|-------------|
| `<customer_id_col>` (e.g., `td_consumer_id`, `td_canonical_id`, `canonical_id`) | varchar | Unique customer identifier; exact column is set by the workflow's configured join key and must be confirmed with `DESCRIBE` |
| `recency` | bigint | Days since last activity (lower = more recent) |
| `frequency` | bigint | Total interaction count across all sources |
| `monetary_value` | double | Total order/purchase value (capped at 0 minimum) |
| `r_quartile` | integer | Recency quartile score (1-4, where 4 = most recent) |
| `f_quartile` | integer | Frequency quartile score (1-4, where 4 = most frequent) |
| `m_quartile` | integer | Monetary quartile score (1-4, where 4 = highest spend) |
| `rfm_quartile` | varchar | Combined quartile label — e.g., `R4F3M2` |
| `rfm_score` | double | Average of r_quartile + f_quartile + m_quartile divided by 3 |
| `rfm_segment` | varchar | Segment label (e.g., Champions, Loyal Customers, Lost customers) |

**Key Columns:**
- `r_quartile`, `f_quartile`, `m_quartile` — use for segment analysis, score distribution, and customer ranking. Scored 1-4 using percentile-based quartile binning (25th, 50th, 75th percentiles)
- `rfm_quartile` — string combining all three scores, e.g., `R4F3M2`. Use for granular segment identification
- `rfm_segment` — use for segment-level aggregations and comparisons
- `recency`, `frequency`, `monetary_value` — raw values for detailed analysis
- `<customer_id_col>` — unique customer identifier; use `COUNT(DISTINCT <customer_id_col>)` for customer counts after resolving the actual column with `DESCRIBE`

**Scoring logic (AI Signals RFM model):**
- Recency: lower recency_days → higher r_quartile (reverse scale)
- Frequency: higher touchpoints → higher f_quartile
- Monetary: higher spend → higher m_quartile. All profiles count unless `mv_threshold` is set (default none); with it, profiles at or below the threshold are left out of the cut-offs and get M1 — check the deployed `rfm_ai_signals.dig`

**Usage:** Primary table for all segmentation analysis. Join with other customer tables using the resolved `<customer_id_col>` column.

> **Identifier portability:** The placeholder is intentional. Customer workflows may emit `td_consumer_id`, `td_canonical_id`, `canonical_id`, `customer_id`, or another configured join key. Run `DESCRIBE {{sink_database}}.rfm_output_table` (or `rfm_combined_user_events`) before writing profile-level SQL; never copy `canonical_id` blindly from this reference.

---

## Table 2: rfm_stats
**Purpose:** Per-segment statistical summary with quartile distributions for each RFM dimension.

| Column Name | Data Type | Description |
|------------|-----------|-------------|
| `session_id` | bigint | Workflow run session identifier |
| `rfm_segment` | varchar | Segment name (includes an `ALL` row for overall stats) |
| `segment_size` | bigint | Number of profiles in this segment |
| `population_percent` | double | Percentage of total profiles in this segment |
| `quartile_list` | varchar | Comma-separated list of distinct rfm_quartile values in this segment |
| `min_rfm` | double | Minimum rfm_score in segment |
| `q1_rfm` | double | 25th percentile rfm_score |
| `median_rfm` | double | Median rfm_score |
| `avg_rfm` | double | Average rfm_score |
| `q3_rfm` | double | 75th percentile rfm_score |
| `max_rfm` | double | Maximum rfm_score |
| `min_recency` | double | Minimum recency (days) |
| `q1_recency` | double | 25th percentile recency |
| `avg_recency` | double | Average recency |
| `q3_recency` | double | 75th percentile recency |
| `max_recency` | bigint | Maximum recency |
| `min_frequency` | double | Minimum frequency |
| `q1_frequency` | double | 25th percentile frequency |
| `avg_frequency` | double | Average frequency |
| `q3_frequency` | double | 75th percentile frequency |
| `max_frequency` | double | Maximum frequency |
| `min_monetary` | double | Minimum monetary value |
| `q1_monetary` | double | 25th percentile monetary |
| `avg_monetary` | double | Average monetary |
| `q3_monetary` | double | 75th percentile monetary |
| `max_monetary` | double | Maximum monetary |
| `corr_rfm_monetary` | double | Correlation between rfm_score and monetary_value |
| `min_date` | varchar | Earliest event date in segment |
| `max_date` | varchar | Most recent event date in segment |

**Usage:** Use for segment comparison, distribution analysis, and data quality validation. The `ALL` row provides overall population stats. Filter by `rfm_segment` to compare specific segments.

---

## Table 3: rfm_stats_histogram
**Purpose:** Histogram bin distributions for each RFM metric, per segment.

| Column Name | Data Type | Description |
|------------|-----------|-------------|
| `session_id` | bigint | Workflow run session identifier |
| `rfm_segment` | varchar | Segment name (includes `ALL` for overall) |
| `metric_name` | varchar | Metric: `recency`, `frequency`, or `monetary` |
| `bin_order` | bigint | Bin position (1 to num_bins) |
| `bin_label` | varchar | Bin label — e.g., `B1`, `B2`, `B3` |
| `bin_value` | double | Upper bound value for this bin |
| `profile_cnt` | double | Number of profiles in this bin |

**Usage:** Use to visualize score distributions as histograms. Filter by `rfm_segment = 'ALL'` for overall distribution, or by specific segments to compare shapes.

---

## Table 4: rfm_stats_model_params
**Purpose:** Per-source-table run metadata capturing data quality stats for each workflow execution.

| Column Name | Data Type | Description |
|------------|-----------|-------------|
| `run_time` | varchar | Timestamp of workflow execution |
| `session_id` | bigint | Workflow run session identifier |
| `model_type` | varchar | Scoring model used (always `ai_signals`) |
| `source_table` | varchar | Source table name from `aggregate_metrics_tables` |
| `time_filter` | varchar | Whether time filter was applied (`yes` / `no`) |
| `lookback_days` | varchar | Effective lookback period |
| `total_touchpoints` | bigint | Total events from this source |
| `oldest_touchpoint` | bigint | Oldest event in days |
| `most_recent_touchpoint` | bigint | Most recent event in days |
| `total_spend` | double | Total monetary value from this source |
| `min_date` | varchar | Earliest event date |
| `max_date` | varchar | Latest event date |

**Usage:** Use to validate data quality per source, compare run-over-run stats, and verify that all sources contributed data.

---

## Table 5: rfm_combined_user_events
**Purpose:** Union activity table combining all behavioral data sources. Each row is one profile's aggregated activity from one source table.

| Column Name | Data Type | Description |
|------------|-----------|-------------|
| `<customer_id_col>` | varchar | Unique customer identifier |
| `time` | bigint | Most recent event unix timestamp for this profile in this source |
| `latest_tstamp` | varchar | String representation of the most recent timestamp |
| `source` | varchar | Name of the source (from `name` field in `aggregate_metrics_tables`) |
| `total_touchpoints` | bigint | Total event count for this profile in this source |
| `total_spend` | double | Total order amount for this profile in this source |
| `recency_days` | bigint | Days since most recent event in this source |
| `events_list` | varchar | JSON-style map of the 10 most frequent `context_col` values for this profile in this source |

**Usage:** Use for validating source data, checking event distributions, and verifying the union logic.

```sql
SELECT source,
       COUNT(*) as total_profiles,
       SUM(total_touchpoints) as total_events,
       ROUND(SUM(total_spend), 2) as total_spend,
       MIN(recency_days) as min_recency,
       MAX(recency_days) as max_recency
FROM rfm_combined_user_events
GROUP BY source
ORDER BY total_events DESC
```

---

## Table 6: rfm_input_table
**Purpose:** Preprocessed input features computed from the union activity table before scoring.

| Column Name | Data Type | Description |
|------------|-----------|-------------|
| `<customer_id_col>` | varchar | Unique customer identifier |
| `recency` | bigint | Minimum recency_days across all sources (days since most recent activity) |
| `frequency` | bigint | Sum of total_touchpoints across all sources |
| `monetary_value` | double | Sum of total_spend across all sources (capped at 0 minimum) |

**Usage:** Intermediate table — use `rfm_output_table` for analysis. This table is useful for debugging scoring issues (comparing raw values to assigned quartiles).

---

## Table 7: rfm_stats_daily_agg
**Purpose:** Historical score aggregation with segment definitions (appended on every run).

Contains the full rfm_stats output joined with human-readable segment definitions for each row. Used for tracking segment migration trends across workflow runs.

---

## Table 8: rfm_stats_global_session_filter
**Purpose:** Session ranking table that orders workflow runs by recency.

| Column Name | Data Type | Description |
|------------|-----------|-------------|
| `session_id` | bigint | Workflow run session identifier |
| `session_rnk` | bigint | Rank by recency (1 = most recent run) |
| `run_time` | varchar | Timestamp of the run |

**Usage:** Join with other stats tables on `session_id` to filter to a specific run. Use `session_rnk = 1` for the latest run.

---

## Table 9: rfm_input_params
**Purpose:** Parsed YAML configuration parameters stored as a queryable table.

Contains one row per entry in `aggregate_metrics_tables` with all configuration fields (src_table, event_name, unixtime_col, join_key, order_amount, custom_filter, apply_time_filter, query_type) plus the computed `final_where_clause`.

**Usage:** Use to verify what configuration was active during a workflow run.

---

## Cross-Table Analysis Patterns

### Segment Distribution
```sql
SELECT rfm_segment,
       COUNT(DISTINCT <customer_id_col>) as customers,
       ROUND(COUNT(DISTINCT <customer_id_col>) * 100.0 / SUM(COUNT(DISTINCT <customer_id_col>)) OVER (), 2) as pct,
       AVG(r_quartile) as avg_r,
       AVG(f_quartile) as avg_f,
       AVG(m_quartile) as avg_m,
       AVG(monetary_value) as avg_monetary
FROM rfm_output_table
GROUP BY rfm_segment
ORDER BY customers DESC
```

### High-Value Customers (Champions)
```sql
SELECT <customer_id_col>, recency, frequency, monetary_value,
       r_quartile, f_quartile, m_quartile, rfm_quartile, rfm_segment
FROM rfm_output_table
WHERE rfm_segment = 'Champions'
ORDER BY monetary_value DESC
LIMIT 20
```

### At-Risk High-Value Customers
```sql
SELECT <customer_id_col>, recency, frequency, monetary_value,
       r_quartile, f_quartile, m_quartile, rfm_segment
FROM rfm_output_table
WHERE rfm_segment IN ('Cannot lose them', 'High Value Sleeping')
ORDER BY monetary_value DESC
LIMIT 20
```

### Quartile Distribution Heatmap (R vs F)
```sql
SELECT r_quartile, f_quartile,
       COUNT(DISTINCT <customer_id_col>) as customers
FROM rfm_output_table
GROUP BY r_quartile, f_quartile
ORDER BY r_quartile, f_quartile
```

### Monetary Value by Segment
```sql
SELECT rfm_segment,
       SUM(monetary_value) as total_monetary,
       ROUND(SUM(monetary_value) * 100.0 / SUM(SUM(monetary_value)) OVER (), 2) as pct_of_total,
       AVG(monetary_value) as avg_monetary,
       COUNT(DISTINCT <customer_id_col>) as customers
FROM rfm_output_table
GROUP BY rfm_segment
ORDER BY total_monetary DESC
```

### Source Table Contribution
```sql
SELECT source,
       COUNT(*) as total_profiles,
       SUM(total_touchpoints) as total_events,
       ROUND(SUM(total_spend), 2) as total_spend
FROM rfm_combined_user_events
GROUP BY source
ORDER BY total_events DESC
```

### Compare Segments Using Stats Table
```sql
SELECT rfm_segment, segment_size, population_percent,
       avg_rfm, avg_recency, avg_frequency, avg_monetary
FROM rfm_stats
WHERE session_id = (SELECT MAX(session_id) FROM rfm_stats)
ORDER BY segment_size DESC
```

---

## Data Quality Notes

**Characteristics:** Segment names use mixed case as defined in the scoring SQL (e.g., `Champions`, `Cannot lose them`, `Lost customers`). Quartile scores are integers from 1 to 4. Monetary values are stored as doubles. The `rfm_quartile` column uses format `R<n>F<n>M<n>` (e.g., `R4F3M2`).

**Edge Cases:** Customers with activity in only one source table may have biased frequency scores. Customers with no order data will all have `monetary_value = 0` — their m_quartile is still computed but based on the 0 values. Very recent customers may have high r_quartile but low f_quartile and m_quartile. Without `mv_threshold` (the default), zero-spend profiles count in the monetary cut-offs, so many of them can fill M1 and push buyers' cut-offs down; setting `mv_threshold` (e.g. `0.05`) leaves them out of the cut-offs.
