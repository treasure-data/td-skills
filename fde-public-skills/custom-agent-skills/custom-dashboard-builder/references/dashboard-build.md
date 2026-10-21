# Dashboard Build

Template: `<skill_dir>/project_templates/dashboard_template/` — `dashboard.template.html` (generic renderer; its header documents the RAW / LAYOUT contract), `generate-data.js` (queries + layout + engine), `chart.umd.min.js` (Chart.js 4.4.0, inlined so the file works offline). Both are pre-validated: fill in `CONFIG`, `QUERIES` and `LAYOUT`; never rewrite the engine or the template.

```bash
d="agent_outputs/<project_slug>/dashboards"
[ -d "$d" ] || { mkdir -p "$d" && cp "<skill_dir>/project_templates/dashboard_template/"{dashboard.template.html,generate-data.js,chart.umd.min.js} "$d/"; }
node "$d/generate-data.js"            # writes $d/dashboard.html
```

## 1. CONFIG

Title, subtitle, timezone, currency, and the confirmed databases (source; sink = the SINK database on the workflow path, the source database otherwise). No `<placeholder>` may remain — the script refuses to run.

## 2. QUERIES

One entry per dataset: `{ db, sql, limit, columns, numeric }`. `meta` (data_start / data_end as `YYYY-MM-DD`) is required.

- **Aggregated rows only**, never raw events or user-level rows. Select only the columns the layout reads.
- **Grain = the filters that apply to the widgets using it.** A dataset for a tab carries the date column (zero-padded ISO: `YYYY-MM-DD`, `YYYY-MM` or `YYYY`) plus every global filter dimension and that tab's filter dimensions. The page filters and re-aggregates rows in the browser, so a dimension missing from a dataset makes that filter do nothing for its widgets.
- Additive measures only (SUM, COUNT). Ratios: return numerator and denominator and use `agg: 'ratio'`. Distinct counts: a dataset at exactly the displayed grain — read with `agg: 'fixed'` (shown with a note that filters don't change it), or a row-level dataset small enough for `agg: 'distinct'`. Never sum a distinct count across rows.
- Apply the confirmed exclusions and `COALESCE(dim, 'Unknown')`; prune on `time` first for source tables; use the SINK columns exactly as `tdx describe` shows them.
- `limit` above the expected rows — reaching it fails the build (no silent truncation); `columns` lists the required columns (a missing one fails the build); `numeric` lists columns to coerce to numbers.
- Queries run in parallel; the date of the data comes from `meta`.

## 3. LAYOUT

`date_field`, `filters` (`key`, `label`, `field`, `scope: 'global' | <tab id>`), and `tabs` with `kpis`, `charts` (`line`, `bar`, `hbar`, `doughnut`; `x`, `series`, optional `top`), `tables` (`columns`, optional `group_by`, `sort`, `top`). Every KPI and chart gets an `info` text with its definition (from the confirmed formula); widgets with a limitation (not date-filterable, top-N only, fixed value) get a `note`.

Behaviour built into the template: global filters apply to every tab, tab filters to their tab, all with AND; a breakdown chart ignores a filter on its own dimension; filter options come from the data; one colour per series / category across widgets; "showing top N of M" on tables; empty results show "No data"; each tab renders independently.

Design defaults: 3–5 tabs, 3–5 KPIs per tab, a trend for each headline KPI, breakdowns as horizontal bars sorted by value, doughnuts only for ≤ 6 categories.

## 4. Theme

TD brand by default (built into the template): headings Poppins 600 `#2D40AA`, body Manrope; series `#847BF2, #8BBCFD, #FDB893, #C466D4, #FEAFD9, #FFE2BD, #44BAB8, #8CC97E, #EEB53A, #5FCFD8`. A customer brand changes only `--accent-1` / `--accent-2` in the template copy.

## 5. Check before showing it

1. The script exits without an error and prints rows per dataset and the payload size (data < 500 KB ideal; > 2 MB is refused — reduce with the order in `data-discovery.md` §6).
2. **Spot-check ≥ 3 KPIs** against the **source** tables (not the SINK) for the same window and filters: the dashboard value must match exactly at display precision. On a mismatch check, in this order: date window, WHERE / exclusions, grain, aggregation, fan-out, column names. Repeat for one filtered combination (e.g. one region + one month).
3. Breakdowns of additive metrics add up to their KPI total.

Then show the dashboard (`preview_document` / open the file) with a 3-line summary: data range, headline values, anything the user should know (caveats, fixed-value KPIs). Changes after this are made through the dashboard skill.
