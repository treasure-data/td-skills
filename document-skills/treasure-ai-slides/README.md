# Treasure AI Slides

Claude Code skill for generating professional PowerPoint presentations that follow Treasure AI's official brand guidelines.

## Overview

This skill teaches Claude Code to create branded slide decks with:
- Treasure AI color palette (Navy Blue `#2D40AA`, Purple, Pink, Sky Blue)
- Proper typography (Manrope/Arial, Noto Sans JP/MS Pゴシック)
- Brand-compliant layouts (Title, Section Divider, Content, Multi-column)
- Japanese kinsoku shori (禁則処理) support
- Layout variation principles (avoid repetitive patterns)

## Quick Start

### In Claude Code

```
"Create a Treasure AI presentation about [topic]"
```

Claude automatically:
1. Analyzes content and selects appropriate layouts
2. Applies brand colors and gradients
3. Uses correct fonts (Arial/Manrope for English, Noto Sans JP for Japanese)
4. Follows layout variation principles
5. Applies Japanese kinsoku shori when needed

### Example Prompts

**Basic:**
```
"Create a Treasure AI slide deck about our product features"
```

**Structured:**
```
Create a Treasure AI presentation:
Title: Platform Overview
Slides:
1. Title slide
2. Section divider: What is Treasure AI?
3. Content: Platform introduction (2-column layout)
4. 3-column grid: Key Features
5. Device mockup: Demo screen
6. Content: Use cases
7. Thank You
```

## Files

- **[SKILL.md](SKILL.md)** — Main skill definition for Claude Code
- **[references/design.md](references/design.md)** — Complete Treasure AI design system specification
- **[references/brand-guidelines.md](references/brand-guidelines.md)** — Quick reference for brand colors, fonts, rules
- **[references/layouts.md](references/layouts.md)** — Layout catalog with decision tree
- **[references/logos/](references/logos/)** — Logo assets (PNG format)
  - `treasure-ai-logo.png` — Main horizontal logo
  - `treasure-ai-icon.png` — Icon only
- **[examples/](examples/)** — Sample code and templates
  - `working-example-v4.js` — pptxgenjs v4 implementation (fallback)
  - `simple-python-example.py` — python-pptx implementation (recommended)

## Design System Highlights

### Brand Colors

| Name | HEX | RGB | Usage |
|------|-----|-----|-------|
| Navy Blue | `#2D40AA` | `(45, 64, 170)` | Primary (titles, headings) |
| Purple | `#847BF2` | `(132, 123, 242)` | Accents, highlights |
| Pink | `#C466D4` | `(196, 102, 212)` | Secondary accents |
| Sky Blue | `#80B3FA` | `(128, 179, 250)` | Supporting elements |
| White | `#FFFFFF` | `(255, 255, 255)` | Content backgrounds |

### Typography

- **English**: Manrope (primary), Arial (fallback)
- **Japanese**: Noto Sans JP (primary), MS Pゴシック (fallback)
- **Slide Titles**: 36-44pt Bold
- **Body Text**: 13-16pt Regular
- **Subtitles**: 16-18pt Regular, Navy or Pink

### Gradient Themes

Choose based on presentation purpose:
- **Default (Navy)**: Formal / Executive
- **Sunset (Warm)**: Customer-facing / Friendly
- **Rainbow (Multi-color)**: Product portfolio / Diversity
- **Dusk (Tech)**: Technology / Data
- **Lavender (Soft)**: Partner / Trust-building

### Layout Types

1. **Title Slide** — Gradient background, large title
2. **Section Divider** — Gradient background, section name
3. **Content Slide** — White background, text + visual
4. **2-Column** — Text + Visual side-by-side
5. **3-Column Grid** — Three parallel elements
6. **4-Column Grid** — Four parallel elements
7. **Device Mockup** — Large screen image + text
8. **Bento Grid** — Asymmetric dashboard-style
9. **End Slide** — Gradient background, "Thank You"

## Layout Variation Principles

### ✓ Do
- Vary layouts based on content type
- Use 3-Column for three parallel elements
- Use Device Mockup for demo screens
- Place Section Divider between major sections

### ✗ Don't
- Use same layout 3+ times in a row
- Use only Content slides with bullet points
- Skip Section Dividers between major sections

### Good Example (14-slide deck)
```
1.  Title Slide
2.  Section Divider
3.  Content (with chart area)
4.  Section Divider
5.  Device Mockup
6.  3-Column Grid
7.  Content (detailed text)
8.  Content (visual-heavy)
9.  Section Divider
10. Content
11. Device Mockup
12. End Slide
```

## Japanese Typography

When creating slides with Japanese text, apply kinsoku shori (禁則処理):
- **No punctuation (、。) at line start**
- **No opening brackets (（「) at line end**
- **Keep multi-char symbols together (…… ——)**

python-pptx automatically applies these rules when Japanese fonts are set:
```python
para.font.name = 'Noto Sans JP'  # or 'MS Pゴシック'
text_frame.word_wrap = True
```

See `references/design.md` for complete kinsoku rules.

## Implementation

### Recommended: python-pptx

```python
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor

# Colors
NAVY = RGBColor(45, 64, 170)
WHITE = RGBColor(255, 255, 255)

# Create presentation
prs = Presentation()
prs.slide_width = Inches(13.33)  # 16:9
prs.slide_height = Inches(7.5)

# Title slide
slide = prs.slides.add_slide(prs.slide_layouts[6])  # Blank
slide.background.fill.solid()
slide.background.fill.fore_color.rgb = NAVY

# Add title
title_box = slide.shapes.add_textbox(
    Inches(0.94), Inches(2.37), Inches(9.94), Inches(1.64)
)
title_frame = title_box.text_frame
title_frame.text = 'Presentation Title'
# ... set font, size, color

prs.save('TreasureAI_Presentation.pptx')
```

See `examples/simple-python-example.py` for complete implementation.

### Fallback: pptxgenjs

For quick Node.js-based generation (limitations apply):
- Gradient backgrounds not supported in v4
- Use solid colors + decorative shapes instead

See `examples/working-example-v4.js` for pptxgenjs implementation.

## Logo Usage

### Standard Placement
- **Position**: Top-left corner
- **Coordinates**: x: 0.2in, y: 0.15in
- **Size**: w: 1.5in, h: 0.35in

### python-pptx Implementation
```python
slide.shapes.add_picture(
    'references/logos/treasure-ai-logo.png',
    Inches(0.2), Inches(0.15),
    height=Inches(0.35)
)
```

### Fallback (if logo image unavailable)
```python
# Text logo
logo_box = slide.shapes.add_textbox(
    Inches(0.2), Inches(0.15), Inches(2), Inches(0.35)
)
logo_frame = logo_box.text_frame
logo_frame.text = '◆ Treasure AI'
logo_para = logo_frame.paragraphs[0]
logo_para.font.name = 'Arial'
logo_para.font.size = Pt(14)
logo_para.font.bold = True
logo_para.font.color.rgb = NAVY
```

## Quality Checklist

Before delivering slides, verify:

- [ ] Logo on all slides (top-left standard position)
- [ ] Title/section slides have gradient backgrounds (or Navy solid)
- [ ] Content slides have white backgrounds (not cream/beige)
- [ ] Font is Manrope/Arial (English) or Noto Sans JP (Japanese)
- [ ] No text overflowing boxes
- [ ] No decorative lines under titles
- [ ] All slides have visual elements (images/icons/shapes)
- [ ] Rounded corners on images
- [ ] Accent colors (purple/pink) used sparingly
- [ ] No same layout 3+ times in a row
- [ ] Japanese text applies kinsoku shori

## Development

### Running Examples

**Python (recommended)**:
```bash
cd examples/
pip install python-pptx
python simple-python-example.py
# Output: TreasureAI_Presentation.pptx
```

**Node.js (fallback)**:
```bash
cd examples/
npm install pptxgenjs
node working-example-v4.js
# Output: TreasureAI_Presentation_v4.pptx
```

## Reference

Full design specification: [references/design.md](references/design.md)

Includes:
- Complete color palette with hex codes
- Gradient definitions (5 themes)
- Font sizing guidelines
- Layout specifications (margins, spacing)
- Japanese kinsoku shori rules
- Implementation code (python-pptx, pptxgenjs, XML)
- QA checklist

## Related Skills

- **brand-compliance** — Validate slides against brand guidelines
- **brand-onboarding** — Create custom brand guidelines

## Troubleshooting

### Logo not displaying
**Issue**: Logo image files not included in repository

**Reason**: Logo files must be placed manually by users with access to Treasure AI brand assets.

**Solutions**:

1. **Place actual logo PNG files** (recommended):
   ```bash
   # Add logo files to:
   references/logos/treasure-ai-logo.png  # Main horizontal logo
   references/logos/treasure-ai-icon.png  # Icon only
   
   # Verify files are actual images
   file references/logos/*.png
   # Should show: "PNG image data, ..."
   ```

2. **Use text logo fallback**: The Python example already includes text logo fallback (see [examples/simple-python-example.py](examples/simple-python-example.py))

3. **Extract from official template**: If you have `tai-template.pptx`:
   ```bash
   unzip tai-template.pptx -d temp
   cp temp/ppt/media/image1.png references/logos/treasure-ai-logo.png
   rm -rf temp
   ```

See [LOGO_SETUP.md](LOGO_SETUP.md) for detailed instructions.

### Gradients not rendering
**Issue**: python-pptx doesn't support gradient backgrounds

**Solutions**:
1. Use solid Navy (`#2D40AA`) background
2. Add decorative shapes with transparency for gradient-like effect
3. Manually set gradients in PowerPoint after generation

### Japanese fonts not applied
```python
# Explicitly set font
para.font.name = 'Noto Sans JP'  # or 'MS Pゴシック'

# Check font is installed
# Mac: Font Book
# Windows: Settings > Fonts
```

### Kinsoku not working
```python
# Enable word wrap
text_frame.word_wrap = True

# Set appropriate textbox width
# Kinsoku is automatically applied with Japanese fonts
```

## License

Internal Treasure Data use only.

---

**Version**: 2.0  
**Last Updated**: 2026-04-22  
**Based on**: Treasure AI 2026 Official Design System
