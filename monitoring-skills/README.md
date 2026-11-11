# Monitoring Skills

Treasure AI Studio skills for monitoring your own Treasure AI account's operational health using pre-built monitoring workflow projects. This is health/status telemetry about your account, not the underlying customer data itself (who's in a segment, their attributes).

| Project | Covers |
|---|---|
| `basic_monitoring` | Jobs, schedules, connections, users, databases, permission policies |
| `cdp_monitoring` | CDP parent segments, entities, activations, journey summaries, journey statistics, journey activation steps |
| `workflow_monitoring` | Workflow sessions, attempts, projects, schedules |
| `insights_monitoring` | Insights data model usage |

See `setup-monitoring-workflows`'s [README](./setup-monitoring-workflows) for the full table-by-table breakdown and which REST API backs each. One plugin, `monitoring-skills`, with two skills:

| Skill | Does |
|---|---|
| [`setup-monitoring-workflows`](./setup-monitoring-workflows) | Deploys any combination of the four monitoring workflow projects via `tdx` — clone, configure, secrets, initial ingest |
| [`analyze-monitoring-data`](./analyze-monitoring-data) | Queries an already-deployed project's data from a natural-language request — a dashboard by default, or a quick direct answer if you ask for something lighter — and takes follow-up questions in the same chat |

Enable it from **Settings → Marketplace** in AI Studio (`td-skills` → `monitoring-skills` → **On**). See [Plugin Marketplace](https://docs.treasure.ai/products/ai-studio/skills/marketplace).

Typical flow: *"Set up monitoring workflows"* to deploy a project, then *"Analyze monitoring data"* (or a specific question like *"Show me failed jobs in basic_monitoring_demo as a dashboard"*) once it's ingesting. `analyze-monitoring-data` checks for a deployed database first and points back to `setup-monitoring-workflows` if none exists yet — the two are meant to be used in sequence, not interchangeably. Ask for something lighter — *"as a table"*, *"just list them"* — and it skips the dashboard for a quick direct answer instead; this works the same on the first request or as a follow-up once a dashboard already exists (*"list a few of those failed jobs"*), without rebuilding the dashboard each time.

Source for the workflow projects themselves is `treasure-data/treasure-boxes` (`scenarios/monitoring/<project>/`); these skills clone and template that source, they don't duplicate it.

**Estimated conversation cost** (based on limited observed usage — refine as more data comes in):
- Initial setup (`setup-monitoring-workflows`, all four monitoring projects deployed in one chat): **~9.8 conversation units** (~$1.86 — Claude Sonnet 4.6 + Claude Haiku 4.5), a single observed run, per Treasure AI Studio's own chat usage report.
- Building a full dashboard (`analyze-monitoring-data`, one category, **Comprehensive** topic — the heaviest option, not the narrower default topic choice): **~7.7 conversation units average** (range 5.7–9.2 across the four categories; ~$1.46 average per chat, ~$5.84 total across 4 separate chats, one per category — Claude Sonnet 4.6 + Claude Haiku 4.5), per Treasure AI Studio's own chat usage report.
