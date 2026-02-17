# Playwright + Page Signal Extraction Workflow

Shared workflow for extracting SEO/AEO signals from web pages using playwright-cli and `extract_page_signals.py`.

## Prerequisites

- `playwright-cli` installed: `npm install -g @playwright/cli@latest`
- Python 3 available
- Script location: `analysis-skills/scripts/extract_page_signals.py`

## First Page

Open the browser, capture structure, and extract signals:

```bash
playwright-cli open <url>
playwright-cli snapshot
playwright-cli screenshot
playwright-cli run-code "async page => { return await page.content(); }" > /tmp/page.html
python3 analysis-skills/scripts/extract_page_signals.py /tmp/page.html --url <url>
```

- `snapshot` — YAML accessibility tree for heading hierarchy, navigation, content structure
- `screenshot` — visual analysis for layout, CTA placement, information density
- `run-code` + Python script — full SEO/AEO signal extraction as JSON

## Subsequent Pages

Navigate without reopening the browser:

```bash
playwright-cli goto <next_url>
playwright-cli snapshot
playwright-cli screenshot
playwright-cli run-code "async page => { return await page.content(); }" > /tmp/page.html
python3 analysis-skills/scripts/extract_page_signals.py /tmp/page.html --url <next_url>
```

## Close Browser

Always close the browser when finished with all pages:

```bash
playwright-cli close
```

## Extracted Signal Fields

The Python script outputs JSON containing:

| Category | Fields |
|----------|--------|
| Meta | title, meta description, OG/Twitter metadata, canonical URL |
| Headings | hierarchy with question detection |
| Structured Data | JSON-LD types, schema types, entity properties (sameAs, about, mainEntity, author) |
| BLUF Analysis | per-H2 section analysis with pattern classification (definition/number/verdict/step/yesno) |
| Content Metrics | word count, lists, tables, images (with alt text analysis) |
| Links | internal/external counts, internal link anchor texts |

Use `--fields` to extract specific signals (e.g., `--fields schema_types,bluf_analysis,entity_properties`).
Use `--help` for the full field list.

## eval vs run-code

- **`eval`**: Simple single-value extraction only (e.g., `document.title`). Avoid for complex expressions — shell escaping issues.
- **`run-code`**: Multi-signal extraction. Always use with the Python script for reliable structured output.
