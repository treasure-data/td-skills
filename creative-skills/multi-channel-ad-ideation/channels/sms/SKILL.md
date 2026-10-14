---
name: sms
description: "Generate SMS and text message advertising concepts optimized for 160-character constraints, including personalization, CTA optimization, compliance handling, and send-time recommendations. Use when the user asks about SMS campaigns, text message marketing, mobile ad copy, texting promotions, or SMS marketing strategy."
---

# SMS Ad Ideation

Generate ultra-concise SMS advertising concepts optimized for mobile delivery.

## Integration with Multi-Channel Skill

Operates **standalone** or **delegated from multi-channel-ad-ideation**.

**Standalone**: User directly invokes "Generate SMS ad concepts for..."

**Delegated**: Multi-channel skill passes creative direction, brief, segment, character limit (160 or 300), and concept count (usually 3-5). Use this context to craft messages aligned with the creative direction while respecting character limits.

## Constraints

- **160 characters** for single SMS (spaces count)
- **300 characters** max for multi-part SMS (splits into 2-3 messages)
- **Plain text only** — no HTML, images, or formatting
- **Compliance** — every promotional SMS must include opt-out and brand identification

## Workflow

### Phase 1: Generate Text Concepts

Generate **3-5 SMS concepts** using **collapsed card format** from `../references/card-templates.md`:
- All concepts start **collapsed** (user clicks to expand)
- Summary: concept name (24px/800 font) + message preview as tagline
- **Do NOT include character counts** in output
- Use green accent color (#10b981) for SMS visual distinction
- Include: Message text, opt-out, best send time

### Phase 2: Validate Character Counts

After generating each concept, count the total characters (message + CTA link + opt-out). If over the target limit (160 single / 300 multi-part), revise immediately — trim filler words, shorten the CTA, or abbreviate before presenting to the user.

### Phase 3: ASCII Preview (After Confirmation)

**ONLY generate ASCII previews AFTER user confirms text concepts**:
```
┌──────────────────────────┐
│ Message text formatted   │
│ as it appears on mobile  │
│ [CTA link]               │
│ [Opt-out text]           │
└──────────────────────────┘
```

Generate when user says "show me the previews" or "generate ASCII boxes" — NOT during first concept generation.

## Character Limit Formulas

**Single SMS (160 chars)**: [Hook] + [Offer] + [CTA] + [Link] + [Opt-out]
```
FLASH SALE: 40% off everything ends in 6 hours! Shop now: bit.ly/flash40

Reply STOP to unsubscribe
```

**Multi-Part SMS (300 chars)**: [Personalized Hook] + [Problem/Benefit] + [Offer] + [CTA] + [Link] + [Urgency] + [Opt-out]
```
Hi {{first_name}}, struggling to hit Q1 targets?

Pipeline Pro gives real-time visibility + AI alerts. Close 23% more deals.

Try free 14 days: bit.ly/pipelinepro
Founder pricing ends Friday - save $3,600/year.

Text STOP to opt out
```

## Conciseness Techniques

- Use %, &, $, numbers instead of words. Avoid "ur", "w/" (unprofessional).
- Lead with action: "SALE NOW: 40% off" not "We wanted to let you know our sale is starting"
- Drop pleasantries — get straight to the offer.

## CTA & Personalization

**Short URLs**: Use bit.ly or branded shorteners, not long URLs with UTM parameters.

**Action CTAs**: "Shop now: [link]", "Claim offer: [link]". Avoid "Click here" (tap on mobile) or "Learn more" (too vague).

**Personalization tags**: `{{first_name}}`, `{{offer_code}}`, `{{product_name}}`, `{{cart_total}}`. Skip personalization for urgent flash sales where brevity matters more.

## Timing

| Audience | Best windows | Avoid |
|----------|-------------|-------|
| B2C | 12-1pm, 5-8pm | Before 10am, after 9pm |
| B2B | 10-11am, 2-3pm weekdays | Monday AM, Friday PM, weekends |
| Flash sales | Launch 9am or 7pm; reminders at 6hr, 1hr, 30min | — |

Max 4 promotional messages/month. Transactional messages have no limit.

## Compliance

Every promotional SMS must include:
1. Opt-out: "Reply STOP to unsubscribe" or "Text STOP to opt out"
2. Brand identification: consistent sender name
3. Prior explicit opt-in from recipient

Honor opt-outs immediately.
