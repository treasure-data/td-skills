# Data Analyst Skills - Curated Collection Blueprint

This document outlines a comprehensive collection of skills designed specifically for data analysts working with Treasure Data.

## Vision

Empower data analysts to perform complete analytical workflows through natural language interactions - from data discovery to insight generation and visualization.

---

## Skill Categories

### 1. Data Discovery & Exploration

#### 1.1 **schema-explorer**
**Purpose:** Intelligent database and table schema exploration

**Capabilities:**
- List databases with metadata (table count, size, last update)
- Explore table schemas with data types and descriptions
- Search for tables/columns by keyword
- Suggest relevant tables based on analysis goal
- Show table relationships and foreign keys

**Example prompts:**
- "What tables contain customer data?"
- "Show me the schema for orders table"
- "Find all tables with email addresses"

---

#### 1.2 **data-profiler**
**Purpose:** Automated data quality and distribution analysis

**Capabilities:**
- Column-level statistics (count, nulls, unique values, min/max)
- Data type inference and validation
- Distribution analysis (histograms, percentiles)
- Outlier detection
- Sample data preview with intelligent sampling

**Example prompts:**
- "Profile the user_events table from last 7 days"
- "Show me data quality metrics for orders.customer_id"
- "What's the distribution of revenue in the transactions table?"

---

#### 1.3 **smart-sampler**
**Purpose:** Intelligent data sampling for quick exploration

**Capabilities:**
- Representative sampling strategies
- Time-based sampling (recent, random periods)
- Stratified sampling by key dimensions
- Edge case sampling (nulls, extremes, duplicates)

**Example prompts:**
- "Show me 100 sample records from users table"
- "Sample 50 high-value transactions from last month"
- "Give me examples of records with null email addresses"

---

### 2. Query Intelligence

#### 2.1 **analytical-query** ✅ (Already Built)
**Purpose:** Natural language to SQL with visualization

**Status:** Complete

---

#### 2.2 **query-explainer**
**Purpose:** SQL to natural language explanation and documentation

**Capabilities:**
- Explain complex SQL queries in plain English
- Break down query logic step-by-step
- Identify performance bottlenecks
- Suggest alternative approaches
- Generate query documentation

**Example prompts:**
- "Explain this query: [SQL]"
- "What does this CTE do?"
- "Why is this query slow?"

---

#### 2.3 **query-optimizer**
**Purpose:** Automatic query optimization suggestions

**Capabilities:**
- Detect missing time filters
- Suggest approximate functions for large scans
- Identify inefficient JOINs
- Recommend partition pruning strategies
- Estimate query cost and execution time

**Example prompts:**
- "Optimize this query: [SQL]"
- "Why is my query timing out?"
- "How can I make this faster?"

---

### 3. Analysis Patterns (Specialized Analytics)

#### 3.1 **cohort-analyzer**
**Purpose:** Cohort and retention analysis

**Capabilities:**
- User cohort creation by signup period
- Retention rate calculation
- Cohort comparison
- Lifetime value by cohort
- Churn analysis

**Example prompts:**
- "Calculate monthly retention for users who signed up in Q4 2024"
- "Compare cohort performance for last 6 months"
- "Show me retention curve for December cohort"

---

#### 3.2 **funnel-analyzer**
**Purpose:** Conversion funnel analysis

**Capabilities:**
- Multi-step funnel creation
- Drop-off rate calculation
- Time-to-conversion analysis
- Segment-specific funnels
- A/B test funnel comparison

**Example prompts:**
- "Build a signup funnel: visit → signup → verification → first purchase"
- "Where are users dropping off in the checkout flow?"
- "Compare funnel conversion between mobile and web"

---

#### 3.3 **attribution-modeler**
**Purpose:** Marketing attribution analysis

**Capabilities:**
- Multi-touch attribution models (first-touch, last-touch, linear, time-decay)
- Channel contribution analysis
- Customer journey mapping
- ROI calculation by channel
- Cross-channel impact

**Example prompts:**
- "Calculate last-touch attribution for conversions last month"
- "Show me the customer journey for high-value customers"
- "Compare attribution models for our marketing campaigns"

---

#### 3.4 **segmentation-builder**
**Purpose:** Automatic customer segmentation

**Capabilities:**
- RFM (Recency, Frequency, Monetary) segmentation
- Behavioral clustering
- Segment profiling
- Segment comparison
- Dynamic segment creation

**Example prompts:**
- "Segment customers using RFM analysis"
- "Find distinct user behavior patterns in events data"
- "Create segments based on purchase frequency and value"

---

#### 3.5 **trend-detector**
**Purpose:** Automated trend and anomaly detection

**Capabilities:**
- Time-series trend identification
- Seasonal pattern detection
- Anomaly detection
- Forecast generation
- Change point detection

**Example prompts:**
- "Detect trends in daily revenue for last 90 days"
- "Are there any anomalies in user signups this week?"
- "Forecast next month's revenue based on historical data"

---

### 4. Visualization & Insights

#### 4.1 **chart-recommender**
**Purpose:** Intelligent chart type recommendation

**Capabilities:**
- Analyze data characteristics
- Suggest appropriate chart types
- Generate multiple visualization options
- Provide visualization best practices
- Auto-generate dashboard layouts

**Example prompts:**
- "What's the best way to visualize revenue by product category?"
- "How should I show user engagement trends?"
- "Create a dashboard for daily KPIs"

---

#### 4.2 **insight-generator**
**Purpose:** Automated insight extraction from data

**Capabilities:**
- Statistical significance testing
- Key driver identification
- Correlation discovery
- Narrative generation from data
- Executive summary creation

**Example prompts:**
- "What insights can you find in the sales data?"
- "Summarize key findings from user behavior analysis"
- "What's driving the increase in churn rate?"

---

#### 4.3 **kpi-tracker**
**Purpose:** KPI definition, tracking, and alerting

**Capabilities:**
- KPI definition and calculation
- Historical KPI tracking
- Target vs actual comparison
- Automated alerts for KPI changes
- KPI hierarchy and relationships

**Example prompts:**
- "Track daily active users as a KPI"
- "Calculate Customer Acquisition Cost for last quarter"
- "Alert me when conversion rate drops below 5%"

---

### 5. Data Quality & Validation

#### 5.1 **data-validator**
**Purpose:** Comprehensive data quality checks

**Capabilities:**
- Schema validation
- Data type consistency checks
- Referential integrity validation
- Business rule validation
- Data freshness monitoring

**Example prompts:**
- "Validate data quality for orders table"
- "Check if all customer_ids in orders exist in customers table"
- "Is the data current? When was it last updated?"

---

#### 5.2 **anomaly-detector**
**Purpose:** Detect data anomalies and quality issues

**Capabilities:**
- Statistical outlier detection
- Duplicate detection
- Missing data pattern analysis
- Unexpected value flagging
- Time-series anomaly detection

**Example prompts:**
- "Find anomalies in transaction amounts"
- "Detect duplicate records in user table"
- "Are there unusual patterns in daily metrics?"

---

### 6. Collaboration & Documentation

#### 6.1 **query-library**
**Purpose:** Reusable query templates and patterns

**Capabilities:**
- Save and name queries
- Parameterized query templates
- Query versioning
- Share queries with team
- Query collections by use case

**Example prompts:**
- "Save this query as 'Monthly Revenue Report'"
- "Show me saved queries for customer analysis"
- "Create a template for cohort analysis"

---

#### 6.2 **analysis-documenter**
**Purpose:** Automated analysis documentation

**Capabilities:**
- Generate markdown reports
- Include queries, results, and charts
- Add narrative explanations
- Export to various formats
- Version control for analyses

**Example prompts:**
- "Document this analysis with charts and findings"
- "Create a report for weekly metrics review"
- "Export analysis to markdown"

---

## Skill Priority Matrix

### Phase 1: Foundation (Immediate)
1. **schema-explorer** - Critical for discovery
2. **data-profiler** - Essential for understanding data
3. **analytical-query** - ✅ Already built
4. **query-explainer** - Helps analysts learn

### Phase 2: Analysis Patterns (Next)
5. **cohort-analyzer** - High-value analysis
6. **funnel-analyzer** - Common use case
7. **segmentation-builder** - Customer insights
8. **trend-detector** - Proactive insights

### Phase 3: Intelligence & Automation (Future)
9. **query-optimizer** - Performance improvements
10. **insight-generator** - Automated intelligence
11. **kpi-tracker** - Operational monitoring
12. **chart-recommender** - Better visualizations

### Phase 4: Quality & Collaboration (Later)
13. **data-validator** - Data governance
14. **anomaly-detector** - Quality assurance
15. **query-library** - Knowledge sharing
16. **analysis-documenter** - Team collaboration

---

## Skill Interaction Model

### Common Workflows

**Workflow 1: New Dataset Exploration**
```
schema-explorer → data-profiler → smart-sampler → analytical-query → chart-recommender
```

**Workflow 2: Customer Analysis**
```
schema-explorer → segmentation-builder → cohort-analyzer → insight-generator → analysis-documenter
```

**Workflow 3: Performance Investigation**
```
kpi-tracker (alert) → trend-detector → anomaly-detector → analytical-query → insight-generator
```

**Workflow 4: Campaign Analysis**
```
funnel-analyzer → attribution-modeler → analytical-query → chart-recommender → analysis-documenter
```

---

## Technical Architecture

### Common Components

All analyst skills share:
- **TD time filter enforcement** (via trino skill)
- **Plotly visualization standards** (via field-agent-visualization)
- **tdx CLI integration** (via tdx-basic)
- **Query execution engine**
- **Result formatting and presentation**

### Skill Composition

Skills can invoke each other:
- `analytical-query` can call `chart-recommender`
- `cohort-analyzer` can use `analytical-query` for execution
- `insight-generator` can call `trend-detector`

---

## Next Steps

1. **Review and Prioritize:** Which skills provide the most value?
2. **Define Scope:** Start with Phase 1 skills or focus on specific use cases?
3. **Build Incrementally:** Create one skill at a time, test, iterate
4. **Gather Feedback:** Real analyst workflows drive requirements

---

## Questions for Consideration

1. Should we create **general-purpose skills** or **domain-specific** ones (e.g., marketing-analytics, product-analytics)?
2. Do we need **interactive workflows** where the skill asks follow-up questions?
3. Should skills support **batch operations** (e.g., profile all tables in a database)?
4. How do we handle **large result sets** (pagination, sampling)?
5. Should we include **ML-based features** (clustering, forecasting)?

