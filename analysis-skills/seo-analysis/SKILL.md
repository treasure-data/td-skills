---
name: seo-analysis
description: SEO audit combining Google Search Console keyword data with SerpAPI live SERP analysis. Produces SERP feature maps, Answer Box analysis, PAA coverage assessment, zero-click root cause diagnosis, CTR impact scoring, and position drift detection. Use when users want to understand why pages underperform in search, diagnose zero-click queries, validate GSC data against live SERPs, or get SEO optimization recommendations backed by real SERP data.
---

# SEO Analysis

Combine GSC keyword performance data with live SERP context from SerpAPI to produce actionable SEO optimization recommendations.

## Tool Availability Check

Before starting, verify SerpAPI is available: `ToolSearch { "query": "select:mcp__tdx-studio__serpapi_google_search", "max_results": 1 }`. If available, use it for all SerpAPI steps below. If not, skip SerpAPI-dependent steps and note the limitation.

## Prerequisites

- Google Search Console connected (provides `google_search_console_*` MCP tools)
- SerpAPI connected (provides `serpapi_google_search` MCP tool) — strongly recommended for full analysis
- `playwright-cli` skill loaded (for page context extraction when needed)
- Python 3 available (for HTML signal extraction)

## Glossary

Technical terms should be annotated on first use in the output report. For the full glossary, see [../references/glossary.md](../references/glossary.md).

## Analysis Workflow

### Step 1: Collect GSC data

Use the **gsc-analysis** skill to pull keyword and page performance data:

1. List available GSC properties (`google_search_console_list_sites`) and let the user select
2. Pull performance data for the last 28 days with dimensions `["query", "page"]` and `row_limit: 5000`
3. Extract **Quick Wins** (position 8-20, impressions > 100)
4. Extract **CTR Opportunities** (impressions > 500, CTR < 2%)

See [../gsc-analysis/references/gsc-query-patterns.md](../gsc-analysis/references/gsc-query-patterns.md) for query patterns and filtering details.

> **Large result handling**: GSC responses (5,000 rows) exceed 256KB. Never read the entire file at once. Use `jq` filters or `Read` with `offset/limit`.

### Step 2: SERP feature map (requires SerpAPI)

For the top 5 Quick Win keywords by impressions, run SerpAPI to map the SERP landscape:

```
serpapi_google_search
  query: "<keyword>"
  num: 10
  gl: "<user's market>"
```

For each keyword, document:

```
## SERP Feature Map

| Keyword | Answer Box | AI Overview | Knowledge Graph | PAA | Local Pack | Shopping |
|---------|-----------|-------------|-----------------|-----|------------|----------|
| "keyword A" | Yes (competitor.com) | Yes (3 refs) | No | 4 questions | No | No |
```

### Step 3: Answer Box analysis

For keywords where an Answer Box is present:

1. Identify the AB owner URL from `answerBox.url`
2. Check if the user's page could capture it — does the page have BLUF content matching the AB type?
3. If the AB owner is a weak source (forum, UGC), flag as high-opportunity

See [../aeo-analysis/references/bluf-patterns.md](../aeo-analysis/references/bluf-patterns.md) for the AB→BLUF pattern mapping.

### Step 4: PAA coverage assessment

For each keyword with People Also Ask results:

1. List all PAA questions from SerpAPI
2. Check if the user's page headings address these questions
3. Calculate PAA coverage: `(matched questions / total PAA) × 100%`

```
| Keyword | PAA Questions | Addressed by Page | Coverage |
|---------|--------------|-------------------|----------|
| "keyword A" | 4 | 1 | 25% |
```

Target: ≥80% PAA coverage per keyword.

### Step 5: Zero-click root cause diagnosis

From GSC data, filter for zero-click queries (impressions > 200, clicks = 0).

For the top 10 by impressions, run SerpAPI and classify into:
- **Type A**: AI Overview / Answer Box Absorption
- **Type B**: Intent Mismatch
- **Type C**: Brand Answer Box Owned
- **Type D**: PAA Absorption

See [references/zero-click-strategy.md](references/zero-click-strategy.md) for the full classification matrix and remediation strategies.

```
| Query | Impressions | Type | Root Cause | Remediation |
|-------|-------------|------|------------|-------------|
```

> **SerpAPI call budget**: Limit to top 10 zero-click queries.

### Step 6: CTR impact scoring (requires SerpAPI)

For the top 5 Quick Win keywords, calculate adjusted expected CTR accounting for SERP feature penalties:

```
adjusted_expected_ctr = baseline_ctr × (1 - sum_of_SERP_penalties)
```

Classify as **Content Problem** (actual < 70% of adjusted) or **SERP Feature Absorption** (actual ≥ 70%).

See [../gsc-analysis/references/ctr-scoring.md](../gsc-analysis/references/ctr-scoring.md) for baseline CTR table and penalty coefficients.

### Step 7: Position drift detection (requires SerpAPI)

Compare GSC average positions with live SERP positions for the top 20 keywords by impressions:

| Drift | Classification | Action |
|-------|---------------|--------|
| > +5 | **Crash Alert** | Investigate immediately |
| +3 to +5 | **Declining** | Monitor closely |
| -3 to +3 | **Stable** | No action needed |
| -3 to -5 | **Rising** | Capitalize on momentum |
| < -5 | **Surge** | Expand content cluster |
| Not found | **Deindex Risk** | Run URL Inspection |

> **SerpAPI call budget**: Limit to top 20 keywords. Process in batches of 5.

### Step 8: Page-level context (optional)

For pages with identified issues, use Playwright to gather page context:

```bash
playwright-cli open <page_url>
playwright-cli snapshot
playwright-cli run-code "async page => { return await page.content(); }" > /tmp/page.html
python3 analysis-skills/scripts/extract_page_signals.py /tmp/page.html --url <page_url>
playwright-cli close
```

See [../references/playwright-workflow.md](../references/playwright-workflow.md) for the full workflow.

### Step 9: Present the report

```
## SEO Analysis Report: [domain]

**Period**: YYYY-MM-DD to YYYY-MM-DD

### SERP Feature Map
[From Step 2]

### Answer Box Opportunities
[From Step 3 — keywords where AB is capturable]

### PAA Coverage Gaps
[From Step 4 — keywords with <80% coverage]

### Zero-Click Diagnosis
[From Step 5 — classified with remediation]

### CTR Impact Analysis
[From Step 6 — Content Problem vs SERP Absorption]

### Position Drift Alerts
[From Step 7 — Crash/Surge keywords]

### Priority Actions
1. [Highest impact — specific keyword + action]
2. [Second priority]
3. [Third priority]
```

## Related Skills

- **gsc-analysis**: Standalone GSC data analysis (Quick Wins, trends, cannibalization, device/country)
- **aeo-analysis**: Page structure audit for AI citation readiness (no GSC/SerpAPI needed)
- **competitor-analysis**: Compare against competitor pages discovered via SerpAPI
- **content-brief**: Generate content plans synthesizing SEO + AEO findings
