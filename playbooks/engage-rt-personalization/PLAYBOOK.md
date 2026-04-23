---
name: engage-rt-personalization
description: Deliver dynamic in-app content (popup/embed) designed in Engage Studio via Realtime Personalization API, enabling frontend to render personalized content based on user profile attributes.
prerequisites:
  - Parent segment created in Data Workbench
  - RT 2.0 enabled by TD CSM (Reactor instance provisioned)
  - Engage Studio access
  - Master API key with full permissions
related_skills:
  - rt-config
  - rt-config-events
  - rt-config-attributes
  - rt-config-id-stitching
  - rt-config-setup
  - rt-personalization
  - rt-personalization-validation
  - rt-setup-personalization
engage_skills:
sdk_skills:
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
