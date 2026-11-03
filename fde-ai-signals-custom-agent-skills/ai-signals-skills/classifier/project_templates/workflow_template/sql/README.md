# Feature SQL

`data_prep.dig` runs `input_features.sql` (and any feature queries added before it) in both modes and writes the result to `train_input_table` (`mode = train`) or `pred_input_table` (`mode = pred`). The template file is an **example structure** — it is rewritten for every project from the Phase 1 data discovery; the workflow cannot run until every `<...>` placeholder is replaced. Patterns per use case and source type: the skill's `references/dataprep-guide.md`.

## Output contract

| Column | Rule |
|---|---|
| `session_id` | `'${session_id}'` — the Workflow session. `train.dig` trains on the latest batch (`MAX(session_id)`) and the AI Signals model stamps its output tables with it |
| `cutoff_date` | The snapshot date (`'YYYY-MM-DD'`). Training stacks `n_train_snapshots` cutoffs; scoring has one (the run date). Listed in `columns_to_drop` |
| `${user_id_column}` | One row per entity (profile, lead, account) **per cutoff**, never NULL. The ID the Parent Segment joins on |
| `${target_column}` | 0/1 as BIGINT, no NULLs, both classes present in training. Observed in `[cutoff, cutoff + label_window_days)`. Computed in both modes with the same SQL; always 0 when scoring (the window is in the future) and ignored |
| Features | Numeric (counts, sums, recency in days, ratios) or low-cardinality strings (plan, region, channel). Computed **only from data before the cutoff** |

Every non-feature column (`time`, `session_id`, `cutoff_date`, raw timestamps, emails, other IDs) goes into `columns_to_drop` in `config.yml`. Never output a column derived from the outcome (cancellation date, order after the cutoff, status that records the outcome) — it leaks the label.

## Variables

Set in `data_prep.dig` from `config.yml` (DATA PREP):

| Variable | Train | Pred |
|---|---|---|
| `${run_date}` | `reference_date`, or the session date when empty | same |
| `${snapshot_k_min}` … `${snapshot_k_max}` | `ceil(label_window_days / spacing_days)` … `+ n_train_snapshots − 1` | `0` … `0` |
| `${scan_start}` | earliest cutoff − `feature_lookback_days` | run date − `feature_lookback_days` |
| `${scan_end}` | run date + 1 day | run date + 1 day |
| `${mode}` | `train` | `pred` |

The `cutoffs` CTE turns them into one row per snapshot: `cutoff_date` = `run_date − spacing_days × k`, with `feature_start_ts`, `cutoff_ts` and `label_end_ts` as UNIX seconds. Every source joins to it on those bounds.

## Rules

- Same SQL, same feature columns and types in both modes — a feature missing at prediction is filled with 0 and silently changes scores.
- Join every source to `cutoffs` and filter `event_time >= feature_start_ts AND event_time < cutoff_ts` (features) or `>= cutoff_ts AND < label_end_ts` (label). Keep `TD_TIME_RANGE(<unix_col>, '${scan_start}', '${scan_end}')` on every scan for partition pruning; convert string timestamps with `TD_TIME_PARSE`.
- Group every feature CTE by `cutoff_date` and the ID, and join on both — a join on the ID alone mixes snapshots.
- Recency and tenure are measured from the cutoff (`DATE_DIFF('day', …, cutoff_dt)`), never from today.
- `COALESCE` count-type features to 0 after a `LEFT JOIN`; leave recency-type features NULL when there is no history (the model handles NULLs).
- Several sources: one CTE per source in `input_features.sql`, or separate feature tables built in a `_parallel` block in `data_prep.dig` and joined here.
- Parent Segment attributes: select them from the Parent Segment's `customers` table in the population CTE — they are already one row per profile. They hold **today's** values, not values as of the cutoff: use only stable attributes (demographics, acquisition source, region) as training features; recency, lifetime totals or status attributes leak the label — rebuild those from the behavior tables with the windows above.
- Digdag renders every `${…}` before the query runs, including inside SQL comments — use only the variables above.
