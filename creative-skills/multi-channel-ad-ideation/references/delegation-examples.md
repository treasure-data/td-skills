# Delegation Examples

This reference file contains detailed examples of delegating to channel skills from the multi-channel-ad-ideation orchestrator skill.

## How Channel Delegation Works

### Step 1: Prepare Delegation Context

Before invoking a channel skill, gather the context:

```markdown
**Context to pass to channel skill**:
- **Selected Creative Direction**: [Direction name and full description]
- **Creative Brief**: [Messaging, goals, tone, benefits]
- **Target Segment**: [Audience description]
- **Brand Guidelines** (if provided): [Path to brand.md file]
- **Number of Concepts**: 3-5 (or user-specified)
```

### Step 2: Invoke Channel Skill

Use explicit instruction pattern:

```markdown
"Now I'll use the [email/sms/instagram]-ad-ideation skill to generate concepts following the '[Direction Name]' creative direction."

[Read the channel SKILL.md file]
[Follow Phase 1: Text Concept Format from channel skill]
[Pass creative direction, brief, segment as context]
```

### Step 3: Channel Skill Executes Phase 1

The channel skill (email/sms/instagram) will:
- Read its own SKILL.md guidance
- Generate 3-5 text concepts in channel-specific format
- Apply channel-specific constraints (subject line length, character limits, image specs)
- Use channel-appropriate output format (collapsed cards for email/SMS, table for Instagram)
- Include quality scores and delivery recommendations

### Step 4: Return to Orchestrator

After channel skill completes Phase 1:
- User reviews channel-specific concepts
- User can iterate (delegate back to channel skill for refinements)
- User confirms concepts
- Orchestrator coordinates Phase 2 (HTML preview delegation)

## Delegation Patterns

### Pattern A: All Channels at Once

**When to use**: User wants to see all channels simultaneously, needs cross-channel consistency validation

**Workflow**:
```markdown
1. User selects creative direction
2. Ask: "Generate all channels (Email + SMS + Instagram) at once?"
3. If yes:
   a. Read email/SKILL.md → Generate email concepts (Phase 1)
   b. Read sms/SKILL.md → Generate SMS concepts (Phase 1)
   c. Read instagram/SKILL.md → Generate Instagram concepts (Phase 1)
   d. Present all concepts together with cross-channel alignment notes
4. User reviews, confirms
5. Delegate Phase 2 (HTML) to each channel skill
```

**Cross-Channel Consistency Check**:
After generating all channels, validate:
- Core message is consistent across channels
- Brand tone matches in all variations
- CTAs align (same destination/offer)
- Visual concepts complement each other

**Present alignment summary**:
```markdown
### Cross-Channel Alignment Summary

✅ **Message Consistency**: All channels emphasize [key benefit]
✅ **Tone**: Urgent and action-oriented across Email, SMS, Instagram
✅ **CTA**: All channels drive to same offer: [destination]
⚠️ **Visual Coherence**: Email uses blue gradient, Instagram uses green - consider aligning color palette
```

### Pattern B: Sequential (Channel-by-Channel)

**When to use**: User wants laser focus on one channel before moving to next, iterative refinement important

**Workflow**:
```markdown
1. User selects creative direction
2. Ask: "Which channel should we start with? (Email, SMS, or Instagram)"
3. User selects Email
   a. Read email/SKILL.md
   b. Execute Email Phase 1 (text concepts)
   c. User reviews, iterates, confirms
   d. Execute Email Phase 2 (HTML preview)
4. Ask: "Email complete! Ready to move to next channel?"
5. Repeat for SMS, then Instagram
```

**Benefits of Sequential**:
- Perfect one channel completely before moving on
- User can refine messaging between channels
- Easier cognitive load (focus on one format at a time)
- Later channels can adapt based on earlier learnings

## Channel-Specific Invocation Examples

### Invoking Email Skill

```markdown
"I'll now use the email-ad-ideation skill to generate email concepts following the 'Benefit-Focused' creative direction."

**Context for Email Skill**:
- Creative Direction: Benefit-Focused - "Transform your workflow in 5 minutes"
- Brief: SaaS product launch, emphasizing ease of use and quick ROI
- Segment: B2B sales managers struggling with pipeline visibility
- Brand Guidelines: /path/to/brand.md (if provided)

[Read channels/email/SKILL.md]
[Follow Phase 1: Text Concept Format with collapsed card format]
[Generate 3-5 email concepts with subject lines, body copy, visual descriptions]
```

### Invoking SMS Skill

```markdown
"I'll now use the sms-ad-ideation skill to generate SMS concepts following the 'Urgency-Driven' creative direction."

**Context for SMS Skill**:
- Creative Direction: Urgency-Driven - "Act now before you miss out"
- Brief: Flash sale, 40% off, ends in 24 hours
- Segment: Existing customers who have purchased before
- Character Limit: 160 (single SMS preferred)

[Read channels/sms/SKILL.md]
[Follow Phase 1: Text Concept Format with collapsed card format]
[Generate 3-5 SMS concepts with ultra-concise messaging]
```

### Invoking Instagram Skill

```markdown
"I'll now use the instagram-ad-ideation skill to generate Instagram concepts following the 'Social Proof-Driven' creative direction."

**Context for Instagram Skill**:
- Creative Direction: Social Proof-Driven - "Join 10,000+ teams who switched"
- Brief: Mobile app launch, emphasizing community and trust
- Segment: Young professionals (25-35) interested in productivity
- Image Specs: 1080x1080px square

[Read channels/instagram/SKILL.md]
[Follow Phase 1: Text Concept Format with table format]
[Generate 3-5 Instagram concepts with image descriptions and copy]
```

## Phase 2: HTML Preview Delegation

After user confirms text concepts, delegate Phase 2 to channel skills:

### Email HTML

```markdown
"Now I'll use the email-ad-ideation skill to generate HTML previews for the confirmed concepts."

[Read channels/email/SKILL.md Phase 2 section]
[Follow HTML Generation and Preview Workflow]
[MANDATORY: Write HTML file + call mcp__tdx-studio__open_file]
```

### SMS ASCII

```markdown
"Now I'll use the sms-ad-ideation skill to generate ASCII box previews."

[Read channels/sms/SKILL.md Phase 2 section]
[Generate ASCII mobile screen mockups]
```

### Instagram HTML

```markdown
"Now I'll use the instagram-ad-ideation skill to generate HTML mockups."

[Read channels/instagram/SKILL.md Phase 2 section]
[Follow HTML Generation and Preview Workflow]
[MANDATORY: Write HTML file + call mcp__tdx-studio__open_file]
[Auto-detect instagram-ad-*.png if using image-gen skill]
```

## Maintaining Context Across Delegations

**Context requirement**: When delegating to channel skills, always pass full context:

```markdown
**Delegation Context Bundle**:
1. Selected Creative Direction (name + full description)
2. Creative Brief (messaging, goals, tone, benefits)
3. Target Segment (demographics, behaviors, pain points)
4. Brand Guidelines path (if provided)
5. Number of concepts requested (default 3-5)
6. Any user preferences (tone adjustments, specific requirements)
```

### Example Full Delegation

```markdown
I'll now delegate to the email-ad-ideation skill:

**Context**:
- **Creative Direction**: "Benefit-Focused" - Transform your workflow in 5 minutes, emphasizes outcomes and ease
- **Brief**: Launching Pipeline Pro SaaS tool, goal is 14-day trial signups, tone is confident/outcome-oriented, key benefit is 23% more deals closed
- **Segment**: B2B sales managers (35-50 years old) at mid-market companies, frustrated with spreadsheet-based pipeline tracking, motivated by data-driven decision making
- **Brand Guidelines**: ./pipeline-pro-brand.md
- **Concepts**: Generate 5 email concepts

[Read channels/email/SKILL.md]
[Execute Phase 1 following email skill's collapsed card format]
```

---

**Note**: This reference file contains detailed delegation workflows. For the condensed version in the main orchestrator skill, see multi-channel-ad-ideation/SKILL.md.
