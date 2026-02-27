/**
 * Validate Command
 *
 * Validates edited CSV files before write-back preparation.
 * Imports CSV with full validation, displays results, and prompts for confirmation.
 *
 * Workflow:
 * 1. Find CSV files in reviews directory for specified segments
 * 2. Import and validate each CSV (calls importCSV from csv-importer)
 * 3. Display validation summary (valid count, error count)
 * 4. Show error log path if validation errors exist
 * 5. Confirmation prompt showing segment/table/column counts before proceeding
 * 6. Exit with code 1 if validation errors
 * 7. --skip-review flag bypasses confirmation for CI/CD
 *
 * @module commands/validate
 */

import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { stdin } from 'process';
import { importCSV } from '../import/csv-importer.js';

const { pathExists, readdir } = fs;

/**
 * Validate command - Validate edited CSV files before write-back.
 *
 * @param {string[]} segments - Array of segment names from CLI args, or undefined for all
 * @param {Object} options - Command options
 * @param {string} options.input - Input directory for CSV files (default: './reviews')
 * @param {boolean} options.skipReview - Skip confirmation prompt (default: false)
 * @returns {Promise<void>}
 */
export async function validate(segments, options) {
  const {
    input = './reviews',
    skipReview = false
  } = options;

  // TTY check for interactive mode
  if (!stdin.isTTY && !skipReview) {
    console.error(chalk.red('Error: Interactive prompts require TTY environment'));
    console.error(chalk.yellow('Use --skip-review flag for non-TTY environments (CI/CD)'));
    process.exit(1);
  }

  let segmentsToValidate = [];

  // Step 1: Determine which segments to validate
  if (segments && segments.length > 0) {
    // CLI args mode: use provided segment names
    segmentsToValidate = segments;
  } else {
    // Find all CSV files in reviews directory
    console.log(chalk.cyan('Finding all CSV files in reviews directory...'));
    try {
      if (!await pathExists(input)) {
        console.error(chalk.red(`✗ Reviews directory not found: ${input}`));
        console.error(chalk.yellow('Run: node src/index.js review <segment> first'));
        process.exit(1);
      }

      const reviewFiles = await readdir(input);
      const csvFiles = reviewFiles.filter(file =>
        file.endsWith('.csv') && !file.endsWith('-errors.csv')
      );

      if (csvFiles.length === 0) {
        console.log(chalk.yellow('No CSV files found in reviews directory.'));
        console.log(chalk.yellow('Run: node src/index.js review <segment> first.'));
        process.exit(0);
      }

      // Extract segment names from filenames (remove .csv suffix)
      segmentsToValidate = csvFiles.map(file => file.replace('.csv', ''));
      console.log(chalk.cyan(`Found ${segmentsToValidate.length} CSV file(s)\n`));
    } catch (error) {
      console.error(chalk.red('Failed to read reviews directory:'), error.message);
      process.exit(1);
    }
  }

  // Step 2: Validate each segment
  const results = {
    successes: [],
    failures: []
  };

  let totalValid = 0;
  let totalInvalid = 0;
  let totalTables = new Set();
  let totalColumns = 0;

  for (const segmentName of segmentsToValidate) {
    console.log(chalk.cyan(`\n${'='.repeat(60)}`));
    console.log(chalk.cyan.bold(`Validating segment: ${segmentName}`));
    console.log(chalk.cyan(`${'='.repeat(60)}\n`));

    try {
      // Find CSV file
      const csvPath = path.join(input, `${segmentName}.csv`);

      if (!await pathExists(csvPath)) {
        console.error(chalk.red(`✗ CSV file not found: ${csvPath}`));
        console.error(chalk.yellow(`  Run: node src/index.js review ${segmentName}`));
        results.failures.push({
          segment: segmentName,
          error: 'CSV file not found'
        });
        continue;
      }

      // Import and validate CSV
      let importResult;
      try {
        importResult = await importCSV(csvPath, segmentName);
      } catch (error) {
        console.error(chalk.red(`✗ Import failed for ${segmentName}`));
        console.error(chalk.red(`  ${error.message}`));
        results.failures.push({
          segment: segmentName,
          error: `Import failed: ${error.message}`
        });
        continue;
      }

      // Display validation results
      const { valid, errors, summary, errorLogPath } = importResult;

      // Calculate table stats from valid rows
      const tablesInSegment = new Set(valid.map(row => row.table));
      const tableCount = tablesInSegment.size;
      const columnCount = valid.length;

      // Check for success: no errors
      if (errors.length === 0) {
        console.log(chalk.green(`✓ Validation passed`));
        console.log(chalk.cyan(`  Valid rows: ${summary.validCount}`));
        console.log(chalk.cyan(`  Tables: ${tableCount}`));
        console.log(chalk.cyan(`  Columns: ${columnCount}`));

        // Track totals
        totalValid += summary.validCount;
        totalColumns += columnCount;
        tablesInSegment.forEach(table => totalTables.add(table));

        results.successes.push({
          segment: segmentName,
          validRows: summary.validCount,
          tableCount: tableCount,
          columnCount: columnCount,
          tables: Array.from(tablesInSegment)
        });
      } else {
        console.log(chalk.red(`✗ Validation failed`));
        console.log(chalk.red(`  Valid rows: ${summary.validCount}`));
        console.log(chalk.red(`  Invalid rows: ${errors.length}`));

        if (errorLogPath) {
          console.log(chalk.yellow(`  Error log: ${errorLogPath}`));
          console.log(chalk.yellow('  Review errors and fix CSV before retrying'));
        }

        // Track totals
        totalValid += summary.validCount;
        totalInvalid += errors.length;

        results.failures.push({
          segment: segmentName,
          error: `Validation errors: ${errors.length}`,
          errorLogPath: errorLogPath,
          validRows: summary.validRows,
          invalidRows: errors.length
        });
      }

    } catch (error) {
      // Catch-all for unexpected errors
      console.error(chalk.red(`✗ Unexpected error validating ${segmentName}`));
      console.error(chalk.red(`  ${error.message}`));
      results.failures.push({
        segment: segmentName,
        error: error.message
      });
    }
  }

  // Step 3: Summary report
  console.log(chalk.cyan(`\n${'='.repeat(60)}`));
  console.log(chalk.bold.cyan('VALIDATION SUMMARY'));
  console.log(chalk.cyan(`${'='.repeat(60)}\n`));

  console.log(chalk.bold(`Total rows: ${totalValid + totalInvalid}`));
  console.log(chalk.green(`  Valid: ${totalValid}`));
  if (totalInvalid > 0) {
    console.log(chalk.red(`  Invalid: ${totalInvalid}`));
  }

  if (results.successes.length > 0) {
    console.log(chalk.green(`\nValid segments (${results.successes.length}):`));
    for (const success of results.successes) {
      console.log(chalk.green(`  ✓ ${success.segment}`));
      console.log(chalk.gray(`    ${success.validRows} rows, ${success.tableCount} tables, ${success.columnCount} columns`));
    }
  }

  if (results.failures.length > 0) {
    console.log(chalk.red(`\nFailed segments (${results.failures.length}):`));
    for (const failure of results.failures) {
      console.log(chalk.red(`  ✗ ${failure.segment}`));
      console.log(chalk.red(`    ${failure.error}`));
      if (failure.errorLogPath) {
        console.log(chalk.yellow(`    Error log: ${failure.errorLogPath}`));
      }
    }

    // Exit with error code if validation errors
    console.log('');
    console.error(chalk.red.bold('Validation failed. Fix errors and try again.'));
    process.exit(1);
  }

  // Step 4: Confirmation prompt (if not --skip-review)
  if (!skipReview) {
    console.log(chalk.cyan('\nReady to proceed with validated data:'));
    console.log(chalk.white(`  Segments: ${results.successes.length}`));
    console.log(chalk.white(`  Tables: ${totalTables.size}`));
    console.log(chalk.white(`  Columns: ${totalColumns}`));

    const { confirmed } = await inquirer.prompt([{
      type: 'confirm',
      name: 'confirmed',
      message: 'Proceed to Phase 4 write-back preparation?',
      default: false
    }]);

    if (confirmed) {
      console.log(chalk.green('\n✓ Validation approved. Ready for Phase 4.'));
    } else {
      console.log(chalk.yellow('\nValidation cancelled by user.'));
      process.exit(0);
    }
  } else {
    console.log(chalk.cyan('\nValidation complete (automated mode).'));
  }

  // All succeeded
  console.log('');
  process.exit(0);
}
