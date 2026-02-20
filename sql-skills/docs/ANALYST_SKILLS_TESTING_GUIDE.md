# Analyst Skills Testing Guide for tdx Studio

This guide provides comprehensive test cases for validating the analyst skills collection in tdx studio.

## Prerequisites

### 1. Install Skills

```bash
# Add marketplace (if not already added)
/plugin marketplace add https://github.com/treasure-data/td-skills

# Install sql-skills plugin with all analyst skills
/plugin install sql-skills@td-skills
```

### 2. Setup Environment

```bash
# Ensure tdx is installed and authenticated
tdx auth setup

# Set database context (replace with your database)
tdx use database your_database_name
tdx use site us01  # or jp01, eu01, ap02

# Verify authentication and context
tdx status
```

### 3. Test Data Requirements

You'll need access to tables with:
- A `time` column (Unix timestamp)
- At least 30 days of data
- Numeric columns (amounts, counts)
- Categorical columns (status, category)
- Customer/user identifiers

**Recommended test tables:**
- Orders/transactions table
- Events/activity table
- Customers/users table

---

## Test Suite

### Test 1: schema-explorer

#### Test 1.1: List Databases

**Prompt:**
```
What databases are available?
```

**Expected behavior:**
- Lists all accessible databases
- Shows database names clearly
- Organizes results in table format

**Validation:**
- ✅ Returns database list
- ✅ Includes your test database
- ✅ Formatted as markdown table

---

#### Test 1.2: List Tables

**Prompt:**
```
Show me all tables in [your_database_name]
```

**Expected behavior:**
- Lists tables in specified database
- Shows table names
- May include table metadata

**Validation:**
- ✅ Returns table list
- ✅ Tables exist in database
- ✅ Clear presentation

---

#### Test 1.3: Describe Table Schema

**Prompt:**
```
What's the schema for [your_database_name].[your_table_name]?
```

**Expected behavior:**
- Shows column names and types
- Includes sample values if possible
- Formatted as table

**Validation:**
- ✅ Column names displayed
- ✅ Data types shown
- ✅ Organized clearly

---

#### Test 1.4: Find Tables by Keyword

**Prompt:**
```
Find all tables with "customer" in the name
```

**Expected behavior:**
- Searches across databases
- Returns matching tables
- Groups results logically

**Validation:**
- ✅ Finds relevant tables
- ✅ No false positives
- ✅ Clear categorization

---

### Test 2: data-profiler

#### Test 2.1: Full Table Profile

**Prompt:**
```
Profile the [database.table] table from last 30 days
```

**Expected behavior:**
- Generates comprehensive statistics
- Creates distribution visualizations
- Shows data quality metrics
- Includes overview summary

**Validation:**
- ✅ Statistics table with metrics (count, nulls, unique, min/max, mean, median)
- ✅ Distribution charts (histogram for numeric, bar/pie for categorical)
- ✅ Charts use TD color palette (#44BAB8, etc.)
- ✅ Charts have proper labels and titles
- ✅ Time range mentioned in output
- ✅ Data quality summary provided

**Expected charts:**
- Histogram for numeric columns (amount, quantity)
- Bar chart for categorical columns (status, category)
- Line chart for time-based volume

---

#### Test 2.2: Single Column Analysis

**Prompt:**
```
Analyze the [column_name] column from [database.table]
```

**Expected behavior:**
- Deep dive into one column
- Detailed statistics
- Distribution visualization
- Outlier detection

**Validation:**
- ✅ Column-specific statistics
- ✅ Appropriate chart type (histogram for numeric, bar for categorical)
- ✅ Outliers identified if present
- ✅ Percentiles shown for numeric columns

---

#### Test 2.3: Data Quality Check

**Prompt:**
```
Show me data quality metrics for [database.table]
```

**Expected behavior:**
- Completeness analysis (null percentages)
- Uniqueness metrics
- Validity checks
- Visual heatmap if multiple columns

**Validation:**
- ✅ Null counts and percentages
- ✅ Unique value counts
- ✅ Issues highlighted clearly
- ✅ Quality score if provided
- ✅ Heatmap visualization (if applicable)

---

### Test 3: smart-sampler

#### Test 3.1: Simple Sample

**Prompt:**
```
Show me 100 sample records from [database.table]
```

**Expected behavior:**
- Returns 100 records
- Uses recent data (last 24 hours by default)
- Formatted as table
- Shows sampling metadata

**Validation:**
- ✅ Exactly 100 records (or explains if less available)
- ✅ Includes time filter
- ✅ Markdown table format
- ✅ Sampling method mentioned

---

#### Test 3.2: Stratified Sample

**Prompt:**
```
Sample 50 records per [category_column] from [database.table]
```

**Expected behavior:**
- Balanced sampling across categories
- 50 records per category
- Shows category distribution

**Validation:**
- ✅ Equal samples per category
- ✅ Organized by category
- ✅ Clear presentation

---

#### Test 3.3: Edge Case Sampling

**Prompt:**
```
Show examples of records with null [column_name] from [database.table]
```

**Expected behavior:**
- Finds null values
- Returns sample records
- Shows relevant columns

**Validation:**
- ✅ Returns records with nulls
- ✅ Explains if no nulls found
- ✅ Limited result set (not thousands)

---

#### Test 3.4: High-Value Sample

**Prompt:**
```
Sample 50 high-value transactions from [database.table] last month
```

**Expected behavior:**
- Identifies "high-value" (top 10% or > threshold)
- Filters to last month
- Random sample from high-value records

**Validation:**
- ✅ Values are indeed high
- ✅ Time filtered correctly
- ✅ 50 records returned

---

### Test 4: query-explainer

#### Test 4.1: Simple Query Explanation

**Prompt:**
```
Explain this query:
SELECT status, count(*) as cnt
FROM sales_db.orders
WHERE td_interval(time, '-7d', 'JST')
GROUP BY status
```

**Expected behavior:**
- Plain English summary
- Step-by-step breakdown
- Performance notes

**Validation:**
- ✅ Clear summary sentence
- ✅ Each clause explained
- ✅ Performance assessment
- ✅ Use case mentioned

---

#### Test 4.2: Complex Query with CTE

**Prompt:**
```
Explain this query:
WITH monthly_sales AS (
  SELECT
    td_time_string(time, 'M!', 'JST') as month,
    SUM(amount) as revenue
  FROM sales_db.orders
  WHERE td_interval(time, '-6M', 'JST')
  GROUP BY td_time_string(time, 'M!', 'JST')
)
SELECT
  month,
  revenue,
  revenue - LAG(revenue) OVER (ORDER BY month) as change
FROM monthly_sales
ORDER BY month
```

**Expected behavior:**
- CTE explained separately
- Main query explained
- Window function clarified
- Data flow diagram

**Validation:**
- ✅ CTE purpose explained
- ✅ LAG function described
- ✅ Output format shown
- ✅ Business value mentioned

---

#### Test 4.3: Inefficient Query Analysis

**Prompt:**
```
Explain this query and identify any issues:
SELECT * FROM orders WHERE status = 'completed'
```

**Expected behavior:**
- Explains what it does
- Identifies missing time filter
- Flags SELECT *
- Suggests improvements

**Validation:**
- ✅ Missing time filter identified
- ✅ SELECT * flagged
- ✅ Optimization suggestions provided
- ✅ Fixed version shown

---

### Test 5: query-optimizer

#### Test 5.1: Missing Time Filter

**Prompt:**
```
Optimize this query:
SELECT customer_id, COUNT(*) as order_count
FROM sales_db.orders
GROUP BY customer_id
```

**Expected behavior:**
- Detects missing time filter
- Adds time filter
- Explains impact
- Estimates improvement

**Validation:**
- ✅ Time filter added
- ✅ Impact explained (100x faster)
- ✅ Before/after comparison
- ✅ Commented code

---

#### Test 5.2: Exact vs Approximate Functions

**Prompt:**
```
Optimize this query:
SELECT COUNT(DISTINCT customer_id) as unique_customers
FROM sales_db.orders
WHERE td_interval(time, '-1y', 'JST')
```

**Expected behavior:**
- Suggests approx_distinct()
- Explains trade-off
- Shows optimized version
- Estimates speedup

**Validation:**
- ✅ approx_distinct() recommended
- ✅ Error rate mentioned (~2%)
- ✅ Speedup estimated (10-50x)
- ✅ Appropriate for use case

---

#### Test 5.3: Correlated Subquery

**Prompt:**
```
Optimize this query:
SELECT
  o.order_id,
  (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.order_id) as item_count
FROM orders o
WHERE td_interval(o.time, '-30d', 'JST')
```

**Expected behavior:**
- Identifies correlated subquery
- Converts to JOIN
- Explains improvement
- Shows optimized version

**Validation:**
- ✅ Subquery issue identified
- ✅ JOIN version provided
- ✅ 100-1000x improvement mentioned
- ✅ Clear explanation

---

#### Test 5.4: Multiple Issues

**Prompt:**
```
Optimize this query:
SELECT *
FROM (
  SELECT customer_id, SUM(amount) as total
  FROM sales_db.orders
  GROUP BY customer_id
) t
WHERE total > 1000
```

**Expected behavior:**
- Identifies ALL issues:
  - Missing time filter
  - SELECT *
  - Filter after aggregation
- Provides fully optimized version
- Explains each fix

**Validation:**
- ✅ All issues found
- ✅ Prioritized by impact
- ✅ Optimized query with all fixes
- ✅ Performance estimate

---

### Test 6: analytical-query (Integration)

#### Test 6.1: Natural Language Query

**Prompt:**
```
Show me the top 10 products by revenue from [database.orders] in the last 30 days
```

**Expected behavior:**
- Generates correct SQL
- Executes query
- Shows results table
- Creates bar chart visualization

**Validation:**
- ✅ SQL includes time filter
- ✅ Query executes successfully
- ✅ Results displayed as table
- ✅ Bar chart created
- ✅ Chart uses TD colors
- ✅ Chart has labels and title

---

#### Test 6.2: Trend Analysis

**Prompt:**
```
Count daily signups from [database.users] for the last 14 days, show as a trend
```

**Expected behavior:**
- Generates time-series query
- Executes successfully
- Shows data table
- Creates line chart

**Validation:**
- ✅ Daily grouping correct
- ✅ 14 days of data
- ✅ Line chart generated
- ✅ Trend visible
- ✅ Dates formatted properly

---

## Testing Checklist

### For Each Skill

- [ ] **Skill loads correctly** - No errors on invocation
- [ ] **Follows TD conventions** - Time filters, lowercase SQL
- [ ] **Executes queries** - tdx commands work
- [ ] **Returns results** - Data is displayed
- [ ] **Visualizations render** - Charts appear correctly
- [ ] **Uses TD colors** - #44BAB8 palette
- [ ] **Proper formatting** - Markdown tables, code blocks
- [ ] **Clear explanations** - Easy to understand
- [ ] **Handles errors** - Graceful failure messages

### Visualization Checklist

For any skill that creates charts:

- [ ] **Chart appears** - Plotly JSON renders
- [ ] **Title present** - Descriptive chart title
- [ ] **Axis labels** - Clear x and y labels
- [ ] **TD colors** - Primary #44BAB8, palette colors
- [ ] **Numbers visible** - Bar charts show values
- [ ] **Legends visible** - Multi-series charts have legends
- [ ] **Proper margins** - No cut-off text
- [ ] **Clean background** - White plot/paper background

---

## Common Issues and Solutions

### Issue 1: Skills Not Loading

**Symptoms:**
- Skill not recognized
- "Skill not found" error

**Solutions:**
1. Verify installation: `/plugin list`
2. Reinstall: `/plugin install sql-skills@td-skills`
3. Check marketplace: `/plugin marketplace list`

---

### Issue 2: tdx Commands Failing

**Symptoms:**
- "TDX_API_KEY not found"
- "Database not found"

**Solutions:**
1. Check authentication: `tdx auth`
2. Set context: `tdx use database <name>`
3. Verify site: `tdx databases --site jp01`

---

### Issue 3: No Time Filter Warning

**Symptoms:**
- Queries timeout
- Very slow execution

**Solutions:**
- All queries MUST have time filters
- Default to last 30-90 days
- Use `td_interval(time, '-30d', 'JST')`

---

### Issue 4: Visualizations Not Rendering

**Symptoms:**
- No chart appears
- JSON error

**Solutions:**
1. Check JSON structure (not stringified)
2. Verify data format (arrays, not strings)
3. Check mandatory properties (text, textposition for bars)
4. Validate color codes

---

## Performance Benchmarks

### Expected Query Performance

| Query Type | Data Size | Expected Time |
|------------|-----------|---------------|
| Schema describe | Any | < 2 seconds |
| Simple aggregation (30 days) | 10M rows | < 10 seconds |
| Complex join (30 days) | 10M rows | < 30 seconds |
| Full table profile (30 days) | 10M rows | < 60 seconds |

### If Slower Than Expected

1. Check time filter is present
2. Reduce time range
3. Use approximate functions
4. Run optimizer skill on query

---

## Test Report Template

```markdown
# Analyst Skills Test Report

**Date:** [Date]
**Tester:** [Name]
**Database:** [Database name]
**Site:** [us01/jp01/eu01/ap02]

## Test Summary

| Skill | Tests Passed | Tests Failed | Notes |
|-------|--------------|--------------|-------|
| schema-explorer | 4/4 | 0 | All tests passed |
| data-profiler | 3/3 | 0 | Great visualizations |
| smart-sampler | 4/4 | 0 | Works perfectly |
| query-explainer | 3/3 | 0 | Clear explanations |
| query-optimizer | 4/4 | 0 | Excellent suggestions |
| analytical-query | 2/2 | 0 | End-to-end works |

## Detailed Results

### schema-explorer
[Details of each test]

### data-profiler
[Details of each test]

[...]

## Issues Found

1. [Issue description]
   - Severity: Low/Medium/High
   - Workaround: [If available]

## Recommendations

1. [Recommendation for improvement]
2. [Another recommendation]

## Conclusion

[Overall assessment]
```

---

## Next Steps After Testing

1. **Document any issues** - Create GitHub issues if needed
2. **Share feedback** - Report successes and improvements
3. **Iterate on prompts** - Refine how users interact
4. **Add more examples** - Contribute real-world use cases
5. **Test edge cases** - Try unusual queries or data
6. **Performance tune** - Optimize slow queries
7. **Train users** - Share best practices with team

---

## Support

If you encounter issues:

1. **Check this guide** - Review troubleshooting section
2. **Review skill documentation** - Read SKILL.md files
3. **Check TD docs** - https://docs.treasuredata.com/
4. **Report issues** - GitHub issues or team channel
