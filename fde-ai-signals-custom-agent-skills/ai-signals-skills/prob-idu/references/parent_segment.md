# Probabilistic ID Unification — Parent Segment Update Spec

This file is the solution-specific "what" for Phase 5 Step 1. The process (approval gates, push mechanics, section placement rules) is in `../../shared/parent_segment_update.md`. Read both files together before making any changes.

---

## Source Table

**Source table:** `<sink_database>.dedupe_<output_table>` (default `dedupe_prob_idu_clusters`) — written by `+merge_prob_ids` at the end of every run: one row per canonical ID that belongs to a cluster. Only matched clusters (two or more IDs) are in the table; IDs without a probabilistic match have no row, so they have no value for these attributes.

**Join key:** the `id_col` column (default `persistent_id`) ↔ the Parent Segment's customer ID, as a plain attribute join (no behavior table).

## Attribute Block

**Block name:** `Probabilistic Identity` — confirm with the user.

| Column | Type | Label |
|--------|------|-------|
| `prob_id` (the configured `cluster_col_name`) | string | `Probabilistic ID` |
| `avg_cluster_similarity` | number | `Match Confidence` |

Optional: other carried-through input columns (for example the merged email or phone values) when marketers need to see what was matched.

> **Default recommendation:** both core columns. The cluster ID also serves as a grouping key for deduplicating audiences at activation.

---

## Example Audience Folder

**Folder name:** `Probabilistic Identity Examples`

Confirm this name with the user before creating any segments (per `../../shared/parent_segment_update.md` Step 3a).

---

## Example Segments

Present this full list to the user for approval before creating any YAMLs.

**STOP — before creating any segment YAMLs, load `tdx-skills:segment`.** That skill defines the exact YAML schema (`rule:` not `rules:`, flat `attribute:` string, `operator:` as an object) required by `tdx sg push`. The filter descriptions below are business-logic shorthand — always translate them through `tdx-skills:segment` to produce valid YAML. Never hand-craft segment YAMLs without it.

The default example set is exactly **3 segments**. Do not create more unless the user explicitly asks.

| # | Segment name | Filter | Attribute | Operator |
|---|---|---|---|---|
| 1 | `[Prob ID] In a Probabilistic Cluster` | has a cluster ID | `prob_id` | `IsNull` with `not: true` |
| 2 | `[Prob ID] High-Confidence Matches` | match confidence of 0.95 or more | `avg_cluster_similarity` | `GreaterEqual` 0.95 |
| 3 | `[Prob ID] Review Matches` | match confidence below 0.85 (manual review before merging profiles) | `avg_cluster_similarity` | `Less` 0.85 |

Before presenting, query the source table for the sizes:

```sql
SELECT COUNT(*) AS ids_in_clusters, COUNT(DISTINCT prob_id) AS clusters,
       SUM(CASE WHEN avg_cluster_similarity >= 0.95 THEN 1 ELSE 0 END) AS high_confidence,
       SUM(CASE WHEN avg_cluster_similarity < 0.85 THEN 1 ELSE 0 END) AS review
FROM <sink_database>.dedupe_<output_table>;
```

> **Note:** the confidence cut-offs are fixed values chosen with the customer; confirm segment counts before presenting them as production audiences.
