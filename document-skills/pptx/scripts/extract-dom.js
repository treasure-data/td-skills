// extract-dom.js
// Run via: cat extract-dom.js | agent-browser eval --stdin --json
//
// Returns JSON string with:
//   { background, elements, placeholders, errors }
//
// background: { type: 'color'|'gradient', value?: hex, css?: gradientCSS }
// elements[]: { type, position: {x,y,w,h in inches}, style, text|items|src }
// placeholders[]: { id, x, y, w, h } (inches)
// errors[]: validation error strings

(() => {
  const PT_PER_PX = 0.75;
  const PX_PER_IN = 96;
  const pxToInch = px => px / PX_PER_IN;
  const pxToPoints = s => parseFloat(s) * PT_PER_PX;

  const rgbToHex = rgb => {
    if (rgb === 'rgba(0, 0, 0, 0)' || rgb === 'transparent') return null;
    const m = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    return m ? m.slice(1).map(n => parseInt(n).toString(16).padStart(2, '0')).join('') : null;
  };

  const extractAlpha = rgb => {
    const m = rgb.match(/rgba\([^,]+,[^,]+,[^,]+,\s*([\d.]+)\)/);
    return m ? Math.round((1 - parseFloat(m[1])) * 100) : null;
  };

  const SINGLE_WEIGHT_FONTS = ['impact'];
  const shouldSkipBold = ff => {
    if (!ff) return false;
    return SINGLE_WEIGHT_FONTS.includes(ff.toLowerCase().replace(/['"]/g, '').split(',')[0].trim());
  };

  const getBorderDashType = style => {
    if (style === 'dashed') return 'dash';
    if (style === 'dotted') return 'dot';
    if (style === 'none' || style === 'hidden') return null;
    return 'solid';
  };

  const parseTextShadow = ts => {
    if (!ts || ts === 'none') return null;
    const re = /^(-?\d+(?:\.\d+)?(?:px|pt|em)?)\s+(-?\d+(?:\.\d+)?(?:px|pt|em)?)\s*(-?\d+(?:\.\d+)?(?:px|pt|em)?)?\s*(.*)$/;
    const m = ts.match(re);
    if (!m) return null;
    const hOff = parseFloat(m[1]) || 0;
    const vOff = parseFloat(m[2]) || 0;
    const blur = parseFloat(m[3]) || 0;
    const colorStr = m[4] || 'rgba(0,0,0,0.5)';
    const angle = ((Math.round(Math.atan2(vOff, hOff) * 180 / Math.PI) % 360) + 360) % 360;
    const dist = Math.sqrt(hOff * hOff + vOff * vOff);
    const color = rgbToHex(colorStr);
    const alphaM = colorStr.match(/rgba\([^,]+,[^,]+,[^,]+,\s*([\d.]+)\)/);
    return { type: 'outer', angle, blur: blur * PT_PER_PX, offset: dist * PT_PER_PX, color, opacity: alphaM ? parseFloat(alphaM[1]) : 1 };
  };

  const parseBoxShadow = bs => {
    if (!bs || bs === 'none' || bs.includes('inset')) return null;
    const colorM = bs.match(/rgba?\([^)]+\)/);
    const parts = bs.match(/([-\d.]+)(px|pt)/g);
    if (!parts || parts.length < 2) return null;
    const ox = parseFloat(parts[0]), oy = parseFloat(parts[1]);
    const blur = parts.length > 2 ? parseFloat(parts[2]) : 0;
    let angle = 0;
    if (ox !== 0 || oy !== 0) { angle = Math.atan2(oy, ox) * 180 / Math.PI; if (angle < 0) angle += 360; }
    const offset = Math.sqrt(ox * ox + oy * oy) * PT_PER_PX;
    let opacity = 0.5;
    if (colorM) { const om = colorM[0].match(/[\d.]+\)$/); if (om) opacity = parseFloat(om[0].replace(')', '')); }
    return { type: 'outer', angle: Math.round(angle), blur: blur * PT_PER_PX, color: colorM ? rgbToHex(colorM[0]) : '000000', offset, opacity };
  };

  const applyTextTransform = (text, tt) => {
    if (tt === 'uppercase') return text.toUpperCase();
    if (tt === 'lowercase') return text.toLowerCase();
    if (tt === 'capitalize') return text.replace(/\b\w/g, c => c.toUpperCase());
    return text;
  };

  const getRotation = (transform, writingMode) => {
    let angle = 0;
    if (writingMode === 'vertical-rl') angle = 90;
    else if (writingMode === 'vertical-lr') angle = 270;
    if (transform && transform !== 'none') {
      const rm = transform.match(/rotate\((-?\d+(?:\.\d+)?)deg\)/);
      if (rm) angle += parseFloat(rm[1]);
      else {
        const mm = transform.match(/matrix\(([^)]+)\)/);
        if (mm) { const v = mm[1].split(',').map(parseFloat); angle += Math.round(Math.atan2(v[1], v[0]) * 180 / Math.PI); }
      }
    }
    angle = angle % 360;
    if (angle < 0) angle += 360;
    return angle === 0 ? null : angle;
  };

  const getPositionAndSize = (el, rect, rotation) => {
    if (rotation === null) return { x: rect.left, y: rect.top, w: rect.width, h: rect.height };
    const isVertical = rotation === 90 || rotation === 270;
    if (isVertical) {
      const cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2;
      return { x: cx - rect.height / 2, y: cy - rect.width / 2, w: rect.height, h: rect.width };
    }
    const cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2;
    return { x: cx - el.offsetWidth / 2, y: cy - el.offsetHeight / 2, w: el.offsetWidth, h: el.offsetHeight };
  };

  const parseInlineFormatting = (element, baseOptions = {}) => {
    const runs = [];
    element.childNodes.forEach(node => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent.replace(/\s+/g, ' ');
        runs.push({ text, options: { ...baseOptions } });
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        let text = node.textContent.trim();
        if (text) {
          const options = { ...baseOptions };
          const cs = window.getComputedStyle(node);
          if ((node.tagName === 'B' || node.tagName === 'STRONG') && !shouldSkipBold(cs.fontFamily)) options.bold = true;
          if (node.tagName === 'I' || node.tagName === 'EM') options.italic = true;
          if (node.tagName === 'U') options.underline = true;
          if (['SPAN','B','STRONG','I','EM','U'].includes(node.tagName)) {
            if ((cs.fontWeight === 'bold' || parseInt(cs.fontWeight) >= 600) && !shouldSkipBold(cs.fontFamily)) options.bold = true;
            if (cs.fontStyle === 'italic') options.italic = true;
            if (cs.textDecoration && cs.textDecoration.includes('underline')) options.underline = true;
            if (cs.color && cs.color !== 'rgb(0, 0, 0)') { options.color = rgbToHex(cs.color); const t = extractAlpha(cs.color); if (t !== null) options.transparency = t; }
            if (cs.fontSize) options.fontSize = pxToPoints(cs.fontSize);
            if (cs.textTransform && cs.textTransform !== 'none') text = applyTextTransform(text, cs.textTransform);
          }
          runs.push({ text, options });
        }
      }
    });
    if (runs.length > 0) { runs[0].text = runs[0].text.replace(/^\s+/, ''); runs[runs.length - 1].text = runs[runs.length - 1].text.replace(/\s+$/, ''); }
    return runs.filter(r => r.text.length > 0);
  };

  // --- Main extraction ---
  const body = document.body;
  const bodyStyle = window.getComputedStyle(body);
  const errors = [];

  // Overflow check
  const bw = parseFloat(bodyStyle.width), bh = parseFloat(bodyStyle.height);
  const owX = Math.max(0, body.scrollWidth - bw - 1), owY = Math.max(0, body.scrollHeight - bh - 1);
  if (owX > 0) errors.push('Horizontal overflow: ' + (owX * PT_PER_PX).toFixed(1) + 'pt');
  if (owY > 0) errors.push('Vertical overflow: ' + (owY * PT_PER_PX).toFixed(1) + 'pt (leave 0.5in bottom margin)');

  // <br> check
  if (document.querySelectorAll('br').length > 0) errors.push('<br> tags found — use separate <p>/<li> elements');

  // Background
  const bgImage = bodyStyle.backgroundImage;
  const hasGradient = bgImage && (bgImage.includes('linear-gradient') || bgImage.includes('radial-gradient'));
  const background = hasGradient
    ? { type: 'gradient', css: bgImage }
    : { type: 'color', value: rgbToHex(bodyStyle.backgroundColor) || 'FFFFFF' };

  // Elements
  const elements = [];
  const placeholders = [];
  const textTags = ['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'UL', 'OL', 'LI', 'PRE'];
  const processed = new Set();

  document.querySelectorAll('div, p, h1, h2, h3, h4, h5, h6, ul, ol, li, pre, img, .placeholder').forEach(el => {
    if (processed.has(el)) return;

    // Validate: text elements must not have bg/border/shadow (except PRE)
    if (textTags.includes(el.tagName) && el.tagName !== 'PRE') {
      const cs = window.getComputedStyle(el);
      const hasBg = cs.backgroundColor && cs.backgroundColor !== 'rgba(0, 0, 0, 0)';
      const hasBorder = ['borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth'].some(p => parseFloat(cs[p]) > 0);
      const hasShadow = cs.boxShadow && cs.boxShadow !== 'none';
      if (hasBg || hasBorder || hasShadow) {
        errors.push('<' + el.tagName.toLowerCase() + '> has ' + (hasBg ? 'background' : hasBorder ? 'border' : 'shadow') + ' — only <div> supports these');
        return;
      }
    }

    // Placeholders
    if (el.classList && el.classList.contains('placeholder')) {
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) { errors.push('Placeholder "' + (el.id || 'unnamed') + '" has zero size'); }
      else { placeholders.push({ id: el.id || 'placeholder-' + placeholders.length, x: pxToInch(rect.left), y: pxToInch(rect.top), w: pxToInch(rect.width), h: pxToInch(rect.height) }); }
      processed.add(el);
      return;
    }

    // Images
    if (el.tagName === 'IMG') {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        elements.push({ type: 'image', src: el.src, position: { x: pxToInch(rect.left), y: pxToInch(rect.top), w: pxToInch(rect.width), h: pxToInch(rect.height) } });
        processed.add(el);
      }
      return;
    }

    // DIVs → shapes
    if (el.tagName === 'DIV') {
      const cs = window.getComputedStyle(el);
      const hasBg = cs.backgroundColor && cs.backgroundColor !== 'rgba(0, 0, 0, 0)';
      const borders = ['borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth'].map(p => parseFloat(cs[p]) || 0);
      const hasBorder = borders.some(b => b > 0);
      const hasUniformBorder = hasBorder && borders.every(b => b === borders[0]);
      const divBg = cs.backgroundImage;
      const divGradient = divBg && (divBg.includes('linear-gradient') || divBg.includes('radial-gradient'));

      // Validate: unwrapped text in div
      for (const node of el.childNodes) {
        if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
          errors.push('DIV contains unwrapped text "' + node.textContent.trim().substring(0, 50) + '" — wrap in <p>/<h1>-<h6>');
        }
      }

      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      if (divGradient) {
        elements.push({
          type: 'gradientDiv', elementId: el.id || 'gradient-' + elements.length, css: divBg,
          position: { x: pxToInch(rect.left), y: pxToInch(rect.top), w: pxToInch(rect.width), h: pxToInch(rect.height) }
        });
      }

      if (hasBg || hasBorder) {
        const shadow = parseBoxShadow(cs.boxShadow);
        const radiusVal = parseFloat(cs.borderRadius);
        if (hasBg || hasUniformBorder) {
          elements.push({
            type: 'shape',
            position: { x: pxToInch(rect.left), y: pxToInch(rect.top), w: pxToInch(rect.width), h: pxToInch(rect.height) },
            fill: hasBg ? rgbToHex(cs.backgroundColor) : null,
            transparency: hasBg ? extractAlpha(cs.backgroundColor) : null,
            line: hasUniformBorder ? { color: rgbToHex(cs.borderColor), width: pxToPoints(cs.borderWidth), dashType: getBorderDashType(cs.borderStyle) } : null,
            rectRadius: radiusVal > 0 ? (cs.borderRadius.includes('%') ? (radiusVal >= 50 ? 1 : radiusVal / 100 * pxToInch(Math.min(rect.width, rect.height))) : radiusVal / PX_PER_IN) : 0,
            shadow
          });
        }

        // Partial borders → individual lines
        if (hasBorder && !hasUniformBorder) {
          const x = pxToInch(rect.left), y = pxToInch(rect.top), w = pxToInch(rect.width), h = pxToInch(rect.height);
          if (borders[0] > 0) elements.push({ type: 'line', x1: x, y1: y, x2: x + w, y2: y, width: pxToPoints(cs.borderTopWidth + 'px'), color: rgbToHex(cs.borderTopColor) });
          if (borders[1] > 0) elements.push({ type: 'line', x1: x + w, y1: y, x2: x + w, y2: y + h, width: pxToPoints(cs.borderRightWidth + 'px'), color: rgbToHex(cs.borderRightColor) });
          if (borders[2] > 0) elements.push({ type: 'line', x1: x, y1: y + h, x2: x + w, y2: y + h, width: pxToPoints(cs.borderBottomWidth + 'px'), color: rgbToHex(cs.borderBottomColor) });
          if (borders[3] > 0) elements.push({ type: 'line', x1: x, y1: y, x2: x, y2: y + h, width: pxToPoints(cs.borderLeftWidth + 'px'), color: rgbToHex(cs.borderLeftColor) });
        }

        processed.add(el);
        return;
      }
    }

    // Lists (UL/OL)
    if (el.tagName === 'UL' || el.tagName === 'OL') {
      if (el.parentElement && el.parentElement.tagName === 'LI') { processed.add(el); return; }
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      const ulCs = window.getComputedStyle(el);
      const textIndent = pxToPoints(ulCs.paddingLeft) * 0.5;
      const items = [];

      const processItems = (listEl, level) => {
        const lis = Array.from(listEl.children).filter(c => c.tagName === 'LI');
        lis.forEach((li, idx) => {
          const isLast = idx === lis.length - 1;
          let text = '';
          for (const node of li.childNodes) {
            if (node.nodeType === Node.TEXT_NODE) text += node.textContent;
            else if (node.nodeType === Node.ELEMENT_NODE && !['UL', 'OL'].includes(node.tagName)) text += node.textContent;
          }
          text = text.trim().replace(/^[•\-\*▪▸]\s*/, '');
          const nested = Array.from(li.children).find(c => c.tagName === 'UL' || c.tagName === 'OL');

          // Check for inline formatting
          const hasFormatting = Array.from(li.children).some(c => ['B', 'I', 'U', 'STRONG', 'EM', 'SPAN'].includes(c.tagName));
          if (hasFormatting && text) {
            const tempDiv = document.createElement('div');
            for (const node of li.childNodes) {
              if (node.nodeType === Node.TEXT_NODE) tempDiv.appendChild(node.cloneNode());
              else if (node.nodeType === Node.ELEMENT_NODE && !['UL', 'OL'].includes(node.tagName)) tempDiv.appendChild(node.cloneNode(true));
            }
            const runs = parseInlineFormatting(tempDiv, { breakLine: false });
            if (runs.length > 0) {
              runs[0].text = runs[0].text.replace(/^[•\-\*▪▸]\s*/, '');
              runs[0].options.bullet = { indent: textIndent };
              runs[0].options.indentLevel = level;
              runs[runs.length - 1].options.breakLine = !!nested || !isLast;
            }
            items.push(...runs);
          } else if (text) {
            items.push({ text, options: { bullet: { indent: textIndent }, indentLevel: level, breakLine: !!nested || !isLast } });
          }

          if (nested) { processed.add(nested); processItems(nested, level + 1); }
          processed.add(li);
        });
      };
      processItems(el, 0);

      const firstLi = el.querySelector('li');
      const liCs = window.getComputedStyle(firstLi || el);
      elements.push({
        type: 'list', items,
        position: { x: pxToInch(rect.left), y: pxToInch(rect.top), w: pxToInch(rect.width), h: pxToInch(rect.height) },
        style: {
          fontSize: pxToPoints(liCs.fontSize),
          fontFace: liCs.fontFamily.split(',')[0].replace(/['"]/g, '').trim(),
          color: rgbToHex(liCs.color), transparency: extractAlpha(liCs.color),
          align: liCs.textAlign === 'start' ? 'left' : liCs.textAlign,
          lineSpacing: liCs.lineHeight !== 'normal' ? pxToPoints(liCs.lineHeight) : null,
          paraSpaceBefore: 0, paraSpaceAfter: pxToPoints(liCs.marginBottom),
          margin: [textIndent * 0.5, 0, 0, 0]
        }
      });
      processed.add(el);
      return;
    }

    // PRE (code blocks)
    if (el.tagName === 'PRE') {
      const rect = el.getBoundingClientRect();
      const text = el.textContent;
      if (rect.width === 0 || rect.height === 0 || !text) return;
      const cs = window.getComputedStyle(el);
      const hasBg = cs.backgroundColor && cs.backgroundColor !== 'rgba(0, 0, 0, 0)';
      const hasBorder = parseFloat(cs.borderWidth) > 0;

      if (hasBg || hasBorder) {
        elements.push({
          type: 'shape', text: '',
          position: { x: pxToInch(rect.left), y: pxToInch(rect.top), w: pxToInch(rect.width), h: pxToInch(rect.height) },
          fill: hasBg ? rgbToHex(cs.backgroundColor) : null, transparency: hasBg ? extractAlpha(cs.backgroundColor) : null,
          line: hasBorder ? { color: rgbToHex(cs.borderColor), width: pxToPoints(cs.borderWidth), dashType: getBorderDashType(cs.borderStyle) } : null,
          rectRadius: parseFloat(cs.borderRadius) > 0 ? parseFloat(cs.borderRadius) / PX_PER_IN : 0,
          shadow: parseBoxShadow(cs.boxShadow)
        });
      }

      const style = {
        fontSize: pxToPoints(cs.fontSize), fontFace: 'Courier New', color: rgbToHex(cs.color),
        align: 'left', lineSpacing: pxToPoints(cs.lineHeight), paraSpaceBefore: 0, paraSpaceAfter: 0,
        margin: [pxToPoints(cs.paddingLeft), pxToPoints(cs.paddingRight), pxToPoints(cs.paddingBottom), pxToPoints(cs.paddingTop)]
      };
      const tr = extractAlpha(cs.color); if (tr !== null) style.transparency = tr;
      const ts = parseTextShadow(cs.textShadow); if (ts) style.shadow = ts;

      elements.push({ type: 'pre', text, position: { x: pxToInch(rect.left), y: pxToInch(rect.top), w: pxToInch(rect.width), h: pxToInch(rect.height) }, style });
      processed.add(el);
      return;
    }

    // Text elements (P, H1-H6)
    if (!textTags.includes(el.tagName)) return;
    const rect = el.getBoundingClientRect();
    const text = el.textContent.trim();
    if (rect.width === 0 || rect.height === 0 || !text) return;

    // Validate manual bullets
    if (el.tagName !== 'LI' && /^[•\-\*▪▸○●◆◇■□]\s/.test(text.trimStart())) {
      errors.push('<' + el.tagName.toLowerCase() + '> has manual bullet "' + text.substring(0, 20) + '..." — use <ul>/<ol>');
      return;
    }

    const cs = window.getComputedStyle(el);
    const rotation = getRotation(cs.transform, cs.writingMode);
    const pos = getPositionAndSize(el, rect, rotation);

    const baseStyle = {
      fontSize: pxToPoints(cs.fontSize),
      fontFace: cs.fontFamily.split(',')[0].replace(/['"]/g, '').trim(),
      color: rgbToHex(cs.color),
      align: cs.textAlign === 'start' ? 'left' : cs.textAlign,
      lineSpacing: pxToPoints(cs.lineHeight),
      paraSpaceBefore: pxToPoints(cs.marginTop),
      paraSpaceAfter: pxToPoints(cs.marginBottom),
      margin: [pxToPoints(cs.paddingLeft), pxToPoints(cs.paddingRight), pxToPoints(cs.paddingBottom), pxToPoints(cs.paddingTop)]
    };
    const tr = extractAlpha(cs.color); if (tr !== null) baseStyle.transparency = tr;
    if (rotation !== null) baseStyle.rotate = rotation;
    const ts = parseTextShadow(cs.textShadow); if (ts) baseStyle.shadow = ts;

    const hasFormatting = el.querySelector('b, i, u, strong, em, span');
    if (hasFormatting) {
      const runs = parseInlineFormatting(el);
      const adjustedStyle = { ...baseStyle };
      if (adjustedStyle.lineSpacing) {
        const maxFs = Math.max(adjustedStyle.fontSize, ...runs.map(r => r.options?.fontSize || 0));
        if (maxFs > adjustedStyle.fontSize) adjustedStyle.lineSpacing = maxFs * (adjustedStyle.lineSpacing / adjustedStyle.fontSize);
      }
      const tt = cs.textTransform;
      const transformed = runs.map(r => ({ ...r, text: applyTextTransform(r.text, tt) }));
      elements.push({ type: el.tagName.toLowerCase(), text: transformed, position: { x: pxToInch(pos.x), y: pxToInch(pos.y), w: pxToInch(pos.w), h: pxToInch(pos.h) }, style: adjustedStyle });
    } else {
      const isBold = cs.fontWeight === 'bold' || parseInt(cs.fontWeight) >= 600;
      elements.push({
        type: el.tagName.toLowerCase(), text: applyTextTransform(text, cs.textTransform),
        position: { x: pxToInch(pos.x), y: pxToInch(pos.y), w: pxToInch(pos.w), h: pxToInch(pos.h) },
        style: { ...baseStyle, bold: isBold && !shouldSkipBold(cs.fontFamily), italic: cs.fontStyle === 'italic', underline: cs.textDecoration.includes('underline') }
      });
    }
    processed.add(el);
  });

  // Bottom margin validation
  const slideHeightIn = bh / PX_PER_IN;
  for (const el of elements) {
    if (['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'list'].includes(el.type)) {
      const bottom = el.position.y + el.position.h;
      if (slideHeightIn - bottom < 0.5 && (el.style?.fontSize || 0) > 12) {
        const preview = typeof el.text === 'string' ? el.text.substring(0, 50) : '(list)';
        errors.push('Text "' + preview + '" too close to bottom (' + (slideHeightIn - bottom).toFixed(2) + 'in, need 0.5in)');
      }
    }
  }

  return JSON.stringify({ background, elements, placeholders, errors });
})()
