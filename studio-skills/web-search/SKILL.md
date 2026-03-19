---
name: web-search
description: Use when performing web searches, extracting content from URLs, or researching topics requiring up-to-date information. Triggers on: "search", "look up", "find out", "what's the latest", "extract from URL", "fetch this page", "research", "check online".
---

# Web Search

Use `web_search` for research and page extraction. Powered by OpenAI web search (Bing-backed): **search + extraction + summarization** in one call.

## Key Insight

The `query` is a **prompt to an LLM with web access**. Write instructions, not bare keywords.

```
✗ "Snowflake pricing"
✓ "List all pricing tiers from https://snowflake.com/pricing in a table with features"
```

## Parameters

- `search_context_size: low` — quick facts
- `search_context_size: medium` — general research (default)
- `search_context_size: high` — URL extraction, deep analysis

Use `high` whenever a specific URL is in the query.

## Query Patterns

**URL extraction** — read a specific page and structure the output:
```
"Extract all items from https://example.com/page and list each with details in a table"
```

**Structured research** — request comparison tables, bullet summaries:
```
"Compare {A} vs {B} vs {C} covering pricing, features, and target audience"
```

**Search operators** — `"exact phrase"`, `site:domain.com`, `AND`/`OR`, `-exclude`:
```
site:reddit.com "nextjs" vs "remix" experience
"{company}" AND ("funding" OR "revenue") 2025 2026
```

**Translation** — read non-English pages:
```
"Translate and summarize: https://example.co.jp/news/"
```

**API endpoints** — read JSON responses:
```
"Describe the JSON structure of https://api.github.com/repos/{owner}/{repo}"
```

## Strengths

- Bypasses bot protection (Reddit, G2, Gartner) via Bing's index
- Extracts structured data (pricing, jobs, reviews, changelogs)
- Reads and translates any language
- Supports search operators (`site:`, `AND`/`OR`, `"quoted"`)

## Limitations

- **No verbatim full-text** — summarizes copyrighted content instead of reproducing it
- **24-48h recency lag** — not suitable for real-time monitoring
- **No PDF internals** — `filetype:pdf` is unreliable
- **No auth pages** — cannot access login-required content
- **Paywalls** — reads public portions only

## Workarounds for Limitations

When `web_search` falls short, suggest these alternatives to the user:

- **Real-time monitoring** → RSS feeds (many sites expose `/feed` or `/rss`)
- **Raw HTML / interactive pages** → Playwright (headless browser; click, scroll, screenshot)
- **Full-text extraction** → Playwright to fetch raw HTML, then parse locally

## Examples

### Example: Extract page content
**Input:** "What jobs are open at Company X?"
**Action:** `"List all job openings from https://company-x.com/careers/ with title and location"` (high)

### Example: Research with multiple angles
**Input:** "Research Company X's market position"
**Action:** Run in parallel:
1. `"Company X market position analyst reports 2026"` (medium)
2. `"Extract key metrics from https://company-x.com/about"` (high)
3. `site:reddit.com "Company X" opinions experience` (medium)

### Example: Translate foreign page
**Input:** "What does this Japanese press release say?"
**Action:** `"Translate to English and summarize: https://example.co.jp/press/"` (high)
