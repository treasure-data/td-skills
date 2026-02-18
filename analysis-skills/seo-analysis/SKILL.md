---
name: seo-analysis
description: "Use this skill when the user wants a comprehensive SEO or AEO (Answer Engine Optimization) audit of their website or specific pages. Trigger on requests like 'analyze SEO', 'AEO score', 'SEO audit', 'optimize for AI search', 'improve rankings', or 'why is my page not ranking'. Combines Google Search Console, SerpAPI, Playwright, and GA4 to produce an interactive grid-dashboard with KPIs, AEO scores, keyword tables, and actionable before/after recommendations."
---

# SEO & AEO Analysis

Produce a prescriptive action plan — specific before→after content changes with reasoning — by combining keyword performance, live SERP context, on-page structure extraction, and user behavior data. The **dashboard layout** (see Dashboard Output) defines what data to collect.

## CRITICAL: Create a Task List First

**Before doing ANY analysis, create a Task list.** Break down the analysis into concrete steps based on available tools and dashboard fields to populate.

Example tasks:
- List GSC sites and confirm target with user
- Pull GSC keyword + page performance data (current + prior period)
- Identify target pages, Quick Win candidates, cannibalization
- Run SerpAPI for high-priority keywords (SERP features, drift, organic results)
- Extract target page with Playwright (headings, schema, content, links, images)
- Scrape top 5 competitor pages with Playwright
- Pull GA4 behavior metrics for target pages
- Calculate AEO + On-Page/Technical SEO scores
- Build internal linking strategy + recommended content outline
- Synthesize: CTR impact, zero-click diagnosis, recommendations with before→after
- Write grid-dashboard YAML **page by page** (one page at a time)
- Call `preview_grid_dashboard` after each page is added
- Ask user which page to show redline preview for

## Getting Started

Do NOT ask the user which site to analyze. Call `google_search_console_list_sites` to discover registered properties, then present the list for selection (auto-select if only one).

## Tools

### Google Search Console (`google_search_console_*`)

Keyword performance data — the foundation of the analysis.

- `list_sites` — discover properties (prefer `sc-domain:` format)
- `query_analytics` — keyword/page performance with dimensions and filters
- Data has **~3-day delay**: set `end_date` to 3 days before today
- Standard window: 28 days. Large results (5,000 rows) can exceed 256KB — use `jq`, `Grep`, or `Read` with offset/limit
- Use `dimensions: ["query", "page"]` for keyword→page mapping

### SerpAPI (`serpapi_google_search`)

Live SERP features, position drift, zero-click root cause diagnosis.

**Availability check** (required before use):
```
ToolSearch { "query": "select:mcp__tdx-studio__serpapi_google_search", "max_results": 1 }
```

Call for each high-priority keyword from GSC: `serpapi_google_search({ q: "...", gl: "us", hl: "en" })`. Extract `answer_box`, `ai_overview`, `people_also_ask`, `knowledge_graph`, `organic_results`, `shopping_results`, `local_results`.

### Playwright (`playwright-cli`)

On-page structure extraction — **required for AEO scoring and before→after recommendations**.

```bash
playwright-cli install --skills                    # setup (once per session)
playwright-cli open <url>                          # open page
playwright-cli run-code "async page => {           # extract HTML
  const html = await page.content(); return html;
}" > ./seo/page.html
```

Extract from HTML: headings (H1-H6), BLUF analysis (first paragraph after each H2), JSON-LD schemas, word count, internal/external links with anchor text, meta tags, author info, date signals, images with alt text.

For competitor analysis, scrape top 5 organic results from SerpAPI using the same extraction pattern. Use `playwright-cli goto <url>` for subsequent pages (not `open`).

### Google Analytics (`google_analytics_*`)

User behavior data — engagement, bounce rate, conversions per page. Use for monitoring baselines and behavioral context for recommendations.

## Dashboard Output

Write results as a **paged grid-dashboard YAML** and call `preview_grid_dashboard`. See **grid-dashboard** skill for cell type reference.

### Build YAML Page by Page

The YAML is **one file per site** with analyzed pages as keys under `pages:`. Each page has a 4×16 grid — too large to write in a single pass.

1. Write `pages:` header + first page's complete grid/cells
2. Call `preview_grid_dashboard` to verify rendering
3. Append additional pages to the same file
4. Call `preview_grid_dashboard` again to refresh

### Page Grid Layout (4×16 per page)

| Row | Cells | Type | Content | Source |
|-----|-------|------|---------|--------|
| 1 | 1-1, 1-2, 1-3, 1-4 | `kpi` × 4 | Impressions, Clicks, Avg CTR, Avg Position | GSC |
| 2 | 2-1 | `gauge` | AEO Score (value/100, grade label) | Playwright |
| 2 | 2-2 to 2-4 (merged) | `scores` | AEO 5-dimension breakdown (Content Structure, Structured Data, E-E-A-T, AI Readability, Technical AEO) | Playwright |
| 3 | 3-1 to 3-2 (merged) | `scores` | On-Page SEO (title, meta, headings, internal links, content depth, visual content) | Playwright |
| 3 | 3-3 to 3-4 (merged) | `scores` | Technical SEO (HTTPS, canonical, structured data, mobile, page speed) | Playwright |
| 4 | 4-1 to 4-4 (merged) | `table` | Competitor Content Patterns — top 5 SERP winners (headings, word count, format, visuals, schemas) | SerpAPI + Playwright |
| 5 | 5-1 to 5-4 (merged) | `table` | Topical Authority clusters (cluster, queries, pages, avg position, page-1 rate, level) | GSC |
| 6 | 6-1 to 6-4 (merged) | `table` | Quick Wins — keywords near page 1 (position 8-20, high impressions) | GSC |
| 7 | 7-1 to 7-4 (merged) | `table` | All Keywords + SERP features + drift | GSC + SerpAPI |
| 8 | 8-1 to 8-2 (merged) | `table` | Trending Up — keywords with improving position | GSC |
| 8 | 8-3 to 8-4 (merged) | `table` | Declining — keywords losing position | GSC |
| 9 | 9-1 to 9-4 (merged) | `table` | Keyword Cannibalization — same query ranking on multiple pages | GSC |
| 10 | 10-1 to 10-4 (merged) | `table` | Zero-Click Queries with type and remediation | GSC + SerpAPI |
| 11 | 11-1 to 11-4 (merged) | `table` | Internal Linking Strategy — recommended links with anchor text and rationale | Playwright + GSC |
| 12-13 | 12-1 to 13-4 (merged) | `markdown` | Recommendations with before→after diffs | All |
| 14 | 14-1 to 14-4 (merged) | `markdown` | Recommended Content Outline — heading structure matching SERP winners + LLM citation patterns | SerpAPI + Playwright |
| 15 | 15-1 to 15-4 (merged) | `markdown` | Topical Authority strategy — expand/defend/build recommendations | GSC |
| 16 | 16-1 to 16-4 (merged) | `markdown` | Monitoring & Iteration (metrics, timeline, 2-3 month review cadence) | GA4 + GSC |

### YAML Structure

```yaml
pages:
  "https://example.com/blog/cdp-guide":
    title: "What is a CDP? Complete Guide"
    description: "Analyzed 2026-02-18 (28-day window)"
    grid:
      columns: 4
      rows: 16
    cells:
      - pos: "1-1"
        type: kpi
        title: "Impressions"
        kpi: { value: "45,000", change: "+8.2%", trend: up, subtitle: "vs. prior 28 days" }
      # ... remaining cells follow the layout table above

  "https://example.com/products/cdp":
    title: "CDP Product Page"
    grid: { columns: 4, rows: 16 }
    cells: [...]
```

Full template with all 16 rows: [references/dashboard-template.yaml](references/dashboard-template.yaml)

### Rendering

```
preview_grid_dashboard({ file_path: "./seo/seo-dashboard-{domain}.yaml" })
```

**Column conventions**: SERP features: `AB` `AI` `PAA` `KG` `LP` `SH`. Drift: `Stable (0)`, `Rising (-2)`, `Declining (+4)`, `Crash (+8)`, `Surge (-6)`.

## References

Read these files as needed during analysis. Do not load all at once.

| Reference | When to read | Path |
|-----------|-------------|------|
| AEO Scoring rubric | Calculating AEO scores (5 dimensions, 100 pts) | [references/aeo-scoring.md](references/aeo-scoring.md) |
| BLUF Writing Patterns | Writing before→after recommendations | [references/bluf-patterns.md](references/bluf-patterns.md) |
| Intent Classification | Mapping SERP features to content format | [references/intent-classification.md](references/intent-classification.md) |
| Zero-Click Strategy | Classifying zero-click queries (Type A/B/C/D) | [references/zero-click-strategy.md](references/zero-click-strategy.md) |
| Platform Citations | AI platform-specific optimization | [references/platform-citations.md](references/platform-citations.md) |
| Dashboard Template | Full 16-row YAML template per page | [references/dashboard-template.yaml](references/dashboard-template.yaml) |
| CTR Impact Scoring | Baseline CTR + SERP penalty calculation | [../gsc-analysis/references/ctr-scoring.md](../gsc-analysis/references/ctr-scoring.md) |
| Topical Clustering | Cluster algorithm + authority levels | [../gsc-analysis/references/topical-clustering.md](../gsc-analysis/references/topical-clustering.md) |
| GSC Query Patterns | GSC API call patterns + jq filters | [../gsc-analysis/references/gsc-query-patterns.md](../gsc-analysis/references/gsc-query-patterns.md) |

## Redline Preview

After the user reviews the dashboard and selects a page for detailed edits:

1. **Download HTML** with Playwright: `playwright-cli open <url>` → save rendered HTML
2. **Apply redline edits** from recommendations: `<del>` (red strikethrough) + `<ins>` (green underline)
3. **Show preview**: `preview_document({ file_path: "./seo/redline-{slug}.html" })`

## Fallback Output (CLI / No Dashboard)

When `preview_grid_dashboard` is not available, output a markdown action plan:

```markdown
## SEO/AEO Analysis: [domain or page]

### Summary
[3-5 sentences: current state, biggest opportunities, estimated impact]

### AEO Score: XX/100

| Dimension | Score | Max | Key gap |
|-----------|-------|-----|---------|
| Content Structure | X | 26 | [gap] |
| Structured Data | X | 26 | [gap] |
| E-E-A-T Signals | X | 21 | [gap] |
| AI Readability | X | 21 | [gap] |
| Technical AEO | X | 6 | [gap] |

### Recommended Changes

#### 1. [Change title] — Impact: High
**Location**: [specific H2 or element]
> **Before**: [actual current text]
> **After**: [rewritten text]
**Reason**: [cite SERP data or scoring dimension]

### Quick Wins Summary
| Keyword | Position | Impressions | SERP Features | Action |
|---------|----------|-------------|---------------|--------|

### Zero-Click Diagnosis
| Query | Impressions | Type | Root Cause | Recommended Change |
|-------|-------------|------|------------|-------------------|

### Monitoring
[Metrics to watch. Timeline: title/meta 2-4 weeks, content 4-8 weeks, schema 2-6 weeks.]
```

## Related Skills

- **grid-dashboard** — Grid dashboard YAML format reference (cell types, layout, merging)
- **gsc-analysis** — Deep GSC data analysis: Quick Wins, trends, cannibalization, device/country breakdown
- **competitor-analysis** — SERP-based competitor discovery and structural comparison
