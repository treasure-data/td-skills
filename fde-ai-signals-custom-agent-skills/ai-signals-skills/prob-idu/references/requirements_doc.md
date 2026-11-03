# Probabilistic ID Unification — Requirements Doc Body

Phase 2 body for `agent_outputs/<project_slug>/requirements.md` (title `<Project Name> Requirements`). Mechanics — writing, hand-off, reading it back — are in `../../shared/playbook.md` (Phase 2 and Phase 4).

Write the doc for the customer to fill in: one `> _Your answer:_` line under each question, Phase 1 findings (identifier columns, population, volume) pre-filled and marked `[INFERRED — please confirm]`, open questions marked `[NEEDS YOUR INPUT]`. Do not include config parameter names in the customer-facing doc — the mapping table at the end of this file is for you.

> **How to ask (when the user answers in chat instead of the doc):** always use `AskUserQuestion`, never a plain-text list. Batches of up to 4 questions per call; 2–4 options per question with the recommended default marked `(Recommended)`; the implicit "Other" lets the user type their own answer.

Not asked here — confirmed in Phase 3: the output (sink) database and the workflow project name.

---

## Doc body

Title, one-line purpose ("These answers let us find customer records that belong to the same person but were not linked by deterministic matching"), a target return date, then these sections:

### 1. Use case and audience

1. What will the unified IDs be used for (a single customer view, suppression of duplicates, personalization, activation reach)?
2. Which Parent Segment or downstream system should receive the cluster IDs?
3. Who will review the results (data team, marketing ops, analytics)?

### 2. Data

4. Has deterministic ID unification already run? Which table holds its canonical ID (pre-fill from Phase 1)?
5. Which identifiers are available per ID (email, phone, address, name, other)? Pre-fill from Phase 1 with the null rate of each, and confirm which are reliable.
6. Roughly how many IDs are in scope, and do some IDs have several emails or phones?
7. Which records must be excluded (test accounts, employees, shared or role-based emails such as `info@`, placeholder phones)?

### 3. Matching preference

8. What costs more: wrongly merging two different people, or leaving one person split across IDs? (Recommended: avoid wrong merges first, then loosen.)
9. Which identifier is the strongest evidence of a match (email, phone, address)?
10. Should a match need agreement on more than one identifier, or is one strong match enough?

### 4. Schedule and notifications

11. How often should the unification refresh? (Recommended: weekly, after deterministic IDU.)
12. Which email address should receive workflow failure alerts?

### 5. Business context

The questions still marked `[NEEDS YOUR INPUT]` in `business-context.md` that sections 1–4 don't already ask, grouped under that file's headings (playbook Phase 2 step 4). Omit the section if none are left.

Close with: "When done, save this file and send it back to the person who shared it with you."

---

## Answer → config mapping (for Phase 4)

Parameter meanings are in the template `README.md` (Configuration); choosing rules in `workflow-setup.md`.

| Question | Sets |
|---|---|
| 4 | `source_database`, `source_table`, `id_col`; `sql/input_table.sql` |
| 5 | `dedupe_columns` (name, type, weight) and the columns in `sql/input_table.sql`; `fill_missing` for high-NULL columns |
| 6 | `hashes`, `keygroups`, `max_ids_per_cluster`, `max_ids_per_block` (large volumes → tighter limits) |
| 7 | `WHERE` filters in `sql/input_table.sql` |
| 8 | `cluster_threshold` and `jaccard_similarity_threshold` (avoid wrong merges → 0.90–0.95; avoid splits → lower in 0.05 steps) |
| 9 | `dedupe_columns` weights (strongest identifier highest; sum 1.0) and `string_type` |
| 10 | Weights and `cluster_threshold`: with 0.35 / 0.35 / 0.30 weights, a threshold above 0.65 needs agreement on more than one column |
| 11 | `schedule` in `ml_prob_unification_launch.dig` |
| 12 | `_error` → `to:` in `ml_prob_unification_launch.dig` |

Questions 1–3, 5, 7–9 and every section 5 answer also go into `business-context.md` (playbook Phase 4 Part B step 4); questions 1–3 feed the documentation set.

Before editing in Phase 4, show the user a summary of planned changes (identifier columns and weights, exclusions, thresholds, schedule, alert email) and wait for approval.
