# Treasure AI Slides — Examples

This directory contains example code and templates for generating Treasure AI branded presentations.

## Files

- **[slide-generator-example.js](slide-generator-example.js)** — Complete pptxgenjs implementation with logo embedding, brand colors, and layout examples

## Running the Example

### Prerequisites

```bash
npm install pptxgenjs
```

### Generate Sample Presentation

```bash
# From td-skills/creative-skills/treasure-ai-slides/examples/
node slide-generator-example.js
```

**Output**: `TreasureAI_Presentation.pptx` with:
- Title slide (gradient background)
- Content slide (white background, logo, text + visual elements)
- Proper logo placement
- Brand colors applied

## Example Slide Types

The generator demonstrates:

1. **Title Slide**: Gradient background, centered title, logo placement
2. **Content Slide**: White background, left-aligned title, text + decorative box
3. **Logo Embedding**: Both main logo and icon variants

## Customization

Edit `slide-generator-example.js` to:
- Change slide content
- Add more slides
- Adjust layouts (2-column, 3-column, bento grid)
- Apply different gradient backgrounds

## Brand Compliance

All examples follow the design system in [`../references/design.md`](../references/design.md):
- Arial fonts
- Navy Blue `#2D40AA` text
- White `#FFFFFF` content backgrounds
- Logo at x: 0.2in, y: 0.15in
- Visual elements on every slide

## Troubleshooting

**Logo not showing**: Verify logo path is correct relative to execution directory:
```javascript
path: '../references/logos/treasure-ai-logo.png'
```

**Colors look wrong**: Ensure hex codes don't include `#` prefix in pptxgenjs:
```javascript
color: '2D40AA'  // ✓ Correct
color: '#2D40AA' // ✗ Wrong
```

**Gradients not rendering**: pptxgenjs has limited gradient support. For complex gradients, use PowerPoint templates or XML manipulation.
