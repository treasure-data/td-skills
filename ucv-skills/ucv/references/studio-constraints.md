# Treasure Studio Rendering Constraints

## Overview

Treasure Studio renders HTML files in a sandboxed iframe via `mcp__tdx-studio__preview_document`. This iframe has strict security restrictions that affect how dashboards can be built.

## What Works

- **Static HTML** — All standard HTML5 elements render correctly
- **Inline CSS** — `<style>` blocks in `<head>` work as expected
- **CSS animations/transitions** — `transition`, `@keyframes`, `transform` all work
- **CSS interactivity** — `:checked`, `:hover`, `:focus`, `:target` pseudo-classes work
- **Inline SVG** — Full SVG support including `<circle>`, `<line>`, `<rect>`, `<text>`, `<path>`
- **Data URIs** — `data:` URLs for images work
- **HTML forms** — Radio buttons, checkboxes, and labels work (used for tab switching)

## What Does NOT Work

- **`<script>` tags** — All JavaScript execution is blocked, both inline and external
- **External CDN scripts** — React, Plotly, Babel, D3, Chart.js will not load
- **Inline event handlers** — `onclick`, `onload`, `onchange` do not fire
- **External stylesheets** — `<link rel="stylesheet">` may not load
- **External fonts** — Google Fonts and other web font imports may fail
- **`<iframe>` nesting** — Nested iframes are blocked

## CSS Tab Switching Pattern

Since JavaScript-based tab switching doesn't work, use the hidden radio button pattern:

1. Place `<input type="radio">` elements with `display:none`
2. Follow each input with a `<label for="input-id">`
3. Use `input:checked+label` to style the active tab
4. Use `#input-id:checked~.content-wrapper .content-class` to show/hide content panels
5. All inputs, labels, and the content wrapper must be siblings (direct children of the same parent)

## Key Technical Details

- The iframe uses `sandbox` attributes that prevent script execution
- CSS `display:none` elements remain DOM siblings (required for `+` and `~` combinators)
- CSS Grid ignores `display:none` elements when calculating grid cell placement
- SVG in HTML requires no namespace declaration when inline (not via `<img>` or `<object>`)

## Tested and Confirmed

These specific tests were performed against Treasure Studio:

| Test | Result |
|------|--------|
| Inline `<script>alert('test')</script>` | **Blocked** — no execution |
| `<div id="test"></div><script>document.getElementById('test').textContent='works'</script>` | **Blocked** — div remains empty |
| CSS radio button `:checked` + label switching | **Works** |
| CSS Grid layout | **Works** |
| Inline SVG with circles, lines, text | **Works** |
| CSS `transform: rotate()` for gauges | **Works** |
| CSS `linear-gradient` backgrounds | **Works** |
