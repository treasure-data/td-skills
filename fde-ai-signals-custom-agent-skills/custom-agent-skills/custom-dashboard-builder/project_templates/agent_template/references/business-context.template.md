<!--
PURPOSE OF THIS FILE
The customer's business knowledge behind the dashboard that the dashboard agent cannot learn from
the data: what the business does, who reads the dashboard and for which decisions, what the terms
and metrics mean in business words, and which rules (exclusions, compliance, naming) are
non-negotiable. The agent reads it every session and applies it over generic interpretations.
Table and column facts belong in data-dictionary.md; formulas and SQL in metrics-catalog.md.

HOW TO USE
Skeleton — never filled in place, never installed. Written by the builder (Step 4) to
  agent_outputs/<project_slug>/business-context.md
Open questions go to the customer through requirements.md; answers are merged back; the file is
confirmed later by the user or customer. Every agent build copies the engagement file into the agent's references/.

AUTHORING RULES (for the engagement copy)
- Replace each question with a terse answer bullet once known. Reader is the agent: concrete and
  imperative, with real column names and values in backticks.
  "Revenue excludes refunds (`order_status = 'refunded'`)", "Call the West region 'Pacific'".
- What the user said at intake is a plain fact. Mark inferences from the data
  `[INFERRED — please confirm]`; keep unanswered questions as `- [NEEDS YOUR INPUT] <question>`.
  Remove a marker once answered or confirmed. Use only these two markers.
- Business knowledge only — no notes on how the setup is run (those go in project_state.md).
- Aggregates only — never raw customer records or PII.
- Keep each section to a few bullets. Delete this comment and the line under the title in the copy.
-->

# {{project_name}} — Business Context

*Questions to consider are listed under each heading; answer the ones that apply.*

## Business Overview
- What does the company do, and which part of the business does this dashboard cover?
- Which regions, brands, channels or business units are in scope, and which column values represent them?

## Dashboard Purpose and Audience
- Which decisions does the dashboard support, and how often is it reviewed?
- Who reads it (executives, managers, analysts), and what does each need — headlines, breakdowns, raw numbers?
- What would make the dashboard a success (time saved, a report replaced, a KPI watched)?

## Key Terms and Definitions
- Which business terms appear on the dashboard or in questions about it (active customer, booking, lead, conversion), and what exactly does each mean in the data?
- Which category, status or segment names does the team use, and how do they map to the values in the data?

## Metric Meaning
- For each headline KPI: what it means in business words, what it includes and excludes, and the expected range (benchmark)?
- Which metrics have more than one valid definition, and which one should be quoted by default?

## Data Caveats
- Which periods, sources or records are known to be incomplete, delayed or distorted (tracking changes, migrations, late data)?
- Which questions can the data not answer (missing tables or columns), so the agent should say so?

## Exclusion and Compliance Rules
- Which records are always excluded (test accounts, internal users, cancelled or refunded transactions)?
- Which columns are sensitive and must only be shown as aggregates (PII, revenue per person, health or financial data)?
- Are there regulatory, consent or contractual rules for who may see which numbers?

## Goals and Follow-up Questions
- Which questions beyond the dashboard should the agent be ready to answer (the Step 1r scope)?
- Which metrics or breakdowns are likely to be added next?

## Output Preferences
- Number, currency, date and timezone formats; language; brand colors (the dashboard theme)?
- Default answer style: headline first, table for top-N lists, chart for trends?
