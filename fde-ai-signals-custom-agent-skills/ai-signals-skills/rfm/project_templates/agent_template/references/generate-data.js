#!/usr/bin/env node
/**
 * RFM Dashboard Data Generator (Parallel Query Engine)
 *
 * Queries customer RFM output tables concurrently via tdx CLI and dynamically
 * bakes the results into the RFM Summary Dashboard template.
 *
 * Usage:
 *   node generate-data.js <sink_database> [project_slug] [project_name]
 *   SOURCE_DB=<sink_database> node generate-data.js [project_slug] [project_name]
 *
 * Examples:
 *   node generate-data.js my_sink_db loyalty-rfm "Loyalty RFM"
 *   SOURCE_DB=my_sink_db node generate-data.js loyalty-rfm "Loyalty RFM"
 *
 * Output (default): ./agent_outputs/<project_slug>/dashboards/rfm_summary_dashboard.html
 * relative to the current working directory (git-ignored engagement folder).
 */

const fs = require('fs');
const path = require('path');

// Resolve the user's working directory: if run from inside agent_outputs/ (e.g. a workflow copy),
// step back out so dashboards never land in a nested agent_outputs/.
const workRoot = (() => {
  const parts = process.cwd().split(path.sep);
  const i = parts.lastIndexOf('agent_outputs');
  return i > 0 ? (parts.slice(0, i).join(path.sep) || path.sep) : process.cwd();
})();

const { exec } = require('child_process');

// ── CLI & Argument Parsing ──────────────────────────────────────────────────
const args = process.argv.slice(2);

function printHelp() {
  console.log(`
RFM Dashboard Data Generator (Parallel Query Engine)

Usage:
  node generate-data.js <sink_database> [project_slug] [project_name]
  SOURCE_DB=<sink_database> node generate-data.js [project_slug] [project_name]

Arguments:
  sink_database    Treasure Data database where RFM output tables reside (required, or env SOURCE_DB)
  project_slug    Project slug, names the output folder (default: "rfm")
  project_name    Project display name in the dashboard header (default: Title-cased slug)

Options:
  -c, --customer-id-col  Customer identifier column in rfm_combined_user_events (default: auto-detected via DESCRIBE, e.g. td_consumer_id, canonical_id)
  -o, --output     Custom output file path
                   (default: ./agent_outputs/<project_slug>/dashboards/rfm_summary_dashboard.html)
  -t, --template   Path to dashboard_template.html (default: the copy next to this script)
  -v, --verbose    Show verbose query outputs and timings
  -h, --help       Show this help message
`);
  process.exit(process.exitCode || 0);
}

if (args.includes('-h') || args.includes('--help')) {
  printHelp();
}

let customOutput = null;
let customTemplate = null;
let customCustomerIdCol = null;
let verbose = false;

const posArgs = [];
for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (arg === '-o' || arg === '--output') {
    customOutput = args[++i];
  } else if (arg === '-t' || arg === '--template') {
    customTemplate = args[++i];
  } else if (arg === '-c' || arg === '--customer-id-col') {
    customCustomerIdCol = args[++i];
  } else if (arg === '-v' || arg === '--verbose') {
    verbose = true;
  } else if (!arg.startsWith('-')) {
    posArgs.push(arg);
  }
}

let sinkDatabase = process.env.SOURCE_DB || '';
let projectSlug = process.env.PROJECT_SLUG || '';
let projectName = process.env.PROJECT_NAME || '';

if (posArgs.length > 0) {
  if (!sinkDatabase) {
    sinkDatabase = posArgs[0];
    if (posArgs[1]) projectSlug = posArgs[1];
    if (posArgs[2]) projectName = posArgs[2];
  } else {
    projectSlug = posArgs[0];
    if (posArgs[1]) projectName = posArgs[1];
  }
}

if (!sinkDatabase) {
  console.error('\x1b[31mError: sink_database is required (first argument or env SOURCE_DB).\x1b[0m');
  process.exitCode = 1;
  printHelp();
}

if (!projectSlug) {
  projectSlug = 'rfm';
}

if (!projectName) {
  projectName = projectSlug
    .split(/[-_]/)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

// Resolve paths
const scriptDir = __dirname;
const templatePath = customTemplate
  ? path.resolve(process.cwd(), customTemplate)
  : path.resolve(scriptDir, 'dashboard_template.html');

const defaultOutputDir = path.resolve(workRoot, 'agent_outputs', projectSlug, 'dashboards');
const outputPath = customOutput
  ? path.resolve(process.cwd(), customOutput)
  : path.join(defaultOutputDir, 'rfm_summary_dashboard.html');

if (!fs.existsSync(templatePath)) {
  console.error(`\x1b[31mError: Template not found at: ${templatePath}\x1b[0m`);
  process.exit(1);
}

console.log('='.repeat(65));
console.log('  RFM Dashboard Data Generator (Parallel Mode)');
console.log('='.repeat(65));
console.log(`  Project:        ${projectName} (${projectSlug})`);
console.log(`  Database:       ${sinkDatabase}`);
console.log(`  Template:       ${templatePath}`);
console.log(`  Output:         ${outputPath}`);
console.log('-'.repeat(65));

// ── Async TDX Query Execution Helper ────────────────────────────────────────
function runTdxQueryAsync(sql, desc) {
  return new Promise((resolve) => {
    const cleanSql = sql.replace(/\s+/g, ' ').trim();
    const escapedSql = cleanSql.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    const cmd = `tdx query -d ${sinkDatabase} --format json "${escapedSql}"`;
    const t0 = Date.now();
    exec(cmd, {
      maxBuffer: 50 * 1024 * 1024
    }, (error, stdout) => {
      const duration = Date.now() - t0;
      if (error) {
        if (verbose) {
          console.warn(`  [Notice] ${desc} query error: ${error.message} (${duration}ms)`);
        }
        return resolve([]);
      }
      try {
        const s = stdout.indexOf('[');
        const e = stdout.lastIndexOf(']');
        if (s !== -1 && e > s) {
          const parsed = JSON.parse(stdout.substring(s, e + 1));
          if (verbose) {
            console.log(`  ✔ [${desc}] Returned ${parsed.length} rows in ${duration}ms`);
          }
          return resolve(parsed);
        }
        return resolve([]);
      } catch (err) {
        if (verbose) {
          console.warn(`  [Notice] ${desc} JSON parse error: ${err.message} (${duration}ms)`);
        }
        return resolve([]);
      }
    });
  });
}

// ── Number & Formatting Helpers ─────────────────────────────────────────────
function num(v) {
  if (v === null || v === undefined || v === '') return 0;
  const n = Number(v);
  return isNaN(n) ? 0 : n;
}

function fmtInt(v) {
  return Math.round(num(v)).toLocaleString('en-US');
}

function fmtFloat(v, decimals = 2) {
  return num(v).toFixed(decimals);
}

function fmtCurrency(v) {
  const n = Math.round(num(v));
  return '$' + n.toLocaleString('en-US');
}

function fmtPct(v) {
  return num(v).toFixed(1) + '%';
}

// JSON for inline <script>: escape "<" so data containing "</script>" cannot end the block
function safeJson(value, ...args) {
  return JSON.stringify(value, ...args).replace(/</g, "\\u003c");
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ── Identifier Resolution ─────────────────────────────────────────────────────
function validateIdentifier(value, label) {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(value)) {
    throw new Error(`Invalid ${label}: "${value}". Use a SQL identifier (letters, numbers, underscores).`);
  }
  return value;
}

async function detectCustomerIdCol() {
  const explicit = customCustomerIdCol || process.env.CUSTOMER_ID_COL;
  if (explicit) {
    const column = validateIdentifier(explicit, 'customer ID column');
    console.log('  Customer ID column configured');
    return column;
  }

  // The RFM workflow preserves the configured join key in the combined events table.
  // Resolve it from the customer schema instead of assuming canonical_id/customer_id.
  const descRows = await runTdxQueryAsync(
    `DESCRIBE ${sinkDatabase}.rfm_combined_user_events`,
    'Detect customer identifier column from rfm_combined_user_events schema'
  );
  if (descRows.length === 0) {
    // The combined-events table is optional in some workflow configurations;
    // Q8 will use its existing source-summary fallback in that case.
    console.log(`  ℹ ${sinkDatabase}.rfm_combined_user_events unavailable; using source-summary fallback`);
    return null;
  }
  const columns = descRows.map(row => String(
    row.Column || row.column_name || row.col_name || row.Field || ''
  ).trim().toLowerCase()).filter(Boolean);

  const candidates = [
    'td_consumer_id',
    'td_canonical_id',
    'canonical_id',
    'customer_id',
    'cdp_profile_id',
    'user_id',
    'profile_id',
    'individual_id'
  ];
  const detected = candidates.find(candidate => columns.includes(candidate));
  if (detected) {
    console.log(`  ✔ Auto-detected customer identifier column: "${detected}" from rfm_combined_user_events schema`);
    return detected;
  }

  const excluded = new Set(['id', 'session_id', 'event_id', 'source_id']);
  const fallback = columns.find(column => column.endsWith('_id') && !excluded.has(column));
  if (fallback) {
    console.log(`  ✔ Auto-detected customer identifier column: "${fallback}" from rfm_combined_user_events schema`);
    return fallback;
  }

  throw new Error(
    `Could not identify the customer ID column in ${sinkDatabase}.rfm_combined_user_events. ` +
    'Run DESCRIBE on the table or pass --customer-id-col / CUSTOMER_ID_COL.'
  );
}

// ── Parallel Query Tasks ────────────────────────────────────────────────────
async function fetchQ1() {
  const sql = `
    SELECT session_id, segment_size AS total_profiles, avg_rfm, avg_recency,
           avg_frequency, avg_monetary,
           TD_TIME_FORMAT(time, 'yyyy-MM-dd HH:mm', 'UTC') AS run_time
    FROM ${sinkDatabase}.rfm_stats
    WHERE session_id = (SELECT MAX(session_id) FROM ${sinkDatabase}.rfm_stats)
      AND rfm_segment = 'ALL'
    LIMIT 1
  `;
  return runTdxQueryAsync(sql, 'Q1: Latest session KPIs');
}

async function fetchQ2() {
  const sql = `
    SELECT segment_size AS prev_total_profiles
    FROM ${sinkDatabase}.rfm_stats_daily_agg
    WHERE rfm_segment = 'ALL'
      AND session_id = (
        SELECT MAX(session_id) FROM ${sinkDatabase}.rfm_stats_daily_agg
        WHERE session_id < (SELECT MAX(session_id) FROM ${sinkDatabase}.rfm_stats_daily_agg)
      )
    LIMIT 1
  `;
  const rows = await runTdxQueryAsync(sql, 'Q2: Previous run profile count');
  if (rows.length > 0) {
    return num(rows[0].prev_total_profiles);
  }
  // Fallback to rfm_stats
  const fallbackSql = `
    SELECT segment_size AS prev_total_profiles
    FROM ${sinkDatabase}.rfm_stats
    WHERE rfm_segment = 'ALL'
      AND session_id < (SELECT MAX(session_id) FROM ${sinkDatabase}.rfm_stats)
    ORDER BY session_id DESC
    LIMIT 1
  `;
  const fallbackRows = await runTdxQueryAsync(fallbackSql, 'Q2 Fallback from rfm_stats');
  return fallbackRows.length > 0 ? num(fallbackRows[0].prev_total_profiles) : null;
}

async function fetchQ3() {
  const sql = `
    SELECT session_id, rfm_segment, segment_size,
           TD_TIME_FORMAT(time, 'yyyy-MM-dd', 'UTC') AS run_date
    FROM ${sinkDatabase}.rfm_stats_daily_agg
    WHERE rfm_segment != 'ALL'
    ORDER BY session_id ASC
  `;
  let rows = await runTdxQueryAsync(sql, 'Q3: Historic segment sizes');
  if (rows.length === 0) {
    const fallbackSql = `
      SELECT session_id, rfm_segment, segment_size,
             CAST(session_id AS varchar) AS run_date
      FROM ${sinkDatabase}.rfm_stats
      WHERE rfm_segment != 'ALL'
      ORDER BY session_id ASC
    `;
    rows = await runTdxQueryAsync(fallbackSql, 'Q3 Fallback from rfm_stats');
  }
  return rows;
}

async function fetchQ4() {
  const sql = `
    SELECT DISTINCT model_type, time_filter, lookback_days
    FROM ${sinkDatabase}.rfm_stats_model_params
    WHERE session_id = (SELECT MAX(session_id) FROM ${sinkDatabase}.rfm_stats_model_params)
    LIMIT 1
  `;
  const rows = await runTdxQueryAsync(sql, 'Q4: Model parameters');
  let modelType = 'custom';
  let timeFilter = 'no filter — all history';

  if (rows.length > 0) {
    const p = rows[0];
    if (p.model_type) modelType = p.model_type;
    if (p.time_filter === 'yes') {
      timeFilter = `interval (${p.lookback_days || 'active'})`;
    } else if (p.time_filter === 'no') {
      timeFilter = 'no filter — all history';
    } else if (p.time_filter) {
      timeFilter = p.time_filter;
    }
  } else {
    // Check rfm_input_params as fallback
    const inputSql = `
      SELECT apply_time_filter, time_filter_type, lookback_period
      FROM ${sinkDatabase}.rfm_input_params
      LIMIT 1
    `;
    const inputRows = await runTdxQueryAsync(inputSql, 'Q4 Fallback from rfm_input_params');
    if (inputRows.length > 0) {
      const ip = inputRows[0];
      if (ip.apply_time_filter === 'yes') {
        timeFilter = `${ip.time_filter_type} (${ip.lookback_period})`;
      }
    }
  }
  return { modelType, timeFilter };
}

async function fetchQ5() {
  const sql = `
    SELECT event_name AS source_name, total_profiles, total_events,
           avg_events_per_person, total_spend, avg_spend_per_person,
           min_date, max_date, months_range, table_filters
    FROM ${sinkDatabase}.rfm_src_table_summary
    ORDER BY total_profiles DESC
  `;
  let rows = await runTdxQueryAsync(sql, 'Q5: Data sources summary');
  if (rows.length === 0) {
    const fallbackSql = `
      SELECT source_table AS source_name, 0 AS total_profiles, total_touchpoints AS total_events,
             0.0 AS avg_events_per_person, total_spend, 0.0 AS avg_spend_per_person,
             min_date, max_date, 0 AS months_range, time_filter AS table_filters
      FROM ${sinkDatabase}.rfm_stats_model_params
      WHERE session_id = (SELECT MAX(session_id) FROM ${sinkDatabase}.rfm_stats_model_params)
    `;
    rows = await runTdxQueryAsync(fallbackSql, 'Q5 Fallback from rfm_stats_model_params');
  }
  return rows;
}

async function fetchQ6() {
  const sql = `
    SELECT s.rfm_segment, s.segment_size, s.population_percent,
           s.avg_recency, s.avg_frequency, s.avg_monetary, s.avg_rfm,
           s.quartile_list,
           COALESCE(d.segment_definition, '') AS segment_definition
    FROM ${sinkDatabase}.rfm_stats s
    LEFT JOIN (
      SELECT rfm_segment, segment_definition
      FROM ${sinkDatabase}.rfm_stats_daily_agg
      WHERE session_id = (SELECT MAX(session_id) FROM ${sinkDatabase}.rfm_stats_daily_agg)
    ) d ON s.rfm_segment = d.rfm_segment
    WHERE s.session_id = (SELECT MAX(session_id) FROM ${sinkDatabase}.rfm_stats)
      AND s.rfm_segment != 'ALL'
    ORDER BY s.segment_size DESC
  `;
  return runTdxQueryAsync(sql, 'Q6: Segment metrics');
}

async function fetchQ7() {
  const sql = `
    SELECT metric_name, bin_order, bin_label, bin_value, profile_cnt
    FROM ${sinkDatabase}.rfm_stats_histogram
    WHERE session_id = (SELECT MAX(session_id) FROM ${sinkDatabase}.rfm_stats_histogram)
      AND rfm_segment = 'ALL'
    ORDER BY metric_name, bin_order ASC
  `;
  return runTdxQueryAsync(sql, 'Q7: Histograms');
}

async function fetchQ8(customerIdCol) {
  if (!customerIdCol) return [];
  const sql = `
    SELECT source,
           COUNT(DISTINCT ${customerIdCol}) AS profile_count,
           ROUND(AVG(total_touchpoints), 2) AS avg_touchpoints
    FROM ${sinkDatabase}.rfm_combined_user_events
    GROUP BY source
    ORDER BY profile_count DESC
  `;
  let rows = await runTdxQueryAsync(sql, 'Q8: Source touchpoints');
  if (rows.length === 0) {
    const fallbackSql = `
      SELECT source,
             COUNT(*) AS profile_count,
             ROUND(AVG(total_touchpoints), 2) AS avg_touchpoints
      FROM ${sinkDatabase}.rfm_combined_user_events
      GROUP BY source
      ORDER BY profile_count DESC
    `;
    rows = await runTdxQueryAsync(fallbackSql, 'Q8 Fallback from rfm_combined_user_events');
  }
  return rows;
}

// ── Main Execution Controller ───────────────────────────────────────────────
async function main() {
  const startTime = Date.now();
  const customerIdCol = await detectCustomerIdCol();
  console.log(`Executing 8 queries in parallel against ${sinkDatabase} (customer identifier: "${customerIdCol}")...`);

  // Run all 8 queries simultaneously
  const [
    q1Rows,
    prevProfiles,
    q3Rows,
    q4Params,
    q5SrcRows,
    q6SegRows,
    q7HistRows,
    q8TouchRowsRaw
  ] = await Promise.all([
    fetchQ1(),
    fetchQ2(),
    fetchQ3(),
    fetchQ4(),
    fetchQ5(),
    fetchQ6(),
    fetchQ7(),
    fetchQ8(customerIdCol)
  ]);

  const queryDuration = Date.now() - startTime;
  console.log(`✔ All queries resolved concurrently in ${queryDuration} ms!`);

  if (q1Rows.length === 0) {
    console.error(`\x1b[31mError: No records found in ${sinkDatabase}.rfm_stats for rfm_segment = 'ALL'.\x1b[0m`);
    console.error(`Please verify that the RFM workflow has completed successfully in ${sinkDatabase}.`);
    process.exit(1);
  }

  const q1 = q1Rows[0];
  const sessionId = String(q1.session_id);
  const totalProfiles = num(q1.total_profiles);

  let q8TouchRows = q8TouchRowsRaw;
  if (q8TouchRows.length === 0 && q5SrcRows.length > 0) {
    q8TouchRows = q5SrcRows.map(r => ({
      source: r.source_name,
      profile_count: num(r.total_profiles),
      avg_touchpoints: num(r.avg_events_per_person)
    }));
  }

  console.log('Processing query data and calculating metrics...');

  // Profile change delta calculation
  let profilesChangePct = 'N/A (first run)';
  let profilesChangeClass = 'change-na';
  if (prevProfiles !== null && prevProfiles > 0) {
    const diff = ((totalProfiles - prevProfiles) / prevProfiles) * 100;
    profilesChangePct = (diff >= 0 ? '+' : '') + diff.toFixed(1) + '%';
    profilesChangeClass = diff >= 0 ? 'change-up' : 'change-down';
  }

  // Historic trend series processing (Q3)
  const runDatesSet = new Set();
  const segMap = {};
  for (const row of q3Rows) {
    const d = row.run_date || String(row.session_id);
    runDatesSet.add(d);
    const seg = row.rfm_segment;
    if (!segMap[seg]) segMap[seg] = {};
    segMap[seg][d] = num(row.segment_size);
  }
  const historicRunLabels = Array.from(runDatesSet).sort();
  const historicSegmentSeries = Object.keys(segMap).map(seg => ({
    name: seg,
    values: historicRunLabels.map(d => segMap[seg][d] || 0)
  }));

  // Segments processing (Q6)
  const segments = q6SegRows.map(r => ({
    segment: r.rfm_segment,
    definition: r.segment_definition || `Customers grouped in the ${r.rfm_segment} segment.`,
    quartiles: r.quartile_list || '',
    size: num(r.segment_size),
    pop_pct: num(r.population_percent),
    avg_recency: num(r.avg_recency),
    avg_frequency: num(r.avg_frequency),
    avg_monetary: num(r.avg_monetary),
    avg_rfm: num(r.avg_rfm)
  }));

  // Segments sorted ASC by size for horizontal bar
  const segBarSorted = [...segments].sort((a, b) => a.size - b.size);
  const segmentBarLabels = segBarSorted.map(s => s.segment);
  const segmentBarValues = segBarSorted.map(s => s.size);
  const segmentBarText = segBarSorted.map(s => `${fmtInt(s.size)} (${fmtPct(s.pop_pct)})`);

  // Segments sorted DESC by size for donut chart
  const segDonutSorted = [...segments].sort((a, b) => b.size - a.size);
  const segmentDonutLabels = segDonutSorted.map(s => s.segment);
  const segmentDonutValues = segDonutSorted.map(s => s.pop_pct);

  // Histograms processing (Q7)
  const recencyHist = { x: [], y: [] };
  const frequencyHist = { x: [], y: [] };
  const monetaryHist = { x: [], y: [] };

  for (const row of q7HistRows) {
    const m = (row.metric_name || '').toLowerCase();
    const val = num(row.bin_value);
    const cnt = num(row.profile_cnt);
    if (m === 'recency') {
      recencyHist.x.push(Math.round(val));
      recencyHist.y.push(cnt);
    } else if (m === 'frequency') {
      frequencyHist.x.push(Math.round(val));
      frequencyHist.y.push(cnt);
    } else if (m === 'monetary') {
      monetaryHist.x.push(Math.round(val));
      monetaryHist.y.push(cnt);
    }
  }

  // Sources processing (Q5)
  const sources = q5SrcRows.map(r => ({
    name: r.source_name,
    profiles: num(r.total_profiles),
    events: num(r.total_events),
    avg_events: num(r.avg_events_per_person),
    spend: num(r.total_spend),
    avg_spend: num(r.avg_spend_per_person),
    date_range: (r.min_date && r.max_date) ? `${r.min_date} to ${r.max_date}` : 'All available',
    months: num(r.months_range),
    filters: r.table_filters || 'None'
  }));

  // Source charts processing (Q8)
  const srcByProfiles = [...q8TouchRows].sort((a, b) => num(a.profile_count) - num(b.profile_count));
  const srcContribLabels = srcByProfiles.map(s => s.source);
  const srcContribProfiles = srcByProfiles.map(s => num(s.profile_count));
  const srcContribText = srcByProfiles.map(s => fmtInt(s.profile_count));

  const srcByEvents = [...q8TouchRows].sort((a, b) => num(b.avg_touchpoints) - num(a.avg_touchpoints));
  const srcTouchpointsLabels = srcByEvents.map(s => s.source);
  const srcTouchpointsValues = srcByEvents.map(s => num(s.avg_touchpoints));
  const srcTouchpointsText = srcByEvents.map(s => `${fmtFloat(s.avg_touchpoints, 2)} avg`);

  // Render Segment HTML Table Rows
  const segmentTableRows = segments.map(s => {
    let pillClass = 'pill';
    if (/lost|hibernating|cannot lose|at risk/i.test(s.segment)) pillClass += ' warn';
    else if (/champion|loyal/i.test(s.segment)) pillClass += ' ok';

    return `<tr>
  <td><span class="${pillClass}">${escapeHtml(s.segment)}</span></td>
  <td class="def">${escapeHtml(s.definition)}</td>
  <td class="qtl">${escapeHtml(s.quartiles)}</td>
  <td class="num">${fmtInt(s.size)}</td>
  <td class="num">${fmtPct(s.pop_pct)}</td>
  <td class="num">${Math.round(s.avg_recency)}</td>
  <td class="num">${fmtFloat(s.avg_frequency, 1)}</td>
  <td class="num">${fmtCurrency(s.avg_monetary)}</td>
  <td class="num">${fmtFloat(s.avg_rfm, 2)}</td>
</tr>`;
  }).join('\n');

  // Render Source HTML Table Rows
  const sourceTableRows = sources.map(s => {
    const spendStr = s.spend > 0 ? fmtCurrency(s.spend) : '—';
    const avgSpendStr = s.avg_spend > 0 ? fmtCurrency(s.avg_spend) : '—';
    return `<tr>
  <td><strong>${escapeHtml(s.name)}</strong></td>
  <td class="num">${fmtInt(s.profiles)}</td>
  <td class="num">${fmtInt(s.events)}</td>
  <td class="num">${fmtFloat(s.avg_events, 2)}</td>
  <td class="num">${spendStr}</td>
  <td class="num">${avgSpendStr}</td>
  <td>${escapeHtml(s.date_range)}</td>
  <td class="num">${s.months ? s.months : '—'}</td>
  <td><code>${escapeHtml(s.filters)}</code></td>
</tr>`;
  }).join('\n');

  // Derive Dynamic Insights & Recommendations based strictly on the query data
  const champions = segments.find(s => /champion/i.test(s.segment)) || { size: 0, pop_pct: 0, avg_monetary: 0 };
  const loyal = segments.find(s => /loyal customer/i.test(s.segment)) || { size: 0, pop_pct: 0, avg_monetary: 0 };
  const atRisk = segments.find(s => /cannot lose|at risk/i.test(s.segment)) || { size: 0, pop_pct: 0, avg_monetary: 0 };
  const hibernating = segments.find(s => /hibernating/i.test(s.segment)) || { size: 0, pop_pct: 0 };
  const potential = segments.find(s => /potential/i.test(s.segment)) || { size: 0, pop_pct: 0 };
  const lost = segments.find(s => /lost/i.test(s.segment)) || { size: 0, pop_pct: 0 };

  const highValueCount = champions.size + loyal.size;
  const highValuePct = champions.pop_pct + loyal.pop_pct;
  const highValueSpend = champions.size > 0 ? champions.avg_monetary : loyal.avg_monetary;

  const execSummaryBullets = [];
  if (highValueCount > 0) {
    execSummaryBullets.push(
      `<strong>High-Value Core:</strong> Champions and Loyal Customers constitute <strong>${fmtPct(highValuePct)}</strong> of total profiles (${fmtInt(highValueCount)} customers), generating an average of <strong>${fmtCurrency(highValueSpend)}</strong> per profile.`
    );
  }
  if (atRisk.size > 0) {
    execSummaryBullets.push(
      `<strong>Churn Prevention Priority:</strong> The '${atRisk.segment}' segment holds <strong>${fmtInt(atRisk.size)}</strong> high-value profiles (${fmtPct(atRisk.pop_pct)}) with substantial historical spend (${fmtCurrency(atRisk.avg_monetary)}) but declining recency. Urgent retention workflows should be triggered immediately.`
    );
  }
  if (potential.size > 0) {
    execSummaryBullets.push(
      `<strong>Growth Runway:</strong> Potential Loyalists represent <strong>${fmtInt(potential.size)}</strong> customers (${fmtPct(potential.pop_pct)}) with recent engagement and moderate spend. Nurturing frequency through cross-sell campaigns represents the largest incremental revenue opportunity.`
    );
  }
  if (hibernating.size > 0 || lost.size > 0) {
    const dormantCount = hibernating.size + lost.size;
    const dormantPct = hibernating.pop_pct + lost.pop_pct;
    execSummaryBullets.push(
      `<strong>Dormant Audience Management:</strong> <strong>${fmtInt(dormantCount)}</strong> customers (${fmtPct(dormantPct)}) are currently dormant or lost. Recommend automated re-activation cadences or campaign suppression to safeguard engagement metrics.`
    );
  }
  execSummaryBullets.push(
    `<strong>Model Calibration:</strong> Average overall population RFM score is <strong>${fmtFloat(num(q1.avg_rfm), 2)}</strong> with average recency of <strong>${Math.round(num(q1.avg_recency))}</strong> days and frequency of <strong>${fmtFloat(num(q1.avg_frequency), 1)}</strong> touchpoints across all verified channels.`
  );
  const execSummaryHtml = execSummaryBullets.map(b => `<li>${b}</li>`).join('\n          ');

  // Derive Dynamic Source Insights
  const sortedBySpend = [...sources].sort((a, b) => b.spend - a.spend);
  const topSpendSrc = sortedBySpend[0] || { name: 'Transaction Data', spend: 0, profiles: 0 };
  const sortedByProfiles = [...sources].sort((a, b) => b.profiles - a.profiles);
  const topReachSrc = sortedByProfiles[0] || { name: 'Digital Channels', profiles: 0 };
  const sortedByAvgEvents = [...sources].sort((a, b) => b.avg_events - a.avg_events);
  const topDensitySrc = sortedByAvgEvents[0] || { name: 'Web Events', avg_events: 0 };

  const sourceInsightsBullets = [
    `<strong>Primary Revenue Source:</strong> <strong>${escapeHtml(topSpendSrc.name)}</strong> drives the primary monetary signal with <strong>${fmtCurrency(topSpendSrc.spend)}</strong> in total spend across <strong>${fmtInt(topSpendSrc.profiles)}</strong> profiles.`,
    `<strong>Broadest Channel Reach:</strong> <strong>${escapeHtml(topReachSrc.name)}</strong> reaches the largest unique profile base with <strong>${fmtInt(topReachSrc.profiles)}</strong> profiles (${fmtPct((topReachSrc.profiles / totalProfiles) * 100)} reach of total population).`,
    `<strong>Highest Event Density:</strong> <strong>${escapeHtml(topDensitySrc.name)}</strong> has the highest interaction intensity, averaging <strong>${fmtFloat(topDensitySrc.avg_events, 1)}</strong> events per profile.`,
    `<strong>Cross-Channel Synthesis:</strong> Behavioral scoring combines <strong>${sources.length}</strong> distinct source tables to ensure balanced Recency, Frequency, and Monetary representations.`
  ];
  const sourceInsightsHtml = sourceInsightsBullets.map(b => `<li>${b}</li>`).join('\n          ');

  // ── Token Substitution & HTML Generation ────────────────────────────────────
  console.log('Baking dynamic data into dashboard template...');

  const tokenMap = {
    '{{project_name}}': escapeHtml(projectName),
    '{{sink_database}}': escapeHtml(sinkDatabase),
    '{{customer_id_col}}': escapeHtml(customerIdCol || 'not available (aggregate fallback)'),
    '{{session_id}}': escapeHtml(sessionId),
    '{{run_time_utc}}': escapeHtml(q1.run_time || new Date().toISOString().replace('T', ' ').substring(0, 16) + ' UTC'),
    '{{total_profiles_scored}}': fmtInt(totalProfiles),
    '{{profiles_change_pct}}': profilesChangePct,
    '{{profiles_change_class}}': profilesChangeClass,
    '{{model_type}}': escapeHtml(q4Params.modelType),
    '{{time_filter_summary}}': escapeHtml(q4Params.timeFilter),
    '{{source_count}}': String(sources.length),
    '{{avg_rfm_score}}': fmtFloat(num(q1.avg_rfm), 2),
    '{{avg_recency_days}}': String(Math.round(num(q1.avg_recency))),
    '{{avg_frequency}}': fmtFloat(num(q1.avg_frequency), 1),
    '{{avg_monetary_value}}': fmtCurrency(num(q1.avg_monetary)),

    '{{segment_table_rows}}': segmentTableRows,
    '{{source_table_rows}}': sourceTableRows,
    '{{exec_summary_html_li}}': execSummaryHtml,
    '{{exec_src_insights_html_li}}': sourceInsightsHtml,

    '{{historic_run_labels_json}}': safeJson(historicRunLabels),
    '{{historic_segment_series_json}}': safeJson(historicSegmentSeries),
    '{{segment_bar_labels_json}}': safeJson(segmentBarLabels),
    '{{segment_bar_values_json}}': safeJson(segmentBarValues),
    '{{segment_bar_text_json}}': safeJson(segmentBarText),
    '{{segment_donut_labels_json}}': safeJson(segmentDonutLabels),
    '{{segment_donut_values_json}}': safeJson(segmentDonutValues),

    '{{recency_hist_x_json}}': safeJson(recencyHist.x),
    '{{recency_hist_y_json}}': safeJson(recencyHist.y),
    '{{frequency_hist_x_json}}': safeJson(frequencyHist.x),
    '{{frequency_hist_y_json}}': safeJson(frequencyHist.y),
    '{{monetary_hist_x_json}}': safeJson(monetaryHist.x),
    '{{monetary_hist_y_json}}': safeJson(monetaryHist.y),

    '{{src_contrib_labels_json}}': safeJson(srcContribLabels),
    '{{src_contrib_profiles_json}}': safeJson(srcContribProfiles),
    '{{src_contrib_text_json}}': safeJson(srcContribText),
    '{{src_touchpoints_labels_json}}': safeJson(srcTouchpointsLabels),
    '{{src_touchpoints_values_json}}': safeJson(srcTouchpointsValues),
    '{{src_touchpoints_text_json}}': safeJson(srcTouchpointsText)
  };

  const templateContent = fs.readFileSync(templatePath, 'utf-8');

  // Strip the documentation comment block at the top of dashboard_template.html
  let renderedHtml = templateContent.replace(/^<!DOCTYPE html>[\s\S]*?-->\s*<html/i, '<!DOCTYPE html>\n<html');

  // Substitute all tokens
  for (const [token, val] of Object.entries(tokenMap)) {
    renderedHtml = renderedHtml.split(token).join(val);
  }

  // Inline window.RAW for programmatic access
  const rawPayload = {
    project: { name: projectName, slug: projectSlug, database: sinkDatabase },
    meta: {
      customerIdCol,
      sessionId,
      totalProfiles,
      profilesChangePct,
      runTime: q1.run_time,
      modelType: q4Params.modelType,
      timeFilter: q4Params.timeFilter,
      avgRfm: num(q1.avg_rfm),
      avgRecency: num(q1.avg_recency),
      avgFrequency: num(q1.avg_frequency),
      avgMonetary: num(q1.avg_monetary)
    },
    segments,
    sources,
    histograms: {
      recency: recencyHist,
      frequency: frequencyHist,
      monetary: monetaryHist
    },
    historicTrends: {
      dates: historicRunLabels,
      series: historicSegmentSeries
    }
  };

  const rawInjection = `<script id="rfm-data-payload">\n  window.RAW = ${safeJson(rawPayload, null, 2)};\n</script>\n`;
  renderedHtml = renderedHtml.replace('</head>', `${rawInjection}</head>`);

  // Write output
  const targetDir = path.dirname(outputPath);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  // Make sure agent_outputs/ ignores itself so customer data is never committed

  const outputsIgnore = path.resolve(workRoot, 'agent_outputs', '.gitignore');

  if (outputPath.startsWith(path.dirname(outputsIgnore) + path.sep) && !fs.existsSync(outputsIgnore)) {

    fs.mkdirSync(path.dirname(outputsIgnore), { recursive: true });

    fs.writeFileSync(outputsIgnore, '*\n', 'utf-8');

  }

  fs.writeFileSync(outputPath, renderedHtml, 'utf-8');

  const stats = fs.statSync(outputPath);
  const fileSizeKb = (stats.size / 1024).toFixed(1);
  const totalDuration = Date.now() - startTime;

  console.log('='.repeat(65));
  console.log('  Dashboard Generated Successfully!');
  console.log('='.repeat(65));
  console.log(`  File Path:      ${outputPath}`);
  console.log(`  File Size:      ${fileSizeKb} KB`);
  console.log(`  Query Duration: ${queryDuration} ms (parallel)`);
  console.log(`  Total Duration: ${totalDuration} ms`);
  console.log(`  Profiles Scored:${fmtInt(totalProfiles)}`);
  console.log(`  Segments Mapped:${segments.length}`);
  console.log(`  Sources Mapped: ${sources.length}`);
  console.log('-'.repeat(65));
  console.log(`  To view the dashboard:`);
  console.log(`    open "${outputPath}"`);
  console.log('='.repeat(65));
}

main().catch(err => {
  console.error(`\x1b[31mFatal error: ${err.message}\x1b[0m`);
  console.error(err.stack);
  process.exit(1);
});
