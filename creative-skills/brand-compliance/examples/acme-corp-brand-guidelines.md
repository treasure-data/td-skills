# Brand Guidelines: Acme Corp

**Version 1.0**

This document serves as a **reference example** showing what comprehensive brand guidelines look like. Use this as a template when creating your own brand guidelines for compliance review.

---

## 1. Brand Mission & Philosophy

Acme Corp exists to equip the modern explorer with gear that lasts a lifetime and protects the places we play.

**Core Values**:
- **Durability**: Build products that endure
- **Sustainability**: Protect the environments we explore
- **Authenticity**: Show real use, real adventure
- **Expertise**: Share knowledge, not just products

---

## 2. Brand Voice (Constant)

The brand voice remains consistent across all channels and content types. These three attributes define how Acme Corp always sounds:

### Knowledgeable
- **What it means**: Experts in gear, technique, and environment
- **Language style**: Precise, authentic, factual
- **Example**: "Engineered with bluesign® certified nylon and 100% recycled polyester fill"
- **Not this**: "Made with some good materials"

### Enthusiastic
- **What it means**: Genuinely passionate about outdoor exploration
- **Language style**: Encouraging, energizing, reflecting the joy of adventure
- **Example**: "What's your sunrise ritual? Coffee on the summit or tea by the trail?"
- **Not this**: "We sell camping gear"

### Respectful
- **What it means**: Humility toward nature, prioritizing planet and community
- **Language style**: Transparent about impact, honest about limitations
- **Example**: "70% recycled materials. We're working on the rest."
- **Not this**: "100% eco-friendly!" (unless substantiated)

---

## 3. Brand Tone (Variable by Context)

While voice stays constant, tone adjusts based on context:

### Product Specs Context
- **Tone**: Precise & Functional
- **When to use**: Product descriptions, technical specifications, gear details
- **Example**: "Waterproof-breathable 3-layer Gore-Tex® shell. Adjustable hood. Pit zips for ventilation."
- **Avoid**: Inspirational language, hyperbole

### Social Media Context
- **Tone**: Inspirational
- **When to use**: Instagram captions, Facebook posts, community engagement
- **Example**: "Where will today's trail take you?"
- **Avoid**: Technical jargon, overly formal language

### Sustainability Context
- **Tone**: Transparent
- **When to use**: Environmental impact statements, sustainability reports
- **Example**: "This jacket uses 15 recycled water bottles. Our goal: 100% circular materials by 2028."
- **Avoid**: Greenwashing, vague claims

### Support/Customer Service Context
- **Tone**: Solution-Oriented
- **When to use**: Email support, troubleshooting guides, warranty claims
- **Example**: "Let's get your headlamp sorted. Can you describe what happens when you press the power button?"
- **Avoid**: Corporate jargon, defensive language

### Safety & Education Context
- **Tone**: Authoritative
- **When to use**: Trail safety guides, Leave No Trace principles, wilderness skills
- **Example**: "Always pack out all trash. Carry a bear canister in grizzly country."
- **Avoid**: Casual tone, suggestions instead of clear guidance

---

## 4. Visual Identity

### A. Color Palette

Our color palette reflects the natural environments we explore. Each color has a specific usage and meaning.

#### Old Growth (#1B3022)
- **Usage**: Primary Logo & Dark Backgrounds
- **Meaning**: Represents stability and the enduring forests we protect
- **When to use**:
  - Logo placement on light backgrounds
  - Email/web headers and footers
  - Dark overlay backgrounds for hero images
- **Avoid**: Body text (insufficient contrast), CTA buttons

#### Granite (#4A4E51)
- **Usage**: Secondary Text & UI Elements
- **Meaning**: Represents durability and the solid rock beneath our feet
- **When to use**:
  - Body text on light backgrounds
  - Secondary headings
  - UI elements (borders, dividers, icons)
- **Avoid**: Primary backgrounds, CTAs

#### Raw Canvas (#F5F2ED)
- **Usage**: Primary Background
- **Meaning**: An organic, off-white alternative to stark white
- **When to use**:
  - Email backgrounds
  - Web page backgrounds
  - Content area backgrounds
- **Avoid**: Text color (insufficient contrast against white)

#### Burnt Ochre (#B35D33)
- **Usage**: Call to Action (CTA) Only
- **Meaning**: The color of clay and sunsets. Warmth and action.
- **When to use**:
  - CTA buttons ("Shop Now", "Learn More", "Add to Cart")
  - Primary action links
- **Avoid**: Backgrounds, body text, decorative elements
- **Critical**: Reserve exclusively for CTAs to maintain visual hierarchy

#### Lichen (#9CAF88)
- **Usage**: Accents for Sustainability
- **Meaning**: Growth, renewal, and our commitment to the environment
- **When to use**:
  - Sustainability badges ("Recycled Materials", "Carbon Neutral Shipping")
  - Eco-certification callouts (bluesign®, Fair Trade)
  - Environmental impact highlights
- **Avoid**: General accents, non-sustainability contexts

### B. Typography

#### Palatino (Headings)
- **Font Stack**: `Palatino, "Palatino Linotype", "Book Antiqua", Georgia, serif`
- **Usage**: All headings (H1-H6)
- **Weights**: Bold (700) for emphasis, SemiBold (600) for subheadings
- **Style**: ALL-CAPS for H1 and major section headings
- **Example**: "NEW ALPINE COLLECTION"
- **Character**: Elegant, refined serif with outdoor heritage feel

#### Trebuchet MS (Body Text)
- **Font Stack**: `"Trebuchet MS", "Lucida Grande", "Lucida Sans Unicode", Arial, sans-serif`
- **Usage**: All body copy, descriptions, product details
- **Weights**: Regular (400) for body, Bold (700) for emphasis
- **Size**: Minimum 16px on mobile, 18px on desktop
- **Line height**: 1.6 for readability
- **Character**: Friendly, modern sans-serif with approachable readability

#### Courier New (Special Use)
- **Font Stack**: `"Courier New", Courier, "Lucida Console", monospace`
- **Usage**: Field Notes, Pro-Tips, Technical Specifications
- **Style**: Monospace gives an authentic "field journal" feel
- **Example**: Pro-Tip callout boxes, gear specification tables
- **Character**: Classic typewriter/journal aesthetic

### C. Logo Usage

#### Logo Files (Dual Variants)

Acme Corp uses two logo variants for optimal contrast on different backgrounds:

**Logo (Dark - For Light Backgrounds)**:
- **Filename**: `Acme-logo-black_over_white.png`
- **Full Path**: `./Acme-logo-black_over_white.png`
- **Appearance**: Black text "The Acme Corp" with black tree silhouettes on white background
- **Use when**: Background is Raw Canvas (#F5F2ED) or other light colors
- **Auto-selection rule**: Background luminance >= 128 (0-255 scale)

**Logo (Light - For Dark Backgrounds)**:
- **Filename**: `Acme-logo-white_over_black.png`
- **Full Path**: `./Acme-logo-white-over-black.png`
- **Appearance**: White text "The Acme Corp" with white tree silhouettes on dark gray/black background
- **Use when**: Background is Old Growth (#1B3022) or other dark colors
- **Auto-selection rule**: Background luminance < 128 (0-255 scale)

**Format Notes**:
- Both logos have backgrounds baked into the PNG (not transparent)
- File size: Keep under 100KB for email compatibility
- Automatic selection: Skills analyze background color and select appropriate variant

#### Automatic Logo Selection Algorithm

The email and Instagram image skills automatically select the appropriate logo variant based on background brightness:

**Luminance Calculation** (WCAG Formula):
```
L = 0.299 × R + 0.587 × G + 0.114 × B
```
Where R, G, B are color values (0-255)

**Selection Logic**:
- If luminance < 128: **Dark background** → Use white-over-black logo (light variant)
- If luminance >= 128: **Light background** → Use black-over-white logo (dark variant)

**Email Implementation**:
- Analyzes header background color (e.g., Old Growth #1B3022)
- Calculates RGB luminance: (27, 48, 34) → L = 38.5 → Dark → Use light logo
- Embeds selected logo as base64 in HTML

**Instagram Image Implementation**:
- Analyzes pixel region where logo will be placed (e.g., top-right 100×100px area)
- Calculates average luminance of that region
- Selects logo variant dynamically based on AI-generated background
- Example: Night scene (avg luminance 45) → Dark → Use light logo

This ensures optimal logo visibility and brand consistency across all backgrounds.

#### Size Requirements
- **Minimum Width**: 80px (digital), 1 inch (print)
- **Maximum Width** (Email): 200px for email headers
- **Maximum Width** (Instagram Images): 100-120px when composited onto images
- **Aspect Ratio**: Always maintain original proportions (never distort)

#### Clear Space
- **Minimum padding**: 20px on all sides (digital)
- **Rule of thumb**: Padding equal to the height of "O" in "OUTDOOR"

#### Approved Backgrounds
- **Old Growth (#1B3022)**: Primary logo placement color (dark backgrounds)
- **Raw Canvas (#F5F2ED)**: Light background option
- **Photography**: Only with dark overlay ensuring logo visibility
- **Transparent**: For compositing onto images

#### Prohibited Backgrounds
- **Never use on**: Burnt Ochre (#B35D33), Lichen (#9CAF88), gradients, busy patterns
- **Low contrast**: Avoid any background where logo isn't clearly visible

#### Channel-Specific Placement

**Email**:
- **Position**: Centered in header
- **Background**: Old Growth (#1B3022) header with 20px padding
- **Size**: 160-180px width recommended
- **Implementation**: Base64-encoded and embedded in HTML
- **Logo Selection**: Automatic based on header background color
  - Old Growth header (#1B3022, luminance 38.5) → white-over-black.png
  - Raw Canvas header (#F5F2ED, luminance 242.3) → black-over-white.png

**Instagram Image Ads**:
- **Position**: Top-right corner (default) or top-left
- **Padding**: 40px from edges
- **Size**: 100px width maintaining aspect ratio
- **Implementation**: Composited onto AI-generated image using Pillow
- **Logo Selection**: Automatic based on sampled region where logo will be placed
  - Dark backgrounds (night scenes, forests, shadows) → white-over-black.png
  - Light backgrounds (sky, snow, bright scenes) → black-over-white.png

#### Logo Don'ts
- ❌ Never distort aspect ratio (stretch or squash)
- ❌ Never add drop shadows, glows, or effects
- ❌ Never rotate or tilt the logo
- ❌ Never place on Lichen green or Burnt Ochre
- ❌ Never use outdated logo versions

### D. Imagery Guidelines

#### Authenticity
- **Show**: Real use, sweat, mud, worn gear, functional setups
- **Avoid**: Studio-perfect models, pristine gear that looks unused
- **Example**: Hiker with dirt on boots, condensation on tent, worn backpack straps

#### Ethics
- **Required**: All images must follow Leave No Trace principles
- **Prohibited**: Visible litter, campfires outside designated areas, shortcutting switchbacks
- **Verify**: No LNT violations visible in photography

#### Lighting
- **Preferred**: Natural, directional light (golden hour, diffused overcast)
- **Avoid**: Heavy filters, over-saturation, artificial studio lighting
- **Goal**: Authentic representation of outdoor environments

---

## 5. Messaging & Lexicon

### Power Words (DO Use)
Words that reflect our brand voice and values:

- **Action**: Traverse, Equip, Endure, Explore, Preserve, Venture
- **Environment**: Backcountry, Summit, Alpine, Trailhead, Wilderness
- **Sustainability**: Circular, PFC-Free, Traceable, Recycled, Durable, Repairable
- **Quality**: Engineered, Tested, Proven, Reliable, Built-to-Last

### Prohibited Terms (DON'T Use)
Words that contradict our voice or sound inauthentic:

- **Vague green claims**: Eco-friendly, Green, Natural (unless certified)
- **Internet slang**: Lit, Bestie, FOMO, Slay, Goals
- **Hyperbole**: Life-changing, Insane, Epic, Revolutionary, Game-changer
- **Corporate jargon**: Leverage, Synergy, Paradigm, Ecosystem (in business context)

### Key Messages

**Primary Value Proposition**:
"Gear that lasts a lifetime. Built for the backcountry, designed for durability, committed to protecting the places we play."

**Sustainability Message**:
"Every product is a commitment: to you, to quality, and to the wild spaces we all share. We're transparent about our impact and always working toward 100% circular materials."

**Customer Promise**:
"If it breaks, we'll fix it. If we can't fix it, we'll replace it. Gear should outlast trends."

---

## 6. Legal & Compliance Requirements

### Email (CAN-SPAM Compliance)
**Required Elements**:
- Unsubscribe link (functional, one-click)
- Physical mailing address
- Accurate "From" name and email address
- Clear identification as advertisement (if promotional)

**Footer Template**:
```
Acme Corp
456 Trail Ridge Road, Boulder, CO 80302
[Unsubscribe] | [Update Preferences] | [Privacy Policy]
```

### SMS (TCPA Compliance)
**Required Elements**:
- Opt-out instructions: "Text STOP to unsubscribe"
- Help information: "Text HELP for assistance"
- Message frequency disclosure
- Standard messaging rates disclaimer

**SMS Footer**:
```
Msg frequency varies. Msg & data rates may apply. Text STOP to unsubscribe, HELP for help.
```

### Instagram (FTC Disclosure)
**Required for**:
- Sponsored posts: "#ad" or "#sponsored" above the fold
- Affiliate links: Clear disclosure before link
- Gifted products: "#gifted" or "#partner"

### Claims Substantiation
- **Environmental claims**: Must be certified (bluesign®, Fair Trade, etc.)
- **Performance claims**: Must be tested ("Waterproof to 20,000mm" = lab tested)
- **Durability claims**: Must be verifiable ("Lifetime warranty" = actual warranty terms)

---

## 7. Accessibility Standards

### WCAG 2.1 AA Compliance

**Color Contrast**:
- Minimum 4.5:1 ratio for body text (18px and below)
- Minimum 3:1 ratio for large text (24px and above)
- Test all color combinations

**Alt Text**:
- Required for all images
- Describe function, not just appearance
- Example: "Hiker ascending rocky trail in alpine environment" (not just "Hiker")

**Font Sizes**:
- Minimum 16px on mobile
- Minimum 18px on desktop
- Never use text smaller than 14px

**Reading Level**:
- Target: 8th-grade reading level for general content
- Technical specs can be more advanced
- Use short sentences, active voice

---

## 8. Compliance Checklist

Before publishing any creative content, ask:

### Is it true?
- All claims substantiated
- Performance specs verified
- No exaggeration or misleading statements

### Does it sound like us?
- Knowledgeable, Enthusiastic, Respectful voice
- Appropriate tone for context
- Uses power words, avoids prohibited terms

### Does it inspire action?
- Clear call-to-action
- Burnt Ochre (#B35D33) used for CTA
- Compelling without hyperbole

---

## 9. The Signature

Every piece of content should embody:

**"Gear up. Get out. Leave it better."**

This signature represents our commitment to:
- **Gear up**: Quality equipment you can rely on
- **Get out**: Encouraging outdoor exploration
- **Leave it better**: Environmental stewardship and Leave No Trace principles

---

## Usage Notes

This brand guidelines document is an **example** for the brand-compliance skill. When using the skill:

1. **Provide your own guidelines** in any format (markdown, inline, file path)
2. **Include key elements**: Voice, tone, colors (with usage context), typography, lexicon
3. **Be specific**: Exact hex codes, font names, approved/prohibited terms
4. **Define usage rules**: When to use each color, which tone for which context
5. **Include legal requirements**: Channel-specific disclaimers (CAN-SPAM, TCPA, FTC)

The brand-compliance skill adapts to your guideline format and extracts relevant information for compliance review.
