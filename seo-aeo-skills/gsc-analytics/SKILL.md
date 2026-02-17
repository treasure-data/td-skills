---
name: gsc-analytics
description: Deep analysis of Google Search Console data for keyword research, performance monitoring, and SEO opportunity discovery. Identifies quick wins, CTR opportunities, keyword cannibalization, trending keywords, and index health issues. Use as the data foundation for site-audit, competitor-analysis, and content-brief skills, or standalone for GSC reporting and keyword strategy.
---

# GSC Analytics

Comprehensive Google Search Console data analysis to discover SEO opportunities and monitor search performance.

## Prerequisites

- Google Search Console connected (provides `google_search_console_*` MCP tools)
- Optionally: SerpAPI connected (provides `serpapi_google_search` MCP tool) for live SERP validation of key queries

## Glossary

Technical terms are annotated on first use. For the full glossary, see [../references/glossary.md](../references/glossary.md).

## Analysis Workflow

### Step 1: Identify the target site

Ask the user for the site URL. If unknown, list available properties:

```
google_search_console_list_sites
```

Use the `sc-domain:` format (e.g., `sc-domain:example.com`) when available, as it covers all subdomains.

### Step 2: Performance overview (last 28 days)

Pull the full dataset with `query` and `page` dimensions:

```
google_search_console_query_analytics
  site_url: "sc-domain:example.com"
  start_date: <28 days ago, YYYY-MM-DD>
  end_date: <3 days ago, YYYY-MM-DD>
  dimensions: ["query", "page"]
  row_limit: 5000
```

> Note: GSC data has a ~3 day delay. Always set `end_date` to 3 days before today.

Summarize the top-level metrics:
- Total queries
- Total pages receiving traffic
- Average position across all queries
- Top 10 queries by impressions
- Top 10 pages by clicks

### Step 3: Quick Wins analysis

Filter the dataset for **Quick Wins** (striking distance keywords close to page 1):

- **Position**: 8-20
- **Impressions**: > 100

These keywords are on the edge of page 1 and offer high ROI (return on investment) for optimization.

Present as a table:

```
| Keyword | Page | Position | Impressions | Clicks | CTR | Priority |
|---------|------|----------|-------------|--------|-----|----------|
```

Priority classification:
- **High**: Position 8-12, Impressions > 500
- **Medium**: Position 8-12, Impressions 100-500 OR Position 13-17, Impressions > 500
- **Low**: Position 13-20, Impressions 100-500

### Step 4: CTR opportunities

Filter for pages with high visibility but low engagement:

- **Impressions**: > 500
- **CTR**: < 2%

Low CTR with high impressions typically means the title tag or meta description needs rewriting to improve click appeal.

Present as a table:

```
| Keyword | Page | Impressions | CTR | Position | Suggested Action |
|---------|------|-------------|-----|----------|------------------|
```

### Step 5: Trend comparison (current vs prior period)

Run a second query for the prior 28-day period:

```
google_search_console_query_analytics
  site_url: "sc-domain:example.com"
  start_date: <56 days ago, YYYY-MM-DD>
  end_date: <31 days ago, YYYY-MM-DD>
  dimensions: ["query", "page"]
  row_limit: 5000
```

Compare position changes per keyword:
- **Rising**: Position improved by 3+ places
- **Falling**: Position dropped by 3+ places
- **Stable**: Position changed less than 3 places

Present rising and falling keywords with their position delta.

### Step 6: Keyword cannibalization detection

From the Step 2 data (dimensions: `["query", "page"]`), group by query and find queries where 2+ pages compete:

```
| Query | Pages | Best Position | Worst Position | Action |
|-------|-------|---------------|----------------|--------|
```

Cannibalization indicates ranking signal dilution. Recommend:
- Merge content if pages cover the same topic
- Add canonical if one page is clearly primary
- Differentiate content focus if pages serve different intents

#### Cannibalization SERP Arbiter (requires SerpAPI)

For the top 5 cannibalized queries, run SerpAPI to determine which page Google currently prefers:

```
serpapi_google_search
  query: "<cannibalized query>"
  num: 10
  gl: "<user's market>"
```

For each cannibalized query:
1. Find the live positions of all competing pages from your site
2. Infer SERP intent from features:
   - Answer Box present → **Informational**
   - Shopping/local results → **Transactional**
   - Knowledge Graph (brand) → **Navigational**
   - Mixed/none → Analyze top organic result formats
3. Match each competing page to the inferred intent
4. Recommend which page to keep as the canonical target

See [../content-brief/references/intent-classification.md](../content-brief/references/intent-classification.md) for the full SERP feature → intent mapping.

Present:

```
| Query | Intent | Page A (position) | Page B (position) | Recommendation |
|-------|--------|--------------------|--------------------|----------------|
```

> **SerpAPI call budget**: Limit to top 5 cannibalized queries by combined impressions.

### Step 7: Device breakdown

Query with device dimension:

```
google_search_console_query_analytics
  site_url: "sc-domain:example.com"
  start_date: <28 days ago, YYYY-MM-DD>
  end_date: <3 days ago, YYYY-MM-DD>
  dimensions: ["query", "device"]
  row_limit: 2000
```

Compare desktop vs mobile vs tablet:
- Queries where mobile position is 5+ worse than desktop → mobile UX issue
- Queries with high mobile impressions but low CTR → mobile title/snippet issue

### Step 8: Country analysis

Query with country dimension:

```
google_search_console_query_analytics
  site_url: "sc-domain:example.com"
  start_date: <28 days ago, YYYY-MM-DD>
  end_date: <3 days ago, YYYY-MM-DD>
  dimensions: ["query", "country"]
  row_limit: 2000
```

Present:
- Top countries by impressions
- Country-specific keyword opportunities (keywords performing well only in specific markets)

### Step 9: Zero-Click Root Cause Diagnosis

From the Step 2 data, filter for zero-click queries:
- **Impressions**: > 200
- **Clicks**: 0

These represent queries where the site appears in results but gets no clicks.

#### Automated diagnosis (requires SerpAPI)

For the top 10 zero-click queries by impressions, run SerpAPI to classify the root cause:

```
serpapi_google_search
  query: "<zero-click query>"
  num: 10
  gl: "<user's market>"
```

Classify each query into one of 4 types:

| Type | Root Cause | Detection Logic |
|------|-----------|-----------------|
| **Type A**: AI Overview / AB Absorption | AI Overview or Answer Box fully satisfies the query | `aiOverview` present with content, or `answerBox` with complete answer |
| **Type B**: Intent Mismatch | Page content format doesn't match search intent | No SERP feature capturing clicks; page title/snippet misaligned |
| **Type C**: Brand AB Owned | Competitor's branded Answer Box dominates | `answerBox.url` belongs to a competitor domain |
| **Type D**: PAA Absorption | PAA boxes expand to answer sub-questions | 4+ `peopleAlsoAsk` entries covering the topic; page at position 4+ |

Present the diagnosis table:

```
| Query | Impressions | Type | Root Cause | Remediation |
|-------|-------------|------|------------|-------------|
| "what is X" | 1,200 | A | AI Overview answers directly | Restructure with BLUF, target AIO references |
| "X pricing" | 800 | C | competitor.com owns AB | Create comparison page with BLUF verdict |
```

See [references/zero-click-strategy.md](references/zero-click-strategy.md) for the complete classification matrix and remediation strategies.

> **SerpAPI call budget**: Limit to top 10 zero-click queries by impressions.

#### Without SerpAPI

If SerpAPI is not connected, present the zero-click queries as a table and note that root cause classification requires SerpAPI:

```
| Query | Impressions | Page | Position | Possible Cause |
|-------|-------------|------|----------|----------------|
```

### Step 10: SERP Validation + CTR Impact Score (optional, requires SerpAPI)

If SerpAPI is connected, validate the live SERP for your top Quick Win keywords from Step 3. For the top 5 Quick Win keywords:

```
serpapi_google_search
  query: "<quick win keyword>"
  num: 10
  gl: "<user's market>"
```

For each keyword, document:
- **Your actual position** in live results (may differ from GSC average)
- **SERP features present**: Answer box, AI Overview, knowledge graph, PAA, local pack, top stories
- **Who owns the answer box**: If a competitor has the answer box, note the URL and content type
- **AI Overview references**: If `aiOverview.references` present, check if your site is cited
- **PAA questions**: Valuable for content optimization — these are the questions Google associates with the keyword

#### SERP Feature CTR Impact Score

For each keyword, calculate the expected CTR impact of SERP features:

**Position-based baseline CTR:**

| Position | Baseline CTR |
|----------|-------------|
| 1 | 28% |
| 2 | 15% |
| 3 | 11% |
| 4 | 8% |
| 5 | 7% |
| 6 | 5% |
| 7 | 4% |
| 8 | 3.5% |
| 9 | 3% |
| 10 | 2.5% |

**SERP feature penalty coefficients** (cumulative — multiply all applicable):

| SERP Feature | CTR Penalty |
|-------------|-------------|
| Answer Box / AI Overview | -60% |
| Knowledge Graph | -30% |
| Local Pack | -20% |
| People Also Ask | -15% |
| Top Stories | -10% |
| Shopping Results | -25% |

**Calculation**:
```
adjusted_expected_ctr = baseline_ctr * (1 - sum_of_applicable_penalties)
```

**Classification**:
- If `actual_ctr < adjusted_expected_ctr * 0.7` → **"Content Problem"** (title/meta/content needs improvement)
- If `actual_ctr >= adjusted_expected_ctr * 0.7` → **"SERP Feature Absorption"** (low CTR is caused by SERP features, not content quality)

Present:

```
| Keyword | Position | Baseline CTR | SERP Features | Adjusted CTR | Actual CTR | Diagnosis |
|---------|----------|-------------|---------------|-------------|------------|-----------|
| "keyword" | 3 | 11% | AB, PAA | 3.3% | 2.1% | Content Problem |
| "keyword" | 5 | 7% | AB, KG, PAA | 0.7% | 0.5% | SERP Feature Absorption |
```

This creates a bridge between GSC data (what you rank for) and SERP reality (what the search results actually look like). Use this to:
- Prioritize Quick Wins where SERP features are capturable (answer box, PAA)
- Distinguish content problems from SERP feature absorption
- Discover competitor URLs to feed into **competitor-analysis** skill

> **SerpAPI call budget**: Limit to top 5 Quick Win keywords by impressions.

### Step 11: Position Drift Detection (optional, requires SerpAPI)

Detect ranking changes not yet reflected in GSC data by comparing GSC average positions with live SERP positions.

For the top 20 keywords by impressions from Step 2, run SerpAPI:

```
serpapi_google_search
  query: "<keyword>"
  num: 20
  gl: "<user's market>"
```

For each keyword:
1. Find your site's position in the live organic results
2. Calculate drift: `drift = live_position - gsc_avg_position`
3. Classify:

| Drift | Classification | Action |
|-------|---------------|--------|
| > +5 | **Crash Alert** | Investigate immediately — recent algorithm update, technical issue, or competitor surge |
| +3 to +5 | **Declining** | Monitor closely, review content freshness and competitor changes |
| -3 to +3 | **Stable** | No action needed |
| -3 to -5 | **Rising** | Capitalize on momentum — update content, add internal links |
| < -5 | **Surge** | Strong positive signal — expand content cluster around this keyword |
| Not found | **Deindex Risk** | Page may have been deindexed — run URL Inspection immediately |

Present:

```
| Keyword | GSC Avg Position | Live Position | Drift | Status | Action |
|---------|-----------------|---------------|-------|--------|--------|
| "keyword A" | 8.2 | 15 | +6.8 | Crash Alert | Investigate content, check for manual actions |
| "keyword B" | 12.5 | 6 | -6.5 | Surge | Expand content cluster |
| "keyword C" | 5.1 | — | N/A | Deindex Risk | Run URL Inspection |
```

> **SerpAPI call budget**: Limit to top 20 keywords by impressions. Process in batches of 5 to manage API rate limits.

### Step 12: Index health check

Check sitemap status:

```
google_search_console_list_sitemaps
  site_url: "sc-domain:example.com"
```

For each sitemap, check submitted vs indexed counts:

```
google_search_console_get_sitemap
  site_url: "sc-domain:example.com"
  sitemap_url: "https://example.com/sitemap.xml"
```

Flag issues:
- **Submitted >> Indexed**: Many pages not being indexed → investigate with URL Inspection
- **No sitemap**: Recommend creating and submitting one

For problem pages, inspect individually:

```
google_search_console_inspect_url
  site_url: "sc-domain:example.com"
  inspection_url: "https://example.com/problem-page"
```

Check: coverage verdict, indexing state, crawl info, mobile usability.

### Step 13: Entity SEO / Topical Authority Map (optional, requires SerpAPI)

Build a topical authority map by clustering GSC queries and cross-referencing with Knowledge Graph data.

#### Cluster GSC queries

From the Step 2 data, cluster queries by keyword stems (group queries that share the same root keyword or topic):

1. Extract the primary keyword stem from each query (e.g., "best project management tools" → "project management")
2. Group queries by stem
3. Per cluster, calculate:
   - Query count (number of distinct queries)
   - Page count (number of distinct pages ranking)
   - Average position across the cluster
   - Page-1 rate: % of queries with position ≤ 10

#### Knowledge Graph check (requires SerpAPI)

For each cluster, run a SerpAPI search for the primary keyword stem:

```
serpapi_google_search
  query: "<cluster keyword stem>"
  num: 5
  gl: "<user's market>"
```

Check if:
- A **Knowledge Graph** entry exists for your brand/entity
- Your site appears in the Knowledge Graph `source`
- Competitors have Knowledge Graph entries for the same topic

#### Topical authority map

Present:

```
| Topic Cluster | Queries | Pages | Avg Position | Page-1 Rate | KG Present? | Authority Level |
|--------------|---------|-------|-------------|-------------|-------------|-----------------|
| "project management" | 45 | 8 | 6.2 | 78% | Yes (brand) | Strong |
| "team collaboration" | 12 | 3 | 18.5 | 25% | No | Emerging |
| "remote work" | 5 | 2 | 32.1 | 0% | No | Weak |
```

Authority level classification:
- **Strong**: Page-1 rate > 60% AND 5+ queries in cluster
- **Emerging**: Page-1 rate 20-60% OR 3-5 queries with improving positions
- **Weak**: Page-1 rate < 20% OR fewer than 3 queries
- **Opportunity**: Competitor has KG entry but you have no cluster coverage

Recommendations per cluster:
- **Strong**: Maintain and expand — add subtopic pages, build internal links
- **Emerging**: Prioritize — create pillar content, add FAQ schema, target PAA questions
- **Weak**: Evaluate ROI — either invest heavily or deprioritize
- **Opportunity**: Research and plan — create content cluster strategy

> **SerpAPI call budget**: Limit to top 10 topic clusters by total impressions.

## Output Format

```markdown
## GSC Analytics Report: example.com
**Period**: YYYY-MM-DD to YYYY-MM-DD

### Performance Summary
| Metric | Value |
|--------|-------|
| Total Queries | 1,234 |
| Total Pages | 87 |
| Avg Position | 24.5 |
| Total Impressions | 45,000 |
| Total Clicks | 1,200 |
| Avg CTR | 2.7% |

### Quick Wins (Striking Distance)
[Table from Step 3]

### CTR Opportunities
[Table from Step 4]

### Trending Keywords
**Rising** (position improved 3+):
[List]

**Falling** (position dropped 3+):
[List]

### Keyword Cannibalization
[Table from Step 6 — includes SERP Arbiter results if SerpAPI available]

### Device Performance
[Summary from Step 7]

### Country Breakdown
[Summary from Step 8]

### Zero-Click Root Cause Diagnosis
[Diagnosis table from Step 9 — type classification and remediation per query]

### SERP Validation + CTR Impact Score (if SerpAPI available)
[Table from Step 10 — baseline CTR, SERP penalties, actual vs expected, diagnosis]

### Position Drift Detection (if SerpAPI available)
[Table from Step 11 — GSC position vs live position, drift classification]

### Index Health
[Summary from Step 12]

### Topical Authority Map (if SerpAPI available)
[Table from Step 13 — topic clusters, authority levels, KG presence]

### Recommended Next Steps
1. [Highest priority action]
2. [Second priority]
3. [Third priority]
```

## Related Skills

- **site-audit**: Use GSC data from this skill as input for page-level AEO analysis
- **competitor-analysis**: Compare GSC performance against competitor page structures
- **content-brief**: Generate content briefs targeting quick-win keywords from this analysis
