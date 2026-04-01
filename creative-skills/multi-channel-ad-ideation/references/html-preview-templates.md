# HTML Preview Templates

Reusable HTML/CSS templates for generating email and Instagram ad previews. All templates use **inline CSS** for maximum compatibility.

## Why Inline CSS?

- **Email clients** strip `<style>` tags and external stylesheets
- **Self-contained** HTML works in any preview context
- **Copy-paste ready** for testing tools
- **No dependencies** - works everywhere

---

## Card Component Library

**NEW**: Visual card components for presenting creative directions, concepts, and scores during the text phase (before full HTML generation).

### Quick Reference

**Component** | **Use Case** | **Location**
---|---|---
Direction Cards | Creative direction options (Phase 1) | `card-templates.md` - Direction Card Template
Concept Cards | Ad concepts with collapsible details (Phase 2) | `card-templates.md` - Concept Card Template
Score Visualization | Quality assessment dashboards | `card-templates.md` - Score Visualization Template
Color Swatches | Visual color palette previews | `card-templates.md` - Color Swatch Template
Mini Previews | Lightweight previews during text phase | `card-templates.md` - Mini Preview Templates

### When to Use Cards vs. Full HTML

**Card Components** (Text Phase):
- Use during **creative direction ideation** and **text concept presentation**
- Lightweight, collapsible, scannable
- Color swatches and mini previews for visual sense
- User hasn't confirmed concepts yet

**Full HTML Previews** (This File):
- Use **after user confirms** text concepts
- Complete email/Instagram mockups
- Production-ready templates
- Final visual representation

### Card Integration Patterns

**Pattern 1: Direction → Concept → HTML**
```
1. Present directions using Direction Cards (card-templates.md)
2. User selects direction
3. Generate text concepts using Concept Cards (card-templates.md)
4. User confirms concepts
5. Generate full HTML using templates below (this file)
```

**Pattern 2: Adding Visual Elements to Text Concepts**
```
When generating text concepts:
- Use Concept Card template as wrapper
- Embed Color Swatch template in visual concept section
- Add Mini Preview card (email/Instagram) for early visual sense
- Wait for confirmation before using full templates below
```

### Color Tier System (Shared Across All Components)

Consistent color coding for quality scores:

**Tier** | **Range** | **Border** | **Background** | **Text**
---|---|---|---|---
Excellent | 23-25 | `#10b981` | `#f0fdf4` | `#059669`
Strong | 18-22 | `#f59e0b` | `#fffbeb` | `#d97706`
Good | 13-17 | `#3b82f6` | `#eff6ff` | `#2563eb`
Needs Work | 0-12 | `#ef4444` | `#fef2f2` | `#dc2626`

**Accessibility**: All combinations meet WCAG 2.1 AA (4.5:1 minimum contrast)

### Example Workflow Integration

**Step 1: Creative Direction (Cards)**
```markdown
Use Direction Card template from card-templates.md
Present 3-5 options in 2-column grid
Color-code by quality tier
```

**Step 2: Text Concepts (Cards with Swatches)**
```markdown
Use Concept Card template from card-templates.md
Embed Color Swatch template for palette
Add Mini Email Preview for visual sense
```

**Step 3: Confirmed Concepts (Full HTML - This File)**
```markdown
User confirms Concept 2
Use Template 1: Header Hero (below) for email
Populate {{placeholders}} with confirmed copy
Generate complete HTML mockup
```

**For complete card specifications, templates, and usage guidelines**: See `card-templates.md`

---

## Logo Integration in Email Headers

When brand guidelines include a logo file, embed it in the email header using base64 encoding for self-contained HTML.

### Why Base64 Encoding?

- **Self-contained**: No external image dependencies
- **Email compatibility**: Works in most email clients
- **Portable**: Copy-paste HTML works anywhere
- **No broken images**: Logo always displays

### Base64 Encoding Workflow

**Step 1: Read the logo file**
```python
import base64

with open("/path/to/logo.png", "rb") as f:
    logo_bytes = f.read()
```

**Step 2: Convert to base64**
```python
logo_base64 = base64.b64encode(logo_bytes).decode('utf-8')
```

**Step 3: Create data URI**
```python
logo_data_uri = f"data:image/png;base64,{logo_base64}"
```

**Step 4: Embed in HTML**
```html
<img src="data:image/png;base64,{logo_base64_string}" alt="Company Logo" style="max-width: 180px; height: auto;" />
```

### Dual Logo Variants (Automatic Selection)

When brand guidelines include two logo variants for different backgrounds, automatically select the appropriate one:

**Selection Workflow**:
```python
import base64

# Logo paths from brand guidelines
LOGO_DARK = "/path/to/logo-black-over-white.png"  # For light backgrounds
LOGO_LIGHT = "/path/to/logo-white-over-black.png"  # For dark backgrounds

# Header background color from email template
HEADER_BG_COLOR = "#1B3022"  # Old Growth (dark)

# Calculate background luminance
def hex_to_rgb(hex_color):
    hex_color = hex_color.lstrip('#')
    return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))

def calculate_luminance(rgb):
    """WCAG relative luminance: L = 0.299*R + 0.587*G + 0.114*B"""
    r, g, b = rgb
    return 0.299 * r + 0.587 * g + 0.114 * b

# Determine which logo to use
bg_rgb = hex_to_rgb(HEADER_BG_COLOR)
bg_luminance = calculate_luminance(bg_rgb)

if bg_luminance < 128:
    # Dark background - use light logo
    logo_path = LOGO_LIGHT
    print(f"Dark background (L={bg_luminance:.1f}) → Using white-over-black logo")
else:
    # Light background - use dark logo
    logo_path = LOGO_DARK
    print(f"Light background (L={bg_luminance:.1f}) → Using black-over-white logo")

# Read and encode selected logo
with open(logo_path, "rb") as f:
    logo_base64 = base64.b64encode(f.read()).decode('utf-8')
```

**Example: Acme Corp**
- Old Growth header (#1B3022): RGB (27, 48, 34) → L = 38.5 → Dark → white-over-black.png
- Raw Canvas header (#F5F2ED): RGB (245, 242, 237) → L = 242.3 → Light → black-over-white.png

### Logo Header Template

**Use this header pattern** when brand guidelines include a logo:

```html
<!-- Header with Logo (Brand Background) -->
<div style="background-color:{{brand_dark_color}};padding:20px;text-align:center;">
  <img src="data:image/png;base64,{{logo_base64}}"
       alt="{{brand_name}}"
       style="max-width:180px;height:auto;display:block;margin:0 auto;" />
</div>
```

**Variable placeholders**:
- `{{brand_dark_color}}`: Dark brand color for header background (e.g., #1B3022 for Acme Corp)
- `{{logo_base64}}`: Base64-encoded logo string
- `{{brand_name}}`: Company name for alt text

### Logo Specifications

- **Format**: PNG with transparent background (preferred)
- **Max width**: 200px for email headers
- **File size**: Keep under 100KB for email client compatibility
- **Aspect ratio**: Always maintain original proportions
- **Padding**: 20px padding around logo in header

### Example: Acme Corp Logo Header

```html
<div style="background-color:#1B3022;padding:20px;text-align:center;">
  <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgA..."
       alt="Acme Corp"
       style="max-width:180px;height:auto;display:block;margin:0 auto;" />
</div>
```

**Integration with templates below**: Place the logo header **before** the main content in any template (Template 1, 2, or 3).

---

## Email Templates

### Template 1: Header Hero (Most Common)

**Best for**: Product launches, announcements, promotions

```html
<div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;background:#ffffff;">
  <!-- Header with gradient background -->
  <div style="background:linear-gradient(135deg,{{header_color_1}} 0%,{{header_color_2}} 100%);
              padding:40px 20px;text-align:center;">
    <h1 style="font-size:32px;margin:0 0 10px 0;color:#ffffff;font-weight:700;">
      {{headline}}
    </h1>
    <p style="font-size:18px;margin:0;color:#ffffff;opacity:0.95;">
      {{subheadline}}
    </p>
  </div>

  <!-- Body content -->
  <div style="padding:30px 20px;">
    <p style="font-size:16px;line-height:1.6;color:#333333;margin:0 0 20px 0;">
      {{body_paragraph_1}}
    </p>
    <p style="font-size:16px;line-height:1.6;color:#333333;margin:0 0 20px 0;">
      {{body_paragraph_2}}
    </p>

    <!-- CTA Button -->
    <div style="text-align:center;margin:30px 0;">
      <a href="{{cta_url}}" style="display:inline-block;background:{{cta_bg_color}};
                                     color:{{cta_text_color}};padding:16px 40px;
                                     text-decoration:none;border-radius:6px;
                                     font-size:18px;font-weight:600;">
        {{cta_text}}
      </a>
    </div>
  </div>

  <!-- Footer -->
  <div style="padding:20px;background:#f5f5f5;text-align:center;">
    <p style="font-size:12px;color:#666666;margin:0 0 5px 0;">
      {{footer_text}}
    </p>
    <p style="font-size:12px;color:#666666;margin:0;">
      <a href="#" style="color:#666666;text-decoration:underline;">Unsubscribe</a> |
      <a href="#" style="color:#666666;text-decoration:underline;">Update preferences</a>
    </p>
  </div>
</div>
```

**Variable placeholders**:
- `{{header_color_1}}`, `{{header_color_2}}`: Gradient colors (e.g., #667eea, #764ba2)
- `{{headline}}`: Main headline text
- `{{subheadline}}`: Supporting headline text
- `{{body_paragraph_1}}`, `{{body_paragraph_2}}`: Body copy
- `{{cta_url}}`: Link destination
- `{{cta_bg_color}}`: Button background (e.g., #ff6b35)
- `{{cta_text_color}}`: Button text color (e.g., #ffffff)
- `{{cta_text}}`: Button text
- `{{footer_text}}`: Footer message

---

### Template 2: Image Hero

**Best for**: E-commerce, visual products, lifestyle brands

```html
<div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;background:#ffffff;">
  <!-- Full-width hero image -->
  <div style="width:100%;background:{{image_bg_color}};padding:60px 20px;text-align:center;">
    <div style="font-size:80px;margin:0 0 20px 0;">{{image_emoji}}</div>
    <h2 style="font-size:28px;margin:0;color:{{image_text_color}};font-weight:700;">
      {{image_headline}}
    </h2>
  </div>

  <!-- Content area -->
  <div style="padding:30px 20px;text-align:center;">
    <h1 style="font-size:28px;margin:0 0 15px 0;color:#333333;">
      {{headline}}
    </h1>
    <p style="font-size:16px;line-height:1.6;color:#666666;margin:0 0 25px 0;">
      {{body_copy}}
    </p>

    <!-- CTA Button -->
    <a href="{{cta_url}}" style="display:inline-block;background:{{cta_bg_color}};
                                   color:#ffffff;padding:16px 40px;
                                   text-decoration:none;border-radius:6px;
                                   font-size:18px;font-weight:600;">
      {{cta_text}}
    </a>
  </div>

  <!-- Footer -->
  <div style="padding:20px;background:#f5f5f5;text-align:center;">
    <p style="font-size:12px;color:#666666;margin:0;">
      {{footer_text}} | <a href="#" style="color:#666666;">Unsubscribe</a>
    </p>
  </div>
</div>
```

---

### Template 3: Text-Heavy (B2B/Thought Leadership)

**Best for**: Educational content, B2B, detailed explanations

```html
<div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;background:#ffffff;">
  <!-- Simple header -->
  <div style="padding:20px;border-bottom:3px solid {{accent_color}};">
    <h2 style="margin:0;font-size:18px;color:#333333;">{{brand_name}}</h2>
  </div>

  <!-- Content -->
  <div style="padding:30px 20px;">
    <h1 style="font-size:28px;margin:0 0 20px 0;color:#333333;line-height:1.3;">
      {{headline}}
    </h1>

    <p style="font-size:16px;line-height:1.6;color:#333333;margin:0 0 15px 0;">
      {{intro_paragraph}}
    </p>

    <p style="font-size:16px;line-height:1.6;color:#333333;margin:0 0 15px 0;">
      <strong>Key points:</strong>
    </p>
    <ul style="font-size:16px;line-height:1.8;color:#333333;margin:0 0 20px 0;padding-left:20px;">
      <li>{{bullet_1}}</li>
      <li>{{bullet_2}}</li>
      <li>{{bullet_3}}</li>
    </ul>

    <p style="font-size:16px;line-height:1.6;color:#333333;margin:0 0 20px 0;">
      {{closing_paragraph}}
    </p>

    <!-- Social proof box -->
    <div style="background:#f5f5f5;padding:20px;border-left:4px solid {{accent_color}};margin:20px 0;">
      <p style="font-size:14px;line-height:1.5;color:#333333;margin:0;font-style:italic;">
        "{{testimonial_quote}}"<br>
        <strong>{{testimonial_attribution}}</strong>
      </p>
    </div>

    <!-- CTA -->
    <div style="text-align:center;margin:30px 0;">
      <a href="{{cta_url}}" style="display:inline-block;background:{{cta_bg_color}};
                                     color:#ffffff;padding:16px 40px;
                                     text-decoration:none;border-radius:6px;
                                     font-size:18px;font-weight:600;">
        {{cta_text}}
      </a>
    </div>
  </div>

  <!-- Footer -->
  <div style="padding:20px;background:#f5f5f5;text-align:center;">
    <p style="font-size:12px;color:#666666;margin:0;">
      {{footer_text}} | <a href="#" style="color:#666666;">Unsubscribe</a>
    </p>
  </div>
</div>
```

---

### Template 4: Urgency-Driven (Flash Sales)

**Best for**: Flash sales, limited-time offers, countdown messaging

```html
<div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;background:#ffffff;">
  <!-- Urgent header with countdown -->
  <div style="background:{{urgency_color}};padding:15px 20px;text-align:center;">
    <p style="font-size:14px;margin:0;color:#ffffff;font-weight:600;letter-spacing:1px;">
      ⏰ {{urgency_message}}
    </p>
  </div>

  <!-- Main offer -->
  <div style="padding:40px 20px;text-align:center;background:linear-gradient(180deg,#ffffff 0%,#f9f9f9 100%);">
    <h1 style="font-size:48px;margin:0 0 10px 0;color:{{offer_color}};font-weight:800;">
      {{offer_headline}}
    </h1>
    <p style="font-size:24px;margin:0 0 25px 0;color:#333333;font-weight:600;">
      {{offer_description}}
    </p>

    <!-- CTA -->
    <a href="{{cta_url}}" style="display:inline-block;background:{{cta_bg_color}};
                                   color:#ffffff;padding:20px 50px;
                                   text-decoration:none;border-radius:8px;
                                   font-size:20px;font-weight:700;">
      {{cta_text}} →
    </a>

    <p style="font-size:14px;margin:25px 0 0 0;color:#666666;">
      {{fine_print}}
    </p>
  </div>

  <!-- Footer -->
  <div style="padding:20px;background:#f5f5f5;text-align:center;">
    <p style="font-size:12px;color:#666666;margin:0;">
      {{footer_text}} | <a href="#" style="color:#666666;">Unsubscribe</a>
    </p>
  </div>
</div>
```

---

## Instagram Templates

### Instagram Post Mockup (Square 1:1)

**Shows**: Instagram feed post with image, caption, and CTA button

```html
<div style="max-width:375px;margin:0 auto;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;background:#fafafa;padding:20px;">
  <div style="background:#ffffff;border:1px solid #dbdbdb;border-radius:3px;">

    <!-- Post header (profile info) -->
    <div style="padding:14px 16px;display:flex;align-items:center;border-bottom:1px solid #efefef;">
      <div style="width:32px;height:32px;border-radius:50%;background:{{profile_color}};margin-right:12px;"></div>
      <strong style="font-size:14px;color:#262626;">{{brand_username}}</strong>
    </div>

    <!-- Image (1:1 ratio) -->
    <div style="position:relative;width:100%;padding-bottom:100%;background:{{image_bg_color}};overflow:hidden;">
      <div style="position:absolute;top:0;left:0;right:0;bottom:0;
                  display:flex;align-items:center;justify-content:center;
                  padding:40px;text-align:center;">
        <!-- Image content placeholder -->
        <div>
          {{image_content}}
        </div>
      </div>
    </div>

    <!-- Engagement buttons (like, comment, share) -->
    <div style="padding:12px 16px;border-bottom:1px solid #efefef;">
      <div style="display:flex;gap:16px;">
        <span style="font-size:24px;">🤍</span>
        <span style="font-size:24px;">💬</span>
        <span style="font-size:24px;">📤</span>
      </div>
    </div>

    <!-- Caption -->
    <div style="padding:8px 16px;">
      <p style="font-size:14px;line-height:18px;color:#262626;margin:0;">
        <strong>{{brand_username}}</strong> {{primary_text}}
      </p>
    </div>

    <!-- CTA button -->
    <div style="padding:0 16px 16px 16px;">
      <button style="width:100%;background:#0095f6;color:#ffffff;
                     border:none;border-radius:8px;padding:9px;
                     font-size:14px;font-weight:600;cursor:pointer;">
        {{cta_button}}
      </button>
    </div>

  </div>
</div>
```

**Variable placeholders**:
- `{{profile_color}}`: Profile picture background color (e.g., #3897f0)
- `{{brand_username}}`: Instagram handle
- `{{image_bg_color}}`: Background color for image area (e.g., #ffffff)
- `{{image_content}}`: HTML for image content (text, emojis, product representation)
- `{{primary_text}}`: Caption text (125 chars max)
- `{{cta_button}}`: CTA button text

---

### Instagram Post - Text-Heavy Style

**For announcements or text-dominant visuals**:

```html
<!-- Inside image area -->
<div style="position:absolute;top:0;left:0;right:0;bottom:0;
            background:{{bg_color}};
            display:flex;align-items:center;justify-content:center;
            padding:40px;text-align:center;">
  <div>
    <p style="font-size:{{headline_size}}px;font-weight:{{headline_weight}};
               color:{{text_color}};margin:0 0 15px 0;line-height:1.2;">
      {{headline_text}}
    </p>
    <p style="font-size:{{subtext_size}}px;color:{{text_color}};
               margin:0;opacity:0.9;">
      {{subtext}}
    </p>
  </div>
</div>
```

**Example values**:
```
bg_color: #E63946 (bright red)
headline_size: 48
headline_weight: 800
text_color: #FFFFFF
headline_text: "50% OFF"
subtext_size: 24
subtext: "Ends Tonight"
```

---

### Instagram Post - Product-Focused Style

**For e-commerce product shots**:

```html
<!-- Inside image area -->
<div style="position:absolute;top:0;left:0;right:0;bottom:0;
            background:{{bg_color}};
            display:flex;align-items:center;justify-content:center;">
  <div style="text-align:center;">
    <!-- Product emoji/icon representation -->
    <div style="font-size:120px;margin:0 0 20px 0;">{{product_emoji}}</div>

    <!-- Optional badge -->
    <div style="position:absolute;top:30px;right:30px;
                background:{{badge_color}};color:#ffffff;
                padding:8px 16px;border-radius:20px;
                font-size:14px;font-weight:700;">
      {{badge_text}}
    </div>

    <!-- Brand logo placeholder -->
    <div style="position:absolute;bottom:30px;left:30px;
                font-size:12px;color:{{logo_color}};font-weight:600;">
      {{brand_name}}
    </div>
  </div>
</div>
```

---

## SMS Plain Text Frame

**For SMS previews** (plain text, no HTML):

```
┌──────────────────────────┐
│ {{message_line_1}}       │
│ {{message_line_2}}       │
│ {{message_line_3}}       │
│                          │
│ {{link}}                 │
│                          │
│ {{opt_out}}              │
└──────────────────────────┘
```

**Example**:
```
┌──────────────────────────┐
│ 🔥 FLASH SALE: 40% off  │
│ EVERYTHING ends at       │
│ midnight! Use code       │
│ FLASH40                  │
│                          │
│ Shop: bit.ly/flash40     │
│                          │
│ Reply STOP to unsubscribe│
└──────────────────────────┘
```

---

## Color Palette Reference

### Emotion-Based Colors

**Urgency** (flash sales, limited time):
- Red: #E63946
- Orange: #FF6B35
- Bright Yellow: #FFD60A

**Trust** (B2B, professional):
- Blue: #0095F6 (Instagram blue)
- Navy: #2C5F8D
- Teal: #06B6D4

**Luxury** (premium products):
- Black: #1A1A1A
- Gold: #FFD700
- Deep Purple: #6A0DAD

**Fresh/Natural** (wellness, organic):
- Green: #10B981
- Earth tone: #92400E
- White: #FFFFFF

**Playful** (youth brands, fun):
- Bright Pink: #EC4899
- Vibrant Purple: #8B5CF6
- Turquoise: #14B8A6

---

## Typography Scales

### Email Typography
- **Large headline**: 32-48px
- **Medium headline**: 24-28px
- **Body text**: 16px
- **Small text**: 14px
- **Footer text**: 12px

### Instagram On-Image Typography
- **Hero headline**: 48-72px
- **Subheadline**: 24-36px
- **Caption/label**: 14-18px

**Line height**: 1.2-1.3 for headlines, 1.6-1.8 for body text

---

## Best Practices

### Email HTML
✅ **Use inline styles** - No external CSS or `<style>` tags
✅ **Max width 600px** - Standard email width
✅ **Use tables for complex layouts** - Better email client support (not shown in simple templates above)
✅ **Test on mobile** - 60%+ opens are mobile
✅ **Include alt text** for images (if using real images)

### Instagram Mockups
✅ **1:1 ratio** - Use `padding-bottom:100%` trick for square
✅ **Mobile frame** - Max width 375px (iPhone size)
✅ **System fonts** - Use `-apple-system` font stack
✅ **Instagram blue** - #0095F6 for CTAs

### General
✅ **Hex colors** - Use 6-digit hex codes
✅ **Readable contrast** - Text vs. background contrast ratio ≥ 4.5:1
✅ **Responsive** - Works on mobile and desktop
✅ **Copy-paste ready** - Complete HTML blocks

---

## Using These Templates

1. **Choose template** based on ad type (hero, image-first, text-heavy, urgency, Instagram)
2. **Replace variables** with actual content (`{{headline}}` → "Save 40% Today")
3. **Customize colors** to match brand and message tone
4. **Test preview** by rendering HTML in browser or email client
5. **Iterate** based on visual review

These templates provide starting points. Customize as needed for specific brands and campaigns.
