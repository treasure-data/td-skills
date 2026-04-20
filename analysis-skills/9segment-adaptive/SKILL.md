---
name: 9segment-adaptive
description: Adaptive customer lifecycle segmentation that classifies customers into up to 12 segments (9 Active + 3 non-Active) based purely on purchase data. Automatically adapts to industry/purchase cycle with data quality fallback (9→6→4 segments). Pre-analyzes RFM distribution to estimate industry characteristics and recommend optimal thresholds. Supports EC, subscription, appliances, cosmetics, and more.
tags: [td, cdp, segmentation, rfm, customer-lifecycle, sql, treasure-data, presto]
---

# Adaptive Customer Lifecycle Segmentation

A flexible framework that classifies customers into up to 12 segments based purely on purchase data. Automatically adapts thresholds and granularity based on industry, purchase cycle, and data quality.

## Features

### ✓ Pure Purchase Data Based
- No surveys required, works with CDP purchase transactions only
- Ready to run with just customer_id, timestamp, and product columns

### ✓ Industry Adaptive
- Pre-analyzes RFM distribution to auto-estimate industry characteristics
- Supports high-frequency (subscription) to ultra-low-frequency (real estate)
- 8 industry templates included

### ✓ Data Quality Resilient
- Auto-detects product data gaps/quality issues
- Automatically downgrades 9→6→4 segments
- Provides improvement suggestions on fallback

### ✓ Gradual Adoption
- Initial validation: 4 segments (Recency only)
- Growth design: 6 segments (add Frequency)
- Detailed operation: 9 segments (add Cross-purchase)

---

## Classification Axes

| Axis | Measures | Data Source | Used In |
|------|----------|-------------|---------|
| **Recency (R)** | Months since last purchase | Purchase timestamp | All granularities |
| **Frequency (F)** | Annual purchase count | Purchase count | 6/9 segments |
| **Cross** | Number of distinct product types | Product column | 9 segments only |

---

## Workflow

```
┌──────────────────────────────────────────┐
│ Step 0: Situation Assessment (Dialog)    │
│  - Industry/product type                 │
│  - Purchase cycle knowledge              │
│  - Analysis purpose                      │
└──────────────────────────────────────────┘
                  ↓
┌──────────────────────────────────────────┐
│ Step 0.5: Data Availability Check        │
│  - Diagnose customer/time/product quality│
│  - Determine usable granularity          │
│  - Suggest data improvements             │
└──────────────────────────────────────────┘
         ↓                    ↓
    [Data OK]           [Product NG]
         ↓                    ↓
         │              Auto-downgrade (6seg)
         ↓                    ↓
┌──────────────────────────────────────────┐
│ Step 1: RFM Distribution Analysis        │
│  - Calculate percentiles                 │
│  - Estimate industry characteristics     │
│  - Calculate recommended thresholds      │
└──────────────────────────────────────────┘
                  ↓
┌──────────────────────────────────────────┐
│ Step 2: Threshold & Granularity Proposal │
│  - Present recommended settings          │
│  - Simulate expected distribution        │
│  - Provide multiple options              │
└──────────────────────────────────────────┘
                  ↓
┌──────────────────────────────────────────┐
│ Step 3: Parameter Adjustment             │
│  - Interactive threshold fine-tuning     │
│  - Industry template selection           │
│  - Final confirmation                    │
└──────────────────────────────────────────┘
                  ↓
┌──────────────────────────────────────────┐
│ Step 4: Classification SQL Generation    │
│  - Generate parameterized SQL            │
│  - Select logic based on granularity     │
│  - Save to result table                  │
└──────────────────────────────────────────┘
                  ↓
┌──────────────────────────────────────────┐
│ Step 5: Distribution Validation          │
│  - Check segment distribution            │
│  - Auto-detect imbalances/issues         │
│  - Propose re-adjustments                │
└──────────────────────────────────────────┘
         ↓                    ↓
    [Good]              [Needs Adjustment]
         ↓                    ↓
      Done            Back to Step 3
```

---

## Step 0: Situation Assessment (Dialog)

Ask the following when skill is invoked:

### Question 1: Industry/Product Type
```
What is your industry/product type?

Options:
1. Apparel EC
2. Subscription Food (monthly delivery)
3. Appliance Retail
4. Cosmetics Brand EC
5. Books/Goods EC
6. SaaS (usage log based)
7. Luxury Goods (watches/jewelry)
8. Other (analyze from data)

→ Industry selection applies recommended threshold template
→ "Other" triggers Step 1 analysis to estimate thresholds
```

### Question 2: Purchase Cycle Knowledge
```
Do you know the typical purchase frequency of good customers?

A) Yes
   → Please provide annual purchase count estimate: [ ] times
   → Skip Step 1, go to Step 2

B) No
   → Will analyze from data (execute Step 1)
```

### Question 3: Analysis Purpose
```
What is the purpose?

1. First-time customer analysis
   → Recommend 4 segments (simple)

2. Improving existing RFM analysis
   → 6 or 9 segments

3. Detailed growth strategy design
   → 9 segments
```

---

## Step 0.5: Data Availability Check

### Data Source Confirmation

```
Please specify the following columns:

Database.Table: [ ]
Customer ID column: [ ]
Timestamp column: [ ] (Unix seconds or date string)
Product column: [ ] (product_id/category/SKU etc.)

Example:
  ecommerce.orders
  customer_id
  time
  product_category
```

### Availability Check SQL

```sql
-- Auto-executed check SQL
WITH sample_data AS (
  SELECT *
  FROM {source_db}.{source_table}
  WHERE td_interval({time_col}, '-12M')
  LIMIT 1000
)
SELECT
  COUNT(*) AS total_rows,
  COUNT(DISTINCT {customer_col}) AS distinct_customers,
  SUM(CASE WHEN {customer_col} IS NULL THEN 1 ELSE 0 END) * 100.0 / COUNT(*) AS customer_null_pct,
  SUM(CASE WHEN {time_col} IS NULL THEN 1 ELSE 0 END) * 100.0 / COUNT(*) AS time_null_pct,
  COUNT(DISTINCT {product_col}) AS distinct_products,
  SUM(CASE WHEN {product_col} IS NULL THEN 1 ELSE 0 END) * 100.0 / COUNT(*) AS product_null_pct,
  COUNT(DISTINCT {product_col}) * 1.0 / COUNT(*) AS product_uniqueness_ratio
FROM sample_data
```

### Judgment Patterns

| Situation | Judgment | Recommended Granularity | Action |
|-----------|----------|------------------------|--------|
| Customer ID null>10% | ERROR | - | Cannot execute |
| Timestamp null>10% | ERROR | - | Cannot execute |
| Product null>50% | WARNING | 6 segments | Cross axis unavailable |
| Product uniqueness>90% | WARNING | 6 segments | Prompt column re-specification |
| Product types<2 | INFO | 6 segments | Single product type |
| All data OK | OK | 9 segments | Full features |

### Output Example (Product Column Issue)

```
⚠ Data Availability Check Complete

【Available Data】
- Customer ID: customer_id ✓ (null rate 0%)
- Timestamp: time ✓ (null rate 0%)
- Product: product_category △ (null rate 65%)

【Data Quality】
WARNING: High product column null rate, Cross axis unreliable

【Available Analysis】
✓ 6-segment classification (F × R) ← Recommended
✓ 4-segment classification (R only)
✗ 9-segment classification (Cross axis unstable)

【Current Capabilities】
- Customer growth stage classification by purchase frequency (F)
- Win-back prioritization by Recency (R)

【Enabled by Additional Data】
If product category data gaps are improved:
→ 9-segment classification becomes possible, enabling:
  - Cross-category purchase pattern visualization
  - "Single-product fan → Loyal customer" growth path design
  - Category-specific cross-sell priority setting

【Data Improvement Recommendations】
1. Review JOIN processing with product master
2. Design product category hierarchy (major/minor categories)
3. Migrate to 9-segment when null rate drops below 20%

Proceed with 6-segment classification temporarily? (Y/N)
```

---

## Step 1: RFM Distribution Analysis

### Execution Conditions
- User selected "Don't know" for purchase cycle
- Or selected "Other (analyze from data)"

### Analysis SQL

```sql
-- =====================================================
-- RFM Distribution Analysis (for auto threshold proposal)
-- =====================================================

WITH
customer_metrics AS (
  SELECT
    {customer_col} AS customer_id,
    COUNT(*) AS total_purchases,
    COUNT(DISTINCT {product_col}) AS distinct_products,
    date_diff('month', from_unixtime(MAX({time_col})), current_timestamp) AS recency_months,
    date_diff('month', from_unixtime(MIN({time_col})), from_unixtime(MAX({time_col}))) + 1 AS customer_lifespan_months
  FROM {source_db}.{source_table}
  WHERE td_interval({time_col}, '-24M')
  GROUP BY {customer_col}
),

normalized_metrics AS (
  SELECT
    customer_id,
    total_purchases,
    distinct_products,
    recency_months,
    -- Annualized purchase frequency
    CASE 
      WHEN customer_lifespan_months = 0 THEN total_purchases
      ELSE CAST(total_purchases AS DOUBLE) * 12 / customer_lifespan_months
    END AS annual_frequency
  FROM customer_metrics
  WHERE recency_months <= 24
),

frequency_stats AS (
  SELECT
    'Annual_Frequency' AS metric,
    approx_percentile(annual_frequency, 0.10) AS p10,
    approx_percentile(annual_frequency, 0.25) AS p25,
    approx_percentile(annual_frequency, 0.50) AS median,
    approx_percentile(annual_frequency, 0.75) AS p75,
    approx_percentile(annual_frequency, 0.90) AS p90,
    MAX(annual_frequency) AS max_val,
    AVG(annual_frequency) AS mean_val
  FROM normalized_metrics
),

recency_stats AS (
  SELECT
    'Recency_Months' AS metric,
    approx_percentile(recency_months, 0.10) AS p10,
    approx_percentile(recency_months, 0.25) AS p25,
    approx_percentile(recency_months, 0.50) AS median,
    approx_percentile(recency_months, 0.75) AS p75,
    approx_percentile(recency_months, 0.90) AS p90,
    MAX(recency_months) AS max_val,
    AVG(recency_months) AS mean_val
  FROM normalized_metrics
),

cross_stats AS (
  SELECT
    'Distinct_Products' AS metric,
    approx_percentile(distinct_products, 0.10) AS p10,
    approx_percentile(distinct_products, 0.25) AS p25,
    approx_percentile(distinct_products, 0.50) AS median,
    approx_percentile(distinct_products, 0.75) AS p75,
    approx_percentile(distinct_products, 0.90) AS p90,
    MAX(distinct_products) AS max_val,
    AVG(distinct_products) AS mean_val
  FROM normalized_metrics
)

SELECT * FROM frequency_stats
UNION ALL SELECT * FROM recency_stats
UNION ALL SELECT * FROM cross_stats
ORDER BY metric
```

### Auto-Judgment Logic

Estimate the following from analysis results:

#### Frequency Judgment
```python
if p75_frequency <= 2:
    freq_type = "Low-frequency products (1-2x/year standard)"
    f_thresholds = [1, 2, 3]
elif p75_frequency <= 6:
    freq_type = "Mid-frequency products (~quarterly)"
    f_thresholds = [2, 4, 7]
else:
    freq_type = "High-frequency products (monthly purchase)"
    f_thresholds = [4, 8, 12]
```

#### Recency Judgment
```python
if p75_recency <= 3:
    r_thresholds = [1, 3, 6]
elif p75_recency <= 9:
    r_thresholds = [3, 6, 12]
else:
    r_thresholds = [6, 12, 24]
```

#### Cross Judgment
```python
if cross_median <= 1.5:
    cross_type = "Single-product focused"
    cross_thresholds = [0, 1, 2]
    recommended_granularity = "6 segments"
elif cross_median <= 4:
    cross_type = "Normal variety"
    cross_thresholds = [0, 1, 3]
    recommended_granularity = "9 segments"
else:
    cross_type = "High variety products"
    cross_thresholds = [1, 3, 6]
    recommended_granularity = "9 segments"
```

---

## Step 2: Threshold & Granularity Proposal

### Proposal Message Example (Apparel EC)

```
## Analysis Results Summary

【Data Characteristics】
- Customers: 45,230
- Annual purchase frequency (median): 3.5 times
- Months since last purchase (median): 4 months
- Distinct product types purchased (median): 3 types

【Estimated Industry Type】
Mid-frequency products (~quarterly purchase cycle)

【Characteristics】
- Purchase frequency: Mid-frequency type
  - 75% of customers ≤6x/year → 4x/year is typical good customer
- Recency: Active market
  - Half purchased within 4 months → Risk after 4 months
- Product variety: Normal variety
  - Median 3 types → Cross-category purchase is growth indicator

---

## Recommended Segment Settings

### Option A: 【Recommended】Balanced 9-Segment

**Segment Granularity**: 9 segments + 3 non-Active layers = 12 segments total

**Threshold Settings**:
┌─────────────────────────────────┐
│ Annual Purchase Frequency (F)   │
│  - F-Low:  ≤ 2 times            │
│  - F-Mid:  3-5 times            │
│  - F-High: ≥ 6 times            │
├─────────────────────────────────┤
│ Recency (R)                     │
│  - Active:  ≤ 3 months          │
│  - At-Risk: 4-6 months          │
│  - Dormant: 7-12 months         │
│  - Lost:    > 12 months         │
├─────────────────────────────────┤
│ Product Variety (Cross)         │
│  - Cross-Low:  1 type only      │
│  - Cross-Mid:  2-3 types        │
│  - Cross-High: ≥ 4 types        │
└─────────────────────────────────┘

**Expected Distribution**:
- Active layer: ~35%
  - Including Loyal (High F × High Cross): ~5%
  - Including Entry (Low F × Low Cross): ~12%
- At-Risk layer: ~25%
- Dormant+: ~40%

**Why This Setting**:
- Quarterly purchase standard → 3-stage F axis visualizes growth stages
- Cross-category valuable → Cross axis identifies upsell opportunities
- 4-month Recency boundary → Timely win-back possible

---

### Option B: Simpler (6 Segments)

Split Active layer by Frequency only.
Don't use Cross axis, grasp overall trends first.

### Option C: Simplest (4 Segments)

Classify by Recency only.
Optimal for initial validation.

---

Select next action:
1. Proceed with Option A
2. Adjust thresholds
3. Try different granularity
4. Choose from industry templates
```

---

## Step 3: Parameter Adjustment

### Adjustment Mode

```
## Threshold Adjustment Mode

Current Settings:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【Annual Purchase Frequency (F)】
  Low boundary:  ≤ 2 times
  Mid boundary:  3-5 times  
  High:          ≥ 6 times

【Recency (R)】
  Active boundary:  ≤ 3 months
  At-Risk boundary: 4-6 months
  Dormant boundary: 7-12 months
  Lost:             > 12 months

【Product Variety (Cross)】
  Low boundary:  1 type
  Mid boundary:  2-3 types
  High:          ≥ 4 types
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Select item to adjust:
1. F-axis boundaries
2. R-axis boundaries
3. Cross-axis boundaries
4. Change segment granularity (4 / 6 / 9)
5. Confirm with these settings
```

### F-Axis Adjustment Example

```
【F-Axis Adjustment】

Current: Low ≤2 / Mid 3-5 / High ≥6

Reference data distribution:
- p25 = 2 times  → Bottom 25%
- p50 = 3.5 times → Median
- p75 = 6 times  → Top 25%

Select adjustment option or enter custom:
A) More granular: Low ≤2 / Mid 3-5 / High ≥6  (p75 baseline)
B) Coarser:       Low ≤3 / Mid 4-6 / High ≥7
C) Custom:        Low ≤[ ] / Mid [ ]-[ ] / High ≥[ ]

Selection: A

✓ Updated
  Low boundary:  ≤ 2 times
  Mid boundary:  3-5 times  
  High:          ≥ 6 times
```

### Industry Template Selection

```
## Industry Template List

Select the closest industry:

1. Apparel EC
   F: [2, 4, 8] / R: [2, 4, 8] / Cross: [0, 1, 3]
   
2. Subscription Food (monthly delivery)
   F: [8, 12, 24] / R: [1, 2, 3] / Cross: [1, 3, 6]
   
3. Appliance Retail
   F: [1, 2, 3] / R: [6, 12, 24] / Cross: [0, 1, 2]
   
4. Cosmetics Brand EC
   F: [2, 4, 6] / R: [2, 4, 6] / Cross: [0, 1, 2]
   
5. Books/Goods EC
   F: [3, 6, 12] / R: [2, 4, 8] / Cross: [2, 4, 8]
   
6. SaaS (usage log based)
   F: [200, 400, 800] / R: [0.5, 1, 2] / Cross: [1, 3, 5]
   
7. Luxury Goods (watches/jewelry)
   F: [1, 1, 2] / R: [12, 24, 36] / Cross: [0, 1, 1]
   
8. Custom (analyze from data)

Selection: 1

✓ Applied Apparel EC template
```

---

## Step 4: Classification SQL Generation

### 4-Segment (Recency Only)

```sql
-- =====================================================
-- 4-Segment Classification (Recency Only)
-- =====================================================

WITH
recency_base AS (
  SELECT
    {customer_col} AS customer_id,
    date_diff('month', from_unixtime(MAX({time_col})), current_timestamp) AS recency_months
  FROM {source_db}.{source_table}
  WHERE td_interval({time_col}, '-24M')
  GROUP BY {customer_col}
),

classified AS (
  SELECT
    customer_id,
    recency_months,
    CASE
      WHEN recency_months <= {r_active}                                THEN 'Active'
      WHEN recency_months > {r_active} AND recency_months <= {r_risk}  THEN 'At-Risk'
      WHEN recency_months > {r_risk} AND recency_months <= {r_dormant} THEN 'Dormant'
      ELSE 'Lost'
    END AS segment_name,
    CASE
      WHEN recency_months <= {r_active}                                THEN 1
      WHEN recency_months > {r_active} AND recency_months <= {r_risk}  THEN 2
      WHEN recency_months > {r_risk} AND recency_months <= {r_dormant} THEN 3
      ELSE 4
    END AS segment_order
  FROM recency_base
)

SELECT
  customer_id,
  segment_name,
  recency_months,
  segment_order,
  current_timestamp AS classified_at,
  td_time_string(to_unixtime(current_timestamp), 'yyyy-MM-dd', 'JST') AS classified_date
FROM classified
ORDER BY segment_order
```

**Segment Structure (4-Segment)**:
```
┌────────────────────────────┐
│ 1. Active (R ≤ 3 months)  │  35%
├────────────────────────────┤
│ 2. At-Risk (3 < R ≤ 6)    │  25%
├────────────────────────────┤
│ 3. Dormant (6 < R ≤ 12)   │  20%
├────────────────────────────┤
│ 4. Lost (R > 12)          │  20%
└────────────────────────────┘

Action Priority: 1 > 2 > 3 > 4
```

---

### 6-Segment (Add Frequency)

```sql
-- =====================================================
-- 6-Segment Classification (Split Active by F-axis)
-- =====================================================

WITH
annual_purchases AS (
  SELECT {customer_col} AS customer_id
  FROM {source_db}.{source_table}
  WHERE td_interval({time_col}, '-12M')
),

annual_metrics AS (
  SELECT
    customer_id,
    COUNT(*) AS annual_f
  FROM annual_purchases
  GROUP BY customer_id
),

recency_base AS (
  SELECT
    {customer_col} AS customer_id,
    date_diff('month', from_unixtime(MAX({time_col})), current_timestamp) AS recency_months
  FROM {source_db}.{source_table}
  WHERE td_interval({time_col}, '-24M')
  GROUP BY {customer_col}
),

customer_base AS (
  SELECT
    r.customer_id,
    COALESCE(m.annual_f, 0) AS annual_f,
    r.recency_months
  FROM recency_base r
  LEFT JOIN annual_metrics m ON r.customer_id = m.customer_id
),

classified AS (
  SELECT
    customer_id,
    annual_f,
    recency_months,
    CASE
      WHEN recency_months <= {r_active} AND annual_f <= {f_low}           
        THEN 'Active - Entry'
      WHEN recency_months <= {r_active} AND annual_f > {f_low} AND annual_f <= {f_mid}  
        THEN 'Active - Regular'
      WHEN recency_months <= {r_active} AND annual_f > {f_mid}            
        THEN 'Active - Champion'
      WHEN recency_months > {r_active} AND recency_months <= {r_risk}     
        THEN 'At-Risk'
      WHEN recency_months > {r_risk} AND recency_months <= {r_dormant}    
        THEN 'Dormant'
      ELSE 'Lost'
    END AS segment_name,
    CASE
      WHEN recency_months <= {r_active} AND annual_f > {f_mid}            THEN 1
      WHEN recency_months <= {r_active} AND annual_f > {f_low} AND annual_f <= {f_mid} THEN 2
      WHEN recency_months <= {r_active} AND annual_f <= {f_low}           THEN 3
      WHEN recency_months > {r_active} AND recency_months <= {r_risk}     THEN 4
      WHEN recency_months > {r_risk} AND recency_months <= {r_dormant}    THEN 5
      ELSE 6
    END AS segment_order
  FROM customer_base
)

SELECT
  customer_id,
  segment_name,
  annual_f,
  recency_months,
  segment_order,
  current_timestamp AS classified_at,
  td_time_string(to_unixtime(current_timestamp), 'yyyy-MM-dd', 'JST') AS classified_date
FROM classified
ORDER BY segment_order
```

**Segment Structure (6-Segment)**:
```
【Active Layer (R ≤ 3 months)】35%
┌──────────────────────────────┐
│ 1. Champion (F > 5x)         │  10%
├──────────────────────────────┤
│ 2. Regular (F 3-5x)          │  15%
├──────────────────────────────┤
│ 3. Entry (F ≤ 2x)            │  10%
└──────────────────────────────┘

【Non-Active Layer】65%
┌──────────────────────────────┐
│ 4. At-Risk (3 < R ≤ 6)       │  25%
├──────────────────────────────┤
│ 5. Dormant (6 < R ≤ 12)      │  20%
├──────────────────────────────┤
│ 6. Lost (R > 12)             │  20%
└──────────────────────────────┘

Growth Flow: Entry → Regular → Champion
```

---

### 9-Segment (F × Cross Full Matrix)

```sql
-- =====================================================
-- 9-Segment Classification (F × Cross Matrix)
-- =====================================================

WITH
annual_purchases AS (
  SELECT
    {customer_col} AS customer_id,
    {product_col} AS product_id
  FROM {source_db}.{source_table}
  WHERE td_interval({time_col}, '-12M')
),

annual_metrics AS (
  SELECT
    customer_id,
    COUNT(*) AS annual_f,
    COUNT(DISTINCT product_id) - 1 AS cross_f
  FROM annual_purchases
  GROUP BY customer_id
),

recency_base AS (
  SELECT
    {customer_col} AS customer_id,
    date_diff('month', from_unixtime(MAX({time_col})), current_timestamp) AS recency_months
  FROM {source_db}.{source_table}
  WHERE td_interval({time_col}, '-24M')
  GROUP BY {customer_col}
),

customer_base AS (
  SELECT
    r.customer_id,
    COALESCE(m.annual_f, 0) AS annual_f,
    COALESCE(m.cross_f, 0) AS cross_f,
    r.recency_months
  FROM recency_base r
  LEFT JOIN annual_metrics m ON r.customer_id = m.customer_id
),

classified AS (
  SELECT
    customer_id,
    annual_f,
    cross_f,
    recency_months,
    CASE
      -- Non-Active (Recency priority)
      WHEN recency_months > {r_dormant}                                   THEN 'Lost'
      WHEN recency_months > {r_risk} AND recency_months <= {r_dormant}    THEN 'Dormant'
      WHEN recency_months > {r_active} AND recency_months <= {r_risk}     THEN 'At-Risk'
      
      -- Active 9-split (F × Cross)
      -- F-Low × Cross
      WHEN annual_f <= {f_low} AND cross_f = {cross_low}                  THEN 'Entry'
      WHEN annual_f <= {f_low} AND cross_f > {cross_low} AND cross_f <= {cross_mid}    THEN 'Cross Explorer'
      WHEN annual_f <= {f_low} AND cross_f > {cross_mid}                  THEN 'Cross Fan'
      
      -- F-Mid × Cross
      WHEN annual_f > {f_low} AND annual_f <= {f_mid} AND cross_f = {cross_low}        THEN 'Single Repeater'
      WHEN annual_f > {f_low} AND annual_f <= {f_mid} AND cross_f > {cross_low} AND cross_f <= {cross_mid}  THEN 'Grower'
      WHEN annual_f > {f_low} AND annual_f <= {f_mid} AND cross_f > {cross_mid}        THEN 'High-Cross Near-Loyal'
      
      -- F-High × Cross
      WHEN annual_f > {f_mid} AND cross_f = {cross_low}                   THEN 'Single Fan'
      WHEN annual_f > {f_mid} AND cross_f > {cross_low} AND cross_f <= {cross_mid}     THEN 'Near-Loyal'
      WHEN annual_f > {f_mid} AND cross_f > {cross_mid}                   THEN 'Loyal'
      
      ELSE 'Other'
    END AS segment_name,
    CASE
      WHEN recency_months > {r_dormant}                                   THEN 12
      WHEN recency_months > {r_risk} AND recency_months <= {r_dormant}    THEN 11
      WHEN recency_months > {r_active} AND recency_months <= {r_risk}     THEN 10
      WHEN annual_f > {f_mid} AND cross_f > {cross_mid}                   THEN 1
      WHEN annual_f > {f_mid} AND cross_f > {cross_low} AND cross_f <= {cross_mid}     THEN 2
      WHEN annual_f > {f_low} AND annual_f <= {f_mid} AND cross_f > {cross_mid}        THEN 3
      WHEN annual_f > {f_mid} AND cross_f = {cross_low}                   THEN 4
      WHEN annual_f > {f_low} AND annual_f <= {f_mid} AND cross_f > {cross_low} AND cross_f <= {cross_mid}  THEN 5
      WHEN annual_f <= {f_low} AND cross_f > {cross_mid}                  THEN 6
      WHEN annual_f > {f_low} AND annual_f <= {f_mid} AND cross_f = {cross_low}        THEN 7
      WHEN annual_f <= {f_low} AND cross_f > {cross_low} AND cross_f <= {cross_mid}    THEN 8
      WHEN annual_f <= {f_low} AND cross_f = {cross_low}                  THEN 9
      ELSE 13
    END AS segment_order
  FROM customer_base
)

SELECT
  customer_id,
  segment_name,
  annual_f,
  cross_f,
  recency_months,
  segment_order,
  current_timestamp AS classified_at,
  td_time_string(to_unixtime(current_timestamp), 'yyyy-MM-dd', 'JST') AS classified_date
FROM classified
ORDER BY segment_order
```

**Segment Structure (9-Segment)**:
```
【Active Layer (R ≤ 3 months) Classification Only】

            Cross-Low     Cross-Mid        Cross-High
            (1 type)      (2-3 types)      (4+ types)
            
F-High      Single Fan    Near-Loyal       Loyal
(6+ times)  [4] 3%        [2] 4%           [1] 3%
            
F-Mid       Single        Grower           High-Cross
(3-5x)      Repeater                       Near-Loyal
            [7] 5%        [5] 8%           [3] 4%
            
F-Low       Entry         Cross            Cross Fan
(1-2x)                    Explorer
            [9] 4%        [8] 3%           [6] 1%

【Non-Active Layer】
[10] At-Risk (3 < R ≤ 6 months)    25%
[11] Dormant (6 < R ≤ 12 months)   20%
[12] Lost (R > 12 months)          20%

Growth Directions:
→ Horizontal: Cross growth (expand product variety)
↑ Vertical: F growth (increase purchase frequency)
```

### Execution Method

```bash
# Save SQL to file, then execute
tdx query \
  --database {source_db} \
  --table customer_segments_adaptive \
  --engine presto \
  "$(cat segment_classification.sql)"
```

---

## Step 5: Distribution Validation

### Validation SQL

```sql
-- =====================================================
-- Segment Distribution Validation
-- =====================================================

WITH
segment_summary AS (
  SELECT
    segment_name,
    segment_order,
    COUNT(*) AS customer_count,
    AVG(annual_f) AS avg_frequency,
    AVG(cross_f) AS avg_cross,
    AVG(recency_months) AS avg_recency
  FROM {source_db}.customer_segments_adaptive
  GROUP BY segment_name, segment_order
),

total_summary AS (
  SELECT
    COUNT(*) AS total_customers,
    SUM(CASE WHEN recency_months <= {r_active} THEN 1 ELSE 0 END) AS active_customers
  FROM {source_db}.customer_segments_adaptive
)

SELECT
  s.segment_order,
  s.segment_name,
  s.customer_count,
  ROUND(s.customer_count * 100.0 / t.total_customers, 1) AS pct_of_total,
  CASE 
    WHEN s.segment_name NOT LIKE '%Risk%' AND s.segment_name NOT LIKE '%ormant%' AND s.segment_name NOT LIKE '%ost%'
    THEN ROUND(s.customer_count * 100.0 / t.active_customers, 1)
    ELSE NULL
  END AS pct_of_active,
  ROUND(s.avg_frequency, 1) AS avg_f,
  ROUND(s.avg_cross, 1) AS avg_cross,
  ROUND(s.avg_recency, 1) AS avg_recency
FROM segment_summary s
CROSS JOIN total_summary t
ORDER BY s.segment_order
```

### Validation Criteria

| Check Item | Good Range | Warning | Error |
|-----------|-----------|---------|-------|
| Active layer % | 30-50% | 20-30% or 50-60% | <20% or >60% |
| Min segment size | >500 | 100-500 | <100 |
| Entry % (of Active) | 10-30% | 30-50% | >50% |
| Loyal % (of Active) | 3-10% | 1-3% | <1% |

### Issue Detection & Proposal Example

```
## Segment Distribution Validation Result

【Judgment】⚠ Needs Adjustment

Detected Issues:
━━━━━━━━━━━━━━━━━━━━━━━━━━━

❌ Issue 1: Entry segment too large (79.6% of Active)
┌───────────────────────────────┐
│ Current: F ≤ 2 times          │
│ Proposal: F ≤ 1 time          │
│                               │
│ Reason:                       │
│ When 1-2x/year is standard,   │
│ "≤2 = Entry" causes majority  │
│ to concentrate in Entry.      │
└───────────────────────────────┘

❌ Issue 2: Active layer only 15.7%
┌───────────────────────────────┐
│ Current: R ≤ 3 months         │
│ Proposal: R ≤ 6 months        │
│                               │
│ Reason:                       │
│ Recency median: 5.5 months    │
│ → Current 3 months too strict │
└───────────────────────────────┘

【Recommended Actions】
A) Apply proposed adjustments and re-run
B) Adjust one by one to confirm impact
C) Downgrade to 6 segments
D) Confirm with current settings
```

---

## Industry-Specific Threshold Templates

| Industry | F Thresholds [Low/Mid/High] | R Thresholds [Active/Risk/Dormant] (months) | Cross Thresholds [Low/Mid/High] | Recommended Granularity |
|----------|----------------------------|------------------------------------------|-------------------------------|----------------------|
| Apparel EC | [2, 4, 8] | [2, 4, 8] | [0, 1, 3] | 9 |
| Subscription Food | [8, 12, 24] | [1, 2, 3] | [1, 3, 6] | 6 |
| Appliance Retail | [1, 2, 3] | [6, 12, 24] | [0, 1, 2] | 9 |
| Cosmetics EC | [2, 4, 6] | [2, 4, 6] | [0, 1, 2] | 9 |
| Books/Goods EC | [3, 6, 12] | [2, 4, 8] | [2, 4, 8] | 9 |
| SaaS | [200, 400, 800] | [0.5, 1, 2] | [1, 3, 5] | 6 |
| Luxury Goods | [1, 1, 2] | [12, 24, 36] | [0, 1, 1] | 4 |

---

## Segment Definitions (9-Segment)

| Segment | F | Cross | Business Meaning |
|---------|---|-------|-----------------|
| Entry | 1-2 | 0 | Trial purchase; churn prevention priority |
| Single Repeater | 3-5 | 0 | Single-product repeat; cross-sell opportunity |
| Single Fan | 6+ | 0 | Single-product loyal; cross-sell top priority |
| Cross Explorer | 1-2 | 1 | Exploring variety; early nurture |
| Grower | 3-5 | 1 | Stable growth; nurture both axes |
| Near-Loyal | 6+ | 1 | High frequency; expand Cross to full Loyal |
| Cross Fan | 1-2 | 2+ | Wide variety; frequency increase opportunity |
| High-Cross Near-Loyal | 3-5 | 2+ | Both axes balanced; increase F to Loyal |
| Loyal | 6+ | 2+ | Best customers; retention & referral |
| At-Risk | - | - | R 4-12 months; win-back top priority |
| Dormant | - | - | R 13-24 months; limited win-back |
| Lost | - | - | R 25+ months; consider exclusion |

---

## Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| All concentrated in Entry | F threshold too high | Lower F_low (e.g., 2→1) |
| Active layer <10% | R threshold too strict | Expand r_active (e.g., 3→6 months) |
| cross_f always 0 | Inappropriate product column | Change to product_id etc. |
| Loyal segment 0 | Thresholds too strict | Lower f_mid, cross_mid |
| Metric overlap between segments | Threshold setting error | Check averages in validation SQL, re-adjust |
| `date_diff` returns NULL | time_col contains NULL | Add `WHERE {time_col} IS NOT NULL` |

---

## Related Skills

- **parent-segment** - Register classification results as parent segment attribute
- **segment** - Create each segment as child segment
- **sql-skills:trino** - TD Trino SQL syntax reference
- **workflow-skills:digdag** - Monthly auto-classification workflow design

---

## Usage Examples

### Example 1: Initial Execution (Auto-estimate from Data)

```
User: "Want to classify EC customers. Purchase cycle unknown."

Claude:
1. Confirm data source
   → ecommerce.orders / customer_id / time / product_category
   
2. Data availability check
   → All data OK, 9-segment possible
   
3. Execute RFM distribution analysis
   → median_F=3.5, p75_F=6 → mid-frequency type
   → median_R=4 → recommend r_active=3 months
   
4. Proposal: 9-segment, F[2,5,8], R[3,6,12], Cross[0,1,3]

5. Execute classification SQL

6. Validation
   → Active 35%, Entry 12%
   → ✓ Good, action design possible
```

### Example 2: Using Industry Template

```
User: "Cosmetics EC with Skincare/Makeup/Haircare 3 categories."

Claude:
1. Apply industry template
   → Cosmetics EC: F[2,4,6], R[2,4,6], Cross[0,1,2]
   
2. Recommend 9-segment (line usage growth important)

3. Confirm fine-tuning
   → Execute as-is OK

4. Execute classification

5. Validation
   → Loyal (Skincare×Makeup×Hair): 4.2%
   → Single Fan (Skincare high-freq only): 6.8%
   → Cross-sell priority clarified
```

### Example 3: Data Gap Fallback

```
User: "High null rate in product category column."

Claude:
1. Data availability check
   → product_category null rate 68%
   → Cross axis unavailable
   
2. Auto-downgrade: Recommend 6-segment
   → Classify by F×R only
   
3. Improvement proposal:
   "If product master JOIN processing is improved,
   can migrate to 9-segment in future.
   Cross-sell accuracy will improve."
   
4. Execute temporary 6-segment
   → Active-Champion / Regular / Entry + 3 non-Active layers
```

---

**Author**: Treasure Data CDP Team  
**Version**: 2.0 (Adaptive)  
**Last Updated**: 2026-04-20
