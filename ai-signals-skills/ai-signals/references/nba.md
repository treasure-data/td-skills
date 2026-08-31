# NBA AI Signals

Next Best Action recommends the marketing action - channel, send time, offer, or content - each
customer is most likely to engage with, using **contextual bandit** policies learned from a
historical interaction log with observed rewards.

Three stages, in order:

1. `nba_tune` - searches preprocessing, propensity, reward, and policy configurations, evaluating
   off-policy. Slow (can exceed an hour). Run first, then monthly.
2. `nba_train` - fits the chosen policy on the full dataset and saves it under `model_name`.
3. `nba_predict` - scores users and writes recommendations.

**Always tune before the first train.** Training without tune results produces a suboptimal
policy.

## Input

### Tune and train - one row per user-action event

| Column | Type | Required | Notes |
|---|---|---|---|
| `timestamp` | long | Yes | Unix timestamp |
| `user_id` | varchar | Yes | Column name set by the `user_id` parameter |
| `action` | varchar | Yes | The action taken - email, push, sms, offer code |
| `reward` | int | Yes | 1 for success (click, open, purchase), 0 otherwise |
| feature columns | double | Yes | User context - **must be numeric**; encode categoricals first |
| `pscore` | double | No | True propensity; estimated automatically when absent |
| `position` | int | No | Reserved |

Every column that is not one of the named roles becomes a context feature. Drop ids, raw
timestamps, and leaky columns via `exclude_columns` (pipe-delimited patterns, e.g.
`internal_id|*_raw|tmp_*`). Aim for a few hundred or more interactions per action; consolidate or
remove very rare actions.

### Predict - one row per user to score

The same numeric feature columns as training, plus the user identifier. No action, reward, or
pscore columns.

### Verification before generating

Run the per-action volume and reward-rate query in [data-discovery.md](data-discovery.md). Then
confirm no feature column is non-numeric:

```bash
tdx describe prod_cdp.interactions
```

A positive-reward rate below roughly 1% weakens the propensity and reward models - consider
layered rewards (higher for purchase, lower for add-to-cart) before tuning.

## Workflow 1 - `nba_tune.dig`

```yaml
timezone: UTC

_export:
  td:
    database: ml_output

+create_output_db:
  td_ddl>:
  create_databases: ["ml_output"]

+tune:
  http>: https://ml-batch-api.treasuredata.com/v1/runs
  method: POST
  timeout: 300
  headers:
    - authorization: ${secret:td.apikey}
    - X-TD-ML-SESSION-ID: ${session_id}
    - X-TD-ML-ATTEMPT-ID: ${attempt_id}
  store_content: true
  content:
    input_table: prod_cdp.interactions
    output_table: ml_output.nba_tune_results
    solution_name: nba_tune
    solution_arguments:
      user_id: user_id
      action_column: action
      reward_column: reward
      timestamp_column: event_time
      tune_ocv: true

+log_tune:
  echo>: "${http.last_content}"

+poll_tune:
  _retry:
    limit: 120
    interval: 60
  http>: https://ml-batch-api.treasuredata.com/v1/runs/${JSON.parse(http.last_content)['id']}/status
  method: GET
  timeout: 300
  headers:
    - authorization: ${secret:td.apikey}
```

Tuning can run over an hour, hence `limit: 120`.

**Pass condition:** the best policy's `ci_lower` exceeds the random baseline's
`estimated_policy_value`, with a positive `lift_vs_random_pct`. If tuning shows no lift, do not
promote the policy - see Troubleshooting.

## Workflow 2 - `nba_signal.dig` (train then predict)

```yaml
timezone: UTC

# schedule:
#   cron>: 0 5 * * *          # daily - enable after the first verified run

_export:
  model_type: lin_ucb         # lin_ucb | lin_ts | lin_eps_greedy | ipw_learner | neural_lin_ucb
  model_name: nba_model       # fixed name; retrain overwrites
  td:
    database: ml_output

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
    input_table: prod_cdp.interactions
    output_table: ml_output.nba_train_results
    solution_name: nba_train
    solution_arguments:
      model_type: ${model_type}
      model_name: ${model_name}
      user_id: user_id
      action_column: action
      reward_column: reward
      timestamp_column: event_time
      tuning_results_table: ml_output.nba_tune_results

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
    input_table: prod_cdp.users_to_score
    output_table: ml_output.nba_predictions
    solution_name: nba_predict
    solution_arguments:
      model_name: ${model_name}
      user_column: user_id
      timestamp_column: event_time

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

Two gotchas worth internalizing:

- **`user_id` for tune and train, but `user_column` for predict.** The parameter is genuinely
  named differently across stages.
- Tune and train run in **separate sessions**, so `model_name` must be fixed or date-based.
  `nba_model_${session_id}` will not match across the two workflows.

## Parameters

Common to all stages: `input_table` and `output_table` at the request level; `user_id` (tune,
train) or `user_column` (predict); `action_column`, `reward_column`, `timestamp_column`,
`exclude_columns`.

### Tune

| Parameter | Type | Default | Purpose |
|---|---|---|---|
| `tune_ocv` | boolean | - | Set `true` - off-policy cross-validation |
| `hyperparam_tune_sample_ratio` | float | `0.01` | Subsample fraction; raise on small datasets |
| `ocv_sigma_coef` | float | `0.0` | Conservativeness; higher is safer |
| `ocv_phase1_trials` | int | `20` | OPE estimator tuning trials |
| `ocv_phase2_trials` | int | `50` | Policy tuning trials |
| `max_ope_samples` | int | `200000` | Cap on OPE evaluation data (minimum 1000; prevents OOM) |
| `ocv_ess_config` | object | enabled | Effective-sample-size filtering - see Troubleshooting |

### Train

| Parameter | Type | Default | Purpose |
|---|---|---|---|
| `model_type` | string | required | `lin_ucb`, `lin_ts`, `lin_eps_greedy`, `ipw_learner`, `neural_lin_ucb` |
| `model_name` | string | required | Unique per account; predict must match |
| `tuning_results_table` | string | - | Inherit tuned hyperparameters - recommended |
| `tuning_run_id` | string | most recent | Pin a specific tune run |
| `n_predictions` | int | `1` | Fixed at 1 today |
| `epsilon` | float | `0.1` | Exploration rate; ignored by `ipw_learner` |
| `impute_type` | string | `knn` | `knn`, `hybrid`, `median`, `mean` |
| `scaler_type` | string | `minmax` | `minmax`, `standard`, `robust`, `maxabs`, `none` |
| `base_classifier` | string | `random_forest` | `ipw_learner` only; or `logistic_regression` |
| `propensity_type` | string | `logistic` | `uniform`, `logistic`, `true_propensity` |
| `max_training_samples_per_model` | object | linear 5M; `ipw_learner` and `neural_lin_ucb` 1M | Per-model sample caps |
| `neural_lin_ucb_params` | object | - | `encoding_dim`, `hidden_layer_sizes`, `per_arm`, `learning_rate`, `warmup_rounds`, `alpha`, `lambda_reg` |

Per-arm mode (`neural_lin_ucb` only): `per_arm: true` plus `arm_feature_columns` as
pipe-delimited patterns, e.g. `item_price|item_category_*`. It scores from shared arm features, so
it handles thin and cold-start actions better.

### Model types

| Type | Category | Speed | Use case | Tradeoff |
|---|---|---|---|---|
| `lin_ucb` | Online | Fast | Default - adaptive exploration with uncertainty estimates | Assumes linear reward |
| `lin_ts` | Online | Slower | Strong empirical performance, small action spaces | Posterior sampling cost |
| `lin_eps_greedy` | Online | Fast | Simplicity | Uninformed exploration |
| `ipw_learner` | Offline | Medium | Abundant logged data, known propensities | Propensity-sensitive |
| `neural_lin_ucb` | Hybrid | Slowest | Non-linear structure, large action spaces | Needs volume; sits outside tune |

## Output

- **`nba_tune_results`** - one row per trial across the preprocessing, OPE, and policy phases,
  plus a random baseline. Key columns: `estimated_policy_value`, `ci_lower`,
  `lift_vs_random_pct`, `phase2_ess`.
- **`nba_train_results`** - small metadata table confirming completion; the policy itself goes to
  managed storage under `model_name`.
- **`nba_predictions`** - `time` (long), user column (varchar), `predictions`
  (`array<varchar>`, ordered, currently one action per user, e.g. `["email"]`).

## Scheduling

Tune monthly, or whenever actions or features change. Train weekly, or to match how fast behavior
shifts. Predict daily for typical e-commerce.

## Output Verification

```sql
select
  count(*) as scored_users,
  count_if(predictions is null or cardinality(predictions) = 0) as empty_predictions
from ml_output.nba_predictions
```

Scored users should match the predict input row count; empty predictions should be zero.

## Analysis and Reporting

Tune diagnostics first - this decides whether the policy ships at all:

```sql
select *
from ml_output.nba_tune_results
order by estimated_policy_value desc
limit 10
```

Compare the best policy's `ci_lower` against the random-baseline row's
`estimated_policy_value`, and report `lift_vs_random_pct` alongside `phase2_ess`. Low ESS with
claimed lift is unreliable - say so rather than reporting the lift alone.

Recommended-action distribution:

```sql
select
  predictions[1] as recommended_action,
  count(*) as users,
  round(cast(count(*) as double) * 100 / sum(count(*)) over (), 2) as pct
from ml_output.nba_predictions
group by 1
order by 2 desc
```

Learned policy against the status quo:

```sql
select
  h.historical_action,
  p.predictions[1] as recommended,
  count(*) as users
from ml_output.nba_predictions p
join (
  select user_id, max_by(action, cnt) as historical_action
  from (
    select user_id, action, count(*) as cnt
    from prod_cdp.interactions
    where td_interval(time, '-12M')
    group by 1, 2
  )
  group by 1
) h on p.user_id = h.user_id
group by 1, 2
order by 3 desc
```

Report the tune verdict with its ESS caveat, the action mix, and how far the policy diverges from
historical behavior. **Recommend an A/B test against the incumbent before full rollout** -
off-policy estimates are only as good as the propensity and reward models behind them.

## Troubleshooting

| Issue | Fix |
|---|---|
| Tune shows no lift | Positive rewards under ~1% weaken the models; add behavioral or contextual features; try layered rewards; raise `hyperparam_tune_sample_ratio` on small data; inspect `phase2_ess` |
| Low ESS, trials rejected | Tune `ocv_ess_config` - `min_ess_threshold` and per-estimator `safety_factor` (defaults: IPW 2.0, DR 1.5, DROS 1.5, SNIPW 1.0, DM disabled). Higher safety factor is stricter |
| Memory errors while training | Lower `max_training_samples_per_model`; exceeding container capacity crashes the job |
| An action has too little history | Aim for a few hundred interactions; consolidate rare actions; per-arm `neural_lin_ucb` copes better |
| New action added | The model cannot recommend unseen actions - log interactions including it, then retune and retrain. Per-arm mode partially covers cold start |
| Unexpected recommendations | A/B test before rollout; verify propensity and reward model accuracy |

## Activation

Attach `nba_predictions` to the parent segment (**parent-segment** skill) exposing
`predictions[1]` as an attribute such as `next_best_action`, then:

- Branch journeys on `next_best_action` (**journey** skill)
- Build per-channel segments - `next_best_action` equals `email` (**segment** skill)
- Hand off to the orchestration platform for send-time and offer execution
