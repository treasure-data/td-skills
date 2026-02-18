---
name: gsc-analysis
description: "Use this skill when the user wants to analyze Google Search Console data. Trigger on requests like 'GSC analysis', 'keyword performance', 'search console report', 'quick wins', 'keyword cannibalization', 'zero-click queries', or 'index health'. Identifies ranking opportunities, CTR gaps, trending keywords, and content issues from GSC data. Also used as the data foundation for seo-analysis and competitor-analysis skills."
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

## Outputs

Produce **two separate outputs**: a data dashboard and an action report. The dashboard presents facts and current state only. The action report provides specific, concrete recommendations. Never mix the two — keep data and actions cleanly separated.

### Output 1: Data Dashboard

Render an interactive dashboard via `preview_grid_dashboard`. See **grid-dashboard** skill for YAML format, cell types, and layout rules.

Design the grid layout flexibly based on available data and what the user asked for. Use KPIs for headline metrics, tables for keyword lists, charts for trends, and scores for breakdowns. Example sections to include (adapt as needed):

- **KPIs**: Total impressions, clicks, avg CTR, avg position (with period-over-period change)
- **Quick Wins table**: Position 8-20 keywords with high impressions
- **Trending / Declining tables**: Keywords with significant position changes
- **Cannibalization table**: Queries competing across multiple pages
- **Zero-Click table**: High-impression zero-click queries with type classification
- **Device / Country breakdown**: Position gaps across segments
- **Topical Authority table**: Cluster metrics and authority levels
- **Index Health**: Sitemap coverage, indexing issues

The dashboard shows **data and analysis only** — no recommendations, no "you should do X" statements.

### Output 2: Action Report

After the dashboard, output a **markdown action report** saved as `./seo/gsc-action-report-{domain}.md`. This is where all recommendations go — specific, concrete, and prioritized.

Structure:

```markdown
# GSC Action Report: [domain]

**Period**: YYYY-MM-DD to YYYY-MM-DD

## Quick Win Actions
[For each quick-win keyword: specific page to optimize, what to change, expected position improvement]

## CTR Improvement Actions
[For each CTR opportunity: current title/meta, recommended replacement, expected CTR lift]

## Cannibalization Resolution
[For each cannibalized query: which page to keep as primary, what to do with secondary pages (merge/canonical/differentiate)]

## Content Refresh Priorities
[Declining keywords: specific content changes needed to recover positions]

## Device/Country-Specific Fixes
[Mobile UX issues, localization opportunities with specific actions]

## Index Health Fixes
[Pages to resubmit, noindex tags to remove, redirects to fix]

## Topical Authority Strategy
[Clusters to expand, new content to create, internal linking recommendations]

## Implementation Priority
### High Priority (1-2 weeks)
1. [action] — [reason]

### Medium Priority (2-4 weeks)
2. [action]

### Low Priority (1+ month)
3. [action]
```

### Fallback (No Dashboard)

When `preview_grid_dashboard` is not available, combine both outputs into a single markdown report with a data summary table at the top followed by the action sections.

## Related Skills

- **grid-dashboard** — Grid dashboard YAML format reference (cell types, layout, merging)
- **seo-analysis** — Add live SERP context and AEO scoring to GSC data; produces prescriptive action plans
- **competitor-analysis** — Compare GSC performance against competitor page structures
