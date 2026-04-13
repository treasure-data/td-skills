# HTML Rules for PPTX Conversion

These rules ensure HTML slides convert accurately to PowerPoint. Violations cause missing text, broken layouts, or file corruption.

## Slide Dimensions

```css
body {
  width: 720pt;
  height: 405pt;
  margin: 0;
  padding: 0;
  font-family: Arial, sans-serif;
  display: flex;
  flex-direction: column;
}
```

720pt x 405pt = 10" x 5.625" = standard 16:9 PowerPoint layout.

## Text Elements

All visible text MUST be inside these elements:

| Element | Usage |
|---------|-------|
| `<p>` | Paragraphs, body text |
| `<h1>` - `<h6>` | Headings |
| `<ul>`, `<ol>` with `<li>` | Lists |
| `<pre>` | Code blocks (monospace) |

### Critical: Text in `<div>` is Invisible

```html
<!-- WRONG: text disappears in PPTX -->
<div>This text will not appear</div>
<div style="font-size: 16pt;">Also invisible</div>

<!-- CORRECT: wrap in text element -->
<div>
  <p>This text will appear</p>
</div>
```

The converter extracts text only from `<p>`, `<h1>`-`<h6>`, `<li>`, and `<pre>` tags.

## Forbidden Patterns

### No `<br>` Tags

```html
<!-- WRONG -->
<p>Line 1<br>Line 2<br>Line 3</p>

<!-- CORRECT -->
<p>Line 1</p>
<p>Line 2</p>
<p>Line 3</p>
```

### No Manual Bullet Symbols

```html
<!-- WRONG -->
<p>* Item 1</p>
<p>- Item 2</p>

<!-- CORRECT -->
<ul>
  <li>Item 1</li>
  <li>Item 2</li>
</ul>
```

### No Elements Beyond Slide Bounds

All elements must fit within 720pt x 405pt. No decorative shapes extending beyond edges.

```html
<!-- WRONG: extends beyond slide -->
<div style="position: absolute; top: -50pt; right: -50pt; width: 200pt; height: 200pt; border-radius: 50%; background: #ccc;"></div>

<!-- CORRECT: use gradient instead -->
<body style="background: linear-gradient(135deg, #1A365D 0%, #2B6CB0 100%);">
```

## Bottom Margin

Keep text at least 36pt (0.5 inches) from the bottom edge. Use `padding-bottom: 48pt` on content containers.

```css
.content {
  flex: 1;
  padding: 30pt;
  padding-bottom: 48pt; /* safety margin */
}
```

## Web-Safe Fonts Only

Arial, Helvetica, Times New Roman, Georgia, Courier New, Verdana, Tahoma, Trebuchet MS, Impact.

Other fonts will be substituted unpredictably in PowerPoint.

## Shape Styling

Backgrounds, borders, border-radius, and box-shadow work ONLY on `<div>` elements:

```html
<!-- CORRECT: shape with text -->
<div style="background: #f0f0f0; border-radius: 8pt; padding: 20pt; border: 1pt solid #ccc;">
  <p>Content here</p>
</div>

<!-- WRONG: background on text element (ignored in PPTX) -->
<p style="background: #f0f0f0;">Content</p>
```

## CSS Gradients

Supported on `<body>` and `<div>` elements. Automatically rasterized to PNG during conversion.

```css
body { background: linear-gradient(135deg, #1A365D 0%, #2B6CB0 100%); }
```

Radial gradients also supported:
```css
body { background: radial-gradient(circle at top right, #1A365D 0%, #2B6CB0 100%); }
```

## Placeholders

Reserve space for native PowerPoint content (charts, tables, images).

```html
<div class="placeholder" id="chart1"
     style="width: 300pt; height: 200pt; position: absolute; left: 150pt; top: 100pt;">
</div>
```

Requirements:
- Must have `class="placeholder"`
- Must have unique `id`
- Must have explicit `width` and `height` in pt
- Position with `position: absolute` or within flex layout
- Content is empty (PptxGenJS fills it)

## Overflow Validation

Check after rendering:

```javascript
const body = document.body;
const s = window.getComputedStyle(body);
const overflowX = body.scrollWidth > parseFloat(s.width) + 1;
const overflowY = body.scrollHeight > parseFloat(s.height) + 1;
```

If overflow detected:
- Horizontal: reduce font-size, padding, or element widths
- Vertical: reduce content, remove elements, or decrease spacing
- Check for absolute-positioned elements extending beyond bounds

## Supported CSS Properties

| Property | Where | Notes |
|----------|-------|-------|
| `font-size`, `font-family`, `color` | Text elements | Converted to PPTX text props |
| `font-weight: bold`, `font-style: italic` | Text elements | |
| `text-align` | Text elements | left, center, right |
| `text-decoration: underline` | Text elements | |
| `text-transform` | Text elements | uppercase, lowercase, capitalize |
| `line-height` | Text elements | Converted to lineSpacing |
| `background`, `background-color` | `<div>`, `<body>` | Gradients rasterized to PNG |
| `border`, `border-radius` | `<div>` | Converted to PPTX shape borders |
| `box-shadow` | `<div>` | Converted to PPTX shadow |
| `text-shadow` | Text elements | Converted to PPTX text shadow |
| `opacity` | Any | Converted to transparency |
| `transform: rotate()` | Text elements | 90, 270 for vertical text |
| `padding`, `margin` | Any | Used for positioning |

## Color Format

Use hex colors without `#` prefix in PptxGenJS: `"4472C4"` not `"#4472C4"`.

In HTML, use standard CSS colors. The converter handles the conversion.
