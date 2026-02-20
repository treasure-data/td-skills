---
name: query-explainer
description: Converts SQL queries to natural language explanations with step-by-step breakdowns. Explains query logic, identifies performance characteristics, suggests alternative approaches, and generates documentation. Use when analysts need to understand complex queries, learn SQL patterns, debug issues, or document query logic.
---

# Query Explainer

Transform SQL queries into clear natural language explanations. Understand what queries do, how they work, and how to improve them.

## 🔴 DEFAULT SKILL FOR QUERY ANALYSIS

**IMPORTANT: This is the DEFAULT skill to invoke when a user provides a SQL query.**

### Default Invocation Pattern:

**When user provides a query WITHOUT specifying optimization:**
```
User: "Explain this query: SELECT * FROM orders"
User: "What does this query do: [SQL]"
User: "Help me understand this: [SQL]"
User: "Why is this query slow: [SQL]"
```

**→ Use query-explainer (THIS SKILL) as the default entry point**

**Workflow:**
1. ✅ Explain the query (what it does, step-by-step)
2. ✅ Detect performance issues automatically
3. ✅ If CRITICAL issues found → Automatically invoke trino-optimizer
4. ✅ Return: Explanation + Issues + Optimized Query (if applicable)

**When user EXPLICITLY asks for optimization:**
```
User: "Optimize this query: [SQL]"
User: "Make this faster: [SQL]"
User: "Here's my query and log - optimize it"
```

**→ Invoke trino-optimizer DIRECTLY** (skip query-explainer)

**When user provides Job ID or job link:**
```
User: "Analyze this job: job_id_12345"
User: "Why is this job slow: https://console.treasuredata.com/jobs/12345"
User: "Check job 12345"
User: "Explain job: 12345"
```

**→ Use query-explainer (THIS SKILL) as entry point**

**Workflow:**
1. ✅ Fetch job details using `tdx job show <job_id>`
2. ✅ Extract query SQL and execution stats (engine, time, data scanned, status)
3. ✅ Explain the query (what it does, step-by-step)
4. ✅ Detect performance issues from execution stats
5. ✅ Automatically invoke trino-optimizer with job stats
6. ✅ Return: Explanation + Job Analysis + Engine Recommendations + Optimized Query

---

## When to Use This Skill

**DEFAULT USE CASES (invoke this skill first):**
- User provides a query without specifying optimization
- Understand inherited or complex SQL queries
- Learn TD-specific SQL patterns
- Debug query logic issues
- Document queries for team knowledge sharing
- Get alternative query approaches
- Identify performance bottlenecks in queries
- "Why is this query slow?" questions

**Example prompts that trigger THIS skill:**
- "Explain this query: [SQL]"
- "What does this CTE do?"
- "Break down this query step by step"
- "Why is this query slow?"
- "Simplify this query for documentation"
- "Help me understand: [SQL]"
- "What's wrong with this query: [SQL]"

---

## 🔴 JOB ID / JOB LINK ANALYSIS

**CRITICAL: Always analyze Job IDs and job links for complete context**

### When User Provides Job ID or Link

**User Input Examples:**
```
User: "Analyze this job: job_id_12345"
User: "Why is this job slow: https://console.treasuredata.com/jobs/12345"
User: "Check job 12345"
User: "Explain job: 12345"
User: "This job failed: 67890"
User: "Optimize job_id_99999"
```

**→ Invoke query-explainer (THIS SKILL) with Job Analysis workflow**

---

### Job Analysis Workflow

**Step 1: Fetch Job Details**

Use `tdx job show <job_id> -o json` to extract:
```bash
tdx job show 12345 -o json
```

**Extract key information:**
- Query SQL
- Query engine (Hive, Presto, Trino)
- Execution time
- Data scanned (GB/rows)
- Status (success, error, killed)
- Error messages (if failed)
- Start/end timestamps
- Database used

**Step 2: Analyze Execution Stats**

From job details, identify:
- **Performance issues**: Slow execution, large data scan, memory errors
- **Engine limitations**: Hive timeout, Trino memory limit
- **Query problems**: Missing time filter, inefficient operations

**Step 3: Explain Query**

Provide standard query explanation:
- What the query does
- Step-by-step breakdown
- Data flow

**Step 4: Detect Issues**

Based on execution stats + query analysis:
- Missing time filters → Full table scan
- Wrong engine → Hive for simple query, Trino for complex aggregation
- Memory errors → Need approximate functions or Hive
- Timeout → Need optimization or engine switch

**Step 5: Automatically Invoke Optimizer**

Pass job details to trino-optimizer:
- Query SQL
- Execution stats
- Engine used
- Error messages (if any)

**Step 6: Engine Recommendations**

Suggest engine migration if beneficial:
- **Hive → Trino**: For faster execution, complex JOINs, window functions
- **Trino → Hive**: For memory errors, very large datasets, approximate not needed

---

### Job Analysis Example

**User Input:**
```
"Why is this job slow: job_id_12345"
```

**Step 1: Fetch Job Details**
```bash
tdx job show 12345 -o json
```

**Job Details Extracted:**
```json
{
  "job_id": "12345",
  "status": "success",
  "type": "presto",
  "query": "SELECT customer_id, COUNT(*) FROM orders GROUP BY customer_id",
  "duration": 285.3,
  "cpu_time": 245.1,
  "result_size": "1.2 MB",
  "database": "sample_db"
}
```

**Step 2: Analysis**

```markdown
# Job Analysis: job_id_12345

## Job Details
- **Job ID**: 12345
- **Status**: ✅ Success (but slow)
- **Engine**: Presto (Trino)
- **Execution Time**: 285.3 seconds
- **Database**: sample_db

## Query
```sql
SELECT customer_id, COUNT(*)
FROM orders
GROUP BY customer_id
```

## What This Query Does
This query counts the number of orders for each customer.

1. Scans all rows from `orders` table
2. Groups by customer_id
3. Counts orders per customer
4. Returns customer_id and order count

---

## ⚠️ Performance Issues Detected from Job

### CRITICAL Issue:
❌ **Missing time filter**
- Evidence: 285s execution time for simple aggregation
- Root cause: Full table scan (no time filter)
- Impact: Scanning all historical data

### Job Statistics:
- Execution time: 285.3s ← **VERY SLOW** for this query type
- Expected time with optimization: ~2s
- **Potential speedup: 140x faster**

---

## 🔧 Automatically Optimizing...

Invoking trino-optimizer with job details...
```

**Step 3: trino-optimizer provides optimization**

```markdown
# Query Optimization Report (Job ID: 12345)

## Original Query (from job)
```sql
SELECT customer_id, COUNT(*)
FROM orders
GROUP BY customer_id
```

## Issues Found from Job Analysis

### CRITICAL
⚠️ **Missing time filter** (140x impact)
- Job took 285s for simple aggregation
- Full table scan detected
- No partition pruning

## Optimized Query

```sql
-- ✅ OPTIMIZED: Added time filter for partition pruning
SELECT customer_id, COUNT(*) as order_count
FROM orders
WHERE td_interval(time, '-30d', 'JST')  -- ✅ ADDED
GROUP BY customer_id
```

## Engine Analysis

**Current Engine**: Presto (Trino)
- ✅ Good choice for this query type
- ✅ Fast aggregations
- ✅ No memory issues detected

**No engine change needed** - Trino is optimal for this workload.

## Performance Comparison

| Metric | Current (Job 12345) | Optimized | Improvement |
|--------|---------------------|-----------|-------------|
| Execution Time | 285s | ~2s | **140x faster** |
| Data Scanned | ~150GB (estimated) | ~1.5GB | **99% reduction** |
| Status | Success (but slow) | Success (fast) | **Reliable** |

## Recommendations

1. ✅ **Add time filter** - Reduces execution time by 140x
2. ✅ **Engine is optimal** - Keep using Trino for this query
3. 💡 **Monitor similar queries** - Check if other queries need time filters
```

---

### Engine Comparison and Migration Guide

**When to suggest engine migration:**

### Hive → Trino Migration

**Suggest when:**
- Query takes >60s on Hive but is relatively simple
- Query uses window functions (Trino 10-50x faster)
- Query has complex JOINs
- Need faster interactive analysis
- Hive query timeout (>4 hours)

**Example:**
```markdown
## 🔧 Engine Recommendation: Switch to Trino

**Current**: Hive (240s execution)
**Recommended**: Trino (estimated 8s execution)

**Why Trino is better:**
- ✅ 30x faster for window functions
- ✅ Better for interactive queries
- ✅ More efficient JOIN algorithms
- ✅ Lower latency

**Migration steps:**
1. Change `type: hive` to `type: presto` in workflow
2. Or use `tdx query -t presto` for ad-hoc queries
3. Update td_time_string → Use as-is (compatible)
4. Test query on small date range first

**Estimated improvement**: 30x faster (240s → 8s)
```

### Trino → Hive Migration

**Suggest when:**
- Trino memory limit errors (exceeded 10GB)
- Very large datasets (>500GB scanned)
- Long-running batch queries (>2 hours acceptable)
- Approximate functions not acceptable
- High-cardinality aggregations causing OOM

**Example:**
```markdown
## 🔧 Engine Recommendation: Switch to Hive

**Current**: Trino (failing with memory error)
**Recommended**: Hive (will complete successfully)

**Why Hive is better:**
- ✅ Handles very large datasets (500GB+)
- ✅ No memory limits (spills to disk)
- ✅ Better for batch processing
- ✅ Can handle high-cardinality GROUP BY

**Migration steps:**
1. Change `type: presto` to `type: hive` in workflow
2. Or use `tdx query -t hive` for ad-hoc queries
3. Update syntax differences:
   - `td_time_string(time, 'd!', 'JST')` → `TD_TIME_FORMAT(time, 'yyyy-MM-dd', 'JST')`
   - `REGEXP_LIKE(col, pattern)` → `col RLIKE pattern`
   - `ARRAY_AGG(col)` → `COLLECT_LIST(col)`
4. Test query with time limit first

**Tradeoff**: Slower (estimated 15 min vs 3 min Trino) but **will complete without errors**
```

---

### Job Status Analysis

**Success (but slow)**
```markdown
## Job Status: ✅ Success (but slow)

- Query completed successfully
- Performance issue detected
- Optimization will improve speed
```

**Failed (error)**
```markdown
## Job Status: ❌ Failed

**Error**: Query exceeded memory limit of 10GB

**Root Cause**: Exact DISTINCT on very large dataset

**Solution**:
1. Use approx_distinct() instead
2. Or switch to Hive engine
```

**Killed (timeout)**
```markdown
## Job Status: 🛑 Killed (timeout)

**Reason**: Exceeded Hive 4-hour timeout

**Root Cause**: Missing time filter + full table scan

**Solution**:
1. Add time filter (critical)
2. Or switch to Trino for faster execution
```

---

## Explanation Components

### 1. High-Level Summary

**One-sentence description of what the query does**

Example:
```sql
select customer_id, sum(amount) as total_spent
from sales_db.orders
where td_interval(time, '-30d', 'JST')
group by customer_id
order by total_spent desc
limit 10
```

**Explanation:**
> This query finds the top 10 customers by total spending in the last 30 days.

### 2. Step-by-Step Breakdown

**Detailed explanation of each query component**

```markdown
## Query Breakdown

### 1. Data Source
- **Table:** `sales_db.orders`
- **Purpose:** Transaction records

### 2. Filtering (WHERE clause)
- **Time filter:** `td_interval(time, '-30d', 'JST')`
  - Filters to last 30 days
  - Uses JST timezone
  - **Performance:** Enables partition pruning

### 3. Grouping (GROUP BY)
- **Groups by:** `customer_id`
- **Effect:** Aggregates all orders per customer

### 4. Aggregation (SELECT)
- **customer_id:** Customer identifier
- **sum(amount) as total_spent:** Total money spent per customer

### 5. Sorting (ORDER BY)
- **Sorted by:** `total_spent desc`
- **Order:** Highest spenders first

### 6. Limiting (LIMIT)
- **Returns:** Top 10 customers only
```

### 3. Data Flow Diagram

**Visual representation of query execution**

```markdown
## Data Flow

orders table (sales_db)
    ↓
Filter by time (last 30 days)
    ↓
Group by customer_id
    ↓
Calculate sum(amount) per group
    ↓
Sort by total_spent (descending)
    ↓
Take top 10 results
    ↓
Return: customer_id, total_spent
```

### 4. Performance Analysis

**Performance characteristics and optimization opportunities**

```markdown
## Performance Notes

✅ **Good:**
- Uses time filter (`td_interval`) for partition pruning
- Aggregates before sorting (efficient)
- LIMIT clause prevents large result sets

⚠️ **Potential Issues:**
- None identified - well-optimized query

**Estimated Performance:** Fast (< 10 seconds on typical datasets)
**Data Scanned:** ~30 days of partitions
```

### 5. Automatic Performance Issue Detection

**🔴 CRITICAL: Always detect and report performance issues**

After explaining any query, automatically check for these critical issues:

**Critical Performance Issues:**
1. ❌ **Missing time filter** - No `td_interval()` or `td_time_range()`
2. ❌ **Using exact distinct** - `count(distinct)` on large datasets
3. ❌ **Functions in WHERE** - `td_time_string()` in WHERE clause
4. ❌ **SELECT * pattern** - Selecting all columns unnecessarily
5. ❌ **Correlated subqueries** - Subquery referencing outer query
6. ❌ **LIMIT without ORDER BY** - Non-deterministic results
7. ❌ **UNION without ALL** - Unnecessary deduplication
8. ❌ **Inefficient JOINs** - Filtering after JOIN instead of before

**When performance issues are found:**

```markdown
## ⚠️ Performance Issues Detected

### CRITICAL Issues (100-1000x impact):
- ❌ **Missing time filter** - Query scans entire table (years of data)
- ❌ **Correlated subquery** - Executes once per row

### HIGH Priority (10-50x impact):
- ⚠️ **Using exact distinct count** - Consider approx_distinct()
- ⚠️ **SELECT * usage** - Only select needed columns

### Recommendation:
🔧 **Use `/sql-skills:trino-optimizer` for detailed optimization suggestions**

This query has significant performance issues. The trino-optimizer skill will:
- Provide optimized query with all fixes applied
- Show before/after performance comparison
- Estimate speedup and cost savings
- Add inline comments explaining each change
```

**Detection Logic:**

```python
# Pseudo-code for issue detection
issues = []

# Check 1: Time filter
if not contains_time_filter(query):
    issues.append({
        'severity': 'CRITICAL',
        'issue': 'Missing time filter',
        'impact': '100-1000x slower',
        'fix': 'Add WHERE td_interval(time, \'-30d\', \'JST\')'
    })

# Check 2: Correlated subquery
if has_correlated_subquery(query):
    issues.append({
        'severity': 'CRITICAL',
        'issue': 'Correlated subquery',
        'impact': '100-1000x slower',
        'fix': 'Convert to JOIN'
    })

# Check 3: Exact distinct
if uses_count_distinct(query) and is_large_dataset(query):
    issues.append({
        'severity': 'HIGH',
        'issue': 'Using exact distinct count',
        'impact': '10-50x slower',
        'fix': 'Use approx_distinct() instead'
    })

# Check 4: SELECT *
if uses_select_star(query):
    issues.append({
        'severity': 'MEDIUM',
        'issue': 'SELECT * pattern',
        'impact': '2-5x slower',
        'fix': 'Select specific columns only'
    })

# Check 5: td_time_string in WHERE
if has_time_function_in_where(query):
    issues.append({
        'severity': 'CRITICAL',
        'issue': 'Time function in WHERE clause',
        'impact': '100x slower',
        'fix': 'Use td_time_range() instead'
    })

# Check 6: LIMIT without ORDER BY
if has_limit_without_order(query):
    issues.append({
        'severity': 'LOW',
        'issue': 'LIMIT without ORDER BY',
        'impact': 'Non-deterministic results',
        'fix': 'Add ORDER BY clause'
    })

# Check 7: UNION without ALL
if uses_union_not_all(query):
    issues.append({
        'severity': 'MEDIUM',
        'issue': 'UNION without ALL',
        'impact': '2-5x slower',
        'fix': 'Use UNION ALL if duplicates acceptable'
    })

# Categorize and report
critical = [i for i in issues if i['severity'] == 'CRITICAL']
high = [i for i in issues if i['severity'] == 'HIGH']
medium = [i for i in issues if i['severity'] == 'MEDIUM']

if critical or high:
    recommend_query_optimizer = True
```

## Complete Workflow: Explain + Optimize

**🔴 MANDATORY: Always follow this workflow when user provides a query (default behavior)**

### Default Entry Point Workflow

**When user provides ANY query:**

```
User provides query
    ↓
1. Invoke query-explainer (THIS SKILL) ← DEFAULT
    ↓
2. Explain query (summary, breakdown, data flow)
    ↓
3. Detect performance issues automatically
    ↓
4. If CRITICAL/HIGH issues found
    ↓
5. Automatically invoke trino-optimizer
    ↓
6. Return: Explanation + Issues + Optimized Query + Metrics
```

**Exception: User explicitly asks for optimization:**

```
User: "Optimize this query: [SQL]"
    ↓
Invoke trino-optimizer DIRECTLY (skip query-explainer)
    ↓
Return: Optimized query + Metrics
```

---

### Step 1: Provide Query Explanation
- High-level summary
- Step-by-step breakdown
- Data flow diagram

### Step 2: Detect Performance Issues
- Run automatic performance checks
- Categorize issues by severity
- List all issues found

### Step 3: Automatically invoke trino-optimizer (if issues found)
- **Automatically trigger** `/sql-skills:trino-optimizer`
- No manual invocation needed
- Seamless integration

### Step 4: Return Complete Analysis
- Query explanation
- Performance issues identified
- Optimized query (if issues found)
- Before/after metrics

### Workflow Example

**User provides query:**
```sql
select
  customer_id,
  count(*) as order_count,
  (select avg(amount) from sales_db.orders o2 where o2.customer_id = o1.customer_id) as avg_amount
from sales_db.orders o1
group by customer_id
order by order_count desc
```

**Your response should include:**

```markdown
# Query Explanation

## Summary
This query counts orders per customer and calculates their average order amount, ranking customers by order volume.

## What This Query Does
1. Groups orders by customer_id
2. Counts orders per customer
3. Calculates average order amount per customer (subquery)
4. Sorts by order count descending

## Data Flow
sales_db.orders (o1)
    ↓
Group by customer_id
    ↓
Count orders → For each customer, run subquery on orders (o2)
    ↓
Calculate avg(amount) per customer
    ↓
Sort by order_count desc
    ↓
Return: customer_id, order_count, avg_amount

---

## ⚠️ Performance Issues Detected

### CRITICAL Issues:
1. ❌ **Missing time filter**
   - Scans: ENTIRE table (years of data)
   - Impact: 100-1000x slower
   - Fix: Add `WHERE td_interval(time, '-90d', 'JST')`

2. ❌ **Correlated subquery**
   - Executes: Once PER customer (potentially millions of times)
   - Impact: 100-1000x slower
   - Fix: Convert to JOIN or window function

### Performance Estimate:
- Current: 300+ seconds (timeout risk)
- Optimized: ~3 seconds
- Speedup potential: **100x faster**

---

## 🔧 Recommended Next Step

**Use `/sql-skills:trino-optimizer` to get the optimized query**

The trino-optimizer will provide:
✅ Fully optimized query with time filter
✅ Correlated subquery converted to window function
✅ Before/after performance comparison
✅ Inline comments explaining each optimization
✅ Estimated cost savings

**Quick preview of optimized approach:**
```sql
-- Optimized version (preview)
select
  customer_id,
  count(*) as order_count,
  avg(amount) as avg_amount  -- ✅ Simple aggregation instead of subquery
from sales_db.orders
where td_interval(time, '-90d', 'JST')  -- ✅ Time filter added
group by customer_id
order by order_count desc
```

**Expected improvement:**
- 100x faster execution
- 99% less data scanned
- No timeout risk
```

---

## Explanation Examples

### Example 1: Simple Aggregation

**Query:**
```sql
select
  status,
  count(*) as order_count
from sales_db.orders
where td_interval(time, '-7d', 'JST')
group by status
```

**Explanation:**

```markdown
# Query Explanation

## Summary
Counts the number of orders by status for the last 7 days.

## What This Query Does

1. **Accesses data from** `sales_db.orders` table
2. **Filters to** orders from the last 7 days (JST timezone)
3. **Groups by** order status (completed, pending, cancelled, etc.)
4. **Counts** the number of orders in each status group
5. **Returns** each status and its order count

## Results Format

| status | order_count |
|--------|-------------|
| completed | 8,520 |
| pending | 1,240 |
| shipped | 890 |

## Use Case
Useful for understanding order status distribution and monitoring order pipeline health.
```

### Example 2: CTE (Common Table Expression)

**Query:**
```sql
with monthly_sales as (
  select
    td_time_string(time, 'M!', 'JST') as month,
    sum(amount) as revenue
  from sales_db.orders
  where td_interval(time, '-6M', 'JST')
  group by td_time_string(time, 'M!', 'JST')
)
select
  month,
  revenue,
  revenue - lag(revenue) over (order by month) as revenue_change
from monthly_sales
order by month
```

**Explanation:**

```markdown
# Query Explanation

## Summary
Calculates monthly revenue for the last 6 months and shows month-over-month change.

## Step-by-Step Breakdown

### Part 1: CTE - monthly_sales

**Purpose:** Calculate total revenue per month

1. **Source:** `sales_db.orders` table
2. **Time Range:** Last 6 months (`-6M`)
3. **Grouping:** By month using `td_time_string(time, 'M!', 'JST')`
   - Format: "2024-11" (year-month)
4. **Aggregation:** `sum(amount)` as revenue per month

**Intermediate Result:**
| month | revenue |
|-------|---------|
| 2024-07 | 125,000 |
| 2024-08 | 142,000 |
| 2024-09 | 138,000 |

### Part 2: Main Query

**Purpose:** Calculate month-over-month changes

1. **Window Function:** `lag(revenue) over (order by month)`
   - Gets previous month's revenue
2. **Calculation:** Current revenue - previous revenue
3. **Sorting:** By month (chronological order)

## Final Result

| month | revenue | revenue_change |
|-------|---------|----------------|
| 2024-07 | 125,000 | NULL (first month) |
| 2024-08 | 142,000 | +17,000 |
| 2024-09 | 138,000 | -4,000 |

## Business Value
Tracks revenue trends and identifies growth or decline periods.

## Performance Notes
✅ Efficient: Groups by month first, then processes small result set
✅ Uses time filter for partition pruning
```

### Example 3: Complex JOIN

**Query:**
```sql
select
  c.customer_id,
  c.email,
  count(o.order_id) as total_orders,
  sum(o.amount) as total_spent,
  max(o.time) as last_order_time
from core_db.customers c
left join sales_db.orders o
  on c.customer_id = o.customer_id
  and td_interval(o.time, '-90d', 'JST')
group by c.customer_id, c.email
having count(o.order_id) > 0
order by total_spent desc
```

**Explanation:**

```markdown
# Query Explanation

## Summary
Identifies all customers who made purchases in the last 90 days, ranked by total spending.

## Detailed Breakdown

### 1. Tables Involved

**Primary Table:** `core_db.customers` (c)
- Contains customer master data

**Joined Table:** `sales_db.orders` (o)
- Contains transaction history

### 2. JOIN Logic

**Type:** LEFT JOIN (keeps all customers)
**Condition:**
- `c.customer_id = o.customer_id` - Match customers to their orders
- `td_interval(o.time, '-90d', 'JST')` - Only last 90 days of orders

**Why LEFT JOIN?**
Originally includes all customers, but HAVING clause filters to only those with orders.

### 3. Aggregations

**Per customer, calculate:**
- `count(o.order_id)` - Number of orders
- `sum(o.amount)` - Total money spent
- `max(o.time)` - Timestamp of most recent order

### 4. Filtering (HAVING)

**Condition:** `count(o.order_id) > 0`
- Removes customers with no orders in last 90 days
- Effectively converts LEFT JOIN to INNER JOIN behavior

### 5. Sorting

**Order:** `total_spent desc`
- Highest spenders first

## Optimization Suggestion

Since HAVING filters to customers with orders, use INNER JOIN instead:

```sql
select
  c.customer_id,
  c.email,
  count(o.order_id) as total_orders,
  sum(o.amount) as total_spent,
  max(o.time) as last_order_time
from core_db.customers c
inner join sales_db.orders o
  on c.customer_id = o.customer_id
where td_interval(o.time, '-90d', 'JST')
group by c.customer_id, c.email
order by total_spent desc
```

**Why better:**
- More explicit intent (only customers with orders)
- Potentially faster (no need to process non-matching customers)
- Cleaner logic (no HAVING clause needed)
```

### Example 4: Subquery

**Query:**
```sql
select
  order_id,
  customer_id,
  amount,
  (select avg(amount) from sales_db.orders where td_interval(time, '-30d', 'JST')) as avg_order_amount,
  amount - (select avg(amount) from sales_db.orders where td_interval(time, '-30d', 'JST')) as vs_average
from sales_db.orders
where td_interval(time, '-30d', 'JST')
  and amount > (select avg(amount) from sales_db.orders where td_interval(time, '-30d', 'JST'))
```

**Explanation:**

```markdown
# Query Explanation

## Summary
Finds above-average orders from the last 30 days and shows how much they exceed the average.

## Issues Identified

⚠️ **Performance Problem:** Subquery is executed multiple times
- Subquery runs for EVERY row in SELECT
- Subquery runs AGAIN in WHERE clause
- Same calculation repeated thousands of times

## Better Approach - Use CTE

```sql
with avg_calc as (
  select avg(amount) as avg_order_amount
  from sales_db.orders
  where td_interval(time, '-30d', 'JST')
)
select
  o.order_id,
  o.customer_id,
  o.amount,
  a.avg_order_amount,
  o.amount - a.avg_order_amount as vs_average
from sales_db.orders o
cross join avg_calc a
where td_interval(o.time, '-30d', 'JST')
  and o.amount > a.avg_order_amount
```

**Why Better:**
✅ Average calculated only once
✅ Cross join adds avg to every row efficiently
✅ Much faster execution
✅ Clearer query structure

## Performance Impact
- **Original:** ~100x slower (avg calculated per row)
- **Optimized:** Calculates avg once, reuses value
- **Speed improvement:** 10-100x faster depending on data size
```

## Explanation Strategies

### For Beginners

**Focus on:**
- What the query returns
- Why you would use it
- Simple step-by-step flow
- Avoid technical jargon

**Example:**
```markdown
This query shows which customers spent the most money last month.

It looks at all orders from the past 30 days, adds up how much each
customer spent, and shows you the top 10 biggest spenders.
```

### For Intermediate Users

**Focus on:**
- Query structure and logic
- Performance considerations
- Alternative approaches
- Best practices

**Example:**
```markdown
## Query Structure

1. Filters orders to last 30 days (partition pruning)
2. Groups by customer_id (aggregation)
3. Sums amount per customer
4. Sorts descending and takes top 10

## Performance Notes
- Time filter enables partition pruning
- Aggregation happens before sorting (efficient)
- Could add HAVING clause to filter low-value customers before sorting
```

### For Advanced Users

**Focus on:**
- Execution plan implications
- Optimization opportunities
- Edge cases and caveats
- Alternative query patterns

**Example:**
```markdown
## Execution Analysis

**Scan:** Partition-pruned scan on orders (30 days)
**Aggregation:** Hash aggregation by customer_id
**Sort:** Top-N heap sort (limited to 10 rows)

## Optimizations

1. Consider pre-aggregated table for frequent queries
2. Index on (customer_id, time, amount) if available
3. Use approx_distinct for customer counting in large datasets

## Caveats

- Timezone (JST) may not align with UTC partitions
- customer_id nulls excluded from grouping
- Ties at position 10 arbitrarily resolved
```

## TD-Specific Patterns

### Time Filtering

**Pattern:**
```sql
where td_interval(time, '-1d', 'JST')
```

**Explanation:**
```markdown
**TD Time Filter**
- Function: `td_interval()`
- Column: `time` (Unix timestamp)
- Range: `-1d` (last 1 day)
- Timezone: `JST` (Japan Standard Time)

**Purpose:** Partition pruning for performance
**Effect:** Only scans yesterday's data, not entire table

**Important:** ALWAYS use time filters to avoid full table scans
```

### Time Formatting

**Pattern:**
```sql
td_time_string(time, 'd!', 'JST') as date
```

**Explanation:**
```markdown
**TD Time Formatting**
- Converts Unix timestamp to human-readable date
- Format: `'d!'` = date only (2024-12-15)
- Timezone: JST

**Use in SELECT only**, never in WHERE (slow!)

Good: `select td_time_string(time, 'd!', 'JST')`
Bad: `where td_time_string(time, 'd!', 'JST') = '2024-12-15'`
```

### Approximate Functions

**Pattern:**
```sql
approx_distinct(customer_id)
```

**Explanation:**
```markdown
**Approximate Counting**
- Much faster than exact count(distinct ...)
- Uses HyperLogLog algorithm
- ~2% error rate (acceptable for large datasets)

**When to use:**
- Large datasets (millions+ rows)
- Approximate count is sufficient
- Performance is critical

**When NOT to use:**
- Small datasets (< 10K rows) - exact count is fast enough
- Need exact numbers for financial reporting
```

## Common Query Patterns

### Pattern 1: Top N

```sql
select column, count(*) as cnt
from table
where td_interval(time, '-1d')
group by column
order by cnt desc
limit 10
```

**Explanation:** Finds top 10 most common values

### Pattern 2: Window Functions

```sql
select
  column,
  value,
  lag(value) over (order by time) as previous_value
from table
```

**Explanation:** Compares current row with previous row

### Pattern 3: Running Total

```sql
select
  date,
  amount,
  sum(amount) over (order by date) as running_total
from table
```

**Explanation:** Calculates cumulative sum over time

## Explanation Output Format

### Standard Format

```markdown
# Query Explanation

## Summary
[One-sentence description]

## What This Query Does
[Step-by-step in plain English]

## Results Format
[Table showing expected output]

## Performance Notes
[Optimization status and recommendations]

## Business Value
[Why this query is useful]

## Alternative Approaches
[If applicable, show better ways]
```

## Integration with Other Skills

**🔴 CRITICAL: This skill is the DEFAULT ENTRY POINT for query analysis**

### Primary Integration: trino-optimizer

**AUTOMATIC INTEGRATION WORKFLOW:**
```
User provides query
    ↓
1. query-explainer (THIS SKILL) - Default entry point
    ↓
2. Explain query logic and structure
    ↓
3. Automatically detect performance issues
    ↓
4. If CRITICAL or HIGH issues found:
    ↓
5. AUTOMATICALLY invoke trino-optimizer
    ↓
6. Return complete analysis:
   - Query explanation
   - Performance issues detected
   - Optimized query with fixes
   - Before/after metrics
```

**MANDATORY AUTOMATIC INVOCATION:**

Automatically invoke `/sql-skills:trino-optimizer` when:
- ANY CRITICAL issues detected (missing time filter, correlated subquery)
- Multiple HIGH priority issues (exact distinct, SELECT *, inefficient JOINs)
- Performance impact > 10x potential speedup
- User asks "why is this slow?" (even without explicit optimization request)

**Example automatic invocation:**
```markdown
After explaining the query and detecting CRITICAL issues:

## ⚠️ Performance Issues Detected

### CRITICAL Issues:
- ❌ Missing time filter (100-1000x impact)
- ❌ Correlated subquery (100-1000x impact)

---

## 🔧 Optimizing Query Automatically...

**Invoking trino-optimizer to fix detected issues...**

[Automatically invoke /sql-skills:trino-optimizer with the query]

[Return optimized query + metrics]
```

---

### When NOT to invoke trino-optimizer

**Skip optimization if:**
- No CRITICAL or HIGH issues detected
- Query is already well-optimized
- Only LOW/MEDIUM issues (just recommend, don't auto-invoke)

**Example:**
```markdown
## Performance Notes

✅ **Well-Optimized Query**
- Uses time filter for partition pruning
- Specific columns selected
- Efficient aggregation

⚠️ **Minor Suggestion:**
- Consider adding ORDER BY with LIMIT for deterministic results
  (Low priority - not auto-optimizing)
```

---

**When to invoke trino-optimizer:**
- ANY CRITICAL issues detected (missing time filter, correlated subquery)
- Multiple HIGH priority issues (exact distinct, SELECT *, inefficient JOINs)
- User explicitly asks "why is this slow?" or mentions performance
- User provides query + execution log showing poor performance

**Example invocation message:**
```
After explaining the query and detecting performance issues:

"This query has 2 critical performance issues that cause 100x slowdown.
Automatically optimizing the query..."

[Invoke /sql-skills:trino-optimizer with the query]
```

### Other Skill Integrations:

**Chain with:**
- **trino-optimizer** - Get optimization suggestions after explanation (MANDATORY for slow queries)
- **analytical-query** - Understand generated queries before execution
- **trino** - Reference for TD-specific functions
- **data-profiler** - Understand data context for queries

**Workflow patterns:**

1. **Query Understanding:**
   - query-explainer → Understand what it does
   - trino-optimizer → Make it fast

2. **Query Generation:**
   - analytical-query → Generate query from natural language
   - query-explainer → Verify generated query logic
   - trino-optimizer → Ensure it's optimized

3. **Data Analysis:**
   - data-profiler → Understand table structure
   - query-explainer → Build and explain query
   - trino-optimizer → Optimize for performance

## Troubleshooting Explanations

### When Query is Unclear

**Steps:**
1. Break into smallest components
2. Explain each part individually
3. Show how parts connect
4. Provide execution order

### When Query is Inefficient

**Steps:**
1. Identify bottleneck
2. Explain why it's slow
3. Show optimized version
4. Compare performance

### When Query Has Issues

**Steps:**
1. Describe intended logic
2. Identify the issue
3. Show correct approach
4. Explain the fix

## Best Practices

1. **Start with summary** - High-level understanding first
2. **Use plain English** - Avoid jargon when possible
3. **Show examples** - Sample results help clarity
4. **Highlight TD patterns** - Call out TD-specific functions
5. **Include performance notes** - Always consider optimization
6. **Provide alternatives** - Show better approaches when available
7. **Use visual flow** - Data flow diagrams aid understanding

## Related Skills

- **trino-optimizer** - Optimization suggestions
- **trino** - TD SQL reference
- **analytical-query** - Query generation
- **data-profiler** - Understanding data

## Resources

- Trino SQL: https://trino.io/docs/current/
- TD Functions: https://docs.treasuredata.com/
- SQL Explanation Guide: https://www.sqlshack.com/
