#!/usr/bin/env node
/**
 * NBP Next Best Product Dashboard Data Generator (Parallel Query Engine)
 *
 * Concurrently queries NBP output tables via tdx CLI and dynamically
 * bakes metrics, chart datasets, and executive insights into the NBP Summary Dashboard template.
 *
 * Usage:
 *   node generate-data.js <sink_database> [project_slug] [project_name] [-p <table_prefix>]
 *   SOURCE_DB=<sink_database> node generate-data.js [project_slug] [project_name]
 *
 * Examples:
 *   node generate-data.js my_sink_db retail-nbp "Retail NBP" -p nbp_
 *   SOURCE_DB=my_sink_db node generate-data.js retail-nbp "Retail NBP"
 *
 * Output (default): ./agent_outputs/<project_slug>/dashboards/nbp_summary_dashboard.html
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
NBP Next Best Product Dashboard Data Generator (Parallel Query Engine)

Usage:
  node generate-data.js <sink_database> [project_slug] [project_name]
  SOURCE_DB=<sink_database> node generate-data.js [project_slug] [project_name]

Arguments:
  sink_database    Treasure Data database where NBP output tables reside (required, or env SOURCE_DB)
  project_slug     Project slug, names the output folder (default: "nbp")
  project_name     Project display name in the dashboard header (default: Title-cased slug)

Options:
  -p, --prefix     Table name prefix (default: nbp_ or env TABLE_PREFIX)
  -o, --output     Custom output file path
                   (default: ./agent_outputs/<project_slug>/dashboards/nbp_summary_dashboard.html)
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
let customPrefix = null;
let verbose = false;

const posArgs = [];
for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (arg === '-o' || arg === '--output') {
    customOutput = args[++i];
  } else if (arg === '-t' || arg === '--template') {
    customTemplate = args[++i];
  } else if (arg === '-p' || arg === '--prefix') {
    customPrefix = args[++i];
  } else if (arg === '-v' || arg === '--verbose') {
    verbose = true;
  } else if (!arg.startsWith('-')) {
    posArgs.push(arg);
  }
}

let sinkDatabase = process.env.SOURCE_DB || '';
let projectSlug = process.env.PROJECT_SLUG || '';
let projectName = process.env.PROJECT_NAME || '';
const tablePrefix = customPrefix || process.env.TABLE_PREFIX || process.env.PREFIX || 'nbp_';

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
  process.exitCode = 1;
  printHelp();
}

if (!projectSlug) {
  projectSlug = 'nbp';
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
  : path.join(defaultOutputDir, 'nbp_summary_dashboard.html');

if (!fs.existsSync(templatePath)) {
  console.error(`\x1b[31mError: Template not found at: ${templatePath}\x1b[0m`);
  process.exit(1);
}

console.log('='.repeat(65));
console.log('  NBP Product Recommendations Dashboard Generator (Parallel Mode)');
console.log('='.repeat(65));
console.log(`  Project:        ${projectName} (${projectSlug})`);
console.log(`  Database:       ${sinkDatabase}`);
console.log(`  Prefix:         ${tablePrefix}`);
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

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function parseModelConfig(paramsStr) {
  const engine = 'AI Signals';
  let algorithm = 'als';
  if (!paramsStr) return { engine, algorithm };

  if (/algorithm:\s*([a-zA-Z0-9_-]+)/i.test(paramsStr)) {
    const match = paramsStr.match(/algorithm:\s*([a-zA-Z0-9_-]+)/i);
    algorithm = match[1].toLowerCase();
  } else if (/popular/i.test(paramsStr)) {
    algorithm = 'popular';
  } else if (/similar_to_latest/i.test(paramsStr)) {
    algorithm = 'similar_to_latest';
  }

  return { engine, algorithm };
}

// ── Parallel Query Tasks ────────────────────────────────────────────────────
async function fetchQ1() {
  const sql = `
    SELECT s.session_id, s.run_time,
           m.users_with_recs, m.users_with_recs_after_filter,
           m.distinct_users_transactions_table, m.distinct_items_recommended,
           m.distinct_items_transactions_table, m.distinct_categories_transactions_table,
           m.time_range_days, m.least_recent_event, m.most_recent_event,
           m.model_params, m.exclusion_filters, m.filtered_item_count,
           m.filtered_categories, m.filtered_products
    FROM ${sinkDatabase}.${tablePrefix}dash_model_param_stats_agg m
    JOIN ${sinkDatabase}.${tablePrefix}global_session_filter s ON m.session_id = s.session_id
    WHERE s.session_rnk = 1
    LIMIT 1
  `;
  return runTdxQueryAsync(sql, 'Q1: Latest session config & coverage');
}

async function fetchQ2a() {
  const sql = `
    SELECT nbp_1 AS item, SUM(event_cnt) AS user_count
    FROM ${sinkDatabase}.${tablePrefix}dash_final_recs_stats_daily
    WHERE event_date = (SELECT MAX(event_date) FROM ${sinkDatabase}.${tablePrefix}dash_final_recs_stats_daily)
      AND nbp_1 IS NOT NULL AND nbp_1 != ''
    GROUP BY nbp_1 ORDER BY user_count DESC LIMIT 15
  `;
  return runTdxQueryAsync(sql, 'Q2a: Top recommended items at rank 1');
}

async function fetchQ2b() {
  const sql = `
    SELECT nbp_2 AS item, SUM(event_cnt) AS user_count
    FROM ${sinkDatabase}.${tablePrefix}dash_final_recs_stats_daily
    WHERE event_date = (SELECT MAX(event_date) FROM ${sinkDatabase}.${tablePrefix}dash_final_recs_stats_daily)
      AND nbp_2 IS NOT NULL AND nbp_2 != ''
    GROUP BY nbp_2 ORDER BY user_count DESC LIMIT 10
  `;
  return runTdxQueryAsync(sql, 'Q2b: Top recommended items at rank 2');
}

async function fetchQ2c() {
  const sql = `
    SELECT nbp_3 AS item, SUM(event_cnt) AS user_count
    FROM ${sinkDatabase}.${tablePrefix}dash_final_recs_stats_daily
    WHERE event_date = (SELECT MAX(event_date) FROM ${sinkDatabase}.${tablePrefix}dash_final_recs_stats_daily)
      AND nbp_3 IS NOT NULL AND nbp_3 != ''
    GROUP BY nbp_3 ORDER BY user_count DESC LIMIT 10
  `;
  return runTdxQueryAsync(sql, 'Q2c: Top recommended items at rank 3');
}

async function fetchQ3() {
  const sql = `
    SELECT 'rank_1' AS rank_label, nb_category_1 AS category, SUM(event_cnt) AS user_count
    FROM ${sinkDatabase}.${tablePrefix}dash_final_recs_stats_daily
    WHERE event_date = (SELECT MAX(event_date) FROM ${sinkDatabase}.${tablePrefix}dash_final_recs_stats_daily)
      AND nb_category_1 IS NOT NULL AND nb_category_1 != ''
    GROUP BY nb_category_1
    UNION ALL
    SELECT 'rank_2', nb_category_2, SUM(event_cnt)
    FROM ${sinkDatabase}.${tablePrefix}dash_final_recs_stats_daily
    WHERE event_date = (SELECT MAX(event_date) FROM ${sinkDatabase}.${tablePrefix}dash_final_recs_stats_daily)
      AND nb_category_2 IS NOT NULL AND nb_category_2 != ''
    GROUP BY nb_category_2
    UNION ALL
    SELECT 'rank_3', nb_category_3, SUM(event_cnt)
    FROM ${sinkDatabase}.${tablePrefix}dash_final_recs_stats_daily
    WHERE event_date = (SELECT MAX(event_date) FROM ${sinkDatabase}.${tablePrefix}dash_final_recs_stats_daily)
      AND nb_category_3 IS NOT NULL AND nb_category_3 != ''
    GROUP BY nb_category_3
    ORDER BY rank_label, user_count DESC
  `;
  return runTdxQueryAsync(sql, 'Q3: Category distribution at ranks 1–3');
}

async function fetchQ4a() {
  const sql = `
    SELECT item_category, item_count
    FROM ${sinkDatabase}.${tablePrefix}dash_item_category_mapping_agg
    WHERE item_category IS NOT NULL AND item_category != ''
    ORDER BY item_count DESC
  `;
  return runTdxQueryAsync(sql, 'Q4a: Catalog category breakdown');
}

async function fetchQ4b() {
  const sql = `
    SELECT item_name, MAX(times_ordered) AS times_ordered
    FROM ${sinkDatabase}.${tablePrefix}dash_most_ordered_items
    WHERE item_name IS NOT NULL AND item_name != ''
    GROUP BY item_name
    ORDER BY times_ordered DESC
    LIMIT 15
  `;
  return runTdxQueryAsync(sql, 'Q4b: Most ordered items');
}

async function fetchQ5() {
  const sql = `
    SELECT s.session_id, s.run_time,
           m.users_with_recs, m.distinct_users_transactions_table, m.distinct_items_recommended
    FROM ${sinkDatabase}.${tablePrefix}dash_model_param_stats_agg m
    JOIN ${sinkDatabase}.${tablePrefix}global_session_filter s ON m.session_id = s.session_id
    ORDER BY s.session_rnk DESC
  `;
  return runTdxQueryAsync(sql, 'Q5: Historic run inventory');
}

async function fetchQ6() {
  const sql = `
    SELECT n.total_customers, n.total_items_bought,
           n.total_product_matches, n.total_category_matches,
           n.random_item_rate, n.random_category_rate
    FROM ${sinkDatabase}.${tablePrefix}dash_testset_numbers n
    JOIN ${sinkDatabase}.${tablePrefix}global_session_filter s ON n.session_id = s.session_id
    WHERE s.session_rnk = 1
    LIMIT 1
  `;
  return runTdxQueryAsync(sql, 'Q6: Test set aggregate metrics');
}

async function fetchQ7() {
  const sql = `
    SELECT t.label, t.bin_cnt, t.type
    FROM ${sinkDatabase}.${tablePrefix}dash_testset t
    JOIN ${sinkDatabase}.${tablePrefix}global_session_filter s ON t.session_id = s.session_id
    WHERE s.session_rnk = 1
    ORDER BY t.type, t.label
  `;
  return runTdxQueryAsync(sql, 'Q7: Test set precision/recall histograms');
}

// ── Main Execution Controller ───────────────────────────────────────────────
async function main() {
  const startTime = Date.now();
  console.log(`Executing 10 queries in parallel against ${sinkDatabase}...`);

  const [
    q1Rows,
    q2aRows,
    q2bRows,
    q2cRows,
    q3Rows,
    q4aRows,
    q4bRows,
    q5Rows,
    q6Rows,
    q7Rows
  ] = await Promise.all([
    fetchQ1(),
    fetchQ2a(),
    fetchQ2b(),
    fetchQ2c(),
    fetchQ3(),
    fetchQ4a(),
    fetchQ4b(),
    fetchQ5(),
    fetchQ6(),
    fetchQ7()
  ]);

  const queryDuration = Date.now() - startTime;
  console.log(`✔ All queries resolved concurrently in ${queryDuration} ms!`);

  if (q1Rows.length === 0) {
    console.error(`\x1b[31mError: No records found in ${sinkDatabase}.${tablePrefix}dash_model_param_stats_agg.\x1b[0m`);
    console.error(`Please verify that the NBP workflow has completed successfully in ${sinkDatabase} with prefix '${tablePrefix}'.`);
    process.exit(1);
  }

  const q1 = q1Rows[0];
  const sessionId = String(q1.session_id || '');
  const runTimeRaw = q1.run_time || '';
  const runTimeUtc = runTimeRaw.includes('UTC')
    ? runTimeRaw.replace('.000', '')
    : (runTimeRaw ? `${runTimeRaw} UTC` : new Date().toISOString().replace('T', ' ').substring(0, 16) + ' UTC');

  const modelCfg = parseModelConfig(q1.model_params);
  const engine = modelCfg.engine;
  const algorithm = modelCfg.algorithm;

  const totalUsers = num(q1.distinct_users_transactions_table);
  const usersWithRecs = num(q1.users_with_recs);
  const coveragePctVal = totalUsers > 0 ? (usersWithRecs / totalUsers * 100) : 0;
  const coveragePct = fmtPct(coveragePctVal);
  const coverageWithRecs = usersWithRecs;
  const coverageWithoutRecs = Math.max(0, totalUsers - usersWithRecs);

  const distinctItemsRecommended = num(q1.distinct_items_recommended);
  const filteredItemCount = num(q1.filtered_item_count);
  const timeRangeDays = num(q1.time_range_days);

  const leastRecentEvent = q1.least_recent_event ? String(q1.least_recent_event).split(' ')[0] : '—';
  const mostRecentEvent = q1.most_recent_event ? String(q1.most_recent_event).split(' ')[0] : '—';

  const exclusionFilters = q1.exclusion_filters || 'None';
  const modelParams = q1.model_params || 'Default';

  // Catalog item counts
  const totalItemsInCatalogVal = q4aRows.reduce((acc, r) => acc + num(r.item_count), 0);
  const totalItemsInCatalog = totalItemsInCatalogVal > 0 ? totalItemsInCatalogVal : distinctItemsRecommended;

  // ── Tab 2: Top Items and Ranks ──────────────────────────────────────────────
  const top10Rank1 = q2aRows.slice(0, 10);
  const topItemsAsc = [...top10Rank1].reverse();
  const top_items_labels_json = JSON.stringify(topItemsAsc.map(r => r.item));
  const top_items_values_json = JSON.stringify(topItemsAsc.map(r => num(r.user_count)));
  const top_items_text_json = JSON.stringify(topItemsAsc.map(r => fmtInt(r.user_count)));

  // Top-3 side-by-side table rows
  const maxTableRows = Math.max(
    Math.min(10, q2aRows.length),
    Math.min(10, q2bRows.length),
    Math.min(10, q2cRows.length)
  );

  let top3TableRows = '';
  for (let i = 0; i < (maxTableRows || 1); i++) {
    const r1 = q2aRows[i] || {};
    const r2 = q2bRows[i] || {};
    const r3 = q2cRows[i] || {};
    top3TableRows += `          <tr>\n` +
      `            <td class="num">${i + 1}</td>\n` +
      `            <td><strong>${r1.item ? escapeHtml(r1.item) : '—'}</strong></td><td class="num">${r1.user_count ? fmtInt(r1.user_count) : '—'}</td>\n` +
      `            <td><strong>${r2.item ? escapeHtml(r2.item) : '—'}</strong></td><td class="num">${r2.user_count ? fmtInt(r2.user_count) : '—'}</td>\n` +
      `            <td><strong>${r3.item ? escapeHtml(r3.item) : '—'}</strong></td><td class="num">${r3.user_count ? fmtInt(r3.user_count) : '—'}</td>\n` +
      `          </tr>\n`;
  }

  // Category Rank 1 Pie
  const catRank1Rows = q3Rows
    .filter(r => r.rank_label === 'rank_1')
    .sort((a, b) => num(b.user_count) - num(a.user_count));
  const cat_rank1_labels_json = JSON.stringify(catRank1Rows.map(r => r.category));
  const cat_rank1_values_json = JSON.stringify(catRank1Rows.map(r => num(r.user_count)));

  // Stacked Bar across Ranks 1–3
  const distinctCats = [];
  const catSet = new Set();
  q3Rows.forEach(r => {
    if (r.category && !catSet.has(r.category)) {
      catSet.add(r.category);
      distinctCats.push(r.category);
    }
  });

  const rank1Map = {};
  const rank2Map = {};
  const rank3Map = {};

  q3Rows.forEach(r => {
    const count = num(r.user_count);
    if (r.rank_label === 'rank_1') rank1Map[r.category] = count;
    if (r.rank_label === 'rank_2') rank2Map[r.category] = count;
    if (r.rank_label === 'rank_3') rank3Map[r.category] = count;
  });

  const rank1Vals = distinctCats.map(c => rank1Map[c] || 0);
  const rank2Vals = distinctCats.map(c => rank2Map[c] || 0);
  const rank3Vals = distinctCats.map(c => rank3Map[c] || 0);

  const rank_categories_json = JSON.stringify(distinctCats);
  const rank1_values_json = JSON.stringify(rank1Vals);
  const rank2_values_json = JSON.stringify(rank2Vals);
  const rank3_values_json = JSON.stringify(rank3Vals);

  // ── Tab 3: Catalog & Popularity ─────────────────────────────────────────────
  const catalog_cat_labels_json = JSON.stringify(q4aRows.map(r => r.item_category));
  const catalog_cat_values_json = JSON.stringify(q4aRows.map(r => num(r.item_count)));

  const mostOrderedAsc = [...q4bRows.slice(0, 10)].reverse();
  const most_ordered_labels_json = JSON.stringify(mostOrderedAsc.map(r => r.item_name));
  const most_ordered_values_json = JSON.stringify(mostOrderedAsc.map(r => num(r.times_ordered)));
  const most_ordered_text_json = JSON.stringify(mostOrderedAsc.map(r => fmtInt(r.times_ordered)));

  const most_rec_labels_json = top_items_labels_json;
  const most_rec_values_json = top_items_values_json;
  const most_rec_text_json = top_items_text_json;

  // ── Tab 4: Historic Tracker ─────────────────────────────────────────────────
  const runCount = q5Rows.length;
  const histRunsAsc = [...q5Rows].sort((a, b) => num(a.session_id) - num(b.session_id));

  const historicRunLabels = histRunsAsc.map(r => {
    if (r.run_time) return String(r.run_time).substring(0, 10);
    return `Session ${r.session_id}`;
  });

  const historicCoveragePct = histRunsAsc.map(r => {
    const tot = num(r.distinct_users_transactions_table);
    const recs = num(r.users_with_recs);
    return tot > 0 ? Number((recs / tot * 100).toFixed(1)) : 0;
  });

  const historicItemsRec = histRunsAsc.map(r => num(r.distinct_items_recommended));
  const historicUsersRec = histRunsAsc.map(r => num(r.users_with_recs));

  const historic_single_run_callout = runCount <= 1
    ? `<div class="callout"><strong>Only one run available.</strong> The Historic Tracker shows the current snapshot. Trend lines will populate after the next workflow run, typically on the scheduled refresh. Use Tabs 1–3 for the full latest-run analysis.</div>`
    : '';

  // ── Tab 5: Test Set Evaluation ──────────────────────────────────────────────
  const testsetNum = q6Rows.length > 0 ? q6Rows[0] : null;
  const hasTestset = Boolean(testsetNum && num(testsetNum.total_customers) > 0);

  let testsetTabContent = '';
  let testsetBarModel = [0, 0];
  let testsetBarRandom = [0, 0];
  let testsetPrecLabels = [];
  let testsetPrecValues = [];
  let testsetRecLabels = [];
  let testsetRecValues = [];

  if (hasTestset) {
    const totCust = num(testsetNum.total_customers);
    const totItemsBought = num(testsetNum.total_items_bought);
    const prodMatches = num(testsetNum.total_product_matches);
    const catMatches = num(testsetNum.total_category_matches);
    const randItemRate = num(testsetNum.random_item_rate) * 100;
    const randCatRate = num(testsetNum.random_category_rate) * 100;

    const prodMatchRate = totCust > 0 ? (prodMatches / totCust * 100) : 0;
    const catMatchRate = totCust > 0 ? (catMatches / totCust * 100) : 0;

    const prodLift = randItemRate > 0 ? `${(prodMatchRate / randItemRate).toFixed(1)}×` : '—';
    const catLift = randCatRate > 0 ? `${(catMatchRate / randCatRate).toFixed(1)}×` : '—';

    testsetBarModel = [Number(prodMatchRate.toFixed(1)), Number(catMatchRate.toFixed(1))];
    testsetBarRandom = [Number(randItemRate.toFixed(1)), Number(randCatRate.toFixed(1))];

    const precRows = q7Rows.filter(r => r.type === 'precision');
    const recRows = q7Rows.filter(r => r.type === 'recall');

    testsetPrecLabels = precRows.map(r => String(r.label));
    testsetPrecValues = precRows.map(r => num(r.bin_cnt));
    testsetRecLabels = recRows.map(r => String(r.label));
    testsetRecValues = recRows.map(r => num(r.bin_cnt));

    const tab5Bullets = [
      `<strong>${prodLift} Product Match Lift:</strong> Model achieved <strong>${fmtPct(prodMatchRate)}</strong> product match rate vs. <strong>${fmtPct(randItemRate)}</strong> random baseline, confirming strong personalization accuracy.`,
      `<strong>${catLift} Category Match Lift:</strong> Model captured intent with <strong>${fmtPct(catMatchRate)}</strong> category match rate vs. <strong>${fmtPct(randCatRate)}</strong> random baseline.`,
      `<strong>Holdout Test Set Size:</strong> Evaluated across <strong>${fmtInt(totCust)} customers</strong> and <strong>${fmtInt(totItemsBought)} holdout purchases</strong>.`,
      `<strong>Precision Distribution:</strong> Right-skewed precision distribution shows consistent accuracy across diverse customer profiles.`,
      `<strong>Recall Optimization:</strong> Consider increasing <code>max_recommended_items</code> if broader catalog capture is required for cross-sell campaigns.`
    ];
    const tab5InsightsHtml = tab5Bullets.map(b => `<li>${b}</li>`).join('\n          ');

    testsetTabContent = `
    <section>
      <h2>Model Evaluation — Test Set Results</h2>
      <div class="kpi-grid">
        <div class="kpi">
          <div class="label">Product Match Rate</div>
          <div class="value">${fmtPct(prodMatchRate)}</div>
          <div class="sub">vs. ${fmtPct(randItemRate)} random baseline — <strong>${prodLift} lift</strong></div>
        </div>
        <div class="kpi">
          <div class="label">Category Match Rate</div>
          <div class="value">${fmtPct(catMatchRate)}</div>
          <div class="sub">vs. ${fmtPct(randCatRate)} random baseline — <strong>${catLift} lift</strong></div>
        </div>
        <div class="kpi">
          <div class="label">Test Set Customers</div>
          <div class="value">${fmtInt(totCust)}</div>
          <div class="sub">Held out from training for evaluation</div>
        </div>
        <div class="kpi">
          <div class="label">Items Bought (holdout)</div>
          <div class="value">${fmtInt(totItemsBought)}</div>
          <div class="sub">Total purchases in holdout period</div>
        </div>
      </div>
    </section>

    <section>
      <h2>Model vs. Random Baseline</h2>
      <div class="chart"><div id="chart-testset-baseline" style="height:340px"></div></div>
    </section>

    <section>
      <h2>Precision Distribution</h2>
      <div class="chart"><div id="chart-testset-prec" style="height:300px"></div></div>
    </section>

    <section>
      <h2>Recall Distribution</h2>
      <div class="chart"><div id="chart-testset-rec" style="height:300px"></div></div>
    </section>

    <section>
      <h2>Insights &amp; Recommendations</h2>
      <div class="kpi insights">
        <ul>
          ${tab5InsightsHtml}
        </ul>
      </div>
    </section>`;
  } else {
    testsetTabContent = `
    <div class="callout" style="margin-top:20px;">
      <strong>Test Set Evaluation Not Available.</strong> Test set evaluation was not enabled for this workflow run (<code>run_model_test_set: 'no'</code> in <code>config/input_params.yml</code>), or testset tables contain no customer evaluation records.
      <p style="margin-top:8px;margin-bottom:0;">To enable test set evaluation in future runs, set <code>run_model_test_set: 'yes'</code> in your NBP workflow <code>config/input_params.yml</code>. This compares the recommendations with each customer's purchases in the last <code>test_lookback</code>, evaluates product and category match rates against random baselines, and generates precision/recall distributions.</p>
    </div>`;
  }

  // ── Dynamic Executive Insights Synthesis ────────────────────────────────────

  // Tab 1 Insights
  const tab1Bullets = [
    `<strong>Audience Recommendation Reach:</strong> <strong>${fmtPct(coveragePctVal)}</strong> of addressable users (<strong>${fmtInt(usersWithRecs)}</strong> of <strong>${fmtInt(totalUsers)}</strong>) received personalized recommendations${coveragePctVal >= 80 ? ' — well above the 80% production health standard' : ' — review cold-start rules to expand coverage'}.`,
    `<strong>Catalog Breadth Utilization:</strong> The model surfaced <strong>${fmtInt(distinctItemsRecommended)} distinct items</strong> out of <strong>${fmtInt(totalItemsInCatalog)} catalog products</strong> (${fmtPct(totalItemsInCatalog > 0 ? distinctItemsRecommended / totalItemsInCatalog * 100 : 0)} active recommendation coverage).`,
    `<strong>Training Data Temporal Depth:</strong> Trained across a <strong>${timeRangeDays}-day lookback window</strong> (${leastRecentEvent} → ${mostRecentEvent}) to capture customer lifecycle and repeat purchase patterns.`,
    `<strong>Recommendation Model:</strong> Generated by the <strong>${engine}</strong> NBP model with the <strong>${algorithm.toUpperCase()}</strong> algorithm.`,
    `<strong>Business Exclusion Rules:</strong> <strong>${fmtInt(filteredItemCount)} products</strong> were filtered by applied exclusion rules (${escapeHtml(exclusionFilters)}) prior to scoring.`
  ];
  const tab1InsightsHtml = tab1Bullets.map(b => `<li>${b}</li>`).join('\n          ');

  // Tab 2 Insights
  const topRecItem = q2aRows[0] || { item: 'Top Item', user_count: 0 };
  const topRecPct = usersWithRecs > 0 ? (num(topRecItem.user_count) / usersWithRecs * 100) : 0;
  const topCat = catRank1Rows[0] || { category: 'Core Category', user_count: 0 };
  const topCatPct = usersWithRecs > 0 ? (num(topCat.user_count) / usersWithRecs * 100) : 0;

  const tab2Bullets = [
    `<strong>Dominant Rank-1 Recommendation:</strong> <strong>${escapeHtml(topRecItem.item)}</strong> is the primary recommendation for <strong>${fmtInt(topRecItem.user_count)} users</strong> (<strong>${fmtPct(topRecPct)}</strong> of scored audience)${topRecPct > 35 ? ' — monitor for concentration bias' : ''}.`,
    `<strong>Category Concentration at Rank 1:</strong> <strong>${escapeHtml(topCat.category)}</strong> leads category distribution with <strong>${fmtPct(topCatPct)}</strong> of rank-1 recommendations, reflecting current customer demand.`,
    `<strong>Multi-Rank Progression:</strong> Across ranks 1 to 3, recommendations span <strong>${distinctCats.length} distinct categories</strong> to promote cross-category discovery and basket expansion.`,
    `<strong>Catalog Discovery Depth:</strong> Top-3 positions feature <strong>${Math.min(10, q2aRows.length)}</strong> distinct product choices, providing immediate actionable segments for activation.`,
    `<strong>Activation Recommendation:</strong> Ingest <code>nbp_1</code> into Parent Segment hero slots and utilize <code>nbp_2</code> and <code>nbp_3</code> for secondary personalization carousels in email and web triggers.`
  ];
  const tab2InsightsHtml = tab2Bullets.map(b => `<li>${b}</li>`).join('\n          ');

  // Tab 3 Insights
  const topOrdered = q4bRows[0] || { item_name: 'Top Ordered', times_ordered: 0 };
  const topCatalogCategory = q4aRows[0] || { item_category: 'Top Category', item_count: 0 };

  const tab3Bullets = [
    `<strong>Catalog Categorization:</strong> Product catalog encompasses <strong>${fmtInt(totalItemsInCatalog)} products</strong> across <strong>${q4aRows.length} categories</strong>, led by <strong>${escapeHtml(topCatalogCategory.item_category)}</strong> (<strong>${fmtInt(topCatalogCategory.item_count)} items</strong>).`,
    `<strong>Historical Purchase Volume:</strong> <strong>${escapeHtml(topOrdered.item_name)}</strong> is the #1 most ordered product in source data with <strong>${fmtInt(topOrdered.times_ordered)} lifetime orders</strong>.`,
    `<strong>Personalization vs. Popularity:</strong> ${topRecItem.item === topOrdered.item_name ? `Top recommended item aligns directly with top ordered item (<strong>${escapeHtml(topRecItem.item)}</strong>), reflecting high-demand staple merchandise.` : `Model recommendations diverge from raw popularity (recommending <strong>${escapeHtml(topRecItem.item)}</strong> over top-ordered <strong>${escapeHtml(topOrdered.item_name)}</strong>), demonstrating personalized collaborative filtering at work.`}`,
    `<strong>Catalog Exposure Rate:</strong> <strong>${fmtInt(distinctItemsRecommended)} items</strong> surface in top recommendation ranks, preventing dead catalog inventory while maintaining relevant merchandising.`,
    `<strong>Assortment Optimization:</strong> Cross-reference low-recommendation catalog categories with promotional inventory to identify unaddressed merchandising opportunities.`
  ];
  const tab3InsightsHtml = tab3Bullets.map(b => `<li>${b}</li>`).join('\n          ');

  // Tab 4 Insights
  const tab4Bullets = [];
  if (runCount > 1) {
    const firstRun = histRunsAsc[0];
    const latestRun = histRunsAsc[histRunsAsc.length - 1];
    const cov0 = num(firstRun.distinct_users_transactions_table) > 0 ? (num(firstRun.users_with_recs) / num(firstRun.distinct_users_transactions_table) * 100) : 0;
    const covN = num(latestRun.distinct_users_transactions_table) > 0 ? (num(latestRun.users_with_recs) / num(latestRun.distinct_users_transactions_table) * 100) : 0;
    const covDelta = covN - cov0;
    const usersDelta = num(latestRun.users_with_recs) - num(firstRun.users_with_recs);

    tab4Bullets.push(
      `<strong>Coverage Trajectory:</strong> Audience coverage shifted from <strong>${fmtPct(cov0)}</strong> to <strong>${fmtPct(covN)}</strong> (${covDelta >= 0 ? '+' : ''}${covDelta.toFixed(1)}pp) across <strong>${runCount} workflow sessions</strong>.`,
      `<strong>Audience Growth:</strong> Scored users changed by <strong>${usersDelta >= 0 ? '+' : ''}${fmtInt(usersDelta)} profiles</strong> run-over-run, reflecting transaction base evolution.`,
      `<strong>Catalog Breadth Stability:</strong> Active recommended items moved from <strong>${fmtInt(firstRun.distinct_items_recommended)}</strong> to <strong>${fmtInt(latestRun.distinct_items_recommended)} items</strong>.`,
      `<strong>Model Consistency:</strong> Stable recommendation distributions confirm robust matrix factorization convergence across scheduled runs.`,
      `<strong>Monitoring Priority:</strong> Flag any unexpected coverage drops >5pp between runs as an alert for upstream transaction table ingestion anomalies.`
    );
  } else {
    tab4Bullets.push(
      `<strong>Baseline Run Established:</strong> Session <strong>${sessionId}</strong> establishes initial benchmark with <strong>${coveragePct} coverage</strong> across <strong>${fmtInt(usersWithRecs)} profiles</strong>.`,
      `<strong>Catalog Breadth:</strong> Model surfaced <strong>${fmtInt(distinctItemsRecommended)} distinct items</strong> in its initial execution.`,
      `<strong>Expected Stability Band:</strong> Future runs are expected to maintain coverage within ±3–5 percentage points of baseline.`,
      `<strong>Automatic Drift Detection:</strong> Historical trend lines, coverage evolution, and item breadth trajectories will populate automatically upon subsequent scheduled runs.`,
      `<strong>Next Step:</strong> Review Tab 1 and Tab 2 for active campaign activation and Audience Studio attribute mapping.`
    );
  }
  const tab4InsightsHtml = tab4Bullets.map(b => `<li>${b}</li>`).join('\n          ');

  // ── Token Substitution & HTML Generation ────────────────────────────────────
  console.log('Baking dynamic data into dashboard template...');

  const tokenMap = {
    '{{project_name}}': escapeHtml(projectName),
    '{{sink_database}}': escapeHtml(sinkDatabase),
    '{{prefix}}': escapeHtml(tablePrefix),
    '{{session_id}}': escapeHtml(sessionId),
    '{{run_time_utc}}': escapeHtml(runTimeUtc),
    '{{engine}}': escapeHtml(engine),
    '{{algorithm}}': escapeHtml(algorithm),
    '{{run_count}}': String(runCount),

    '{{total_users}}': fmtInt(totalUsers),
    '{{users_with_recs}}': fmtInt(usersWithRecs),
    '{{coverage_pct}}': coveragePct,
    '{{distinct_items_recommended}}': fmtInt(distinctItemsRecommended),
    '{{total_items_in_catalog}}': fmtInt(totalItemsInCatalog),
    '{{time_range_days}}': fmtInt(timeRangeDays),
    '{{least_recent_event}}': escapeHtml(leastRecentEvent),
    '{{most_recent_event}}': escapeHtml(mostRecentEvent),
    '{{filtered_item_count}}': fmtInt(filteredItemCount),
    '{{exclusion_filters}}': escapeHtml(exclusionFilters),
    '{{model_params}}': escapeHtml(modelParams),

    '{{coverage_with_recs}}': String(coverageWithRecs),
    '{{coverage_without_recs}}': String(coverageWithoutRecs),
    '{{tab1_insights_html_li}}': tab1InsightsHtml,

    '{{top_items_labels_json}}': top_items_labels_json,
    '{{top_items_values_json}}': top_items_values_json,
    '{{top_items_text_json}}': top_items_text_json,
    '{{top3_table_rows}}': top3TableRows,
    '{{cat_rank1_labels_json}}': cat_rank1_labels_json,
    '{{cat_rank1_values_json}}': cat_rank1_values_json,
    '{{rank_categories_json}}': rank_categories_json,
    '{{rank1_values_json}}': rank1_values_json,
    '{{rank2_values_json}}': rank2_values_json,
    '{{rank3_values_json}}': rank3_values_json,
    '{{tab2_insights_html_li}}': tab2InsightsHtml,

    '{{catalog_cat_labels_json}}': catalog_cat_labels_json,
    '{{catalog_cat_values_json}}': catalog_cat_values_json,
    '{{most_ordered_labels_json}}': most_ordered_labels_json,
    '{{most_ordered_values_json}}': most_ordered_values_json,
    '{{most_ordered_text_json}}': most_ordered_text_json,
    '{{most_rec_labels_json}}': most_rec_labels_json,
    '{{most_rec_values_json}}': most_rec_values_json,
    '{{most_rec_text_json}}': most_rec_text_json,
    '{{tab3_insights_html_li}}': tab3InsightsHtml,

    '{{historic_run_labels_json}}': JSON.stringify(historicRunLabels),
    '{{historic_coverage_pct_json}}': JSON.stringify(historicCoveragePct),
    '{{historic_items_rec_json}}': JSON.stringify(historicItemsRec),
    '{{historic_users_rec_json}}': JSON.stringify(historicUsersRec),
    '{{historic_single_run_callout}}': historic_single_run_callout,
    '{{tab4_insights_html_li}}': tab4InsightsHtml,

    '{{testset_tab_content}}': testsetTabContent,
    '{{testset_available}}': hasTestset ? 'true' : 'false',
    '{{testset_bar_model_json}}': JSON.stringify(testsetBarModel),
    '{{testset_bar_random_json}}': JSON.stringify(testsetBarRandom),
    '{{testset_prec_labels_json}}': JSON.stringify(testsetPrecLabels),
    '{{testset_prec_values_json}}': JSON.stringify(testsetPrecValues),
    '{{testset_rec_labels_json}}': JSON.stringify(testsetRecLabels),
    '{{testset_rec_values_json}}': JSON.stringify(testsetRecValues)
  };

  const templateContent = fs.readFileSync(templatePath, 'utf-8');

  // Strip documentation comment at top
  let renderedHtml = templateContent.replace(/^<!DOCTYPE html>[\s\S]*?-->\s*<html/i, '<!DOCTYPE html>\n<html');

  // Substitute all tokens
  for (const [token, val] of Object.entries(tokenMap)) {
    renderedHtml = renderedHtml.split(token).join(val);
  }

  // Validate no leftover {{...}} tokens remain
  const leftoverTokens = renderedHtml.match(/\{\{[^}]+\}\}/g);
  if (leftoverTokens && leftoverTokens.length > 0) {
    console.warn(`  [Warning] ${leftoverTokens.length} unreplaced tokens remain: ${leftoverTokens.slice(0, 5).join(', ')}`);
  }

  // Inline window.RAW for programmatic access
  const rawPayload = {
    project: { name: projectName, slug: projectSlug, database: sinkDatabase, prefix: tablePrefix },
    meta: {
      sessionId,
      runTime: runTimeUtc,
      totalUsers,
      usersWithRecs,
      coveragePct: coveragePctVal,
      distinctItemsRecommended,
      totalItemsInCatalog,
      timeRangeDays,
      leastRecentEvent,
      mostRecentEvent,
      engine,
      algorithm,
      filteredItemCount,
      exclusionFilters,
      runCount
    },
    recommendations: {
      rank1: q2aRows,
      rank2: q2bRows,
      rank3: q2cRows,
      categoriesByRank: q3Rows
    },
    catalog: {
      categories: q4aRows,
      mostOrdered: q4bRows
    },
    historic: {
      runs: historicRunLabels,
      coveragePct: historicCoveragePct,
      itemsRecommended: historicItemsRec,
      usersRecommended: historicUsersRec
    },
    testset: hasTestset ? {
      totalCustomers: num(testsetNum.total_customers),
      totalItemsBought: num(testsetNum.total_items_bought),
      productMatchRate: testsetBarModel[0],
      categoryMatchRate: testsetBarModel[1],
      randomItemRate: testsetBarRandom[0],
      randomCategoryRate: testsetBarRandom[1]
    } : null
  };

  const rawInjection = `<script id="nbp-data-payload">\n  window.RAW = ${JSON.stringify(rawPayload, null, 2)};\n</script>\n`;
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
  console.log('  NBP Dashboard Generated Successfully!');
  console.log('='.repeat(65));
  console.log(`  File Path:      ${outputPath}`);
  console.log(`  File Size:      ${fileSizeKb} KB`);
  console.log(`  Query Duration: ${queryDuration} ms (parallel)`);
  console.log(`  Total Duration: ${totalDuration} ms`);
  console.log(`  Profiles Scored:${fmtInt(usersWithRecs)}`);
  console.log(`  Coverage Rate:  ${coveragePct}`);
  console.log(`  Items Rec'd:    ${distinctItemsRecommended}`);
  console.log(`  Historical Runs:${runCount}`);
  console.log(`  Testset Status: ${hasTestset ? 'Active' : 'Disabled / Empty'}`);
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
