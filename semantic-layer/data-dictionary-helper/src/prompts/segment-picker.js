import inquirer from 'inquirer';
import { readdir } from 'fs/promises';
import { executeTdxCommand } from '../lib/tdx-client.js';
import chalk from 'chalk';

/**
 * Interactive segment selection with visual indicators for recently extracted segments.
 *
 * Fetches available Parent Segments from TDX CLI, checks which segments have been
 * recently extracted (by checking ./schemas/*.json files), and presents a multi-select
 * checkbox prompt with visual indicators.
 *
 * @returns {Promise<string[]>} Array of selected segment names, or empty array if not confirmed
 * @throws {Error} If TDX command fails or authentication is required
 */
export async function selectSegments() {
  // Step 1: Fetch available segments from TDX
  let segments;
  try {
    segments = await executeTdxCommand(['ps', 'list', '--json']);
  } catch (error) {
    throw new Error('Failed to fetch segments from TDX. Ensure you\'re authenticated.');
  }

  // Handle case where no segments are available
  if (!segments || segments.length === 0) {
    console.log(chalk.yellow('No Parent Segments found.'));
    console.log('Ensure you\'re connected to the correct TD region.');
    return [];
  }

  // Step 2: Check recently extracted segments
  let recentlyExtracted = new Set();
  try {
    const files = await readdir('./schemas');
    const jsonFiles = files.filter(f => f.endsWith('.json'));
    const segmentNames = jsonFiles.map(f => f.replace('.json', ''));
    recentlyExtracted = new Set(segmentNames);
  } catch (error) {
    // Directory doesn't exist or can't be read - no recently extracted segments
    recentlyExtracted = new Set();
  }

  // Step 3: Build Inquirer choices with visual indicators
  const choices = segments.map(seg => {
    const isRecent = recentlyExtracted.has(seg.name);
    const displayName = isRecent
      ? `${seg.name} ${chalk.dim('(recently extracted)')}`
      : seg.name;

    return {
      name: displayName,
      value: seg.name,
      short: seg.name
    };
  });

  // Sort: recently extracted first, then alphabetically
  choices.sort((a, b) => {
    const aRecent = recentlyExtracted.has(a.value);
    const bRecent = recentlyExtracted.has(b.value);

    if (aRecent && !bRecent) return -1;
    if (!aRecent && bRecent) return 1;
    return a.value.localeCompare(b.value);
  });

  // Step 4: Multi-select prompt
  const answers = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'segments',
      message: 'Select segments to extract:',
      choices: choices,
      validate: (input) => {
        if (input.length === 0) {
          return 'You must select at least one segment';
        }
        return true;
      }
    }
  ]);

  // Step 5: Confirmation prompt
  const confirmation = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirmed',
      message: `Extract schema for ${answers.segments.length} segment(s)?`,
      default: true
    }
  ]);

  // Return selected segments if confirmed, empty array if not confirmed
  return confirmation.confirmed ? answers.segments : [];
}
