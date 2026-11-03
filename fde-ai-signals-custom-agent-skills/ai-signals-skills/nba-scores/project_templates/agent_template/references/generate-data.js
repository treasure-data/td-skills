#!/usr/bin/env node
/**
 * NBA Engagement Scores Dashboard Data Generator (Parallel Query Engine)
 *
 * Concurrently queries customer NBA output tables via tdx CLI and dynamically
 * bakes metrics, chart datasets, and executive insights into the NBA Summary Dashboard template.
 *
 * Usage:
 *   node generate-data.js <sink_database> [project_slug] [project_name]
 *   SOURCE_DB=<sink_database> node generate-data.js [project_slug] [project_name]
 *
 * Examples:
 *   node generate-data.js nba_output loyalty-nba-scores "Loyalty NBA Scores"
 *   SOURCE_DB=nba_output node generate-data.js loyalty-nba-scores "Loyalty NBA Scores"
 *
 * Output (default): <cwd>/agent_outputs/<project_slug>/dashboards/nba_summary_dashboard.html
 * Run from the engagement working directory so the dashboard lands in the git-ignored agent_outputs/ folder.
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
NBA Engagement Scores Dashboard Data Generator (Parallel Query Engine)

Usage:
  node generate-data.js <sink_database> [project_slug] [project_name]
  SOURCE_DB=<sink_database> node generate-data.js [project_slug] [project_name]

Arguments:
  sink_database    Treasure Data database where NBA output tables reside (required, or env SOURCE_DB)
  project_slug    Project slug, names the output folder (default: "nba-scores")
  project_name    Project display name in the dashboard header (default: Title-cased slug)

Options:
  -o, --output     Custom output file path
                   (default: ./agent_outputs/<project_slug>/dashboards/nba_summary_dashboard.html)
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
let verbose = false;

const posArgs = [];
for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (arg === '-o' || arg === '--output') {
    customOutput = args[++i];
  } else if (arg === '-t' || arg === '--template') {
    customTemplate = args[++i];
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
  console.error('\x1b[31mError: sink_database is required (first argument or SOURCE_DB env var).\x1b[0m');
  process.exitCode = 1;
  printHelp();
}

if (!projectSlug) {
  projectSlug = 'nba-scores';
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
  : path.join(defaultOutputDir, 'nba_summary_dashboard.html');

if (!fs.existsSync(templatePath)) {
  console.error(`\x1b[31mError: Template not found at: ${templatePath}\x1b[0m`);
  process.exit(1);
}

console.log('='.repeat(65));
console.log('  NBA Scores Dashboard Data Generator (Parallel Mode)');
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

function fmtPct(v) {
  return num(v).toFixed(1) + '%';
}

function fmtCurrency(v) {
  const n = Math.round(num(v));
  return '$' + n.toLocaleString('en-US');
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

// ── Parallel Query Tasks ────────────────────────────────────────────────────
async function fetchQ1() {
  const sql = `
    SELECT session_id, profiles_scored, event_lookback_days, new_customers_days,
           time_filter_type, lookback_period, time_range_start_date,
           time_range_end_date,
           TD_TIME_FORMAT(time, 'yyyy-MM-dd HH:mm', 'UTC') AS run_time
    FROM ${sinkDatabase}.nba_dash_model_metrics
    WHERE session_id = (SELECT MAX(session_id) FROM ${sinkDatabase}.nba_dash_model_metrics)
    LIMIT 1
  `;
  return runTdxQueryAsync(sql, 'Q1: Latest session config & metadata');
}

async function fetchQ2() {
  const sql = `
    SELECT source_table, num_events, unique_profiles, total_conversions, total_spend,
           day_range, min_date, max_date
    FROM ${sinkDatabase}.nba_dash_source_tables
    WHERE session_id = (SELECT MAX(session_id) FROM ${sinkDatabase}.nba_dash_model_metrics)
    ORDER BY num_events DESC
  `;
  return runTdxQueryAsync(sql, 'Q2: Per-source volumes for latest run');
}

async function fetchQ3() {
  const sql = `
    SELECT metric_name, metric_value, profile_count, converted_users
    FROM ${sinkDatabase}.nba_dash_stats_summary
    WHERE session_id = (SELECT MAX(session_id) FROM ${sinkDatabase}.nba_dash_model_metrics)
      AND metric_name IN ('conversion_flag','ad_engagement_flag',
          'recent_ad_engagement_flag','recent_purchase_flag','cart_abandon_flag',
          'new_visitor_flag','no_ads_or_purchases_flag')
    ORDER BY metric_name, metric_value
  `;
  return runTdxQueryAsync(sql, 'Q3: All 7 engagement flags for latest run');
}

async function fetchQ4() {
  const sql = `
    SELECT metric_name, metric_value, profile_count, converted_users
    FROM ${sinkDatabase}.nba_dash_stats_summary
    WHERE session_id = (SELECT MAX(session_id) FROM ${sinkDatabase}.nba_dash_model_metrics)
      AND metric_name IN ('next_best_channel','next_best_time','next_best_campaign')
    ORDER BY metric_name, profile_count DESC
  `;
  return runTdxQueryAsync(sql, 'Q4: NBA pick fields for latest run');
}

async function fetchQ5() {
  const sql = `
    SELECT m.session_id,
           TD_TIME_FORMAT(MAX(m.time), 'yyyy-MM-dd', 'UTC') AS run_date,
           COALESCE(MAX(s.total_profiles), MAX(m.profiles_scored)) AS profiles_scored
    FROM ${sinkDatabase}.nba_dash_model_metrics m
    LEFT JOIN (
      SELECT session_id, SUM(profile_count) AS total_profiles
      FROM ${sinkDatabase}.nba_dash_stats_summary
      WHERE metric_name = 'conversion_flag'
      GROUP BY session_id
    ) s ON m.session_id = s.session_id
    GROUP BY m.session_id
    ORDER BY m.session_id ASC
  `;
  return runTdxQueryAsync(sql, 'Q5: Run inventory for Historic Tracker');
}

async function fetchQ6() {
  const sql = `
    SELECT session_id, metric_name, metric_value, profile_count
    FROM ${sinkDatabase}.nba_dash_stats_summary
    WHERE metric_name IN ('next_best_channel','next_best_time','next_best_campaign')
    ORDER BY session_id ASC, metric_name, profile_count DESC
  `;
  return runTdxQueryAsync(sql, 'Q6: Pick-field distributions across all runs');
}

async function fetchQ7() {
  const sql = `
    SELECT session_id, metric_name, profile_count, converted_users
    FROM ${sinkDatabase}.nba_dash_stats_summary
    WHERE metric_value = '1'
      AND metric_name IN ('conversion_flag','ad_engagement_flag',
          'recent_ad_engagement_flag','recent_purchase_flag','cart_abandon_flag',
          'new_visitor_flag','no_ads_or_purchases_flag')
    ORDER BY session_id ASC, metric_name
  `;
  return runTdxQueryAsync(sql, 'Q7: Flag rates across all runs');
}

// ── Main Execution Controller ───────────────────────────────────────────────
async function main() {
  const startTime = Date.now();
  console.log(`Executing 7 queries in parallel against ${sinkDatabase}...`);

  // Run all 7 queries simultaneously
  const [
    q1Rows,
    q2SrcRows,
    q3FlagRows,
    q4PickRows,
    q5RunRows,
    q6HistPickRows,
    q7HistFlagRows
  ] = await Promise.all([
    fetchQ1(),
    fetchQ2(),
    fetchQ3(),
    fetchQ4(),
    fetchQ5(),
    fetchQ6(),
    fetchQ7()
  ]);

  const queryDuration = Date.now() - startTime;
  console.log(`✔ All queries resolved concurrently in ${queryDuration} ms!`);

  if (q1Rows.length === 0) {
    console.error(`\x1b[31mError: No records found in ${sinkDatabase}.nba_dash_model_metrics.\x1b[0m`);
    console.error(`Please verify that the NBA workflow has completed successfully in ${sinkDatabase}.`);
    process.exit(1);
  }

  const q1 = q1Rows[0];
  const sessionId = String(q1.session_id);
  const runTimeUtc = q1.run_time || new Date().toISOString().replace('T', ' ').substring(0, 16) + ' UTC';
  const eventLookbackDays = num(q1.event_lookback_days) || 90;
  const newCustomersDays = num(q1.new_customers_days) || 45;
  const newCustomersDaysNote = newCustomersDays !== 45 ? '<span class="pill warn">override from default 45</span>' : '';
  const scoringLogic = process.env.SCORING_LOGIC || 'quartile';
  const createDashboard = 'yes';

  // Format time filter summary
  let timeFilterSummary = 'all history (no filter)';
  const tfType = (q1.time_filter_type || '').toLowerCase();
  if (tfType === 'range') {
    const start = q1.time_range_start_date || 'earliest';
    let end = q1.time_range_end_date || 'latest';
    if (end.startsWith('2222') || end.startsWith('2099')) end = 'latest';
    timeFilterSummary = `range · ${start} → ${end}`;
  } else if (tfType === 'interval') {
    timeFilterSummary = `interval · ${q1.lookback_period || '-180d'}`;
  } else if (q1.time_filter_type) {
    timeFilterSummary = q1.time_filter_type;
  }

  console.log('Processing query data and calculating metrics...');

  // ── Tab 1: Source Tables & Ingestion Coverage ─────────────────────────────
  let totalSourceEvents = 0;
  let maxDayRange = 0;
  let minDateOverall = null;
  let maxDateOverall = null;

  const sources = q2SrcRows.map(r => {
    const events = num(r.num_events);
    const profiles = num(r.unique_profiles);
    const conversions = num(r.total_conversions);
    const spend = num(r.total_spend);
    const days = num(r.day_range);

    totalSourceEvents += events;
    if (days > maxDayRange) maxDayRange = days;

    const minD = r.min_date ? String(r.min_date).substring(0, 10) : '';
    const maxD = r.max_date ? String(r.max_date).substring(0, 10) : '';
    if (minD && (!minDateOverall || minD < minDateOverall)) minDateOverall = minD;
    if (maxD && (!maxDateOverall || maxD > maxDateOverall)) maxDateOverall = maxD;

    return {
      source_table: r.source_table,
      num_events: events,
      unique_profiles: profiles,
      total_conversions: conversions,
      total_spend: spend,
      day_range: days,
      min_date: minD,
      max_date: maxD,
      date_range: (minD && maxD) ? `${minD} → ${maxD}` : 'All available'
    };
  });

  const dateRangeSummary = (minDateOverall && maxDateOverall)
    ? `${minDateOverall} → ${maxDateOverall}`
    : 'All available';
  const dateRangeDays = maxDayRange || 365;

  // Source horizontal bars (ASC order for hbar so highest volume appears at top)
  const srcByEventsAsc = [...sources].sort((a, b) => a.num_events - b.num_events);
  const sourceEventsLabels = srcByEventsAsc.map(s => s.source_table);
  const sourceEventsValues = srcByEventsAsc.map(s => s.num_events);
  const sourceEventsText = srcByEventsAsc.map(s => fmtInt(s.num_events));

  const srcByProfilesAsc = [...sources].sort((a, b) => a.unique_profiles - b.unique_profiles);
  const sourceProfilesLabels = srcByProfilesAsc.map(s => s.source_table);
  const sourceProfilesValues = srcByProfilesAsc.map(s => s.unique_profiles);
  const sourceProfilesText = srcByProfilesAsc.map(s => fmtInt(s.unique_profiles));

  // Source table rows (DESC by num_events)
  const srcByEventsDesc = [...sources].sort((a, b) => b.num_events - a.num_events);
  const sourceTableRows = srcByEventsDesc.map(s => {
    const convPill = s.total_conversions > 0 ? ' <span class="pill">conversion</span>' : '';
    return `<tr>
  <td><strong>${escapeHtml(s.source_table)}</strong>${convPill}</td>
  <td class="num">${fmtInt(s.num_events)}</td>
  <td class="num">${fmtInt(s.unique_profiles)}</td>
  <td class="num">${fmtInt(s.total_conversions)}</td>
  <td>${escapeHtml(s.date_range)}</td>
</tr>`;
  }).join('\n');

  // ── Tab 2: Engagement Flags & Population Sizing ────────────────────────────
  const flagMap = {};
  for (const r of q3FlagRows) {
    const name = r.metric_name;
    const val = String(r.metric_value);
    if (!flagMap[name]) flagMap[name] = {};
    flagMap[name][val] = {
      profile_count: num(r.profile_count),
      converted_users: num(r.converted_users)
    };
  }

  // Derive total profiles scored from conversion_flag sum (with fallback to model metrics)
  let profilesScored = 0;
  if (flagMap['conversion_flag']) {
    profilesScored = (flagMap['conversion_flag']['1']?.profile_count || 0) +
                     (flagMap['conversion_flag']['0']?.profile_count || 0);
  }
  if (profilesScored === 0) {
    profilesScored = num(q1.profiles_scored);
  }

  function getFlagStats(name) {
    const f1 = flagMap[name]?.['1'] || { profile_count: 0, converted_users: 0 };
    const count = f1.profile_count;
    const converters = f1.converted_users;
    const pctNum = profilesScored > 0 ? (count / profilesScored) * 100 : 0;
    const pctStr = pctNum.toFixed(1) + '%';
    const convRateStr = count > 0 ? ((converters / count) * 100).toFixed(1) + '%' : '—';
    return { count, converters, pctNum, pctStr, convRateStr };
  }

  const convFlag = getFlagStats('conversion_flag');
  const adEngFlag = getFlagStats('ad_engagement_flag');
  const recAdFlag = getFlagStats('recent_ad_engagement_flag');
  const recPurchFlag = getFlagStats('recent_purchase_flag');
  const cartAbanFlag = getFlagStats('cart_abandon_flag');
  const newVisFlag = getFlagStats('new_visitor_flag');
  const noAdsFlag = getFlagStats('no_ads_or_purchases_flag');

  const FLAGS_CONFIG = [
    { key: 'conversion_flag', label: 'conversion_flag', desc: 'Has converted at least once (lifetime)', stats: convFlag },
    { key: 'ad_engagement_flag', label: 'ad_engagement_flag', desc: 'Engaged with paid/ad channels (lifetime)', stats: adEngFlag },
    { key: 'recent_ad_engagement_flag', label: 'recent_ad_engagement_flag', desc: `Engaged with paid/ad channels in last ${eventLookbackDays}d`, stats: recAdFlag },
    { key: 'recent_purchase_flag', label: 'recent_purchase_flag', desc: `Converted in last ${eventLookbackDays}d`, stats: recPurchFlag },
    { key: 'cart_abandon_flag', label: 'cart_abandon_flag', desc: `Funnel-abandon in last ${eventLookbackDays}d w/o conversion`, stats: cartAbanFlag },
    { key: 'new_visitor_flag', label: 'new_visitor_flag', desc: 'Recent first-visit, no ads, no conversions', stats: newVisFlag },
    { key: 'no_ads_or_purchases_flag', label: 'no_ads_or_purchases_flag', desc: 'Cold / dormant — never engaged ads, never converted', stats: noAdsFlag }
  ];

  const flagsFlaggedJson = FLAGS_CONFIG.map(f => f.stats.count);
  const flagsFlaggedPctJson = FLAGS_CONFIG.map(f => f.stats.pctStr);
  const flagsConvertersJson = FLAGS_CONFIG.map(f => f.stats.converters);

  const flagsTableRows = FLAGS_CONFIG.map(f => `<tr>
  <td><strong>${escapeHtml(f.label)}</strong></td>
  <td>${escapeHtml(f.desc)}</td>
  <td class="num">${fmtInt(f.stats.count)}</td>
  <td class="num">${f.stats.pctStr}</td>
  <td class="num">${fmtInt(f.stats.converters)}</td>
  <td class="num">${f.stats.convRateStr}</td>
</tr>`).join('\n');

  // ── Tab 2: NBA Pick Fields ────────────────────────────────────────────────
  const nbcRows = q4PickRows.filter(r => r.metric_name === 'next_best_channel');
  const nbtRows = q4PickRows.filter(r => r.metric_name === 'next_best_time');
  const nbcampRows = q4PickRows.filter(r => r.metric_name === 'next_best_campaign');

  // Next Best Channel (top 10, ASC for hbar)
  const nbcTop = [...nbcRows].sort((a, b) => num(b.profile_count) - num(a.profile_count)).slice(0, 10);
  const nbcAsc = [...nbcTop].sort((a, b) => num(a.profile_count) - num(b.profile_count));
  const nbcPickLabels = nbcAsc.map(r => r.metric_value);
  const nbcPickValues = nbcAsc.map(r => num(r.profile_count));
  const nbcPickText = nbcAsc.map(r => {
    const cnt = num(r.profile_count);
    const pct = profilesScored > 0 ? ((cnt / profilesScored) * 100).toFixed(1) + '%' : '0.0%';
    return `${fmtInt(cnt)} (${pct})`;
  });

  // Next Best Time (4 dayparts in canonical order)
  const nbtMap = {};
  for (const r of nbtRows) {
    nbtMap[String(r.metric_value).toLowerCase()] = num(r.profile_count);
  }
  const NBT_ORDER = ['morning', 'afternoon', 'evening', 'overnight'];
  const nbtPickLabels = NBT_ORDER;
  const nbtPickValues = NBT_ORDER.map(dp => nbtMap[dp] || 0);
  const nbtPickText = NBT_ORDER.map(dp => {
    const cnt = nbtMap[dp] || 0;
    return profilesScored > 0 ? ((cnt / profilesScored) * 100).toFixed(1) + '%' : '0.0%';
  });

  // Next Best Campaign (DESC for donut chart)
  const nbcampSorted = [...nbcampRows].sort((a, b) => num(b.profile_count) - num(a.profile_count));
  const nbcampPickLabels = nbcampSorted.map(r => r.metric_value);
  const nbcampPickValues = nbcampSorted.map(r => num(r.profile_count));

  // ── Tab 3: Historic Tracker Processing ────────────────────────────────────
  const runCount = q5RunRows.length;
  const historicRunLabels = q5RunRows.map(r => r.run_date || String(r.session_id));
  const historicSessionIds = q5RunRows.map(r => num(r.session_id));
  const historicProfilesScored = q5RunRows.map(r => num(r.profiles_scored));

  const sessionProfileMap = {};
  for (const r of q5RunRows) {
    sessionProfileMap[num(r.session_id)] = num(r.profiles_scored);
  }

  // Top 5 channels from latest run for historic tracking
  const top5Channels = [...nbcRows]
    .sort((a, b) => num(b.profile_count) - num(a.profile_count))
    .slice(0, 5)
    .map(r => r.metric_value);

  const histNbcMatrix = {};
  for (const ch of top5Channels) histNbcMatrix[ch] = {};

  const histNbtMatrix = {};
  for (const dp of NBT_ORDER) histNbtMatrix[dp] = {};

  const histNbcampMatrix = {};
  const allCampaignsSet = new Set();

  for (const r of q6HistPickRows) {
    const sid = num(r.session_id);
    const val = r.metric_value;
    const cnt = num(r.profile_count);
    if (r.metric_name === 'next_best_channel') {
      if (histNbcMatrix[val]) histNbcMatrix[val][sid] = cnt;
    } else if (r.metric_name === 'next_best_time') {
      const dp = (val || '').toLowerCase();
      if (histNbtMatrix[dp]) histNbtMatrix[dp][sid] = cnt;
    } else if (r.metric_name === 'next_best_campaign') {
      allCampaignsSet.add(val);
      if (!histNbcampMatrix[val]) histNbcampMatrix[val] = {};
      histNbcampMatrix[val][sid] = cnt;
    }
  }

  const historicNbcSeries = top5Channels.map(ch => ({
    name: ch,
    values: historicSessionIds.map(sid => histNbcMatrix[ch][sid] || 0)
  }));

  const historicNbtSeries = NBT_ORDER.map(dp => ({
    name: dp,
    values: historicSessionIds.map(sid => histNbtMatrix[dp][sid] || 0)
  }));

  const historicNbcampSeries = Array.from(allCampaignsSet).map(camp => ({
    name: camp,
    values: historicSessionIds.map(sid => histNbcampMatrix[camp]?.[sid] || 0)
  }));

  // Historical flag rates (percentage 0-100)
  const histFlagMatrix = {};
  for (const f of FLAGS_CONFIG) {
    histFlagMatrix[f.key] = {};
  }

  for (const r of q7HistFlagRows) {
    const sid = num(r.session_id);
    const name = r.metric_name;
    const cnt = num(r.profile_count);
    const totalInRun = sessionProfileMap[sid] || profilesScored;
    const rate = totalInRun > 0 ? Number(((cnt / totalInRun) * 100).toFixed(1)) : 0;
    if (histFlagMatrix[name]) {
      histFlagMatrix[name][sid] = rate;
    }
  }

  const historicFlagsRates = FLAGS_CONFIG.map(f => ({
    name: f.label,
    values: historicSessionIds.map(sid => histFlagMatrix[f.key][sid] || 0)
  }));

  const historicSingleRunCallout = runCount <= 1
    ? `<div class="callout"><strong>Only one run available.</strong> The Historic Tracker shows the current snapshot. Trend lines will populate after the next workflow run, typically on the monthly schedule. Use Tab 1 and Tab 2 for the full latest-run analysis.</div>`
    : '';

  // ── Dynamic Insight Generation ────────────────────────────────────────────

  // Tab 1 Insights (Input Data Quality, Volumes, Reach, and Coverage)
  const topEventSource = srcByEventsDesc[0] || { source_table: 'primary_events', num_events: 0 };
  const topEventShare = totalSourceEvents > 0 ? ((topEventSource.num_events / totalSourceEvents) * 100).toFixed(1) : '0.0';

  const srcByProfilesDesc = [...sources].sort((a, b) => b.unique_profiles - a.unique_profiles);
  const topProfileSource = srcByProfilesDesc[0] || { source_table: 'primary_profiles', unique_profiles: 0 };
  const topProfileReach = profilesScored > 0 ? ((topProfileSource.unique_profiles / profilesScored) * 100).toFixed(1) : '0.0';

  const convSources = sources.filter(s => s.total_conversions > 0);
  const topConvSource = [...convSources].sort((a, b) => b.total_conversions - a.total_conversions)[0] || { source_table: 'conversions', total_conversions: 0 };

  const avgEventsPerProfile = profilesScored > 0 ? (totalSourceEvents / profilesScored).toFixed(1) : '0.0';

  const tab1InsightsBullets = [
    `<strong>Primary Event Driver:</strong> <strong>${escapeHtml(topEventSource.source_table)}</strong> is the highest-volume ingestion stream, contributing <strong>${fmtInt(topEventSource.num_events)}</strong> events (<strong>${topEventShare}%</strong> of all ${fmtInt(totalSourceEvents)} unioned events).`,
    `<strong>Audience Resolution Reach:</strong> <strong>${escapeHtml(topProfileSource.source_table)}</strong> connects the widest audience base, reaching <strong>${fmtInt(topProfileSource.unique_profiles)}</strong> unique profiles (<strong>${topProfileReach}%</strong> of the ${fmtInt(profilesScored)} scored population).`,
    `<strong>Goal Event Ingestion:</strong> Conversion tracking captures <strong>${fmtInt(topConvSource.total_conversions)}</strong> confirmed goal events across <strong>${convSources.length}</strong> conversion-bearing source table(s), led by <strong>${escapeHtml(topConvSource.source_table)}</strong>.`,
    `<strong>Temporal Coverage:</strong> Unified event activity spans <strong>${dateRangeDays} days</strong> (${dateRangeSummary}), providing complete seasonal context for behavioral scoring.`,
    `<strong>Touchpoint Density:</strong> The customer base averages <strong>${avgEventsPerProfile} interactions per profile</strong> across all unioned sources, creating rich multi-touch signals for channel and daypart affinity.`,
    `<strong>Lookback Windows Applied:</strong> Cart-abandonment logic evaluates a <strong>${eventLookbackDays}-day</strong> event window, and new-visitor classification evaluates a <strong>${newCustomersDays}-day</strong> acquisition threshold.`
  ];
  const tab1InsightsHtml = tab1InsightsBullets.map(b => `<li>${b}</li>`).join('\n          ');

  // Tab 2 Insights (NBA Scores, Channel/Daypart Picks, and Audience Sizing)
  const topChannelPick = nbcRows.sort((a, b) => num(b.profile_count) - num(a.profile_count))[0] || { metric_value: 'organic', profile_count: 0 };
  const topChannelPct = profilesScored > 0 ? ((num(topChannelPick.profile_count) / profilesScored) * 100).toFixed(1) + '%' : '0.0%';

  const topTimePick = [...nbtRows].sort((a, b) => num(b.profile_count) - num(a.profile_count))[0] || { metric_value: 'morning', profile_count: 0 };
  const topTimePct = profilesScored > 0 ? ((num(topTimePick.profile_count) / profilesScored) * 100).toFixed(1) + '%' : '0.0%';

  const topCampaignPick = nbcampSorted[0] || { metric_value: 'Next Best Product', profile_count: 0 };
  const topCampaignPct = profilesScored > 0 ? ((num(topCampaignPick.profile_count) / profilesScored) * 100).toFixed(1) + '%' : '0.0%';
  const secondCampaignPick = nbcampSorted[1] || null;

  const tab2InsightsBullets = [
    `<strong>Channel Affinity Leader:</strong> <strong>${escapeHtml(topChannelPick.metric_value)}</strong> represents the highest-affinity channel for <strong>${fmtInt(topChannelPick.profile_count)}</strong> customers (<strong>${topChannelPct}</strong> of all scored profiles).`,
    `<strong>Optimal Outbound Daypart:</strong> <strong>${escapeHtml(topTimePick.metric_value)}</strong> is the dominant response window, capturing <strong>${fmtInt(topTimePick.profile_count)}</strong> profiles (<strong>${topTimePct}</strong>) and serving as the primary schedule for triggered automations.`,
    `<strong>Campaign Portfolio Mix:</strong> <strong>${escapeHtml(topCampaignPick.metric_value)}</strong> dominates recommendation volume with <strong>${fmtInt(topCampaignPick.profile_count)}</strong> profiles (<strong>${topCampaignPct}</strong>)${secondCampaignPick ? `, followed by <strong>${escapeHtml(secondCampaignPick.metric_value)}</strong> (${fmtInt(secondCampaignPick.profile_count)} profiles)` : ''}.`,
    `<strong>High-Intent Cart Recovery:</strong> <strong>${fmtInt(cartAbanFlag.count)}</strong> profiles (<strong>${cartAbanFlag.pctStr}</strong>) abandoned a funnel interaction without converting in the last ${eventLookbackDays} days; with a historical conversion rate of <strong>${cartAbanFlag.convRateStr}</strong>, automated recovery is the highest immediate yield opportunity.`,
    `<strong>Established Conversion Ground Truth:</strong> <strong>${fmtInt(convFlag.count)}</strong> profiles (<strong>${convFlag.pctStr}</strong>) have completed a lifetime conversion, confirming robust downstream signal for propensity calibration.`,
    `<strong>Paid Retargeting Pool:</strong> <strong>${fmtInt(recAdFlag.count)}</strong> profiles (<strong>${recAdFlag.pctStr}</strong>) interacted with paid campaigns in the past ${eventLookbackDays} days and qualify for high-priority retargeting cadences.`,
    `<strong>Dormant Cohort Management:</strong> <strong>${fmtInt(noAdsFlag.count)}</strong> profiles (<strong>${noAdsFlag.pctStr}</strong>) exhibit zero ad engagement and zero conversions; recommend cost-controlled re-activation or paid ad suppression.`
  ];
  const tab2InsightsHtml = tab2InsightsBullets.map(b => `<li>${b}</li>`).join('\n          ');

  // Tab 3 Insights (Historic Tracking, Drift, and Model Stability)
  let tab3InsightsBullets = [];
  if (runCount <= 1) {
    tab3InsightsBullets = [
      `<strong>Baseline Scored Population:</strong> The initial deployment registers an addressable audience of <strong>${fmtInt(profilesScored)}</strong> unique profiles across ${sources.length} integrated source tables.`,
      `<strong>Channel Affinity Baseline:</strong> <strong>${escapeHtml(topChannelPick.metric_value)}</strong> establishes the lead channel affinity share at <strong>${topChannelPct}</strong>; flag any subsequent shift outside a ±5.0pp corridor as actionable channel drift.`,
      `<strong>Outbound Cadence Standard:</strong> Peak engagement timing is benchmarked at <strong>${escapeHtml(topTimePick.metric_value)}</strong> (<strong>${topTimePct}</strong> of audience), establishing the scheduling control group for journey delivery.`,
      `<strong>Cart-Abandonment Threshold:</strong> Unconverted cart abandonment is calibrated at <strong>${cartAbanFlag.pctStr}</strong> (${fmtInt(cartAbanFlag.count)} profiles); track run-over-run changes to identify seasonal checkout friction.`,
      `<strong>Retargeting Velocity Watch:</strong> Recent ad engagement stands at <strong>${recAdFlag.pctStr}</strong>; track audience migration into active tiers as digital spend expands.`,
      `<strong>Cold Audience Ceiling:</strong> Inactive audience share is established at <strong>${noAdsFlag.pctStr}</strong>; monitor over subsequent runs to guide CRM database hygiene and list maintenance.`
    ];
  } else {
    const prevScored = historicProfilesScored[historicProfilesScored.length - 2] || profilesScored;
    const profileDelta = profilesScored - prevScored;
    const profileDeltaPct = prevScored > 0 ? ((profileDelta / prevScored) * 100).toFixed(1) : '0.0';
    const deltaSign = profileDelta >= 0 ? '+' : '';

    tab3InsightsBullets = [
      `<strong>Population Trajectory:</strong> Scored profiles moved by <strong>${deltaSign}${fmtInt(profileDelta)}</strong> (<strong>${deltaSign}${profileDeltaPct}%</strong>) from previous session to reach <strong>${fmtInt(profilesScored)}</strong> profiles.`,
      `<strong>Channel Affinity Evolution:</strong> <strong>${escapeHtml(topChannelPick.metric_value)}</strong> remains the lead recommendation across historical runs, reflecting consistent channel engagement.`,
      `<strong>Timing Shift Detection:</strong> Optimal daypart concentration continues to peak in <strong>${escapeHtml(topTimePick.metric_value)}</strong>, demonstrating sustained behavioral timing.`,
      `<strong>Flag Rate Movement:</strong> Cart abandonment rate is currently <strong>${cartAbanFlag.pctStr}</strong>, while active ad engagement accounts for <strong>${recAdFlag.pctStr}</strong> of the customer base.`,
      `<strong>Campaign Recommendation Stability:</strong> <strong>${escapeHtml(topCampaignPick.metric_value)}</strong> maintains primary campaign share across consecutive scoring cycles.`,
      `<strong>Configuration Attribution:</strong> Ingestion lookback windows (${eventLookbackDays}d behavioral, ${newCustomersDays}d acquisition) remained consistent across runs, confirming shifts reflect organic audience behavior.`
    ];
  }
  const tab3InsightsHtml = tab3InsightsBullets.map(b => `<li>${b}</li>`).join('\n          ');

  // ── Token Substitution & HTML Generation ────────────────────────────────────
  console.log('Baking dynamic data into dashboard template...');

  const tokenMap = {
    '{{project_name}}': escapeHtml(projectName),
    '{{sink_database}}': escapeHtml(sinkDatabase),
    '{{session_id}}': escapeHtml(sessionId),
    '{{run_time_utc}}': escapeHtml(runTimeUtc),
    '{{profiles_scored}}': fmtInt(profilesScored),
    '{{time_filter_summary}}': escapeHtml(timeFilterSummary),
    '{{scoring_logic}}': escapeHtml(scoringLogic),
    '{{event_lookback_days}}': String(eventLookbackDays),
    '{{new_customers_days}}': String(newCustomersDays),
    '{{new_customers_days_note}}': newCustomersDaysNote,
    '{{create_dashboard}}': createDashboard,
    '{{run_count}}': String(runCount),

    '{{total_source_events}}': fmtInt(totalSourceEvents),
    '{{source_count}}': String(sources.length),
    '{{date_range_days}}': String(dateRangeDays),
    '{{date_range_summary}}': escapeHtml(dateRangeSummary),

    '{{source_events_labels_json}}': safeJson(sourceEventsLabels),
    '{{source_events_values_json}}': safeJson(sourceEventsValues),
    '{{source_events_text_json}}': safeJson(sourceEventsText),
    '{{source_profiles_labels_json}}': safeJson(sourceProfilesLabels),
    '{{source_profiles_values_json}}': safeJson(sourceProfilesValues),
    '{{source_profiles_text_json}}': safeJson(sourceProfilesText),

    '{{source_table_rows}}': sourceTableRows,
    '{{tab1_insights_html_li}}': tab1InsightsHtml,

    '{{converted_count}}': fmtInt(convFlag.count),
    '{{converted_pct}}': convFlag.pctStr,
    '{{cart_abandon_count}}': fmtInt(cartAbanFlag.count),
    '{{cart_abandon_pct}}': cartAbanFlag.pctStr,
    '{{recent_ad_engagement_count}}': fmtInt(recAdFlag.count),
    '{{recent_ad_engagement_pct}}': recAdFlag.pctStr,
    '{{no_ads_or_purchases_count}}': fmtInt(noAdsFlag.count),
    '{{no_ads_or_purchases_pct}}': noAdsFlag.pctStr,

    '{{nbc_pick_labels_json}}': safeJson(nbcPickLabels),
    '{{nbc_pick_values_json}}': safeJson(nbcPickValues),
    '{{nbc_pick_text_json}}': safeJson(nbcPickText),
    '{{nbt_pick_labels_json}}': safeJson(nbtPickLabels),
    '{{nbt_pick_values_json}}': safeJson(nbtPickValues),
    '{{nbt_pick_text_json}}': safeJson(nbtPickText),
    '{{nbcamp_pick_labels_json}}': safeJson(nbcampPickLabels),
    '{{nbcamp_pick_values_json}}': safeJson(nbcampPickValues),

    '{{flags_flagged_json}}': safeJson(flagsFlaggedJson),
    '{{flags_flagged_pct_json}}': safeJson(flagsFlaggedPctJson),
    '{{flags_converters_json}}': safeJson(flagsConvertersJson),
    '{{flags_table_rows}}': flagsTableRows,
    '{{tab2_insights_html_li}}': tab2InsightsHtml,

    '{{historic_run_labels_json}}': safeJson(historicRunLabels),
    '{{historic_session_ids_json}}': safeJson(historicSessionIds),
    '{{historic_profiles_scored_json}}': safeJson(historicProfilesScored),
    '{{historic_nbc_series_json}}': safeJson(historicNbcSeries),
    '{{historic_nbt_series_json}}': safeJson(historicNbtSeries),
    '{{historic_nbcamp_series_json}}': safeJson(historicNbcampSeries),
    '{{historic_flags_rates_json}}': safeJson(historicFlagsRates),
    '{{historic_single_run_callout}}': historicSingleRunCallout,
    '{{tab3_insights_html_li}}': tab3InsightsHtml
  };

  const templateContent = fs.readFileSync(templatePath, 'utf-8');

  // Strip documentation comment block at the top of dashboard_template.html
  let renderedHtml = templateContent.replace(/^<!DOCTYPE html>[\s\S]*?-->\s*<html/i, '<!DOCTYPE html>\n<html');

  // Substitute all tokens
  for (const [token, val] of Object.entries(tokenMap)) {
    renderedHtml = renderedHtml.split(token).join(val);
  }

  // Safety check: ensure zero unreplaced tokens remain
  const unreplaced = renderedHtml.match(/\{\{[a-zA-Z0-9_]+\}\}/g);
  if (unreplaced && unreplaced.length > 0) {
    console.warn(`\x1b[33mWarning: ${unreplaced.length} unreplaced tokens detected:\x1b[0m`, [...new Set(unreplaced)]);
  }

  // Inline structured RAW payload into <head> for programmatic access and debugging
  const rawPayload = {
    project: { name: projectName, slug: projectSlug, database: sinkDatabase },
    meta: {
      sessionId,
      runTime: runTimeUtc,
      profilesScored,
      scoringLogic,
      eventLookbackDays,
      newCustomersDays,
      timeFilterSummary,
      runCount
    },
    sources,
    picks: {
      nextBestChannel: nbcRows,
      nextBestTime: nbtRows,
      nextBestCampaign: nbcampRows
    },
    flags: FLAGS_CONFIG.map(f => ({
      name: f.key,
      label: f.label,
      description: f.desc,
      count: f.stats.count,
      percent: f.stats.pctStr,
      converters: f.stats.converters,
      conversionRate: f.stats.convRateStr
    })),
    historic: {
      runs: historicRunLabels,
      sessions: historicSessionIds,
      profilesScored: historicProfilesScored,
      nbcSeries: historicNbcSeries,
      nbtSeries: historicNbtSeries,
      nbcampSeries: historicNbcampSeries,
      flagsRates: historicFlagsRates
    }
  };

  const rawInjection = `<script id="nba-data-payload">\n  window.RAW = ${safeJson(rawPayload, null, 2)};\n</script>\n`;
  renderedHtml = renderedHtml.replace('</head>', `${rawInjection}</head>`);

  // Write output file
  const targetDir = path.dirname(outputPath);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  // Default location: make sure agent_outputs/ ignores itself so customer data is never committed
  if (!customOutput) {
    const outputsIgnore = path.resolve(workRoot, 'agent_outputs', '.gitignore');
    if (!fs.existsSync(outputsIgnore)) fs.writeFileSync(outputsIgnore, '*\n', 'utf-8');
  }

  fs.writeFileSync(outputPath, renderedHtml, 'utf-8');

  const stats = fs.statSync(outputPath);
  const fileSizeKb = (stats.size / 1024).toFixed(1);
  const totalDuration = Date.now() - startTime;

  console.log('='.repeat(65));
  console.log('  Dashboard Generated Successfully!');
  console.log('='.repeat(65));
  console.log(`  File Path:       ${outputPath}`);
  console.log(`  File Size:       ${fileSizeKb} KB`);
  console.log(`  Query Duration:  ${queryDuration} ms (parallel)`);
  console.log(`  Total Duration:  ${totalDuration} ms`);
  console.log(`  Profiles Scored: ${fmtInt(profilesScored)}`);
  console.log(`  Sources Mapped:  ${sources.length}`);
  console.log(`  Flags Scored:    ${FLAGS_CONFIG.length}`);
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
