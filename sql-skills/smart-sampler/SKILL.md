---
name: smart-sampler
description: Intelligent data sampling for quick exploration with multiple sampling strategies including representative sampling, time-based sampling (recent, random periods), stratified sampling by dimensions, and edge case sampling (nulls, extremes, duplicates). Use when analysts need sample data for exploration, validation, or understanding without querying full tables.
---

# Smart Sampler

Intelligent data sampling strategies for efficient data exploration. Get representative samples quickly without full table scans.

## When to Use This Skill

Use when analysts need to:
- Preview data without full table scans
- Get representative samples for exploration
- Find edge cases (nulls, outliers, duplicates)
- Sample specific segments or time periods
- Validate data quality with examples

**Example prompts:**
- "Show me 100 sample records from sales_db.orders"
- "Sample high-value transactions from last month"
- "Give me examples of records with null email addresses"
- "Show recent orders from yesterday"
- "Sample 50 records per product category"

## Sampling Strategies

### 1. Simple Random Sample

**Use case:** Quick data preview

```sql
select *
from sales_db.orders
where td_interval(time, '-7d', 'JST')
  and rand() < 0.01  -- 1% sample
limit 100
```

**Best for:** Fast exploration of recent data

### 2. Time-Based Sampling

#### Recent Data (Most Common)

```sql
-- Last 24 hours
select *
from sales_db.orders
where td_interval(time, '-1d', 'JST')
order by time desc
limit 100
```

#### Specific Time Period

```sql
-- Yesterday's data
select *
from sales_db.orders
where td_interval(time, '-1d/-1d', 'JST')
limit 100
```

#### Random Day from Last Month

```sql
-- Sample from random day
select *
from sales_db.orders
where td_time_string(time, 'd!', 'JST') = '2024-12-05'
limit 100
```

### 3. Stratified Sampling

**Use case:** Representative sample across segments

```sql
-- Sample 20 records per status
with ranked as (
  select
    *,
    row_number() over (partition by status order by rand()) as rn
  from sales_db.orders
  where td_interval(time, '-30d', 'JST')
)
select *
from ranked
where rn <= 20
order by status, rn
```

**Alternate - Proportional sampling:**

```sql
-- Sample proportionally from each category
with category_counts as (
  select
    category,
    count(*) as total_count,
    count(*) * 1.0 / sum(count(*)) over () as proportion
  from sales_db.orders
  where td_interval(time, '-30d', 'JST')
  group by category
),
ranked as (
  select
    o.*,
    c.proportion,
    row_number() over (partition by o.category order by rand()) as rn
  from sales_db.orders o
  join category_counts c on o.category = c.category
  where td_interval(time, '-30d', 'JST')
)
select *
from ranked
where rn <= ceil(proportion * 100)  -- 100 total samples
order by category
```

### 4. Edge Case Sampling

#### Null Values

```sql
-- Records with null email
select *
from sales_db.customers
where email is null
limit 100
```

#### Missing or Invalid Data

```sql
-- Orders with missing currency
select *
from sales_db.orders
where td_interval(time, '-30d', 'JST')
  and (currency is null or currency = '')
limit 100
```

#### Extreme Values (Outliers)

```sql
-- High-value orders (top 1%)
with percentiles as (
  select approx_percentile(amount, 0.99) as p99
  from sales_db.orders
  where td_interval(time, '-30d', 'JST')
)
select o.*
from sales_db.orders o, percentiles p
where td_interval(o.time, '-30d', 'JST')
  and o.amount >= p.p99
limit 100
```

```sql
-- Low-value orders (bottom 1%)
with percentiles as (
  select approx_percentile(amount, 0.01) as p1
  from sales_db.orders
  where td_interval(time, '-30d', 'JST')
)
select o.*
from sales_db.orders o, percentiles p
where td_interval(o.time, '-30d', 'JST')
  and o.amount <= p.p1
limit 100
```

#### Duplicates

```sql
-- Find duplicate customer emails
select *
from (
  select
    *,
    count(*) over (partition by email) as email_count
  from sales_db.customers
  where email is not null
)
where email_count > 1
limit 100
```

### 5. Diverse Sampling

**Use case:** Maximize variety in sample

```sql
-- Sample with maximum diversity
select distinct
  customer_id,
  first_value(order_id) over (partition by customer_id order by time desc) as recent_order_id,
  first_value(amount) over (partition by customer_id order by time desc) as recent_amount,
  first_value(status) over (partition by customer_id order by time desc) as recent_status
from sales_db.orders
where td_interval(time, '-30d', 'JST')
limit 100
```

### 6. Reservoir Sampling

**Use case:** Fixed-size sample from stream

```sql
-- Get exactly N random samples
select *
from sales_db.orders
where td_interval(time, '-7d', 'JST')
order by rand()
limit 100
```

## Complete Sampling Workflows

### Workflow 1: Quick Data Preview

**User prompt:** "Show me sample records from orders table"

**Steps:**
1. Default to recent data (last 24 hours)
2. Limit to reasonable size (100 rows)
3. Include key columns
4. Format as table

```sql
select
  order_id,
  customer_id,
  amount,
  currency,
  status,
  td_time_string(time, 's!', 'JST') as order_time
from sales_db.orders
where td_interval(time, '-1d', 'JST')
order by time desc
limit 100
```

**Present as:**
```markdown
## Sample Records: sales_db.orders (Last 24 Hours)

| Order ID | Customer ID | Amount | Currency | Status | Order Time |
|----------|-------------|--------|----------|--------|------------|
| 150234 | 8901 | 129.99 | USD | completed | 2024-12-15 14:32:15 |
| 150233 | 7823 | 45.50 | USD | pending | 2024-12-15 14:28:42 |
| 150232 | 9012 | 299.00 | JPY | shipped | 2024-12-15 14:15:33 |
...

**Total sampled:** 100 records
**Time range:** 2024-12-15 00:00:00 to 2024-12-15 23:59:59
```

### Workflow 2: Segment-Specific Sample

**User prompt:** "Sample 50 high-value transactions from last month"

**Steps:**
1. Define "high-value" (> $500 or top 10%)
2. Filter time range
3. Sample randomly from qualifying records

```sql
-- Option 1: Fixed threshold
select *
from sales_db.orders
where td_interval(time, '-1M', 'JST')
  and amount > 500
order by rand()
limit 50

-- Option 2: Percentile-based
with high_value as (
  select
    *,
    approx_percentile(amount, 0.90) over () as p90
  from sales_db.orders
  where td_interval(time, '-1M', 'JST')
)
select *
from high_value
where amount >= p90
order by rand()
limit 50
```

### Workflow 3: Quality Issue Examples

**User prompt:** "Show examples of orders with data quality issues"

**Steps:**
1. Identify quality issues (nulls, invalids)
2. Sample from each issue type
3. Present categorized results

```sql
-- Missing currency
select 'Missing Currency' as issue_type, *
from sales_db.orders
where td_interval(time, '-30d', 'JST')
  and currency is null
limit 20

union all

-- Negative amounts
select 'Negative Amount' as issue_type, *
from sales_db.orders
where td_interval(time, '-30d', 'JST')
  and amount < 0
limit 20

union all

-- Future timestamps
select 'Future Timestamp' as issue_type, *
from sales_db.orders
where td_interval(time, '-30d', 'JST')
  and time > cast(to_unixtime(current_timestamp) as bigint)
limit 20
```

**Present as:**
```markdown
## Data Quality Issues: sales_db.orders

### Missing Currency (20 examples)
| Order ID | Amount | Currency | Status |
|----------|--------|----------|--------|
| 145023 | 129.99 | NULL | completed |
| 145087 | 45.00 | NULL | pending |
...

### Negative Amounts (5 examples)
| Order ID | Amount | Currency | Status |
|----------|--------|----------|--------|
| 148234 | -50.00 | USD | refunded |
...

**Summary:**
- Missing Currency: 87 records (0.8%)
- Negative Amounts: 5 records (0.05%)
- Future Timestamps: 0 records
```

### Workflow 4: Stratified Representative Sample

**User prompt:** "Get 200 representative samples from orders across all statuses"

```sql
-- Calculate samples per status (proportional)
with status_distribution as (
  select
    status,
    count(*) as count,
    cast(count(*) as double) / sum(count(*)) over () as proportion
  from sales_db.orders
  where td_interval(time, '-30d', 'JST')
  group by status
),
samples_per_status as (
  select
    status,
    proportion,
    greatest(1, cast(proportion * 200 as integer)) as sample_size
  from status_distribution
),
ranked_orders as (
  select
    o.*,
    s.sample_size,
    row_number() over (partition by o.status order by rand()) as rn
  from sales_db.orders o
  join samples_per_status s on o.status = s.status
  where td_interval(o.time, '-30d', 'JST')
)
select *
from ranked_orders
where rn <= sample_size
order by status, rn
```

## Smart Sample Size Selection

Auto-determine appropriate sample size:

```python
# Pseudo-logic for sample size
def smart_sample_size(total_rows, use_case):
    if use_case == "preview":
        return min(100, total_rows)
    elif use_case == "validation":
        return min(1000, total_rows * 0.01)  # 1% sample
    elif use_case == "analysis":
        # Statistical significance: n = (Z^2 * p * (1-p)) / E^2
        # For 95% confidence, 5% margin: ~385 samples
        return min(500, total_rows)
    else:
        return 100  # default
```

## Sampling Best Practices

1. **Always include time filters** - Avoid full table scans
2. **Use ORDER BY rand() for true randomness** - Not just LIMIT
3. **Consider stratification** - Ensure representation
4. **Document sampling method** - For reproducibility
5. **Show sample metadata** - Total rows, time range, selection criteria
6. **Balance speed vs. accuracy** - Larger samples = slower queries

## Performance Optimization

### Fast Sampling (Small Tables)

```sql
-- Simple random sample
select *
from table_name
where td_interval(time, '-7d', 'JST')
  and rand() < 0.1
limit 100
```

### Efficient Sampling (Large Tables)

```sql
-- Partition-aware sampling
select *
from large_table
where td_interval(time, '-1d', 'JST')  -- Single partition
order by rand()
limit 100
```

### Avoid Anti-Patterns

**❌ Bad - Full table scan:**
```sql
select * from table_name order by rand() limit 100
```

**✅ Good - Time-filtered:**
```sql
select *
from table_name
where td_interval(time, '-7d', 'JST')
order by rand()
limit 100
```

## Sample Output Formats

### Compact Table View

```markdown
| order_id | customer_id | amount | status |
|----------|-------------|--------|--------|
| 150234 | 8901 | 129.99 | completed |
| 150233 | 7823 | 45.50 | pending |
...

**Sample:** 100 records from 10,892 total (0.9%)
```

### Detailed View

```markdown
## Sample Record 1/100

**Order ID:** 150234
**Customer ID:** 8901
**Amount:** $129.99 USD
**Status:** completed
**Order Time:** 2024-12-15 14:32:15 JST
**Shipping Address:** 123 Main St, Tokyo
**Items:** 3

---

## Sample Record 2/100
...
```

### JSON Format

```json
{
  "sample_metadata": {
    "table": "sales_db.orders",
    "total_rows": 10892,
    "sample_size": 100,
    "sample_percentage": 0.92,
    "time_range": "2024-12-08 to 2024-12-15",
    "sampling_method": "stratified_by_status"
  },
  "records": [
    {
      "order_id": 150234,
      "customer_id": 8901,
      "amount": 129.99,
      "currency": "USD",
      "status": "completed",
      "order_time": "2024-12-15T14:32:15+09:00"
    }
  ]
}
```

## Common Sampling Queries

### Recent N Records

```sql
select *
from table_name
where td_interval(time, '-1d', 'JST')
order by time desc
limit 100
```

### Random Percentage

```sql
select *
from table_name
where td_interval(time, '-7d', 'JST')
  and rand() < 0.05  -- 5% sample
```

### Top N by Metric

```sql
select *
from table_name
where td_interval(time, '-30d', 'JST')
order by amount desc
limit 100
```

### Balanced Sample

```sql
-- Equal samples from each category
with ranked as (
  select
    *,
    row_number() over (partition by category order by rand()) as rn
  from table_name
  where td_interval(time, '-30d', 'JST')
)
select *
from ranked
where rn <= 50
```

## Integration with Other Skills

**Before sampling:**
- **schema-explorer** - Identify columns for stratification
- **data-profiler** - Understand distributions for smart sampling

**After sampling:**
- **analytical-query** - Analyze sampled data
- **data-profiler** - Profile the sample
- **query-explainer** - Understand sampling query

## Use Case Examples

### Example 1: New Dataset Exploration

**Goal:** Quickly understand a new table

**Workflow:**
1. Sample recent data (last 24 hours)
2. Look for patterns and data types
3. Identify potential issues

```sql
select *
from unknown_db.mystery_table
where td_interval(time, '-1d', 'JST')
limit 100
```

### Example 2: Data Validation

**Goal:** Verify data quality assumptions

**Workflow:**
1. Sample edge cases (nulls, extremes)
2. Check business rule violations
3. Document issues

```sql
-- Sample potential issues
select * from orders where amount < 0 limit 10
union all
select * from orders where currency is null limit 10
union all
select * from orders where customer_id is null limit 10
```

### Example 3: A/B Test Data

**Goal:** Sample equally from control and treatment groups

```sql
with ranked as (
  select
    *,
    row_number() over (partition by experiment_group order by rand()) as rn
  from experiment_events
  where td_interval(time, '-7d', 'JST')
)
select *
from ranked
where rn <= 500
order by experiment_group, rn
```

## Related Skills

- **schema-explorer** - Discover tables to sample
- **data-profiler** - Profile sampled data
- **analytical-query** - Analyze samples
- **trino** - SQL reference

## Resources

- Trino Sampling: https://trino.io/docs/current/sql/select.html#tablesample
- Statistical Sampling: https://en.wikipedia.org/wiki/Sampling_(statistics)
