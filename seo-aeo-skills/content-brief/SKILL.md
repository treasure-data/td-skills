---
name: content-brief
description: Generate AEO-optimized content briefs using Google Search Console keyword data, SerpAPI live SERP analysis, and competitor page extraction. Produces structured outlines with PAA-driven headings, BLUF patterns, FAQ schema suggestions, and SERP-aligned priority scoring. Use when users want to create new content, rewrite existing pages for better search visibility, or plan content strategy based on GSC quick-win keywords.
---

# AEO Content Brief Generator

Produce content briefs optimized for both traditional search ranking and AI engine citation.

## Tool Availability Check

Before starting, verify SerpAPI is available: `ToolSearch { "query": "select:mcp__tdx-studio__serpapi_google_search", "max_results": 1 }`. If available, use it for all SerpAPI steps below. If not, skip SerpAPI-dependent steps.

## Prerequisites

- Google Search Console connected (for keyword data via **gsc-analytics** skill)
- `playwright-cli` skill loaded (for competitor analysis). If not installed: `npm install -g @playwright/cli@latest`
- Python 3 available (for HTML signal extraction)
- Optionally: SerpAPI connected (provides `serpapi_google_search` MCP tool) for live SERP data, PAA questions, and automatic competitor discovery
- Optionally: **site-audit** and **competitor-analysis** skills for deeper input

## Glossary

Technical terms should be annotated on first use in the brief. For the full glossary, see [../references/glossary.md](../references/glossary.md).

## Brief Generation Workflow

### Step 1: Define the target

Ask the user for:
1. **Target keyword** (or let them pick from GSC quick wins)
2. **Target page** (new or existing URL to optimize)
3. **Goal**: New content, rewrite, or optimization of existing page

If no keyword specified, use the **gsc-analytics** skill (Steps 1-3) to identify Quick Win keywords (position 8-20, impressions > 100). Present top candidates for the user to choose from.

See [../gsc-analytics/references/gsc-query-patterns.md](../gsc-analytics/references/gsc-query-patterns.md) for GSC query patterns.

### Step 2: SERP-Aligned Priority Score (requires GSC + SerpAPI)

If multiple Quick Win keywords are candidates, score each keyword 0-100 to determine which to target first:

| Factor | Weight | Scoring |
|--------|--------|---------|
| **Traffic Potential** | 30 pts | `impressions × estimated_ctr_at_position_3`. Position 3 baseline CTR ≈ 11%. Score = min(30, normalized to 0-30 range across candidates) |
| **SERP Vulnerability** | 25 pts | Run `serpapi_google_search` for top 3 candidates. Check top 3 organic results: +8 per weak domain (low DA, thin content, outdated). +5 if Answer Box owner is a weak source (forum, user-generated content). Max 25 |
| **Momentum** | 20 pts | From gsc-analytics Step 5 trend data: Rising (position improved 3+) = 20, Stable = 10, Falling = 5 |
| **Content Leverage** | 15 pts | Count `relatedSearches` + `peopleAlsoAsk` items from SerpAPI. Score = min(15, count × 2). More related content signals = more sections to write |
| **Feature Opportunity** | 10 pts | Answer Box absent in SERP = 10, Answer Box present but weak source = 5, Answer Box present with strong source = 0 |

Present:

```
| Keyword | Traffic | SERP Vuln | Momentum | Content Lev | Feature Opp | Total | Rank |
|---------|---------|-----------|----------|-------------|-------------|-------|------|
| "keyword A" | 25 | 18 | 20 | 12 | 10 | 85 | 1 |
| "keyword B" | 30 | 10 | 10 | 8 | 5 | 63 | 2 |
```

Recommend the highest-scoring keyword as the target for the brief. If the user has already chosen a keyword, skip this step.

> **SerpAPI call budget**: Limit to top 5 Quick Win keyword candidates.

### Step 3: SERP research with SerpAPI (recommended)

If SerpAPI is connected, search the target keyword to understand the live SERP landscape:

```
serpapi_google_search
  query: "<target keyword>"
  num: 10
  gl: "<user's market, e.g. us, jp>"
  hl: "<user's language, e.g. en, ja>"
```

Extract from the results:
- **Competitor URLs**: Top 3 organic results (for Step 3 analysis)
- **People Also Ask questions**: Use these directly as question-format H2 headings in the brief
- **Related searches**: Use as secondary keyword targets and section topic ideas
- **Answer box**: If present, the brief must prioritize a BLUF section targeting this format
- **Knowledge graph**: If present, ensure structured data (Organization/Product schema) is included

If SerpAPI is not connected, ask the user to provide competitor URLs manually.

### Step 4: Analyze top-ranking competitors

Use the **competitor-analysis** skill workflow to extract structure from the top 3 competitors (discovered via SerpAPI or provided by the user):

For each competitor URL, extract SEO/AEO signals using playwright-cli + Python:

```bash
playwright-cli open <url>
playwright-cli snapshot
playwright-cli run-code "async page => { return await page.content(); }" > /tmp/page.html
python3 seo-aeo-skills/scripts/extract_seo_signals.py /tmp/page.html --url <url>
```

For subsequent URLs, use `goto` instead of `open`:

```bash
playwright-cli goto <next_url>
```

Summarize:
- Average word count of top results
- Common H2 topics across competitors
- Which schemas competitors use (JSON-LD types)
- BLUF (Bottom Line Up Front) adoption rate
- Content gaps (topics competitors miss)

Close the browser when done:

```bash
playwright-cli close
```

### Step 5: Generate PAA-Driven Outline

Build the outline using a 3-layer priority model that ensures PAA questions drive the content structure:

#### Layer 1: Primary (PAA-driven H2 headings)

Take each People Also Ask question from Step 3's SerpAPI results and convert it directly into an H2 heading:

- PAA questions become H2 headings verbatim (or lightly edited for readability)
- Each PAA-driven section uses the BLUF pattern that matches the Answer Box type for that question
- See [references/bluf-patterns.md](references/bluf-patterns.md) for the AB→BLUF pattern mapping

#### Layer 2: Supplementary (competitor common headings)

From Step 4's competitor analysis, identify H2 topics that appear in 2+ competitors but are NOT already covered by PAA questions. Add these as additional H2 sections.

#### Layer 3: Differentiation (unique topics)

Add 1-2 H2 sections covering topics that NO competitor addresses — these provide unique value and differentiation.

#### PAA Coverage Gap Score

Calculate: `PAA Coverage = (PAA questions addressed by outline / total PAA questions) × 100%`

Target: **≥80% PAA coverage**. If below 80%, add more PAA-driven sections.

#### Brief output format

Produce the brief incorporating all three layers:

```markdown
# Content Brief: [Target Keyword]

## Target
- **Keyword**: [keyword]
- **Priority Score**: [from Step 2, if calculated]
- **Current Position**: [from GSC, or "new"]
- **Monthly Impressions**: [from GSC]
- **Search Intent**: [Informational / Transactional / Navigational / Commercial — from SERP features]
- **SERP Features**: [Answer box / AI Overview / Knowledge graph / PAA / Local pack — from SerpAPI]
- **Target Word Count**: [based on competitor average, aim for 1,500-2,500]
- **PAA Coverage**: [X/Y questions addressed = Z%]

## Title Options (3)
1. [Title with keyword, under 60 chars]
2. [Title with number/year, under 60 chars]
3. [Title as question, under 60 chars]

## Meta Description
[150-160 chars, includes keyword, has call to action]

## Outline

### H1: [Title]

### H2: [Direct answer section — BLUF format]
> **BLUF instruction**: Start with a 30-60 word direct answer to the main query.
> **Layer**: Primary (main keyword)
> **BLUF pattern**: [Pattern from AB→BLUF mapping]
> This section is the primary AI citation target.

### H2: [PAA Question 1 — verbatim from SerpAPI]
> **BLUF instruction**: Answer the question in the first sentence.
> **Layer**: Primary (PAA)
> **BLUF pattern**: [Matched pattern]

### H2: [PAA Question 2 — verbatim from SerpAPI]
> **BLUF instruction**: Answer the question in the first sentence.
> **Layer**: Primary (PAA)
> **BLUF pattern**: [Matched pattern]

### H2: [Common competitor topic not in PAA]
> **BLUF instruction**: Lead with the key fact or definition.
> **Layer**: Supplementary (competitor common)

### H2: [Topic competitors are missing — unique value]
> **Layer**: Differentiation
> Original insight, proprietary data, or unique perspective.

### H2: Frequently Asked Questions
> Format remaining PAA questions as Q&A pairs. Add FAQPage JSON-LD schema.
> **Layer**: Primary (PAA overflow)

## Structured Data Requirements
- [ ] Article schema (type, author, datePublished, dateModified)
- [ ] FAQPage schema (minimum 3 Q&A pairs — use PAA questions)
- [ ] BreadcrumbList schema
- [ ] [Additional: HowTo / Product / Review if applicable]

## BLUF Checklist
- [ ] Each H2 section starts with a direct answer (30-60 words)
- [ ] No section begins with "In today's world..." or similar filler
- [ ] Key definitions appear within the first 2 sentences of their section
- [ ] The article opens with a TL;DR or executive summary
- [ ] BLUF pattern matches the AB→BLUF mapping for each section

## Internal Linking
- Link TO: [existing pages on related topics]
- Link FROM: [existing pages that should link to this new content]

## AI Platform Notes
- **Google AI Overview**: Ensure FAQ schema and BLUF format for featured snippet capture
- **Perplexity**: Include data citations and external sources (aim for 5+ references)
- **ChatGPT Search**: Focus on clear, quotable definitions and factual statements
```

### Step 6: Review and refine

Present the brief to the user. Offer to:
1. Adjust word count target
2. Add/remove outline sections
3. Generate a first draft of the BLUF paragraphs
4. Create the JSON-LD schema code ready to paste

## BLUF Writing Patterns

See [references/bluf-patterns.md](references/bluf-patterns.md) for examples of effective BLUF rewrites.

## Related Skills

- **gsc-analytics**: Keyword performance data and opportunity discovery
- **site-audit**: AEO readiness scoring for existing pages
- **competitor-analysis**: Detailed competitor structure comparison
