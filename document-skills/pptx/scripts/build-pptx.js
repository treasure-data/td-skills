#!/usr/bin/env node
// build-pptx.js
// Assemble PPTX from extracted DOM data.
//
// Usage: node build-pptx.js <config.json> [output.pptx]
//
// config.json format:
// {
//   "slides": [
//     {
//       "extracted": { "background": {...}, "elements": [...], "placeholders": [...] },
//       "bgImagePath": "./tmp/slides/{title}/slide-0-bg.png",  // optional, for gradient backgrounds
//       "placeholders": [                                // optional, placeholder content definitions
//         { "id": "chart1", "type": "chart", "chartType": "bar", "chartData": {...} },
//         { "id": "table1", "type": "table", "tableData": {...} },
//         { "id": "image1", "type": "image", "imageData": { "url": "...", "alt": "..." } }
//       ]
//     }
//   ]
// }

const fs = require('fs');
const path = require('path');

async function main() {
  const configPath = process.argv[2];
  const outputPath = process.argv[3] || './output.pptx';

  if (!configPath) {
    console.error('Usage: node build-pptx.js <config.json> [output.pptx]');
    process.exit(1);
  }

  // Dynamic imports for ESM packages
  const PptxGenJS = require('pptxgenjs');
  let sharp;
  try { sharp = require('sharp'); } catch { sharp = null; }

  const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_16x9';

  for (let i = 0; i < config.slides.length; i++) {
    const slideConfig = config.slides[i];
    const { extracted, bgImagePath, placeholders: pDefs } = slideConfig;
    const slide = pptx.addSlide();

    // --- Background ---
    if (bgImagePath && fs.existsSync(bgImagePath)) {
      slide.background = { path: path.resolve(bgImagePath) };
    } else if (extracted.background.type === 'color') {
      slide.background = { color: extracted.background.value };
    }
    // gradient without bgImagePath: caller must rasterize first

    // --- Elements ---
    for (const el of extracted.elements) {
      const pos = el.position;

      // Gradient divs (rasterized images)
      if (el.type === 'gradientDiv') {
        if (el.rasterizedPath && fs.existsSync(el.rasterizedPath)) {
          slide.addImage({ path: path.resolve(el.rasterizedPath), x: pos.x, y: pos.y, w: pos.w, h: pos.h });
        }
        continue;
      }

      // Lines (partial borders)
      if (el.type === 'line') {
        slide.addShape(pptx.ShapeType.line, {
          x: el.x1, y: el.y1, w: el.x2 - el.x1, h: el.y2 - el.y1,
          line: { color: el.color, width: el.width }
        });
        continue;
      }

      // Images
      if (el.type === 'image') {
        const imgPath = el.src.startsWith('file://') ? el.src.replace('file://', '') : el.src;
        try {
          slide.addImage({ path: imgPath, x: pos.x, y: pos.y, w: pos.w, h: pos.h });
        } catch (e) { console.error(`Failed to add image: ${e.message}`); }
        continue;
      }

      // Shapes (div backgrounds/borders)
      if (el.type === 'shape') {
        const opts = { x: pos.x, y: pos.y, w: pos.w, h: pos.h };
        if (el.rectRadius > 0) opts.shape = pptx.ShapeType.roundRect;
        if (el.fill) {
          opts.fill = { color: el.fill };
          if (el.transparency != null) opts.fill.transparency = el.transparency;
        }
        if (el.line) opts.line = el.line;
        if (el.rectRadius > 0) opts.rectRadius = el.rectRadius;
        if (el.shadow) opts.shadow = el.shadow;
        slide.addText(el.text || '', opts);
        continue;
      }

      // Lists
      if (el.type === 'list') {
        const s = el.style;
        slide.addText(el.items, {
          x: pos.x, y: pos.y, w: pos.w, h: pos.h,
          fontSize: s.fontSize, fontFace: s.fontFace, color: s.color,
          align: s.align, valign: 'top',
          lineSpacing: s.lineSpacing,
          paraSpaceBefore: s.paraSpaceBefore, paraSpaceAfter: s.paraSpaceAfter,
          margin: s.margin
        });
        continue;
      }

      // Code blocks (PRE)
      if (el.type === 'pre') {
        const s = el.style;
        const opts = {
          x: pos.x, y: pos.y, w: pos.w, h: pos.h,
          fontSize: s.fontSize, fontFace: s.fontFace, color: s.color,
          align: s.align, valign: 'top',
          lineSpacing: s.lineSpacing,
          paraSpaceBefore: s.paraSpaceBefore, paraSpaceAfter: s.paraSpaceAfter,
          margin: s.margin, inset: 0
        };
        if (s.transparency != null) opts.transparency = s.transparency;
        if (s.shadow) opts.shadow = s.shadow;
        slide.addText(el.text, opts);
        continue;
      }

      // Text elements (p, h1-h6)
      const s = el.style;
      // Single-line width adjustment
      const lineH = s.lineSpacing || s.fontSize * 1.2;
      const isSingleLine = pos.h <= (lineH * 1.5) / 72;
      let adjX = pos.x, adjW = pos.w;
      if (isSingleLine) {
        const inc = pos.w * 0.02;
        if (s.align === 'center') { adjX -= inc / 2; adjW += inc; }
        else if (s.align === 'right') { adjX -= inc; adjW += inc; }
        else { adjW += inc; }
      }

      const opts = {
        x: adjX, y: pos.y, w: adjW, h: pos.h,
        fontSize: s.fontSize, fontFace: s.fontFace || 'Arial', color: s.color,
        bold: s.bold, italic: s.italic, underline: s.underline,
        valign: 'top',
        lineSpacing: s.lineSpacing,
        paraSpaceBefore: s.paraSpaceBefore, paraSpaceAfter: s.paraSpaceAfter,
        inset: 0
      };
      if (s.align) opts.align = s.align;
      if (s.margin) opts.margin = s.margin;
      if (s.rotate != null) opts.rotate = s.rotate;
      if (s.transparency != null) opts.transparency = s.transparency;
      if (s.shadow) opts.shadow = s.shadow;

      slide.addText(el.text, opts);
    }

    // --- Placeholders ---
    for (const pDef of pDefs || []) {
      const pos = extracted.placeholders.find(p => p.id === pDef.id);
      if (!pos) { console.warn(`No position for placeholder "${pDef.id}"`); continue; }
      await addPlaceholder(slide, pptx, pDef, pos, sharp);
    }
  }

  // Write output
  const outputDir = path.dirname(outputPath);
  fs.mkdirSync(outputDir, { recursive: true });

  const buffer = await pptx.write({ outputType: 'nodebuffer' });
  fs.writeFileSync(outputPath, buffer);
  console.log(`PPTX saved: ${outputPath} (${config.slides.length} slides)`);
}

async function addPlaceholder(slide, pptx, def, pos, sharp) {
  const { x, y, w, h } = pos;

  if (def.type === 'chart' && def.chartData) {
    const chartTypeMap = {
      bar: pptx.ChartType.bar, line: pptx.ChartType.line, pie: pptx.ChartType.pie,
      doughnut: pptx.ChartType.doughnut, scatter: pptx.ChartType.scatter
    };
    const chartData = def.chartData.series.map(s => ({ name: s.name, labels: s.labels, values: s.values }));
    const opts = {
      x, y, w, h,
      showTitle: !!def.chartData.options?.title,
      title: def.chartData.options?.title || '',
      showLegend: def.chartData.options?.showLegend ?? true,
      showCatAxisTitle: !!def.chartData.options?.categoryAxisTitle,
      catAxisTitle: def.chartData.options?.categoryAxisTitle || '',
      showValAxisTitle: !!def.chartData.options?.valueAxisTitle,
      valAxisTitle: def.chartData.options?.valueAxisTitle || ''
    };
    if (def.chartData.options?.colors) opts.chartColors = def.chartData.options.colors;
    slide.addChart(chartTypeMap[def.chartType] || pptx.ChartType.bar, chartData, opts);
  }

  else if (def.type === 'table' && def.tableData) {
    const rows = [];
    rows.push(def.tableData.headers.map(header => ({
      text: header,
      options: {
        bold: true,
        fill: { color: def.tableData.options?.headerBackground || '4472C4' },
        color: def.tableData.options?.headerColor || 'FFFFFF'
      }
    })));
    for (const row of def.tableData.rows) {
      rows.push(row.map(cell => ({ text: cell })));
    }
    slide.addTable(rows, { x, y, w, border: { pt: 1, color: 'CCCCCC' }, fontFace: 'Arial', fontSize: 12 });
  }

  else if (def.type === 'image' && def.imageData) {
    try {
      const resp = await fetch(def.imageData.url);
      const buf = Buffer.from(await resp.arrayBuffer());

      if (sharp) {
        const meta = await sharp(buf).metadata();
        if (meta.width && meta.height) {
          const imgAsp = meta.width / meta.height;
          const contAsp = w / h;
          let fx, fy, fw, fh;
          if (imgAsp > contAsp) { fw = w; fh = w / imgAsp; fx = x; fy = y + (h - fh) / 2; }
          else { fh = h; fw = h * imgAsp; fx = x + (w - fw) / 2; fy = y; }
          const mime = meta.format === 'png' ? 'image/png' : 'image/jpeg';
          slide.addImage({ data: `data:${mime};base64,${buf.toString('base64')}`, x: fx, y: fy, w: fw, h: fh });
          return;
        }
      }
      // Fallback without sharp
      slide.addImage({ data: `data:image/jpeg;base64,${buf.toString('base64')}`, x, y, w, h });
    } catch (e) {
      console.error(`Failed to add image "${def.id}": ${e.message}`);
    }
  }
}

main().catch(e => { console.error(e); process.exit(1); });
