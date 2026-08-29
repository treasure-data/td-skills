# Brand Guidelines Section Templates

Markdown templates for each section of the generated `brand-guidelines.md` file. Use these templates to ensure consistent structure and formatting.

### Phase 1-Only Note

When user completes only Phase 1 and chooses "Start using now", mark Sections 5-7 with:

```markdown
**Status**: *Optional - Not yet configured*

To enhance, say "Complete my brand guidelines"
```

---

## Section 1 Template: Brand Mission & Philosophy

```markdown
## 1. Brand Mission & Philosophy

{Mission statement - 1-2 sentences explaining brand purpose}

**Core Values**:
- **{Value 1}**: {Brief description or example}
- **{Value 2}**: {Brief description or example}
- **{Value 3}**: {Brief description or example}
{Additional values if provided}
```

**Example (Filled)**:
```markdown
## 1. Brand Mission & Philosophy

Acme Corp exists to equip the modern explorer with gear that lasts a lifetime and protects the places we play.

**Core Values**:
- **Durability**: Build products that endure
- **Sustainability**: Protect the environments we explore
- **Authenticity**: Show real use, real adventure
- **Expertise**: Share knowledge, not just products
```

---

## Section 2 Template: Brand Voice (Constant)

```markdown
## 2. Brand Voice (Constant)

The brand voice remains consistent across all channels and content types. These {number} attributes define how {Company Name} always sounds:

### {Voice Attribute}
- **What it means**: {Definition}
- **Language style**: {Style description}
- **Example**: "{Example content}"
- **Not this**: "{Counter-example}"

{Repeat for each voice attribute (2-4 total)}
```

**Example (Filled)**:
```markdown
## 2. Brand Voice (Constant)

The brand voice remains consistent across all channels and content types. These attributes define how Acme Corp always sounds:

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
```

---

## Section 3 Template: Brand Tone (Variable by Context)

```markdown
## 3. Brand Tone (Variable by Context)

While voice stays constant, tone adjusts based on context:

### {Context} Context
- **Tone**: {Tone descriptor}
- **When to use**: {Context description}
- **Example**: "{Example content}"
- **Avoid**: {What to avoid}

{Repeat for each context defined}
```

**Example (Filled)**:
```markdown
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
```

---

## Section 4A Template: Color Palette

```markdown
### A. Color Palette

Our color palette reflects {description of color meaning/inspiration}. Each color has a specific usage and meaning.

#### {Color Name} ({Hex Code})
- **Usage**: {Primary usage}
- **Meaning**: {What the color represents}
- **When to use**:
  - {Use case 1}
  - {Use case 2}
  - {Use case 3}
- **Avoid**: {When NOT to use}

{Repeat for each color}
```

**Example (Filled)**:
```markdown
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

#### Burnt Ochre (#B35D33)
- **Usage**: Call to Action (CTA) Only
- **Meaning**: The color of clay and sunsets. Warmth and action.
- **When to use**:
  - CTA buttons ("Shop Now", "Learn More", "Add to Cart")
  - Primary action links
- **Avoid**: Backgrounds, body text, decorative elements
- **Critical**: Reserve exclusively for CTAs to maintain visual hierarchy
```

---

## Section 4B Template: Typography

```markdown
### B. Typography

#### {Font Name} ({Usage})
- **Font Stack**: `{CSS font-family}`
- **Usage**: {When and where to use}
- **Weights**: {Font weights and usage}
{Optional: Style, Size, Line height}
- **Character**: {Font personality description}

{Repeat for each font}
```

**Example (Filled)**:
```markdown
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
```

---

## Section 4C Template: Logo Usage

### With Logo Files

```markdown
### C. Logo Usage

#### Logo Files

**Logo (Dark - For Light Backgrounds)**:
- **Filename**: `{filename}`
- **Path**: `~/Documents/Brand Guidelines/{Company Name}/logos/logo-dark.{ext}`
- **Appearance**: {Description}
- **Use when**: {Background conditions}

**Logo (Light - For Dark Backgrounds)** (if applicable):
- **Filename**: `{filename}`
- **Path**: `~/Documents/Brand Guidelines/{Company Name}/logos/logo-light.{ext}`
- **Appearance**: {Description}
- **Use when**: {Background conditions}

#### Size Requirements
- **Minimum Width**: {size}px (digital), {size} inch (print)
- **Maximum Width** (Email): {size}px for email headers
- **Maximum Width** (Instagram Images): {size}px when composited onto images
- **Aspect Ratio**: Always maintain original proportions (never distort)

#### Clear Space
- **Minimum padding**: {size}px on all sides (digital)
- **Rule of thumb**: {Spacing rule}

#### Channel-Specific Placement

**Email**:
- **Position**: {Position description}
- **Background**: {Background color/context}
- **Size**: {Recommended size}px width recommended

**Instagram Image Ads**:
- **Position**: {Position description}
- **Padding**: {size}px from edges
- **Size**: {size}px width maintaining aspect ratio

#### Logo Don'ts
- ❌ Never distort aspect ratio (stretch or squash)
- ❌ Never add drop shadows, glows, or effects
- ❌ Never rotate or tilt the logo
- ❌ Never place on {prohibited backgrounds}
- ❌ {Additional restrictions}
```

**Without Logo Files**: Use the same template but omit Logo Files section and add: `**Note**: Logo files not yet available. Add to ~/Documents/Brand Guidelines/{Company Name}/logos/ when ready.`

---

## Section 4D Template: Imagery Guidelines

```markdown
### D. Imagery Guidelines

#### {Category}
- **Show**: {What to include}
- **Avoid**: {What to exclude}
- **Example**: {Example description}

{Repeat for authenticity, lighting, ethics as applicable}
```

**Example (Filled)**:
```markdown
### D. Imagery Guidelines

#### Authenticity
- **Show**: Real use, sweat, mud, worn gear, functional setups
- **Avoid**: Studio-perfect models, pristine gear that looks unused
- **Example**: Hiker with dirt on boots, condensation on tent, worn backpack straps

#### Lighting
- **Preferred**: Natural, directional light (golden hour, diffused overcast)
- **Avoid**: Heavy filters, over-saturation, artificial studio lighting
- **Goal**: Authentic representation of outdoor environments
```

---

## Section 5 Template: Messaging & Lexicon

```markdown
## 5. Messaging & Lexicon

### Power Words (DO Use)
Words that reflect our brand voice and values:

- **{Category 1}**: {Word list}
- **{Category 2}**: {Word list}
{Additional categories}

### Prohibited Terms (DON'T Use)
Words that contradict our voice or sound inauthentic:

- **{Category 1}**: {Word list}
- **{Category 2}**: {Word list}
{Additional categories}

### Key Messages

**Primary Value Proposition**:
"{Value proposition}"

{Optional: Sustainability Message}
{Optional: Customer Promise}
{Optional: Brand Tagline/Signature}
```

**Example (Filled)**:
```markdown
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

**Brand Signature**:
"Gear up. Get out. Leave it better."
```

---

## Section 6 Template: Legal & Compliance Requirements

```markdown
## 6. Legal & Compliance Requirements

{Include only sections for channels the brand uses}

### Email (CAN-SPAM Compliance)
**Required Elements**:
- Unsubscribe link (functional, one-click)
- Physical mailing address
- Accurate "From" name and email address
- Clear identification as advertisement (if promotional)

**Footer Template**:
```
{Company Name}
{Physical Address}
[Unsubscribe] | [Update Preferences] | [Privacy Policy]
```

### SMS (TCPA Compliance)
**Required Elements**:
- Opt-out instructions: "{Opt-out language}"
- Help information: "{Help language}"
- Message frequency disclosure
- Standard messaging rates disclaimer

**SMS Footer**:
```
{SMS footer text}
```

### Instagram (FTC Disclosure)
**Required for**:
- Sponsored posts: {Disclosure requirements}
- Affiliate links: {Disclosure requirements}
- Gifted products: {Disclosure requirements}
```

---

## Section 7 Template: Accessibility Standards

```markdown
## 7. Accessibility Standards

### WCAG 2.1 {Level} Compliance

**Color Contrast**:
- Minimum {ratio}:1 ratio for body text ({size}px and below)
- Minimum 3:1 ratio for large text (24px and above)
- Test all color combinations

**Alt Text**:
- {Required/Optional} for all images
- Describe function, not just appearance
- Example: "{Example alt text description}"

**Font Sizes**:
- Minimum {size}px on mobile
- Minimum {size}px on desktop
- Never use text smaller than {size}px

**Reading Level**:
- Target: {Reading level} for general content
{Additional guidance}
- Use short sentences, active voice
```

---

## Section 8 Template: Compliance Checklist

```markdown
## 8. Compliance Checklist

Before publishing any creative content, ask:

### Is it true?
- All claims substantiated
- Performance specs verified
- No exaggeration or misleading statements

### Does it sound like us?
- {Voice attr 1}, {Voice attr 2}, {Voice attr 3} voice
- Appropriate tone for context
- Uses power words, avoids prohibited terms

### Does it inspire action?
- Clear call-to-action
- {CTA color name} ({hex}) used for CTA
- Compelling without hyperbole

### Is it accessible?
- Color contrast meets {ratio}:1 minimum
- All images have alt text
- Font sizes meet {min size}px minimum
- Reading level appropriate

### Is it legally compliant?
- Required disclaimers present
- {Channel-specific requirements}
- Privacy requirements met
```

---

## Usage Notes Template

```markdown
---

## Usage Notes

This brand guidelines document was created using the brand-onboarding skill on {Date}.

To update these guidelines:
1. **Edit directly**: Modify this file and save changes
2. **Use wizard**: Say "Update my brand guidelines" to Claude

When using these guidelines:
- All creative skills (brand-compliance, multi-channel-ad-ideation, etc.) automatically detect and use this file
- File location: `~/Documents/Brand Guidelines/{Company Name}/brand-guidelines.md`
- Your brand folder also contains `logos/` and `assets/` subdirectories for brand materials

Last updated: {Date}
Generated by: brand-onboarding skill v1.0
```