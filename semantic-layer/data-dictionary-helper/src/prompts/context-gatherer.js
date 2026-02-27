/**
 * Business Context Gathering with Conversational Prompts
 *
 * Provides interactive context collection for AI description generation.
 * Asks questions one at a time, infers context from sample data when available,
 * and offers optional deeper domain-specific context gathering.
 *
 * @module context-gatherer
 */

import inquirer from 'inquirer';
import chalk from 'chalk';
import { inferContextFromSamples } from '../lib/context-builder.js';

/**
 * Gather business context through conversational prompts.
 *
 * Collects industry, company type, segment purpose, and primary use cases through
 * interactive one-question-at-a-time prompts. When sample data is provided, infers
 * domain patterns and surfaces them for user confirmation. Offers optional "go deeper"
 * for domain glossary entry.
 *
 * This follows the conversational pattern from CONTEXT.md - asking one question at a
 * time with adaptive follow-ups based on sample data availability and user responses.
 *
 * @param {string} segmentName - Name of the segment being configured
 * @param {Object} [samples=null] - Optional schema samples for inference
 * @returns {Promise<Object>} Context object with collected information
 * @returns {string} .industry - Industry (e.g., "retail", "e-commerce")
 * @returns {string} .companyType - Company/business model description
 * @returns {string} .segmentPurpose - What the segment is used for
 * @returns {string} .primaryUseCases - Primary use cases
 * @returns {string[]} .inferences - Array of inferences from sample data
 * @returns {string} [.corrections] - Optional corrections to inferences
 * @returns {string} [.domainGlossary] - Optional domain-specific terminology
 *
 * @example
 * import { gatherBusinessContext } from './prompts/context-gatherer.js';
 *
 * const samples = {
 *   master: [{ cart_value: 100, order_id: '123' }]
 * };
 *
 * const context = await gatherBusinessContext('Customer', samples);
 * // Conversational flow:
 * // 1. "What industry is this data from?" -> suggests "e-commerce" based on samples
 * // 2. "Describe your company/business model briefly:"
 * // 3. "What is this segment used for?" -> defaults to "customer segmentation"
 * // 4. "Primary use cases? (e.g., marketing campaigns, analytics)"
 * // 5. Shows inferences: "Looks like e-commerce data..."
 * // 6. "Are these observations accurate?"
 * // 7. "Would you like to provide more domain-specific context?" -> optional editor
 *
 * // Returns: { industry, companyType, segmentPurpose, primaryUseCases, inferences, ... }
 */
export async function gatherBusinessContext(segmentName, samples = null) {
  console.log(chalk.cyan(`\nGathering context for: ${segmentName}\n`));

  const context = {};

  // Run inference first to potentially suggest defaults
  const inferences = samples ? inferContextFromSamples(samples) : [];
  context.inferences = inferences;

  // Determine default industry from inferences
  let defaultIndustry;
  if (inferences.some(inf => inf.includes('e-commerce'))) {
    defaultIndustry = 'e-commerce';
  } else if (inferences.some(inf => inf.includes('SaaS'))) {
    defaultIndustry = 'SaaS';
  } else if (inferences.some(inf => inf.includes('healthcare'))) {
    defaultIndustry = 'healthcare';
  } else if (inferences.some(inf => inf.includes('financial'))) {
    defaultIndustry = 'financial services';
  }

  // Question 1: Industry
  const industryAnswer = await inquirer.prompt({
    type: 'input',
    name: 'value',
    message: 'What industry is this data from?',
    default: defaultIndustry
  });
  context.industry = industryAnswer.value;

  // Question 2: Company type
  const companyTypeAnswer = await inquirer.prompt({
    type: 'input',
    name: 'value',
    message: 'Describe your company/business model briefly:'
  });
  context.companyType = companyTypeAnswer.value;

  // Question 3: Segment purpose
  const segmentPurposeAnswer = await inquirer.prompt({
    type: 'input',
    name: 'value',
    message: 'What is this segment used for?',
    default: 'customer segmentation'
  });
  context.segmentPurpose = segmentPurposeAnswer.value;

  // Question 4: Primary use cases
  const primaryUseCasesAnswer = await inquirer.prompt({
    type: 'input',
    name: 'value',
    message: 'Primary use cases? (e.g., marketing campaigns, analytics, personalization)'
  });
  context.primaryUseCases = primaryUseCasesAnswer.value;

  // Show inferences and ask for confirmation if we detected patterns
  if (inferences.length > 0) {
    console.log(chalk.yellow('\nBased on sample data, I noticed:'));
    inferences.forEach(inf => console.log(`  - ${inf}`));

    const confirmAnswer = await inquirer.prompt({
      type: 'confirm',
      name: 'accurate',
      message: 'Are these observations accurate?',
      default: true
    });

    // If not accurate, ask for corrections
    if (!confirmAnswer.accurate) {
      const correctionsAnswer = await inquirer.prompt({
        type: 'input',
        name: 'value',
        message: 'Please provide any corrections:'
      });
      context.corrections = correctionsAnswer.value;
    }
  }

  // Ask if user wants to provide deeper context
  const goDeeperAnswer = await inquirer.prompt({
    type: 'confirm',
    name: 'value',
    message: 'Would you like to provide more domain-specific context?',
    default: false
  });

  // If yes, open editor for domain glossary
  if (goDeeperAnswer.value) {
    const glossaryAnswer = await inquirer.prompt({
      type: 'editor',
      name: 'value',
      message: 'Enter any domain-specific terminology or glossary (opens editor):'
    });
    context.domainGlossary = glossaryAnswer.value;
  }

  return context;
}
