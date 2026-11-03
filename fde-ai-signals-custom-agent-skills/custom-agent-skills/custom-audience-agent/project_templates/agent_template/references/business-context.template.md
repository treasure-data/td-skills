<!--
PURPOSE OF THIS FILE
The customer's business knowledge that the audience agent cannot learn from the data: what they
sell, what their terms mean (lead, conversion, VIP, churn), how products are categorized, which
attributes matter, how segments are named, and which compliance and exclusion rules are
non-negotiable. The agent reads it every session and applies it over generic interpretations.
Column-level facts (types, null %, table grain) belong in data-dictionary.md.

HOW TO USE
Skeleton — never filled in place, never installed. Copied in Phase 2 to
  agent_outputs/<project_slug>/business-context.md
(shared/playbook.md, Phase 2). Open questions go to the customer through requirements.md;
answers are merged back; the file is confirmed in Phase 5. Every agent build copies the
engagement file into the agent's references/.

AUTHORING RULES (for the engagement copy)
- Replace each question with a terse answer bullet once known. Reader is the agent: concrete and
  imperative, with real column names and values in backticks.
  "A lead = a profile with `lead_status` IN ('MQL', 'SQL')", "Never output raw `email` values".
- Mark answers inferred from the data `[INFERRED — please confirm]`; keep unanswered questions as
  `- [NEEDS YOUR INPUT] <question>`. Remove a marker once the customer has answered or confirmed.
  Use only these two markers.
- Business knowledge only — no notes on how the setup is run (those go in project_state.md).
- Aggregates only — never raw customer records, names, emails or other PII.
- Keep each section to a few bullets; this file is read on every session. Delete this comment
  and the line under the title in the copy.
-->

# {{project_name}} — Business Context

*Questions to consider are listed under each heading; answer the ones that apply.*

## Business Model
- What does the company sell, and to whom (B2C, B2B, both)?
- Which sales channels exist, and which column values represent them (e.g. `preferred_channel`: Online, In-Store, Mobile)?
- Which regions, brands or business units does the data cover?

## Business KPIs
- Which 3–6 metrics matter most (LTV, repeat purchase rate, conversion rate, email engagement)?
- How is each one calculated from the data (column or behavior table and rule)?

## Key Terms and Definitions
- What exactly is a **lead**, a **customer**, an **active** customer, a **churned** customer (conditions on columns or behaviors, with time windows)?
- Which events count as a **conversion** (purchase, sign-up, application, booking) — which behavior table and which values?
- Which internal labels does the team use (VIP, high-value, at-risk, new), and what condition defines each?

## Product Categories
- How are products grouped (department, category, brand, line), and in which column?
- Which category names does the business use, and how do they map to the values in the data?
- Are there products or categories that must be treated specially (gift cards, services, discontinued)?

## Priority Attributes
- Which 5–10 attributes and behaviors should the agent weight most for audience questions?
- Which values or formats need care (empty string = not enrolled, text dates, arrays)?

## Segment Naming Conventions
- Which prefixes, suffixes or folders does the team use for segments?
- If none: use descriptive Title Case names, e.g. "VIP Customers - No Purchase 90 Days".

## Exclusion and Compliance Rules
- Which columns must never be shown as raw values (email, names, phone, address, IDs) — counts or aggregates only?
- Which consent or opt-out rules apply to audiences (unsubscribed, no marketing consent, do-not-contact) and in which columns?
- Which profiles must always be excluded (test, internal, employee accounts, minors, regulated groups)?
- Are there regulatory or contractual rules (GDPR, CCPA, industry rules, contact-frequency limits) the agent must respect?

## Target Users & Tone
- Who uses the agent (marketing, analytics, CRM, executives), and what decisions do they make with it?
- Any tone override? Default: neutral, professional marketing analyst — concise, data-grounded.

## Output Preferences
- Default format: one-sentence summary first, table for top-N lists, chart for distributions and trends?
- Brand palette (hex values) or "none"; number and date formats; language.

## SQL Templates
- Recurring query patterns the team wants reused (one block per template: "Use when", then SQL with real table and column names, no `LIMIT`, no hard-coded dates). Delete this section if there are none.
