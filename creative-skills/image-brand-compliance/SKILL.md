---
name: image-brand-compliance
description: Review image files (PNG/JPEG) against brand guidelines — score visual compliance across 8 dimensions, identify violations with exact fixes, and apply corrections via Pillow or AI regeneration. Use when reviewing ad creatives, social media images, or AI-generated visuals for brand alignment. Triggers on "check this image against brand", "review this ad image", "score this creative", "is this image on-brand", "fix brand violations on this image". For HTML/email/SMS content review, use the brand-compliance skill instead.
---

# Image Brand Compliance

Review image files (PNG/JPEG) against brand guidelines. Score across 8 visual compliance dimensions, identify violations with exact locations, and apply fixes when the user accepts them.

For HTML emails, SMS copy, or text-based content, use the [brand-compliance](../brand-compliance/SKILL.md) skill instead. This skill focuses on pixel-level visual analysis of image files.

## When to Use This Skill

**Use this skill when:**
- "Review this Instagram ad image against our brand guidelines"
- "Check if this hero image follows brand standards"
- "Score this AI-generated ad for brand compliance"
- "Fix the brand violations on this PNG"
- "Is this social media image on-brand?"
- Validating image-gen or image-editor output before publishing

**Use brand-compliance instead when:**
- Reviewing HTML email templates, SMS copy, or text content
- Checking legal/CAN-SPAM/TCPA compliance on email or SMS
- Scoring content that is primarily text-based

---

## Inputs Required

1. **Image** — file path to a PNG or JPEG (e.g., `/tmp/instagram-ad.png`)

2. **Brand Guidelines** — one of:
   - File path to markdown or PDF guidelines (e.g., `./brand-guidelines.md`)
   - Inline text pasted into the prompt
   - Auto-detect: look for `brand-guidelines.md` in the current working directory

If either input is missing, ask for it before proceeding. If no brand guidelines are available, prompt the user to create one using [`brand-compliance/references/brand-guidelines.md`](../brand-compliance/references/brand-guidelines.md) as a template.

---

## Workflow

### Step 1 — Parse Brand Guidelines

Read the provided brand guidelines and extract image-relevant rules:
- **Color palette**: Primary, secondary, CTA, background hex codes and usage context rules
- **Logo**: Variants (dark/light), placement zones, minimum size, clear space, allowed backgrounds
- **Typography**: Font families, weights, sizes for text overlays
- **Imagery style**: Photography mood, subject framing, lighting, prohibited aesthetics
- **Messaging lexicon**: Approved/prohibited terms, taglines, brand signature
- **Legal marks**: Required disclosures (FTC #ad, copyright, trademarks)
- **Accessibility**: Contrast requirements, minimum font sizes
- **Channel specs**: Target dimensions, aspect ratios, file size limits

Note which sections are unconfigured — only score against configured sections.

### Step 2 — Analyze the Image

Read the image file visually. Assess each compliance dimension against the extracted guidelines:

- **Colors**: Sample dominant and accent colors, compare to brand palette hex codes
- **Logo**: Check presence, variant selection, placement, clear space, size, distortion
- **Typography**: Identify font families and sizes on text overlays, compare to brand spec
- **Imagery mood**: Evaluate subject matter, lighting, composition, emotional tone
- **Copy**: Read all text overlays, check against approved/prohibited terminology
- **Legal**: Check for required marks (FTC disclosure, copyright, trademark symbols)
- **Accessibility**: Estimate text-over-background contrast ratios, assess readability
- **Channel fit**: Check image dimensions and aspect ratio against target channel

Identify specific violations with exact location (e.g., "CTA button area uses `#FF3333` instead of brand CTA `#CC262C`").

### Step 3 — Score and Report

Score across **8 dimensions** (0–5 each, **40 points max**). Only score dimensions where guidelines are configured.

| # | Dimension | What is checked |
|---|-----------|----------------|
| 1 | **Color Palette Accuracy** | Dominant colors match brand hex codes, no off-palette colors in prominent areas, correct color context usage (e.g., CTA color reserved for CTAs only) |
| 2 | **Logo & Visual Identity** | Logo present where required, correct variant (dark/light for background), proper placement zone, adequate clear space, meets minimum size, not distorted |
| 3 | **Typography & Text Overlays** | Correct font family on headline/body overlays, proper weight and size, readable over background, brand-consistent styling |
| 4 | **Imagery Style & Mood** | Photography mood matches brand personality (candid vs staged), subject framing, lighting quality, avoids prohibited aesthetics (heavy filters, stock-photo feel) |
| 5 | **Messaging & Copy** | Text overlays use approved terminology, avoid prohibited terms, match brand voice, tagline/signature present if required |
| 6 | **Legal & Disclosures** | Required marks visible — FTC #ad for sponsored content, copyright notice, trademark symbols, disclaimers appropriately sized and placed |
| 7 | **Accessibility** | Text overlay contrast >= 4.5:1 against background, minimum font size met, recommend alt text for the image |
| 8 | **Channel Specifications** | Image dimensions match target channel (1080x1080 Instagram feed, 1080x1920 story, etc.), file size within limits, correct aspect ratio |

**Compliance tiers:**
- **38–40**: Fully Compliant — Ready to publish
- **32–37**: Mostly Compliant — Minor fixes needed
- **24–31**: Partially Compliant — Significant issues
- **0–23**: Non-Compliant — Major revision required

For detailed scoring criteria per dimension, see [`references/image-scoring-rubric.md`](references/image-scoring-rubric.md).

### Step 4 — Render HTML Compliance Dashboard

Generate an HTML compliance dashboard and save it as `brand-compliance-report-{asset-name}.html` in the working directory.

**Image embedding:** When including the reviewed image or any reference images in the HTML dashboard, always embed them as base64 data URIs (`data:image/png;base64,...`) directly in the `src` attribute. Never use local file paths — the viewer cannot resolve them. Use Python to encode:

```python
import base64
with open("image.png", "rb") as f:
    src = "data:image/png;base64," + base64.b64encode(f.read()).decode()
```

**Dashboard structure:**
1. **Header** — Brand name, asset filename, overall score (large, color-coded by tier), tier label
2. **Dimension breakdown** — 8 rows, each with score badge (0–5) and labeled progress bar
3. **Violations list** — collapsible `<details>`, grouped by dimension, each with: what was found, where in the image, exact fix recommendation
4. **Recommendations** — collapsible `<details>`, prioritized Critical > High > Medium > Low, each with projected score impact
5. **Action prompt** — "Type 'apply fixes' to implement all critical and high-priority changes"

Open with `mcp__work__open_file` if available. If the MCP tool is unavailable, print the file path for the user to open manually.

Also summarize violations in plain text in the chat so the user can act without switching to the dashboard.

### Step 5 — Apply Fixes (on user acceptance)

When the user says "apply fixes", "yes", "make the changes", or accepts specific fixes:

**Prerequisites check**: Before running any Pillow scripts, verify the dependency:
```bash
python3 -c "import PIL" 2>/dev/null || echo "MISSING"
```
If missing, instruct the user to run `pip install Pillow` before proceeding.

**Fix methods by violation type:**

| Violation type | Fix method |
|----------------|-----------|
| Text overlay color or position | Python (Pillow) — composite corrected text over image |
| Logo missing or misplaced | Python (Pillow) — composite logo at correct position with clear space |
| Color overlay or tint correction | Python (Pillow) — apply color adjustment |
| Wrong dimensions or aspect ratio | Python (Pillow) — resize/crop to target specs |
| Wrong subject, mood, or composition | Regenerate with `mcp__work__generate_image` using a corrected prompt built from brand guidelines. If the MCP tool is unavailable, provide the corrected prompt for the user to run with the [image-gen](../multi-channel-ad-ideation/channels/image-gen/SKILL.md) skill. |

For Python/Pillow edits: write a self-contained script to a temp file, run it with Bash, save the corrected image alongside the original (e.g., `{name}-fixed.png`).

After all fixes are applied, **re-run the full scoring analysis** on the updated image and produce a new compliance dashboard showing:
- New overall score and tier
- Per-dimension delta (e.g., "Color Palette: 2 -> 5")
- Remaining violations (if any)
- Confirmation of what was changed

---

## Output Format

### Plain-text summary (always show in chat)

```
Brand Compliance Score: [X]/40 — [Tier]

Violations ([N] found):
1. [Dimension] — [what] at [location]
   Fix: [exact change]
2. ...

Type 'apply fixes' to implement all changes.
```

### After fixes (re-score)

```
Updated Score: [X]/40 — [Tier]  (was [Y]/40)

Changes applied:
- [Fix 1]
- [Fix 2]

Remaining: [N violations] — [list or "None — fully compliant"]
```

---

## Edge Cases

- **Unconfigured guideline sections**: Note which dimensions were skipped and why. Do not penalize for rules that are not defined.
- **Multiple images**: If the user provides 2+ images, score each independently then note cross-image consistency issues.
- **Partial acceptance**: If user says "apply only the color fixes" or "skip the logo", apply only the accepted changes and re-score accordingly.
- **No brand guidelines available**: Prompt the user to provide them. Point to [`brand-compliance/references/brand-guidelines.md`](../brand-compliance/references/brand-guidelines.md) as a template to follow.
- **Pillow not installed**: Detect before attempting fixes. Provide install instructions. Do not attempt Python image edits without confirming the dependency.
- **Image too large or corrupted**: Report the issue and ask the user to provide a valid image file.

---

## Best Practices

- Provide brand guidelines with exact hex codes, not just color names — "Burnt Ochre `#B35D33`" enables precise matching
- Include logo files (dark and light variants) in the guidelines so fixes can composite them automatically
- Specify the target channel (Instagram feed, story, display ad) so channel specifications can be scored
- Run image-brand-compliance after using the image-gen or image-editor skills to catch issues before publishing
- For HTML emails or text content, use brand-compliance instead — it has channel-specific scoring for email/SMS/Instagram copy

---

## Related Skills

- **[brand-compliance](../brand-compliance/SKILL.md)** — Review HTML, email, SMS, and text content against brand guidelines (8-dimension, 0–40 scoring). Use for non-image content.
- **[image-gen](../multi-channel-ad-ideation/channels/image-gen/SKILL.md)** — Generate ad images with AI + text/logo compositing. Run image-brand-compliance on the output to validate.
- **[image-editor](../multi-channel-ad-ideation/channels/image-editor/SKILL.md)** — Interactive drag-and-drop editor for image overlays. Use to manually adjust before re-scoring.
- **[multi-channel-ad-ideation](../multi-channel-ad-ideation/SKILL.md)** — Orchestrate full campaign ideation across channels. Brand guidelines are applied during ideation; use this skill for post-production validation.

---

## Example

For a complete worked example showing an image review, scoring, violation identification, fix application, and re-scoring, see [`examples/image-review-example.md`](examples/image-review-example.md).
