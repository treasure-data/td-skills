# Feature SQL

`data_prep.dig` runs `input_features.sql` (and any feature queries added before it) in both modes and writes the result to `train_input_table` (`mode = train`) or `pred_input_table` (`mode = pred`). The template file is an **example structure** — it is rewritten for every project from the Phase 1 data discovery; the workflow cannot run until every `<...>` placeholder is replaced.

## Output contract

| Column | Rule |
|---|---|
| `session_id` | `'${session_id}'` — the Workflow session. `train.dig` trains on the latest batch (`MAX(session_id)`) and the AI Signals model stamps its output tables with it |
| `${user_id_column}` | One row per entity (profile, lead, account), never NULL. The ID the Parent Segment joins on |
| `${target_column}` | 0/1 as BIGINT, no NULLs, both classes present in training. Observed **after** `cutoff_date`. Computed in both modes with the same SQL; ignored when scoring |
| Features | Numeric (counts, sums, recency in days, ratios) or low-cardinality strings (plan, region, channel). Computed **only from data before `cutoff_date`** |

Every non-feature column (`time`, `session_id`, dates, raw timestamps, emails, other IDs) goes into `columns_to_drop` in `config.yml`. Never output a column derived from the outcome (cancellation date, order after the cutoff, status that records the outcome) — it leaks the label.

## Variables

Set in `data_prep.dig` from `config.yml` (FEATURE WINDOWS):

| Variable | Train | Pred |
|---|---|---|
| `${cutoff_date}` | run date − `label_window_days` | run date |
| `${feature_start_date}` | `cutoff_date` − `feature_lookback_days` | `cutoff_date` − `feature_lookback_days` |
| `${label_end_date}` | run date | run date (empty label window) |
| `${mode}` | `train` | `pred` |

Run date = `reference_date` when set, otherwise the session date.

## Rules

- Same SQL, same feature columns and types in both modes — a feature missing at prediction is filled with 0 and silently changes scores.
- Use `TD_TIME_RANGE(<unix_col>, '${feature_start_date}', '${cutoff_date}')` for partition pruning; convert string timestamps with `TD_TIME_PARSE`.
- `COALESCE` count-type features to 0 after a `LEFT JOIN`; leave recency-type features NULL when there is no history (the model handles NULLs).
- Several sources: one CTE per source in `input_features.sql`, or separate feature tables built in a `_parallel` block in `data_prep.dig` and joined here.
- Parent Segment attributes: select them from the Parent Segment's `customers` table in the population CTE — they are already one row per profile. They hold **today's** values, not values as of `cutoff_date`: use only stable attributes (demographics, acquisition source, region) as training features; recency, lifetime totals or status attributes leak the label — rebuild those from the behavior tables with the window above.
