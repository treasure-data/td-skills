import { executeTdxCommand } from '../lib/tdx-client.js';
import chalk from 'chalk';
import { readdir } from 'fs/promises';

/**
 * List available Parent Segments with extraction status indicators.
 *
 * Displays all available Parent Segments from TDX CLI with visual indicators
 * showing which segments have been recently extracted (have .json files in ./schemas/).
 *
 * @returns {Promise<void>}
 */
export async function list() {
  // Step 1: Fetch segments from TDX
  let segments;
  try {
    segments = await executeTdxCommand(['ps', 'list', '--json']);
  } catch (error) {
    console.error(chalk.red('Failed to list segments. Ensure TDX CLI is authenticated.'));
    console.error(chalk.dim('Run: tdx auth'));
    process.exit(1);
  }

  // Step 4: Handle empty list
  if (!segments || segments.length === 0) {
    console.log(chalk.yellow('No Parent Segments found.'));
    console.log('Ensure you\'re connected to the correct TD region.');
    return;
  }

  // Step 2: Check recently extracted segments
  let extractedSegments = new Set();
  try {
    const files = await readdir('./schemas');
    const jsonFiles = files.filter(f => f.endsWith('.json'));
    const segmentNames = jsonFiles.map(f => f.replace('.json', ''));
    extractedSegments = new Set(segmentNames);
  } catch (error) {
    // Directory doesn't exist or can't be read - no extracted segments
    extractedSegments = new Set();
  }

  // Step 3: Display formatted list
  console.log(chalk.bold('\nAvailable Parent Segments:'));
  console.log('');

  segments.forEach(seg => {
    const segmentName = seg.attributes.name;
    if (extractedSegments.has(segmentName)) {
      // Recently extracted - show with green checkmark
      console.log(`✓ ${chalk.green(segmentName)} ${chalk.dim('(extracted)')}`);
    } else {
      // Not extracted - show without checkmark
      console.log(`  ${segmentName}`);
    }
  });

  // Show count at bottom
  console.log(`\nTotal: ${segments.length} segment(s)`);
}
