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
| `google_slides_list_slides`       | **Discovery** — lightweight list of slides (id, title, skipped flag, element count) |
| `google_slides_get_slide`         | Per-slide full detail — untruncated text, placeholder types, element geometry |
| `google_slides_get`               | Full deck structure (heavier; prefer `list_slides` + `get_slide` on large decks) |
| `google_slides_get_thumbnail`     | Renders a slide to a temp file path; pair with the built-in `Read` tool to actually load the image into the conversation for visual inspection |
| `google_slides_duplicate_slide`   | Copy a pattern slide (optional `insertion_index` to pre-place the copy) |
| `google_slides_replace_text`      | Fill placeholder text (style-preserving)   |
| `google_slides_hide_slides`       | Mark pattern originals as `isSkipped` (array — one call for all at once) |
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
2. Copy template deck        (google_drive_copy)
3. List slides               (google_slides_list_slides)
4. Plan deck                 (propose slide plan, get user sign-off)
5. Inspect chosen patterns   (google_slides_get_slide per plan entry;
                               inventory text, table cells, empty placeholders,
                               AND images — template stock images are replaceable content)
6. Duplicate into final position (google_slides_duplicate_slide with insertion_index —
                                  either reverse-iterate at index 0, or forward-iterate
                                  with growing index; see workflow.md Step 6)
7. Fill content              (google_slides_replace_text for text, google_slides_batch_update insertText for empty
                               placeholders, google_slides_batch_update replaceImage for images. Agent-
                               generated images go through generate_image → google_drive_upload
                               → google_drive_share → replaceImage)
8. Hide all used originals   (one google_slides_hide_slides call with the full array)
9. QA                        (load google-slides-review skill — independent
                               sub-agent review; loop until 0 findings)
10. Return the working deck URL plus a summary of patterns used
```

Prefer hiding a pattern slide (step 8) over deleting it: hiding is
reversible, keeps the template readable as a reference, and lets you
recover the pattern if QA surfaces a problem.

## Pattern Selection

How to read thumbnails, match a brief to patterns, and avoid
misclassification is covered in [`references/pattern-selection.md`](references/pattern-selection.md).
Read it when building the slide plan in step 4.

## QA

Step 9 hands off to the [`google-slides-review`](../google-slides-review/SKILL.md)
skill — see that skill's `Inputs` and `Loop contract` for how to
invoke and when to stop. The leak sub-agent needs the per-element
text snapshot captured during Step 5; do not skip that capture.

## Failure Modes and Recovery

Non-obvious failures the agent is prone to. Generic issues (rate
limits, YAML syntax errors) are not listed — the agent handles those
from its own reading of error messages.

| Symptom | Likely cause | Fix |
|---|---|---|
| "Click to add text" / "Click to add subtitle" visible in the final deck | Empty placeholder shape was targeted with `google_slides_replace_text` — Google's UI hint is not a real text run | Use `google_slides_batch_update insertText` on the shape's `objectId`. `get_slide` flags these with `isEmptyPlaceholder: true` |
| Landscape / picture icon showing where an image should be | Empty `placeholder: "PICTURE"` shape was never filled | `google_slides_batch_update createImage` reusing the placeholder's `size` + `transform`, then `deleteObject` on the placeholder |
| Template stock photos / icons still visible | Agent treated `type: "image"` elements as template decoration | Inventory images in Step 5; swap via `replaceImage` using a user-supplied URL or the generate → upload → share → replaceImage pipeline |
| `google_slides_batch_update` fails when Google fetches an image URL | Drive file not shared publicly, or `/view` URL used instead of `/uc?id=…` | Call `google_drive_share` with `role: reader`, `type: anyone`; use the `uc?id=` form |
| Table cell reads `"011"` / `"<new>Item One"` | `insertText` was used on a non-empty cell — it prepends, not replaces | Use `google_slides_replace_text` with the cell's existing `fullText` as `find`. `get_slide` returns `cells[].fullText` |
| Stale rows like "5 Item Five" visible | Unused template table rows were left | `google_slides_batch_update deleteTableRow` per unused row, iterating from the bottom |
| All content lands in column 1 of a multi-column pattern | Column order not determined | Sort shapes sharing a placeholder role by `transform.translateX` before binding content |
| Japanese line breaks on wrong characters (`）` at start, `（` at end, English words split) | Manual `\n` was injected; Slides API does not auto-apply kinsoku shori | Compose paragraphs as free-flowing text, break only at semantic boundaries. See `references/filling-content.md` kinsoku rules |
| Partial replacement inside one string | Template split the phrase across runs; `replaceAllText` matches within one run only | Fix the template; do not patch with `updateTextStyle` |
