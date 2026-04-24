# Detailed Workflow

Read this file when you are about to start editing a deck. It expands every
step in the short workflow in `SKILL.md` with concrete tool calls, inputs,
and verification cues.

Tool schemas (argument names, types, return shape) are defined in the tdx
repo at `studio/electron/services/google-tools.ts` under
`createGoogleSlidesTools`. Consult that file if a call fails with an
unexpected argument error.

## Step 1 — Confirm prerequisites and collect inputs

Both connectors must be connected:

- `mcp__tdx-studio__google_drive_*` tools available → Drive connector is live
- `mcp__tdx-studio__google_slides_*` tools available → Slides connector is live

If either set is missing, stop and instruct the user to open Studio →
Settings → Connected Services → connect the missing one.

From the user, collect:

1. **Template deck** — URL or Drive file ID. A URL like
   `https://docs.google.com/presentation/d/ABCDEF.../edit` yields the
   file ID in the path segment after `/d/`.
2. **Brief** — the content to fill the deck with. Can be structured
   (sections, bullet points) or free-form prose. Ask clarifying questions if
   the brief is too vague to map to patterns.
3. **Output name and destination folder** (optional). If not given, the
   copy goes into the user's My Drive root with the default name
   `Copy of <template name>`.

## Step 2 — Copy the template

Call:

```
google_drive_copy(
  file_id = <template file ID>,
  name = <user-provided name or omitted>,
  folder = <folder ID, name, or path; or omitted>
)
```

The response contains the new `file.id` and `webViewLink`. **Save both** —
`file.id` is used for every subsequent Slides call, and the link is what the
user will click at the end.

If the copy fails with a permission error, the user likely does not have read
access to the source. Ask them to verify sharing or provide a different
template.

## Step 3 — Discover patterns in the working deck

Call `google_slides_get(presentation_id = <new file.id>)`. The response has a
summarized structure:

```
{
  "title": "...",
  "slides": [
    {
      "slideId": "...",
      "isSkipped": false,
      "layoutObjectId": "...",
      "elements": [
        { "objectId": "...", "type": "shape", "textPreview": "[Title]" },
        ...
      ]
    },
    ...
  ],
  "layouts": [ ... ]
}
```

For every slide, also fetch a thumbnail:

```
google_slides_get_thumbnail(
  presentation_id = <file.id>,
  slide_id = <slideId>,
  size = "MEDIUM",
  mime_type = "PNG"
)
```

Thumbnail URLs expire in ~30 minutes. If a URL fails later, re-fetch rather
than debugging an expired signature. Register each slide in an internal
catalog: `{ slideId, purpose (from title or text preview), thumbnailUrl }`.

## Step 4 — Plan the deck

Match the brief to the pattern catalog. The plan is an ordered list:

```
1. Pattern "slideId-title" → section opener
2. Pattern "slideId-stat3col" → Q3 metrics
3. Pattern "slideId-bullets" → key findings
4. Pattern "slideId-cta" → call to action
```

For each entry, note the pattern's known placeholder tokens (from `textPreview`
fields in step 3) and what content will replace them. See
`pattern-selection.md` for how to pick patterns without misclassifying them.

**Show the plan to the user and get confirmation before any mutation.** Point
out any patterns you had to skip and why (e.g., "the template has no
quote-style pattern, so I will use a bullet pattern instead").

## Step 5 — Duplicate chosen patterns

For each plan entry, in order:

```
google_slides_duplicate_slide(
  presentation_id = <file.id>,
  slide_id = <pattern slideId>
)
```

Save the returned `newSlideId` alongside the plan entry. The duplicate lands
immediately after its source, so the deck after this step has interleaved
pattern/copy pairs. That is fine — step 7 hides the originals.

If you need a specific order, you can re-order with `batch_update` using
`updateSlidesPosition`. See `batch-update-recipes.yaml`.

## Step 6 — Fill content

For each new slide, gather the replacements and call:

```
google_slides_replace_text(
  presentation_id = <file.id>,
  slide_ids = [<newSlideId>],
  replacements_yaml = <YAML list of {find, replace, match_case?}>
)
```

Important: `slide_ids` scopes the replacement so that the same token (e.g.,
`[Title]`) in other slides is not affected. Replace slides one at a time so
each slide's content stays isolated.

For non-text edits (image swap, shape resize, table rows) use
`google_slides_batch_update` with recipes from `batch-update-recipes.yaml`.

### Style preservation guarantee

`replaceAllText` edits the content of existing text runs in place, so the
run's styling (font family, size, weight, color, decoration) is preserved
automatically. Do not re-apply styles after replacement — that overrides
the template author's theme decisions and breaks consistency across the
deck.

The only caveat: if the template author split a single logical phrase across
multiple runs (rare, but possible), `replaceAllText` matches only within a
single run. Symptom: partial replacement. Fix: the template should be
corrected; do not work around it with `updateTextStyle`.

## Step 7 — Hide originals

For every pattern ID listed in the plan:

```
google_slides_hide_slide(
  presentation_id = <file.id>,
  slide_id = <pattern slideId>
)
```

`google_slides_hide_slide` sets `isSkipped: true` on `SlideProperties` via
`updateSlideProperties`. The slide is still in the deck — it just doesn't
appear during presentation mode. This is deliberate: if the QA step surfaces
an issue, you can un-hide a pattern (`skipped: false`) and re-do the copy.

Leave unused pattern slides as they are — hiding them by default changes the
template into something the user did not ask for. If the user wants only the
filled copies visible (the common case), confirm with them first, then hide
the unused patterns with the same `hide_slide` call.

## Step 8 — QA

Three checks, in order:

1. **Placeholder leak check.** Re-call `google_slides_get` and scan the
   concatenated `textPreview` fields for remaining tokens:

   - Square-bracket tokens: `[Title]`, `[Body]`, `[Metric`, `[CTA]`, …
   - Common placeholder words: `Lorem ipsum`, `TODO`, `FIXME`

   If any hit, go back to step 6 and add the missing replacements.

2. **Hidden-originals check.** For every pattern ID in the plan, verify its
   slide in the `google_slides_get` response has `isSkipped: true`. If not,
   call `google_slides_hide_slide` again (idempotent).

3. **Thumbnail review.** Fetch thumbnails for every visible (not skipped)
   slide. Look for:

   - Text overflow (text running off the slide)
   - Empty placeholders (pattern text survived because the replace target
     did not match exactly)
   - Broken or distorted images
   - Contrast issues (e.g., user-provided text color clashing with template
     background)

   When in doubt, ask the user to review. Fresh eyes catch layout issues that
   token-based checks miss.

## Step 9 — Return the result

Report to the user:

- `webViewLink` from step 2
- Summary of patterns used (order + purpose)
- Any QA warnings and what you did or didn't fix

Leave the source template and working copy in place. Deletion is
irreversible from the skill's perspective, and the user can remove either
from Drive manually if they want.
