---
name: predictive-scoring
description: >
  Manages Audience Studio predictive scoring models (Predictive Segments) using tdx api and Audience/CDP APIs.
  Covers listing models in a parent segment, creating new models from existing segments,
  running (re)training jobs, inspecting feature importance and score distributions,
  and guiding how to use predicted scores for segmentation.
  Use when: creating/retraining/inspecting Predictive Scoring models, asking about "predictive scoring", "predictive segments", "propensity model", "lookalike model" in CDP context, or understanding which attributes/behaviors drive a predictive model.
---

# tdx Predictive Scoring — Audience Studio Predictive Segments

## Prerequisites & Permissions

- Predictive Scoring must be enabled for the account (feature flag / contract).
- The parent segment (audience) must already exist and be enabled in Audience Studio.
- The parent segment workflow must have run successfully at least once before predictive scores are available.
- Column Visibility:
  - Only columns with visibility **Clear** can be used as features and are visible in predictive scoring UIs.
  - Columns marked as PII or Blocked will not appear as selectable features and are hidden in Predictive Scores / Model Performance views.
- Folder-based permissions:
  - Creating, editing, deleting, or running a predictive model requires View+ (View or Full Control) for:
    - The folder that contains the predictive scoring model.
    - All referenced segments:
      - Training Population
      - Scoring Target
      - Positive Samples
- Do **not** attempt predictive scoring operations if the user does not have appropriate Audience Studio permissions.

## Key Concepts

- **Parent Segment (Audience)** — The unified customer base (cdp_audience_{id}) that predictive scoring is attached to.
- **Predictive Segment / Predictive Scoring Model** — A model that predicts the likelihood of a target behavior (churn, purchase, click, conversion, etc.) for profiles in a parent segment.
- **Training Population** — Segment (or All Profiles) used as the base population for training.
- **Scoring Target** — Segment representing the profiles that exhibited the target behavior (positive label).
- **Positive Samples** — Segment representing examples of the behavior you want to predict (used by some UI workflows).
- **Features (Categorical / Array / Quantitative)** — Attribute/behavior columns from the parent segment that the model uses as predictors.
- **Grade Thresholds** — Score thresholds (e.g., [75, 50, 25]) that define A/B/C buckets.

## API Overview

Prefer JSON:API **entities** endpoints for model-level operations, and Audience endpoints for listing models per parent segment:

- Audience API (per parent segment):
  - `GET  /audiences/{audienceId}/predictive_segments`
    - List predictive models for a given parent segment.
  - `POST /audiences/{audienceId}/predictive_segments`
    - Create a new predictive scoring model (legacy payload).
- JSON:API entities (model-level):
  - `POST   /entities/predictive_segments`                  # Create model (JSON:API envelope)
  - `PATCH  /entities/predictive_segments/{id}`             # Update model
  - `DELETE /entities/predictive_segments/{id}`             # Delete model
  - `POST   /entities/predictive_segments/{id}/run`         # Run (train/score)
  - `GET    /entities/predictive_segments/{id}`             # Get model details
  - `GET    /entities/predictive_segments/{id}/executions`  # Execution history
  - `GET    /entities/predictive_segments/{id}/model/features` # Feature importances
  - `GET    /entities/predictive_segments/{id}/model/score`    # Score histogram
- All calls use the CDP API endpoint (e.g. `https://api-cdp.treasuredata.com`).

From tdx, call these via:

- `tdx api -X GET  --type cdp <path>`
- `tdx api -X POST --type cdp <path> [...]`
- `tdx api -X PATCH --type cdp <path> [...]`
- `tdx api -X DELETE --type cdp <path> [...]`

## Workflow 1 — Inspect Existing Predictive Models

**Visualization principle: Always format and present API results as tables or summaries immediately—never show raw JSON. Include business interpretation.**

### 1. Identify the parent segment

1. Ask the user to specify the parent segment:
   - Name (recommended), or
   - Numeric audience ID.
2. If the user provides a name, list audiences and match by name:
   - `tdx ps list --format json`
   - Find `id` and `name` for the target parent segment.

### 2. List predictive models in a parent segment

- Use Audience API to list models for the audience:

```bash
tdx api -X GET --type cdp /audiences/{audienceId}/predictive_segments
```

- Extract and present for each model:
  - `id`, `name`, `description`
  - `baseSegmentId`, `segmentId`, `scoredSegmentId`
  - `accuracy`, `areaUnderRocCurve`, `gradeThresholds`
  - `createdAt`, `updatedAt`

### 3. Show detailed model info

- Fetch JSON:API representation for a specific model:

```bash
tdx api -X GET --type cdp /entities/predictive_segments/{id}
```

- Summarize:
  - Audience / segment relationships
  - Feature lists:
    - `categoricalAsColumnNames`
    - `categoricalArrayAsColumnNames`
    - `quantitativeAsColumnNames`
  - Accuracy & AUC (with a short explanation of AUC 0–1 range).
  - Grade thresholds (e.g. 0–100 scores split by [75, 50, 25]).

### 4. Inspect execution history

- Retrieve executions:

```bash
tdx api -X GET --type cdp /entities/predictive_segments/{id}/executions
```

- For each execution, display:
  - `workflowId`, `workflowSessionId`
  - `createdAt`, `finishedAt`
  - `status` (queued / running / success / error / canceled / blocked)
- If needed, tell the user they can inspect the underlying workflow session via:
  - `tdx wf sessions` / `tdx wf attempt` (use the workflowSessionId).

### 5. Inspect feature importance

- Retrieve model features:

```bash
tdx api -X GET --type cdp /entities/predictive_segments/{id}/model/features
```

- **Format results immediately as a table with interpretation:**

```
Top 10 Features by Importance
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Feature          | Importance | Impact
─────────────────────────────────────────
custserv_calls   |   2.47     | 🔴 Higher calls → higher churn risk
day_charge       |   1.84     | 🔴 Heavy usage → higher risk
intl_plan#0      |  -2.39     | 🟢 No intl plan → lower risk
vmail_plan#1     |  -1.51     | 🟢 Has voicemail → lower risk

💡 Key Insight: Customers with 3+ service calls are the highest churn risk.
   Recommend: Proactive outreach for customers with custserv_calls > 3
```

- Always include:
  - Top 5-10 features sorted by absolute importance
  - Sign interpretation (positive = increases risk, negative = decreases risk)
  - Business actionable insight

### 6. Inspect score distribution

- Retrieve score histogram:

```bash
# JSON:API
tdx api -X GET --type cdp /entities/predictive_segments/{id}/model/score

# Or legacy
tdx api -X GET --type cdp /audiences/{audienceId}/predictive_segments/{id}/score_histogram
```

- **Present distribution summary immediately:**

```
Score Distribution (Total: 2,850 profiles)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Range    | Count  | % Total | Visual
─────────────────────────────────────────────
0-10     | 1,860  |  65.3%  | ████████████████████████████
10-25    |   748  |  26.2%  | ██████████
25-50    |   207  |   7.3%  | ███
50+      |    35  |   1.2%  | ▌

✓ Healthy distribution: 65% low-risk, only 1.2% very high-risk
⚠ Action needed: 242 customers (8.5%) in high-risk range
```

- Follow up with SQL analysis to correlate scores with actual behavior:

```bash
tdx query "
SELECT 
  FLOOR(td_predictive_score_{id} / 10) * 10 AS score_bucket,
  COUNT(*) AS customers,
  ROUND(AVG(custserv_calls), 2) AS avg_calls
FROM cdp_audience_{audienceId}.customers
WHERE td_predictive_score_{id} IS NOT NULL
GROUP BY 1 ORDER BY 1
"
```

## Workflow 2 — Create a New Predictive Scoring Model

### 1. Choose parent segment and candidate segments

1. Confirm parent segment (audience) as in Workflow 1.
2. List child segments:
   - `tdx sg list --parent-segment "{ParentName}" --format json`
3. With the user, choose:
   - **Training Population** — base population segment or All Profiles.
   - **Scoring Target** — profiles that already performed the target behavior.
   - **Positive Samples** — optional seed segment of "ideal" examples.

### 2. Check available fields and Column Visibility

- Use segment fields to understand attributes/behaviors:

```bash
tdx sg fields "{ParentName}"
```

- Important:
  - Only attributes/behaviors with Column Visibility = Clear can be used as features.
  - PII / Blocked columns are excluded from feature selection and predictive reports.

### 3. Build PredictiveSegmentParameters JSON (legacy Audience API)

- Follow the documented schema for:

```json
{
  "name": "Churn Risk Model",
  "description": "Predict churn in next 60 days",
  "baseSegmentId": 12345,
  "segmentId": 23456,
  "scoredSegmentId": 34567,
  "gradeThresholds": [75, 50, 25],
  "categoricalAsColumnNames": [
    "gender",
    "country"
  ],
  "categoricalArrayAsColumnNames": [
    "interest_categories"
  ],
  "quantitativeAsColumnNames": [
    "total_spend_90d",
    "visit_days_30d",
    "pageviews_30d"
  ],
  "preprocess": [
    {
      "column": "avg_spend_90d",
      "source": {
        "column": "total_spend_90d",
        "table": "customers",
        "functions": [
          { "function": "/", "arg": 3 }
        ]
      }
    }
  ]
}
```

- Always confirm with the user:
  - Which segments are used for `baseSegmentId`, `segmentId`, `scoredSegmentId`.
  - Which columns are used as features.

### 4. Create the model

- POST to Audience API:

```bash
tdx api -X POST --type cdp \
  -H 'Content-Type: application/json' \
  -d @predictive_segment.json \
  /audiences/{audienceId}/predictive_segments
```

- On success, capture:
  - New predictive segment `id`.
  - `accuracy`, `areaUnderRocCurve`, `gradeThresholds`.

### 5. Handle validation and permission errors

Typical issues:

- **Column visibility violations**:
  - The API may return validation errors if any feature column is not allowed (e.g., PII/Blocked).
  - Solution: drop those columns from the feature list or adjust Column Visibility in Control Panel.
- **Insufficient folder/segment permissions**:
  - 403 errors when:
    - The user lacks View+ on Training Population / Scoring Target / Positive Samples segments.
    - The model resides in a folder where the user has only View (no edit).
  - Solution: instruct user to adjust Audience Studio folder permissions (or work with an admin).

## Workflow 3 — Run / Retrain a Predictive Model

### 1. Identify the model

- Follow Workflow 1 to:
  - Pick the correct parent segment.
  - Choose a predictive segment by `id`.

### 2. Run via JSON:API entities

- Preferred:

```bash
tdx api -X POST --type cdp /entities/predictive_segments/{id}/run
```

- Optional legacy alternative:

```bash
tdx api -X POST --type cdp \
  /audiences/{audienceId}/predictive_segments/{predictiveSegmentId}/run
```

- Always:
  - Warn the user that running a predictive model consumes compute resources.
  - Ask for explicit confirmation before issuing the run.

### 3. Monitor execution status

- Poll executions:

```bash
tdx api -X GET --type cdp /entities/predictive_segments/{id}/executions
```

- Stop polling when the latest execution has:
  - `status: "success"` → done.
  - `status: "error"`   → report failure and suggest checking workflow logs.

- Optional:
  - Show `workflowId` / `workflowSessionId` and instruct the user how to inspect with `tdx wf`.

### 4. Verify that scores are written

- Predictive scoring enriches the parent segment customers table (cdp_audience_{id}.customers) with new columns, for example:

  - `predicted_churn_score`
  - `predicted_conversion_score`
  - `predicted_ltv`

- Verify with:

```bash
tdx query "SELECT predicted_churn_score, COUNT(*) AS cnt
           FROM cdp_audience_{audienceId}.customers
           GROUP BY 1
           ORDER BY 1"
```

## Workflow 4 — Use Predictive Scores for Segmentation

### 1. Explore score distribution in SQL

- Run comprehensive analysis:

```bash
tdx query "
SELECT
  CASE
    WHEN td_predictive_score_{id} >= 75 THEN 'Very High Risk'
    WHEN td_predictive_score_{id} >= 50 THEN 'High Risk'
    WHEN td_predictive_score_{id} >= 25 THEN 'Medium Risk'
    ELSE 'Low Risk'
  END AS risk_band,
  COUNT(*) AS customers,
  ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 2) AS pct_total,
  ROUND(AVG(custserv_calls), 2) AS avg_calls
FROM cdp_audience_{audienceId}.customers
WHERE td_predictive_score_{id} IS NOT NULL
GROUP BY 1
ORDER BY CASE risk_band 
  WHEN 'Very High Risk' THEN 1 
  WHEN 'High Risk' THEN 2 
  WHEN 'Medium Risk' THEN 3 ELSE 4 END
"
```

- **Present results with actionable recommendations:**

```
Churn Risk Segmentation Analysis
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Risk Band      | Customers | % Total | Avg Calls | Action
────────────────────────────────────────────────────────
Very High      |         3 |   0.1%  |      2.00 | Immediate intervention
High           |        32 |   1.1%  |      2.50 | Retention campaign (7 days)
Medium         |       207 |   7.3%  |      2.52 | Monitor & nurture email
Low            |     2,608 |  91.5%  |      1.35 | Standard engagement

💡 Business Recommendations:
• Very High (3): Dedicated account manager + retention offer
• High (32): Win-back campaign within 7 days
• Medium (207): Automated satisfaction survey
```

### 2. Create score-based child segments (with `segment` skill)

- Use the `segment` skill and YAML config to define segments like:

```yaml
name: "Churn Risk — Very High"
kind: batch
rule:
  type: And
  conditions:
    - type: Value
      attribute: predicted_churn_score
      operator:
        type: Greater
        value: 0.8
```

- Validate and push:

```bash
tdx sg validate segments/{parent-slug}/Segments/churn-risk-very-high.yml
tdx sg push -y "segments/{parent-slug}/Segments/churn-risk-very-high.yml"
```

- Suggest typical segments:
  - High risk / Medium risk / Low risk.
  - Top N% by predicted LTV.

### 3. Link back to Predictive Scores UI

- Explain how these score thresholds relate to:
  - Predictive Scores "Profiles Distribution" chart.
  - Score threshold slider in the UI.

## Error Handling & Validation Codes

If the API returns validation codes such as:

- `PREDICTIVE_SEGMENT_NOT_YET_TRAINED`
- `PREDICTIVE_SEGMENT_NOT_YET_SCORED`

Then:

- Explain that the model must be trained and scored before certain operations (like viewing scores or creating score-based segments) can succeed.

For 4xx/5xx:

- Surface HTTP status, short explanation, and which step failed (list/create/run/features/score).
- Suggest concrete next actions (check permissions, check column visibility, rerun parent segment, etc.).

## Related Skills

- `parent-segment` — Manage parent segment configuration and schedule.
- `segment` — Manage child segments via YAML rules.
- `parent-segment-analysis` — Explore cdp_audience_* customers and behavior tables.
- `workflow` — Inspect and debug underlying predictive scoring workflows.
- `td-admin-cli` (internal) — For deep-dive troubleshooting via admin APIs.

## Safety Guidelines

Never create, update, delete, or run predictive models without:

- Clearly identifying the parent segment and segment IDs.
- Getting explicit confirmation from the user.

Always:

- Show a summary of the planned action (audience, model name, segments, feature columns).
- Recommend testing on a non-production audience first when possible.
