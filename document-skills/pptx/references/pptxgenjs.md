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

CSS gradients (body or div) can't be directly represented in PowerPoint. Rasterize by screenshot:

```bash
# Body gradient → full-page screenshot as background
agent-browser screenshot ./tmp/slides/slide-0-bg.png --json

# Div gradient → get box coordinates, then crop
agent-browser get box "#gradient-div-id" --json
# Use sharp to crop the region from the full screenshot
```

Set `bgImagePath` in config.json for body gradients. For div gradients, add `rasterizedPath` to the element in the extracted data before passing to build-pptx.js.

## Workflow Example

```bash
# 1. Generate HTML slides (write slide-0.html, slide-1.html, ...)
mkdir -p ./tmp/slides

# 2. For each slide: validate → extract → screenshot
for i in 0 1 2; do
  agent-browser open "file://$(pwd)/tmp/slides/slide-${i}.html"

  # Validate
  cat scripts/validate.js | agent-browser eval --stdin --json

  # Screenshot (also serves as gradient background if needed)
  agent-browser screenshot "./tmp/slides/slide-${i}.png" --json

  # Extract DOM
  cat scripts/extract-dom.js | agent-browser eval --stdin --json
  # → save data.result to ./tmp/slides/slide-${i}.json
done

# 3. Build config.json from extracted data + placeholder definitions
# 4. Assemble
node scripts/build-pptx.js ./tmp/config.json ./output/presentation.pptx
agent-browser close
```

## Common Pitfalls

| Issue | Cause | Fix |
|-------|-------|-----|
| Text missing in PPTX | Text directly in `<div>` | Wrap in `<p>` or `<h1>`-`<h6>` |
| Wrong font size | Using px in PptxGenJS | Convert: `px * 0.75 = pt` |
| Element mispositioned | Wrong unit | Positions must be inches: `px / 96` |
| Colors with `#` | PptxGenJS no-prefix | `"4472C4"` not `"#4472C4"` |
| Single-line text wraps | Width underestimate | build-pptx.js auto-adds 2% |
| Gradient blank | Not rasterized | Screenshot → set bgImagePath |
| Inset shadow corrupts | PptxGenJS limitation | extract-dom.js skips inset shadows |
| margin array order | Not CSS order | `[left, right, bottom, top]` |
