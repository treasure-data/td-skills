---
name: analytical-query
description: |
  🤖 AUTONOMOUS DATA ANALYSIS - Auto-invokes on analytical keywords. Intelligently converts natural language questions into TD-optimized Trino SQL queries with automatic schema discovery, query optimization, execution, and professional Plotly visualization.

  **Auto-invokes on:** summarize, aggregate, analyze, profile, top N, ranking, distribution, trend, group by, count, sum, average, compare, breakdown, growth, rate, metrics, KPI, dashboard query, analytics question, reporting query, sample, preview data, show records, show examples.

  **Smart features:**
  - 🔍 Auto-invokes schema-explorer when table names not provided
  - ⚡ Auto-optimizes queries with trino-optimizer before execution
  - 📊 Renders professional Plotly visualizations
  - 🎯 Handles complex aggregations, time-series, and comparisons
  - 🔐 No table names? Discovers them automatically!
  - 📋 **NEW:** Auto-invokes smart-sampler for data sampling requests!

triggers:
  - summarize
  - aggregate
  - analyze
  - analyze the data
  - profile
  - top products
  - top customers
  - ranking
  - distribution
  - trend
  - group by
  - count
  - sum
  - average
  - compare
  - breakdown
  - growth
  - rate
  - metrics
  - kpi
  - dashboard
  - analytics
  - reporting
  - what are
  - how many
  - how much
  - show me the
  - give me the
  - list the
  - find the
  - get me
  - sample
  - show records
  - show me records
  - show examples
  - show me examples
  - preview data
---

# SQL Analytical Query

Converts natural language questions into Trino SQL queries, executes them via `tdx query`, and generates professional Plotly visualizations following TD standards.

---

## 🔴 MANDATORY ENFORCEMENT - ALL ANALYTICAL QUESTIONS

**This skill MUST be automatically invoked for ANY analytical question asked in the sql-skills marketplace.**

**This skill ALSO auto-invokes smart-sampler for data sampling requests.**

### Universal Auto-Invocation Rules

**For Analytical Questions:**
This rule applies to:
- ✅ **ALL users** (you, team members, external users)
- ✅ **ALL environments** (local, cloud, CI/CD)
- ✅ **ALL projects** using sql-skills
- ✅ **ALL questions** asking for analysis, aggregation, trends, rankings, comparisons

**For Sampling Requests:**
When users ask for data samples, records, or examples:
- ✅ **MUST invoke `/sql-skills:smart-sampler`** - Mandatory for all sampling requests
- ✅ **MUST NOT skip** - Sampling is a primary use case for this skill integration

### Trigger Keywords (ALWAYS Auto-Invoke)

**Analytical Keywords:**
ANY question containing these keywords or asking for analytical operations should IMMEDIATELY invoke this skill:

```
show me    find    what's    analyze    report    top N
trends     breakdown    comparison    how many    which
most popular    growth    distribution    performance
aggregation    ranking    summary    metrics    KPI
```

**Sampling Keywords (Auto-invoke smart-sampler):**
ANY question containing these keywords should AUTOMATICALLY invoke `/sql-skills:smart-sampler`:

```
sample    show records    show examples    preview data    show me records
give me examples    find examples    show me examples    look at data
display records    list records    find records    show sample
```

### 5-Step Mandatory Workflow (Never Skip Any Step)

**For Analytical Queries:**
1. **Parse** - Extract database, table, fields, time range
2. **Generate SQL** - Build TD-optimized query with time filters
3. **Optimize** - AUTOMATICALLY call `/sql-skills:trino-optimizer` ← CRITICAL
4. **Execute** - Run via `tdx query --json`
5. **Visualize** - Render markdown table + 2-3 Plotly charts

**For Sampling Requests:**
1. **Detect Sampling Intent** - User asks for records, examples, or data preview
2. **Invoke smart-sampler** - AUTOMATICALLY call `/sql-skills:smart-sampler` ← MANDATORY
3. **Present Results** - Display sample records as markdown table
4. *Optional: If user also wants analysis* → Continue with steps 2-5 above

### Non-Negotiable Requirements

| Requirement | Status |
|---|---|
| Invoke trino-optimizer before execution | ✅ MANDATORY |
| Include time filters (td_interval/td_time_range) | ✅ MANDATORY |
| Use approx_distinct() for large datasets | ✅ MANDATORY |
| Present results as markdown table | ✅ MANDATORY |
| Generate 2-3 visualizations | ✅ MANDATORY |
| Use TD color palette (#44BAB8, #8FD6D4, #2E41A6) | ✅ MANDATORY |
| Include descriptive column aliases | ✅ MANDATORY |

---



## When to Use This Skill

### ✅ AUTO-INVOKED When Users Ask:

**Without specifying tables (Auto Schema Discovery):**
- "Show me the top 10 selling products last month" → 🔍 Auto-discovers product/sales tables
- "Analyze user activity trends by day" → 🔍 Auto-discovers user/event tables
- "What's the revenue breakdown by region?" → 🔍 Auto-discovers revenue/geography tables
- "Count daily signups" → 🔍 Auto-discovers user/signup tables

**With specific tables (Direct Analysis):**
- "Show me the top 10 products by revenue from sales_db.orders in the last 30 days"
- "Count users by signup date from user_db.users for last week, grouped by day"
- "Compare conversion rates across channels from marketing_db.events"
- "Analyze daily revenue trend from ecommerce_db.sales for Q1 2024"

### 🤖 Smart Workflow:

1. **Parse user question** - Detect analytical intent
2. **Check for table references** - If none provided, invoke schema-explorer
3. **Discover schema** - Schema-explorer finds relevant tables/columns
4. **Generate SQL** - Build optimized Trino query
5. **Optimize** - Auto-invoke trino-optimizer for best performance
6. **Execute** - Run via `tdx query --json`
7. **Visualize** - Render professional Plotly chart + table

## Workflow

### Enhanced Multi-Step Process with Auto Schema Discovery

1. **Parse question** - Extract intent, keywords, any provided table names
2. **Check schema context** - Are table/database names provided?
   - ✅ **YES** → Skip to Step 3 (Generate SQL)
   - ❌ **NO** → Proceed to Step 2a (Auto-discover)
3. **[IF NEEDED] Auto-discover schema** - Invoke `/sql-skills:schema-explorer`
   - Search for relevant tables based on question keywords
   - Identify dimension/fact tables
   - Extract available columns and data types
4. **Generate SQL** - Build TD-optimized Trino query with discovered tables
5. **Optimize query** - **AUTOMATICALLY invoke `/sql-skills:trino-optimizer`**
6. **Execute query** - Run via `tdx query --json`
7. **Render results** - Display table + Plotly visualization

### 🔴 CRITICAL: Auto-Optimization & Schema Discovery

**ALWAYS:**
- ✅ Invoke `/sql-skills:schema-explorer` if tables not specified
- ✅ Invoke `/sql-skills:trino-optimizer` on all generated queries BEFORE execution
- ✅ Include time filters (`td_interval` or `td_time_range`)
- ✅ Use approximate functions for large datasets
- ✅ Follow TD naming conventions (JST timezone, lowercase functions)

## Query Generation

### 🔍 AUTO SCHEMA DISCOVERY (New Feature)

When user doesn't specify table names:

**Example Scenario 1: User asks without table names**
```
User: "Show me the top 10 products by revenue in the last month"
↓
1. Parse: "top 10", "products", "revenue", "last month"
2. Invoke schema-explorer: Search for tables with keywords "product", "revenue", "sales"
3. Schema-explorer returns: sales_db.orders, sales_db.products
4. Identify columns: product_id, product_name, revenue, time
5. Generate optimized query
6. Execute and visualize
```

**Example Scenario 2: User specifies tables**
```
User: "Show me the top 10 products by revenue from sales_db.orders in the last month"
↓
1. Parse: Table explicitly provided → sales_db.orders
2. Skip schema-explorer
3. Generate query directly
4. Execute and visualize
```

### Schema-Explorer Keywords Mapping

| User Question Keywords | Schema Search | Expected Tables |
|------------------------|--------------|-----------------|
| "product", "revenue", "sales" | revenue tables | orders, sales, transactions |
| "user", "customer", "signup" | user tables | users, customers, accounts |
| "event", "activity", "action" | event tables | events, user_events, tracking |
| "trend", "growth", "metric" | time-series tables | daily_stats, metrics, analytics |
| "region", "country", "location" | geographic tables | locations, geo, addresses |

### Time Filters (ALWAYS Required)

```sql
-- Good: Includes time filter
select product_id, sum(amount) as revenue
from sales_db.orders
where td_interval(time, '-30d', 'JST')
group by product_id
order by revenue desc
limit 10

-- Bad: Missing time filter (full table scan!)
select product_id, sum(amount)
from sales_db.orders
group by product_id
```

### Common Patterns

**Aggregation:**
```sql
select
  td_time_string(time, 'd!', 'JST') as date,
  count(*) as count,
  approx_distinct(user_id) as unique_users
from events_db.user_events
where td_interval(time, '-7d', 'JST')
group by td_time_string(time, 'd!', 'JST')
order by date
```

**Top N:**
```sql
select category, sum(revenue) as total
from product_db.sales
where td_interval(time, '-1M', 'JST')
group by category
order by total desc
limit 10
```

**Comparison:**
```sql
select
  channel,
  count(*) as events,
  approx_distinct(user_id) as users,
  cast(count(*) as double) / approx_distinct(user_id) as events_per_user
from marketing_db.campaigns
where td_interval(time, '-1d', 'JST')
group by channel
```

## Query Execution

```bash
# Execute and get JSON output
tdx query --json "SELECT ..." > results.json

# Or with inline query
tdx query --json "select count(*) from db.table where td_interval(time, '-1d')"
```

## Visualization Guidelines

### Chart Selection Matrix

| Question Type | Chart Type | Example |
|--------------|------------|---------|
| Distribution/Breakdown | Pie chart | "Revenue by category" |
| Trend over time | Line chart | "Daily signups last month" |
| Top N ranking | Bar chart | "Top 10 products" |
| Comparison across groups | Grouped bar | "Metrics by channel" |
| Correlation/matrix | Heatmap | "Performance by day/hour" |

### Plotly Chart Structure

All charts must follow TD visualization standards:

**Bar Chart (Single Series):**
```json
{
  "data": [{
    "type": "bar",
    "x": ["Product A", "Product B", "Product C"],
    "y": [1250, 980, 750],
    "marker": {"color": "#44BAB8"},
    "text": [1250, 980, 750],
    "textposition": "outside",
    "textfont": {"size": 11, "color": "black"}
  }],
  "layout": {
    "title": {"text": "Top Products by Revenue", "x": 0.5, "font": {"size": 18, "color": "#2E41A6"}},
    "height": 500,
    "showlegend": false,
    "xaxis": {"title": {"text": "Products", "font": {"size": 14}}},
    "yaxis": {"title": {"text": "Revenue ($)", "font": {"size": 14}}},
    "margin": {"t": 80, "b": 80, "l": 80, "r": 80},
    "font": {"family": "Arial", "size": 12},
    "plot_bgcolor": "white",
    "paper_bgcolor": "white"
  }
}
```

**Line Chart (Trend):**
```json
{
  "data": [{
    "type": "scatter",
    "mode": "lines+markers",
    "x": ["2024-01-15", "2024-01-16", "2024-01-17"],
    "y": [450, 520, 480],
    "line": {"color": "#44BAB8", "width": 3},
    "marker": {"color": "#44BAB8", "size": 8}
  }],
  "layout": {
    "title": {"text": "Daily User Signups", "x": 0.5, "font": {"size": 18, "color": "#2E41A6"}},
    "height": 500,
    "showlegend": false,
    "xaxis": {"title": {"text": "Date", "font": {"size": 14}}},
    "yaxis": {"title": {"text": "Signups", "font": {"size": 14}}},
    "margin": {"t": 80, "b": 80, "l": 80, "r": 80},
    "font": {"family": "Arial", "size": 12},
    "plot_bgcolor": "white",
    "paper_bgcolor": "white"
  }
}
```

**Pie Chart (Distribution):**
```json
{
  "data": [{
    "type": "pie",
    "values": [45, 30, 25],
    "labels": ["Category A", "Category B", "Category C"],
    "marker": {"colors": ["#44BAB8", "#8FD6D4", "#DAF1F1"]},
    "textinfo": "label+percent",
    "textposition": "auto",
    "textfont": {"size": 14, "color": "black"}
  }],
  "layout": {
    "title": {"text": "Revenue Distribution", "x": 0.5, "font": {"size": 18, "color": "#2E41A6"}},
    "height": 500,
    "showlegend": true,
    "legend": {
      "orientation": "v",
      "yanchor": "middle",
      "y": 0.5,
      "xanchor": "left",
      "x": 1.02
    },
    "margin": {"t": 80, "b": 80, "l": 80, "r": 150},
    "paper_bgcolor": "white"
  }
}
```

### TD Color Palette (MANDATORY)

```python
TD_COLORS = [
    '#44BAB8',  # Teal (Primary)
    '#8FD6D4',  # Light Teal
    '#DAF1F1',  # Pale Teal
    '#2E41A6',  # Navy Blue
    '#828DCA',  # Purple
    '#8CC97E',  # Green
    '#EEB53A',  # Yellow
    '#5FCFD8',  # Cyan
]
```

## Complete Example Workflows

### EXAMPLE 1: Auto Schema Discovery (No Tables Specified)

**User Question:** "Show me top 10 products by revenue last month"

**Step 1: Parse & Detect Missing Schema**
- Missing database/table context detected
- Analytical intent: "top 10", "products", "revenue"
- Need for schema discovery: YES

**Step 2: Auto-Invoke Schema-Explorer**
```
Invoke: /sql-skills:schema-explorer
Query: Search tables with keywords "product", "revenue", "sales"
Result: Finds sales_db.orders, sales_db.products tables
```

**Step 3: Generate SQL** (using discovered schema)
```sql
select
  p.product_name,
  sum(o.revenue) as total_revenue,
  count(o.order_id) as order_count
from sales_db.orders o
join sales_db.products p on o.product_id = p.product_id
where td_interval(o.time, '-1M', 'JST')
group by p.product_name
order by total_revenue desc
limit 10
```

**Step 4: Auto-Optimize Query**
```
Invoke: /sql-skills:trino-optimizer
Review: Time filters ✓, Approximate functions needed?, JOINs efficient?
Optimized: Add approx_distinct for unique customers
```

**Step 5: Execute**
```bash
tdx query --json "SELECT p.product_name, sum(o.revenue) as total_revenue, count(o.order_id) as order_count FROM sales_db.orders o JOIN sales_db.products p ON o.product_id = p.product_id WHERE td_interval(o.time, '-1M', 'JST') GROUP BY p.product_name ORDER BY total_revenue DESC LIMIT 10"
```

**Step 6: Render Results & Chart**
- Display markdown table
- Generate bar chart: Products (X-axis) vs Revenue (Y-axis)

---

### EXAMPLE 2: Explicit Table Context (Schema Provided)

**User Question:** "Show me top 5 products by revenue from ecommerce_db.orders in the last 7 days"

**Step 1: Parse - Schema Context Found**
- Database: ecommerce_db
- Table: orders
- Fields: products, revenue
- Time filter: last 7 days
- Skip schema-explorer (explicit context provided)

**Step 2: Generate SQL**
```sql
select
  product_name,
  sum(order_amount) as revenue,
  count(*) as order_count
from ecommerce_db.orders
where td_interval(time, '-7d', 'JST')
group by product_name
order by revenue desc
limit 5
```

**Step 3: Auto-Optimize**
```
Invoke: /sql-skills:trino-optimizer
Checks: Time filter ✓, Aggregations ✓, LIMIT ✓
Status: Query ready for execution
```

**Step 4: Execute Query**
```bash
tdx query --json "select product_name, sum(order_amount) as revenue, count(*) as order_count from ecommerce_db.orders where td_interval(time, '-7d', 'JST') group by product_name order by revenue desc limit 5"
```

**Step 5: Present Results**

Show results as markdown table:

| Product Name | Revenue | Order Count |
|--------------|---------|-------------|
| Product A | $12,500 | 45 |
| Product B | $9,800 | 32 |
| Product C | $7,650 | 28 |

**Step 6: Generate Visualization**

```json
{
  "data": [{
    "type": "bar",
    "x": ["Product A", "Product B", "Product C", "Product D", "Product E"],
    "y": [12500, 9800, 7650, 6200, 5100],
    "marker": {"color": "#44BAB8"},
    "text": ["$12.5K", "$9.8K", "$7.7K", "$6.2K", "$5.1K"],
    "textposition": "outside",
    "textfont": {"size": 11, "color": "black"}
  }],
  "layout": {
    "title": {"text": "Top 5 Products by Revenue (Last 7 Days)", "x": 0.5, "font": {"size": 18, "color": "#2E41A6"}},
    "height": 500,
    "showlegend": false,
    "xaxis": {"title": {"text": "Products", "font": {"size": 14, "color": "#2E41A6"}}},
    "yaxis": {"title": {"text": "Revenue ($)", "font": {"size": 14, "color": "#2E41A6"}}},
    "margin": {"t": 80, "b": 80, "l": 80, "r": 80},
    "font": {"family": "Arial", "size": 12},
    "plot_bgcolor": "white",
    "paper_bgcolor": "white"
  }
}
```

## Best Practices

1. **Always include time filters** - Use `td_interval()` or `td_time_range()` to avoid full scans
2. **Use approx functions** - `approx_distinct()`, `approx_percentile()` for large datasets
3. **JST for Japan data** - Include timezone: `td_interval(time, '-1d', 'JST')`
4. **Format dates for display** - Use `td_time_string(time, 'd!', 'JST')` in SELECT, not WHERE
5. **Show both table and chart** - Always present data in both formats
6. **Use TD colors consistently** - Follow visualization color palette
7. **Include axis labels** - Clear titles and labels for all charts

## Query Validation Checklist

Before execution, verify:

- [ ] Time filter present (`td_interval` or `td_time_range`)
- [ ] Table format: `database_name.table_name`
- [ ] Lowercase SQL keywords and functions
- [ ] No `td_time_string()` in WHERE clause
- [ ] Appropriate aggregation functions
- [ ] LIMIT clause for large result sets

## Common Issues

| Issue | Solution |
|-------|----------|
| Query timeout / memory limit | Add time filter, reduce date range |
| No results returned | Verify timezone (JST vs UTC) |
| Partition not found | Check time range format |
| Slow performance | Use `approx_*` functions, add LIMIT |

## Related Skills

- **trino** - Core Trino SQL and TD functions
- **time-filtering** - Advanced time filtering patterns
- **trino-optimizer** - Query optimization techniques
- **schema-explorer** - 🔍 AUTO-INVOKED for table discovery
- **smart-sampler** - 📋 **AUTO-INVOKED for sampling requests** (Mandatory for all "show records", "sample", "preview" keywords)
- **tdx-basic** - tdx CLI query execution
- **field-agent-visualization** - Advanced Plotly patterns

## Schema-Explorer Integration Guide

### When Auto-Invocation Happens

**The skill automatically invokes schema-explorer when:**

1. User asks analytical question WITHOUT table/database names
2. Keywords suggest data entity type but table is ambiguous
3. Time period specified but table location unclear

**Examples that trigger auto-invoke:**
- ❌ "Show me top 10 products by revenue" (no table)
- ❌ "Analyze user growth trends" (no table)
- ❌ "What's my daily active user count?" (no table)
- ✅ "Show top 10 from sales_db.orders" (table provided - no invoke needed)
- ✅ "Analyze ecommerce_db.sales revenue" (table provided - no invoke needed)

### How Schema-Explorer Works in This Context

**Step 1: Extract Keywords**
```
Question: "Show me top 10 products by revenue last month"
Keywords: ["product", "revenue", "top", "last month"]
```

**Step 2: Search Databases**
```
Schema-Explorer executes: Search for tables containing "product" or "revenue"
Returns matching tables with schemas
```

**Step 3: Intelligent Table Selection**
```
Schema-Explorer identifies:
- sales_db.orders (contains revenue, time)
- product_db.products (contains product names)
- Sales fact table with products ✓
```

**Step 4: Column Discovery**
```
Identified columns:
- product_id, product_name (from products table)
- order_id, revenue, time (from orders table)
Ready for query generation
```

### Schema-Explorer Search Keywords

The skill uses semantic keywords to find tables:

| Question Type | Auto-Search | Finds Tables |
|--------------|------------|--------------|
| Product analysis | product, sales, revenue | sales_db.*, product_db.* |
| User analysis | user, customer, account | user_db.*, customer_db.* |
| Event analysis | event, activity, action, engagement | events_db.*, tracking_db.* |
| Trend analysis | trend, metric, daily, trend | metrics_db.*, analytics_db.* |
| Geographic analysis | region, country, location, geo | geo_db.*, location_db.* |
| Funnel analysis | funnel, conversion, step | funnel_db.*, conversion_db.* |
| Cohort analysis | cohort, segment, group | segment_db.*, cohort_db.* |

### Optimization Tips

**For faster analysis:**
1. Provide table names when you know them → Skip schema-explorer
2. Use specific keywords in questions → Better schema matching
3. Include time period → Helps identify time-series tables
4. Mention data type → "revenue", "count", "duration"

**For exploration:**
1. Vague questions → Let schema-explorer find relevant tables
2. "What tables do we have?" → Use schema-explorer directly
3. "Find tables with PII" → Use schema-explorer discovery

---

## Smart-Sampler Integration Guide

### When Auto-Invocation Happens

**The skill automatically invokes smart-sampler when:**

1. User asks for data records/examples (sampling request)
2. Sampling keywords detected ("show records", "sample", "preview", "show examples")
3. User wants to explore actual row-level data

**Examples that trigger auto-invoke:**
- ✅ "Show me 100 sample records from orders" → smart-sampler invoked
- ✅ "Give me examples of null email addresses" → smart-sampler invoked
- ✅ "Sample high-value transactions last month" → smart-sampler invoked
- ✅ "Show me 50 records per product category" → smart-sampler invoked
- ❌ "Show me top 10 products by revenue" → analytical-query (aggregation, not sampling)
- ❌ "Count customers by status" → analytical-query (metrics, not sampling)

### How Smart-Sampler Works in This Context

**When sampling is detected:**

1. **Parse sampling request** - Extract table, limit, filter criteria
2. **Determine sampling strategy:**
   - Random sampling (default)
   - Time-based (recent data)
   - Stratified (balanced by dimension)
   - Edge case (nulls, extremes)
3. **Generate optimized sampling query** with time filters
4. **Execute via tdx query** - Get actual row data
5. **Present as markdown table** - Show records

### Smart-Sampler Strategies Available

| Strategy | Use Case | Example |
|----------|----------|---------|
| **Random** | Quick data preview | "Show 100 samples" |
| **Time-Based** | Recent data exploration | "Show recent orders" |
| **Stratified** | Balanced representation | "Sample 50 per category" |
| **Edge Case** | Find anomalies | "Show null emails" |
| **Outliers** | Extreme values | "Show top 1% by price" |

### Smart-Sampler Sampling Methods

**Simple Random:**
```sql
select * from table
where td_interval(time, '-7d', 'JST')
order by rand()
limit 100
```

**Stratified (Balanced):**
```sql
with ranked as (
  select *, row_number() over (partition by category order by rand()) as rn
  from table where td_interval(time, '-30d', 'JST')
)
select * from ranked where rn <= 50
```

**Edge Cases (Nulls):**
```sql
select * from table
where td_interval(time, '-30d', 'JST')
and email is null
limit 100
```

**Recent Data:**
```sql
select * from table
where td_interval(time, '-1d', 'JST')
order by time desc
limit 100
```

---

## Combined Analytical-Query + Smart-Sampler Workflow

**Scenario: User wants to analyze AND explore data**

```
User: "Show me top 10 products by revenue AND sample some recent orders"

Step 1: Parse question
   → Detect TWO intents: analysis (top products) + sampling (sample orders)

Step 2: Execute analytical query for top products
   → Generate GROUP BY query
   → Invoke trino-optimizer
   → Execute and visualize

Step 3: Execute smart-sampler for order records
   → Generate sampling query
   → Execute via smart-sampler
   → Present records table

Step 4: Present combined results
   → Metrics table + charts (from analytical-query)
   → Sample records table (from smart-sampler)
```

**Key Difference:**
- **Analytical-Query:** Aggregations (COUNT, SUM, AVG) → Visualizations
- **Smart-Sampler:** Row-level data (SELECT *) → Data exploration

### Integration Best Practices

1. **Analytical → Sampling Flow:**
   - First analyze metrics (analytical-query)
   - Then drill into examples (smart-sampler)
   - Understand patterns + explore details

2. **Sampling → Analytical Flow:**
   - First preview data (smart-sampler)
   - Then analyze patterns (analytical-query)
   - Explore + understand metrics

3. **Combined Requests:**
   - Detect both intents in question
   - Execute both skills
   - Present results side-by-side

## Resources

- Trino SQL: https://trino.io/docs/current/
- TD Time Functions: https://docs.treasuredata.com/
- tdx CLI: https://tdx.treasuredata.com/
- Schema-Explorer: Use `/sql-skills:schema-explorer` for table discovery
