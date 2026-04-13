# PptxGenJS Conversion Reference

Conversion details for the bundled scripts in `scripts/`.

## Unit Conversions

```
1px = 0.75pt
96px = 1 inch
PptxGenJS positions (x, y, w, h) = inches
PptxGenJS font sizes = points
PptxGenJS colors = hex without # ("4472C4" not "#4472C4")
PptxGenJS margin array = [left, right, bottom, top] (NOT CSS order)
```

## Scripts Overview

### validate.js

Quick validation before full extraction. Run:

```bash
agent-browser open "file://$(pwd)/tmp/slides/slide-0.html"
cat scripts/validate.js | agent-browser eval --stdin --json
```

Returns: `{ "valid": true/false, "errors": ["..."] }`

Checks: body dimensions, overflow, `<br>` tags, unwrapped text in divs, manual bullets, backgrounds on text elements, placeholder sizing, bottom margin, web-safe fonts, out-of-bounds elements.

### extract-dom.js

Full DOM extraction. Run after opening the HTML in agent-browser:

```bash
cat scripts/extract-dom.js | agent-browser eval --stdin --json
```

The `data.result` field (string) parses to:

```json
{
  "background": { "type": "color", "value": "FFFFFF" },
  "elements": [
    { "type": "shape", "position": { "x": 0, "y": 0, "w": 10, "h": 0.83 }, "fill": "1A365D", ... },
    { "type": "h1", "text": "Title", "position": { "x": 0.31, "y": 0.25, ... }, "style": { "fontSize": 21, ... } },
    { "type": "list", "items": [...], "position": {...}, "style": {...} }
  ],
  "placeholders": [
    { "id": "chart1", "x": 3.96, "y": 1.04, "w": 3.33, "h": 2.71 }
  ],
  "errors": []
}
```

Element types extracted:
- `shape` — DIVs with background/border (converted to PptxGenJS shapes)
- `gradientDiv` — DIVs with CSS gradient (need rasterization)
- `line` — Partial borders (non-uniform border sides)
- `image` — `<img>` tags
- `list` — `<ul>`/`<ol>` with nested items and inline formatting
- `pre` — Code blocks with monospace font
- `p`, `h1`-`h6` — Text elements with full style extraction

### render-placeholders.js

Renders chart/table/image content into placeholder divs for visual preview. Prerequisites: set `window.__PLACEHOLDERS__` and inject Chart.js CDN before running.

```bash
agent-browser eval "window.__PLACEHOLDERS__ = <JSON array>"
agent-browser eval "var s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js';document.head.appendChild(s)"
agent-browser wait 2000
cat scripts/render-placeholders.js | agent-browser eval --stdin --json
```

Returns: `{ "rendered": <number>, "errors": ["..."] }`

### build-pptx.js

Assembles PPTX from extracted data. Run:

```bash
node scripts/build-pptx.js config.json output.pptx
```

## config.json Format

```json
{
  "slides": [
    {
      "extracted": {
        "background": { "type": "gradient", "css": "linear-gradient(...)" },
        "elements": [ ... ],
        "placeholders": [ { "id": "chart1", "x": 3.96, "y": 1.04, "w": 3.33, "h": 2.71 } ]
      },
      "bgImagePath": "./tmp/slides/slide-0-bg.png",
      "placeholders": [
        {
          "id": "chart1",
          "type": "chart",
          "chartType": "bar",
          "chartData": {
            "series": [{ "name": "Revenue", "labels": ["Q1","Q2","Q3","Q4"], "values": [1200,1500,1800,2100] }],
            "options": { "title": "Quarterly Revenue", "showLegend": false }
          }
        }
      ]
    },
    {
      "extracted": { "background": { "type": "color", "value": "F5F5F5" }, "elements": [...], "placeholders": [] },
      "placeholders": []
    }
  ]
}
```

### Fields

| Field | Required | Description |
|-------|----------|-------------|
| `extracted` | Yes | Output from `extract-dom.js` (parsed from `data.result`) |
| `bgImagePath` | No | Path to rasterized gradient background image |
| `placeholders` | No | Array of placeholder content definitions |

### Placeholder Definition Types

**Chart:**
```json
{ "id": "chart1", "type": "chart", "chartType": "bar|line|pie|doughnut|scatter",
  "chartData": { "series": [{ "name": "...", "labels": [...], "values": [...] }],
                 "options": { "title": "...", "showLegend": true, "categoryAxisTitle": "...", "valueAxisTitle": "...", "colors": ["4472C4","ED7D31"] } } }
```

**Table:**
```json
{ "id": "table1", "type": "table",
  "tableData": { "headers": ["Col1","Col2"], "rows": [["a","b"],["c","d"]],
                 "options": { "headerBackground": "4472C4", "headerColor": "FFFFFF" } } }
```

**Image:**
```json
{ "id": "img1", "type": "image",
  "imageData": { "url": "https://images.unsplash.com/photo-xxx?w=800", "alt": "Description" } }
```

## Gradient Rasterization

CSS gradients can't be directly represented in PowerPoint. Rasterize by screenshot with **content hidden** to avoid double-rendering text:

```bash
# CRITICAL: Set viewport to slide dimensions first
agent-browser set viewport 960 540

# Hide all content, screenshot background only, then restore
agent-browser eval "document.querySelectorAll('body > *').forEach(e => e.style.visibility='hidden')"
agent-browser screenshot ./tmp/slides/slide-0-bg.png --json
agent-browser eval "document.querySelectorAll('body > *').forEach(e => e.style.visibility='')"
```

**Why hide content?** The screenshot includes rendered text. If used as background, text appears twice: once in the background image and once as PptxGenJS text elements.

For **div gradients**, get the box coordinates and crop from the hidden-content screenshot:

```bash
agent-browser get box "#gradient-div-id" --json
# Use sharp to crop: sharp(screenshot).extract({left, top, width, height}).toFile(output)
```

Set `bgImagePath` in config.json for body gradients. For div gradients, add `rasterizedPath` to the element in the extracted data before passing to build-pptx.js.

## Workflow Example

```bash
# 0. CRITICAL: Set viewport to match slide dimensions (720pt = 960px, 405pt = 540px)
agent-browser set viewport 960 540

# 1. Generate HTML slides (write slide-0.html, slide-1.html, ...)
mkdir -p ./tmp/slides

# 2. For each slide: validate → extract → screenshot
for i in 0 1 2; do
  agent-browser open "file://$(pwd)/tmp/slides/slide-${i}.html"

  # Validate
  cat $SKILL_DIR/scripts/validate.js | agent-browser eval --stdin --json

  # Visual review screenshot
  agent-browser screenshot "./tmp/slides/slide-${i}.png" --json

  # For gradient backgrounds: hide content, screenshot bg only, restore
  agent-browser eval "document.querySelectorAll('body > *').forEach(e => e.style.visibility='hidden')"
  agent-browser screenshot "./tmp/slides/slide-${i}-bg.png" --json
  agent-browser eval "document.querySelectorAll('body > *').forEach(e => e.style.visibility='')"

  # Extract DOM positions
  cat $SKILL_DIR/scripts/extract-dom.js | agent-browser eval --stdin --json
  # → save data.result to ./tmp/slides/slide-${i}.json
done

# 3. Build config.json from extracted data + placeholder definitions

# 4. Preview: render placeholders into HTML and screenshot for review
for i in 0 1 2; do
  agent-browser open "file://$(pwd)/tmp/slides/slide-${i}.html"
  agent-browser set viewport 960 540

  # Set placeholder data from config.json
  agent-browser eval "window.__PLACEHOLDERS__ = $(jq ".slides[${i}].placeholders" ./tmp/config.json)"

  # Inject Chart.js for chart rendering
  agent-browser eval "var s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js';document.head.appendChild(s)"
  agent-browser wait 2000

  # Render placeholders and take preview screenshot
  cat $SKILL_DIR/scripts/render-placeholders.js | agent-browser eval --stdin --json
  agent-browser wait 1000
  agent-browser screenshot "./tmp/slides/slide-${i}-preview.png" --json
  open "./tmp/slides/slide-${i}-preview.png"  # Visual review
done

# 5. Assemble PPTX
node $SKILL_DIR/scripts/build-pptx.js ./tmp/config.json ./output/presentation.pptx
agent-browser close
```

## Common Pitfalls

| Issue | Cause | Fix |
|-------|-------|-----|
| **Background doesn't fill slide** | Viewport wider than 960px | `agent-browser set viewport 960 540` before any operation |
| **Text doubled/overlapping** | Screenshot bg includes text | Hide content before bg screenshot (`visibility='hidden'`) |
| Text missing in PPTX | Text directly in `<div>` | Wrap in `<p>` or `<h1>`-`<h6>` |
| Wrong font size | Using px in PptxGenJS | Convert: `px * 0.75 = pt` |
| Element mispositioned | Wrong unit | Positions must be inches: `px / 96` |
| Colors with `#` | PptxGenJS no-prefix | `"4472C4"` not `"#4472C4"` |
| Single-line text wraps | Width underestimate | build-pptx.js auto-adds 2% |
| Gradient blank | Not rasterized | Hide content → screenshot → set bgImagePath |
| Inset shadow corrupts | PptxGenJS limitation | extract-dom.js skips inset shadows |
| margin array order | Not CSS order | `[left, right, bottom, top]` |
