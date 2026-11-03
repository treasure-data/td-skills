# NBA Engagement Scores — Requirements Doc Body

Phase 2 body for `agent_outputs/<project_slug>/requirements.md` (title `<Project Name> Requirements`). Mechanics — writing, hand-off, reading it back — are in `../../shared/playbook.md` (Phase 2 and Phase 4).

Write the doc for the customer to fill in: one `> _Your answer:_` line under each question, Phase 1 findings pre-filled and marked `[INFERRED — please confirm]`, open questions marked `[NEEDS YOUR INPUT]`. Do not include config parameter names in the customer-facing doc — the mapping table at the end of this file is for you.

> **How to ask (when the user answers in chat instead of the doc):** always use `AskUserQuestion`, never a plain-text list. Batches of up to 4 questions per call; 2–4 options per question with the recommended default marked `(Recommended)`; the implicit "Other" lets the user type their own answer.

Not asked here — confirmed by the name gates in Phase 3: the output (sink) database and the workflow project name.

---

## Doc body

Title, one-line purpose ("These answers let us configure Next Best Action engagement scores for your customer profiles"), a target return date, then these sections:

### 1. Use case and audience

1. Which decisions will the scores drive? (e.g. send-time optimization, channel budget, cart-recovery journeys, welcome series, retargeting suppression)
2. Who will use the scores and the dashboard (marketing ops, CRM, analytics)?
3. Which Parent Segment should receive the scores as attributes?

### 2. Customer identity

4. Which ID identifies a customer across all your tables (the one your Parent Segment joins on)? Pre-fill from Phase 1.

### 3. Touchpoint sources

5. Confirm the source tables found in Phase 1 (table, what it records, profile ID column, event-time column). Add any missing source (support tickets, in-store visits, app events, …).
6. For each source: which rows should be excluded? (email sends/bounces, cancelled or refunded orders, test/internal records, bots, other languages or markets)

### 4. Conversion

7. What counts as a conversion? (completed order with which statuses, a confirmation-page URL, form submit, subscription start)

### 5. Business-rule windows

8. **Recent activity window** — how many days back count as "recent" for a purchase, an ad engagement or an add-to-cart? (Recommended: your typical campaign cycle, 30–90 days.)
9. **New visitor** — a profile with no ad engagement and no conversion whose first visit was at most how many days ago? (Recommended: the length of your welcome journey, 30–60 days.)
10. **Add-to-cart event** — how is an add-to-cart recorded in your data (event name or URL)? Pre-fill from Phase 1.
11. **Paid channels** — which channels are paid/ad traffic (paid search, paid social, display, affiliates, …)? Profiles reached through these are never "new visitors" and count as ad-engaged.

### 6. History and scoring

12. **History window** — score on a rolling window (e.g. last 12 months, re-evaluated on every run) or a fixed date range? Or all history?
13. **Scoring style** — how should per-channel and per-daypart scores be expressed?
    - *Quartile (Recommended)* — four equal groups (1–4); easiest for "top 25%" audiences
    - *Percentile* — 0–1 rank; finer ordering, best when activity is evenly spread
    - *Min-max* — 0–1 scaled to the most active profile; best when a few very active profiles dominate
14. **Run schedule** — how often should scores refresh? (Recommended: monthly; weekly for fast-moving campaigns.)

### 7. Time of day

15. In which timezone does your team plan sends?
16. Dayparts are morning, afternoon, evening and overnight (6-hour blocks by default). Should any boundary move (e.g. morning from 5 AM)?

### 8. Notifications

17. Which email address should receive workflow failure alerts?

### 9. Business context

The questions still marked `[NEEDS YOUR INPUT]` in `business-context.md` that sections 1–8 don't already ask, grouped under that file's headings (playbook Phase 2 step 4). Omit the section if none are left.

Close with: "When done, save this file and send it back to the person who shared it with you."

---

## Answer → config mapping (for Phase 4)

Parameter meanings are in the template `README.md` (Configuration); choosing rules in `workflow-setup.md`.

| Question | Sets |
|---|---|
| 3 | Parent Segment used in Phase 5 (`references/parent_segment.md`) |
| 4 | `unique_user_id`, each source's `join_key` |
| 5 | `aggregate_metrics_tables` entries (`src_table`, `name`, `unixtime_col`, column mappings) |
| 6 | each source's `custom_filter` |
| 7 | each source's `conversion_flag`; `query_type: custom` if orders need de-duplication |
| 8 | `next_best_campaign.event_lookback` |
| 9 | `next_best_campaign.new_customers_days` |
| 10 | `abandon_regexp` + `abandon_regexp_string`; the source's `event_type` |
| 11 | `ad_engagement_logic` + `ad_engagement_logic_string` |
| 12 | `time_filter_type`, `lookback_period` or `time_range_start_date`/`time_range_end_date`, `apply_time_filter` on every source |
| 13 | `scoring_logic` |
| 14 | `schedule` in `nba_eng_launch.dig` |
| 15–16 | `timeshift_change`, `timeshift_hours`, `day_breakdown[].logic` (against `adjusted_hour` when not UTC) |
| 17 | `_error` → `to:` in `nba_eng_launch.dig` |

Questions 1–2, 7 (conversion), 10 (add-to-cart) and every section 9 answer also go into `business-context.md` (playbook Phase 4 Part B step 4); questions 1–2 feed the documentation set.

Before editing the config in Phase 4, show the user a summary of planned changes (customer, sources and their roles, conversion definition, windows, history window, scoring, timezone/dayparts, schedule, alert email) and wait for approval.
