# Analyze Monitoring Data

A **Treasure AI Studio** skill that queries monitoring workflow databases — `basic_monitoring`, `cdp_monitoring`, `insights_monitoring`, `workflow_monitoring` — from natural-language requests. Defaults to a self-contained HTML dashboard, but drops to a quick, direct query-and-answer whenever you ask for something lighter — whether that's your first request or a follow-up after a dashboard already exists.

**Requires the workflows to already be deployed.** If no matching database is found, the skill directs the user to the [`setup-monitoring-workflows`](../setup-monitoring-workflows/README.md) skill instead of guessing.

## Installing in AI Studio

Published on the `td-skills` marketplace as part of the `monitoring-skills` plugin:

1. Open **Settings → Marketplace** (Web or Desktop).
2. Find **td-skills** (listed as `PRE-INSTALLED`) and expand it.
3. Find **monitoring-skills** and set it to **On**.
4. Start a **new chat** — plugin changes only apply to sessions started after you enable it.

See [Plugin Marketplace](https://docs.treasure.ai/products/ai-studio/skills/marketplace) for the full flow, including what `Default`/`On`/`Off` mean for a pre-installed marketplace's plugins.

Once enabled, it applies automatically whenever a request matches its domain, or you can invoke it explicitly with `/monitoring-skills:analyze-monitoring-data`.

## What It Does

Given a monitoring category (and, once one or more databases exist, a topic and time period), this skill:
- Resolves which deployed database to query, asking interactively if more than one match exists
- Runs every needed SQL query in parallel against Trino
- Assembles a KPI row, alert cards for anomalies, charts, and detail tables into one HTML file
- Links job/workflow/session/attempt/segment/journey/activation rows back to their TD Console page

That's the default when you don't specify a format. But if you ask for something lighter instead — "as a table," "just list them," "quickly tell me which ones failed" — the skill skips the dashboard and answers directly with a quick query and a plain text/table reply. This works the same way whether it's your first request or a follow-up later in the same chat (e.g. "list a few of those failed jobs," "which user had the most errors") — either way it reuses whatever database/region is already resolved rather than re-asking.

## When to Use

Load this skill when you need to:
- Build a dashboard from already-ingested monitoring data
- Answer a question about job health, CDP segment/journey activity, workflow sessions, or Insights usage
- Spot anomalies (high error rates, stale data, failure outliers) in monitoring data

**What you can actually ask, by category** (these are real, implemented query patterns — see `references/query-patterns.md` for the exact SQL):

| Category | Topics |
|---|---|
| `basic_monitoring` | Job status/failure breakdown, slowest jobs, top users by job count or errors, job cost & retry analysis, schedules with result destinations, user/policy permission maps |
| `cdp_monitoring` | Top parent segments by population, schedule-type breakdown, journey state summary, active journeys with audience size and goal tracking, activation health per segment, recent activation execution failures |
| `workflow_monitoring` | Projects/workflows with the most failures, recent failed attempts, success rates, upcoming scheduled runs, disabled workflows, pool-level attempt health |
| `insights_monitoring` | All data models with status, failed models |

Not limited to this list — it's a starting menu (Stage 3's `AskUserQuestion` always has an **Other** field for a custom ask), and a plain question outside these topics still gets a direct answer (see "How It Works" below) as long as the underlying data exists.

**Example requests:**
- "Analyze monitoring data"
- "Show me failed jobs in basic_monitoring_demo as a dashboard"
- "Build a CDP monitoring dashboard for the last 30 days"
- "List failed jobs in basic_monitoring_demo as a table" *(explicit — skips the dashboard on the first request)*
- *(as a follow-up, after a dashboard exists)* "List a few of those failed jobs" / "Which user had the most errors?"

## Prerequisites

1. **A Treasure AI Studio chat session connected to a Treasure AI account** — `tdx` CLI access comes automatically with that connection; the skill runs `tdx` queries directly and writes the dashboard file to disk.
2. **At least one monitoring project already deployed, with its initial ingest finished** — by this skill's companion `setup-monitoring-workflows`, or by someone else on the account. A database can exist while ingest is still running, so a deployed-but-still-ingesting project can produce a misleading dashboard (under-reported counts, a false "stale data" alert) rather than an error. If setup just ran, confirm the ingest session finished (ask `setup-monitoring-workflows` to check status, or check the console link) before analyzing — no new chat needed, the same conversation can move straight from setup into analysis.

## How It Works

1. **Stage 1 — Category**: if not already stated, asks which monitoring category to analyze (Basic / CDP / Workflow / Insights).
2. **Stage 2 — Resolve database**: lists matching databases (`tdx databases | grep monitoring`); if none exist for a chosen category, tells the user to run `setup-monitoring-workflows` first and stops. Also resolves the console region once per session for building TD Console links.
3. **Stage 3 — Topic + time period, or skip to a quick answer**: if the request wants a dashboard (the default, when format isn't specified), asks what to look at and what time window to cover, then proceeds to step 4. If the request explicitly wants something lighter — "as a table," "just list them" — skips straight to step 5 instead.
4. **Build the dashboard**: runs all queries in parallel, fills in `templates/dashboard-template.html`, wraps identifying rows in console links, scans for anomalies, and writes the final HTML file to disk.
5. **Quick answer (no dashboard)**: runs one targeted query against the already-resolved database and answers in plain text or a short table — no template, no HTML file. Applies equally to an explicit first request ("as a table") and to a plain follow-up after a dashboard already exists ("list a few failed jobs," "which database had the most errors") — a new dashboard is only built if you ask for one.

Any stage already answered by the user's original request is skipped — e.g. "show me failed jobs in basic_monitoring_demo as a table" answers the category, database, and format all at once, going straight to step 5.

## Limitations

- **Dashboard by default, not by force** — if you don't specify a format, the first response is a self-contained HTML dashboard. Ask explicitly for something lighter (a table, a quick list) and it skips straight to a direct answer instead, on the first request or any later one.
- **History availability varies by table type** — `*_history` tables exist only for config/snapshot tables, not for event tables like `jobs`/`attempts`/`sessions`. See `references/schema.md`.
- **Analysis only** — does not deploy or re-deploy monitoring projects (see `setup-monitoring-workflows`).

## Related Skills

- **setup-monitoring-workflows**: Deploy a monitoring project and run its initial ingest before this skill has data to query.

## Technical Details

- **Query engine**: Trino SQL via `tdx`
- **Reference files**: `references/schema.md` (table/column reference), `references/query-patterns.md` (query options per category), `references/console-links.md` (how to build TD Console deep links)
- **Template**: `templates/dashboard-template.html` — copied verbatim and filled in per dashboard
- **Common gotchas**: JSON columns (`attributes`, `project`, `workflow`) need `JSON_EXTRACT_SCALAR`; `time` means ingestion snapshot on CDP/Insights base tables but a real event timestamp on `basic_monitoring`/`workflow_monitoring`

See [`SKILL.md`](./SKILL.md) for the full interactive flow, dashboard-building steps, and the complete gotchas list.
