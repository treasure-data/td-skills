# RFM AI Signals

Segments customers on **Recency** (days since last purchase), **Frequency** (transaction count),
and **Monetary** (total spend), assigning quartile ranks, a composite score, and one of ten named
segments. Use for value-based segmentation, win-back targeting, and VIP identification.

Not a fit for flat-price subscriptions or single-purchase audiences - there is no frequency or
monetary spread to rank. RFM describes current behavior; pair with CLTV for forward-looking value.

`solution_name: rfm` - a single stage, no separate train step.

## Input

The ML Batch API expects a **pre-aggregated per-user** table:

| Column | Type | Meaning |
|---|---|---|
| user column (name configurable) | varchar | Customer identifier |
| `recency` | integer | Days since most recent transaction |
| `frequency` | integer | Total transaction count |
| `monetary_value` | double | Total spend |

The prep SQL below builds it from raw orders. Roughly 12 months of history is recommended, and
repeat purchases are required for frequency to carry signal. No nulls, no negatives - RFM does no
missing-value handling. Run the checks in [data-discovery.md](data-discovery.md) first.

## Prep SQL - `queries/create_rfm_input.sql`

```sql
select
  user_id,
  (${session_unixtime} - max(event_time)) / 86400 as recency,
  count(*) as frequency,
  coalesce(sum(try(cast(amount as double))), 0) as monetary_value
from prod_cdp.orders
where td_interval(time, '-24M')
  and order_status in ('completed', 'shipped', 'delivered', 'paid')
  and amount >= 0
group by 1
```

Substitute the confirmed table and columns. `${session_unixtime}` is the run time, so recency is
relative to the session - which is what makes historical scoring via `--session-time` work.
Widen or narrow `td_interval` to the intended lookback.

## Workflow - `rfm_signal.dig`

```yaml
timezone: UTC

# schedule:
#   cron>: 0 6 * * 1          # weekly, Mondays 06:00 - enable after the first verified run

_export:
  output_mode: overwrite      # overwrite | append
  td:
    database: ml_output

+create_output_db:
  td_ddl>:
  create_databases: ["ml_output"]

+create_rfm_input:
  td>: queries/create_rfm_input.sql
  create_table: rfm_input

+run_rfm:
  http>: https://ml-batch-api.treasuredata.com/v1/runs
  method: POST
  timeout: 300
  headers:
    - authorization: ${secret:td.apikey}
    - X-TD-ML-SESSION-ID: ${session_id}
    - X-TD-ML-ATTEMPT-ID: ${attempt_id}
  store_content: true
  content:
    input_table: ml_output.rfm_input
    output_table: ml_output.rfm_output
    solution_name: rfm
    solution_arguments:
      user_column: user_id
      use_sql: true
      output_mode: ${output_mode}

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

Swap in the endpoint for the account's site. Add `mv_threshold` to `solution_arguments` only when
needed (below).

## Parameters

| Parameter | Type | Default | Required | Purpose |
|---|---|---|---|---|
| `user_column` | string | `user` | No | Name of the user id column in the input table |
| `output_mode` | string | `append` | No | `append` adds rows; `replace` overwrites |
| `use_sql` | boolean | `false` | No | SQL-based computation - enable above 10M rows for a large speedup |
| `use_hive` | boolean | `false` | No | Pair with `use_sql: true` if required |
| `mv_threshold` | float | - | No | Excludes `monetary_value <= threshold` from quartile boundary estimation. All rows are still scored; below-threshold users land in M quartile 1. Omit when unused |

## Output - `rfm_output`

| Column | Type | Definition |
|---|---|---|
| user column | varchar | Pass-through |
| `recency`, `frequency`, `monetary_value` | double / bigint / double | Pass-through |
| `r_quartile`, `f_quartile`, `m_quartile` | long | Rank 1-4, 4 is best |
| `rfm_quartile` | varchar | Concatenated label, e.g. `R3F1M4` |
| `rfm_score` | double | `(r + f + m) / 3`, range 1.0-4.0 |
| `rfm_segment` | varchar | Named segment |

### The ten segments

| Segment | Quartile pattern |
|---|---|
| Champions | R4 F4 M4 |
| Loyal Customers | R3-4, F3-4, M3-4 |
| Potential Loyalists | R3-4, F2-4, M2-4 |
| Promising | R3-4, F1-4, M1-2 |
| New Customers | R3-4, F1, M1 |
| Cannot Lose Them | R1-2, F3-4, M3-4 |
| Need Attention | R2, F2-4, M2 |
| Hibernating | R2, F1-4, M1-2 |
| High Value Sleeping | R1, F2-4, M2-4 |
| Lost Customers | R1, F1-3, M1-2 |

Quartiles are **relative to the scored population in that run**, not fixed thresholds - segment
sizes shift as the customer base shifts.

## Scheduling and Scale

Weekly for e-commerce and retail (catches early churn signals); monthly for lower-frequency
categories. With `use_sql: true`: roughly 12 minutes at 10M rows, 89 minutes at 100M. Above about
500M rows, involve the account team on infrastructure. Size the poll `_retry` accordingly.

## Output Verification

```sql
select
  count(*) as scored_users,
  count_if(rfm_score is null) as null_scores,
  min(rfm_score) as min_score,        -- expect >= 1.0
  max(rfm_score) as max_score         -- expect <= 4.0
from ml_output.rfm_output
```

Scored users should equal distinct users in `rfm_input`. Each quartile should hold roughly a
quarter of users:

```sql
select r_quartile, count(*) as users
from ml_output.rfm_output
group by 1
order by 1
```

## Analysis and Reporting

Segment summary - the headline report:

```sql
select
  rfm_segment,
  count(*) as segment_size,
  round(cast(count(*) as double) * 100 / sum(count(*)) over (), 2) as pct,
  round(avg(recency), 1) as avg_recency,
  round(avg(frequency), 1) as avg_frequency,
  round(avg(monetary_value), 2) as avg_monetary,
  round(cast(sum(monetary_value) as double) * 100 / sum(sum(monetary_value)) over (), 2) as revenue_share_pct
from ml_output.rfm_output
group by 1
order by segment_size desc
```

Score spread per segment:

```sql
select
  rfm_segment,
  min(rfm_score) as min_score,
  approx_percentile(rfm_score, 0.5) as median_score,
  max(rfm_score) as max_score
from ml_output.rfm_output
group by 1
```

Segment transitions between runs (requires `append` mode or per-run tables):

```sql
select
  prev.rfm_segment as previous_segment,
  curr.rfm_segment as current_segment,
  count(*) as user_count
from ml_output.rfm_output_previous prev
join ml_output.rfm_output_current curr
  on prev.user_id = curr.user_id
where prev.rfm_segment != curr.rfm_segment
group by 1, 2
order by 3 desc
```

Report total customers scored, the largest segments with revenue share, and notable movement
since the previous run.

## Troubleshooting

| Issue | Fix |
|---|---|
| Huge "Lost Customers" segment | Input is stale - recency is measured from session time. Refresh the source, or investigate acquisition quality |
| Slow runs | Set `use_sql: true` |
| Quartiles skewed by near-zero transactions (free tiers, samples) | Set `mv_threshold` |
| Segments feel stale between campaigns | Align the schedule to campaign cadence |
| Flat frequency or monetary scores | Single-purchase or flat-price data - use CLTV instead |

## Activation

Attach `rfm_output` to the parent segment as attributes joined on the user id (**parent-segment**
skill), then build rules on `rfm_segment` and `rfm_score` (**segment** skill):

- Win-back - `rfm_segment` in `Cannot Lose Them`, `High Value Sleeping`
- VIP - `rfm_segment` equals `Champions`, or `rfm_score >= 3.5`
- Nurture - `rfm_segment` in `Promising`, `New Customers`
