---
name: site-audit
description: Audit a website for SEO and AEO (Answer Engine Optimization) readiness using Google Search Console data and Playwright browser analysis. Produces an AEO score (0-100) across 5 dimensions. Use when users want to analyze their site's visibility in AI search engines (Google AI Overview, Perplexity, ChatGPT Search), find quick-win keywords from GSC, check structured data and content structure, or get actionable optimization recommendations.
---

# SEO/AEO Site Audit

Combine Google Search Console analytics with playwright-cli browser analysis to produce an actionable AEO readiness report.

## Prerequisites

- Google Search Console connected (provides `google_search_console_*` MCP tools)
- `playwright-cli` skill loaded (provides `playwright-cli` CLI commands)

## Audit Workflow

### Step 1: Identify the target site

Ask the user for the site URL. If unknown, list available sites:

```
google_search_console_list_sites
```

### Step 2: Pull GSC performance data (last 28 days)

Query search analytics with `query` and `page` dimensions:

```
google_search_console_query_analytics
  site_url: "sc-domain:example.com"
  start_date: <28 days ago, YYYY-MM-DD>
  end_date: <3 days ago, YYYY-MM-DD>  # GSC data is delayed ~3 days
  dimensions: ["query", "page"]
  row_limit: 5000
```

From the results, extract:

1. **Quick Wins** — Position 8-20, impressions > 100. These are close to page 1 and worth optimizing.
2. **CTR Opportunities** — Impressions > 500 but CTR < 2%. Title/description likely needs rewriting.
3. **Winners** — Position improved vs prior period (run a second query for comparison).
4. **Losers** — Position dropped vs prior period.

### Step 3: Select top pages for deep analysis

Pick 3-5 pages from Step 2 (prioritize Quick Wins and CTR Opportunities). For each page, run Playwright analysis.

### Step 4: playwright-cli page analysis

For each selected page, open the browser and navigate:

```bash
playwright-cli open <page_url>
```

Take a snapshot to see the page structure:

```bash
playwright-cli snapshot
```

Then extract SEO/AEO signals using `eval`:

```bash
playwright-cli eval "JSON.stringify((() => {
  const headings = Array.from(document.querySelectorAll('h1,h2,h3,h4'))
    .map(h => ({ tag: h.tagName, text: h.textContent.trim().substring(0, 120) }));

  const jsonLd = Array.from(document.querySelectorAll('script[type=\"application/ld+json\"]'))
    .map(s => { try { return JSON.parse(s.textContent); } catch { return null; } })
    .filter(Boolean);

  const metaDesc = document.querySelector('meta[name=\"description\"]')?.content || '';
  const ogTitle = document.querySelector('meta[property=\"og:title\"]')?.content || '';
  const canonical = document.querySelector('link[rel=\"canonical\"]')?.href || '';

  const h2s = Array.from(document.querySelectorAll('h2'));
  const blufAnalysis = h2s.slice(0, 5).map(h2 => {
    let next = h2.nextElementSibling;
    while (next && next.tagName !== 'P' && next.tagName !== 'H2') next = next.nextElementSibling;
    const firstPara = (next?.tagName === 'P') ? next.textContent.trim().substring(0, 200) : '';
    return { heading: h2.textContent.trim(), firstPara, wordCount: firstPara.split(/\\s+/).length };
  });

  const bodyText = document.body.innerText;
  return {
    title: document.title, metaDesc, ogTitle, canonical,
    wordCount: bodyText.split(/\\s+/).length,
    headings,
    jsonLd: jsonLd.map(j => j['@type'] || 'Unknown'),
    hasFAQ: jsonLd.some(j => JSON.stringify(j).includes('FAQPage')),
    hasHowTo: jsonLd.some(j => JSON.stringify(j).includes('HowTo')),
    hasArticle: jsonLd.some(j => JSON.stringify(j).includes('Article')),
    hasSpeakable: jsonLd.some(j => JSON.stringify(j).includes('Speakable')),
    hasBreadcrumb: jsonLd.some(j => JSON.stringify(j).includes('BreadcrumbList')),
    blufAnalysis,
    lists: document.querySelectorAll('ul, ol').length,
    tables: document.querySelectorAll('table').length,
  };
})(), null, 2)"
```

Optionally, take a screenshot for visual reference:

```bash
playwright-cli screenshot
```

Close the browser when done with all pages:

```bash
playwright-cli close
```

### Step 5: Score and report

Score each page using the **AEO Scoring Model** (see [references/aeo-scoring.md](references/aeo-scoring.md)) across 5 dimensions:

1. Content Structure (25%)
2. Structured Data (25%)
3. E-E-A-T Signals (20%)
4. AI Readability (20%)
5. Technical AEO (10%)

### Step 6: Present the report

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

### Quick Wins from GSC
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

## URL Inspection (Optional)

For pages with indexing issues, use URL Inspection:

```
google_search_console_inspect_url
  site_url: "sc-domain:example.com"
  inspection_url: "https://example.com/page"
```

Check: index verdict, mobile usability issues, rich results status.
