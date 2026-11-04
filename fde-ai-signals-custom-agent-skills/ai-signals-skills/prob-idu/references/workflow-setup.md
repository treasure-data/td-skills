# Probabilistic ID Unification — Workflow Setup

Use with `../../shared/push_pattern_td_workflows.md` (copy, gates, push, run). Two files in the working copy are the source of truth — read them before editing anything:

- `<workdir>/README.md` — workflow structure, what every parameter does and how to choose it, outputs, customization points
- `<workdir>/config/global.yml` — exact parameter names and syntax (edit in place; keep every key)

`<workdir>` = `agent_outputs/<project_slug>/workflow`. This file adds only what the template can't: how to turn the Phase 1 findings into the input query and config values, deploy details, and the output checks.

> **Prob-IDU exception — the input query is project code.** `sql/input_table.sql` ships as an example structure and is rewritten in the working copy for every project (§1; `../../shared/solution_standard.md` §5). It is the only template file besides the config that a standard deployment edits. Data rules: `dataprep-guide.md`.

## 1. Write the input query

### Discovery queries

Run all in one shell command with `tdx query -d <db>`; do not investigate caveats further — record them in `project_state.md`.

Candidate table classification (Phase 1): **ID source** — the deterministic-IDU output with one row per canonical ID (`persistent_id`, `unified_id`, …); **identifier source** — profile / contact tables with email, phone, name, address per ID; **system** — workflow outputs and ML results, not a source.

```sql
-- 1. ID grain: rows vs distinct IDs
SELECT COUNT(*) AS n_rows, COUNT(DISTINCT <id_col>) AS ids FROM <db>.<table>

-- 2. Fill rate and value reuse per candidate column
SELECT COUNT(*) AS n, COUNT(<col>) AS non_null, COUNT(DISTINCT <col>) AS distinct_vals,
       APPROX_DISTINCT(<id_col>) AS ids
FROM <db>.<table>

-- 3. Shared / placeholder values (top reused values glue unrelated IDs)
SELECT <col>, COUNT(DISTINCT <id_col>) AS ids FROM <db>.<table>
WHERE <col> IS NOT NULL GROUP BY 1 ORDER BY 2 DESC LIMIT 20
```

Pick 2–4 columns: fill rate above ~50%, distinct values close to the number of non-NULL rows (an identifier, not a category), no placeholder dominating check 3. Row count decides the run time (millions of IDs take hours).

### Rules

Rewrite `sql/input_table.sql` per `sql/README.md` and `dataprep-guide.md`: one row per `id_col`, one column per `dedupe_columns` entry with the same name, raw values, NULL kept as NULL.

## 2. Choose the other values

Set `dedupe_columns` (types, weights) from §1, `sink_database`, `source_database` / `source_table`, `id_col` and `ml_batch_endpoint` for the account's region. Keep the template's blocking and clustering values for the first run (conservative: `jaccard_similarity_threshold` and `cluster_threshold` at 0.90) — they are tuned from the first run's result (`output-tables-guide.md` §4, tuning table in `ai-signals-guide.md`). Leave the schedule and failure email commented unless the user asks for them. Do not validate the config locally — the template is pre-validated.

## 3. Deploy details

- **Names** — sink database (default `td_agents`; it must hold no `prob_*` tables — they have fixed names — so one sink database holds one project; if taken, use `prob_idu_<project_prefix>`) and workflow project (default `prob_idu_ais`; it must not exist yet), both in one command.
- **Secrets** — none to set. The AI Signals API key is provided by the AI Signals architecture; never ask the user to set `td.apikey`.
- **Run** — push, then run `ml_prob_unification_launch`. Tell the user the run takes from several minutes (thousands of IDs) to hours (millions): blocking and the AI Signals clustering are the long steps.
- **Region** — `ml_batch_endpoint` per the account's site (`tdx status`).

## 4. Validate

Run after every run (Phase 3 and Phase 4), as direct `tdx query -d <sink_database>` calls in one shell command — never through a script you write. Record the results in `project_state.md`.

```sql
-- 1. Input: one row per ID
SELECT COUNT(*) AS n_rows, COUNT(DISTINCT <id_col>) AS ids FROM <input_table>

-- 2. Blocking: blocks and members (rows > 0, no huge block)
SELECT COUNT(*) AS rows, COUNT(DISTINCT block_key) AS blocks, MAX(c) AS max_block
FROM (SELECT block_key, COUNT(*) AS c FROM <blocking_table> GROUP BY 1) t, (SELECT COUNT(*) FROM <blocking_table>)

-- 3. Run stats of the latest session
SELECT * FROM prob_model_table_params WHERE session_id = (SELECT session_id FROM prob_session_global_filter WHERE session_rnk = 1)

-- 4. Quality of the latest session
SELECT unique_prob_ids, unification_compression_ratio, avg_similarity_score, cluster_purity_pct, overall_quality_rating
FROM prob_uni_config_stats_table WHERE session_id = (SELECT session_id FROM prob_session_global_filter WHERE session_rnk = 1)
```

Pass: `n_rows = ids`; blocking has rows and the largest block is far below `max_ids_per_block`; `deduped_ids > 0`; `avg_similarity_score` above ~0.85 and `overall_quality_rating` not `Poor`. Then read 20–50 sample clusters from `dedupe_<output_table>` side by side with their input columns: the IDs in one cluster should plausibly be one person. Wrong merges → raise thresholds; missed duplicates → lower them (tuning table in `ai-signals-guide.md`).

### Troubleshooting

| Symptom | Fix |
|---|---|
| `+create_input_table` fails | Placeholders left in `sql/input_table.sql`, or no read access to `source_database` |
| Blocking runs out of memory | Raise `jaccard_similarity_threshold`, lower `hashes`, `max_ids_per_cluster`, `max_ids_per_block` |
| `blocking_table` empty | Dedupe columns almost all NULL, or `jaccard_similarity_threshold` too high — lower by 0.05 |
| AI Signals run fails or times out | `ai-signals-guide.md` troubleshooting; lower `max_ids_per_block`, set `fill_missing: False` |
| `dedupe_<output_table>` empty or tiny | No pair reached `cluster_threshold` — lower it and `jaccard_similarity_threshold` by 0.05 |
| Giant clusters | Placeholder values in the data (`dataprep-guide.md`), or thresholds too low |
