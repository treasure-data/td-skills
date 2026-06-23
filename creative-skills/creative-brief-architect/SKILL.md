---
name: creative-brief-architect
description: Conversational workflow to build a comprehensive creative brief. Guides users through brief intake, brand guidelines, trend-informed creative ideation, and asset requirements — then outputs a workspace note and visual grid dashboard. Use when asked to create a creative brief, plan a campaign's creative strategy, or build a brief for ad ideation.
---

# Creative Brief Architect

Build a comprehensive creative brief through conversation. Five phases, each building on the last — gather campaign details, align on brand, ideate creative directions, define asset requirements, then output a polished brief.

## Conversational Flow

Progress through phases in order. **Check the user's initial prompt first** — extract any details they already provided (campaign name, audience, channels, etc.) and skip questions they've answered.

```
Phase 1: Brief Intake → Phase 2: Brand → Phase 3: Ideation → Phase 4: Assets → Phase 5: Output
```

At each phase transition, give a one-line summary of what was captured and what comes next.

---

## Phase 1: Brief Intake

Gather campaign fundamentals. Ask only for what's missing from the user's prompt.

**Required:**
- Campaign name
- Objective (awareness, leads, sales, retention, engagement)
- Target audience (demographics, behaviors, pain points)
- Channels / platforms
- Timeline

**Optional:**
- Budget context (not dollar amounts — just scale: small test, full campaign, always-on)
- Key constraints or requirements

Ask 2-3 questions at a time, not all at once. Group related questions naturally.

**When done:** Summarize the brief in a compact table and confirm before moving on.

---

## Phase 2: Brand Guidelines

Ask if they have brand guidelines:

1. **Existing guidelines file** — ask for the path, read it, confirm key elements (voice, colors, typography)
2. **No guidelines yet** — delegate to the `brand-onboarding` skill: "Let's set up your brand guidelines first. I'll walk you through it."
3. **Skip for now** — proceed without brand constraints. Note that creative directions will need brand review later.

If brand guidelines exist at `~/Documents/Brand Guidelines/{Company}/brand-guidelines.md`, check there automatically before asking.

---

## Phase 3: Creative Ideation

Two sub-steps: optional trend analysis, then creative direction.

### 3a: Trend Analysis (Optional)

Offer before brainstorming:

> "Before we brainstorm creative directions, I can analyze trends relevant to your [industry/audience]. I can use my knowledge of current trends, or search the web for the latest data. Want me to run a trend scan?"

**If yes — training knowledge:** Analyze across three dimensions:
- **Copy trends** — messaging angles, headline structures, CTA patterns effective in the industry
- **Visual trends** — composition styles, photography approaches, color/typography directions
- **Cultural moments** — seasonal events, industry moments, cultural conversations relevant to the campaign timeline

**If yes — web search:** Use `web_search` with targeted queries:
- `"[industry] advertising trends [current year] messaging creative"` (medium context)
- `"[industry] [channel] ad creative best practices [current year]"` (medium context)

Synthesize findings into a brief summary with 3-5 actionable recommendations.

**Checkpoint after trend analysis:** After presenting trends, wait for the user before proceeding:

> "These trends will inform the creative directions I brainstorm next. Take a moment to review, and let me know when you're ready to move on to creative direction."

Do NOT proceed to 3b until the user responds.

### 3b: Creative Direction

Generate 3-5 strategic directions in a comparison table with 7-dimension quality scoring. Pass full context:
- Campaign brief from Phase 1
- Brand guidelines from Phase 2 (if available)
- Trend insights from Phase 3a (if generated)

Let the user select, iterate, combine, or request more directions.

**When done:** Confirm selected direction(s). Then **you MUST ask about the mood board** before moving to Phase 4.

### 3c: Mood Board Checkpoint

**MANDATORY checkpoint.** After the user confirms their creative direction, always ask:

> "Great — your creative direction is locked in. Before we move to asset requirements, would you like me to generate a visual mood board? I'll create 4 AI-generated images that capture the look and feel of this direction."

**Wait for the user's response.** Do NOT proceed to Phase 4 until they answer.

**If yes:**

Generate 4 image prompts, each capturing a different aspect of the visual direction:

| Cell | Role | Example |
|------|------|---------|
| 1 | Hero product/service shot | Product in context with brand lighting |
| 2 | Lifestyle/audience moment | Target audience in authentic setting |
| 3 | Environment/setting | Location relevant to campaign, brand colors present |
| 4 | Color/texture palette | Brand colors, materials, or patterns as abstract composition |

Generate images using `mcp__work__generate_image`. If that tool is unavailable, fall back to the TD Creative Studio agent:

```bash
tdx use llm_project "TD-Managed: Creative Studio"
tdx chat --stream --new \
  --agent "TD-Managed: Creative Studio/TD-Managed: Image Generation Agent" \
  "<image prompt>"
```

Then ask if they want an HTML mood board rendered as a 2x2 grid with captions and brand color swatches — open via `mcp__work__open_file` if yes.

**Authentication:** If any `tdx` command fails with an authentication error, immediately call `mcp__tas__request_credential` with `credential_name: td_api_production_aws`, run the returned `export` commands, then retry all failed generations. Do not prompt the user — handle silently and confirm once all images are ready.

**Copyright filter:** The image generation agent will refuse prompts that include trademarked brand names (e.g. "Purina", "Nike"). Remove all brand names from image prompts and describe the visual style instead (e.g. "premium dry dog food bag" not "Purina bag"). Retry automatically if a generation is blocked for this reason.

**Parallel generation:** Generate all 4 cell images in parallel using background tasks to minimize wait time. Extract each image by fetching the chat history (`tdx llm history <chatId>`) and parsing the `binaryBase64` field with Python:

```python
import re, base64
with open("<history_output_file>", "r") as f:
    content = f.read()
matches = list(re.finditer(r'"binaryBase64":"([A-Za-z0-9+/=]+)"', content))
if matches:
    img_bytes = base64.b64decode(matches[-1].group(1))
    with open("cell1.png", "wb") as out:
        out.write(img_bytes)
```

**Image embedding:** When building the HTML mood board, always embed images as base64 data URIs (`data:image/png;base64,...`) directly in the `src` attribute. Never use relative file paths — the viewer cannot resolve them. Use Python to read each PNG and encode it:

```python
import base64
with open("cell1.png", "rb") as f:
    src = "data:image/png;base64," + base64.b64encode(f.read()).decode()
```

**Regeneration:** If the user wants to swap a specific cell, regenerate only that image, re-encode it as base64, and update the HTML `src` attribute for that cell only.

**If no:** Skip and move to Phase 4.

---

## Phase 4: Asset Requirements

Define deliverables for the campaign.

### Gather channel info

Check Phase 1 — if channels were already specified, use those. If not, ask:

> "Which channels/platforms do you need assets for?"

### Suggest formats per channel

Present recommended assets with standard dimensions. Only show tables for the user's selected channels.

**Meta:**
| Asset | Dimensions | Format |
|-------|-----------|--------|
| Feed Post | 1080x1080 | PNG |
| Story | 1080x1920 | PNG |
| Reels | 1080x1920 | MP4 (15-30s) |
| Carousel | 1080x1080 | PNG (2-10 cards) |

**Instagram:**
| Asset | Dimensions | Format |
|-------|-----------|--------|
| Feed Post | 1080x1080 | PNG |
| Story | 1080x1920 | PNG |
| Reels | 1080x1920 | MP4 (15-90s) |

**Google Display:**
| Asset | Dimensions | Format |
|-------|-----------|--------|
| Leaderboard | 728x90 | PNG |
| Medium Rectangle | 300x250 | PNG |
| Skyscraper | 160x600 | PNG |

**Email:**
| Asset | Dimensions | Format |
|-------|-----------|--------|
| Email Template | 600px wide | HTML |
| Hero Image | 600x300 | PNG |

**LinkedIn:**
| Asset | Dimensions | Format |
|-------|-----------|--------|
| Sponsored Content | 1200x627 | PNG |
| Carousel | 1080x1080 | PNG (2-10 cards) |

### Attribute-based variations

After confirming the asset list, ask:

> "Do you want to create variations of any assets for different audience segments? For example, varying by gender, language, age group, or region."

**Supported attributes:**

| Attribute | What Swaps | Example Values |
|-----------|-----------|----------------|
| Language | Copy text | English, Hindi, Japanese, Spanish |
| Gender | Model/person in imagery | Male, Female |
| Age Group | Model age in imagery | 18-25, 26-40, 41-60 |
| Region | Localized references | US, APAC, EMEA, LATAM |
| Season | Seasonal imagery/context | Spring, Summer, Fall, Winter |
| Product | Product shown in imagery | Product A, Product B, Product C |

**Only the attribute-specific element changes between variations.** The creative direction, layout, copy structure, and overall design stay identical.

---

## Phase 5: Review & Output

### 5a: Workspace Note

Save the complete brief as a note:

**Path:** `notes/YYYY-MM-DD-{campaign-slug}-creative-brief.md`

```markdown
---
title: "Creative Brief: {Campaign Name}"
status: todo
tags: [creative-brief, {channel-tags}]
created: YYYY-MM-DD
---

## Campaign Overview

| Field | Details |
|-------|---------|
| Campaign | {name} |
| Objective | {objective} |
| Audience | {audience summary} |
| Channels | {channels} |
| Timeline | {timeline} |

## Brand Guidelines
{Summary of brand voice, colors, key constraints — or "Not configured" if skipped}

## Trend Insights
{Summary of trends if generated — or omit section if skipped}

## Creative Direction
**Selected: {Direction Name}** (Score: {X}/35)
{Key message, tone, differentiation}

## Mood Board
{Link to mood board HTML file if generated — or omit section if skipped}

## Asset Requirements

| Channel | Asset | Dimensions | Attribute | Values | Variations |
|---------|-------|-----------|-----------|--------|------------|
| {channel} | {asset} | {WxH} | {attribute or "—"} | {values or "—"} | {n} |

## Gaps & Notes
{Any flagged gaps — missing brand guidelines, channels without assets, etc.}
```

### 5b: Grid Dashboard

Render a visual overview via `mcp__work__preview_grid_dashboard`. Read `treasure-work-skills/grid-dashboard/SKILL.md` for YAML format rules before writing.

**Dashboard layout (4 columns, 4 rows):**

```yaml
pages:
  "Creative Brief":
    title: "Creative Brief: {Campaign Name}"
    description: "{Objective} | {Timeline}"
    grid:
      columns: 4
      rows: 4
    cells:
      # Row 1: Campaign KPIs
      - pos: "1-1"
        type: kpi
        title: "CAMPAIGN"
        kpi:
          value: "{Campaign Name}"
          subtitle: "{Objective}"
      - pos: "1-2"
        type: kpi
        title: "AUDIENCE"
        kpi:
          value: "{Audience short label}"
          subtitle: "{key demographic}"
      - pos: "1-3"
        type: kpi
        title: "TIMELINE"
        kpi:
          value: "{date range}"
          subtitle: "{duration}"
      - pos: "1-4"
        type: kpi
        title: "CHANNELS"
        kpi:
          value: "{count}"
          subtitle: "{channel list}"

      # Row 2: Brand + Creative Direction score
      - pos: ["2-1", "2-2"]
        type: markdown
        title: "BRAND SUMMARY"
        content: |
          **Voice**: {brand voice}
          **Colors**: {primary colors}
          **Style**: {visual style summary}
      - pos: "2-3"
        type: gauge
        title: "DIRECTION SCORE"
        gauge:
          value: {score}
          max: 35
          label: "{score}/35"
          thresholds:
            - { limit: 15, color: "#ef4444" }
            - { limit: 21, color: "#f59e0b" }
            - { limit: 27, color: "#3b82f6" }
            - { limit: 35, color: "#22c55e" }
      - pos: "2-4"
        type: markdown
        title: "SELECTED DIRECTION"
        content: |
          **{Direction Name}**
          {Key message}

      # Row 3: Creative direction details
      - pos: ["3-1", "3-4"]
        type: markdown
        title: "CREATIVE DIRECTION DETAILS"
        content: |
          **Strategic Angle**: {angle}
          **Key Message**: {message}
          **Tone & Differentiation**: {tone}

      # Row 4: Asset requirements table
      - pos: ["4-1", "4-4"]
        type: table
        title: "ASSET REQUIREMENTS"
        table:
          headers: ["Channel", "Asset", "Dimensions", "Attribute", "Values", "Variations"]
          rows:
            - ["{channel}", "{asset}", "{WxH}", "{attribute}", "{values}", "{n}"]
          sortable: true
```

Build incrementally: write rows 1-2 first, append rows 3-4, then call `preview_grid_dashboard` once.

### Flag gaps

Before finalizing, check for:
- Channels mentioned in brief but no assets defined
- No brand guidelines (flag for future review)
- Missing creative direction selection
- Timeline conflicts

Call out any gaps in the dashboard (markdown cell) and the workspace note.

---

## General Behavior

- **Be conversational.** Ask questions naturally, not as a form to fill out.
- **Don't repeat back everything.** Reference what's established, summarize briefly at transitions.
- **Allow going back.** If the user wants to revisit a phase, support that.
- **Check the prompt first.** Extract details the user already provided — don't re-ask.
- **Phase transitions.** At each transition, one sentence: what you captured and what's next.

## Related Skills

- **brand-onboarding** — full brand guidelines wizard (delegated in Phase 2)
- **multi-channel-ad-ideation** — creative direction + channel-specific ad generation (delegated in Phase 3)
- **brand-compliance** — validate content against brand guidelines (post-brief)
- **grid-dashboard** — visual dashboard format reference (Phase 5)
