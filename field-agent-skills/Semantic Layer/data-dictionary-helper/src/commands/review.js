/**
 * Review Command
 *
 * Orchestrates CSV export for human review in Excel/Google Sheets.
 * Supports interactive mode with file opening and wait-for-edit prompts,
 * plus automated mode via --skip-review flag for CI/CD pipelines.
 *
 * Workflow:
 * 1. Load descriptions from ./descriptions/*.json
 * 2. Export to CSV in ./reviews/ directory
 * 3. Optionally open CSV in default app (macOS/Linux/Windows)
 * 4. Wait for user to finish editing (unless --skip-review)
 *
 * @module commands/review
 */

import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import { stdin } from 'process';
import { spawn } from 'child_process';
import { platform } from 'os';
import { exportToCSVWithSchema } from '../export/csv-exporter.js';
import { promptOpenFile, promptWaitForEdit } from '../prompts/review-prompts.js';

const { ensureDir, readdir, readJson, pathExists } = fs;

/**
 * Cross-platform file opening with default application.
 *
 * Opens a file using the OS-specific command:
 * - macOS: open
 * - Linux: xdg-open
 * - Windows: start (via cmd)
 *
 * @param {string} filepath - Absolute or relative path to file
 * @throws {Error} If platform is unsupported or spawn fails
 */
function openWithDefaultApp(filepath) {
  const plat = platform();

  if (plat === 'win32') {
    // Windows: use cmd /c start
    spawn('cmd', ['/c', 'start', '', filepath], { detached: true, stdio: 'ignore' });
  } else if (plat === 'darwin') {
    // macOS: use open
    spawn('open', [filepath], { detached: true, stdio: 'ignore' });
  } else {
    // Linux/Unix: use xdg-open
    spawn('xdg-open', [filepath], { detached: true, stdio: 'ignore' });
  }
}

/**
 * Review command - Export descriptions to CSV for human review.
 *
 * @param {string[]} segments - Array of segment names from CLI args, or undefined for interactive mode
 * @param {Object} options - Command options
 * @param {string} options.output - Output directory for CSV files (default: './reviews')
 * @param {boolean} options.batch - Batch mode: export all descriptions (default: false)
 * @param {boolean} options.skipReview - Skip interactive prompts (default: false)
 * @returns {Promise<void>}
 */
export async function review(segments, options) {
  const {
    output = './reviews',
    batch = false,
    skipReview = false
  } = options;

  // TTY check for interactive mode (per RESEARCH.md Pitfall 5)
  if (!stdin.isTTY && !skipReview) {
    console.error(chalk.red('Error: Interactive prompts require TTY environment'));
    console.error(chalk.yellow('Use --skip-review flag for non-TTY environments (CI/CD)'));
    process.exit(1);
  }

  let segmentsToReview = [];

  // Step 1: Determine which segments to review
  if (batch) {
    // Batch mode: find all descriptions in ./descriptions directory
    console.log(chalk.cyan('Finding all generated descriptions...'));
    try {
      const descFiles = await readdir('./descriptions');
      const jsonFiles = descFiles.filter(file => file.endsWith('-descriptions.json'));

      if (jsonFiles.length === 0) {
        console.log(chalk.yellow('No descriptions found in ./descriptions directory.'));
        console.log(chalk.yellow('Run: node src/index.js generate <segment> first.'));
        process.exit(0);
      }

      // Extract segment names from filenames (remove -descriptions.json suffix)
      segmentsToReview = jsonFiles.map(file => file.replace('-descriptions.json', ''));
      console.log(chalk.cyan(`Found ${segmentsToReview.length} description file(s)\n`));
    } catch (error) {
      console.error(chalk.red('Failed to read descriptions directory:'), error.message);
      process.exit(1);
    }
  } else if (segments && segments.length > 0) {
    // CLI args mode: use provided segment names
    segmentsToReview = segments;
  } else {
    // Interactive mode: show segment picker for available descriptions
    console.log(chalk.yellow('Interactive segment picker not yet implemented.'));
    console.log(chalk.yellow('Please specify segment name: node src/index.js review <segment>'));
    process.exit(0);
  }

  // Ensure output directory exists
  await ensureDir(output);

  // Step 2: Process each segment
  const results = {
    successes: [],
    failures: []
  };

  for (const segmentName of segmentsToReview) {
    console.log(chalk.cyan(`\n${'='.repeat(60)}`));
    console.log(chalk.cyan.bold(`Reviewing segment: ${segmentName}`));
    console.log(chalk.cyan(`${'='.repeat(60)}\n`));

    try {
      // Step 2a: Load descriptions JSON
      const descPath = path.join('./descriptions', `${segmentName}-descriptions.json`);

      if (!await pathExists(descPath)) {
        console.error(chalk.red(`✗ Descriptions not found: ${descPath}`));
        console.error(chalk.yellow(`  Run: node src/index.js generate ${segmentName}`));
        results.failures.push({
          segment: segmentName,
          error: 'Descriptions file not found'
        });
        continue;
      }

      let descriptions;
      try {
        descriptions = await readJson(descPath);
      } catch (error) {
        console.error(chalk.red(`✗ Failed to load descriptions for ${segmentName}`));
        console.error(chalk.red(`  ${error.message}`));
        results.failures.push({
          segment: segmentName,
          error: `Load failed: ${error.message}`
        });
        continue;
      }

      // Step 2b: Load schema for enhanced PII detection (optional)
      const schemaPath = path.join('./schemas', `${segmentName}.json`);
      const schemaPathResolved = path.resolve(schemaPath);

      // Step 2c: Export to CSV
      const csvPath = path.join(output, `${segmentName}.csv`);
      let exportResult;

      try {
        exportResult = await exportToCSVWithSchema(descriptions, csvPath, schemaPathResolved);
        console.log(chalk.green(`✓ CSV exported: ${exportResult.filepath}`));
        console.log(chalk.cyan(`  Rows: ${exportResult.rowCount}`));
        console.log(chalk.cyan(`  PII columns flagged: ${exportResult.piiCount}`));
      } catch (error) {
        console.error(chalk.red(`✗ Failed to export CSV for ${segmentName}`));
        console.error(chalk.red(`  ${error.message}`));
        results.failures.push({
          segment: segmentName,
          error: `CSV export failed: ${error.message}`
        });
        continue;
      }

      // Step 2d: Optional file opening (interactive mode only)
      if (!skipReview) {
        try {
          const shouldOpen = await promptOpenFile(csvPath);

          if (shouldOpen) {
            try {
              openWithDefaultApp(csvPath);
              console.log(chalk.green('✓ Opening CSV in default application...'));
            } catch (error) {
              // File opening failed (headless system, no default app, etc.)
              // Log warning but continue workflow (per RESEARCH.md Pitfall 6)
              console.log(chalk.yellow(`⚠ Could not open file automatically: ${error.message}`));
              console.log(chalk.yellow(`  Manually open: ${csvPath}`));
            }
          }
        } catch (error) {
          console.error(chalk.red(`✗ Prompt failed: ${error.message}`));
          results.failures.push({
            segment: segmentName,
            error: `Prompt failed: ${error.message}`
          });
          continue;
        }

        // Step 2e: Wait for user to finish editing
        try {
          await promptWaitForEdit(csvPath);
        } catch (error) {
          console.error(chalk.red(`✗ Wait prompt failed: ${error.message}`));
          results.failures.push({
            segment: segmentName,
            error: `Wait prompt failed: ${error.message}`
          });
          continue;
        }
      }

      // Success
      results.successes.push({
        segment: segmentName,
        filepath: csvPath,
        rowCount: exportResult.rowCount,
        piiCount: exportResult.piiCount
      });

    } catch (error) {
      // Catch-all for unexpected errors
      console.error(chalk.red(`✗ Unexpected error reviewing ${segmentName}`));
      console.error(chalk.red(`  ${error.message}`));
      results.failures.push({
        segment: segmentName,
        error: error.message
      });
    }
  }

  // Step 3: Summary report
  console.log(chalk.cyan(`\n${'='.repeat(60)}`));
  console.log(chalk.bold.cyan('REVIEW SUMMARY'));
  console.log(chalk.cyan(`${'='.repeat(60)}\n`));

  console.log(chalk.bold(`Processed ${results.successes.length}/${segmentsToReview.length} segment(s)`));

  if (results.successes.length > 0) {
    console.log(chalk.green('\nSuccessful exports:'));
    for (const success of results.successes) {
      console.log(chalk.green(`  ✓ ${success.segment}`));
      console.log(chalk.gray(`    ${success.rowCount} rows, ${success.piiCount} PII columns`));
      console.log(chalk.gray(`    ${success.filepath}`));
    }

    // Calculate total PII count
    const totalPII = results.successes.reduce((sum, s) => sum + s.piiCount, 0);

    console.log(chalk.cyan(`\nTotal PII columns flagged: ${totalPII}`));
    console.log(chalk.bold.white('\nNext steps:'));
    console.log(chalk.white('  1. Review CSV files in Excel/Google Sheets'));
    console.log(chalk.white('  2. Edit descriptions as needed'));
    console.log(chalk.white('  3. Run: node src/index.js validate <segment> to validate changes'));
  }

  if (results.failures.length > 0) {
    console.log(chalk.red('\nFailed exports:'));
    for (const failure of results.failures) {
      console.log(chalk.red(`  ✗ ${failure.segment}`));
      console.log(chalk.red(`    ${failure.error}`));
    }

    // Exit with error code if any failures
    console.log('');
    process.exit(1);
  }

  // All succeeded
  console.log('');
  process.exit(0);
}
