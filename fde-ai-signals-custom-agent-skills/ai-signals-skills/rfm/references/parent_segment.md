---
name: rfm-parent-segment-update
description: |
  RFM Phase 5 Step 1 — specifies WHAT to add to the Parent Segment and WHAT example audiences to create in Audience Studio. Read by the calling agent alongside shared/parent_segment_update.md which handles the HOW.
---

# RFM Customer Segmentation — Parent Segment Update Spec

This file is the solution-specific "what" for Phase 5 Step 1. The process (approval gates, push mechanics, section placement rules) is in `../../shared/parent_segment_update.md`. Read both files together before making any changes.

---

## Attribute Block

**Block name:** `RFM Segmentation`
**Source table:** `<sink_database>.<output_table>` (default `rfm_output_table`)
**Join key:** the configured `globals.canonical_id` column (default `canonical_id`) ↔ the Parent Segment's matching customer ID

### Core Columns (always include)

| Column | Type | Label |
|--------|------|-------|
| `rfm_segment` | string | RFM Segment |
| `rfm_score` | number | RFM Score |
| `rfm_quartile` | string | RFM Quartile Code (e.g. `R4F3M2`) |

### Optional — Component Quartiles (add if the customer wants to filter on R, F or M individually)

| Column | Type | Label |
|--------|------|-------|
| `r_quartile` | number | Recency Quartile (4 = most recent) |
| `f_quartile` | number | Frequency Quartile (4 = most frequent) |
| `m_quartile` | number | Monetary Quartile (4 = highest spend) |

> **Default recommendation:** present Core Columns first. Add the component quartiles only if the customer confirms they need them for segmentation or activation. Confirm the exact column list with `DESCRIBE <sink_database>.<output_table>` before writing the attribute block.

---

## Example Audience Folder

**Folder name:** `RFM Examples`

Confirm this name with the user before creating any segments (per `../../shared/parent_segment_update.md` Step 3a).

---

## Example Segments

`rfm_segment` values produced by the workflow: `Champions`, `Loyal Customers`, `Potential Loyalists`, `Promising`, `New Customers`, `Cannot lose them`, `Need attention`, `Hibernating`, `High Value Sleeping`, `Lost customers`. Present this list to the user for approval before creating any YAMLs.

| Segment name | Filter | Description |
|---|---|---|
| `[RFM] Champions` | `rfm_segment = 'Champions'` | Bought recently, often, and spend the most — reward and upsell |
| `[RFM] Loyal Customers` | `rfm_segment = 'Loyal Customers'` | Recent, frequent, high-value — loyalty programs and referrals |
| `[RFM] Cannot Lose Them` | `rfm_segment = 'Cannot lose them'` | High spenders whose recency is slipping — win-back before they churn |
| `[RFM] High Value Sleeping` | `rfm_segment = 'High Value Sleeping'` | Valuable customers inactive for a long time — re-activation campaign |
| `[RFM] New Customers` | `rfm_segment = 'New Customers'` | Recent first purchases with low frequency — onboarding journey |

> **Note:** segment sizes depend on the customer's distribution. Run `SELECT rfm_segment, COUNT(*) FROM <sink_database>.<output_table> GROUP BY 1` first and drop examples with negligible size.
