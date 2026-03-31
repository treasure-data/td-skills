---
name: brand-compliance
description: Review creative content for brand guideline compliance across visual identity, messaging, tone, legal requirements, and accessibility. Use when validating email/SMS/Instagram ads against brand standards. Analyzes content against user-provided guidelines and generates 8-dimension compliance scoring with visual dashboard.
---

# Brand Compliance

Ensure your creative content follows brand guidelines across visual identity, messaging, tone/voice, legal requirements, and accessibility standards.

## How to Provide Brand Guidelines

Provide your brand guidelines in any format (markdown, inline text, file path). The skill adapts to your structure.

### Don't Have Brand Guidelines Yet?

If you don't have brand guidelines set up, use the **brand-onboarding skill** first:

```
"Set up brand guidelines for my company"
```

The interactive wizard takes ~15 minutes (or ~5 minutes if you have existing docs to paste) and creates comprehensive brand guidelines that all creative skills will automatically use.

**Why set up guidelines first:**
- Consistent branding across all campaigns
- Automatic legal compliance (CAN-SPAM, TCPA, FTC)
- One-time setup, reused forever
- Higher compliance scores on all content

**Quick start:** Say "Set up brand guidelines" to begin the onboarding wizard.

### About Reference Files

**Important note**: The Acme Corp examples in `references/` are for **structural learning only**. Do not use these example files as actual brand guidelines for user content.

**Always require user-provided guidelines:**
- User must explicitly provide their own brand guidelines (file path, inline text, or from project root)
- Reference files are examples showing what a complete guideline document looks like
- Using example guidelines on real user content would apply the wrong brand (Acme Corp) to their campaigns

**To see the example structure**: Users can view [`examples/acme-corp-brand-guidelines.md`](examples/acme-corp-brand-guidelines.md) to understand the format, but this should never be used for actual compliance reviews without explicit user request to "show me an example."

### Option 1: File Path

"Review this email using brand guidelines at `/path/to/brand-guidelines.md`"

### Option 2: Inline Guidelines

```markdown
Review this email using these brand guidelines:

**Brand Voice**: Knowledgeable, Enthusiastic, Respectful
**Brand Tone (Product Specs)**: Precise & Functional
**Colors**: #1B3022 (primary), #B35D33 (CTA), #F5F2ED (background)
**Fonts**: Montserrat (headings), Roboto (body)
**Approved Terms**: Circular, PFC-Free, Traceable, Backcountry
**Prohibited Terms**: Eco-friendly, Green, Insane, Epic, Life-changing
```

**Example**: For a complete brand guidelines reference structure, see [`examples/acme-corp-brand-guidelines.md`](examples/acme-corp-brand-guidelines.md) (example only - do not use for actual reviews).

**Note**: If brand guidelines aren't provided, Claude will:
1. Check for `brand-guidelines.md` in your project root (auto-detect)
2. If not found, suggest using **brand-onboarding skill** to create them
3. Offer to proceed with inline guidelines for one-time use

### Common Brand Guideline Elements

The skill looks for these elements in your guidelines:

1. **Visual Identity**:
   - Colors (hex codes): Primary, secondary, CTA, background
   - Typography: Heading fonts, body fonts, weights, sizes
   - Logos: Usage rules, sizing, placement, backgrounds
   - Imagery: Style guidelines, photography rules, authenticity requirements

2. **Messaging & Voice**:
   - Brand voice attributes (constant): E.g., "Knowledgeable, Enthusiastic, Respectful"
   - Brand tone (variable by context): E.g., Product Specs = "Precise & Functional", Social Media = "Inspirational"
   - Approved terminology: Power words to use
   - Prohibited terms: Words/phrases to avoid
   - Key messages: Core value propositions, taglines, signatures

3. **Legal & Compliance**:
   - Required disclaimers (CAN-SPAM footer, TCPA opt-out, FTC disclosures)
   - Claims substantiation requirements
   - Privacy policy requirements
   - Industry-specific regulations

4. **Channel-Specific**:
   - Email: Footer requirements, subject line guidelines, responsive design
   - SMS: Character limits, opt-out language, frequency caps
   - Instagram: Disclosure requirements, character limits, CTA buttons

5. **Accessibility**:
   - WCAG 2.1 AA requirements (4.5:1 contrast minimum)
   - Alt text requirements
   - Minimum font sizes (16px mobile)
   - Reading level targets

---

## Compliance Review Workflow

### Step 1: Provide Content and Guidelines

Provide the creative content to review and your brand guidelines:

```
Review this email HTML for brand compliance:

[Email HTML code]

Using these brand guidelines:
[Brand guidelines file path or inline guidelines]
```

### Step 2: Analysis

Claude analyzes your content against **8 compliance dimensions** (0-5 points each, max 40):

1. **Visual Compliance** (0-5): Colors, typography, logos, imagery style
2. **Tone/Voice Compliance** (0-5): Brand voice attributes, contextual tone appropriateness
3. **Messaging Compliance** (0-5): Approved terminology usage, prohibited terms avoided
4. **Legal Compliance** (0-5): Required disclaimers, regulatory requirements, claims substantiation
5. **Channel Requirements** (0-5): Email/SMS/Instagram best practices and platform specs
6. **Accessibility** (0-5): WCAG 2.1 AA compliance (contrast, alt text, font sizes)
7. **Brand Identity Strength** (0-5): Recognizability, brand presence, consistency
8. **Guideline Adherence** (0-5): Overall compliance with all documented guidelines

**Compliance Tiers**:
- **38-40 points**: Fully Compliant (green) - Ready to launch
- **32-37 points**: Mostly Compliant (amber) - Minor fixes needed
- **24-31 points**: Partially Compliant (orange) - Significant issues
- **0-23 points**: Non-Compliant (red) - Major revision required

For detailed scoring criteria, see [`references/compliance-scoring.md`](references/compliance-scoring.md).

### Step 3: Visual Compliance Dashboard

Receive a color-coded compliance dashboard showing:

**Overall Score**: Large centered score with tier indicator (Fully/Mostly/Partially/Non-Compliant)

**Dimension Breakdown**: Progress bars for each of 8 dimensions with individual scores

**Violations Section** (collapsible):
- Specific violations identified
- Location in content (e.g., "Email footer", "CTA button", "Headline")
- Exact fix recommendations with code changes

**Recommendations Section** (collapsible):
- Prioritized fixes (Critical → High → Medium → Low)
- Specific replacements (e.g., "#FF0000 → #B35D33", "eco-friendly → circular")
- Projected score after fixes

**Example Output**:
```
Brand Compliance Score: 28/40
Tier: Partially Compliant
Violations Found (5):
1. Visual - Wrong CTA color (#FF0000 instead of #B35D33)
   Fix: Change background:#FF0000 to background:#B35D33

2. Messaging - Prohibited term "eco-friendly"
   Fix: Replace with "circular-material" or "PFC-free"

3. Legal - Missing CAN-SPAM footer
   Fix: Add unsubscribe link and physical address
```

---

## Output Format

All compliance dashboards use **inline CSS** with:
- Color-coded tier borders (green/amber/orange/red)
- Progress bars for dimension scores
- Collapsible `<details>` sections for violations and recommendations
- WCAG 2.1 AA compliant contrast ratios
- Mobile-responsive design

**Dashboard Components**:
1. Overall score header (48px score, tier label, progress bar)
2. Dimension breakdown table (8 rows with scores and bars)
3. Violations list (collapsible, grouped by dimension)
4. Recommendations list (collapsible, prioritized by severity)
5. Next steps banner

For visual templates, see [`references/compliance-scoring.md`](references/compliance-scoring.md#visual-score-presentation).

---

## Common Violations

### Visual Violations
- **Wrong colors**: Using non-brand colors (e.g., #FF0000 instead of brand CTA color)
- **Wrong fonts**: Arial instead of brand fonts
- **Logo misuse**: Too small, distorted, wrong background

### Messaging Violations
- **Prohibited terminology**: Using banned words from lexicon
- **Wrong tone**: Inspirational tone for product specs (should be precise/functional)
- **Hyperbole**: "Life-changing", "insane", "epic" instead of factual specs

### Legal Violations
- **Missing CAN-SPAM footer**: No unsubscribe link or physical address (Email)
- **Missing TCPA opt-out**: No "Text STOP to unsubscribe" (SMS)
- **Unsubstantiated claims**: Saying "100% sustainable" without certification

### Accessibility Violations
- **Low contrast**: Text fails 4.5:1 contrast ratio
- **Missing alt text**: Images without descriptive alt attributes
- **Small fonts**: Body text < 16px on mobile

For detailed violation examples with before/after fixes, see [`references/violation-examples.md`](references/violation-examples.md).

---

## Integration with Multi-Channel Ad Ideation

When creating ads with the multi-channel-ad-ideation skill, you can provide brand guidelines to ensure generated content is compliant from the start:

```
Create email ads for hiking boot launch using brand guidelines at /path/to/brand.md
```

**How It Works**:

1. **Creative Direction Phase**: Directions filtered to match brand tone/voice
2. **Text Concept Phase**: Uses approved terminology, avoids prohibited terms
3. **HTML Preview Phase**: Applies brand colors, fonts, and visual guidelines
4. **Quality Scoring**: Brief Alignment dimension includes brand guideline adherence

**Benefits**:
- Ensures brand compliance during ideation (not just after-the-fact review)
- Saves time by catching violations early
- Generates on-brand concepts automatically
- Reduces revision cycles

For details, see the "Using Brand Guidelines" section in the multi-channel-ad-ideation skill.

---

## Best Practices

**Define guidelines early**: Document brand standards before creating campaigns

**Review at every stage**: Check compliance during ideation, not just at the end

**Be specific with guidelines**: Use exact hex codes, font names, and terminology lists

**Include context-specific tone**: Specify tone for Product Specs, Social Media, Sustainability, etc.

**Document prohibited terms**: Explicitly list words/phrases to avoid

**Verify legal requirements**: Ensure all channel-specific legal disclaimers are defined

**Test accessibility**: Check all guidelines meet WCAG 2.1 AA standards (4.5:1 contrast)

**Update guidelines regularly**: Keep brand standards current as brand evolves

---

## Example Workflow

### Scenario: Review Email for Acme Corp

**User**: "Review this email for brand compliance using Acme Corp guidelines at `./outdoor-supply-brand.md`"

**Claude**:
1. Reads brand guidelines (voice, tone, colors, fonts, lexicon, legal requirements)
2. Analyzes email HTML against 8 dimensions
3. Identifies violations:
   - Visual: Arial font (should be Roboto), Red CTA (should be Burnt Ochre #B35D33)
   - Messaging: Uses "eco-friendly" (prohibited) instead of "circular" (approved)
   - Legal: Missing CAN-SPAM footer
   - Tone: Too casual for product specs context
4. Calculates score: 28/40 (Partially Compliant)
5. Generates visual dashboard with color-coded violations
6. Provides specific fixes with code changes

**Result**: Email gets 28/40 with clear action items to reach 40/40 (Fully Compliant)

For complete workflow example, see [`examples/review-workflow.md`](examples/review-workflow.md).

---

## Related Skills

- **brand-onboarding skill**: Create comprehensive brand guidelines through interactive wizard. Use this FIRST if you don't have brand guidelines yet (~15 min setup).
- **multi-channel-ad-ideation skill**: Generate ads that can be validated for compliance. Automatically applies brand guidelines when provided during ideation.
- **email skill**: Email concepts that can be compliance-checked against brand standards.
- **instagram skill**: Instagram ads that need brand validation before launch.
- **sms skill**: SMS campaigns that require brand and legal compliance review.

---

## Summary

The brand compliance skill ensures all creative content aligns with your brand guidelines before launch:

**Use it to**:
- Validate email/SMS/Instagram ads against brand standards
- Identify specific violations with exact locations and fixes
- Score compliance across 8 dimensions (visual, tone, messaging, legal, channel, accessibility, identity, adherence)
- Generate visual dashboards with color-coded tier indicators
- Integrate brand guidelines into creative ideation workflows

**Key Features**:
- Adapts to any brand guideline format (markdown, inline, file path)
- 8-dimension compliance scoring (0-40 points)
- Visual dashboards with inline CSS (WCAG 2.1 AA compliant)
- Specific violation identification with actionable fixes
- Integration with multi-channel-ad-ideation for proactive compliance

**Compliance Tiers**:
- **Fully Compliant (38-40)**: Ready to launch
- **Mostly Compliant (32-37)**: Minor fixes needed
- **Partially Compliant (24-31)**: Significant issues to address
- **Non-Compliant (0-23)**: Major revision required

For detailed scoring criteria and violation examples, reference the supporting documentation in `references/` and `examples/`.
