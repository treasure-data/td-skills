# Custom Audience Agent — Data Discovery

Phase 1 exploration of the parent segment, read-only. Everything found here fills `data-dictionary.md` (facts) and seeds the `business-context.md` draft (inferences). Run the queries yourself (no subagents), one shell command per step (`tdx query … & tdx query … & wait`). Don't start SQL with a `--` comment — `tdx query` reads it as an option. Write only aggregates to files.

`<PS>` = the parent segment name, `<db>` = its output database (`cdp_audience_<parent_id>`), `<dir>` = `agent_outputs/<project_slug>`.

## 1. Account and parent segment

```bash
tdx auth status          # confirm the account and site with the user
tdx ps list              # parent segments in the account
```

Ask with `AskUserQuestion` which parent segment the agent serves (up to 4 options from the list, most profiles first; "Other" for the rest). Record its name and ID in `project_state.md`.

## 2. Schema and existing segments

```bash
tdx ps desc "<PS>" -o <dir>/schema.json                        # prints the output database and table counts
tdx sg list -r --parent-segment "<PS>" --max-depth 3            # folders, segments, sizes
```

Read **all** of `schema.json`: the `customers` attributes and every `behavior_*` table with its columns. Existing segment names show the customer's naming convention and the audiences they already care about.

## 3. Profile attributes (`customers`)

One query for row count and null % of every column (generate the column list from `schema.json`):

```sql
SELECT COUNT(*) AS n,
       1.0 - COUNT(<col_1>) * 1.0 / COUNT(*) AS null_<col_1>,
       1.0 - COUNT(<col_2>) * 1.0 / COUNT(*) AS null_<col_2>
FROM customers
```

Then one `UNION ALL` query for the top values of every low-cardinality column (≤ ~20 distinct values), and one for min / max / avg of the numerics:

```sql
SELECT '<col>' AS col, CAST(<col> AS VARCHAR) AS value, COUNT(*) AS n FROM customers GROUP BY 1, 2
UNION ALL
SELECT '<next col>', CAST(<next col> AS VARCHAR), COUNT(*) FROM customers GROUP BY 1, 2
ORDER BY col, n DESC
```

Keep the top ~8 values per column. Empty strings and `'null'` text count as values — note them.

## 4. Behaviors (`behavior_*`)

One `UNION ALL` query over all behavior tables: rows, distinct profiles, and the date range of `time` and of every other timestamp-looking column:

```sql
SELECT 'behavior_<name>' AS tbl, COUNT(*) AS n_rows, COUNT(DISTINCT cdp_customer_id) AS profiles,
       TD_TIME_FORMAT(MIN(time), 'yyyy-MM-dd') AS time_min, TD_TIME_FORMAT(MAX(time), 'yyyy-MM-dd') AS time_max,
       COUNT(DISTINCT time) AS time_distinct,
       MIN(<event_ts_col>) AS event_min, MAX(<event_ts_col>) AS event_max
FROM behavior_<name>
UNION ALL …
```

**Event time:** TD's `time` is often the load time (few distinct values, identical across rows, later than the event column). Pick the real event column per table and note its format (unix seconds or varchar). Then a top-values query for the event-type, status, category and channel columns of each behavior table — these become candidate conversion events, product categories and channel values.

## 5. Flags for the files

Record per column or table:

| Flag | Goes to |
|---|---|
| > 50% null, constant columns, empty-string semantics, varchar dates, arrays | `data-dictionary.md` Notes / Data Quality Notes |
| PII-looking columns (`email`, `*name`, `phone`, `address`, `*_id` other than the join key) | `data-dictionary.md` Notes **and** a draft rule in `business-context.md` → Exclusion and Compliance Rules |
| Consent / opt-out / unsubscribe / test-account columns | `business-context.md` → Exclusion and Compliance Rules (draft rule, `[INFERRED — please confirm]`) |
| Status, stage, tier, lifecycle columns (lead stage, loyalty tier, VIP flag) | `business-context.md` → Key Terms and Definitions (draft definitions) |
| Purchase / order / sign-up / application events | `business-context.md` → Key Terms (candidate conversion events) |
| Category / department / brand columns | `business-context.md` → Product Categories |
| Data that ends before today | `data-dictionary.md` Data Quality Notes ("last 3 months" is relative to the last event) |

Then record in `project_state.md` → Discovery Findings: parent segment, profiles, tables, event time columns, data range, caveats.
