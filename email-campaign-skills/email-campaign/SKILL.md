---
name: email-campaign
description: This skill should be used when the user asks to "create an email", "build an email campaign", "design an email template", "generate an email for a segment", "preview an email", or "push an email to Engage". Generates enterprise-grade HTML email templates with live preview in Treasure Studio and natural language editing, then pushes the final version to Treasure Engage.
version: 1.1.0
---

# Email Campaign Builder

This skill produces channel-ready HTML email campaigns for defined audience segments. It generates strategy briefs, renders live previews in the Treasure Studio artifact panel, supports iterative natural language editing, and pushes finalized emails to Treasure Engage via a TD Workflow.

## When to Use This Skill

Use this skill when:
- The user asks to "create an email", "build an email campaign", or "design an email template"
- The user wants to "generate an email for a segment" based on audience data
- The user requests a "preview" of an email in Treasure Studio
- The user says "push to Engage", "ship it", or "send to Engage" to publish a finalized email
- The user needs A/B testing variants for an email campaign

## Core Principles

### 1. Strategy Before Design

Always produce a **strategy brief** before writing any HTML. Analyze the audience segment, determine the right message and offer, then generate the email.

**Example brief output:**
```
Segment: Gold Tier — High Intent
Audience: 2,400 active members, 85% email open rate
Message: Urgency — "Your exclusive early access expires Friday"
Offer: No discount (high-intent segment). Use exclusivity + scarcity.
Imagery: Premium lifestyle, curated product selection
```

### 2. Offer Logic Is Segment-Driven

Not every segment should receive a discount. Match the offer strategy to the audience profile.

| Segment Profile | Offer Strategy |
|---|---|
| Low/medium-conversion, bronze/silver, inactive >30 days | Discount or incentive |
| Gold/platinum, high intent, active | Urgency, exclusivity, or social proof |
| New members, unknown intent | Welcome series, value education |

### 3. Email Client Compatibility First

All HTML must render correctly across Outlook, Gmail, Apple Mail, and Yahoo Mail. This means:
- Table-based layout only — no `<div>` for structure
- All CSS inline — no `<style>` blocks (Gmail strips them)
- `role="presentation"` on all layout tables
- Max width 600px for the content area
- `cellspacing="0" cellpadding="0"` on all tables

See `references/email-design-patterns.md` for complete HTML patterns.

### 4. Personalization via Merge Tags

Use Liquid syntax for all dynamic content. Merge tags render as literal text in preview and are replaced at send time by Treasure Engage.

Available merge tags:
- `{{profile.first_name}}` — customer first name
- `{{profile.loyalty_points}}` — current points balance
- `{{profile.tier_name}}` — loyalty tier (Bronze, Silver, Gold, Platinum)
- `{{profile.points_to_next_tier}}` — points needed for next tier

## Workflow

The skill follows a four-phase loop: **Generate → Preview → Edit → Ship**.

### Phase 1: Generate

When the user requests an email campaign, produce a strategy brief first:

1. **Segment analysis** — identify the audience by loyalty tier, conversion likelihood, and behavioral traits.
2. **Strategy brief** — output a concise brief with: segment name, audience profile, next best channel, message copy, next best offer, and recommended imagery direction.
3. **HTML email** — generate a complete, standalone HTML email following the design patterns in `references/email-design-patterns.md`. Use BeeFree-compatible, responsive table-based layout with inline CSS.
4. **Save to disk** — write the HTML to `/tmp/email_campaign_preview.html`.

### Phase 2: Preview

After generating the HTML, render it in the Treasure Studio artifact panel:

```
mcp__tdx-studio__preview_document(path="/tmp/email_campaign_preview.html")
```

Tell the user: "Here's the email preview. Describe any changes you'd like, or say **push to Engage** when you're ready."

### Phase 3: Edit (iterative)

When the user requests changes:

1. Read the current HTML from `/tmp/email_campaign_preview.html`.
2. Apply the requested modifications (copy changes, color updates, image swaps, layout adjustments, CTA rewording, etc.).
3. Write the updated HTML back to `/tmp/email_campaign_preview.html`.
4. Re-render the preview with `mcp__tdx-studio__preview_document`.
5. Repeat until the user approves.

Keep a running list of merge tags used in the email (e.g., `{{profile.first_name}}`, `{{profile.loyalty_points}}`). Display these after each preview so the user knows what personalization is active.

### Phase 4: Ship to Engage

When the user says "push to Engage", "ship it", "publish", or "send to Engage":

1. Read the final HTML from `/tmp/email_campaign_preview.html`.
2. Run the Engage email builder workflow. Refer to `references/engage-integration.md` for the exact command and parameters.
3. Report the result and link to Engage Studio: `https://console-next.us01.treasuredata.com/app/es/01997f0c-44e7-798f-b4a9-68c8e8810d24/em/templates`

## Common Patterns

### Pattern 1: Tier Advancement Campaign

Target gold-tier members close to platinum with urgency and exclusivity.

```html
<h1>{{profile.first_name}}, you're almost there.</h1>
<p>You're just <strong>{{profile.points_to_next_tier}} points</strong> away
from unlocking <strong>Platinum</strong> tier.</p>
```

**When to use:** Members within 20% of the next tier threshold who have been active in the last 30 days.

### Pattern 2: Win-Back Campaign

Re-engage inactive members with a compelling offer.

```html
<h1>We miss you, {{profile.first_name}}.</h1>
<p>It's been a while — and we've been saving something special for your return.</p>
```

**When to use:** Members with no purchase activity in 30+ days, bronze or silver tier.

### Pattern 3: A/B Testing Variants

Generate two distinct variants for testing copy or CTA effectiveness.

1. Generate Variant A and Variant B with distinct copy or CTA changes.
2. Save each to separate files: `/tmp/email_campaign_variant_a.html` and `/tmp/email_campaign_variant_b.html`.
3. Preview each in sequence using `preview_document`.
4. When shipping, push both variants and note which is A vs B.

**When to use:** The user explicitly requests A/B testing or you recommend it for campaigns targeting >5,000 recipients.

## Best Practices

1. **Strategy first** — Always generate a strategy brief before writing HTML. Never skip audience analysis.
2. **No discounts for high-intent segments** — Use urgency, exclusivity, or social proof for gold/platinum or active users.
3. **Standalone HTML only** — No external stylesheets, no JavaScript, no `<style>` blocks.
4. **HTTPS imagery only** — Use Unsplash or Pexels. Never use AI-generated images.
5. **Accessible by default** — Include descriptive ALT text on all images.
6. **Footer in every email** — Always include unsubscribe link and preference center link.
7. **Professional tone** — No emojis or conversational phrasing in the email content.
8. **Track merge tags** — Display the list of active merge tags after each preview cycle.
9. **Test across clients** — Design for Outlook, Gmail, Apple Mail, and Yahoo Mail compatibility.
10. **Save before preview** — Always write HTML to disk before calling `preview_document`.

## Common Issues and Solutions

### Issue: Email renders incorrectly in Outlook

**Symptoms:**
- Layout breaks, columns misaligned, or background colors missing in Outlook

**Solutions:**
1. Ensure all layout uses `<table>` elements, not `<div>`.
2. Avoid CSS shorthand (`background` → use `background-color`).
3. Add `mso-` conditional comments for Outlook-specific fixes if needed.
4. Keep all CSS inline — Outlook strips `<style>` blocks.

### Issue: Merge tags appear as literal text in sent emails

**Symptoms:**
- Recipients see `{{profile.first_name}}` instead of their actual name

**Solutions:**
1. Verify the Engage template is configured for Liquid rendering.
2. Confirm field names match the CDP parent segment output schema (e.g., `first_name`, not `firstName`).
3. Check that the merge tag syntax uses double curly braces: `{{profile.field_name}}`.

### Issue: `engage_email_builder` workflow not found

**Symptoms:**
- `tdx wf workflows engage_email_builder` returns no results

**Solutions:**
1. The workflow hasn't been deployed to this account yet.
2. Offer to export the HTML file so the user can paste it into Engage Studio manually.
3. Save the final HTML to `~/email_exports/campaign_name_YYYY-MM-DD.html`.

**Example:**
```bash
# Fallback: manual export
cp /tmp/email_campaign_preview.html ~/email_exports/campaign_name_2025-01-15.html
```

### Issue: Images not loading in preview

**Symptoms:**
- Broken image icons in the Treasure Studio preview panel

**Solutions:**
1. Verify image URLs use HTTPS (not HTTP).
2. Confirm the Unsplash/Pexels photo ID is valid.
3. Check the `?auto=format&fit=crop&w=1200&q=80` query parameters are present.

## Related Skills

- **tdx-skills:segment** — Create and manage the CDP audience segments that feed into email campaigns.
- **tdx-skills:parent-segment** — Define master customer tables with the attributes and behaviors used for merge tags.
- **tdx-skills:parent-segment-analysis** — Query parent segment data to understand audience profiles before generating campaigns.
- **tdx-skills:connector-config** — Configure Engage activations for segment-triggered email sends.
- **workflow-skills:workflow** — Manage the `engage_email_builder` TD Workflow used to push emails to Engage.

## Resources

- [Treasure Engage documentation](https://docs.treasuredata.com/articles/#!int/engage-overview)
- [Email design patterns reference](references/email-design-patterns.md)
- [Engage integration guide](references/engage-integration.md)
- [Sample campaign email](examples/sample-campaign.html)
