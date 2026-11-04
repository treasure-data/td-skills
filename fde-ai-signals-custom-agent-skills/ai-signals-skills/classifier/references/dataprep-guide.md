# Classifier — Data Prep Guide

Business question → model input tables. Read in Phase 1 (use case, snapshots) and whenever `sql/input_features.sql` is written or changed. Contract and variables: `<workdir>/sql/README.md`.

| Table | Grain | Columns |
|---|---|---|
| `train_input_table` | entity × training cutoff | `session_id`, `cutoff_date`, `user_id_column`, features, `target_column` (0/1) |
| `pred_input_table` | entity at the scoring cutoff (run date) | same; target constant and ignored |

**Rules:** never guess the business definition (ask, with a recommendation) · features use `event_time < cutoff`, label uses `[cutoff, cutoff + label_window_days)` · one SQL for both modes, only the cutoff set differs · validate (§5) before scheduling (§6).

---

## 1. Define the use case

| Decision | Typical | Sets |
|---|---|---|
| Target event — "what counts as a 1?" | Table below | `label` CTE, `target_column` |
| Horizon | 30 d (weekly / monthly action), 90 d (strategic) | `label_window_days` |
| Observation window | 6–12 months, with 7 / 30 / 90-day sub-windows | `feature_lookback_days` |
| Population — "who is scored?" | Active in the window, minus converted / internal | `population` CTE |
| Snapshots | You decide (§2), user confirms | `n_train_snapshots`, `spacing_days` |
| Cadence | Monthly train / weekly score | §6 |

| Use case | Population at cutoff | Label = 1 in `[cutoff, cutoff + horizon)` |
|---|---|---|
| Churn — retail / app | ≥ N events in `active_days` before | **No** qualifying activity |
| Churn — subscription | Active at cutoff (dated history) | Cancellation / non-renewal |
| Conversion | Not converted before, seen in window | Conversion event |
| Cross-sell / upsell | Active (optionally never bought target) | Purchase in target category |
| Renewal | Contract expiring within horizon | Renews |
| Reactivation | No activity in `lapse_days` before | Any qualifying activity |
| Campaign response | Targeted / eligible at cutoff | Attributed click / purchase |
| Lead scoring | Open leads at cutoff | Lead won / applied |

Exclude anything already known at the cutoff (cancelled, converted, closed). A status table updated in place can't give the label — use events or dated history.

## 2. Snapshot (cutoff) design

```
 |<-- features: feature_lookback_days -->|<-- label: label_window_days -->|
 cutoff - lookback                     cutoff                    cutoff + horizon

run_date       = reference_date or session date
pred cutoff    = run_date
train cutoff k = run_date - spacing_days * k,  k = ceil(horizon/spacing) .. + n_train_snapshots - 1
```

Example — run 2026-10-19, horizon 60, spacing 60, 4 snapshots, window 180: train cutoffs 2026-08-20, 06-21, 04-22, 02-21; pred cutoff 2026-10-19.

**History check (must pass):** `spacing_days × (ceil(horizon / spacing) + n_train_snapshots − 1) + feature_lookback_days` days of data (example: 420). Short → fewer snapshots first, then a shorter window; tell the user.

### Choosing the snapshots

Decide from use case, label balance and history; give a one-line reason; confirm in the Phase 1 table. An entity appears once per snapshot (intended).

| Situation | Snapshots | Spacing |
|---|---|---|
| Thousands of positives at one cutoff, stable behavior | 1–2 | = horizon |
| Rare outcome (< ~1–2% or a few hundred positives) | 4–6 | = horizon |
| Seasonal business | Cover a year: `n × spacing ≥ 365` | = horizon |
| Long horizon (≥ 180 d) or short history | What the history check allows | 30–60 (overlapping labels) |
| Behavior changed recently | 1–2, recent only | = horizon |
| Lead scoring / renewal / short horizon | 2–4 / 3–4 / 4–8 | Lead cycle / = horizon / = horizon |

Ingestion lag shortens the latest label window slightly — schedule after the load; stale data → `reference_date`.

### Leakage checklist

- Every feature filter has `event_time < cutoff_ts`, lifetime features included.
- Recency = `DATE_DIFF('day', last_event, cutoff_dt)`, never `current_date`.
- Profile: immutable or as-of-cutoff only. Current status, tier, flags and Parent Segment recency / lifetime attributes leak.
- Nothing from the label source inside the label window.

## 3. Discovery

Run the queries in `workflow-setup.md` §1. Record per source: role (label / feature / profile), ID and event-time columns, useful columns, current-state columns (exclude or rebuild as of cutoff).

## 4. SQL patterns

Shape: `cutoffs` → `population` → feature CTEs → `label` → final SELECT. Every CTE carries `cutoff_date`; every join is on ID **and** `cutoff_date`.

```sql
-- Population: >= <min_events> events in the <active_days> before the cutoff
population AS (
  SELECT c.cutoff_date, c.cutoff_dt, c.feature_start_ts, c.cutoff_ts, c.label_end_ts, e.<id_col> AS ${user_id_column}
  FROM cutoffs c
  JOIN <source_database>.<events_table> e
    ON e.time >= c.cutoff_ts - <active_days> * 86400 AND e.time < c.cutoff_ts
  WHERE TD_TIME_RANGE(e.time, '${scan_start}', '${scan_end}') AND e.<id_col> IS NOT NULL
  GROUP BY 1, 2, 3, 4, 5, 6
  HAVING COUNT(*) >= <min_events>
),

-- Label: outcome inside the label window
label AS (
  SELECT DISTINCT c.cutoff_date, o.<id_col> AS ${user_id_column}, 1 AS ${target_column}
  FROM cutoffs c
  JOIN <source_database>.<outcome_table> o ON o.<time_col> >= c.cutoff_ts AND o.<time_col> < c.label_end_ts
  WHERE TD_TIME_RANGE(o.<time_col>, '${scan_start}', '${scan_end}')  -- AND <label filter>
),
-- final SELECT: CAST(COALESCE(l.${target_column}, 0) AS BIGINT) AS ${target_column}

-- One feature CTE per source (all windows end at the cutoff)
<src>_features AS (
  SELECT c.cutoff_date, e.<id_col> AS ${user_id_column},
    COUNT_IF(e.time >= c.cutoff_ts - 30 * 86400)                    AS <src>_events_30d,
    COUNT(*)                                                         AS <src>_events_window,
    SUM(e.<amount_col>)                                              AS <src>_amount_window,
    DATE_DIFF('day', DATE(FROM_UNIXTIME(MAX(e.time))), c.cutoff_dt)  AS <src>_days_since_last
  FROM cutoffs c
  JOIN <source_database>.<source_table> e ON e.time >= c.feature_start_ts AND e.time < c.cutoff_ts
  WHERE TD_TIME_RANGE(e.time, '${scan_start}', '${scan_end}')
  GROUP BY c.cutoff_date, c.cutoff_dt, c.cutoff_ts, e.<id_col>
)
```

- **Activity churn:** `label` = entities **with** activity; final SELECT `CAST(CASE WHEN l.${user_id_column} IS NULL THEN 1 ELSE 0 END AS BIGINT)`. At scoring the target is 1 for all — ignored.
- **Population variants:** conversion → `NOT EXISTS` conversion before the cutoff · subscription → `start_ts < cutoff_ts AND (end_ts IS NULL OR end_ts >= cutoff_ts)` · reactivation → `HAVING MAX(e.time) < c.cutoff_ts - <lapse_days> * 86400` · lead → created, not closed before the cutoff.
- **Feature ideas per source:** orders (counts / spend per window, days since last, category breadth, return rate) · web / app (sessions, active days, key-page visits) · email (opens, clicks, days since last open) · support (tickets, open at cutoff) · subscription (tenure at cutoff, downgrades, payment failures) · profile (signup tenure, channel, region).
- **Final SELECT:** list every feature (no `SELECT *`); counts / amounts `COALESCE(…, 0)`, recency / ratios keep NULL; tenure from a signup date, not the scan window.

## 5. Validate the input tables

After the first `data_prep` and every SQL change, before `workflow-setup.md` §4 checks 2–5. Show: check · value · pass / fail · action.

| # | Check | Pass |
|---|---|---|
| 1 | Cutoffs | Train: `n_train_snapshots` dates, latest + horizon ≤ run date. Pred: one = run date |
| 2 | Population per cutoff | Non-zero, ±30% across cutoffs; pred ≈ latest train cutoff |
| 3 | Label rate per cutoff | Both classes, minority ≥ 1%, stable, near the expectation |
| 4 | Duplicates | 0 repeated (ID, `cutoff_date`) |
| 5 | Parity | Same columns and types in both tables |
| 6 | Null / constant | No feature 100% NULL or constant; flag > 90% NULL |
| 7 | Leakage | No \|corr\| > 0.9 to the target; no current-state attributes |
| 8 | Drift | Pred means vs latest train cutoff: flag > 50% change |
| 9 | `columns_to_drop` | `time`, `session_id`, `cutoff_date` + every non-feature |

```sql
-- 1-3
SELECT cutoff_date, COUNT(*) AS n, SUM(<target_column>) AS positives, ROUND(AVG(CAST(<target_column> AS DOUBLE)), 4) AS label_rate
FROM <db>.<train_input_table> GROUP BY 1 ORDER BY 1;
SELECT cutoff_date, COUNT(*) AS n FROM <db>.<pred_input_table> GROUP BY 1;
-- 4
SELECT COUNT(*) AS dup_keys FROM (SELECT <user_id_column>, cutoff_date FROM <db>.<train_input_table> GROUP BY 1, 2 HAVING COUNT(*) > 1);
-- 6-7 (per feature)
SELECT AVG(IF(<feature> IS NULL, 1.0, 0.0)) AS null_rate, APPROX_DISTINCT(<feature>) AS distinct_values,
       CORR(CAST(<feature> AS DOUBLE), CAST(<target_column> AS DOUBLE)) AS corr
FROM <db>.<train_input_table>;
```

| Symptom | Fix |
|---|---|
| Label rate ≈ 0% / 100% | Revisit population and label filter |
| Latest cutoff rate much lower | Data ends before the run date → `reference_date` = last loaded date |
| Fewer cutoffs than set / earliest nearly empty | History too short → fewer snapshots or shorter window |
| Duplicates | One row per (ID, `cutoff_date`); join on both |
| Pred table empty / feature NULL in pred only | Source stopped or not refreshed → check last event date, `reference_date` |

## 6. Schedules

Ask (requirements 18–19); none for a test account. Pushing a schedule activates it — confirm first.

- Score only after a successful training (no model under `model_name` → predict fails); train and score at different hours.
- Different cadences → schedule `train.dig` and `predict.dig`, not `classify.dig` (it always runs both).
- Retrain no more often than every `label_window_days / 2`; daily scoring only if the business acts daily.

| Use case | `train.dig` | `predict.dig` |
|---|---|---|
| Churn / cross-sell, 30–60 d | `monthly>: 1,02:00:00` | `weekly>: Mon,06:00:00` |
| Lead scoring | `weekly>: Sun,02:00:00` | `daily>: 06:00:00` |
| Renewal, 90 d | `monthly>: 1,02:00:00` | `monthly>: 2,06:00:00` |

Uncomment the placeholders at the top of the `.dig` file (`schedule:`, `timezone:`, `_error:` with the alert email).
