---
name: brand-explore
description: Generate 10+ genuinely distinct HTML/Tailwind brand page variations from a single brief. Use when the user wants to explore brand directions, create brand landing pages, generate brand page variations, or build a brand kit through visual exploration.
---

# Brand Exploration Skill

Generate multiple genuinely distinct HTML/Tailwind brand page directions for visual exploration. Each direction explores a different creative approach — different layouts, visual weight, typography, and mood — not minor color variations.

## Entry Points

Three equal paths to start exploration. Ask which the user prefers, or detect from what they provide:

1. **Logo + description**: User drops a logo image and describes their brand
2. **URL extraction**: User pastes a website URL → extract brand signals (colors, typography, mood, voice) from the site
3. **Brand guide ingestion**: User provides a PDF brand guide or brand kit YAML → extract visual + verbal rules as constraints

## Generation Workflow

### Step 1: Extract brand signals

From whatever the user provides, identify:
- **Colors**: primary, secondary, accent (hex values)
- **Typography mood**: modern/classic, geometric/humanist, serif/sans-serif
- **Brand voice**: tone descriptors (e.g., "professional but approachable")
- **Industry/context**: what sector, what audience
- **Existing constraints**: do's/don'ts, logo clear space, etc.

### Step 2: Create session folder

```
{workspace}/attachments/brand-explore/{YYYY-MM-DD}-{brand-slug}/
```

Example: `attachments/brand-explore/2026-03-22-acme/`

### Step 3: Generate directions

Generate 10-12 HTML files, each using a different archetype from the list below. For each direction:

1. Select an archetype that hasn't been used yet in this session
2. Apply the brand's colors, voice, and constraints to that archetype
3. Write a self-contained HTML file with the metadata comment block
4. Use genuinely different structural approaches — the point is diversity

**Write each HTML file to disk immediately after generating it.** Don't buffer all 10.

### Step 4: Write manifest.json

After all directions are generated, write `manifest.json` with metadata for each direction (see format below).

### Step 5: Generate index.html

Write a self-contained `index.html` gallery page that links to all direction files. This page can be opened in Chrome for full-browser exploration. Use Tailwind CDN and include:
- Brand name and session info as header
- Responsive card grid with direction name, archetype, mood tags, and rationale
- Each card links to the corresponding direction HTML file (relative links)
- Clean, minimal design that doesn't distract from the content

### Step 6: Open gallery

Call the `browse_explorations` tool with the session path to show the gallery in Studio. Optionally set `open_in_browser: true` to also open in Chrome.

## Direction Archetypes

Each archetype defines a structurally different page. **Use anti-patterns** (what NOT to do) to prevent convergence.

### 1. immersive-hero
- **Layout**: Full-viewport hero image/gradient with overlay text, scroll-reveal content sections below
- **Visual weight**: dense
- **Typography**: Large display font (48-72px), minimal body text
- **Anti-patterns**: NO card grids. NO sidebar. NO multi-column above the fold.

### 2. editorial-grid
- **Layout**: Magazine-style asymmetric grid, mixed media blocks, varied column spans
- **Visual weight**: balanced
- **Typography**: Serif headings, clean sans-serif body, pull quotes
- **Anti-patterns**: NO full-width hero. NO symmetric columns. NO centered text blocks.

### 3. split-screen
- **Layout**: 50/50 or 60/40 vertical split — content on one side, visual on the other
- **Visual weight**: balanced
- **Typography**: Strong contrast between heading and body sizes
- **Anti-patterns**: NO full-width sections. NO more than 2 columns. NO horizontal cards.

### 4. minimal-typographic
- **Layout**: Vast whitespace, oversized typography as the primary visual element
- **Visual weight**: minimal
- **Typography**: Oversized (80-120px) display type, very sparse body text
- **Anti-patterns**: NO images (text only). NO colored backgrounds. NO borders or cards. NO more than 3 sections.

### 5. card-mosaic
- **Layout**: Dense grid of feature/product cards, Pinterest-style masonry or uniform grid
- **Visual weight**: dense
- **Typography**: Compact, functional, all same size
- **Anti-patterns**: NO hero section. NO centered headings. NO full-width content. Cards must have varying heights.

### 6. storytelling-scroll
- **Layout**: Long-form single-column narrative with section transitions, alternating content/visual blocks
- **Visual weight**: balanced
- **Typography**: Comfortable reading size (18-20px body), generous line height
- **Anti-patterns**: NO grids. NO sidebar. NO more than 1 column. Content must flow vertically.

### 7. dashboard-showcase
- **Layout**: Data-forward — metrics, stats, social proof numbers prominent, structured sections
- **Visual weight**: dense
- **Typography**: Mono or tabular numbers, compact labels
- **Anti-patterns**: NO hero images. NO long paragraphs. NO decorative elements. Numbers and stats must dominate.

### 8. bold-brutalist
- **Layout**: Raw, oversized elements, unconventional positioning, visible grid/borders
- **Visual weight**: dense
- **Typography**: Ultra-bold weights (800-900), uppercase, tight letter-spacing
- **Anti-patterns**: NO rounded corners. NO gradients. NO drop shadows. NO soft/elegant elements.

### 9. elegant-luxury
- **Layout**: Generous spacing, centered content, refined visual hierarchy
- **Visual weight**: minimal
- **Typography**: Thin serif fonts (300 weight), wide letter-spacing, uppercase subtitles
- **Anti-patterns**: NO bold colors. NO dense layouts. NO more than 2 brand colors used. Palette must be muted.

### 10. playful-illustrated
- **Layout**: Organic shapes, rounded containers, colorful sections, badge/icon driven
- **Visual weight**: balanced
- **Typography**: Rounded sans-serif, varied sizes, informal tone
- **Anti-patterns**: NO straight edges on containers. NO corporate/formal tone. NO monochrome palette.

### 11. dark-cinematic
- **Layout**: Dark background throughout, dramatic contrast, spot lighting effects via CSS
- **Visual weight**: dense
- **Typography**: Light text on dark, high contrast, cinematic proportions
- **Anti-patterns**: NO white/light backgrounds. NO pastel colors. Background must be dark (#0a-#1a range).

### 12. geometric-abstract
- **Layout**: Shape-driven — CSS geometric elements, diagonal dividers, overlapping shapes
- **Visual weight**: balanced
- **Typography**: Geometric sans-serif (like Inter, Space Grotesk), precise alignment
- **Anti-patterns**: NO organic shapes. NO photography. Visual interest from geometry only. NO rounded/playful elements.

## HTML Template

Every generated HTML file must be self-contained with this structure:

```html
<!--
  @brand-explore
  direction: {Direction Name}
  archetype: {archetype-key}
  mood: {comma-separated mood words}
  visual-weight: {minimal|balanced|dense}
  round: {round number}
  rationale: {1-2 sentence AI explanation of why this direction and what audience it suits}
-->
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{Brand Name} — {Direction Name}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            brand: {
              primary: '{primary_hex}',
              secondary: '{secondary_hex}',
              accent: '{accent_hex}',
            }
          }
        }
      }
    }
  </script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <!-- Choose fonts appropriate to the archetype -->
  <link href="https://fonts.googleapis.com/css2?family={heading_font}&family={body_font}&display=swap" rel="stylesheet">
  <style>
    /* Archetype-specific custom styles here */
  </style>
</head>
<body>
  <!-- Full page content here — should look like a complete, polished brand landing page -->
</body>
</html>
```

### Font Pairing Guide (force diversity)
- immersive-hero: Playfair Display + Source Sans 3
- editorial-grid: Lora + Inter
- split-screen: Montserrat + Hind
- minimal-typographic: Bebas Neue + Space Mono
- card-mosaic: DM Sans + DM Sans
- storytelling-scroll: Merriweather + Open Sans
- dashboard-showcase: JetBrains Mono + Inter
- bold-brutalist: Oswald + Roboto Condensed
- elegant-luxury: Cormorant Garamond + Raleway
- playful-illustrated: Fredoka + Nunito
- dark-cinematic: Syne + Space Grotesk
- geometric-abstract: Space Grotesk + IBM Plex Sans

## Manifest Format

```json
{
  "session_name": "Acme Brand Exploration",
  "brand_name": "Acme Corp",
  "created_at": "2026-03-22T14:30:00Z",
  "brand_brief": "Enterprise SaaS for data analytics. Professional but approachable. Primary: #1A73E8.",
  "directions": [
    {
      "filename": "direction-01-immersive-hero.html",
      "direction_name": "Immersive Hero",
      "archetype": "immersive-hero",
      "mood": ["bold", "confident", "modern"],
      "visual_weight": "dense",
      "round": 1,
      "rationale": "Full-viewport hero creates immediate brand impact — suits enterprise buyers who value visual authority."
    }
  ]
}
```

## Conversation-to-Edit Loop

After the initial generation, the designer will pick favorites and request changes. Handle these patterns:

### Targeted edit
User: "Make the hero bigger in direction 3"
→ Read direction-03-*.html, find the hero section, adjust Tailwind classes (e.g., `h-screen` → `min-h-screen`, increase text size), save the file. Call `open_file` to show the updated preview.

### Combine directions
User: "Combine directions 2 and 7"
→ Read both files, identify the structural elements to merge (e.g., layout from 2, color usage from 7), generate a new file `direction-13-combined-2-7.html`. Update manifest.json with the new entry. Regenerate index.html.

### New round
User: "Do another round based on directions 3 and 5"
→ Read the favored directions, generate 3-5 new files as `round: 2` entries exploring variations of those directions. Update manifest.json. Regenerate index.html.

### Style change
User: "Try warmer colors" or "Make this more editorial"
→ Read the file, apply targeted changes across all relevant Tailwind classes and CSS custom properties. Don't regenerate from scratch — modify the existing structure.

### Voice/copy edit
User: "The headlines should be punchier" or "Use more action verbs"
→ Read the file, edit headline text content while preserving all layout and styling.

### Mark favorite
User: "I like direction 3"
→ Update manifest.json to set `favorite: true` on that direction. Regenerate index.html.

### Always after edits:
1. Save the modified HTML file
2. Update manifest.json if metadata changed
3. Regenerate index.html if directions were added/removed
4. Call `open_file` on the modified file or `browse_explorations` to refresh the gallery

## Brand Voice Integration

When generating content for each direction, the copy should reflect the brand voice:
- Use the `voice` and `tone` fields from the brand kit or user description
- Apply `dos` and `donts` as content constraints
- Headlines, CTAs, and body copy should feel distinct per direction while staying on-brand
- If `messaging_framework` is provided, use it to inform value propositions in the copy

## Quality Checklist

Before completing generation, verify each direction:
- [ ] Uses the assigned archetype's layout structure
- [ ] Follows the anti-patterns (does NOT include forbidden elements)
- [ ] Uses the correct font pairing from the guide
- [ ] Applies brand colors through Tailwind config
- [ ] Has the `<!--@brand-explore-->` metadata comment
- [ ] Is self-contained (Tailwind CDN, Google Fonts, no other dependencies)
- [ ] Looks like a complete, polished landing page (not a wireframe)
- [ ] Has at least 3 content sections
- [ ] Includes real-sounding copy (not lorem ipsum)
