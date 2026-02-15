/**
 * CSV Import Module
 *
 * Imports CSV files with validation, encoding handling, and schema merging.
 * Loads original descriptions and schema to validate immutable fields.
 *
 * @module csv-importer
 */

import fs from 'fs-extra';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { validateCSV } from '../validation/csv-validator.js';

/**
 * Import CSV file with validation and error logging
 *
 * @param {string} csvPath - Path to CSV file to import
 * @param {string} segmentName - Segment name for loading original descriptions/schema
 * @param {Object} [options] - Import options
 * @param {string} [options.descriptionsDir] - Directory containing descriptions JSON (default: ./descriptions)
 * @param {string} [options.schemasDir] - Directory containing schema JSON (default: ./schemas)
 * @returns {Promise<Object>} Import result with {valid, errors, summary, errorLogPath}
 *
 * @example
 * const result = await importCSV('./reviews/Contacts: Demo.csv', 'Contacts: Demo');
 * if (result.errors.length > 0) {
 *   console.log(`Found ${result.errors.length} errors, saved to ${result.errorLogPath}`);
 * }
 */
export async function importCSV(csvPath, segmentName, options = {}) {
  // Set default directories
  const descriptionsDir = options.descriptionsDir || './descriptions';
  const schemasDir = options.schemasDir || './schemas';

  // Validate CSV file exists
  if (!await fs.pathExists(csvPath)) {
    throw new Error(`CSV file not found: ${csvPath}`);
  }

  // Read CSV file with UTF-8 encoding
  let csvContent = await fs.readFile(csvPath, 'utf-8');

  // Strip UTF-8 BOM if present (Excel adds this for UTF-8 compatibility)
  if (csvContent.charCodeAt(0) === 0xFEFF) {
    csvContent = csvContent.slice(1);
  }

  // Parse CSV with csv-parse
  let rows;
  try {
    rows = parse(csvContent, {
      columns: true, // Use first row as column headers
      skip_empty_lines: true,
      trim: true,
      cast: true, // Auto-cast types
      cast_date: false, // Don't auto-cast dates (avoid timestamp issues)
      // Custom cast function for is_pii boolean
      onRecord: (record) => {
        // Cast is_pii to boolean
        if (record.is_pii !== undefined) {
          if (record.is_pii === 'true' || record.is_pii === true) {
            record.is_pii = true;
          } else if (record.is_pii === 'false' || record.is_pii === false) {
            record.is_pii = false;
          }
          // Leave other values as-is for validator to catch
        }
        return record;
      }
    });
  } catch (parseError) {
    throw new Error(`CSV parse error: ${parseError.message}`);
  }

  // Load original descriptions JSON
  const descriptionsPath = path.join(descriptionsDir, `${segmentName}-descriptions.json`);
  let descriptions = null;

  if (await fs.pathExists(descriptionsPath)) {
    try {
      const descriptionsContent = await fs.readFile(descriptionsPath, 'utf-8');
      descriptions = JSON.parse(descriptionsContent);
    } catch (error) {
      console.warn(`Warning: Could not load descriptions from ${descriptionsPath}: ${error.message}`);
    }
  }

  // Load schema JSON to get column types
  const schemaPath = path.join(schemasDir, `${segmentName}.json`);
  let schema = null;

  if (await fs.pathExists(schemaPath)) {
    try {
      const schemaContent = await fs.readFile(schemaPath, 'utf-8');
      schema = JSON.parse(schemaContent);
    } catch (error) {
      console.warn(`Warning: Could not load schema from ${schemaPath}: ${error.message}`);
    }
  }

  // Merge schema types into descriptions to create complete originalSchema
  let originalSchema = null;
  if (descriptions && schema) {
    originalSchema = mergeSchemaTypes(descriptions, schema);
  }

  // Validate CSV rows
  const validationResult = validateCSV(rows, originalSchema);

  // Save error log if errors exist
  let errorLogPath = null;
  if (validationResult.errors.length > 0) {
    errorLogPath = await saveErrorLog(csvPath, validationResult.errors);
  }

  return {
    valid: validationResult.valid,
    errors: validationResult.errors,
    summary: validationResult.summary,
    errorLogPath: errorLogPath
  };
}

/**
 * Merge schema types into descriptions structure
 *
 * Takes descriptions JSON (with column_name, description) and schema JSON (with name, type)
 * and merges them to create a complete structure with all fields for validation.
 *
 * @param {Object} descriptions - Descriptions JSON from Phase 2
 * @param {Object} schema - Schema JSON from Phase 1
 * @returns {Object} Merged structure with type field added to each column
 */
function mergeSchemaTypes(descriptions, schema) {
  // Clone descriptions to avoid mutating original
  const merged = JSON.parse(JSON.stringify(descriptions));

  // Build type lookup map from schema
  const typeLookup = {};
  for (const tableType of ['master', 'attributes', 'behaviors']) {
    if (schema[tableType]) {
      typeLookup[tableType] = {};
      const tableSchema = schema[tableType];
      if (tableSchema.columns && Array.isArray(tableSchema.columns)) {
        for (const col of tableSchema.columns) {
          typeLookup[tableType][col.name] = col.type;
        }
      }
    }
  }

  // Merge types into descriptions tables
  if (merged.tables && Array.isArray(merged.tables)) {
    for (const table of merged.tables) {
      const tableType = table.table_type;
      if (table.columns && Array.isArray(table.columns)) {
        for (const column of table.columns) {
          const columnName = column.column_name || column.name;
          // Add type from schema lookup
          if (typeLookup[tableType] && typeLookup[tableType][columnName]) {
            column.type = typeLookup[tableType][columnName];
          }
          // Add source from table.database (matches CSV exporter logic)
          if (!column.source) {
            column.source = table.database || table.source || 'TD';
          }
        }
      }
    }
  }

  return merged;
}

/**
 * Save error log to CSV file
 *
 * Creates a CSV file with error details: row number, column, and issue description.
 *
 * @param {string} originalCsvPath - Original CSV file path (used to derive error log path)
 * @param {Array<Object>} errors - Array of error objects from validator
 * @returns {Promise<string>} Path to saved error log file
 */
async function saveErrorLog(originalCsvPath, errors) {
  // Derive error log path: {original}-errors.csv
  const parsedPath = path.parse(originalCsvPath);
  const errorLogPath = path.join(parsedPath.dir, `${parsedPath.name}-errors.csv`);

  // Build error CSV content
  const errorLines = ['row,column,issue'];

  for (const error of errors) {
    // Escape CSV values
    const row = error.row || 0;
    const column = escapeCsvValue(error.column || '');
    const issue = escapeCsvValue(error.issue || '');
    errorLines.push(`${row},${column},${issue}`);
  }

  const errorContent = errorLines.join('\n');

  // Write error log
  await fs.writeFile(errorLogPath, errorContent, 'utf-8');

  return path.resolve(errorLogPath);
}

/**
 * Escape CSV value (wrap in quotes if contains comma, quote, or newline)
 *
 * @param {string} value - Value to escape
 * @returns {string} Escaped value
 */
function escapeCsvValue(value) {
  const stringValue = String(value);
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}
