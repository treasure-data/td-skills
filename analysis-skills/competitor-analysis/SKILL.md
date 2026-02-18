---
name: competitor-analysis
description: Analyze competitor web pages for SEO and AEO structure using SerpAPI for SERP-based competitor discovery and Playwright with Python-based HTML extraction for structural comparison. Produces side-by-side comparisons of heading hierarchy, structured data, BLUF patterns, content metrics, and Answer Box reverse engineering. Use when users want to compare their page against competitors, find content gaps, understand why a competitor ranks higher, or reverse-engineer Answer Box winners.
---

# Competitor Analysis

Discover competitors via live SERP data and compare page structures to identify content gaps and optimization opportunities.

## Available Tools

| Tool | What it provides in competitor context |
|------|---------------------------------------|
| **SerpAPI** (`serpapi_google_search`) | SERP-based competitor discovery (top organic results for target keyword), SERP feature map, Answer Box source identification, PAA questions for heading gaps. Check availability: `ToolSearch { "query": "select:mcp__tdx-studio__serpapi_google_search", "max_results": 1 }` |
| **Playwright** + `extract_page_signals.py` | On-page structure extraction for both user's page and competitor pages: headings, BLUF analysis, JSON-LD schema, content metrics, links. Setup: `playwright-cli install --skills`. Run: `playwright-cli open <url>` → extract HTML → `python3 analysis-skills/scripts/extract_page_signals.py /tmp/page.html --url <url>`. For subsequent pages use `playwright-cli goto <url>` instead of `open`. Close with `playwright-cli close` |
| **GSC MCP** (`google_search_console_*`) | Optional. User's own keyword performance data to identify which keywords to analyze competitively |

## SERP-Based Competitor Discovery

When SerpAPI is available, search the target keyword to find actual ranking competitors rather than relying on user guesses. From results:
- Top 3 organic URLs excluding the user's domain
- SERP features present (determines optimization priority)
- User's current position if they appear

Without SerpAPI, the user provides 1-3 competitor URLs manually.

## Structural Comparison Dimensions

The `extract_page_signals.py` script outputs JSON with all SEO/AEO signals. These are the key dimensions for side-by-side comparison:

| Dimension | What to compare | Competitive significance |
|-----------|----------------|------------------------|
| Word Count | Content depth and comprehensiveness | Thin content rarely ranks for competitive keywords |
| H2 Sections | Topic breadth and organization | More H2s typically means broader topic coverage |
| Question Headings | H2/H3 phrased as questions | Question headings drive PAA capture and AEO citation |
| JSON-LD Types | Schema types present | 3+ schema types = ~13% higher AI citation rate |
| FAQ Schema | FAQPage with Q&A pairs | Most impactful schema for AI citation |
| BLUF Sections | Sections with direct-answer openings | BLUF content is 2.8x more likely to be cited by AI |
| Lists & Tables | Structured content formatting | AI engines extract tabular/list data easily |
| Images | Visual content with alt text | Alt text contributes to image search and accessibility |
| Internal Links | Internal link count and anchor texts | Signals topical authority and site structure |
| External Citations | Outbound reference links | Signals E-E-A-T; Perplexity especially favors data citations |

## Answer Box Reverse Engineering

When the SERP has an Answer Box, reverse-engineer why that specific page was selected.

**Analysis framework:**

| Factor | What to examine |
|--------|----------------|
| Cited section heading | Which H2 contains the Answer Box content |
| Text length | Word count of the first content block (optimal: 30-60 words) |
| BLUF pattern type | From `bluf_pattern_type` field (definition/number/verdict/step/yesno) |
| Sentence structure | Short declarative vs long compound sentences |
| Schema support | Which JSON-LD types the AB source uses |
| Content format | Paragraph, list, table, or hybrid |

**Replication strategy**: Match the winning BLUF pattern, target the same word count (±20%), use the same sentence structure, and add equivalent or stronger schema support.

See [../seo-analysis/references/bluf-patterns.md](../seo-analysis/references/bluf-patterns.md) for the Answer Box → BLUF pattern mapping.

## Content Gap Analysis

### Heading Gap Methodology

Compare H2 topics across all extracted pages:

| Gap type | Definition | Action |
|----------|-----------|--------|
| Competitor-only topics | H2 topics appearing in 1+ competitors but not in user's page | Add as new H2 sections |
| User-only topics | H2 topics unique to the user's page | Keep — these are differentiators |
| Common topics | H2 topics in both user and competitors | Compare depth and BLUF quality |
| PAA-driven gaps | PAA questions not addressed by any page | Opportunity for user to capture |

### Structural Gap Patterns

| User's page has... | Competitors have... | Recommendation |
|--------------------|---------------------|---------------|
| No FAQ schema | FAQPage JSON-LD | Add FAQ schema — most impactful for AI citation |
| Paragraph-heavy sections | BLUF openings | Rewrite section intros with direct answers |
| Few external citations | 5+ references | Add authoritative external sources |
| No comparison tables | Tables/lists | Convert paragraphs to structured formats |
| Generic headings | Question-format H2s | Rephrase headings as questions users ask |

## Platform-Specific Considerations

Different AI platforms weight different signals. See [../seo-analysis/references/platform-citations.md](../seo-analysis/references/platform-citations.md) for platform-specific optimization strategies.

## Output Specification — Competitor Comparison

```markdown
## Competitor Analysis: "[target keyword]"

### SERP Landscape
[SERP feature map: Answer Box, AI Overview, PAA, Knowledge Graph, etc.]
[User's current position and top competitor positions]

### Structure Comparison

| Signal | Your Page | Competitor A | Competitor B | Competitor C |
|--------|-----------|-------------|-------------|-------------|
| Word Count | ... | ... | ... | ... |
| H2 Sections | ... | ... | ... | ... |
| Question Headings | ... | ... | ... | ... |
| JSON-LD Types | ... | ... | ... | ... |
| FAQ Schema | ... | ... | ... | ... |
| BLUF Sections | ... | ... | ... | ... |
| Lists | ... | ... | ... | ... |
| Tables | ... | ... | ... | ... |
| Images | ... | ... | ... | ... |
| Internal Links | ... | ... | ... | ... |
| External Citations | ... | ... | ... | ... |

### Answer Box Analysis
[If Answer Box present: reverse engineering of winning page with replication strategy]

### Content Gaps

**Topics competitors cover that you don't:**
- [Topic] (Competitor A, H2) — [why it matters]

**Your unique topics (keep these):**
- [Topic] (differentiator)

**PAA questions not addressed by anyone:**
- [Question] — opportunity to capture

### Priority Recommendations

#### High Impact
1. [Most impactful structural change with specific before→after]
2. [Second most impactful]

#### Medium Impact
3. [Moderate improvement]
4. [Additional improvement]

#### Low Impact
5. [Minor optimization]
```

## Related Skills

- **seo-analysis** — Full SEO/AEO audit with scoring and prescriptive action plan
- **gsc-analysis** — Keyword performance data to inform which keywords to analyze competitively
