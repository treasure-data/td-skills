/**
 * CSV Validator with row-level error collection
 *
 * Implements lazy validation pattern: collects ALL errors before returning results.
 * This prevents fail-fast behavior and allows users to fix all issues in one pass.
 */

/**
 * Expected CSV schema definition
 */
export const CSV_SCHEMA = {
  requiredColumns: ['table', 'column', 'type', 'source', 'description', 'is_pii'],
  columnTypes: {
    table: 'string',
    column: 'string',
    type: 'string',
    source: 'string',
    description: 'string',  // nullable - empty string OK per CONTEXT.md
    is_pii: 'boolean'
  }
};

/**
 * Validate CSV rows against schema with error collection
 *
 * @param {Array<Object>} rows - Parsed CSV rows (objects with column headers as keys)
 * @param {Object} originalSchema - Original descriptions JSON merged with schema types.
 *                                   Each column must have: type, source, description, is_pii
 * @returns {Object} Validation result with {valid, errors, summary}
 */
export function validateCSV(rows, originalSchema = null) {
  const errors = [];
  const validRows = [];

  // Guard against empty input
  if (!rows || rows.length === 0) {
    return {
      valid: [],
      errors: [],
      summary: {
        total: 0,
        validCount: 0,
        errorCount: 0
      }
    };
  }

  // Check column structure (first row provides headers)
  const headers = Object.keys(rows[0] || {});
  const missingCols = CSV_SCHEMA.requiredColumns.filter(col => !headers.includes(col));
  const extraCols = headers.filter(col => !CSV_SCHEMA.requiredColumns.includes(col));

  if (missingCols.length > 0) {
    errors.push({
      row: 0,
      column: 'structure',
      issue: `Missing required columns: ${missingCols.join(', ')}`
    });
  }

  if (extraCols.length > 0) {
    errors.push({
      row: 0,
      column: 'structure',
      issue: `Unexpected columns: ${extraCols.join(', ')}`
    });
  }

  // Validate each row
  rows.forEach((row, index) => {
    const rowErrors = [];

    // Required fields (description is nullable, is_pii has default, type is optional)
    if (!row.table || !row.column || !row.source) {
      const missing = [];
      if (!row.table) missing.push('table');
      if (!row.column) missing.push('column');
      if (!row.source) missing.push('source');

      rowErrors.push({
        row: index + 1,
        column: 'required_fields',
        issue: `Missing required field(s): ${missing.join(', ')}`
      });
    }

    // Boolean type for is_pii
    if (typeof row.is_pii !== 'boolean') {
      rowErrors.push({
        row: index + 1,
        column: 'is_pii',
        issue: `Expected boolean, got ${typeof row.is_pii} (value: ${row.is_pii})`
      });
    }

    // Description nullable (empty string OK per CONTEXT.md)
    // No validation needed - both empty string and null are acceptable

    // Schema matching (only description and is_pii can change per CONTEXT.md)
    if (originalSchema && row.table && row.column) {
      const originalCol = findOriginalColumn(originalSchema, row.table, row.column);
      if (originalCol) {
        // Check immutable fields: type and source
        // Note: CSV row.type is uppercase (from exporter), originalCol.type may be lowercase
        const csvType = row.type ? row.type.toUpperCase() : '';
        const originalType = originalCol.type ? originalCol.type.toUpperCase() : '';

        if (csvType !== originalType) {
          rowErrors.push({
            row: index + 1,
            column: 'type',
            issue: `Type changed from '${originalCol.type}' to '${row.type}' (immutable field)`
          });
        }
        if (row.source !== originalCol.source) {
          rowErrors.push({
            row: index + 1,
            column: 'source',
            issue: `Source changed from '${originalCol.source}' to '${row.source}' (immutable field)`
          });
        }
      } else {
        // Column exists in CSV but not in original schema - new column added
        rowErrors.push({
          row: index + 1,
          column: 'structure',
          issue: `Column '${row.table}.${row.column}' not found in original schema (schema drift detected)`
        });
      }
    }

    // Collect errors or mark row as valid
    if (rowErrors.length === 0) {
      validRows.push(row);
    } else {
      errors.push(...rowErrors);
    }
  });

  // Check for removed columns (in original schema but not in CSV)
  if (originalSchema && originalSchema.tables) {
    const csvColumns = new Set(rows.map(r => `${r.table}.${r.column}`));

    originalSchema.tables.forEach(table => {
      const tableType = table.table_type; // master, attributes, or behaviors
      table.columns.forEach(col => {
        const columnName = col.column_name || col.name;
        const key = `${tableType}.${columnName}`;
        if (!csvColumns.has(key)) {
          errors.push({
            row: 0,
            column: 'structure',
            issue: `Column '${key}' removed from CSV (exists in original schema)`
          });
        }
      });
    });
  }

  return {
    valid: validRows,
    errors: errors,
    summary: {
      total: rows.length,
      validCount: validRows.length,
      errorCount: errors.length
    }
  };
}

/**
 * Find column in original schema by table type and column name
 *
 * @param {Object} schema - Merged descriptions + schema JSON with tables array.
 *                          Expected structure: { tables: [ { table_type, database, columns: [ { column_name, type, source } ] } ] }
 * @param {string} tableType - Table type to search (master, attributes, or behaviors)
 * @param {string} columnName - Column name to search
 * @returns {Object|null} Column object with type and source, or null if not found
 */
function findOriginalColumn(schema, tableType, columnName) {
  if (!schema || !schema.tables) return null;

  // Search all tables matching the table_type (there may be multiple behavior/attribute tables)
  const matchingTables = schema.tables.filter(t => t.table_type === tableType);
  if (matchingTables.length === 0) return null;

  for (const table of matchingTables) {
    const column = table.columns.find(c => (c.column_name || c.name) === columnName);
    if (column) {
      return {
        type: column.type || '',
        source: column.source || table.database || table.source || 'TD',
        description: column.description || '',
        is_pii: column.is_pii || false
      };
    }
  }

  return null;
}
