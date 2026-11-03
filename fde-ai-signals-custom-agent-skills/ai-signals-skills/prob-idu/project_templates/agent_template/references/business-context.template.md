<!--
PURPOSE OF THIS FILE
The customer's business knowledge that the probabilistic ID unification agent cannot learn from the data: what counts as the
same person, how identifiers are collected, what a wrong merge costs, merge rules and exclusions. The agent reads it every
session and applies its definitions over generic ones.
How the unification works does NOT belong here — it is in ai-signals-guide.md, data-dictionary.md and the workflow guide.

HOW TO USE
Skeleton — never filled in place, never installed. Copied in Phase 1 to
  agent_outputs/<project_slug>/business-context.md
(shared/playbook.md, Phase 1 business context). Open questions go to the customer through the requirements doc; answers are
merged in Phase 4 Part B; the file is confirmed in Phase 5. Every agent build copies the engagement file into the agent's references/.

AUTHORING RULES (for the engagement copy)
- Replace each question with a terse answer bullet once known. Reader is the agent: concrete and imperative.
- Mark answers inferred from the data `[INFERRED — please confirm]`; keep unanswered questions as
  `- [NEEDS YOUR INPUT] <question>`. Remove a marker once the customer has answered or confirmed. Use only these two markers.
- Business knowledge only: no notes on how this setup is run (test scope, approvals) — those belong in project_state.md.
- Real table, column and value names in backticks; aggregates only — never raw customer records, names, emails or other PII.
- Keep every section to a few bullets. Delete this comment and the line under the title in the copy.
-->

# {{project_name}} — Business Context

*Questions to consider are listed under each heading; answer the ones that apply.*

## Business Overview
- What does the company sell, and to whom (B2C, B2B, both)?
- Which channels and touchpoints create customer records (online, stores, app, call center, partners)?
- Which regions, brands or business units does the data cover, and do their identifiers differ?
- Which team owns the unified customer view (marketing, CRM, data, compliance)?

## Customers and Identity
- What is "one customer" — a person, a household, an account with several contacts?
- How many IDs per customer do you expect (several devices, shared emails, guest checkouts, re-registrations)?
- Which identifiers are reliable (email, phone, address, name) and which are shared or often wrong (family phone, `noreply@`, office address)?
- Which profiles are test, internal, employee or partner accounts, and how are they identified?

## Key Terms and Definitions
- What do the team call the unified result (golden record, master customer, household)?
- When are two IDs "the same person" — same email, same phone, or similar name and address?
- How is a duplicate defined for the business (counted twice in a campaign, two loyalty accounts)?
- Which terms do you use for match confidence (certain, likely, needs review)?

## Buying Cycle and Seasonality
- How often do customers create new records (every purchase, each visit, once per year)?
- Do peaks (sales, launches) bring many guest or one-time records?
- Do contact details change with life events (moves, new phone numbers), and how quickly?
- Are there one-off events (migrations, system merges, imports) that created many duplicates?

## Data Intricacies and Edge Cases
- Which values are placeholders and must not match (`unknown`, `0000000000`, `test@example.com`)?
- Which fields are free text and typo-prone (address, name), and which are validated (email, phone)?
- How much of each identifier is missing, and are some sources systematically empty?
- Were records already merged or split by deterministic rules that the fuzzy match should respect?

## Goals and Use Cases
- What does the unified view feed (campaign suppression, reporting counts, personalization, service)?
- What costs more: a missed duplicate (double mailing, inflated counts) or a wrong merge (mixed-up customers)?
- Which KPI will judge the result (duplicates removed, audience size, wasted spend, complaint rate)?
- Who reviews the matches, and how many clusters can they sample?

## Rules and Exclusions
- Which customers must never be merged (regulated accounts, different legal entities, minors)?
- Which attributes must not be used to match for compliance reasons?
- Which columns are sensitive and must only be shown as counts or aggregates?
- Are there consent or retention rules that change what a merged profile may keep?

## Probabilistic ID Unification Definitions
- Which identifier columns should be compared, and what weight does each deserve?
- Which clusters would you accept without review, and which size is too large for one person?
- How many IDs per person are plausible at most?
- Should the unified ID replace the deterministic ID downstream, or sit beside it?
