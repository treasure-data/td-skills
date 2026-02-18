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

## Output Modes

This skill supports two output modes: **Dashboard** (visual, interactive) and **Content Brief** (actionable outline). Both are written as YAML files.

### Mode 1: Dashboard Output (default)

After completing analysis, write results to a YAML file and open the interactive dashboard.

**Step 1**: Write the YAML file to `./seo/seo-dashboard-{domain}.yaml` (relative to working directory)

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

    aeo_score:
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

    keywords:
      - query: "what is cdp"
        position: 11.2
        impressions: 1840
        clicks: 33
        ctr: 0.018
        priority: high        # high | medium | low
        serp:
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
        ctr_impact:
          baseline_ctr: 0.025
          serp_penalties: ["answer_box: -60%", "paa: -15%"]
          adjusted_ctr: 0.006
          diagnosis: serp_absorption  # content_problem | serp_absorption
        drift:
          gsc_avg: 11.2
          live_position: 13
          delta: +1.8
          classification: stable  # crash | declining | stable | rising | surge | deindex_risk

    zero_click:
      - query: "what is customer data platform"
        impressions: 3200
        type: A               # A | B | C | D
        root_cause: "AI Overview fully answers the query"
        remediation: "Add BLUF definition + differentiated value"

    recommendations:
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

    monitoring:
      metrics_to_watch:
        - "GSC CTR for 'what is cdp' (expect improvement in 2-4 weeks)"
        - "GA4 engagement rate on /blog/cdp-guide"
      expected_timeline: "Title/meta: 2-4 weeks. Content restructuring: 4-8 weeks. Schema: 2-6 weeks."
```

**Step 2**: Open the dashboard

```
preview_seo_dashboard({ file_path: "./seo/seo-dashboard-example-com.yaml" })
```

The dashboard renders in the artifact panel with:
- **Page selector** dropdown to switch between analyzed pages
- **Site summary** with metric cards and topical authority table
- **AEO score gauge** (circular, color-coded by grade) with dimension breakdowns
- **Keywords table** (sortable) with SERP feature icons, CTR diagnosis, position drift
- **Zero-click queries table** with type badges and remediation
- **Recommendation cards** with expandable before/after diff views
- **Monitoring checklist** with timeline expectations

**Step 3**: After the user reviews the dashboard, ask which page they'd like a redline preview for.

### Mode 2: Content Brief Output

When the user asks to create new content, rewrite existing pages, or plan content strategy, produce a content brief. This mode synthesizes analysis findings into an actionable outline.

#### Content Brief YAML

Add a `content_brief` key to any page in the dashboard YAML:

```yaml
pages:
  "https://example.com/blog/cdp-guide":
    title: "What is a CDP? Complete Guide"
    # ... aeo_score, keywords, etc. as above ...

    content_brief:
      target_keyword: "what is cdp"
      priority_score: 82
      search_intent: informational
      target_word_count: 2000
      paa_coverage: "6/8 = 75%"

      title_options:
        - "What is a CDP? Complete Guide to Customer Data Platforms"
        - "CDP Guide 2026: What It Is, How It Works, and Why You Need One"
        - "What is a Customer Data Platform? Everything You Need to Know"

      meta_description: "A CDP collects first-party customer data from all sources and unifies it into persistent profiles. Learn how CDPs work, CDP vs DMP differences, and implementation steps."

      outline:
        - heading: "What is a CDP?"
          bluf_pattern: "Pattern 1: Definition-first"
          layer: primary
          notes: "30-60 word direct answer. Primary AI citation target."
        - heading: "How Does a CDP Work?"
          bluf_pattern: "Pattern 4: Step-first"
          layer: "primary (PAA)"
          notes: "Answer from PAA. Lead with 3-step process."
        - heading: "CDP vs DMP: What's the Difference?"
          bluf_pattern: "Pattern 3: Verdict-first"
          layer: "primary (PAA)"
          notes: "Comparison table + verdict-first BLUF."
        - heading: "Data Integration Best Practices"
          bluf_pattern: "Pattern 1: Definition-first"
          layer: supplementary
          notes: "Common competitor topic. Lead with key insight."
        - heading: "Real-Time CDP Use Cases"
          bluf_pattern: "Pattern 4: Step-first"
          layer: differentiation
          notes: "Unique value. Use proprietary examples."
        - heading: "Frequently Asked Questions"
          bluf_pattern: null
          layer: "primary (PAA overflow)"
          notes: "Remaining PAA questions as Q&A pairs. Wrap with FAQPage JSON-LD."

      schema_requirements:
        - "Article schema (type, author, datePublished, dateModified)"
        - "FAQPage schema (minimum 3 Q&A pairs from PAA questions)"
        - "BreadcrumbList schema"

      bluf_checklist:
        - "Each H2 section starts with a direct answer (30-60 words)"
        - "No section begins with filler phrases"
        - "Key definitions appear within the first 2 sentences"
        - "Article opens with a TL;DR or executive summary"
        - "BLUF pattern matches the AB-to-BLUF mapping per section"
```

#### Content Brief Priority Scoring

When multiple keyword candidates exist, score each 0-100:

| Factor | Weight | Scoring criteria |
|--------|--------|-----------------|
| Traffic Potential | 30 pts | `impressions * estimated_ctr_at_position_3` (baseline ~11%). Normalized 0-30 |
| SERP Vulnerability | 25 pts | +8 per weak domain in top 3 organic. +5 if AB owner is weak. Max 25 |
| Momentum | 20 pts | Rising (position improved 3+) = 20, Stable = 10, Falling = 5 |
| Content Leverage | 15 pts | Count `relatedSearches` + `peopleAlsoAsk`. Score = min(15, count * 2) |
| Feature Opportunity | 10 pts | AB absent = 10, AB present weak source = 5, AB strong source = 0 |

#### 3-Layer Outline Model

| Layer | Source | Purpose |
|-------|--------|---------|
| **Primary** | PAA questions from SerpAPI | H2 headings from actual search questions. Each uses BLUF pattern matching AB type |
| **Supplementary** | Competitor common headings | Topics appearing in 2+ competitors not covered by PAA |
| **Differentiation** | Original insight | 1-2 unique H2 sections competitors miss |

## Output Specification — Prescriptive Action Plan

When the dashboard tool is not available (e.g., CLI mode), fall back to a markdown action plan:

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

**Reason**: [why this change matters — cite SERP data, competitor gap, or scoring dimension.]

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
