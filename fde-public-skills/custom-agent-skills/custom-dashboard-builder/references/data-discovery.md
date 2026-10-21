# Data Discovery and Recommendation

Run everything here yourself, read-only, before asking anything. Combine checks into as few queries as possible (`UNION ALL`, one shell command with `&` … `wait`). Query results that contain rows are never pasted into the chat — read single numbers and short value lists only.

CLI: `tdx tables --in <db>` · `tdx describe <db>.<table>` · `tdx query -d <db> "<SQL>"` (or `-f file.sql`; never a positional database). A 401 means the user runs `! tdx auth setup`.

## 1. Tables and columns

- `tdx describe` every candidate table; copy column names exactly (case-sensitive).
- Classify each table: **behavior** (rows with an event time), **attribute** (one row per entity), **snapshot** (no date, or the same date on every row — no date filter applies), **aggregate** (already pre-aggregated — e.g. existing SINK or Parent Segment output).
- A metric or dimension missing from the database: look in the other databases the user named before calling it a gap.

## 2. Time column and timezone

TD's `time` column is often the **load** time. For each behavior table compare `time` with every timestamp-like column:

```sql
SELECT TD_TIME_FORMAT(MIN(time),'yyyy-MM-dd','UTC') t_min, TD_TIME_FORMAT(MAX(time),'yyyy-MM-dd','UTC') t_max,
       COUNT(DISTINCT TD_TIME_FORMAT(time,'yyyy-MM-dd','UTC')) t_days,
       MIN(<event_col>) e_min, MAX(<event_col>) e_max, COUNT_IF(<event_col> IS NULL) e_nulls, COUNT(*) n
FROM <table>
```

- Use the event column when its range is wide and it differs from `time`; varchar → `TD_TIME_PARSE(col, 'UTC')`; bigint epochs: check seconds vs milliseconds (`FROM_UNIXTIME(c)` vs `FROM_UNIXTIME(c/1000)`). A nullable event column is a data-quality flag.
- Record the timezone (and the source's, if it differs). The default date range never ends after MAX(event date); trends need ≥ 12 months of history.
- Keep metric windows ("active = ordered in the last 90 days") separate from the dashboard's date filter.
- Partition pruning: filter on native `time` with `TD_TIME_RANGE(time, '<start>', NULL, 'UTC')` first, then the business column.

## 3. Metrics as formulas

For every KPI write the formula and run it once on live data with its full WHERE clause:

- Count KPIs: `COUNT(<id>)` or `COUNT(DISTINCT <id>)` — never `COUNT(*)` unless the user confirms it counts rows.
- Ratios and averages: define numerator and denominator (`SUM(revenue) / COUNT(order_id)`); they are recomputed after filtering, never averaged.
- A metric with two valid definitions (gross vs net, unique vs total opens): show both values and ask which to use (or show both).
- Exclusions (test or internal accounts, cancelled or refunded rows, negative amounts): write each as SQL and measure the share of rows it removes (> 50 % → probably the wrong definition). An exclusion that cannot be found in the data → ask which column defines it.
- Compare each value with any benchmark the user or the old dashboard gives; large gaps → recheck table, filter and grain.
- Record each metric with its formula, WHERE clause, value, date range and timestamp (**confirmed values** — the baseline for the dashboard and the skill).

## 4. Data-quality gate

One summary query per table (date range applied):

| Check | Rule |
|---|---|
| Rows after all filters | 0 → stop |
| Metric NULLs | ≥ 10 % → flag; `COALESCE(x, 0)` only if NULL means zero |
| Dimension NULLs and empty strings | ≥ 5 % → show as `'Unknown'` |
| Negatives | unexpected → explain or exclude |
| Zeros | > 30 % → confirm it is expected |
| Freshness | MAX(event date) vs today; a stale MAX(`time`) means the pipeline stopped |
| Dimension values | `SELECT DISTINCT` vs the expected values; stray values via `NOT IN (…)` |

Critical failures (no rows, unexplained negatives, stale data the user needs fresh) block the build — tell the user what is wrong.

## 5. Joins

For every join the dashboard needs:

```sql
SELECT COUNT(*) AS joined_rows, COUNT(DISTINCT b.<key>) AS base_keys,
       COUNT_IF(d.<key> IS NULL) AS unmatched
FROM <base> b LEFT JOIN <dim> d ON b.<key> = d.<key>
```

- `joined_rows` > rows of `<base>` → fan-out: pre-aggregate the many side by the join key in a subquery, then join. Never SUM after a fan-out join.
- Key types must match; match rate ≥ 80 % fine, 50–80 % investigate, < 50 % stop (format mismatch).
- Distinct key counts on both sides within ~5 %, otherwise ask whether that is expected.

## 6. Size and speed

- **Rows the dashboard needs** = time buckets × product of the distinct counts of the filter dimensions (only existing combinations — measure with a `COUNT(*)` over the GROUP BY).
- **Payload** ≈ rows × (8 B per number, 10 B per date, ~20–50 B per text value) + 20 % JSON overhead. Budget: < 500 KB ideal, ≤ 2 MB hard stop.
- Dropdown filters: < 50 values fine, 50–500 acceptable, > 500 → use a coarser dimension; never ID filters.
- Time each dashboard query on the real filters.
- To fit the budget, in this order: drop high-cardinality filters → coarser time grain (day → week → month) → shorter history → coarser hierarchy (city → region, SKU → category) → top-N.

## 7. Recommendation

| Recommend | When |
|---|---|
| **Direct** — `generate-data.js` queries the source at build and refresh time | The source is already aggregated, **or** every dashboard query runs in < 30 s, the payload fits the budget, and no join needs pre-joining |
| **Workflow** — pre-aggregate into SINK tables first | Any query > 30 s on the real filters; the payload only fits after pre-aggregation; cross-database or one-to-many joins that should be pre-joined once; scheduled refresh from large raw tables |

Present it with the numbers behind it (rows, query times, payload estimate, joins). The user accepts or switches.
