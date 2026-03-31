---
name: brand-onboarding
description: Interactive wizard to create comprehensive brand guidelines for your company. Set up brand colors, fonts, voice, messaging, legal requirements, and accessibility standards. Use when setting up brand guidelines, creating brand standards, or configuring brand compliance. One-time 15-minute setup enables all creative skills.
---

> **One-Time Setup**
> This onboarding wizard is a **one-time setup** to create your brand guidelines. Once completed, your brand standards will be saved and automatically referenced by all creative skills. You won't need to run this wizard again unless you're creating guidelines for a different brand.

# Brand Guidelines Onboarding

Create comprehensive brand guidelines through an interactive wizard that captures your brand's visual identity, voice, messaging, legal requirements, and accessibility standards.

## What This Skill Creates

### Output File

**Location**: `~/Documents/Brand Guidelines/{Company Name}/brand-guidelines.md`

The wizard generates a comprehensive brand guidelines document with:

1. **Brand Mission & Philosophy**: Values and core brand personality
2. **Brand Voice**: Constant attributes (Knowledgeable, Enthusiastic, etc.)
3. **Brand Tone**: Variable by context (Product Specs, Social Media, etc.)
4. **Visual Identity**: Colors, typography, logo usage, imagery style
5. **Messaging & Lexicon**: Approved terminology and prohibited terms
6. **Legal Requirements**: Channel-specific legal disclaimers (CAN-SPAM, TCPA, FTC)
7. **Accessibility Standards**: WCAG 2.1 AA compliance preferences
8. **Compliance Checklist**: Validation criteria for all content

### How Other Skills Use It

Once created, the `brand-guidelines.md` file is automatically used by:
- **brand-compliance**: Validates content against your brand standards
- **multi-channel-ad-ideation**: Generates on-brand email/SMS/Instagram ads
- **email-ad-ideation**: Creates brand-compliant email campaigns
- **instagram-ad-ideation**: Generates Instagram posts with your brand identity
- **sms-ad-ideation**: Creates SMS campaigns following your brand voice

**One-time setup**: Guidelines persist across all sessions and projects.

### Brand Folder Structure

Your brand guidelines are organized in a dedicated, easy-to-find location:

```
~/Documents/Brand Guidelines/{Company Name}/
  ├── brand-guidelines.md          # Main guidelines file
  ├── logos/                       # Logo files
  │   ├── logo-dark.png           # For light backgrounds
  │   └── logo-light.png          # For dark backgrounds
  └── assets/                      # Future brand assets (fonts, images)
```

**Benefits**:
- **Easy to find**: Documents folder is familiar to all users
- **Well-organized**: Each brand has its own folder
- **Portable**: Zip and share the entire brand package
- **Asset management**: Keep logos and brand files together

When brand files are created, you'll receive clickable **[Open Folder]** and **[View Guidelines]** links to easily access your brand materials.

---

## Onboarding Workflow: Two-Phase Approach

The wizard uses a two-phase approach to reduce overwhelm and let you start quickly:

**Phase 1: Core Branding (Required - ~8 minutes)**
- Get functional brand guidelines fast
- Start using creative skills immediately
- Score: ~28/40 (functional)

**Phase 2: Comprehensive Enhancement (Optional - ~7 minutes)**
- Add messaging, legal, accessibility standards
- Production-ready compliance
- Score: 35-40/40 (fully compliant)

After Phase 1, you choose: start using now or enhance with Phase 2.

---

## Phase 1: Core Branding (~8 minutes)

### Step 1: Choose Your Path

The wizard starts by asking how you want to provide brand information:

```
"Let's set up your brand guidelines! Do you have existing brand documentation?"

Options:
1. Paste brand document text (Recommended for fastest setup)
   → 5-minute setup if you have existing docs

2. Provide file path or URL to brand document
   → Auto-extract from PDFs, websites, Notion, Confluence

3. Start from scratch with guided questions
   → 15-minute wizard asks all questions step-by-step
```

**Path A: Paste Text Extraction** (Fastest - ~5 minutes)
- Paste your existing brand guidelines, style guide, or brand deck text
- Claude automatically extracts:
  - Colors (hex codes, rgb values, color names)
  - Fonts (font-family names, weights, sizes)
  - Brand voice/tone (personality descriptors)
  - Approved/prohibited terminology (word lists)
  - Legal requirements (footer templates, disclaimers)
- Wizard pre-fills extracted data
- You only answer questions for MISSING sections

**Path B: File/URL Extraction**
- Provide file path (e.g., `./brand-deck.pdf`) or URL (e.g., `https://acme.com/brand`)
- Claude reads file or fetches URL content
- Same extraction logic as Path A
- Review and confirm extracted data

**Path C: Guided Wizard** (From Scratch - ~15 minutes)
- No existing documentation needed
- Claude asks all questions step-by-step
- Interactive guidance with examples
- Perfect for new brands or brand refreshes

---

### Step 2: Brand Foundation
Collect company name, mission (1-2 sentences), and 3-5 core values.

### Step 3: Brand Voice (Constant)
Define 2-4 personality attributes (e.g., "Knowledgeable, Enthusiastic, Respectful") with definitions and examples for each.

### Step 4: Brand Tone (Variable by Context)
Specify how tone adapts by context (Product Specs, Social Media, Support, etc.).

### Steps 5-8: Visual Identity
- **Colors**: Primary, CTA, background (hex codes with usage rules). Claude validates 4.5:1 contrast.
- **Typography**: Heading font, body font, optional special fonts (with stacks, weights, sizes)
- **Logo**: Provide file paths or URLs. Files are copied to your brand folder for safekeeping. Creates placeholder if not available yet.
- **Imagery**: Photography style, authenticity, lighting preferences

**See**: [wizard-questions.md](references/wizard-questions.md) for complete question details and examples.

---

## After Phase 1: Choice Point

After completing Phase 1 questions, you'll see:

```
Core brand guidelines created! (Score: ~28/40)

Phase 1 covers visual and voice. Phase 2 adds Messaging, Legal & Accessibility compliance for production-ready content (38/40).

What would you like to do?
1. Start using now (can enhance later)
2. Continue to Phase 2 (~7 min) [Recommended for production]

Choice: ___
```

**If you choose "Start using now":**
- Guidelines saved with Sections 1-4 complete
- Sections 5-7 marked as "Optional - not configured"
- You can use creative skills immediately
- Claude will suggest Phase 2 later when helpful

**If you choose "Continue to Phase 2":**
- Phase 2 questions (~7 minutes)
- Complete all sections for 35-40/40 score

---

## Phase 2: Comprehensive Enhancement (~7 minutes)

### Steps 9-11: Messaging Standards
- **Approved terms** (5+ min): Power words/phrases to USE (action words, industry terms, value words)
- **Prohibited terms** (3+ min): Words/phrases to AVOID (vague claims, slang, hyperbole, jargon)
- **Key messages**: Value proposition, sustainability message, customer promise, brand tagline

### Steps 12-14: Legal Requirements
- **Email**: CAN-SPAM footer (company name, physical address, unsubscribe link, privacy policy)
- **SMS**: TCPA opt-out ("Text STOP to unsubscribe"), help language, frequency disclosure
- **Instagram**: FTC disclosures (#ad, #sponsored for sponsored posts/affiliate links)

### Step 15: Accessibility Standards
WCAG 2.1 AA compliance: color contrast (4.5:1), alt text requirement, min font size (16px), reading level target.

**See**: [wizard-questions.md](references/wizard-questions.md) for complete Phase 2 questions and examples.

---

### Step 16: Generate, Validate & Test

Different validation based on which phase(s) completed:

**After Phase 1 Only:**

**1. Generate File**
- Create `brand-guidelines.md` with Sections 1-4 complete
- Sections 5-7 marked as "Optional - not configured"

**2. Quick Validation**
- Brand voice defined (2-4 attributes)
- At least 2 brand colors with hex codes
- Typography defined (heading + body fonts)
- At least 1 contextual tone defined

**3. Quick Test**
- Generate mini sample email ad
- Run quick compliance check
- Expected score: 25-30/40 (Functional)

**4. Success Message**
```
Core brand guidelines created!

Sample ad scored: 28/40 (Functional)

📁 Saved to: ~/Documents/Brand Guidelines/{Company Name}/brand-guidelines.md

[Open Folder]  [View Guidelines]

Your brand folder contains:
-brand-guidelines.md
-logos/ folder (for logo files)

You can now start using creative skills!

To make guidelines comprehensive later:
- Say: "Complete my brand guidelines"
- Or: "Add legal compliance to my brand guidelines"

---

**What's Next?**

Your brand guidelines are now saved and ready to use! All creative skills will automatically reference these guidelines:
- Generate ads: "Create email ads for product launch"
- Review content: "Check this Instagram post for brand compliance"
- Multi-channel campaigns: "Create multi-channel campaign for summer sale"

No need to re-run this wizard unless creating guidelines for a different brand.
```

**After Phase 1 + Phase 2:**

**1. Generate/Update File**
- Update `brand-guidelines.md` with all 8 sections complete

**2. Full Validation**
- All Phase 1 elements
- Approved terminology list (min 5 terms)
- Prohibited terms list (min 3 terms)
- At least one legal requirement
- Accessibility standards defined

**3. Comprehensive Test**
- Generate comprehensive sample email ad
- Run full brand-compliance check
- Target score: 35+/40 (Mostly/Fully Compliant)

**4. Refinement Loop** (if needed)
- If sample scores < 35/40: "Let's improve your guidelines"
- Identify missing/weak sections
- Ask follow-up questions
- Re-test until 35+/40

**5. Success Confirmation**
```
Comprehensive brand guidelines complete!

Sample ad scored: 38/40 (Fully Compliant)

Your guidelines now include:
-Core branding (voice, tone, visual identity)
-Messaging standards (approved/prohibited terms)
-Legal compliance (CAN-SPAM, TCPA, FTC)
-Accessibility standards (WCAG 2.1 AA)

📁 Saved to: ~/Documents/Brand Guidelines/{Company Name}/brand-guidelines.md

[Open Folder]  [View Guidelines]

Your brand folder contains:
-brand-guidelines.md
-logos/ folder
-assets/ folder

You can now create fully compliant branded content!

To update guidelines: "Update my brand guidelines"

---

**What's Next?**

Your brand guidelines are now saved and ready to use! All creative skills will automatically reference these guidelines:
- Generate ads: "Create email ads for product launch"
- Review content: "Check this Instagram post for brand compliance"
- Multi-channel campaigns: "Create multi-channel campaign for summer sale"

No need to re-run this wizard unless creating guidelines for a different brand.
```

**See**: [extraction-from-docs.md](examples/extraction-from-docs.md) for text extraction patterns, confidence levels, and time savings examples.

---

## Common Usage Patterns

- **Quick Start (Phase 1 only)**: 8-minute setup → functional guidelines (28/40 score)
- **Comprehensive (Phase 1+2)**: 16-minute setup → production-ready (38/40 score)
- **Text Extraction**: 5-8 minutes with existing docs (auto-fills wizard questions)
- **Enhance Later**: Add Phase 2 to existing Phase 1 guidelines anytime
- **Update Existing**: Modify specific elements (colors, fonts, voice) as needed

**See**: [sample-wizard-session.md](examples/sample-wizard-session.md) for detailed usage examples and full wizard sessions.

---

## Integration with Other Skills

**brand-compliance**: Suggests brand-onboarding if guidelines missing when reviewing content.

**multi-channel-ad-ideation**: Recommends setup before generating ads for consistent branding and legal compliance.

All creative skills auto-detect `brand-guidelines.md` in project root and use it automatically.

---

## Best Practices

**Have existing docs ready**: If you have brand guidelines, style guides, or brand decks, paste them to save time

**Be specific with colors**: Use exact hex codes, not just color names ("Blue" vs "#0066CC")

**Define tone by context**: Different contexts need different tones (Product Specs ≠ Social Media)

**List prohibited terms**: Explicitly list words to avoid (prevents future violations)

**Include legal requirements**: Ensure all channel-specific disclaimers are defined

**Test accessibility**: Verify colors meet 4.5:1 contrast ratio

**Validate with sample**: Let the wizard test with a sample ad to catch gaps

---

## Troubleshooting

**Low score (< 35/40)**: Wizard identifies missing sections and asks follow-up questions (common: CTA color, prohibited terms, legal footer).

**Extraction didn't find my colors**: Colors need hex codes, not just names. Wizard asks for missing colors manually.

**No logo files yet**: Record usage rules without file paths. Add paths later when ready.

**Multiple brands**: Create separate project directories, each with its own brand-guidelines.md.

---

## What's Next

After onboarding completes:

**Immediate actions**:
1. Guidelines saved to project root
2. Validated with sample ad (35+/40 score)
3. Ready for all creative skills

**Use your guidelines**:
- "Create email ads for product launch" → Uses your brand automatically
- "Review this Instagram post for brand compliance" → Checks against your standards
- "Generate SMS campaign for sale" → Applies your voice and legal requirements

**Update later**:
- "Update my brand CTA color to #FF6B35"
- "Add 'sustainable' to prohibited terms"
- "Change brand voice to Professional, Bold, Transparent"

---

## Related Skills

- **brand-compliance skill**: Validate content against brand guidelines (requires onboarding first)
- **multi-channel-ad-ideation skill**: Generate branded ads using your guidelines
- **email skill**: Create brand-compliant email campaigns
- **instagram skill**: Generate Instagram posts with your brand identity
- **sms skill**: Create SMS campaigns following your brand voice

---

## Summary

**brand-onboarding skill**: Interactive wizard to create brand guidelines with flexible two-phase approach.

**Two-Phase Approach**:
- **Phase 1 (Core - ~8 min)**: Get functional guidelines fast (28/40 score)
- **Phase 2 (Enhancement - ~7 min)**: Add comprehensive compliance (38/40 score)
- **Choice point**: Decide after Phase 1 whether to continue or start using

**Setup time**:
- Quick start (Phase 1 only): ~8 minutes → 28/40 score
- Comprehensive (Phase 1 + 2): ~16 minutes → 38/40 score
- With text extraction: ~5-8 minutes (pre-fills both phases)

**Output**: `brand-guidelines.md` in project root with up to 8 sections

**Flexibility**:
- Start using immediately after Phase 1
- Enhance with Phase 2 anytime later
- Lower barrier to entry, progressive enhancement

**Validation**: Tests with sample ad, validates based on phase completion

**Integration**: All creative skills auto-detect and use guidelines

**Paths**: Paste text (fastest), file/URL extraction, or guided wizard

**One-time setup**: Guidelines persist across all sessions and projects
