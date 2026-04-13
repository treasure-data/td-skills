---
name: pptx
description: >
  Use this skill any time the user wants to create a new PowerPoint presentation, slide deck,
  pitch deck, or .pptx file from scratch. Covers creating business presentations, quarterly
  reports, project proposals, product roadmaps, training materials, and any multi-slide
  document destined for PowerPoint. Works by generating HTML/CSS slides (which LLMs excel at),
  rendering them in agent-browser for pixel-accurate DOM position extraction, and assembling
  the final PPTX with native PowerPoint charts, tables, and images via PptxGenJS.
  Includes bundled scripts for validation, DOM extraction, and PPTX assembly.
  Do NOT use this skill for editing existing PPTX files, converting other formats to PPTX,
  or extracting content from PPTX files.
---

# HTML-to-PPTX Presentation Generator

Generate professional PowerPoint files by writing HTML/CSS slides and converting them to PPTX with pixel-accurate positioning.

**Why HTML?** LLMs excel at HTML/CSS. Instead of wrestling with PptxGenJS's coordinate system directly, write HTML slides and let the browser compute exact element positions via `getBoundingClientRect()`.

## When to Use

- User asks to **create** a presentation, slide deck, or .pptx file
- User needs slides for a report, proposal, roadmap, or pitch
- User wants charts, tables, or images in PowerPoint format

**Do NOT use for:** editing existing .pptx, converting formats, or reading/extracting from .pptx.

## Prerequisites

```bash
npm install pptxgenjs sharp
npx agent-browser@latest install
```

## Pipeline Overview

```
1. Generate HTML slides (720pt x 405pt, strict element rules)
2. Validate and render via agent-browser (screenshot for visual review)
3. Extract DOM positions via agent-browser eval (getBoundingClientRect)
4. Assemble PPTX with PptxGenJS using extracted coordinates
```

## Workflow

### Step 1: Generate HTML Slides

Write HTML following the rules in [references/html-rules.md](references/html-rules.md). Use templates from [references/slide-templates.md](references/slide-templates.md).

Key constraints:
- Body: `width: 720pt; height: 405pt; margin: 0; padding: 0`
- Text MUST be in `<p>`, `<h1>`-`<h6>`, `<ul>/<ol>` (text in `<div>` won't convert)
- No `<br>` tags, no manual bullet symbols
- Web-safe fonts only (Arial recommended)
- Bottom margin: keep 36pt+ from bottom edge
- Placeholders: `<div class="placeholder" id="chart1" style="width:300pt;height:200pt;">`

Save each slide as a separate HTML file:

```bash
mkdir -p ./tmp/slides
# Write slide-0.html, slide-1.html, etc.
```

### Step 2: Validate with agent-browser

**CRITICAL: Set viewport to match slide dimensions before any operation.**

```bash
# Set viewport to exactly 960x540 (720pt x 405pt at 96dpi)
agent-browser set viewport 960 540

agent-browser open "file://$(pwd)/tmp/slides/slide-0.html"
cat $SKILL_DIR/scripts/validate.js | agent-browser eval --stdin --json
```

Returns `{ "valid": true/false, "errors": [...] }`. Fix any errors before proceeding.

Take a screenshot for visual review:

```bash
agent-browser screenshot ./tmp/slides/slide-0.png --json
```

### Step 3: Extract DOM Positions

Use the bundled extraction script to get all element positions, styles, and placeholder coordinates:

```bash
cat $SKILL_DIR/scripts/extract-dom.js | agent-browser eval --stdin --json
```

The `data.result` field contains JSON: `{ background, elements, placeholders, errors }`.
Save each slide's extracted data to a JSON file for the build step.

For gradient backgrounds, rasterize **only the background** (hide content to avoid double-rendering text):

```bash
# Hide all content, screenshot background only, then restore
agent-browser eval "document.querySelectorAll('body > *').forEach(e => e.style.visibility='hidden')"
agent-browser screenshot ./tmp/slides/slide-0-bg.png --json
agent-browser eval "document.querySelectorAll('body > *').forEach(e => e.style.visibility='')"
```

### Step 4: Assemble PPTX

Create a `config.json` that references each slide's extracted data and placeholder definitions, then run the bundled build script:

```bash
node scripts/build-pptx.js config.json output.pptx
```

See [references/pptxgenjs.md](references/pptxgenjs.md) for config.json format and details.

## Placeholder System

Placeholders reserve space in HTML for native PowerPoint content (charts, tables, images). The `<div>` defines position/size; PptxGenJS fills the content.

```html
<div class="placeholder" id="chart1" style="width: 300pt; height: 200pt;"></div>
```

Three types supported: `chart` (bar, line, pie, doughnut, scatter), `table`, and `image`. See [references/pptxgenjs.md](references/pptxgenjs.md) for complete placeholder JSON formats.

## Design Consistency

The title slide (slide 0) establishes the visual language. Apply consistently:

| Element | Rule |
|---------|------|
| Header bar | Same height and background color on all slides |
| Content padding | Same padding values across slides |
| Font sizes | h1: 28pt, h2: 20pt, body: 16pt, caption: 12pt |
| Colors | Primary for headers, secondary for subheadings, accent for highlights |

## Scripts

All scripts are in this skill's `scripts/` directory. Find the skill path and use it:

```bash
SKILL_DIR="$(dirname "$(find ~/.claude -path '*/document-skills/pptx/SKILL.md' 2>/dev/null | head -1)")"
```

| Script | Run with | Purpose |
|--------|----------|---------|
| `validate.js` | `cat $SKILL_DIR/scripts/validate.js \| agent-browser eval --stdin --json` | Quick HTML validation |
| `extract-dom.js` | `cat $SKILL_DIR/scripts/extract-dom.js \| agent-browser eval --stdin --json` | Full DOM extraction |
| `build-pptx.js` | `node $SKILL_DIR/scripts/build-pptx.js config.json output.pptx` | PPTX assembly |

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| **Background doesn't fill slide** | Viewport wider than 960px, screenshot includes whitespace | `agent-browser set viewport 960 540` before any operation |
| **Text appears doubled/overlapping** | Screenshot used as bg includes rendered text | Hide content before bg screenshot: `visibility='hidden'` |
| agent-browser command not found | Not installed | `npx agent-browser@latest install` |
| Text missing in PPTX | Text directly in `<div>` | Wrap in `<p>` or `<h1>`-`<h6>` |
| Gradient background blank | Not rasterized | Hide content, screenshot, set `bgImagePath` in config |
| Overflow validation fails | Content exceeds 720pt x 405pt | Reduce font sizes, padding, or content |
| Bottom margin error | Text within 0.5in of bottom | Add `padding-bottom: 48pt` to content area |
| PPTX file corrupted | Inset box-shadow used | Use outer shadows only |

## Reference Files

- [HTML Rules](references/html-rules.md) - Complete HTML generation constraints
- [Slide Templates](references/slide-templates.md) - Templates for each slide type
- [PptxGenJS Conversion](references/pptxgenjs.md) - Config format, placeholder JSON, and conversion details
