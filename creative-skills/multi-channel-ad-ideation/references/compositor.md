# Image Compositor Scripts

Python scripts for compositing logo overlays and headline text onto AI-generated images using Pillow and numpy.

**Used by**: [image-gen](../channels/image-gen/SKILL.md) channel skill

---

## Step 1: Save Base Image

Save the base64-encoded image data returned by `mcp__work__generate_image` to a PNG file:

```python
import base64

# image_data = base64 string returned by mcp__work__generate_image
img_bytes = base64.b64decode(image_data)
with open("<concept_name>_base.png", "wb") as out:
    out.write(img_bytes)
```

---

## Step 2: Logo Overlay

Composite a brand logo onto the AI-generated base image with automatic light/dark variant selection.

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

## Step 3: Headline Text Compositing

Overlay headline text onto the generated image with gradient backdrop, font selection, shadow effects, and optional subtitle support.

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
