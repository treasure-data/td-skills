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
source slide (Google Slides API default). That leaves copies interleaved
with originals and forces a separate reorder pass on anything larger
than a few slides.

With `insertion_index`, you can pre-place the copy in the same
batchUpdate — no reorder pass. Two equivalent strategies:

### Recommended: reverse-iterate, always insert at index 0

Walk the plan **from last entry to first**, calling:

```
google_slides_duplicate_slide(
  presentation_id = <file.id>,
  slide_id        = <pattern slideId>,
  insertion_index = 0
)
```

Each insertion at position 0 pushes previous insertions down, so after
all N duplicates the first N slides of the deck match the plan order
exactly. The agent never has to compute shifting indices.

Worked example with plan `[A, B, C]`:

| Iteration | Call | Deck prefix after |
|---|---|---|
| 1 | duplicate C → index 0 | `[C']` |
| 2 | duplicate B → index 0 | `[B', C']` |
| 3 | duplicate A → index 0 | `[A', B', C']` |

### Alternative: forward-iterate with growing index

Walk the plan from first entry to last, passing
`insertion_index = <0-based plan position>`. The API's `insertionIndex`
is evaluated against the deck state before the request, so plan index
0, 1, 2, … all work correctly:

| Iteration | Call | Deck prefix after |
|---|---|---|
| 1 | duplicate A → index 0 | `[A']` |
| 2 | duplicate B → index 1 | `[A', B']` |
| 3 | duplicate C → index 2 | `[A', B', C']` |

Both strategies produce the same result. Pick whichever feels natural
for the plan — the reverse strategy is shorter to state (always 0).

Save the returned `newSlideId` next to each plan entry regardless of
strategy. You will need it in steps 7 and 9.

## Step 7 — Fill content

For each new slide, pass the replacements derived from the brief and the
snapshot you captured in step 5:

```
google_slides_replace_text(
  presentation_id   = <file.id>,
  slide_ids         = [<newSlideId>],
  replacements_yaml = <YAML list of {find, replace, match_case?}>
)
```

Important: `slide_ids` scopes the replacement so that the same token
(e.g., `[Title]`) in other slides is not affected. Replace slides one at
a time — this keeps each slide's content isolated and makes step 9's
leak check per-slide straightforward.

For non-text edits (image swap, shape resize, table rows) use
`google_slides_batch_update` with recipes from `batch-update-recipes.yaml`.

### Handling empty placeholders

`google_slides_get_slide` flags shapes with `isEmptyPlaceholder: true`
for placeholder shapes that have no actual text runs. Google Slides
shows a "Click to add text" or "Click to add subtitle" hint in the UI,
but that label is not a real text run — `replaceAllText` has nothing to
match.

Fill these shapes via `google_slides_batch_update` with `insertText`
addressed by the shape's objectId (not by cellLocation — these are
shapes, not table cells):

```yaml
- insertText:
    objectId: "<shape objectId>"
    text: "Your content here"
    insertionIndex: 0
```

If you use `replace_text` on an empty placeholder, the call succeeds
silently (zero occurrences changed) and the UI hint stays visible in
the final deck — a common cause of "column 2 shows Click to add text"
bugs.

### Handling multi-column layouts (left-to-right ordering)

Patterns like "3-column" or "Grid" have several shapes that share the
same placeholder role (e.g., three `BODY` placeholders). The Slides
API does not order them left-to-right in its response — page element
order is arbitrary.

Sort by `transform.translateX` (ascending) to identify column order:

1. Collect all shapes with the same `placeholder` role (or all shapes
   that look like content containers).
2. Sort ascending by `transform.translateX` — that gives you left,
   center, right (or column 1 → N).
3. Bind your content to the correctly-indexed shape via its `objectId`.

Skipping this step is the root cause of "all three columns of content
ended up in column 1" failures.

### Handling table cells

`google_slides_get_slide` returns a `cells` array for each `type:
"table"` element. Each cell carries `rowIndex`, `columnIndex`, and
`fullText` (absent when the cell is empty). Use this to plan the fill:

- **Non-empty cells** already have text like `"1"` / `"Item One"` /
  `"Presenter"`. Replace via `replace_text` using the cell's existing
  text as the `find` argument, scoped to the slide:
  ```yaml
  - find: "Item One"
    replace: "Claude Cowork とは？"
  ```
  Do NOT use `insertText` with `cellLocation` on a non-empty cell — it
  prepends text instead of replacing, so the result is
  `"Claude Cowork とは？Item One"`.
- **Empty cells** have no fullText. Use `batch_update` `insertText`
  with `objectId` + `cellLocation`.
- **Unused rows** (rows whose cells all have no fullText that the brief
  would fill) should be deleted via `batch_update` `deleteTableRow` —
  leaving them in place shows rows like "5 Item Five Presenter" in the
  final deck.

See `batch-update-recipes.yaml` for `deleteTableRow` / `insertText` /
`deleteText` recipes.

### Handling existing image elements (template stock imagery)

`google_slides_get_slide` returns `type: "image"` for actual image
elements the template already has content in. Treat these as
**replaceable content** by default — template authors put stock photos
/ icons there as visual placeholders, and leaving them in the final
deck ships someone else's stock photography as if it were yours.

For each image element, pick one of three paths:

1. **Swap with a user-supplied image URL.** If the user provided a
   direct HTTPS URL for this slot (or referenced a file they already
   uploaded), use that URL.
2. **Swap with an agent-generated image.** If the content calls for
   imagery the user did not supply (icons for feature cards, diagrams,
   illustrative photos), go through the generate-and-publish pipeline
   below.
3. **Keep the template image.** Rare. Acceptable when the template
   image is explicitly the intended final asset (e.g., a company logo
   in a footer slot).

In every case, use `replaceImage` via `google_slides_batch_update`
with the existing element's `objectId`:

```yaml
- replaceImage:
    imageObjectId: "<existing image objectId>"
    url: "<public HTTPS URL>"
    imageReplaceMethod: CENTER_INSIDE   # or CENTER_CROP if the box
                                         # should be fully filled
```

`replaceImage` preserves the element's position and size, so the new
image lands exactly where the old one sat.

#### Generate-and-publish pipeline for agent-created images

Images the agent generates have to live at a public HTTPS URL for the
Slides API to fetch them. Four tool calls, no custom infrastructure:

1. **Generate the image** with `generate_image` (or any generator the
   skill has access to). The result is a local file (e.g.,
   `~/Downloads/icon.png`).
2. **Upload to Drive** with `google_drive_upload`. Save the returned
   `file_id`.
3. **Make it public** with `google_drive_share` using
   `role: "reader"`, `type: "anyone"` so the Slides API can fetch it
   without authentication.
4. **Construct the public URL** as
   `https://drive.google.com/uc?id=<file_id>` (this is the
   direct-download endpoint that works in `replaceImage` and
   `createImage`).
5. **Call `replaceImage`** with that URL on the image's `objectId`.

Failure modes of this pipeline:

- **Forgot to share publicly** → `batch_update` fails with a
  permission error when Google tries to fetch the image.
- **Used the `drive.google.com/file/d/.../view` URL instead of the
  `uc?id=...` form** → Slides API receives HTML, rejects the image.
- **Generated image has a wrong aspect ratio** → the image gets
  letterboxed or cropped depending on `imageReplaceMethod`. Generate
  at the same aspect ratio as the placeholder's `size` when possible.

### Handling empty image placeholders

Templates often include image placeholder shapes shown in the UI with a
landscape/picture icon and "Click to add image". These are shapes with
`placeholder: "PICTURE"` (or similar image-type placeholders) — they
contain no actual image and `replace_text` / `insertText` do nothing
meaningful on them.

Fill with `batch_update` `createImage`, reusing the placeholder's
`size` and `transform` so the new image lands in the exact same spot:

```yaml
- createImage:
    url: "<https URL of the image>"
    elementProperties:
      pageObjectId: "<slide objectId>"
      size: <copy from placeholder.size>
      transform: <copy from placeholder.transform>
```

Then delete the original placeholder so it does not show behind the new
image:

```yaml
- deleteObject:
    objectId: "<placeholder objectId>"
```

Leaving the original placeholder in place produces the landscape icon
showing through when the inserted image does not fully cover the
placeholder bounds.

### Japanese text — kinsoku shori (禁則処理)

When the deck contains Japanese text, apply the standard line-breaking
rules before writing content into `replace_text` or `insertText`. The
Slides API does not auto-apply kinsoku at the text-run level; whatever
you hand the API is what appears on the slide, including mid-line
breaks and punctuation at the wrong positions.

**Line-start prohibition (行頭禁則)** — never start a visual line with:

```
）」』】)]}  、。,.  ！？!?  ・：；:;  ー
```

Bad: `...になる\n）する`  →  Good: `...になる）\nする`

**Line-end prohibition (行末禁則)** — never end a visual line with:

```
（「『【([{
```

Bad: `データ（\nCDP`  →  Good: `データ\n（CDP`

**No-break (分離禁止)** — keep together:

- English words and numbers (`1,000`, `100%`, `Q3`)
- URLs and email addresses
- Paired punctuation (`「Hello」` stays on one line)

**Practical rule**: compose each Japanese paragraph as free-flowing
text without explicit `\n` breaks, and let the template's text box
wrap naturally. Introduce `\n` only at semantic paragraph boundaries,
not to force visual breaks — the latter is where most kinsoku
violations originate.

If the template author embedded manual breaks that violate kinsoku
(rare but possible), that is a template bug; flag it to the user
rather than trying to work around it in the skill.

### Style preservation guarantee

`replaceAllText` edits the content of existing text runs in place, so the
run's styling (font family, size, weight, color, decoration) is preserved
automatically. Do not re-apply styles after replacement — that overrides
the template author's theme decisions and breaks consistency across the
deck.

The only caveat: if the template author split a single logical phrase
across multiple runs (rare, but possible), `replaceAllText` matches only
within a single run. Symptom: partial replacement. Fix: the template
should be corrected; do not work around it with `updateTextStyle`.

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
