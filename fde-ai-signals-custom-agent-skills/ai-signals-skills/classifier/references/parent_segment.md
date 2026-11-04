# Classifier — Parent Segment Update Spec

This file is the solution-specific "what" for Phase 5 Step 1. The process (approval gates, push mechanics, section placement rules) is in `../../shared/parent_segment_update.md`. Read both files together before making any changes.

---

## Source Table

**Source table:** `<sink_database>.<pred_output_table>_latest` (default `classifier_predictions_latest`) — written by `+latest_scores` at the end of every `predict.dig` run: one row per user from the latest scored batch. Never use `<pred_output_table>` itself — it is appended on every run, so a profile would match one row per run.

**Join key:** `user_id` ↔ the Parent Segment's customer ID matching the configured `user_id_column`.

## Attribute Block

**Block name:** the use case in business words (e.g. `Churn Propensity`, `Lead Score`) — confirm with the user.

| Column | Type | Label |
|--------|------|-------|
| `score` | number | `<Use case> Score` (e.g. Churn Risk Score) |
| `score_bucket` | string | `<Use case> Score Bucket` |
| `predicted_label` | number | `<Use case> Predicted` (1 = above the model threshold) |

Optional: `prediction_timestamp` (string, "Score Date") when marketers need to see how fresh the score is.

> **Default recommendation:** all three core columns. If the customer only ranks (no yes/no decision — requirements question 16), `predicted_label` can be left out.

---

## Example Audience Folder

**Folder name:** `<Use case> Examples` (e.g. `Churn Propensity Examples`)

Confirm this name with the user before creating any segments (per `../../shared/parent_segment_update.md` Step 3a).

---

## Example Segments

Present this full list to the user for approval before creating any YAMLs.

**STOP — before creating any segment YAMLs, load `tdx-skills:segment`.** That skill defines the exact YAML schema (`rule:` not `rules:`, flat `attribute:` string, `operator:` as an object) required by `tdx sg push`. The filter descriptions below are business-logic shorthand — always translate them through `tdx-skills:segment` to produce valid YAML. Never hand-craft segment YAMLs without it.

The default example set is exactly **4 segments**. Do not create more unless the user explicitly asks. Name them in the customer's terms from `business-context.md` (e.g. "Hot leads", "At-risk customers").

| # | Segment name | Filter | Attribute | Operator |
|---|---|---|---|---|
| 1 | `[<Use case>] Predicted Positive` | above the model threshold | `predicted_label` | `Equal` 1 |
| 2 | `[<Use case>] Top Score Bucket` | `0.9-1.0` (or the top two buckets if that one is small) | `score_bucket` | `Equal` / `In` |
| 3 | `[<Use case>] High Score` | `score` ≥ the 90th percentile of the latest run | `score` | `GreaterEqual` |
| 4 | `[<Use case>] Low Score` | `score` below the 30th percentile (suppression or a different treatment) | `score` | `Less` |

Before presenting, query the source table for the values and sizes:

```sql
SELECT APPROX_PERCENTILE(score, 0.9) AS p90, APPROX_PERCENTILE(score, 0.3) AS p30,
       SUM(predicted_label) AS predicted_positive, COUNT(*) AS scored
FROM <sink_database>.<pred_output_table>_latest;

SELECT score_bucket, COUNT(*) AS cnt
FROM <sink_database>.<pred_output_table>_latest
GROUP BY 1 ORDER BY 1 DESC;
```

> **Note:** round the percentile cut-offs to two decimals and state that they are fixed values from this run — they don't move with later runs. Confirm segment counts with the customer before presenting them as production audiences.
