---
name: treasure-ai-slides
description: Create professional PowerPoint presentations following Treasure AI brand guidelines. Use when generating slides, presentations, or decks for Treasure AI/Treasure Data. Automatically applies brand colors, gradients, typography, logo placement, and visual design patterns.
---

# Treasure AI Slides

Generate professional PowerPoint presentations that follow Treasure AI's official brand design system including colors, gradients, typography, logo placement, and visual patterns.

## When to Use This Skill

- Creating new Treasure AI presentations from scratch
- Building product pitch decks, feature overviews, or internal presentations
- Converting content into branded slide decks
- Ensuring brand consistency across presentation materials

## Quick Start

**Basic usage:**
```
"Create a Treasure AI presentation about [topic]"
```

**With structure:**
```
Create a Treasure AI slide deck:
Title: Product Overview
Slides:
1. Title slide
2. What is Treasure AI?
3. Key Features (3 columns)
4. Use Cases
5. Thank You
```

The skill automatically:
- Applies Treasure AI brand colors and gradients
- Places logos in correct positions
- Uses proper fonts (Arial)
- Follows layout patterns (title, content, section, end slides)
- Embeds visual elements on every slide

## Design System Overview

All design specifications are in [`references/design.md`](references/design.md). Key elements:

### Brand Colors

- **Primary Dark (Navy)**: `#2D40AA` — Main text, headings
- **Primary Light (Off-White)**: `#F9FEFF` — Light backgrounds
- **Accent Purple**: `#847BF2` — Highlights, icons
- **Accent Pink**: `#C466D4` — Secondary accents
- **Accent Blue**: `#80B3FA` — Supporting elements

Full color palette with gradients defined in design.md.

### Typography

- **Headings**: Arial Bold, 36-44pt (slide titles)
- **Body**: Arial Regular, 13-16pt
- **Subtitles**: 16-18pt, `#2D40AA` or `#C466D4`
- **Japanese**: ＭＳ Ｐゴシック (with proper kinsoku shori/line-breaking rules)

**Japanese Typography Rules**:
- Apply kinsoku shori (禁則処理): No punctuation at line start, no opening brackets at line end
- Keep multi-character symbols together (e.g., `……` ellipsis, `——` dashes)
- Enable hanging punctuation for better readability
- See full Japanese typesetting rules in design.md

### Logo Usage

Logo files located in [`references/logos/`](references/logos/):
- `treasure-ai-logo.png` — Main horizontal logo (standard placement)
- `treasure-ai-icon.png` — Icon only (decorative use)

**Standard placement**: Left top corner (x: 0.2in, y: 0.15in, w: 1.5in, h: 0.35in)

## Slide Types & Layouts

### A. Title Slide (Cover)

- **Background**: Full-screen gradient (pink → purple → blue)
- **Content**: Large centered title (white, bold) + subtitle
- **Logo**: Right bottom or left top
- **When to use**: First slide, presentation cover

### B. Section Divider

- **Background**: Gradient (4 variations: main, sunset, rainbow, dusk)
- **Content**: Left-aligned white text, large section name
- **Optional**: Right-side image (rounded) or abstract shapes
- **When to use**: Between major sections

### C. Content Slide (Standard)

- **Background**: White or very light off-white (`#F9FEFF`)
- **Header**: Left-aligned title (black, bold)
- **Content**: Text + visual elements (charts, images, icons)
- **Logo**: Left top corner (always)
- **When to use**: Most slides — explanations, lists, features

### D. End Slide (Thank You)

- **Background**: Same gradient as title slide
- **Content**: "Thank you" centered (white)
- **Optional CTA**: Chat-style box ("Let's build something amazing")
- **When to use**: Final slide

## Layout Patterns

### 1-Column (Text-Focused)
- Title + subtitle + body text
- Bullet points (max 3 levels)
- Use when: Text-heavy content, definitions

### 2-Column (Text + Visual)
- Left: Title + text (55% width)
- Right: Image, chart, or icon (40% width)
- Use when: Feature explanations, comparisons

### 3-Column Grid
- Equal width columns (~30% each)
- Each column: Icon + header + text
- Use when: Feature lists, benefits, key points

### Bento Grid
- Asymmetric grid: Large main area + multiple small areas
- Mix images, numbers, text
- Use when: Dashboards, multi-metric displays

### Device Mockup
- Left: Large product image (laptop, mobile)
- Right: Text explanation
- Use when: Product demos, UI showcases

## Design Rules (Critical)

### ✓ Must Do

- **Every slide must have visual elements** (images, icons, charts, or shapes)
- **Gradients only on**: Title, section divider, end slides
- **Content slides**: White background only
- **Logo placement**: Left top on all slides
- **Bold for titles, Regular for body** — create hierarchy with weight
- **Rounded corners on images** — never sharp rectangles
- **Organic shapes** (circles, ellipses) in brand colors for decoration

### ✗ Never Do

- Don't add decorative lines under titles (AI-gen slide anti-pattern)
- Don't use cream/beige backgrounds on content slides
- Don't create text-only slides
- Don't repeat the same layout on every slide
- Don't center-align text (except titles)
- Don't let text overflow boxes

## Implementation Methods

### Method 1: Using pptxgenjs (JavaScript)

```javascript
const pptxgen = require('pptxgenjs');
const pres = new pptxgen();
pres.layout = 'LAYOUT_WIDE'; // 16:9

// Load colors
const COLORS = {
  navy: '2D40AA',
  purple: '847BF2',
  pink: 'C466D4',
  white: 'FFFFFF',
};

// Add logo helper
function addLogo(slide) {
  slide.addImage({
    path: 'references/logos/treasure-ai-logo.png',
    x: 0.2, y: 0.15, w: 1.5, h: 0.35,
  });
}

// Title slide
const titleSlide = pres.addSlide();
titleSlide.background = { fill: COLORS.navy }; // Simplified
addLogo(titleSlide);
titleSlide.addText('Presentation Title', {
  x: 0.94, y: 2.37, w: 9.94, h: 1.64,
  fontSize: 40, bold: true, color: COLORS.white,
});

pres.writeFile({ fileName: 'TreasureAI_Deck.pptx' });
```

### Method 2: Python-pptx

```python
from pptx import Presentation
from pptx.util import Inches, Pt

prs = Presentation()
prs.slide_width = Inches(13.33)  # 16:9
prs.slide_height = Inches(7.5)

# Content slide
slide = prs.slides.add_slide(prs.slide_layouts[5])  # Blank
slide.shapes.add_picture(
    'references/logos/treasure-ai-logo.png',
    Inches(0.2), Inches(0.15), height=Inches(0.35)
)

title_box = slide.shapes.add_textbox(
    Inches(0.38), Inches(0.3), Inches(9), Inches(0.7)
)
title_frame = title_box.text_frame
title_frame.text = 'Slide Title'
# ... set font, size, color

prs.save('TreasureAI_Deck.pptx')
```

### Method 3: Direct XML Manipulation

For advanced control (gradients, precise positioning):

```bash
# Unpack existing template
python scripts/office/unpack.py template.pptx unpacked/

# Edit XML in unpacked/ppt/slides/slide1.xml
# Modify slide content, colors, shapes

# Repack
python scripts/office/pack.py unpacked/ output.pptx
```

## Quality Checklist

Before delivering slides, verify:

- [ ] Logo on all slides (left top standard position)
- [ ] Title/section slides have gradient backgrounds
- [ ] Content slides have white backgrounds (not cream/beige)
- [ ] Font is Arial (Bold for titles, Regular for body)
- [ ] No text overflowing boxes
- [ ] No decorative lines under titles
- [ ] All slides have visual elements (images/icons/shapes)
- [ ] Rounded corners on images
- [ ] Accent colors (purple/pink) used sparingly

## Gradient Definitions

**Main Title Gradient** (Title & Section slides):
- Direction: 45° (top-left to bottom-right)
- Stop 1: `#FF86B4` (pink)
- Stop 2: `#9864FF` → `#8470FF` (purple)
- Stop 3: `#3D9CFF` → `#00C3FF` (blue)

**Sunset Gradient** (Warm slides):
- `#FFF1DD` → `#DD71DA` → `#B4AEF7`
- Light beige to lavender

**Rainbow Gradient**:
- `#FFE5C3` → `#DBA2E5` → `#B4AEF7`
- Warm orange to purple

**Dusk Gradient**:
- `#8855FF` → `#4485FF` → `#00B6FF`
- Deep purple to blue

## Common Pitfalls

### Text-Only Slides
**Problem**: Boring, off-brand  
**Solution**: Add icons, decorative shapes (brand color circles), or background images

### Wrong Background Color
**Problem**: Using cream/beige on content slides  
**Solution**: Content slides always use white (`#FFFFFF`) or very light off-white (`#F9FEFF`)

### Missing Logo
**Problem**: Slides without branding  
**Solution**: Every slide needs logo at x: 0.2in, y: 0.15in

### Overuse of Gradients
**Problem**: Gradient backgrounds on content slides  
**Solution**: Gradients only for: title, section dividers, end slide

### Inconsistent Layouts
**Problem**: All slides look identical  
**Solution**: Mix layouts — 1-column, 2-column, 3-column, bento grid

## Examples

See [`examples/`](examples/) directory for:
- Complete presentation templates
- Slide-by-slide breakdowns
- Before/after comparisons

## Reference Files

- [`references/design.md`](references/design.md) — Complete design specification
- [`references/logos/treasure-ai-logo.png`](references/logos/treasure-ai-logo.png) — Main logo
- [`references/logos/treasure-ai-icon.png`](references/logos/treasure-ai-icon.png) — Icon only

## Getting Help

If you need to verify brand compliance or have questions about specific design choices, consult `references/design.md` for the complete visual identity system.

## Related Skills

- **brand-compliance**: Review finished slides for brand guideline adherence
- **brand-onboarding**: Set up brand guidelines for custom presentations
