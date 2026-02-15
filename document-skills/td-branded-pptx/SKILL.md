---
name: td-branded-pptx
description: Create branded PowerPoint presentations (.pptx) using the TD 2026 brand palette, typography, and slide patterns. Use this skill whenever the user asks to create, generate, or build a PowerPoint presentation, pitch deck, slide deck, or .pptx file. Supports client pitches, internal updates, quarterly reviews, and product demos. Applies TD brand colors (peach, purple, sky blue, pink accents on white/dark blue backgrounds), Poppins/Manrope typography, and widescreen 16:9 format with the brand logo.
---

# TD Branded Presentations

Create on-brand PowerPoint presentations using python-pptx with the TD 2026 brand identity.

## Quick Start

1. Install dependency: `pip install python-pptx`
2. Brand assets are bundled in `assets/`:
   - `assets/template.pptx` — 60-slide reference template (use as a visual reference, not as a base for new decks)
   - `assets/brand-logo.png` — brand logo for slide placement
   - `assets/slide-bg.png` — branded background image for title, section divider, and closing slides
3. Read `references/brand-palette.md` for full color and typography specs
4. Read `references/slide-patterns.md` for layout patterns per presentation type

## Creating a Presentation

### Step 1: Determine Type

Ask the user what kind of presentation they need if not specified:
- **Client pitch**: 10-15 slides, problem->solution->proof->CTA
- **Internal update**: 5-10 slides, metrics + progress + next steps
- **Quarterly review**: 10-20 slides, summary + KPIs + highlights + priorities
- **Product demo**: 8-15 slides, overview + features + demo flow + CTA

### Step 2: Build with python-pptx

Create slides programmatically. Key settings:

```python
from pptx import Presentation
from pptx.util import Inches, Pt, Emu
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN

prs = Presentation()
prs.slide_width = Emu(12192000)   # 13.33 inches
prs.slide_height = Emu(6858000)   # 7.50 inches
```

### Step 3: Apply Brand Styling

Core brand colors (use RGBColor):

```python
DARK_BLUE = RGBColor(0x2D, 0x40, 0xAA)     # #2D40AA — headings, dark bg
OFF_WHITE = RGBColor(0xF7, 0xF5, 0xF9)      # #F7F5F9 — light bg
PEACH     = RGBColor(0xFD, 0xB8, 0x93)       # #FDB893 — accent 1
PURPLE    = RGBColor(0x84, 0x7B, 0xF2)       # #847BF2 — accent 3
MAGENTA   = RGBColor(0xC4, 0x66, 0xD4)       # #C466D4 — accent 4
PINK      = RGBColor(0xFE, 0xAF, 0xD9)       # #FEAFD9 — accent 5
SKY_BLUE  = RGBColor(0x8B, 0xBC, 0xFD)       # #8BBCFD — accent 6
ORANGE    = RGBColor(0xFA, 0x73, 0x1A)        # #FA731A — links, CTAs
MUTED     = RGBColor(0x7F, 0x7F, 0x7F)        # #7F7F7F — secondary text
BLACK     = RGBColor(0x00, 0x00, 0x00)
WHITE     = RGBColor(0xFF, 0xFF, 0xFF)
```

Typography (Poppins for headings, Manrope for body, Arial fallback):

```python
# Heading
run.font.name = 'Poppins SemiBold'  # fallback: 'Arial'
run.font.size = Pt(32)

# Body
run.font.name = 'Manrope'
run.font.size = Pt(14)

# Subtext
run.font.name = 'Manrope Medium'
run.font.size = Pt(9)
run.font.color.rgb = MUTED
```

### Step 4: Add Logo

Place the brand logo on title and closing slides (bottom-right):

```python
from pathlib import Path
logo_path = Path(__file__).parent / 'assets' / 'brand-logo.png'
# Or use the absolute path to the skill's assets/brand-logo.png
slide.shapes.add_picture(str(logo_path), Inches(10.5), Inches(6.2), height=Inches(0.8))
```

### Step 5: Save

```python
prs.save('presentation.pptx')
```

## Slide Construction Patterns

### Title Slide (branded background image)

The branded background image (`assets/slide-bg.png`) is a **light-toned** image. Use **dark text** on it.

```python
slide = prs.slides.add_slide(prs.slide_layouts[6])  # blank

# Add branded background image (stretches to fill slide)
bg_path = 'assets/slide-bg.png'  # use absolute path to skill's assets/slide-bg.png
slide.shapes.add_picture(bg_path, 0, 0, prs.slide_width, prs.slide_height)

# Title — dark text on light background
txBox = slide.shapes.add_textbox(Inches(1), Inches(2), Inches(10), Inches(2))
tf = txBox.text_frame
tf.word_wrap = True
p = tf.paragraphs[0]
p.text = "Title Here"
p.font.name = 'Poppins SemiBold'
p.font.size = Pt(48)
p.font.color.rgb = DARK_BLUE  # #2D40AA on light bg

# Subtitle
p2 = tf.add_paragraph()
p2.text = "Subtitle here"
p2.font.name = 'Manrope'
p2.font.size = Pt(18)
p2.font.color.rgb = MUTED  # #7F7F7F
```

Use this branded background image for title slides, section dividers, and closing/CTA slides.
The background is light, so always use dark text (DARK_BLUE or BLACK for headings, MUTED for subtitles).
For content slides, continue using solid `#F7F5F9` or white backgrounds.

### Content Slide (white/light background)

Use `#F7F5F9` or white background, `#000000` or `#2D40AA` for titles, Manrope 14pt body.

### Chart Colors

For multi-series charts, use accents in this order:
`#847BF2`, `#8BBCFD`, `#FDB893`, `#C466D4`, `#FEAFD9`, `#FFE2BD`

## Resources

- `references/brand-palette.md` — Full color palette (primary + secondary themes, text colors, chart colors, typography)
- `references/slide-patterns.md` — Slide layout patterns and per-presentation-type guidelines
- `assets/brand-logo.png` — Brand logo
- `assets/slide-bg.png` — Branded background image for title, section divider, and closing slides
- `assets/template.pptx` — 60-slide reference template for visual inspiration
