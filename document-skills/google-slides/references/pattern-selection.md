# Pattern Selection

Read this file during step 4 (Plan the deck) of the workflow. It covers how
to read thumbnails, map user intent to pattern slides, and avoid
misclassifying patterns.

## Pattern Taxonomy

Most business decks reduce to a small number of reusable layouts. If the
template author followed the convention, each pattern slide has a title like
`Pattern: <description>`. Expect to see:

| Layout family        | Typical use                                  |
|----------------------|----------------------------------------------|
| Title / cover        | Deck opener                                  |
| Section divider      | Separates major sections                     |
| Agenda               | Table of contents                            |
| One-column text      | Detailed explanation, intro                  |
| Two-column text      | Compare and contrast, pros/cons              |
| Three-column text    | Process steps, framework                     |
| Stat callout         | 1–5 numeric metrics with labels              |
| Quote                | Customer testimonial, leadership statement   |
| Image + text         | Screenshot + explanation, persona card       |
| Timeline             | Roadmap, release history                     |
| Table                | Comparison matrix, feature checklist         |
| Chart + commentary   | Data visualization with takeaway             |
| CTA / closer         | Next steps, contact info                     |

A good template has ~10–15 patterns covering these families. Fewer means
some briefs will not map cleanly.

## Reading Thumbnails

For each pattern slide, you have three signals:

1. **Slide title** (if present) — e.g., `Pattern: Stat Callout (3 cols)`
2. **Text previews** — first ~120 characters of each shape's text
3. **Thumbnail URL** — a rendered PNG you can inspect visually

The title is the most reliable signal. Text previews tell you the
placeholder tokens in use. Thumbnails resolve ambiguity when the title is
missing or generic.

Ambiguity example: two "Stat Callout" patterns that differ only in column
count (2 vs 3). The title suffix and thumbnail disambiguate — pick the one
that matches the user's metric count.

## Matching Brief Structure to Patterns

Before selecting patterns, decompose the brief into a linear outline:

1. Deck opening (title, audience, date)
2. Context (why this matters, problem framing)
3. Main content (divided into sections)
4. Key evidence (metrics, quotes, examples)
5. Recommendation or ask
6. Close (thanks, next steps, contact)

Then walk the outline and pick patterns:

- Opening → "Title" family
- Context → "One-column text" or "Two-column text"
- Section starts → "Section divider" (one per major section)
- Evidence → "Stat callout", "Chart + commentary", or "Quote" depending on
  evidence type
- Recommendation → "One-column text" or "Image + text" for emphasis
- Close → "CTA / closer"

## Selection Checklist

Before committing to a pattern, verify:

- **Slot count matches content.** If the pattern has 3 stat slots and the
  user gave 5 metrics, pick a different pattern or trim to 3 — do not try
  to add slots via `batch_update`. Adding slots almost always breaks the
  template's proportions.
- **Image slots match available images.** An "Image + text" pattern needs
  an image; if the user did not provide one, pick a text-only equivalent.
- **The placeholder text tokens are recognizable.** If `textPreview` shows
  filler like "Lorem ipsum" with no token markers, the replace step will
  have to search for the filler text verbatim — more fragile than
  explicit `[Title]`/`[Body]` tokens.

If no pattern fits a brief section, **do not improvise** by heavy
`batch_update` customization. Either:

- Pick the closest pattern and accept a slight mismatch, or
- Tell the user the template is missing a needed pattern and ask whether
  to skip that content or update the template

Both are better than silently producing a broken-looking slide.

## Worked Example

Brief: "Q3 business review deck — revenue up 12% to $4.2M, expenses flat,
two customer wins (Acme and Beta Corp), one loss (Gamma), and a proposal
to double marketing spend in Q4."

Plan:

| # | Pattern              | Content                                    |
|---|----------------------|--------------------------------------------|
| 1 | Title                | "Q3 Business Review", presenter, date      |
| 2 | Agenda               | 5 sections                                 |
| 3 | Section divider      | "Q3 Financial Results"                     |
| 4 | Stat Callout (2 col) | Revenue +12% / Expenses flat               |
| 5 | Section divider      | "Customer Pipeline"                        |
| 6 | Two-column text      | Wins (Acme, Beta) / Loss (Gamma)           |
| 7 | Section divider      | "Q4 Proposal"                              |
| 8 | One-column text      | Marketing spend rationale                  |
| 9 | CTA / closer         | "Approve by EOW", contact                  |

Show this plan to the user. Ask: "Does this mapping work, or should I
reshuffle?" Only after confirmation start duplicating.

## Avoiding Misclassification

Common mistakes and how to avoid them:

- **Picking a parts-catalog slide as a pattern.** If a slide has 6 different
  tables or 10 different CTA buttons visible at once, it is a reference
  catalog, not a pattern. Using it as a pattern produces a copy cluttered
  with all 6/10 parts. Verify by looking at the thumbnail before duplicating.
  If the deck has catalog slides, flag them — they belong in a pattern-gen
  workflow, not an editor workflow.
- **Assuming layout count from text count.** A slide with three `[Text]`
  tokens is not necessarily a three-column layout — they might be three
  paragraphs in one column. Thumbnail is authoritative.
- **Overloading a single slide.** If a section has too much content, use
  multiple slides with the same pattern rather than cramming. "Three metrics
  per stat-callout slide" is a hard constraint — split into two slides for
  six metrics.
