---
name: image-gen
description: Generate real Instagram image ads with AI-generated visuals and text overlays. Combines TD Creative Studio image generation with headline compositing via Pillow. Use when user wants to create Instagram ad images, generate ad visuals with text, or produce shareable ad PNGs. Trigger keywords: instagram ad image, generate ad image, image ad with text, ad visual, create instagram ad.
---

# Instagram Image Ad Generation

Generate **real Instagram image ads** with AI-generated visuals and composited headline text. Unlike the standard instagram-ad-ideation skill which produces HTML mockups with placeholder visuals, this skill produces **actual PNG images** ready for use.

## How It Works

This skill chains three systems together:

```
Creative Ideation (concept + copy)
    ↓
TD Creative Studio Agent (AI image generation from concept description)
    ↓
Pillow Text Compositor (headline overlay on generated image)
    ↓
Treasure Studio (display final PNG in artifact panel)
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
and any specific visual elements. This is what gets sent to the TD Creative Studio
Image Generation Agent.]

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

### Step 1: Set Project Context

```bash
tdx use llm_project "TD-Managed: Creative Studio"
```

### Step 2: Generate the Base Image

Send the **Image Generation Prompt** from the confirmed concept to the TD agent:

```bash
tdx chat --stream \
  --new \
  --agent "TD-Managed: Creative Studio/TD-Managed: Image Generation Agent" \
  "<Image Generation Prompt from confirmed concept>"
```

**Important tool selection**: Use `tdx chat --stream` via Bash for this step. The `mcp__tdx-studio__tdx_chat` tool strips binary image data, which breaks the image extraction process. Include the `--new` flag to start a fresh chat, ensuring the history contains only one image for clean extraction.

Parse the `chatId` from the metadata event in the stream output:
```json
{"type":"metadata","data":{"chatId":"<CHAT_ID>"}}
```

### Step 3: Extract Image from Chat History

```bash
tdx llm history "<CHAT_ID>"
```

This output is large (2-3MB+) and will be persisted to a tool-results file. Extract the image binary:

```python
import re, base64

with open("<persisted_output_file>", "r") as f:
    content = f.read()

matches = list(re.finditer(r'"binaryBase64":"([A-Za-z0-9+/=]+)"', content))
if matches:
    b64_data = matches[-1].group(1)  # Last match = most recent image
    img_bytes = base64.b64decode(b64_data)
    with open("<concept_name>_base.png", "wb") as out:
        out.write(img_bytes)
```

### Step 3.5: Logo Overlay (Optional)

**When to use**: If brand guidelines include a logo file, composite it onto the AI-generated image before adding text overlays.

**Logo overlay workflow**:
1. User provides logo path: "Generate Instagram ad with logo at /path/to/logo.png"
2. Load and resize logo maintaining aspect ratio
3. Calculate position based on brand guidelines (default: top-right)
4. Composite logo onto base image with transparency support

```python
from PIL import Image
import numpy as np
import os

LOGO_DARK_PATH = "<path-to-dark-logo>"   # For light backgrounds (black-over-white)
LOGO_LIGHT_PATH = "<path-to-light-logo>" # For dark backgrounds (white-over-black)
LOGO_POSITION = "top-right"   # top-left, top-right, bottom-left, bottom-right, center
LOGO_MAX_WIDTH = 100
LOGO_PADDING = 40

img = Image.open("<concept_name>_base.png").convert("RGBA")
width, height = img.size

if (LOGO_DARK_PATH and os.path.exists(LOGO_DARK_PATH) and
    LOGO_LIGHT_PATH and os.path.exists(LOGO_LIGHT_PATH)):

    logo_bbox_map = {
        "top-right": (width-LOGO_MAX_WIDTH-LOGO_PADDING, LOGO_PADDING, width-LOGO_PADDING, LOGO_PADDING+LOGO_MAX_WIDTH),
        "top-left": (LOGO_PADDING, LOGO_PADDING, LOGO_PADDING+LOGO_MAX_WIDTH, LOGO_PADDING+LOGO_MAX_WIDTH),
        "bottom-right": (width-LOGO_MAX_WIDTH-LOGO_PADDING, height-LOGO_MAX_WIDTH-LOGO_PADDING, width-LOGO_PADDING, height-LOGO_PADDING),
        "bottom-left": (LOGO_PADDING, height-LOGO_MAX_WIDTH-LOGO_PADDING, LOGO_PADDING+LOGO_MAX_WIDTH, height-LOGO_PADDING),
        "center": ((width-LOGO_MAX_WIDTH)//2, (height-LOGO_MAX_WIDTH)//2, (width+LOGO_MAX_WIDTH)//2, (height+LOGO_MAX_WIDTH)//2),
    }

    pixels = np.array(img.crop(logo_bbox_map[LOGO_POSITION]).convert("RGB"))
    avg_luminance = np.mean(0.299*pixels[:,:,0] + 0.587*pixels[:,:,1] + 0.114*pixels[:,:,2])
    logo_path = LOGO_LIGHT_PATH if avg_luminance < 128 else LOGO_DARK_PATH

    logo = Image.open(logo_path).convert("RGBA")
    aspect_ratio = logo.height / logo.width
    logo_width = LOGO_MAX_WIDTH
    logo_height = int(logo_width * aspect_ratio)
    logo = logo.resize((logo_width, logo_height), Image.Resampling.LANCZOS)

    position_map = {
        "top-left": (LOGO_PADDING, LOGO_PADDING),
        "top-right": (width-logo_width-LOGO_PADDING, LOGO_PADDING),
        "bottom-left": (LOGO_PADDING, height-logo_height-LOGO_PADDING),
        "bottom-right": (width-logo_width-LOGO_PADDING, height-logo_height-LOGO_PADDING),
        "center": ((width-logo_width)//2, (height-logo_height)//2),
    }
    img.paste(logo, position_map.get(LOGO_POSITION, position_map["top-right"]), logo)
    img.save("<concept_name>_with_logo.png", "PNG")
else:
    img.save("<concept_name>_with_logo.png", "PNG")
```

**Logo auto-selection**: Samples the logo placement region's luminance (WCAG formula). Dark background (< 128) → light logo variant; light background (≥ 128) → dark logo variant. Use brand guidelines for position, size (80-120px width), and padding.

---

### Step 4: Composite Headline Text

Use Python Pillow to overlay the **Headline** text onto the generated image (with logo if provided), using the styling defined in `Headline Overlay Style`.

Supports single-line or two-line treatment (headline at top + subtitle/brand at bottom).

```python
from PIL import Image, ImageDraw, ImageFont
import os

HEADLINE_TEXT = "<Headline from confirmed concept>"
FONT_STYLE = "serif"       # serif, sans, or helvetica
FONT_SIZE = 72
TEXT_COLOR = (255, 255, 255, 255)
TEXT_POSITION = "bottom"   # bottom, center, or top
TEXT_PADDING = 60          # 60px for bottom/center, 200px for top (avoids logo)
GRADIENT_STYLE = "medium"  # subtle, medium, heavy
SUBTITLE_TEXT = None       # Optional: "Brand Name" for two-line treatment
SUBTITLE_FONT_STYLE = "serif"
SUBTITLE_FONT_SIZE = 36
SUBTITLE_COLOR = (255, 255, 255, 240)

img = Image.open("<concept_name>_with_logo.png").convert("RGBA")
width, height = img.size

# Gradient overlay for text readability
overlay = Image.new("RGBA", (width, height), (0, 0, 0, 0))
draw_overlay = ImageDraw.Draw(overlay)
gradient_config = {"subtle": {"alpha_max": 120, "height_pct": 0.25}, "medium": {"alpha_max": 180, "height_pct": 0.30}, "heavy": {"alpha_max": 220, "height_pct": 0.40}}
cfg = gradient_config[GRADIENT_STYLE]
gradient_height = int(height * cfg["height_pct"])
for y in range(gradient_height):
    alpha = int(cfg["alpha_max"] * (y / gradient_height))
    y_pos = (gradient_height - y) if TEXT_POSITION == "top" else (height - gradient_height + y)
    draw_overlay.rectangle([(0, y_pos), (width, y_pos)], fill=(0, 0, 0, alpha))

if SUBTITLE_TEXT:
    sub_gradient_height = int(height * 0.25)
    for y in range(sub_gradient_height):
        alpha = int(160 * (y / sub_gradient_height))
        y_pos = (height - sub_gradient_height + y) if TEXT_POSITION == "top" else (sub_gradient_height - y)
        draw_overlay.rectangle([(0, y_pos), (width, y_pos)], fill=(0, 0, 0, alpha))

img = Image.alpha_composite(img, overlay)

# Font selection
font_map = {
    "serif": ["/System/Library/Fonts/Supplemental/Georgia Bold.ttf", "/System/Library/Fonts/Supplemental/Georgia.ttf"],
    "sans": ["/System/Library/Fonts/Supplemental/Arial Bold.ttf", "/System/Library/Fonts/Supplemental/Verdana Bold.ttf"],
    "helvetica": ["/System/Library/Fonts/Helvetica.ttc"],
}
def load_font(style, size):
    for fp in font_map.get(style, font_map["sans"]):
        if os.path.exists(fp):
            try: return ImageFont.truetype(fp, size)
            except: continue
    return ImageFont.load_default()

draw = ImageDraw.Draw(img)
headline_font = load_font(FONT_STYLE, FONT_SIZE)
bbox = draw.textbbox((0, 0), HEADLINE_TEXT, font=headline_font)
tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
x = (width - tw) // 2
y = {"bottom": height - th - TEXT_PADDING, "center": (height - th) // 2, "top": TEXT_PADDING}.get(TEXT_POSITION, TEXT_PADDING)

for ox, oy in [(3,3), (-1,-1), (2,2), (0,3)]:
    draw.text((x+ox, y+oy), HEADLINE_TEXT, fill=(0,0,0,220), font=headline_font)
draw.text((x, y), HEADLINE_TEXT, fill=TEXT_COLOR, font=headline_font)

if SUBTITLE_TEXT:
    subtitle_font = load_font(SUBTITLE_FONT_STYLE, SUBTITLE_FONT_SIZE)
    bs = draw.textbbox((0, 0), SUBTITLE_TEXT, font=subtitle_font)
    sw, sh = bs[2]-bs[0], bs[3]-bs[1]
    sx, sy = (width-sw)//2, (height-sh-45) if TEXT_POSITION == "top" else 60
    for ox, oy in [(2,2), (-1,-1)]:
        draw.text((sx+ox, sy+oy), SUBTITLE_TEXT, fill=(0,0,0,180), font=subtitle_font)
    draw.text((sx, sy), SUBTITLE_TEXT, fill=SUBTITLE_COLOR, font=subtitle_font)

img.convert("RGB").save("<concept_name>_final.png", "PNG", quality=95)
```

### Step 5: Display the Final Image

```
open_file(path: "<concept_name>_final.png")
```

### Step 6: Iteration Support

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

The TD Creative Studio Image Generation Agent uses Amazon Bedrock Nova Canvas (default 1024x1024).

- **Do**: Be descriptive (composition, lighting, colors, mood, textures), specify style explicitly ("photorealistic", "digital illustration"), include negative prompts, leave visual breathing room where headline will go
- **Don't**: Request copyrighted characters/brand logos, use vague descriptions, forget to leave clean space in the text position area

---

## Quick Reference: Field Mapping

| Concept Field | Used For |
|---------------|----------|
| Primary Text | Instagram caption + informs image generation theme |
| Headline | Text composited onto the generated image |
| Description | Instagram ad description field + enriches image generation prompt when available |
| Image Generation Prompt | Sent to TD Creative Studio Image Gen Agent |
| Headline Overlay Style | Controls Pillow text compositing parameters |

---

**Tip**: Instagram ads work best when they don't look like ads. Aim for AI-generated visuals that feel natural in users' feeds while the headline reinforces the offer clearly.