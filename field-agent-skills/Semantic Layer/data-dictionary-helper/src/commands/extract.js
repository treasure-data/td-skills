/**
 * Extract Command
 *
 * Main extraction command that orchestrates segment selection, schema extraction,
 * validation, optional sample data fetching, and storage to JSON files.
 *
 * Supports three modes:
 * 1. Interactive mode: selectSegments() multi-select picker
 * 2. CLI args mode: specific segment names provided as arguments
 * 3. Batch mode: --batch flag extracts all available segments
 *
 * @module commands/extract
 */

import { executeTdxCommand } from '../lib/tdx-client.js';
import { validateExtractedSchema } from '../lib/schema-validator.js';
import { redactPII } from '../lib/pii-detector.js';
import { selectSegments } from '../prompts/segment-picker.js';
import { promptForSampleData } from '../prompts/sample-data.js';
import { saveSchema } from '../lib/storage.js';
import chalk from 'chalk';
import ora from 'ora';

/**
 * Extract schema for one or more segments with validation and optional sample data.
 *
 * @param {string[]} segmentNames - Array of segment names from CLI args, or undefined for interactive mode
 * @param {Object} options - Command options
 * @param {boolean} options.sample - Fetch sample data (--sample flag)
 * @param {string} options.output - Output directory (--output flag, default: './schemas')
 * @param {boolean} options.batch - Batch mode: extract all segments (--batch flag)
 * @returns {Promise<void>}
 */
export async function extract(segmentNames, options) {
  const { sample = false, output = './schemas', batch = false } = options;

  let segmentsToExtract = [];

  // Step 1: Determine segments to extract
  if (batch) {
    // Batch mode: fetch all available segments
    console.log(chalk.cyan('Fetching all available segments...'));
    try {
      const segments = await executeTdxCommand(['ps', 'list', '--json']);
      if (!segments || segments.length === 0) {
        console.log(chalk.yellow('No Parent Segments found.'));
        process.exit(0);
      }
      segmentsToExtract = segments.map(seg => seg.name);
      console.log(chalk.cyan(`Found ${segmentsToExtract.length} segment(s) to extract\n`));
    } catch (error) {
      console.error(chalk.red('Failed to fetch segments:'), error.message);
      process.exit(1);
    }
  } else if (segmentNames && segmentNames.length > 0) {
    // CLI args mode: use provided segment names
    segmentsToExtract = segmentNames;
  } else {
    // Interactive mode: use segment picker
    segmentsToExtract = await selectSegments();
    if (segmentsToExtract.length === 0) {
      console.log(chalk.yellow('No segments selected. Exiting.'));
      process.exit(0);
    }
  }

  // Step 2: Process each segment with collect-all-errors strategy
  const results = {
    successes: [],
    failures: []
  };

  for (const segmentName of segmentsToExtract) {
    const spinner = ora(`Extracting ${segmentName}...`).start();

    try {
      // Step 2a: Fetch segment structure from TDX
      let segmentView;

      try {
        segmentView = await executeTdxCommand(['ps', 'view', segmentName, '--json']);
      } catch (error) {
        spinner.fail(`Failed to fetch segment view for ${segmentName}`);
        results.failures.push({
          segment: segmentName,
          error: `TDX command failed: ${error.message}`
        });
        continue;
      }

      // Step 2a-ii: Fetch column schemas per table using SHOW COLUMNS
      // This replaces `ps desc` — SHOW COLUMNS returns clean JSON with Column, Type, Comment
      const fetchTableColumns = async (database, table) => {
        if (!database || !table) return [];
        const rows = await executeTdxCommand([
          'query', '-d', database,
          `SHOW COLUMNS FROM ${table}`,
          '--json'
        ]);
        return (rows || []).map(row => ({
          name: row.Column,
          type: row.Type,
          comment: row.Comment || ''
        }));
      };

      // Resolve table references from segmentView
      const masterDb = segmentView.master?.parentDatabaseName || segmentView.master?.database || '';
      const masterTable = segmentView.master?.parentTableName || segmentView.master?.table || '';

      const behaviorRefs = (segmentView.behaviors || []).map(beh => ({
        database: beh.matrixDatabaseName || beh.parentDatabaseName || beh.database || '',
        table: beh.matrixTableName || beh.parentTableName || beh.table || ''
      }));

      const attributeRefs = (segmentView.attributes || []).map(attr => ({
        database: attr.parentDatabaseName || attr.database || '',
        table: attr.parentTableName || attr.table || ''
      }));

      // Fetch all table schemas in parallel
      let masterColumns, behaviorColumnSets, attributeColumnSets;
      try {
        const [masterCols, ...restCols] = await Promise.all([
          fetchTableColumns(masterDb, masterTable),
          ...behaviorRefs.map(ref => fetchTableColumns(ref.database, ref.table)),
          ...attributeRefs.map(ref => fetchTableColumns(ref.database, ref.table))
        ]);
        masterColumns = masterCols;
        behaviorColumnSets = restCols.slice(0, behaviorRefs.length);
        attributeColumnSets = restCols.slice(behaviorRefs.length);
      } catch (error) {
        spinner.fail(`Failed to fetch column schemas for ${segmentName}`);
        results.failures.push({
          segment: segmentName,
          error: `SHOW COLUMNS query failed: ${error.message}`
        });
        continue;
      }

      const extractedSchema = {
        segment_name: segmentName,
        master: {
          database: masterDb,
          table: masterTable,
          columns: masterColumns
        },
        attributes: attributeRefs.map((ref, idx) => ({
          database: ref.database,
          table: ref.table,
          columns: attributeColumnSets[idx] || []
        })),
        behaviors: behaviorRefs.map((ref, idx) => ({
          database: ref.database,
          table: ref.table,
          columns: behaviorColumnSets[idx] || []
        }))
      };

      // Step 2b: Optional sample data
      const shouldFetchSamples = sample || await promptForSampleData(segmentName);

      if (shouldFetchSamples) {
        spinner.text = `Extracting ${segmentName}... (fetching sample data)`;
        const samples = {};

        // Fetch master table samples
        if (extractedSchema.master.database && extractedSchema.master.table) {
          try {
            const masterSamples = await executeTdxCommand([
              'query',
              '-d', extractedSchema.master.database,
              `SELECT * FROM ${extractedSchema.master.table} LIMIT 50`,
              '--json'
            ]);
            samples.master = redactPII(masterSamples);
          } catch (error) {
            // Log warning but continue - sample data is optional
            console.warn(chalk.yellow(`\n  Warning: Could not fetch master samples: ${error.message}`));
          }
        }

        // Fetch attribute table samples
        samples.attributes = [];
        for (const attr of extractedSchema.attributes) {
          if (attr.database && attr.table) {
            try {
              const attrSamples = await executeTdxCommand([
                'query',
                '-d', attr.database,
                `SELECT * FROM ${attr.table} LIMIT 50`,
                '--json'
              ]);
              samples.attributes.push(redactPII(attrSamples));
            } catch (error) {
              console.warn(chalk.yellow(`\n  Warning: Could not fetch attribute samples for ${attr.table}: ${error.message}`));
              samples.attributes.push([]);
            }
          } else {
            samples.attributes.push([]);
          }
        }

        // Fetch behavior table samples
        samples.behaviors = [];
        for (const beh of extractedSchema.behaviors) {
          if (beh.database && beh.table) {
            try {
              const behSamples = await executeTdxCommand([
                'query',
                '-d', beh.database,
                `SELECT * FROM ${beh.table} LIMIT 50`,
                '--json'
              ]);
              samples.behaviors.push(redactPII(behSamples));
            } catch (error) {
              console.warn(chalk.yellow(`\n  Warning: Could not fetch behavior samples for ${beh.table}: ${error.message}`));
              samples.behaviors.push([]);
            }
          } else {
            samples.behaviors.push([]);
          }
        }

        // Include samples in schema output
        extractedSchema.samples = samples;
      }

      // Step 2c: Validate schema
      spinner.text = `Extracting ${segmentName}... (validating)`;

      // Build TDX raw schema for validation (same structure without samples)
      const tdxRawSchema = {
        segment_name: segmentName,
        master: extractedSchema.master,
        attributes: extractedSchema.attributes,
        behaviors: extractedSchema.behaviors
      };

      try {
        const validationResult = validateExtractedSchema(extractedSchema, tdxRawSchema);

        // Log warnings if any (missing columns, empty table types)
        if (validationResult.warnings && validationResult.warnings.length > 0) {
          for (const warning of validationResult.warnings) {
            console.warn(chalk.yellow(`\n  Warning: ${warning}`));
          }
        }
      } catch (validationError) {
        // Hallucinated columns detected - fail extraction
        spinner.fail(`Validation failed for ${segmentName}`);
        results.failures.push({
          segment: segmentName,
          error: `Schema validation failed: ${validationError.message}`
        });
        continue;
      }

      // Step 2d: Save schema
      spinner.text = `Extracting ${segmentName}... (saving)`;

      try {
        await saveSchema(segmentName, extractedSchema, output);
        spinner.succeed(chalk.green(`${segmentName} extracted`));
        results.successes.push({
          segment: segmentName,
          filepath: `${output}/${segmentName}.json`
        });
      } catch (saveError) {
        spinner.fail(`Failed to save ${segmentName}`);
        results.failures.push({
          segment: segmentName,
          error: `Save failed: ${saveError.message}`
        });
      }

    } catch (error) {
      // Catch-all for unexpected errors
      spinner.fail(`Failed to extract ${segmentName}`);
      results.failures.push({
        segment: segmentName,
        error: error.message
      });
    }
  }

  // Step 3: Summary report
  console.log(''); // Empty line for spacing
  console.log(chalk.bold(`Extracted ${results.successes.length}/${segmentsToExtract.length} segment(s)`));

  if (results.successes.length > 0) {
    console.log(chalk.green('\nSuccessful extractions:'));
    for (const success of results.successes) {
      console.log(chalk.green(`  ✓ ${success.segment}`));
    }
  }

  if (results.failures.length > 0) {
    console.log(chalk.red('\nFailed extractions:'));
    for (const failure of results.failures) {
      console.log(chalk.red(`  ✗ ${failure.segment}`));
      console.log(chalk.red(`    ${failure.error}`));
    }

    // Exit with error code if any failures
    process.exit(1);
  }

  // All succeeded
  console.log('');
  process.exit(0);
}
