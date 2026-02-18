---
name: seo-analysis
description: "Use this skill when the user wants a comprehensive SEO or AEO (Answer Engine Optimization) audit of their website or specific pages. Trigger on requests like 'analyze SEO', 'AEO score', 'SEO audit', 'optimize for AI search', 'improve rankings', or 'why is my page not ranking'. Combines Google Search Console, SerpAPI, Playwright, and GA4 to produce a data dashboard and a detailed action report with before/after recommendations."
---

# SEO & AEO Analysis

Produce two outputs per analysis: a **data dashboard** (grid-dashboard YAML) showing the current state, and an **action report** (markdown) with specific before→after changes. Optionally, generate a **redline preview** showing all changes applied to the live page.

## CRITICAL: Check Tools, Then Create a Task List

**Before doing ANY analysis, check which tools are available and create a Task list scoped to those tools.**

### Step 1: Check tool availability

Verify each tool and record what is available:

| Tool | Check method | Required? |
|------|-------------|-----------|
| Playwright | `playwright-cli --version` | **Yes — abort if unavailable** |
| GSC | `google_search_console_list_sites` | No — skip GSC-dependent tasks |
| SerpAPI | `ToolSearch("select:mcp__tdx-studio__serpapi_google_search")` | No — skip SERP feature analysis |
| GA4 | `ToolSearch("google_analytics")` | No — skip behavior metrics |

If Playwright is not available, stop and tell the user: "Playwright is required for SEO analysis. Please install it first."

### Step 2: Identify target page(s) and confirm with user

The analysis is **per page**. Before creating tasks, determine which page(s) to analyze:

- **GSC available**: Call `google_search_console_list_sites` to discover sites (auto-select if only one). Then pull page-level performance data to identify candidate pages (high impressions, Quick Win positions, etc.). Present candidates to the user and confirm which page(s) to analyze.
- **GSC unavailable**: Ask the user for the target URL(s) directly.

### Step 3: Create Task list based on available tools

Review the **Page Grid Layout** (below) and **Action Report** output requirements. Each cell in the grid has a `Source` column showing which tool provides its data. Build your Task list by:

1. Filtering the grid layout to rows whose Source tools are available
2. Determining what data to collect from each available tool
3. Adding output tasks (write YAML, call preview, write action report)

The agent decides the concrete tasks — do not follow a fixed checklist.

## Tools

### Google Search Console (`google_search_console_*`)

Keyword performance data — the foundation of the analysis.

- `list_sites` — discover properties (prefer `sc-domain:` format)
- `query_analytics` — keyword/page performance with dimensions and filters
- Data has **~3-day delay**: set `end_date` to 3 days before today
- Standard window: 28 days. Large results (5,000 rows) can exceed 256KB — use `jq`, `Grep`, or `Read` with offset/limit
- Use `dimensions: ["query", "page"]` for keyword→page mapping

### SerpAPI (`serpapi_google_search`)

Live SERP features, position drift, zero-click root cause diagnosis.

**Availability check** (required before use):
```
ToolSearch { "query": "select:mcp__tdx-studio__serpapi_google_search", "max_results": 1 }
```

Call for each high-priority keyword from GSC: `serpapi_google_search({ q: "...", gl: "us", hl: "en" })`. Extract `answer_box`, `ai_overview`, `people_also_ask`, `knowledge_graph`, `organic_results`, `shopping_results`, `local_results`.

### Playwright (`playwright-cli`)

On-page structure extraction and visual analysis — **required for AEO scoring and before→after recommendations**.

```bash
playwright-cli install --skills                    # setup (once per session)
playwright-cli open <url>                          # open page
playwright-cli run-code "async page => {           # extract HTML
  const html = await page.content(); return html;
}" > ./seo/page.html
```

Extract from HTML: headings (H1-H6), BLUF analysis (first paragraph after each H2), JSON-LD schemas, word count, internal/external links with anchor text, meta tags, author info, date signals, images with alt text.

For competitor analysis, scrape top 5 organic results from SerpAPI using the same extraction pattern. Use `playwright-cli goto <url>` for subsequent pages (not `open`).

#### Visual Analysis (full-page screenshot)

Take a full-page screenshot and visually analyze the page. This catches issues that DOM parsing alone cannot detect.

```bash
playwright-cli screenshot {cwd}/seo/visual-{slug}.png --full-page
```

Open the screenshot with `open_file` and evaluate:
- **Hero / Above-the-fold**: Is the value proposition immediately clear? Is there a compelling hero image or visual?
- **Trust Signals**: Customer logos, certifications, awards, security badges, partner badges
- **E-E-A-T Visual**: Author photos, team photos, founder images, credentials, bylines
- **CTA Visibility**: Are primary CTAs prominent and above-the-fold? Color contrast, size, placement
- **Image Quality**: Professional vs stock, relevance, branding consistency
- **Visual Hierarchy**: Clear heading structure, whitespace, scannable layout
- **Social Proof**: Testimonials with photos, case study links, review ratings

Record findings for the dashboard (Visual Analysis scores) and action report (specific recommendations with before→after).

### Google Analytics (`google_analytics_*`)

User behavior data — engagement, bounce rate, conversions per page. Use for monitoring baselines and behavioral context for recommendations.

## Output 1: Data Dashboard

The dashboard shows **data and analysis only** — no action items, no recommendations. Its purpose is to present the current state of SEO/AEO performance so the user can understand where they stand before reviewing the action report.

Write results as a **paged grid-dashboard YAML** and call `preview_grid_dashboard`. See **grid-dashboard** skill for cell type reference.

### Build YAML Page by Page

The YAML is **one file per site** with analyzed pages as keys under `pages:`. Each page has a 4×12 grid — too large to write in a single pass.

1. Write `pages:` header + first page's complete grid/cells
2. Call `preview_grid_dashboard` to verify rendering
3. Append additional pages to the same file
4. Call `preview_grid_dashboard` again to refresh

### Page Grid Layout (4×12 per page)

**Cell merging syntax**: single cell `pos: "1-1"`, merged range `pos: ["2-2", "2-4"]` (YAML array, NOT a string).

| Row | pos | Type | Content | Source |
|-----|-----|------|---------|--------|
| 1 | "1-1", "1-2", "1-3", "1-4" | `kpi` × 4 | Impressions, Clicks, Avg CTR, Avg Position | GSC |
| 2 | "2-1" | `gauge` | AEO Score (value/100, grade label) | Playwright |
| 2 | ["2-2", "2-4"] | `scores` | AEO 5-dimension breakdown (Content Structure, Structured Data, E-E-A-T, AI Readability, Technical AEO) | Playwright |
| 3 | ["3-1", "3-2"] | `scores` | On-Page SEO (title, meta, headings, internal links, content depth, visual content) | Playwright |
| 3 | ["3-3", "3-4"] | `scores` | Technical SEO (HTTPS, canonical, structured data, mobile, page speed) | Playwright |
| 4 | ["4-1", "4-2"] | `scores` | Visual & UX (Hero/Above-fold, Trust Signals, E-E-A-T Visual, CTA Visibility, Image Quality, Visual Hierarchy) | Playwright (screenshot) |
| 4 | ["4-3", "4-4"] | `markdown` | Visual Analysis Findings — key observations from full-page screenshot review | Playwright (screenshot) |
| 5 | ["5-1", "5-4"] | `table` | Competitor Content Patterns — top 5 SERP winners (headings, word count, format, visuals, schemas) | SerpAPI + Playwright |
| 6 | ["6-1", "6-4"] | `table` | Topical Authority clusters (cluster, queries, pages, avg position, page-1 rate, level) | GSC |
| 7 | ["7-1", "7-4"] | `table` | Quick Wins — keywords near page 1 (position 8-20, high impressions) | GSC |
| 8 | ["8-1", "8-4"] | `table` | All Keywords + SERP features + drift | GSC + SerpAPI |
| 9 | ["9-1", "9-2"] | `table` | Trending Up — keywords with improving position | GSC |
| 9 | ["9-3", "9-4"] | `table` | Declining — keywords losing position | GSC |
| 10 | ["10-1", "10-4"] | `table` | Keyword Cannibalization — same query ranking on multiple pages | GSC |
| 11 | ["11-1", "11-4"] | `table` | Zero-Click Queries with type and root cause | GSC + SerpAPI |
| 12 | ["12-1", "12-4"] | `table` | Glossary — abbreviations and terms used in this dashboard | — |

### Adapting the Layout

The 12-row layout is the **full data dashboard**. Adapt based on context:

- **Tool unavailable**: Skip rows whose Source tool is missing. Adjust `grid.rows` accordingly. Row 1 (GSC KPIs) and row 7 (Keywords) are always included.
- **Focused request**: If the user asks for specific analysis (e.g., "AEO score only", "keyword analysis only"), include only relevant rows.
- **Single page**: Still use `pages:` structure with one entry.

### YAML Structure

```yaml
pages:
  "https://example.com/blog/cdp-guide":
    title: "What is a CDP? Complete Guide"
    description: "Analyzed 2026-02-18 (28-day window)"
    grid:
      columns: 4
      rows: 12
    cells:
      - pos: "1-1"
        type: kpi
        title: "Impressions"
        kpi: { value: "45,000", change: "+8.2%", trend: up, subtitle: "vs. prior 28 days" }
      # ... remaining cells follow the layout table above
```

Full template: [references/dashboard-template.yaml](references/dashboard-template.yaml)

### Rendering

Save to `{cwd}/seo/seo-dashboard-{domain}.yaml` and call with the **absolute path**:
```
preview_grid_dashboard({ file_path: "/absolute/path/to/seo/seo-dashboard-{domain}.yaml" })
```

**Column conventions**: SERP features: `AB` `AI` `PAA` `KG` `LP` `SH`. Drift: `Stable (0)`, `Rising (-2)`, `Declining (+4)`, `Crash (+8)`, `Surge (-6)`.

## Output 2: Action Report

After the dashboard, render an **interactive action report** via `preview_action_report`. See **action-report** skill for YAML format and field reference.

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

For detailed content structure reference: [references/action-report-template.md](references/action-report-template.md)

## Output 3: Redline Preview (Optional)

After the action report is complete, ask the user: **"Would you like to see a redline preview with all changes applied to the live page?"**

If yes, apply **all** recommendations from the action report to the live page's DOM via Playwright and take a full-page screenshot. The result is a visual diff: deleted text in red strikethrough, inserted text in green — showing exactly what the page will look like after changes.

**CRITICAL — What redline means:**
- Find the **actual DOM element** (heading, paragraph, meta tag) and replace its content with `<del>` (old) + `<ins>` (new)
- The page should look like a normal webpage with inline edits, NOT a design mockup

**DO NOT:**
- Create overlay boxes, floating labels, or absolutely positioned annotations on top of the page
- Add colored rectangles with commentary text (e.g., "P1: タイトル変更 (+30 clicks)")
- Use `position: absolute/fixed` to place elements over the page content
- Write annotations in any language — the redline is purely visual (old text struck through, new text highlighted)

### Step 1: Navigate to target page

Reuse the existing Playwright session (page should already be open from analysis):
```bash
playwright-cli goto <url>
```

### Step 2: Extract page structure

Get a structural map of the page without reading the full HTML. This tells you what elements exist and where to target changes:
```bash
playwright-cli run-code "async page => {
  return await page.evaluate(() => {
    const structure = {};
    // Headings
    structure.headings = [...document.querySelectorAll('h1,h2,h3,h4')].map(h => ({
      tag: h.tagName, text: h.textContent.trim().substring(0, 100),
      id: h.id || null, selector: h.id ? '#' + h.id : null
    }));
    // Meta
    structure.title = document.title;
    structure.metaDesc = document.querySelector('meta[name=description]')?.content || null;
    // Schemas
    structure.schemas = [...document.querySelectorAll('script[type=\"application/ld+json\"]')]
      .map(s => { try { return JSON.parse(s.textContent)['@type']; } catch { return 'parse-error'; } });
    // Key paragraphs (first paragraph after each H2)
    structure.h2Intros = [...document.querySelectorAll('h2')].map(h2 => {
      const next = h2.nextElementSibling;
      return { heading: h2.textContent.trim(), firstPara: next?.tagName === 'P' ? next.textContent.trim().substring(0, 200) : null };
    });
    return JSON.stringify(structure, null, 2);
  });
}"
```

Use this structure map to plan which elements to target for each recommendation.

### Step 3: Inject redline CSS

```bash
playwright-cli run-code "async page => {
  await page.addStyleTag({ content: \`
    .seo-redline-del {
      background: rgba(255,0,0,0.15);
      text-decoration: line-through;
      text-decoration-color: #c00;
    }
    .seo-redline-ins {
      background: rgba(0,180,0,0.15);
      text-decoration: underline;
      text-decoration-color: #060;
      display: inline-block;
      margin: 4px 0;
      padding: 2px 4px;
      border-left: 3px solid #060;
    }
  \`});
}"
```

### Step 4: Apply ALL recommendations via DOM manipulation

For **every** recommendation in the action report, find the target element and replace it with `<del>` + `<ins>`. Use `page.evaluate()` to modify the DOM directly.

**Pattern A — Replace heading text:**
```bash
playwright-cli run-code "async page => {
  await page.evaluate(() => {
    const h1 = document.querySelector('h1');
    if (h1) {
      const old = h1.innerHTML;
      h1.innerHTML = '<del class=\"seo-redline-del\">' + old + '</del>'
        + '<ins class=\"seo-redline-ins\">Treasure Data CDP | AI-Native Customer Data Platform</ins>';
    }
  });
}"
```

**Pattern B — Replace paragraph (BLUF rewrite):**
```bash
playwright-cli run-code "async page => {
  await page.evaluate(() => {
    // Find H2 by text, then replace the next paragraph
    const h2s = [...document.querySelectorAll('h2')];
    const target = h2s.find(h => h.textContent.includes('How Does a CDP Work'));
    if (target) {
      const p = target.nextElementSibling;
      if (p && p.tagName === 'P') {
        const old = p.innerHTML;
        p.innerHTML = '<del class=\"seo-redline-del\">' + old + '</del>'
          + '<ins class=\"seo-redline-ins\">A CDP works by collecting first-party customer data from websites, apps, and offline sources, then unifying it into persistent profiles using identity resolution.</ins>';
      }
    }
  });
}"
```

**Pattern C — Add new section (FAQ, content block):**
```bash
playwright-cli run-code "async page => {
  await page.evaluate(() => {
    // Insert before footer or at end of main content
    const main = document.querySelector('main') || document.querySelector('article') || document.body;
    const section = document.createElement('section');
    section.className = 'seo-redline-ins';
    section.innerHTML = '<h2>Frequently Asked Questions</h2>'
      + '<h3>How does a CDP work?</h3><p>A CDP collects first-party data...</p>'
      + '<h3>CDP vs DMP: what is the difference?</h3><p>A CDP uses first-party data...</p>';
    main.appendChild(section);
  });
}"
```

**Pattern D — Replace title tag / meta description:**
```bash
playwright-cli run-code "async page => {
  await page.evaluate(() => {
    // Visual indicator at top of page (title tag is not visible, so show it)
    const banner = document.createElement('div');
    banner.style.cssText = 'padding:12px 20px;font-size:13px;font-family:monospace;border-bottom:2px solid #c00;background:#fff8f8;';
    banner.innerHTML = '<strong>Title:</strong> <del class=\"seo-redline-del\">' + document.title + '</del> '
      + '<ins class=\"seo-redline-ins\">New Title Here</ins>';
    document.body.prepend(banner);
  });
}"
```

Repeat for **every** recommendation. Apply all changes in sequence — heading, BLUF rewrites, new sections, FAQ, schema notes, internal link additions.

### Step 5: Take full-page screenshot

```bash
playwright-cli screenshot ./seo/redline-{slug}.png --full-page
```

### Step 6: Show to user

```bash
open_file({ path: "./seo/redline-{slug}.png" })
```

The user sees the complete page with actual content changes — deletions in red strikethrough, insertions in green with left border. No annotations, no overlays — just the edited page.

## References

Read these files as needed during analysis. Do not load all at once.

| Reference | When to read | Path |
|-----------|-------------|------|
| AEO Scoring rubric | Calculating AEO scores (5 dimensions, 100 pts) | [references/aeo-scoring.md](references/aeo-scoring.md) |
| BLUF Writing Patterns | Writing before→after recommendations | [references/bluf-patterns.md](references/bluf-patterns.md) |
| Intent Classification | Mapping SERP features to content format | [references/intent-classification.md](references/intent-classification.md) |
| Zero-Click Strategy | Classifying zero-click queries (Type A/B/C/D) | [references/zero-click-strategy.md](references/zero-click-strategy.md) |
| Platform Citations | AI platform-specific optimization | [references/platform-citations.md](references/platform-citations.md) |
| Dashboard Template | Full 10-row YAML template per page | [references/dashboard-template.yaml](references/dashboard-template.yaml) |
| Action Report Template | Markdown action report structure | [references/action-report-template.md](references/action-report-template.md) |
| CTR Impact Scoring | Baseline CTR + SERP penalty calculation | [../gsc-analysis/references/ctr-scoring.md](../gsc-analysis/references/ctr-scoring.md) |
| Topical Clustering | Cluster algorithm + authority levels | [../gsc-analysis/references/topical-clustering.md](../gsc-analysis/references/topical-clustering.md) |
| GSC Query Patterns | GSC API call patterns + jq filters | [../gsc-analysis/references/gsc-query-patterns.md](../gsc-analysis/references/gsc-query-patterns.md) |

## Fallback Output (CLI / No Artifact Panel)

When `preview_grid_dashboard` or `preview_action_report` is not available, output both dashboard summary and action items as formatted markdown directly in the conversation.

## Related Skills

- **grid-dashboard** — Grid dashboard YAML format reference (cell types, layout, merging)
- **action-report** — Action report YAML format reference (as-is/to-be/reason cards)
- **gsc-analysis** — Deep GSC data analysis: Quick Wins, trends, cannibalization, device/country breakdown
- **competitor-analysis** — SERP-based competitor discovery and structural comparison
