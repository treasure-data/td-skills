#!/usr/bin/env node
/**
 * Classifier (Propensity Scoring) Dashboard Data Generator.
 *
 * Runs the dashboard queries concurrently against the AI Signals classifier output
 * (fixed-name classifier_* tables + the predictions table), derives the template values,
 * and writes a standalone HTML dashboard.
 *
 * Usage:
 *   node generate-data.js <sink_database> [project_slug] [project_name] [-P <pred_output_table>]
 *   SOURCE_DB=<sink_database> node generate-data.js [project_slug] [project_name]
 *
 * Output (default): ./agent_outputs/<project_slug>/dashboards/classifier_summary_dashboard.html
 *   relative to the current working directory — run it from the user's working directory.
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

const args = process.argv.slice(2);
let customOutput = null;
let customTemplate = null;
let customPredTable = null;
let verbose = false;
const positional = [];

function help() {
  console.log(`
Classifier Dashboard Data Generator

Usage:
  node generate-data.js <sink_database> [project_slug] [project_name] [-P <pred_output_table>]
  SOURCE_DB=<sink_database> node generate-data.js [project_slug] [project_name]

Arguments:
  sink_database         Treasure Data database with the classifier_* tables and the predictions (required, or env SOURCE_DB)
  project_slug          Project slug, names the output folder (default: "classifier")
  project_name          Project display name in the dashboard header (default: Title-cased slug)

Options:
  -P, --pred-table      Predictions table, the workflow's pred_output_table (default: classifier_predictions or env PRED_TABLE)
  -o, --output          Custom output HTML path
                        (default: ./agent_outputs/<project_slug>/dashboards/classifier_summary_dashboard.html)
  -t, --template        Dashboard template path
  -v, --verbose         Show query timings and row counts
  -h, --help            Show this help
`);
  process.exit(process.exitCode || 0);
}

for (let i = 0; i < args.length; i += 1) {
  const arg = args[i];
  if (arg === '-h' || arg === '--help') help();
  else if (arg === '-P' || arg === '--pred-table') customPredTable = args[++i];
  else if (arg === '-o' || arg === '--output') customOutput = args[++i];
  else if (arg === '-t' || arg === '--template') customTemplate = args[++i];
  else if (arg === '-v' || arg === '--verbose') verbose = true;
  else if (!arg.startsWith('-')) positional.push(arg);
}

let sinkDatabase = process.env.SOURCE_DB || '';
let projectSlug = process.env.PROJECT_SLUG || '';
let projectName = process.env.PROJECT_NAME || '';
const predTable = customPredTable || process.env.PRED_TABLE || 'classifier_predictions';

if (positional.length > 0) {
  if (!sinkDatabase) {
    sinkDatabase = positional[0];
    if (positional[1]) projectSlug = positional[1];
    if (positional[2]) projectName = positional[2];
  } else {
    projectSlug = positional[0];
    if (positional[1]) projectName = positional[1];
  }
}

function validIdentifier(value, label) {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(value)) {
    throw new Error(`Invalid ${label}: "${value}"`);
  }
  return value;
}

if (!sinkDatabase) {
  console.error('Error: sink_database is required (first argument or SOURCE_DB env var).');
  process.exitCode = 1;
  help();
}
validIdentifier(sinkDatabase, 'sink database');
validIdentifier(predTable, 'predictions table');
projectSlug = projectSlug || 'classifier';
projectName = projectName || projectSlug.split(/[-_]/).map(w => w[0]?.toUpperCase() + w.slice(1)).join(' ');

const scriptDir = __dirname;
const templatePath = customTemplate
  ? path.resolve(process.cwd(), customTemplate)
  : path.join(scriptDir, 'dashboard_template.html');
const outputDir = path.resolve(workRoot, 'agent_outputs', projectSlug, 'dashboards');
const outputPath = customOutput
  ? path.resolve(process.cwd(), customOutput)
  : path.join(outputDir, 'classifier_summary_dashboard.html');

if (!fs.existsSync(templatePath)) throw new Error(`Template not found: ${templatePath}`);

function query(sql, description) {
  return new Promise(resolve => {
    const clean = sql.replace(/\s+/g, ' ').trim();
    const escaped = clean.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    const command = `tdx query -d ${sinkDatabase} --format json "${escaped}"`;
    const started = Date.now();
    exec(command, { maxBuffer: 50 * 1024 * 1024 }, (error, stdout) => {
      const elapsed = Date.now() - started;
      if (error) {
        if (verbose) console.warn(`  [Notice] ${description} failed (${elapsed}ms): ${error.message}`);
        return resolve([]);
      }
      try {
        const start = stdout.indexOf('[');
        const end = stdout.lastIndexOf(']');
        const rows = start >= 0 && end > start ? JSON.parse(stdout.slice(start, end + 1)) : [];
        if (verbose) console.log(`  ✔ ${description}: ${rows.length} rows (${elapsed}ms)`);
        resolve(rows);
      } catch (err) {
        if (verbose) console.warn(`  [Notice] ${description} returned invalid JSON (${elapsed}ms)`);
        resolve([]);
      }
    });
  });
}

function n(value) {
  if (value === null || value === undefined || value === '') return 0;
  const result = Number(value);
  return Number.isFinite(result) ? result : 0;
}
function integer(value) { return Math.round(n(value)).toLocaleString('en-US'); }
function decimal(value, places = 4) { return n(value).toFixed(places); }
function pct(value) { return `${(n(value) * 100).toFixed(1)}%`; }
function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
// JSON for inline <script>: escape "<" so data containing "</script>" cannot end the block
function json(value, ...args) { return JSON.stringify(value, ...args).replace(/</g, "\\u003c"); }
function pill(kind, text) { return `<span class="pill ${kind}">${escapeHtml(text)}</span>`; }

async function run() {
  const started = Date.now();
  const db = sinkDatabase;
  // Every classifier_* table is appended on each run: the latest run is the latest session_id by time,
  // and within it the latest batch (a retried run can append twice).
  const latest = `(SELECT max_by(session_id, time) FROM ${db}.classifier_run_log)`;
  const latestBatch = t => `session_id = ${latest} AND time = (SELECT MAX(time) FROM ${db}.${t} WHERE session_id = ${latest})`;
  const pred = `${db}.${predTable}`;
  const predLatest = `${db}.${predTable}_latest`;

  const [q1, q2, q3, q4, q5, q6, q7, q8] = await Promise.all([
    query(`SELECT session_id, model_type, best_threshold, precision, recall, f1_score, fbeta, fbeta_beta, auc_roc, aucpr, psi, true_positives, true_negatives, false_positives, false_negatives, test_samples, total_features, threshold_strategy, optuna_metric, TD_TIME_FORMAT(time, 'yyyy-MM-dd HH:mm', 'UTC') AS run_time FROM ${db}.classifier_run_log ORDER BY time DESC LIMIT 1`, 'Q1 latest training metrics'),
    query(`SELECT auc_roc, fbeta, precision, recall FROM ${db}.classifier_train_run_log WHERE session_id = ${latest} ORDER BY time DESC LIMIT 1`, 'Q2 training-split metrics'),
    query(`SELECT feature_name, mean_abs_shap_value FROM ${db}.classifier_feature_importance WHERE ${latestBatch('classifier_feature_importance')} ORDER BY rank LIMIT 15`, 'Q3 feature importance'),
    query(`SELECT feature_name, direction, mean_shap, direction_confidence, pct_pushing_up, pct_pushing_down FROM ${db}.classifier_shap_directional WHERE ${latestBatch('classifier_shap_directional')} ORDER BY rank LIMIT 15`, 'Q4 directional SHAP'),
    query(`SELECT MAX(session_id) AS pred_session_id, COUNT(*) AS records_scored, AVG(score) AS score_mean, MIN(score) AS score_min, MAX(score) AS score_max, SUM(predicted_label) AS predicted_positive, MAX(threshold_applied) AS threshold_applied, MAX(prediction_timestamp) AS prediction_timestamp FROM ${predLatest}`, 'Q5 latest scored batch'),
    query(`SELECT score_bucket AS bin_range, COUNT(*) AS cnt FROM ${predLatest} GROUP BY 1 ORDER BY 1`, 'Q6 score buckets'),
    query(`SELECT session_id, TD_TIME_FORMAT(time, 'yyyy-MM-dd HH:mm', 'UTC') AS run_date, auc_roc, fbeta, precision, recall, psi FROM ${db}.classifier_run_log ORDER BY time ASC`, 'Q7 training history'),
    query(`SELECT session_id, TD_TIME_FORMAT(MIN(time), 'yyyy-MM-dd HH:mm', 'UTC') AS run_date, COUNT(DISTINCT user_id) AS records_scored, AVG(CAST(predicted_label AS DOUBLE)) AS positive_rate FROM ${pred} GROUP BY session_id ORDER BY MIN(time) ASC`, 'Q8 scoring history')
  ]);

  if (!q1.length) throw new Error(`No records found in ${db}.classifier_run_log. Verify the classifier workflow has completed.`);
  const train = q1[0];
  const trainCheck = q2[0] || {};
  const prediction = q5[0] || {};
  const threshold = n(train.best_threshold);
  const testTotal = n(train.true_positives) + n(train.true_negatives) + n(train.false_positives) + n(train.false_negatives);
  const predictedPositive = n(prediction.predicted_positive);
  const recordsScored = n(prediction.records_scored);
  const psi = n(train.psi);
  const runTime = train.run_time || '—';
  // run logs store auc_roc, aucpr and f1_score as 0–100; precision, recall and fbeta as 0–1
  const testAuc = n(train.auc_roc) / 100;
  const trainAuc = n(trainCheck.auc_roc) / 100;
  const testFbeta = n(train.fbeta);
  const trainFbeta = n(trainCheck.fbeta);
  const aucGap = trainAuc - testAuc;
  const fbetaGap = trainFbeta - testFbeta;
  const thresholdApplied = n(prediction.threshold_applied);
  const thresholdFallback = Math.abs(threshold - 0.5) < 1e-9 && String(train.threshold_strategy || '') !== 'fixed';

  const featureRows = q3.slice(0, 15);
  const directionalRows = q4.slice(0, 15);
  const featureLabels = featureRows.map(r => r.feature_name);
  const featureValues = featureRows.map(r => n(r.mean_abs_shap_value));
  const directionalLabels = directionalRows.map(r => r.feature_name);
  const directionalValues = directionalRows.map(r => n(r.mean_shap));
  const directionalTable = directionalRows.map(r => `<tr><td><strong>${escapeHtml(r.feature_name)}</strong></td><td><span class="pill ${String(r.direction || '').toLowerCase().includes('increase') ? 'ok' : String(r.direction || '').toLowerCase().includes('decrease') ? 'error' : 'warn'}">${escapeHtml(r.direction || 'unknown')}</span></td><td class="num">${decimal(r.mean_shap)}</td><td class="num">${decimal(r.direction_confidence)}</td><td class="num">${decimal(r.pct_pushing_up, 1)}%</td><td class="num">${decimal(r.pct_pushing_down, 1)}%</td></tr>`).join('\n');

  const bucketTotal = q6.reduce((sum, r) => sum + n(r.cnt), 0);
  const bins = q6.map(r => ({ label: r.bin_range, count: n(r.cnt), percentage: bucketTotal ? 100 * n(r.cnt) / bucketTotal : 0, lower: n(String(r.bin_range || '').split('-')[0]) }));
  const binTable = bins.map(r => `<tr><td><strong>${escapeHtml(r.label)}</strong></td><td class="num">${integer(r.count)}</td><td class="num">${decimal(r.percentage, 1)}%</td><td>${r.lower >= threshold ? 'Above threshold' : (r.lower + 0.1 > threshold ? 'Contains threshold' : 'Below threshold')}</td></tr>`).join('\n');
  const historicTrain = q7.map(r => ({ label: r.run_date || String(r.session_id), id: r.session_id, auc: n(r.auc_roc) / 100, fbeta: n(r.fbeta), precision: n(r.precision), recall: n(r.recall), psi: n(r.psi) }));
  const historicPred = q8.map(r => ({ label: r.run_date || String(r.session_id), records: n(r.records_scored), positiveRate: n(r.positive_rate) }));
  const status = psi < 0.10 ? pill('ok', `Stable (${decimal(psi)})`) : psi <= 0.25 ? pill('warn', `Investigate (${decimal(psi)})`) : pill('error', `Shift / leakage? (${decimal(psi)})`);
  const aucGapPill = aucGap < 0.03 ? pill('ok', 'Stable') : aucGap < 0.05 ? pill('warn', 'Monitor') : pill('error', 'Overfitting');
  const fbetaGapPill = fbetaGap < 0.05 ? pill('ok', 'Stable') : fbetaGap < 0.10 ? pill('warn', 'Monitor') : pill('error', 'Overfitting');
  const topFeature = featureRows[0]?.feature_name || 'No feature data';
  const topDirectional = directionalRows[0] ? `${directionalRows[0].feature_name} (${directionalRows[0].direction || 'unknown'})` : 'No directional data';

  const insights1 = `<li><strong>Test AUC-ROC:</strong> <strong>${decimal(testAuc)}</strong>, AUC-PR <strong>${decimal(n(train.aucpr) / 100)}</strong>; at the threshold, precision <strong>${decimal(train.precision)}</strong> and recall <strong>${decimal(train.recall)}</strong>.</li><li><strong>Train vs test:</strong> AUC gap <strong>${decimal(aucGap)}</strong>, F-beta gap <strong>${decimal(fbetaGap)}</strong> (larger gaps mean overfitting).</li><li><strong>Threshold:</strong> <strong>${decimal(threshold)}</strong> (${escapeHtml(train.threshold_strategy || 'strategy not logged')}) on <strong>${integer(testTotal)}</strong> test records${thresholdFallback ? ' — exactly 0.5 usually means no threshold met the metric floor' : ''}.</li><li><strong>Model:</strong> <strong>${escapeHtml(train.model_type || 'unknown')}</strong> with <strong>${integer(train.total_features)}</strong> features, tuned on <strong>${escapeHtml(train.optuna_metric || '—')}</strong>.</li>`;
  const insights2 = `<li><strong>Top global driver:</strong> <strong>${escapeHtml(topFeature)}</strong> has the largest mean absolute SHAP value.</li><li><strong>Direction of the top feature:</strong> <strong>${escapeHtml(topDirectional)}</strong>.</li><li><strong>Coverage:</strong> the charts show the top <strong>${integer(featureRows.length)}</strong> features of the latest training run.</li><li><strong>Check:</strong> a single feature far above the rest can be a proxy for the outcome — confirm it is known before the cut-off date.</li>`;
  const insights3 = `<li><strong>Records scored:</strong> <strong>${integer(recordsScored)}</strong> in the latest batch (session <strong>${escapeHtml(prediction.pred_session_id || '—')}</strong>).</li><li><strong>Predicted positive:</strong> <strong>${pct(recordsScored ? predictedPositive / recordsScored : 0)}</strong> of scored records are at or above the threshold <strong>${decimal(thresholdApplied)}</strong>${thresholdApplied && Math.abs(thresholdApplied - threshold) > 1e-6 ? ' — differs from the latest training threshold; scoring used an earlier model' : ''}.</li><li><strong>Train-vs-test PSI:</strong> <strong>${decimal(psi)}</strong> — under 0.1 stable, 0.1–0.25 worth investigating, over 0.25 usually leakage or a population shift.</li><li><strong>Score range:</strong> <strong>${decimal(prediction.score_min)}</strong> to <strong>${decimal(prediction.score_max)}</strong>, average <strong>${decimal(prediction.score_mean)}</strong>.</li>`;
  const insights4 = `<li><strong>Training runs:</strong> <strong>${integer(historicTrain.length)}</strong> in <code>classifier_run_log</code>.</li><li><strong>Scoring runs:</strong> <strong>${integer(historicPred.length)}</strong> in <code>${escapeHtml(predTable)}</code>.</li><li><strong>Latest quality:</strong> AUC-ROC <strong>${decimal(testAuc)}</strong>, train-vs-test PSI <strong>${decimal(psi)}</strong>.</li><li><strong>Next check:</strong> compare the next run's AUC, threshold and positive rate; a change after a config or SQL edit is expected, a change without one is drift.</li>`;
  const callout = historicTrain.length <= 1 ? '<div class="callout"><strong>Only one run available.</strong> The Historic Tracker shows the current snapshot. Trend lines will populate after subsequent workflow runs.</div>' : '';

  const tokenMap = {
    '{{project_name}}': escapeHtml(projectName), '{{sink_database}}': escapeHtml(sinkDatabase), '{{pred_table}}': escapeHtml(predTable),
    '{{session_id}}': escapeHtml(train.session_id), '{{pred_session_id}}': escapeHtml(prediction.pred_session_id), '{{run_time_utc}}': escapeHtml(runTime), '{{model_type}}': escapeHtml(train.model_type || '—'), '{{threshold_strategy}}': escapeHtml(train.threshold_strategy || '—'), '{{best_threshold}}': decimal(threshold), '{{run_count}}': String(historicTrain.length), '{{pred_run_count}}': String(historicPred.length),
    '{{test_auc_roc}}': decimal(testAuc), '{{test_aucpr}}': decimal(n(train.aucpr) / 100), '{{test_precision}}': decimal(train.precision), '{{test_recall}}': decimal(train.recall), '{{test_f1}}': decimal(n(train.f1_score) / 100), '{{test_fbeta}}': decimal(testFbeta), '{{fbeta_beta}}': decimal(train.fbeta_beta, 2), '{{train_auc_roc}}': decimal(trainAuc), '{{train_fbeta}}': decimal(trainFbeta), '{{train_precision}}': decimal(trainCheck.precision), '{{train_recall}}': decimal(trainCheck.recall), '{{auc_gap}}': decimal(aucGap), '{{fbeta_gap}}': decimal(fbetaGap), '{{auc_gap_pill}}': aucGapPill, '{{fbeta_gap_pill}}': fbetaGapPill,
    '{{test_tp}}': integer(train.true_positives), '{{test_tn}}': integer(train.true_negatives), '{{test_fp}}': integer(train.false_positives), '{{test_fn}}': integer(train.false_negatives), '{{test_total}}': integer(testTotal), '{{test_tp_pct}}': pct(testTotal ? n(train.true_positives) / testTotal : 0), '{{test_tn_pct}}': pct(testTotal ? n(train.true_negatives) / testTotal : 0), '{{test_fp_pct}}': pct(testTotal ? n(train.false_positives) / testTotal : 0), '{{test_fn_pct}}': pct(testTotal ? n(train.false_negatives) / testTotal : 0),
    '{{feature_importance_labels_json}}': json(featureLabels), '{{feature_importance_values_json}}': json(featureValues), '{{shap_directional_labels_json}}': json(directionalLabels), '{{shap_directional_values_json}}': json(directionalValues), '{{shap_directional_rows}}': directionalTable, '{{tab1_insights_html_li}}': insights1, '{{tab2_insights_html_li}}': insights2,
    '{{records_scored}}': integer(recordsScored), '{{score_mean}}': decimal(prediction.score_mean), '{{score_min}}': decimal(prediction.score_min), '{{score_max}}': decimal(prediction.score_max), '{{psi}}': decimal(psi), '{{psi_status_pill}}': status, '{{predicted_positive_count}}': integer(predictedPositive), '{{predicted_positive_pct}}': pct(recordsScored ? predictedPositive / recordsScored : 0), '{{score_bins_labels_json}}': json(bins.map(r => r.label)), '{{score_bins_values_json}}': json(bins.map(r => r.count)), '{{score_bins_text_json}}': json(bins.map(r => `${integer(r.count)} (${decimal(r.percentage, 1)}%)`)), '{{score_bins_table_rows}}': binTable, '{{tab3_insights_html_li}}': insights3,
    '{{historic_run_labels_json}}': json(historicTrain.map(r => r.label)), '{{historic_session_ids_json}}': json(historicTrain.map(r => r.id)), '{{historic_auc_roc_json}}': json(historicTrain.map(r => r.auc)), '{{historic_fbeta_json}}': json(historicTrain.map(r => r.fbeta)), '{{historic_precision_json}}': json(historicTrain.map(r => r.precision)), '{{historic_recall_json}}': json(historicTrain.map(r => r.recall)), '{{historic_pred_run_labels_json}}': json(historicPred.map(r => r.label)), '{{historic_records_scored_json}}': json(historicPred.map(r => r.records)), '{{historic_positive_rate_json}}': json(historicPred.map(r => r.positiveRate)), '{{historic_single_run_callout}}': callout, '{{tab4_insights_html_li}}': insights4
  };

  let html = fs.readFileSync(templatePath, 'utf8');
  html = html.replace(/^<!DOCTYPE html>[\s\S]*?-->\s*<html/i, '<!DOCTYPE html>\n<html');
  for (const [token, value] of Object.entries(tokenMap)) html = html.split(token).join(value);
  const leftovers = html.match(/\{\{[^}]+\}\}/g);
  if (leftovers?.length) console.warn(`Warning: unreplaced tokens: ${leftovers.slice(0, 5).join(', ')}`);

  const raw = { project: { name: projectName, slug: projectSlug, database: sinkDatabase, predTable }, meta: { sessionId: train.session_id, predSessionId: prediction.pred_session_id, modelType: train.model_type, threshold, thresholdApplied, recordsScored, psi }, training: { latest: train, trainSplit: trainCheck, historic: historicTrain }, prediction: { latest: prediction, buckets: bins, historic: historicPred }, features: { importance: featureRows, directional: directionalRows } };
  html = html.replace('</head>', `<script id="classifier-data-payload">\nwindow.RAW = ${json(raw, null, 2)};\n</script>\n</head>`);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  // Make sure agent_outputs/ ignores itself so customer data is never committed
  const outputsIgnore = path.resolve(workRoot, 'agent_outputs', '.gitignore');
  if (outputPath.startsWith(path.dirname(outputsIgnore) + path.sep) && !fs.existsSync(outputsIgnore)) {
    fs.mkdirSync(path.dirname(outputsIgnore), { recursive: true });
    fs.writeFileSync(outputsIgnore, '*\n', 'utf-8');
  }
  fs.writeFileSync(outputPath, html, 'utf8');
  console.log(`Dashboard generated: ${outputPath}`);
  console.log(`Queries completed in ${Date.now() - started}ms`);
}

run().catch(err => {
  console.error(`Fatal error encountered during dashboard generation: ${err.message}`);
  process.exit(1);
});
