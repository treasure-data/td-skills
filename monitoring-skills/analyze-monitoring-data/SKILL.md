---
name: analyze-monitoring-data
description: Queries and builds dashboards from the monitoring workflow databases (basic_monitoring, cdp_monitoring, insights_monitoring, workflow_monitoring). Use whenever the user asks a question about or wants a dashboard from this ingested monitoring data, or explicitly names this skill (e.g. "analyze-monitoring-data", "analyse monitoring data", or close variants). Requires the workflows to already be deployed — if none are found, direct the user to the setup-monitoring-workflows skill.
---

# Monitoring Workflows — Analysis & Dashboards

Query and visualize data from the four monitoring workflow databases using natural language.

**Reference files** — when to read each:
- `references/schema.md` and `references/query-patterns.md` — read before presenting Stage 3 options
- `templates/dashboard-template.html` — read before building a dashboard, whether that's the initial analysis or a later turn. Not needed at all if the request wants a quick answer instead — see "Quick Answers (No Dashboard)" below
- `references/console-links.md` — read before writing dashboard queries whenever the data includes jobs, workflows, sessions, attempts, parent segments, sub segments, journeys, activation templates, or activations

## Interactive Flow

Skip any stage below where the user's original request already answers it. E.g. "show me failed jobs in basic_monitoring_demo as a table" already answers Stages 1, 2, and 3 — go straight to querying. ("As a table" also answers the format question: skip the dashboard and go to **Quick Answers (No Dashboard)** below instead.)

### Stage 1 — Which monitoring category?

If the user hasn't said which workflow type they mean, ask first:

```
AskUserQuestion:
  question: "Which monitoring data would you like to analyze?"
  multiSelect: true
  options:
    - "Basic Monitoring — jobs, schedules, connections, users"
    - "CDP Monitoring — parent segments, journeys, activations"
    - "Workflow Monitoring — workflow projects, sessions, attempts"
    - "Insights Monitoring — data models"
```

### Stage 2 — Check deployment & resolve database

For each chosen category, list matching databases:

```bash
tdx databases | grep monitoring
```

**If nothing is found for a chosen category:** tell the user:
> "No monitoring databases found. You'll need to deploy the monitoring workflows first using the **setup-monitoring-workflows** skill before analysis is possible."
Then stop — do not proceed further.

**If exactly one match:** use it directly, no need to ask.

**If multiple matches:** use `AskUserQuestion` to let the user pick interactively, one question per category:

```
AskUserQuestion:
  question: "Multiple basic_monitoring databases found — which one should I use?"
  options: (one per discovered database, e.g. "basic_monitoring_demo", "basic_monitoring_prod")
```

Once confirmed, use the resolved database name as a qualifier in all queries — `<chosen_database>.<table>` — rather than bare table names.

**Also resolve the console region now**, once per session, since dashboards link job/workflow/segment rows to their TD console pages:

```bash
tdx status
```

Read the `site` field (e.g. `us01`, `eu01`) from the output and keep it for the rest of the flow. See `references/console-links.md` for how it's used.

### Stage 3 — What does the user want, over what time period?

**Default to a dashboard** when the request doesn't say otherwise — it's the richer output and what this skill is for. But if the request explicitly wants something lighter ("as a table", "just list them", "quickly tell me", "no dashboard") — on this first request or any later one — skip ahead to **Quick Answers (No Dashboard)** below instead of asking about topic/time period here.

If the user's original request was already specific about content and time period ("show me job health for the last 2 weeks"), skip this stage and go straight to querying.

Otherwise, ask what topic they want. Build the options from `references/query-patterns.md`. "Comprehensive" is always the last option — it means running every query pattern for that category.

```
AskUserQuestion:
  question: "What would you like to look at in basic_monitoring?"
  options:
    - "Job status breakdown & failure trends"
    - "Top users by job count / errors"
    - "Slowest jobs"
    - "Comprehensive — full overview of all available data"
```

The built-in "Other" field on `AskUserQuestion` already covers custom asks — don't add a separate "something else" option.

**Dashboard scope:** build a dashboard focused on the chosen topic only — run only the queries relevant to that topic. If the user chose "Comprehensive," run every query pattern for that category. If the user later says "build dashboard" after already selecting a specific topic, treat it as topic-scoped, not comprehensive.

**Then ask time period** — but only if the category is event-level (`basic_monitoring`, `workflow_monitoring`) or the request will pull from a `*_history` table for trends:

```
AskUserQuestion:
  question: "What time period should this cover?"
  options:
    - "Last 7 days"
    - "Last 30 days"
    - "All time"
```

Map the answer to a `WHERE` clause:
- **basic_monitoring / workflow_monitoring** (per-row event timestamps): filter on `time` with `td_interval(time, '-7d/now')` or `td_interval(time, '-30d/now')`; "All time" = no filter
- **cdp_monitoring / insights_monitoring trend requests**: base tables hold only the current snapshot — a time period only makes sense against the corresponding `*_history` table. Skip asking about time period for a plain current-state question — only ask when the user wants a trend.

All outputs follow the *Building Dashboards* instructions below.

---

## Building Dashboards

Read `templates/dashboard-template.html` before writing any dashboard HTML (you should have done this at the end of Stage 2). Produce a self-contained HTML file based on it.

### Step 1 — Run all queries in parallel

Issue every SQL query needed for the dashboard in a single step. Do not wait for one query to finish before starting the next.

**Include the columns needed for console links in these same queries** — don't add a second round trip afterward. Read `references/console-links.md` for exactly which columns/joins each entity type needs (e.g. `entities.id` + `JSON_EXTRACT_SCALAR(attributes, '$.audienceId')` for CDP rows, `attempts.sessionid` + the workflow id for attempts).

### Step 2 — Assemble the HTML

Copy the template verbatim. Your only job is:

1. **Fill the `DATA` object** with query results (one key per result set)
2. **Write the `render()` function body** using the template's helpers
3. **Wrap identifying cells in `linkCell(url, label)`** for any row that names a job, workflow, session, attempt, parent segment, sub segment, journey, activation template, or activation — build `url` per `references/console-links.md`. Pass `null` when the row is missing an id the URL needs; never construct a URL with a blank segment.

Follow the `render()` workflow documented in the template:
`buildPalette()` → `applyChartDefaults(P)` → `destroyCharts()` → inject HTML → call chart factories

**Color rule:** use `P.categorical[0..7]` for data series in slot order; use `P.status.*` for good/warn/serious/crit states — never mix the two.

### Step 3 — Alerts

Scan the DATA for anomalies and build alert cards. Common patterns to flag:

- Error rates > 50% on any entity (user, database, project, segment, model)
- Entities at 100% failure over the full time window (completely broken)
- Unusually long durations (outliers > 3× the average)
- Stale data (last update much older than expected schedule)
- Population drops > 50% between snapshots (CDP)

### Dashboard structure

Every dashboard should include these sections in order:

1. **KPI row** — 4–6 headline metrics (totals, rates, extremes)
2. **Alerts** — 3–7 actionable findings from the data
3. **Charts row** — 2–3 charts (use `.wide-left` when a trend chart anchors the row)
4. **Tables** — 1–3 detail tables (add `.full` to a table card for full width)

### Write the file

Write the final HTML to a file so the user can download it.

---

## Quick Answers (No Dashboard)

Not every request wants a dashboard. Use this path instead of "Building Dashboards" whenever the request explicitly wants something lighter — "as a table", "just list them", "quickly tell me which ones failed" — regardless of whether it's the very first request in the conversation or a follow-up after a dashboard already exists (e.g. "list a few failed jobs", "which user had the most errors", "show me the slowest ones").

- **Still resolve category and database first** (Stages 1–2) if they aren't already known — you need to know what to query no matter the output format. Just skip straight past the dashboard-building format/topic questions.
- **Reuse whatever's already resolved** — database, region — rather than re-asking.
- **Run one targeted query** (or a small number) via `tdx`, scoped as precisely as the question allows (e.g. `LIMIT 5` for "a few").
- **Answer in plain text or a short table.** Do not read the dashboard template or write an HTML file for this.
- **Still link identifying rows** (job/workflow/session/attempt/segment/journey/activation) to their TD Console page per `references/console-links.md`, same as a dashboard would.

Build a full dashboard instead whenever the request doesn't specify a format (the default) or explicitly asks for one — "build a dashboard", "show me a dashboard", "update the dashboard".

---

## Important Gotchas

- **Read `references/schema.md` before querying** — if a column isn't listed there or you're unsure what's available, inspect the table schema for `<database>.<table>` directly.
- **`time` column behaves differently per table type.** On `basic_monitoring`/`workflow_monitoring` event tables (`jobs`, `attempts`, etc.) `time` is a real Unix timestamp (seconds) — use `td_interval(time, '-7d/now')` for partition pruning. On CDP/Insights base tables (`parent_segments`, `journey_summary`, `datamodels`, etc.) `time` is always the ingestion snapshot time — only `*_history` tables are useful for trend queries.
- **CDP `attributes` is JSON** — never select it raw for analysis; always use `JSON_EXTRACT_SCALAR(attributes, '$.field')`
- **`attempts.project` and `attempts.workflow` are JSON strings** — use `JSON_EXTRACT_SCALAR(project, '$.name')` to get readable names
- **Timestamps in `attempts`/`jobs` are ISO strings** — use `date_parse(col, '%Y-%m-%dT%H:%i:%SZ')` for date math; use `date_diff('second', ...)` for durations
- **`*_history` tables do NOT exist for event tables** — `jobs_history`, `attempts_history`, and `sessions_history` do not exist. Events are queried directly with `td_interval` time filters. History tables exist only for config/snapshot tables (see `references/schema.md` for the full list per database).
- **`parent_segments_configuration` only exists in `cdp_monitoring` (no suffix)** — it is absent from `cdp_monitoring_<suffix>` deployments. Always use `parent_segments` with JSON extraction when querying a suffixed database.
- **Multiple databases** with the same prefix are common — always confirm which suffix the user wants before running queries
- **Console links need the `entities` table for CDP objects, not `parent_segments_configuration`** — `rootfolderid` only exists in the unsuffixed `cdp_monitoring` database, but every deployment (suffixed or not) has `entities`, so resolve parent-segment/sub-segment/journey/activation-template links from there. See `references/console-links.md`.
