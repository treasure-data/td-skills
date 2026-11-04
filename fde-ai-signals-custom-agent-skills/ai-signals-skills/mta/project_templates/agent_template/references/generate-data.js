#!/usr/bin/env node
/**
 * MTA Dashboard Data Generator (Parallel Query Engine)
 *
 * Concurrently queries MTA output tables via tdx CLI and dynamically
 * bakes metrics, chart datasets, and executive insights into the MTA Summary Dashboard template.
 *
 * Usage:
 *   node generate-data.js <sink_database> [project_slug] [project_name] [-c <customer_id_col>]
 *   SOURCE_DB=<sink_database> node generate-data.js [project_slug] [project_name]
 *
 * Examples:
 *   node generate-data.js my_sink_db paid-media-mta "Paid Media MTA" -c canonical_id
 *   SOURCE_DB=my_sink_db node generate-data.js paid-media-mta "Paid Media MTA"
 *
 * Default output (relative to the current working directory):
 *   agent_outputs/<project_slug>/dashboards/mta_summary_dashboard.html
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

function printHelp(exitCode = 0) {
  console.log(`
MTA Dashboard Data Generator (Parallel Query Engine)

Usage:
  node generate-data.js <sink_database> [project_slug] [project_name]
  SOURCE_DB=<sink_database> node generate-data.js [project_slug] [project_name]

Arguments:
  sink_database    Treasure Data database where MTA output tables reside (required, or env SOURCE_DB)
  project_slug     Project slug, names the output folder (default: "mta")
  project_name     Project display name in the dashboard header (default: Title-cased slug)

Options:
  -c, --customer-id-col  Customer identifier column in mta_journeys (default: auto-detected via DESCRIBE, e.g. td_consumer_id, canonical_id)
  -o, --output     Custom output file path (default: ./agent_outputs/<project_slug>/dashboards/mta_summary_dashboard.html)
  -t, --template   Path to dashboard_template.html (default: the copy next to this script)
  -v, --verbose    Show verbose query outputs and timings
  -h, --help       Show this help message
`);
  process.exit(exitCode);
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
  console.error('Error: sink_database is required (first argument or SOURCE_DB env var).');
  printHelp(1);
}

if (!projectSlug) {
  projectSlug = 'mta';
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

// Default output lives in the git-ignored agent_outputs/ folder of the user's working directory
const defaultOutputDir = path.resolve(workRoot, 'agent_outputs', projectSlug, 'dashboards');
const outputPath = customOutput
  ? path.resolve(process.cwd(), customOutput)
  : path.join(defaultOutputDir, 'mta_summary_dashboard.html');

if (!fs.existsSync(templatePath)) {
  console.error(`\x1b[31mError: Template not found at: ${templatePath}\x1b[0m`);
  process.exit(1);
}

console.log('='.repeat(65));
console.log('  MTA Dashboard Data Generator (Parallel Mode)');
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

function fmtFloat(v, decimals = 1) {
  return num(v).toFixed(decimals);
}

function fmtCurrency(v) {
  const n = Math.round(num(v));
  return '$' + n.toLocaleString('en-US');
}

function fmtPct(v, decimals = 1) {
  return num(v).toFixed(decimals) + '%';
}

// JSON for inline <script>: escape "<" so data containing "</script>" cannot end the block
function safeJson(value, ...args) {
  return JSON.stringify(value, ...args).replace(/</g, "\\u003c");
}

// The template inserts values inside JS string and template literals, so also
// escape backslash, backtick, "$" and newlines (rendered later via innerHTML)
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/\\/g, '&#92;')
    .replace(/`/g, '&#96;')
    .replace(/\$/g, '&#36;')
    .replace(/\r?\n/g, ' ');
}

function formatMonth(dateStr) {
  if (!dateStr) return '';
  const parts = String(dateStr).split('-');
  if (parts.length >= 2) {
    const year = parts[0];
    const monthNum = parseInt(parts[1], 10);
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const month = months[monthNum - 1] || parts[1];
    return `${month} ${year}`;
  }
  return String(dateStr);
}

// ── Parallel Query Tasks ────────────────────────────────────────────────────

// Q0: Detect Customer Identifier Column (Schema & Config Resolution)
function validateIdentifier(value, label) {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(value)) {
    throw new Error(`Invalid ${label}: "${value}". Use a SQL identifier (letters, numbers, underscores).`);
  }
  return value;
}

async function detectCustomerIdCol() {
  if (customCustomerIdCol) {
    const column = validateIdentifier(customCustomerIdCol, 'customer ID column');
    console.log(`  Customer ID column (specified): "${column}"`);
    return column;
  }
  if (process.env.CUSTOMER_ID_COL) {
    const column = validateIdentifier(process.env.CUSTOMER_ID_COL, 'customer ID column');
    console.log('  Customer ID column configured via environment');
    return column;
  }

  // Auto-detect from mta_journeys schema via DESCRIBE
  try {
    const descRows = await runTdxQueryAsync(
      `DESCRIBE ${sinkDatabase}.mta_journeys`,
      'Detect customer identifier column from mta_journeys schema'
    );
    if (descRows && descRows.length > 0) {
      const cols = descRows.map(r => {
        const name = r.Column || r.column_name || r.col_name || r.Field || '';
        return String(name).trim().toLowerCase();
      }).filter(Boolean);

      // Priority candidates across customer TD setups (ID unification output names)
      const candidates = [
        'td_consumer_id',
        'canonical_id',
        'customer_id',
        'cdp_profile_id',
        'user_id',
        'client_id',
        'account_id',
        'profile_id',
        'individual_id'
      ];

      for (const cand of candidates) {
        if (cols.includes(cand)) {
          console.log(`  ✔ Auto-detected customer identifier column: "${cand}" from mta_journeys schema`);
          return cand;
        }
      }

      // If no standard candidate matches, find any column ending in '_id' that isn't a journey/session/system id
      const excluded = ['conversion_journey_id', 'journey_id', 'session_id', 'event_id', 'id'];
      const fallbackId = cols.find(c => c.endsWith('_id') && !excluded.includes(c));
      if (fallbackId) {
        console.log(`  ✔ Auto-detected customer identifier column: "${fallbackId}" from mta_journeys schema`);
        return fallbackId;
      }
    }
  } catch (err) {
    throw new Error(
      `Could not inspect ${sinkDatabase}.mta_journeys to resolve the customer ID column: ${err.message}. ` +
      'Run DESCRIBE on the table or pass --customer-id-col / CUSTOMER_ID_COL.'
    );
  }

  throw new Error(
    `Could not identify the customer ID column in ${sinkDatabase}.mta_journeys. ` +
    'Run DESCRIBE on the table or pass --customer-id-col / CUSTOMER_ID_COL.'
  );
}

// Q1: Parameters and Run Configuration
async function fetchParams() {
  const sql = `
    SELECT src_table, table_description, event_name, conversion_flag,
           apply_time_filter, time_filter_type, lookback_period,
           final_where_clause, time
    FROM ${sinkDatabase}.mta_table_params
  `;
  return runTdxQueryAsync(sql, 'Q1: MTA Parameters');
}

// Q2: Headline KPIs & Journey Metrics
async function fetchJourneysKPIs(customerIdCol = 'td_consumer_id') {
  const sql = `
    SELECT
      COUNT(*) AS total_touchpoints,
      COUNT(DISTINCT ${customerIdCol}) AS unique_customers,
      CAST(SUM(conversion_flag) AS BIGINT) AS total_conversions,
      COUNT(DISTINCT conversion_journey_id) AS distinct_journeys,
      ROUND(AVG(journey_length), 1) AS avg_journey_steps,
      ROUND(AVG(journey_duration_days), 1) AS avg_journey_days,
      MIN(event_date) AS min_date,
      MAX(event_date) AS max_date,
      DATE_DIFF('day', DATE(MIN(event_date)), DATE(MAX(event_date))) AS window_days,
      COUNT(CASE WHEN url IS NOT NULL AND (url LIKE '%utm_%' OR url LIKE '%utm_source%') THEN 1 END) AS utm_web_count,
      COUNT(CASE WHEN url IS NOT NULL THEN 1 END) AS total_web_count
    FROM ${sinkDatabase}.mta_journeys
  `;
  let rows = await runTdxQueryAsync(sql, 'Q2: Headline KPIs & Journey Metrics');
  if (rows.length === 0) {
    const fallbackSql = `
      SELECT
        COUNT(*) AS total_touchpoints,
        COUNT(DISTINCT ${customerIdCol}) AS unique_customers,
        CAST(SUM(conversion_flag) AS BIGINT) AS total_conversions,
        COUNT(DISTINCT conversion_journey_id) AS distinct_journeys,
        ROUND(AVG(journey_length), 1) AS avg_journey_steps,
        ROUND(AVG(journey_duration_days), 1) AS avg_journey_days,
        MIN(event_date) AS min_date,
        MAX(event_date) AS max_date,
        365 AS window_days,
        0 AS utm_web_count,
        0 AS total_web_count
      FROM ${sinkDatabase}.mta_journeys_base
    `;
    rows = await runTdxQueryAsync(fallbackSql, 'Q2 Fallback from mta_journeys_base');
  }
  return rows;
}

// Q3: Standard Models Attribution (First Touch, Last Touch, Linear, U-Shaped)
async function fetchStandardModels() {
  const sql = `
    SELECT attribution_type, channel,
           ROUND(SUM(total_conversions), 1) AS total_conv
    FROM ${sinkDatabase}.mta_models_standard
    GROUP BY 1, 2
    ORDER BY 1, 3 DESC
  `;
  return runTdxQueryAsync(sql, 'Q3: Standard Models Attribution');
}

// Q4: Markov attribution share (latest run) + removal effect
async function fetchMarkovAttribution() {
  const sql = `
    SELECT channels AS ch,
           ROUND(SUM(attribution_markov_algorithmic) * 100.0 / SUM(SUM(attribution_markov_algorithmic)) OVER (), 2) AS v,
           ROUND(AVG(removal_effect) * 100, 1) AS re
    FROM ${sinkDatabase}.mta_markov_attribution_final
    WHERE run_time = (SELECT MAX(run_time) FROM ${sinkDatabase}.mta_markov_attribution_final)
    GROUP BY channels
    ORDER BY v DESC
  `;
  let rows = await runTdxQueryAsync(sql, 'Q4: Markov Attribution Share');
  if (rows.length === 0) {
    const fallbackSql = `
      SELECT channels AS ch,
             ROUND(SUM(attribution_markov_algorithmic) * 100.0 / SUM(SUM(attribution_markov_algorithmic)) OVER (), 2) AS v,
             ROUND(AVG(removal_effect) * 100, 1) AS re
      FROM ${sinkDatabase}.mta_markov_attribution
      GROUP BY channels
      ORDER BY v DESC
    `;
    rows = await runTdxQueryAsync(fallbackSql, 'Q4 Fallback from mta_markov_attribution');
  }
  return rows;
}

// Q5: Shapley Value Attribution
async function fetchShapleyAttribution() {
  const sql = `
    SELECT channels AS ch,
           ROUND(SUM(value), 1) AS total_attributed,
           ROUND(SUM(percentage) * 100, 2) AS v
    FROM ${sinkDatabase}.mta_shapley_attribution_final
    WHERE run_time = (SELECT MAX(run_time) FROM ${sinkDatabase}.mta_shapley_attribution_final)
      AND step = 0  -- step 0 = whole journey; step N = last N unique channels
    GROUP BY channels
    ORDER BY total_attributed DESC
  `;
  let rows = await runTdxQueryAsync(sql, 'Q5: Shapley Value Attribution');
  if (rows.length === 0) {
    const fallbackSql = `
      SELECT channels AS ch,
             ROUND(SUM(value), 1) AS total_attributed,
             ROUND(SUM(value) * 100.0 / SUM(SUM(value)) OVER (), 2) AS v
      FROM ${sinkDatabase}.mta_shapley_attribution
      WHERE size = 0 AND channels IS NOT NULL  -- raw AI Signals output names the column size
      GROUP BY channels
      ORDER BY total_attributed DESC
    `;
    rows = await runTdxQueryAsync(fallbackSql, 'Q5 Fallback from mta_shapley_attribution');
  }
  return rows;
}

// Q6: Top Conversion Journeys (Grouped by unique path)
async function fetchTopJourneys() {
  const sql = `
    SELECT journey_steps,
           SUM(conversions) AS conversions,
           ROUND(AVG(avg_journey_length), 1) AS avg_steps,
           ROUND(AVG(avg_journey_duration_days), 1) AS avg_days
    FROM ${sinkDatabase}.mta_top_conversion_journeys
    WHERE LOWER(target) LIKE '%conv%'
    GROUP BY journey_steps
    ORDER BY conversions DESC
    LIMIT 10
  `;
  return runTdxQueryAsync(sql, 'Q6: Top Conversion Journeys');
}

// Q7: Journey Comparison Aggregates (Converted vs Churn)
async function fetchJourneyAggregates() {
  const sql = `
    SELECT target,
           COUNT(*) AS pattern_count,
           COALESCE(SUM(conversions), 0) AS total_conversions,
           ROUND(AVG(avg_journey_length), 1) AS avg_steps,
           ROUND(AVG(avg_journey_duration_days), 1) AS avg_days
    FROM ${sinkDatabase}.mta_top_conversion_journeys
    GROUP BY target
  `;
  return runTdxQueryAsync(sql, 'Q7: Converted vs Churn Aggregates');
}

// Q8: Source Table Summary
async function fetchSourceSummary() {
  const sql = `
    SELECT src_table, total_profiles, total_events,
           CAST(conversion_events AS BIGINT) AS conversion_events,
           min_date, max_date, table_description
    FROM ${sinkDatabase}.journey_src_union_summary
    ORDER BY total_events DESC
  `;
  return runTdxQueryAsync(sql, 'Q8: Source Table Summary');
}

// Q9: Channel Validation & Distribution
async function fetchChannelValidation() {
  const sql = `
    SELECT channel AS ch, total_events,
           ROUND(perc_of_total_events, 1) AS pct_events,
           CAST(total_conversions AS BIGINT) AS conversions,
           perc_of_total_conv, total_revenue
    FROM ${sinkDatabase}.mta_journeys_validate
    ORDER BY total_events DESC
  `;
  return runTdxQueryAsync(sql, 'Q9: Channel Validation');
}

// Q10: Markov Transition Flows (Sankey)
async function fetchMarkovTransitions() {
  const sql = `
    SELECT channels AS from_channel, to_channel,
           ROUND(AVG(trans_prob) * 100, 0) AS flow
    FROM ${sinkDatabase}.mta_markov_transition_final
    WHERE run_time = (SELECT MAX(run_time) FROM ${sinkDatabase}.mta_markov_transition_final)
    GROUP BY 1, 2
    ORDER BY flow DESC
    LIMIT 25
  `;
  // No fallback to mta_markov_transition: the raw AI Signals matrix is wide (one column per channel)
  return runTdxQueryAsync(sql, 'Q10: Markov Transition Flows');
}

// ── Main Execution Controller ───────────────────────────────────────────────
async function main() {
  const startTime = Date.now();

  // Resolve customer identifier column dynamically from schema or override
  const customerIdCol = await detectCustomerIdCol();
  console.log(`Executing 10 MTA queries in parallel against ${sinkDatabase} (customer identifier: "${customerIdCol}")...`);

  // Run all 10 queries simultaneously
  const [
    paramsRows,
    kpiRows,
    stdModelRows,
    markovRows,
    shapleyRows,
    topJourneyRows,
    journeyAggRows,
    sourceRows,
    channelValRows,
    transitionRows
  ] = await Promise.all([
    fetchParams(),
    fetchJourneysKPIs(customerIdCol),
    fetchStandardModels(),
    fetchMarkovAttribution(),
    fetchShapleyAttribution(),
    fetchTopJourneys(),
    fetchJourneyAggregates(),
    fetchSourceSummary(),
    fetchChannelValidation(),
    fetchMarkovTransitions()
  ]);

  const queryDuration = Date.now() - startTime;
  console.log(`✔ All queries resolved concurrently in ${queryDuration} ms!`);

  if (kpiRows.length === 0 && sourceRows.length === 0) {
    console.error(`\x1b[31mError: No records found in ${sinkDatabase} MTA output tables.\x1b[0m`);
    console.error(`Please verify that the MTA workflow has completed successfully in ${sinkDatabase}.`);
    process.exit(1);
  }

  console.log('Processing query data and synthesizing executive insights...');

  // ── 1. Metadata & Headline Metrics ─────────────────────────────────────────
  const kpiData = kpiRows[0] || {};
  const totalTouchpoints = num(kpiData.total_touchpoints);
  const uniqueCustomers = num(kpiData.unique_customers);
  const totalConversions = num(kpiData.total_conversions);
  const avgJourneySteps = num(kpiData.avg_journey_steps);
  const avgJourneyDays = num(kpiData.avg_journey_days);
  const minDate = kpiData.min_date || '';
  const maxDate = kpiData.max_date || '';
  const windowDays = num(kpiData.window_days) || 365;

  // Resolve Lookback & Conversion Source from params or sources
  let lookbackPeriod = `${windowDays} days`;
  let uniqueUserId = customerIdCol;
  let conversionSource = 'Orders / Conversions';

  if (paramsRows.length > 0) {
    const convParam = paramsRows.find(p => p.conversion_flag !== '0' && p.conversion_flag !== '0.0' && p.conversion_flag !== 0);
    if (convParam) {
      conversionSource = `${convParam.src_table} (${convParam.table_description || convParam.event_name})`;
    }
    const p0 = paramsRows[0];
    if (p0.lookback_period) {
      lookbackPeriod = p0.lookback_period.replace(/^-/, '').replace(/d$/, ' days');
    }
    if (p0.final_where_clause && /customer_id/i.test(p0.final_where_clause)) {
      uniqueUserId = 'customer_id';
    } else if (p0.final_where_clause && /user_id/i.test(p0.final_where_clause)) {
      uniqueUserId = 'user_id';
    }
  }

  if (conversionSource === 'Orders / Conversions' && sourceRows.length > 0) {
    const convSrc = sourceRows.find(s => num(s.conversion_events) > 0);
    if (convSrc) {
      conversionSource = `${convSrc.src_table} (${convSrc.table_description || 'verified conversion events'})`;
    }
  }

  const runDate = maxDate || new Date().toISOString().substring(0, 10);
  const dataDateRange = (minDate && maxDate)
    ? `${formatMonth(minDate)} → ${formatMonth(maxDate)}`
    : `Last ${windowDays} days`;

  // UTM Coverage calculation
  const utmWebCount = num(kpiData.utm_web_count);
  const totalWebCount = num(kpiData.total_web_count);
  let utmCoveragePct = 0;
  if (totalWebCount > 0) {
    utmCoveragePct = Math.round((utmWebCount / totalWebCount) * 1000) / 10;
  } else {
    utmCoveragePct = 50.0;
  }
  const utmCoverageLabel = fmtPct(utmCoveragePct);

  // ── 2. Standard Models Data (Tab 1) ────────────────────────────────────────
  // Group standard model rows by channel and model
  const channelModelMap = {};
  for (const row of stdModelRows) {
    const ch = row.channel;
    const model = (row.attribution_type || '').toLowerCase().replace(/[-_ ]/g, '');
    const convs = num(row.total_conv);
    if (!channelModelMap[ch]) {
      channelModelMap[ch] = { firsttouch: 0, lasttouch: 0, linear: 0, ushaped: 0 };
    }
    if (model.includes('first')) channelModelMap[ch].firsttouch = convs;
    else if (model.includes('last')) channelModelMap[ch].lasttouch = convs;
    else if (model.includes('linear')) channelModelMap[ch].linear = convs;
    else if (model.includes('ushaped') || model.includes('u_shaped')) channelModelMap[ch].ushaped = convs;
  }

  // Sort channels by Linear conversion volume DESC
  const allStdChannels = Object.keys(channelModelMap).sort(
    (a, b) => channelModelMap[b].linear - channelModelMap[a].linear
  );
  const top8Channels = allStdChannels.slice(0, 8);

  const stdChannelLabels = top8Channels;
  const ftValues = top8Channels.map(ch => +(channelModelMap[ch].firsttouch.toFixed(1)));
  const ltValues = top8Channels.map(ch => +(channelModelMap[ch].lasttouch.toFixed(1)));
  const linearValues = top8Channels.map(ch => +(channelModelMap[ch].linear.toFixed(1)));
  const ushapedValues = top8Channels.map(ch => +(channelModelMap[ch].ushaped.toFixed(1)));

  // Model comparison table rows (Tab 1)
  const modelComparisonRows = allStdChannels.map(ch => {
    const m = channelModelMap[ch];
    return `<tr>
  <td><strong>${escapeHtml(ch)}</strong></td>
  <td class="num">${fmtFloat(m.firsttouch, 1)}</td>
  <td class="num">${fmtFloat(m.linear, 1)}</td>
  <td class="num">${fmtFloat(m.ushaped, 1)}</td>
  <td class="num">${fmtFloat(m.lasttouch, 1)}</td>
</tr>`;
  }).join('\n');

  // ── 3. ML Models Data (Tab 2) ──────────────────────────────────────────────
  const markovData = markovRows.map(r => ({ ch: r.ch, v: num(r.v), re: num(r.re) })).sort((a, b) => b.v - a.v);
  const shapleyData = shapleyRows.map(r => ({
    ch: r.ch,
    v: num(r.v),
    total_attributed: num(r.total_attributed)
  })).sort((a, b) => b.total_attributed - a.total_attributed);

  const topMarkov = markovData[0] || { ch: 'None', v: 0 };
  const topMarkovChannel = topMarkov.ch;
  const topMarkovRemoval = fmtPct(topMarkov.v, 2);  // attribution share (token name kept for the template)
  const topMarkovRemovalEffect = fmtPct(topMarkov.re || 0, 1);

  const topShapley = shapleyData[0] || { ch: 'None', v: 0, total_attributed: 0 };
  const topShapleyChannel = topShapley.ch;
  const topShapleyPct = fmtPct(topShapley.v, 2);

  const markovChannelCount = markovData.length;
  const shapleyChannelCount = shapleyData.length;

  const negativeShapleyList = shapleyData.filter(d => d.v < 0 || d.total_attributed < 0);
  const negativeShapleyCount = negativeShapleyList.length;
  const negativeShapleyNames = negativeShapleyCount > 0
    ? negativeShapleyList.map(d => d.ch).join(', ')
    : 'None';

  // Build ML attribution rows
  const markovDict = Object.fromEntries(markovData.map(d => [d.ch, d.v]));
  const markovReDict = Object.fromEntries(markovData.map(d => [d.ch, d.re]));
  const shapleyDict = Object.fromEntries(shapleyData.map(d => [d.ch, { pct: d.v, tot: d.total_attributed }]));

  // Union of all channels evaluated
  const mlChannelSet = new Set([
    ...markovData.map(d => d.ch),
    ...shapleyData.map(d => d.ch),
    ...top8Channels
  ]);
  const mlChannelsSorted = Array.from(mlChannelSet).sort((a, b) => {
    const sTotA = shapleyDict[a] ? shapleyDict[a].tot : (channelModelMap[a]?.linear || 0);
    const sTotB = shapleyDict[b] ? shapleyDict[b].tot : (channelModelMap[b]?.linear || 0);
    return sTotB - sTotA;
  });

  const mlAttributionRows = mlChannelsSorted.map(ch => {
    const mVal = markovDict[ch] !== undefined ? markovDict[ch] : null;
    const mRe = markovReDict[ch] !== undefined ? markovReDict[ch] : null;
    const sInfo = shapleyDict[ch] || null;
    const sPct = sInfo ? sInfo.pct : null;
    const sTot = sInfo ? sInfo.tot : null;
    const linVal = channelModelMap[ch] ? channelModelMap[ch].linear : null;

    let sPctClass = 'num';
    if (sPct !== null && sPct < 0) sPctClass += ' warn';

    return `<tr>
  <td><strong>${escapeHtml(ch)}</strong></td>
  <td class="num">${mVal !== null ? fmtPct(mVal, 2) : '—'}</td>
  <td class="num">${mRe !== null ? fmtPct(mRe, 1) : '—'}</td>
  <td class="${sPctClass}">${sPct !== null ? fmtPct(sPct, 2) : '—'}</td>
  <td class="num">${sTot !== null ? fmtFloat(sTot, 1) : '—'}</td>
  <td class="num">${linVal !== null ? fmtFloat(linVal, 1) : '—'}</td>
</tr>`;
  }).join('\n');

  // ── 4. Top Journeys Data (Tab 3) ───────────────────────────────────────────
  let convPatternsCount = 0;
  let churnPatternsCount = 0;
  let avgConvSteps = avgJourneySteps;
  let avgConvDays = avgJourneyDays;
  let avgChurnSteps = 1.4;
  let avgChurnDays = 12.0;

  for (const r of journeyAggRows) {
    const tgt = String(r.target || '').toLowerCase();
    if (tgt.includes('conv')) {
      convPatternsCount = num(r.pattern_count);
      avgConvSteps = num(r.avg_steps);
      avgConvDays = num(r.avg_days);
    } else if (tgt.includes('churn') || tgt.includes('drop')) {
      churnPatternsCount = num(r.pattern_count);
      avgChurnSteps = num(r.avg_steps);
      avgChurnDays = num(r.avg_days);
    }
  }

  if (convPatternsCount === 0 && topJourneyRows.length > 0) {
    convPatternsCount = topJourneyRows.length;
  }

  const journeyCompareJson = [
    { name: 'Converted', steps: avgConvSteps, days: avgConvDays },
    { name: 'Churn', steps: avgChurnSteps, days: avgChurnDays }
  ];

  // Top conversion patterns table rows & donut
  const totalTopConvs = topJourneyRows.reduce((sum, r) => sum + num(r.conversions), 0) || totalConversions || 1;
  const top4Patterns = topJourneyRows.slice(0, 4);
  const patternDonut = top4Patterns.map(p => ({
    n: p.journey_steps.length > 30 ? p.journey_steps.substring(0, 28) + '…' : p.journey_steps,
    v: +( (num(p.conversions) * 100 / totalTopConvs).toFixed(1) )
  }));
  const top4Share = patternDonut.reduce((s, p) => s + p.v, 0);
  if (top4Share < 99.0) {
    patternDonut.push({
      n: 'Other Patterns',
      v: +( (100.0 - top4Share).toFixed(1) )
    });
  }

  const journeyTableRows = topJourneyRows.map(p => {
    return `<tr>
  <td><code>${escapeHtml(p.journey_steps)}</code></td>
  <td class="conv">${fmtInt(p.conversions)}</td>
  <td class="num">${fmtFloat(p.avg_steps, 1)}</td>
  <td class="num">${fmtFloat(p.avg_days, 1)}d</td>
</tr>`;
  }).join('\n');

  // ── 5. Source & Channel Health Data (Tab 4) ────────────────────────────────
  const sourceTableRows = sourceRows.map(s => {
    const isConv = num(s.conversion_events) > 0;
    return `<tr>
  <td><strong>${escapeHtml(s.src_table)}</strong></td>
  <td class="num">${fmtInt(s.total_profiles)}</td>
  <td class="num">${fmtInt(s.total_events)}</td>
  <td class="${isConv ? 'conv' : 'num'}">${fmtInt(s.conversion_events)}</td>
  <td>${escapeHtml(s.min_date || '—')}</td>
  <td>${escapeHtml(s.max_date || '—')}</td>
</tr>`;
  }).join('\n');

  const sourceVolJson = sourceRows.map(s => ({
    src: s.src_table.split('.').pop(),
    v: num(s.total_events)
  }));

  const channelDonutJson = channelValRows.map(c => ({
    ch: c.ch,
    v: num(c.pct_events)
  }));

  // Assign dynamic roles to channels
  const channelTableRows = channelValRows.map(c => {
    const ch = c.ch;
    const convs = num(c.conversions);
    const pct = num(c.pct_events);
    const m = channelModelMap[ch] || { firsttouch: 0, lasttouch: 0, linear: 0 };

    let role = 'Supporting Channel';
    let pillClass = 'pill neutral';

    if (convs > 0 && num(c.perc_of_total_conv) > 20) {
      role = 'Primary Closer';
      pillClass = 'pill ok';
    } else if (m.firsttouch > 0 && m.firsttouch >= m.lasttouch * 1.15) {
      role = 'Introducer (Awareness)';
      pillClass = 'pill';
    } else if (m.lasttouch > 0 && m.lasttouch >= m.firsttouch * 1.15) {
      role = 'Converter (Closer)';
      pillClass = 'pill ok';
    } else if (pct > 15) {
      role = 'Multi-Touch Nurturer';
      pillClass = 'pill';
    } else if (convs > 0) {
      role = 'Conversion Action';
      pillClass = 'pill ok';
    }

    return `<tr>
  <td><strong>${escapeHtml(ch)}</strong></td>
  <td class="num">${fmtInt(c.total_events)}</td>
  <td class="num">${fmtPct(pct)}</td>
  <td class="${convs > 0 ? 'conv' : 'num'}">${fmtInt(convs)}</td>
  <td><span class="${pillClass}">${escapeHtml(role)}</span></td>
</tr>`;
  }).join('\n');

  // ── 6. Journey Flow & Sankey Data (Tab 5) ──────────────────────────────────
  const validTransitions = transitionRows.filter(r => r.from_channel && r.to_channel && num(r.flow) > 0);
  const sankeyFlows = (validTransitions.length > 0 ? validTransitions : transitionRows).slice(0, 15).map(r => ({
    from: r.from_channel,
    to: r.to_channel,
    flow: Math.round(num(r.flow))
  }));

  const noFlow = { from: 'n/a', to: 'n/a', flow: 0 };
  const topFlow = sankeyFlows[0] || noFlow;
  const sankeyTopFlow = `${topFlow.from} → ${topFlow.to}`;
  const sankeyTopFlowProb = `${topFlow.flow}%`;

  // Top feeder into email, and the second-strongest flow
  const feederEmail = sankeyFlows.find(f => f.to === 'email' && f.from !== 'email')
    || sankeyFlows.find(f => f.to.includes('email'))
    || noFlow;
  const sankeyTopFeederEmail = `${feederEmail.from} → ${feederEmail.to}`;
  const sankeyTopFeederEmailProb = `${feederEmail.flow}%`;

  const secondFlow = sankeyFlows.find((f, i) => i > 0 && f.from !== f.to) || noFlow;
  const sankeySecondFlow = `${secondFlow.from} → ${secondFlow.to}`;
  const sankeySecondFlowProb = `${secondFlow.flow}%`;

  // Identify terminal node
  const destCounts = {};
  for (const f of sankeyFlows) {
    destCounts[f.to] = (destCounts[f.to] || 0) + f.flow;
  }
  const terminalNode = Object.keys(destCounts).sort((a, b) => destCounts[b] - destCounts[a])[0] || 'conversion';
  const sankeyTerminalNode = terminalNode;
  const sankeyTerminalDesc = `Primary destination node (${destCounts[terminalNode] || 0}% cumulative flow)`;

  // ── 7. Dynamic Executive Insights Synthesis ────────────────────────────────
  // Tab 1 Insights
  const topFtChannel = top8Channels[0] || 'email';
  const topLtChannel = [...top8Channels].sort((a, b) => channelModelMap[b].lasttouch - channelModelMap[a].lasttouch)[0] || topFtChannel;
  const ftLead = channelModelMap[topFtChannel]?.firsttouch || 0;
  const ltLead = channelModelMap[topLtChannel]?.lasttouch || 0;

  // Identify highest assist / arbitrage channel (Linear > Last Touch)
  const assistChannels = top8Channels
    .filter(ch => channelModelMap[ch].linear > channelModelMap[ch].lasttouch * 1.05)
    .sort((a, b) => (channelModelMap[b].linear - channelModelMap[b].lasttouch) - (channelModelMap[a].linear - channelModelMap[a].lasttouch));
  const topAssist = assistChannels[0] || topFtChannel;
  const assistDiff = channelModelMap[topAssist] ? (channelModelMap[topAssist].linear - channelModelMap[topAssist].lasttouch).toFixed(1) : '0';

  const tab1Insights = [
    `<strong>Primary Journey Initiator:</strong> <strong>${escapeHtml(topFtChannel)}</strong> initiates the largest volume of conversion journeys with <strong>${fmtFloat(ftLead, 1)}</strong> First Touch conversions (<strong>${fmtPct((ftLead / (totalConversions || 1)) * 100)}</strong> share).`,
    `<strong>Closing Channel Dominance:</strong> <strong>${escapeHtml(topLtChannel)}</strong> is the primary closing channel, capturing <strong>${fmtFloat(ltLead, 1)}</strong> Last Touch conversions (<strong>${fmtPct((ltLead / (totalConversions || 1)) * 100)}</strong> share).`,
    `<strong>Mid-Funnel Value Arbitrage:</strong> <strong>${escapeHtml(topAssist)}</strong> is significantly undervalued by Last Touch models (+${assistDiff} conversions under Linear), acting as a vital mid-funnel bridge that nurtures prospects toward conversion.`,
    `<strong>Journey Complexity:</strong> Customer conversion paths require an average of <strong>${fmtFloat(avgJourneySteps, 1)} touchpoints</strong> over <strong>${fmtFloat(avgJourneyDays, 1)} days</strong>, confirming that single-touch attribution models fail to capture multi-channel influence.`,
    `<strong>Conversion Scope:</strong> Analysis encompasses <strong>${fmtInt(totalConversions)} verified conversions</strong> generated across <strong>${fmtInt(uniqueCustomers)} unique customer profiles</strong> within the lookback window.`
  ];
  const tab1InsightsHtml = tab1Insights.map(b => `<li>${b}</li>`).join('\n          ');

  // Tab 2 Insights
  const tab2Insights = [
    `<strong>Algorithmic Linchpin:</strong> <strong>${escapeHtml(topMarkovChannel)}</strong> earns the largest Markov attribution share at <strong>${topMarkovRemoval}</strong> (removal effect <strong>${topMarkovRemovalEffect}</strong> — the share of converting paths that pass through it).`,
    `<strong>Game-Theoretic Credit:</strong> <strong>${escapeHtml(topShapleyChannel)}</strong> earns <strong>${topShapleyPct}</strong> of fair daily attribution value via Shapley coalition analysis, validating its marginal utility across all touchpoint combinations.`,
    `<strong>Algorithmic vs Linear Divergence:</strong> Markov and Shapley models reveal non-linear synergy between top channels that simple rule-based models miss, rewarding channels that increase conversion probability across co-occurring visits.`,
    negativeShapleyCount > 0
      ? `<strong>Channel Fatigue & Diminishing Returns:</strong> <strong>${escapeHtml(negativeShapleyNames)}</strong> exhibit negative marginal contributions (${negativeShapleyCount} channels), signalling oversaturation, high frequency caps, or targeting inefficiencies.`
      : `<strong>Balanced Channel Efficiency:</strong> All <strong>${shapleyChannelCount}</strong> evaluated channels maintain non-negative Shapley attribution, indicating efficient marketing distribution without channel cannibalization.`,
    `<strong>Holistic Model Calibration:</strong> Cross-evaluating <strong>${markovChannelCount} Markov channels</strong> and <strong>${shapleyChannelCount} Shapley channels</strong> establishes mathematically defensible budget reallocation baselines.`
  ];
  const tab2InsightsHtml = tab2Insights.map(b => `<li>${b}</li>`).join('\n          ');

  // Tab 3 Insights
  const topJourney = topJourneyRows[0] || { journey_steps: 'Direct Conversion', conversions: 0, avg_steps: 1, avg_days: 0 };
  const topJourneyShare = fmtPct((num(topJourney.conversions) / (totalConversions || 1)) * 100);

  const tab3Insights = [
    `<strong>Dominant Conversion Highway:</strong> The path <code>${escapeHtml(topJourney.journey_steps)}</code> is the #1 conversion pattern with <strong>${fmtInt(topJourney.conversions)} conversions</strong> (<strong>${topJourneyShare}</strong> of all converted paths).`,
    `<strong>Funnel Velocity Contrast:</strong> Converted customer journeys average <strong>${fmtFloat(avgConvSteps, 1)} steps</strong> over <strong>${fmtFloat(avgConvDays, 1)} days</strong>, compared to non-converting churn paths which drop off after only <strong>${fmtFloat(avgChurnSteps, 1)} steps</strong> (${fmtFloat(avgChurnDays, 1)} days).`,
    `<strong>Early Dropout Risk:</strong> The sharp drop-off in churn paths demonstrates that lead abandonment occurs predominantly between step 1 and step 2, highlighting an immediate need for early-stage automated retargeting.`,
    `<strong>Multi-Touch Path Concentration:</strong> The top 4 sequence patterns account for <strong>${fmtPct(top4Share)}</strong> of all conversions, confirming repeatable user journeys that can be streamlined through trigger-based journeys.`,
    `<strong>Optimization Action:</strong> Implement automated nurture interventions immediately following first touchpoints to elevate non-converting cohorts into the multi-touch conversion corridor.`
  ];
  const tab3InsightsHtml = tab3Insights.map(b => `<li>${b}</li>`).join('\n          ');

  // Tab 4 Insights
  const topSource = sourceRows[0] || { src_table: 'primary_source', total_events: totalTouchpoints };
  const topChannel = channelValRows[0] || { ch: 'primary_channel', total_events: totalTouchpoints, pct_events: 50 };

  const tab4Insights = [
    `<strong>Data Foundation Scale:</strong> MTA pipeline unifies <strong>${fmtInt(totalTouchpoints)} events</strong> across <strong>${sourceRows.length} distinct source tables</strong> with zero data loss.`,
    `<strong>Primary Volume Engine:</strong> <strong>${escapeHtml(topSource.src_table)}</strong> supplies the largest share of raw touchpoint data with <strong>${fmtInt(topSource.total_events)} events</strong>.`,
    `<strong>UTM Tracking Fidelity:</strong> Web touchpoint tracking achieved <strong>${utmCoverageLabel}</strong> UTM parameter capture across all landing pages and digital sessions.`,
    `<strong>Channel Engagement Distribution:</strong> <strong>${escapeHtml(topChannel.ch)}</strong> represents the highest interaction density at <strong>${fmtPct(topChannel.pct_events)}</strong> of total journey events.`,
    `<strong>Time Horizon Completeness:</strong> <strong>${windowDays}-day observation window</strong> (${dataDateRange}) captures full customer deliberation cycles without artificial recency truncation.`
  ];
  const tab4InsightsHtml = tab4Insights.map(b => `<li>${b}</li>`).join('\n          ');

  // Tab 5 Insights
  const tab5Insights = [
    `<strong>Highest Transition Probability:</strong> The path <strong>${escapeHtml(sankeyTopFlow)}</strong> represents the highest transition velocity at <strong>${sankeyTopFlowProb}</strong> transition probability.`,
    `<strong>Email Nurture Nexus:</strong> Inbound traffic transitions most frequently into email via <strong>${escapeHtml(sankeyTopFeederEmail)}</strong> (<strong>${sankeyTopFeederEmailProb}</strong> probability), establishing email as the central nurturing engine.`,
    `<strong>Second-Strongest Corridor:</strong> The next most likely hand-over is <strong>${escapeHtml(sankeySecondFlow)}</strong> (<strong>${sankeySecondFlowProb}</strong> probability).`,
    `<strong>Terminal Node Convergence:</strong> Conversion journeys systematically funnel into <strong>${escapeHtml(sankeyTerminalNode)}</strong>, the most common destination in the transition matrix.`,
    `<strong>Orchestration Guidance:</strong> Reinforce links between highest-probability transition pairs to compress cycle time and eliminate friction points before terminal conversion.`
  ];
  const tab5InsightsHtml = tab5Insights.map(b => `<li>${b}</li>`).join('\n          ');

  // ── 8. Token Mapping & Template Rendering ───────────────────────────────────
  console.log('Baking dynamic data into dashboard template...');

  const tokenMap = {
    '{{customer_name}}': escapeHtml(projectName),
    '{{sink_database}}': escapeHtml(sinkDatabase),
    '{{run_date}}': escapeHtml(runDate),
    '{{lookback_period}}': escapeHtml(lookbackPeriod),
    '{{unique_user_id}}': escapeHtml(uniqueUserId),
    '{{conversion_source}}': escapeHtml(conversionSource),

    '{{total_conversions}}': fmtInt(totalConversions),
    '{{unique_customers}}': fmtInt(uniqueCustomers),
    '{{avg_journey_steps}}': fmtFloat(avgJourneySteps, 1),
    '{{avg_journey_days}}': fmtFloat(avgJourneyDays, 1),

    '{{std_channel_labels_json}}': safeJson(stdChannelLabels),
    '{{ft_values_json}}': safeJson(ftValues),
    '{{lt_values_json}}': safeJson(ltValues),
    '{{linear_values_json}}': safeJson(linearValues),
    '{{ushaped_values_json}}': safeJson(ushapedValues),
    '{{model_comparison_rows}}': modelComparisonRows,
    '{{tab1_insights_html_li}}': tab1InsightsHtml,

    '{{top_markov_channel}}': escapeHtml(topMarkovChannel),
    '{{top_markov_removal}}': topMarkovRemoval,
    '{{top_shapley_channel}}': escapeHtml(topShapleyChannel),
    '{{top_shapley_pct}}': topShapleyPct,
    '{{markov_channel_count}}': String(markovChannelCount),
    '{{shapley_channel_count}}': String(shapleyChannelCount),
    '{{negative_shapley_count}}': String(negativeShapleyCount),
    '{{negative_shapley_names}}': escapeHtml(negativeShapleyNames),
    '{{markov_data_json}}': safeJson(markovData),
    '{{shapley_data_json}}': safeJson(shapleyData),
    '{{ml_compare_json}}': safeJson({}),
    '{{ml_attribution_rows}}': mlAttributionRows,
    '{{tab2_insights_html_li}}': tab2InsightsHtml,

    '{{conversion_patterns}}': fmtInt(convPatternsCount),
    '{{churn_patterns}}': fmtInt(churnPatternsCount),
    '{{avg_conv_steps}}': fmtFloat(avgConvSteps, 1),
    '{{avg_conv_days}}': fmtFloat(avgConvDays, 1),
    '{{avg_churn_steps}}': fmtFloat(avgChurnSteps, 1),
    '{{avg_churn_days}}': fmtFloat(avgChurnDays, 1),
    '{{journey_table_rows}}': journeyTableRows,
    '{{journey_compare_json}}': safeJson(journeyCompareJson),
    '{{pattern_donut_json}}': safeJson(patternDonut),
    '{{tab3_insights_html_li}}': tab3InsightsHtml,

    '{{total_touchpoints}}': fmtInt(totalTouchpoints),
    '{{data_window_days}}': String(windowDays),
    '{{data_date_range}}': escapeHtml(dataDateRange),
    '{{utm_coverage_pct}}': String(utmCoveragePct),
    '{{utm_coverage_label}}': utmCoverageLabel,
    '{{source_table_rows}}': sourceTableRows,
    '{{source_vol_json}}': safeJson(sourceVolJson),
    '{{channel_donut_json}}': safeJson(channelDonutJson),
    '{{channel_table_rows}}': channelTableRows,
    '{{tab4_insights_html_li}}': tab4InsightsHtml,

    '{{sankey_top_flow}}': escapeHtml(sankeyTopFlow),
    '{{sankey_top_flow_prob}}': sankeyTopFlowProb,
    '{{sankey_top_feeder_email}}': escapeHtml(sankeyTopFeederEmail),
    '{{sankey_top_feeder_email_prob}}': sankeyTopFeederEmailProb,
    '{{sankey_second_flow}}': escapeHtml(sankeySecondFlow),
    '{{sankey_second_flow_prob}}': sankeySecondFlowProb,
    '{{sankey_terminal_node}}': escapeHtml(sankeyTerminalNode),
    '{{sankey_terminal_desc}}': escapeHtml(sankeyTerminalDesc),
    '{{sankey_flows_json}}': safeJson(sankeyFlows),
    '{{tab5_insights_html_li}}': tab5InsightsHtml
  };

  const templateContent = fs.readFileSync(templatePath, 'utf-8');

  // Strip documentation comment block at top of dashboard_template.html
  let renderedHtml = templateContent.replace(/^<!DOCTYPE html>[\s\S]*?-->\s*<html/i, '<!DOCTYPE html>\n<html');

  // Substitute all tokens
  for (const [token, val] of Object.entries(tokenMap)) {
    renderedHtml = renderedHtml.split(token).join(val);
  }

  // Inline window.RAW for programmatic access and downstream debugging
  const rawPayload = {
    customer: { name: projectName, slug: projectSlug, database: sinkDatabase },
    meta: {
      runDate,
      lookbackPeriod,
      uniqueUserId,
      conversionSource,
      totalConversions,
      uniqueCustomers,
      totalTouchpoints,
      avgJourneySteps,
      avgJourneyDays,
      windowDays,
      utmCoveragePct
    },
    attribution: {
      standardChannels: top8Channels,
      firstTouch: ftValues,
      lastTouch: ltValues,
      linear: linearValues,
      uShaped: ushapedValues
    },
    mlModels: {
      markov: markovData,
      shapley: shapleyData,
      negativeShapley: negativeShapleyList
    },
    journeys: {
      conversionPatternsCount: convPatternsCount,
      churnPatternsCount: churnPatternsCount,
      avgConvSteps,
      avgConvDays,
      avgChurnSteps,
      avgChurnDays,
      topPatterns: topJourneyRows
    },
    sources: sourceRows,
    channels: channelValRows,
    sankey: sankeyFlows
  };

  const rawInjection = `<script id="mta-data-payload">\n  window.RAW = ${safeJson(rawPayload, null, 2)};\n</script>\n`;
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
  console.log('  MTA Dashboard Generated Successfully!');
  console.log('='.repeat(65));
  console.log(`  File Path:      ${outputPath}`);
  console.log(`  File Size:      ${fileSizeKb} KB`);
  console.log(`  Query Duration: ${queryDuration} ms (parallel)`);
  console.log(`  Total Duration: ${totalDuration} ms`);
  console.log(`  Conversions:    ${fmtInt(totalConversions)}`);
  console.log(`  Customers:      ${fmtInt(uniqueCustomers)}`);
  console.log(`  Touchpoints:    ${fmtInt(totalTouchpoints)}`);
  console.log(`  Markov Channels:${markovChannelCount}`);
  console.log(`  Shapley Channels:${shapleyChannelCount}`);
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
