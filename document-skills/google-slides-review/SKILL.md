---
name: google-slides-review
description: >
  Use this skill at the end of a Google Slides deck-creation flow run
  by the same agent in the current session, before reporting the
  finished URL to the user. Catches the failure modes a creating
  agent reliably misses — surviving placeholder text, unswapped
  template imagery, layout overflow, hidden-original leaks. Trigger
  when the parent google-slides workflow reaches Step 9 / QA, or
  when the user asks "is this deck ready?" / "QA my deck" about a
  deck this agent itself just edited. Do NOT trigger for reviewing
  decks the agent did not create — without the Step 5 pre-fill
  snapshot the leak check silently degrades and the result is
  misleading.
---

# Google Slides Review

Independent review pass for a deck the parent `google-slides` skill
just finished editing. The creating agent has fresh memory of "I just
made these slides" and reliably skims the verification step — declaring
"looks good" without actually inspecting each slide. This skill spawns
parallel sub-agents that re-examine the deck in fresh contexts so the
prior bias does not survive into the review.

The sub-agents only **report findings**. The orchestrating agent fixes
every finding and re-runs this skill until it returns clean.

## Inputs

- `presentation_id` (required) — the working deck ID
- `pattern_snapshot` (required) — the Step 5 snapshot from the parent
  workflow. Schema is documented at
  [`../google-slides/references/workflow.md`](../google-slides/references/workflow.md)
  Step 5 (`elements` map + `duplicate_map`). Pass it inline as
  YAML/JSON if the serialized blob is under ~10 KB; otherwise write
  it to a temp file (e.g.
  `~/.tdx/cache/google-slides-review/<presentation_id>.snapshot.json`)
  and pass the path as `pattern_snapshot_path` instead. Decks larger
  than ~15 slides will usually exceed the inline budget.
- `pattern_slide_ids` (optional) — the original pattern IDs from the
  plan, so the structural check can verify they end up
  `isSkipped: true`. If omitted, the structural check skips that
  part and notes it in the report.
- `iteration` (optional, default 1) — pass 2, 3, … on subsequent
  rounds; sub-agents are slightly less forgiving on later iterations
  because every loop costs the user time and tokens.

If the snapshot was discarded between Step 5 and now, say so honestly
and run only the visual + structural checks. Inventing a snapshot
from the current (already filled) deck defeats the purpose of the
leak check.

## Workflow

1. Sanity-check the inputs. If `presentation_id` is missing or the
   snapshot looks empty, abort with a clear error rather than
   spawning sub-agents on garbage.
2. Spawn three sub-agents **in parallel** with `TaskCreate` (one
   message, three calls). Use the prompts in the next section.
3. Wait for all three with `TaskGet`/`TaskList`.
4. Aggregate findings into one report grouped by `slide_id`.
5. Return the report. The orchestrator (not this skill) fixes the
   findings — running checks inline in the orchestrator's own
   context recreates the bias the parallel sub-agents exist to
   escape.

## Sub-agent prompts

Use these as the literal `TaskCreate` `prompt` argument. Substitute
`{presentation_id}`, `{pattern_snapshot}`, `{pattern_slide_ids}`,
`{iteration}` before sending.

### Sub-agent 1 — Visual review

```
You are reviewing a freshly-edited Google Slides deck for visual
correctness. The check rules are inlined below.

Deck: {presentation_id}
Iteration: {iteration}

Workflow:
1. Call `google_slides_list_slides` and filter to visible slides
   (`isSkipped: false`).
2. For each visible slide, call
   `google_slides_get_thumbnail(presentation_id, slide_id, size: 'MEDIUM')`.
   The tool returns a JSON object with a `path` field — DO NOT
   eyeball the path. Call the **Read** tool on that `path` so the
   rendered image enters the conversation. Without that step you
   cannot actually see the slide; reporting "looks fine" without
   reading the image is the exact failure this skill exists to
   catch.
3. After loading each thumbnail visually, look for:
   - Pattern text surviving the fill: `[Title]`, `Lorem ipsum`,
     "Title goes here", `xx%`, `00.`, "Click to add text", and any
     other obvious template token.
   - Empty image placeholders — landscape / picture / photo icons
     where a real image should be.
   - Template stock imagery that was never replaced (decorative
     people, abstract gradients, unrelated stock photos).
   - Text overflow off the slide edge or clipping.
   - Distorted images, broken aspect ratios, broken HTTPS fetches.
   - Japanese kinsoku violations: `）「` etc. at line start,
     English words split mid-token across line breaks.
   - Generic template-author filler ("Item Five", "Sample text",
     "Your text here").

Return findings as a YAML list, one entry per issue:

- slide_id: <objectId>
  severity: blocker | warning | nit
  category: placeholder-leak | empty-picture-placeholder |
            stale-stock-image | overflow | distorted-image |
            kinsoku | template-filler
  evidence: <one-sentence quote of what's visible>
  suggested_fix: <one-sentence concrete next action>

Required final line of the report (even on empty findings):
`inspected_slide_ids: [<objectId>, ...]` — every slide whose
thumbnail you actually loaded via `Read`. Without this list a
silent skip looks identical to a clean review. Be skeptical: a deck
that "looks fine" on a first glance routinely has 1-2 leftover
placeholders the creator missed.
```

### Sub-agent 2 — Snapshot-diff leak check

```
You are checking whether placeholder content actually got replaced.
Snapshot schema is documented at the parent skill's
`references/workflow.md` Step 5 — `elements` (pattern text keyed by
slide+object, cells keyed with rowIndex/columnIndex) and
`duplicate_map` (newSlideId → patternSlideId).

Deck: {presentation_id}
Pattern snapshot:
{pattern_snapshot_or_path}

If `pattern_snapshot_or_path` looks like a filesystem path (starts
with `/`, `~`, or `./`), read the file first.

Workflow:
1. Parse the snapshot. Validate both `elements` and `duplicate_map`
   are present. If either is missing or empty, return a single
   `category: snapshot-malformed` finding and stop — do not invent
   leaks.
2. Call `google_slides_list_slides` and filter to visible slides
   (`isSkipped: false`).
3. For each visible `newSlideId`:
   a. Look up its `patternSlideId` in `duplicate_map`. If absent,
      record a `category: missing-duplicate-mapping` warning and
      skip.
   b. Call `google_slides_get_slide(presentation_id, newSlideId)`.
   c. For each element, look up the matching pattern entry by
      `(patternSlideId, objectId)` (and cell coordinates for
      tables). Compare `fullText` byte-for-byte. Identical means
      the replacement did not happen — mark as
      `category: pattern-text-survived`, severity `blocker`.
4. Also scan every visible slide's `fullText` for these
   template-author idioms (they may live in elements the snapshot
   did not capture):
   `[Title]`, `[Body]`, `[Metric]`, `[CTA]`, `[Name]`, `[Subtitle]`,
   `Lorem ipsum`, `TODO`, `FIXME`,
   `xx%`, `XX%`, `00%`, `00.`, `YYYY`, `MM/DD`,
   "Title goes here", "Subtitle goes here", "Keep in mind that",
   "Click to add text", `PLACEHOLDER`.
   Mark any hit as `category: generic-token-found`, severity
   `blocker`.

Return findings as a YAML list:

- slide_id: <objectId>
  element_id: <objectId>
  severity: blocker | warning | nit
  category: pattern-text-survived | generic-token-found |
            missing-duplicate-mapping | snapshot-malformed
  evidence: <one sentence; for pattern-text-survived include both
             pattern and filled text, ~120 chars each>
  suggested_fix: <which `replace_text` or `batch_update insertText`
                  call would fix it>

Required final line (even on empty findings):
`compared_slide_ids: [<objectId>, ...]` — every visible slide you
actually walked. Empty list = clean.
```

### Sub-agent 3 — Structural check

```
You are checking deck structure: hidden-original integrity and empty
placeholder shapes the visual review may not catch. Rules inlined
below.

Deck: {presentation_id}
Original pattern slide IDs (from the plan): {pattern_slide_ids}

Workflow:
1. Call `google_slides_list_slides`. Note the visible vs skipped
   split. For every ID in `pattern_slide_ids` that is still
   `isSkipped: false`, mark a `hidden-original-still-visible` finding.
   If `pattern_slide_ids` is empty or absent, skip this part and note
   it in the report.
2. For each VISIBLE slide, call `google_slides_get_slide` and walk
   `pageElements`:
   - `placeholder: "PICTURE"` shape with no overlapping `type:
     "image"` of similar size + transform → empty picture placeholder
     that was never filled.
   - `isEmptyPlaceholder: true` on a TEXT_BOX shape → `replace_text`
     was used on a UI hint instead of `batch_update insertText`.
   - Table with rows whose every cell.fullText is empty or matches a
     generic stub ("Item One", just `5`) → unused template rows that
     should be `deleteTableRow`'d.

Severity defaults: `hidden-original-still-visible`,
`empty-picture-placeholder`, `empty-text-placeholder` are
`blocker`; `unused-table-row` is `warning`.

Return findings as a YAML list:

- slide_id: <objectId>
  element_id: <objectId, optional for slide-level findings>
  severity: blocker | warning | nit
  category: empty-picture-placeholder | empty-text-placeholder |
            unused-table-row | hidden-original-still-visible
  evidence: <one-sentence>
  suggested_fix: <one-sentence with the specific tool call>

Required final line (even on empty findings):
`inspected_slide_ids: [<objectId>, ...]` — every visible slide you
walked.
```

## Aggregating the report

After all three sub-agents return, group findings by `slide_id`,
order each slide's findings by severity (`blocker > warning > nit`),
and present them like this:

```markdown
# Review report — {presentation_id} (iteration N)

## Summary
- Visual: 4 findings (1 blocker, 3 warnings)
- Leak: 2 findings
- Structural: 1 finding
- Total: 7 findings across 5 slides

## Slide gXXXX — title text
- BLOCKER · placeholder-leak · "Title goes here" still visible →
  call `replace_text { find: "Title goes here", replace: "..." }`
- WARNING · stale-stock-image · template gradient unchanged →
  swap via `replaceImage` or confirm with user

## Slide gYYYY — agenda
- WARNING · empty-picture-placeholder · landscape icon visible →
  `batch_update createImage` reusing the placeholder's bounds, then
  `deleteObject` on the placeholder
```

End with a single next-action line, exactly one of:

- `READY: 0 findings — return the deck URL to the user.`
- `NOT READY: fix the {N} findings above and call this skill again with iteration={N+1}.`

## Loop contract

The orchestrator owns the loop:

- 0 findings → return the deck URL to the user.
- Findings present → fix every one (using `suggested_fix` as a
  starting point — verify by re-reading the affected slide before
  claiming a fix is done) and call this skill again with
  `iteration` incremented.
- After iteration 3 with findings still present → stop. Surface
  the remaining findings to the user verbatim and ask whether to
  continue, accept them, or change approach. Repeating a fix that
  already failed twice is rarely productive.

Template stock imagery is a judgment call: this skill flags it as
a warning, the user decides whether to keep or replace.
