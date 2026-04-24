# Detailed Workflow

Read this file before starting a deck. It expands the short workflow
in `SKILL.md` with concrete tool calls, inputs, and verification cues.
Element-specific patterns (empty placeholders, tables, images,
Japanese) live in [`filling-content.md`](filling-content.md) and are
pointed to from Step 7.

## Contents

- [Step 1 — Prerequisites and inputs](#step-1--confirm-prerequisites-and-collect-inputs)
- [Step 2 — Copy the template](#step-2--copy-the-template)
- [Step 3 — List slides](#step-3--list-slides-cheap-discovery)
- [Step 4 — Plan the deck](#step-4--plan-the-deck)
- [Step 5 — Inspect patterns, snapshot text](#step-5--inspect-chosen-patterns-capture-text-snapshots)
- [Step 6 — Duplicate into final position](#step-6--duplicate-patterns-into-final-position)
- [Step 7 — Fill content](#step-7--fill-content)
- [Step 8 — Hide used originals](#step-8--hide-all-used-pattern-originals-in-one-call)
- [Step 9 — QA](#step-9--qa)
- [Step 10 — Return the result](#step-10--return-the-result)

## Step 1 — Confirm prerequisites and collect inputs

Both connectors must be connected:

- `mcp__tdx-studio__google_drive_*` tools available → Drive connector is live
- `mcp__tdx-studio__google_slides_*` tools available → Slides connector is live

If either set is missing, stop and instruct the user to open Studio →
Settings → Connected Services → connect the missing one.

From the user, collect:

1. **Template deck** — URL or Drive file ID. A URL like
   `https://docs.google.com/presentation/d/ABCDEF.../edit` yields the file
   ID in the path segment after `/d/`.
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
`file.id` is used for every subsequent Slides call, and the link is what
the user will click at the end.

If the copy fails with a permission error, the user likely does not have
read access to the source. Ask them to verify sharing or provide a
different template.

## Step 3 — List slides (cheap discovery)

Call:

```
google_slides_list_slides(presentation_id = <file.id>)
```

The response is a compact list suitable for large decks:

```
{
  "slideCount": 70,
  "slides": [
    { "slideId": "p1", "isSkipped": false, "layoutObjectId": "L1",
      "title": "Welcome to your new template", "elementCount": 3 },
    { "slideId": "g3d4…_145", "isSkipped": false,
      "title": "Treasure AI — The Agentic Experience Platform",
      "elementCount": 2 },
    …
  ]
}
```

Do **not** call `google_slides_get` on a large template here — it can
easily exceed the tool response limit (the reference 70-slide template
returned ~147 KB via `get`). Use `get` only when you need everything at
once and you know the deck is small.

## Step 4 — Plan the deck

Match the brief to the listed titles. The plan is an ordered list:

```
1. (final index 0) Pattern "p1" → Title / cover
2. (final index 1) Pattern "g3d4…_145" → Section divider: Context
3. (final index 2) Pattern "p10" → Stat callout (2 metrics)
4. …
```

Record both the **pattern slide id** (source for duplication) and the
**final insertion index** so you can pre-place duplicates in step 6.

**Show the plan to the user and get confirmation before any mutation.**
Point out patterns you had to skip and why (e.g., "the template has no
quote-style pattern, so I will use a bullet pattern instead"). See
`pattern-selection.md` for how to pick without misclassifying.

## Step 5 — Inspect chosen patterns, capture text snapshots

For each slide id in the plan, call:

```
google_slides_get_slide(
  presentation_id = <file.id>,
  slide_id        = <pattern slideId>
)
```

Unlike `google_slides_get`, this returns the full signal the agent
needs to fill the slide correctly:

1. **Untruncated element text (`fullText`)** — the exact string as
   stored in the deck, which is what `replaceAllText` matches on. A
   shorter preview can hide the part you need to match.
2. **`isEmptyPlaceholder: true`** on placeholder shapes with no text
   runs. Empty placeholders look blank in the thumbnail (with a "Click
   to add text" UI hint) but have no real text to match against.
   `replace_text` cannot fill them; use
   `google_slides_batch_update insertText` addressed by the shape's
   objectId. See Step 7 for the full pattern.
3. **`cells[]` on table elements** — every cell's rowIndex,
   columnIndex, and (if present) fullText. Empty cells appear with no
   fullText. The agent uses this to decide per cell whether to
   replace (has fullText) or insert (empty) and which rows to delete
   (rows with no content that the brief would fill).
4. **`transform.translateX`** on shapes — lets you sort shapes that
   share a placeholder role (e.g., all `BODY` placeholders) into
   left-to-right column order. The API does not return elements in
   visual order.
5. **Image elements (`type: "image"`)** — treat template imagery as
   **replaceable by default**, not decoration. Most templates ship with
   stock photos / icons that the author put there as a visual
   placeholder; leaving them in the final deck is almost always wrong.
   Inventory every image element (its `objectId`, `contentUrl`, and
   bounds from `size`/`transform`) so Step 7 can decide per image
   whether to swap with user-provided content, agent-generated
   content, or (rarely) keep as-is.
6. **Leak-check snapshots** — save each pattern's element-level
   `fullText` values keyed by `(slideId, objectId)`, plus table
   `cells[].fullText` keyed by `(slideId, objectId, rowIndex,
   columnIndex)`, into an in-memory snapshot. Step 9 compares the
   filled deck against these snapshots to detect content that was not
   replaced.

Also fetch a thumbnail when you need visual confirmation of what the
pattern looks like:

```
google_slides_get_thumbnail(
  presentation_id = <file.id>,
  slide_id        = <pattern slideId>,
  size            = "MEDIUM",
  mime_type       = "PNG"
)
```

Thumbnail URLs expire in ~30 minutes — re-fetch rather than debugging an
expired signature.

## Step 6 — Duplicate patterns into final position

Without `insertion_index`, a duplicate lands immediately after its
source slide (Google Slides API default). With `insertion_index`, the
duplicate is pre-placed in the same batchUpdate — no reorder pass.

Walk the plan **from last entry to first** and call with
`insertion_index = 0`:

```
google_slides_duplicate_slide(
  presentation_id = <file.id>,
  slide_id        = <pattern slideId>,
  insertion_index = 0
)
```

Each insertion at position 0 pushes previous insertions down, so after
N duplicates the first N slides of the deck match the plan order. No
index arithmetic, no reorder pass.

Worked example with plan `[A, B, C]`:

| Iteration | Call | Deck prefix after |
|---|---|---|
| 1 | duplicate C → index 0 | `[C']` |
| 2 | duplicate B → index 0 | `[B', C']` |
| 3 | duplicate A → index 0 | `[A', B', C']` |

Forward iteration with growing `insertion_index` (0, 1, 2, …) also
works — pick whichever feels natural — but the reverse strategy is
shorter to state.

Save the returned `newSlideId` next to each plan entry; you will
need it in steps 7 and 9.

## Step 7 — Fill content

For each new slide, pass the replacements derived from the brief and
the snapshot from step 5:

```
google_slides_replace_text(
  presentation_id   = <file.id>,
  slide_ids         = [<newSlideId>],
  replacements_yaml = <YAML list of {find, replace, match_case?}>
)
```

`slide_ids` scopes the replacement so the same token (e.g., `[Title]`)
in other slides is not affected. Replace slides one at a time — each
slide's content stays isolated and step 9's leak check runs per-slide.

Non-text edits (table rows, image swaps, empty placeholders, multi-
column layouts, Japanese text) need `google_slides_batch_update` with
element-specific patterns. See
[`references/filling-content.md`](filling-content.md) when you encounter:

| Signal in `get_slide` | Handler section |
|---|---|
| `isEmptyPlaceholder: true` on a text shape | Empty text placeholders |
| Several shapes sharing one `placeholder` role | Multi-column layouts |
| `type: "table"` with `cells[]` | Table cells |
| `type: "image"` with existing `contentUrl` | Existing image elements |
| Image needed but no URL supplied | Generate-and-publish pipeline |
| `placeholder: "PICTURE"` shape, no image | Empty image placeholders |
| Any Japanese text in the fill | Kinsoku shori |

The style-preservation guarantee and multi-run caveat also live there.

## Step 8 — Hide all used pattern originals in one call

Collect every pattern slide id that appeared in the plan and hide them
together:

```
google_slides_hide_slides(
  presentation_id = <file.id>,
  slide_ids       = [<every used pattern slideId>]
)
```

`hide_slides` issues a single batchUpdate with N `updateSlideProperties`
requests, so the cost is one round trip regardless of how many patterns
were used. The slides stay in the deck — they just do not appear in
presentation mode. To un-hide later, call `google_slides_batch_update`
with an `updateSlideProperties` request setting `isSkipped: false`.

Leave unused pattern slides as they are — hiding them by default changes
the template into something the user did not ask for. If the user wants
only the filled copies visible, confirm with them first, then add those
patterns to the same `hide_slides` call.

## Step 9 — QA

Three checks, in order:

### 9a. Snapshot-diff leak check

The only reliable way to catch "original template text survived the
fill" is to compare each filled slide against the pattern it came from:

1. For each filled slide, call `google_slides_get_slide(presentation_id,
   newSlideId)`.
2. For each element in the filled slide, look up the matching element
   (same shape role / placeholder type / logical slot) in the step-5
   snapshot.
3. If the filled element's `fullText` is identical to the pattern's
   `fullText` for that slot, the replacement did not happen — flag as
   a leak.

This catches cases like "the Boxed 3-column body text was truncated in
preview, so the replace target was wrong" — the fill succeeds with no
error but the visible text is still the template's instructional prose.

Also grep the filled deck for the generic placeholder tokens below —
these are template-author idioms that often appear in Slides templates
and are not captured by the per-slide snapshot:

```
[Title]  [Body]  [Metric]  [CTA]  [Name]  [Subtitle]
Lorem ipsum  TODO  FIXME
xx%  XX%  00%  00.  YYYY  MM/DD
Title goes here  Subtitle goes here  Keep in mind that
Click to add text  PLACEHOLDER
```

If any hit, return to step 7 and add the missing replacements.

### 9b. Hidden-originals check

For every pattern ID in the plan, confirm the original has
`isSkipped: true` in `google_slides_list_slides` (cheaper than `get`).
If any is still visible, call `google_slides_hide_slides` again — it is
idempotent.

### 9c. Thumbnail review

Fetch thumbnails for every visible (not skipped) slide. Look for:

- **Text overflow** — text running off the slide edge or clipping
- **Empty text placeholders still showing "Click to add text" / "Click
  to add subtitle"** — pattern text or UI hint survived because the
  replace target did not match exactly, or `replace_text` was used on
  an `isEmptyPlaceholder: true` shape that needed `insertText`
- **Empty image placeholders still showing the landscape/picture icon**
  — a `placeholder: "PICTURE"` shape was never filled with
  `createImage`, or the inserted image did not cover the placeholder
  bounds. Cross-check by calling `google_slides_get_slide` on each
  visible slide and confirming every `placeholder: "PICTURE"` shape
  either has been replaced by an actual `type: "image"` element or
  has been removed via `deleteObject`.
- **Template stock imagery still visible** — a `type: "image"` element
  whose `contentUrl` is unchanged from the original template. For each
  `type: "image"` element in the filled deck, compare `contentUrl`
  against the snapshot captured in Step 5. Identical URL means the
  image was never swapped; decide per slide whether to replace with
  user-supplied or agent-generated imagery, or whether the template
  image was the intended final asset (confirm with the user).
- **Broken or distorted images** — wrong aspect ratio, HTTPS fetch
  failed, URL expired
- **Contrast issues** — user-provided text color clashing with template
  background
- **Japanese line-break violations** — punctuation at line start
  (`）「`, etc.) or unnatural breaks in the middle of English words or
  numbers. See Step 7 "Japanese text — kinsoku shori" for the rules.
- **Stale template artifacts** — any text or imagery that reads like
  template filler ("Item Five", "Your text here", "Lorem ipsum", the
  template author's sample content)

When in doubt, ask the user to review. Fresh eyes catch layout issues
that token checks miss.

## Step 10 — Return the result

Report to the user:

- `webViewLink` from step 2
- Summary of patterns used (final order + purpose)
- Any QA warnings and what you did or did not fix

Leave the source template and working copy in place. Deletion is
irreversible from the skill's perspective, and the user can remove
either from Drive manually if they want.
