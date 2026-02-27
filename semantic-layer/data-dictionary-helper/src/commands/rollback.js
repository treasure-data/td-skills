/**
 * Rollback Command
 *
 * Restores table schemas to previous state using before snapshots.
 * Supports both full segment rollback and per-table granular rollback.
 *
 * Workflow:
 * 1. List snapshots mode: show available snapshots with metadata
 * 2. Load most recent before snapshot
 * 3. Filter tables if granular rollback requested
 * 4. Confirmation prompt showing scope and warning
 * 5. Execute rollback via TD API (continue on error)
 * 6. Terminal summary with successes/failures
 *
 * @module commands/rollback
 */

import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { stdin } from 'process';
import { loadMostRecentSnapshot, listSnapshots } from '../lib/snapshot-manager.js';
import { updateTableSchema } from '../lib/td-api-client.js';

const { pathExists } = fs;

/**
 * Rollback command - Restore schemas from before snapshot.
 *
 * @param {string} segment - Segment name to rollback (required)
 * @param {Object} options - Command options
 * @param {string[]} options.tables - Specific tables to rollback (default: all)
 * @param {boolean} options.listSnapshots - List available snapshots and exit
 * @param {boolean} options.skipReview - Skip confirmation prompt (default: false)
 * @returns {Promise<void>}
 */
export async function rollback(segment, options) {
  const {
    tables = [],
    listSnapshots: listSnapshotsMode = false,
    skipReview = false
  } = options;

  // TTY check for interactive mode
  if (!stdin.isTTY && !skipReview) {
    console.error(chalk.red('Error: Interactive prompts require TTY environment'));
    console.error(chalk.yellow('Use --skip-review flag for non-TTY environments (CI/CD)'));
    process.exit(1);
  }

  // Step 1: List snapshots mode (exit early)
  if (listSnapshotsMode) {
    try {
      const snapshots = await listSnapshots(segment);

      if (snapshots.length === 0) {
        console.log(chalk.yellow(`No snapshots found for segment: ${segment}`));
        console.log(chalk.gray('Snapshots are created automatically during write-back operations.'));
        process.exit(0);
      }

      console.log(chalk.cyan.bold(`\nSnapshots for segment: ${segment}\n`));
      console.log(chalk.cyan(`${'='.repeat(70)}`));

      for (const snapshot of snapshots) {
        const typeColor = snapshot.type === 'before' ? chalk.green : chalk.blue;
        console.log(typeColor(`\n[${snapshot.type.toUpperCase()}]`));
        console.log(chalk.white(`  Timestamp: ${snapshot.timestamp}`));
        console.log(chalk.white(`  Tables: ${snapshot.tableCount}`));
        console.log(chalk.gray(`  Path: ${snapshot.path}`));
      }

      console.log(chalk.cyan(`\n${'='.repeat(70)}\n`));
      console.log(chalk.gray('Use rollback without --list-snapshots to restore from most recent before snapshot.'));
      process.exit(0);

    } catch (error) {
      console.error(chalk.red('Failed to list snapshots:'), error.message);
      process.exit(1);
    }
  }

  // Step 2: Load most recent before snapshot
  console.log(chalk.cyan(`\nLoading before snapshot for: ${segment}\n`));

  let snapshot;
  try {
    snapshot = await loadMostRecentSnapshot(segment, 'before');
  } catch (error) {
    if (error.message.includes('No before snapshot')) {
      console.error(chalk.red(`✗ No rollback available for segment: ${segment}`));
      console.error(chalk.yellow('\nWrite-back may not have been executed yet.'));
      console.error(chalk.gray('Before snapshots are created automatically during write-back.'));
      process.exit(1);
    }

    console.error(chalk.red('Failed to load snapshot:'), error.message);
    process.exit(1);
  }

  console.log(chalk.green(`✓ Before snapshot loaded`));
  console.log(chalk.cyan(`  Timestamp: ${snapshot.timestamp}`));
  console.log(chalk.cyan(`  Total tables: ${snapshot.tables.length}`));

  // Step 3: Determine tables to rollback
  let tablesToRollback = snapshot.tables;

  if (tables.length > 0) {
    // Granular rollback: filter by provided table names
    const snapshotTableNames = snapshot.tables.map(t => t.name);
    const invalidTables = tables.filter(t => !snapshotTableNames.includes(t));

    if (invalidTables.length > 0) {
      console.error(chalk.red('\n✗ Invalid table names:'), invalidTables.join(', '));
      console.error(chalk.yellow('\nAvailable tables in snapshot:'));
      snapshotTableNames.forEach(name => console.error(chalk.gray(`  - ${name}`)));
      process.exit(1);
    }

    tablesToRollback = snapshot.tables.filter(t => tables.includes(t.name));
    console.log(chalk.cyan(`\nGranular rollback: ${tablesToRollback.length} table(s) selected\n`));
  } else {
    console.log(chalk.cyan(`\nFull segment rollback: all tables\n`));
  }

  // Step 4: Confirmation prompt (if not --skip-review)
  if (!skipReview) {
    console.log(chalk.yellow.bold('⚠ ROLLBACK CONFIRMATION'));
    console.log(chalk.yellow('─'.repeat(70)));
    console.log(chalk.white(`\nSegment: ${segment}`));
    console.log(chalk.white(`Snapshot: ${snapshot.timestamp}`));
    console.log(chalk.white(`Tables to rollback: ${tablesToRollback.length}`));

    console.log(chalk.gray('\nTables:'));
    tablesToRollback.forEach(t => {
      console.log(chalk.gray(`  - ${t.database}.${t.name} (${t.schema.length} columns)`));
    });

    console.log(chalk.red.bold('\n⚠ WARNING: This will OVERWRITE current descriptions in Treasure Data'));
    console.log(chalk.yellow('Current column descriptions will be replaced with values from the snapshot.\n'));

    const { confirmed } = await inquirer.prompt([{
      type: 'confirm',
      name: 'confirmed',
      message: 'Proceed with rollback?',
      default: false
    }]);

    if (!confirmed) {
      console.log(chalk.yellow('\nRollback cancelled by user.'));
      process.exit(0);
    }
  }

  // Step 5: Execute rollback
  console.log(chalk.cyan(`\n${'='.repeat(70)}`));
  console.log(chalk.cyan.bold('EXECUTING ROLLBACK'));
  console.log(chalk.cyan(`${'='.repeat(70)}\n`));

  const results = {
    successes: [],
    failures: []
  };

  for (const table of tablesToRollback) {
    const tableName = `${table.database}.${table.name}`;

    try {
      // Call TD API to update table schema
      await updateTableSchema(table.database, table.name, table.schema);

      console.log(chalk.green(`✓ ${tableName}`));
      results.successes.push({
        database: table.database,
        table: table.name,
        columnCount: table.schema.length
      });

    } catch (error) {
      console.log(chalk.red(`✗ ${tableName}`));
      console.log(chalk.red(`  Error: ${error.message}`));

      results.failures.push({
        database: table.database,
        table: table.name,
        error: error.message
      });
    }
  }

  // Step 6: Summary
  console.log(chalk.cyan(`\n${'='.repeat(70)}`));
  console.log(chalk.bold.cyan('ROLLBACK SUMMARY'));
  console.log(chalk.cyan(`${'='.repeat(70)}\n`));

  console.log(chalk.bold(`Total tables: ${tablesToRollback.length}`));
  console.log(chalk.green(`  Successful: ${results.successes.length}`));
  console.log(chalk.red(`  Failed: ${results.failures.length}`));

  if (results.successes.length > 0) {
    console.log(chalk.green(`\n✓ Successfully rolled back (${results.successes.length}):`));
    for (const success of results.successes) {
      console.log(chalk.green(`  ${success.database}.${success.table}`));
      console.log(chalk.gray(`    ${success.columnCount} columns restored`));
    }
  }

  if (results.failures.length > 0) {
    console.log(chalk.red(`\n✗ Failed to rollback (${results.failures.length}):`));
    for (const failure of results.failures) {
      console.log(chalk.red(`  ${failure.database}.${failure.table}`));
      console.log(chalk.red(`    ${failure.error}`));
    }

    console.log('');
    console.error(chalk.red.bold('Rollback completed with errors. Review failures above.'));
    console.error(chalk.yellow('You may retry rollback for specific tables using --tables flag.'));
    process.exit(1);
  }

  // All succeeded
  console.log('');
  console.log(chalk.green.bold('✓ Rollback completed successfully'));
  process.exit(0);
}
