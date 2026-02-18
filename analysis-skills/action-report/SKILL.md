---
name: action-report
description: "Use this skill when you need to output a structured action report in the artifact panel using preview_action_report. Trigger when presenting prioritized recommendations with before/after changes. Defines the YAML format for action reports with title, executive summary, and action items (as-is, to-be, reason). Also use when another skill references 'action-report' for output format."
---

# Action Report

Render prioritized action reports in the artifact panel via `preview_action_report`. The agent writes a YAML file defining an executive summary and a list of action items; the MCP App renders them as visual cards sorted by priority.

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
| `as_is` | Yes | Current state — markdown (use code blocks for HTML/JSON/config) |
| `to_be` | Yes | Recommended state — markdown (complete replacement, not a diff) |
| `reason` | Yes | Why this change — cite data, competitor patterns, expected effect |
| `impact` | No | Expected impact (e.g., "+35-40 clicks/month", "CTR +2%") |

## Rendering

The dashboard renders actions sorted by priority (high → medium → low) as flat cards with no expand/collapse. Each card shows:

- **Header**: number badge, title, priority badge, category badge
- **Diff area**: side-by-side Current (red background) / Recommended (green background)
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
