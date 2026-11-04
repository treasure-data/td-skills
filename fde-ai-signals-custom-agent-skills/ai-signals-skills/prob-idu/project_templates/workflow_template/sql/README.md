# Input table SQL

`ml_prob_unification_launch.dig` runs `input_table.sql` and writes the result to `${input_table}` in `${sink_database}`. The template file is an **example structure** — it is rewritten for every project from the Phase 1 data discovery; the workflow cannot run until every `<...>` placeholder is replaced.

## Output contract

| Column | Rule |
|---|---|
| `${id_col}` | One row per canonical ID (the output of deterministic ID unification), never NULL |
| One column per `dedupe_columns` entry | Name = the entry's `name`; raw values — emails and phones are normalised in the blocking SQL by `type` |
| Other columns | Optional; kept in the output table and merged per cluster in the final step |

## Rules

- Run deterministic ID unification first; this workflow merges its canonical IDs, it does not replace it.
- One row per `${id_col}`: collapse multi-valued identifiers (several emails or phones per ID) to one chosen value per column, or build the row from the most recent / most frequent value.
- Keep NULL for missing values — do not fill with `'unknown'`, `'n/a'` or `'0000000000'` (shared placeholder values glue unrelated IDs together).
- Columns with more than ~50% NULL add little signal; drop them or set `fill_missing: False`.
- `time`, `unified_contact_id` and `td_client_id` are ignored by the blocking step (`sql/create_features.sql`).
