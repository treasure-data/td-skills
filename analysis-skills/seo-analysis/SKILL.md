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
- Pull GSC keyword + page performance data
- Identify target pages and Quick Win candidates
- Run SerpAPI for high-priority keywords (SERP features, position drift)
- Extract each target page with Playwright (headings, schema, content structure)
- Pull GA4 behavior metrics for target pages
- Calculate AEO scores from Playwright extraction data
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

**Purpose**: On-page structure extraction — **required for AEO scoring and before→after recommendations**. Without Playwright extraction, you cannot score Content Structure, Structured Data, E-E-A-T, or AI Readability dimensions, and you cannot write specific before→after text in recommendations.

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
- **Internal/external links**: Count and destinations
- **Meta tags**: title, description, canonical, OG tags
- **Author information**: Author name, bio, links
- **Date signals**: Published date, modified date

**Populates YAML fields**: `aeo_score` (all 5 dimensions scored from on-page signals), `recommendations[].before` (actual current text quoted from page), `recommendations[].after` (rewritten text based on BLUF patterns and SERP data), `recommendations[].location` (specific H2/element reference)

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

Use a **4-column × 7-row grid** with the following layout per analyzed page:

| Row | Cells | Type | Content |
|-----|-------|------|---------|
| 1 | 1-1, 1-2, 1-3, 1-4 | `kpi` × 4 | Impressions, Clicks, Avg CTR, Avg Position |
| 2 | 2-1 | `gauge` | AEO Score (value/100, grade as label, A/B/C/D/F thresholds) |
| 2 | 2-2 to 2-4 (merged) | `scores` | AEO dimension breakdown (5 bars: Content Structure, Structured Data, E-E-A-T, AI Readability, Technical AEO) |
| 3 | 3-1 to 3-4 (merged) | `table` | Keywords: query, position, impressions, CTR, priority, SERP features, drift |
| 4 | 4-1 to 4-4 (merged) | `table` | Zero-Click Queries: query, impressions, type (A/B/C/D), root cause, remediation |
| 5-6 | 5-1 to 6-4 (merged 2 rows) | `markdown` | Recommendations: numbered list with impact badge, before→after quotes, reason |
| 7 | 7-1 to 7-4 (merged) | `markdown` | Monitoring: metrics to watch checklist + expected timeline |

### Complete YAML Template

```yaml
title: "SEO/AEO Analysis: example.com"
description: "/blog/cdp-guide — Analyzed 2026-02-18 (28-day window)"
grid:
  columns: 4
  rows: 7
cells:
  # ── Row 1: KPIs (from GSC) ───────────────────────────────────────────
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

  # ── Row 2: AEO Score (from Playwright extraction) ────────────────────
  - pos: "2-1"
    type: gauge
    title: "AEO Score"
    gauge:
      value: 58
      max: 100
      label: "C"
      thresholds:
        - { limit: 40, color: "#ef4444" }   # F/D
        - { limit: 60, color: "#f97316" }   # C
        - { limit: 70, color: "#f59e0b" }   # B
        - { limit: 80, color: "#84cc16" }   # A
        - { limit: 100, color: "#22c55e" }  # A+

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

  # ── Row 3: Keywords (GSC + SerpAPI) ──────────────────────────────────
  - pos: ["3-1", "3-4"]
    type: table
    title: "Keywords"
    table:
      headers: ["Query", "Position", "Impr.", "CTR", "Priority", "SERP Features", "Drift"]
      rows:
        - ["what is cdp", 11.2, 1840, "1.8%", "High", "AB AI PAA", "Stable (0)"]
        - ["cdp vs dmp", 8.5, 920, "3.2%", "High", "PAA", "Rising (-2)"]
        # ... one row per keyword

  # ── Row 4: Zero-Click (GSC + SerpAPI) ────────────────────────────────
  - pos: ["4-1", "4-4"]
    type: table
    title: "Zero-Click Queries"
    table:
      headers: ["Query", "Impressions", "Type", "Root Cause", "Remediation"]
      rows:
        - ["what is customer data platform", 3200, "A", "AI Overview fully answers", "Add BLUF definition + differentiated value"]

  # ── Row 5-6: Recommendations (Playwright + SerpAPI + AEO scoring) ────
  - pos: ["5-1", "6-4"]
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

  # ── Row 7: Monitoring (GA4 + GSC) ────────────────────────────────────
  - pos: ["7-1", "7-4"]
    type: markdown
    title: "Monitoring"
    content: |
      **Metrics to watch**:
      - GSC CTR for "what is cdp" (expect improvement in 2-4 weeks)
      - GA4 engagement rate on /blog/cdp-guide
      - GSC position for "how does cdp work"

      **Expected timeline**: Title/meta: 2-4 weeks. Content restructuring: 4-8 weeks. Schema: 2-6 weeks.
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
