---
name: engage-rt-personalization
description: Deliver dynamic in-app content (popup/embed) designed in Engage Studio via Realtime Personalization API, enabling frontend to render personalized content based on user profile attributes.
---

# Engage Studio Content + Realtime Personalization

Serve dynamic in-app content designed in Engage Studio and delivered via RT Personalization API.

## Overview

This playbook guides you through creating a complete integration where:

1. **Engage Studio** designs the visual content (HTML popup/embed)
2. **RT Personalization** determines which users see the content (based on events + profile attributes)
3. **Frontend** fetches and renders the content via TD JavaScript SDK

**Example use case:** Show "No returns allowed" message on product detail pages when the product is on sale.

## Architecture

```
User visits page
    ↓
Frontend sends event (td.trackEvent)
    ↓
RT evaluates entry criteria (event filters + profile attributes)
    ↓
RT Personalization API returns payload (including Engage content)
    ↓
Frontend renders in-app message
```

## Core Concepts

### 1. Entry Criteria (When to Show Content)

RT Personalization uses two types of conditions to determine when content should be displayed:

**Event-based conditions:**
- Trigger on specific events (e.g., `product_view`, `add_to_cart`)
- Apply filters on event columns (e.g., `product_status is "on_sale"`)
- Supports operators: is, is not, greater than, less than, regex, etc.

**Attribute-based conditions:**
- Filter by user profile attributes (RT or batch)
- Examples: `loyalty_tier is "VIP"`, `page_views_24h >= 5`
- Combine with all (AND), any (OR), or advanced (nested) logic

**Example:** Show message when user views sale product AND is logged in:
```
Event: product_view WHERE product_status = "on_sale"
Attribute: user_id IS NOT NULL
```

### 2. Payload (What Content to Return)

Four payload types define what the personalization API returns:

**Attribute payload:**
- Return RT attributes (single, list, counter) or batch attributes
- Example: `last_product_viewed`, `browsing_history`, `loyalty_tier`

**String builder:**
- Static strings or Engage HTML content
- Automatically populated when Engage campaign is linked
- Contains `td_in_app.message_json` with HTML, type, and style

**Segment payload:**
- Batch segment membership
- Example: User belongs to "spring_sale_2024" segment

**Catalog payload:**
- Enriched data from lookup tables
- Example: Product details joined from `products_master` catalog

### 3. Three-Layer Architecture

**Layer 1: Engage Studio** (Content Design)
- Visual editor (BeeTree) for designing HTML popups/embeds
- No coding required for content creation
- Supports Liquid merge tags for personalization

**Layer 2: RT Personalization** (Delivery Logic)
- Defines WHO sees content (entry criteria)
- Defines WHEN to show (event triggers)
- Defines WHAT to return (payload)

**Layer 3: Frontend SDK** (Rendering)
- Tracks user events (`td.trackEvent`)
- Fetches personalization (`td.fetchPersonalization`)
- Renders content on page (modal, embed, banner)

## Common Patterns

### Pattern 1: Product-Specific Messages

Show different messages based on product attributes (sale status, stock level, category).

**Use case:** "No returns" for sale items, "Low stock" warnings, category promotions.

**Configuration:**
```javascript
// Entry criteria
Event: product_view
Filters: product_status is "on_sale"

// Payload
Engage content: "Sale items are final sale - no returns"
```

**See:** [Step 3 - Audience Studio Setup](steps/03-audience-studio-setup.md)

---

### Pattern 2: User Segment-Based Content

Deliver personalized content based on user loyalty tier or behavior.

**Use case:** VIP-only offers, first-time visitor welcome, cart abandonment recovery.

**Configuration:**
```javascript
// Entry criteria
Event: page_view
Attribute: loyalty_tier is "VIP"

// Payload
Engage content: VIP-exclusive offer popup
RT attributes: loyalty_points, vip_discount_percentage
```

**See:** [Step 3 - Entry Criteria](steps/03-audience-studio-setup.md#attribute-based-conditions)

---

### Pattern 3: Multi-Variant Testing

A/B test different message variations for the same trigger.

**Use case:** Test message copy, CTA buttons, visual design.

**Configuration:**
- Single entry criteria (same trigger event)
- Multiple sections with different Engage content
- Track conversion by section name

**Example:**
```
Section A: "Limited time offer - 20% off!"
Section B: "Don't miss out - Save 20% today!"
Track: td.trackEvent('modal_click', {section: sectionName})
```

**See:** [Step 4 - A/B Testing](steps/04-engage-studio-content.md)

## Workflow Summary

Complete workflow for delivering personalized in-app content:

**1. Configure Realtime (Step 1)**
- Register streaming event tables in Data Workbench
- Create key events with event filters (e.g., product_status = "on_sale")
- Define RT attributes to track user behavior (single, list, counter types)
- Set up ID stitching for profile merging across identifiers

**2. Create Personalization Service (Step 2)**
- Generate access token (public or private mode)
- Configure regional API endpoint
- Validate token with test API call

**3. Configure Section in Audience Studio (Step 3)**
- Create personalization entity and section
- Define entry criteria (event-based + attribute-based conditions)
- Configure payload (attributes, strings, segments, catalog lookups)
- Activate personalization

**4. Design Content in Engage Studio (Step 4)**
- Create in-app message campaign (popup or embed)
- Link campaign to personalization section
- Design content using BeeTree visual editor
- Launch campaign to populate payload

**5. Frontend Integration (Step 5)**
- Initialize TD JavaScript SDK
- Track events that match RT key events
- Call fetchPersonalization API with user context
- Parse response and render in-app message (modal/embed)

**6. Verify and Test (Step 6)**
- Verify RT status, events, and attributes
- Test with matching and non-matching scenarios
- Monitor API latency and debug issues

**For detailed commands and code examples, see the [Steps](#steps) section below.**

## Best Practices

1. **Start with minimal RT configuration and simple entry criteria** — Begin with a single key event without filters, and one simple attribute condition (e.g., `user_id IS NOT NULL`). Avoid complex nested conditions until basic integration works. Add complexity incrementally after validating the foundation.

2. **Design minimal Engage content first** — Start with plain text or simple HTML (single headline + paragraph) in Engage Studio. Avoid images, custom CSS, or Liquid merge tags in the initial test. Verify the content appears correctly before enhancing the design.

3. **Test API directly with curl before frontend integration** — Use curl commands with mock data to validate the personalization API returns expected payloads. This isolates RT/personalization issues from frontend rendering problems:
   ```bash
   # Test personalization API (POST with event data)
   curl -X POST "https://<p13n_host>/<database>/<event_table>" \
     -H "Content-Type: application/vnd.treasuredata.v1+json" \
     -H "Authorization: TD1 ${TD_API_KEY}" \
     -H "wp13n-token: ${TD_PERSONALIZATION_TOKEN}" \
     -d '{
       "email": "test@example.com",
       "event_name": "product_view",
       "page_url": "/products/123",
       "product_status": "on_sale"
     }' | jq '.offers'
   ```
   Only move to frontend integration after confirming API responses are correct.

4. **Monitor API latency** — Target < 500ms response time; implement client-side caching if latency exceeds 1 second to ensure fast page load times.


## Steps

0. [Prerequisite - Realtime Application & Reactor Instance](steps/00-prerequisite.md) *(TD internal only)*
1. [Configure Realtime in Data Workbench](steps/01-configure-realtime.md) *(30 min)*
2. [Configure Personalization Service](steps/02-configure-personalization.md) *(20 min)*
3. [Configure Personalization & Section in Audience Studio](steps/03-audience-studio-setup.md) *(30 min)*
4. [Design In-App Content in Engage Studio](steps/04-engage-studio-content.md) *(30 min)*
5. [Frontend Integration with TD JavaScript SDK](steps/05-frontend-integration.md) *(40 min)*
6. [Verification & Testing](steps/06-verification.md) *(20 min)*


## When to Use This Playbook

Use this playbook when you need to:
- Show personalized popups/banners based on user behavior or profile
- Deliver different content to different user segments in real-time
- Design content in a visual editor (Engage Studio) but control delivery logic via RT
- Combine event-driven triggers with profile-based targeting

**Not covered in this playbook:**
- Email campaigns (use `engage` skill for email templates)
- Server-side personalization (this playbook focuses on client-side integration)
- RT Journeys/Triggers (use `rt-setup-triggers` skill for multi-step activations)

## Related Skills

### Orchestrator Skills (End-to-End Setup)

- **realtime-skills:rt-setup-personalization** — Complete personalization setup from RT configuration to entity deployment. Use when starting from scratch.
- **realtime-skills:rt-setup-triggers** — Complete journey/triggers setup (alternative to personalization for event-driven activations).

### RT Configuration Skills (Step 1)

- **realtime-skills:rt-config** — Initialize RT 2.0 configuration for parent segment.
- **realtime-skills:rt-config-events** — Configure event tables and create key events with filters.
- **realtime-skills:rt-config-attributes** — Define RT attributes (single, list, counter, lookup).
- **realtime-skills:rt-config-id-stitching** — Set up profile merging across multiple identifiers.
- **realtime-skills:rt-config-setup** — Check RT enablement status and validate configuration.

### Personalization Skills (Steps 2-3)

- **realtime-skills:rt-personalization** — Create personalization service and entity with payload definition.
- **realtime-skills:rt-personalization-validation** — Validate personalization entity payloads to prevent API errors.

### Engage Studio Skills (Step 4)

- **tdx-skills:engage** — Create and manage in-app message campaigns, email templates, and Engage content.

### Frontend SDK Skills (Step 5)

- **sdk-skills:td-javascript-sdk** — Implement browser-based event tracking and personalization API calls.

### Monitoring & Debugging Skills (Step 6)

- **realtime-skills:activations** — Query activation logs to debug personalization API calls.
- **realtime-skills:identity** — Query identity change logs to verify profile merging and ID stitching.
- **realtime-skills:rt-journey-monitor** — Monitor RT journey execution (useful for troubleshooting).

### Related CDP Skills (Prerequisites)

- **tdx-skills:parent-segment** — Create and manage parent segments that provide the foundation for RT personalization.
- **tdx-skills:segment** — Create child segments for segment payload (optional, used in attribute payload).
- **tdx-skills:parent-segment-analysis** — Query parent segment data to understand customer profiles before configuring RT.

## Common Issues and Solutions

### Issue: Empty Offers Returned

**Symptoms:**
- API returns `{"offers": {}}`
- Modal doesn't render on page
- Console shows successful API call but no content

**Solutions:**
1. **Verify entry criteria match event data exactly** (case-sensitive)
   ```bash
   # Check actual event data
   SELECT product_status, COUNT(*) 
   FROM web_events.product_views 
   WHERE time > TD_TIME_ADD(TD_SCHEDULED_TIME(), '-1h')
   GROUP BY 1
   ```
2. **Check personalization status** is "Active" (not Draft) in Audience Studio
3. **Test with simplified criteria** - Remove attribute conditions, use event-only trigger

**Debug:** See [Step 6 - Debugging Tools](steps/06-verification.md#debugging-tools)

---

### Issue: CORS Errors in Browser

**Symptoms:**
- Browser console shows: `Access to fetch blocked by CORS policy`
- API call fails with network error
- Personalization works in curl but not in browser

**Solutions:**
1. **Add your domain to CORS allowed origins**
   - Go to Data Workbench → Personalization Service → Token Settings
   - Add `https://yourwebsite.com` to allowed origins
2. **Use wildcard for testing** (not production): Set allowed origins to `*`
3. **Verify token permissions** include CORS access

**Example (server-side proxy recommended):**
```javascript
// ⚠️ Never put a master API key in client-side code or browser console
// For production, call personalization API through your server-side proxy

// Example server-side proxy endpoint (Node.js/Express):
app.post('/api/personalization', async (req, res) => {
  const response = await fetch(`https://${P13N_HOST}/${DATABASE}/${EVENT_TABLE}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/vnd.treasuredata.v1+json',
      'Authorization': `TD1 ${process.env.TD_API_KEY}`,  // Server-side only
      'wp13n-token': process.env.TD_PERSONALIZATION_TOKEN
    },
    body: JSON.stringify(req.body)
  });
  res.json(await response.json());
});

// Client-side call (safe):
fetch('/api/personalization', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'test@example.com',
    event_name: 'product_view',
    page_url: '/products/123'
  })
})
.then(r => r.json())
.then(console.log)
```


## Resources

### Official Documentation

- [RT 2.0 Overview](https://docs.treasuredata.com/display/public/PD/RT+2.0) — Comprehensive guide to Realtime features
- [Personalization API Reference](https://api-docs.treasuredata.com/) — API endpoint specifications and authentication
- [Engage Studio Guide](https://docs.treasuredata.com/display/public/PD/Engage+Studio) — In-app message campaign creation
- [TD JavaScript SDK](https://github.com/treasure-data/td-js-sdk) — SDK documentation and examples


