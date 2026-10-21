# MTA (Multi-Touch Attribution) — Requirements Doc Body

Phase 2 body for `agent_outputs/<project_slug>/requirements.md` (title `<Project Name> Requirements`). Mechanics — writing, hand-off, reading it back — are in `../../shared/playbook.md` (Phase 2 and Phase 4).

Write the doc for the customer to fill in: one `> _Your answer:_` line under each question, Phase 1 findings pre-filled and marked `[INFERRED — please confirm]`, open questions marked `[NEEDS YOUR INPUT]`. Do not include config parameter names in the customer-facing doc — the mapping table at the end of this file is for you.

> **How to ask (when the user answers in chat instead of the doc):** always use `AskUserQuestion`, never a plain-text list. Batches of up to 4 questions per call; 2–4 options per question with the recommended default marked `(Recommended)`; the implicit "Other" lets the user type their own answer.

Not asked here — confirmed in Phase 3: the output (sink) database and the workflow project name.

---

## Doc body

Title, one-line purpose ("These answers let us measure how much each marketing channel contributes to your conversions (Multi-Touch Attribution)"), a target return date, then these sections:

### 1. Use case and audience

1. Which decisions should the attribution support? (e.g. budget allocation across channels, campaign optimization, proving the value of a channel)
2. Who will use the results and the dashboard (marketing leadership, channel managers, analytics)?

### 2. Customer identity

3. Which ID identifies a customer across all your touchpoint and conversion tables? Pre-fill from Phase 1 (and note sources that use another ID).

### 3. Touchpoints

4. Confirm the touchpoint sources found in Phase 1 (table, what one row means, channel it represents). Should any be added (ads, SMS, push, events, call center) or left out?
5. Email: which events count as a touchpoint? (Recommended: opens and clicks — not sends or deliveries.)
6. Web: are your campaign links tagged with UTM parameters? Pre-fill the coverage found in Phase 1. Do you have your own channel naming or a channel grouping (e.g. which sources count as paid social or brand search)?

### 4. Conversions

7. What counts as a conversion? (completed order, a confirmation page, form submit, application, subscription) Pre-fill the candidate from Phase 1.
8. Should a conversion carry a value (revenue column) or only be counted? Which orders or events must be excluded (cancelled, returned, test, internal)?

### 5. Journeys

9. How long do customers typically take from the first touch to converting (e.g. 1 week, 1 month, 6 months)? Touchpoints older than this before a conversion are not credited. (Recommended for a first setup: 180 days.)
10. Should every conversion start a new journey (repeat purchases), or does only the first conversion matter?

### 6. Analysis period

11. Use all history, or a fixed period or a rolling window (e.g. the last 12 months)? (Recommended for a first setup: all history.)

### 7. Customer segments (optional)

12. Should journeys be broken down by an existing customer segment or score (e.g. RFM segment)? If yes, which table and columns?

### 8. Schedule and notifications

13. **Run schedule** — how often should attribution refresh? (Recommended: weekly.)
14. Which email address should receive workflow failure alerts?

### 9. Business context

The questions still marked `[NEEDS YOUR INPUT]` in `business-context.md` that sections 1–8 don't already ask, grouped under that file's headings (playbook Phase 2 step 4). Omit the section if none are left.

Close with: "When done, save this file and send it back to the person who shared it with you."

---

## Answer → config mapping (for Phase 4)

Parameter meanings are in the template `README.md` (Configuration); choosing rules in `workflow-setup.md`.

| Question | Sets |
|---|---|
| 3 | `unique_user_id`; a custom query (`query_type: 'custom'`) for a source with another ID name |
| 4 | `aggregate_metrics_tables` entries (`src_table`, `name`, `unixtime_col`, channel expressions) |
| 5 | `custom_filter` of the email source |
| 6 | `medium_col` / `source_col` / `campaign_col` of the web source; channel grouping in `sql/journeys_models/journeys_base_table.sql` (README Customization Points) |
| 7 | `conversion_flag` per source |
| 8 | `item_price` of the conversion source; `custom_filter` of the conversion source |
| 9 | `max_journey_days` |
| 10 | Business context only — the template always starts a new journey after each conversion |
| 11 | `time_filter_type`, `time_range_start_date`, `time_range_end_date`, `lookback_period`, `apply_time_filter` per source (they also bound the Markov and Shapley input) |
| 12 | `add_customer_analysis`, `customers_table`, `attributes_list` |
| 13 | `schedule` in `mta_advanced_launch.dig` |
| 14 | `_error` → `to:` in `mta_advanced_launch.dig` |

Questions 1–2, 6, 7, 10 and every section 9 answer also go into `business-context.md` (playbook Phase 4 Part B step 4); questions 1–2 feed the documentation set.

Before editing the config in Phase 4, show the user a summary of planned changes (sources added or removed, email filter, channel expressions, conversion definition and value, journey window, analysis period, segments, schedule, alert email) and wait for approval.
