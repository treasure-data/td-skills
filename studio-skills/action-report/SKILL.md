---
name: action-report
description: "YAML format reference for action reports rendered via preview_action_report. MUST be read before writing any action report YAML — defines the report structure (title, summary, actions array) and action item fields (as_is, to_be, reason, priority, category, impact) with incremental build workflow. Required by seo-analysis and any skill that produces prioritized recommendations."
---

# Action Report

Render prioritized action reports in the artifact panel via `preview_action_report`. The agent writes a YAML file defining an executive summary and a list of action items; the MCP App renders them as visual cards sorted by priority.

## Building the Report Incrementally

**CRITICAL**: Large reports (6+ actions) MUST be built in batches to avoid output truncation. Do NOT attempt to write the entire YAML in a single tool call.

1. **Write** the file with `title`, `subtitle`, `summary`, and the first 2–3 actions
2. **Edit** the file to append the next 2–3 actions at the end of the `actions` array
3. Repeat step 2 until all actions are written
4. Call `preview_action_report` **once** at the end — never mid-build

Each Edit call should add at most 3 action items. This keeps individual tool call output small and prevents mid-generation truncation.

## YAML Structure

```yaml
title: "SEO Action Report: example.com"
subtitle: "Analyzed 2026-02-18 (28-day window)"    # optional
summary: |
  AEO Score: 58/100 (C). 12 quick wins identified.
  Estimated total impact: +190-270 clicks/month.

actions:
  - title: "Rewrite H1 to include primary keyword"
    priority: high              # high | medium | low
    category: "Content Structure"  # optional — shown as badge
    as_is: |
      ```html
      <h1>Making Marketers Superhuman</h1>
      ```
    to_be: |
      ```html
      <h1>Treasure Data CDP | AI-Native Customer Data Platform</h1>
      ```
    reason: |
      Current H1 has no keyword signals. Top 5 competitors
      all include "CDP" in H1. Expected: +15-20% CTR.
    impact: "+35-40 clicks/month"  # optional — shown at bottom of card

  - title: "Add FAQPage JSON-LD schema"
    priority: high
    category: "Structured Data"
    as_is: |
      Only Article schema present
    to_be: |
      ```json
      {
        "@type": "FAQPage",
        "mainEntity": [
          {"@type": "Question", "name": "How does a CDP work?", "acceptedAnswer": {"@type": "Answer", "text": "..."}},
          {"@type": "Question", "name": "CDP vs DMP?", "acceptedAnswer": {"@type": "Answer", "text": "..."}}
        ]
      }
      ```
    reason: |
      4/5 competitors have FAQPage schema. Sites with 3+ schema types
      show ~13% higher AI citation rate.
    impact: "+50-80 clicks/month"
```

## Fields

| Field | Required | Description |
|-------|----------|-------------|
| `title` | Yes | Report title (e.g., "SEO Action Report: example.com") |
| `subtitle` | No | Subtitle shown below title (e.g., date range, analysis scope) |
| `summary` | Yes | Executive summary — markdown text shown at top of report |
| `actions` | Yes | Array of action items (at least one) |

### Action Item Fields

| Field | Required | Description |
|-------|----------|-------------|
| `title` | Yes | Short action title (imperative form: "Add...", "Rewrite...", "Fix...") |
| `priority` | Yes | `high`, `medium`, or `low` — determines sort order and color |
| `category` | No | Category tag (e.g., "Content Structure", "Technical SEO") |
| `as_is` | Yes | As-Is (current state) — markdown (use code blocks for HTML/JSON/config) |
| `to_be` | Yes | To-Be (recommended state) — markdown (complete replacement, not a diff) |
| `reason` | Yes | Why this change — cite data, competitor patterns, expected effect |
| `impact` | No | Expected impact (e.g., "+35-40 clicks/month", "CTR +2%") |

## Rendering

The dashboard renders actions sorted by priority (high → medium → low) as flat cards with no expand/collapse. Each card shows:

- **Header**: number badge, title, priority badge, category badge
- **Diff area**: As-Is (red card) / To-Be (green card) stacked vertically
- **Reason**: explanation text below the diff
- **Impact**: metric at bottom of card (if provided)

### Copy as Markdown

A **Copy as Markdown** button in the header copies the entire report as formatted markdown to the clipboard. This allows users to paste into docs, tickets, or share with team members.

### Calling the tool

Write the YAML file and call:

```
preview_action_report({ file_path: "/absolute/path/to/action-report.yaml" })
```

## Writing Guidelines

- **`as_is` and `to_be`**: Include **actual current content** and **complete replacement** — not vague descriptions. Use code blocks for HTML, JSON-LD, config snippets.
- **`reason`**: Cite specific data — competitor patterns, SERP features, score dimensions, metrics. Not just "this is better."
- **`priority`**: Based on effort-to-impact ratio. High = low effort + high impact. Low = high effort or low impact.
- **`summary`**: Lead with the most important finding. Include key scores and total expected impact.

## Fallback (No Artifact Panel)

When `preview_action_report` is not available (CLI mode), output the same information as formatted markdown directly in the conversation.
