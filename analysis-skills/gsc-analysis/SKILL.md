---
name: gsc-analysis
description: Deep analysis of Google Search Console data for keyword research, performance monitoring, and SEO opportunity discovery. Identifies quick wins, CTR opportunities, keyword cannibalization, trending keywords, and index health issues. Use as the data foundation for seo-analysis, competitor-analysis, and content-brief skills, or standalone for GSC reporting and keyword strategy.
---

# GSC Analysis

Comprehensive Google Search Console data analysis to discover SEO opportunities and monitor search performance.

## Tool Availability Check

Before starting, verify SerpAPI is available: `ToolSearch { "query": "select:mcp__tdx-studio__serpapi_google_search", "max_results": 1 }`. If available, use it for all SerpAPI steps below. If not, skip SerpAPI-dependent steps.

## Prerequisites

- Google Search Console connected (provides `google_search_console_*` MCP tools)
- Optionally: SerpAPI connected (provides `serpapi_google_search` MCP tool) for live SERP validation of key queries

## Glossary

Technical terms are annotated on first use. For the full glossary, see [../references/glossary.md](../references/glossary.md).

## Analysis Workflow

### Step 1: Identify the target site

First, retrieve available GSC properties and present them to the user:

```
google_search_console_list_sites
```

Present the list and let the user select the target site. Use the `sc-domain:` format (e.g., `sc-domain:example.com`) when available, as it covers all subdomains. Do not ask the user for a URL before checking GSC — the available properties may differ from what the user expects.

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

#### Handling large result sets

GSC responses with 5,000 rows often exceed 256KB and **cannot be read in a single Read call**. Never attempt to read the entire result file at once. Instead:

1. **Use Grep** to extract specific data points (e.g., `Grep` for a keyword or URL pattern)
2. **Use Read with offset/limit** to read in chunks (e.g., `offset: 0, limit: 100` then `offset: 100, limit: 100`)
3. **Use Bash with `jq`** to filter and aggregate directly:

```bash
# Example: Top 10 by impressions
cat <result_file> | jq '[.rows | sort_by(-.impressions) | limit(10; .[])] | .[] | {query: .keys[0], page: .keys[1], position: .position, impressions: .impressions, clicks: .clicks, ctr: .ctr}'
```

See [references/gsc-query-patterns.md](references/gsc-query-patterns.md) for Quick Wins, zero-click, and cannibalization `jq` filters.

Apply the same approach to all subsequent steps that filter the Step 2 dataset.

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

See [../seo-analysis/references/intent-classification.md](../seo-analysis/references/intent-classification.md) for the full SERP feature → intent mapping.

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

### Step 9: Zero-Click queries

From the Step 2 data, filter for zero-click queries:
- **Impressions**: > 200
- **Clicks**: 0

These represent queries where the site appears in results but gets no clicks.

#### Automated diagnosis (requires SerpAPI)

For the top 10 zero-click queries by impressions, run SerpAPI to classify the root cause into Type A (AI Overview/AB Absorption), B (Intent Mismatch), C (Brand AB Owned), or D (PAA Absorption).

See [../seo-analysis/references/zero-click-strategy.md](../seo-analysis/references/zero-click-strategy.md) for the full classification matrix.

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

#### SERP Feature CTR Impact Score

For each keyword, calculate `adjusted_expected_ctr = baseline_ctr × (1 - sum_of_SERP_penalties)` and classify as **"Content Problem"** (actual < 70% of adjusted) or **"SERP Feature Absorption"** (actual >= 70% of adjusted).

See [references/ctr-scoring.md](references/ctr-scoring.md) for baseline CTR table, penalty coefficients, and output format.

> **SerpAPI call budget**: Limit to top 5 Quick Win keywords by impressions.

### Step 11: Index health check

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

### Step 12: Entity SEO / Topical Authority Map (optional, requires SerpAPI)

Build a topical authority map by clustering GSC queries and cross-referencing with Knowledge Graph data.

Cluster GSC queries by keyword stems, calculate per-cluster metrics (query count, page count, avg position, page-1 rate), then cross-reference with SerpAPI Knowledge Graph data to classify authority levels (Strong / Emerging / Weak / Opportunity).

See [references/topical-clustering.md](references/topical-clustering.md) for the clustering algorithm, KG check workflow, authority map schema, and recommended actions per level.

> **SerpAPI call budget**: Limit to top 10 topic clusters by total impressions.

## Output Format

Structure the report as `## GSC Analysis Report: [domain]` with `**Period**: YYYY-MM-DD to YYYY-MM-DD`, then include these sections (skip sections where data is unavailable):

1. **Performance Summary** — metrics table (queries, pages, avg position, impressions, clicks, CTR)
2. **Quick Wins** — from Step 3
3. **CTR Opportunities** — from Step 4
4. **Trending Keywords** — rising/falling from Step 5
5. **Keyword Cannibalization** — from Step 6 (+ SERP Arbiter if SerpAPI)
6. **Device Performance** — from Step 7
7. **Country Breakdown** — from Step 8
8. **Zero-Click Queries** — from Step 9
9. **SERP Validation + CTR Impact** — from Step 10 (requires SerpAPI)
10. **Index Health** — from Step 11
11. **Topical Authority Map** — from Step 12 (requires SerpAPI)
12. **Recommended Next Steps** — top 3 prioritized actions

## Related Skills

- **seo-analysis**: Add live SERP context (SERP feature maps, position drift, Answer Box analysis) to GSC data
- **aeo-analysis**: Audit page structure for AI citation readiness
- **competitor-analysis**: Compare GSC performance against competitor page structures
- **content-brief**: Generate content briefs targeting quick-win keywords from this analysis
