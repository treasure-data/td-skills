// render-placeholders.js
// Render chart/table/image content into placeholder divs for visual preview.
// Run via: cat render-placeholders.js | agent-browser eval --stdin --json
//
// Prerequisites (run before this script):
//   1. Set placeholder data:
//      agent-browser eval "window.__PLACEHOLDERS__ = <JSON array>"
//   2. Inject Chart.js CDN:
//      agent-browser eval "var s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js';document.head.appendChild(s)"
//   3. Wait for Chart.js to load:
//      agent-browser wait 2000
//
// Returns JSON: { rendered: number, errors: string[] }

(() => {
  const placeholders = window.__PLACEHOLDERS__;
  if (!placeholders || !Array.isArray(placeholders)) {
    return JSON.stringify({ rendered: 0, errors: ['window.__PLACEHOLDERS__ not set or not an array'] });
  }

  const errors = [];
  let rendered = 0;

  for (const p of placeholders) {
    const el = document.getElementById(p.id);
    if (!el) {
      errors.push('Element #' + p.id + ' not found');
      continue;
    }

    try {
      if (p.type === 'chart' && p.chartData) {
        renderChart(el, p);
        rendered++;
      } else if (p.type === 'table' && p.tableData) {
        renderTable(el, p);
        rendered++;
      } else if (p.type === 'image' && p.imageData) {
        renderImage(el, p);
        rendered++;
      }
    } catch (e) {
      errors.push(p.id + ': ' + (e.message || String(e)));
    }
  }

  return JSON.stringify({ rendered, errors });

  function renderChart(el, p) {
    const Chart = window.Chart;
    if (!Chart) {
      errors.push('Chart.js not loaded — did you inject the CDN and wait?');
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    el.innerHTML = '';
    el.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const chartData = p.chartData;
    const typeMap = { bar: 'bar', line: 'line', pie: 'pie', doughnut: 'doughnut', scatter: 'scatter' };
    const labels = chartData.series[0] ? chartData.series[0].labels : [];
    const datasets = chartData.series.map((series, i) => {
      const ds = { label: series.name, data: series.values };
      if (chartData.options && chartData.options.colors && chartData.options.colors[i]) {
        ds.backgroundColor = '#' + chartData.options.colors[i];
        ds.borderColor = '#' + chartData.options.colors[i];
      }
      return ds;
    });

    new Chart(ctx, {
      type: typeMap[p.chartType || 'bar'] || 'bar',
      data: { labels: labels, datasets: datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        plugins: {
          title: {
            display: !!(chartData.options && chartData.options.title),
            text: (chartData.options && chartData.options.title) || ''
          },
          legend: {
            display: chartData.options ? (chartData.options.showLegend !== false) : true
          }
        }
      }
    });
  }

  function renderTable(el, p) {
    const td = p.tableData;
    const headerBg = (td.options && td.options.headerBackground) || '4472C4';
    const headerColor = (td.options && td.options.headerColor) || 'FFFFFF';
    const altRows = td.options && td.options.alternateRowColors;

    let html = '<table style="width:100%;border-collapse:collapse;font-family:Arial,sans-serif;font-size:12px;">';

    // Header
    html += '<thead><tr style="background:#' + headerBg + ';color:#' + headerColor + ';">';
    td.headers.forEach(function(h) {
      html += '<th style="padding:8px;border:1px solid #ccc;text-align:left;">' + h + '</th>';
    });
    html += '</tr></thead><tbody>';

    // Rows
    td.rows.forEach(function(row, i) {
      const bg = altRows && i % 2 === 1 ? '#f5f5f5' : '#ffffff';
      html += '<tr style="background:' + bg + ';">';
      row.forEach(function(cell) {
        html += '<td style="padding:8px;border:1px solid #ccc;">' + cell + '</td>';
      });
      html += '</tr>';
    });
    html += '</tbody></table>';

    el.innerHTML = html;
  }

  function renderImage(el, p) {
    const img = document.createElement('img');
    img.src = p.imageData.url;
    img.alt = p.imageData.alt || '';
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.objectFit = 'contain';
    el.innerHTML = '';
    el.appendChild(img);
  }
})()
