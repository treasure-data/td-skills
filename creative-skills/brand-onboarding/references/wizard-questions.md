# Brand Onboarding Wizard Questions

Complete reference of all wizard questions organized into two phases. Use this reference to ensure comprehensive brand guidelines coverage.

---

# PHASE 1: CORE BRANDING (Required - 8 Question Sets)

**Purpose**: Collect minimum information needed for functional brand guidelines

**Time**: ~8 minutes

**Result**: Guidelines with Sections 1-4 complete, score ~28/40 (functional)

**After Phase 1**: User chooses to start using or continue with Phase 2

---

## Question Set 1: Initial Path Selection

**Q1: Documentation Source**

```
"Let's set up your brand guidelines! Do you have existing brand documentation?"

Options:
A. Paste brand document text (Recommended for fastest setup)
B. Provide file path or URL to brand document
C. Start from scratch with guided questions

Context: If you have brand guidelines, style guides, or brand decks already written,
pasting them will auto-fill most wizard questions and save time.
```

**Follow-up for Option A (Paste Text)**:
```
"Please paste your brand document text below. I'll extract colors, fonts, voice, and other brand elements automatically."

[User pastes text]

Then: Run extraction logic (see extraction-from-docs.md)
```

**Follow-up for Option B (File/URL)**:
```
"Please provide the file path or URL to your brand document:"

Examples:
- File path: /Users/user/Documents/brand-guidelines.pdf
- URL: https://acme.com/brand-style-guide

[User provides path/URL]

Then: Fetch content and run extraction logic
```

**Follow-up for Option C (From Scratch)**:
```
"Perfect! I'll guide you through creating comprehensive brand guidelines step-by-step. This will take about 15 minutes."

Then: Proceed to Question Set 2
```

---

## Question Set 2: Brand Foundation

### Q2.1: Company Name

```
"What's your company or brand name?"

Input type: Text (single line)
Required: Yes

Example: "Acme Corp"
```

### Q2.2: Brand Mission

```
"What's your brand's purpose or mission? (1-2 sentences)"

Input type: Text (multi-line)
Required: Yes
Guidance: This should capture why your brand exists and what you aim to achieve.

Good examples:
- "Equip the modern explorer with gear that lasts a lifetime and protects the places we play."
- "Make sustainable fashion accessible to everyone through transparent pricing and ethical manufacturing."
- "Empower small businesses with enterprise-grade analytics tools they can actually afford."

Avoid:
- Too vague: "We make great products"
- Too long: 5+ sentences
```

### Q2.3: Core Values

```
"What 3-5 values define your brand?"

Input type: List (comma-separated)
Required: Yes
Guidance: These should be the fundamental principles that guide all brand decisions.

Good examples:
- "Durability, Sustainability, Authenticity, Expertise"
- "Innovation, Transparency, Customer-First, Quality"
- "Accessibility, Inclusivity, Creativity, Integrity"

Avoid:
- Generic terms without meaning: "Excellence, Leadership, Success"
- Too many: More than 5 values dilutes focus
```

---

## Question Set 3: Brand Voice (Constant)

### Q3.1: Voice Attributes

```
"Describe your brand voice in 2-4 words. This should stay constant across ALL content."

Input type: List (comma-separated adjectives)
Required: Yes
Validation: 2-4 words
Guidance: Brand voice is your personality - it doesn't change based on context.

Good examples:
- "Knowledgeable, Enthusiastic, Respectful"
- "Bold, Innovative, Trustworthy"
- "Friendly, Professional, Supportive"
- "Authentic, Transparent, Passionate"

Avoid:
- Too many: More than 4 dilutes identity
- Too few: Less than 2 is too vague
- Generic: "Good, Nice, Helpful"
```

### Q3.2: Voice Attribute Definitions

For each attribute from Q3.1, ask:

```
"What does '{attribute}' mean for your brand?"

Input type: Text (2-3 sentences)
Required: Yes
Guidance: Explain what this attribute means in practice and give an example.

Template:
- What it means: [1 sentence definition]
- Language style: [How you express this]
- Example: [Concrete example from your content]

Example for "Knowledgeable":
What it means: Experts in gear, technique, and environment
Language style: Precise, authentic, factual
Example: "Engineered with bluesign® certified nylon and 100% recycled polyester fill"

Example for "Enthusiastic":
What it means: Genuinely passionate about outdoor exploration
Language style: Encouraging, energizing, reflecting joy of adventure
Example: "What's your sunrise ritual? Coffee on the summit or tea by the trail?"
```

---

## Question Set 4: Brand Tone (Variable by Context)

### Q4.1: Content Contexts

```
"What contexts do you create content for? (Select all that apply)"

Input type: Multiple choice (select all)
Options:
☐ Product Specifications/Descriptions
☐ Social Media Posts
☐ Sustainability/Environmental Communications
☐ Customer Support/Service
☐ Safety/Educational Content
☐ Marketing/Promotional Campaigns
☐ Other: _____________

Guidance: Select all contexts where you regularly create content.
You'll define the appropriate tone for each selected context.
```

### Q4.2: Tone for Each Context

For each context selected in Q4.1, ask:

```
"What tone should you use for {CONTEXT}?"

Input type: Text (1-2 words for tone + 1-2 sentences explanation + example)
Required: Yes

Common tone options by context:
- Product Specs: Precise & Functional, Technical, Informative
- Social Media: Inspirational, Conversational, Playful
- Sustainability: Transparent, Honest, Factual
- Support: Solution-Oriented, Patient, Helpful
- Safety/Education: Authoritative, Clear, Direct
- Marketing: Exciting, Urgent, Compelling

Template:
Tone: [1-2 word descriptor]
When to use: [Context explanation]
Example: [Sample content in this tone]

Example for "Product Specs":
Tone: Precise & Functional
When to use: Product descriptions, technical specifications, gear details
Example: "Waterproof-breathable 3-layer Gore-Tex® shell. Adjustable hood. Pit zips for ventilation."
Avoid: Inspirational language, hyperbole

Example for "Social Media":
Tone: Inspirational
When to use: Instagram captions, Facebook posts, community engagement
Example: "Where will today's trail take you?"
Avoid: Technical jargon, overly formal language
```

---

## Question Set 5: Visual Identity - Colors

### Q5.1: Primary Brand Color

```
"What is your primary brand color? (Used for logos, headers, primary brand elements)"

Input type: Hex code
Required: Yes
Validation: Must be valid hex code (#RRGGBB)
Guidance: This is your most recognizable brand color.

Example: #1B3022

Follow-up questions:
```

**Q5.1a: Primary Color Name**
```
"What name do you use for this color?"

Input type: Text
Required: No (but recommended)
Example: "Old Growth", "Navy Blue", "Corporate Blue"
```

**Q5.1b: Primary Color Usage**
```
"When should this color be used?"

Input type: Text (multi-line)
Required: Yes
Guidance: Be specific about where this color appears.

Good examples:
- "Logo on light backgrounds, email headers, primary CTAs"
- "Headers, navigation bars, footer backgrounds"
- "Primary buttons, links, and brand lockups"
```

**Q5.1c: Primary Color Restrictions**
```
"When should this color NOT be used?"

Input type: Text (multi-line)
Required: No (but recommended)
Guidance: Specify contexts to avoid this color.

Good examples:
- "Body text (insufficient contrast), CTA buttons"
- "Large background areas, text smaller than 18px"
- "Decorative elements, secondary actions"
```

### Q5.2: CTA (Call-to-Action) Color

```
"What is your call-to-action (CTA) color?"

Input type: Hex code
Required: Yes
Validation: Must be valid hex code, should differ from primary color
Guidance: This color should be reserved EXCLUSIVELY for CTAs to maintain visual hierarchy.
This should have high contrast against your background color.

Example: #B35D33
```

**Q5.2a: CTA Color Name**
```
"What name do you use for this CTA color?"

Input type: Text
Required: No (but recommended)
Example: "Burnt Ochre", "Action Orange", "CTA Red"
```

**Q5.2b: CTA Color Usage**
```
"Where should the CTA color be used?"

Input type: Text
Default: "Call-to-action buttons only (Shop Now, Learn More, Add to Cart, Sign Up)"
Guidance: This should typically be buttons and primary action links ONLY.

Critical: Reserve exclusively for CTAs to maintain clear visual hierarchy.
```

**Automatic validation**: Check 4.5:1 contrast ratio between CTA color and background color.
If fails: "Your CTA color (#B35D33) has insufficient contrast against your background (#F5F2ED).
Contrast ratio: 3.2:1. WCAG AA requires 4.5:1. Would you like to:
A. Choose a darker/lighter CTA color
B. Proceed anyway (not recommended for accessibility)"

### Q5.3: Background Color

```
"What is your primary background color?"

Input type: Hex code
Required: Yes
Validation: Must be valid hex code
Guidance: This is typically used for email backgrounds, web page backgrounds, content areas.

Common options:
- Pure white: #FFFFFF
- Off-white: #F5F2ED, #F8F9FA, #FAFAFA
- Light gray: #F0F0F0, #E5E5E5

Example: #F5F2ED
```

**Q5.3a: Background Color Name**
```
"What name do you use for this background color?"

Input type: Text
Required: No
Example: "Raw Canvas", "Soft White", "Background Gray"
```

### Q5.4: Secondary/Accent Colors

```
"Do you have any additional brand colors? (secondary colors, accents, etc.)"

Input type: Yes/No
Required: No

If Yes: "Please provide additional colors (hex codes, one per line)"

Input format:
#9CAF88 - Lichen (Sustainability accents)
#4A4E51 - Granite (Secondary text)

Parse each line for:
- Hex code
- Color name (optional)
- Usage context (optional)
```

---

## Question Set 6: Visual Identity - Typography

### Q6.1: Heading Font

```
"What font do you use for headings?"

Input type: Text (font name)
Required: Yes
Guidance: This is your primary heading typeface (H1, H2, H3, etc.)

Examples: "Montserrat", "Roboto", "Palatino", "Georgia", "Helvetica"
```

**Q6.1a: Heading Font Stack**
```
"What's the full font stack for headings? (Include fallback fonts)"

Input type: Text (CSS font-family format)
Required: No (will generate default if not provided)
Guidance: This ensures the font displays correctly if primary font isn't available.

Example: Palatino, "Palatino Linotype", "Book Antiqua", Georgia, serif
Example: Montserrat, "Helvetica Neue", Helvetica, Arial, sans-serif
```

**Q6.1b: Heading Font Weights**
```
"What font weights do you use for headings?"

Input type: Text
Required: No
Guidance: Specify which weights and when to use them.

Examples:
- "Bold (700) for emphasis, SemiBold (600) for subheadings"
- "Bold (700) for all headings"
- "Regular (400) for H3-H6, Bold (700) for H1-H2"
```

**Q6.1c: Heading Special Styling**
```
"Any special styling for headings?"

Input type: Text
Required: No

Examples:
- "ALL-CAPS for H1 and major section headings"
- "Sentence case for all headings"
- "Letter-spacing: 0.05em for H1"
```

### Q6.2: Body Font

```
"What font do you use for body text?"

Input type: Text (font name)
Required: Yes
Guidance: This is your primary body copy typeface.

Examples: "Roboto", "Open Sans", "Trebuchet MS", "Georgia", "Arial"
```

**Q6.2a: Body Font Stack**
```
"What's the full font stack for body text?"

Input type: Text (CSS font-family format)
Required: No

Example: "Trebuchet MS", "Lucida Grande", "Lucida Sans Unicode", Arial, sans-serif
Example: "Open Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif
```

**Q6.2b: Body Font Size**
```
"What's the minimum font size for body text?"

Input type: Text
Required: No
Default: "16px mobile, 18px desktop"
Guidance: WCAG recommends minimum 16px for accessibility.

Examples:
- "16px mobile, 18px desktop"
- "14px minimum (not recommended for accessibility)"
- "18px for all devices"
```

**Q6.2c: Body Line Height**
```
"What line height do you use for body text?"

Input type: Number or text
Required: No
Default: 1.6
Guidance: 1.5-1.8 is recommended for readability.

Examples:
- 1.6
- 1.5
- "1.7 for optimal readability"
```

### Q6.3: Special Fonts

```
"Do you have any fonts for special uses? (e.g., monospace for code, script for signatures)"

Input type: Yes/No
Required: No

If Yes: "Please describe your special fonts and when to use them"

Input format:
Courier New - For Pro-Tips, technical specifications, field notes (monospace feel)
Pacifico - For handwritten signatures or personal quotes

Examples:
- Courier New (monospace): Code blocks, technical specs, field journal callouts
- Georgia (serif): Pull quotes, testimonials
- Script font: Signatures, personal messages
```

---

## Question Set 7: Visual Identity - Logo Usage

### Q7.1: Logo Availability

```
"Do you have logo files available?"

Input type: Yes/No
Required: Yes

If No: "No problem! We'll record your logo usage rules without file paths.
You can add file paths later when logos are ready."
→ Skip to Q7.4 (usage rules only)

If Yes: Proceed to Q7.2
```

### Q7.2: Logo Files

```
"Please provide the path(s) or URL(s) to your logo file(s):"

Input type: Text (file paths or URLs, one per line)
Guidance: Provide local file paths or URLs. Files will be copied to your brand folder for safekeeping.

Examples:
- Local file: /Users/user/brand/logo.png
- URL: https://company.com/assets/logo.svg
- Multiple variants: One per line (light/dark backgrounds)

After providing:
- Local files → Copied to: ~/Documents/Brand Guidelines/{Company}/logos/
- URLs → Option to download or keep as reference
- You'll receive a clickable [Open Folder] link to view your logos

Format: One path or URL per line
```

**Q7.2a: Logo Variants**
```
"Do you have separate logo versions for light vs dark backgrounds?"

Input type: Yes/No

If Yes:
"Which logo is for LIGHT backgrounds?"
[File path selection from Q7.2 paths]

"Which logo is for DARK backgrounds?"
[File path selection from Q7.2 paths]

Guidance: Light backgrounds typically use dark logos, dark backgrounds use light logos.
```

**Q7.2b: Logo File Handling**

Based on what the user provides, Claude handles logos as follows:

**Scenario 1: Local File Path(s)**
```
User: "/Users/john/Downloads/company-logo.png"

Claude actions:
1. Create: ~/Documents/Brand Guidelines/{Company}/logos/
2. Copy file to: ~/Documents/Brand Guidelines/{Company}/logos/logo-dark.png
3. Update brand-guidelines.md with new path
4. Notify:
   "✅ Logo copied to your brand folder:
   ~/Documents/Brand Guidelines/{Company}/logos/logo-dark.png

   [Open Folder]"
```

**Scenario 2: URL(s)**
```
User: "https://company.com/logo.png"

Claude offers:
"I can:
1. Download and save locally (recommended)
   → ~/Documents/Brand Guidelines/{Company}/logos/logo-dark.png
2. Keep as URL reference
   → https://company.com/logo.png in brand-guidelines.md

Which would you prefer? [1]"

If user chooses 1:
- Download from URL
- Save to logos/ folder
- Reference local path in brand-guidelines.md
- Notify with [Open Folder] link
```

**Scenario 3: No Logo Files Yet**
```
User: "I don't have logo files yet"

Claude actions:
1. Create empty: ~/Documents/Brand Guidelines/{Company}/logos/
2. Add placeholder to brand-guidelines.md
3. Notify:
   "📁 Logo folder created:
   ~/Documents/Brand Guidelines/{Company}/logos/

   Add your logo files here when ready.
   [Open Folder]"
```

### Q7.3: Logo Size Requirements

```
"What are your logo size requirements?"

Input format: Provide minimum and/or maximum sizes

Minimum width: ______ (e.g., 80px, 1 inch for print)
Maximum width (Email): ______ (e.g., 200px)
Maximum width (Instagram): ______ (e.g., 120px)

Required: At least minimum OR maximum
Default minimum: 80px
Default maximum (email): 200px
```

### Q7.4: Logo Placement Rules

```
"Where should your logo appear in branded content?"

Input type: Text (multi-line)
Required: Yes
Guidance: Be specific about positioning and spacing.

Examples:
- "Centered in header with 20px padding on all sides"
- "Top-left corner, 40px from edges"
- "Centered in email header against Old Growth (#1B3022) background"

Email-specific:
- "Position: Centered in header"
- "Background: Old Growth (#1B3022) header with 20px padding"
- "Size: 160-180px width recommended"

Instagram-specific:
- "Position: Top-right corner (default) or top-left"
- "Padding: 40px from edges"
- "Size: 100px width maintaining aspect ratio"
```

### Q7.5: Logo Restrictions

```
"What should NEVER be done with your logo?"

Input type: Checklist + custom text
Options (select all that apply):
☐ Never distort aspect ratio (stretch or squash)
☐ Never add drop shadows, glows, or effects
☐ Never rotate or tilt the logo
☐ Never change logo colors
☐ Other restrictions: _______________

Default selection: All checkboxes checked
```

---

## Question Set 8: Visual Identity - Imagery Style

### Q8.1: Photography Style

```
"What photography or imagery style represents your brand?"

Input type: Text (multi-line)
Required: Yes
Guidance: Describe the look and feel of images that represent your brand.

Examples:
- "Authentic, real-world use. Show actual customers using products in real environments."
- "Clean, minimalist product photography on white backgrounds"
- "Lifestyle imagery showing diverse people in aspirational settings"
- "Bold, colorful, energetic action shots"
```

### Q8.2: Authenticity Guidelines

```
"What authenticity standards do you have for imagery?"

Input type: Text (multi-line)
Required: No
Guidance: What should images SHOW vs AVOID to maintain brand authenticity?

Template:
Show: [What to include]
Avoid: [What to exclude]

Example (Outdoor brand):
Show: Real use, sweat, mud, worn gear, functional setups
Avoid: Studio-perfect models, pristine unused gear, overly staged scenes
```

### Q8.3: Lighting Preferences

```
"What lighting style do you prefer for imagery?"

Input type: Text
Required: No

Examples:
- "Natural, directional light (golden hour, diffused overcast)"
- "Bright, even studio lighting"
- "Moody, dramatic lighting with high contrast"
- "Soft, diffused natural light"

Avoid:
- "Heavy filters, over-saturation, artificial effects"
- "Harsh direct flash, unflattering shadows"
```

### Q8.4: Ethics/Compliance for Imagery

```
"Are there any ethical or compliance requirements for your imagery?"

Input type: Text
Required: No

Examples (Outdoor brand):
- "All images must follow Leave No Trace principles"
- "No visible litter, campfires outside designated areas, or shortcutting switchbacks"

Examples (Other brands):
- "All models must have signed release forms"
- "Images must represent diverse demographics"
- "Food photography must show actual product (not enhanced/fake food)"
```

---

## AFTER PHASE 1: CHOICE POINT

After completing Phase 1 questions (Question Sets 1-8), present this choice to the user:

```
✅ Core brand guidelines created! (Score: ~28/40)

Phase 1 covers visual and voice. Phase 2 adds Messaging, Legal & Accessibility compliance for production-ready content (38/40).

What would you like to do?
1. Start using now (can enhance later)
2. Continue to Phase 2 (~7 min) [Recommended for production]

Choice: ___
```

**If user chooses Option 1 (Start using now)**:
- Generate brand-guidelines.md with Sections 1-4 complete
- Mark Sections 5-7 as "Optional - not configured"
- Provide success message with score ~28/40
- User can enhance later by saying "Complete my brand guidelines"

**If user chooses Option 2 (Continue to Phase 2)**:
- Proceed to Question Set 9 (Messaging - Approved Terms)
- Complete all Phase 2 questions
- Generate comprehensive guidelines with all 8 sections

---

# PHASE 2: COMPREHENSIVE ENHANCEMENT (Optional - 7 Question Sets)

**Purpose**: Add messaging standards, legal compliance, and accessibility for production-ready guidelines

**Time**: ~7 minutes

**Result**: Guidelines with all 8 sections complete, score 35-40/40 (comprehensive)

**What Phase 2 adds**:
- Messaging standards (approved/prohibited terminology)
- Legal protection (CAN-SPAM, TCPA, FTC compliance)
- Accessibility compliance (WCAG 2.1 AA standards)

**Note**: Users can skip Phase 2 and add it later by saying "Complete my brand guidelines"

---

## Question Set 9: Messaging - Approved Terminology

### Q9.1: Power Words

```
"What words or phrases should your brand USE regularly?"

Input type: Text (multi-line list or comma-separated)
Required: Yes (minimum 5 terms)
Guidance: These are your brand's power words - terms that reinforce your voice and values.

Categories to consider:
- Action words: Verbs that reflect your brand's energy
- Industry terms: Specific terminology from your field
- Value words: Terms that express your brand values
- Quality descriptors: Words that describe your offerings

Examples (Outdoor brand):
Action: Traverse, Equip, Endure, Explore, Preserve, Venture
Environment: Backcountry, Summit, Alpine, Trailhead, Wilderness
Sustainability: Circular, PFC-Free, Traceable, Recycled, Durable, Repairable
Quality: Engineered, Tested, Proven, Reliable, Built-to-Last

Examples (Tech brand):
Action: Automate, Optimize, Scale, Integrate, Innovate
Product: Dashboard, Workflow, Analytics, Insights, Platform
Value: Enterprise-grade, Reliable, Secure, Scalable
Quality: Robust, Powerful, Intuitive, Fast
```

---

## Question Set 10: Messaging - Prohibited Terms

### Q10.1: Prohibited Words

```
"What words or phrases should your brand NEVER use?"

Input type: Text (multi-line list or comma-separated)
Required: Yes (minimum 3 terms)
Guidance: These are words that contradict your voice, sound inauthentic, or create legal risks.

Why this matters: Prohibited terms help maintain brand voice consistency and avoid
legal/compliance issues (e.g., unsubstantiated claims).

Categories to consider:
- Vague claims: Claims you can't substantiate
- Internet slang: Terms that sound unprofessional or dated quickly
- Hyperbole: Exaggerated claims
- Corporate jargon: Buzzwords that lack meaning
- Competitor terms: Trademarked or competitor-specific language

Examples (Outdoor brand):
Vague green claims: eco-friendly, green, natural (unless certified)
Internet slang: lit, bestie, FOMO, slay, goals, vibes
Hyperbole: life-changing, insane, epic, revolutionary, game-changer
Corporate jargon: leverage, synergy, paradigm, ecosystem (in business context)

Examples (Tech brand):
Vague claims: "best", "fastest", "easiest" (without data)
Jargon: disruptive, bleeding-edge, ninja, rockstar, guru
Hyperbole: revolutionary, groundbreaking, game-changing (overused)
Slang: Hacking (unless security context), crushing it, killing it

Examples (Professional services):
Vague: world-class, premier, leading (without substantiation)
Casual: awesome, cool, nice, great (too informal)
Absolute claims: always, never, guaranteed (unless actually guaranteed)
```

---

## Question Set 11: Messaging - Key Messages

### Q11.1: Primary Value Proposition

```
"What's your primary value proposition? (Your core brand promise in 1-2 sentences)"

Input type: Text (multi-line, 1-2 sentences)
Required: Yes
Guidance: This should capture the fundamental value you provide to customers.

Good examples:
- "Gear that lasts a lifetime. Built for the backcountry, designed for durability, committed to protecting the places we play."
- "Enterprise-grade analytics made accessible. Get insights in minutes, not months, at a price small businesses can afford."
- "Sustainable fashion without compromise. Ethical manufacturing, transparent pricing, and timeless designs that last."

Template:
[What you offer] + [How it's different] + [Why it matters]
```

### Q11.2: Sustainability Message (Optional)

```
"How do you communicate your environmental or sustainability commitments?"

Input type: Text (multi-line, 2-3 sentences)
Required: No (skip if not applicable)
Guidance: If sustainability is part of your brand, how do you message it authentically?

Good examples:
- "Every product is a commitment: to you, to quality, and to the wild spaces we all share. We're transparent about our impact and always working toward 100% circular materials."
- "We're not perfect, but we're honest. 70% of our materials are recycled today. Our goal: 100% by 2028."
- "Carbon-neutral shipping, recyclable packaging, and full supply chain traceability. Because what we make shouldn't cost the earth."

Avoid:
- Vague greenwashing: "We care about the environment"
- Unsubstantiated claims: "100% eco-friendly" (without certification)
```

### Q11.3: Customer Promise

```
"What guarantee or commitment do you make to customers?"

Input type: Text (1-2 sentences)
Required: No
Guidance: Your warranty, guarantee, or promise that builds trust.

Examples:
- "If it breaks, we'll fix it. If we can't fix it, we'll replace it. Gear should outlast trends."
- "30-day money-back guarantee. No questions asked."
- "24/7 support. Real humans, not bots. Response within 2 hours."
- "Lifetime warranty on all products. We stand behind our craftsmanship."
```

### Q11.4: Brand Tagline/Signature (Optional)

```
"Do you have a brand tagline or signature phrase?"

Input type: Text (single line)
Required: No
Guidance: A memorable phrase that embodies your brand.

Examples:
- "Gear up. Get out. Leave it better."
- "Think different." (Apple)
- "Just do it." (Nike)
- "Have it your way." (Burger King)
- "The ultimate driving machine." (BMW)
```

---

## Question Set 12: Legal Requirements - Email

### Q12.1: Email Marketing

```
"Do you send marketing emails?"

Input type: Yes/No
Required: Yes

If No: Skip to Question Set 13 (SMS)
If Yes: Proceed with CAN-SPAM compliance questions
```

### Q12.2: Physical Address

```
"What's your company's physical mailing address? (Required for CAN-SPAM compliance)"

Input type: Text (multi-line)
Required: Yes (if sending marketing emails)
Format: Street address, City, State/Province, ZIP/Postal Code, Country

Example:
456 Trail Ridge Road
Boulder, CO 80302
USA

Guidance: This will appear in your email footer. P.O. boxes are acceptable.
```

### Q12.3: Unsubscribe Link Text

```
"What text do you want for your unsubscribe link?"

Input type: Text (single line)
Required: No
Default: "Unsubscribe"

Other options:
- "Unsubscribe from emails"
- "Opt out"
- "Manage preferences"
- "Unsubscribe anytime"
```

### Q12.4: Privacy Policy URL (Optional)

```
"Do you have a privacy policy URL?"

Input type: Text (URL)
Required: No
Format: https://yourdomain.com/privacy

If provided: Will be included in email footer as [Privacy Policy] link
```

**Generated footer preview**:
```
{Company Name}
{Physical Address}
[Unsubscribe] | [Update Preferences] | [Privacy Policy]
```

---

## Question Set 13: Legal Requirements - SMS

### Q13.1: SMS Marketing

```
"Do you send marketing SMS messages?"

Input type: Yes/No
Required: Yes

If No: Skip to Question Set 14 (Instagram)
If Yes: Proceed with TCPA compliance questions
```

### Q13.2: SMS Opt-Out Language

```
"What opt-out instruction do you use for SMS?"

Input type: Text
Required: No
Default: "Text STOP to unsubscribe"

Standard options:
- "Text STOP to unsubscribe"
- "Reply STOP to opt out"
- "Text STOP to stop receiving messages"
```

### Q13.3: SMS Help Language

```
"What help instruction do you use for SMS?"

Input type: Text
Required: No
Default: "Text HELP for assistance"

Options:
- "Text HELP for assistance"
- "Reply HELP for help"
- "Text HELP for more info"
```

### Q13.4: SMS Frequency Disclosure

```
"How do you disclose SMS message frequency?"

Input type: Text
Required: No
Default: "Msg frequency varies"

Options:
- "Msg frequency varies"
- "Up to 4 msgs/month"
- "Approximately 2 msgs/week"
- Custom: [User input]
```

**Generated SMS footer**:
```
Msg frequency varies. Msg & data rates may apply. Text STOP to unsubscribe, HELP for help.
```

---

## Question Set 14: Legal Requirements - Instagram

### Q14.1: Instagram Advertising

```
"Do you run sponsored Instagram posts or use affiliate links?"

Input type: Yes/No
Required: Yes

If No: Skip to Question Set 15 (Accessibility)
If Yes: Proceed with FTC disclosure questions
```

### Q14.2: FTC Disclosure Tags

```
"Which disclosure hashtags do you use? (Select all that apply)"

Input type: Multiple choice
Options:
☐ #ad (for paid sponsorships)
☐ #sponsored (for paid partnerships)
☐ #gifted (for gifted products)
☐ #partner (for brand partnerships)
☐ #affiliate (for affiliate links)
☐ Other: _______________

Guidance: FTC requires clear disclosure of material connections. Hashtags should appear
"above the fold" (visible without clicking "more").
```

**Generated guidance**:
```
Sponsored posts: #ad or #sponsored above the fold
Affiliate links: Clear disclosure before link
Gifted products: #gifted or #partner
```

---

## Question Set 15: Accessibility Standards

### Q15.1: WCAG Compliance

```
"Do you want to follow WCAG 2.1 AA accessibility standards?"

Input type: Yes/No
Required: Yes
Default/Recommended: Yes

If Yes: "Great! WCAG 2.1 AA is the standard for accessible web content."
→ Proceed with accessibility questions

If No: "Note: Following accessibility standards ensures your content is usable by
everyone, including people with disabilities. Are you sure?"
→ Confirm, then skip remaining accessibility questions
```

### Q15.2: Color Contrast Requirements

```
"What minimum color contrast ratio should we use?"

Input type: Choice
Options:
A. 4.5:1 (WCAG AA standard - recommended for body text)
B. 3:1 (WCAG AA for large text 24px+)
C. 7:1 (WCAG AAA standard - highest accessibility)
D. Custom: ______

Required: No
Default: 4.5:1

Guidance: 4.5:1 is the WCAG AA requirement for normal text (18px and below).
Your colors will be validated against this ratio.
```

### Q15.3: Alt Text Requirements

```
"Should all images have alt text?"

Input type: Yes/No
Required: No
Default/Recommended: Yes

If Yes: "Perfect! Alt text makes images accessible to screen readers."

Guidance recorded:
- Required for all images
- Describe function, not just appearance
- Example: "Hiker ascending rocky trail in alpine environment" (not just "Hiker")
```

### Q15.4: Minimum Font Size

```
"What's the minimum font size for your content?"

Input type: Text or Number
Required: No
Default: "16px mobile, 18px desktop"

Options:
- 16px mobile, 18px desktop (recommended)
- 14px minimum (not recommended for accessibility)
- 18px all devices
- Custom: ______

Validation: Warn if < 16px (not accessible)
```

### Q15.5: Reading Level Target

```
"What reading level should your content target?"

Input type: Choice or Text
Options:
A. 8th grade (recommended for general content)
B. High school (12th grade)
C. College level
D. Professional/Technical
E. Custom: ______

Required: No
Default: 8th grade for general content

Guidance:
- 8th grade: Accessible to broadest audience
- Technical specs and professional content can be more advanced
- Use short sentences and active voice for clarity
```

---

# AFTER PHASE 1: CHOICE POINT

After completing Phase 1 questions (Q1-Q8), present this choice to the user:

```
✅ Core brand guidelines created!

I've collected your:
✓ Brand foundation (mission, values)
✓ Brand voice (2-4 attributes with definitions)
✓ Brand tone (context-specific variations)
✓ Visual identity (colors, typography, logo, imagery)

Your guidelines are ready to use (Expected Score: ~28/40 - Functional)

What would you like to do?

1. Start using guidelines now
   - You can use creative skills immediately
   - Guidelines score ~28/40 (functional but not comprehensive)
   - You can enhance later anytime

2. Make guidelines more comprehensive [Recommended]
   - Takes ~7 more minutes
   - Adds messaging standards, legal compliance, accessibility
   - Increases score to 35-40/40 (production-ready)

Choice: ___
```

**If user chooses Option 1 (Start using now)**:
- Skip to "Phase 1 Generation & Validation"
- Generate brand-guidelines.md with Sections 1-4
- Sections 5-7 marked as "Optional - not configured"
- Quick test → score ~28/40
- Success message with option to enhance later

**If user chooses Option 2 (Make comprehensive)**:
- Continue to Phase 2 questions (Q9-Q15)
- Complete all sections
- Full test → score 35-40/40
- Comprehensive success message

---

# GENERATION & VALIDATION

## Phase 1 Generation (If user chose "Start using now")

**Steps**:
1. Generate brand-guidelines.md with Phase 1 sections only
2. Run quick validation (voice, colors, fonts present)
3. Generate mini sample email ad
4. Quick compliance test (expect 25-30/40)
5. Present results:

```
✅ Core brand guidelines ready!

Sample email scored: 28/40 (Functional)

Guidelines saved to: /project-root/brand-guidelines.md

Sections completed:
✓ Section 1: Brand Mission & Philosophy
✓ Section 2: Brand Voice
✓ Section 3: Brand Tone
✓ Section 4: Visual Identity

Sections not yet configured:
- Section 5: Messaging & Lexicon
- Section 6: Legal & Compliance
- Section 7: Accessibility Standards

You can now use creative skills!

To enhance later:
- Say: "Complete my brand guidelines"
- Or: "Add legal compliance to my brand guidelines"
- Or: "Add accessibility standards to my brand guidelines"
```

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

This reference covers all wizard questions in the brand onboarding process. Use it to ensure comprehensive coverage when implementing the wizard.
