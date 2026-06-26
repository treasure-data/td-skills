# Example: Image Brand Compliance Review

## Scenario

A marketing team at **TailTrail Pet Nutrition** needs to validate an Instagram feed ad image (`tailtrail-summer-sale.png`) against their brand guidelines before publishing.

---

## Brand Guidelines (excerpt)

```
Brand: TailTrail Pet Nutrition
Tagline: "Real food. Real happy."

Colors:
  Primary: Deep Forest #2D5F3B
  Secondary: Warm Gold #D4A843
  CTA: Sunset Orange #E8733A (reserved exclusively for CTA elements)
  Background: Soft Cream #FFF8F0
  Text: Charcoal #333333

Logo:
  Dark variant: tailtrail-logo-dark.png (for light backgrounds)
  Light variant: tailtrail-logo-light.png (for dark backgrounds)
  Placement: Top-right or bottom-left
  Minimum size: 80px width
  Clear space: 16px on all sides

Typography:
  Headings: Nunito Bold, 36-48px
  Body: Open Sans Regular, 16-24px
  Style: Sentence case (not ALL CAPS)

Imagery Style:
  Mood: Warm, authentic, joyful — real pets in real homes
  Lighting: Natural, soft light preferred
  Prohibited: Stock-photo poses, studio-white backgrounds, heavy filters

Messaging:
  Approved terms: Wholesome, Farm-sourced, Tail-approved, Vet-recommended
  Prohibited terms: Cheap, Budget, All-natural (unsubstantiated), Miracle
  Voice: Friendly, knowledgeable, playful

Legal:
  Copyright: "© 2026 TailTrail Pet Nutrition" required on all assets
  Sponsored: FTC "#ad" disclosure required on paid placements

Accessibility:
  Text contrast: >= 4.5:1 against background
  Minimum font size: 18px for body text

Channel:
  Instagram Feed: 1080x1080, max 30MB
```

---

## Step 1 — Analysis

Claude reads the image `tailtrail-summer-sale.png` and identifies:

- **Headline text**: "SUMMER BLOWOUT — CHEAP EATS FOR YOUR PUP!" in white Impact font
- **Background**: Studio-lit product shot on white backdrop
- **Colors**: Red (#FF0000) CTA banner, white background, black text
- **Logo**: Absent
- **Legal marks**: No copyright, no #ad disclosure
- **Dimensions**: 1200x628 (landscape, not square)

---

## Step 2 — Scoring

| # | Dimension | Score | Notes |
|---|-----------|-------|-------|
| 1 | Color Palette Accuracy | 1/5 | Red CTA (#FF0000) should be Sunset Orange (#E8733A). White background instead of Soft Cream (#FFF8F0). No Deep Forest or Warm Gold present. |
| 2 | Logo & Visual Identity | 0/5 | Logo completely absent. |
| 3 | Typography & Text Overlays | 1/5 | Impact font instead of Nunito Bold. ALL CAPS instead of sentence case. |
| 4 | Imagery Style & Mood | 1/5 | Studio-white background (prohibited). Product-only shot, no pets in real-home setting. Feels like stock photography. |
| 5 | Messaging & Copy | 0/5 | Uses prohibited term "Cheap". No approved terms present. Tone is aggressive/discount-focused, not friendly/playful. Missing tagline. |
| 6 | Legal & Disclosures | 0/5 | No copyright notice. No #ad disclosure (assuming paid placement). |
| 7 | Accessibility | 3/5 | White text on red banner has ~4:1 contrast (just below 4.5:1 threshold). Font size appears adequate. |
| 8 | Channel Specifications | 1/5 | 1200x628 (1.91:1 landscape) instead of 1080x1080 (1:1 square) for Instagram feed. |

**Overall: 7/40 — Non-Compliant**

---

## Step 3 — Report Output

```
Brand Compliance Score: 7/40 — Non-Compliant

Violations (9 found):
1. Color Palette — CTA banner uses #FF0000, should be Sunset Orange #E8733A
   Fix: Recolor CTA banner to #E8733A
2. Color Palette — White background, should be Soft Cream #FFF8F0
   Fix: Apply #FFF8F0 background tint
3. Logo & Visual Identity — Logo absent
   Fix: Composite tailtrail-logo-dark.png in top-right corner, 80px+ width, 16px clear space
4. Typography — Impact font, should be Nunito Bold
   Fix: Re-render headline in Nunito Bold, sentence case
5. Typography — ALL CAPS headline, should be sentence case
   Fix: Change to "Summer blowout — great eats for your pup!"
6. Imagery Style — Studio-white background (prohibited), no pets in real-home setting
   Fix: Regenerate image with brand-compliant prompt
7. Messaging — Prohibited term "Cheap" used
   Fix: Replace with approved term "Wholesome" or "Farm-sourced"
8. Legal — No copyright notice
   Fix: Add "© 2026 TailTrail Pet Nutrition" in bottom margin
9. Channel Specs — 1200x628 instead of 1080x1080 for Instagram feed
   Fix: Crop/resize to 1080x1080

Type 'apply fixes' to implement all changes.
```

An HTML compliance dashboard is saved as `brand-compliance-report-tailtrail-summer-sale.html` with color-coded progress bars and collapsible violation details.

---

## Step 4 — User Accepts Fixes

User types: "apply fixes"

**Fix sequence:**

1. **Image regeneration** (violations 6): Generate new image via AI with prompt built from brand guidelines:
   > "A golden retriever eating from a bowl in a sunny kitchen, warm natural lighting, authentic candid moment, soft cream tones, joyful mood — TailTrail Pet Nutrition brand style"

2. **Color correction** (violations 1, 2): Pillow script adjusts CTA banner to `#E8733A`, background areas to `#FFF8F0`

3. **Logo composite** (violation 3): Pillow script composites `tailtrail-logo-dark.png` at top-right, 90px wide, 16px clear space

4. **Text re-render** (violations 4, 5, 7): Pillow script composites new headline "Summer sale — wholesome eats for your pup!" in Nunito Bold, sentence case, with gradient backdrop

5. **Legal text** (violation 8): Pillow script adds "© 2026 TailTrail Pet Nutrition" at bottom, 14px Open Sans

6. **Resize** (violation 9): Pillow script crops and resizes to 1080x1080

Output saved as `tailtrail-summer-sale-fixed.png`.

---

## Step 5 — Re-score

```
Updated Score: 36/40 — Mostly Compliant  (was 7/40)

Changes applied:
- Regenerated image with authentic pet-in-home scene
- CTA banner recolored to #E8733A
- Background adjusted to Soft Cream #FFF8F0
- Logo composited top-right (90px, 16px clear space)
- Headline re-rendered in Nunito Bold, sentence case
- Prohibited term "Cheap" replaced with "Wholesome"
- Copyright notice added
- Resized to 1080x1080

Remaining: 2 violations
- Accessibility: Copyright text at 14px, below 18px minimum — increase to 18px
- Messaging: Brand tagline "Real food. Real happy." not present — consider adding
```

A new dashboard is saved as `brand-compliance-report-tailtrail-summer-sale-fixed.html` showing the score improvement per dimension.
