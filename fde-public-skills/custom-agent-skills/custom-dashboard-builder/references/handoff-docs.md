# Handoff Docs (on request)

One file, `agent_outputs/<project_slug>/docs/handoff.md`, written from `project_state.md`, the knowledge files, the dashboard and workflow copies. Start with `> Audience: customer` (sections 1–3) — section 4 is internal and goes in `docs/operations.md` if the user wants it. Real names, paths and values only; no secrets; no Treasure Data internals in the customer part.

1. **What it is** — purpose, audience, the dashboard file and the dashboard skill, data sources and data range, refresh (manual through the skill, or the workflow schedule).
2. **What it shows** — per tab: KPIs with their business definition and exclusions, charts, filters (scope), widget notes and caveats.
3. **How to use it** — open / refresh ("Show me the dashboard"), ask about a number, add a metric, update the business context; who to contact.
4. **Operations** (internal) — workflow project, SINK tables, schedule, monitoring and failure commands (`tdx wf sessions`, `tdx wf timeline … --follow`, `tdx wf attempt <id> tasks`), where the master copies live, how to rebuild the skill, data sensitivity (PII fields excluded, who may receive the file).
