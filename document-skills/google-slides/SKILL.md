---
name: google-slides
description: >
  Use this skill any time the user wants to create a Google Slides deck
  from a template, mentions "Google Slides" with a template in mind,
  provides a Google Slides URL plus a content brief, or asks to "make
  slides", "build a deck", "generate a presentation", or "fill this
  template" in a Google Workspace context. Requires the Studio Google
  Slides + Google Drive MCP connectors. Do NOT use for PowerPoint
  (.pptx) creation (use the pptx skill), for editing without a template,
  or for authoring a new template (template authoring has its own skill).
---

# Google Slides (Template-Driven Deck Editor)

Generate a Google Slides deck by picking pattern slides from a template
deck, duplicating them, filling content via style-preserving text
replacement, and hiding the originals. Every visible slide is a copy of a
pre-styled pattern, so the template's fonts, colors, layouts, and theme
survive without any explicit styling work from the agent.

**Why this shape?** The Google Slides API lets you edit text and structure
but gives you no judgment about typography or layout. Treating each
template slide as one finished pattern (not a parts catalog) keeps the
agent out of styling decisions. `replaceAllText` edits text runs in place,
so run-level styling — font, size, weight, color — is preserved
automatically.

## Prerequisites

**Both connectors must be connected** in Treasure Studio → Settings →
Connected Services:

| Connector       | Purpose                                        |
|-----------------|------------------------------------------------|
| Google Drive    | Copying the template deck (`files.copy`)       |
| Google Slides   | Inspecting and editing the working deck        |

Confirm both are connected before proceeding. If either is missing, stop
and ask the user to connect it.

## Template Requirements (Author Contract)

The template deck must follow the **complete-slide pattern** convention:

- Each slide is one reusable layout, ready to be used whole
- No "parts catalog" slides that group multiple tables, CTAs, or boxes for
  users to extract pieces from — the Slides API cannot move elements
  between slides without losing fidelity
- Placeholder text uses recognizable tokens like `[Title]`, `[Body]`,
  `[Metric Name]`, `[CTA]` — the agent replaces them by exact string match
- Slide titles, when present, follow `Pattern: <layout description>`
  (e.g., `Pattern: Stat Callout (3 columns)`) so the agent can pick from
  the catalog confidently

If the template violates these rules, explain the constraint and ask the
user to update the template — working around it silently produces decks
that do not match the template's design language.

## Tools You Will Use

All tools are in the Studio MCP server (`mcp__tdx-studio__*`). Full tool
schemas live in the tdx repo at `studio/electron/services/google-tools.ts`
under `createGoogleSlidesTools`.

| Tool                              | Role                                       |
|-----------------------------------|--------------------------------------------|
| `google_drive_copy`               | Copy the template into a new working deck  |
| `google_slides_get`               | Read deck structure, slide IDs, text previews |
| `google_slides_get_thumbnail`     | Visual inspection of a slide (PNG URL)     |
| `google_slides_duplicate_slide`   | Copy a pattern slide so you can edit it    |
| `google_slides_replace_text`      | Fill placeholder text (style-preserving)   |
| `google_slides_hide_slide`        | Mark a pattern original as `isSkipped`     |
| `google_slides_batch_update`      | Table rows/columns, element transforms, image replacement, text styling, multi-request batches |

`google_slides_replace_text` and `google_slides_batch_update` take
**YAML-encoded** lists — see [`references/batch-update-recipes.yaml`](references/batch-update-recipes.yaml)
for the recipe library. Copy a recipe, fill in object IDs, pass the YAML
string straight through as `requests_yaml` or `replacements_yaml`.

## Workflow

The full step-by-step workflow lives in [`references/workflow.md`](references/workflow.md).
Read it before planning a deck — it explains what to verify at each step
and how to recover from common mistakes. Short version:

```
1. Confirm both connectors, collect template URL + brief
2. Copy template deck    (google_drive_copy)
3. Discover patterns     (google_slides_get + thumbnails)
4. Plan deck             (propose slide plan, get user sign-off)
5. Duplicate chosen patterns  (google_slides_duplicate_slide per plan entry)
6. Fill content          (google_slides_replace_text + batch_update for non-text)
7. Hide originals        (google_slides_hide_slide on every pattern that was used)
8. QA                    (placeholder-leak + hidden-originals + thumbnail review)
9. Return the working deck URL plus a summary of patterns used
```

**One rule that prevents every common failure**: after duplicating a
pattern and filling it, hide the original pattern slide (step 7) rather
than delete it. Hiding is reversible, keeps the template readable as a
reference, and lets you recover the pattern if QA surfaces a problem.

## Pattern Selection

How to read thumbnails, match a brief to patterns, and avoid
misclassification is covered in [`references/pattern-selection.md`](references/pattern-selection.md).
Read it when building the slide plan in step 4.

## QA

Run the three checks in step 8 of the workflow: placeholder-leak,
hidden-originals, and thumbnail review. Details in `references/workflow.md`.
Expect to loop at least once (generate → inspect → fix → re-verify) — a
zero-problems report on the first pass almost always means the review was
superficial.

## Failure Modes and Recovery

| Symptom                           | Likely cause                    | Fix                                                     |
|-----------------------------------|---------------------------------|---------------------------------------------------------|
| Placeholder text remains visible  | Replacement token mismatch      | Call `google_slides_get`, find the exact token, retry   |
| Text style changed after replace  | Used direct text set, not `replace_text` | Re-copy the pattern slide and use `replace_text`  |
| Thumbnail URL returns 404         | URL expired (>30 min)           | Re-fetch `google_slides_get_thumbnail`                  |
| `batch_update` returns 400        | YAML parsed to wrong shape      | Validate YAML against the recipe file; check indent     |
| Element moved to wrong position   | Transform applyMode confusion   | Use `applyMode: RELATIVE` for deltas, `ABSOLUTE` for pos |
