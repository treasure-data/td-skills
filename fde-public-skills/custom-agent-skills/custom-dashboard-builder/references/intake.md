# Intake

Goal: a **dashboard spec** — tabs, KPIs (as business definitions), charts, tables, filters (with scope: whole dashboard or one tab), date range and timezone — plus the database. Write it to `agent_outputs/<project_slug>/intake/spec.md` and use it in every later step.

Whatever the input, the dashboard is always rebuilt with the standard template (`dashboard_template/`), the TD theme and fresh queries — the input defines **what** to show, never the data.

## Existing dashboard

### `.dash` export (Sisense / Treasure Insights)

```bash
mkdir -p agent_outputs/<project_slug>/intake
python3 "<skill_dir>/tools/dash_to_html.py" "<path to .dash>" --out agent_outputs/<project_slug>/intake/dash --db <confirmed database>
```

Use only `widget_audit.json` (per widget: title, type, chart type, table, SQL, measures, dimension, global filters, warnings) to fill the spec. Ignore the converter's `render.js` / `template.html`.

- Converter warnings need a decision: unconverted formulas (rewrite the measure), heuristic auto-JOINs (fan-out risk — validate in data discovery), global filters across tables with no join (scope the filter to the tables that have the column).
- The database inside the `.dash` file is a hint only — confirm it with the user.
- Show the extracted spec as one table (tab → widget → metric → dimension → filters) and confirm it once.

### HTML dashboard file

Read the file: tabs, KPI labels, chart titles and types, axes, filters, colors. Ignore any inlined data. Map each widget to a metric definition and confirm the spec once. Keep the tab structure and widget order; the TD theme replaces the styling unless the user wants their brand colors (accent colors only).

### Screenshot or mockup

Read the image: tabs, KPI tiles, chart types and titles, filters, table columns. Write the spec, mark anything unreadable as a question, confirm once.

## No existing dashboard

Ask for the metrics and filters in free text ("which numbers and which breakdowns do you want to see?"). Turn the answer into the spec and propose the obvious additions the data supports after discovery (e.g. a trend over time for every headline KPI). Defaults: one tab per topic, up to 3–5 tabs, 3–5 global filters, 1–2 tab filters.

## Always

- **Database** — confirm it; list candidates with `tdx databases` if the user is unsure.
- **Timezone** — take it from the data or the spec; ask only if neither says.
- **Project name** — from the dashboard title (`Sales Performance` → `sales-performance`); confirm it in the same question as the database. The dashboard skill becomes `<project_slug>-dashboard`.
- **Visibility** — say once that every number in the HTML file can be read by whoever opens it, so it must not contain personal data rows.
- **Out of scope for an HTML dashboard** — real-time (sub-minute) data, streaming, raw GB-scale data that cannot be aggregated, encrypted storage, native alerts. Say so at intake if the request needs them.
