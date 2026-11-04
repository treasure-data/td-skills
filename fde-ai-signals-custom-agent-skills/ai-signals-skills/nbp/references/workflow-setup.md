# NBP (Next Best Product) — Workflow Setup

Use with `../../shared/push_pattern_td_workflows.md` (copy, gates, push, run). Two other files are the source of truth — read both in the working copy before editing anything:

- `<workdir>/README.md` — workflow structure, what every parameter does and how to choose it, outputs, customization points
- `<workdir>/config/input_params.yml` — exact parameter names, nesting and syntax (edit this file in place; keep every key)

`<workdir>` = `agent_outputs/<project_slug>/workflow`. This file adds only what the template can't: how to pick values from the customer's data, NBP deploy details, and the output checks.

> **Minimal push first (Phase 3, before requirements come back).** Configure the real interaction table, item info, column mappings and filters from Phase 1; take the "First push" default of every rule below; template values for everything else; schedule and failure email left commented. Record each assumed value and data caveat in `project_state.md` as "default — confirm in requirements" and move on — caveats are resolved in Phase 4, not before the first run.

---

## 1. Map Phase 1 tables to the config

NBP reads **one interaction table** (one row per user and item — order line, purchase, item view) and **one item info source** (names and categories — the same table or a product catalog).

| Role | Must have | Config |
|---|---|---|
| Interaction table | User ID, item ID, UNIX timestamp; item-level rows | `in_db`, `original_item_transactions_table`, `original_user_id_column_name`, `original_item_id_column_name`, `original_timestamp_name` |
| Item info | Item ID matching the interaction table (as VARCHAR), item name, item category | `original_item_info_table`, `original_item_name_column_name`, `original_item_category_column_name` |

Rules:
- **Item-level rows only.** Order-level tables (no item column), aggregated or profile tables, and events without an item ID (sessions, pageviews) are not a source. No item-level table → NBP cannot run; tell the user.
- **Strongest signal.** If one table mixes event types (view, add-to-cart, purchase), keep the strongest the data supports — purchase > add-to-cart > view — with `transaction_filter` (e.g. `AND event_type = ''purchase''`). **First push:** purchases, or completed orders when the table has a status (exclude cancelled and returned).
- **Profile ID:** `original_user_id_column_name` is also the ID column of `user_master_attr_table`, so it must be the ID the Parent Segment joins on.
- **Event time:** `original_timestamp_name` is used as `tstamp` and in the time filter, so it must be a UNIX-seconds column. Decide per table in Phase 1 whether TD's `time` is the real event time or only the load time:

  | Profile shows | Meaning | Use |
  |---|---|---|
  | Same range as the candidate event column, median gap under ~1 day (or exactly whole hours — a local-time string) | `time` is the event time | `time` |
  | `time` spans days while the candidate spans months, few distinct `time` values, or `time` always later | `time` is the load time | A UNIX-seconds event column. If the event column is a string, keep `time` for the first push and note it as a caveat — using the string needs a customization of `queries/create_transaction_table.sql` (README Customization Points) |
  | No candidate column | Only `time` exists | `time`, noted as a caveat |

  Record the choice and its evidence in `project_state.md`.
- **Item info:** use the interaction table itself when it has name and category for more than ~90% of items; otherwise the product catalog whose item ID matches after the VARCHAR cast.
- **Exclusions:** **First push:** none (`exclude_product_train` and `exclude_product_recs` `'no'`). Record candidates seen in the data (gift cards, memberships, test or sample items, discontinued items) for the requirements doc.
- **Quotes:** string literals inside `transaction_filter` and the exclusion regexes use doubled single quotes, as in the template; keep `yes` / `no` values quoted.

### Discovery queries

Run with `tdx query` against the source database — yourself, not through subagents. Replace the placeholders with the real column names from the Phase 1 column query. Don't start the SQL with a `--` comment: `tdx query` reads it as an option and fails. Run all of them in **one shell command** (`tdx query … & tdx query … & wait`), not as separate tool calls.

**1. Profile of the interaction table** — size, granularity, NULLs, event-time decision, date range. `<event_time>` is the candidate event column as UNIX seconds (`TD_TIME_PARSE(<col>)` for a string); omit the `event_*` / `median_gap_s` columns when `time` is the only timestamp:

```sql
SELECT COUNT(*) AS total_rows,
       COUNT(DISTINCT <user_col>) AS users, COUNT(DISTINCT <item_col>) AS items,
       CAST(COUNT(*) AS DOUBLE) / COUNT(DISTINCT <user_col>) AS rows_per_user,
       COUNT_IF(<user_col> IS NULL) AS null_users, COUNT_IF(<item_col> IS NULL) AS null_items,
       TD_TIME_FORMAT(MIN(time), 'yyyy-MM-dd') AS time_first, TD_TIME_FORMAT(MAX(time), 'yyyy-MM-dd') AS time_last,
       TD_TIME_FORMAT(MIN(<event_time>), 'yyyy-MM-dd') AS event_first, TD_TIME_FORMAT(MAX(<event_time>), 'yyyy-MM-dd') AS event_last,
       COUNT(DISTINCT time) AS time_distinct,
       APPROX_PERCENTILE(ABS(time - <event_time>), 0.5) AS median_gap_s
FROM <source_database>.<interaction_table>
```

Minimum viable data: more than 100 users, more than 10 items, more than one row per user on average. Below that, tell the user NBP won't add much value.

**2. Item info coverage** — same table (`<info_table>` = the interaction table) or catalog, and the join:

```sql
SELECT COUNT(DISTINCT CAST(t.<item_col> AS VARCHAR)) AS tx_items,
       COUNT(DISTINCT CASE WHEN i.<name_col> IS NOT NULL THEN CAST(t.<item_col> AS VARCHAR) END) AS items_with_name,
       COUNT(DISTINCT CASE WHEN i.<category_col> IS NOT NULL THEN CAST(t.<item_col> AS VARCHAR) END) AS items_with_category
FROM <source_database>.<interaction_table> t
LEFT JOIN (SELECT DISTINCT CAST(<info_item_col> AS VARCHAR) AS item_key, <name_col>, <category_col>
           FROM <source_database>.<info_table>) i
  ON CAST(t.<item_col> AS VARCHAR) = i.item_key
```

**3. One breakdown query** — event types / statuses (for `transaction_filter`), categories and low-volume or test-looking items (exclusion candidates). One `UNION ALL`, one block per column:

```sql
SELECT '<col>' AS col, CAST(<col> AS VARCHAR) AS value, COUNT(*) AS n
FROM <source_database>.<interaction_table> GROUP BY 1, 2
UNION ALL
SELECT '<next col>', CAST(<next col> AS VARCHAR), COUNT(*) FROM … GROUP BY 1, 2
ORDER BY col, n DESC
```

Record the column names and findings in `project_state.md` (Phase 1) — they are needed again in Phase 4.

## 2. Choose the other values

| Decision | Rule |
|---|---|
| Algorithm (`automl_model_type`) | **First push:** `similar_to_latest`. `als` when most users have several interactions and personalization matters most; `popular` as a cold-start fallback or when interactions are very sparse. If the test set shows the model below the random baseline, or a personalized model doesn't beat `popular` on the training metrics, try `similar_to_latest` or `popular` (§4 check 5) |
| ALS sampling | Only with `als`: `als_sample_rate` `1.0` under ~200K users, `0.5` for 200K–500K, `0.3` above; keep `als_max_users: 100000` |
| `max_recommended_items` | **First push:** `5`; the requirements decide how many products each channel shows |
| `filter_viewed` | **First push:** `false`; `true` when repeat purchases should not be recommended (durables, one-off purchases) |
| Time window (`orders_lookback`) | **First push:** `''` (all history). A number of days for a rolling window — long enough to cover repeat purchases (180–730). Data that ends before today (demo, paused feed) needs `''` or a window that still reaches the data, because the window counts back from the run time |
| `prefix`, `user_master_attr_table` | Project-specific when another NBP project could share the account (e.g. `nbp_loyalty_`, `nbp_loyalty_user_master`) — the prefix also names the AI Signals model, so two projects with the same prefix and algorithm overwrite each other's model. Default `nbp_` / `nbp_user_master` for a single project |
| Test set | Keep `run_model_test_set: 'yes'` and `test_lookback: 30d`; widen the window when there are few purchases per month |
| `cleanup_temp_tables` | `'no'` for the first runs; `'yes'` in production |
| Failure email | Uncomment the `_error` block in `nbp_launch.dig` and set the address from the requirements, or leave it commented if none is given. Put the project name in `subject` |

## 3. Deploy details

| Item | Value |
|---|---|
| Default project name | `nbp_ais` (from `tdx.json`) |
| Entry point | `nbp_launch` |
| Secrets | None to set. `nbp_ai_signals.dig` sends `${secret:td.apikey}`, which the AI Signals architecture provides — never ask the user to set it, and keep the header exactly as in the template |
| API endpoint | `ml_batch_api_endpoint` in the config — set it to the account's region (`tdx status`); the values are in the template README |
| Schedule | Commented out in `nbp_launch.dig`. Ask whether the customer wants scheduled runs; leave it commented for a test account |
| Sink database | Created by `+create_sink_database` if missing. If the project owner can't create databases, the user creates it in the TD Console before the first run |

Push and run with the shared pattern (`tdx wf push -y` from `<workdir>`, `tdx wf run <project>.nbp_launch` after the one approval).

## 4. Validate

Run after every run (Phase 3 and Phase 4), as direct `tdx query` calls in one shell command (`tdx query … & tdx query … & wait`) — never through a script you write. Replace `<db>` with `sink_database`, `<p>` with `prefix`, `<um>` with `user_master_attr_table`, `<id>` with `original_user_id_column_name`. Record the results in `project_state.md`.

**1. User table populated, one row per user, recommendations filled**

```sql
SELECT COUNT(*) AS rows, COUNT(DISTINCT <id>) AS users,
       COUNT(nbp_1) AS has_rec_1, COUNT(nb_category_1) AS has_category_1
FROM <db>.<um>
```
Pass: `rows = users > 0`; `has_rec_1` and `has_category_1` above ~80% of `users`. Lower → item info join issues (check 2 in §1) or sparse data.

**2. Coverage against the input**

```sql
SELECT (SELECT COUNT(DISTINCT userid) FROM <db>.<p>transaction) AS input_users,
       (SELECT COUNT(*) FROM <db>.<p>topk_recommended_items) AS model_users,
       (SELECT COUNT(*) FROM <db>.<um>) AS output_users
```
Pass: `model_users` close to `input_users` (ALS sampling and cold-start users can lower it); `output_users` close to `model_users` (a large gap means the item-name join dropped rows).

**3. Recommendations look like real products and vary**

```sql
SELECT nbp_1, nb_category_1, COUNT(*) AS users
FROM <db>.<um> GROUP BY 1, 2 ORDER BY 3 DESC LIMIT 20
```
Pass: readable item names (not raw SKUs, NULLs or test items); no single item for more than ~50% of users — unless the algorithm is `popular`.

**4. Dashboard tables have this run**

```sql
SELECT session_id, users_with_recs, distinct_items_recommended, time_range_days, model_params
FROM <db>.<p>dash_model_param_stats_agg
WHERE session_id = (SELECT session_id FROM <db>.<p>global_session_filter WHERE session_rnk = 1)
```
Pass: one row for the latest session; `model_params` shows the configured algorithm.

**5. Test set beats the random baseline** (when `run_model_test_set = 'yes'`)

```sql
SELECT * FROM <db>.<p>dash_testset_numbers ORDER BY 1 DESC LIMIT 3
```
Pass: the model's precision / recall above the random baseline. It is an in-sample check — the test window's purchases are also in the training data — so treat it as a sanity check, not a forecast. If not, the data may be too sparse for the algorithm — note it and suggest `similar_to_latest` or `popular` in Phase 4.

### Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `<um>` empty | Run failed before or during the model steps | `tdx wf attempt <id> tasks`, then `logs +<failed task>` |
| Item names show as SKUs or NULL | Item ID mismatch between the interaction and info tables | §1 check 2; fix `original_item_info_table` / column names |
| Train or predict step returns 401/403 | `ml_batch_api_endpoint` doesn't match the account's region, or the account has no AI Signals access | Set the regional endpoint; otherwise ask the account admin about AI Signals access |
| Few users get recommendations | Sparse interactions, ALS sampling, or a too-short `orders_lookback` | Widen the window; `similar_to_latest` or `popular`; check `als_sample_rate` |
| All recommendations from one category | Narrow catalog or unbalanced data | Review the category breakdown; consider `filter_viewed: true` or exclusions |
| Training exclusion removes the wrong items | Regex or column wrong | Run the regex as a `COUNT(*)` on `<p>transaction_unfiltered` (`exclusion_column` must be `itemid`, `item_name` or `item_category`) |
| Test set below the random baseline | Too few items or interactions for the algorithm | Try `similar_to_latest` or `popular`; widen the time window |
