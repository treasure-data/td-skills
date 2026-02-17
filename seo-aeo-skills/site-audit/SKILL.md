---
name: site-audit
description: Audit a website for SEO and AEO (Answer Engine Optimization) readiness using Google Search Console data, Playwright browser analysis, Python-based HTML signal extraction, and SerpAPI live SERP data. Produces an AEO score (0-100) across 6 dimensions including SERP Alignment. Use when users want to evaluate page structure for AI citation readiness, find quick-win keywords from GSC, check structured data and content structure, or get actionable optimization recommendations.
---

# SEO/AEO Site Audit

Combine Google Search Console analytics with playwright-cli browser analysis and Python-based HTML extraction to produce an actionable AEO readiness report.

## Tool Availability Check

Before starting, verify SerpAPI is available: `ToolSearch { "query": "select:mcp__tdx-studio__serpapi_google_search", "max_results": 1 }`. If available, use it for all SerpAPI steps below. If not, skip SerpAPI-dependent steps.

## Prerequisites

- Google Search Console connected (provides `google_search_console_*` MCP tools)
- `playwright-cli` skill loaded (provides `playwright-cli` CLI commands). If not installed: `npm install -g @playwright/cli@latest`
- Python 3 available (for HTML signal extraction script)
- Optionally: SerpAPI connected (provides `serpapi_google_search` MCP tool) for live SERP context and competition analysis

## Glossary

Technical terms should be annotated on first use in the output report with a parenthetical explanation. For the full glossary, see [../references/glossary.md](../references/glossary.md).

## Audit Workflow

### Step 1: GSC data collection

Run the **gsc-analytics** skill's Steps 1-4 to collect keyword and page performance data:

1. Identify the target site (`google_search_console_list_sites`)
2. Pull performance data for the last 28 days with dimensions `["query", "page"]` and `row_limit: 5000`
3. Extract **Quick Wins** — Position 8-20 (striking distance keywords close to page 1), impressions > 100
4. Extract **CTR Opportunities** — Impressions > 500 but CTR (click-through rate) < 2%

See [../gsc-analytics/references/gsc-query-patterns.md](../gsc-analytics/references/gsc-query-patterns.md) for query patterns and filtering details.

> **Large result handling**: GSC responses (5,000 rows) exceed 256KB. Never read the entire file at once. Use `jq` filters or `Read` with `offset/limit` to extract data. See gsc-analytics Step 2 for `jq` examples.

### Step 2: Select pages for deep analysis

From Step 1, pick 3-5 pages prioritizing:
1. Quick Win pages (highest potential ROI)
2. CTR Opportunity pages (high visibility, low engagement)
3. Key landing pages the user wants audited

### Step 3: Open page in playwright-cli

```bash
playwright-cli open <page_url>
```

### Step 4: Snapshot for structure analysis

```bash
playwright-cli snapshot
```

Review the YAML accessibility tree for:
- Heading hierarchy (H1 → H2 → H3 nesting)
- Navigation structure
- Content section organization

### Step 5: Screenshot for visual analysis

```bash
playwright-cli screenshot
```

Analyze:
- First-view information density
- CTA (call-to-action) placement and visibility
- Layout issues and content readability
- Mobile responsiveness indicators

### Step 6: Extract SEO/AEO signals with Python

Get the full HTML content and pass it to the extraction script:

```bash
playwright-cli run-code "async page => { return await page.content(); }" > /tmp/page.html
python3 seo-aeo-skills/scripts/extract_seo_signals.py /tmp/page.html --url <page_url>
```

The script outputs JSON with all SEO/AEO signals (run with `--help` for full field list):
- Title, meta description, Open Graph (title, description, image), Twitter card, canonical URL
- Heading hierarchy with question detection
- JSON-LD structured data, schema types, and entity properties (sameAs, about, mainEntity, author)
- BLUF (Bottom Line Up Front) analysis per H2 section with pattern classification (definition/number/verdict/step/yesno)
- Content metrics: word count, lists, tables, images (with alt text analysis)
- Link counts: internal and external, with internal link anchor texts

Use `--fields` to extract only specific signals (e.g., `--fields schema_types,bluf_analysis,entity_properties`).

> **Note on playwright-cli eval**: Use `eval` only for simple single-value extraction (e.g., `document.title`). For complex multi-signal extraction, always use the Python script approach above to avoid shell escaping issues.

### Step 7: Repeat for additional pages

For subsequent pages, navigate without reopening:

```bash
playwright-cli goto <next_url>
playwright-cli snapshot
playwright-cli screenshot
playwright-cli run-code "async page => { return await page.content(); }" > /tmp/page.html
python3 seo-aeo-skills/scripts/extract_seo_signals.py /tmp/page.html --url <page_url>
```

Close the browser when done with all pages:

```bash
playwright-cli close
```

### Step 8: SERP context analysis (optional, requires SerpAPI)

If SerpAPI is connected, check the live SERP for the top keywords associated with each audited page (from GSC data in Step 1):

```
serpapi_google_search
  query: "<top keyword for this page>"
  num: 10
  gl: "<user's market>"
```

For each page, document:
- **SERP features**: What features appear (answer box, AI Overview, knowledge graph, PAA, local pack)?
- **AI Overview references**: If `aiOverview.references` is present, check if the audited page is cited as a source. Note which competitors are cited.
- **Competition**: Who ranks above this page? What content format do they use?
- **Answer box opportunity**: If no answer box exists, this page could capture it with BLUF optimization
- **PAA alignment**: Do the page's headings match the PAA questions? Mismatches are content gaps

This SERP context informs the AEO scoring (Dimension 6: SERP Alignment) — a page scoring well on structure but competing against an answer box needs different priorities than one competing against standard organic results.

### Step 9: AEO scoring

Score each page using the **AEO Scoring Model** (see [references/aeo-scoring.md](references/aeo-scoring.md)) across 6 dimensions:

1. **Content Structure** (22 points): BLUF presence, paragraph optimization, question headings, lists/tables, article length
2. **Structured Data** (22 points): JSON-LD presence, FAQPage schema, Article/Author schema, additional schemas, schema stacking
3. **E-E-A-T Signals** (18 points): Author information, Organization schema, citations/sources, date freshness
4. **AI Readability** (18 points): Direct answer blocks, section self-containment, FAQ/Q&A patterns, summary/TL;DR
5. **Technical AEO** (5 points): Meta description, canonical tag, Open Graph tags, mobile usability
6. **SERP Alignment** (15 points): Answer Box format match, PAA coverage, schema density vs top 3, SERP feature fitness. Requires SerpAPI — if not connected, score out of 85 and note the limitation.

### Step 10: Present the report

Output format:

```
## AEO Audit Report: example.com

### Overall AEO Score: 68/100

| Dimension          | Score | Grade |
|--------------------|-------|-------|
| Content Structure  | 16/22 | B     |
| Structured Data    | 12/22 | C     |
| E-E-A-T Signals    | 14/18 | B     |
| AI Readability     | 14/18 | B     |
| Technical AEO      | 3/5   | C     |
| SERP Alignment     | 9/15  | C     |

### Quick Wins from GSC (Striking Distance Keywords)
| Keyword | Position | Impressions | Page | Action |
|---------|----------|-------------|------|--------|
| ...     | 11       | 1,200       | /... | Add FAQ schema, rewrite intro |

### CTR Opportunities
| Keyword | Impressions | CTR  | Action |
|---------|-------------|------|--------|
| ...     | 3,400       | 0.9% | Rewrite title tag |

### SERP Context (if SerpAPI available)
| Keyword | SERP Features | Answer Box Owner | PAA Match | Opportunity |
|---------|---------------|------------------|-----------|-------------|
| ...     | Answer Box, PAA | competitor.com | 2/5 questions | Capture answer box with BLUF |

### Page-Level Findings
[Per-page breakdown with specific recommendations]

### Priority Actions
1. [Highest impact action]
2. [Second priority]
3. [Third priority]
```

### Step 11: URL Inspection (optional)

For pages with indexing concerns, use URL Inspection:

```
google_search_console_inspect_url
  site_url: "sc-domain:example.com"
  inspection_url: "https://example.com/page"
```

Check: index verdict, mobile usability issues, rich results status.

## Related Skills

- **gsc-analytics**: Comprehensive GSC data analysis (keyword trends, cannibalization, device/country breakdown)
- **competitor-analysis**: Compare page structure against competitor pages
- **content-brief**: Generate optimization plans based on audit findings
