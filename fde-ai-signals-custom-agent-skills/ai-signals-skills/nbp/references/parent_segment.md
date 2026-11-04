---
name: nbp-parent-segment-update
description: |
  NBP Phase 5 Step 1 — specifies WHAT to add to the Parent Segment and WHAT example audiences to create in Audience Studio. Read by the calling agent alongside shared/parent_segment_update.md which handles the HOW.
---

# NBP (Next Best Product) — Parent Segment Update Spec

This file is the solution-specific "what" for Phase 5 Step 1. The process (approval gates, push mechanics, section placement rules) is in `../../shared/parent_segment_update.md`. Read both files together before making any changes.

---

## Attribute Block

**Block name:** `Next Best Product`
**Source table:** `<sink_database>.<user_master_attr_table>` (default `nbp_user_master`)
**Join key:** the configured `original_user_id_column_name` column ↔ the Parent Segment's matching customer ID

### Core Columns (always include)

| Column | Type | Label |
|--------|------|-------|
| `nbp_1` | string | Next Best Product 1 |
| `nb_category_1` | string | Next Best Category 1 |
| `nbp_2` | string | Next Best Product 2 |
| `nb_category_2` | string | Next Best Category 2 |
| `nbp_3` | string | Next Best Product 3 |
| `nb_category_3` | string | Next Best Category 3 |
| `product_recommendations` | string | All Product Recommendations |
| `product_categories` | string | All Product Categories |

`product_recommendations` and `product_categories` are ordered arrays containing all model recommendations by rank — they are the canonical full output. Because they already cover every rank, individual per-rank columns above rank 3 (`nbp_4`, `nb_category_4`, `nbp_5`, `nb_category_5`) are redundant and should **not** be included by default.

### Optional — Individual Rank Columns Above 3

Include `nbp_4`/`nb_category_4` and above only if the customer's activation system requires discrete per-rank columns and cannot consume the array format.

### Optional — SKU Columns (add if customer needs raw item IDs for activation systems)

| Column | Type | Label |
|--------|------|-------|
| `nbp_1_sku` | string | Next Best Product 1 SKU |
| `nbp_2_sku` | string | Next Best Product 2 SKU |
| `nbp_3_sku` | string | Next Best Product 3 SKU |

> **Default recommendation:** include Core Columns only. Add SKU columns if the customer's activation system requires raw item IDs (e.g., email template placeholders, retargeting pixel). Add individual rank columns above 3 only if the array format is not usable downstream.

---

## Example Audience Folder

**Folder name:** `NBP Examples`

Confirm this name with the user before creating any segments (per `../../shared/parent_segment_update.md` Step 3a).

---

## Example Segments

Present this full list to the user for approval before creating any YAMLs.

**STOP — before creating any segment YAMLs, load `tdx-skills:segment`.** That skill defines the exact YAML schema (`rule:` not `rules:`, flat `attribute:` string, `operator:` as an object) required by `tdx sg push`. The filter descriptions below are business-logic shorthand — always translate them through `tdx-skills:segment` to produce valid YAML. Never hand-craft segment YAMLs without it.

The default example set is exactly **5 segments** — one per rule type below. Do not create more unless the user explicitly asks.

| # | Segment name | Filter | Attribute | Operator |
|---|---|---|---|---|
| 1 | `[NBP] Top Recommended Product: <Product>` | top product by `nbp_1` count | `nbp_1` | `Equal` |
| 2 | `[NBP] Top Recommended Category: <Category>` | top category by `nb_category_1` count | `nb_category_1` | `Equal` |
| 3 | `[NBP] Contains Product: <Product>` | same product as #1, anywhere in array | `product_recommendations` | `Contain` |
| 4 | `[NBP] Contains Category: <Category>` | same category as #2, anywhere in array | `product_categories` | `Contain` |
| 5 | `[NBP] Has Recommendations` | any recommendation exists | `nbp_1` | `IsNull` + `not: true` |

For segments 1–4, query `<user_master_attr_table>` to find the top product and category before presenting to the user:

```sql
SELECT nbp_1, COUNT(*) AS cnt
FROM <sink_database>.<user_master_attr_table>
WHERE nbp_1 IS NOT NULL
GROUP BY 1 ORDER BY 2 DESC LIMIT 1;

SELECT nb_category_1, COUNT(*) AS cnt
FROM <sink_database>.<user_master_attr_table>
WHERE nb_category_1 IS NOT NULL
GROUP BY 1 ORDER BY 2 DESC LIMIT 1;
```

> **Note:** Confirm segment counts with the customer before presenting as production audiences. Run a `COUNT(*)` query per filter against `<user_master_attr_table>` before finalizing the list.
