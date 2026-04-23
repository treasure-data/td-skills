---
name: engage-rt-personalization
description: Deliver dynamic in-app content (popup/embed) designed in Engage Studio via Realtime Personalization API, enabling frontend to render personalized content based on user profile attributes.
prerequisites:
  - Parent segment created in Data Workbench
  - RT 2.0 enabled by TD CSM (Reactor instance provisioned)
  - Engage Studio access
  - Master API key with full permissions
related_skills:
  - realtime-skills:rt-config
  - realtime-skills:rt-config-events
  - realtime-skills:rt-config-attributes
  - realtime-skills:rt-config-id-stitching
  - realtime-skills:rt-config-setup
  - realtime-skills:rt-personalization
  - realtime-skills:rt-personalization-validation
  - realtime-skills:rt-setup-personalization
  - tdx-skills:engage
  - sdk-skills:td-javascript-sdk
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

1. **Start with simple entry criteria** — Use event-only triggers first, add attribute conditions incrementally to avoid complexity
2. **Test with real user IDs** — Use actual `td_client_id` values from your event data, not test values, to verify RT processing
3. **Design mobile-first** — Preview Engage content on mobile viewport (320px) before desktop to ensure responsive design
4. **Implement frequency capping** — Prevent message fatigue with "once per day" or "once per session" limits in Engage campaign settings
5. **Monitor API latency** — Target < 500ms response time; implement client-side caching if latency exceeds 1 second
6. **Use environment variables** — Never hardcode personalization tokens in client-side code; use build-time env vars
7. **Track impressions and clicks** — Send `modal_shown` and `modal_closed` events for analytics and optimization
8. **Graceful degradation** — Always render fallback content if personalization API fails to prevent broken user experience

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
3. **Wait 1-2 minutes** after sending event before fetching (RT processing delay)
4. **Test with simplified criteria** - Remove attribute conditions, use event-only trigger

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

**Example:**
```javascript
// Test from console on your domain
fetch('https://us01.p13n.in.treasuredata.com/audiences/.../personalizations/...?td_client_id=test', {
  headers: {'Authorization': 'TD1 YOUR_TOKEN'}
})
.then(r => r.json())
.then(console.log)
```

---

### Issue: Content Doesn't Match Design

**Symptoms:**
- Modal renders but looks broken
- CSS conflicts with page styles
- Layout is distorted or unstyled

**Solutions:**
1. **Preview content in Engage Studio first** - Use preview mode to verify design
2. **Test with simplified HTML** - Remove custom CSS, use basic HTML to isolate issue
3. **Check for z-index conflicts** - Ensure modal has high z-index (10000+)
4. **Inspect CSS specificity** - Page styles may override modal styles

**Advanced:** Use Shadow DOM to isolate styles:
```javascript
const shadowRoot = document.createElement('div').attachShadow({mode: 'open'});
shadowRoot.innerHTML = contentHtml;
document.body.appendChild(shadowRoot.host);
```

**Debug:** See [Step 5 - Troubleshooting](steps/05-frontend-integration.md#troubleshooting)

---

### Issue: High API Latency

**Symptoms:**
- Personalization API takes > 2 seconds to respond
- Page feels slow, users see delay before content appears

**Solutions:**
1. **Simplify entry criteria** - Remove unnecessary attribute conditions
2. **Reduce catalog lookup columns** - Only return essential fields
3. **Implement client-side caching**:
   ```javascript
   const cache = new Map();
   const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
   
   function getCachedPersonalization(userId) {
     const cached = cache.get(userId);
     if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
       return cached.data;
     }
     return null;
   }
   ```
4. **Consider server-side proxy** for personalization API if client-side is too slow

**Monitor:** Track latency with `performance.now()` and send to analytics

---

### Issue: td_in_app.message_json Field Missing

**Symptoms:**
- API returns offers but no `td_in_app.message_json` field
- Payload has attributes but no Engage content

**Solutions:**
1. **Verify Engage campaign is Active** (not Draft or Paused)
2. **Re-link campaign to section**:
   - Engage Studio → Campaign → Audience & Targeting
   - Select correct Personalization and Section
3. **Wait 1-2 minutes** after launching campaign for payload to update
4. **Check campaign type** - Must be "In-App Message" (not Email)

**Verify:**
```bash
curl "https://api-cdp.treasuredata.com/entities/realtime_personalizations/<pz_id>" \
  -H "Authorization: TD1 ${TD_API_KEY}" | jq '.data.attributes.sections[].payload'
```

## Resources

### Official Documentation

- [RT 2.0 Overview](https://docs.treasuredata.com/display/public/PD/RT+2.0) — Comprehensive guide to Realtime features
- [Personalization API Reference](https://api-docs.treasuredata.com/) — API endpoint specifications and authentication
- [Engage Studio Guide](https://docs.treasuredata.com/display/public/PD/Engage+Studio) — In-app message campaign creation
- [TD JavaScript SDK](https://github.com/treasure-data/td-js-sdk) — SDK documentation and examples

### Related Skills

**Orchestrator Skills:**
- `rt-setup-personalization` — Complete automated setup
- `rt-setup-triggers` — Event-driven journeys alternative

**Component Skills:**
- `rt-config`, `rt-personalization`, `engage`, `td-javascript-sdk` — Individual component configuration

**Debugging Skills:**
- `activations`, `identity`, `rt-journey-monitor` — Log queries and troubleshooting

### Code Examples

- [Complete frontend integration](examples/frontend-integration.html) — Full working example with HTML/JavaScript
- [Personalization payload samples](examples/personalization-payload.json) — API response examples

### Internal Resources

- RT 2.0 internal runbook: "How to setup an end-to-end realtime application"
- Engage Studio BeeTree editor guide
- API Admin / Provisioner documentation (Reactor instance setup)
