# SQL and Data Analyst Skills for Treasure Data

Comprehensive collection of analyst skills for data discovery, profiling, query optimization, and visualization in Treasure Data.

---

## 🔴 MANDATORY ENFORCEMENT - Analytical-Query & Smart-Sampler Skills

**The analytical-query skill MUST be automatically invoked for ALL analytical questions.**
**The smart-sampler skill MUST be automatically invoked for ALL sampling/data preview requests.**

This applies to:
- ✅ ALL users (you, team members, external users)
- ✅ ALL environments (local, cloud, CI/CD)
- ✅ ALL projects using sql-skills
- ✅ ALL future sessions going forward

### Auto-Invocation Triggers

**Analytical Keywords** (invoke analytical-query):
```
show me | find | what's | analyze | report | top N
trends | breakdown | comparison | how many | which
most popular | growth | distribution | performance
aggregation | ranking | summary | metrics | KPI
```

**Sampling Keywords** (invoke smart-sampler):
```
sample | show records | show examples | preview data
show me records | give me examples | find examples
look at data | display records | list records
```

### Mandatory Workflows

**For Analytical Questions (5-Step):**
1. **Parse** → Extract database, table, fields, time range
2. **Generate SQL** → Build TD-optimized query with time filters
3. **Optimize** → AUTOMATICALLY invoke `/sql-skills:trino-optimizer` ⭐ CRITICAL
4. **Execute** → Run via `tdx query --json`
5. **Visualize** → Create markdown table + 2-3 Plotly charts (TD colors)

**For Sampling Requests (3-Step):**
1. **Detect Sampling Intent** → User asks for records/examples
2. **Invoke smart-sampler** → AUTOMATICALLY call `/sql-skills:smart-sampler` ⭐ MANDATORY
3. **Present Results** → Display sample records as markdown table

### Non-Negotiable Requirements

| Requirement | Mandatory | Why |
|---|---|---|
| Invoke trino-optimizer BEFORE execution | ✅ YES | Prevents memory errors, timeouts, costs |
| Include time filters | ✅ YES | Avoids full table scans |
| Use approx_distinct() | ✅ YES | Reduces memory usage |
| Present markdown table | ✅ YES | Shows complete results |
| Generate 2-3 visualizations | ✅ YES | Professional output |
| Use TD color palette | ✅ YES | Brand consistency |
| Descriptive column names | ✅ YES | Clarity |

---

## Quick Start

### Installation

```bash
# Install the complete sql-skills collection
/plugin install sql-skills@td-skills
```

### Setup

```bash
# Configure tdx CLI
tdx auth setup

# Set your working context
tdx use database your_database
tdx use site us01  # or jp01, eu01, ap02
```

### First Query

```
Show me the top 10 customers by revenue from sales_db.orders in the last 30 days
```

Claude will:
1. Generate optimized Trino SQL with time filters
2. Execute via tdx query
3. Display results as a table
4. Create a professional bar chart visualization

---

## Available Skills

### 1. **schema-explorer** - Data Discovery

Intelligently explore databases, tables, and schemas.

**Use when you need to:**
- Discover available databases and tables
- Understand table schemas and columns
- Find tables by keyword
- Explore data structure

**Example prompts:**
- "What databases are available?"
- "Show me all tables in sales_db"
- "Find tables with customer data"
- "What's the schema for orders table?"

[Full Documentation](./schema-explorer/SKILL.md)

---

### 2. **data-profiler** - Data Quality & Distribution Analysis

Automated profiling with beautiful distribution visualizations.

**Use when you need to:**
- Understand data distributions
- Check data quality and completeness
- Identify outliers and anomalies
- Get statistical summaries

**Example prompts:**
- "Profile the orders table from last 30 days"
- "Show me data quality metrics for user_events"
- "What's the distribution of revenue?"
- "Analyze the customer_age column"

**Key Features:**
- Column-level statistics (count, nulls, unique, min/max, mean, median, percentiles)
- Distribution visualizations (histograms, box plots, bar charts)
- Data quality heatmaps
- Professional Plotly charts with TD color palette

[Full Documentation](./data-profiler/SKILL.md)

---

### 3. **smart-sampler** - Intelligent Data Sampling

Multiple sampling strategies for efficient exploration.

**Use when you need to:**
- Preview data without full table scans
- Get representative samples
- Find edge cases (nulls, outliers)
- Sample specific segments

**Example prompts:**
- "Show me 100 sample records from orders"
- "Sample high-value transactions from last month"
- "Give me examples of null email addresses"
- "Sample 50 records per product category"

**Sampling Strategies:**
- Simple random sampling
- Time-based sampling (recent, specific periods)
- Stratified sampling (balanced across segments)
- Edge case sampling (nulls, extremes, duplicates)

[Full Documentation](./smart-sampler/SKILL.md)

---

### 4. **query-explainer** - SQL to Natural Language

Transform SQL into clear explanations.

**Use when you need to:**
- Understand complex queries
- Learn TD SQL patterns
- Debug query logic
- Document queries for teams

**Example prompts:**
- "Explain this query: [SQL]"
- "What does this CTE do?"
- "Break down this query step by step"
- "Simplify this for documentation"

**Explanation Components:**
- High-level summary
- Step-by-step breakdown
- Data flow diagrams
- Performance analysis
- Alternative approaches

[Full Documentation](./query-explainer/SKILL.md)

---

### 5. **trino-optimizer** - Comprehensive Query Optimization

Automatic performance tuning with execution log analysis and engine recommendations.

**Use when you need to:**
- Speed up slow queries
- Reduce query costs
- Fix timeout and memory errors
- Analyze query execution logs
- Get engine migration advice (Trino ↔ Hive)

**Example prompts:**
- "Optimize this query: [SQL]"
- "Why is my query timing out?"
- "Analyze this slow query with execution log"
- "This query took 6 hours - help optimize it"

**Optimization Capabilities:**
- **Log Analysis:** Parse execution stats (time, memory, data scanned)
- **Critical Checks:** Missing time filters (100-1000x impact), correlated subqueries (100x impact)
- **High-Impact Checks:** Exact vs approximate functions (10-50x), inefficient JOINs, SELECT * anti-pattern
- **Advanced Patterns:** CTAS (5x faster), UDP bucketing, magic comments for join distribution
- **Engine Recommendations:** When to migrate Trino→Hive or Hive→Trino
- **Before/After Metrics:** Estimated speedup and cost savings

[Full Documentation](./trino-optimizer/SKILL.md)

---

### 6. **analytical-query** - Natural Language to SQL ⭐ MANDATORY

Convert questions to SQL with visualizations. **Also integrates with smart-sampler for data exploration.**

🔴 **CRITICAL: This skill is MANDATORY for ALL analytical questions AND sampling requests**

**Use when you need to:**
- Generate SQL from natural language
- Execute queries automatically
- Get visual results
- Quick data exploration
- **Preview data records** (auto-invokes smart-sampler)
- **Sample from tables** (auto-invokes smart-sampler)

**Example prompts:**
- "Show me top 10 products by revenue last 30 days" → Analytical-Query
- "Count daily signups for last 14 days, show as trend" → Analytical-Query
- "Compare conversion rates across channels" → Analytical-Query
- "Show me 100 sample records from orders" → Smart-Sampler (auto-invoked)
- "Sample high-value transactions" → Smart-Sampler (auto-invoked)
- "Give me examples of null email addresses" → Smart-Sampler (auto-invoked)

**Features:**
- Natural language understanding
- TD-optimized SQL generation
- Automatic query execution
- Professional Plotly visualizations
- Chart type selection (bar, line, pie, heatmap)
- **Smart-sampler integration for data exploration**

**Mandatory 5-Step Workflow (Analytical):**
1. **Parse** question - Extract database, table, fields, time range
2. **Generate SQL** - Build TD-optimized query with time filters
3. **Optimize** - AUTOMATICALLY invoke trino-optimizer (CRITICAL)
4. **Execute** - Run via tdx query --json
5. **Visualize** - Create table + 2-3 Plotly charts with TD color palette

**Smart-Sampler Auto-Invocation (Sampling):**
1. **Detect sampling keywords** - show records, sample, preview, examples
2. **Auto-invoke smart-sampler** - MANDATORY for all sampling requests
3. **Present sample records** - Display row-level data as markdown table

**Key Requirements (Non-Negotiable):**
- ✅ MUST call trino-optimizer BEFORE execution (analytical queries)
- ✅ MUST include time filters (td_interval/td_time_range)
- ✅ MUST use approx_distinct() for large datasets
- ✅ MUST present markdown table
- ✅ MUST generate 2-3 visualizations (analytical queries)
- ✅ MUST use TD color palette
- ✅ MUST use descriptive column names
- ✅ MUST invoke smart-sampler for sampling requests

[Full Documentation](./analytical-query/SKILL.md)

---

## Core Skills (Foundation)

### trino
TD Trino SQL reference with TD-specific functions (td_interval, td_time_range, td_sessionize).

### hive
TD Hive SQL reference for legacy queries.

### time-filtering
Advanced time filtering patterns and best practices.

### trino-optimizer
Comprehensive Trino query optimization including execution log analysis, automatic performance tuning, and engine migration recommendations. Consolidated from legacy trino-optimizer and query-optimizer skills.

### td-mcp
TD MCP server for Claude Code integration.

---

## Skill Integration: Analytical-Query + Smart-Sampler

### How They Work Together

**Analytical-Query** = Business Intelligence (Metrics & Trends)
- Aggregations (COUNT, SUM, AVG, PERCENTILE)
- Time-series analysis
- Rankings and comparisons
- Professional visualizations

**Smart-Sampler** = Data Exploration (Row-Level Records)
- Random sampling
- Time-based sampling
- Stratified sampling
- Edge case exploration

### Integration Scenarios

#### Scenario 1: Analytical Query → Drill-Down with Sampling

```
User: "Show me top 10 products by revenue AND sample some recent orders"

1. Analytical-Query generates:
   - Top 10 products with revenue metrics
   - Bar chart visualization

2. Smart-Sampler auto-invoked for:
   - Recent order records
   - Table of sample data

Result: Metrics + samples for complete analysis
```

#### Scenario 2: Sampling → Understanding Metrics

```
User: "Show me 100 sample orders AND analyze their status distribution"

1. Smart-Sampler provides:
   - 100 recent order records
   - Preview of actual data

2. Analytical-Query auto-invoked for:
   - Status distribution metrics
   - Pie chart of status breakdown

Result: Data preview + distribution analysis
```

#### Scenario 3: Pure Sampling (No Aggregation)

```
User: "Show me records with null email addresses"

1. Smart-Sampler processes:
   - Edge case sampling
   - Finds nulls automatically
   - Returns sample records

Result: Table of example records only (no charts)
```

#### Scenario 4: Pure Analytics (No Records)

```
User: "Top 5 customers by total spend last month"

1. Analytical-Query processes:
   - GROUP BY customer
   - SUM of spend
   - ORDER BY DESC
   - Visualize

Result: Metrics table + bar chart (no row samples)
```

### When to Use Each Skill

| Need | Skill | Output |
|------|-------|--------|
| "Show top 10..." | Analytical-Query | Aggregated metrics + chart |
| "Count/Sum by..." | Analytical-Query | Aggregated metrics + chart |
| "Trends over time" | Analytical-Query | Time-series + line chart |
| "Show 100 records" | Smart-Sampler | Row-level data table |
| "Sample by category" | Smart-Sampler | Stratified sample table |
| "Find null values" | Smart-Sampler | Edge case records table |
| "Show AND analyze" | Both (auto-invoke) | Samples + metrics + chart |

---

### Workflow 1: New Dataset Exploration

```
User: "I need to analyze sales data"

1. schema-explorer: "What tables contain sales data?"
   → Finds: sales_db.orders, sales_db.transactions

2. schema-explorer: "Show me the schema for sales_db.orders"
   → Displays columns: order_id, customer_id, amount, time, status

3. data-profiler: "Profile sales_db.orders from last 30 days"
   → Statistics, distributions, quality metrics

4. smart-sampler: "Show me 100 sample orders" (AUTO-INVOKED by analytical-query)
   → Preview actual data

5. analytical-query: "Show top 10 products by revenue last month"
   → SQL generation, execution, visualization

6. analytical-query + smart-sampler: "Top 5 products AND show orders from top product"
   → Metrics table + chart (analytical-query)
   → Sample order records (smart-sampler AUTO-INVOKED)
```

---

### Workflow 2: Quick Analysis with Data Preview

```
User: "Show me daily revenue trends AND sample high-value orders"

1. analytical-query (MANDATORY):
   - Generates: GROUP BY date, SUM(revenue)
   - Optimizes: with trino-optimizer
   - Executes: tdx query
   - Visualizes: line chart

2. smart-sampler (AUTO-INVOKED on "sample" keyword):
   - Generates: sampling query for high-value orders
   - Executes: fetch sample records
   - Presents: table format

Result: Revenue trend chart + sample order records
```

---

### Workflow 3: Query Optimization

```
User: "This query is slow: SELECT * FROM orders GROUP BY customer_id"

1. query-explainer: "Explain this query"
   → Understanding what it does
   → Auto-detects performance issues

2. trino-optimizer: "Optimize this query"
   → Identifies issues:
      - Missing time filter (100x impact)
      - SELECT * (2x impact)
      - Needs column selection

3. Provides optimized version:
   SELECT customer_id, COUNT(*) as order_count
   FROM orders
   WHERE td_interval(time, '-30d', 'JST')
   GROUP BY customer_id

   → 100x faster, 99% cost reduction
```

---

### Workflow 3: Data Quality Check (with Sampling)

```
User: "Check data quality for customer table AND show null email examples"

1. schema-explorer: "Show me the schema for customers"
   → Understand structure

2. data-profiler: "Profile customers table"
   → Quality metrics, null analysis, distributions

3. smart-sampler (AUTO-INVOKED): "Show examples of records with null emails"
   → Edge case investigation
   → Sample records with null values

4. analytical-query: "Count customers by signup date last 90 days"
   → Volume analysis with visualization
```

---

## Visualization Standards

All skills use TD's professional color palette and Plotly best practices:

**Primary Colors:**
- Teal: `#44BAB8`
- Navy: `#2E41A6`
- Light Teal: `#8FD6D4`

**Chart Types:**
- **Bar charts** - Rankings, comparisons
- **Line charts** - Trends over time
- **Pie charts** - Distributions, breakdowns
- **Heatmaps** - Multi-dimensional data
- **Box plots** - Outlier detection

**Standards:**
- Clear titles and axis labels
- Numbers displayed on bars
- Legends visible for multi-series
- White backgrounds
- Professional formatting

See [field-agent-skills/visualization](../field-agent-skills/visualization/SKILL.md) for complete guidelines.

---

## TD-Specific Best Practices

### 1. Always Use Time Filters

**❌ Bad:**
```sql
SELECT * FROM orders GROUP BY customer_id
```

**✅ Good:**
```sql
SELECT * FROM orders
WHERE td_interval(time, '-30d', 'JST')
GROUP BY customer_id
```

**Impact:** 100-1000x faster

---

### 2. Use Approximate Functions for Large Datasets

**❌ Slow:**
```sql
SELECT COUNT(DISTINCT customer_id) FROM orders
```

**✅ Fast:**
```sql
SELECT approx_distinct(customer_id) FROM orders
WHERE td_interval(time, '-90d', 'JST')
```

**Impact:** 10-50x faster, ~2% error

---

### 3. Format Dates for Display Only

**❌ Bad:**
```sql
WHERE td_time_string(time, 'd!', 'JST') = '2024-12-15'
```

**✅ Good:**
```sql
SELECT td_time_string(time, 'd!', 'JST') as date
WHERE td_time_range(time, '2024-12-15', '2024-12-16', 'JST')
```

---

### 4. Table Format

Always use `database_name.table_name`:

```sql
SELECT * FROM sales_db.orders
WHERE td_interval(time, '-1d', 'JST')
```

---

## Testing in tdx Studio

Comprehensive testing guide: [ANALYST_SKILLS_TESTING_GUIDE.md](./ANALYST_SKILLS_TESTING_GUIDE.md)

**Quick Test:**

1. **Discovery:**
   ```
   What tables are in my database?
   ```

2. **Profiling:**
   ```
   Profile the [table_name] table from last 7 days
   ```

3. **Analysis:**
   ```
   Show me the top 10 [categories] by [metric] from [table] last month
   ```

4. **Optimization:**
   ```
   Optimize this query: [paste your slow query]
   ```

---

## Performance Tips

1. **Default to recent data** - Last 30-90 days
2. **Start with small time ranges** - Expand if needed
3. **Use LIMIT for exploration** - Add to initial queries
4. **Leverage approximate functions** - For counts > 10K
5. **Monitor query costs** - Check execution statistics
6. **Cache expensive results** - Reuse common aggregations

---

## Troubleshooting

### Queries Timing Out

**Solutions:**
1. Add/reduce time filter range
2. Use approximate functions
3. Add LIMIT clause
4. Run trino-optimizer

### No Results Returned

**Checks:**
1. Verify timezone (JST vs UTC)
2. Check time range validity
3. Confirm table/column names
4. Use schema-explorer to verify

### Visualizations Not Rendering

**Fixes:**
1. Check JSON structure (not stringified)
2. Verify TD color codes
3. Ensure proper data arrays
4. Validate required properties

---

## Resources

### Documentation
- Trino SQL: https://trino.io/docs/current/
- TD Functions: https://docs.treasuredata.com/
- tdx CLI: https://tdx.treasuredata.com/

### Related Skills
- **workflow-skills** - Digdag workflow automation
- **tdx-skills** - tdx CLI operations
- **field-agent-skills** - Advanced visualization patterns
- **semantic-layer** - Data governance and cataloging

---

## Skill Maturity

| Skill | Status | Use Case |
|-------|--------|----------|
| schema-explorer | ✅ Ready | Production |
| data-profiler | ✅ Ready | Production |
| smart-sampler | ✅ Ready | Production |
| query-explainer | ✅ Ready | Production |
| trino-optimizer | ✅ Ready | Production |
| analytical-query | ✅ Ready | Production |

**Total:** 11 skills (6 analyst skills + 5 core skills)

**Note:** `query-optimizer` was merged into `trino-optimizer` for comprehensive optimization coverage.

---

## Contributing

Have ideas for new analyst skills or improvements?

1. Review [ANALYST_SKILLS_BLUEPRINT.md](./ANALYST_SKILLS_BLUEPRINT.md)
2. Follow skill authoring guidelines in [CLAUDE.md](../CLAUDE.md)
3. Test thoroughly with [ANALYST_SKILLS_TESTING_GUIDE.md](./ANALYST_SKILLS_TESTING_GUIDE.md)
4. Submit pull request

**Potential future skills:**
- cohort-analyzer
- funnel-analyzer
- segmentation-builder
- attribution-modeler
- trend-detector
- insight-generator

---

## Support

For questions or issues:

1. Check skill documentation (SKILL.md files)
2. Review testing guide
3. Consult TD documentation
4. Report issues via GitHub

---

**Version:** 1.1.0
**Last Updated:** 2026-02-20
**Maintainer:** Treasure Data Team

**Changelog:**
- 2026-02-20: Added smart-sampler integration to analytical-query - NOW MANDATORY for sampling requests (show records, sample, preview, examples keywords). Updated workflows and documentation.
- 2026-02-20: Fixed analytical-query SKILL.md syntax issues - removed duplicate step, corrected numbering in EXAMPLE 2 workflow
- 2026-02-20: Added mandatory enforcement rules for analytical-query skill - ALWAYS invoked for all analytical questions with 5-step mandatory workflow
- 2026-02-18: Consolidated query-optimizer into trino-optimizer for comprehensive optimization
- 2024-12-15: Initial release with 12 skills
