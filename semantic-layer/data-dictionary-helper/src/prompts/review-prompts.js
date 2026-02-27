/**
 * Review Prompts Module
 *
 * Interactive prompts for CSV review workflow.
 * Used by review command for human-in-the-loop review gates.
 *
 * @module prompts/review-prompts
 */

import inquirer from 'inquirer';
import chalk from 'chalk';

/**
 * Prompt user to open CSV in default application.
 *
 * Asks user if they want to open the exported CSV file in their default
 * spreadsheet application (Excel, Google Sheets, LibreOffice, etc.).
 *
 * @param {string} filepath - Path to CSV file
 * @returns {Promise<boolean>} True if user wants to open file, false otherwise
 *
 * @example
 * const shouldOpen = await promptOpenFile('./reviews/segment.csv');
 * if (shouldOpen) {
 *   // Open file with default app
 * }
 */
export async function promptOpenFile(filepath) {
  const { shouldOpen } = await inquirer.prompt([{
    type: 'confirm',
    name: 'shouldOpen',
    message: 'Open CSV in default application?',
    default: false
  }]);

  return shouldOpen;
}

/**
 * Wait for user to finish editing CSV file.
 *
 * Displays instructions and waits for user to press Enter after they've
 * finished editing the CSV file in their spreadsheet application.
 *
 * This creates a human-in-the-loop review gate before proceeding to
 * validation or write-back steps.
 *
 * @param {string} filepath - Path to CSV file being edited
 * @returns {Promise<void>}
 *
 * @example
 * await promptWaitForEdit('./reviews/segment.csv');
 * // User pressed Enter - continue workflow
 */
export async function promptWaitForEdit(filepath) {
  console.log(chalk.cyan(`\nCSV exported to: ${filepath}`));
  console.log(chalk.white('Edit the file in your spreadsheet application.'));
  console.log(chalk.gray('(Make changes to descriptions, verify PII flags, etc.)\n'));

  await inquirer.prompt([{
    type: 'input',
    name: 'continue',
    message: 'Press Enter when you\'re done editing',
    default: ''
  }]);

  console.log(chalk.green('✓ Continuing with validation...\n'));
}
