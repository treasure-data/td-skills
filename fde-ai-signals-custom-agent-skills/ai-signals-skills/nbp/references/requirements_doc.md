# NBP (Next Best Product) — Requirements Doc Body

Phase 2 body for `agent_outputs/<project_slug>/requirements.md` (title `<Project Name> Requirements`). Mechanics — writing, hand-off, reading it back — are in `../../shared/playbook.md` (Phase 2 and Phase 4).

Write the doc for the customer to fill in: one `> _Your answer:_` line under each question, Phase 1 findings pre-filled and marked `[INFERRED — please confirm]`, open questions marked `[NEEDS YOUR INPUT]`. Do not include config parameter names in the customer-facing doc — the mapping table at the end of this file is for you.

> **How to ask (when the user answers in chat instead of the doc):** always use `AskUserQuestion`, never a plain-text list. Batches of up to 4 questions per call; 2–4 options per question with the recommended default marked `(Recommended)`; the implicit "Other" lets the user type their own answer.

Not asked here — confirmed in Phase 3: the output (sink) database and the workflow project name.

---

## Doc body

Title, one-line purpose ("These answers let us configure personalized product recommendations (Next Best Product) for your customers"), a target return date, then these sections:

### 1. Use case and audience

1. Where will the recommendations be used? (e.g. email product blocks, on-site personalization, ads, call-center scripts)
2. Who will use the recommendations and the dashboard (marketing ops, CRM, merchandising, analytics)?
3. Which Parent Segment should receive the recommendations as attributes?

### 2. Customer identity

4. Which ID identifies a customer across your tables (the one your Parent Segment joins on)? Pre-fill from Phase 1.

### 3. Interaction data

5. Confirm the table found in Phase 1 (table, what one row means, customer ID, item ID, time column). Is there a better source — e.g. order lines instead of orders?
6. Which interactions show a real product preference? (completed purchases only, or also add-to-cart / item views) Which rows should be excluded (cancelled or returned orders, test or internal accounts)?

### 4. Products

7. Confirm where item names and categories come from (pre-fill: the same table or the product catalog found in Phase 1), and which category level is most useful (department, category, brand).
8. Which products must never be recommended or trained on? (gift cards, memberships, discontinued or out-of-stock items, test products)

### 5. Recommendations

9. How many products should each customer get (e.g. 3 for an email block, 10 for a website carousel)? (Recommended: 5.)
10. May a customer be recommended a product they already bought? (Yes for consumables and replenishment; no for one-off purchases.)
11. What matters more: recommendations tailored to each customer's history, or broadly popular products (safer for customers with little history)? (Recommended for a first setup: products similar to each customer's latest purchase.)

### 6. History window

12. Use all purchase history, or only the last N months (e.g. 12 or 24, re-evaluated on every run)? (Recommended for a first setup: all history.)

### 7. Schedule and notifications

13. **Run schedule** — how often should recommendations refresh? (Recommended: weekly.)
14. Which email address should receive workflow failure alerts?

### 8. Business context

The questions still marked `[NEEDS YOUR INPUT]` in `business-context.md` that sections 1–7 don't already ask, grouped under that file's headings (playbook Phase 2 step 4). Omit the section if none are left.

Close with: "When done, save this file and send it back to the person who shared it with you."

---

## Answer → config mapping (for Phase 4)

Parameter meanings are in the template `README.md` (Configuration); choosing rules in `workflow-setup.md`.

| Question | Sets |
|---|---|
| 3 | Parent Segment used in Phase 5 (`references/parent_segment.md`) |
| 4 | `original_user_id_column_name` |
| 5 | `in_db`, `original_item_transactions_table`, `original_item_id_column_name`, `original_timestamp_name` |
| 6 | `transaction_filter` |
| 7 | `original_item_info_table`, `original_item_name_column_name`, `original_item_category_column_name` |
| 8 | `exclude_product_train` / `exclusion_column` / `exclusion_values`; `exclude_product_recs` / `recs_exclusion_column` / `recs_exclusion_values` |
| 9 | `max_recommended_items` (and the per-rank columns in Phase 5) |
| 10 | `filter_viewed` |
| 11 | `automl_model_type` — tailored → `als` (enough history) or `similar_to_latest`; popular → `popular` |
| 12 | `orders_lookback` |
| 13 | `schedule` in `nbp_launch.dig` |
| 14 | `_error` → `to:` in `nbp_launch.dig` |

Questions 1–2, 6, 8, 10 and every section 8 answer also go into `business-context.md` (playbook Phase 4 Part B step 4); questions 1–2 feed the documentation set.

Before editing the config in Phase 4, show the user a summary of planned changes (interaction table and filter, item info, exclusions, number of recommendations, already-purchased rule, algorithm, history window, schedule, alert email) and wait for approval.
