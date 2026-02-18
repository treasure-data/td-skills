---
name: seo-analysis
description: "CRITICAL: (1) Create a Task list FIRST — plan all analysis steps before starting. (2) Do NOT ask the user for a site URL — call google_search_console_list_sites to discover properties. — Unified SEO/AEO analysis using GSC, SerpAPI, Playwright page extraction, and GA4. Output follows the dashboard YAML schema; use all available tools to populate every field. Read this skill fully before proceeding."
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
- Write dashboard YAML and open `preview_seo_dashboard`
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

Write analysis results to `./seo/seo-dashboard-{domain}.yaml` and call `preview_seo_dashboard` to render the interactive dashboard. The YAML schema below defines **all fields to populate** — use the tools described above to collect data for every field.

```yaml
type: seo-dashboard
domain: example.com
analyzed_at: "2026-02-18"
period:
  start: "2026-01-18"
  end: "2026-02-15"

site_summary:
  total_impressions: 45000
  total_clicks: 2100
  avg_ctr: 0.047
  avg_position: 18.3
  quick_wins_count: 12
  zero_click_count: 8
  topical_authority:
    - cluster: "cdp"
      queries: 45
      pages: 8
      avg_position: 6.2
      page1_rate: 0.78
      level: strong        # strong | emerging | weak | opportunity
    - cluster: "data integration"
      queries: 12
      pages: 3
      avg_position: 18.5
      page1_rate: 0.25
      level: emerging

pages:
  "https://example.com/blog/cdp-guide":
    title: "What is a CDP? Complete Guide"

    aeo_score:                              # ← Requires Playwright extraction
      total: 58
      grade: C
      content_structure:
        score: 14
        max: 26
        gaps: ["4/6 H2 lack BLUF", "No question headings", "No tables"]
      structured_data:
        score: 8
        max: 26
        gaps: ["No FAQPage schema", "Only Article schema (1 type)"]
      eeat_signals:
        score: 16
        max: 21
        gaps: ["No author bio", "2 external citations (need 5+)"]
      ai_readability:
        score: 14
        max: 21
        gaps: ["No TL;DR section", "3/6 sections not self-contained"]
      technical_aeo:
        score: 6
        max: 6
        gaps: []

    keywords:                               # ← GSC data + SerpAPI enrichment
      - query: "what is cdp"
        position: 11.2
        impressions: 1840
        clicks: 33
        ctr: 0.018
        priority: high        # high | medium | low
        serp:                               # ← Requires SerpAPI
          answer_box:
            present: true
            owner: "competitor.com"
            type: definition
          ai_overview: true
          paa:
            - "How does a CDP work?"
            - "CDP vs DMP: what's the difference?"
          knowledge_graph: false
          local_pack: false
          shopping: false
        ctr_impact:                         # ← GSC CTR + SerpAPI penalties
          baseline_ctr: 0.025
          serp_penalties: ["answer_box: -60%", "paa: -15%"]
          adjusted_ctr: 0.006
          diagnosis: serp_absorption  # content_problem | serp_absorption
        drift:                              # ← GSC avg vs SerpAPI live position
          gsc_avg: 11.2
          live_position: 13
          delta: +1.8
          classification: stable  # crash | declining | stable | rising | surge | deindex_risk

    zero_click:                             # ← GSC (impressions, 0 clicks) + SerpAPI (type classification)
      - query: "what is customer data platform"
        impressions: 3200
        type: A               # A | B | C | D
        root_cause: "AI Overview fully answers the query"
        remediation: "Add BLUF definition + differentiated value"

    recommendations:                        # ← Playwright (before text) + SerpAPI (BLUF pattern) + scoring (dimension)
      - title: "Add BLUF to H2: How Does CDP Work?"
        impact: high
        dimension: content_structure
        location: "H2 section #3"
        before: "There are many ways to think about how a Customer Data Platform operates..."
        after: "A CDP works by collecting first-party customer data from websites, apps, and offline sources, then unifying it into persistent profiles using identity resolution."
        reason: "Answer Box uses BLUF Pattern 1 at 38 words. Current intro is 120 words of filler."
      - title: "Add FAQPage JSON-LD schema"
        impact: high
        dimension: structured_data
        location: "Page <head>"
        before: "Only Article schema present"
        after: "Add FAQPage schema with 4 Q&A pairs from PAA questions"
        reason: "Sites with 3+ schema types show ~13% higher AI citation rate."

    monitoring:                             # ← GA4 baseline + GSC metrics
      metrics_to_watch:
        - "GSC CTR for 'what is cdp' (expect improvement in 2-4 weeks)"
        - "GA4 engagement rate on /blog/cdp-guide"
      expected_timeline: "Title/meta: 2-4 weeks. Content restructuring: 4-8 weeks. Schema: 2-6 weeks."
```

Open the dashboard:
```
preview_seo_dashboard({ file_path: "./seo/seo-dashboard-example-com.yaml" })
```

The dashboard renders with: page selector dropdown, site summary cards, AEO score gauge with dimension breakdowns, sortable keywords table with SERP icons, zero-click table, recommendation cards with before/after diffs, and monitoring checklist.

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

When `preview_seo_dashboard` is not available, output a markdown action plan:

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

- **gsc-analysis** — Deep GSC data analysis: Quick Wins, trends, cannibalization, device/country breakdown, index health
- **competitor-analysis** — SERP-based competitor discovery and structural comparison
