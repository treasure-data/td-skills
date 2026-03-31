---
name: multi-channel-ad-ideation
description: Orchestrates multi-channel ad ideation for email, SMS, and Instagram campaigns using a structured creative direction workflow. Use when brainstorming campaign concepts, generating ad copy variations, developing creative directions, exploring messaging strategies, or generating promotional ideas for one or more channels.
---

# Multi-Channel Ad Ideation

Generate creative ad concepts for **Email, SMS, and Instagram (image ads only)** campaigns. This skill is your ideation engine for rapid creative exploration across advertising channels.

## Core Philosophy: Ideation-First

Generate ad concepts, support iterative refinement, provide HTML previews, and self-score for quality.

**Do NOT plan campaign logistics** - No budgets, schedules, or frequency settings
**Do NOT find segments** - User must provide target audience description

## How It Works

### Progressive Workflow Overview

**Progressive, collaborative workflow**: Ideate creative directions first, then drill down into detailed concepts.

**Workflow steps**:
1. User request → Clarify missing inputs (brief, segment, channels)
2. Ask about brand guidelines (optional but proactive)
3. Creative direction ideation (3-5 strategic options in table format)
4. **Checkpoint**: User selects direction
5. Ask for channel selection (all channels at once or work sequentially)
6. **Checkpoint**: User confirms channel selection
7. Generate text concepts (copy only, no HTML yet)
8. **Checkpoint**: User confirms concepts
9. Generate HTML previews (only for confirmed concepts)
10. Support iterative refinement at any phase

At each checkpoint, briefly explain why you're pausing — help the user understand how the next step builds on their input.

**Benefits**: User-directed ideation, explore strategies before execution, multiple checkpoints, efficient (HTML only for confirmed concepts)

### Required Inputs

Before generating ad concepts, gather these three inputs from the user:

1. **Creative Brief** - Core messaging, goals, tone, key benefits/value props
   - If missing, ask about: main message/offer, desired action, tone (professional/playful/urgent/educational), key benefits/value propositions

2. **Target Segment** - Audience description (demographics, behaviors, pain points, motivations)
   - If missing, ask for: demographics (age, location, role/industry), behaviors (brand/product engagement), pain points (problems to solve), motivations (decision drivers)

3. **Target Channels** - Email, SMS, Instagram, or combination
   - If missing, ask which channels they want to target

**Important**: Do NOT create personas or analyze segments. Use the user's segment description directly to inform messaging.

### Using Brand Guidelines (Optional)

Ask the user if they have brand guidelines:

- If yes: Request the file path or content
- If no: Proceed without brand constraints

When brand guidelines are provided, they ensure concepts comply with brand standards from the start:
```
Create email ads for hiking boot launch using brand guidelines at /path/to/brand.md
```

**What gets applied**:
- **Creative Direction Phase**: Directions filtered to match brand tone/voice, include brand alignment in quality scoring
- **Text Concept Phase**: Messaging uses approved terminology, avoids prohibited terms, incorporates brand lexicon, matches contextual tone
- **HTML Preview Phase**: Brand colors (exact hex), fonts, logo placement, signature/tagline applied automatically

**Logo Integration**: Brand guidelines can include logo files (single or dual variants for light/dark backgrounds). Skills automatically embed logos with optimal contrast based on background luminance.

**Brand Elements Used**:
- Visual: Colors, fonts, logos, imagery style
- Messaging: Approved/prohibited terms, key messages, value propositions
- Tone/Voice: Brand voice (constant), contextual tone (variable by channel)
- Legal: Disclaimers, footer requirements, compliance

**Quality Scoring**: "Brief Alignment" dimension includes brand guideline adherence. Off-brand concepts score lower.

**Example**: User provides brand guidelines → Creative directions use brand tone → Text concepts use approved terminology → HTML applies brand colors/fonts/logos.

**For Compliance Review**: To validate existing content, use the brand-compliance skill with 8-dimension scoring.

## Creative Direction Ideation Phase

### What is a Creative Direction?

A **creative direction** is a strategic approach defining: core angle (lens for viewing product/offer), key message (what we emphasize), tone/emotion (how we communicate), and differentiation (what makes it unique).

**Example directions for SaaS product launch**:
1. **Urgency-Driven**: "Act now before you miss out" - scarcity and FOMO
2. **Benefit-Focused**: "Transform your workflow in 5 minutes" - outcomes and ease
3. **Social Proof-Driven**: "Join 10,000+ teams who switched" - credibility
4. **Problem-Agitation**: "Tired of spreadsheet chaos?" - pain points
5. **Innovation-Forward**: "The future of sales pipeline management" - novelty

### Creative Direction Output Format (TABLE)

Present directions as a **comparison table** for easy evaluation:

```markdown
## Creative Direction Options

| # | Strategic Angle | Key Message | Tone/Emotion/Differentiation | Quality Score |
|---|----------------|-------------|------------------------------|---------------|
| 1 | **Urgency-Driven**: Act now before you miss out - emphasizes scarcity and FOMO | "Lock in founder pricing before it's gone" | Urgent, time-pressured / Creates FOMO / Emphasizes limited availability | 31/35 (Strong) |
| 2 | **Benefit-Focused**: Transform your workflow in 5 minutes - emphasizes outcomes and ease | "Close 23% more deals with real-time visibility" | Confident, outcome-oriented / Highlights specific results / Data-driven credibility | 33/35 (Excellent) |
| 3 | **Social Proof-Driven**: Join 10,000+ teams who switched - emphasizes credibility and bandwagon | "Trusted by 10,000+ sales teams" | Reassuring, community-focused / Leverages popularity / Reduces perceived risk | 29/35 (Strong) |
| 4 | **Problem-Agitation**: Tired of spreadsheet chaos? - emphasizes pain points and frustration | "Say goodbye to pipeline spreadsheets" | Empathetic, problem-focused / Validates frustration / Clear before/after contrast | 28/35 (Strong) |
| 5 | **Innovation-Forward**: The future of sales pipeline management - emphasizes novelty and cutting-edge | "AI-powered pipeline intelligence" | Exciting, forward-looking / Emphasizes innovation / Appeals to early adopters | 30/35 (Strong) |

**Recommendation**: Direction 2 (Benefit-Focused) scored highest with excellent clarity and segment relevance.
```

**Table Format Benefits**:
- Easy side-by-side comparison
- Scannable at a glance
- Clear quality differentiation
- Compact presentation (fits on one screen)

**For visual card format**, see `references/card-templates.md` section "Direction Card Template".

### Scoring Creative Directions

Apply **7-dimension rubric** (from `references/quality-scoring.md`): Brief Alignment, Segment Relevance, Channel Appropriateness, Clarity, Differentiation, Call-to-Action, Visual Concept Quality. Present top 3-5 directions sorted by score (highest first).

### User Selection Process

After presenting directions, highlight highest-scoring direction and ask user to: select one by number/name, request more directions, combine elements, or pivot to different approach.

**User can**: Select direction → proceed to Channel Selection | Request more → generate new | Iterate → adjust tone/angle | Combine → blend elements

## Channel Selection Step

After user selects creative direction, ask these three questions:

1. **Which channels would you like?** Email, SMS, Instagram, or multiple?

2. **Workflow preference:**
   - Option 1: All channels at once (faster, more to review)
   - Option 2: Sequential channel-by-channel (focused, easier to iterate)

3. **If sequential:** Which channel first? Email, SMS, or Instagram?

**Two workflows:**
- **All-at-once**: Generate email + SMS + Instagram simultaneously. Validate cross-channel consistency.
- **Sequential**: Perfect one channel before moving to next. After completing a channel, return to generate text concepts for the next channel. Better for iterative refinement.

**Default recommendation**: Sequential for first-timers, all-at-once for experienced users.

## Delegating to Channel Skills

### Orchestration Philosophy

After user selects a creative direction, delegate to individual channel skills (email/sms/instagram) to execute their specialized workflows. Multi-channel is the **conductor**, channel skills are **expert musicians**. Pass creative direction, brief, segment, and brand guidelines to channel skills. Maintain cross-channel consistency. Don't generate text concepts yourself - always delegate.

### How to Delegate

After completing Channel Selection Step, follow this delegation workflow:

**Delegation workflow**:
1. **Prepare context**: Creative direction, brief, segment, brand guidelines (if provided), number of concepts (3-5)
2. **Invoke channel skill**: Read channel's SKILL.md, follow Phase 1 format, pass full context
3. **Channel executes Phase 1**: Generates text concepts in channel-specific format with quality scores
4. **User reviews/iterates**: User confirms concepts or requests changes
5. **Phase 2 delegation**: After confirmation, delegate HTML/ASCII preview generation

### Channel Invocation Examples

#### Email Skill

```markdown
"I'll use the email-ad-ideation skill to generate email concepts following the 'Benefit-Focused' creative direction."

**Context**:
- Creative Direction: Benefit-Focused - "Transform your workflow in 5 minutes"
- Brief: SaaS product launch, emphasizing ease of use and quick ROI
- Segment: B2B sales managers struggling with pipeline visibility
- Brand Guidelines: /path/to/brand.md (if provided)

[Read channels/email/SKILL.md]
[Follow Phase 1: Text Concept Format with collapsed card format]
[Generate 3-5 email concepts]
```

#### SMS Skill

```markdown
"I'll use the sms-ad-ideation skill to generate SMS concepts following the 'Urgency-Driven' creative direction."

**Context**:
- Creative Direction: Urgency-Driven - "Act now before you miss out"
- Brief: Flash sale, 40% off, ends in 24 hours
- Segment: Existing customers who have purchased before
- Character Limit: 160 (single SMS preferred)

[Read channels/sms/SKILL.md]
[Follow Phase 1: Text Concept Format with collapsed card format]
[Generate 3-5 SMS concepts with ultra-concise messaging]
```

#### Instagram Skill

```markdown
"I'll use the instagram-ad-ideation skill to generate Instagram concepts following the 'Social Proof-Driven' creative direction."

**Context**:
- Creative Direction: Social Proof-Driven - "Join 10,000+ teams who switched"
- Brief: Mobile app launch, emphasizing community and trust
- Segment: Young professionals (25-35) interested in productivity
- Image Specs: 1080x1080px square

[Read channels/instagram/SKILL.md]
[Follow Phase 1: Text Concept Format with table format]
[Generate 3-5 Instagram concepts with image descriptions and copy]
```

**For detailed delegation workflows and patterns**, see [references/delegation-examples.md](references/delegation-examples.md).

### Phase 2 Delegation

After user confirms text concepts, delegate preview generation:
- **Email**: Read email/SKILL.md Phase 2, generate HTML, write file, call `mcp__tdx-studio__open_file`
- **SMS**: Read sms/SKILL.md Phase 2, generate ASCII mobile screen mockups
- **Instagram**: Read instagram/SKILL.md Phase 2, generate HTML mockup, auto-detect AI images if available

### Context Bundle (Always Pass)

When delegating, include:
1. Selected Creative Direction (name + full description)
2. Creative Brief (messaging, goals, tone, benefits)
3. Target Segment (demographics, behaviors, pain points)
4. Brand Guidelines path (if provided)
5. Number of concepts (default 3-5)
6. User preferences (tone adjustments, requirements)

**For detailed delegation workflows**, see [references/delegation-examples.md](references/delegation-examples.md).

## Iterative Refinement

Iteration happens at **three levels**:

**Level 1 - Creative Direction**: Request more directions, refine existing ("make it more urgent"), combine directions

**Level 2 - Text Concepts**: Request more concepts, pivot tone/approach, create hybrids, channel-specific refinement

**Level 3 - HTML Previews**: Visual design changes (colors, layout, typography)

**Trigger keywords**: "more", "different", "combine", "shorter", "longer", "tone", "visual", "background", "spacing"

## Quality Scoring

**When to score**: Automatically after initial concept generation, on request, or after major iterations

**7 Dimensions** (0-5 each, max 35 points): Brief Alignment, Segment Relevance, Channel Appropriateness, Clarity, Differentiation, Call-to-Action, Visual Concept Quality

**Provide**: Overall score (e.g., 28/35), tier (Excellent/Strong/Good/Needs Work), strengths, areas to strengthen, actionable recommendations

**Complete rubric**: See `references/quality-scoring.md`

## Output Format

### Phase 1: Text Concept Format

Delegate to channel skills for initial text concepts (before HTML). Channel skills generate 3-5 named concepts with ad copy and visual descriptions. Each concept references selected creative direction. Wait for user confirmation before generating HTML.

**Format details**: See channel-specific SKILL.md files:
- Email: Collapsed cards with subject lines, body copy, visual concepts
- SMS: Collapsed cards with 160-char messaging, delivery recommendations
- Instagram: Table format with primary text, headline, image descriptions

### Phase 2: HTML Preview Format

After user confirms text concepts, delegate HTML/ASCII preview generation to channel skills:
- Email/Instagram: HTML mockups with inline CSS (auto-opened in artifact panel)
- SMS: ASCII mobile screen mockups

## Using Interactive Card Components

**Card format** available for visual presentation. Components: Direction Cards, Concept Cards (collapsed format), Score Cards, Color Swatches. Default: collapsed cards (24px/800 concept name + tagline, click to expand). **Do NOT show character counts** to users - validate internally only.

**Reference**: `references/card-templates.md` for complete templates, color tiers, font hierarchy, accessibility, responsive design.

## Channel Capabilities

### Email Ads
- Subject lines (40-60 chars), preview text (35-55 chars)
- Body copy (150-300 words), CTA buttons
- Visual layout descriptions
- HTML previews with inline CSS

**Read**: `channels/email/SKILL.md` for full guidance

### SMS Ads
- Ultra-concise messaging (160 chars single, 300 multi-part)
- CTA with link shortening
- Personalization tags ({{first_name}}, {{offer_code}})
- Timing/delivery recommendations

**Read**: `channels/sms/SKILL.md` for full guidance

### Instagram Image Ads
- Primary text (125 chars), headline (40 chars), description (30 chars)
- Image concept descriptions (composition, color, focal point)
- Specs: 1080x1080px (square) or 1080x1350px (portrait)
- HTML mockups in Instagram post format

**Read**: `channels/instagram/SKILL.md` for full guidance

## Shared Resources

### Creative Brief Guide
If user doesn't have a brief, reference `references/creative-brief-guide.md` to help them structure one.

### HTML Preview Templates
For email and Instagram previews, reference `references/html-preview-templates.md` for reusable inline CSS templates.

### Complete Campaign Example
See `examples/complete-campaign.md` for an end-to-end multi-channel campaign example showing all three channels with consistent messaging.

## Common Patterns

For complete workflow examples showing user interactions, see `examples/workflow-patterns.md`.

## Best Practices

**Start with creative directions** - Present 3-5 strategic options in table format before detailed concepts
**Delegate to channel skills** - After direction confirmation and channel selection, invoke channel skills (email/sms/instagram) to generate text concepts. Pass full context.
**Text before HTML** - Channel skills generate Phase 1 (text) first. After user confirms, delegate Phase 2 (HTML/ASCII).
**Clear checkpoints** - User explicitly selects direction and confirms concepts
**Clarify inputs** - Don't guess brief or segment
**Multiple variations** - 3-5 concepts per phase
**Name strategically** - "Urgency-Driven" beats "Concept 1"
**Respect limits** - Enforce channel character constraints
**Quality scores** - Score directions and concepts

**Don't skip direction phase** - Present strategic options first
**Don't generate concepts yourself** - Delegate to channel skills. Multi-channel orchestrates, doesn't execute.
**Don't generate HTML early** - Wait for text concept confirmation
**Don't create images** - Describe visual concepts only
**Don't auto-select** - Let user choose from direction options

## Related Skills

- **PRFAQ skill** - For validating product messaging before creating ads
- **Executive Brief Builder** - For summarizing campaign strategy to leadership

---

**Note**: This skill focuses on rapid creative ideation for advertising campaigns. For campaign execution, budgeting, or asset production, users should work with their marketing or creative teams.
