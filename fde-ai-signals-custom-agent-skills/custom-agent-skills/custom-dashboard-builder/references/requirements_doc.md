# Dashboard Builder — Requirements Doc Body

Body for `agent_outputs/<project_slug>/requirements.md` (title `<Project Name> Requirements`), written only when the user asks for a customer questionnaire. Purpose line: "These answers make your dashboard and its assistant use your business terms and rules. Answers below were drafted from your requirements session and your data — please review, correct or expand." Then a target return date and one section per `business-context.md` heading that still has open or inferred items: the question in business words, the drafted answer marked `[INFERRED — please confirm]` or `[NEEDS YOUR INPUT]`, and `> _Your answer:_`. No SQL, no raw records, no notes on how the draft was made.

## Sections (in order — skip a section with nothing open)

| # | Section | Ask about |
|---|---|---|
| 1 | Business overview | The part of the business the dashboard covers; regions, brands, channels in scope |
| 2 | Purpose and audience | The decisions it supports, who reads it, what success looks like |
| 3 | Key terms and definitions | Business terms used on the dashboard or in questions; category and status names |
| 4 | Metric meaning | Each headline KPI in business words — includes / excludes, expected range; metrics with two valid definitions |
| 5 | Data caveats | Known gaps, delays, tracking changes; questions the data cannot answer |
| 6 | Exclusion and compliance | Records always excluded; sensitive columns; who may see which numbers |
| 7 | Goals and follow-up questions | Questions the assistant should answer beyond the dashboard; metrics likely to be added |
| 8 | Output preferences | Formats, language, brand colors, answer style |

Close with: "When done, save this file and send it back to the person who shared it with you."

## Answer → file mapping

Every answer goes into the section of the same name in `agent_outputs/<project_slug>/business-context.md` (terse, imperative, real columns and values; remove the marker of each answered item). An answer that changes a metric formula or filter also updates `metrics-catalog.md` and — through the dashboard skill's add-or-change flow — the dashboard. After merging: rebuild the dashboard skill (`agent-setup.md` Rebuilds); if an evaluation was run before, offer a new round.
