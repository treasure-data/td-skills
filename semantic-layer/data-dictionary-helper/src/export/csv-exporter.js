/**
 * CSV Export Module
 *
 * Transforms description JSON to CSV format for human review in Excel/Google Sheets.
 * Includes automated PII detection based on column names and sample values.
 *
 * @module csv-exporter
 */

import fs from 'fs-extra';
import path from 'path';
import { detectPIIColumn } from '../lib/pii-detector.js';

/**
 * Exports descriptions to CSV format with PII detection.
 *
 * Takes descriptions JSON from Phase 2 and produces a CSV file suitable for
 * review in Excel or Google Sheets. Automatically flags PII columns based on
 * column name patterns and optional sample value analysis.
 *
 * @param {Object} descriptions - Descriptions object with segment_name, context, and tables array
 * @param {string} outputPath - Path where CSV file should be written
 * @param {Object} [options] - Optional configuration
 * @param {Object} [options.schema] - Optional schema object with sample values for enhanced PII detection
 * @returns {Promise<Object>} Metadata about the export: {filepath, rowCount, piiCount}
 *
 * @example
 * const descriptions = {
 *   segment_name: 'Contacts: Demo',
 *   tables: [{
 *     table_type: 'master',
 *     database: 'temp',
 *     table: 'users',
 *     columns: [{
 *       column_name: 'email',
 *       description: 'User email address',
 *       classification: 'attribute'
 *     }]
 *   }]
 * };
 * const result = await exportToCSV(descriptions, './output.csv');
 * // Returns: { filepath: './output.csv', rowCount: 1, piiCount: 1 }
 */
export async function exportToCSV(descriptions, outputPath, options = {}) {
  // Validate input
  if (!descriptions || typeof descriptions !== 'object') {
    throw new Error('Invalid descriptions object: must be an object');
  }

  if (!descriptions.segment_name) {
    throw new Error('Invalid descriptions object: missing segment_name field');
  }

  if (!descriptions.tables || !Array.isArray(descriptions.tables)) {
    throw new Error('Invalid descriptions object: missing or invalid tables array');
  }

  if (descriptions.tables.length === 0) {
    throw new Error('Invalid descriptions object: tables array is empty');
  }

  // Ensure output directory exists
  const outputDir = path.dirname(outputPath);
  await fs.ensureDir(outputDir);

  // Extract schema samples if provided for enhanced PII detection
  const schemaSamples = options.schema?.samples || {};

  // Build schema column type lookup map for each table type
  const schemaTypeLookup = {};
  if (options.schema) {
    for (const tableType of ['master', 'attributes', 'behaviors']) {
      if (options.schema[tableType]) {
        schemaTypeLookup[tableType] = {};
        const tableSchema = options.schema[tableType];
        if (tableSchema.columns && Array.isArray(tableSchema.columns)) {
          for (const col of tableSchema.columns) {
            schemaTypeLookup[tableType][col.name] = col.type;
          }
        }
      }
    }
  }

  // Define CSV column order (explicit, not hardcoded)
  const csvColumns = ['table', 'column', 'type', 'source', 'description', 'is_pii'];

  // Flatten descriptions to CSV rows
  const rows = [];
  let piiCount = 0;

  for (const table of descriptions.tables) {
    const tableType = table.table_type; // master, attributes, or behaviors
    const tableName = table.table || table.table_name; // handle both formats
    const database = table.database || '';

    // Get sample values for this table type if available
    const tableSamples = schemaSamples[tableType] || [];

    for (const column of table.columns || []) {
      const columnName = column.column_name || column.name;

      // Get type from column, or lookup from schema if not present
      let columnType = column.type || '';
      if (!columnType && schemaTypeLookup[tableType]) {
        columnType = schemaTypeLookup[tableType][columnName] || '';
      }

      const description = column.description || '';

      // Build source field from database info
      const source = database || 'TD';

      // Extract sample values for this specific column from schema samples
      const sampleValues = tableSamples
        .map(row => row[columnName])
        .filter(val => val !== null && val !== undefined);

      // Detect PII using column name + content patterns
      const isPII = detectPIIColumn(columnName, sampleValues);
      if (isPII) {
        piiCount++;
      }

      // Create CSV row
      rows.push({
        table: tableType,
        column: columnName,
        type: columnType ? columnType.toUpperCase() : '',
        source: source,
        description: description,
        is_pii: isPII
      });
    }
  }

  // Build CSV content with UTF-8 BOM for Excel compatibility
  const csvLines = [];

  // Add BOM for Excel
  const BOM = '\uFEFF';

  // Add header row
  csvLines.push(csvColumns.join(','));

  // Add data rows
  for (const row of rows) {
    const csvRow = csvColumns.map(col => {
      const value = row[col];

      // Handle different value types
      if (typeof value === 'boolean') {
        return value.toString();
      }

      if (value === null || value === undefined) {
        return '';
      }

      // Escape CSV special characters (quotes, commas, newlines)
      const stringValue = String(value);
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        // Escape quotes by doubling them, wrap in quotes
        return `"${stringValue.replace(/"/g, '""')}"`;
      }

      return stringValue;
    });

    csvLines.push(csvRow.join(','));
  }

  // Join with consistent line terminator
  const csvContent = BOM + csvLines.join('\n');

  // Write to file
  await fs.writeFile(outputPath, csvContent, 'utf-8');

  // Return metadata
  return {
    filepath: path.resolve(outputPath),
    rowCount: rows.length,
    piiCount: piiCount
  };
}

/**
 * Exports descriptions to CSV and loads schema for enhanced PII detection.
 * Convenience wrapper that loads schema from standard location.
 *
 * @param {Object} descriptions - Descriptions object
 * @param {string} outputPath - Path where CSV file should be written
 * @param {string} [schemaPath] - Optional path to schema JSON file
 * @returns {Promise<Object>} Export metadata
 */
export async function exportToCSVWithSchema(descriptions, outputPath, schemaPath) {
  let schema = null;

  // Try to load schema if path provided
  if (schemaPath && await fs.pathExists(schemaPath)) {
    try {
      const schemaContent = await fs.readFile(schemaPath, 'utf-8');
      schema = JSON.parse(schemaContent);
    } catch (error) {
      // Schema load failed - continue without it (name-based PII detection only)
      console.warn(`Warning: Could not load schema from ${schemaPath}: ${error.message}`);
    }
  }

  return exportToCSV(descriptions, outputPath, { schema });
}
