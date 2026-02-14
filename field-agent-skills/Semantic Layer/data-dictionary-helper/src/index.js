#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { checkTdxAvailable } from './lib/tdx-client.js';
import { list } from './commands/list.js';
import { extract } from './commands/extract.js';
import { generate } from './commands/generate.js';
import { review } from './commands/review.js';
import { validate } from './commands/validate.js';
import { writeback } from './commands/writeback.js';
import { rollback } from './commands/rollback.js';

// Check TDX CLI availability before proceeding
await checkTdxAvailable();

// Create CLI program
const program = new Command();

// Configure program metadata
program
  .name('dd-extract')
  .description('Extract schema from TD Parent Segments')
  .version('1.0.0');

// Add list command
program
  .command('list')
  .description('List available parent segments')
  .action(list);

// Add extract command
program
  .command('extract [segments...]')
  .description('Extract schema for one or more segments')
  .option('-s, --sample', 'fetch sample data for each table (25-50 rows, PII auto-redacted)')
  .option('-o, --output <dir>', 'output directory for schema files', './schemas')
  .option('-b, --batch', 'batch mode: extract all available segments')
  .action(extract);

// Add generate command
program
  .command('generate [segments...]')
  .description('Generate AI descriptions for extracted schemas')
  .option('-o, --output <dir>', 'output directory for description files', './descriptions')
  .option('-b, --batch', 'batch mode: generate for all extracted schemas')
  .option('-c, --claude-code', 'show instructions for Claude Code generation (no API key needed)')
  .action(generate);

// Add review command
program
  .command('review [segments...]')
  .description('Export descriptions to CSV for human review')
  .option('-o, --output <dir>', 'output directory for CSV files', './reviews')
  .option('-b, --batch', 'batch mode: export all descriptions')
  .option('--skip-review', 'skip interactive prompts (for CI/CD pipelines)')
  .action(review);

// Add validate command
program
  .command('validate [segments...]')
  .description('Validate edited CSV files before write-back')
  .option('-i, --input <dir>', 'input directory for CSV files', './reviews')
  .option('--skip-review', 'skip confirmation prompt (for CI/CD pipelines)')
  .action(validate);

// Add writeback command
program
  .command('writeback [segments...]')
  .description('Write approved descriptions to Treasure Data via API')
  .option('--input <directory>', 'input directory for CSV files', './reviews')
  .option('--dry-run', 'preview changes without executing')
  .option('--skip-review', 'skip confirmation prompts (for CI/CD)')
  .action(async (segments, options) => {
    try {
      await writeback(segments, options);
    } catch (error) {
      console.error(chalk.red('Writeback failed:'), error.message);
      process.exit(1);
    }
  });

// Add rollback command
program
  .command('rollback <segment>')
  .description('Rollback segment to before snapshot (restore previous descriptions)')
  .option('--tables <tables...>', 'specific tables to rollback (default: all tables)')
  .option('--list-snapshots', 'list available snapshots for segment')
  .option('--skip-review', 'skip confirmation prompts (for CI/CD)')
  .action(async (segment, options) => {
    try {
      await rollback(segment, options);
    } catch (error) {
      console.error(chalk.red('Rollback failed:'), error.message);
      process.exit(1);
    }
  });

// Global options
program
  .option('--no-color', 'disable colored output')
  .option('-v, --verbose', 'verbose output');

// Add examples to help text
program.addHelpText('after', `

Examples:
  $ dd-extract list
  $ dd-extract extract                    # interactive segment picker
  $ dd-extract extract segment_name       # extract specific segment
  $ dd-extract extract seg1 seg2 --sample # extract multiple with samples
  $ dd-extract extract --batch            # extract all segments
  $ dd-extract extract --output ./data    # custom output directory

  $ dd-extract generate                   # interactive (needs ANTHROPIC_API_KEY)
  $ dd-extract generate segment_name      # generate descriptions for specific segment
  $ dd-extract generate --batch           # generate for all extracted schemas
  $ dd-extract generate --claude-code     # use Claude Code instead of API
  $ dd-extract generate --output ./docs   # custom output directory

  $ dd-extract review                     # interactive review (prompts for file opening)
  $ dd-extract review segment_name        # review specific segment
  $ dd-extract review --batch             # review all generated descriptions
  $ dd-extract review --skip-review       # automated mode (no prompts)
  $ dd-extract review --output ./exports  # custom output directory

  $ dd-extract validate                   # validate all CSV files in ./reviews
  $ dd-extract validate segment_name      # validate specific segment
  $ dd-extract validate --skip-review     # automated mode (no confirmation)
  $ dd-extract validate --input ./exports # custom input directory

  $ dd-extract writeback                  # write-back all validated CSVs
  $ dd-extract writeback segment_name     # write-back specific segment
  $ dd-extract writeback --dry-run        # preview changes without executing
  $ dd-extract writeback --skip-review    # automated mode (no confirmation)
  $ dd-extract writeback --input ./exports # custom input directory

  $ dd-extract rollback segment_name      # rollback all tables in segment
  $ dd-extract rollback segment_name --tables table1 table2  # rollback specific tables
  $ dd-extract rollback segment_name --list-snapshots        # list available snapshots
  $ dd-extract rollback segment_name --skip-review           # automated mode (no confirmation)
`);

// Error handling for unhandled rejections and uncaught exceptions
process.on('unhandledRejection', (error) => {
  console.error('Unhandled promise rejection:', error);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  process.exit(1);
});

// Parse command-line arguments
program.parse();
