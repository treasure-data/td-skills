---
name: email
description: Generate email advertising concepts with compelling subject lines, body copy, CTAs, and HTML previews. Produces multiple creative variations optimized for inbox engagement and conversions.
---

# Email Ad Ideation

Generate compelling email advertising concepts with subject lines, body copy, CTAs, and HTML previews. Email offers the most creative freedom of all channels - use it to tell your full story.

## Integration with Multi-Channel Skill

This skill can be used **standalone** or **delegated from multi-channel-ad-ideation**.

**Standalone usage**: User directly invokes "Generate email ad concepts for..."

**Delegated usage**: Multi-channel skill invokes this skill after creative direction is selected:
- Multi-channel passes: Creative direction, brief, segment, brand guidelines
- This skill executes: Phase 1 (text concepts) and/or Phase 2 (HTML previews)
- User can iterate within this skill or return to multi-channel orchestrator

**When delegated**, expect this context:
- **Creative Direction**: Selected direction name and description
- **Creative Brief**: Messaging, goals, tone, benefits
- **Target Segment**: Audience demographics and motivations
- **Brand Guidelines**: Path to brand.md (optional)
- **Number of Concepts**: Usually 3-5

Use this context to inform all email concept generation and ensure alignment with the chosen creative direction.

## Using Brand Logo

When brand guidelines include a logo file, you can embed it in email HTML previews for brand consistency.

**How to provide logo**:
- Direct parameter: "Create email ads using logo at /path/to/logo.png"
- Via brand guidelines: "Create email ads using brand guidelines at /path/to/brand.md" (if guidelines include logo path)
- Multi-channel delegation: Logo path is automatically passed from multi-channel skill

**Logo embedding workflow**:
1. **User provides logo path** when requesting email concepts or during HTML preview phase
2. **Read logo file** using the Read tool when generating HTML preview (Phase 2)
3. **Convert to base64**: Encode logo as data URI: `data:image/png;base64,{encoded_string}`
4. **Embed in email header**: Include logo in HTML `<img>` tag with inline styling
5. **Logo appears** in all HTML previews automatically

**Logo specifications**:
- **Format**: PNG with transparent background preferred
- **Size**: Maximum 200px width for email headers, maintain aspect ratio
- **File size**: Keep under 100KB for email client compatibility
- **Placement**: Typically centered in email header with brand background color

**Example usage**:
```markdown
User: "Create email ad for hiking boot launch using brand guidelines and logo at /path/to/outdoor-supply-co-logo.png"

Phase 1: Generate text concepts (no logo needed yet)
Phase 2: When generating HTML preview:
  1. Read logo file
  2. Convert to base64
  3. Embed in header: <img src="data:image/png;base64,..." alt="Brand Logo" style="max-width: 180px;" />
```

For detailed logo implementation in HTML templates, see `references/html-preview-templates.md`.

###

 Dual Logo Variants (Automatic Selection)

For optimal logo visibility on different background colors, brand guidelines may specify two logo variants:
- **Dark logo** (e.g., black-over-white.png) for light backgrounds
- **Light logo** (e.g., white-over-black.png) for dark backgrounds

The skill automatically selects the appropriate variant based on header background color.

**How to provide dual logos**:
- **Via brand guidelines**: "Create email ads using brand guidelines at /path/to/brand.md"
  - Guidelines specify both logo file paths
  - Skill reads both and auto-selects based on background
- **Direct parameters**: "Create email ads using logo-dark at /path/dark.png and logo-light at /path/light.png"

**Automatic selection algorithm**:
```python
import base64

# Logo paths from brand guidelines
LOGO_DARK_PATH = "/path/to/logo-black-over-white.png"  # For light backgrounds
LOGO_LIGHT_PATH = "/path/to/logo-white-over-black.png"  # For dark backgrounds

# Header background color from brand guidelines
HEADER_BG_COLOR = "#1B3022"  # Old Growth (dark)

# Calculate luminance of background
def hex_to_rgb(hex_color):
    hex_color = hex_color.lstrip('#')
    return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))

def calculate_luminance(rgb):
    """WCAG relative luminance formula"""
    r, g, b = rgb
    return 0.299 * r + 0.587 * g + 0.114 * b

bg_rgb = hex_to_rgb(HEADER_BG_COLOR)
bg_luminance = calculate_luminance(bg_rgb)

# Select logo based on background brightness
if bg_luminance < 128:
    # Dark background - use light logo
    logo_path = LOGO_LIGHT_PATH
    print(f"Dark background detected (luminance: {bg_luminance:.1f}). Using light logo.")
else:
    # Light background - use dark logo
    logo_path = LOGO_DARK_PATH
    print(f"Light background detected (luminance: {bg_luminance:.1f}). Using dark logo.")

# Read and encode selected logo
with open(logo_path, "rb") as f:
    logo_base64 = base64.b64encode(f.read()).decode('utf-8')
```

**Example**:
- Old Growth header (#1B3022): luminance 38.5 → Dark → Use white-over-black.png
- Raw Canvas header (#F5F2ED): luminance 242.3 → Light → Use black-over-white.png

## Email Ad Best Practices

### The Email Advantage
- **Rich content format** - Most space to tell your story (150-300 words)
- **Visual flexibility** - Headers, images, buttons, layouts
- **Segmentation-friendly** - Easy to personalize and target
- **Trackable** - Opens, clicks, conversions all measurable

### Key Success Factors
1. **Subject line** - Drives opens (40-60 characters)
2. **Preview text** - Complements subject line (35-55 characters)
3. **Headline** - Reinforces value proposition
4. **Body copy** - Explains benefits, builds desire
5. **CTA** - Single, clear call-to-action
6. **Mobile-first** - 60%+ opens on mobile devices

## Output Format

### Phase 1: Text Concept Format (Initial Generation)

**Reference Files:**
- Card template structure: `../references/card-templates.md`
- HTML preview templates: `../references/html-preview-templates.md`
- Complete examples: [examples.md](examples.md)

Generate **3-5 email concepts** using **collapsed card format** from `../references/card-templates.md`:

**Format requirements - Collapsed Card Format**:
- All concepts start **collapsed** (user clicks to expand for details)
- Summary shows concept name (24px/800 font) + key message tagline
- **Do NOT include character counts** in output
- Output HTML directly (not wrapped in ```html fences) so it renders as visual cards

**Card Template Structure** (see `../references/card-templates.md` for complete markup):
- Use `<details>` element with enhanced summary styling
- Concept name: 24px/800 weight for visual hierarchy
- Quality badge in top-right (color-coded: green for excellent, amber for strong, blue for good)
- Ad copy section with: Subject Line, Preview Text, Headline, Body Copy, CTA Button
- Nested collapsible Visual Concept section with color swatches, layout, typography, imagery
- No character counts shown to user (validated internally)

### Phase 2: HTML Preview Format (After Confirmation)

**Required workflow**: Every time you generate HTML for email, write the HTML to a file and call `mcp__tdx-studio__open_file` to open the preview. Complete both the file writing and preview opening steps automatically.

**ONLY generate HTML previews AFTER user confirms text concepts** with phrases like:
- "These look good, show me the HTML"
- "Let's see the previews"
- "Generate HTML for these"

**HTML Generation and Preview Workflow** (complete all steps):
1. Read `../references/html-preview-templates.md`
2. Generate HTML email template with inline CSS and actual content from confirmed concepts
3. Use the Write tool to save HTML to file: `email-preview-{timestamp}.html` in working directory (use YYYYMMDD-HHMMSS format for timestamp)
4. Immediately call `mcp__tdx-studio__open_file` with the absolute file path to open preview in artifact panel
5. Display HTML code block (optional, for reference)

**Important workflow requirement**: After generating HTML for email, always complete steps 3 and 4 automatically. Write the HTML to a file and immediately open it with `mcp__tdx-studio__open_file`. This ensures the user sees the preview without needing to ask for it.

Example:
```markdown
### Concept: [Concept Name] - HTML Preview

[Generated HTML email template]
```

*Preview automatically opened in artifact panel via `mcp__tdx-studio__open_file`*

For complete Phase 1 and Phase 2 example workflows, see [examples.md](examples.md).

### When to Generate HTML

**Generate HTML when**: User confirms text concepts, says "show me the HTML", ready for visual mockups

**Do NOT generate HTML when**: First concept generation, still exploring, hasn't confirmed concepts, iterating on copy

## Subject Line Strategies

### 1. Curiosity-Driven
Creates intrigue without revealing everything.
- Example: "The secret to [benefit] is finally here"
- When to use: Brand awareness, new product launches

### 2. Urgency-Driven
Creates time pressure to drive immediate action.
- Example: "Last 6 hours: Your 40% discount expires tonight"
- When to use: Flash sales, limited offers, event registrations

### 3. Benefit-Driven
Directly states the value proposition.
- Example: "Save $500 on [product] this week"
- When to use: Promotions, feature announcements, upgrades

### 4. Personalization-Driven
Uses recipient data to increase relevance.
- Example: "{{first_name}}, your exclusive offer inside"
- When to use: B2B, account-based marketing, loyalty programs

### 5. Social Proof-Driven
Leverages credibility and FOMO.
- Example: "Join 50,000+ marketers using [product]"
- When to use: Trust-building, competitive positioning

## Body Copy Structure

### Opening (First 50 words)
- **Hook**: Reinforce the subject line promise
- **Relevance**: Show you understand their pain point
- **Value prop**: State the benefit clearly
- Example: "Running out of time to hit Q1 targets? 67% of sales teams struggle with pipeline visibility. That's why we built [product]."

### Middle (100-150 words)
- **Explain the solution**: How it works, key features
- **Benefits over features**: "So you can [outcome]" not "It has [feature]"
- **Social proof**: Testimonials, stats, logos
- Example: "[Product] gives you real-time pipeline visibility. See which deals are at risk, where reps spend time, and auto-updated forecasts. Result? Customers close 23% more deals. 'We went from chaos to clarity in 2 days.' - Sarah Chen, VP Sales"

### Closing (50 words)
- **Clear CTA**: One action, benefit-focused
- **Remove friction**: "No credit card required", "5-minute setup"
- **Create urgency** (if appropriate): Limited time, scarcity
- Example: "Start free trial today - no credit card. 5-minute setup. P.S. Offer ends Friday."

## CTA Button Best Practices

**Button Text**:
- Action-oriented verbs: "Get", "Start", "Claim", "Download"
- Benefit-focused: "Get My Free Trial" > "Submit"
- Short and specific: 2-5 words ideal

**Strong CTA Examples**: "Get Started Free", "Claim My 40% Off", "Download Now", "See Pricing", "Book Demo"

**Weak CTAs to Avoid**: "Click Here", "Submit", "Learn More" (too vague)

**Design Guidelines**: High contrast color, 44px+ tall for mobile, above the fold + at end, surrounded by whitespace

## Visual Layout Approaches

**Header Hero**: Colored header with headline + body copy + CTA. Best for product launches, announcements.

**Image-First**: Large hero image + headline + body + CTA. Best for visual products, e-commerce.

**Text-Heavy**: Small header + multiple copy sections + CTA. Best for B2B, thought leadership.

**Two-Column**: Header + image/copy side-by-side + CTA. Best for product comparisons.

For complete HTML preview templates with inline CSS, see `../references/html-preview-templates.md`.

## Quick Example

**Concept: SaaS Product Launch (Urgency-Driven)**

**Ad Copy:**
- **Subject Line**: 48 hours left: Lock in founder pricing
- **Preview Text**: Join 2,000+ teams who've already switched
- **Headline**: Your Last Chance to Save $3,600 on Pipeline Pro
- **Body Copy**: We're closing founder pricing in 48 hours - and we won't offer it again. After Friday at midnight, our annual plan jumps from $99/mo to $399/mo. That's $3,600 in savings you'll lose if you wait. What you get: Real-time pipeline visibility, AI-powered deal risk alerts, and automated forecasting. "We closed 23% more deals in Q1." - Sarah Chen, VP Sales at TechCorp
- **CTA Button**: Lock in Founder Pricing →

**Visual Concept:**
- **Layout**: Header hero with gradient (purple to violet)
- **Colors**: #667eea → #764ba2 (header gradient), #ff6b35 (CTA button)
- **Imagery**: Abstract tech pattern in header background
- **Typography**: Bold 32px headline, 16px body text, 18px CTA button

*For complete examples with full card markup and HTML previews, see [examples.md](examples.md).*

---

## Common Pitfalls to Avoid

**Subject lines over 60 characters** - Gets cut off on mobile
**Vague CTAs** - "Learn More" or "Click Here" don't drive action
**Multiple CTAs** - Confuses recipients, reduces conversion
**Image-only emails** - Breaks when images don't load
**Too much text** - Over 300 words loses attention
**No mobile optimization** - 60%+ opens are on mobile
**Missing unsubscribe link** - Violates CAN-SPAM, hurts deliverability

**Do this instead**: Test subject lines, use 1 clear CTA, optimize for mobile, keep under 300 words, always include unsubscribe
