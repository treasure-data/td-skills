---
name: google-slides
description: >
  Use this skill any time the user wants to create a Google Slides
  presentation from a template deck, mentions "Google Slides", provides a
  Google Slides URL plus a content brief, or asks to "make slides", "build a
  deck", "generate a presentation", or "fill this template" in a Google
  Workspace context. Also use when the user has a Google Slides template in
  mind but does not name it explicitly. The skill picks pattern slides from
  the template, duplicates them, fills content via style-preserving text
  replacement, and hides the originals — every visible slide is a copy of a
  pre-styled pattern, so fonts, colors, layouts, and theme survive
  automatically. Requires the Studio Google Slides + Google Drive MCP
  connectors (both must be connected). Do NOT use for PowerPoint (.pptx)
  creation (use the pptx skill), for editing a deck without a template, or
  for converting other formats into Google Slides (template authoring has
  its own skill).
---

# Google Slides (Template-Driven Deck Editor)

Generate a new Google Slides deck by picking pattern slides out of a template,
duplicating them, filling in the content, and hiding the originals. The
template's styling — fonts, colors, master layouts, theme — stays intact
because nothing is created from scratch: every visible slide is a copy of a
pre-styled pattern slide.

**Why this shape?** The Google Slides API lets you edit text and structure but
never gives you the template author's eye for typography and layout. By
treating each template slide as one completed pattern (not a parts catalog),
the agent stays out of styling decisions. Text replacement via
`replaceAllText` preserves every text run's `<a:rPr>` equivalent, so font and
color survive automatically.

## Prerequisites

**Both connectors must be connected** in Treasure Studio → Settings →
Connected Services:

| Connector       | Purpose                                        |
|-----------------|------------------------------------------------|
| Google Drive    | Copying the template deck (`files.copy`)       |
| Google Slides   | Inspecting and editing the working deck        |

Before proceeding, confirm both are connected. If either is missing, stop and
ask the user to connect it.

## Template Requirements (Author Contract)

The template deck must follow the **complete-slide pattern** convention:

- Each slide is one reusable layout, ready to be used whole
- No "parts catalog" slides that group multiple tables, CTAs, or boxes for
  users to extract pieces from (the Slides API cannot easily move elements
  between slides without losing fidelity)
- Placeholder text uses recognizable tokens like `[Title]`, `[Body]`,
  `[Metric Name]`, `[CTA]` — the agent replaces them by exact string match
- Slide titles, when present, follow `Pattern: <layout description>`
  (e.g., `Pattern: Stat Callout (3 columns)`) so the agent can pick from the
  catalog confidently

If the template violates these rules, explain the constraint and ask the user
to update the template — do not try to work around it silently.

## Tools You Will Use

All tools are in the Studio MCP server (`mcp__tdx-studio__*`). Full schemas
live in the tdx repo at `studio/electron/services/google-tools.ts` under
`createGoogleSlidesTools`.

| Tool                              | Role                                       |
|-----------------------------------|--------------------------------------------|
| `google_drive_copy`               | Copy the template to a new working deck    |
| `google_slides_get`               | Read deck structure, slide IDs, text previews |
| `google_slides_get_thumbnail`     | Visual inspection of a slide (PNG URL)     |
| `google_slides_duplicate_slide`   | Copy a pattern slide so you can edit it    |
| `google_slides_replace_text`      | Fill placeholder text (style-preserving)   |
| `google_slides_hide_slide`        | Mark a pattern original as `isSkipped`     |
| `google_slides_batch_update`      | Escape hatch for any other Slides API ops  |

`google_slides_replace_text` and `google_slides_batch_update` take
**YAML-encoded** arrays. See [`references/batch-update-recipes.yaml`](references/batch-update-recipes.yaml)
for the full recipe library.

## Workflow

The full step-by-step workflow lives in [`references/workflow.md`](references/workflow.md).
Read that file before planning a deck — it explains what to verify at each step
and how to recover from common mistakes. The short version:

```
1. Confirm both connectors, collect template URL + brief
2. Copy template deck    (google_drive_copy)
3. Discover patterns     (google_slides_get + thumbnails)
4. Plan deck             (propose slide plan, get user sign-off)
5. Duplicate chosen patterns  (google_slides_duplicate_slide per plan entry)
6. Fill content          (google_slides_replace_text + batch_update for non-text)
7. Hide originals        (google_slides_hide_slide on every pattern that was used)
8. QA                    (thumbnails + placeholder-leak check)
```

**One rule that prevents every common failure**: after duplicating a pattern
and filling it, hide the original pattern slide (step 7) rather than delete
it. Hiding is reversible, keeps the template readable as a reference, and
lets you recover the pattern if a later QA pass requires re-doing the copy.

## Pattern Selection

How to read thumbnails, match user intent to pattern slides, and avoid
misclassifying patterns is covered in
[`references/pattern-selection.md`](references/pattern-selection.md). Read it
when building the slide plan in step 4.

## Customizations Beyond Text

Small adjustments — adding a row to a template table, resizing a shape,
swapping an image — are possible via `google_slides_batch_update` with the
recipes in [`references/batch-update-recipes.yaml`](references/batch-update-recipes.yaml).
The file is intentionally YAML so you can copy a recipe, fill in object IDs,
and pass it as `requests_yaml` without format conversion.

Common recipes:

- Insert row(s) or column(s) into a table
- Resize or move a shape (transform)
- Replace an image in place
- Update text style (font, size, color) on a specific range

Use `batch_update` sparingly — the goal is to stay within the template's
design language. Extensive styling tweaks usually mean the template was wrong
for the job; flag this back to the user rather than paper over it.

## QA Before Declaring Done

After step 7, run these checks:

1. **No placeholders left.** Call `google_slides_get` and grep the returned
   text for tokens like `[Title]`, `[Body]`, `[Metric`. Any hit means a
   replacement was missed.
2. **All duplicated-from patterns are hidden.** For every pattern ID you
   duplicated in step 5, verify the original has `isSkipped: true` in the
   `google_slides_get` response.
3. **Thumbnail review.** Fetch a thumbnail for every visible slide and
   inspect for overflow, empty placeholders, broken images, or contrast
   issues. Fresh-eyes review catches layout issues that text checks miss.

"Zero problems found" in a single pass is usually a sign the review was
superficial. Expect to loop at least once: generate → inspect → fix →
re-verify.

## Failure Modes and Recovery

| Symptom                           | Likely cause                    | Fix                                                     |
|-----------------------------------|---------------------------------|---------------------------------------------------------|
| Placeholder text remains visible  | Replacement token mismatch      | Call `google_slides_get`, find the exact token, retry   |
| Text style changed after replace  | Used direct text set, not `replace_text` | Re-copy the pattern slide and use `replace_text`  |
| Thumbnail URL returns 404         | URL expired (>30 min)           | Re-fetch `google_slides_get_thumbnail`                  |
| `batch_update` returns 400        | YAML parsed to wrong shape      | Validate YAML against the recipe file; check indent     |
| Element moved to wrong position   | Transform applyMode confusion   | Use `applyMode: RELATIVE` for deltas, `ABSOLUTE` for pos |

## Output

On completion, return to the user:

- The working deck's URL (`webViewLink` from `google_drive_copy`)
- A short summary of which patterns were used, in order
- Any caveats surfaced during QA that the user should know about

Leave the source template and the working deck in place unless the user
explicitly asks to delete either — deletion is not something this skill
should do on its own judgment.
