/**
 * Description Generator
 *
 * Orchestrates AI-powered description generation for TD Parent Segment schemas.
 * Calls Claude API with structured outputs for each table type (master, attribute, behavior)
 * and aggregates results into a complete description document.
 *
 * @module description-generator
 */

import ora from 'ora';
import chalk from 'chalk';
import { callClaudeWithStructuredOutput } from './claude-client.js';
import { buildSystemPrompt, buildDescriptionPrompt } from './context-builder.js';
import { classifyColumn } from './column-classifier.js';
import { descriptionOutputSchema } from '../schemas/description-output.js';

/**
 * Generate AI descriptions for a single table.
 *
 * Calls Claude API with business context, table schema, and optional sample data
 * to generate human-readable and AI-friendly column descriptions. Validates that
 * the response includes all expected columns and cross-checks classifications.
 *
 * @param {Object} tableData - Table schema with database, table, columns
 * @param {string} tableData.database - Database name
 * @param {string} tableData.table - Table name
 * @param {Array<Object>} tableData.columns - Array of column objects with name, type
 * @param {string} tableType - Type of table ('master' | 'attribute' | 'behavior')
 * @param {Object} context - Business context from user (industry, company type, etc.)
 * @param {Array<Object>} [samples=null] - Optional sample data rows for this table
 * @returns {Promise<Object>} Claude API response with table_type, database, table, columns
 * @throws {Error} If Claude API call fails or response is invalid
 *
 * @example
 * const tableData = {
 *   database: 'prod_db',
 *   table: 'customers',
 *   columns: [
 *     { name: 'customer_id', type: 'varchar' },
 *     { name: 'email', type: 'varchar' }
 *   ]
 * };
 *
 * const context = {
 *   industry: 'e-commerce',
 *   companyType: 'online marketplace',
 *   segmentPurpose: 'customer segmentation',
 *   primaryUseCases: 'marketing campaigns'
 * };
 *
 * const result = await generateTableDescriptions(tableData, 'master', context);
 * // Returns: {
 * //   table_type: 'master',
 * //   database: 'prod_db',
 * //   table: 'customers',
 * //   columns: [
 * //     {
 * //       column_name: 'customer_id',
 * //       description: '...',
 * //       classification: 'attribute'
 * //     },
 * //     ...
 * //   ]
 * // }
 */
export async function generateTableDescriptions(tableData, tableType, context, samples = null) {
  const MAX_COLUMNS_PER_BATCH = 50;
  const columns = tableData.columns;

  // If table is small enough, process in a single call
  if (columns.length <= MAX_COLUMNS_PER_BATCH) {
    return generateTableDescriptionsBatch(tableData, tableType, context, samples);
  }

  // Chunk large tables into batches
  const spinner = ora(`Generating descriptions for ${tableType}: ${tableData.database}.${tableData.table} (${columns.length} columns in batches)...`).start();
  const allColumns = [];

  for (let i = 0; i < columns.length; i += MAX_COLUMNS_PER_BATCH) {
    const batchNum = Math.floor(i / MAX_COLUMNS_PER_BATCH) + 1;
    const totalBatches = Math.ceil(columns.length / MAX_COLUMNS_PER_BATCH);
    const batchColumns = columns.slice(i, i + MAX_COLUMNS_PER_BATCH);

    spinner.text = `Generating descriptions for ${tableType}: ${tableData.database}.${tableData.table} (batch ${batchNum}/${totalBatches})...`;

    const batchTableData = { ...tableData, columns: batchColumns };
    const batchResult = await generateTableDescriptionsBatch(batchTableData, tableType, context, samples, true);
    allColumns.push(...batchResult.columns);
  }

  spinner.succeed(chalk.green(`Generated descriptions for ${tableType}: ${tableData.database}.${tableData.table} (${allColumns.length} columns)`));

  return {
    table_type: tableType,
    database: tableData.database,
    table: tableData.table,
    columns: allColumns
  };
}

/**
 * Generate AI descriptions for a single batch of columns within a table.
 * @private
 */
async function generateTableDescriptionsBatch(tableData, tableType, context, samples = null, silent = false) {
  const spinner = silent ? null : ora(`Generating descriptions for ${tableType}: ${tableData.database}.${tableData.table}...`).start();

  try {
    // Build prompts
    const systemPrompt = buildSystemPrompt(context);

    // Package schema and samples for prompt building
    // buildDescriptionPrompt expects schema.master, schema.attributes[i], or schema.behaviors[i]
    let schemaForPrompt;
    if (tableType === 'master') {
      schemaForPrompt = {
        master: tableData,
        samples: samples ? { master: samples } : null
      };
    } else if (tableType === 'attribute') {
      schemaForPrompt = {
        attributes: [tableData],
        samples: samples ? { attributes: [samples] } : null
      };
    } else {
      schemaForPrompt = {
        behaviors: [tableData],
        samples: samples ? { behaviors: [samples] } : null
      };
    }

    const userPrompt = buildDescriptionPrompt(schemaForPrompt, tableType, context);

    // Call Claude API with structured output
    const response = await callClaudeWithStructuredOutput(
      systemPrompt,
      userPrompt,
      descriptionOutputSchema
    );

    // Validate column names match
    const expectedColumns = new Set(tableData.columns.map(col => col.name));
    const returnedColumns = new Set(response.columns.map(col => col.column_name));

    // Check for missing columns
    const missingColumns = [...expectedColumns].filter(col => !returnedColumns.has(col));
    if (missingColumns.length > 0) {
      if (spinner) spinner.warn(chalk.yellow(
        `Warning: Claude response missing columns for ${tableData.table}: ${missingColumns.join(', ')}`
      ));
    }

    // Check for extra columns (hallucinated)
    const extraColumns = [...returnedColumns].filter(col => !expectedColumns.has(col));
    if (extraColumns.length > 0) {
      if (spinner) spinner.warn(chalk.yellow(
        `Warning: Claude response includes unexpected columns for ${tableData.table}: ${extraColumns.join(', ')}`
      ));
    }

    // Cross-validate classifications
    for (const columnDesc of response.columns) {
      const heuristicClassification = classifyColumn(columnDesc.column_name, tableType);

      if (columnDesc.classification !== heuristicClassification) {
        // Log warning but don't fail - Claude might have better context
        console.warn(chalk.yellow(
          `  Classification difference for ${columnDesc.column_name}: ` +
          `Claude says "${columnDesc.classification}", heuristic suggests "${heuristicClassification}"`
        ));
      }
    }

    if (spinner) spinner.succeed(chalk.green(`Generated descriptions for ${tableType}: ${tableData.database}.${tableData.table}`));
    return response;

  } catch (error) {
    if (spinner) spinner.fail(chalk.red(`Failed to generate descriptions for ${tableData.database}.${tableData.table}`));
    throw new Error(
      `Description generation failed for ${tableData.database}.${tableData.table}: ${error.message}`
    );
  }
}

/**
 * Generate descriptions for all tables in a schema.
 *
 * Processes master table, all attribute tables, and all behavior tables sequentially.
 * Returns a complete description document with metadata and per-table descriptions.
 * Handles errors gracefully - if one table fails, continues with others and tracks failures.
 *
 * @param {Object} schema - Complete schema from Phase 1 extraction
 * @param {string} schema.segment_name - Name of the segment
 * @param {Object} schema.master - Master table schema
 * @param {Array<Object>} schema.attributes - Array of attribute table schemas
 * @param {Array<Object>} schema.behaviors - Array of behavior table schemas
 * @param {Object} [schema.samples] - Optional sample data for tables
 * @param {Object} context - Business context from gatherBusinessContext
 * @returns {Promise<Object>} Complete description document with all tables
 * @returns {string} .segment_name - Segment name
 * @returns {string} .generated_at - ISO timestamp of generation
 * @returns {Array<Object>} .tables - Array of table description objects
 * @returns {Array<Object>} [.errors] - Array of error objects for failed tables (if any)
 *
 * @example
 * const schema = {
 *   segment_name: 'Customer',
 *   master: { database: 'prod', table: 'customers', columns: [...] },
 *   attributes: [
 *     { database: 'prod', table: 'customer_attributes', columns: [...] }
 *   ],
 *   behaviors: [
 *     { database: 'prod', table: 'purchase_events', columns: [...] }
 *   ],
 *   samples: {
 *     master: [...],
 *     attributes: [[...]],
 *     behaviors: [[...]]
 *   }
 * };
 *
 * const context = {
 *   industry: 'e-commerce',
 *   companyType: 'marketplace',
 *   segmentPurpose: 'customer segmentation',
 *   primaryUseCases: 'marketing campaigns'
 * };
 *
 * const descriptions = await generateDescriptions(schema, context);
 * // Returns: {
 * //   segment_name: 'Customer',
 * //   generated_at: '2026-01-29T14:20:09Z',
 * //   tables: [
 * //     { table_type: 'master', database: 'prod', table: 'customers', columns: [...] },
 * //     { table_type: 'attribute', database: 'prod', table: 'customer_attributes', columns: [...] },
 * //     { table_type: 'behavior', database: 'prod', table: 'purchase_events', columns: [...] }
 * //   ],
 * //   errors: [] // Empty if all succeeded
 * // }
 */
export async function generateDescriptions(schema, context) {
  console.log(chalk.cyan(`\nGenerating descriptions for segment: ${schema.segment_name}\n`));

  // Initialize result object
  const result = {
    segment_name: schema.segment_name,
    generated_at: new Date().toISOString(),
    tables: [],
    errors: []
  };

  // Process master table
  console.log(chalk.bold('Processing master table...'));
  try {
    const masterSamples = schema.samples?.master || null;
    const masterDescriptions = await generateTableDescriptions(
      schema.master,
      'master',
      context,
      masterSamples
    );
    result.tables.push(masterDescriptions);
  } catch (error) {
    console.error(chalk.red(`✗ Master table failed: ${error.message}`));
    result.errors.push({
      table_type: 'master',
      database: schema.master.database,
      table: schema.master.table,
      error: error.message
    });
  }

  // Process attribute tables
  if (schema.attributes && schema.attributes.length > 0) {
    // Filter to only tables with columns
    const attrTablesWithColumns = schema.attributes.filter(a => a.columns && a.columns.length > 0);
    if (attrTablesWithColumns.length > 0) {
      console.log(chalk.bold(`\nProcessing ${attrTablesWithColumns.length} attribute table(s)...`));
    } else if (schema.attributes.length > 0) {
      console.log(chalk.gray(`\nSkipping ${schema.attributes.length} attribute table(s) (no columns to describe)`));
    }

    for (let i = 0; i < schema.attributes.length; i++) {
      const attrTable = schema.attributes[i];

      // Skip tables with no columns
      if (!attrTable.columns || attrTable.columns.length === 0) {
        continue;
      }

      try {
        const attrSamples = schema.samples?.attributes?.[i] || null;
        const attrDescriptions = await generateTableDescriptions(
          attrTable,
          'attribute',
          context,
          attrSamples
        );
        result.tables.push(attrDescriptions);
      } catch (error) {
        console.error(chalk.red(`✗ Attribute table ${attrTable.table} failed: ${error.message}`));
        result.errors.push({
          table_type: 'attribute',
          database: attrTable.database,
          table: attrTable.table,
          error: error.message
        });
      }
    }
  }

  // Process behavior tables
  if (schema.behaviors && schema.behaviors.length > 0) {
    // Filter to only tables with columns
    const behTablesWithColumns = schema.behaviors.filter(b => b.columns && b.columns.length > 0);
    if (behTablesWithColumns.length > 0) {
      console.log(chalk.bold(`\nProcessing ${behTablesWithColumns.length} behavior table(s)...`));
    }

    for (let i = 0; i < schema.behaviors.length; i++) {
      const behTable = schema.behaviors[i];

      // Skip tables with no columns
      if (!behTable.columns || behTable.columns.length === 0) {
        continue;
      }

      try {
        const behSamples = schema.samples?.behaviors?.[i] || null;
        const behDescriptions = await generateTableDescriptions(
          behTable,
          'behavior',
          context,
          behSamples
        );
        result.tables.push(behDescriptions);
      } catch (error) {
        console.error(chalk.red(`✗ Behavior table ${behTable.table} failed: ${error.message}`));
        result.errors.push({
          table_type: 'behavior',
          database: behTable.database,
          table: behTable.table,
          error: error.message
        });
      }
    }
  }

  // Summary
  console.log(''); // Empty line for spacing
  const successCount = result.tables.length;
  const attrCount = (schema.attributes || []).filter(a => a.columns?.length > 0).length;
  const behCount = (schema.behaviors || []).filter(b => b.columns?.length > 0).length;
  const totalTables = 1 + attrCount + behCount;

  if (result.errors.length === 0) {
    console.log(chalk.green(`✓ Successfully generated descriptions for all ${totalTables} table(s)`));
  } else {
    console.log(chalk.yellow(
      `⚠ Generated descriptions for ${successCount}/${totalTables} table(s) ` +
      `(${result.errors.length} failed)`
    ));
  }

  return result;
}
