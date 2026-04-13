// validate.js
// Lightweight HTML validation for PPTX conversion.
// Run via: cat validate.js | agent-browser eval --stdin --json
//
// Returns JSON: { valid: bool, errors: string[] }
// Use this for quick checks before running full extraction.

(() => {
  const PT_PER_PX = 0.75;
  const PX_PER_IN = 96;
  const errors = [];
  const body = document.body;
  const cs = window.getComputedStyle(body);

  // Check body dimensions
  const w = parseFloat(cs.width), h = parseFloat(cs.height);
  const expectedW = 720 / PT_PER_PX; // 960px
  const expectedH = 405 / PT_PER_PX; // 540px
  if (Math.abs(w - expectedW) > 2 || Math.abs(h - expectedH) > 2) {
    errors.push('Body dimensions: ' + (w * PT_PER_PX).toFixed(0) + 'pt x ' + (h * PT_PER_PX).toFixed(0) + 'pt (expected 720pt x 405pt)');
  }

  // Overflow
  if (body.scrollWidth > w + 1) errors.push('Horizontal overflow: ' + ((body.scrollWidth - w) * PT_PER_PX).toFixed(1) + 'pt');
  if (body.scrollHeight > h + 1) errors.push('Vertical overflow: ' + ((body.scrollHeight - h) * PT_PER_PX).toFixed(1) + 'pt');

  // <br> tags
  const brCount = document.querySelectorAll('br').length;
  if (brCount > 0) errors.push(brCount + ' <br> tag(s) found — use separate elements');

  // Unwrapped text in DIVs
  document.querySelectorAll('div').forEach(div => {
    for (const node of div.childNodes) {
      if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
        errors.push('Unwrapped text in <div>: "' + node.textContent.trim().substring(0, 40) + '"');
      }
    }
  });

  // Manual bullet symbols
  document.querySelectorAll('p, h1, h2, h3, h4, h5, h6').forEach(el => {
    const text = el.textContent.trim();
    if (/^[•\-\*▪▸○●◆◇■□]\s/.test(text)) {
      errors.push('Manual bullet in <' + el.tagName.toLowerCase() + '>: "' + text.substring(0, 30) + '" — use <ul>/<ol>');
    }
  });

  // Text elements with backgrounds/borders
  ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li'].forEach(tag => {
    document.querySelectorAll(tag).forEach(el => {
      const s = window.getComputedStyle(el);
      if (s.backgroundColor && s.backgroundColor !== 'rgba(0, 0, 0, 0)') {
        errors.push('<' + tag + '> has background-color — move to parent <div>');
      }
    });
  });

  // Placeholder validation
  document.querySelectorAll('.placeholder').forEach(el => {
    const rect = el.getBoundingClientRect();
    if (!el.id) errors.push('Placeholder missing id attribute');
    if (rect.width === 0 || rect.height === 0) errors.push('Placeholder "' + (el.id || '?') + '" has zero ' + (rect.width === 0 ? 'width' : 'height'));
  });

  // Bottom margin check
  const slideH = h / PX_PER_IN;
  document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, ul, ol').forEach(el => {
    const rect = el.getBoundingClientRect();
    const bottomIn = (rect.top + rect.height) / PX_PER_IN;
    const fontSize = parseFloat(window.getComputedStyle(el).fontSize) * PT_PER_PX;
    if (fontSize > 12 && slideH - bottomIn < 0.5) {
      errors.push('<' + el.tagName.toLowerCase() + '> too close to bottom: ' + (slideH - bottomIn).toFixed(2) + 'in (need 0.5in)');
    }
  });

  // Non-web-safe fonts
  const webSafe = ['arial', 'helvetica', 'times new roman', 'georgia', 'courier new', 'verdana', 'tahoma', 'trebuchet ms', 'impact', 'sans-serif', 'serif', 'monospace'];
  const usedFonts = new Set();
  document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li, pre').forEach(el => {
    const ff = window.getComputedStyle(el).fontFamily.split(',')[0].replace(/['"]/g, '').trim().toLowerCase();
    if (ff && !webSafe.includes(ff)) usedFonts.add(ff);
  });
  if (usedFonts.size > 0) errors.push('Non-web-safe fonts: ' + Array.from(usedFonts).join(', '));

  // Elements beyond bounds
  document.querySelectorAll('div, img').forEach(el => {
    const rect = el.getBoundingClientRect();
    if (rect.left < -1 || rect.top < -1 || rect.right > w + 1 || rect.bottom > h + 1) {
      const tag = el.tagName.toLowerCase();
      const id = el.id ? '#' + el.id : '';
      errors.push('<' + tag + id + '> extends beyond slide bounds');
    }
  });

  return JSON.stringify({ valid: errors.length === 0, errors });
})()
