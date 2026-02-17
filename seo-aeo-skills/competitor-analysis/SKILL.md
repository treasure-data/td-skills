---
name: competitor-analysis
description: Analyze competitor web pages for SEO/AEO structure using Playwright browser automation and Python-based HTML extraction. Extracts heading hierarchy, structured data (JSON-LD), meta tags, content metrics, and BLUF patterns. Use when users want to compare their page against competitors, find content gaps, understand why a competitor ranks higher, or reverse-engineer a competitor's AEO strategy.
---

# Competitor Page Analysis

Use playwright-cli and Python-based HTML extraction to analyze the AEO-relevant structure of competitor pages, then compare against the user's own page.

## Tool Availability Check

Before starting, verify SerpAPI is available: `ToolSearch { "query": "select:mcp__tdx-studio__serpapi_google_search", "max_results": 1 }`. If available, use it for all SerpAPI steps below. If not, skip SerpAPI-dependent steps.

## Prerequisites

- `playwright-cli` skill loaded (provides `playwright-cli` CLI commands). If not installed: `npm install -g @playwright/cli@latest`
- Python 3 available (for HTML signal extraction script)
- Optionally: Google Search Console connected for the user's own site data
- Optionally: SerpAPI connected (provides `serpapi_google_search` MCP tool) for automatic competitor discovery from live SERP

## Glossary

Technical terms should be annotated on first use in the output report. For the full glossary, see [../references/glossary.md](../references/glossary.md).

## Analysis Workflow

### Step 1: Collect URLs

Ask the user for:
1. **Their page URL** (the page to improve)
2. **Target keyword** (the query they want to rank for)

#### Auto-discover competitors with SerpAPI (recommended)

If SerpAPI is connected, search the target keyword to find actual ranking competitors:

```
serpapi_google_search
  query: "<target keyword>"
  num: 10
  gl: "<user's market, e.g. us, jp>"
  hl: "<user's language, e.g. en, ja>"
```

From the results:
- Extract the top 3 organic result URLs (excluding the user's own domain)
- Note SERP features present (answer box, knowledge graph, PAA, local pack) — these inform the optimization strategy
- Record position of the user's page if it appears in results

Present the discovered competitors to the user for confirmation before proceeding.

#### Manual fallback

If SerpAPI is not connected, ask the user for **1-3 competitor URLs** (pages ranking above them for the target keyword). If the user only has a keyword, use GSC to find their ranking page (see [../gsc-analytics/SKILL.md](../gsc-analytics/SKILL.md)), then ask them to provide competitor URLs.

### Step 2: Extract page data (per URL)

For the first URL, open the browser:

```bash
playwright-cli open <first_url>
```

Capture the page structure and visual layout:

```bash
playwright-cli snapshot
playwright-cli screenshot
```

Extract all SEO/AEO signals using the shared Python script:

```bash
playwright-cli run-code "async page => { return await page.content(); }" > /tmp/page.html
python3 seo-aeo-skills/scripts/extract_seo_signals.py /tmp/page.html --url <first_url>
```

The script outputs JSON containing all SEO/AEO signals (run with `--help` for full field list): title, meta description, OG/Twitter metadata, headings (with question detection), JSON-LD (structured data), schema types, entity properties, BLUF analysis with pattern classification, word count, lists, tables, images (with alt analysis), and link counts with anchor texts.

For subsequent URLs, navigate without reopening:

```bash
playwright-cli goto <next_url>
playwright-cli snapshot
playwright-cli screenshot
playwright-cli run-code "async page => { return await page.content(); }" > /tmp/page.html
python3 seo-aeo-skills/scripts/extract_seo_signals.py /tmp/page.html --url <next_url>
```

Close the browser when done:

```bash
playwright-cli close
```

> **Note on playwright-cli eval**: Use `eval` only for simple single-value extraction. For multi-signal extraction, always use the Python script to avoid shell escaping issues.

### Step 3: SERP feature context (if SerpAPI available)

Before comparing page structures, understand what the SERP looks like for the target keyword. Use the SerpAPI results from Step 1 to document:

```
## SERP Feature Map for "[keyword]"

| Feature          | Present? | Details                              |
|------------------|----------|--------------------------------------|
| Answer Box       | Yes/No   | Type, source URL                     |
| Knowledge Graph  | Yes/No   | Entity, description                  |
| People Also Ask  | Yes/No   | List questions (use for heading gaps) |
| Top Stories      | Yes/No   | News sources                         |
| Local Pack       | Yes/No   | Business type                        |
| Sitelinks        | Yes/No   | Which domains have them              |
```

This context is critical for prioritizing recommendations — if Google shows an answer box, the top priority is capturing it with BLUF content; if PAA dominates, question-format headings matter most.

### Step 4: Answer Box Reverse Engineering (if Answer Box present)

If the SerpAPI results from Step 1 include an `answerBox`, reverse-engineer why that specific page was selected:

1. **Identify the AB source**: Get the Answer Box URL from `answerBox.url` (this may be different from the top organic result)

2. **Extract the AB source page**: Open the Answer Box source URL and extract its signals:

```bash
playwright-cli open <answer_box_url>
playwright-cli run-code "async page => { return await page.content(); }" > /tmp/ab_source.html
python3 seo-aeo-skills/scripts/extract_seo_signals.py /tmp/ab_source.html --url <answer_box_url>
```

3. **Match AB snippet to page content**: Compare the `answerBox.snippet` text from SerpAPI against the extracted `bluf_analysis` sections. Find which H2 section's `first_content` most closely matches the AB snippet.

4. **Analyze the winning pattern**: For the matched section, document:
   - **Cited section heading**: The H2 that contains the Answer Box content
   - **Text length**: Word count of the first content block
   - **BLUF pattern type**: From `bluf_pattern_type` field (definition/number/verdict/step/yesno)
   - **Sentence structure**: Short declarative sentences vs long compound sentences
   - **Schema support**: Which JSON-LD types the AB source uses
   - **Content format**: Paragraph, list, table, or hybrid

5. **Generate replication strategy**: Based on the winning pattern, provide specific instructions:

```
## Answer Box Reverse Engineering: "[keyword]"

### Current AB Owner
- **URL**: competitor.com/page
- **Winning section**: H2 "What is [topic]?"
- **BLUF pattern**: Definition-first (Pattern 1)
- **Text length**: 42 words
- **Schema**: Article + FAQPage

### Replication Strategy
1. Create/rewrite your H2 section targeting the same question
2. Use BLUF Pattern 1 (definition-first) — start with "[Topic] is..."
3. Keep the answer to 30-50 words (AB source uses 42)
4. Add FAQPage schema wrapping the Q&A
5. Use the same sentence structure: [Definition]. [Expansion]. [Key detail].
```

See [../content-brief/references/bluf-patterns.md](../content-brief/references/bluf-patterns.md) for the AB→BLUF pattern mapping table.

> If no Answer Box is present in the SERP, skip this step and proceed to Step 5.

### Step 5: Compare and identify gaps

Build a side-by-side comparison table from the extracted JSON:

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
| Images              | 3             | 10            | 7             |
| Internal Links      | 5             | 15            | 10            |
| External Citations  | 1             | 7             | 4             |
```

### Step 6: Heading gap analysis

Compare heading topics across all pages:

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

### Step 7: AEO-specific recommendations

Provide prioritized recommendations:

```
## Priority Actions

### High Impact (do first)
1. **Add FAQ schema** — Competitor A has it, you don't. FAQ schema (structured data enabling FAQ-style rich results) is most impactful for AI citation.
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

When relevant, note platform-specific optimization. See [references/platform-citations.md](references/platform-citations.md) for AI platform citation patterns and strategies for Google AI Overview, Perplexity, ChatGPT Search, and Claude Search.

## Related Skills

- **gsc-analytics**: Get keyword performance data to inform competitor URL selection
- **site-audit**: Deep AEO audit of your own pages with scoring
- **content-brief**: Generate actionable content plans based on gap analysis
