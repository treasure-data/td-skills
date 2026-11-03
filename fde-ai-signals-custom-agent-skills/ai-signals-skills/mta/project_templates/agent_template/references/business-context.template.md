<!--
PURPOSE OF THIS FILE
The customer's business knowledge that the MTA agent cannot learn from the data: business
jargon, channel names and groupings, what a conversion is, buying cycles, data edge cases, goals
and exclusion rules. The agent reads it every session and applies its definitions over generic ones.
How the attribution models work does NOT belong here — it is in ai-signals-guide.md,
data-dictionary.md and the workflow guide.

HOW TO USE
Skeleton — never filled in place, never installed. Copied in Phase 1 to
  agent_outputs/<project_slug>/business-context.md
(shared/playbook.md, Phase 1 business context). Open questions go to the customer through the
requirements doc; answers are merged in Phase 4 Part B; the file is confirmed in Phase 5. Every
agent build copies the engagement file into the agent's references/.

AUTHORING RULES (for the engagement copy)
- Replace each question with a terse answer bullet once known. Reader is the agent: concrete and
  imperative ("Treat channel `crm` as owned email and SMS", "A conversion = a row in `<table>` with `order_status = 'COMPLETE'`").
- Mark answers inferred from the data `[INFERRED — please confirm]`; keep unanswered questions as
  `- [NEEDS YOUR INPUT] <question>`. Remove a marker once the customer has answered or confirmed. Use only these
  two markers — no others.
- Business knowledge only: no notes on how this setup is run (test scope, resources to leave alone,
  approvals) — those belong in project_state.md.
- Real table, column and value names in backticks; aggregates only — never raw customer records,
  names, emails or other PII.
- Keep every section to a few bullets. Delete this comment and the line under the title in the copy.
-->

# {{project_name}} — Business Context

*Questions to consider are listed under each heading; answer the ones that apply.*

## Business Overview
- What does the company sell, and to whom (B2C, B2B, both)?
- Where do customers buy or convert (website, app, stores, sales reps, partners), and which matters most?
- Which marketing channels does the team run (paid search, paid social, display, affiliates, email, SMS, direct mail, events)?
- Which regions or markets does the data cover, and do channels or campaigns differ between them?

## Customers and Identity
- Who counts as a customer — any visitor with a profile, a registered account, or only buyers?
- Can one person have several IDs or devices (logged-out visits, households, B2B accounts with several contacts)?
- Which profiles are test, internal, employee, partner or bot traffic, and how are they identified?

## Key Terms and Definitions
- Which channel names does the team use, and how do they map to the channel values in the data (UTM medium, source, campaign)?
- Are there channel groupings or naming conventions (brand vs. non-brand search, prospecting vs. retargeting, owned vs. paid)?
- What do the team's campaign, mailing and tactic names mean, and which naming patterns matter?
- Which internal labels or KPIs (lead, MQL, booking, application, sign-up) does the team use?

## Buying Cycle and Seasonality
- How long does a typical customer take from the first touch to converting (days, weeks, months)?
- How often do customers convert again (repeat purchases, renewals), and does only the first conversion matter?
- Which seasons, holidays, promotions or launches create peaks or quiet periods?
- Are there one-off events (campaign bursts, tracking changes, site migrations) that distort the history?

## Data Intricacies and Edge Cases
- Which records should be ignored or treated specially (cancelled or returned orders, test orders, email sends and deliveries, bot traffic)?
- Which touchpoints are not tracked or only partly tracked (offline sales, call center, impressions, logged-out visits)?
- Are UTM parameters used consistently, or did tagging or channel naming change over time?
- Are there known gaps, duplicates, late-arriving data or time zone differences between the sources?

## Goals and Use Cases
- Which decisions should the attribution support (budget allocation, channel mix, campaign optimization, proving a channel's value)?
- Which KPIs does the team report on (conversions, revenue, cost per acquisition, return on ad spend)?
- Who will use the agent and the dashboard, and what decisions will they make with them?

## Rules and Exclusions
- Which channels, campaigns or audiences must be excluded from the analysis or never surfaced?
- Which columns are sensitive and must only be shown as counts or aggregates?
- Are there compliance or consent rules (opted-out customers, regulated products) to respect?

## MTA Definitions
- What exactly counts as a conversion (completed order, confirmation page, form submit, application, sign-up), and are there secondary or micro-conversions?
- Does a conversion carry a value (revenue) or is it only counted?
- Which touchpoints count (e.g. email opens and clicks, not sends), and which events must not be credited?
- How long before a conversion should touchpoints still get credit (the journey window)?
- Which attribution view does the team trust or report today (last touch, a platform's own model), and what would they compare against?
