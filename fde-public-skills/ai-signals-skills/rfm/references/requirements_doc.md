# RFM Customer Segmentation — Requirements Doc Body

Phase 2 body for `agent_outputs/<project_slug>/requirements.md` (title `<Project Name> Requirements`). Mechanics — writing, hand-off, reading it back — are in `../../shared/playbook.md` (Phase 2 and Phase 4).

Write the doc for the customer to fill in: one `> _Your answer:_` line under each question, Phase 1 findings pre-filled and marked `[INFERRED — please confirm]`, open questions marked `[NEEDS YOUR INPUT]`. Do not include config parameter names in the customer-facing doc — the mapping table at the end of this file is for you.

> **How to ask (when the user answers in chat instead of the doc):** always use `AskUserQuestion`, never a plain-text list. Batches of up to 4 questions per call; 2–4 options per question with the recommended default marked `(Recommended)`; the implicit "Other" lets the user type their own answer.

Not asked here — confirmed by the name gates in Phase 3: the output (sink) database and the workflow project name.

---

## Doc body

Title, one-line purpose ("These answers let us configure RFM (Recency, Frequency, Monetary) segmentation for your customer profiles"), a target return date, then these sections:

### 1. Use case and audience

1. Which decisions will the segments drive? (e.g. win-back journeys, loyalty offers, VIP treatment, suppression of lost customers, budget allocation)
2. Who will use the segments and the dashboard (marketing ops, CRM, analytics)?
3. Which Parent Segment should receive the RFM scores as attributes?

### 2. Customer identity

4. Which ID identifies a customer across all your tables (the one your Parent Segment joins on)? Pre-fill from Phase 1.

### 3. Activity sources

5. Confirm the source tables found in Phase 1 (table, what it records, profile ID column, event-time column). Every source counts toward how recently and how often a customer engages. Add any missing source (support tickets, store visits, app events, loyalty check-ins, …).
6. For each source: which rows should be excluded? (email sends/bounces, cancelled or returned orders, test/internal records, bots)

### 4. Monetary value

7. Which column holds the purchase value (e.g. order total, item price, revenue)? Should it be gross or net of discounts? If you have no purchase data, say so — segments will then rank on recency and frequency only.

### 5. History window

8. Score on all history, a rolling window (e.g. last 12 or 24 months, re-evaluated on every run) or a fixed date range? (Recommended for a first setup: all history.)

### 6. Segments

9. The workflow assigns ten standard segments (Champions, Loyal Customers, Potential Loyalists, Promising, New Customers, Cannot lose them, Need attention, Hibernating, High Value Sleeping, Lost customers). Which matter most for your campaigns? Do you use different names for any of them?

### 7. Schedule and notifications

10. **Run schedule** — how often should scores refresh? (Recommended: monthly; weekly for fast-moving businesses.)
11. Which email address should receive workflow failure alerts?

### 8. Business context

The questions still marked `[NEEDS YOUR INPUT]` in `business-context.md` that sections 1–7 don't already ask, grouped under that file's headings (playbook Phase 2 step 4). Omit the section if none are left.

Close with: "When done, save this file and send it back to the person who shared it with you."

---

## Answer → config mapping (for Phase 4)

Parameter meanings are in the template `README.md` (Configuration); choosing rules in `workflow-setup.md`.

| Question | Sets |
|---|---|
| 3 | Parent Segment used in Phase 5 (`references/parent_segment.md`) |
| 4 | `globals.canonical_id`, each source's `join_key` |
| 5 | `aggregate_metrics_tables` entries (`src_table`, `name`, `unixtime_col`, `context_col`) |
| 6 | each source's `custom_filter`; `query_type: custom` if a source needs de-duplication |
| 7 | `order_amount` on the monetary source(s); `0.0` elsewhere |
| 8 | `time_filter_type`, `lookback_period` or `time_range_start_date`/`time_range_end_date`, `apply_time_filter` on every source and the top-level label |
| 9 | Example audiences in Phase 5; the customer's own names → `business-context.md` (RFM Definitions) so the agent uses them. The segment rules are fixed by the AI Signals model and cannot be changed |
| 10 | `schedule` in `rfm_launch.dig` |
| 11 | `_error` → `to:` in `rfm_launch.dig` |

Questions 1–2, 7 (gross / net), 9 (segment priorities) and every section 8 answer also go into `business-context.md` (playbook Phase 4 Part B step 4); questions 1–2 feed the documentation set.

Before editing the config in Phase 4, show the user a summary of planned changes (customer, sources and what each adds to R/F/M, filters, monetary column, history window, scoring model, segment changes, schedule, alert email) and wait for approval.
