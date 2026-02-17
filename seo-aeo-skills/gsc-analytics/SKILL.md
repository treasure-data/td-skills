---
name: gsc-analytics
description: Deep analysis of Google Search Console data for keyword research, performance monitoring, and SEO opportunity discovery. Identifies quick wins, CTR opportunities, keyword cannibalization, trending keywords, and index health issues. Use as the data foundation for site-audit, competitor-analysis, and content-brief skills, or standalone for GSC reporting and keyword strategy.
---

# GSC Analytics

Comprehensive Google Search Console data analysis to discover SEO opportunities and monitor search performance.

## Prerequisites

- Google Search Console connected (provides `google_search_console_*` MCP tools)

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

### Step 9: Zero-click potential

From the Step 2 data, filter for:
- **Impressions**: > 200
- **Clicks**: 0

These represent queries where the site appears in results but gets no clicks. Possible causes:
- Content doesn't match the search intent
- No page exists targeting this query (opportunity to create content)
- Featured snippet or AI Overview is capturing all clicks

### Step 10: Index health check

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
[Table from Step 6]

### Device Performance
[Summary from Step 7]

### Country Breakdown
[Summary from Step 8]

### Zero-Click Queries
[Table from Step 9]

### Index Health
[Summary from Step 10]

### Recommended Next Steps
1. [Highest priority action]
2. [Second priority]
3. [Third priority]
```

## Related Skills

- **site-audit**: Use GSC data from this skill as input for page-level AEO analysis
- **competitor-analysis**: Compare GSC performance against competitor page structures
- **content-brief**: Generate content briefs targeting quick-win keywords from this analysis
