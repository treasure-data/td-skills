---
name: content-brief
description: Generate structured content briefs that synthesize SEO and AEO analysis into actionable content plans. Produces SERP-aligned outlines with PAA-driven headings, BLUF pattern instructions, FAQ schema requirements, and priority scoring. Use when users want to create new content, rewrite existing pages for better search visibility, or plan content strategy based on keyword data and competitor analysis.
---

# Content Brief Generator

Produce structured content briefs that translate keyword data, SERP context, and competitor analysis into actionable outlines with BLUF instructions and schema requirements.

## Available Tools

| Tool | What it provides for content briefs |
|------|-------------------------------------|
| **GSC MCP** (`google_search_console_*`) | Quick Win keyword candidates (position 8-20, impressions > 100), current page performance for existing content rewrites |
| **SerpAPI** (`serpapi_google_search`) | PAA questions (become H2 headings), related searches (secondary keywords), Answer Box type (determines BLUF pattern), competitor URLs for structural analysis. Check availability: `ToolSearch { "query": "select:mcp__tdx-studio__serpapi_google_search", "max_results": 1 }` |
| **Playwright** + `extract_page_signals.py` | Competitor page structure extraction for outline planning. Setup: `playwright-cli install --skills`. Run: `playwright-cli open <url>` → extract HTML → `python3 analysis-skills/scripts/extract_page_signals.py /tmp/page.html --url <url>` |
| **Prior skill outputs** | Outputs from **seo-analysis** (SERP feature map, AEO score, action plan), **gsc-analysis** (Quick Wins, trends), and **competitor-analysis** (content gaps, heading gaps) directly feed into the brief |

## SERP-Aligned Priority Scoring

When multiple keyword candidates exist, score each 0-100 to determine which to target first.

| Factor | Weight | Scoring criteria |
|--------|--------|-----------------|
| Traffic Potential | 30 pts | `impressions × estimated_ctr_at_position_3` (baseline CTR ≈ 11%). Normalized 0-30 across candidates |
| SERP Vulnerability | 25 pts | +8 per weak domain in top 3 organic (low DA, thin content, outdated). +5 if Answer Box owner is weak source. Max 25 |
| Momentum | 20 pts | From GSC trend data: Rising (position improved 3+) = 20, Stable = 10, Falling = 5 |
| Content Leverage | 15 pts | Count `relatedSearches` + `peopleAlsoAsk` from SerpAPI. Score = min(15, count × 2) |
| Feature Opportunity | 10 pts | Answer Box absent = 10, Answer Box present but weak source = 5, Answer Box with strong source = 0 |

## 3-Layer Outline Model

Build outlines using a priority-layered approach:

| Layer | Source | Purpose |
|-------|--------|---------|
| **Layer 1: Primary** | PAA questions from SerpAPI | H2 headings derived from actual search questions. Each uses the BLUF pattern matching the Answer Box type |
| **Layer 2: Supplementary** | Competitor common headings | H2 topics appearing in 2+ competitors but not already covered by PAA. Ensures competitive parity |
| **Layer 3: Differentiation** | Original insight | 1-2 H2 sections covering topics no competitor addresses. Unique value and competitive moat |

### PAA Coverage Gap Score

```
PAA Coverage = (PAA questions addressed by outline / total PAA questions) × 100%
```

**Target**: ≥ 80% PAA coverage. Below 80%, add more PAA-driven sections.

## BLUF Pattern Selection

Each H2 section in the outline should specify which BLUF pattern to use. Pattern selection is driven by the Answer Box type for the target keyword or section topic.

| Answer Box Type | BLUF Pattern | Lead sentence structure |
|----------------|-------------|----------------------|
| Definition / organic | Pattern 1: Definition-first | "[Term] is [definition]..." |
| Calculator / numeric | Pattern 2: Number-first | "[Number/price] for [context]..." |
| Table / comparison | Pattern 3: Verdict-first | "[A] is better for [X], [B] for [Y]..." |
| List / steps | Pattern 4: Step-first | "[Action] in [N] steps: (1)..." |
| Yes/no question | Pattern 5: Yes/No-first | "Yes/No, [reason]..." |
| Absent | Match dominant pattern among top 3 ranking pages | Analyze competitors' `bluf_pattern_type` |

Full patterns with good/bad examples: [../seo-analysis/references/bluf-patterns.md](../seo-analysis/references/bluf-patterns.md)

## Schema Requirements by Content Type

| Content Type | Required Schema | Optional Schema |
|-------------|----------------|-----------------|
| Guide / How-to | Article, BreadcrumbList | HowTo, FAQPage |
| Product / Service | Product, BreadcrumbList | Review, AggregateRating |
| Comparison | Article, FAQPage | Review, ItemList |
| FAQ / Q&A | FAQPage, Article | BreadcrumbList |
| Location | LocalBusiness, BreadcrumbList | Review, GeoCoordinates |

**Baseline**: Every content brief should include Article + BreadcrumbList at minimum. FAQPage should be added whenever 3+ Q&A pairs exist (most impactful schema for AI citation).

## BLUF Checklist

Quality criteria for every content brief:

| Criterion | Target |
|-----------|--------|
| Each H2 section opens with direct answer | 30-60 words |
| No filler openers | No "In today's world...", "Let's dive into...", "This is a great question..." |
| Key definitions in first 2 sentences | Per section |
| TL;DR or executive summary | Present at article top |
| BLUF pattern matches AB→BLUF mapping | Per section |

## Output Specification — Content Brief

```markdown
# Content Brief: [Target Keyword]

## Target
- **Keyword**: [keyword]
- **Priority Score**: [0-100, if calculated]
- **Current Position**: [from GSC, or "new"]
- **Monthly Impressions**: [from GSC]
- **Search Intent**: [Informational / Transactional / Navigational / Commercial]
- **SERP Features**: [Answer Box / AI Overview / Knowledge Graph / PAA / Local Pack]
- **Target Word Count**: [based on competitor average, typically 1,500-2,500]
- **PAA Coverage**: [X/Y questions addressed = Z%]
- **Current AEO Score**: [from seo-analysis, if available]

## Title Options (3)
1. [Title with keyword, under 60 chars]
2. [Title with number/year, under 60 chars]
3. [Title as question, under 60 chars]

## Meta Description
[150-160 chars, includes keyword, has call to action]

## Outline

### H1: [Title]

### H2: [Direct answer section — BLUF format]
> **BLUF pattern**: [Pattern from AB→BLUF mapping]
> **Layer**: Primary (main keyword)
> Start with a 30-60 word direct answer to the main query.
> This section is the primary AI citation target.

### H2: [PAA Question 1 — verbatim from SerpAPI]
> **BLUF pattern**: [Matched pattern]
> **Layer**: Primary (PAA)
> Answer the question in the first sentence.

### H2: [PAA Question 2]
> **BLUF pattern**: [Matched pattern]
> **Layer**: Primary (PAA)

### H2: [Common competitor topic not in PAA]
> **Layer**: Supplementary (competitor common)
> Lead with the key fact or definition.

### H2: [Unique topic competitors miss]
> **Layer**: Differentiation
> Original insight, proprietary data, or unique perspective.

### H2: Frequently Asked Questions
> **Layer**: Primary (PAA overflow)
> Format remaining PAA questions as Q&A pairs. Wrap with FAQPage JSON-LD.

## Structured Data Requirements
- [ ] Article schema (type, author, datePublished, dateModified)
- [ ] FAQPage schema (minimum 3 Q&A pairs from PAA questions)
- [ ] BreadcrumbList schema
- [ ] [Additional: HowTo / Product / Review if applicable]

## BLUF Checklist
- [ ] Each H2 section starts with a direct answer (30-60 words)
- [ ] No section begins with filler phrases
- [ ] Key definitions appear within the first 2 sentences
- [ ] Article opens with a TL;DR or executive summary
- [ ] BLUF pattern matches the AB→BLUF mapping per section

## Internal Linking
- Link TO: [existing pages on related topics]
- Link FROM: [existing pages that should link to this content]

## AI Platform Notes
- **Google AI Overview**: FAQ schema + BLUF format for featured snippet capture
- **Perplexity**: Include 5+ external data citations and references
- **ChatGPT Search**: Clear, quotable definitions and factual statements
```

## Related Skills

- **seo-analysis** — Full SEO/AEO audit (provides SERP feature map, AEO score, recommended changes)
- **gsc-analysis** — GSC keyword data (provides Quick Win candidates, trends, cannibalization)
- **competitor-analysis** — Competitor structural comparison (provides content gaps, heading gaps)
