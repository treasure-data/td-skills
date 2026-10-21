<!--
PURPOSE OF THIS FILE
The customer's business knowledge that the RFM agent cannot learn from the data: business
jargon, definitions (customer, high-value, lapsed), buying cycles, data edge cases, goals and
exclusion rules. The agent reads it every session and applies its definitions over generic ones.
How the RFM model works does NOT belong here — it is in ai-signals-guide.md, data-dictionary.md
and the workflow guide.

HOW TO USE
Skeleton — never filled in place, never installed. Copied in Phase 1 to
  agent_outputs/<project_slug>/business-context.md
(shared/playbook.md, Phase 1 business context). Open questions go to the customer through the
requirements doc; answers are merged in Phase 4 Part B; the file is confirmed in Phase 5. Every
agent build copies the engagement file into the agent's references/.

AUTHORING RULES (for the engagement copy)
- Replace each question with a terse answer bullet once known. Reader is the agent: concrete and
  imperative ("Treat orders with status `test` as internal", "A lead = a form fill in `<table>`").
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
- Which sales channels exist (online, stores, app, sales reps, partners), and which matters most?
- Which regions or markets, currencies and time zones does the data cover?
- Are there brands, business units or product lines that should be analyzed separately?

## Customers and Identity
- Who counts as a customer — anyone with a profile, a registered account, or only buyers?
- Can one person have several IDs or accounts (households, B2B accounts with several contacts)?
- Which profiles are test, internal, employee or partner accounts, and how are they identified?

## Key Terms and Definitions
- Which business terms does the team use (VIP, active, lapsed, churned, lead, loyal), and what exactly does each mean in the data?
- What counts as a conversion or a purchase?
- Are there internal tiers or labels (loyalty levels, account grades) the agent should know about?

## Buying Cycle and Seasonality
- How often does a typical customer buy, and how long is the sales cycle?
- Which seasons, holidays, promotions or launches create peaks or quiet periods?
- Are there one-off events (migrations, store closures, campaigns) that distort the history?

## Data Intricacies and Edge Cases
- Which records should be ignored or treated specially (refunds, cancellations, bulk or B2B orders, zero-value orders, gifts)?
- Are amounts gross or net, with or without tax and shipping, in one currency?
- Are there known gaps, duplicates, late-arriving data or tracking changes in the sources?

## Goals and Use Cases
- Which business goals should the segments support (retention, win-back, upsell, loyalty, budget allocation)?
- Which KPIs does the team report on?
- Who will use the agent and the segments, and what decisions will they make with them?

## Rules and Exclusions
- Who must never be targeted or surfaced (opted-out, minors, regulated groups, employees)?
- Which columns are sensitive and must only be shown as counts or aggregates?
- Are there compliance, consent or contact-frequency rules to respect?

## RFM Definitions
- Which events count as a purchase, and which value represents it (order total, item price, net revenue)?
- What is a normal time between purchases — after how long is a customer lapsed or lost?
- How does the business define a high-value customer (spend threshold, top percentage, tier)?
- Which RFM segments matter most, and which action should each one trigger?
- Should any of the customer's own tier names map to RFM segments?
