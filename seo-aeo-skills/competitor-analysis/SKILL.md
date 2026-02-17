---
name: competitor-analysis
description: Analyze competitor web pages for SEO/AEO structure using Playwright browser automation. Extracts heading hierarchy, structured data (JSON-LD), meta tags, content metrics, and BLUF patterns. Use when users want to compare their page against competitors, find content gaps, understand why a competitor ranks higher, or reverse-engineer a competitor's AEO strategy.
---

# Competitor Page Analysis

Use Playwright MCP tools to extract and analyze the AEO-relevant structure of competitor pages, then compare against the user's own page.

## Prerequisites

- Playwright MCP available (provides `browser_*` tools)
- Optionally: Google Search Console connected for the user's own site data

## Analysis Workflow

### Step 1: Collect URLs

Ask the user for:
1. **Their page URL** (the page to improve)
2. **1-3 competitor URLs** (pages ranking above them for the target keyword)

If the user only has a keyword, use GSC to find their ranking page, then suggest they provide competitor URLs manually.

### Step 2: Extract page data

For each URL (user's page + competitors), navigate and extract:

```
browser_navigate  url: "<url>"
```

```
browser_evaluate  expression: |
  (() => {
    const h = (sel) => Array.from(document.querySelectorAll(sel));

    // Heading structure
    const headings = h('h1,h2,h3,h4').map(el => ({
      tag: el.tagName,
      text: el.textContent.trim().substring(0, 120),
      isQuestion: /\?$|^(what|how|why|when|where|who|which|can|do|does|is|are|should)/i.test(el.textContent.trim()),
    }));

    // JSON-LD schemas
    const jsonLd = h('script[type="application/ld+json"]')
      .map(s => { try { return JSON.parse(s.textContent); } catch { return null; } })
      .filter(Boolean);
    const schemaTypes = jsonLd.map(j => j['@type'] || 'Unknown');

    // Meta tags
    const meta = (name) => document.querySelector(`meta[name="${name}"]`)?.content || '';
    const og = (prop) => document.querySelector(`meta[property="og:${prop}"]`)?.content || '';

    // Content metrics
    const bodyText = document.body.innerText;
    const words = bodyText.split(/\s+/).length;

    // BLUF analysis: first paragraph after each H2
    const bluf = h('h2').slice(0, 8).map(el => {
      let next = el.nextElementSibling;
      while (next && !['P','UL','OL','TABLE'].includes(next.tagName) && next.tagName !== 'H2') {
        next = next.nextElementSibling;
      }
      const text = (next && next.tagName !== 'H2') ? next.textContent.trim().substring(0, 250) : '';
      return {
        heading: el.textContent.trim(),
        firstContent: text,
        wordCount: text.split(/\s+/).length,
        startsWithAnswer: /^[A-Z].*\b(is|are|means|refers|provides|includes|offers)\b/i.test(text),
      };
    });

    // Internal/external link counts
    const links = h('a[href]');
    const internal = links.filter(a => a.hostname === location.hostname).length;
    const external = links.filter(a => a.hostname !== location.hostname && a.href.startsWith('http')).length;

    return {
      url: location.href,
      title: document.title,
      metaDesc: meta('description'),
      ogTitle: og('title'),
      wordCount: words,
      headings,
      schemaTypes,
      hasFAQ: schemaTypes.some(t => t === 'FAQPage'),
      hasHowTo: schemaTypes.some(t => t === 'HowTo'),
      hasArticle: schemaTypes.some(t => t === 'Article' || t === 'BlogPosting'),
      bluf,
      lists: h('ul,ol').length,
      tables: h('table').length,
      images: h('img').length,
      internalLinks: internal,
      externalLinks: external,
    };
  })()
```

### Step 3: Compare and identify gaps

Build a comparison table:

```
## Structure Comparison

| Signal              | Your Page     | Competitor A  | Competitor B  |
|---------------------|---------------|---------------|---------------|
| Word Count          | 1,200         | 2,400         | 1,800         |
| H2 Sections         | 4             | 8             | 6             |
| Question Headings   | 0             | 5             | 3             |
| JSON-LD Types       | Article       | Article, FAQ  | Article, HowTo|
| FAQ Schema          | No            | Yes           | No            |
| BLUF Sections       | 1/4           | 6/8           | 4/6           |
| Lists               | 2             | 8             | 5             |
| Tables              | 0             | 2             | 1             |
| External Citations  | 1             | 7             | 4             |
```

### Step 4: Heading gap analysis

Compare heading topics:

```
## Content Gap Analysis

### Topics competitors cover that you don't:
- "How much does X cost?" (Competitor A, H2)
- "X vs Y comparison" (Competitor B, H2)
- "Common mistakes" (Both competitors, H2)

### Your unique topics (keep these):
- "Case study: ..." (Your page, H2)

### Heading structure recommendations:
1. Add H2: "How much does [topic] cost?" — both competitors cover pricing
2. Add H2: "[Topic] vs [Alternative]: Which is better?" — comparison tables get cited by AI
3. Convert "Our Services" → "What [services] do we offer?" — question format for AEO
```

### Step 5: AEO-specific recommendations

Provide prioritized recommendations:

```
## Priority Actions

### High Impact (do first)
1. **Add FAQ schema** — Competitor A has it, you don't. Most impactful for AI citation.
2. **Rewrite section intros with BLUF** — 3/4 of your sections lack direct answers.
  Before: "In today's digital landscape, many businesses struggle with..."
  After: "SEO costs $500-5,000/month for most businesses. The exact price depends on..."

### Medium Impact
3. **Add comparison table** — Both competitors use tables. AI engines extract tabular data easily.
4. **Increase external citations** — You have 1 source, competitors average 5.5. Cite authoritative data.

### Low Impact
5. **Add more list formatting** — Convert paragraphs to bullet points where listing items.
```

## Platform-Specific Insights

When relevant, note platform-specific optimization. See [references/platform-citations.md](references/platform-citations.md) for AI platform citation patterns.
