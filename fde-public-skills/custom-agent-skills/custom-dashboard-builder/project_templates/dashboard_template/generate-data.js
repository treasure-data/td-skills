#!/usr/bin/env node
'use strict';
/**
 * Dashboard data builder (HTML Client).
 *
 * Runs the dashboard queries against Treasure Data in parallel (tdx), checks every result, and writes a
 * single self-contained dashboard.html: the template + vendored Chart.js + `var RAW = {...}`.
 * Query results never pass through the chat — this script is the only path from TD to the HTML.
 *
 * Run from the Work Folder root:   node <dir>/generate-data.js
 * Overrides (all optional):        SOURCE_DB, SINK_DB, DASHBOARD_TEMPLATE, DASHBOARD_OUTPUT, DASHBOARD_CHARTJS
 *
 * The project copy is edited in three places only: CONFIG, QUERIES and LAYOUT (see dashboard.template.html
 * for the RAW / LAYOUT contract). Everything below them is the shared engine — leave it unchanged.
 */
const { execFile } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

// ── CONFIG (project values — no placeholders may remain) ──────────────────────────────────────────
const CONFIG = {
  title: 'Dashboard title',
  subtitle: 'What this dashboard shows',
  timezone: 'UTC',
  currency: '$',
  databases: {
    source: process.env.SOURCE_DB || '<source_database>',
    sink: process.env.SINK_DB || process.env.SOURCE_DB || '<sink_database>', // = source on the direct path
  },
};

// ── QUERIES ───────────────────────────────────────────────────────────────────────────────────────
// name → { db: 'source' | 'sink', sql, limit, columns: [required columns], numeric: [columns to coerce] }
// Every query is aggregated (never raw events), selects only the columns the layout reads, applies the
// confirmed exclusions, and has a LIMIT above the expected row count — reaching it fails the build.
// `meta` is required: data_start / data_end as ISO date strings.
const QUERIES = {
  meta: {
    db: 'source', limit: 1, columns: ['data_start', 'data_end'], numeric: [],
    sql: `SELECT TD_TIME_FORMAT(MIN(time), 'yyyy-MM-dd', 'UTC') AS data_start,
                 TD_TIME_FORMAT(MAX(time), 'yyyy-MM-dd', 'UTC') AS data_end
          FROM <table>`,
  },
  daily: {
    db: 'source', limit: 50000, columns: ['date', 'region', 'orders', 'revenue'], numeric: ['orders', 'revenue'],
    sql: `SELECT TD_TIME_FORMAT(time, 'yyyy-MM-dd', 'UTC') AS date, COALESCE(region, 'Unknown') AS region,
                 COUNT(order_id) AS orders, SUM(amount) AS revenue
          FROM <table>
          WHERE TD_TIME_RANGE(time, '2024-01-01', NULL, 'UTC') AND status <> 'cancelled'
          GROUP BY 1, 2`,
  },
};

// ── LAYOUT (tabs, KPIs, charts, tables, filters — contract in dashboard.template.html) ───────────────
const LAYOUT = {
  date_field: 'date',
  filters: [{ key: 'region', label: 'Region', field: 'region', scope: 'global' }],
  tabs: [{
    id: 'overview', label: 'Overview',
    kpis: [
      { label: 'Revenue', dataset: 'daily', agg: 'sum', field: 'revenue', format: 'currency', info: 'SUM(amount), cancelled orders excluded' },
      { label: 'Orders', dataset: 'daily', agg: 'sum', field: 'orders', format: 'number', info: 'COUNT(order_id), cancelled orders excluded' },
      { label: 'Avg order value', dataset: 'daily', agg: 'ratio', num: 'revenue', den: 'orders', format: 'currency', info: 'Revenue / Orders' },
    ],
    charts: [
      { type: 'line', title: 'Revenue by day', dataset: 'daily', x: 'date', series: [{ label: 'Revenue', agg: 'sum', field: 'revenue' }] },
      { type: 'hbar', title: 'Revenue by region', dataset: 'daily', x: 'region', top: 10, series: [{ label: 'Revenue', agg: 'sum', field: 'revenue' }] },
    ],
    tables: [],
  }],
};

// ── ENGINE (shared — do not edit in project copies) ──────────────────────────────────────────────
const TEMPLATE = process.env.DASHBOARD_TEMPLATE || path.join(__dirname, 'dashboard.template.html');
const OUTPUT = process.env.DASHBOARD_OUTPUT || path.join(__dirname, 'dashboard.html');
const CHARTJS = process.env.DASHBOARD_CHARTJS || path.join(__dirname, 'chart.umd.min.js');
const MAX_BYTES = 2 * 1024 * 1024; // RAW hard stop; < 500 KB is the target

function fail(msg) { console.error('ERROR: ' + msg); process.exit(1); }

function checkConfig() {
  const text = JSON.stringify({ CONFIG, QUERIES });
  const left = text.match(/<(source_database|sink_database|table)>/g);
  if (left) fail('placeholders left in CONFIG/QUERIES: ' + [...new Set(left)].join(', '));
}

function runQuery(name, q) {
  const db = CONFIG.databases[q.db];
  if (!db) return Promise.reject(new Error(`${name}: unknown db '${q.db}'`));
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dash-'));
  const sqlFile = path.join(dir, 'q.sql'), outFile = path.join(dir, 'out.json');
  const sql = /\blimit\s+\d+\s*$/i.test(q.sql.trim()) ? q.sql : `${q.sql.trim()}\nLIMIT ${q.limit}`;
  fs.writeFileSync(sqlFile, sql);
  const started = Date.now();
  return new Promise((resolve, reject) => {
    execFile('tdx', ['--json', 'query', '-d', db, '-f', sqlFile, '--output', outFile],
      { maxBuffer: 64 * 1024 * 1024, timeout: 300000 }, (err, _stdout, stderr) => {
        try {
          if (err) throw new Error(`${name}: tdx failed — ${String(stderr || err.message).split('\n').slice(-3).join(' ').trim()}`);
          const rows = JSON.parse(fs.readFileSync(outFile, 'utf8'));
          if (!Array.isArray(rows)) throw new Error(`${name}: unexpected output`);
          if (rows.length >= q.limit) throw new Error(`${name}: ${rows.length} rows reached LIMIT ${q.limit} — results would be truncated; aggregate further or raise the limit`);
          if (rows.length) {
            const missing = q.columns.filter((c) => !(c in rows[0]));
            if (missing.length) throw new Error(`${name}: missing columns ${missing.join(', ')}`);
          }
          rows.forEach((r) => q.numeric.forEach((c) => {
            if (r[c] === null || r[c] === '') { r[c] = null; return; }
            const n = Number(r[c]);
            r[c] = Number.isFinite(n) ? Math.round(n * 1e6) / 1e6 : null; // keeps ratio precision, drops float noise
          }));
          console.log(`  ${name}: ${rows.length} rows (${Date.now() - started} ms)`);
          resolve(rows);
        } catch (e) { reject(e); } finally { fs.rmSync(dir, { recursive: true, force: true }); }
      });
  });
}

function checkLayout(datasets) {
  const known = new Set(Object.keys(datasets));
  const refs = [];
  LAYOUT.tabs.forEach((t) => [...(t.kpis || []), ...(t.charts || []), ...(t.tables || [])].forEach((w) => refs.push(w.dataset)));
  const bad = refs.filter((d) => !known.has(d));
  if (bad.length) fail('LAYOUT references unknown datasets: ' + [...new Set(bad)].join(', '));
}

async function main() {
  checkConfig();
  for (const f of [TEMPLATE, CHARTJS]) if (!fs.existsSync(f)) fail('not found: ' + f);
  console.log(`Querying ${Object.keys(QUERIES).length} datasets in parallel...`);
  const names = Object.keys(QUERIES);
  const results = await Promise.all(names.map((n) => runQuery(n, QUERIES[n]))).catch((e) => fail(e.message));
  const datasets = {};
  names.forEach((n, i) => { if (n !== 'meta') datasets[n] = results[i]; });
  checkLayout(datasets);
  const meta = results[names.indexOf('meta')][0] || {};
  const RAW = {
    meta: { title: CONFIG.title, subtitle: CONFIG.subtitle, timezone: CONFIG.timezone, currency: CONFIG.currency,
      data_start: meta.data_start, data_end: meta.data_end, generated_at: new Date().toISOString().slice(0, 16).replace('T', ' ') + ' UTC' },
    datasets, layout: LAYOUT,
  };
  // Escape '<' so customer strings like "</script>" or "<!--" cannot break the page.
  const json = JSON.stringify(RAW).replace(/</g, '\\u003c');
  const bytes = Buffer.byteLength(json, 'utf8');
  if (bytes > MAX_BYTES) fail(`data payload ${(bytes / 1048576).toFixed(2)} MB > 2 MB — drop high-cardinality filters, coarsen the time grain, shorten history, or keep top-N`);
  const template = fs.readFileSync(TEMPLATE, 'utf8');
  for (const marker of ['<!-- DATA_PLACEHOLDER -->', '<!-- CHARTJS_PLACEHOLDER -->']) {
    if (template.split(marker).length !== 2) fail('template must contain ' + marker + ' exactly once');
  }
  const chartjs = fs.readFileSync(CHARTJS, 'utf8').replace(/<\/script/gi, '<\\/script');
  // Replacer functions: '$&' or '$1' inside data must not be treated as replacement patterns.
  const html = template
    .replace('<!-- CHARTJS_PLACEHOLDER -->', () => `<script>${chartjs}</script>`)
    .replace('<!-- DATA_PLACEHOLDER -->', () => `<script>var RAW = ${json};</script>`);
  fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
  fs.writeFileSync(OUTPUT, html, 'utf8');
  console.log(`Written: ${OUTPUT} (data ${(bytes / 1024).toFixed(0)} KB, file ${(Buffer.byteLength(html) / 1024).toFixed(0)} KB)`);
}

main().catch((e) => fail(e.message));
