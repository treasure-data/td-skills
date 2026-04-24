# Filling Content — Per-Element Playbook

Detailed patterns for Step 7 of the main workflow. Read the relevant
section when you hit the matching element kind in `get_slide` output.

## Table of contents

1. [Empty text placeholders](#empty-text-placeholders) — `isEmptyPlaceholder: true` on a non-image shape
2. [Multi-column layouts](#multi-column-layouts) — several shapes sharing the same placeholder role
3. [Table cells](#table-cells) — `type: "table"` elements with a `cells[]` array
4. [Existing image elements](#existing-image-elements) — `type: "image"` with an existing `contentUrl`
5. [Generate-and-publish image pipeline](#generate-and-publish-image-pipeline) — produce a public URL for an agent-made image
6. [Empty image placeholders](#empty-image-placeholders) — `placeholder: "PICTURE"` with no image content
7. [Japanese text — kinsoku shori](#japanese-text--kinsoku-shori)
8. [Style preservation](#style-preservation)

## Empty text placeholders

`google_slides_get_slide` flags shapes with `isEmptyPlaceholder: true`
for placeholder shapes that have no actual text runs. Google Slides
shows a "Click to add text" or "Click to add subtitle" hint in the UI,
but that label is not a real text run — `replaceAllText` has nothing
to match.

Fill these shapes via `google_slides_batch_update` `insertText`
addressed by the shape's objectId (not by cellLocation — these are
shapes, not table cells):

```yaml
- insertText:
    objectId: "<shape objectId>"
    text: "Your content here"
    insertionIndex: 0
```

Using `replace_text` on an empty placeholder succeeds silently (zero
occurrences changed), and the UI hint stays visible in the final deck.
That is the typical "column 2 shows 'Click to add text'" bug.

## Multi-column layouts

Patterns like "3-column" or "Grid" have several shapes sharing the
same placeholder role (e.g., three `BODY` placeholders). The Slides
API does not return elements in visual order.

Sort by `transform.translateX` ascending to identify left-to-right
order:

1. Collect all shapes with the same `placeholder` role (or all shapes
   that look like content containers).
2. Sort ascending by `transform.translateX` — that gives left, center,
   right (or column 1 → N).
3. Bind content to the correctly-indexed shape via its `objectId`.

Skipping this is the root cause of "all three columns of content
ended up in column 1" failures.

## Table cells

`google_slides_get_slide` returns a `cells` array for each `type:
"table"` element. Each cell carries `rowIndex`, `columnIndex`, and
(if present) `fullText`.

- **Non-empty cells** already have text like `"1"` / `"Item One"` /
  `"Presenter"`. Replace via `replace_text` using the cell's existing
  text as the `find` argument, scoped to the slide:
  ```yaml
  - find: "Item One"
    replace: "Claude Cowork とは？"
  ```
  Using `insertText` with `cellLocation` on a non-empty cell prepends
  instead of replacing, producing `"Claude Cowork とは？Item One"`.
- **Empty cells** have no fullText. Use `batch_update` `insertText`
  with `objectId` + `cellLocation`.
- **Unused rows** (rows whose cells all have no fullText the brief
  would fill) should be deleted via `batch_update` `deleteTableRow` —
  otherwise the final deck shows rows like "5 Item Five Presenter".

See `batch-update-recipes.yaml` for `deleteTableRow` / `insertText` /
`deleteText` recipes.

## Existing image elements

`google_slides_get_slide` returns `type: "image"` for actual image
elements the template already has content in. Treat these as
replaceable content by default — template authors put stock photos
and icons there as visual placeholders, and leaving them in the final
deck ships someone else's stock imagery as if it were yours.

For each image element, pick one of three paths:

1. **Swap with a user-supplied image URL.** If the user provided a
   direct HTTPS URL (or referenced a file they already uploaded), use
   that URL.
2. **Swap with an agent-generated image.** If the content calls for
   imagery the user did not supply (feature-card icons, diagrams,
   illustrative photos), use the [generate-and-publish
   pipeline](#generate-and-publish-image-pipeline) below.
3. **Keep the template image.** Rare. Acceptable only when the
   template image is explicitly the intended final asset (e.g., a
   company logo in a footer slot).

In every case, call `replaceImage` via `google_slides_batch_update`:

```yaml
- replaceImage:
    imageObjectId: "<existing image objectId>"
    url: "<public HTTPS URL>"
    imageReplaceMethod: CENTER_INSIDE   # or CENTER_CROP if the box
                                        # should be fully filled
```

`replaceImage` preserves the element's position and size, so the new
image lands exactly where the old one sat.

## Generate-and-publish image pipeline

Images the agent generates have to live at a public HTTPS URL for the
Slides API to fetch them. Five steps, no custom infrastructure:

1. Generate the image with `generate_image` (or whichever generator
   the skill has access to). Result is a local file.
2. Upload to Drive with `google_drive_upload`. Save `file_id`.
3. Make it public with `google_drive_share` — `role: "reader"`,
   `type: "anyone"`. Without this, the Slides API's fetch is denied.
4. Construct the URL as `https://drive.google.com/uc?id=<file_id>`.
   This is the direct-download endpoint; the `/file/d/.../view` URL
   serves HTML and the Slides API rejects it.
5. Call `replaceImage` (or `createImage`) with that URL.

Failure modes:

- **Forgot to share publicly** → `batch_update` fails with a
  permission error when Google fetches the image.
- **Used the `/view` URL** → Slides API receives HTML, rejects the
  image.
- **Wrong aspect ratio** → letterboxed or cropped depending on
  `imageReplaceMethod`. Generate at the placeholder's aspect ratio
  when possible.

## Empty image placeholders

Templates often include image placeholder shapes shown in the UI with
a landscape icon and "Click to add image". These are shapes with
`placeholder: "PICTURE"` (or similar image-type placeholders) — they
hold no actual image, and `replace_text` / `insertText` do nothing
meaningful on them.

Fill with `batch_update` `createImage`, reusing the placeholder's
`size` and `transform` so the new image lands in the exact same spot:

```yaml
- createImage:
    url: "<public HTTPS URL>"
    elementProperties:
      pageObjectId: "<slide objectId>"
      size: <copy from placeholder.size>
      transform: <copy from placeholder.transform>
```

In the same `batch_update` call, delete the placeholder so its icon
does not show through when the inserted image is smaller than the
placeholder bounds:

```yaml
- deleteObject:
    objectId: "<placeholder objectId>"
```

## Japanese text — kinsoku shori

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

If the template author embedded manual breaks that violate kinsoku,
that is a template bug; flag it to the user rather than working
around it in the skill.

## Style preservation

`replaceAllText` edits the content of existing text runs in place, so
run-level styling (font, size, weight, color, decoration) is preserved
automatically. Re-applying styles after replacement overrides the
template author's theme decisions and breaks consistency across the
deck.

Caveat: if the template author split a single logical phrase across
multiple runs (rare), `replaceAllText` matches only within a single
run. Symptom: partial replacement. The template should be corrected,
not worked around with `updateTextStyle`.
