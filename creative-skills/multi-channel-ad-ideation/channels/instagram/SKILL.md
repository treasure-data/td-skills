---
name: instagram
description: Generate Instagram ad concepts with visual descriptions, copy constraints, and HTML mockups. Supports Image and Carousel formats across Feed, Stories, Reels, Explore, and Explore Home placements. Use when creating Instagram image or carousel ads, generating Feed/Stories/Reels mockups, or adapting ad copy to placement-specific constraints.
---

# Instagram Ad Ideation

Generate Instagram ad concepts with vivid visual descriptions and HTML mockups. Supports Image and Carousel formats across multiple placements (Feed, Stories, Reels, Explore, Explore Home). Instagram is visual-first: the image is the hero, copy supports it.

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
- **Number of Concepts**: Usually 3-5

Placement and format (Image vs Carousel) are determined after Phase 1 text concepts are confirmed, via the Placement & Format Selection checkpoint.

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

### Supported Formats
- **Image ads**: Single static image for any placement
- **Carousel ads**: 2-10 image cards per ad, each with its own link

**Not supported**: Video ads, Collection ads, motion-only formats

## Output Format

### Phase 1: Text Concept Format (Initial Generation)

Generate **3-5 Instagram ad concepts** using **table format** for easy side-by-side comparison:

**Format requirements - Table Format**:
- Use **markdown table** with 6 columns: **Concept | Primary Text | Headline | Description | CTA Button | Quality**
- Each concept takes **2 rows**: main concept row (all 6 cells filled) + image concept row (spans all 6 columns)
- Image concept row starts with "↳ **Image Concept**:" followed by inline details spanning the full width
- Image details format: `Colors: ..., Composition: ..., Focal Point: ..., Typography: ..., Style: ...`
- Add blank separator row (`|  |  |  |  |  |  |`) between concept pairs for visual spacing
- **Do NOT include character counts** - validated internally but not shown to user
- Allows horizontal comparison of all text elements across concepts

**Example Table Format**:

| Concept | Primary Text | Headline | Description | CTA Button | Quality |
|---------|--------------|----------|-------------|------------|---------|
| **Bold Visual Impact**<br>"Transform your morning routine with UltraFit Pro" | Transform your morning routine with UltraFit Pro. Premium sound, all-day comfort, seamless connectivity. Available now. | UltraFit Pro - Now Available | Premium wireless headphones | Shop Now | 31/35 |
| ↳ **Image Concept**: Colors: #667eea (Deep Purple) → #764ba2 (Violet), Composition: Product centered with rule of thirds, Focal Point: Headphones at 30-degree angle, Typography: "NEW" badge in top-right corner, Style: Clean, minimal, premium aesthetic ||||||
|  |  |  |  |  |  |
| **Lifestyle Focus**<br>"Your perfect workout companion" | Your perfect workout companion. Designed for athletes who demand more. Sweat-proof, secure fit, exceptional sound. Train harder. | Fitness-First Audio | Engineered for performance | Learn More | 29/35 💪 |
| ↳ **Image Concept**: Colors: #10b981 (Success Green) → #059669 (Dark Green), Composition: Action shot with dynamic movement, Focal Point: Athlete mid-workout wearing headphones, Typography: "BUILT TOUGH" text overlay, Style: Energetic, bold, athletic ||||||

**Key Benefits of Table Format**:
- Side-by-side comparison of primary text, headlines, descriptions
- All copy visible without clicking (Instagram has short fields that fit in columns)
- Image concept details organized in consistent inline format
- Quality scores easily compared across concepts
- Renders reliably in all markdown contexts
- Simple structure, no HTML compatibility issues
- Blank separator rows improve scannability between concepts

**Note**: The markdown table format above is the default. Always use standard markdown tables for Instagram concepts to enable easy horizontal comparison while ensuring reliable rendering.

### CHECKPOINT: Placement & Format Selection

**STOP and wait for user response. Do NOT proceed to Phase 2 or generate HTML until the user confirms placement and format.**

This checkpoint fires **after the user confirms Phase 1 text concepts** and **before any HTML generation**.

**Step 1: Infer from the original prompt**

Scan the user's original request for placement/format keywords:

| Keyword(s) in prompt | Inferred Placement | Inferred Format |
|---|---|---|
| "reel", "reels" | Reels | Image |
| "story", "stories" | Stories | Image |
| "feed" | Feed | Image |
| "explore" | Explore | Image |
| "carousel" | (keep current or ask) | Carousel |
| "carousel story/stories" | Stories | Carousel |
| "carousel feed" | Feed | Carousel |

**Step 2: Confirm or ask**

- **If inferred**: Present the inference and ask for confirmation:
  > "Based on your request, I'll create this for **[Placement] [Format]** (e.g., Feed Image, 1440x1800px, 4:5 ratio). Does that work, or would you prefer a different placement?"
- **If not inferable**: Ask two-step:
  1. "Would you like an **Image** ad or a **Carousel** ad?" → Wait for response
  2. "Which placement? **Feed** / **Stories** / **Reels** / **Explore** / **Explore Home**" → Wait for response
- **If user says "proceed" or similar without specifying**: Suggest Feed Image as default, but still ask for confirmation

**Step 3: Validate copy against placement constraints**

After placement is confirmed, check the confirmed text concepts against placement-specific limits (see Ad Specifications tables below). If any copy exceeds limits:
- Flag the specific fields that need adjustment
- Offer condensed alternatives
- Note any fields that don't apply to the placement (e.g., Stories has no Headline/Description)

**Only proceed to Phase 2 after the user confirms placement, format, and any copy adaptations.**

### Phase 2: HTML Preview Format (After Placement Confirmation)

**Required workflow**: Every time you generate HTML for Instagram, write the HTML to a file and call `mcp__tdx-studio__open_file` to open the preview. Complete both the file writing and preview opening steps automatically.

**ONLY generate HTML mockups AFTER the Placement & Format Selection checkpoint is complete.** The user must have:
1. Confirmed text concepts (Phase 1)
2. Confirmed placement and format (Checkpoint)
3. Approved any copy adaptations for the selected placement

**HTML Generation and Preview Workflow** (complete all steps):
1. Read `../references/html-preview-templates.md`
2. **Check for generated image** (auto-background enhancement):
   - Use Glob to find `instagram-ad-*.png` files in working directory
   - Sort by modification time (most recent first)
   - If found: Read PNG as binary and convert to base64 string
   - If not found: Use placeholder/emoji approach (current behavior)
3. Generate HTML mockup using the confirmed placement's aspect ratio:
   - **1:1** (Profile Feed, Explore Image, Explore Carousel): `padding-bottom:100%`
   - **4:5** (Feed, Explore Home): `padding-bottom:125%`
   - **9:16** (Stories, Reels): `padding-bottom:177.78%`
   - For **Stories/Reels**: Apply safe zone overlays (see Ad Specifications)
   - For **Carousel**: Render 2-3 cards with dots indicator and swipe hint
   - If base64 image available: Use `background-image:url(data:image/png;base64,{base64_string})` with `background-size:cover;background-position:center` in image area
   - If no image: Use `background:{color}` with emoji/text placeholder
4. Use the Write tool to save HTML to file: `instagram-{placement}-{format}-preview-{timestamp}.html` in working directory (use YYYYMMDD-HHMMSS format for timestamp, lowercase placement/format)
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
- Placement & Format Selection checkpoint is complete
- User has confirmed text concepts, placement, format, and any copy adaptations

**Do NOT generate HTML when**:
- This is the first concept generation (Phase 1)
- User is still exploring creative directions
- User hasn't confirmed placement and format yet (checkpoint not cleared)
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

**Phase 1 uses the maximum constraints below for all placements.** After the Placement & Format Selection checkpoint, copy is validated against placement-specific limits and adapted if needed.

**Placement-specific overrides**:
- **Reels**: Primary Text max **44 characters** (no Headline or Description)
- **Stories**: Primary Text 125 chars (no Headline or Description)
- **Carousel**: Shared Primary Text across all cards; per-card Landing URL required

### Primary Text (125 characters max — 44 for Reels)
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

## Carousel Concept Format

When the user selects **Carousel** format, adapt the Phase 1 table to show multiple cards per concept.

**Key carousel rules**:
- **Shared Primary Text**: One caption for the entire carousel (125 chars max)
- **Per-card elements**: Each card has its own image concept, optional headline, and landing URL
- **Show 3 sample cards** per concept in Phase 1 (user can request 2-10 in final)

**Carousel Table Format**:

| Concept | Primary Text | Card | Headline | Landing URL | CTA Button |
|---------|--------------|------|----------|-------------|------------|
| **Product Showcase**<br>"Discover the full collection" | Discover the full UltraFit collection. Three styles, one mission: perfect sound. 🎧 | Card 1 | UltraFit Pro | /products/pro | Shop Now |
| | | Card 2 | UltraFit Sport | /products/sport | Shop Now |
| | | Card 3 | UltraFit Studio | /products/studio | Shop Now |
| ↳ **Card Image Concepts**: Card 1: Product on white, centered, minimal. Card 2: Athlete wearing headphones, action shot. Card 3: Studio setting, warm lighting, lifestyle. ||||||

## Image Concept Development

### Composition Approaches

| Approach | Best For |
|----------|----------|
| Rule of Thirds | Product photography, lifestyle shots |
| Centered & Symmetrical | Minimalist aesthetic, bold statements |
| Full-Bleed Product | E-commerce, fashion, food |
| Text-Dominant | Announcements, sales, bold statements |
| Lifestyle Context | Demonstrating use case, aspirational |

### Instagram-Specific Image Guidelines

- **On-image text**: Max 5-10 words, 48px+ for mobile readability, bold sans-serif (Helvetica, Futura, Montserrat)
- **When to use on-image text**: Announce offers ("50% OFF", "NEW ARRIVAL"), reinforce brand message ("Handmade with Love"), create urgency ("Ends Tonight")
- **Logo**: Top-left or bottom-right, small and subtle, white/black version for contrast
- **Colors**: Match brand palette; use high-contrast for feed standout (e.g., #E63946 red, #FFD700 yellow, #6A0DAD purple)
- **Emotional tone**: Urgency → red/orange, Trust → blue/navy, Luxury → black/gold, Fresh → green/white, Playful → bright pastels

## Ad Specifications by Placement

### Image Ad Specs

| Placement | Ratio | Resolution | Text Fields | Safe Zones |
|-----------|-------|------------|-------------|------------|
| Profile Feed | 1:1 (supports 1.91:1–4:5) | 1080x1080 | Primary (125) + Headline (40) | — |
| Feed | 4:5 | 1440x1800 | Primary (125) + Headline (40) | — |
| Stories | 9:16 | 1440x2560 | Primary (125) | Top 14%, Bottom 20% |
| Reels | 9:16 | 1440x2560 | Primary (44) | Top 14%, Bottom 35%, Sides 6% |
| Explore | 1:1 | 1080x1080 | Primary (125) | — |
| Explore Home | 4:5 | 1440x1800 | Primary (125) + Headline (40) | — |

### Carousel Ad Specs

| Placement | Ratio | Resolution | Cards | Text Fields |
|-----------|-------|------------|-------|-------------|
| Profile Feed | 1:1 (1.91:1–4:5) | 1080x1080 | 2–10 | Primary (125) + Headline (40) + Landing URL |
| Feed | 4:5 | 1080x1080 | 2–10 | Primary (125) + Headline (40) + Landing URL |
| Stories | 9:16 | 1080x1920 | 2–10 | Primary (125) + Landing URL |
| Reels | 9:16 | 1080x1080 | 2–10 | — |
| Explore | 1:1 | 1080x1080 | 2–10 | Primary (125) + Headline (40) + Landing URL |
| Explore Home | 1:1 | 1080x1080 | 2–10 | Primary (125) + Headline (40) + Landing URL |

**Technical specs (all placements)**: File type JPG or PNG, max 30MB (aim for <1MB for fast loading).

### Safe Zones

**Stories** — Keep text, logos, and CTAs out of these areas to avoid overlap with Instagram's UI layer:
```
┌─────────────────┐
│░░░░░ TOP 14% ░░░│  ← Avoid: overlaps with profile icon, status bar
│                 │
│                 │
│   SAFE AREA     │
│                 │
│                 │
│░░░ BOTTOM 20% ░░│  ← Avoid: overlaps with CTA overlay, swipe-up
└─────────────────┘
```

**Reels** — More restricted safe area to avoid overlap with Reels UI controls:
```
┌─────────────────┐
│░░░░░ TOP 14% ░░░│  ← Avoid: overlaps with camera, status bar
│                 │
│                 │
│ 6%│ SAFE AREA │6%│  ← Avoid: overlaps with like, comment, share buttons
│                 │
│░░░░░░░░░░░░░░░░░│
│░░░ BOTTOM 35% ░░│  ← Avoid: overlaps with caption, nav bar
└─────────────────┘
```

## HTML Preview Template

For complete HTML preview templates, reference `../references/html-preview-templates.md`.

**Aspect ratio CSS** — Set `padding-bottom` based on confirmed placement:

| Ratio | CSS | Placements |
|-------|-----|------------|
| 1:1 | `padding-bottom:100%` | Profile Feed, Explore Image, Explore Carousel |
| 4:5 | `padding-bottom:125%` | Feed, Explore Home |
| 9:16 | `padding-bottom:177.78%` | Stories, Reels |

**Basic Instagram mockup structure** (adjust `padding-bottom` per placement):

```html
<div style="max-width:375px;margin:0 auto;font-family:-apple-system,BlinkMacSystemFont,sans-serif;">
  <div style="background:#fff;border:1px solid #dbdbdb;border-radius:3px;">
    <!-- Instagram header -->
    <div style="padding:14px;display:flex;align-items:center;border-bottom:1px solid #efefef;">
      <div style="width:32px;height:32px;border-radius:50%;background:#ddd;margin-right:12px;"></div>
      <strong style="font-size:14px;color:#262626;">brand_name</strong>
    </div>

    <!-- Image area (adjust padding-bottom for ratio: 100%=1:1, 125%=4:5, 177.78%=9:16) -->
    <div style="position:relative;width:100%;padding-bottom:{{ratio_percent}};background:{{image_bg}};overflow:hidden;">
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

## Example Instagram Ad Concepts

### Feed Image Example (4:5)

| Concept | Primary Text | Headline | Description | CTA Button | Quality |
|---------|--------------|----------|-------------|------------|---------|
| **Product Hero - Minimal**<br>"Introducing the UltraFit Pro" | Introducing the UltraFit Pro. Wireless. Waterproof. 48-hour battery. Your new workout essential. 🎧 | Meet UltraFit Pro Headphones | Free shipping + 30-day returns | Shop Now | 34/35 |
| ↳ **Image Concept**: Colors: #FFFFFF (Clean White) → #1a1a1a (Matte Black) → #0095f6 (Vibrant Blue accent), Composition: Centered product shot with rule of thirds, Focal Point: Sleek black headphones at 30° angle, Typography: "NEW" badge top-right (Helvetica Bold, blue), Style: Clean, minimal, premium tech aesthetic ||||||

### Stories Image Example (9:16)

| Concept | Primary Text | CTA Button | Quality |
|---------|--------------|------------|---------|
| **Flash Sale Vertical**<br>"24-hour drop" | 🔥 UltraFit Pro — 50% off for 24 hours only. Tap to grab yours before it's gone. | Shop Now | 32/35 |
| ↳ **Image Concept**: Colors: #E63946 (Urgent Red) → #1a1a1a (Black), Composition: Full-bleed vertical, product centered in safe zone, Focal Point: Headphones with "50% OFF" overlay, Typography: Bold sans-serif "FLASH SALE" in top-third safe area, Style: High-energy, urgency-driven. **Safe zones**: No content in top 14% or bottom 20%. ||||

### Feed Carousel Example (4:5)

| Concept | Primary Text | Card | Headline | Landing URL | CTA Button |
|---------|--------------|------|----------|-------------|------------|
| **Collection Showcase**<br>"Three styles, one mission" | Meet the UltraFit family. Three styles designed for every moment. Which one is yours? 🎧 | Card 1 | UltraFit Pro | /products/pro | Shop Now |
| | | Card 2 | UltraFit Sport | /products/sport | Shop Now |
| | | Card 3 | UltraFit Studio | /products/studio | Shop Now |
| ↳ **Card Image Concepts**: Card 1: Product on white, centered, minimal premium feel. Card 2: Athlete mid-run wearing headphones, outdoor setting. Card 3: Person in home studio, warm lighting, lifestyle. ||||||

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
