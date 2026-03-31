# Brand Guidelines Validation Checklist

Comprehensive validation criteria for brand guidelines completeness and quality. Validation differs based on whether user completed Phase 1 only or Phase 1 + Phase 2.

---

# TWO-PHASE VALIDATION APPROACH

## Phase 1 Validation (Core Branding Only)

**When to use**: User chose "Start using now" after Phase 1 questions

**Expected outcome**: Functional guidelines with score ~25-30/40

### Required Elements (Phase 1)

Run through this checklist for Phase 1-only guidelines:

Run through this checklist immediately after generating brand-guidelines.md:

#### ✅ Brand Foundation
- [ ] Company name present
- [ ] Brand mission defined (1-2 sentences)
- [ ] Core values listed (3-5 values)

#### ✅ Brand Voice
- [ ] Voice attributes defined (2-4 words)
- [ ] Each voice attribute has:
  - [ ] Definition ("What it means")
  - [ ] Language style description
  - [ ] Example content
  - [ ] Counter-example ("Not this")

#### ✅ Brand Tone
- [ ] At least 1 contextual tone defined
- [ ] Each tone has:
  - [ ] Context name
  - [ ] Tone descriptor
  - [ ] When to use
  - [ ] Example
  - [ ] What to avoid

**Recommended**: 2-4 contextual tones for comprehensive coverage

#### ✅ Visual Identity - Colors
- [ ] Primary brand color defined with:
  - [ ] Valid hex code (#RRGGBB format)
  - [ ] Color name (optional but recommended)
  - [ ] Usage rules
  - [ ] Restrictions ("when NOT to use")

- [ ] CTA color defined with:
  - [ ] Valid hex code (must differ from primary)
  - [ ] Color name
  - [ ] Exclusive CTA usage noted

- [ ] Background color defined with:
  - [ ] Valid hex code
  - [ ] Usage rules

**Accessibility check**: CTA color has 4.5:1 contrast against background
- If fails: Flag for user review/adjustment

#### ✅ Visual Identity - Typography
- [ ] Heading font defined with:
  - [ ] Font name
  - [ ] Font stack (optional but recommended)
  - [ ] Weights/usage

- [ ] Body font defined with:
  - [ ] Font name
  - [ ] Font stack (optional)
  - [ ] Minimum size (should be >= 16px)
  - [ ] Line height (should be 1.3-2.0)

#### ✅ Visual Identity - Logo
- [ ] Logo usage rules defined OR
- [ ] Note "Files not yet available" recorded

#### ✅ Visual Identity - Imagery
- [ ] Photography/imagery style described
- [ ] Authenticity guidelines provided (optional)
- [ ] Lighting preferences specified (optional)

**Phase 1 Validation Result**:
- All checkboxes above must be checked ✅
- Expected score: 25-30/40 (Functional)
- Sections 1-4 complete, Sections 5-7 marked as "Optional - not configured"
- Guidelines are functional but NOT production-ready (missing Messaging, Legal, Accessibility)

**If Phase 1 validation passes:**
- Guidelines are ready for immediate use
- User can enhance with Phase 2 later
- Creative skills will work with reduced compliance

---

## Phase 2 Validation (Comprehensive)

**When to use**: User completed both Phase 1 and Phase 2 questions

**Expected outcome**: Production-ready guidelines with score 35-40/40

### Required Elements (Phase 1 + Phase 2)

All Phase 1 elements PLUS:

#### ✅ Messaging & Lexicon
- [ ] Approved terminology list present
  - [ ] Minimum 5 terms required
  - [ ] Categorized (optional but recommended)

- [ ] Prohibited terms list present
  - [ ] Minimum 3 terms required
  - [ ] Categorized by type (optional)

- [ ] Primary value proposition defined (1-2 sentences)

#### ✅ Legal Requirements
- [ ] At least ONE channel legal requirement defined:
  - [ ] Email: CAN-SPAM footer (if sending marketing emails)
  - [ ] SMS: TCPA opt-out (if sending marketing SMS)
  - [ ] Instagram: FTC disclosure (if running sponsored posts)

#### ✅ Accessibility Standards
- [ ] WCAG compliance level specified (AA recommended)
- [ ] Color contrast ratio minimum defined
- [ ] Alt text requirement specified
- [ ] Minimum font size specified

**Phase 2 Validation Result**:
- All Phase 1 + Phase 2 checkboxes must be checked ✅
- Expected score: 35-40/40 (Mostly/Fully Compliant)
- All 8 sections complete
- Production-ready with full compliance

---

## Quality Check (Applies to Both Phases)

### Quality Criteria

After completeness check, assess quality:

#### Brand Voice Quality
**Good**:
- Voice attributes are specific and distinct
- Each attribute has clear definition with concrete example
- Voice reflects actual brand personality (not generic)

**Poor**:
- Generic attributes ("Good", "Nice", "Helpful")
- Vague definitions without examples
- Too many attributes (>4) dilutes identity

**Example Good**:
```
Knowledgeable:
- What it means: Experts in gear, technique, and environment
- Example: "Engineered with bluesign® certified nylon and 100% recycled polyester fill"
```

**Example Poor**:
```
Professional:
- What it means: We are professional
- Example: "We do good work"
```

#### Color Quality
**Good**:
- Specific hex codes provided (not just "blue")
- Usage context clearly defined
- CTA color reserved exclusively for CTAs
- Contrast ratios meet accessibility standards

**Poor**:
- Vague color names without hex codes
- No usage rules or restrictions
- CTA color used for multiple purposes
- Poor contrast (< 4.5:1)

#### Typography Quality
**Good**:
- Real font names (not just "serif" or "sans-serif")
- Font stacks with fallbacks
- Minimum sizes meet accessibility (>= 16px)
- Line heights support readability (1.5-1.8)

**Poor**:
- Generic font families only
- No fallbacks specified
- Font sizes too small (< 14px)
- Line heights too tight (< 1.3)

#### Messaging Quality
**Good**:
- Approved terms are specific to brand/industry
- Prohibited terms reflect actual brand standards
- Clear categories for organization
- Adequate coverage (5+ approved, 3+ prohibited)

**Poor**:
- Generic approved terms anyone could use
- No prohibited terms or too few (<3)
- No organization or categories
- Overlapping or contradictory terms

---

## Testing with Sample Content (Phase-Specific)

### Test Strategy

Test approach differs based on which phase(s) completed:

---

### Phase 1 Testing (Quick Test)

**When**: User chose "Start using now" after Phase 1

**Goal**: Verify functional guidelines work with creative skills

#### Step 1: Generate Mini Sample Email

**Template**:
```
Generate a simple email ad for {Company Name} promoting {generic product}.

Requirements (Phase 1 only):
- Use brand colors from guidelines
- Apply brand voice
- Include CTA button with brand CTA color
- Use heading and body fonts

Note: Skip messaging terminology, legal footer, and accessibility checks (Phase 2 elements)
```

#### Step 2: Quick Compliance Check

Run quick brand-compliance check focusing on Phase 1 elements:
```
Review this sample email for Phase 1 brand compliance:
- Visual (colors, fonts)
- Voice/Tone
- Basic brand identity
```

#### Step 3: Phase 1 Score Interpretation

**Expected Score**: 25-30/40 (Functional)

**Score Ranges**:
- **28-30**: Good Phase 1 ✅
  - Core branding elements work well
  - Ready for immediate use
  - Can enhance with Phase 2 later

- **25-27**: Acceptable Phase 1 ⚠️
  - Some minor gaps in Phase 1 elements
  - Still usable
  - Consider quick fixes or proceed

- **< 25**: Phase 1 Issues ❌
  - Missing critical Phase 1 elements
  - Re-check voice, colors, fonts
  - Ask follow-up questions

---

### Phase 2 Testing (Comprehensive Test)

**When**: User completed both Phase 1 and Phase 2

**Goal**: Verify production-ready guidelines with full compliance

#### Step 1: Generate Comprehensive Sample Email

**Template**:
```
Generate a comprehensive email ad for {Company Name} promoting {generic product}.

Requirements (Phase 1 + Phase 2):
- Use brand colors from guidelines
- Apply brand voice and tone (Product Specs context)
- Include CTA button
- Use approved terminology
- Avoid prohibited terms
- Include legal footer (CAN-SPAM)
- Meet accessibility standards (contrast, alt text, font sizes)

Product: {Generic product relevant to brand}
Example: "New waterproof hiking jacket" (Outdoor brand)
Example: "Analytics dashboard update" (Tech brand)
```

#### Step 2: Full Brand Compliance Check

Run full brand-compliance skill:
```
Review this sample email for brand compliance using the brand guidelines at ./brand-guidelines.md
```

#### Step 3: Phase 2 Score Interpretation

**Target Score**: 35+/40 (Mostly/Fully Compliant)

**Score Ranges**:
- **38-40**: Fully Compliant ✅
  - Guidelines are comprehensive and usable
  - Ready for production use
  - Proceed to completion

- **35-37**: Mostly Compliant ⚠️
  - Minor gaps in guidelines
  - Identify specific missing elements
  - Offer quick fixes
  - Example: "CTA button color not specified - let's add that"

- **28-34**: Partially Compliant ⚠️
  - Significant gaps in Phase 2 elements
  - Multiple sections need enhancement
  - Enter refinement loop
  - Example: "Missing prohibited terms list or legal footer"

- **< 28**: Issues ❌
  - Major problems with guidelines
  - Check both Phase 1 and Phase 2 elements
  - Recommend refinement or starting over

#### Step 4: Gap Analysis

For scores < 35, identify which dimensions scored low:

**Low Visual Compliance** (0-2/5):
- Missing: CTA color, font specifications, logo rules
- Action: Ask follow-up questions for visual identity

**Low Tone/Voice Compliance** (0-2/5):
- Missing: Voice definitions, contextual tone guidelines
- Action: Refine voice attributes with examples

**Low Messaging Compliance** (0-2/5):
- Missing: Approved/prohibited terms, key messages
- Action: Expand terminology lists

**Low Legal Compliance** (0-2/5):
- Missing: Email footer, SMS opt-out, FTC disclosures
- Action: Add channel-specific legal requirements

**Low Accessibility** (0-2/5):
- Missing: Contrast specifications, alt text rules, font sizes
- Action: Define accessibility standards

---

## Validation Phase 4: Iterative Refinement

### Refinement Loop

If initial test score < 35/40:

#### Step 1: Identify Gaps
```
Sample email scored 28/40. Here's what's missing:

❌ Visual Compliance: 2/5
   - CTA color not defined
   - Logo usage rules missing

❌ Legal Compliance: 2/5
   - Email footer incomplete (missing physical address)

⚠️ Messaging Compliance: 3/5
   - Only 3 approved terms (recommend minimum 5)
```

#### Step 2: Ask Targeted Follow-Up Questions

**For each gap, ask specific questions**:

```
Let's improve your guidelines to reach 35+/40:

CTA Color:
"What's your call-to-action button color? (hex code)"
User: "#FF6B35"
"What name do you use for this color?"
User: "Action Orange"

Email Footer:
"What's your company's physical mailing address?"
User: "123 Main St, City, State 12345"

Approved Terms:
"Let's add more approved power words. What other words represent your brand?"
User: "Innovative, Reliable, Scalable"
```

#### Step 3: Update Guidelines

Update `brand-guidelines.md` with new information:
- Add CTA color section
- Complete email footer
- Expand approved terminology

#### Step 4: Re-Test

Generate new sample email and re-score:
```
Updated guidelines. Let me test again...

Sample email scored: 38/40 (Fully Compliant) ✅
```

#### Step 5: Iterate or Complete

- If score >= 35: Proceed to completion
- If score < 35: Repeat refinement loop (max 2-3 iterations)

---

## Validation Phase 5: File Integrity Check

### Technical Validation

Before completing, verify file integrity:

#### File Location
- [ ] File created at correct path: `{project-root}/brand-guidelines.md`
- [ ] File is readable (not corrupted)
- [ ] File size reasonable (typically 10-50KB for markdown)

#### Markdown Formatting
- [ ] Valid markdown syntax (headings, lists, code blocks)
- [ ] Proper heading hierarchy (## for sections, ### for subsections)
- [ ] Code blocks properly formatted with triple backticks
- [ ] Hex codes in correct format (#RRGGBB)

#### Section Structure
- [ ] All required sections present (1-8)
- [ ] Sections in correct order
- [ ] Each section has content (not empty)
- [ ] Consistent formatting throughout

#### Content Quality
- [ ] No placeholder text like "{Company Name}" or "{TODO}"
- [ ] All user-provided data inserted correctly
- [ ] Examples are filled (not just templates)
- [ ] No duplicate sections

---

## Validation Report Template

After all validation phases complete, generate this report:

```markdown
# Brand Guidelines Validation Report

**File**: brand-guidelines.md
**Created**: {Date/Time}
**Company**: {Company Name}

## Completeness Check ✅

- ✅ Brand Foundation: Complete
- ✅ Brand Voice: 3 attributes defined
- ✅ Brand Tone: 3 contexts defined
- ✅ Visual Identity:
  - ✅ Colors: 3 colors (Primary, CTA, Background)
  - ✅ Typography: 2 fonts (Headings, Body)
  - ✅ Logo: Usage rules defined
  - ✅ Imagery: Style guidelines present
- ✅ Messaging:
  - ✅ Approved terms: 12 terms across 4 categories
  - ✅ Prohibited terms: 8 terms across 3 categories
  - ✅ Key messages: Value prop + Customer promise
- ✅ Legal: Email (CAN-SPAM), SMS (TCPA)
- ✅ Accessibility: WCAG 2.1 AA standards defined

## Quality Assessment ✅

- ✅ Voice attributes specific and well-defined
- ✅ Colors have hex codes and usage rules
- ✅ Typography meets accessibility standards
- ⚠️ Could add Instagram FTC disclosure (optional)

## Sample Email Test ✅

**Test Result**: 38/40 (Fully Compliant)

Dimension Scores:
- Visual Compliance: 5/5
- Tone/Voice Compliance: 5/5
- Messaging Compliance: 5/5
- Legal Compliance: 5/5
- Channel Requirements: 5/5
- Accessibility: 5/5
- Brand Identity Strength: 4/5
- Guideline Adherence: 4/5

**Conclusion**: Guidelines are comprehensive and ready for production use!

## Recommendations

✅ Guidelines complete and validated
✅ Sample content scored highly (38/40)
✅ All required sections present

Optional enhancements:
- Add Instagram FTC disclosure if running sponsored posts
- Consider adding sustainability message if applicable
- Could expand logo section with file paths when available

## Next Steps

Your brand guidelines are ready! You can now:
1. Generate branded content: "Create email ads for product launch"
2. Validate existing content: "Review this email for brand compliance"
3. All creative skills will automatically use these guidelines

Guidelines location: {full-path}/brand-guidelines.md
```

---

## Common Validation Issues and Fixes

### Issue: Low Sample Test Score (< 28/40)

**Symptoms**:
- Sample email doesn't use brand colors
- Voice doesn't match guidelines
- Missing legal footer

**Diagnosis**:
- Guidelines too vague or incomplete
- Missing critical sections (colors, fonts, legal)

**Fix**:
- Review completeness checklist
- Ask targeted follow-up questions for missing sections
- Ensure specific hex codes, font names, and legal templates provided

### Issue: Accessibility Warnings

**Symptoms**:
- CTA color contrast < 4.5:1 against background
- Font sizes < 16px
- No alt text requirements

**Diagnosis**:
- Colors chosen don't meet WCAG standards
- Accessibility section skipped or incomplete

**Fix**:
- Calculate contrast ratios and suggest darker/lighter alternatives
- Recommend minimum 16px font size
- Add accessibility standards to guidelines

### Issue: Generic/Vague Guidelines

**Symptoms**:
- Sample scores well but content could be for any brand
- Voice attributes like "Professional, Good, Nice"
- No specific power words

**Diagnosis**:
- User provided generic answers during wizard
- Didn't give specific brand-unique information

**Fix**:
- Ask more specific follow-up questions
- Request industry-specific terminology
- Encourage unique voice attribute examples

### Issue: Inconsistent Formatting

**Symptoms**:
- Sections out of order
- Missing markdown formatting
- Broken code blocks

**Diagnosis**:
- Template generation error
- Manual editing broke formatting

**Fix**:
- Regenerate from template
- Validate markdown syntax
- Ensure code blocks use triple backticks

---

## Automated Validation Checks

### Checks Claude Should Perform Automatically

#### On Generation:
1. **Hex code validation**: All colors match #RRGGBB format
2. **Contrast ratio calculation**: CTA vs background >= 4.5:1
3. **List length validation**: Approved >= 5, Prohibited >= 3
4. **Voice attribute count**: 2-4 attributes
5. **Section presence**: All 8 required sections exist

#### Before Completion:
1. **File write success**: Confirm file created at correct path
2. **Markdown validity**: No syntax errors
3. **Placeholder removal**: No {template} text remaining
4. **Sample test**: Generate and score >= 35/40

#### Red Flags to Catch:
- ❌ Same hex code for primary and CTA colors
- ❌ Contrast ratio < 3:1 (unusable)
- ❌ Empty sections or placeholder text
- ❌ Font size < 14px (too small)
- ❌ No legal requirements (if sending emails/SMS)
- ❌ Sample test scores < 28/40 (major issues)

---

## Validation Success Criteria

### Minimum Standards (Must Pass)

To complete onboarding successfully:

✅ **Completeness**: All required elements present (Phase 1 checklist)

✅ **Accessibility**: Colors meet 4.5:1 contrast, fonts >= 16px

✅ **Sample Test**: Score >= 35/40 on brand-compliance check

✅ **File Integrity**: Valid markdown, proper structure, no errors

### Recommended Standards (Should Pass)

For high-quality guidelines:

✅ **Quality**: Specific, brand-unique voice and terminology

✅ **Coverage**: Multiple contextual tones (2-4 contexts)

✅ **Legal**: Comprehensive channel coverage (email + SMS + Instagram)

✅ **Sample Test**: Score >= 38/40 (Fully Compliant)

### Exceptional Standards (Ideal)

For exceptional guidelines:

✅ **Comprehensive**: All optional sections filled

✅ **Specificity**: Detailed usage rules and restrictions for every element

✅ **Examples**: Multiple examples per voice attribute and tone

✅ **Sample Test**: Score 40/40 (Perfect)

---

## Validation Workflow Summary

```
1. Generate brand-guidelines.md
   ↓
2. Run Completeness Check (Phase 1)
   ├─ Pass → Continue
   └─ Fail → Identify missing sections, ask follow-up questions
   ↓
3. Run Quality Check (Phase 2)
   ├─ Good quality → Continue
   └─ Poor quality → Suggest improvements, refine answers
   ↓
4. Generate Sample Email
   ↓
5. Run Brand Compliance Test (Phase 3)
   ├─ Score >= 35 → Continue
   └─ Score < 35 → Enter Refinement Loop (Phase 4)
   ↓
6. Run File Integrity Check (Phase 5)
   ├─ Pass → Complete
   └─ Fail → Fix issues, regenerate
   ↓
7. Generate Validation Report
   ↓
8. SUCCESS: Guidelines ready for production use!
```

---

This validation checklist ensures every generated brand-guidelines.md file is complete, high-quality, accessible, and functional before the user starts creating branded content.
