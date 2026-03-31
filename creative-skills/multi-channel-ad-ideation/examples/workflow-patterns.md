# Multi-Channel Ad Workflow Patterns

Common workflow patterns showing how users interact with the multi-channel ad ideation skill.

## Pattern 1: Progressive Single-Channel Flow
```
User: "Generate Instagram ad concepts for our new fitness app launch"
You: [Clarify if needed]
   → Generate 5 creative directions (table format)
   → User selects direction 3
   → Ask: "All channels or just Instagram?"
   → User: "Just Instagram"
   → Generate 5 Instagram text concepts
   → User: "Love concept 2!"
   → Generate HTML preview for concept 2
```

## Pattern 2: Multi-Channel Campaign (All-at-Once)
```
User: "Create email, SMS, and Instagram ads for a flash sale (40% off, 24 hours)"
You: [Clarify if needed]
   → Generate 5 creative directions (table)
   → User selects "Urgency-Driven"
   → Ask: "All channels at once or sequential?"
   → User: "All at once"
   → Generate text concepts for Email + SMS + Instagram
   → User: "These work, show HTML"
   → Generate HTML for all channels
   → Note cross-channel coherence
```

## Pattern 3: Sequential Channel Flow with Iteration
```
User: "Show me email ad ideas for B2B SaaS product"
You: [Clarify if needed]
   → Generate 5 creative directions (table)
   → User selects "Benefit-Focused"
   → Ask: "All channels or sequential?"
   → User: "Sequential, start with Email"
   → Generate 3 email text concepts
User: "I like concept 2 but make it shorter"
You: Regenerate concept 2 with tighter copy
User: "Perfect! Show me the HTML"
You: Generate HTML preview
User: "Great! Now let's do SMS"
You: Generate SMS text concepts (same "Benefit-Focused" direction)
   → User confirms → Generate SMS HTML
```

## Pattern 4: Direction Exploration
```
User: "I need ad concepts for a product launch but not sure on the messaging angle"
You: [Clarify brief and segment]
   → Generate 5 creative directions (table format)
   → User: "Hmm, can you combine direction 2 and 5?"
   → Generate new hybrid direction, update table
   → User: "Yes! Let's use this hybrid approach"
   → Ask: "Which channels?"
   → Continue with text concepts...
```

## Pattern 5: Multi-Channel Delegation Workflow (All-at-Once)

**Demonstrates**: How multi-channel delegates to individual channel skills

```
User: "Create email and Instagram ads for our new hiking boot launch"

Claude: "I'll help you create multi-channel ads! First, let me gather some information:
- What's the key message about these hiking boots?
- Who is your target audience?
- What action should they take?"

User: [Provides brief: "Waterproof boots for trail enthusiasts" and segment: "Outdoor enthusiasts 25-45"]

Claude: [Generates 5 creative direction options in table format]
"Here are 5 creative direction options scored from 28-33/35.

Direction 2 ('Benefit-Focused - Built for the Backcountry') scored highest (33/35).

Which direction would you like to pursue?"

User: "Let's go with Direction 2"

Claude: "Great! Would you like to:
1. Work on all channels at once (Email + Instagram)
2. Work on each channel separately"

User: "All at once"

Claude: "Perfect! I'll now delegate to the individual channel skills.

---

**DELEGATING TO EMAIL SKILL**

I'll use the email-ad-ideation skill to generate email concepts following the 'Benefit-Focused - Built for the Backcountry' creative direction.

**Context for Email Skill**:
- Creative Direction: Benefit-Focused - Built for the Backcountry, emphasizes durability and trail performance
- Brief: Waterproof hiking boots, technical features (Gore-Tex, Vibram sole), launch offer
- Segment: Outdoor enthusiasts 25-45, weekend hikers to serious backpackers

[Reads channels/email/SKILL.md]
[Generates 3-5 email concepts in collapsed card format]

---

**DELEGATING TO INSTAGRAM SKILL**

I'll use the instagram-ad-ideation skill to generate Instagram concepts following the 'Benefit-Focused - Built for the Backcountry' creative direction.

**Context for Instagram Skill**:
- Creative Direction: Benefit-Focused - Built for the Backcountry, emphasizes durability and trail performance
- Brief: Waterproof hiking boots, visual focus on rugged terrain usage
- Segment: Outdoor enthusiasts 25-45, visually-driven audience

[Reads channels/instagram/SKILL.md]
[Generates 3-5 Instagram concepts in table format]

---

**CROSS-CHANNEL ALIGNMENT CHECK**

✅ **Message Consistency**: Both channels emphasize waterproof performance and trail durability
✅ **Tone**: Knowledgeable and enthusiastic across Email and Instagram
✅ **CTA**: Both drive to product page with launch discount
✅ **Visual Coherence**: Rugged outdoor imagery consistent across channels"

User: "These look great! Show me the HTML previews"

Claude: "I'll delegate Phase 2 to each channel skill:

[Delegates to email skill Phase 2]
[Email skill writes email-preview-20260316-143022.html]
[Email skill calls mcp__tdx-studio__open_file to open email preview]

[Delegates to Instagram skill Phase 2]
[Instagram skill writes instagram-preview-20260316-143045.html]
[Instagram skill calls mcp__tdx-studio__open_file to open Instagram preview]

All HTML previews generated and opened in artifact panel!"
```

## Pattern 6: Sequential Delegation with Iteration

**Demonstrates**: Sequential channel delegation with mid-flight iteration

```
User: "Create ads for flash sale - let's do email first, then SMS"

Claude: "I'll help you create flash sale ads! Let me understand your campaign:
- What's the offer and time limit?
- Who are you targeting?
- What's the main goal?"

User: [Provides brief: "40% off all items, 24 hours only" and segment: "Existing customers"]

Claude: [Generates 5 creative direction options in table format]

User: "Direction 3 - Urgency-Driven looks perfect"

Claude: "Great choice! Would you like to work on all channels at once or channel-by-channel?"

User: "Channel-by-channel, start with email"

Claude: "Perfect! I'll start with Email.

**DELEGATING TO EMAIL SKILL**

I'll use the email-ad-ideation skill to generate email concepts following the 'Urgency-Driven' creative direction.

**Context for Email Skill**:
- Creative Direction: Urgency-Driven - Act now before you miss out, emphasizes scarcity and time pressure
- Brief: 40% off flash sale, ends in 24 hours, existing customer exclusive
- Segment: Existing customers, past purchasers

[Reads channels/email/SKILL.md]
[Generates 3 email concepts in collapsed card format]"

User: "I like Concept 2 but make the subject line shorter"

Claude: "I'll work with the email skill to refine Concept 2:

[Delegates refinement request to email skill]
[Email skill regenerates Concept 2 with shorter subject line: 48 chars instead of 58]"

User: "Perfect! Show me the HTML"

Claude: [Delegates email Phase 2]
[Email skill writes email-preview-20260316-150122.html]
[Email skill calls mcp__tdx-studio__open_file to open preview]

"Email complete! Ready to move to SMS?"

User: "Yes!"

Claude: "**DELEGATING TO SMS SKILL**

I'll use the sms-ad-ideation skill to generate SMS concepts following the 'Urgency-Driven' creative direction.

**Context for SMS Skill**:
- Creative Direction: Urgency-Driven - Act now before you miss out (from Email workflow)
- Brief: 40% off flash sale, 24 hours only, link to shop
- Segment: Existing customers
- Character Limit: 160 (single SMS preferred)

[Reads channels/sms/SKILL.md]
[Generates 3 SMS concepts in collapsed card format]"

User: "Concept 1 is great!"

Claude: [Delegates SMS Phase 2]
[SMS skill generates ASCII box preview]

"Both channels complete! Your flash sale campaign is ready:
- Email: Urgency-focused with countdown timer
- SMS: Ultra-concise with direct link

Would you like to add Instagram as well?"
```
