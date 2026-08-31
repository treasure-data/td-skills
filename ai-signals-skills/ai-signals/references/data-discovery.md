# AI Signals Data Discovery

Find and validate the source table before configuring any signal. Confirm the column mapping with the user before generating workflow files.

For `tdx` auth, sites, and the exploration commands themselves, see the **tdx-basic** skill. For `td_interval` semantics and partition pruning, see the **time-filtering** skill.

## What Each Signal Accepts

| Signal | Valid source | Not valid as primary source |
|---|---|---|
| RFM | Orders/purchases: user, event time, monetary amount | Pageviews, email events, CRM touchpoints - no amount, and row counts are not purchase counts |
| CLTV | Transaction-level: user, amount, timestamp, one row per purchase | Pre-aggregated tables; tables without amounts |
| NBP | Item-level transactions: user, item, timestamp | Aggregated tables, profile tables, anything without an item id |
| NBA | Interaction log: user, action taken, observed reward, numeric context features | Anything without a per-event action and outcome |

Row grain matters. RFM and CLTV want one row per **order** - aggregate line items first. NBP wants one row per **user-item** interaction, so line items are correct there.

## Step 1: Find Candidate Tables

**Ask before scanning** - "do you know which table holds the source data, or should I search the
account?" The user usually knows, and a blind account scan is the slow path.

**If they name a table or database** - go straight to it, then continue at Step 2:

```bash
tdx tables "prod_cdp.*"               # skip if they already named the table
tdx describe prod_cdp.orders          # column names and types
tdx show prod_cdp.orders --limit 10   # eyeball actual values
```

**If they do not know** - narrow to databases first. Accounts hold hundreds, many opaquely named:

```bash
tdx databases "*cdp*"   # then *prod*, *raw*, *shopify*, *segment*; bare `tdx databases` for everything
```

Show the shortlist and **ask which one or two databases to search** - do not guess. Then list
tables, always dot-qualified - an unscoped pattern like `tdx tables "*order*"` scans every database
and hangs, and `--limit` does not stop it:

```bash
tdx tables "prod_cdp.*"
```

Prefer `enriched_orders`, `orders`, `purchases`, `transactions`, `sales`, `order_events`. For NBA, look for campaign or engagement logs that record both the action sent and the outcome. `tdx describe` returns no row counts or freshness, so rank candidates with the Step 3 queries, not from the listing.

## Step 2: Map Columns

**User id** - `canonical_id` or `cdp_profile_id` (TD CDP standards), else `user_id`,
`customer_id`, `member_id`. `email` works but carries duplicates and formatting drift. Never mix id types across tables in one signal.

**Timestamp** - `event_time`, `timestamp`, `created_at`, `order_time`, `purchase_date`. TD's `time` column is the **ingestion** time on every table; only use it as event time if the user confirms they match. Skip `updated_at` and `modified_at`. Must be unix seconds or castable.

**Amount** (RFM, CLTV) - `total_amount`, `order_amount`, `revenue`, `amount`, `grand_total`, `total_price`. Not `tax`, `shipping`, `discount` (components) or `quantity` (item count).

**Item** (NBP) - `item_id`, `product_id`, `sku`. Note name and category columns if present, for enriching recommendations later.

**Action and reward** (NBA) - action is the treatment (`action`, `channel`, `offer`,
`campaign_type`); reward is the binary outcome (`reward`, `converted`, `clicked`, `opened`). Every remaining column becomes a context feature and **must be numeric** - encode categoricals before ingestion. A column like `pscore`, `propensity`, or `action_probability` can be passed as the true propensity instead of having one estimated.

**Order status** - if present (`order_status`, `status`, `financial_status`), filter in prep SQL: include `completed`, `shipped`, `delivered`, `paid`, `confirmed`; exclude `cancelled`, `returned`, `refunded`, `failed`, `abandoned`, `test`.

### Platform patterns

| Source (via TD) | Timestamp | User id | Amount / notes |
|---|---|---|---|
| TD CDP behavior tables | `time` | `canonical_id`, `cdp_profile_id` | tables prefixed `enriched_*` |
| Shopify | `created_at`, `processed_at` | `customer_id`, `email` | `total_price`, `subtotal_price`; status in `financial_status` |
| Segment | `timestamp`, `received_at` | `user_id`, `anonymous_id` | tables `tracks`, `pages`, `identifies` |
| Salesforce | `created_date` | `contact_id`, `account_id` | status in `status`, `stage` |

## Step 3: Verify the Table

Run these and share the results. Every query is time-filtered - unbounded scans on raw event
tables are the main cost trap.

### Volume and date range

```sql
select
  count(*) as total_rows,
  approx_distinct(user_id) as distinct_users,
  td_time_string(min(event_time), 'd!', 'UTC') as earliest,
  td_time_string(max(event_time), 'd!', 'UTC') as latest
from prod_cdp.orders
where td_interval(time, '-24M')
```

History needed: RFM wants roughly 12 months or more; CLTV BGGG tolerates less, CLTV FLAML wants
about 2 years for dual-cutoff evaluation; NBA and NBP need volume per action and per item.

### Nulls and negatives

```sql
select
  count_if(user_id is null) as null_users,
  count_if(event_time is null) as null_times,
  count_if(amount is null) as null_amounts,
  count_if(amount < 0) as negative_amounts,
  min(amount) as min_amount,
  avg(amount) as avg_amount,
  max(amount) as max_amount
from prod_cdp.orders
where td_interval(time, '-24M')
```

Null counts must be zero - AI Signals does no missing-value handling. Negative amounts are
usually refunds; filter them in prep SQL.

### Repeat-purchase rate (RFM, CLTV)

```sql
select
  count(*) as users,
  count_if(txns >= 2) as repeat_users,
  count_if(txns >= 3) as users_3plus_txns
from (
  select user_id, count(*) as txns
  from prod_cdp.orders
  where td_interval(time, '-24M')
  group by 1
)
```

RFM needs repeat purchases for a meaningful frequency signal. CLTV only scores customers with at
least 3 transactions in calibration - report that count as the scorable population.

### Per-item volume (NBP)

```sql
select
  approx_distinct(item_id) as distinct_items,
  approx_percentile(cnt, 0.5) as median_events_per_item
from (
  select item_id, count(*) as cnt
  from prod_cdp.order_items
  where td_interval(time, '-12M')
  group by 1
)
```

A long tail of single-interaction items means `filter_num` should be raised above 0.

### Per-action volume and reward rate (NBA)

```sql
select
  action,
  count(*) as events,
  avg(cast(reward as double)) as reward_rate
from prod_cdp.interactions
where td_interval(time, '-12M')
group by 1
order by 2 desc
```

Aim for a few hundred interactions per action. A reward rate below roughly 1% weakens tuning -
consider layered rewards or consolidating rare actions.

## Step 4: Hand Off to the Plan

Carry the table, the mapped columns, any status filter, and the verification numbers into the plan
block at the end of step 3 of `SKILL.md`. That block is the single confirmation gate - it also
covers the files to be generated and the train/predict cadence - so do not ask for a separate
sign-off here. If no single suitable table exists, the user prepares one by joining or unioning
their data - that is input preparation, not part of the signal workflow.
