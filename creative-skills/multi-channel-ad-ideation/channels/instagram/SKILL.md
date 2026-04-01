---
name: instagram
description: Generate Instagram image ad concepts with visual descriptions, copy constraints (125/40/30 chars), and HTML mockups. Visual-first, mobile-native single-image ads for Feed and Stories.
---

# Instagram Image Ad Ideation

Generate Instagram image ad concepts with vivid visual descriptions and HTML mockups. Instagram is visual-first: the image is the hero, copy supports it.

## Integration with Multi-Channel Skill

This skill can be used **standalone** or **delegated from multi-channel-ad-ideation**.

**Standalone usage**: User directly invokes "Generate Instagram ad concepts for..."

**Delegated usage**: Multi-channel skill invokes this skill after creative direction is selected:
- Multi-channel passes: Creative direction, brief, segment, brand guidelines
- This skill executes: Phase 1 (text concepts with image descriptions) and/or Phase 2 (HTML mockups)
- User can iterate within this skill or return to multi-channel orchestrator

**When delegated**, expect this context:
- **Creative Direction**: Selected direction name and description
- **Creative Brief**: Offer, visual style, brand tone
- **Target Segment**: Audience demographics and preferences
- **Brand Guidelines**: Path to brand.md (optional)
- **Image Specs**: Default 1080x1080px square
- **Number of Concepts**: Usually 3-5

Use this context to create visual-first concepts where image quality and mobile-native design align with the creative direction.

## Instagram Ad Best Practices

### The Instagram Advantage
- **Visual-first platform** - Image quality matters most
- **Mobile-native** - 100% mobile usage
- **High engagement** - Users actively browse and interact
- **Precise targeting** - Detailed audience options
- **Seamless shopping** - Direct product tags, checkout

### Key Success Factors
1. **Eye-catching image** - Stops the scroll
2. **Concise copy** - Primary text max 125 characters
3. **Clear CTA** - Instagram's preset button options
4. **Brand consistency** - Recognizable visual style
5. **Mobile-optimized** - Looks good on small screens

### Image-Only Constraint
**Image constraint**: Generate concepts for **single static images only**. No:
- Carousel ads (multiple images)
- Video ads
- Collection ads
- Stories-only formats requiring motion

## Output Format

### Phase 1: Text Concept Format (Initial Generation)

Generate **3-5 Instagram image ad concepts** using **table format** for easy side-by-side comparison:

**Format requirements - Table Format**:
- Use **markdown table** with 6 columns: **Concept | Primary Text | Headline | Description | CTA Button | Quality**
- Each concept takes **2 rows**: main concept row (all 6 cells filled) + image concept row (spans all 6 columns)
- Image concept row starts with "↳ **Image Concept (1080x1080px)**:" followed by inline details spanning the full width
- Image details format: `Colors: ..., Composition: ..., Focal Point: ..., Typography: ..., Style: ...`
- Add blank separator row (`|  |  |  |  |  |  |`) between concept pairs for visual spacing
- **Do NOT include character counts** - validated internally but not shown to user
- Allows horizontal comparison of all text elements across concepts

**Example Table Format**:

| Concept | Primary Text | Headline | Description | CTA Button | Quality |
|---------|--------------|----------|-------------|------------|---------|
| **Bold Visual Impact**<br>"Transform your morning routine with UltraFit Pro" | Transform your morning routine with UltraFit Pro. Premium sound, all-day comfort, seamless connectivity. Available now. | UltraFit Pro - Now Available | Premium wireless headphones | Shop Now | 31/35 |
| ↳ **Image Concept (1080x1080px)**: Colors: #667eea (Deep Purple) → #764ba2 (Violet), Composition: Product centered with rule of thirds, Focal Point: Headphones at 30-degree angle, Typography: "NEW" badge in top-right corner, Style: Clean, minimal, premium aesthetic ||||||
|  |  |  |  |  |  |
| **Lifestyle Focus**<br>"Your perfect workout companion" | Your perfect workout companion. Designed for athletes who demand more. Sweat-proof, secure fit, exceptional sound. Train harder. | Fitness-First Audio | Engineered for performance | Learn More | 29/35 💪 |
| ↳ **Image Concept (1080x1080px)**: Colors: #10b981 (Success Green) → #059669 (Dark Green), Composition: Action shot with dynamic movement, Focal Point: Athlete mid-workout wearing headphones, Typography: "BUILT TOUGH" text overlay, Style: Energetic, bold, athletic ||||||

**Key Benefits of Table Format**:
- Side-by-side comparison of primary text, headlines, descriptions
- All copy visible without clicking (Instagram has short fields that fit in columns)
- Image concept details organized in consistent inline format
- Quality scores easily compared across concepts
- Renders reliably in all markdown contexts
- Simple structure, no HTML compatibility issues
- Blank separator rows improve scannability between concepts

**Note**: The markdown table format above is the default. Always use standard markdown tables for Instagram concepts to enable easy horizontal comparison while ensuring reliable rendering.

### Phase 2: HTML Preview Format (After Confirmation)

**Required workflow**: Every time you generate HTML for Instagram, write the HTML to a file and call `mcp__tdx-studio__open_file` to open the preview. Complete both the file writing and preview opening steps automatically.

**ONLY generate HTML mockups AFTER user confirms text concepts** with phrases like:
- "These look good, show me the HTML"
- "Let's see the mockups"
- "Generate HTML previews"

**HTML Generation and Preview Workflow** (complete all steps):
1. Read `../references/html-preview-templates.md`
2. **Check for generated image** (auto-background enhancement):
   - Use Glob to find `instagram-ad-*.png` files in working directory
   - Sort by modification time (most recent first)
   - If found: Read PNG as binary and convert to base64 string
   - If not found: Use placeholder/emoji approach (current behavior)
3. Generate HTML mockup (square 1:1 ratio Instagram post with image concept and copy)
   - If base64 image available: Use `background-image:url(data:image/png;base64,{base64_string})` with `background-size:cover;background-position:center` in image area
   - If no image: Use `background:{color}` with emoji/text placeholder
4. Use the Write tool to save HTML to file: `instagram-preview-{timestamp}.html` in working directory (use YYYYMMDD-HHMMSS format for timestamp)
5. Immediately call `mcp__tdx-studio__open_file` with the absolute file path to open preview in artifact panel
6. Display HTML code block (optional, for reference)

**Important workflow requirement**: After generating HTML for Instagram, always complete steps 4 and 5 automatically. Write the HTML to a file and immediately open it with `mcp__tdx-studio__open_file`. This ensures the user sees the preview without needing to ask for it.

**Image Integration Note**: If you previously generated an image using the image-gen skill, this workflow will automatically detect the most recent `instagram-ad-*.png` file and use it as the background image in the HTML preview. This creates a more realistic preview with actual AI-generated visuals instead of placeholders.

Example:
```markdown
### Concept: [Concept Name] - HTML Preview

[Generated HTML mockup]
```

*Preview automatically opened in artifact panel via `mcp__tdx-studio__open_file`*

### When to Generate HTML Mockups

**Generate HTML when**:
- User explicitly confirms text concepts and image descriptions
- User says "show me the HTML" or "generate mockups"
- User is ready to see visual previews

**Do NOT generate HTML when**:
- This is the first concept generation
- User is still exploring creative directions
- User hasn't confirmed the text concepts and image descriptions yet
- User is iterating on copy or visual concepts

### Integration with Instagram Image Generation

This skill automatically integrates with the `image-gen` skill to create more realistic HTML previews.

**How it works**:
1. If you generate an actual Instagram ad image using the `image-gen` skill first
2. When you then generate HTML mockups with this skill, it will:
   - Auto-detect the most recent `instagram-ad-*.png` file in the working directory
   - Convert the PNG to base64 format
   - Embed it as the background image in the HTML preview
   - Result: HTML mockup shows the actual AI-generated image instead of placeholder

**Example workflow**:
```
User: "Generate an Instagram ad image for hiking boots"
[image-gen skill creates instagram-ad-20250316-143022.png]

User: "Now show me the HTML mockup"
[This skill detects the PNG, converts to base64, embeds in HTML]
Result: HTML preview displays with the actual generated hiking boots image as background
```

**Fallback**: If no `instagram-ad-*.png` file is found, the HTML mockup uses the standard placeholder/emoji approach.

## Copy Constraints

### Primary Text (125 characters max)
This is the caption text that appears below the image.

**Formula**: [Hook] + [Benefit/Value] + [CTA hint]

**Good examples**:
- "Your morning routine just got easier. Fresh coffee delivered to your door every week. ☕ Tap to subscribe." (118 chars)
- "Say goodbye to clutter. Our minimalist storage solutions fit any space. Link in bio to shop. 📦" (103 chars)
- "Limited drop: 50% off bestsellers for 24 hours only. Don't miss out! 🔥" (76 chars)

**Tips**:
- Front-load value (first 50 chars visible without "more")
- Use emojis strategically (saves words, adds visual interest)
- End with clear action ("Tap to shop", "Link in bio")

### Headline (40 characters max)
Appears in feed and can show in some placements.

**Good examples**:
- "Save 50% Today Only" (20 chars)
- "Your New Favorite Coffee" (25 chars)
- "Transform Your Morning Routine" (31 chars)

**Tips**:
- Benefit or offer-focused
- Complements image, doesn't repeat it
- Action or outcome-oriented

### Description (30 characters max)
Optional additional context, often hidden.

**Good examples**:
- "Free shipping on all orders" (28 chars)
- "No code needed - auto applied" (30 chars)
- "Limited time - ends tonight" (28 chars)

**When to use**: Additional offer details, shipping info, time limits

## CTA Button Options

Instagram provides preset CTA buttons. Choose the most appropriate:

**E-Commerce**:
- **Shop Now** - Product sales, online store
- **Buy Now** - Direct purchase (impulse buy)
- **Order Now** - Food delivery, services

**Lead Generation**:
- **Sign Up** - Newsletter, account creation
- **Subscribe** - Recurring service, content
- **Download** - App, ebook, guide

**Engagement**:
- **Learn More** - Blog post, product details, info
- **Get Quote** - B2B services, custom pricing
- **Contact Us** - Service businesses, consultations

**App-Focused**:
- **Install Now** - Mobile app download
- **Use App** - Existing app users
- **Play Game** - Gaming apps

**Event/Booking**:
- **Book Now** - Appointments, reservations, events
- **Get Tickets** - Concerts, webinars, conferences

**Avoid**: Vague CTAs like "Learn More" when "Shop Now" is more specific

## Image Concept Development

### Composition Approaches

**1. Rule of Thirds**
Focal point at intersection of 1/3 grid lines.
**Best for**: Product photography, lifestyle shots
**Example**: Product in left third, empty space right third with text overlay

**2. Centered & Symmetrical**
Subject perfectly centered, balanced composition.
**Best for**: Minimalist aesthetic, bold statements, symmetry
**Example**: Coffee cup centered, clean background, text below

**3. Full-Bleed Product**
Product fills entire frame, no empty space.
**Best for**: E-commerce, fashion, food
**Example**: Close-up of product with vibrant colors edge-to-edge

**4. Text-Dominant**
Large text overlay, image as background.
**Best for**: Announcements, quotes, bold statements
**Example**: "50% OFF" huge text, subtle background pattern

**5. Lifestyle Context**
Product in real-world setting with person/environment.
**Best for**: Demonstrating use case, aspirational lifestyle
**Example**: Person using product in beautiful setting

### Color Palette Guidance

**High-Contrast** (stands out in feed):
- Black text on bright yellow (#FFD700)
- White text on deep purple (#6A0DAD)
- Bold red (#E63946) on white background

**Brand-Consistent**:
- Use brand's primary + secondary colors
- Ensure colors work on mobile screens
- Test contrast for text readability

**Emotional Tone**:
- **Urgency**: Red, orange, bright yellow
- **Trust**: Blue, navy, teal
- **Luxury**: Black, gold, deep purple
- **Fresh/Natural**: Green, earth tones, white
- **Playful**: Bright multi-color, pastels

### Typography on Images

**When to use on-image text**:
- Announce offers ("50% OFF", "NEW ARRIVAL")
- Reinforce brand message ("Handmade with Love")
- Create urgency ("Ends Tonight")

**Typography best practices**:
- **Font size**: Large enough to read on mobile (48px+ for headlines)
- **Contrast**: Text must stand out from background
- **Simplicity**: Max 5-10 words on image
- **Font style**: Bold, sans-serif works best (Helvetica, Futura, Montserrat)
- **Placement**: Don't cover focal point, leave breathing room

### Brand Elements Integration

**Logo placement**:
- Top-left or bottom-right corner
- Small and subtle (doesn't compete with focal point)
- White or black version for contrast

**Brand colors**:
- Use consistently across campaigns
- Apply to text overlays, backgrounds, accents

**Visual identity**:
- Consistent filter/editing style
- Repeatable composition approach
- Recognizable aesthetic

## Visual Styles

### 1. Clean & Minimal
- White or light backgrounds
- Lots of negative space
- Single focal point
- Simple sans-serif fonts
**Best for**: Premium products, tech, modern brands

### 2. Bold & Vibrant
- Bright, saturated colors
- High contrast
- Energetic composition
- Eye-catching patterns
**Best for**: Youth brands, fashion, entertainment

### 3. Lifestyle & Aspirational
- Real people in beautiful settings
- Natural lighting
- Emotional connection
- Storytelling composition
**Best for**: Travel, wellness, luxury goods

### 4. Flat Lay & Product Grid
- Overhead shot, organized layout
- Multiple products arranged aesthetically
- Symmetry and balance
- Curated feel
**Best for**: E-commerce, beauty, food

### 5. Text-Heavy Announcement
- Large typography dominates
- Minimal imagery (texture/pattern background)
- High contrast colors
- Clear message hierarchy
**Best for**: Sales, announcements, events

## Image Specifications

**Feed Image (Square)**:
- **Dimensions**: 1080 x 1080 pixels (1:1 ratio)
- **File type**: JPG or PNG
- **Max file size**: 30MB (but aim for <1MB for fast loading)

**Feed Image (Portrait)**:
- **Dimensions**: 1080 x 1350 pixels (4:5 ratio)
- **Use when**: Vertical product shots, full-body fashion, want more screen space

**Stories (optional, but same creative)**:
- **Dimensions**: 1080 x 1920 pixels (9:16 ratio)
- Can adapt square concept to vertical format

**Recommendation**: Default to **1080x1080px square** unless portrait makes sense for the product.

## HTML Preview Template

For complete HTML preview templates, reference `../references/html-preview-templates.md`.

**Basic Instagram mockup structure**:

```html
<div style="max-width:375px;margin:0 auto;font-family:-apple-system,BlinkMacSystemFont,sans-serif;">
  <div style="background:#fff;border:1px solid #dbdbdb;border-radius:3px;">
    <!-- Instagram header -->
    <div style="padding:14px;display:flex;align-items:center;border-bottom:1px solid #efefef;">
      <div style="width:32px;height:32px;border-radius:50%;background:#ddd;margin-right:12px;"></div>
      <strong style="font-size:14px;color:#262626;">brand_name</strong>
    </div>

    <!-- Image (1:1 ratio) -->
    <div style="position:relative;width:100%;padding-bottom:100%;background:{{image_bg}};overflow:hidden;">
      <div style="position:absolute;top:0;left:0;right:0;bottom:0;display:flex;align-items:center;justify-content:center;padding:40px;text-align:center;">
        {{image_content}}
      </div>
    </div>

    <!-- Caption -->
    <div style="padding:12px 16px;">
      <p style="font-size:14px;line-height:18px;color:#262626;margin:0;">
        <strong>brand_name</strong> {{primary_text}}
      </p>
    </div>

    <!-- CTA button -->
    <div style="padding:0 16px 16px 16px;">
      <button style="width:100%;background:#0095f6;color:#fff;border:none;border-radius:8px;padding:9px;font-size:14px;font-weight:600;cursor:pointer;">
        {{cta_button}}
      </button>
    </div>
  </div>
</div>
```

## Example Instagram Image Ad Concepts

**Format reminder**: Always use the markdown table format shown in "Phase 1: Text Concept Format" above. Here's an example:

| Concept | Primary Text | Headline | Description | CTA Button | Quality |
|---------|--------------|----------|-------------|------------|---------|
| **Product Hero - Minimal**<br>"Introducing the UltraFit Pro" | Introducing the UltraFit Pro. Wireless. Waterproof. 48-hour battery. Your new workout essential. 🎧 | Meet UltraFit Pro Headphones | Free shipping + 30-day returns | Shop Now | 34/35 |
| ↳ **Image Concept (1080x1080px)**: Colors: #FFFFFF (Clean White) → #1a1a1a (Matte Black) → #0095f6 (Vibrant Blue accent), Composition: Centered product shot with rule of thirds, Focal Point: Sleek black headphones at 30° angle, Typography: "NEW" badge top-right (Helvetica Bold, blue), Style: Clean, minimal, premium tech aesthetic ||||||

## Common Pitfalls to Avoid

**Busy images** - Too many elements compete for attention
**Unreadable text** - Low contrast or too small on mobile
**Generic stock photos** - Looks inauthentic, doesn't stand out
**Exceeding character limits** - Copy gets cut off
**No clear focal point** - Eye doesn't know where to look
**Brand elements too large** - Logo shouldn't dominate
**Ignoring mobile preview** - Looks great on desktop, tiny on phone

**Do this instead**: Single clear focal point, high contrast text, authentic imagery, respect 125/40/30 limits, test on mobile, subtle branding, mobile-first design

---

**Tip**: Instagram ads work best when they don't look like ads. Aim for content that fits naturally in users' feeds while clearly communicating your offer.
