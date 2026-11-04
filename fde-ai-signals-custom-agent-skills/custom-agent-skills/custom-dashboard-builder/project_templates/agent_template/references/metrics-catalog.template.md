<!--
PURPOSE OF THIS FILE
Every metric on the dashboard (and every metric added later): definition, formula, source,
exclusions, validated value and where it appears. The dashboard agent reads it to explain numbers
and to add new metrics consistently.

HOW TO USE
Skeleton — never filled in place, never installed. Written by the builder (Step 4) to agent_outputs/<project_slug>/metrics-catalog.md from the
confirmed formulas, generate-data.js and the spot-checks.
Every agent build copies the engagement file into the agent's references/. Fill every [bracketed]
field; delete sections that don't apply and this comment in the copy. Aggregates only — never raw
customer records or PII.
-->

# {{project_name}} — Metrics Catalog

## Catalog

One row per dashboard metric. Used to answer "what does X mean?", "why is X different from Y?" and to add a metric consistently.

| Metric (as shown) | SQL formula | Source table | Exclusion rules | Validated value (date) | Dashboard location |
|---|---|---|---|---|---|
| [Metric] | `[formula]` | `[table]` | [rules] | [value] ([date]) | [tab / widget] |

## Metric Notes

## [Category 1: Primary Revenue or Key Business Area]

**[Metric 1]**
- Definition: [What it measures]
- Source: `[table].[column]`
- Validated value: [Value] ([note if variance or reconciliation exists])
- Use when: [Context — when to quote this metric]
- NL phrasings: "[phrase 1]", "[phrase 2]", "[phrase 3]"

**[Metric 2]**
- Definition: [What it measures]
- Source: `[table].[column]`
- Confirmed: [Value]
- NOTE: [Critical notes — e.g., "This is [entity]-based, not transaction-based"]

---

## [Category 2: Funnel or Process Metrics]

**[Metric]**
- Definition: [Numerator] ÷ [Denominator]
- Confirmed: [Value] ([Count numerator] out of [Count denominator])

---

## [Category 3: Marketing/Engagement Metrics]

**[Metric with Multiple Valid Definitions]**

> ⚠️ **Always report BOTH definitions together** — never collapse to one number.
> Customer-confirmed rule: users asking "what's the [metric]?" must always see both values
> and which definition each uses, so they can choose which to cite.

- **Definition A (unique-recipient basis):** [Definition A text — e.g., "% of distinct recipients who opened at least one email"]
  - SQL: `[numerator_col] / [denominator_col]` FROM `[summary_table]`
  - Validated value: [Value]% ([N numerator] / [N denominator])
  - Use when: reporting reach (how many people engaged)

- **Definition B (total-event basis):** [Definition B text — e.g., "% of total sends that resulted in an open, counting repeat opens"]
  - SQL: `SUM([event_col WHERE event='Opened']) / SUM([event_col WHERE event='Sent'])` FROM `[daily_table]`
  - Validated value: [Value]% ([N events] / [N total])
  - Use when: reporting volume (how much engagement activity)

- **NL phrasings:** "[metric name]", "[metric name] rate", "how many [entities] [action]ed", "what's our [metric]"

> **Whole-range vs narrowed-range:** For the full date range, use exact counts from `[summary_table]`.
> For a narrowed range, only an approximation is available — say so explicitly.

---

## [Category N: Additional Areas]

**[Metric]**
- Definition: [What it measures]
- Confirmed: [Value]

---

## Data Freshness & Quality

- All SINK tables refresh [daily/weekly] at [TIME] UTC
- Source: [source_database] → SINK: [sink_database]
- Data range: [START_DATE] – present
- Variance notes:
  - [Metric 1]: [Reconciliation — e.g., "3% grain delta, acceptable"]
  - [Metric 2]: [Note — e.g., "Two valid definitions, both shown above"]
