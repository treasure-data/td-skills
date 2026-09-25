# CLTV AI Signals

Predicts per-customer spend over the next 3, 6, or 12 months directly from transaction history -
no feature engineering. Two model types:

- **`bggg`** (BG/NBD + Gamma-Gamma) - probabilistic, interpretable, tolerates shorter history, and
  also outputs churn probability. **Start here.**
- **`flaml`** (AutoML) - use when BGGG errors out or underperforms, or when the business needs
  explicit `value` (RMSE) versus `ranking` (Gini) optimization. Needs roughly 2 years of history.

Scores existing repeat customers only - not prospects, first-time buyers, or fixed-price
subscriptions.

Two stages: `solution_name: cltv_train`, then `cltv_predict`.

## Data Splitting

BGGG uses a **single cutoff** (calibration plus holdout). FLAML uses a **dual cutoff** - feature
window, then training labels, then an evaluation window - to prevent temporal leakage. Leave
`split_strategy` on its automatic default. Forcing single cutoff on FLAML introduces leakage and
invalidates the metrics.

## Input

Transaction-level, one row per purchase:

| Column (configurable) | Type | Notes |
|---|---|---|
| `user_id` | string | Customer identifier |
| `amount` | float | Positive only - clean refunds and voids first |
| `timestamp` | string or bigint | Parseable datetime or unix; one consistent timezone |

Other columns are ignored. Customers with fewer than `min_transactions` (default and floor: 3)
transactions in calibration are dropped automatically - expected, not a failure. Report that
population from [data-discovery.md](data-discovery.md) before generating.

CLTV reads raw transactions directly, so no prep SQL is required. Add a prep step only to filter
refunds or restrict history:

```sql
select user_id, amount, event_time as timestamp
from prod_cdp.orders
where td_interval(time, '-36M')
  and order_status in ('completed', 'shipped', 'delivered', 'paid')
  and amount > 0
```

## Workflow - `cltv_signal.dig`

Train and predict in one session, so `cltv_model_${session_id}` matches across both stages.

```yaml
timezone: UTC

# schedule:
#   cron>: 0 6 1 * *          # monthly - enable after the first verified run

_export:
  model_type: bggg            # bggg | flaml
  prediction_period: 6        # 3 | 6 | 12 months
  min_transactions: 3         # floor is 3
  td:
    database: ml_output

+create_output_db:
  td_ddl>:
  create_databases: ["ml_output"]

+train:
  http>: https://ml-batch-api.treasuredata.com/v1/runs
  method: POST
  timeout: 300
  headers:
    - authorization: ${secret:td.apikey}
    - X-TD-ML-SESSION-ID: ${session_id}
    - X-TD-ML-ATTEMPT-ID: ${attempt_id}
  store_content: true
  content:
    input_table: prod_cdp.orders
    output_table: ml_output.cltv_train_output
    solution_name: cltv_train
    solution_arguments:
      model_name: cltv_model_${session_id}
      user_column: user_id
      amount_column: amount
      timestamp_column: event_time
      model_type: ${model_type}
      prediction_period: ${prediction_period}
      min_transactions: ${min_transactions}

+log_train:
  echo>: "${http.last_content}"

+poll_train:
  _retry:
    limit: 60
    interval: 60
  http>: https://ml-batch-api.treasuredata.com/v1/runs/${JSON.parse(http.last_content)['id']}/status
  method: GET
  timeout: 300
  headers:
    - authorization: ${secret:td.apikey}

+predict:
  http>: https://ml-batch-api.treasuredata.com/v1/runs
  method: POST
  timeout: 300
  headers:
    - authorization: ${secret:td.apikey}
    - X-TD-ML-SESSION-ID: ${session_id}
    - X-TD-ML-ATTEMPT-ID: ${attempt_id}
  store_content: true
  content:
    input_table: prod_cdp.orders
    output_table: ml_output.cltv_predictions
    solution_name: cltv_predict
    solution_arguments:
      model_name: cltv_model_${session_id}
      user_column: user_id
      amount_column: amount
      timestamp_column: event_time
      model_type: ${model_type}

+log_predict:
  echo>: "${http.last_content}"

+poll_predict:
  _retry:
    limit: 60
    interval: 60
  http>: https://ml-batch-api.treasuredata.com/v1/runs/${JSON.parse(http.last_content)['id']}/status
  method: GET
  timeout: 300
  headers:
    - authorization: ${secret:td.apikey}
```

For FLAML, add `optimization_goal` and `time_budget` to the train arguments.

To predict more often than you retrain, split into two workflows and use a **fixed**
`model_name` (`cltv_prod_model`, or date-based `cltv_model_${session_date}`) - a
`${session_id}`-based name will not resolve from a different session.

## Parameters

### Both models

| Parameter | Type | Default | Required | Purpose |
|---|---|---|---|---|
| `model_name` | string | - | Yes (train) | Registration identifier; predict must match |
| `model_type` | string | `bggg` | No | `bggg` or `flaml` |
| `user_column` | string | `user_id` | No | Customer id column |
| `amount_column` | string | `amount` | No | Transaction amount column |
| `timestamp_column` | string | `timestamp` | No | Transaction datetime column |
| `prediction_period` | int | `3` | No | Forecast horizon in months: 3, 6, or 12 |
| `min_transactions` | int | `3` | No | Minimum per-customer transactions; floor 3 |
| `split_strategy` | string | auto | No | `single_cutoff` (BGGG) or `dual_cutoff` (FLAML) - leave auto |

### FLAML only

| Parameter | Type | Default | Purpose |
|---|---|---|---|
| `optimization_goal` | string | `ranking` | `value` minimizes RMSE; `ranking` maximizes Gini |
| `time_budget` | int | `60` | AutoML search seconds |

## Output

### Predictions - `cltv_predictions`

Column names embed the horizon, so `prediction_period: 6` yields `pcltv_6month`:

| Column | Models | Meaning |
|---|---|---|
| user column | all | Customer identifier |
| `pcltv_Xmonth` | all | Predicted spend over the next X months |
| `pcltv_Xmonth_pctile` | all | Percentile rank 0-100 |
| `pchurn_Xmonth` | bggg | Churn probability 0.0-1.0 |

### Training metrics - `cltv_train_output`

| Metric | Models | Meaning |
|---|---|---|
| `rmse`, `mae` | all | Absolute prediction error |
| `label_gini` | all | Ranking ceiling present in the actual data |
| `model_gini` | all | Prediction ranking quality |
| `normalized_gini` | all | `model_gini / label_gini`; closer to 1.0 is better |
| `churn_auc`, `churn_precision`, `churn_recall`, `churn_f1`, `churn_brier_score`, `churn_ece` | bggg | Churn quality. Precision, recall, and f1 use a fixed 0.5 threshold - mention that whenever quoting them |

## Scheduling

Combined train and predict: monthly is a sound default. Split workflows: train monthly or
quarterly, predict weekly or per campaign cadence.

## Output Verification

```sql
select
  count(*) as scored_users,
  count_if(pcltv_6month is null) as null_predictions,
  count_if(pcltv_6month < 0) as negative_predictions,
  min(pcltv_6month_pctile) as min_pctile,   -- expect near 0
  max(pcltv_6month_pctile) as max_pctile    -- expect near 100
from ml_output.cltv_predictions
```

Scored users should approximate the 3-or-more-transaction population measured during discovery.
Substitute the configured horizon for `6month` throughout.

## Analysis and Reporting

**Check model quality before quoting any prediction.**

```sql
select
  round(normalized_gini, 4) as cltv_ranking_quality,   -- above 0.7 is good for ranking use
  round(label_gini, 4) as data_signal,                 -- below 0.3 means values are too uniform to predict
  round(rmse, 2) as rmse,
  round(mae, 2) as mae,
  round(churn_auc, 4) as churn_ranking,                -- bggg only
  round(churn_ece, 4) as churn_calibration             -- bggg only; above 0.15 means rank, do not quote probabilities
from ml_output.cltv_train_output
order by time desc
limit 1
```

Interpretation: low `label_gini` means customer values are too similar for CLTV to predict
reliably - say so explicitly rather than reporting scores. Validate ranking use cases with
`normalized_gini`, absolute-value use cases with `rmse` and `mae`. High `churn_ece` means use
relative churn ranking, not the raw probabilities.

Value concentration by percentile band:

```sql
select
  case
    when pcltv_6month_pctile >= 99 then '1. top 1%'
    when pcltv_6month_pctile >= 90 then '2. top 10%'
    when pcltv_6month_pctile >= 80 then '3. top 20%'
    when pcltv_6month_pctile >= 50 then '4. middle'
    else '5. bottom half'
  end as band,
  count(*) as users,
  round(sum(pcltv_6month), 2) as predicted_value,
  round(cast(sum(pcltv_6month) as double) * 100 / sum(sum(pcltv_6month)) over (), 1) as value_share_pct
from ml_output.cltv_predictions
group by 1
order by 1
```

Churn risk against value - the retention priority report (BGGG only):

```sql
select
  case when pcltv_6month_pctile >= 80 then 'high value' else 'other' end as value_tier,
  case when pchurn_6month >= 0.5 then 'high churn risk' else 'low churn risk' end as churn_tier,
  count(*) as users,
  round(sum(pcltv_6month), 2) as value_at_stake
from ml_output.cltv_predictions
group by 1, 2
order by 1, 2
```

Report the scorable population, the model-quality verdict, value concentration, and the
high-value plus high-churn cell as the urgent retention target.

## Troubleshooting

| Issue | Cause and fix |
|---|---|
| Customers missing from output | Fewer than 3 transactions in calibration - expected |
| Metrics look worse under dual cutoff | Dual cutoff is honest; single cutoff leaks. Trust dual cutoff |
| Predictions lower than expected | Stale transactions push customers toward inactive - refresh input and align the schedule |
| FLAML underperforms | Needs about 2 years of history for a 6-month horizon; fall back to BGGG |
| Low `label_gini` | Values too uniform - CLTV modeling does not suit this data |

## Activation

Attach predictions to the parent segment (**parent-segment** skill), exposing `pcltv_Xmonth`,
`pcltv_Xmonth_pctile`, and `pchurn_Xmonth`, then build rules (**segment** skill):

- Very High Value - `pcltv_6month_pctile >= 80`
- VIP - `pcltv_6month_pctile >= 99`
- Retention priority - `pcltv_6month_pctile >= 80` and `pchurn_6month >= 0.5`
