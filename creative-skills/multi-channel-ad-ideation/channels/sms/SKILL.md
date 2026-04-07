---
name: sms
description: Generate SMS advertising concepts with ultra-concise mobile messaging optimized for 160-character constraints. Includes personalization, CTA optimization, and timing recommendations.
---

# SMS Ad Ideation

Generate ultra-concise SMS advertising concepts optimized for mobile delivery. SMS is direct, immediate, and highly personal - every character counts.

## Integration with Multi-Channel Skill

This skill can be used **standalone** or **delegated from multi-channel-ad-ideation**.

**Standalone usage**: User directly invokes "Generate SMS ad concepts for..."

**Delegated usage**: Multi-channel skill invokes this skill after creative direction is selected:
- Multi-channel passes: Creative direction, brief, segment
- This skill executes: Phase 1 (text concepts) and/or Phase 2 (ASCII previews)
- User can iterate within this skill or return to multi-channel orchestrator

**When delegated**, expect this context:
- **Creative Direction**: Selected direction name and description (e.g., "Urgency-Driven")
- **Creative Brief**: Core offer, CTA, tone
- **Target Segment**: Audience description
- **Character Limit**: 160 (single) or 300 (multi-part)
- **Number of Concepts**: Usually 3-5

Use this context to craft ultra-concise SMS messages that align with the creative direction while respecting character limits.

## SMS Ad Best Practices

### The SMS Channel Advantage
- **100% mobile** - Everyone reads on their phone
- **Highest open rates** - 98% open rate vs. 20% for email
- **Immediate delivery** - Read within 3 minutes on average
- **Direct & personal** - Feels like a message from a friend
- **Action-oriented** - Short tap to link, call, or reply

### Critical Constraints
- **160 characters** for single SMS (spaces count!)
- **300 characters** max for multi-part SMS (splits into 2-3 messages)
- **Plain text only** - No HTML, images, or formatting
- **Mobile-first CTA** - Link must work on small screens
- **Compliance required** - Must include opt-out mechanism

## Output Format

### Phase 1: Text Concept Format (Initial Generation)

Generate **3-5 SMS concepts** using **collapsed card format** from `../references/card-templates.md`:
- All concepts start **collapsed** (user clicks to expand for details)
- Summary shows concept name (24px/800 font) + message preview as tagline
- **Do NOT include character counts** in output
- Use green accent color (#10b981) for SMS visual distinction
- Include: Message text, opt-out, best send time

See Example SMS Concepts section below for complete card templates.

### Phase 2: ASCII Preview Format (After Confirmation)

**ONLY generate ASCII previews AFTER user confirms text concepts**:
```
┌──────────────────────────┐
│ Message text formatted   │
│ as it appears on mobile  │
│ [CTA link]               │
│ [Opt-out text]           │
└──────────────────────────┘
```

Generate when user says "show me the previews" or "generate ASCII boxes" - NOT during first concept generation.

## Character Limit Handling

**Single SMS (160 chars)**: Best for simple, urgent messages.
Formula: [Hook] + [Offer] + [CTA] + [Link] + [Opt-out]
```
FLASH SALE: 40% off everything ends in 6 hours! Shop now: bit.ly/flash40

Reply STOP to unsubscribe
```

**Multi-Part SMS (300 chars)**: Use for complex offers, B2B products, or when personalization adds value.
Formula: [Personalized Hook] + [Problem/Benefit] + [Offer] + [CTA] + [Link] + [Urgency] + [Opt-out]
```
Hi {{first_name}}, struggling to hit Q1 targets?

Pipeline Pro gives real-time visibility + AI alerts. Close 23% more deals.

Try free 14 days: bit.ly/pipelinepro
Founder pricing ends Friday - save $3,600/year.

Text STOP to opt out
```

## Conciseness Techniques

**Abbreviate smart**: Use %, &, $, numbers instead of words. Avoid "ur", "w/" (unprofessional).

**Lead with action**: "SALE NOW: 40% off" beats "We wanted to let you know our sale is starting"

**Remove filler**: "SAVE 50% - live now" beats "We are excited to announce you can save up to 50%"

**Drop pleasantries**: Skip "Dear customer, we hope you're doing well..." - get straight to the offer.

## CTA Optimization for Mobile

**Short URLs**: Use bit.ly or branded shorteners (e.g., `bit.ly/flash40`, not long URLs with UTM parameters)

**Action-oriented CTAs**: "Shop now: [link]", "Claim offer: [link]", "Get started: [link]"
**Avoid**: "Click here" (you tap on mobile), "Learn more" (too vague)

**Tap-to-call**: Include phone numbers for service businesses - mobile auto-formats them as tappable links.

## Personalization Strategies

**Effective tags**: `{{first_name}}`, `{{offer_code}}`, `{{product_name}}`, `{{cart_total}}`

**Use for**: Welcome messages, abandoned carts, VIP offers, account notifications

**Skip for**: Urgent flash sales (brevity matters more), generic broadcasts, unreliable data

## Timing & Delivery Recommendations

**B2C**: 12-1pm (lunch) or 5-8pm (evening). Avoid before 10am or after 9pm.

**B2B**: 10-11am or 2-3pm weekdays. Avoid Monday mornings, Friday afternoons, weekends.

**Flash sales**: Launch at 9am or 7pm. Reminders at 6hrs, 1hr, 30min before deadline.

**Frequency**: Max 4 promotional messages/month. Transactional messages (order updates) have no limit.

## Compliance Essentials

**Required in every promotional SMS**:
1. Opt-out mechanism: "Reply STOP to unsubscribe" or "Text STOP to opt out"
2. Brand identification: Include your brand name, use consistent sender
3. Only message users who explicitly opted in

**Honor opt-outs immediately**. Never send promotional SMS without opt-in or omit opt-out instructions.

## Example SMS Concepts

Below are collapsed card examples showing Phase 1 text concepts. ASCII previews are generated after you confirm the text.

<details style="border:2px solid #e5e7eb;border-radius:12px;
                margin:16px 0;background:#ffffff;
                box-shadow:0 4px 6px rgba(0,0,0,0.05);">

  <summary style="cursor:pointer;padding:20px;
                  list-style:none;display:flex;
                  justify-content:space-between;align-items:start;">
    <div style="flex:1;">
      <div style="display:flex;align-items:start;gap:12px;">
        <span style="font-size:18px;color:#6b7280;margin-top:4px;">▸</span>
        <div>
          <div style="font-size:24px;font-weight:800;color:#1f2937;
                      margin-bottom:6px;line-height:1.2;">
            Urgency-Driven Flash Sale
          </div>
          <div style="font-size:15px;color:#4b5563;font-style:italic;
                      line-height:1.4;">
            "🔥 FLASH SALE: 40% off EVERYTHING ends at midnight! Use code FLASH40..."
          </div>
        </div>
      </div>
    </div>
    <div style="background:#10b981;color:#fff;padding:8px 14px;
                border-radius:6px;font-size:14px;font-weight:600;
                margin-left:16px;flex-shrink:0;">
      31/35    </div>
  </summary>

  <div style="padding:0 20px 20px 20px;border-top:2px solid #f3f4f6;">

    <div style="margin-top:20px;">
      <div style="font-size:15px;font-weight:700;color:#1f2937;
                  margin-bottom:12px;">
        Message Text
      </div>
      <div style="background:#f9fafb;padding:16px;border-radius:8px;
                  border-left:4px solid #10b981;">
        <div style="font-size:14px;color:#111827;line-height:1.6;
                    margin-bottom:12px;">
          🔥 FLASH SALE: 40% off EVERYTHING ends at midnight! Use code FLASH40
          <br><br>
          Shop now: bit.ly/flash40
        </div>
        <div style="font-size:12px;color:#6b7280;">
          Reply STOP to unsubscribe
        </div>
      </div>
    </div>

    <div style="margin-top:16px;padding:12px;background:#f0fdf4;
                border-radius:8px;border-left:4px solid #10b981;">
      <div style="font-size:12px;font-weight:600;color:#6b7280;
                  text-transform:uppercase;margin-bottom:4px;">
        Best Sent
      </div>
      <div style="font-size:13px;color:#111827;">
        7:00 PM (evening browsing peak), with follow-up "last call" at 11:00 PM
      </div>
    </div>

  </div>
</details>

<details style="border:2px solid #e5e7eb;border-radius:12px;
                margin:16px 0;background:#ffffff;
                box-shadow:0 4px 6px rgba(0,0,0,0.05);">

  <summary style="cursor:pointer;padding:20px;
                  list-style:none;display:flex;
                  justify-content:space-between;align-items:start;">
    <div style="flex:1;">
      <div style="display:flex;align-items:start;gap:12px;">
        <span style="font-size:18px;color:#6b7280;margin-top:4px;">▸</span>
        <div>
          <div style="font-size:24px;font-weight:800;color:#1f2937;
                      margin-bottom:6px;line-height:1.2;">
            B2B SaaS Free Trial
          </div>
          <div style="font-size:15px;color:#4b5563;font-style:italic;
                      line-height:1.4;">
            "Hi {{first_name}}, get real-time pipeline visibility + AI risk alerts..."
          </div>
        </div>
      </div>
    </div>
    <div style="background:#10b981;color:#fff;padding:8px 14px;
                border-radius:6px;font-size:14px;font-weight:600;
                margin-left:16px;flex-shrink:0;">
      28/35    </div>
  </summary>

  <div style="padding:0 20px 20px 20px;border-top:2px solid #f3f4f6;">

    <div style="margin-top:20px;">
      <div style="font-size:15px;font-weight:700;color:#1f2937;
                  margin-bottom:12px;">
        Message Text (Multi-Part)
      </div>
      <div style="background:#f9fafb;padding:16px;border-radius:8px;
                  border-left:4px solid #10b981;">
        <div style="font-size:14px;color:#111827;line-height:1.6;
                    margin-bottom:12px;">
          Hi {{first_name}}, get real-time pipeline visibility + AI risk alerts. Close 23% more deals.
          <br><br>
          Try Pipeline Pro free for 14 days (no card needed): bit.ly/pipelinepro
        </div>
        <div style="font-size:12px;color:#6b7280;">
          Text STOP to opt out
        </div>
      </div>
    </div>

    <div style="margin-top:16px;padding:12px;background:#f0fdf4;
                border-radius:8px;border-left:4px solid #10b981;">
      <div style="font-size:12px;font-weight:600;color:#6b7280;
                  text-transform:uppercase;margin-bottom:4px;">
        Best Sent
      </div>
      <div style="font-size:13px;color:#111827;">
        Tuesday or Wednesday, 10:30 AM (mid-morning B2B engagement window)
      </div>
    </div>

  </div>
</details>

## Common Pitfalls to Avoid

**Exceeding 160 chars** - Splits into multi-part, costs more, harder to read
**Unclear sender** - "Who is this?" → instant delete
**No opt-out** - Violates TCPA, major fines possible
**Vague CTA** - "Check this out" doesn't drive action
**Broken links** - Always test on mobile device first
**Too frequent** - More than 4/month = high opt-out rate
**Wrong timing** - 2am texts = angry customers

**Do this instead**: Stay under 160 chars, clear sender ID, always include STOP, specific CTAs, test links, max 4/month, send 10am-8pm

---

**Tip**: SMS works best in combination with email. Use SMS for urgency (flash sales, event reminders), email for storytelling (product launches, thought leadership).
