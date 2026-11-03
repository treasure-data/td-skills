# NBP Product Recommendations Model Summary Dashboard — Build & Data Guide

The NBP (Next Best Product) Model Summary Dashboard is an executive-ready, 5-tab HTML dashboard providing zero-latency visualization of product recommendation coverage, rank distributions, catalog diversity vs. popularity overlap, historic model stability, and test set performance.

---

> **Use as-is.** The dashboard template and `generate-data.js` are pre-validated: run the command once and use the result as it is. Do not take screenshots, run browser, QA or validation scripts, re-check the data, or edit the generated HTML, and do not apply other visualization or design skills to it. If something looks wrong, tell the user instead of fixing it.

## 1. Fast Generation via `generate-data.js`

Instead of manually executing queries and substituting tokens in context, use `generate-data.js` to automatically query `{{sink_database}}` via `tdx` in parallel, shape metrics, synthesize dynamic executive insights across all tabs, and bake all data directly into the dashboard in seconds.

### Commands

```bash
# Run from the Work Folder root (where agent_outputs/ lives).
node ".claude/skills/{{agent_name}}/references/generate-data.js" {{sink_database}} {{project_slug}} "{{project_name}}" \
  -p {{table_prefix}} -o "{{engagement_dir}}/dashboards/nbp_summary_dashboard.html"
```

### Options & Environment Variables

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `SOURCE_DB` | Env / Arg 1 | Required | Sink database where the NBP output tables live |
| `PROJECT_SLUG` | Env / Arg 2 | `nbp` | Project slug — default output folder `agent_outputs/<project_slug>/dashboards/` |
| `PROJECT_NAME` | Env / Arg 3 | Title-cased slug | Display name in dashboard header |
| `TABLE_PREFIX` / `-p, --prefix` | Env / Flag | `nbp_` | Table prefix of the NBP tables (the workflow's `prefix`, here `{{table_prefix}}`) |
| `-o, --output` | String | `agent_outputs/<project_slug>/dashboards/nbp_summary_dashboard.html` (relative to cwd) | Custom output file path |
| `-t, --template` | String | `dashboard_template.html` next to the script | Path to template file |
| `-v, --verbose` | Flag | `false` | Prints individual query timings and row counts |
| `-h, --help` | Flag | `false` | Shows CLI usage guide |

### Output

The generated dashboard is saved to:
```
{{engagement_dir}}/dashboards/nbp_summary_dashboard.html
```

Open it immediately using:
```bash
open "{{engagement_dir}}/dashboards/nbp_summary_dashboard.html"
# Or in Treasure Work:
mcp__work__open_file path: "{{engagement_dir}}/dashboards/nbp_summary_dashboard.html"
```

---

## 2. Parallel Source Queries (Automated by `generate-data.js`)

> These dashboard queries use session-level aggregates and user counts. They do not assume or interpolate a customer ID column. If a profile-level drill-down is added, resolve `original_user_id_column_name` from `workflow/config/input_params.yml` or run `DESCRIBE {{sink_database}}.{{user_master_table}}` before writing SQL.

All independent database queries are dispatched concurrently in parallel using `Promise.all`:

### Q1 — Latest Session Config & Coverage (Header & Tab 1 Snapshot)
```sql
SELECT s.session_id, s.run_time,
       m.users_with_recs, m.users_with_recs_after_filter,
       m.distinct_users_transactions_table, m.distinct_items_recommended,
       m.distinct_items_transactions_table, m.distinct_categories_transactions_table,
       m.time_range_days, m.least_recent_event, m.most_recent_event,
       m.model_params, m.exclusion_filters, m.filtered_item_count,
       m.filtered_categories, m.filtered_products
FROM {{sink_database}}.{{table_prefix}}dash_model_param_stats_agg m
JOIN {{sink_database}}.{{table_prefix}}global_session_filter s ON m.session_id = s.session_id
WHERE s.session_rnk = 1
LIMIT 1
```
*Powers: Session ID, Run Time (UTC), Model & Algorithm, Users with Recommendations, Addressable Users, Coverage %, Items Recommended, Catalog Items, Training Window Days & Dates, Exclusion Rules, and Filtered Item Count.*

### Q2 — Top Recommended Items at Ranks 1, 2, and 3 (Tab 2 Recommendations)
```sql
-- Rank 1
SELECT nbp_1 AS item, SUM(event_cnt) AS user_count
FROM {{sink_database}}.{{table_prefix}}dash_final_recs_stats_daily
WHERE event_date = (SELECT MAX(event_date) FROM {{sink_database}}.{{table_prefix}}dash_final_recs_stats_daily)
  AND nbp_1 IS NOT NULL AND nbp_1 != ''
GROUP BY nbp_1 ORDER BY user_count DESC LIMIT 15;

-- Rank 2
SELECT nbp_2 AS item, SUM(event_cnt) AS user_count
FROM {{sink_database}}.{{table_prefix}}dash_final_recs_stats_daily
WHERE event_date = (SELECT MAX(event_date) FROM {{sink_database}}.{{table_prefix}}dash_final_recs_stats_daily)
  AND nbp_2 IS NOT NULL AND nbp_2 != ''
GROUP BY nbp_2 ORDER BY user_count DESC LIMIT 10;

-- Rank 3
SELECT nbp_3 AS item, SUM(event_cnt) AS user_count
FROM {{sink_database}}.{{table_prefix}}dash_final_recs_stats_daily
WHERE event_date = (SELECT MAX(event_date) FROM {{sink_database}}.{{table_prefix}}dash_final_recs_stats_daily)
  AND nbp_3 IS NOT NULL AND nbp_3 != ''
GROUP BY nbp_3 ORDER BY user_count DESC LIMIT 10;
```
*Powers: Rank 1 top recommended items horizontal bar chart, and the 3-rank side-by-side comparison table.*

### Q3 — Category Distribution Across Ranks 1–3 (Tab 2 Categories)
```sql
SELECT 'rank_1' AS rank_label, nb_category_1 AS category, SUM(event_cnt) AS user_count
FROM {{sink_database}}.{{table_prefix}}dash_final_recs_stats_daily
WHERE event_date = (SELECT MAX(event_date) FROM {{sink_database}}.{{table_prefix}}dash_final_recs_stats_daily)
  AND nb_category_1 IS NOT NULL AND nb_category_1 != ''
GROUP BY nb_category_1
UNION ALL
SELECT 'rank_2', nb_category_2, SUM(event_cnt)
FROM {{sink_database}}.{{table_prefix}}dash_final_recs_stats_daily
WHERE event_date = (SELECT MAX(event_date) FROM {{sink_database}}.{{table_prefix}}dash_final_recs_stats_daily)
  AND nb_category_2 IS NOT NULL AND nb_category_2 != ''
GROUP BY nb_category_2
UNION ALL
SELECT 'rank_3', nb_category_3, SUM(event_cnt)
FROM {{sink_database}}.{{table_prefix}}dash_final_recs_stats_daily
WHERE event_date = (SELECT MAX(event_date) FROM {{sink_database}}.{{table_prefix}}dash_final_recs_stats_daily)
  AND nb_category_3 IS NOT NULL AND nb_category_3 != ''
GROUP BY nb_category_3
ORDER BY rank_label, user_count DESC
```
*Powers: Rank 1 category distribution donut/pie chart, and category spread across ranks 1–3 stacked bar chart.*

### Q4 — Catalog Breakdown & Most Ordered Items (Tab 3 Catalog & Popularity)
```sql
-- Catalog Categories
SELECT item_category, item_count
FROM {{sink_database}}.{{table_prefix}}dash_item_category_mapping_agg
WHERE item_category IS NOT NULL AND item_category != ''
ORDER BY item_count DESC;

-- Most Ordered Items (Deduplicated)
SELECT item_name, MAX(times_ordered) AS times_ordered
FROM {{sink_database}}.{{table_prefix}}dash_most_ordered_items
WHERE item_name IS NOT NULL AND item_name != ''
GROUP BY item_name
ORDER BY times_ordered DESC
LIMIT 15;
```
*Powers: Product catalog category distribution pie chart, and Most Ordered in Source Data vs. Most Recommended (Rank 1) side-by-side comparison.*

### Q5 — Historic Run Inventory for Historic Tracker (Tab 4 Runs)
```sql
SELECT s.session_id, s.run_time,
       m.users_with_recs, m.distinct_users_transactions_table, m.distinct_items_recommended
FROM {{sink_database}}.{{table_prefix}}dash_model_param_stats_agg m
JOIN {{sink_database}}.{{table_prefix}}global_session_filter s ON m.session_id = s.session_id
ORDER BY s.session_rnk DESC
```
*Powers: Coverage rate trend line, users with recommendations trend line, catalog items recommended trend line, and single-run callout toggle (`run_count <= 1`).*

### Q6 — Test Set Aggregate Metrics (Tab 5 — Conditional)
```sql
SELECT n.total_customers, n.total_items_bought,
       n.total_product_matches, n.total_category_matches,
       n.random_item_rate, n.random_category_rate
FROM {{sink_database}}.{{table_prefix}}dash_testset_numbers n
JOIN {{sink_database}}.{{table_prefix}}global_session_filter s ON n.session_id = s.session_id
WHERE s.session_rnk = 1
LIMIT 1
```
*Powers: Product match rate, category match rate, product lift vs. random baseline, and category lift vs. random baseline.*

### Q7 — Test Set Precision/Recall Histograms (Tab 5 — Conditional)
```sql
SELECT t.label, t.bin_cnt, t.type
FROM {{sink_database}}.{{table_prefix}}dash_testset t
JOIN {{sink_database}}.{{table_prefix}}global_session_filter s ON t.session_id = s.session_id
WHERE s.session_rnk = 1
ORDER BY t.type, t.label
```
*Powers: Precision distribution histogram and recall distribution histogram.*

---

## 3. Dashboard Structure & Tab Breakdown

### Header & Metadata Strip
- **Project Identity**: Project display name, sink database name, table prefix, and active session ID.
- **Run Metadata**: Run timestamp (UTC), AI Signals model & algorithm, users with recs, coverage rate %, and items excluded by business rules.

### Tab 1 — Run Overview
- **Coverage KPIs**:
  1. Users with Recommendations (Count of addressable transaction users receiving ≥1 recommendation)
  2. Coverage Rate (Percentage of active users covered)
  3. Items Recommended (Distinct items surfaced out of total catalog)
  4. Training Window (Lookback duration in days and date boundaries)
- **Visual Coverage & Configuration**:
  - Donut Chart: Recommendation Coverage (With Recommendations vs. Without Recommendations).
  - Model Configuration Table: Session ID, Run Time, Model, Algorithm, Training Window, Filtered Items, Exclusion Filters, and Hyperparameters.
- **Executive Insights & Recommendations**: 5 dynamically synthesized findings evaluating audience reach, catalog utilization, temporal training depth, model and algorithm, and filtering impact.

### Tab 2 — Recommendations
- **Top Recommended Items (Rank 1)**: Horizontal bar chart sorted descending by user count (Plotly ASC layout).
- **Top 3 Recommendations — Side by Side**: Full structured table showing ranks 1, 2, and 3 top products and user volumes side-by-side.
- **Category Distribution & Rank Spread**:
  - Donut Chart: Category distribution at rank 1.
  - Stacked Bar Chart: Category spread across ranks 1–3, illustrating category diversification.
- **Executive Insights & Recommendations**: 5 dynamically synthesized findings assessing dominant rank-1 products, category concentration, cross-rank progression, catalog variety, and audience activation guidelines.

### Tab 3 — Catalog & Popularity
- **Product Catalog — Category Breakdown**: Donut chart detailing item counts per catalog category.
- **Most Ordered vs. Most Recommended**: Side-by-side comparison charts evaluating historical demand vs. model personalization:
  - Horizontal Bar: Most Ordered in Source Data (top products by lifetime transaction volume).
  - Horizontal Bar: Most Recommended (Rank 1).
- **Executive Insights & Recommendations**: 5 dynamically synthesized findings evaluating catalog breadth, historical purchase volume, personalization divergence vs. popularity bias, catalog exposure rate, and merchandising opportunities.

### Tab 4 — Historic Tracker
- **Single-Run Graceful Degradation**: When only 1 run exists, displays a prominent callout informing users that trend lines will populate after subsequent scheduled runs, while rendering the baseline snapshot cleanly.
- **Trend Visualizations**:
  - Coverage Rate Over Time (%): Trajectory of addressable audience coverage across runs.
  - Users with Recommendations Over Time: Growth or contraction of user scoring base.
  - Catalog Breadth Over Time: Count of distinct items recommended run-over-run.
- **Executive Insights & Recommendations**: Dynamic bullets interpreting run-over-run deltas, audience trajectory, catalog stability, and anomaly monitoring thresholds.

### Tab 5 — Test Set Evaluation (Conditional)
- **Automatic Enablement Detection**: Evaluates whether `run_model_test_set: 'yes'` was active and test set tables contain customer evaluation records.
- **When Active**:
  - 4 KPI Tiles: Product Match Rate (with lift vs. random baseline), Category Match Rate (with lift vs. random baseline), Test Set Customers, and Items Bought in the test window.
  - Grouped Bar Chart: Model vs. Random Baseline comparison.
  - Precision Distribution Histogram: User distribution across precision bins.
  - Recall Distribution Histogram: User distribution across recall bins.
  - 5 Executive Insights interpreting model accuracy, precision/recall trade-offs, and parameter tuning advice.
- **When Disabled / Empty**: Renders an informative callout explaining why test-set evaluation is inactive and how to enable it in `config/input_params.yml`.

---

## 4. Programmatic Data Access (`window.RAW`)

Every generated dashboard inlines a structured JSON payload in `<head>` accessible via browser console or automated scripts:

```javascript
console.log(window.RAW);
// Structure:
// {
//   project: { name, slug, database, prefix },
//   meta: { sessionId, runTime, totalUsers, usersWithRecs, coveragePct, distinctItemsRecommended, totalItemsInCatalog, timeRangeDays, leastRecentEvent, mostRecentEvent, engine, algorithm, filteredItemCount, exclusionFilters, runCount },
//   recommendations: { rank1: [...], rank2: [...], rank3: [...], categoriesByRank: [...] },
//   catalog: { categories: [...], mostOrdered: [...] },
//   historic: { runs: [...], coveragePct: [...], itemsRecommended: [...], usersRecommended: [...] },
//   testset: { totalCustomers, totalItemsBought, productMatchRate, categoryMatchRate, randomItemRate, randomCategoryRate, productLift, categoryLift } | null
// }
```
