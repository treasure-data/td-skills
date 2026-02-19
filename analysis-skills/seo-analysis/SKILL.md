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
| SerpAPI | `serpapi_google_search` | No — skip SERP feature analysis |
| GA4 | `google_analytics_list_properties` | No — skip behavior metrics |

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
- Use `dimensions: ["query", "page"]` for keyword→page mapping

### SerpAPI (`serpapi_google_search`)

**Availability check** (required before use):
```
ToolSearch { "query": "select:mcp__tdx-studio__serpapi_google_search", "max_results": 1 }
```

Call: `serpapi_google_search({ q: "...", gl: "us", hl: "en" })`. Key response fields: `answer_box`, `ai_overview`, `people_also_ask`, `knowledge_graph`, `organic_results`, `shopping_results`, `local_results`.

### Playwright (`playwright-cli`)

```bash
playwright-cli install --skills                    # setup (once per session)
playwright-cli open <url>                          # open page
playwright-cli run-code "async page => {           # extract HTML
  const html = await page.content(); return html;
}" > ./seo/page.html
playwright-cli goto <url>                          # navigate (after open)
playwright-cli screenshot {cwd}/seo/visual-{slug}.png --full-page  # visual analysis
```

Open screenshots with `open_file` to visually analyze the page — this catches issues that DOM parsing alone cannot detect.

### Google Analytics (`google_analytics_*`)

User behavior data — engagement, bounce rate, conversions per page. Use for monitoring baselines and behavioral context for recommendations.

## Output 1: Data Dashboard

The dashboard shows **data and analysis only** — no action items, no recommendations. Read the **grid-dashboard** skill for YAML format, cell types, and layout reference.

Design the grid layout based on the analysis dimensions you collected. Use `pages:` structure with one entry per analyzed page. One file per site.

Save to `{cwd}/seo/seo-dashboard-{domain}.yaml` and call with the **absolute path**:
```
preview_grid_dashboard({ file_path: "/absolute/path/to/seo/seo-dashboard-{domain}.yaml" })
```

Reference template: [references/dashboard-template.yaml](references/dashboard-template.yaml)

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
| Dashboard Template | YAML template per page (reference example) | [references/dashboard-template.yaml](references/dashboard-template.yaml) |
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
