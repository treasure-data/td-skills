# Treasure AI Slides

Claude Code skill for generating professional PowerPoint presentations that follow Treasure AI's official brand guidelines.

## Overview

This skill teaches Claude Code to create branded slide decks with:
- Treasure AI color palette and gradients
- Proper logo placement and sizing
- Brand-compliant typography (Arial)
- Approved layout patterns (title, content, section, end slides)
- Visual design principles (every slide needs visual elements)

## Files

- **[SKILL.md](SKILL.md)** — Main skill definition for Claude Code
- **[references/design.md](references/design.md)** — Complete Treasure AI design system specification
- **[references/logos/](references/logos/)** — Logo assets (PNG format)
  - `treasure-ai-logo.png` — Main horizontal logo
  - `treasure-ai-icon.png` — Icon only
- **[examples/](examples/)** — Sample code and templates
  - `slide-generator-example.js` — pptxgenjs implementation
  - `README.md` — Usage instructions

## Usage

### In Claude Code

```
"Create a Treasure AI presentation about [topic]"
```

Claude automatically:
1. References `SKILL.md` for design rules
2. Embeds logos from `references/logos/`
3. Applies brand colors (`#2D40AA`, `#847BF2`, `#C466D4`, etc.)
4. Uses correct fonts (Arial Bold/Regular)
5. Follows layout patterns (gradient backgrounds on title/section slides, white on content)

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
2. What is Treasure AI? (2-column layout)
3. Key Features (3-column grid)
4. Use Cases (bento grid)
5. Thank You
```

**With content:**
```
Generate Treasure AI slides for this outline:
[paste outline or content]
```

## Design System Highlights

### Brand Colors

- **Navy Blue** `#2D40AA` — Primary text, headings
- **Purple** `#847BF2` — Accents, highlights
- **Pink** `#C466D4` — Secondary accents
- **Sky Blue** `#80B3FA` — Supporting elements
- **White** `#FFFFFF` — Content backgrounds

### Gradients

**Main Title Gradient** (45° diagonal):
- `#FF86B4` (pink) → `#9864FF` (purple) → `#3D9CFF` (blue)

Used on: Title slides, section dividers, end slides

### Typography

- **Slide Titles**: Arial Bold, 36-44pt
- **Body Text**: Arial Regular, 13-16pt
- **Subtitles**: 16-18pt, Navy or Pink
- **Japanese Text**: ＭＳ Ｐゴシック with kinsoku shori (禁則処理)

**Japanese Typography**: When creating slides with Japanese text, apply proper kinsoku shori (line-breaking rules):
- No punctuation (、。) at line start
- No opening brackets (（「) at line end
- Keep multi-char symbols together (…… ——)
- See `references/design.md` for complete rules

### Logo Placement

**Standard position**: Left top corner
- x: 0.2in, y: 0.15in
- w: 1.5in, h: 0.35in

## Slide Types

1. **Title Slide** — Gradient background, centered title, logo
2. **Section Divider** — Gradient background, section name, optional image
3. **Content Slide** — White background, left-aligned title, text + visuals
4. **End Slide** — Gradient background, "Thank you" message

## Layout Patterns

- **1-Column**: Text-focused (bullets, paragraphs)
- **2-Column**: Text + visual (55% text, 40% image)
- **3-Column Grid**: Feature lists (icon + header + text)
- **Bento Grid**: Asymmetric dashboard-style layout
- **Device Mockup**: Product image + description

## Quality Rules

### ✓ Must Do
- Logo on every slide (left top)
- Visual elements on every slide (images, icons, shapes)
- Gradients only on title/section/end slides
- White backgrounds on content slides
- Rounded corners on images
- Bold titles, Regular body text

### ✗ Never Do
- Decorative lines under titles
- Cream/beige backgrounds on content slides
- Text-only slides
- Center-aligned text (except titles)
- Text overflow outside boxes

## Development

### Running Examples

```bash
cd examples/
npm install pptxgenjs
node slide-generator-example.js
# Output: TreasureAI_Presentation.pptx
```

### Testing the Skill

```bash
# Install marketplace locally
/plugin marketplace add https://github.com/treasure-data/td-skills

# Install creative-skills
/plugin install creative-skills@td-skills

# Test
"Create a Treasure AI presentation about data activation"
```

## Reference

Full design specification: [references/design.md](references/design.md)

Includes:
- Complete color palette with hex codes
- Gradient definitions (4 variations)
- Font sizing guidelines
- Layout specifications (margins, spacing)
- Implementation code (pptxgenjs, python-pptx, XML)
- QA checklist

## Related Skills

- **brand-compliance** — Validate slides against brand guidelines
- **brand-onboarding** — Create custom brand guidelines
- **pptx** (document-skills) — General PowerPoint generation (non-branded)

## Contributing

When updating this skill:

1. **Design changes**: Update `references/design.md`
2. **New examples**: Add to `examples/` with README
3. **Skill logic**: Edit `SKILL.md` frontmatter description or markdown content
4. **Tests**: Add trigger tests to `tests/trigger-tests.yml`

## License

Internal Treasure Data use only.
