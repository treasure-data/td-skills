import inquirer from 'inquirer';

/**
 * Prompt user to decide whether to fetch sample data for a specific segment.
 *
 * Purpose: Let user decide whether to fetch sample data for description accuracy.
 * Default: false (opt-in) - user must explicitly choose to fetch samples.
 * Sample size: 25-50 rows per table from the segment.
 * PII handling: Automatic redaction of personally identifiable information.
 *
 * @param {string} segmentName - Name of the segment to fetch sample data for
 * @returns {Promise<boolean>} True if user confirms, false otherwise
 */
export async function promptForSampleData(segmentName) {
  const answer = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'fetchSamples',
      message: `Fetch sample data for segment "${segmentName}"? (25-50 rows per table, PII auto-redacted)`,
      default: false
    }
  ]);

  return answer.fetchSamples;
}
