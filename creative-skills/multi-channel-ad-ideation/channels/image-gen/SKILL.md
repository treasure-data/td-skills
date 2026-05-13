---
name: image-gen
description: Generate real Instagram image ads with AI-generated visuals and text overlays. Combines mcp__work__generate_image for AI image generation with headline compositing via Pillow. Use when user wants to create Instagram ad images, generate ad visuals with text, or produce shareable ad PNGs. Trigger keywords: instagram ad image, generate ad image, image ad with text, ad visual, create instagram ad.
---

# Instagram Image Ad Generation

Generate **real Instagram image ads** with AI-generated visuals and composited headline text. Unlike the standard instagram-ad-ideation skill which produces HTML mockups with placeholder visuals, this skill produces **actual PNG images** ready for use.

## How It Works

This skill chains three systems together:

```
Creative Ideation (concept + copy)
    ↓
mcp__work__generate_image (AI image generation from concept description)
    ↓
Pillow Text Compositor (headline overlay on generated image)
    ↓
mcp__work__generate_image (display final PNG in artifact panel)
```

**Key difference from standard Instagram skill**: The `Image Concept` description and `Primary Text` become the **image generation prompt**. The `Headline` becomes the **text overlay** composited onto the final image.

---

## Output Format

### Phase 1: Text Concept Format (Initial Generation)

Generate **3-5 Instagram image ad concepts** in this text-only format:

```markdown
### Concept: [Concept Name]
**Creative Direction**: Following the "[Selected Direction Name]" approach

#### Ad Copy
- **Primary Text**: [125 chars max] ([X] chars)
- **Headline**: [40 chars max] ([X] chars) — THIS WILL BE OVERLAID ON THE IMAGE
- **Description**: [30 chars max] ([X] chars)
- **CTA Button**: [Instagram CTA option]

#### Image Generation Prompt
[Combine the visual concept description with the primary text theme into a rich,
detailed prompt for AI image generation. **If Description text is provided, incorporate
it into the prompt context.** Include composition, lighting, color palette, mood, style,
and any specific visual elements. This is what gets sent to mcp__work__generate_image.]

- **Dimensions**: 1024x1024 (will be generated at this size)
- **Style**: [Photorealistic, illustration, flat design, etc.]
- **Mood/Tone**: [Energetic, calm, luxurious, urgent, etc.]
- **Key Visual Elements**: [Specific objects, scenes, or compositions to include]
- **Negative Prompt**: [Elements to exclude from generation]

#### Headline Overlay Style
- **Font**: [Serif/Sans-serif — maps to system font]
- **Size**: [48-96px based on text length]
- **Color**: [Hex code for text color]
- **Position**: [Bottom (default), Center, Top]
- **Text Padding**: [Pixels from edge — 60px (bottom/center), 200px (top to avoid logo)]
- **Gradient**: [Subtle/Medium/Heavy — backdrop gradient for readability]

#### Logo Overlay (if provided)
- **Logo File**: [Path to logo PNG, if brand guidelines include logo]
- **Position**: [top-right/top-left/bottom-right/bottom-left/center]
- **Size**: [80-120px width, maintains aspect ratio]
- **Padding**: [Pixels from edge, typically 40px]
- **Note**: Logo will be composited onto the AI-generated image before headline text overlay

*Image will be generated and composited after you confirm this concept.*
```

### Phase 2: Image Generation + Compositing (After Confirmation)

**ONLY generate images AFTER user confirms text concepts.** Trigger phrases:
- "Generate that image"
- "Let's see concept [X]"
- "Create the image for concept [X]"
- "Show me what that looks like"
- "Generate all of them"

When triggered, execute the full pipeline for each confirmed concept.

---

## Execution Pipeline

### Step 1: Generate the Base Image

Call `mcp__work__generate_image` with the **Image Generation Prompt** from the confirmed concept:

```
mcp__work__generate_image(prompt: "<Image Generation Prompt from confirmed concept>")
```

The tool returns the generated image directly. Save the base64-encoded image data to a PNG file. See [`../references/compositor.md`](../references/compositor.md) Step 1 for the decode script.

### Step 2: Logo Overlay (Optional)

**When to use**: If brand guidelines include a logo file, composite it onto the AI-generated image before adding text overlays.

**Logo overlay workflow**:
1. User provides logo path: "Generate Instagram ad with logo at /path/to/logo.png"
2. Load and resize logo maintaining aspect ratio
3. Calculate position based on brand guidelines (default: top-right)
4. Composite logo onto base image with transparency support

For the complete logo compositing script (PIL + numpy, WCAG luminance auto-selection, position calculation, transparency compositing), see [`../references/compositor.md`](../references/compositor.md) Step 2.

**Configuration fields**:
- `LOGO_DARK_PATH` / `LOGO_LIGHT_PATH` — paths to dark and light logo variants
- `LOGO_POSITION` — `top-right` (default), `top-left`, `bottom-left`, `bottom-right`, `center`
- `LOGO_MAX_WIDTH` — pixel width (80-120px), maintains aspect ratio
- `LOGO_PADDING` — pixels from edge (default 40px)

**Behavior**: Auto-selects light/dark logo variant based on WCAG luminance sampling of the logo placement region.

---

### Step 3: Composite Headline Text

Use Python Pillow to overlay the **Headline** text onto the generated image (with logo if provided), using the styling defined in `Headline Overlay Style`.

Supports single-line or two-line treatment (headline at top + subtitle/brand at bottom).

For the complete headline compositing script (PIL ImageDraw/ImageFont, gradient overlay, font loading, text positioning, shadow effects, subtitle support), see [`../references/compositor.md`](../references/compositor.md) Step 3.

**Configuration fields**:
- `HEADLINE_TEXT` — the headline from the confirmed concept
- `FONT_STYLE` — `serif` (Georgia Bold), `sans` (Arial Bold), or `helvetica`
- `FONT_SIZE` — 48-96px based on text length
- `TEXT_COLOR` — RGBA tuple
- `TEXT_POSITION` — `bottom` (default), `center`, `top`
- `TEXT_PADDING` — pixels from edge (60px for bottom/center, 200px for top)
- `GRADIENT_STYLE` — `subtle`, `medium`, `heavy`
- `SUBTITLE_TEXT` / `SUBTITLE_FONT_STYLE` / `SUBTITLE_FONT_SIZE` / `SUBTITLE_COLOR` — optional two-line treatment

### Step 4: Display the Final Image

```
open_file(path: "<concept_name>_final.png")
```

### Step 5: Iteration Support

After displaying, offer the user iteration options:
- **Font**: Serif, Sans, Helvetica
- **Color**: White, Warm Cream, Golden Amber, Ember Orange, or custom hex
- **Size**: 48-96px
- **Position**: Bottom, Center, Top
- **Gradient**: Subtle, Medium, Heavy
- **Two-line treatment**: Add subtitle/brand name at opposite position

Use `AskUserQuestion` with options for each parameter. Generate the variant from the same base image (no need to re-generate the AI image).

For side-by-side comparisons, stitch versions horizontally with Pillow and add labeled headers.

---

## Copy Constraints

**Image-Only Constraint**: Generate concepts for **single static images only**. No carousel, video, collection, or motion formats.

### Primary Text (125 characters max)
Caption text below the image. Also informs the image generation prompt.

**Formula**: [Hook] + [Benefit/Value] + [CTA hint]

### Headline (40 characters max)
**This is the text overlaid on the generated image.** Keep it short, punchy, and readable at mobile scale. Max 5-7 words.

### Description (30 characters max)
Optional additional context, often hidden in feed.

---

## CTA Button Options

**E-Commerce**: Shop Now, Buy Now, Order Now
**Lead Gen**: Sign Up, Subscribe, Download
**Engagement**: Learn More, Get Quote, Contact Us
**App**: Install Now, Use App, Play Game
**Events**: Book Now, Get Tickets

---

## Headline Overlay Style Reference

### Font Selection
| Style | Best For | System Font |
|-------|----------|-------------|
| Serif (Georgia Bold) | Luxury, editorial, classic | `/System/Library/Fonts/Supplemental/Georgia Bold.ttf` |
| Sans (Arial Bold) | Modern, tech, clean | `/System/Library/Fonts/Supplemental/Arial Bold.ttf` |
| Helvetica | Minimal, universal | `/System/Library/Fonts/Helvetica.ttc` |

### Font Size by Text Length
| Headline Length | Recommended Size |
|-----------------|------------------|
| 1-3 words | 84-96px |
| 4-5 words | 64-72px |
| 6-7 words | 48-60px |

### Text Color by Mood
| Mood | RGBA | Hex |
|------|------|-----|
| Clean/Classic | `(255, 255, 255, 255)` | #FFFFFF |
| Warm/Organic | `(255, 245, 225, 255)` | #FFF5E1 |
| Urgency/Sale | `(255, 214, 10, 255)` | #FFD60A |
| Campfire/Amber | `(255, 191, 71, 255)` | #FFBF47 |
| Luxury/Premium | `(255, 215, 0, 255)` | #FFD700 |
| Playful/Fun | `(236, 72, 153, 255)` | #EC4899 |
| Trust/Corporate | `(96, 165, 250, 255)` | #60A5FA |

### Gradient Backdrop
| Style | Alpha | Height | Best For |
|-------|-------|--------|----------|
| Subtle | 0→120 | 25% | Light/bright images |
| Medium | 0→180 | 30% | Most images (default) |
| Heavy | 0→220 | 40% | Busy/detailed images |

### Position
| Position | Best For | Padding |
|----------|----------|---------|
| Bottom (default) | Hero images, landscapes, product shots | 60px (200px if logo at bottom) |
| Center | Bold statements, announcements | Ignored (centered mathematically) |
| Top | When bottom has important visual detail | 200px (avoids logo overlap) |

---

## Image Generation Prompt Tips

The `mcp__work__generate_image` tool uses GPT Image 1.5.

- **Do**: Be descriptive (composition, lighting, colors, mood, textures), specify style explicitly ("photorealistic", "digital illustration"), include negative prompts, leave visual breathing room where headline will go
- **Don't**: Request copyrighted characters/brand logos, use vague descriptions, forget to leave clean space in the text position area

---

## Quick Reference: Field Mapping

| Concept Field | Used For |
|---------------|----------|
| Primary Text | Instagram caption + informs image generation theme |
| Headline | Text composited onto the generated image |
| Description | Instagram ad description field + enriches image generation prompt when available |
| Image Generation Prompt | Sent to mcp__work__generate_image |
| Headline Overlay Style | Controls Pillow text compositing parameters |

---

**Tip**: Instagram ads work best when they don't look like ads. Aim for AI-generated visuals that feel natural in users' feeds while the headline reinforces the offer clearly.