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
| `google_slides_get_thumbnail`     | Visual inspection of a slide (PNG URL, ~30 min)  |
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
5. Inspect chosen patterns   (google_slides_get_slide per plan entry)
6. Duplicate into final position (google_slides_duplicate_slide with insertion_index —
                                  either reverse-iterate at index 0, or forward-iterate
                                  with growing index; see workflow.md Step 6)
7. Fill content              (google_slides_replace_text + batch_update for non-text)
8. Hide all used originals   (one google_slides_hide_slides call with the full array)
9. QA                        (placeholder-leak + hidden-originals + thumbnail review)
10. Return the working deck URL plus a summary of patterns used
```

**One rule that prevents every common failure**: after duplicating a
pattern and filling it, hide the original pattern slide (step 8) rather
than delete it. Hiding is reversible, keeps the template readable as a
reference, and lets you recover the pattern if QA surfaces a problem.

## Pattern Selection

How to read thumbnails, match a brief to patterns, and avoid
misclassification is covered in [`references/pattern-selection.md`](references/pattern-selection.md).
Read it when building the slide plan in step 4.

## QA

Step 9 of the workflow runs three checks: a **snapshot-diff leak check**
(compare each filled slide's text against the pre-replace pattern text —
anything still matching means placeholder content survived), a
hidden-originals check, and a thumbnail review. The leak check needs a
text snapshot taken during step 5, so do not skip that capture.
Details and a list of generic placeholder tokens live in
`references/workflow.md`.

Expect to loop at least once (generate → inspect → fix → re-verify) — a
zero-problems report on the first pass almost always means the review was
superficial.

## Failure Modes and Recovery

| Symptom                           | Likely cause                    | Fix                                                     |
|-----------------------------------|---------------------------------|---------------------------------------------------------|
| Placeholder text remains visible  | Replacement token mismatch      | Call `google_slides_get_slide` on the filled slide, read the untruncated fullText, retry with the exact string |
| "Click to add subtitle" / "Click to add text" still visible | Empty placeholder shape was targeted with `replace_text` — Google's UI hint is not a real text run | Use `google_slides_batch_update` `insertText` with the shape's `objectId`. Look for `isEmptyPlaceholder: true` in `get_slide` output |
| Table cell reads "011" / "Claude Cowork とは？Item One" (original text concatenated with new) | `insertText` was used on a non-empty cell — it prepends, does not replace | Use `replace_text` with the cell's existing `fullText` as the `find` argument. `get_slide` now returns `cells[].fullText` per cell |
| Stale table rows like "5 Item Five" / "6 Item Six" visible | Pattern table had more rows than the brief content; unused rows were not cleaned | Call `batch_update` with `deleteTableRow` for each unused row (iterate from the bottom to keep indices stable) |
| All content lands in column 1 of a multi-column pattern | Agent did not distinguish column 2/3 shapes from column 1 | Sort the shapes sharing a placeholder role by `transform.translateX` to identify column order, then bind content to each shape's `objectId` |
| Text style changed after replace  | Used direct text set, not `google_slides_replace_text` | Re-copy the pattern slide and use `google_slides_replace_text` |
| Thumbnail URL returns 404         | URL expired (>30 min)           | Re-fetch `google_slides_get_thumbnail`                  |
| `google_slides_batch_update` returns 400 | YAML parsed to wrong shape | Validate YAML against the recipe file; check indent     |
| Element moved to wrong position   | Transform applyMode confusion   | Use `applyMode: RELATIVE` for deltas, `ABSOLUTE` for pos |
