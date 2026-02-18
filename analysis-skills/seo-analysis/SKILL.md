---
name: seo-analysis
description: Unified SEO and AEO analysis producing prescriptive action plans with before→after recommendations. Combines Google Search Console keyword data, SerpAPI live SERP analysis, GA4 user behavior metrics, and Playwright page extraction to score pages for AI citation readiness and identify concrete optimization opportunities. Use when users want to improve search visibility, diagnose zero-click queries, capture Answer Boxes, optimize for AI search engines, or get specific content changes backed by SERP data.
---

# SEO & AEO Analysis

Produce a prescriptive action plan — specific before→after content changes with reasoning — by combining keyword performance, live SERP context, user behavior data, and on-page structure analysis.

## Available Tools

| Tool | What it provides in SEO/AEO context |
|------|-------------------------------------|
| **GSC MCP** (`google_search_console_*`) | Keyword performance (position, impressions, clicks, CTR), Quick Win identification, cannibalization detection, trend comparison, index health, topical authority mapping. Data has ~3-day delay; large results (5,000 rows) need `jq` or chunked reads |
| **SerpAPI** (`serpapi_google_search`) | Live SERP features (Answer Box, AI Overview, Knowledge Graph, PAA), position drift vs GSC averages, competitor discovery, zero-click root cause diagnosis. Check availability: `ToolSearch { "query": "select:mcp__tdx-studio__serpapi_google_search", "max_results": 1 }` |
| **GA4 MCP** (`google_analytics_*`) | User behavior on pages: bounce rate, engagement time, conversions, traffic sources. Measures before/after impact of changes. Use `google_analytics_run_report` with dimensions like `pagePath` and metrics like `engagementRate`, `averageSessionDuration`, `conversions` |
| **Playwright** + `extract_page_signals.py` | On-page structure extraction: headings, BLUF analysis, JSON-LD schema, content metrics, internal/external links. Setup: `playwright-cli install --skills`. Run: `playwright-cli open <url>` → `playwright-cli run-code "async page => { return await page.content(); }" > /tmp/page.html` → `python3 analysis-skills/scripts/extract_page_signals.py /tmp/page.html --url <url>` |

## AEO Scoring Model

Five dimensions, 100 points total. Evaluates on-page signals only — no SERP data required. Full rubric in [references/aeo-scoring.md](references/aeo-scoring.md).

| Dimension | Points | Key criteria |
|-----------|--------|-------------|
| Content Structure | 26 | BLUF presence per H2, paragraph optimization, question headings, lists/tables, article length |
| Structured Data | 26 | JSON-LD presence, FAQPage schema, Article/Author schema, schema stacking (3+ types = ~13% higher AI citation) |
| E-E-A-T Signals | 21 | Author info, Organization schema, external citations, date freshness |
| AI Readability | 21 | Direct answer blocks (≤60 words), section self-containment, FAQ/Q&A patterns, TL;DR |
| Technical AEO | 6 | Meta description, canonical, Open Graph, mobile usability |

**Grading**: A+ (90-100), A (80-89), B (70-79), C (60-69), D (40-59), F (0-39)

## BLUF Writing Patterns

Five patterns for structuring the opening of each H2 section. AI engines extract the first paragraph after headings as citation candidates. Optimal length: 30-60 words. Full patterns with good/bad examples in [references/bluf-patterns.md](references/bluf-patterns.md).

| Pattern | Trigger | Lead sentence structure |
|---------|---------|----------------------|
| 1: Definition-first | "what is" queries, definition Answer Boxes | "[Term] is [definition]..." |
| 2: Number-first | "how much" / pricing queries, calculator Answer Boxes | "[Number/price] for [context]..." |
| 3: Verdict-first | "vs" / comparison queries, table Answer Boxes | "[A] is better for [X], while [B] excels at [Y]..." |
| 4: Step-first | "how to" queries, list Answer Boxes | "[Action] in [N] steps: (1)... (2)... (3)..." |
| 5: Yes/No-first | Yes/no questions | "Yes/No, [direct answer with key reason]..." |

**Answer Box → BLUF mapping**: Match the live Answer Box type from SerpAPI (`answerBox.type`) to select the correct BLUF pattern. When no Answer Box exists, adopt the dominant pattern among the top 3 ranking pages.

## SERP Feature Landscape

### Intent Classification

SERP features reveal search intent, which determines optimal content format. Full mapping in [references/intent-classification.md](references/intent-classification.md).

| SERP Feature | Primary Intent | Recommended content format |
|-------------|---------------|---------------------------|
| Answer Box (definition) | Informational | Guide with BLUF Pattern 1 |
| Answer Box (list/steps) | Informational | How-to with BLUF Pattern 4 |
| Knowledge Graph (brand) | Navigational | Landing page with brand schema |
| Shopping results | Transactional | Product page with pricing (Pattern 2) |
| PAA (4+ questions) | Informational | Comprehensive guide with FAQ schema |
| Local Pack | Local | Location page with LocalBusiness schema |

### CTR Impact Scoring

Distinguishes content problems from SERP feature absorption. Full baseline CTR table and penalty coefficients in [../gsc-analysis/references/ctr-scoring.md](../gsc-analysis/references/ctr-scoring.md).

```
adjusted_expected_ctr = baseline_ctr(position) × (1 - sum_of_SERP_penalties)
```

| SERP Feature | CTR Penalty |
|-------------|-------------|
| Answer Box / AI Overview | -60% |
| Knowledge Graph | -30% |
| Shopping Results | -25% |
| Local Pack | -20% |
| People Also Ask | -15% |
| Top Stories | -10% |

**Diagnosis**: actual CTR < 70% of adjusted → **Content Problem** (title/meta needs work). actual CTR ≥ 70% of adjusted → **SERP Feature Absorption** (structural issue, not content quality).

### Position Drift Classification

Compares GSC average positions (historical) with live SerpAPI positions (current).

| Drift | Classification | Implication |
|-------|---------------|-------------|
| > +5 | Crash Alert | Investigate immediately — possible algorithm penalty or technical issue |
| +3 to +5 | Declining | Monitor closely, begin content refresh |
| -3 to +3 | Stable | No action needed |
| -3 to -5 | Rising | Capitalize — expand content cluster |
| < -5 | Surge | High momentum — build internal links to this page |
| Not found | Deindex Risk | Run URL Inspection via GSC |

## Zero-Click Root Cause Types

Queries with impressions but zero clicks. Full classification matrix and remediation in [references/zero-click-strategy.md](references/zero-click-strategy.md).

| Type | Root Cause | SERP Signal | Remediation |
|------|-----------|-------------|-------------|
| A | AI Overview / Answer Box Absorption | `aiOverview` or `answerBox` with complete answer | Capture the AB with BLUF content; add differentiated value |
| B | Intent Mismatch | No SERP feature; page format doesn't match query intent | Align content format to intent or create dedicated page |
| C | Brand Answer Box Owned | `answerBox.url` is a well-known competitor | Create comparison content; strengthen brand entity |
| D | PAA Absorption | 4+ `peopleAlsoAsk` entries covering the topic | Answer PAA questions directly as H2 sections; add FAQ schema |

## AI Platform Citation Patterns

Different AI platforms have different citation behaviors. Full platform-specific strategies in [references/platform-citations.md](references/platform-citations.md).

| Platform | Top cited sources | Key optimization |
|----------|------------------|-----------------|
| Google AI Overview | Reddit (21%), YouTube (19%), Quora (14%) | Maintain top-10 organic; FAQ/HowTo schema; BLUF format |
| Perplexity | YouTube (16%), specialist sites | Data-dense content; numbered references; technical depth |
| ChatGPT Search | Wikipedia (16%), Forbes, Reddit | Optimize for Bing; clear quotable statements |
| Claude Search | Authoritative domains | Well-structured sections; factual claims with sources |

**Key statistic**: AI Overview citations overlap with top-10 organic results **93.67%** — traditional SEO and AEO are deeply connected.

## Topical Authority Framework

Cluster GSC queries by keyword stems, then classify authority per cluster. Full algorithm in [../gsc-analysis/references/topical-clustering.md](../gsc-analysis/references/topical-clustering.md).

| Authority Level | Criteria | Action |
|----------------|----------|--------|
| Strong | Page-1 rate > 60%, 5+ queries | Maintain and expand; add subtopic pages |
| Emerging | Page-1 rate 20-60%, or 3-5 queries improving | Prioritize; create pillar content; target PAA |
| Weak | Page-1 rate < 20%, or < 3 queries | Evaluate ROI before investing |
| Opportunity | Competitor has KG entry, you have no coverage | Research and plan content cluster |

## Quick Win Criteria

Keywords close to page 1 with the highest optimization ROI.

| Priority | Position | Impressions | Expected effort |
|----------|----------|-------------|----------------|
| High | 8-12 | > 500 | Low — minor content improvements |
| Medium | 8-12 / 13-17 | 100-500 / > 500 | Moderate — content expansion or restructuring |
| Low | 13-20 | 100-500 | Higher — may need new content sections |

## Output Specification — Prescriptive Action Plan

The deliverable is a **prescriptive action plan** with specific before→after changes, not a diagnostic report.

```markdown
## SEO/AEO Analysis: [domain or page]

### Summary
[3-5 sentences: current state, biggest opportunities, estimated impact.
Include total impressions, Quick Win count, and top-level AEO score.]

### AEO Score: XX/100

| Dimension | Score | Max | Key gap |
|-----------|-------|-----|---------|
| Content Structure | X | 26 | [specific gap] |
| Structured Data | X | 26 | [specific gap] |
| E-E-A-T Signals | X | 21 | [specific gap] |
| AI Readability | X | 21 | [specific gap] |
| Technical AEO | X | 6 | [specific gap] |

### Recommended Changes

#### 1. [Change title] — Impact: High
**Location**: [specific H2 section or page element]
**Before**:
> [current content/structure — quote actual text from page extraction]

**After**:
> [recommended content/structure — provide the actual rewritten text]

**Reason**: [why this change matters — cite SERP data, competitor gap, or scoring dimension.
Example: "The Answer Box for this keyword uses BLUF Pattern 1 (definition-first) at 42 words.
Your current intro is 120 words of filler before the definition."]

#### 2. [Next change] — Impact: High
...

#### 3. [Next change] — Impact: Medium
...

### Structured Data Additions
[Specific JSON-LD code to add — not just "add FAQ schema" but the actual markup]

```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [...]
}
```

### Quick Wins Summary

| Keyword | Position | Impressions | SERP Features | Action |
|---------|----------|-------------|---------------|--------|

### Zero-Click Diagnosis

| Query | Impressions | Type | Root Cause | Recommended Change |
|-------|-------------|------|------------|-------------------|

### Monitoring
[Which GA4/GSC metrics to watch after implementing changes.
Expected timeline: title/meta changes = 2-4 weeks, content restructuring = 4-8 weeks,
schema additions = 2-6 weeks for rich result eligibility.]
```

## Related Skills

- **gsc-analysis** — Deep GSC data analysis: Quick Wins, trends, cannibalization, device/country breakdown, index health
- **competitor-analysis** — SERP-based competitor discovery and structural comparison
- **content-brief** — Generate content plans synthesizing analysis findings into outlines with BLUF instructions
