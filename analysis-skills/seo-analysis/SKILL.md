---
name: seo-analysis
description: "Runs SEO and AEO (Answer Engine Optimization) analysis on websites or specific pages. Use when the user mentions SEO, AEO, search rankings, search optimization, or wants to analyze how their pages perform in search engines and AI answers. Produces a data dashboard and action report with before/after recommendations."
---

# SEO & AEO Analysis

Produce two outputs per analysis: a **data dashboard** (grid-dashboard YAML) showing the current state, and an **action report** (markdown) with specific before→after changes. Optionally, generate a **redline preview** showing all changes applied to the live page.

## CRITICAL: Check Tools, Then Create a Task List

**Before doing ANY analysis, check which tools are available and create a Task list scoped to those tools.**

### Step 1: Check tool availability

Verify each tool using the **exact** commands below and record what is available:

| Tool | Check command | Required? |
|------|-------------|-----------|
| Playwright | `Bash: playwright-cli --version` | **Yes — abort if unavailable** |
| GSC | `ToolSearch { "query": "select:mcp__tdx-studio__google_search_console_list_sites", "max_results": 1 }` | No — skip GSC-dependent tasks |
| SerpAPI | `ToolSearch { "query": "select:mcp__tdx-studio__serpapi_google_search", "max_results": 1 }` | No — skip SERP feature analysis |
| GA4 | `ToolSearch { "query": "select:mcp__tdx-studio__google_analytics_list_properties", "max_results": 1 }` | No — skip behavior metrics |

Run all four checks in parallel. If ToolSearch returns a `tool_reference`, the tool is available. If it returns "No matching deferred tools found", skip that tool's tasks.

If Playwright is not available, stop and tell the user: "Playwright is required for SEO analysis. Please install it first."

### Step 2: Identify target page(s) and confirm with user

The analysis is **per page**. Before creating tasks, determine which page(s) to analyze:

- **GSC available**: Call `google_search_console_list_sites` to discover sites (auto-select if only one). Then pull page-level performance data to identify candidate pages (high impressions, Quick Win positions, etc.). Present candidates to the user and confirm which page(s) to analyze.
- **GSC unavailable**: Ask the user for the target URL(s) directly.

### Step 3: Create Task list based on available tools

Build your Task list from the analysis dimensions below, scoped to the tools confirmed in Step 1. Read the **grid-dashboard** and **action-report** skills for output format reference.

Example analysis dimensions (adapt based on available tools):
- GSC keyword & page performance data (current vs prior period comparison)
- Quick Win keywords (near page 1), keyword cannibalization detection
- SERP feature analysis per keyword (answer box, AI overview, PAA, knowledge graph)
- On-page structure extraction (headings, JSON-LD schemas, meta tags, internal links, content depth)
- Full-page visual analysis via screenshot (trust signals, E-E-A-T visual cues, CTA visibility, hero/above-fold, image quality, visual hierarchy)
- Competitor page structure comparison (top SERP winners' headings, word count, schemas, visuals)
- AEO scoring (Content Structure, Structured Data, E-E-A-T, AI Readability, Technical AEO)
- On-Page & Technical SEO scoring
- User behavior context (engagement, bounce rate, conversions)

## Tools

### Google Search Console (`google_search_console_*`)

- `list_sites` — discover properties (prefer `sc-domain:` format)
- `query_analytics` — keyword/page performance with dimensions and filters
- Data has **~3-day delay**: set `end_date` to 3 days before today
- Standard window: 28 days. Large results (5,000 rows) can exceed 256KB — use `jq`, `Grep`, or `Read` with offset/limit

**CRITICAL**: `dimensions` must be a real array and `row_limit` must be a number — NOT strings:
```json
{
  "site_url": "sc-domain:example.com",
  "start_date": "2026-01-20",
  "end_date": "2026-02-16",
  "dimensions": ["query", "page"],
  "row_limit": 50
}
```

### SerpAPI (`serpapi_google_search`)

Availability is confirmed in Step 1. Call: `serpapi_google_search({ q: "...", gl: "us", hl: "en" })`. Key response fields: `answer_box`, `ai_overview`, `people_also_ask`, `knowledge_graph`, `organic_results`, `shopping_results`, `local_results`.

### Playwright (`playwright-cli`)

```bash
playwright-cli install --skills                    # setup (once per session)
playwright-cli open <url>                          # open page
playwright-cli run-code "async page => {           # extract HTML
  const html = await page.content(); return html;
}" > ./seo/page.html
playwright-cli goto <url>                          # navigate (after open)
```

**Screenshots** — always wait for images to fully load before capturing:
```bash
playwright-cli run-code "async page => {
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => Promise.all(
    Array.from(document.images).filter(img => !img.complete)
      .map(img => new Promise(r => { img.onload = img.onerror = r; }))
  ));
}"
playwright-cli screenshot {cwd}/seo/visual-{slug}.png --full-page
```

Open screenshots with `open_file` to visually analyze the page — this catches issues that DOM parsing alone cannot detect.

**On-page signal extraction** — after saving HTML, run the bundled script to extract structured SEO/AEO signals (headings, BLUF analysis, JSON-LD schemas, entity properties, links, images):
```bash
playwright-cli run-code "async page => {
  const html = await page.content(); return html;
}" > ./seo/page.html
python3 scripts/extract_page_signals.py ./seo/page.html --url <url>
```
Output is JSON with word count, heading structure (with question detection), schema types and flags (FAQ, HowTo, Article, Breadcrumb, VideoObject, Speakable), BLUF pattern classification per H2 (definition/number/verdict/step/yesno), internal/external link counts with anchors, image alt text coverage, and E-E-A-T entity properties (author, sameAs, about). Use `--fields` to select specific fields, `--compact` for minified output.

### Google Analytics (`google_analytics_*`)

User behavior data — engagement, bounce rate, conversions per page. Use for monitoring baselines and behavioral context for recommendations.

## Output 1: Data Dashboard

The dashboard shows **data and analysis only** — no action items, no recommendations. MUST read the **grid-dashboard** skill for YAML format, cell types, and layout reference. **Build the YAML incrementally** — follow the incremental approach described in the grid-dashboard skill.

Design the grid layout freely based on the actual data you collected — choose the number of rows, columns, and cell types that best tell the story. Do NOT follow a fixed template. Use `pages:` structure with one entry per analyzed page. One file per site. **Always include a glossary** as the last row — define all abbreviations and industry terms used in the dashboard.

Save to `{cwd}/seo/seo-dashboard-{domain}.yaml` and call with the **absolute path**:
```
preview_grid_dashboard({ file_path: "/absolute/path/to/seo/seo-dashboard-{domain}.yaml" })
```

**Column conventions**: SERP features: `AB` `AI` `PAA` `KG` `LP` `SH`. Drift: `Stable (0)`, `Rising (-2)`, `Declining (+4)`, `Crash (+8)`, `Surge (-6)`.

## Output 2: Action Report

After the dashboard, render an **interactive action report** via `preview_action_report`. MUST read **action-report** skill for YAML format and field reference. **Build the YAML incrementally** — follow the incremental approach described in the action-report skill.

Save to `{cwd}/seo/action-report-{slug}.yaml` and call with the **absolute path**:
```
preview_action_report({ file_path: "/absolute/path/to/seo/action-report-{slug}.yaml" })
```

Each action item uses the `{as_is, to_be, reason}` structure. Key requirements:
- `as_is`: Include **actual current HTML** (in code blocks) — not vague descriptions
- `to_be`: Include **complete replacement code** — copy-paste-ready HTML, JSON-LD, or config
- `reason`: Cite specific data — SERP features, AEO score dimensions, competitor patterns
- `category`: Map to AEO/SEO dimension (Content Structure, Structured Data, E-E-A-T, etc.)
- `priority`: Based on effort-to-impact ratio (high = low effort + high impact)
- `summary`: Include AEO score, key findings, and total estimated impact
- **Glossary**: Include a glossary section at the end defining all abbreviations and industry terms used in the report

## References

Read these files as needed during analysis. Do not load all at once.

| Reference | When to read | Path |
|-----------|-------------|------|
| AEO Scoring rubric | Calculating AEO scores (5 dimensions, 100 pts) | [references/aeo-scoring.md](references/aeo-scoring.md) |
| BLUF Writing Patterns | Writing before→after recommendations | [references/bluf-patterns.md](references/bluf-patterns.md) |
| Intent Classification | Mapping SERP features to content format | [references/intent-classification.md](references/intent-classification.md) |
| Zero-Click Strategy | Classifying zero-click queries (Type A/B/C/D) | [references/zero-click-strategy.md](references/zero-click-strategy.md) |
| CTR Impact Scoring | Baseline CTR + SERP penalty calculation | [references/ctr-scoring.md](references/ctr-scoring.md) |
| Topical Clustering | Cluster algorithm + authority levels | [references/topical-clustering.md](references/topical-clustering.md) |
| GSC Query Patterns | GSC API call patterns + jq filters | [references/gsc-query-patterns.md](references/gsc-query-patterns.md) |

## Fallback Output (CLI / No Artifact Panel)

When `preview_grid_dashboard` or `preview_action_report` is not available, output both dashboard summary and action items as formatted markdown directly in the conversation.

## Related Skills

- **grid-dashboard** — Grid dashboard YAML format reference (cell types, layout, merging)
- **action-report** — Action report YAML format reference (as-is/to-be/reason cards)
