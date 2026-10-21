# Custom Audience Agent — Documentation Set Content

Optional Phase 5 docs. File names, audience headers and create order are in `../../shared/customer_docs_pattern.md`; docs go to `agent_outputs/<project_slug>/docs/`. Sources: `project_state.md`, `business-context.md`, `data-dictionary.md`, `eval.md`, `requirements.md`, and the pushed segments recorded in `project_state.md`.

| Doc | Audience-agent content |
|---|---|
| `architecture.md` | Parent segment (name, ID, output database, profiles); `customers` + behavior tables in scope; the agent in `.claude/skills/<agent-name>/` with its two context files; read-only by default, segments drafted as YAML and pushed only on approval |
| `behavior.md` | What the agent knows for this customer: business model, the definitions it applies (lead, conversion, VIP, …), product categories, priority attributes, naming convention, exclusion and compliance rules, output preferences — plain English |
| `eval_summary.md` | The latest passing round from `eval.md`: the 10 prompts in business words, result per prompt, score, known limitations |
| `runbook.md` | Resume a session (`project_state.md`); refresh `schema.json` and the data dictionary after parent-segment changes; update the business context; rebuild the agent; run an eval round; where segment drafts live and how a push is approved; share the agent via Develop → Share |
| `access_ownership.md` | Agent owner, customer stakeholders, tdx account/site, parent segment owner, engagement folder, escalation path |
