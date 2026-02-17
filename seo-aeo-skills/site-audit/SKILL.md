---
name: site-audit
description: Audit a website for SEO and AEO (Answer Engine Optimization) readiness using Google Search Console data, Playwright browser analysis, and Python-based HTML signal extraction. Produces an AEO score (0-100) across 5 dimensions. Use when users want to analyze their site's visibility in AI search engines (Google AI Overview, Perplexity, ChatGPT Search), find quick-win keywords from GSC, check structured data and content structure, or get actionable optimization recommendations.
---

# SEO/AEO Site Audit

Combine Google Search Console analytics with playwright-cli browser analysis and Python-based HTML extraction to produce an actionable AEO readiness report.

## Prerequisites

- Google Search Console connected (provides `google_search_console_*` MCP tools)
- `playwright-cli` skill loaded (provides `playwright-cli` CLI commands). If not installed: `npm install -g @playwright/cli@latest`
- Python 3 available (for HTML signal extraction script)

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
python3 seo-aeo-skills/scripts/extract_seo_signals.py /tmp/page.html
```

The script outputs JSON with all SEO/AEO signals:
- Title, meta description, Open Graph, canonical URL
- Heading hierarchy with question detection
- JSON-LD structured data and schema types
- BLUF (Bottom Line Up Front) analysis per H2 section
- Content metrics: word count, lists, tables, images
- Link counts: internal and external

> **Note on playwright-cli eval**: Use `eval` only for simple single-value extraction (e.g., `document.title`). For complex multi-signal extraction, always use the Python script approach above to avoid shell escaping issues.

### Step 7: Repeat for additional pages

For subsequent pages, navigate without reopening:

```bash
playwright-cli goto <next_url>
playwright-cli snapshot
playwright-cli screenshot
playwright-cli run-code "async page => { return await page.content(); }" > /tmp/page.html
python3 seo-aeo-skills/scripts/extract_seo_signals.py /tmp/page.html
```

Close the browser when done with all pages:

```bash
playwright-cli close
```

### Step 8: AEO scoring

Score each page using the **AEO Scoring Model** (see [references/aeo-scoring.md](references/aeo-scoring.md)) across 5 dimensions:

1. **Content Structure** (25 points): BLUF presence, paragraph optimization, question headings, lists/tables, article length
2. **Structured Data** (25 points): JSON-LD presence, FAQPage schema, Article/Author schema, additional schemas, schema stacking
3. **E-E-A-T Signals** (20 points): Author information, Organization schema, citations/sources, date freshness
4. **AI Readability** (20 points): Direct answer blocks, section self-containment, FAQ/Q&A patterns, summary/TL;DR
5. **Technical AEO** (10 points): Meta description, canonical tag, Open Graph tags, mobile usability

### Step 9: Present the report

Output format:

```
## AEO Audit Report: example.com

### Overall AEO Score: 62/100

| Dimension          | Score | Grade |
|--------------------|-------|-------|
| Content Structure  | 18/25 | B     |
| Structured Data    | 10/25 | D     |
| E-E-A-T Signals    | 14/20 | B     |
| AI Readability     | 15/20 | B     |
| Technical AEO      | 5/10  | C     |

### Quick Wins from GSC (Striking Distance Keywords)
| Keyword | Position | Impressions | Page | Action |
|---------|----------|-------------|------|--------|
| ...     | 11       | 1,200       | /... | Add FAQ schema, rewrite intro |

### CTR Opportunities
| Keyword | Impressions | CTR  | Action |
|---------|-------------|------|--------|
| ...     | 3,400       | 0.9% | Rewrite title tag |

### Page-Level Findings
[Per-page breakdown with specific recommendations]

### Priority Actions
1. [Highest impact action]
2. [Second priority]
3. [Third priority]
```

### Step 10: URL Inspection (optional)

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
