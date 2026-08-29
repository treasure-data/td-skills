# Brand Onboarding Wizard Questions

Complete reference of all wizard questions organized into two phases. Use this reference to ensure comprehensive brand guidelines coverage.

---

# PHASE 1: CORE BRANDING (Required - 8 Question Sets)

**Purpose**: Collect minimum information needed for functional brand guidelines

**Time**: ~8 minutes

---

## Question Set 1: Initial Path Selection

**Q1: Documentation Source**

Ask: "Do you have existing brand documentation?"

- **A. Paste text** → User pastes brand docs. Auto-extract colors, fonts, voice, terms (see [extraction-from-docs.md](../examples/extraction-from-docs.md)). Ask only for missing sections.
- **B. File/URL** → User provides file path or URL. Same extraction as A.
- **C. From scratch** → Proceed to Question Set 2. Full guided wizard (~15 min).

---

## Question Set 2: Brand Foundation

- **Company Name** (required): "What's your company or brand name?"
- **Brand Mission** (required, 1-2 sentences): "What's your brand's purpose or mission?" Example: "Equip the modern explorer with gear that lasts a lifetime and protects the places we play." Avoid: too vague ("We make great products"), too long (5+ sentences)
- **Core Values** (required, 3-5 comma-separated): "What 3-5 values define your brand?" Example: "Durability, Sustainability, Authenticity, Expertise". Avoid: generic ("Excellence, Leadership, Success")

---

## Question Set 3: Brand Voice (Constant)

**Brand Voice** (required, 2-4 adjectives): "Describe your brand voice in 2-4 words. This should stay constant across ALL content."
Example: "Knowledgeable, Enthusiastic, Respectful"
Avoid: generic ("Good, Nice, Helpful"), more than 4 (dilutes identity)

For each voice attribute, ask one at a time. Wait for the user's response before moving to the next attribute.

For each brand voice, ask: "What does '{attribute}' mean for your brand?" Collect:
- **What it means**: 1-sentence definition
- **Language style**: How it's expressed
- **Example**: Concrete content example

Example for "Knowledgeable":
- What it means: Experts in gear, technique, and environment
- Language style: Precise, authentic, factual
- Example: "Engineered with bluesign® certified nylon and 100% recycled polyester fill"

---

## Question Set 4: Brand Tone (Variable by Content Type)

**Content Types** (required, select all that apply): "What types of content do you create?"
Options: Product Specs, Social Media, Sustainability, Support, Safety/Education, Marketing, Other

For each type, ask: "What tone should you use for {type}?" Collect: tone descriptor, when to use, example, what to avoid.

Common tones by type:
- Product Specs: Precise & Functional — "Waterproof-breathable 3-layer Gore-Tex® shell." Avoid: hyperbole
- Social Media: Inspirational — "Where will today's trail take you?" Avoid: jargon
- Sustainability: Transparent — "This jacket uses 15 recycled water bottles." Avoid: greenwashing
- Support: Solution-Oriented — "I see the issue. Let's fix that together." Avoid: blame
- Marketing: Value-Focused — "Stop guessing. Start knowing." Avoid: unsubstantiated claims

---

## Question Set 5: Visual Identity - Colors

For each color, collect: hex code (#RRGGBB), name (optional but recommended), usage rules, restrictions.

### Required Colors

**Primary Brand Color** (required): "What is your primary brand color?"
- Collect: hex, name, when to use, when NOT to use
- Example: #1B3022 "Old Growth" — logo on light backgrounds, headers. Avoid: body text (low contrast), CTAs

**CTA Color** (required): "What is your call-to-action (CTA) color?"
- Collect: hex, name
- Validation: must differ from primary, must have 4.5:1 contrast vs background
- Reserve exclusively for CTAs (Shop Now, Learn More, Add to Cart)
- Example: #B35D33 "Burnt Ochre" — CTA buttons only

**Background Color** (required): "What is your primary background color?"
- Collect: hex, name
- Example: #F5F2ED "Raw Canvas" — email/web backgrounds

### Secondary/Accent Colors (optional)
"Do you have any additional brand colors?" If yes, one per line: `#9CAF88 - Lichen (sustainability accents)`

### Auto-validation
Check 4.5:1 contrast between CTA and background. If fails, offer to adjust or proceed.

---

## Question Set 6: Visual Identity - Typography

### Heading Font (required)
"What font do you use for headings?"
- Collect: font name, font stack (optional — generate default fallback if not provided), weights, special styling
- Example: Palatino, `Palatino, "Palatino Linotype", Georgia, serif`, Bold (700), ALL-CAPS for H1

### Body Font (required)
"What font do you use for body text?"
- Collect: font name, font stack (optional), min size, line height
- Defaults: 16px mobile / 18px desktop, line height 1.6
- Warn if min size < 16px (accessibility concern)
- Example: Trebuchet MS, `"Trebuchet MS", Arial, sans-serif`, Regular (400)

### Special Fonts (optional)
"Do you have any fonts for special uses?" If yes, collect font name + usage.
- Example: `Courier New — code blocks, technical specs, field notes`

---

## Question Set 7: Visual Identity - Logo Usage

### Logo Files
"Do you have logo files available?"
- If Yes: collect file paths or URLs
  - Local files → copy to `~/Documents/Brand Guidelines/{Company}/logos/`
  - URLs → offer to download locally (recommended) or keep as reference
- If No: create empty logos/ folder, record usage rules only, note folder location for later

"Do you have separate logo versions for light vs dark backgrounds?"
- If Yes: "Which logo is for LIGHT backgrounds?" and "Which logo is for DARK backgrounds?"

Note: Logo files are also prompted during Step 16 completion (see SKILL.md) if not provided here.

### Logo Specifications
- **Size** (at least min or max required): min width (default: 80px), max email (default: 200px), max Instagram (default: 120px)
- **Placement** (required): "Where should your logo appear in branded content?" Example: "Centered in email header with 20px padding"
- **Restrictions** (defaults, all apply unless overridden): Never distort, never add effects, never rotate, never recolor. Custom: ___

---

## Question Set 8: Visual Identity - Imagery Style

- **Photography style** (required): "What photography or imagery style represents your brand?"
  Describe the look and feel of images that represent your brand.
  Example: "Authentic, real-world use. Actual customers using products in real environments."
- **Authenticity** (optional): "What authenticity standards do you have for imagery?"
  What should images SHOW vs AVOID to maintain brand authenticity?
  Example — Show: real use, sweat, worn gear | Avoid: studio-perfect models, pristine unused gear
- **Lighting** (optional): "What lighting style do you prefer?"
  Example: "Natural, directional light (golden hour, diffused overcast)". Avoid: heavy filters, over-saturation
- **Ethics/compliance** (optional): "Are there any ethical or compliance requirements for your imagery?"
  Example: "All images must follow Leave No Trace principles" or "Images must represent diverse demographics"

---

## AFTER PHASE 1: CHOICE POINT

After completing Phase 1 questions (Question Sets 1-8), present this choice to the user:

```
✅ Core brand guidelines created! (~70% complete)

Phase 1 covers visual and voice. Phase 2 adds Messaging, Legal & Accessibility compliance for production-ready content (100%).

What would you like to do?
1. Start using now (can enhance later)
2. Continue to Phase 2 (~7 min) [Recommended for production]

Choice: ___
```

**If user chooses Option 1 (Start using now)**:
- Generate brand-guidelines.md with Sections 1-4 complete
- Mark Sections 5-7 as "Optional - not configured"
- Provide success message (~70% complete)
- User can enhance later by saying "Complete my brand guidelines"

**If user chooses Option 2 (Continue to Phase 2)**:
- Proceed to Question Set 9 (Messaging - Approved Terms)
- Complete all Phase 2 questions
- Generate comprehensive guidelines with all 8 sections

---

# PHASE 2: COMPREHENSIVE ENHANCEMENT (Optional - 7 Question Sets)

**Purpose**: Add messaging standards, legal compliance, and accessibility for production-ready guidelines

**Time**: ~7 minutes

**Result**: Guidelines with all 8 sections complete, 100% comprehensive

**What Phase 2 adds**:
- Messaging standards (approved/prohibited terminology)
- Legal protection (CAN-SPAM, TCPA, FTC compliance)
- Accessibility compliance (WCAG 2.1 AA standards)

**Note**: Users can skip Phase 2 and add it later by saying "Complete my brand guidelines"

---

## Question Set 9: Approved Terms

- **Power Words** (required, 5+ terms, comma-separated or list): "What words or phrases should your brand USE regularly?"
  Guidance: Terms that reinforce your voice and values. Organize by category: action words, industry terms, value words, quality descriptors.

  Example (Outdoor brand):
  Action: Traverse, Equip, Endure, Explore | Environment: Backcountry, Summit, Alpine | Sustainability: Circular, PFC-Free, Traceable | Quality: Engineered, Tested, Proven

  Example (Tech brand):
  Action: Automate, Optimize, Scale | Product: Dashboard, Workflow, Analytics | Value: Enterprise-grade, Reliable, Secure

---

## Question Set 10: Prohibited Terms

- **Prohibited Words** (required, 3+ terms, comma-separated or list): "What words or phrases should your brand NEVER use?"
  Guidance: Words that contradict your voice, sound inauthentic, or create legal risks (e.g., unsubstantiated claims).

  Example (Outdoor brand):
  Vague green claims: eco-friendly, green, natural (unless certified) | Hyperbole: life-changing, epic, revolutionary | Slang: lit, bestie, FOMO, slay

  Example (Tech brand):
  Vague claims: best, fastest, easiest (without data) | Jargon: disruptive, bleeding-edge, ninja, rockstar | Hyperbole: revolutionary, game-changing

  Example (Professional services):
  Vague: world-class, premier, leading (without substantiation) | Casual: awesome, cool, nice, great (too informal) | Absolute claims: always, never, guaranteed (unless actually guaranteed)

---

## Question Set 11: Key Messages

- **Value Proposition** (required, 1-2 sentences): "What's your primary value proposition?"
  Guidance: [What you offer] + [How it's different] + [Why it matters]
  Example (Outdoor): "Gear that lasts a lifetime. Built for the backcountry, designed for durability, committed to protecting the places we play."
  Example (Tech): "Enterprise-grade analytics made accessible. Get insights in minutes, not months, at a price small businesses can afford."

- **Sustainability Message** (optional, 2-3 sentences): "How do you communicate your environmental or sustainability commitments?"
  Guidance: If sustainability is part of your brand, how do you message it authentically? Be specific. Avoid vague greenwashing ("We care about the environment") or unsubstantiated claims.
  Example (Outdoor): "Every product is a commitment: to you, to quality, and to the wild spaces we all share. We're transparent about our impact and always working toward 100% circular materials."
  Example (Tech): "Carbon-neutral cloud infrastructure. We offset 100% of our data center emissions and publish our sustainability report annually."

- **Customer Promise** (optional, 1-2 sentences): "What guarantee or commitment do you make to customers?"
  Example (Outdoor): "If it breaks, we'll fix it. If we can't fix it, we'll replace it. Gear should outlast trends."
  Example (Tech): "30-day money-back guarantee. No questions asked. 24/7 support from real humans."

- **Brand Tagline** (optional, single line): "Do you have a brand tagline or signature phrase?"
  Example (Outdoor): "Gear up. Get out. Leave it better."
  Example (Tech): "See what's working. Fix what's not."

---

## Question Set 12: Legal - Email (CAN-SPAM)

- **Send marketing emails?** (required, Yes/No): "Do you send marketing emails?"
  If No → Skip to Q13. If Yes → collect CAN-SPAM fields:

- **Physical Address** (required if yes): "What's your company's physical mailing address?"
  Guidance: Appears in email footer. P.O. boxes acceptable. Format: Street, City, State, ZIP, Country.

- **Unsubscribe Text** (optional, default "Unsubscribe"): "What text do you want for your unsubscribe link?"
  Options: "Unsubscribe from emails", "Opt out", "Manage preferences"

- **Privacy Policy URL** (optional): "Do you have a privacy policy URL?"
  If provided, included in footer as [Privacy Policy] link.

Generated footer: `{Company Name} | {Address} | [Unsubscribe] | [Privacy Policy]`

---

## Question Set 13: Legal - SMS (TCPA)

- **Send marketing SMS?** (required, Yes/No): "Do you send marketing SMS messages?"
  If No → Skip to Q14. If Yes → collect TCPA fields:

- **Opt-Out Language** (optional, default "Text STOP to unsubscribe"): "What opt-out instruction do you use for SMS?"
  Options: "Text STOP to unsubscribe", "Reply STOP to opt out", "Text STOP to stop receiving messages"

- **Help Language** (optional, default "Text HELP for assistance"): "What help instruction do you use for SMS?"
  Options: "Text HELP for assistance", "Reply HELP for help", "Text HELP for more info"

- **Frequency Disclosure** (optional, default "Msg frequency varies"): "How do you disclose SMS message frequency?"
  Options: "Msg frequency varies", "Up to 4 msgs/month", "Approximately 2 msgs/week", Custom

Generated footer: `Msg frequency varies. Msg & data rates may apply. Text STOP to unsubscribe, HELP for help.`

---

## Question Set 14: Legal - Instagram (FTC)

- **Run sponsored posts or affiliate links?** (required, Yes/No): "Do you run sponsored Instagram posts or use affiliate links?"
  If No → Skip to Q15. If Yes → collect FTC disclosure fields:

- **Disclosure Hashtags** (select all that apply): "Which disclosure hashtags do you use?"
  Options: #ad (paid sponsorships), #sponsored (paid partnerships), #gifted (gifted products), #partner (brand partnerships), #affiliate (affiliate links), Other
  Guidance: FTC requires clear disclosure. Hashtags must appear "above the fold" (visible without clicking "more").

---

## Question Set 15: Accessibility Standards

- **WCAG Compliance** (required, Yes/No, default Yes): "Do you want to follow WCAG 2.1 AA accessibility standards?"
  If No → Confirm ("Following accessibility standards ensures your content is usable by everyone"), then skip remaining questions.

- **Color Contrast** (optional, default 4.5:1): "What minimum color contrast ratio should we use?"
  Options: 4.5:1 (WCAG AA, recommended), 3:1 (large text 24px+), 7:1 (WCAG AAA), Custom
  Guidance: Colors will be auto-validated against this ratio.

- **Alt Text** (optional, default Yes): "Should all images have alt text?"
  Guidance: Describe function, not just appearance. Example: "Hiker ascending rocky trail in alpine environment" (not just "Hiker")

- **Minimum Font Size** (optional, default "16px mobile, 18px desktop"): "What's the minimum font size for your content?"
  Options: 16px mobile/18px desktop (recommended), 18px all devices, Custom. Warn if < 16px.

- **Reading Level** (optional, default 8th grade): "What reading level should your content target?"
  Options: 8th grade (broadest audience), High school, College, Professional/Technical, Custom

---

## Question Set 16: Review & Confirmation (Phase 2 Complete)

After all Phase 2 questions answered:

```
"Great! I've collected all your brand information. Here's a summary:"

[Display structured summary of all answers]

Brand Foundation:
- Company: [name]
- Mission: [mission]
- Values: [values]

Brand Voice: [attributes]

Brand Tone:
- [Context]: [Tone]

Visual Identity:
- Colors: [list with hex codes]
- Typography: [fonts]
- Logo: [files or rules]
- Imagery: [style]

Messaging:
- Approved terms: [list]
- Prohibited terms: [list]
- Key messages: [list]

Legal:
- Email footer: [footer]
- SMS footer: [footer]
- Instagram: [disclosures]

Accessibility:
- WCAG: [level]
- Contrast: [ratio]
- Alt text: [required/optional]
- Min font: [size]

"Would you like to:
A. Proceed to generate brand-guidelines.md
B. Edit any section
C. Start over"
```

---

## Skip Logic & Optional Sections

### Always Required:
- Company name
- Brand mission
- Brand voice (2-4 attributes)
- At least 1 contextual tone
- Primary brand color
- CTA color
- Background color
- Heading font
- Body font
- At least 5 approved terms
- At least 3 prohibited terms

### Conditionally Required:
- Email legal (only if sending marketing emails)
- SMS legal (only if sending marketing SMS)
- Instagram legal (only if running sponsored posts)

### Optional (Can Skip):
- Secondary colors
- Logo files (can record rules without files)
- Special fonts
- Sustainability message
- Customer promise
- Brand tagline
- Privacy policy URL
- Imagery guidelines (but recommended)
- Accessibility preferences (but strongly recommended)

---

## Validation Rules

### Colors:
- Must be valid hex codes (#RRGGBB)
- CTA color must differ from primary color
- Background color should have 4.5:1 contrast with body text color
- CTA color should have 4.5:1 contrast with background

### Typography:
- Font names should be recognizable web fonts or have fallbacks
- Min font size should be >= 14px (warn if < 16px)
- Line height should be 1.3-2.0 (warn if outside range)

### Lists:
- Approved terms: Min 5, Max unlimited
- Prohibited terms: Min 3, Max unlimited
- Brand voice: Min 2, Max 4 attributes
- Core values: Min 3, Max 5

### Text Fields:
- Mission: Max 300 characters (1-2 sentences)
- Value proposition: Max 400 characters (1-2 sentences)
- Company name: Max 100 characters

---
