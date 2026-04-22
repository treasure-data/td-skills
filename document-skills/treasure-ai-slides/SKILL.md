---
name: treasure-ai-slides
description: Create PowerPoint presentations (.pptx) following Treasure AI (formerly Treasure Data) brand guidelines. Used for internal presentations, client proposals, and seminar materials using official design system (Navy Blue #2D40AA, Manrope font, 5 gradient themes). Triggers on requests like "create TD slides", "make Treasure AI presentation", "build branded deck", or "generate presentation".
---

# Treasure AI Branded Slide Generator

Create presentations (.pptx) following the official Treasure AI design system.
Applies brand colors, typography, and layout patterns based on `design.md` specifications.

## Initial Setup

On first use, read these documents:
- [`references/design.md`](references/design.md): Complete design system specification
- [`references/brand-guidelines.md`](references/brand-guidelines.md): Brand guidelines summary
- [`references/layouts.md`](references/layouts.md): Layout catalog

## Core Principles

### 1. Layout Variation (Critical)

**Avoid repeating the same layout. Select layouts based on content type.**

❌ **Avoid**:
- Same layout used 3+ times in a row
- Only bullet-point Content slides
- Missing Section Dividers between major sections

✅ **Recommended**:
- 3 parallel elements → 3-Column layout
- 4 parallel elements → 4-Column layout
- Demo screens/screenshots → Console or Laptop+Text layout
- Steps/procedures → Steps or Timeline layout

### 2. Theme Selection Decision Tree

Choose gradient theme based on presentation purpose:

```
Presentation Purpose?
├─ Formal / Executive        → Default (dark): Navy gradient
├─ Customer-facing / Friendly → Sunset: Warm gradient
├─ Product portfolio / Diversity → Rainbow: Multi-color gradient
├─ Technology / Data          → Dusk: Tech gradient
└─ Partner / Trust-building   → Lavender: Soft gradient
```

### 3. Essential Design Rules

Extracted from `design.md`:

**Colors**:
- Primary: Navy Blue `#2D40AA`
- Accents: Purple `#847BF2`, Pink `#C466D4`, Sky Blue `#80B3FA`
- Background: White `#FFFFFF` or Off-White `#F9FEFF` (content slides)

**Typography**:
- English: Manrope (or Arial fallback)
- Japanese: Noto Sans JP (or MS Pゴシック fallback)
- Slide Titles: 36-44pt Bold
- Body Text: 13-16pt Regular

**Japanese Kinsoku Shori (禁則処理)**:

When slides contain Japanese text, apply line-breaking rules to prevent prohibited characters at line start/end:

- **Line-start prohibition** (行頭禁則): Do not start lines with closing punctuation
  - Prohibited: ）、」、。、！、？、・、：、etc.
  - Example: ❌ `\n）する` → ✅ `なる）\nする`

- **Line-end prohibition** (行末禁則): Do not end lines with opening punctuation
  - Prohibited: （、「、etc.
  - Example: ❌ `データ（\nCDP` → ✅ `データ\n（CDP`

- **No-break** (分離禁止): Keep together
  - English words, numbers (`1,000`), URLs

- **Hanging punctuation** (ぶら下がり処理): Allow punctuation at line end
  - Sentence-ending punctuation (。、、etc.) can exceed right margin

python-pptx automatically applies kinsoku shori when Japanese fonts are set and word wrapping is enabled.

**Layout**:
- Gradient backgrounds: Title, Section Divider, and End slides only
- Content slides: White background
- All slides must have visual elements (images, icons, or shapes)

## Generation Workflow

### Step 1: Requirements Analysis

Determine from user requirements:
1. Presentation purpose (internal/client/seminar)
2. Theme selection (use decision tree above)
3. Slide structure (title, sections, content count)
4. Content and layout for each slide

### Step 2: Layout Mapping

Select optimal layout from `references/design.md` "Available Layout Types":

**Basic Structure Example**:
```
1. Title Slide (A)        - Cover
2. Section Divider (B)    - Section break (gradient background)
3. Content Slide (C)      - Standard content (white background)
4. 2-Column Layout        - Text + Visual side-by-side
5. 3-Column Grid          - Three parallel elements
6. Content Slide (C)      - Detailed explanation
7. Section Divider (B)    - Next section
8. Content Slide (C)      - Summary
9. End Slide (D)          - Thank You
```

**Layout Pattern Variation**:
```python
# Good example (14-slide deck)
layouts = [
    "Title",
    "Section Divider",
    "Content (with chart)",
    "Section Divider",
    "Device Mockup",
    "3-Column Grid",
    "Content (text-heavy)",
    "Content (visual-heavy)",
    "Section Divider",
    "Content",
    "Device Mockup",
    "End"
]
# → 6 different layout types, no 3+ consecutive repeats
```

### Step 3: Code Generation

Use **python-pptx** (recommended) or pptxgenjs (fallback):

**python-pptx example** (see `examples/simple-python-example.py`):
```python
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor

NAVY = RGBColor(45, 64, 170)
prs = Presentation()
prs.slide_width = Inches(13.33)  # 16:9
prs.slide_height = Inches(7.5)

# Title slide
slide = prs.slides.add_slide(prs.slide_layouts[6])
slide.background.fill.solid()
slide.background.fill.fore_color.rgb = NAVY

# Add title
title_box = slide.shapes.add_textbox(
    Inches(0.94), Inches(2.37), Inches(11.45), Inches(1.64)
)
title_frame = title_box.text_frame
title_frame.text = 'Presentation Title'
title_para = title_frame.paragraphs[0]
title_para.font.name = 'Arial'
title_para.font.size = Pt(44)
title_para.font.bold = True
title_para.font.color.rgb = RGBColor(255, 255, 255)

prs.save('TreasureAI_Deck.pptx')
```

**Logo placement** (reserved space - no text overlay):
```python
# Logo area: x=0.2in, y=0.15in, w=2.0in, h=0.35in
# To add actual logo image:
# slide.shapes.add_picture(
#     'path/to/treasure-ai-logo.png',
#     Inches(0.2), Inches(0.15),
#     height=Inches(0.35)
# )
```

**Page numbers** (optional, bottom-right):
```python
def add_page_number(slide, page_num, total_pages=None):
    page_text = f"{page_num}/{total_pages}" if total_pages else str(page_num)
    page_box = slide.shapes.add_textbox(
        Inches(11.5), Inches(6.95), Inches(1.5), Inches(0.4)
    )
    page_frame = page_box.text_frame
    page_frame.text = page_text
    page_para = page_frame.paragraphs[0]
    page_para.font.name = 'Arial'
    page_para.font.size = Pt(12)
    page_para.font.color.rgb = RGBColor(102, 102, 102)
    page_para.alignment = PP_ALIGN.RIGHT
```

### Step 4: Quality Check

Before delivering, verify:
- [ ] Logo space reserved (top-left, no text overlay)
- [ ] Title/section slides have gradient backgrounds (or Navy solid)
- [ ] Content slides have white backgrounds
- [ ] Font is Manrope/Arial (English) or Noto Sans JP (Japanese)
- [ ] No text overflowing boxes
- [ ] All slides have visual elements (images/icons/shapes)
- [ ] Rounded corners on images
- [ ] Accent colors (purple/pink) used sparingly
- [ ] No same layout 3+ times in a row
- [ ] Japanese text applies kinsoku shori (if applicable)
- [ ] Page numbers added if user requested

## Available Layout Types

See `references/layouts.md` for complete catalog. Key layouts:

### A. Title Slide
- Navy gradient background
- Large title (44pt)
- Optional subtitle (18pt)
- Logo reserved space (top-left)

### B. Section Divider
- Purple gradient background
- Section title (40pt)
- Logo reserved space

### C. Content Slide
- White background
- Slide title (36pt Navy)
- Bullet points or paragraphs (16pt)
- Logo reserved space

### D. 2-Column Layout
- White background
- Left: Text (50% width)
- Right: Visual (50% width)

### E. 3-Column Grid
- White background
- Three equal-width columns
- Parallel content presentation

### F. 4-Column Grid
- White background
- Four equal-width columns
- Features, stats, or comparison

### G. Device Mockup
- Large screen image (laptop/console)
- Descriptive text beside or below

### H. End Slide
- Navy gradient background
- "Thank You" text (44pt)
- Logo reserved space

## Implementation Patterns

### Gradient Backgrounds

**Limitation**: python-pptx doesn't support gradient backgrounds.

**Solutions**:
1. Use solid Navy (`#2D40AA`) background (acceptable)
2. Add decorative shapes with transparency for gradient-like effect
3. Manually set gradients in PowerPoint after generation

**Example (solid color fallback)**:
```python
slide.background.fill.solid()
slide.background.fill.fore_color.rgb = RGBColor(45, 64, 170)  # Navy
```

### Visual Placeholders

When visual elements are unavailable, add placeholder text:

```python
# Example: Chart placeholder
chart_box = slide.shapes.add_textbox(
    Inches(6.92), Inches(1.88), Inches(5.47), Inches(4.69)
)
chart_frame = chart_box.text_frame
chart_frame.text = "[Visual: Bar chart showing quarterly growth]"
chart_para = chart_frame.paragraphs[0]
chart_para.font.name = 'Arial'
chart_para.font.size = Pt(14)
chart_para.font.color.rgb = RGBColor(102, 102, 102)
chart_para.font.italic = True
```

### Japanese Font Handling

```python
# For Japanese text
para.font.name = 'Noto Sans JP'  # or 'MS Pゴシック'
text_frame.word_wrap = True

# Kinsoku shori is automatically applied when:
# 1. Japanese font is set
# 2. Word wrapping is enabled
# 3. Textbox width is appropriate
```

## Color Palette Reference

Quick reference (see `references/brand-guidelines.md` for complete palette):

| Name | HEX | RGB | Usage |
|------|-----|-----|-------|
| Navy Blue | `#2D40AA` | `(45, 64, 170)` | Primary color, titles |
| Purple | `#847BF2` | `(132, 123, 242)` | Accents, highlights |
| Pink | `#C466D4` | `(196, 102, 212)` | Secondary accents |
| Sky Blue | `#80B3FA` | `(128, 179, 250)` | Supporting elements |
| White | `#FFFFFF` | `(255, 255, 255)` | Content backgrounds |
| Black | `#000000` | `(0, 0, 0)` | Body text |
| Gray | `#666666` | `(102, 102, 102)` | Captions, footnotes |

## Reference Files

- [`references/design.md`](references/design.md) - Complete design system specification
- [`references/brand-guidelines.md`](references/brand-guidelines.md) - Brand guidelines summary
- [`references/layouts.md`](references/layouts.md) - Layout catalog
- [`examples/working-example-v4.js`](examples/working-example-v4.js) - pptxgenjs sample
- [`examples/simple-python-example.py`](examples/simple-python-example.py) - python-pptx sample (recommended)
- [`LOGO_SETUP.md`](LOGO_SETUP.md) - Logo file placement instructions (optional)

## Related Skills

- **brand-compliance**: Validate slides against brand guidelines
- **brand-onboarding**: Create custom brand guidelines

## Troubleshooting

**Logo not displaying**:
- Logo files must be placed separately (see `LOGO_SETUP.md`)
- Default: Logo space reserved (no text overlay)
- To add actual logo PNG: Place in `references/logos/treasure-ai-logo.png`

**Gradients not rendering**:
- python-pptx doesn't support gradient backgrounds
- Use solid Navy (`#2D40AA`) background (acceptable)
- Or manually set gradients in PowerPoint after generation

**Japanese fonts not applied**:
```python
# Explicitly set font
para.font.name = 'Noto Sans JP'  # or 'MS Pゴシック'

# Check font is installed (Mac: Font Book, Windows: Settings > Fonts)
```

**Kinsoku not working**:
```python
# Enable word wrap
text_frame.word_wrap = True

# Set appropriate textbox width
# Kinsoku is automatically applied with Japanese fonts
```

**Page numbers not showing**:
- Uncomment page number code in `simple-python-example.py` (lines 307-312)
- Or call `add_page_number(slide, page_num, total_pages)` manually

## Notes

- This skill focuses on Treasure AI brand compliance
- For generic PowerPoint generation, use the `pptx` skill instead
- Logo area is reserved but not populated (users must add logo files separately)
- Page numbering is optional (disabled by default)
