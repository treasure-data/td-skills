# Redline Preview Workflow

Apply **all** recommendations from the action report to the live page's DOM via Playwright and take a full-page screenshot. The result is a visual diff: deleted text in red strikethrough, inserted text in green.

**CRITICAL — What redline means:**
- Find the **actual DOM element** (heading, paragraph, meta tag) and replace its content with `<del>` (old) + `<ins>` (new)
- The page should look like a normal webpage with inline edits, NOT a design mockup

**DO NOT:**
- Create overlay boxes, floating labels, or absolutely positioned annotations on top of the page
- Add colored rectangles with commentary text (e.g., "P1: タイトル変更 (+30 clicks)")
- Use `position: absolute/fixed` to place elements over the page content
- Write annotations in any language — the redline is purely visual (old text struck through, new text highlighted)

## Step 1: Navigate to target page

Reuse the existing Playwright session (page should already be open from analysis):
```bash
playwright-cli goto <url>
```

## Step 2: Extract page structure

Get a structural map of the page without reading the full HTML. This tells you what elements exist and where to target changes:
```bash
playwright-cli run-code "async page => {
  return await page.evaluate(() => {
    const structure = {};
    // Headings
    structure.headings = [...document.querySelectorAll('h1,h2,h3,h4')].map(h => ({
      tag: h.tagName, text: h.textContent.trim().substring(0, 100),
      id: h.id || null, selector: h.id ? '#' + h.id : null
    }));
    // Meta
    structure.title = document.title;
    structure.metaDesc = document.querySelector('meta[name=description]')?.content || null;
    // Schemas
    structure.schemas = [...document.querySelectorAll('script[type=\"application/ld+json\"]')]
      .map(s => { try { return JSON.parse(s.textContent)['@type']; } catch { return 'parse-error'; } });
    // Key paragraphs (first paragraph after each H2)
    structure.h2Intros = [...document.querySelectorAll('h2')].map(h2 => {
      const next = h2.nextElementSibling;
      return { heading: h2.textContent.trim(), firstPara: next?.tagName === 'P' ? next.textContent.trim().substring(0, 200) : null };
    });
    return JSON.stringify(structure, null, 2);
  });
}"
```

Use this structure map to plan which elements to target for each recommendation.

## Step 3: Inject redline CSS

```bash
playwright-cli run-code "async page => {
  await page.addStyleTag({ content: \`
    .seo-redline-del {
      background: rgba(255,0,0,0.15);
      text-decoration: line-through;
      text-decoration-color: #c00;
    }
    .seo-redline-ins {
      background: rgba(0,180,0,0.15);
      text-decoration: underline;
      text-decoration-color: #060;
      display: inline-block;
      margin: 4px 0;
      padding: 2px 4px;
      border-left: 3px solid #060;
    }
  \`});
}"
```

## Step 4: Apply ALL recommendations via DOM manipulation

For **every** recommendation in the action report, find the target element and replace it with `<del>` + `<ins>`. Use `page.evaluate()` to modify the DOM directly.

**Pattern A — Replace heading text:**
```bash
playwright-cli run-code "async page => {
  await page.evaluate(() => {
    const h1 = document.querySelector('h1');
    if (h1) {
      const old = h1.innerHTML;
      h1.innerHTML = '<del class=\"seo-redline-del\">' + old + '</del>'
        + '<ins class=\"seo-redline-ins\">Treasure Data CDP | AI-Native Customer Data Platform</ins>';
    }
  });
}"
```

**Pattern B — Replace paragraph (BLUF rewrite):**
```bash
playwright-cli run-code "async page => {
  await page.evaluate(() => {
    const h2s = [...document.querySelectorAll('h2')];
    const target = h2s.find(h => h.textContent.includes('How Does a CDP Work'));
    if (target) {
      const p = target.nextElementSibling;
      if (p && p.tagName === 'P') {
        const old = p.innerHTML;
        p.innerHTML = '<del class=\"seo-redline-del\">' + old + '</del>'
          + '<ins class=\"seo-redline-ins\">A CDP works by collecting first-party customer data from websites, apps, and offline sources, then unifying it into persistent profiles using identity resolution.</ins>';
      }
    }
  });
}"
```

**Pattern C — Add new section (FAQ, content block):**
```bash
playwright-cli run-code "async page => {
  await page.evaluate(() => {
    const main = document.querySelector('main') || document.querySelector('article') || document.body;
    const section = document.createElement('section');
    section.className = 'seo-redline-ins';
    section.innerHTML = '<h2>Frequently Asked Questions</h2>'
      + '<h3>How does a CDP work?</h3><p>A CDP collects first-party data...</p>'
      + '<h3>CDP vs DMP: what is the difference?</h3><p>A CDP uses first-party data...</p>';
    main.appendChild(section);
  });
}"
```

**Pattern D — Replace title tag / meta description:**
```bash
playwright-cli run-code "async page => {
  await page.evaluate(() => {
    const banner = document.createElement('div');
    banner.style.cssText = 'padding:12px 20px;font-size:13px;font-family:monospace;border-bottom:2px solid #c00;background:#fff8f8;';
    banner.innerHTML = '<strong>Title:</strong> <del class=\"seo-redline-del\">' + document.title + '</del> '
      + '<ins class=\"seo-redline-ins\">New Title Here</ins>';
    document.body.prepend(banner);
  });
}"
```

Repeat for **every** recommendation. Apply all changes in sequence — heading, BLUF rewrites, new sections, FAQ, schema notes, internal link additions.

## Step 5: Take full-page screenshot

```bash
playwright-cli screenshot ./seo/redline-{slug}.png --full-page
```

## Step 6: Show to user

```bash
open_file({ path: "./seo/redline-{slug}.png" })
```

The user sees the complete page with actual content changes — deletions in red strikethrough, insertions in green with left border. No annotations, no overlays — just the edited page.
