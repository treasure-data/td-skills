# Journey Table Reference

## Table of Contents
1. Data Model
2. Column Categories
3. State Determination
4. tdx Commands
5. Sankey Data Structure
6. Key Constraints & Pitfalls

## 1. Data Model

### State Snapshot (NOT Append-Only)
- Full replacement on each execution
- All rows have the same `time` value (snapshot creation timestamp)
- One row per `cdp_customer_id` (primary key)
- `COUNT(*)` = `COUNT(DISTINCT cdp_customer_id)`
- `COUNT(DISTINCT time)` = 1

### Database & Naming
- Database: `cdp_audience_<parent_segment_id>`
- Table: `journey_<journey_id>`
- Discover via: `tdx journey columns "<journey-name>"`

## 2. Column Categories

9 categories (from `tdx journey columns` output `category` field):

### Fixed (`category: fixed`)
| Column | Type | Description |
|--------|------|-------------|
| `cdp_customer_id` | STRING | Primary key |
| `time` | BIGINT | Snapshot timestamp (same for all rows) |

### Journey (`category: journey`)
| Column | Description |
|--------|-------------|
| `intime_journey` | Entry timestamp |
| `outtime_journey` | Exit timestamp (NULL if active) |

### Goal (`category: goal`)
| Column | Description |
|--------|-------------|
| `intime_goal` | Goal achievement timestamp |

### Stage (`category: stage`)
| Pattern | Description |
|---------|-------------|
| `intime_stage_<N>` | Entry time into stage N |
| `outtime_stage_<N>` | Exit time from stage N |

N = 0, 1, 2, ... (0-indexed stage number)

### Milestone (`category: milestone`)
| Pattern | Description |
|---------|-------------|
| `intime_stage_<N>_milestone` | Milestone achievement in stage N |

### Exit Criteria (`category: exit_criteria`)
| Pattern | Description |
|---------|-------------|
| `intime_stage_<N>_exit_<M>` | Exit condition M met in stage N |

### Step (`category: step`)
| Pattern | Description |
|---------|-------------|
| `intime_stage_<N>_<step_uuid>` | Step entry |
| `outtime_stage_<N>_<step_uuid>` | Step exit |

Step UUIDs: e.g., `360a189d_4bc2_40be_a021_8d1afb72c46b`
Map to human-readable names via `tdx journey columns`.

Step types: Activation, Wait, End, DecisionPoint, ABTest, Jump, Merge

### Branch (`category: branch`)
| Pattern | Description |
|---------|-------------|
| `branch_stage_<N>_<step_uuid>` | Branch index taken (0, 1, 2...) |

For DecisionPoint or conditional Wait steps.

### Variant (`category: variant`)
| Pattern | Description |
|---------|-------------|
| `variant_stage_<N>_<step_uuid>` | A/B test variant (0=Control, 1=A, 2=B...) |

## 3. State Determination

### Customer State Logic
| State | Condition |
|-------|-----------|
| Never entered stage N | `intime_stage_N IS NULL` |
| Currently in stage N | `intime_stage_N IS NOT NULL AND outtime_stage_N IS NULL` |
| Exited stage N | `intime_stage_N IS NOT NULL AND outtime_stage_N IS NOT NULL` |
| Active in journey | `intime_journey IS NOT NULL AND outtime_journey IS NULL` |
| Exited journey | `outtime_journey IS NOT NULL` |
| Goal achieved | `intime_goal IS NOT NULL` |

### Current Stage (evaluate highest stage first)
Check stages in reverse order (stage N, N-1, ..., 0). First match where `intime IS NOT NULL AND outtime IS NULL` = current stage.

### Time Calculations
All timestamps are Unix epoch seconds.
- Days: `(t2 - t1) / 86400.0`
- Hours: `(t2 - t1) / 3600.0`
- Time-in-stage (current): `(time - intime_stage_N) / 86400.0` (use snapshot `time`)
- Time-in-stage (completed): `(outtime_stage_N - intime_stage_N) / 86400.0`
- Format: `TD_TIME_FORMAT(timestamp, 'yyyy-MM-dd HH:mm:ss', 'UTC')`

## 4. tdx Commands

### Schema Discovery
| Command | Returns |
|---------|---------|
| `tdx journey columns "<name>"` | Column schema with category, stageIndex, stageName, stepType, stepName, stepId |
| `tdx journey view "<name>"` | Journey metadata (database, table, stages, goal, reentry mode) |
| `tdx journey stats "<name>"` | Cumulative KPIs since launch |
| `tdx journey activations "<name>"` | Activation list |

### Stats Output Fields

**Journey overall:**
- `size`: Currently in journey (snapshot — same as SQL)
- `entered`: Total entered since launch (**cumulative — NOT in SQL**)
- `goal_achieved`: Total goal achievements (**cumulative — NOT in SQL**)
- `exit_or_jump`: Total exited/jumped (**cumulative — NOT in SQL**)
- `completion_rate`, `exit_or_jump_rate`: Percentages

**Per stage:**
- `size`, `entered`, `milestone`, `milestone_rate`, `exit_or_jump`, `exit_or_jump_rate`

### Traffic Data
```bash
tdx journey traffic "<name>" --from YYYY-MM-DD --to YYYY-MM-DD
```

Returns JSON with `conversion` and `activation` arrays.

**Conversion** (single object):
- `nodes[]`: `{ id, label, value: { type: "stage"|"goal"|"exit"|"jump" } }`
- `links[]`: `{ source, target, value, conversionRate }`

**Activation** (array, one per stage):
- `{ journeyStageName, journeyStageId, nodes[], links[] }`

## 5. Key Constraints & Pitfalls

### WRONG: Time filtering on `time` column
All rows share the same `time` value. `WHERE time > X` returns ALL or NOTHING.
Use `intime_journey`, `intime_stage_N` for time-based filtering.

### WRONG: Using `profile_id`
Journey tables use `cdp_customer_id` (NOT `profile_id`).

### WRONG: Assuming append-only
Table is fully replaced each execution. No historical state data.

### WRONG: Assuming linear progression
Customers can skip stages (Stage 0 → Stage 2 without Stage 1).
Customers can enter directly at later stages.

### NULL Handling
Most columns are NULL by default (stages not entered, goals not achieved).
Always use `NULLIF(denominator, 0)` for division.
`COUNT(column)` excludes NULLs — use this to count entries/achievements.

### Cumulative vs Snapshot
- `tdx journey stats` → cumulative since launch (entered, exits — includes customers who already left)
- SQL on journey table → current snapshot only
- `size` matches between both; `entered`/`exit_or_jump` only from stats

### Performance
- Select only needed columns (avoid `SELECT *`)
- Use `APPROX_PERCENTILE` and `APPROX_DISTINCT` instead of exact functions
- Use `LIMIT` for exploratory queries
- No partition pruning (single `time` value)
