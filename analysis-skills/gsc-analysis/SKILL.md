---
name: gsc-analysis
description: Deep analysis of Google Search Console data for keyword research, performance monitoring, and SEO opportunity discovery. Identifies quick wins, CTR opportunities, keyword cannibalization, trending keywords, zero-click queries, and index health issues. Use as the data foundation for seo-analysis, competitor-analysis, and content-brief skills, or standalone for GSC reporting and keyword strategy.
---

# GSC Analysis

Discover SEO opportunities and monitor search performance through comprehensive Google Search Console data analysis.

## Available Tools

| Tool | What it provides in GSC context |
|------|--------------------------------|
| **GSC MCP** (`google_search_console_*`) | `list_sites` for property discovery (prefer `sc-domain:` format), `query_analytics` for keyword/page performance with dimensions and filters, `list_sitemaps` / `get_sitemap` for index health, `inspect_url` for page-level indexing status |
| **SerpAPI** (`serpapi_google_search`) | Optional. Live SERP validation for cannibalization arbiter, zero-click root cause diagnosis, and topical authority KG checks. Check availability: `ToolSearch { "query": "select:mcp__tdx-studio__serpapi_google_search", "max_results": 1 }` |

## GSC Data Characteristics

- **~3-day delay**: Always set `end_date` to 3 days before today
- **Standard window**: 28 days (`end_date - 27 days` to `end_date`)
- **Large results**: 5,000-row responses often exceed 256KB — never read entire result files at once. Use `jq` filters, `Grep` for specific patterns, or `Read` with `offset/limit` chunks
- **Property format**: Prefer `sc-domain:example.com` (covers all subdomains) over `sc-url:` (single URL prefix)
- **Anonymous queries**: Some queries hidden for privacy — high "anonymous" count is normal
- **Position averaging**: GSC positions are averages; 10.5 means the page appears at positions 10-11

Full query patterns, jq examples, and filtering details in [references/gsc-query-patterns.md](references/gsc-query-patterns.md).

## Analysis Dimensions

### Dimension Combinations

| Use Case | Dimensions | Row Limit |
|----------|-----------|-----------|
| Keyword + page mapping | `["query", "page"]` | 5000 |
| Device breakdown | `["query", "device"]` | 2000 |
| Country analysis | `["query", "country"]` | 2000 |
| Page performance | `["page"]` | 1000 |
| Date trend (single query) | `["date"]` | 90 |
| Full breakdown | `["query", "page", "date"]` | 5000 |

### Quick Win Criteria

Keywords on the edge of page 1 with the highest optimization ROI.

| Priority | Position | Impressions | Expected effort |
|----------|----------|-------------|----------------|
| High | 8-12 | > 500 | Low — minor content improvements |
| Medium | 8-12 (100-500 impr) or 13-17 (> 500 impr) | varies | Moderate — content expansion |
| Low | 13-20 | 100-500 | Higher — may need new content sections |

### CTR Opportunity Criteria

High visibility but low engagement — typically indicates title/meta description needs rewriting.

- **Impressions**: > 500
- **CTR**: < 2%

### Trend Analysis

Compare current 28-day window against prior 28-day window (offset by 3-day gap).

| Position delta | Classification | Action |
|---------------|---------------|--------|
| < -3 | Rising | Capitalize on momentum |
| -3 to +3 | Stable | Maintain current strategy |
| > +3 | Falling | Investigate and refresh content |

### Cannibalization Detection

Queries where 2+ pages from the same site compete, diluting ranking signals.

**Detection**: Group `["query", "page"]` results by query; flag queries with 2+ distinct pages.

| Severity | Criteria |
|----------|----------|
| High | Top 2 pages have similar impressions (within 30%) |
| Medium | Secondary page has > 50 impressions |
| Low | Secondary page has < 50 impressions |

**Resolution options**: Merge content (same topic), add canonical (clear primary page), differentiate focus (different intents).

**SERP Arbiter** (with SerpAPI): For top 5 cannibalized queries, check live SERP to determine which page Google prefers and infer intent from SERP features. See [../seo-analysis/references/intent-classification.md](../seo-analysis/references/intent-classification.md) for SERP feature → intent mapping.

### Device & Country Analysis

- **Device**: Queries where mobile position is 5+ worse than desktop suggest mobile UX issues. High mobile impressions with low CTR suggest mobile snippet issues.
- **Country**: Identifies market-specific keyword opportunities and localization needs. Use ISO 3166-1 alpha-3 codes (`usa`, `jpn`, `gbr`, `deu`).

### Zero-Click Query Identification

Queries with impressions > 200 and clicks = 0. Root cause classification requires SerpAPI — see [../seo-analysis/references/zero-click-strategy.md](../seo-analysis/references/zero-click-strategy.md) for the Type A/B/C/D framework.

### CTR Impact Scoring

Distinguishes content problems from SERP feature absorption using position-based baseline CTR and SERP feature penalty coefficients. Full model in [references/ctr-scoring.md](references/ctr-scoring.md).

### Index Health

Check via `list_sitemaps` → `get_sitemap` (compare submitted vs indexed counts) → `inspect_url` for problem pages.

| Signal | Issue |
|--------|-------|
| Submitted >> Indexed | Many pages not indexed — investigate with URL Inspection |
| No sitemap | Recommend creating and submitting one |
| Coverage verdict: excluded | Check exclusion reason (noindex, redirect, crawl error) |

### Topical Authority Mapping

Cluster GSC queries by keyword stems, calculate per-cluster metrics, then cross-reference with SerpAPI Knowledge Graph data. Full algorithm and authority level classification in [references/topical-clustering.md](references/topical-clustering.md).

## Output Specification — GSC Performance Report

```markdown
## GSC Analysis Report: [domain]

**Period**: YYYY-MM-DD to YYYY-MM-DD

### Performance Summary

| Metric | Value |
|--------|-------|
| Total queries | X |
| Total pages | X |
| Average position | X.X |
| Total impressions | X |
| Total clicks | X |
| Average CTR | X.X% |

### Quick Wins
[Position 8-20, impressions > 100, prioritized High/Medium/Low]

### CTR Opportunities
[Impressions > 500, CTR < 2%, with suggested title/meta improvements]

### Trending Keywords
[Rising and falling keywords with position delta]

### Keyword Cannibalization
[Queries with 2+ competing pages, severity, resolution recommendation]
[+ SERP Arbiter results if SerpAPI available]

### Device Performance
[Desktop vs mobile position gaps, mobile-specific issues]

### Country Breakdown
[Top countries, market-specific opportunities]

### Zero-Click Queries
[High-impression zero-click queries with root cause classification if SerpAPI available]

### CTR Impact Scores
[Content Problem vs SERP Feature Absorption diagnosis — requires SerpAPI]

### Index Health
[Sitemap coverage, indexing issues, URL inspection results]

### Topical Authority Map
[Cluster authority levels with recommended actions — requires SerpAPI]

### Recommended Next Steps
1. [Highest impact action with specific keyword/page]
2. [Second priority]
3. [Third priority]
```

## Related Skills

- **seo-analysis** — Add live SERP context and AEO scoring to GSC data; produces prescriptive action plans
- **competitor-analysis** — Compare GSC performance against competitor page structures
