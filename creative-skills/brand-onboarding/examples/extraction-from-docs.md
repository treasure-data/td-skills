# Brand Document Extraction Example

This example shows how brand guidelines are extracted from pasted text, dramatically reducing onboarding time.

## Scenario

User has existing brand guidelines in a Word document and wants to convert them to the brand-guidelines.md format for use with creative skills.

---

## User Initiation

**User**: "Set up brand guidelines"

**Claude**: "Let's set up your brand guidelines! Do you have existing brand documentation?"

Options:
1. Paste brand document text (Recommended for fastest setup)
2. Provide file path or URL to brand document
3. Start from scratch with guided questions

**User**: "Paste text"

**Claude**: "Perfect! Please paste your brand document text below. I'll extract colors, fonts, voice, and other brand elements automatically."

---

## User Pastes Brand Document

**User** pastes:

```
Acme Corp Brand Style Guide

BRAND MISSION
Making sustainable living easy and affordable for everyone.

OUR VALUES
- Sustainability First
- Radical Transparency
- Customer Empowerment
- Quality Over Quantity

BRAND VOICE
Our brand is Authentic, Optimistic, and Empowering.

Authentic means we're honest about our progress and challenges. We don't greenwash.
Example: "Our packaging is 80% plastic-free. Working on the rest."

Optimistic means we focus on solutions, not just problems.
Example: "Every small choice adds up. Your reusable bag saves 500 plastic bags per year."

Empowering means we give people tools and knowledge to make better choices.
Example: "Swap just 3 products to reduce your waste by 40%. Start with these."

TONE BY CONTEXT
Product Descriptions: Educational & Factual
Social Media: Inspirational & Community-Focused
Customer Service: Patient & Supportive

COLORS
Primary Green: #2D5016 - Use for logo, headers, primary CTAs
Accent Gold: #D4AF37 - Use for highlights and secondary CTAs
Background Cream: #FAF7F2 - Use for email and web backgrounds
Text Charcoal: #333333 - Use for body copy

Typography
Headlines: Poppins Bold
Body: Lato Regular, 16px minimum
Special: Courier for product certifications

MESSAGING
Words we love: Sustainable, Circular, Refillable, Certified, Traceable, Transparent
Words we avoid: Eco-friendly (vague), Green (overused), Perfect (we're not), Cheap (quality matters)

KEY MESSAGES
"Sustainable living, simplified. High-quality products that don't cost the earth."

LEGAL
Email footer must include:
Acme Corp
789 Eco Street, Portland, OR 97201
Unsubscribe | Privacy Policy

All Instagram sponsored posts need #ad or #sponsored
```

---

## Extraction Patterns

What counts as "found" for each category:

**Colors**: Hex codes (`#2D5016`), RGB values (`rgb(45,80,22)`) → extractable. Named colors without codes ("green", "blue") → not extractable, ask user for hex.

**Typography**: Named fonts with usage (`Poppins Bold`, `font-family: Lato`) → extractable. Vague references ("nice serif font") → not extractable.

**Brand Voice**: Explicit attributes with definitions ("Authentic: honest about progress") → extractable. Long prose without clear attributes → not extractable.

**Terminology**: Labeled lists ("Words we use: X, Y, Z", "Avoid: A, B, C") → extractable. Terms scattered in prose without labels → not extractable.

---

## Extraction Results

**Claude**:
```
✅ Extraction complete! Here's what I found:

✅ Brand Foundation (3/3 elements):
   - Mission: "Making sustainable living easy and affordable for everyone."
   - Values: Sustainability First, Radical Transparency, Customer Empowerment, Quality Over Quantity

✅ Brand Voice (3/3 attributes):
   - Authentic: Honest about progress, no greenwashing
   - Optimistic: Focus on solutions
   - Empowering: Tools and knowledge for better choices

✅ Brand Tone (3/3 contexts):
   - Product Descriptions: Educational & Factual
   - Social Media: Inspirational & Community-Focused
   - Customer Service: Patient & Supportive

✅ Colors (4/4 colors):
   - Primary: #2D5016 (Primary Green) - logo, headers, CTAs
   - CTA: #D4AF37 (Accent Gold) - highlights, secondary CTAs
   - Background: #FAF7F2 (Background Cream)
   - Text: #333333 (Text Charcoal)

✅ Typography (3/3 fonts):
   - Headings: Poppins Bold
   - Body: Lato Regular (16px min)
   - Special: Courier (certifications)

✅ Approved Terms (6 terms):
   - Sustainable, Circular, Refillable, Certified, Traceable, Transparent

✅ Prohibited Terms (4 terms):
   - Eco-friendly, Green, Perfect, Cheap

✅ Key Messages (1/1):
   - Value Prop: "Sustainable living, simplified. High-quality products that don't cost the earth."

✅ Legal - Email (Complete):
   - Company: Acme Corp
   - Address: 789 Eco Street, Portland, OR 97201
   - Footer: Unsubscribe, Privacy Policy

✅ Legal - Instagram (Complete):
   - Sponsored posts: #ad or #sponsored

⚠️ Missing sections (will ask quick questions):
   - Logo usage rules (no file paths or placement rules found)
   - Imagery guidelines (no photography style mentioned)
   - SMS legal requirements (not mentioned)
   - Accessibility standards (not specified)

Confidence: HIGH (8/12 sections extracted)
```

---

## Fill Missing Sections

**Claude**: "Great! I extracted most of your brand information. Let's quickly fill in the missing sections (should take ~5 minutes)."

### Q1: Logo Usage

**Claude**: "Do you have logo files available?"

**User**: "Not yet, but logo should be minimum 80px, centered in emails"

**Claude**: "Got it. I'll record those usage rules. You can add file paths later."

### Q2: Imagery Style

**Claude**: "What photography or imagery style represents your brand?"

**User**: "Natural, earth-toned product photography. Real homes and people using our products. Avoid staged or overly perfect shots."

### Q3: SMS

**Claude**: "Do you send marketing SMS messages?"

**User**: "No"

**Claude**: "Noted. Skipping SMS requirements."

### Q4: Accessibility

**Claude**: "Do you want to follow WCAG 2.1 AA accessibility standards?"

**User**: "Yes, 4.5:1 contrast minimum"

**Claude**: "Perfect! I'll validate your colors meet that standard."

**Validation check:**
```
Checking contrast ratios...
✅ Primary Green (#2D5016) vs Background Cream (#FAF7F2): 8.2:1 (Pass)
✅ Text Charcoal (#333333) vs Background Cream (#FAF7F2): 11.3:1 (Pass)
✅ Accent Gold (#D4AF37) vs Background Cream (#FAF7F2): 4.6:1 (Pass)

All colors meet WCAG 2.1 AA standards!
```

---

## Generation & Testing

**Claude**: "Generating brand-guidelines.md with extracted + new information..."

✅ File created at: ~/Documents/Brand Guidelines/Acme Corp/brand-guidelines.md

[Open Folder]  [View Guidelines]

**Claude**: "Running completeness check..."

✅ All required sections present
✅ All extracted data incorporated
✅ Missing sections filled

**Claude**: "Now let's test with a sample email ad..."

Sample Email Generated: "New Refillable Shampoo Launch"

**Claude**: "Running brand compliance check..."

Brand Compliance Score: ~92% (Mostly Compliant) ✅

Dimension Breakdown:
- Visual Compliance: 5/5 ✅
- Tone/Voice Compliance: 5/5 ✅
- Messaging Compliance: 5/5 ✅
- Legal Compliance: 5/5 ✅
- Channel Requirements: 4/5 ⚠️ (Logo file paths not provided - can add later)
- Accessibility: 5/5 ✅
- Brand Identity Strength: 4/5 ✅
- Guideline Adherence: 4/5 ✅

---

## Completion

**Claude**:
```
✅ Your brand guidelines are ready!

Extraction Summary:
- Extracted: 8/12 sections automatically
- Quick questions: 4 sections (4 minutes)
- Total time: ~5 minutes (vs 15 minutes from scratch)

Sample email ad scored: ~92% (Mostly Compliant)

📁 Saved to: ~/Documents/Brand Guidelines/Acme Corp/brand-guidelines.md

[Open Folder]  [View Guidelines]

Your brand folder contains:
✓ brand-guidelines.md
✓ logos/ folder (for logo files)
✓ assets/ folder (for fonts, images)

You can now:
- Generate brand-compliant ads: "Create email ads for new shampoo launch"
- Validate existing content: "Review this Instagram post for brand compliance"

To add logo files later: "Update my brand guidelines - add logo files"

---

**💡 What's Next?**

Your brand guidelines are now saved and ready to use! All creative skills will automatically reference these guidelines:
- Generate ads: "Create email ads for product launch"
- Review content: "Check this Instagram post for brand compliance"
- Multi-channel campaigns: "Create multi-channel campaign for summer sale"

No need to re-run this wizard unless creating guidelines for a different brand.
```

