# NBP AI Signals

Next Best Product generates per-customer ranked product recommendations from transaction history.
Two stages: `nbp_train`, then `nbp_predict`.

Three algorithms with different reach:

| Algorithm | Best for | Cold start | Speed |
|---|---|---|---|
| `als` | Users in the training set with rich history (matrix factorization) | No | Slowest, highest quality |
| `similar_to_latest` | Any user with at least one transaction, based on the last purchased item | Partial | Fast, resilient to new users |
| `popular` | Brand-new users; trending fallback | Yes | Fastest, least personalized |

**Recommended pattern:** run all three and merge with priority `als` then `similar_to_latest` then
`popular`, so every customer gets recommendations. Start with one algorithm - `similar_to_latest`
is a good first run - and add the merge once the basics work.

## Input

Item-level transactions, one row per purchase or interaction:

| Column (configurable) | Type | Required | Notes |
|---|---|---|---|
| `userid` | varchar | Yes | Customer identifier |
| `itemid` | varchar | Yes | Product or content identifier |
| `tstamp` | long | Yes | Unix timestamp |
| `rating` | numeric | No | Explicit score when available |

**No nulls anywhere** - pre-process first. Pre-aggregated data is not supported; NBP needs raw
transactions. Run the per-item volume check in [data-discovery.md](data-discovery.md) - a long
tail of rarely-bought items means raising `filter_num` above 0.

Optional prep SQL to narrow history and drop nulls:

```sql
select user_id, item_id, event_time as tstamp
from prod_cdp.order_items
where td_interval(time, '-12M')
  and user_id is not null
  and item_id is not null
```

## Workflow - `nbp_signal.dig`

```yaml
timezone: UTC

# schedule:
#   cron>: 0 4 * * 1          # weekly train and predict - enable after the first verified run

_export:
  algorithm: similar_to_latest   # als | similar_to_latest | popular
  topk: 10                       # recommendations per user, max 100
  filter_num: 0                  # minimum users per item before inclusion
  filter_viewed: false           # true excludes already-purchased items
  output_mode: overwrite         # overwrite | append
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
    input_table: prod_cdp.order_items
    output_table: ml_output.nbp_train_metrics
    solution_name: nbp_train
    solution_arguments:
      model_name: nbp_model_${session_id}
      algorithm: ${algorithm}
      user_column: user_id
      item_column: item_id
      tstamp_column: event_time
      topk: ${topk}
      filter_num: ${filter_num}
      output_mode: ${output_mode}
      metrics_table: ml_output.nbp_metrics

+log_train:
  echo>: "${http.last_content}"

+poll_train:
  _retry:
    limit: 120
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
    input_table: prod_cdp.order_items
    output_table: ml_output.nbp_output
    solution_name: nbp_predict
    solution_arguments:
      model_name: nbp_model_${session_id}
      algorithm: ${algorithm}
      user_column: user_id
      item_column: item_id
      tstamp_column: event_time
      topk: ${topk}
      filter_viewed: ${filter_viewed}
      output_mode: ${output_mode}

+log_predict:
  echo>: "${http.last_content}"

+poll_predict:
  _retry:
    limit: 120
    interval: 60
  http>: https://ml-batch-api.treasuredata.com/v1/runs/${JSON.parse(http.last_content)['id']}/status
  method: GET
  timeout: 300
  headers:
    - authorization: ${secret:td.apikey}
```

ALS at 100M profiles takes around 230 minutes to train, so raise the poll `_retry` limit for
large ALS runs.

To train weekly but predict daily, split into two workflows with a **fixed** `model_name` such as
`nbp_prod_model` - a `${session_id}` name will not resolve from a different session. Trained
models persist about 6 months account-wide; retrain before expiry.

### Multi-algorithm merge

Run a train-and-predict pair per algorithm into its own table, then merge by priority. Algorithm
branches can run in parallel in one `.dig` - `http.last_content` is scoped per task, so
`_parallel: true` is safe.

```sql
-- queries/merge_recommendations.sql
select user_id, rec_items, algorithm
from (
  select
    user_id,
    rec_items,
    algorithm,
    row_number() over (partition by user_id order by priority) as rn
  from (
    select user_id, rec_items, 'als' as algorithm, 1 as priority from ml_output.nbp_output_als
    union all
    select user_id, rec_items, 'similar_to_latest', 2 from ml_output.nbp_output_stl
    union all
    select user_id, rec_items, 'popular', 3 from ml_output.nbp_output_popular
  )
)
where rn = 1
```

Each user's recommendations come from the highest-priority algorithm that covers them.

## Parameters

### Common

| Parameter | Type | Default | Required | Purpose |
|---|---|---|---|---|
| `model_name` | string | - | Yes | Stored model identifier; predict must match train |
| `algorithm` | string | `als` | No | `als`, `similar_to_latest`, `popular` |
| `user_column` | string | `userid` | No | Customer id column |
| `item_column` | string | `itemid` | No | Product id column |
| `tstamp_column` | string | `tstamp` | No | Timestamp column |
| `rating_column` | string | - | No | Optional explicit rating |
| `topk` | int | `10` | No | Items per user, max 100 |
| `filter_num` | int | `0` | No | Minimum users per item before inclusion |
| `filter_viewed` | boolean | `false` | No | Exclude already-purchased items - useful for rare-repeat products, leave false for consumables |
| `output_mode` | string | `overwrite` | No | `overwrite` or `append` |
| `similar_items_table` | string | - | No | Per-item similarity output; `als` and `similar_to_latest` only |
| `metrics_table` | string | - | No | Performance metrics output |

### Algorithm-specific

| Algorithm | Parameter | Default | Purpose |
|---|---|---|---|
| `als` | `factors` | `10` | Latent factors |
| `als` | `regularization` | `0.1` | Overfitting control |
| `als` | `iterations` | `10` | Training iterations |
| `als` | `alpha` | `50` | Interaction confidence weight |
| `als` | `tunable` | `false` | Optuna auto-tune - better quality, unpredictable resource use |
| `similar_to_latest` | `k` | `20` | Nearest neighbors |
| `similar_to_latest` | `distance` | `bm25` | `bm25`, `tf-idf`, `cosine` |
| `similar_to_latest` | `lastk` (predict) | `1` | Recent transactions to base recommendations on; above 1 helps multi-item baskets at extra compute |
| `popular` | `popularity` | `n_users` | Ranking method |
| `popular` | `period` | - | Time window, e.g. `30D` |
| `popular` | `begin_from` | - | Window start date |

## Output

- **Recommendations** (`nbp_output`) - `user_id` (varchar), `rec_items` (array, ranked, most
  relevant first). The merged variant adds `algorithm`.
- **Similar items** (optional) - `target_item_id`, `item_id`, `score`.
- **Metrics** (optional) - `session_id`, `model_params` (json), `map_{topk}`, `ndcg_{topk}`,
  `precision_{topk}`, `recall_{topk}`, `mrr_{topk}`.

## Scheduling and Scale

Train weekly (expensive), predict daily or hourly (cheap) - split the workflows with a fixed
model name to do that. Scale guidance: below 10M profiles a single run is right, since
parallelization overhead is not worth it. Between 10M and 100M, parallelize prediction (max 8
tasks); ALS wants 128 GiB. Above 100M, make `similar_to_latest` or `popular` the primary, train
ALS on roughly a 10% sample, and use `filter_num`.

## Output Verification

```sql
select
  count(*) as users_with_recs,
  count_if(rec_items is null or cardinality(rec_items) = 0) as empty_recs,
  avg(cardinality(rec_items)) as avg_rec_count      -- expect close to topk
from ml_output.nbp_output
```

Coverage against the customer base:

```sql
select
  (select count(*) from ml_output.nbp_output) as users_with_recs,
  (select approx_distinct(user_id) from prod_cdp.order_items where td_interval(time, '-12M')) as total_customers
```

ALS only covers users present in training, so a coverage gap is the signal to add the merge
fallback.

## Analysis and Reporting

Model quality, when `metrics_table` is configured:

```sql
select *
from ml_output.nbp_metrics
order by time desc
limit 1
```

Compare `map_{topk}` and `ndcg_{topk}` across algorithm runs rather than reading them absolutely.

Catalog concentration - are recommendations actually personalized:

```sql
select item, count(*) as times_recommended
from ml_output.nbp_output
cross join unnest(rec_items) as t(item)
group by 1
order by 2 desc
limit 20
```

If a handful of items dominate, recommendations are popularity-biased - consider ALS,
`filter_viewed: true`, or a larger `topk`.

Algorithm mix in the merged output:

```sql
select
  algorithm,
  count(*) as users,
  round(cast(count(*) as double) * 100 / sum(count(*)) over (), 2) as pct
from ml_output.nbp_output_merged
group by 1
order by 2 desc
```

Report coverage rate, average recommendations per user, top items with a concentration verdict,
the algorithm mix, and metric movement against the previous run.

## Troubleshooting

| Issue | Fix |
|---|---|
| Users missing from ALS output | ALS cannot score users outside training data - add `similar_to_latest` and `popular` fallbacks |
| Cold items never recommended | Items must appear in training; retrain after catalog changes |
| Predict fails after a long gap | Models expire around 6 months - retrain |
| Memory issues on huge catalogs | Raise `filter_num`; sample the ALS training input |
| Everyone gets the same items | Likely `popular` output or popularity bias - check the algorithm mix and metrics |
| Repeat purchases recommended | Set `filter_viewed: true`, unless the products are consumables |

## Activation

Attach `nbp_output` to the parent segment (**parent-segment** skill), exposing `rec_items` or its
leading elements as attributes:

- Email and push personalization - merge the top items into campaign templates (**engage** skill)
- Cross-sell segments - users whose `rec_items` contain a target category, joining an item catalog
  table for names and categories (**segment** skill)
- Website carousels - feed `rec_items` to the personalization layer via activation
  (**activation** and **connector-config** skills)
