---
name: content-brief
description: Generate AEO-optimized content briefs that target AI citation by Google AI Overview, Perplexity, and ChatGPT Search. Combines Google Search Console keyword data with competitor page analysis to produce structured outlines with BLUF patterns, FAQ schema suggestions, and platform-specific optimization tips. Use when users want to create new content, rewrite existing pages for better AI visibility, or plan content strategy based on GSC data.
---

# AEO Content Brief Generator

Produce content briefs optimized for both traditional search ranking and AI engine citation.

## Prerequisites

- Google Search Console connected (for keyword data via **gsc-analytics** skill)
- `playwright-cli` skill loaded (for competitor analysis). If not installed: `npm install -g @playwright/cli@latest`
- Python 3 available (for HTML signal extraction)
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

### Step 2: Analyze top-ranking competitors

Use the **competitor-analysis** skill workflow to extract structure from top 3 competitors (user provides URLs):

For each competitor URL, extract SEO/AEO signals using playwright-cli + Python:

```bash
playwright-cli open <url>
playwright-cli snapshot
playwright-cli run-code "async page => { return await page.content(); }" > /tmp/page.html
python3 seo-aeo-skills/scripts/extract_seo_signals.py /tmp/page.html
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

### Step 3: Generate the brief

Produce the brief in this format:

```markdown
# Content Brief: [Target Keyword]

## Target
- **Keyword**: [keyword]
- **Current Position**: [from GSC, or "new"]
- **Monthly Impressions**: [from GSC]
- **Search Intent**: [Informational / Transactional / Navigational / Commercial]
- **Target Word Count**: [based on competitor average, aim for 1,500-2,500]

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
> This section is the primary AI citation target.

### H2: [Topic from competitor analysis]
> **BLUF instruction**: Lead with the key fact or definition.

### H2: [Question-format heading from "People Also Ask"]
> **BLUF instruction**: Answer the question in the first sentence.

### H2: [Comparison or "vs" section]
> Include a comparison table. AI engines extract tabular data well.

### H2: [Topic competitors are missing — your content gap advantage]
> Original insight or data that competitors lack.

### H2: Frequently Asked Questions
> Format as Q&A pairs. Add FAQPage JSON-LD schema.

## Structured Data Requirements
- [ ] Article schema (type, author, datePublished, dateModified)
- [ ] FAQPage schema (minimum 3 Q&A pairs)
- [ ] BreadcrumbList schema
- [ ] [Additional: HowTo / Product / Review if applicable]

## BLUF Checklist
- [ ] Each H2 section starts with a direct answer (30-60 words)
- [ ] No section begins with "In today's world..." or similar filler
- [ ] Key definitions appear within the first 2 sentences of their section
- [ ] The article opens with a TL;DR or executive summary

## Internal Linking
- Link TO: [existing pages on related topics]
- Link FROM: [existing pages that should link to this new content]

## AI Platform Notes
- **Google AI Overview**: Ensure FAQ schema and BLUF format for featured snippet capture
- **Perplexity**: Include data citations and external sources (aim for 5+ references)
- **ChatGPT Search**: Focus on clear, quotable definitions and factual statements
```

### Step 4: Review and refine

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
