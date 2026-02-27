/**
 * Writeback Command
 *
 * Writes approved descriptions from validated CSV to Treasure Data via API
 * with progress reporting, error handling, and snapshot versioning.
 *
 * Workflow:
 * 1. Determine segments to process (from args or all validated CSVs)
 * 2. Load and prepare data (import CSV, fetch current schema, merge descriptions)
 * 3. Dry-run mode (if --dry-run flag, show payloads and exit)
 * 4. Confirmation prompt (unless --skip-review flag)
 * 5. Create before snapshot
 * 6. Execute write-back with progress bar (continue-on-error pattern)
 * 7. Create after snapshot (only on 100% success)
 * 8. Error reporting (write error log to reviews directory)
 * 9. Final summary (color-coded successes/failures)
 *
 * @module commands/writeback
 */

import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import inquirer from 'inquirer';
import cliProgress from 'cli-progress';
import { stdin } from 'process';
import { importCSV } from '../import/csv-importer.js';
import { updateTableSchema } from '../lib/td-api-client.js';
import { createSnapshot } from '../lib/snapshot-manager.js';
import { executeTdxCommand } from '../lib/tdx-client.js';

const { pathExists, readdir, writeJson } = fs;

/**
 * Writeback command - Write approved descriptions to Treasure Data via API.
 *
 * @param {string[]} segments - Array of segment names from CLI args, or undefined for all
 * @param {Object} options - Command options
 * @param {string} options.input - Input directory for CSV files (default: './reviews')
 * @param {boolean} options.dryRun - Preview changes without executing (default: false)
 * @param {boolean} options.skipReview - Skip confirmation prompts (default: false)
 * @returns {Promise<void>}
 */
export async function writeback(segments, options) {
  const {
    input = './reviews',
    dryRun = false,
    skipReview = false
  } = options;

  // TTY check for interactive mode
  if (!stdin.isTTY && !skipReview) {
    console.error(chalk.red('Error: Interactive prompts require TTY environment'));
    console.error(chalk.yellow('Use --skip-review flag for non-TTY environments (CI/CD)'));
    process.exit(1);
  }

  let segmentsToProcess = [];

  // Step 1: Determine segments to process
  if (segments && segments.length > 0) {
    // CLI args mode: use provided segment names
    segmentsToProcess = segments;
  } else {
    // Find all validated CSV files in reviews directory
    console.log(chalk.cyan('Finding all validated CSV files in reviews directory...'));
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
      segmentsToProcess = csvFiles.map(file => file.replace('.csv', ''));
      console.log(chalk.cyan(`Found ${segmentsToProcess.length} CSV file(s)\n`));
    } catch (error) {
      console.error(chalk.red('Failed to read reviews directory:'), error.message);
      process.exit(1);
    }
  }

  // Step 2: Load and prepare data
  const segmentData = [];
  let hasValidationErrors = false;

  for (const segmentName of segmentsToProcess) {
    console.log(chalk.cyan(`\n${'='.repeat(60)}`));
    console.log(chalk.cyan.bold(`Loading segment: ${segmentName}`));
    console.log(chalk.cyan(`${'='.repeat(60)}\n`));

    try {
      // Find CSV file
      const csvPath = path.join(input, `${segmentName}.csv`);

      if (!await pathExists(csvPath)) {
        console.error(chalk.red(`✗ CSV file not found: ${csvPath}`));
        console.error(chalk.yellow(`  Run: node src/index.js review ${segmentName}`));
        continue;
      }

      // Import and validate CSV
      let importResult;
      try {
        importResult = await importCSV(csvPath, segmentName);
      } catch (error) {
        console.error(chalk.red(`✗ Import failed for ${segmentName}`));
        console.error(chalk.red(`  ${error.message}`));
        continue;
      }

      // Check for validation errors
      const { valid, errors, errorLogPath } = importResult;

      if (errors.length > 0) {
        console.log(chalk.red(`✗ Validation errors found: ${errors.length}`));
        if (errorLogPath) {
          console.log(chalk.yellow(`  Error log: ${errorLogPath}`));
          console.log(chalk.yellow('  Fix errors and retry'));
        }
        hasValidationErrors = true;
        continue;
      }

      console.log(chalk.green(`✓ CSV validated: ${valid.length} rows`));

      // Load descriptions JSON to resolve actual table names
      // CSV 'table' column contains table_type (attribute/behavior/master), not the real table name
      const descPath = path.join('./descriptions', `${segmentName}-descriptions.json`);
      let descriptions = null;
      if (await pathExists(descPath)) {
        try {
          descriptions = await fs.readJson(descPath);
        } catch (err) {
          console.warn(chalk.yellow(`  Warning: Could not load descriptions: ${err.message}`));
        }
      }

      // Build a mapping from (table_type, column_name) -> actual (database, table_name)
      // using the descriptions JSON which has the real table structure
      const columnToTable = {};
      if (descriptions && descriptions.tables) {
        for (const t of descriptions.tables) {
          for (const col of t.columns || []) {
            const colName = col.column_name || col.name;
            const key = `${t.table_type}:${colName}`;
            // First match wins (handles duplicates)
            if (!columnToTable[key]) {
              columnToTable[key] = { database: t.database, table: t.table };
            }
          }
        }
      }

      // Group valid rows by actual table (resolved from descriptions)
      const tableGroups = {};
      for (const row of valid) {
        const lookupKey = `${row.table}:${row.column}`;
        const resolved = columnToTable[lookupKey];
        const database = resolved ? resolved.database : row.source;
        const tableName = resolved ? resolved.table : row.table;
        const tableKey = `${database}.${tableName}`;

        if (!tableGroups[tableKey]) {
          tableGroups[tableKey] = {
            database: database,
            table: tableName,
            columns: []
          };
        }
        tableGroups[tableKey].columns.push(row);
      }

      console.log(chalk.cyan(`  Tables: ${Object.keys(tableGroups).length}`));

      // For each table, fetch current schema via TDX and merge descriptions
      const tables = [];
      for (const [tableKey, tableData] of Object.entries(tableGroups)) {
        const { database, table, columns } = tableData;

        console.log(chalk.gray(`  Fetching current schema for ${database}.${table}...`));

        try {
          // Fetch current schema via TDX API
          const tdxResult = await executeTdxCommand([
            'api',
            `/v3/table/show/${database}/${table}`
          ]);

          // Extract schema from TDX result
          // TDX returns schema as a JSON string: "[[\"col\",\"type\",\"desc\"], ...]"
          let currentSchema = tdxResult.schema || [];
          if (typeof currentSchema === 'string') {
            currentSchema = JSON.parse(currentSchema);
          }

          // Build lookup map from CSV descriptions
          const descriptionMap = {};
          for (const col of columns) {
            descriptionMap[col.column] = col.description;
          }

          // Merge descriptions into current schema
          // Uses 4-element format for /v3/table/update-schema: [name, type, alias, description]
          // Set alias to null to preserve existing alias
          const mergedSchema = currentSchema.map(([columnName, columnType, oldAlias]) => {
            const newDescription = descriptionMap[columnName] || '';
            return [columnName, columnType, null, newDescription];
          });

          console.log(chalk.gray(`  ✓ Schema merged: ${mergedSchema.length} columns`));

          tables.push({
            database,
            table,
            schema: mergedSchema
          });

        } catch (error) {
          console.error(chalk.red(`  ✗ Failed to fetch schema for ${database}.${table}`));
          console.error(chalk.red(`    ${error.message}`));
          // Continue to next table instead of failing entire segment
        }
      }

      if (tables.length > 0) {
        segmentData.push({
          segment: segmentName,
          tables: tables
        });
        console.log(chalk.green(`\n✓ Loaded ${segmentName}: ${tables.length} tables ready`));
      } else {
        console.log(chalk.yellow(`\n⚠ No tables ready for ${segmentName}`));
      }

    } catch (error) {
      // Catch-all for unexpected errors
      console.error(chalk.red(`✗ Unexpected error loading ${segmentName}`));
      console.error(chalk.red(`  ${error.message}`));
    }
  }

  // Exit if validation errors found
  if (hasValidationErrors) {
    console.log('');
    console.error(chalk.red.bold('Validation errors found. Fix errors and try again.'));
    process.exit(1);
  }

  // Exit if no data to process
  if (segmentData.length === 0) {
    console.log(chalk.yellow('\nNo valid data to write back.'));
    process.exit(0);
  }

  // Calculate totals for summary
  const totalSegments = segmentData.length;
  const allTables = segmentData.flatMap(s => s.tables);
  const totalTables = allTables.length;
  const totalColumns = allTables.reduce((sum, t) => sum + t.schema.length, 0);

  // Step 3: Dry-run mode
  if (dryRun) {
    console.log(chalk.cyan(`\n${'='.repeat(60)}`));
    console.log(chalk.cyan.bold('DRY RUN MODE - No changes will be made'));
    console.log(chalk.cyan(`${'='.repeat(60)}\n`));

    console.log(chalk.yellow('Would update:'));
    console.log(chalk.white(`  Segments: ${totalSegments}`));
    console.log(chalk.white(`  Tables: ${totalTables}`));
    console.log(chalk.white(`  Columns: ${totalColumns}\n`));

    for (const { segment, tables } of segmentData) {
      console.log(chalk.cyan(`\nSegment: ${segment}`));
      for (const { database, table, schema } of tables) {
        console.log(chalk.yellow(`  ${database}.${table} (${schema.length} columns)`));
        console.log(chalk.gray('  Sample payload:'));
        console.log(chalk.gray(JSON.stringify({
          endpoint: `/v3/table/update/${database}/${table}`,
          schema: schema.slice(0, 3) // Show first 3 columns only
        }, null, 2)));
      }
    }

    console.log(chalk.cyan('\nDry run complete. Use without --dry-run to execute.'));
    process.exit(0);
  }

  // Step 4: Confirmation prompt (final safety gate before API calls)
  // This is the last opportunity for user to review scope and cancel
  // before any TD API modifications occur
  if (!skipReview) {
    console.log(chalk.cyan('\nReady to write descriptions to Treasure Data:'));
    console.log(chalk.white(`  Segments: ${totalSegments}`));
    console.log(chalk.white(`  Tables: ${totalTables}`));
    console.log(chalk.white(`  Columns: ${totalColumns}`));

    // Show sample table names (first 5 tables for scope visibility)
    const sampleTables = allTables.slice(0, 5).map(t => `${t.database}.${t.table}`);
    console.log(chalk.white(`  Sample tables: ${sampleTables.join(', ')}${allTables.length > 5 ? '...' : ''}`));

    const { confirmed } = await inquirer.prompt([{
      type: 'confirm',
      name: 'confirmed',
      message: 'Proceed with write-back to Treasure Data?',
      default: false // Default to false for safety
    }]);

    if (!confirmed) {
      console.log(chalk.yellow('\nWrite-back cancelled by user.'));
      process.exit(0);
    }
  } else {
    // Skip confirmation if --skip-review flag set (CI/CD automation)
    console.log(chalk.cyan('\nAutomated mode - proceeding with write-back'));
  }

  // Step 5: Create before snapshots for each segment
  console.log(chalk.cyan('\nCreating before snapshots...'));
  for (const { segment, tables } of segmentData) {
    try {
      const snapshotPath = await createSnapshot(segment, tables, 'before');
      console.log(chalk.gray(`  ✓ Before snapshot: ${snapshotPath}`));
    } catch (error) {
      console.error(chalk.red(`  ✗ Failed to create before snapshot for ${segment}`));
      console.error(chalk.red(`    ${error.message}`));
      console.error(chalk.yellow('  Aborting write-back (snapshot required for rollback)'));
      process.exit(1);
    }
  }

  // Step 6: Execute write-back with progress bar
  console.log(chalk.cyan('\nWriting to Treasure Data...\n'));

  const results = {
    successes: [],
    failures: []
  };

  // Create progress bar
  const progressBar = new cliProgress.SingleBar({
    format: 'Progress |' + chalk.cyan('{bar}') + '| {percentage}% | {value}/{total} Tables | Current: {current_table}',
    barCompleteChar: '\u2588',
    barIncompleteChar: '\u2591',
    hideCursor: true
  });

  progressBar.start(totalTables, 0, { current_table: 'Starting...' });

  let processedCount = 0;

  for (const { segment, tables } of segmentData) {
    for (const { database, table, schema } of tables) {
      const tableFullName = `${database}.${table}`;
      progressBar.update(processedCount, { current_table: tableFullName });

      try {
        // Call TD API to update table schema
        await updateTableSchema(database, table, schema);

        console.log(chalk.green(`  ✓ ${tableFullName}`));
        results.successes.push({
          segment,
          table: tableFullName,
          columns: schema.length
        });

      } catch (error) {
        console.log(chalk.red(`  ✗ ${tableFullName}: ${error.message}`));
        results.failures.push({
          segment,
          table: tableFullName,
          error: error.message,
          status: error.response?.status,
          details: error.response?.data
        });
      }

      processedCount++;
    }
  }

  progressBar.update(totalTables, { current_table: 'Complete' });
  progressBar.stop();

  // Step 7: Create after snapshots (only if 100% success)
  if (results.failures.length === 0) {
    console.log(chalk.cyan('\nCreating after snapshots...'));
    for (const { segment, tables } of segmentData) {
      try {
        const snapshotPath = await createSnapshot(segment, tables, 'after');
        console.log(chalk.gray(`  ✓ After snapshot: ${snapshotPath}`));
      } catch (error) {
        console.error(chalk.red(`  ✗ Failed to create after snapshot for ${segment}`));
        console.error(chalk.red(`    ${error.message}`));
      }
    }
  } else {
    console.log(chalk.yellow('\n⚠ Skipping after snapshot (failures occurred)'));
  }

  // Step 8: Error reporting
  if (results.failures.length > 0) {
    // Group failures by segment
    const failuresBySegment = {};
    for (const failure of results.failures) {
      if (!failuresBySegment[failure.segment]) {
        failuresBySegment[failure.segment] = [];
      }
      failuresBySegment[failure.segment].push(failure);
    }

    // Write error logs per segment
    for (const [segment, failures] of Object.entries(failuresBySegment)) {
      const errorLog = {
        segment,
        timestamp: new Date().toISOString(),
        totalFailures: failures.length,
        errors: failures.map(f => ({
          table: f.table,
          error: f.error,
          statusCode: f.status,
          apiResponse: f.details,
          retryable: [429, 500, 503].includes(f.status)
        }))
      };

      const errorPath = path.join(input, `${segment}-writeback-errors.json`);
      try {
        await writeJson(errorPath, errorLog, { spaces: 2 });
        console.log(chalk.yellow(`\nError log written to: ${errorPath}`));
      } catch (error) {
        console.error(chalk.red(`Failed to write error log: ${error.message}`));
      }
    }
  }

  // Step 9: Final summary
  console.log(chalk.cyan(`\n${'='.repeat(60)}`));
  console.log(chalk.bold.cyan('WRITE-BACK SUMMARY'));
  console.log(chalk.cyan(`${'='.repeat(60)}\n`));

  console.log(chalk.bold(`Total tables: ${totalTables}`));
  console.log(chalk.green(`  Successes: ${results.successes.length}`));
  if (results.failures.length > 0) {
    console.log(chalk.red(`  Failures: ${results.failures.length}`));
  }

  if (results.successes.length > 0) {
    console.log(chalk.green(`\nSuccessful tables (${results.successes.length}):`));
    for (const success of results.successes) {
      console.log(chalk.green(`  ✓ ${success.table} (${success.columns} columns)`));
    }
  }

  if (results.failures.length > 0) {
    console.log(chalk.red(`\nFailed tables (${results.failures.length}):`));
    for (const failure of results.failures) {
      console.log(chalk.red(`  ✗ ${failure.table}`));
      console.log(chalk.red(`    ${failure.error}`));
      if (failure.status) {
        console.log(chalk.gray(`    Status: ${failure.status}`));
      }
    }

    console.log('');
    console.error(chalk.red.bold('Write-back completed with errors.'));
    process.exit(1);
  }

  // All succeeded
  console.log('');
  console.log(chalk.green.bold('✓ Write-back completed successfully!'));
  process.exit(0);
}
