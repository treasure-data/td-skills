# Tuning Advisor — Recommend Thresholds and Weights

Read this when the user asks which `cluster_threshold`, `jaccard_similarity_threshold` or column weights to use, whether to raise or lower a threshold, or for the best settings so far. The recommendation is a **proposal**: nothing is applied until the user approves it and the setup skill (`fde-prob-idu`, Phase 4 Part B) edits the config.

## Hard rule

**`jaccard_similarity_threshold` ≤ `cluster_threshold`, always.** Check every proposal against it before showing it. If a step would break it, lower the Jaccard value or raise the cluster value instead, and say so. The workflow also fails a run that violates it. Weights must sum to 1.0.

## 1. Enough runs?

```sql
SELECT p.session_id, p.run_date, p.cluster_threshold, p.jaccard_sim_threshold, p.hashes, p.keygroups,
       p.string_similarity_algo, p.fill_missing, p.dedupe_col_params, p.deduped_ids, p.run_duration_mins,
       s.avg_similarity_score, s.poor_precision_pct, s.acceptable_precision_pct, s.cluster_purity_pct,
       s.max_cluster_size, s.overall_quality_rating, s.composite_efficiency_score
FROM prob_model_table_params p JOIN prob_uni_config_stats_table s ON s.session_id = p.session_id
ORDER BY p.run_date
```

- **Fewer than 3 runs, or all with the same settings:** do not recommend a final value. Propose the next experiment — one parameter, one 0.05 step (lower both thresholds together when recall is the goal) — and say what to compare afterwards.
- **3 or more runs with different thresholds:** continue with §2. Runs that changed several things at once are weak evidence; say so.

## 2. Pick the best run, then the next step

1. **Guard rails** — a run is eligible only if `poor_precision_pct` ≤ 10, `overall_quality_rating` is not `Poor`, and `max_cluster_size` is at most the largest group a person can plausibly have (from `business-context.md`; 50 if unstated).
2. **Best run** — among eligible runs, the highest `deduped_ids` (the recall proxy); ties go to the higher `composite_efficiency_score`.
3. **Trend** — order the runs by `cluster_threshold`. Per 0.05 step: if lowering added at least 5% more `deduped_ids` while `avg_similarity_score` fell less than 0.02 and the guard rails held, the best value is further down — propose one more 0.05 step below the best run. If the guard rails broke or the gain was under 5%, stay at the best run.
4. **Blocking check** — if lowering `cluster_threshold` stopped adding matches (under 2%), blocking is the limit: propose lowering `jaccard_similarity_threshold` by 0.05, never above `cluster_threshold`.
5. **Jaccard value** — equal to `cluster_threshold` or up to 0.10 below it; lower values find more candidates but slow the run (`run_duration_mins`).
6. **Runtime or memory failures** — raise Jaccard (up to `cluster_threshold`), not lower.

## 3. Weights

Only on the latest run (`output_table` is replaced each run). For each dedupe column `<col>` of `dedupe_col_params`:

```sql
-- fill rate and top-value share (a high share = placeholder or shared value)
SELECT COUNT(<col>) * 1.0 / COUNT(*) AS fill_rate,
       (SELECT MAX(c) * 1.0 / SUM(c)
        FROM (SELECT COUNT(*) AS c FROM {{output_table}} WHERE <col> IS NOT NULL GROUP BY <col>)) AS top_value_share
FROM {{output_table}}
```

```sql
-- agreement: share of multi-ID clusters where all non-null values are equal
SELECT AVG(CASE WHEN d = 1 THEN 1.0 ELSE 0.0 END) AS agreement_rate
FROM (SELECT {{cluster_col_name}}, COUNT(DISTINCT <col>) AS d FROM {{output_table}}
      GROUP BY 1 HAVING COUNT(<col>) >= 2)
```

Score = `fill_rate × agreement_rate × (1 − top_value_share)`. Proposed weight = score ÷ sum of scores, rounded to 0.05, at least 0.10 per column, adjusted so the weights sum to 1.0.

Caveats to state: agreement is biased toward columns that already carry a high weight, and exact equality understates fuzzy `string` columns — so propose a change only when a column's proposed weight differs from the current one by 0.10 or more, call it a hypothesis, and cap a `string` column's reduction at 0.10. A column with `top_value_share` above 0.2 or `fill_rate` under 0.5 is a candidate for removal, not just a lower weight.

## 4. Answer format

1. **Verdict** — one line: the recommended settings, or "not enough runs yet" with the next experiment.
2. **Table** — parameter, current, recommended, why (the run numbers behind it).
3. **Hard-rule check** — "Jaccard 0.85 ≤ cluster 0.90" and "weights sum to 1.00".
4. **Confidence** — low with under 3 runs, mixed-change runs or no sampled clusters; there is no ground truth in the tables.
5. **Next step** — change thresholds **or** weights in one run (not both, so the effect can be attributed), then sample 30 clusters from the new `dedupe_{{output_table}}` with the customer. Offer to hand the change to the setup skill.

Chart: `render_chart` line of `deduped_ids` and `poor_precision_pct` by `cluster_threshold` across runs.
