<!--
PURPOSE OF THIS FILE
The customer's business knowledge that the NBP agent cannot learn from the data: business
jargon, definitions (customer, purchase, preference signal, good recommendation), buying cycles,
data edge cases, goals and exclusion rules. The agent reads it every session and applies its
definitions over generic ones.
How the NBP model works does NOT belong here — it is in ai-signals-guide.md, data-dictionary.md
and the workflow guide.

HOW TO USE
Skeleton — never filled in place, never installed. Copied in Phase 1 to
  agent_outputs/<project_slug>/business-context.md
(shared/playbook.md, Phase 1 business context). Open questions go to the customer through the
requirements doc; answers are merged in Phase 4 Part B; the file is confirmed in Phase 5. Every
agent build copies the engagement file into the agent's references/.

AUTHORING RULES (for the engagement copy)
- Replace each question with a terse answer bullet once known. Reader is the agent: concrete and
  imperative ("Treat orders with status `test` as internal", "A purchase = a row in `<table>` with `order_status = 'completed'`").
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
- How large and how varied is the product catalog (number of products, categories, brands)?
- Which sales channels exist (online, stores, app, sales reps, partners), and which matters most?
- Which regions or markets does the data cover, and do catalogs differ between them?

## Customers and Identity
- Who counts as a customer — anyone with a profile, a registered account, or only buyers?
- Can one person have several IDs or accounts (households, B2B accounts with several contacts)?
- Which profiles are test, internal, employee or partner accounts, and how are they identified?

## Key Terms and Definitions
- Which business terms does the team use (SKU, product, variant, style, collection, basket), and what exactly does each mean in the data?
- Is a recommendable item a SKU, a product family or a style (sizes and colors grouped)?
- How are categories defined — which level of the product hierarchy should the agent report on?
- Are there internal labels (bestseller, new arrival, hero product, private label) the agent should know about?

## Buying Cycle and Seasonality
- How often does a typical customer buy, and how many different products per order?
- Which products are bought once (durables) and which are bought repeatedly (consumables, refills)?
- Which seasons, holidays, promotions or launches create peaks or quiet periods?
- Are there one-off events (catalog migrations, store closures, campaigns) that distort the history?

## Data Intricacies and Edge Cases
- Which records should be ignored or treated specially (returns, cancellations, bulk or B2B orders, zero-value lines, free samples)?
- Are discontinued, out-of-stock or renamed products still in the data, and how are they recognized?
- Do item names or categories change over time, or is one SKU shared by several products?
- Are there known gaps, duplicates, late-arriving data or tracking changes in the sources?

## Goals and Use Cases
- Which business goals should the recommendations support (cross-sell, upsell, repeat purchase, discovery, clearing stock)?
- Which channels will use the recommendations (email, web, app, call center, ads)?
- Which KPIs does the team report on (click-through, conversion, revenue per recipient, catalog coverage)?
- Who will use the agent and the recommendations, and what decisions will they make with them?

## Rules and Exclusions
- Who must never be targeted or surfaced (opted-out, minors, regulated groups, employees)?
- Which columns are sensitive and must only be shown as counts or aggregates?
- Are there compliance, consent or contact-frequency rules to respect?

## NBP Definitions
- Which interactions count as a purchase or preference signal (orders, order lines, add-to-cart, views, wish lists)?
- Which items must never be recommended (gift cards, services, shipping fees, out-of-stock, age-restricted, internal items)?
- May items the customer already purchased be recommended again (consumables, refills), or must they be left out?
- How many recommendations are used per channel or placement, and is the order of ranks important?
- What does a good recommendation look like for this business (same category, complementary item, higher price, new arrival)?
