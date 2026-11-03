# Probabilistic ID Unification — Data Prep Guide

What `sql/input_table.sql` must produce and how to prepare the identifier data. The workflow does not clean the data for you — blocking and clustering are only as good as this table.

## 1. Prerequisites

- **Deterministic ID unification has run.** This workflow merges its canonical IDs (`id_col`); it does not replace it. Exact matches on a shared email or phone are the deterministic step's job.
- **At least 2 identifier columns** per ID (email, phone, address, name, device attributes), each ideally under ~50% NULL.
- **Standardized formats** — consistent case, no markup, phones in one format.

## 2. Input table contract

| Column | Rule |
|---|---|
| `id_col` | One row per canonical ID, never NULL |
| One column per `dedupe_columns` entry | Same name as the entry, raw values; `time`, `unified_contact_id` and `td_client_id` are ignored by blocking |
| Other columns | Optional; carried to `output_table` and merged per cluster in `dedupe_<output_table>` |

## 3. Choosing columns and types

| `type` | Use for | Built-in cleaning in the blocking SQL |
|---|---|---|
| `email` | Email addresses | Lowercased; the local part before `@` is hashed |
| `phone` | Phone numbers | Digits only |
| `string` | Names, addresses, any text | Lowercased, special characters removed, street-suffix abbreviations normalized |

Pick columns that identify a person across systems. A column with few distinct values (country, gender) matches everyone and only adds noise. Weights: `references/workflow-setup.md` §2 and the template README.

## 4. Cleaning rules

- Keep NULL for missing values. Never fill `'unknown'`, `'n/a'`, `'test@test.com'` or `'0000000000'` — shared placeholders glue unrelated IDs into giant clusters. Check the most reused values (`workflow-setup.md` §1, check 3) and turn them into NULL in `input_table.sql`.
- One value per ID per column: for IDs with several emails or phones, pick the most recent or most frequent one (or run the workflow once per identifier set).
- Exclude test, internal and bot accounts in the `WHERE` clause.
- Normalize before the table, where the rule is business-specific (country phone prefixes, plus-addressing in emails, company suffixes in names). The blocking SQL only applies the generic cleaning above.
- Columns above ~50% NULL: drop them, or set `fill_missing: False`.

## 5. Size and run time

| IDs | Expectation |
|---|---|
| Up to 100K | Minutes; template values fine |
| 100K–5M | Tens of minutes to hours; start with `jaccard_similarity_threshold` 0.90 |
| Above 5M | Hours; raise `jaccard_similarity_threshold` to 0.95, lower `max_ids_per_block`; test on a sample first (`LIMIT` in `input_table.sql` on a hash of `id_col`) |

## 6. Checklist before the first run

- [ ] `n_rows = distinct ids` in the input table
- [ ] 2–4 `dedupe_columns`, weights sum to 1.0, no placeholder value among the most reused ones
- [ ] `jaccard_similarity_threshold ≤ cluster_threshold`
- [ ] Test / internal accounts excluded
