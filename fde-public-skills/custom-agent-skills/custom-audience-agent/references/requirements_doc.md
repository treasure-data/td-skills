# Custom Audience Agent — Requirements Doc Body

Phase 2 body for `agent_outputs/<project_slug>/requirements.md` (title `<Project Name> Requirements`). Mechanics — writing, hand-off, merging the answers back — are in `../../shared/playbook.md` (Phase 2).

Write it for the customer: purpose line ("These answers teach your audience agent your business terms and rules. Answers below were drafted from your parent segment `<PS>` — please review, correct or expand."), a target return date, then one section per `business-context.md` heading that still has open or inferred items. Under each: the question in business words, the drafted answer marked `[INFERRED — please confirm]` or `[NEEDS YOUR INPUT]`, and `> _Your answer:_`. No column syntax beyond the names the customer would recognize; no raw records; no notes on how the draft was made.

## Sections (in order — skip a section with nothing open)

| # | Section | Ask about |
|---|---|---|
| 1 | Business model | What you sell, to whom, main channels — confirm the channel / region values found |
| 2 | Business KPIs | The 3–6 metrics that matter, and how each is measured |
| 3 | Key terms and definitions | Lead, customer, active, churned, VIP and other labels; which events count as a conversion — confirm or correct each drafted definition |
| 4 | Product categories | How products are grouped and named; category values to map; special products |
| 5 | Priority attributes | The attributes and behaviors that matter most for your audiences |
| 6 | Segment naming | Naming conventions and folders for new audiences |
| 7 | Exclusion and compliance | Columns never to show, consent / opt-out rules, profiles always excluded, regulatory rules — confirm each drafted rule |
| 8 | Users, tone and output | Who will use the agent, tone, chart and format preferences, brand palette |
| 9 | Reusable queries | Recurring questions or SQL the team wants the agent to reuse |

Close with: "When done, save this file and send it back to the person who shared it with you."

## Answer → file mapping

Every answer goes into the section of the same name in `agent_outputs/<project_slug>/business-context.md` (terse, imperative, real column names and values; remove the marker of each answered item). An answer that reveals a data fact (a column's meaning, a different event-time column) also updates `data-dictionary.md`. After merging: rebuild the agent (Phase 3) and run a new eval round (Phase 4) — the prompts testing changed definitions or rules are updated first.
