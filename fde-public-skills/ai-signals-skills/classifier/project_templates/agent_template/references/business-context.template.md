<!--
PURPOSE OF THIS FILE
The customer's business knowledge that the classifier agent cannot learn from the data: business
jargon, the definition of the predicted outcome and of the population, what the scores will be
used for, data edge cases, goals and exclusion rules. The agent reads it every session and applies
its definitions over generic ones.
How the classifier works does NOT belong here — it is in ai-signals-guide.md, data-dictionary.md
and the workflow guide.

HOW TO USE
Skeleton — never filled in place, never installed. Copied in Phase 1 to
  agent_outputs/<project_slug>/business-context.md
(shared/playbook.md, Phase 1 business context). Open questions go to the customer through the
requirements doc; answers are merged in Phase 4 Part B; the file is confirmed in Phase 5. Every
agent build copies the engagement file into the agent's references/.

AUTHORING RULES (for the engagement copy)
- Replace each question with a terse answer bullet once known. Reader is the agent: concrete and
  imperative ("A conversion = a row in `<table>` with `status = 'won'` within 90 days of the cut-off",
  "Call scores of 0.8+ 'hot leads'").
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
- Which sales channels and touchpoints exist (online, stores, app, sales reps, partners)?
- Which regions, brands or business units does the data cover, and do they behave differently?
- Which team owns the outcome the model predicts (sales, retention, marketing, risk)?

## Customers and Identity
- What is one entity in this model — a person, a lead, an account, a household, a subscription?
- Can one entity have several IDs or records (duplicate leads, B2B accounts with several contacts)?
- Which profiles are test, internal, employee or partner accounts, and how are they identified?

## Key Terms and Definitions
- What exactly counts as the positive outcome (converted, churned, responded, renewed), and as which event or status in the data?
- What are the stages or statuses an entity goes through (lead stages, subscription states, lifecycle stages)?
- Which terms does the team use for scored audiences (hot / warm / cold leads, at-risk customers, likely responders)?
- How are activity, engagement and value defined (active customer, engaged lead, high-value account)?

## Buying Cycle and Seasonality
- How long does it usually take from the first signal to the outcome (days to convert, months before churn)?
- How long after the outcome is it visible in the data (late-arriving orders, cancellations processed monthly)?
- Which seasons, promotions, launches or renewal dates create peaks or quiet periods?
- Are there one-off events (pricing changes, migrations, campaigns) that distort the history?

## Data Intricacies and Edge Cases
- Which records should be ignored or treated specially (refunds, reactivations, trial accounts, bulk imports)?
- Which fields are filled only after the outcome (cancellation reason, closed-won date, final status) and must never be used as features?
- Do statuses, plans or categories change meaning over time, or were they renamed?
- Are there known gaps, duplicates, late-arriving data or tracking changes in the sources?

## Goals and Use Cases
- What action follows a high score (sales call, retention offer, campaign, suppression), and through which channel?
- What does a wasted action cost compared with a missed positive?
- Which KPIs will judge the model (conversion rate of flagged leads, churn saved, campaign response)?
- Who will use the scores and the agent, and what decisions will they make with them?

## Rules and Exclusions
- Who must never be scored or targeted (opted-out, minors, regulated groups, employees, customers in legal disputes)?
- Which attributes must not be used as features for compliance or fairness reasons (age, gender, location, health)?
- Which columns are sensitive and must only be shown as counts or aggregates?
- Are there contact-frequency or consent rules for the audiences built from the scores?

## Classifier Definitions
- Exactly which entities are in the population to score, and as of when?
- How long after the cut-off should the outcome count (the outcome window)?
- Is a yes/no label needed per entity, or only a ranking (top 10%, deciles, buckets)? Is there an existing score cut-off?
- Which matters more: few false alarms (precision) or few missed positives (recall)?
- How should score levels be named for the business (e.g. 0.8+ "hot", 0.5–0.8 "warm")?
