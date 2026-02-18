---
name: seo-analysis
description: "Use this skill when the user wants a comprehensive SEO or AEO (Answer Engine Optimization) audit of their website or specific pages. Trigger on requests like 'analyze SEO', 'AEO score', 'SEO audit', 'optimize for AI search', 'improve rankings', or 'why is my page not ranking'. Combines Google Search Console, SerpAPI, Playwright, and GA4 to produce an interactive grid-dashboard with KPIs, AEO scores, keyword tables, and actionable before/after recommendations."
---

# SEO & AEO Analysis

Produce a prescriptive action plan — specific before→after content changes with reasoning — by combining keyword performance, live SERP context, on-page structure extraction, and user behavior data. The **dashboard YAML schema** (see Output section) defines what data to collect. Use all available tools to populate every field.

## CRITICAL: Create a Task List First

**Before doing ANY analysis, create a Task list** using `TodoWrite` (or the task management tool available in your environment). Break down the analysis into concrete steps based on what tools are available and what YAML fields need to be populated. This prevents skipping steps.

Example tasks:
- List GSC sites and confirm target with user
- Pull GSC keyword + page performance data (current + prior period for trends)
- Identify target pages, Quick Win candidates, keyword cannibalization
- Run SerpAPI for high-priority keywords (SERP features, position drift, organic results)
- Extract target page with Playwright (headings, schema, content, links, images)
- Scrape top 5 competitor pages with Playwright (heading structure, word count, format, visuals, schemas)
- Pull GA4 behavior metrics for target pages
- Calculate AEO scores + On-Page/Technical SEO scores from extraction data
- Build internal linking strategy from GSC page data + Playwright link extraction
- Build recommended content outline from competitor patterns + SERP intent + BLUF mapping
- Synthesize: CTR impact, zero-click diagnosis, recommendations with before→after
- Write grid-dashboard YAML and open `preview_grid_dashboard`
- Ask user which page to show redline preview for

Update each task as you complete it. Do not proceed to the next step without marking the current one done.

## Getting Started

Do NOT ask the user which site to analyze. Call `google_search_console_list_sites` to discover registered properties, then present the list for selection (auto-select if only one).

## Tools

### Google Search Console (`google_search_console_*`)

**Purpose**: Keyword performance data — the foundation of the analysis.

**Key calls**:
- `google_search_console_list_sites` — discover properties (prefer `sc-domain:` format)
- `google_search_console_query_analytics` — keyword/page performance with dimensions and filters

**Usage notes**:
- Data has **~3-day delay**: set `end_date` to 3 days before today
- Standard window: 28 days (`end_date - 27 days` to `end_date`)
- Large results (5,000 rows) can exceed 256KB — use `jq` filters, `Grep`, or `Read` with `offset/limit`
- Use `dimensions: ["query", "page"]` for keyword→page mapping

**Populates YAML fields**: `site_summary` (impressions, clicks, CTR, position), `keywords` (query, position, impressions, clicks, ctr, priority), `zero_click` (queries with impressions > 200 and clicks = 0), `topical_authority` clusters

### SerpAPI (`serpapi_google_search`)

**Purpose**: Live SERP features, position drift, zero-click root cause diagnosis.

**Availability check** (required before use):
```
ToolSearch { "query": "select:mcp__tdx-studio__serpapi_google_search", "max_results": 1 }
```

**Usage**: Call for each high-priority keyword identified from GSC data:
```
serpapi_google_search({ q: "what is cdp", gl: "us", hl: "en" })
```

**Extract from results**:
- `answer_box` — type (definition/list/table), owner URL, content
- `ai_overview` — presence and content
- `people_also_ask` — PAA questions (used for FAQ schema recommendations)
- `knowledge_graph` — entity presence
- `organic_results` — live position for drift calculation
- `shopping_results`, `local_results` — SERP feature presence

**Populates YAML fields**: `keywords[].serp` (all SERP features), `keywords[].drift` (compare live position vs GSC average), `keywords[].ctr_impact` (SERP penalty calculation), `zero_click[].type` (A/B/C/D classification)

### Playwright (`playwright-cli`)

**Purpose**: On-page structure extraction — **required for AEO scoring, before→after recommendations, and competitor content pattern analysis**. Without Playwright extraction, you cannot score Content Structure, Structured Data, E-E-A-T, or AI Readability dimensions, and you cannot write specific before→after text in recommendations.

**Setup** (run once per session if needed):
```bash
playwright-cli install --skills
```

**Extract page HTML** for each target page:
```bash
playwright-cli open <url>
playwright-cli run-code "async page => { const html = await page.content(); return html; }" > ./seo/page-raw.html
```

**What to extract from the HTML** (parse the downloaded HTML):
- **Heading structure**: All H1-H6 tags, their text, and nesting
- **BLUF analysis**: First paragraph after each H2 — does it lead with a direct answer? Length in words?
- **JSON-LD schemas**: All `<script type="application/ld+json">` blocks — types present (Article, FAQPage, HowTo, Organization, etc.)
- **Content metrics**: Total word count, paragraph count, list/table presence
- **Internal/external links**: Count, destinations, and anchor text of internal links
- **Meta tags**: title, description, canonical, OG tags
- **Author information**: Author name, bio, links
- **Date signals**: Published date, modified date
- **Visual content**: Image count, images with/without alt text, infographic/chart presence

#### Competitor Content Pattern Analysis

**Before writing recommendations, scrape the top 5 organic results** from SerpAPI for the primary keyword. For each competitor page, extract with Playwright:

```bash
playwright-cli open <competitor-url>
playwright-cli run-code "async page => { const html = await page.content(); return html; }" > ./seo/competitor-N.html
```

**Extract from each competitor**:
- **Heading count** (H2/H3) and subtopics covered
- **Word count** (total body text)
- **Content format** (guide, listicle, comparison, tutorial, FAQ)
- **Visual assets** (image count, video embeds, tables, infographics)
- **Schema types** present (FAQPage, HowTo, Article, etc.)

This populates the **Competitor Content Patterns** table and informs the **Recommended Content Outline** — showing which heading structure, word count, and format Google is rewarding for this keyword.

#### Internal Linking Strategy

From the target page's Playwright extraction + GSC page performance data:
- Identify which **internal pages link to the target** (and which don't but should)
- Identify which **high-authority pages** (strong topical clusters from GSC) could provide link equity
- Recommend specific **anchor text** based on target keywords

**Populates YAML fields**: `aeo_score` (all 5 dimensions), On-Page SEO scores, `recommendations[].before/after`, Competitor Content Patterns table, Internal Linking Strategy table, Recommended Content Outline

### Google Analytics (`google_analytics_*`)

**Purpose**: User behavior data — engagement, bounce rate, conversions per page.

**Key call**:
```
google_analytics_run_report({
  dimensions: [{ name: "pagePath" }],
  metrics: [
    { name: "screenPageViews" },
    { name: "engagementRate" },
    { name: "averageSessionDuration" },
    { name: "bounceRate" },
    { name: "conversions" }
  ],
  dateRanges: [{ startDate: "28daysAgo", endDate: "today" }],
  dimensionFilter: {
    filter: { fieldName: "pagePath", stringFilter: { matchType: "CONTAINS", value: "/blog/" } }
  }
})
```

**Populates YAML fields**: `monitoring.metrics_to_watch` (baseline metrics for before/after comparison), behavioral context for recommendations (e.g., high bounce rate → content structure issues)

## AEO Scoring Model

Five dimensions, 100 points total. **Requires Playwright page extraction** — evaluates on-page signals only.

Full rubric in [references/aeo-scoring.md](references/aeo-scoring.md).

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

## Dashboard Output

Write analysis results as a **grid-dashboard YAML** and call `preview_grid_dashboard`. See the **grid-dashboard** skill for full cell type reference.

Use a **4-column × 16-row grid** with the following layout per analyzed page:

| Row | Cells | Type | Content |
|-----|-------|------|---------|
| 1 | 1-1, 1-2, 1-3, 1-4 | `kpi` × 4 | Impressions, Clicks, Avg CTR, Avg Position |
| 2 | 2-1 | `gauge` | AEO Score (value/100, grade label) |
| 2 | 2-2 to 2-4 (merged) | `scores` | AEO 5-dimension breakdown |
| 3 | 3-1 to 3-2 (merged) | `scores` | On-Page SEO (title, meta, headings, internal links, content depth, visual content) |
| 3 | 3-3 to 3-4 (merged) | `scores` | Technical SEO (HTTPS, canonical, structured data, mobile, page speed) |
| 4 | 4-1 to 4-4 (merged) | `table` | Competitor Content Patterns — top 5 SERP results (headings, word count, format, visuals, schemas) |
| 5 | 5-1 to 5-4 (merged) | `table` | Topical Authority clusters (cluster, queries, pages, avg position, page-1 rate, level) |
| 6 | 6-1 to 6-4 (merged) | `table` | Quick Wins — keywords near page 1 (position 8-20, high impressions) |
| 7 | 7-1 to 7-4 (merged) | `table` | All Keywords + SERP features + drift |
| 8 | 8-1 to 8-2 (merged) | `table` | Trending Up — keywords with improving position |
| 8 | 8-3 to 8-4 (merged) | `table` | Declining — keywords losing position |
| 9 | 9-1 to 9-4 (merged) | `table` | Keyword Cannibalization — same query ranking on multiple pages |
| 10 | 10-1 to 10-4 (merged) | `table` | Zero-Click Queries with type and remediation |
| 11 | 11-1 to 11-4 (merged) | `table` | Internal Linking Strategy — recommended links with anchor text and rationale |
| 12-13 | 12-1 to 13-4 (merged) | `markdown` | Recommendations with before→after diffs |
| 14 | 14-1 to 14-4 (merged) | `markdown` | Recommended Content Outline — heading structure matching SERP winners + LLM citation patterns |
| 15 | 15-1 to 15-4 (merged) | `markdown` | Topical Authority strategy — expand/defend/build recommendations |
| 16 | 16-1 to 16-4 (merged) | `markdown` | Monitoring — metrics, timeline, 2-3 month review cadence |

### Complete YAML Template

```yaml
title: "SEO/AEO Analysis: example.com"
description: "/blog/cdp-guide — Analyzed 2026-02-18 (28-day window)"
grid:
  columns: 4
  rows: 16
cells:
  # ── Row 1: Site KPIs (GSC) ─────────────────────────────────────────
  - pos: "1-1"
    type: kpi
    title: "Impressions"
    kpi:
      value: "45,000"
      change: "+8.2%"
      trend: up
      subtitle: "vs. prior 28 days"

  - pos: "1-2"
    type: kpi
    title: "Clicks"
    kpi:
      value: "2,100"
      change: "+12.5%"
      trend: up
      subtitle: "vs. prior 28 days"

  - pos: "1-3"
    type: kpi
    title: "Avg CTR"
    kpi:
      value: "4.7%"
      change: "+0.3%"
      trend: up
      subtitle: "vs. prior 28 days"

  - pos: "1-4"
    type: kpi
    title: "Avg Position"
    kpi:
      value: "18.3"
      change: "-1.2"
      trend: up
      subtitle: "lower is better"

  # ── Row 2: AEO Score (Playwright) ──────────────────────────────────
  - pos: "2-1"
    type: gauge
    title: "AEO Score"
    gauge:
      value: 58
      max: 100
      label: "C"
      thresholds:
        - { limit: 40, color: "#ef4444" }
        - { limit: 60, color: "#f97316" }
        - { limit: 70, color: "#f59e0b" }
        - { limit: 80, color: "#84cc16" }
        - { limit: 100, color: "#22c55e" }

  - pos: ["2-2", "2-4"]
    type: scores
    title: "AEO Breakdown"
    scores:
      - label: "Content Structure"
        value: 14
        max: 26
      - label: "Structured Data"
        value: 8
        max: 26
      - label: "E-E-A-T Signals"
        value: 16
        max: 21
      - label: "AI Readability"
        value: 14
        max: 21
      - label: "Technical AEO"
        value: 6
        max: 6

  # ── Row 3: On-Page + Technical SEO (Playwright) ────────────────────
  - pos: ["3-1", "3-2"]
    type: scores
    title: "On-Page SEO"
    scores:
      - label: "Title Tag"
        value: 8
        max: 10
      - label: "Meta Description"
        value: 6
        max: 10
      - label: "Heading Structure"
        value: 5
        max: 10
      - label: "Internal Links"
        value: 7
        max: 10
      - label: "Content Depth"
        value: 9
        max: 10
      - label: "Visual Content"
        value: 4
        max: 10

  - pos: ["3-3", "3-4"]
    type: scores
    title: "Technical SEO"
    scores:
      - label: "HTTPS"
        value: 10
        max: 10
      - label: "Canonical Tag"
        value: 10
        max: 10
      - label: "Structured Data"
        value: 3
        max: 10
      - label: "Mobile Friendly"
        value: 8
        max: 10
      - label: "Page Speed"
        value: 6
        max: 10

  # ── Row 4: Competitor Content Patterns (SerpAPI + Playwright) ───────
  - pos: ["4-1", "4-4"]
    type: table
    title: "Competitor Content Patterns"
    table:
      headers: ["Rank", "Domain", "Word Count", "Headings", "Format", "Visuals", "Schemas"]
      rows:
        - [1, "competitor-a.com", 3200, 12, "Guide", "8 imgs, 2 charts", "Article, FAQPage"]
        - [2, "competitor-b.com", 2800, 9, "Listicle", "5 imgs", "Article, HowTo"]
        - [3, "competitor-c.com", 4100, 15, "Guide", "12 imgs, 1 video", "Article, FAQPage, Organization"]
        - [4, "competitor-d.com", 1900, 7, "FAQ", "3 imgs", "FAQPage"]
        - [5, "competitor-e.com", 2400, 10, "Comparison", "6 imgs, 1 table", "Article"]

  # ── Row 5: Topical Authority (GSC clusters) ────────────────────────
  - pos: ["5-1", "5-4"]
    type: table
    title: "Topical Authority"
    table:
      headers: ["Cluster", "Queries", "Pages", "Avg Position", "Page-1 Rate", "Level"]
      rows:
        - ["cdp", 45, 8, 6.2, "78%", "Strong"]
        - ["data integration", 12, 3, 18.5, "25%", "Emerging"]
        - ["customer analytics", 8, 2, 24.1, "13%", "Weak"]

  # ── Row 6: Quick Wins (GSC) ────────────────────────────────────────
  - pos: ["6-1", "6-4"]
    type: table
    title: "Quick Wins (Near Page 1)"
    table:
      headers: ["Query", "Position", "Impressions", "Page", "Action"]
      rows:
        - ["cdp implementation guide", 11.3, 820, "/blog/cdp-impl", "Improve BLUF + add FAQ schema"]
        - ["customer data platform pricing", 9.8, 1200, "/pricing", "Add pricing table (Pattern 2)"]
        - ["cdp vs crm", 12.1, 640, "/blog/cdp-vs-crm", "Expand comparison section"]

  # ── Row 7: Keywords + SERP (GSC + SerpAPI) ─────────────────────────
  - pos: ["7-1", "7-4"]
    type: table
    title: "Keywords"
    table:
      headers: ["Query", "Position", "Impr.", "CTR", "Priority", "SERP Features", "Drift"]
      rows:
        - ["what is cdp", 11.2, 1840, "1.8%", "High", "AB AI PAA", "Stable (0)"]
        - ["cdp vs dmp", 8.5, 920, "3.2%", "High", "PAA", "Rising (-2)"]
        # ... one row per keyword

  # ── Row 8: Trending + Declining (GSC period comparison) ────────────
  - pos: ["8-1", "8-2"]
    type: table
    title: "Trending Up"
    table:
      headers: ["Query", "Position", "Change"]
      rows:
        - ["cdp benefits", 8.3, "-4.2"]
        - ["first party data platform", 14.1, "-3.8"]

  - pos: ["8-3", "8-4"]
    type: table
    title: "Declining"
    table:
      headers: ["Query", "Position", "Change"]
      rows:
        - ["customer data management", 22.4, "+5.1"]
        - ["data unification tool", 31.2, "+8.3"]

  # ── Row 9: Keyword Cannibalization (GSC) ───────────────────────────
  - pos: ["9-1", "9-4"]
    type: table
    title: "Keyword Cannibalization"
    table:
      headers: ["Query", "Page 1", "Pos 1", "Page 2", "Pos 2", "Action"]
      rows:
        - ["what is cdp", "/blog/cdp-guide", 11.2, "/products/cdp", 18.7, "Consolidate to /blog/cdp-guide; redirect or noindex product page for this query"]

  # ── Row 10: Zero-Click (GSC + SerpAPI) ─────────────────────────────
  - pos: ["10-1", "10-4"]
    type: table
    title: "Zero-Click Queries"
    table:
      headers: ["Query", "Impressions", "Type", "Root Cause", "Remediation"]
      rows:
        - ["what is customer data platform", 3200, "A", "AI Overview fully answers", "Add BLUF definition + differentiated value"]
        - ["cdp meaning", 1800, "A", "Answer Box (definition)", "Capture AB with Pattern 1"]

  # ── Row 11: Internal Linking Strategy (Playwright + GSC) ───────────
  - pos: ["11-1", "11-4"]
    type: table
    title: "Internal Linking Strategy"
    table:
      headers: ["From Page", "Anchor Text", "To Page", "Rationale"]
      rows:
        - ["/blog/data-integration", "customer data platform", "/blog/cdp-guide", "Strong page (pos 3.2) linking to target with primary keyword"]
        - ["/blog/cdp-guide", "CDP vs CRM comparison", "/blog/cdp-vs-crm", "Support declining keyword with link equity from pillar page"]
        - ["/products/cdp", "implementation guide", "/blog/cdp-impl", "Product→content link for quick-win keyword (pos 11.3)"]

  # ── Row 12-13: Recommendations (Playwright + SerpAPI + scoring) ────
  - pos: ["12-1", "13-4"]
    type: markdown
    title: "Recommendations"
    content: |
      ### 1. Add BLUF to H2: How Does CDP Work?
      **Impact**: High | **Dimension**: Content Structure | **Location**: H2 section #3

      > **Before**: "There are many ways to think about how a Customer Data Platform operates. The technology has evolved over the years..."

      > **After**: "A CDP works by collecting first-party customer data from websites, apps, and offline sources, then unifying it into persistent profiles using identity resolution."

      **Reason**: Answer Box uses BLUF Pattern 1 at 38 words. Current intro is 120 words of filler.

      ---

      ### 2. Add FAQPage JSON-LD schema
      **Impact**: High | **Dimension**: Structured Data | **Location**: Page `<head>`

      > **Before**: Only Article schema present

      > **After**: Add FAQPage schema with 4 Q&A pairs from PAA questions

      **Reason**: Sites with 3+ schema types show ~13% higher AI citation rate.

  # ── Row 14: Recommended Content Outline (SerpAPI + Playwright competitor analysis) ──
  - pos: ["14-1", "14-4"]
    type: markdown
    title: "Recommended Content Outline"
    content: |
      Based on top 5 SERP winners (avg 2,880 words, 10.6 headings, guide format). Structure optimized for search intent + LLM citation patterns:

      1. **H1: What is a CDP? The Complete Guide (2026)**
      2. **H2: TL;DR — What You Need to Know** *(BLUF Pattern 1: definition-first, ≤60 words — AI citation target)*
      3. **H2: How Does a CDP Work?** *(BLUF Pattern 1 — matches Answer Box)*
         - H3: Data Collection
         - H3: Identity Resolution
         - H3: Unified Profiles
      4. **H2: CDP vs DMP vs CRM** *(BLUF Pattern 3: verdict-first — targets comparison PAA)*
      5. **H2: How Much Does a CDP Cost?** *(BLUF Pattern 2: number-first — targets pricing Answer Box)*
      6. **H2: Do You Need a CDP? 5 Signs** *(BLUF Pattern 5: yes/no-first — targets PAA)*
      7. **H2: How to Implement a CDP** *(BLUF Pattern 4: step-first — targets list Answer Box)*
      8. **H2: FAQ** *(4 PAA questions as H3s — FAQPage schema target)*

      **Target**: ~3,000 words | 8+ H2 sections | 10+ images/charts | FAQPage + Article + Organization schema

  # ── Row 15: Topical Authority Strategy ─────────────────────────────
  - pos: ["15-1", "15-4"]
    type: markdown
    title: "Topical Authority Strategy"
    content: |
      **Expand (Strong clusters)**: CDP cluster has 78% page-1 rate. Create subtopic pages for long-tail: "CDP implementation checklist", "CDP ROI calculator".

      **Prioritize (Emerging)**: Data integration cluster at 25% page-1 rate. Create pillar page + target PAA questions. Build internal links from CDP content.

      **Evaluate (Weak)**: Customer analytics cluster at 13%. Assess competitive landscape before investing — may need 5+ new pages to establish authority.

  # ── Row 16: Monitoring (GA4 + GSC) — review every 2-3 months ──────
  - pos: ["16-1", "16-4"]
    type: markdown
    title: "Monitoring & Iteration"
    content: |
      **Metrics to track**:
      - GSC CTR for "what is cdp" (expect improvement in 2-4 weeks)
      - GA4 engagement rate on /blog/cdp-guide
      - GSC position for "how does cdp work"
      - Cannibalization: monitor /products/cdp position for "what is cdp"
      - Internal link click-through from new strategic links

      **Expected timeline**: Title/meta: 2-4 weeks. Content restructuring: 4-8 weeks. Schema: 2-6 weeks.

      **Review cadence**: Re-run this analysis every **2-3 months** on GSC data. Track impressions, clicks, and position trends. If a page stalls, update content: add sections, improve intros, refresh data and visuals. SEO content is publish → monitor → improve, not publish and forget.
```

### Rendering

```
preview_grid_dashboard({ file_path: "./seo/seo-dashboard-{domain}.yaml" })
```

**SERP features column convention**: Abbreviations in the Keywords table: `AB` = Answer Box, `AI` = AI Overview, `PAA` = People Also Ask, `KG` = Knowledge Graph, `LP` = Local Pack, `SH` = Shopping.

**Drift column convention**: Classification + delta in parens: `Stable (0)`, `Rising (-2)`, `Declining (+4)`, `Crash (+8)`, `Surge (-6)`.

## Redline Preview

After the user reviews the dashboard and selects a page for detailed edits:

1. **Download HTML** with Playwright: `playwright-cli open <url>` → save full rendered HTML
2. **Apply redline edits** based on the dashboard's `recommendations` for that page:
   - Wrap original text in `<del>` (strikethrough, red)
   - Insert replacement text in `<ins>` (underline, green) immediately below
   - Apply changes at the locations specified in each recommendation
3. **Show preview**: `preview_document({ file_path: "./seo/redline-{slug}.html" })`

The user sees the actual page with proposed changes visually marked — deletions in red strikethrough, insertions in green.

## Fallback Output (CLI / No Dashboard)

When `preview_grid_dashboard` is not available, output a markdown action plan:

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
> [current content — quote actual text from Playwright extraction]

**After**:
> [recommended content — provide the actual rewritten text]

**Reason**: [cite SERP data, competitor gap, or scoring dimension]

### Quick Wins Summary

| Keyword | Position | Impressions | SERP Features | Action |
|---------|----------|-------------|---------------|--------|

### Zero-Click Diagnosis

| Query | Impressions | Type | Root Cause | Recommended Change |
|-------|-------------|------|------------|-------------------|

### Monitoring
[GA4/GSC metrics to watch. Expected timeline: title/meta = 2-4 weeks,
content restructuring = 4-8 weeks, schema additions = 2-6 weeks.]
```

## Related Skills

- **grid-dashboard** — Grid dashboard YAML format reference (cell types, layout, merging)
- **gsc-analysis** — Deep GSC data analysis: Quick Wins, trends, cannibalization, device/country breakdown, index health
- **competitor-analysis** — SERP-based competitor discovery and structural comparison
