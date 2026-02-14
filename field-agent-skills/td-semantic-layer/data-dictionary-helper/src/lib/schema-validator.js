/**
 * Schema Validation Utility
 *
 * Provides Ajv-based JSON schema validation with exact column name matching
 * to prevent schema-linking hallucinations (P1 critical pitfall).
 *
 * Ensures that extracted schemas exactly match TDX CLI output, preventing
 * downstream tools from querying non-existent columns.
 *
 * @module schema-validator
 */

import Ajv from 'ajv';

const ajv = new Ajv({ allErrors: true });

/**
 * JSON Schema definition for the expected extracted schema structure.
 * Defines the required fields and structure for segment schemas.
 */
export const schemaStructure = {
  type: 'object',
  required: ['segment_name', 'master', 'attributes', 'behaviors'],
  properties: {
    segment_name: {
      type: 'string',
      minLength: 1
    },
    master: {
      type: 'object',
      required: ['database', 'table', 'columns'],
      properties: {
        database: { type: 'string' },
        table: { type: 'string' },
        columns: {
          type: 'array',
          items: {
            type: 'object',
            required: ['name', 'type'],
            properties: {
              name: { type: 'string' },
              type: { type: 'string' },
              source: { type: 'string' },
              nullable: { type: 'boolean' },
              comment: { type: 'string' }
            }
          }
        }
      }
    },
    attributes: {
      type: 'array',
      items: {
        type: 'object',
        required: ['database', 'table', 'columns'],
        properties: {
          database: { type: 'string' },
          table: { type: 'string' },
          columns: {
            type: 'array',
            items: {
              type: 'object',
              required: ['name', 'type'],
              properties: {
                name: { type: 'string' },
                type: { type: 'string' },
                source: { type: 'string' },
                nullable: { type: 'boolean' },
                comment: { type: 'string' }
              }
            }
          }
        }
      }
    },
    behaviors: {
      type: 'array',
      items: {
        type: 'object',
        required: ['database', 'table', 'columns'],
        properties: {
          database: { type: 'string' },
          table: { type: 'string' },
          columns: {
            type: 'array',
            items: {
              type: 'object',
              required: ['name', 'type'],
              properties: {
                name: { type: 'string' },
                type: { type: 'string' },
                source: { type: 'string' },
                nullable: { type: 'boolean' },
                comment: { type: 'string' }
              }
            }
          }
        }
      }
    }
  }
};

/**
 * Extracts all column names from a schema structure.
 *
 * @param {Object} schema - Schema object with master, attributes, and behaviors
 * @returns {Set<string>} Set of lowercased column names
 * @private
 */
function extractColumnNames(schema) {
  const columnNames = new Set();

  // Extract from master table
  if (schema.master && schema.master.columns) {
    for (const column of schema.master.columns) {
      columnNames.add(column.name.toLowerCase());
    }
  }

  // Extract from attributes tables
  if (schema.attributes) {
    for (const table of schema.attributes) {
      if (table.columns) {
        for (const column of table.columns) {
          columnNames.add(column.name.toLowerCase());
        }
      }
    }
  }

  // Extract from behaviors tables
  if (schema.behaviors) {
    for (const table of schema.behaviors) {
      if (table.columns) {
        for (const column of table.columns) {
          columnNames.add(column.name.toLowerCase());
        }
      }
    }
  }

  return columnNames;
}

/**
 * Validates extracted schema against TDX CLI raw schema output.
 *
 * Performs three validation steps:
 * 1. Structure validation - Ensures all required fields are present
 * 2. Exact column name matching (case-insensitive) - Prevents hallucinations
 * 3. Empty table type handling - Warns about missing table types
 *
 * @param {Object} extractedData - The extracted schema to validate
 * @param {Object} tdxRawSchema - The raw schema from TDX CLI (for name matching)
 * @returns {Object} Validation result with valid, hallucinated, missing, warnings fields
 * @throws {Error} If structure validation fails or hallucinated columns detected
 *
 * @example
 * import { validateExtractedSchema } from './schema-validator.js';
 *
 * const extracted = {
 *   segment_name: 'Customer',
 *   master: {
 *     database: 'prod_db',
 *     table: 'customers',
 *     columns: [
 *       { name: 'customer_id', type: 'INTEGER' },
 *       { name: 'email', type: 'VARCHAR' }
 *     ]
 *   },
 *   attributes: [],
 *   behaviors: []
 * };
 *
 * const tdxSchema = {
 *   segment_name: 'Customer',
 *   master: {
 *     database: 'prod_db',
 *     table: 'customers',
 *     columns: [
 *       { name: 'customer_id', type: 'INTEGER' },
 *       { name: 'email', type: 'VARCHAR' },
 *       { name: 'created_at', type: 'TIMESTAMP' }
 *     ]
 *   },
 *   attributes: [],
 *   behaviors: []
 * };
 *
 * const result = validateExtractedSchema(extracted, tdxSchema);
 * // Returns:
 * // {
 * //   valid: true,
 * //   hallucinated: [],
 * //   missing: ['created_at'],
 * //   warnings: ['No attribute tables found', 'No behavior tables found']
 * // }
 */
export function validateExtractedSchema(extractedData, tdxRawSchema) {
  const warnings = [];
  const hallucinated = [];
  const missing = [];

  // Step 1: Structure validation
  const validate = ajv.compile(schemaStructure);
  const valid = validate(extractedData);

  if (!valid) {
    const errorMessage = `Schema structure validation failed: ${ajv.errorsText(validate.errors)}`;
    throw new Error(errorMessage);
  }

  // Step 2: Exact column name matching (case-insensitive)
  const tdxColumnNames = extractColumnNames(tdxRawSchema);
  const extractedColumnNames = extractColumnNames(extractedData);

  // Check for hallucinated columns (in extracted but NOT in TDX)
  for (const columnName of extractedColumnNames) {
    if (!tdxColumnNames.has(columnName)) {
      hallucinated.push(columnName);
    }
  }

  // If hallucinated columns found, this is a critical error
  if (hallucinated.length > 0) {
    throw new Error(
      `Hallucinated columns detected (not in TDX schema): ${hallucinated.join(', ')}. ` +
      `These columns do not exist in the source schema and must be removed.`
    );
  }

  // Check for missing columns (in TDX but NOT in extracted)
  for (const columnName of tdxColumnNames) {
    if (!extractedColumnNames.has(columnName)) {
      missing.push(columnName);
    }
  }

  // Log warning for missing columns but continue
  if (missing.length > 0) {
    const warningMessage = `Missing columns (in TDX but not extracted): ${missing.join(', ')}`;
    console.warn(`[schema-validator] WARNING: ${warningMessage}`);
    warnings.push(warningMessage);
  }

  // Step 3: Empty table type handling
  if (!extractedData.attributes || extractedData.attributes.length === 0) {
    const warningMessage = 'No attribute tables found';
    console.warn(`[schema-validator] WARNING: ${warningMessage}`);
    warnings.push(warningMessage);
  }

  if (!extractedData.behaviors || extractedData.behaviors.length === 0) {
    const warningMessage = 'No behavior tables found';
    console.warn(`[schema-validator] WARNING: ${warningMessage}`);
    warnings.push(warningMessage);
  }

  return {
    valid: true,
    hallucinated: hallucinated,
    missing: missing,
    warnings: warnings
  };
}
