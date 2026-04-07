# Brand Compliance Violations & Fixes

Common brand guideline violations with before/after examples and fix recommendations. Uses Acme Corp brand guidelines as reference.

**Reference**: For complete brand specifications including color usage context, semantic meanings, typography, and lexicon, see [`acme-corp-brand-guidelines.md`](../examples/acme-corp-brand-guidelines.md).

---

## Common Visual Violations

### Violation 1: Wrong Brand Colors

**Issue**: Using colors outside the approved brand palette

**Example (Acme Corp)**:
- ❌ **Before**: Red CTA button `#FF0000`
- ✅ **After**: Burnt Ochre CTA button `#B35D33` (approved brand color)

**How to Fix**:
1. Review brand color palette (Old Growth #1B3022, Burnt Ochre #B35D33, Raw Canvas #F5F2ED, Granite #4A4E51, Lichen #9CAF88)
2. Replace all non-brand colors with closest approved alternative
3. Verify hex codes match exactly (not approximate shades)

**Common Wrong Colors**:
- Bright red (#FF0000) → Use Burnt Ochre (#B35D33) for CTAs
- Pure white (#FFFFFF) → Use Raw Canvas (#F5F2ED) for backgrounds
- Neon green (#00FF00) → Use Lichen (#9CAF88) for sustainability highlights

---

### Violation 2: Wrong Color Context Usage

**Issue**: Using the correct brand color in the wrong context

Even when using approved brand colors, each color has specific usage rules. Using a color outside its designated context violates brand guidelines.

**Example (Acme Corp)**:
- ❌ **Before**: Burnt Ochre (#B35D33) used for email background
- ✅ **After**: Raw Canvas (#F5F2ED) for background, Burnt Ochre (#B35D33) reserved for CTA button only

**Color Usage Rules** (see [`acme-corp-brand-guidelines.md`](../examples/acme-corp-brand-guidelines.md) for complete specifications):

**Old Growth (#1B3022)**:
- ✅ **Correct usage**: Primary logo, dark backgrounds (headers/footers)
- ❌ **Incorrect usage**: CTA buttons, body text, decorative accents

**Granite (#4A4E51)**:
- ✅ **Correct usage**: Secondary text, UI elements (borders, icons)
- ❌ **Incorrect usage**: Primary backgrounds, CTAs, logo backgrounds

**Raw Canvas (#F5F2ED)**:
- ✅ **Correct usage**: Primary background for emails and web pages
- ❌ **Incorrect usage**: Text color (insufficient contrast against white)

**Burnt Ochre (#B35D33)**:
- ✅ **Correct usage**: Call-to-action buttons ONLY ("Shop Now", "Learn More")
- ❌ **Incorrect usage**: Backgrounds, body text, decorative elements, non-CTA contexts
- **Critical**: This color is reserved exclusively for CTAs to maintain visual hierarchy

**Lichen (#9CAF88)**:
- ✅ **Correct usage**: Sustainability badges, eco-certifications, recycled material callouts
- ❌ **Incorrect usage**: General accents, non-sustainability contexts, CTAs

**How to Fix**:
1. Review color usage context in [`acme-corp-brand-guidelines.md`](../examples/acme-corp-brand-guidelines.md)
2. Verify each color is used only in its designated context
3. Replace contextually incorrect colors with appropriate alternatives
4. Maintain semantic meaning (e.g., Burnt Ochre = action/CTA, Lichen = sustainability)

**Before/After Examples**:

**Email Background**:
- ❌ Burnt Ochre (#B35D33) background → Violates "CTA only" rule
- ✅ Raw Canvas (#F5F2ED) background → Correct usage per guidelines

**Secondary Heading Text**:
- ❌ Burnt Ochre (#B35D33) text → Reserved for CTAs, not text
- ✅ Granite (#4A4E51) text → Correct usage for secondary text

**Sustainability Badge**:
- ❌ Burnt Ochre (#B35D33) badge → Not sustainability context
- ✅ Lichen (#9CAF88) badge → Correct usage for sustainability callouts

---

### Violation 3: Wrong Typography

**Issue**: Using fonts not in brand guidelines

**Example (Acme Corp)**:
- ❌ **Before**: Arial or Helvetica for body text
- ✅ **After**: Roboto for body text

**Example Headlines**:
- ❌ **Before**: Times New Roman or Serif fonts for headings
- ✅ **After**: Montserrat Bold/All-Caps for headings

**How to Fix**:
1. Replace all fonts with approved brand fonts:
   - Headings: Montserrat (Bold/All-Caps)
   - Body text: Roboto
   - Field notes/Pro-tips: Courier Prime
2. Verify font weights match guidelines
3. Check font-family declarations in CSS

**Font Stack Example**:
```css
/* Correct */
font-family: 'Roboto', sans-serif;
font-family: 'Montserrat', sans-serif;

/* Wrong */
font-family: Arial, Helvetica, sans-serif;
font-family: 'Comic Sans MS', cursive;
```

---

### Violation 4: Logo Misuse

**Issue**: Incorrect logo sizing, placement, or background colors

**Example (Acme Corp)**:
- ❌ **Before**: Logo on bright red background (not approved)
- ✅ **After**: Logo on Old Growth (#1B3022) or Raw Canvas (#F5F2ED) background

**Logo Violations**:
- Too small (hard to read)
- Distorted aspect ratio (stretched/squashed)
- Low resolution (pixelated)
- Wrong background color (not Old Growth or Raw Canvas)
- Insufficient clear space around logo

**How to Fix**:
1. Use minimum logo size specified in guidelines
2. Maintain original aspect ratio (don't stretch)
3. Use high-resolution PNG or SVG files
4. Place logo on approved background colors only
5. Ensure adequate clear space (typically logo height as spacing)

---

### Violation 5: Imagery Style Mismatch

**Issue**: Images don't match brand aesthetic guidelines

**Example (Acme Corp)**:
- ❌ **Before**: Studio-perfect model, heavy Instagram filters, no gear visible in use
- ✅ **After**: Authentic hiker with muddy boots, natural lighting, functional gear in action

**Imagery Violations**:
- Studio-perfect models (too polished) → Show real use, sweat, mud
- Heavy filters or over-saturation → Natural, directional lighting
- Stock photos with generic scenes → Authentic brand-specific imagery
- Leave No Trace violations (camping too close to water) → Ethical outdoor practices

**How to Fix**:
1. Review imagery guidelines (Authenticity, Ethics, Lighting)
2. Replace stock photos with authentic brand imagery
3. Remove heavy filters, use natural lighting
4. Ensure images align with brand values (e.g., environmental responsibility)

---

## Common Messaging Violations

### Violation 6: Prohibited Terminology

**Issue**: Using words/phrases explicitly banned in brand lexicon

**Example (Acme Corp)**:
- ❌ **Before**: "These eco-friendly boots are insane! Epic green gear for nature lovers."
- ✅ **After**: "Engineered with circular materials and PFC-free coating. Durable gear to preserve the backcountry."

**Prohibited Terms (Acme Corp)**:
- "Eco-friendly" → Use "circular", "PFC-free", "traceable"
- "Green" → Use "sustainable", "circular", specific material names
- "Insane", "Epic", "Life-changing" → Use factual descriptors: "durable", "engineered", "reliable"
- "Lit", "Bestie", "FOMO" → Use professional outdoor language

**How to Fix**:
1. Identify all prohibited terms in content
2. Replace with approved alternatives from brand lexicon
3. Verify replacement terms maintain the intended meaning
4. Run final check against prohibited terms list

**Replacement Guide**:
| Prohibited | Approved Alternatives |
|------------|----------------------|
| Eco-friendly | Circular, PFC-free, Recycled, Traceable |
| Green | Sustainable, Low-impact, Certified |
| Epic / Insane / Life-changing | Durable, Engineered, Reliable, Proven |
| Nature | Backcountry, Alpine, Summit, Wilderness |

---

### Violation 7: Wrong Tone for Context

**Issue**: Using inappropriate tone for the channel/context

**Example (Acme Corp)**:
- ❌ **Before** (Product Specs): "What's your sunrise ritual with these boots? 🌄"
- ✅ **After** (Product Specs): "Engineered with bluesign® nylon and Vibram® outsole. 400g insulation rated to -20°F."

**Context-Specific Tones**:
- **Product Specs**: Precise & Functional (not inspirational)
- **Social Media**: Inspirational (not technical specs)
- **Sustainability**: Transparent (not greenwashing)
- **Support**: Solution-Oriented (not dismissive)
- **Safety Guides**: Authoritative (not casual)

**How to Fix**:
1. Identify content context (product specs, social, sustainability, etc.)
2. Match tone to context guidelines
3. Rewrite content using appropriate tone vocabulary
4. Verify tone consistency throughout piece

**Before/After by Context**:

**Product Specs**:
- ❌ "Feel the mountain calling? These boots answer! 🏔️"
- ✅ "Gore-Tex waterproof membrane. Vibram MegaGrip outsole. 1.2kg per pair."

**Social Media**:
- ❌ "Boots: 400g Primaloft insulation, -20°F rating, 2.1mm leather upper."
- ✅ "What's your sunrise ritual? Share your morning summit moments. 📸"

---

### Violation 8: Hyperbole and Exaggeration

**Issue**: Making exaggerated claims not supported by facts

**Example (Acme Corp)**:
- ❌ **Before**: "Life-changing boots that will transform your hiking forever!"
- ✅ **After**: "Durable construction designed to withstand 500+ miles of backcountry use."

**Hyperbolic Violations**:
- "Best in the world" → "Rated 4.8/5 by 2,000+ verified hikers"
- "Revolutionary" → "Updated design with 30% lighter weight"
- "Game-changer" → "Proven performance in alpine conditions"
- "Miracle" → "Engineered solution for wet-weather traction"

**How to Fix**:
1. Replace superlatives with specific, measurable facts
2. Cite data sources (reviews, testing, certifications)
3. Use technical specifications instead of emotional language
4. Maintain knowledgeable and respectful tone

---

## Common Legal Violations

### Violation 9: Missing CAN-SPAM Footer (Email)

**Issue**: Email lacks required unsubscribe link and physical address

**Example**:
- ❌ **Before**: No footer or incomplete footer
- ✅ **After**:
```
You're receiving this email because you subscribed to Acme Corp updates.

Unsubscribe | Update Preferences

Acme Corp
123 Trailhead Drive, Boulder, CO 80302
```

**CAN-SPAM Requirements**:
- Unsubscribe link (must work for 30 days after send)
- Physical mailing address
- Clear identification as advertisement (if promotional)
- Accurate "From" name and email address

**How to Fix**:
1. Add unsubscribe link in footer
2. Include complete physical address
3. Ensure unsubscribe mechanism functions
4. Test footer on mobile devices

---

### Violation 10: Missing TCPA Opt-Out (SMS)

**Issue**: SMS lacks required opt-out instructions

**Example**:
- ❌ **Before**: "New boots launching Friday! Check them out: [link]"
- ✅ **After**: "New boots launching Friday! Check them out: [link] | Msg&data rates apply. Text STOP to unsubscribe."

**TCPA Requirements**:
- Opt-out instructions ("Text STOP to unsubscribe")
- Frequency disclosure ("Expect 4 msgs/month")
- Data rate notice ("Msg&data rates may apply")

**How to Fix**:
1. Add "Text STOP to unsubscribe" to every SMS
2. Include frequency if known ("Approx 2 msgs/week")
3. Add "Msg&data rates may apply"
4. Keep within character limits (160 for single SMS)

---

### Violation 11: Unsubstantiated Claims

**Issue**: Making claims without evidence or certification

**Example (Acme Corp)**:
- ❌ **Before**: "100% sustainable boots made from entirely green materials"
- ✅ **After**: "70% recycled materials (bluesign® certified nylon). Working toward 100% circular design."

**Common Unsubstantiated Claims**:
- "Carbon neutral" → Requires third-party certification
- "100% sustainable" → Be transparent: "70% recycled; working on the rest"
- "Eco-friendly" → Use specific terms: "PFC-free", "Traceable supply chain"

**How to Fix**:
1. Verify all sustainability claims with data/certifications
2. Be transparent about limitations ("working toward" vs. "achieved")
3. Use specific, measurable language
4. Cite certifications (bluesign®, Fair Trade, etc.)

---

## Common Accessibility Violations

### Violation 12: Insufficient Color Contrast

**Issue**: Text doesn't meet WCAG 2.1 AA contrast ratio (4.5:1 minimum)

**Example**:
- ❌ **Before**: Light gray text (#CCCCCC) on white background (#FFFFFF) = 1.6:1 contrast ❌
- ✅ **After**: Granite text (#4A4E51) on Raw Canvas background (#F5F2ED) = 9.2:1 contrast ✅

**Contrast Violations**:
- Light text on light backgrounds
- Low-contrast CTAs
- Subtle hover states
- Disabled button states that are unreadable

**How to Fix**:
1. Use contrast checker tool (WebAIM, browser DevTools)
2. Ensure all text meets 4.5:1 minimum (normal text) or 3:1 (large text 18px+)
3. Test with grayscale to verify readability
4. Use brand colors that meet contrast requirements:
   - Old Growth (#1B3022) on Raw Canvas (#F5F2ED): 12.1:1 ✅
   - Burnt Ochre (#B35D33) on white: 4.7:1 ✅

**Contrast Checker**: [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)

---

### Violation 13: Missing Alt Text

**Issue**: Images lack descriptive alt attributes

**Example**:
- ❌ **Before**: `<img src="boots.jpg">` (no alt)
- ✅ **After**: `<img src="boots.jpg" alt="Hiker wearing waterproof boots traversing rocky alpine trail">`

**Alt Text Violations**:
- No alt attribute at all
- Empty alt (`alt=""`) for content images
- Generic alt ("image", "photo", "boots")
- Alt text too long (>150 chars)

**How to Fix**:
1. Add descriptive alt text to all content images
2. Describe what's happening, not just what's visible: "Hiker crossing stream in waterproof boots" not just "boots"
3. Include context relevant to message
4. Use empty alt (`alt=""`) only for purely decorative images
5. Keep alt text under 150 characters

**Alt Text Formula**:
- Who/what + action + context = "Hiker wearing insulated boots summiting snowy peak at sunrise"

---

### Violation 14: Small Font Sizes on Mobile

**Issue**: Text below 16px on mobile devices

**Example**:
- ❌ **Before**: 12px body text on mobile
- ✅ **After**: 16px body text on mobile

**Font Size Violations**:
- Body text < 16px on mobile
- CTA text < 14px
- Legal text < 11px (still readable but limit usage)

**How to Fix**:
1. Set base font size to 16px minimum for mobile
2. Use responsive typography (scales up on larger screens)
3. Test on actual mobile devices
4. Verify readability without zooming

**CSS Example**:
```css
/* Mobile-first approach */
body {
  font-size: 16px; /* Minimum 16px on mobile */
  line-height: 1.5;
}

@media (min-width: 768px) {
  body {
    font-size: 18px; /* Larger on desktop */
  }
}
```

---

## Channel-Specific Violations

### Violation 15: Email Subject Line Too Long

**Issue**: Subject line exceeds 60 characters (gets cut off on mobile)

**Example**:
- ❌ **Before** (85 chars): "Acme Corp Presents the Brand New Waterproof Hiking Boots Collection - Limited Time Only!"
- ✅ **After** (48 chars): "New Waterproof Boots - 30% Off This Weekend"

**Email Violations**:
- Subject > 60 chars (mobile truncation)
- Preview text missing or > 55 chars
- No clear CTA
- Not mobile-responsive
- Multiple CTAs (confuses reader)

**How to Fix**:
1. Keep subject line 40-60 characters
2. Add preview text 35-55 characters
3. Test on mobile email clients
4. Use single, clear CTA
5. Ensure mobile-responsive HTML

---

### Violation 16: SMS Over Character Limit

**Issue**: SMS exceeds 160 characters without multi-part indicator

**Example**:
- ❌ **Before** (175 chars): "Acme Corp is excited to announce our new waterproof hiking boots are now available! Check out the latest collection with 30% off this weekend only. Visit our website now!"
- ✅ **After** (148 chars): "New waterproof boots—30% off this weekend! Shop now: [short-link] Msg&data rates apply. Text STOP to unsub. -Acme Corp"

**SMS Violations**:
- Single SMS > 160 characters (splits unexpectedly)
- Missing opt-out instructions
- Long URLs (use URL shorteners)
- HTML formatting attempted
- Excessive emojis or special characters

**How to Fix**:
1. Keep to 160 chars for single SMS or clearly indicate multi-part
2. Use URL shorteners for links
3. Add opt-out: "Text STOP to unsubscribe"
4. Plain text only (no HTML, no rich formatting)
5. Test on multiple carriers

**Character Budget**:
- Core message: ~100 chars
- Short URL: ~20 chars
- Opt-out: ~30 chars ("Text STOP to unsub")
- Buffer: ~10 chars
- **Total**: 160 chars

---

### Violation 17: Instagram Character Limits Exceeded

**Issue**: Text exceeds Instagram ad specifications

**Example**:
- ❌ **Before**: Primary text 180 characters (gets cut off at 125)
- ✅ **After**: Primary text 120 characters (fits within limit)

**Instagram Violations**:
- Primary text > 125 chars (truncated)
- Headline > 40 chars
- Description > 30 chars
- Non-approved CTA button
- Wrong image aspect ratio

**How to Fix**:
1. Primary text: ≤125 characters
2. Headline: ≤40 characters
3. Description: ≤30 characters
4. Use approved CTA buttons (Shop Now, Learn More, Sign Up, etc.)
5. Image specs: 1080x1080px (square) or 1080x1350px (portrait)

**Character Counts**:
```
Primary: "Traverse alpine trails with confidence. Waterproof boots engineered for backcountry adventures. 30% off this weekend." (120 chars) ✅

Headline: "Waterproof Hiking Boots - 30% Off" (35 chars) ✅

Description: "Engineered for the backcountry" (29 chars) ✅
```

---

## Before/After Complete Examples

### Example 1: Product Launch Email (Acme Corp)

**❌ BEFORE (Non-Compliant - 18/40)**

```
Subject: OMG New Boots Are Here!!! 🔥🔥🔥 (Too casual, emojis, 38 chars)

[Email body in Arial font on pure white background]

Hey there! 😊

Check out our INSANE new eco-friendly boots! They're literally life-changing and will make you the coolest hiker ever! These green boots are made with natural materials and are totally sustainable.

Buy now! [Red CTA button #FF0000]

[No footer, no unsubscribe, no address]
```

**Violations**:
- Visual: Arial font (not Roboto), pure white background (not Raw Canvas), red CTA (not Burnt Ochre)
- Tone: Too casual for product specs ("OMG", emojis, "Hey there!")
- Messaging: Prohibited terms ("insane", "eco-friendly", "green", "life-changing", "coolest")
- Legal: No unsubscribe link, no physical address
- Channel: Subject too short (38 chars), no preview text
- Brand Identity: No logo, no brand signature

**✅ AFTER (Fully Compliant - 39/40)**

```
Subject: New Waterproof Boots—Engineered for Alpine Trails (52 chars)
Preview: Circular materials. PFC-free coating. 30% off. (50 chars)

[Email in Roboto font on Raw Canvas #F5F2ED background, Montserrat headings]

[Logo on Old Growth #1B3022 header]

NEW: ALPINE TREK WATERPROOF BOOTS

Engineered with bluesign®-certified nylon and PFC-free DWR coating. 400g Primaloft insulation rated to -20°F. Vibram® MegaGrip outsole for backcountry traction.

Features:
• 70% recycled materials (working toward 100% circular design)
• Traceable supply chain from factory to trailhead
• Designed to endure 500+ miles of alpine terrain

[Burnt Ochre CTA button #B35D33]
Shop Alpine Trek Boots

Gear up. Get out. Leave it better.

---
You're receiving this because you subscribed to Acme Corp updates.
Unsubscribe | Update Preferences

Acme Corp
123 Trailhead Drive, Boulder, CO 80302
```

**Fixes Applied**:
- Visual: Roboto font, Raw Canvas background, Burnt Ochre CTA, logo added
- Tone: Knowledgeable and precise (product specs context)
- Messaging: Approved terms (circular, PFC-free, traceable, endure, backcountry)
- Legal: Unsubscribe link and physical address added
- Channel: Subject 52 chars, preview text 50 chars
- Brand Identity: Logo, brand colors, signature "Gear up. Get out. Leave it better."

---

### Example 2: Instagram Ad (Acme Corp)

**❌ BEFORE (Partially Compliant - 26/40)**

```
Primary Text (180 chars): "OMG you guys! Our new eco-friendly hiking boots are literally insane! They're super green and made with natural materials. This is epic gear that will change your life! Buy now before they're gone! 🔥🌿" (Too long, prohibited terms)

Headline (55 chars): "The Most Amazing Eco-Friendly Boots You'll Ever Own!" (Too long, prohibited terms)

Description (45 chars): "Super green boots for nature lovers everywhere" (Too long, prohibited term)

CTA: Custom URL (not approved button)

Image: Studio photo with heavy filter, model in pristine condition
```

**✅ AFTER (Fully Compliant - 38/40)**

```
Primary Text (118 chars): "Traverse alpine trails with confidence. Engineered with circular materials and PFC-free coating. Built to endure backcountry adventures."

Headline (33 chars): "Alpine Trek Waterproof Boots"

Description (28 chars): "Circular. Traceable. Durable."

CTA: Shop Now (approved button)

Image: Authentic hiker crossing rocky stream, natural lighting, muddy boots in action, no heavy filters
```

**Fixes Applied**:
- Primary text: 118 chars (within 125 limit), approved terms
- Headline: 33 chars (within 40 limit), descriptive
- Description: 28 chars (within 30 limit), power words
- CTA: Approved "Shop Now" button
- Image: Authentic, natural lighting, functional gear in use

---

## Severity Levels

**Critical** (Must fix before launch):
- Legal violations (missing CAN-SPAM footer, no TCPA opt-out)
- Accessibility failures (contrast < 3:1, no alt text on key images)
- Brand color completely wrong (red instead of brand colors)

**High** (Fix strongly recommended):
- Prohibited terminology (eco-friendly, green, insane, epic)
- Wrong fonts (Arial instead of Roboto)
- Wrong contextual tone (inspirational for product specs)
- Channel limit violations (SMS > 160 chars, Instagram > 125 chars)

**Medium** (Fix if time allows):
- Missing brand signature
- Slight color shade difference (close but not exact hex)
- Font weight mismatch (Regular instead of Bold)
- Missing brand elements (logo, tagline)

**Low** (Optional refinements):
- Adding more approved power words
- Enhancing brand presence
- Additional imagery authenticity

---

## Summary

Common violations fall into these categories:
1. **Visual**: Wrong colors, fonts, logo misuse, imagery mismatch
2. **Messaging**: Prohibited terms, wrong tone, hyperbole
3. **Legal**: Missing disclaimers, unsubstantiated claims, regulatory violations
4. **Accessibility**: Low contrast, missing alt text, small fonts
5. **Channel-Specific**: Character limits, format requirements, platform constraints

**Prevention Checklist**:
- ✅ Review brand guidelines before creating content
- ✅ Use approved color palette (exact hex codes)
- ✅ Use approved fonts (Montserrat, Roboto, Courier Prime)
- ✅ Check lexicon for prohibited terms
- ✅ Match tone to context (product specs, social, sustainability, etc.)
- ✅ Include all legal requirements (footer, opt-out, disclaimers)
- ✅ Verify WCAG AA accessibility (4.5:1 contrast, alt text, 16px+ fonts)
- ✅ Test character limits for channel (email subject, SMS, Instagram)
- ✅ Include brand signature and identity elements

Use this guide to identify and fix violations before launching creative content.
