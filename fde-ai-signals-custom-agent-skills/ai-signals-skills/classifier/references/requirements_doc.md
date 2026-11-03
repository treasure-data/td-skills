# Classifier — Requirements Doc Body

Phase 2 body for `agent_outputs/<project_slug>/requirements.md` (title `<Project Name> Requirements`). Mechanics — writing, hand-off, reading it back — are in `../../shared/playbook.md` (Phase 2 and Phase 4).

Write the doc for the customer to fill in: one `> _Your answer:_` line under each question, Phase 1 findings (use case, label rule, sources) pre-filled and marked `[INFERRED — please confirm]`, open questions marked `[NEEDS YOUR INPUT]`. Do not include config parameter names in the customer-facing doc — the mapping table at the end of this file is for you.

> **How to ask (when the user answers in chat instead of the doc):** always use `AskUserQuestion`, never a plain-text list. Batches of up to 4 questions per call; 2–4 options per question with the recommended default marked `(Recommended)`; the implicit "Other" lets the user type their own answer.

Not asked here — confirmed in Phase 3: the output (sink) database and the workflow project name.

---

## Doc body

Title, one-line purpose ("These answers let us train and score a model that predicts <outcome> for each <entity>"), a target return date, then these sections:

### 1. Use case and audience

1. Which outcome should the model predict, in one sentence? Pre-fill from Phase 1 (e.g. "a lead converts to a customer within 90 days").
2. What will be done with the scores (sales prioritization, retention offer, campaign targeting, suppression), and through which channels?
3. Who will use the scores and the dashboard (sales ops, CRM, marketing, analytics)?
4. Which Parent Segment should receive the scores as attributes?

### 2. Who is scored

5. Which customers, leads or accounts should get a score (all profiles, open leads only, active subscribers, a region or brand)? Pre-fill the population used in Phase 1.
6. Which records must be excluded from training and scoring (test or internal accounts, employees, partners, customers already converted or cancelled)?
7. Which ID identifies an entity across your tables (the one your Parent Segment joins on)? Pre-fill from Phase 1.

### 3. Outcome definition

8. Confirm the rule for a positive outcome (pre-fill: table, event or status, e.g. "an order with status completed"). Are there edge cases (refunded orders, reactivations, trial conversions)?
9. Over what period after the cut-off should the outcome count (e.g. 30, 90 or 180 days)? (Recommended: the typical time from first signal to outcome.)
10. For churn: how long without activity counts as churned, and which activities count?

### 4. Data sources and features

11. Confirm the feature sources found in Phase 1 (pre-filled table: source, what it records, the ID it uses). Is any source missing (support tickets, product usage, CRM, a database not yet in the Parent Segment)?
12. Which signals do you believe drive the outcome (recency of activity, purchase value, email engagement, plan or tier, tenure, region)?
13. Which columns must never be used as features (PII, sensitive attributes, anything that records the outcome itself)?
14. How much history should the features use (e.g. last 6, 12 or 24 months)? (Recommended: 12 months.)

### 5. Using the scores

15. What matters more: a short list of very likely positives (fewer wasted actions), catching as many positives as possible (fewer missed ones), or a balance? (Recommended: a balance.)
16. Do you need a yes/no label per customer, or only a ranking (top 10%, deciles, score buckets)? Do you already have a score cut-off?
17. Is there a reason to prefer a particular model type or to keep the model simple to explain?

### 6. Schedule and notifications

18. **Retrain schedule** — how often should the model be retrained? (Recommended: monthly.)
19. **Scoring schedule** — how often should scores refresh? (Recommended: weekly or daily.)
20. Which email address should receive workflow failure alerts?

### 7. Business context

The questions still marked `[NEEDS YOUR INPUT]` in `business-context.md` that sections 1–6 don't already ask, grouped under that file's headings (playbook Phase 2 step 4). Omit the section if none are left.

Close with: "When done, save this file and send it back to the person who shared it with you."

---

## Answer → config mapping (for Phase 4)

Parameter meanings are in the template `README.md` (Configuration); choosing rules in `workflow-setup.md` and `ai-signals-guide.md` §5.

| Question | Sets |
|---|---|
| 1, 8 | Label CTE in `sql/input_features.sql`; `target_column` |
| 4 | Parent Segment used in Phase 5 (`references/parent_segment.md`) |
| 5, 6 | Population CTE and filters in `sql/input_features.sql` |
| 7 | `user_id_column` (and the join keys in the SQL) |
| 9, 10 | `label_window_days`; churn rule in the label CTE; `spacing_days` (= horizon) and `n_train_snapshots` within the history (`dataprep-guide.md` §2) |
| 11, 12 | Feature CTEs in `sql/input_features.sql` |
| 13 | Remove from the SQL; non-features into `columns_to_drop` |
| 14 | `feature_lookback_days` |
| 15 | `optuna_metric`, `fbeta_beta`, `threshold_strategy`, `min_metric_floor` (guide §5 table) |
| 16 | `threshold_strategy: fixed` + `fixed_threshold` for an existing cut-off; ranking only → `optuna_metric: auc_pr`; Phase 5 attributes (`score_bucket` vs `predicted_label`) |
| 17 | `model_type` |
| 18, 19 | `schedule` in `classify.dig`, or separate schedules in `train.dig` / `predict.dig` (`dataprep-guide.md` §6) |
| 20 | `_error` → `to:` in `classify.dig` |

Questions 1–3, 6, 8, 10, 12, 13, 15 and every section 7 answer also go into `business-context.md` (playbook Phase 4 Part B step 4); questions 1–3 feed the documentation set.

Before editing in Phase 4, show the user a summary of planned changes (population, label rule and window, feature sources added or removed, excluded columns, history window, objective and threshold, model type, schedules, alert email) and wait for approval.
