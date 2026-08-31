---
name: ai-signals
description: Sets up Treasure AI's AI Signals (PrecisionML) machine learning solutions via Treasure Workflow and the ML Batch API - RFM customer segmentation, CLTV (customer lifetime value) prediction with churn, NBA (Next Best Action) channel and offer recommendations, and NBP (Next Best Product) recommendations. Covers source data discovery and validation, generating the `.dig` workflow with `solution_name` and `solution_arguments`, regional endpoints, output table schemas, model-quality interpretation, verification queries, and activation into parent segments. Use when setting up RFM, predicting customer lifetime value or churn, recommending next best action or next best product, or running ml-batch-api jobs.
owner: hanzhen.liu@treasure-data.com
tier: 1
classification: product
phase: 1
last-validated: 2026-08-25
validation-model: claude-opus-5
---

# AI Signals - RFM, CLTV, NBA, NBP

AI Signals is Treasure AI's packaged ML suite. Each signal is a Treasure Workflow that POSTs a job to the **ML Batch API** and writes scored results to a TD table, ready for parent-segment attributes, segments, journeys, and activations.

## When to Use This Skill

- Choosing which ai signals model achieves a business goal
- Discovering, planning, and validating the source table for an ai signals model training or prediction
- Generating, deploying, and scheduling ai signals workflow
- Verifying, interpreting, and reporting on signal output tables
- Troubleshooting failed or low-quality runs

## Choosing a solution

| Business question | Signal | Input | Output | Reference |
|---|---|---|---|---|
| Who are my best / at-risk / lost customers? | **RFM** | Orders (user, event time, amount) | Quartiles, `rfm_score`, 10 named segments | [rfm.md](references/rfm.md) |
| How much will each customer spend next? Who will churn? | **CLTV** | Transactions (user, amount, timestamp) | `pcltv_Xmonth`, percentile, `pchurn_Xmonth` | [cltv.md](references/cltv.md) |
| Which channel / send time / offer per customer? | **NBA** | Interaction log (user, action, reward, numeric features) | Recommended action per user | [nba.md](references/nba.md) |
| Which products should I recommend? | **NBP** | Item-level transactions (user, item, timestamp) | Ranked `rec_items` per user | [nbp.md](references/nbp.md) |

Read the matching reference in the /references folder before solutioning.

## Prerequisites

1. **AI Signals enabled on the account.** If ML Batch API calls return authorization errors, let the user know to contact the account team to first enable the AI Signals feature flag.
2. **`td.apikey` secret** set once per workflow project, after that project's first push:
   ```bash
   tdx wf secrets set <project-name> "td.apikey=YOUR_MASTER_API_KEY"
   ```
   Must be a **Master API Key** in `ACCOUNT_ID/KEY` format - OAuth and write-only keys fail with
   `TD1` auth. `td_ddl>` and `td>` need it too, so the first run fails without it. Never retrieve
   or set the value on the user's behalf - give them the command with the placeholder. See the
   **digdag** skill (`references/scaffold.md`) for the full secrets contract.
3. **Source data in TD** matching the signal's input requirements.

For `tdx` install, auth, and site selection, see the **tdx-basic** skill.

## ML Batch API Endpoints

Match the account's site:

| Site | Endpoint |
|---|---|
| `us01` | `https://ml-batch-api.treasuredata.com` |
| `jp01` | `https://ml-batch-api.treasuredata.co.jp` |
| `eu01` | `https://ml-batch-api.eu01.treasuredata.com` |
| `ap02` | `https://ml-batch-api.ap02.treasuredata.com` |
| `ap03` | `https://ml-batch-api.ap03.treasuredata.com` |

## The ML Batch API Call Pattern

Every signal is the same two tasks - submit, then poll. This is the only part of the workflow that is AI-Signals-specific; for `.dig` structure, `_export`, session variables, `td>`/`td_ddl>`, `_parallel`, and `_error`, see the **digdag** skill.

```yaml
+run_signal:
  http>: https://ml-batch-api.treasuredata.com/v1/runs
  method: POST
  timeout: 300
  headers:
    - authorization: ${secret:td.apikey}
    - X-TD-ML-SESSION-ID: ${session_id}
    - X-TD-ML-ATTEMPT-ID: ${attempt_id}
  store_content: true
  content:
    input_table: ml_output.signal_input
    output_table: ml_output.signal_output
    solution_name: rfm      # or cltv_train/cltv_predict, nba_tune/nba_train/nba_predict, nbp_train/nbp_predict
    solution_arguments:
      # per-signal - see the reference file

+log_run:
  echo>: "${http.last_content}"

+poll_status:
  _retry:
    limit: 60
    interval: 60
  http>: https://ml-batch-api.treasuredata.com/v1/runs/${JSON.parse(http.last_content)['id']}/status
  method: GET
  timeout: 300
  headers:
    - authorization: ${secret:td.apikey}
```

- `POST /v1/runs` returns a run `id`; `store_content: true` exposes it as
  `${JSON.parse(http.last_content)['id']}`.
- `GET /v1/runs/{id}/status` returns **408 while running**, **200 when complete**. Size `_retry` to the expected runtime - jobs reach ~90 minutes at 100M rows, so `limit: 60` / `interval: 60` covers roughly an hour. `timeout:` defaults to 30s and must be raised.
- Multi-stage signals chain submit+poll pairs; `http.last_content` is scoped per task, so parallel algorithm branches are safe.

The **llm-workflow** skill is the closest structural precedent for this `td>` prep -> `http>` external API -> parse response chassis.

## Setup Flow

**1. Pick the signal** from the table above and read its reference file.

**2. Discover the source data.** Follow
[data-discovery.md](references/data-discovery.md) - it branches on whether the user already named a table - candidate tables, column mapping, per-signal validity - and confirm the mapping with the user before generating anything.

**3. Verify data quality.** Run the reference's checks (nulls, negative amounts, date range,
minimum history, per-action or per-item volume) and report pass/fail. No signal performs
missing-value handling, so fix problems in the prep SQL first.

**4. Generate the project.** Ask the user which case applies before writing any files:

| Case | Before generating |
|---|---|
| New project | Create the directory fresh |
| New workflow in an existing project | `tdx wf pull <project>` first, then add a new `.dig` beside the existing ones |
| Updating an existing workflow | `tdx wf pull <project>` first, then edit in place |

`tdx wf push` uploads the **whole local directory as one revision** - any workflow or file not
present locally is dropped from the project - and it resolves the target project from the
`tdx.json` that `pull` writes. Never push a hand-built directory over an existing project. The
reference files carry complete working workflows; for project layout and naming conventions, see
the `scaffold.md` reference in the **workflow-skills:digdag** skill.

**5. Deploy.**
```bash
tdx wf push --dry-run       # from the project directory - check the deleted count is 0
tdx wf push
```
New project only, once - `td.apikey` is project-scoped and survives later revisions, so confirm
with `tdx wf secrets list <project>` before asking again:
```bash
tdx wf secrets set <project-name> "td.apikey=YOUR_MASTER_API_KEY"
```

**6. Run once and verify.** `tdx wf run <project>.<workflow>`, then the reference's **output
verification queries** - row count against eligible input users, null and range checks, and
distribution sanity. For sessions, attempts, task timeline, logs, and retry-from-task, see the
**workflow** skill (`tdx wf`).

**7. Schedule** at the signal's recommended cadence. Training is expensive and infrequent;
prediction is cheap and frequent, so split stages into separate workflows with a fixed
`model_name` when the cadences differ - that is the pull-first case in step 4. `schedule:` syntax
and options: **digdag** skill, `references/scheduling.md`.

**8. Report results** using the reference's analysis queries. Always pair scores with their
quality metrics - CLTV gini and calibration, NBA lift and ESS, NBP map and ndcg.

**9. Activate.** Add the output table as a parent-segment `attributes:` entry joined on the
customer key, then `tdx ps validate` and `tdx ps push` (**parent-segment** skill). Confirm the
columns landed with the **parent-segment-analysis** skill, build audience rules on them with the
**segment** skill, and export with the **activation** and **connector-config** skills.

### Historical scoring

To score a past period, run the workflow at that session time - `tdx wf run <project>.<wf>
--session-time 2026-06-01T00:00:00+00:00` - so `${session_unixtime}`-derived prep SQL (RFM
recency in particular) resolves to that date. Use `output_mode: append` to accumulate periods.

## Common Pitfalls

- **Ingestion `time` is not event time.** TD's `time` column records ingestion. Ask for the real
  transaction column (`event_time`, `purchase_date`, `ordered_at`, `created_at`) unless the user
  confirms `time` is the event time.
- **Nulls and negatives reach the model.** Clean them in prep SQL - no signal imputes.
- **Wrong regional endpoint** silently fails auth. Match the account site.
- **`tdx wf push` replaces the entire revision.** Pull the project before adding or editing a
  workflow in it, or the other workflows vanish.
- **Retraining every prediction run** wastes compute. Split cadences.
- **Model expiry** - NBP models persist about 6 months; retrain before then.
- **Reporting raw scores without metrics.** A model with low `label_gini` or low ESS has no
  reliable signal to report.
- **`n_predictions` is fixed at 1** for NBA today.

## Related Skills

- **workflow-skills:digdag** - `.dig` syntax, operators, `_export`, session variables, retry and
  error handling, project scaffold, secrets contract, `schedule:` options
- **workflow-skills:llm-workflow** - the `td>` -> `http>` external API -> parse pattern this skill
  builds on
- **tdx-skills:workflow** - `tdx wf push/run/sessions/attempt/secrets`, debugging a failed run
- **tdx-skills:tdx-basic** - `tdx` auth, sites, `databases`/`tables`/`describe`/`show`/`query`
- **tdx-skills:parent-segment** - attaching signal outputs as master-table attributes
- **tdx-skills:parent-segment-analysis** - querying `cdp_audience_*` to confirm attributes landed
- **tdx-skills:segment** - audience rules on signal scores, with the count-check workflow
- **tdx-skills:activation** / **tdx-skills:connector-config** - exporting scored audiences
- **sql-skills:time-filtering** - `td_interval` and partition pruning for prep and analysis SQL
- **sql-skills:trino-optimizer** - CTAS, UDP bucketing, and `approx_*` for large scoring inputs
- **sql-skills:trino-to-hive-migration** - fallback when prep SQL hits Trino memory limits

## Resources

- [RFM AI Signals](https://docs.treasure.ai/products/customer-data-platform/machine-learning/ai-signals/rfm-ai-signals)
- [CLTV AI Signals](https://docs.treasure.ai/products/customer-data-platform/machine-learning/ai-signals/cltv-ai-signals)
- [NBA AI Signals](https://docs.treasure.ai/products/customer-data-platform/machine-learning/ai-signals/nba-ai-signals)
- [NBP AI Signals](https://docs.treasure.ai/products/customer-data-platform/machine-learning/ai-signals/nbp-ai-signals)
