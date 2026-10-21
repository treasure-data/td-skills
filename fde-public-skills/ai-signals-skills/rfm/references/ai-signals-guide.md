# AI Signals RFM — Model Guide

Read this for any task about the AI Signals RFM model: how it scores, what the API accepts, testing other parameters, or changing the input or output tables. The workflow template (`rfm_ai_signals.dig`, `config/input_params.yml`) is the source of truth for what this setup sends today; this guide covers what the API accepts and how the model behaves.

**Public documentation:** https://docs.treasure.ai/products/customer-data-platform/machine-learning/ai-signals/rfm-ai-signals — after answering a question about the model from this guide, share this link and tell the user they can find more detail in the public AI Signals documentation.

## 1. What it does

Takes one row per profile with pre-computed recency, frequency and monetary value, ranks each metric into quartiles 1–4 (4 = best), and writes per-profile quartiles, an RFM code (`R4F3M2`), an average score and one of ten named segments. Deterministic — no training, no clustering; the same input gives the same output.

## 2. Input table

One row per profile. Column names are fixed except the profile ID. The model does **no** missing-value or outlier handling — clean the data before scoring.

| Column | Type | How the model uses it |
|---|---|---|
| profile ID (`user_column`, default `user`) | VARCHAR | Carried through to the output as the row key. Must be unique and non-null |
| `recency` | INTEGER | Days since the last activity. **Lower = better** → `r_quartile` 4 = most recent. Must be ≥ 0 |
| `frequency` | INTEGER | Number of activities. Higher = better |
| `monetary_value` | DOUBLE | Total spend. Higher = better. Use `0` for profiles with no spend, never NULL or negative |

Use at least 12 months of history where possible — shorter windows compress the recency differences. Clean refunds, voids and promotional credits upstream: zero or negative values distort the scoring.

In this template the input is built by `queries/create_agg_input_table.sql` from the union of all sources: `recency` = days from the run time to the latest event across sources, `frequency` = total rows across sources, `monetary_value` = sum of `order_amount` (negatives set to 0).

## 3. Parameters

Sent in the POST body. Top-level keys select the solution and tables; everything else goes under `solution_arguments`.

| Parameter | Level | Required | Default | When and how to change it |
|---|---|---|---|---|
| `solution_name` | top | required | — | Always `rfm` |
| `input_table` | top | required | — | `db.table` of the input (§2). Point it at another table to score an alternative input definition |
| `output_table` | top | required | — | `db.table` the API writes. Use a separate table (e.g. `rfm_output_test`) when experimenting, so the Parent Segment attribute table is untouched |
| `output_mode` | top | optional | `append` | `append` adds rows to the table; `overwrite` replaces its contents. The template keeps `append` and empties the table first (`+create_empty_output_table`), so each run replaces the previous one. To keep history, remove that step — every run then adds a full copy, so filter by run when reading |
| `user_column` | `solution_arguments` | optional | `user` | Name of the profile ID column. The template sets it to `globals.canonical_id` |
| `use_sql` | `solution_arguments` | optional | `false` | `true` computes the scores with Trino instead of Python. Python suits inputs up to roughly 10 million rows; above that, or when the Python run is slow or runs out of memory, use `true`. Same output either way |
| `use_hive` | `solution_arguments` | optional | `false` | `true` computes with Hive — only together with `use_sql: true` (alone it has no effect). Use it only when the Trino calculation hits memory limits |
| `mv_threshold` | `solution_arguments` | optional | null (no threshold) | Absolute amount, in the unit of `monetary_value`. Profiles at or below it are left out of the M cut-off calculation and get `m_quartile` 1; they stay in the output. Leave it unset by default. Set it (e.g. `0.05`) when many profiles have no spend, so the M cut-offs are computed from buyers only |
| `audience_name` | `solution_arguments` | optional | not set | Asks the API to create a Master Segment and a child Segment per RFM segment. It creates objects in the account — never set it in DEV (Phases 1–4); only in Phase 5, and only if the user wants the API to build the segments |

Headers: `authorization: "TD1 ${secret:td.apikey}"` (required, exactly as in the template — the key is provided by the AI Signals architecture; no manual secret setup). Optional `X-TD-ML-SESSION-ID: ${session_id}` and `X-TD-ML-ATTEMPT-ID: ${attempt_id}` tag the API run with the workflow session and attempt for tracing.

### Endpoint by region

Set `ml_batch_api_endpoint` in the config to the base URL of the account's region (`tdx status`); `+run_rfm` and `+poll_status` both read it. The template default is the US endpoint.

| Region | Endpoint |
|---|---|
| US (us01) | `https://ml-batch-api.treasuredata.com` |
| Japan (Tokyo) | `https://ml-batch-api.treasuredata.co.jp` |
| EU (eu01) | `https://ml-batch-api.eu01.treasuredata.com` |
| AP (ap02) | `https://ml-batch-api.ap02.treasuredata.com` |
| AP (ap03) | `https://ml-batch-api.ap03.treasuredata.com` |

## 4. Workflow syntax

```yaml
+run_rfm:
  http>: ${ml_batch_api_endpoint}/v1/runs
  method: POST
  headers:
    - authorization: "TD1 ${secret:td.apikey}"
    - X-TD-ML-SESSION-ID: ${session_id}       # optional
    - X-TD-ML-ATTEMPT-ID: ${attempt_id}       # optional
  store_content: true                         # needed: +poll_status reads the run id from the response
  content:
    input_table: ${globals.sink_database}.${input_table}
    output_table: ${globals.sink_database}.${output_table}
    # output_mode: append                     # optional — or overwrite
    solution_name: rfm
    solution_arguments:
      user_column: ${globals.canonical_id}
      # use_sql: true                         # optional — Trino instead of Python
      # use_hive: true                        # optional — with use_sql: true
      # mv_threshold: 0.05                    # optional — spend at or below this → m_quartile 1, left out of the M cut-offs

+poll_status:
  # Returns 408 while the run is in progress; http> retries until 200
  http>: ${ml_batch_api_endpoint}/v1/runs/${JSON.parse(http.last_content)['id']}/status
  method: GET
  headers:
    - authorization: "TD1 ${secret:td.apikey}"
```

Keep `+poll_status` directly after `+run_rfm` — it reads the run id from the previous task's response, and the next task (`rfm_agg_stats.dig`) needs the finished output table.

## 5. How it works

1. **Quartiles** — each metric is ranked over all profiles and split at its 25th, 50th and 75th percentiles into 1–4. Frequency and monetary: higher value → higher quartile (e.g. M1 = at or below the 25th-percentile cut-off, M2 = 25th–50th, M3 = 50th–75th, M4 = above the 75th). Recency: lower value → higher quartile. With `mv_threshold`, profiles at or below the threshold are left out when the M cut-offs are computed and get `m_quartile` 1.
2. **Code and score** — `rfm_quartile` = `R<r>F<f>M<m>`; `rfm_score` = (`r_quartile` + `f_quartile` + `m_quartile`) / 3, from 1.0 to 4.0.
3. **Segment** — fixed rules on the three quartiles, checked top to bottom (they match the full pattern list in the public documentation):

| `rfm_segment` | Rule |
|---|---|
| Champions | R4 F4 M4 |
| Loyal Customers | R ≥ 3, F ≥ 3, M ≥ 3 |
| Potential Loyalists | R ≥ 3, F ≥ 2, M ≥ 2 |
| Promising | R ≥ 3, F ≥ 2 or M ≥ 2 |
| New Customers | R ≥ 3, F1 M1 |
| Cannot lose them | R2, M ≥ 3 |
| Need attention | R2, M2, F ≥ 2 |
| Hibernating | R2, any other |
| High Value Sleeping | R1, M ≥ 3 or (M2 and F ≥ 2) |
| Lost customers | R1, any other |

Ties matter: when many profiles share a value (e.g. frequency 1, monetary 0), they fall into the same quartile, so quartiles can be far from 25% each. Quartiles are relative to the scored population — changing the input (sources, filters, time window) moves every profile's score.

## 6. Output table

One row per profile in `output_table`:

| Column | Type | Meaning |
|---|---|---|
| profile ID (`user_column`) | STRING | Same as the input |
| `recency`, `frequency`, `monetary_value` | BIGINT, BIGINT, DOUBLE | Input values, unchanged |
| `r_quartile`, `f_quartile`, `m_quartile` | BIGINT | 1–4, 4 = best |
| `rfm_quartile` | STRING | e.g. `R4F3M2` |
| `rfm_score` | DOUBLE | Average of the three quartiles, 1.0–4.0 |
| `rfm_segment` | STRING | One of the ten segments in §5 |

### Validate

Run after scoring (the pipeline checks — row counts vs. input, source contribution, dashboard tables — are in `references/workflow-setup.md` §4). Replace `<db>.<out>` and `<id>`.

```sql
-- Model invariants: all three counts must be 0
SELECT COUNT(*) AS total,
       COUNT_IF(r_quartile NOT BETWEEN 1 AND 4 OR f_quartile NOT BETWEEN 1 AND 4 OR m_quartile NOT BETWEEN 1 AND 4) AS bad_quartile,
       COUNT_IF(rfm_quartile <> 'R' || CAST(r_quartile AS VARCHAR) || 'F' || CAST(f_quartile AS VARCHAR) || 'M' || CAST(m_quartile AS VARCHAR)) AS bad_code,
       COUNT_IF(ABS(rfm_score - (r_quartile + f_quartile + m_quartile) / 3.0) > 0.01) AS bad_score
FROM <db>.<out>;

-- Quartile cut-offs: higher r_quartile → lower recency; higher f/m → higher values; shares near 25% unless ties
SELECT r_quartile, COUNT(*) AS n, MIN(recency) AS min_r, MAX(recency) AS max_r
FROM <db>.<out> GROUP BY 1 ORDER BY 1;          -- repeat with f_quartile/frequency and m_quartile/monetary_value
```

Spot-check segments against the rule table: `SELECT rfm_segment, rfm_quartile, COUNT(*) FROM <db>.<out> GROUP BY 1, 2 ORDER BY 1, 3 DESC`.

### Interpret and use

- **Segments** are the main output — use `rfm_segment` as a Parent Segment attribute to build audiences (reward Champions, win back Cannot lose them / High Value Sleeping, nurture Promising / New Customers).
- **`rfm_score`** ranks profiles within or across segments (e.g. top 10% for an offer). **`rfm_quartile`** gives finer audiences than the ten segments (e.g. `R4F1M%` = recent first-timers).
- **Scores are relative and replaced each run** — a profile's segment can change because others changed. Track trends with the workflow's appended `<stats_table>_daily_agg`, not the output table.
- **Other uses:** suppress low-value profiles from paid campaigns (e.g. `rfm_score` < 1.5), adjust message frequency by segment, and feed the quartiles as features to CLTV, propensity or lookalike models. Audiences built on the segments activate through the usual CDP channels (Journeys, Triggers, Personalization).
- **No monetary data** (all `monetary_value` 0) → `m_quartile` carries no information, and M-driven segments (Cannot lose them, High Value Sleeping) mean "frequent", not "high spend". Say so when presenting results.

### Diagnostics and limits

- **Refresh to match the purchase cycle** — weekly for retail and e-commerce, monthly for travel or automotive. Stale input makes everyone look inactive.
- **A large "Lost customers" group** — check `MAX(recency)` first: a high value usually means stale data; otherwise it can reflect real acquisition or one-time-purchase patterns.
- **Low-information dimensions** — if most profiles share one frequency, or spend barely varies (fixed-price subscriptions), that dimension adds little; consider a richer frequency definition, engagement metrics or a propensity model.
- **Not comparable across runs** — quartiles are relative, so a profile can change quartile without changing behavior. Compare raw `recency` / `frequency` / `monetary_value` for absolute change.
- **Descriptive, not predictive** — RFM describes past behavior; CLTV forecasts value, propensity predicts a specific outcome.

## 7. Common changes

| Goal | Change |
|---|---|
| Compare a setting without touching production | New `output_table` (e.g. `rfm_output_test`), run, compare segment mix with the production table, then switch back |
| Non-buyers distort M quartiles | Add `mv_threshold` (e.g. `0.05`) — M cut-offs then come from buyers only |
| Account outside the US | Regional `ml_batch_api_endpoint` (§3) |
| Slow run or out of memory | `use_sql: true`; if Trino then hits memory limits, add `use_hive: true` |
| Different definition of R, F or M (e.g. frequency = orders only, recency = last purchase) | Change the input table — `create_agg_input_table.sql`, or `query_type: custom` per source — keeping the four column names and types |
| Shorter or longer history | Time filter in `config/input_params.yml` (`references/workflow-setup.md` §2) |
| Keep score history per profile | Remove `+create_empty_output_table` (rows append each run) or copy the output to a dated table after each run. `output_mode: overwrite` replaces the contents instead |

### Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| POST returns 401/403 | The account has no AI Signals access, or the endpoint doesn't match the account's region | Check the region endpoint (§3); otherwise ask the account admin about AI Signals access |
| `+poll_status` fails reading `id` | `store_content: true` missing, or a task inserted between POST and poll | Restore the template order |
| Run fails on input | Missing or renamed column, wrong type, NULL values | `tdx describe <db>.<input_table>` — four columns, types as §2, no NULLs |
| Output rows = a multiple of input profiles | `output_mode: append` without the empty-table step | Restore `+create_empty_output_table` |
| One quartile holds most profiles | Heavy ties (frequency 1, monetary 0) | Expected with sparse data; consider `mv_threshold` or a richer frequency definition |
