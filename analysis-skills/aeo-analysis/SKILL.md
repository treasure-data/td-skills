---
name: aeo-analysis
description: Audit page structure for AI citation readiness using Playwright browser automation and Python-based HTML signal extraction. Produces an AEO score (0-100) across 5 dimensions — Content Structure, Structured Data, E-E-A-T Signals, AI Readability, and Technical AEO. Requires only URL(s) — no Google Search Console or SerpAPI needed. Use when users want to evaluate whether a page is structured for AI engine citation (Google AI Overview, Perplexity, ChatGPT Search), check BLUF patterns, audit structured data, or compare multiple pages for structural gaps.
---

# AEO Analysis

Audit page structure for AI citation readiness. Extracts HTML signals via Playwright and Python, scores pages 0-100, and provides actionable improvement recommendations.

## Prerequisites

- `playwright-cli` skill loaded (provides `playwright-cli` CLI commands). If not installed: `npm install -g @playwright/cli@latest`
- Python 3 available (for HTML signal extraction script)
- No GSC or SerpAPI required — this skill works with URLs only

## Glossary

Technical terms should be annotated on first use in the output report with a parenthetical explanation. For the full glossary, see [../references/glossary.md](../references/glossary.md).

## Analysis Workflow

### Step 1: Collect target URLs

Ask the user for 1 or more URLs to audit. If the user wants to compare their page against competitors, collect all URLs upfront.

### Step 2: Open page and extract signals

For the first URL, open the browser and capture the page:

```bash
playwright-cli open <url>
playwright-cli snapshot
playwright-cli screenshot
```

See [../references/playwright-workflow.md](../references/playwright-workflow.md) for the full Playwright workflow reference.

- `snapshot` — YAML accessibility tree for heading hierarchy, navigation, content structure
- `screenshot` — visual analysis for layout, CTA placement, information density

### Step 3: Extract AEO signals with Python

Get the full HTML and pass it to the shared extraction script:

```bash
playwright-cli run-code "async page => { return await page.content(); }" > /tmp/page.html
python3 analysis-skills/scripts/extract_page_signals.py /tmp/page.html --url <url>
```

The script outputs JSON with all AEO-relevant signals:
- Title, meta description, Open Graph, Twitter card, canonical URL
- Heading hierarchy with question detection
- JSON-LD structured data, schema types, entity properties (sameAs, about, mainEntity, author)
- BLUF analysis per H2 section with pattern classification (definition/number/verdict/step/yesno)
- Content metrics: word count, lists, tables, images (with alt text analysis)
- Link counts: internal/external, with internal link anchor texts

Use `--fields` to extract specific signals (e.g., `--fields schema_types,bluf_analysis,entity_properties`).

### Step 4: Repeat for additional URLs

For subsequent URLs, navigate without reopening:

```bash
playwright-cli goto <next_url>
playwright-cli snapshot
playwright-cli screenshot
playwright-cli run-code "async page => { return await page.content(); }" > /tmp/page.html
python3 analysis-skills/scripts/extract_page_signals.py /tmp/page.html --url <next_url>
```

Close the browser when done with all pages:

```bash
playwright-cli close
```

### Step 5: AEO scoring

Score each page using the **AEO Scoring Model** (see [references/aeo-scoring.md](references/aeo-scoring.md)) across 5 dimensions totaling 100 points:

1. **Content Structure** (26 points): BLUF presence, paragraph optimization, question headings, lists/tables, article length
2. **Structured Data** (26 points): JSON-LD presence, FAQPage schema, Article/Author schema, additional schemas, schema stacking
3. **E-E-A-T Signals** (21 points): Author information, Organization schema, citations/sources, date freshness
4. **AI Readability** (21 points): Direct answer blocks, section self-containment, FAQ/Q&A patterns, summary/TL;DR
5. **Technical AEO** (6 points): Meta description, canonical tag, Open Graph tags, mobile usability

### Step 6: BLUF analysis

For each H2 section, evaluate the BLUF (Bottom Line Up Front) pattern:

1. Does the section start with a direct answer in the first paragraph (30-60 words)?
2. What BLUF pattern type does it use? (definition/number/verdict/step/yesno/none)
3. Does the first sentence contain a concrete answer or is it filler?

See [references/bluf-patterns.md](references/bluf-patterns.md) for the 5 BLUF patterns with before/after examples.

Flag sections that begin with anti-patterns:
- "In today's digital landscape..."
- "Let's dive into..."
- "There are many factors to consider..."

### Step 7: Platform citation readiness

Evaluate the page against AI platform citation requirements. See [references/platform-citations.md](references/platform-citations.md) for platform-specific patterns.

Check:
- **Google AI Overview**: FAQ schema present? BLUF format? 30-60 word direct answers?
- **Perplexity**: Data citations? Numbered references? Technical depth?
- **ChatGPT Search**: Clear definitions? Quotable statements? Authoritative tone?
- **AI crawler access**: Are GPTBot, PerplexityBot, ClaudeBot allowed in robots.txt?

### Step 8: Multi-URL comparison (if 2+ URLs provided)

If the user provided multiple URLs, build a structural comparison:

```
## Structure Comparison

| Signal              | Page A        | Page B        | Page C        |
|---------------------|---------------|---------------|---------------|
| AEO Score           | 72/100        | 58/100        | 81/100        |
| Word Count          | 1,200         | 2,400         | 1,800         |
| H2 Sections         | 4             | 8             | 6             |
| Question Headings   | 0             | 5             | 3             |
| JSON-LD Types       | Article       | Article, FAQ  | Article, HowTo|
| BLUF Sections       | 1/4           | 6/8           | 4/6           |
| Lists               | 2             | 8             | 5             |
| External Citations  | 1             | 7             | 4             |
```

Identify structural gaps: topics, schemas, BLUF patterns, and content formats that high-scoring pages have but low-scoring pages lack.

### Step 9: Present the report

Output format:

```
## AEO Audit Report: [domain or page title]

### Overall AEO Score: XX/100

| Dimension          | Score  | Grade |
|--------------------|--------|-------|
| Content Structure  | XX/26  | X     |
| Structured Data    | XX/26  | X     |
| E-E-A-T Signals    | XX/21  | X     |
| AI Readability     | XX/21  | X     |
| Technical AEO      | XX/6   | X     |

### Key Findings
[Top 3 strengths and top 3 weaknesses]

### BLUF Analysis
| H2 Section | Has BLUF? | Pattern | Word Count | Action |
|------------|-----------|---------|------------|--------|
| "Section title" | Yes/No | definition/none | 45 | Rewrite with Pattern 1 |

### Platform Readiness
| Platform | Ready? | Missing |
|----------|--------|---------|
| Google AI Overview | Partial | FAQ schema, BLUF on 3 sections |
| Perplexity | No | External citations, data density |

### Priority Actions
1. [Highest impact action with specific instructions]
2. [Second priority]
3. [Third priority]
```

## Related Skills

- **seo-analysis**: Add GSC keyword data and SERP context to the AEO audit
- **competitor-analysis**: Compare page structure against competitor pages discovered via SerpAPI
- **content-brief**: Generate content plans that synthesize AEO findings with SEO data
