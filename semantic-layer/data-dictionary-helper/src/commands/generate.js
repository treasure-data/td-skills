/**
 * Generate Command
 *
 * Orchestrates AI description generation for extracted schemas. Supports two modes:
 *
 * 1. API Mode (requires ANTHROPIC_API_KEY): Automated generation via Claude API
 * 2. Claude Code Mode (--claude-code): Outputs prompt for use with Claude Code
 *
 * Also supports:
 * - Interactive mode: segment picker if no args provided
 * - CLI args mode: specific segment names provided
 * - Batch mode: --batch flag generates for all extracted schemas
 *
 * @module commands/generate
 */

import fs from 'fs-extra';
import { join } from 'path';
import chalk from 'chalk';
import ora from 'ora';
import { loadSchema } from '../lib/storage.js';
import { gatherBusinessContext } from '../prompts/context-gatherer.js';
import { generateDescriptions } from '../lib/description-generator.js';
import { selectSegments } from '../prompts/segment-picker.js';

const { ensureDir, writeJson, readdir } = fs;

/**
 * Check if Anthropic API key is configured.
 * @returns {boolean} True if ANTHROPIC_API_KEY is set
 */
function hasApiKey() {
  return !!process.env.ANTHROPIC_API_KEY;
}

/**
 * Generate AI descriptions for one or more segments.
 *
 * @param {string[]} segments - Array of segment names from CLI args, or undefined for interactive mode
 * @param {Object} options - Command options
 * @param {string} options.output - Output directory for description files (--output flag, default: './descriptions')
 * @param {boolean} options.batch - Batch mode: generate for all extracted schemas (--batch flag)
 * @returns {Promise<void>}
 */
export async function generate(segments, options) {
  const { output = './descriptions', batch = false, claudeCode = false } = options;

  // Check for Claude Code mode or missing API key
  if (claudeCode || !hasApiKey()) {
    await generateClaudeCodePrompt(segments, options);
    return;
  }

  let segmentsToGenerate = [];

  // Step 1: Determine which segments to process
  if (batch) {
    // Batch mode: find all extracted schemas in ./schemas directory
    console.log(chalk.cyan('Finding all extracted schemas...'));
    try {
      const schemaFiles = await readdir('./schemas');
      const jsonFiles = schemaFiles.filter(file => file.endsWith('.json'));

      if (jsonFiles.length === 0) {
        console.log(chalk.yellow('No extracted schemas found in ./schemas directory.'));
        console.log(chalk.yellow('Run: dd-extract extract <segment> first.'));
        process.exit(0);
      }

      // Extract segment names from filenames (remove .json extension)
      segmentsToGenerate = jsonFiles.map(file => file.replace('.json', ''));
      console.log(chalk.cyan(`Found ${segmentsToGenerate.length} extracted schema(s)\n`));
    } catch (error) {
      console.error(chalk.red('Failed to read schemas directory:'), error.message);
      process.exit(1);
    }
  } else if (segments && segments.length > 0) {
    // CLI args mode: use provided segment names
    segmentsToGenerate = segments;
  } else {
    // Interactive mode: use segment picker to choose from extracted schemas
    try {
      const schemaFiles = await readdir('./schemas');
      const availableSegments = schemaFiles
        .filter(file => file.endsWith('.json'))
        .map(file => file.replace('.json', ''));

      if (availableSegments.length === 0) {
        console.log(chalk.yellow('No extracted schemas found.'));
        console.log(chalk.yellow('Run: dd-extract extract <segment> first.'));
        process.exit(0);
      }

      // Use segment picker (will show available schemas)
      segmentsToGenerate = await selectSegments();
      if (segmentsToGenerate.length === 0) {
        console.log(chalk.yellow('No segments selected. Exiting.'));
        process.exit(0);
      }
    } catch (error) {
      console.error(chalk.red('Failed to list available schemas:'), error.message);
      process.exit(1);
    }
  }

  // Ensure output directory exists
  await ensureDir(output);

  // Step 2: Process each segment
  const results = {
    successes: [],
    failures: []
  };

  for (const segmentName of segmentsToGenerate) {
    console.log(chalk.cyan(`\n${'='.repeat(60)}`));
    console.log(chalk.cyan.bold(`Processing segment: ${segmentName}`));
    console.log(chalk.cyan(`${'='.repeat(60)}\n`));

    try {
      // Step 2a: Load schema
      let schema;
      try {
        schema = await loadSchema(segmentName, './schemas');
      } catch (error) {
        console.error(chalk.red(`✗ Failed to load schema for ${segmentName}`));
        console.error(chalk.red(`  ${error.message}`));
        results.failures.push({
          segment: segmentName,
          error: `Schema load failed: ${error.message}`
        });
        continue;
      }

      // Step 2b: Gather business context
      console.log(chalk.bold('Gathering business context...\n'));
      let context;
      try {
        context = await gatherBusinessContext(segmentName, schema.samples);
      } catch (error) {
        console.error(chalk.red(`✗ Failed to gather context for ${segmentName}`));
        console.error(chalk.red(`  ${error.message}`));
        results.failures.push({
          segment: segmentName,
          error: `Context gathering failed: ${error.message}`
        });
        continue;
      }

      // Step 2c: Generate descriptions
      let descriptions;
      try {
        descriptions = await generateDescriptions(schema, context);
      } catch (error) {
        console.error(chalk.red(`✗ Failed to generate descriptions for ${segmentName}`));
        console.error(chalk.red(`  ${error.message}`));
        results.failures.push({
          segment: segmentName,
          error: `Description generation failed: ${error.message}`
        });
        continue;
      }

      // Step 2d: Save descriptions to file
      const outputPath = join(output, `${segmentName}-descriptions.json`);

      try {
        await writeJson(outputPath, descriptions, { spaces: 2 });
        console.log(chalk.green(`\n✓ Descriptions saved: ${outputPath}`));

        // Display summary
        const totalTables = descriptions.tables.length;
        const totalColumns = descriptions.tables.reduce(
          (sum, table) => sum + table.columns.length,
          0
        );

        console.log(chalk.cyan(`  Tables processed: ${totalTables}`));
        console.log(chalk.cyan(`  Columns described: ${totalColumns}`));

        if (descriptions.errors && descriptions.errors.length > 0) {
          console.log(chalk.yellow(`  Tables with errors: ${descriptions.errors.length}`));
        }

        results.successes.push({
          segment: segmentName,
          filepath: outputPath,
          tables: totalTables,
          columns: totalColumns
        });
      } catch (error) {
        console.error(chalk.red(`✗ Failed to save descriptions for ${segmentName}`));
        console.error(chalk.red(`  ${error.message}`));
        results.failures.push({
          segment: segmentName,
          error: `Save failed: ${error.message}`
        });
      }

    } catch (error) {
      // Catch-all for unexpected errors
      console.error(chalk.red(`✗ Unexpected error processing ${segmentName}`));
      console.error(chalk.red(`  ${error.message}`));
      results.failures.push({
        segment: segmentName,
        error: error.message
      });
    }
  }

  // Step 3: Summary report
  console.log(chalk.cyan(`\n${'='.repeat(60)}`));
  console.log(chalk.bold.cyan('GENERATION SUMMARY'));
  console.log(chalk.cyan(`${'='.repeat(60)}\n`));

  console.log(chalk.bold(`Processed ${results.successes.length}/${segmentsToGenerate.length} segment(s)`));

  if (results.successes.length > 0) {
    console.log(chalk.green('\nSuccessful generations:'));
    for (const success of results.successes) {
      console.log(chalk.green(`  ✓ ${success.segment}`));
      console.log(chalk.gray(`    ${success.tables} tables, ${success.columns} columns`));
      console.log(chalk.gray(`    ${success.filepath}`));
    }
  }

  if (results.failures.length > 0) {
    console.log(chalk.red('\nFailed generations:'));
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

/**
 * Generate Claude Code prompt for description generation.
 *
 * When API key is not available, outputs instructions for using Claude Code
 * to generate descriptions interactively.
 *
 * @param {string[]} segments - Segment names to generate prompts for
 * @param {Object} options - Command options
 */
async function generateClaudeCodePrompt(segments, options) {
  const hasKey = hasApiKey();

  if (!hasKey) {
    console.log(chalk.yellow('\n╔════════════════════════════════════════════════════════════╗'));
    console.log(chalk.yellow('║  ANTHROPIC_API_KEY not found                               ║'));
    console.log(chalk.yellow('╚════════════════════════════════════════════════════════════╝\n'));
    console.log(chalk.white('Use Claude Code to generate descriptions instead:\n'));
  } else {
    console.log(chalk.cyan('\nClaude Code mode enabled.\n'));
  }

  // Find available schemas
  let availableSchemas = [];
  try {
    const schemaFiles = await readdir('./schemas');
    availableSchemas = schemaFiles
      .filter(file => file.endsWith('.json'))
      .map(file => file.replace('.json', ''));
  } catch (error) {
    console.log(chalk.yellow('No schemas found in ./schemas directory.'));
    console.log(chalk.yellow('Run: node src/index.js extract <segment> first.\n'));
    return;
  }

  if (availableSchemas.length === 0) {
    console.log(chalk.yellow('No extracted schemas found.'));
    console.log(chalk.yellow('Run: node src/index.js extract <segment> first.\n'));
    return;
  }

  // Determine which segments to show
  const targetSegments = segments && segments.length > 0
    ? segments.filter(s => availableSchemas.includes(s))
    : availableSchemas;

  console.log(chalk.bold('Available schemas:'));
  for (const schema of availableSchemas) {
    const isTarget = targetSegments.includes(schema);
    console.log(`  ${isTarget ? chalk.green('●') : chalk.gray('○')} ${schema}`);
  }

  console.log(chalk.bold('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
  console.log(chalk.bold('To generate descriptions with Claude Code:\n'));

  console.log(chalk.white('1. Open Claude Code in this project directory'));
  console.log(chalk.white('2. Ask Claude Code to generate descriptions:\n'));
  console.log(chalk.cyan(`   "Generate descriptions for the ${targetSegments[0] || 'segment'} schema"`));
  console.log(chalk.gray('\n   Claude Code will read the schema, ask for context,'));
  console.log(chalk.gray('   generate descriptions, and save to ./descriptions/\n'));

  console.log(chalk.bold('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));

  if (!hasKey) {
    console.log(chalk.gray('To use automated API mode instead:'));
    console.log(chalk.gray('  export ANTHROPIC_API_KEY=your-api-key'));
    console.log(chalk.gray('  node src/index.js generate <segment>\n'));
  }
}
