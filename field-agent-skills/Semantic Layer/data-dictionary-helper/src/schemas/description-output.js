/**
 * JSON Schema for Claude Structured Output
 *
 * Defines the expected format for AI-generated column descriptions.
 * Used with Claude's structured outputs API to guarantee JSON conformance.
 *
 * @module description-output
 */

/**
 * JSON Schema for a single column description.
 *
 * Defines the structure for AI-generated metadata about one column:
 * - column_name: The column identifier
 * - description: 2-3 sentence explanation (purpose + typical values + AI context)
 * - classification: Whether this is an attribute (static) or behavior (temporal)
 * - usage_hint: Optional guidance for non-obvious columns
 */
export const ColumnDescriptionSchema = {
  type: 'object',
  properties: {
    column_name: {
      type: 'string',
      description: 'Name of the column being described'
    },
    description: {
      type: 'string',
      description: '2-3 sentences: purpose + typical values + AI-relevant context'
    },
    classification: {
      type: 'string',
      enum: ['attribute', 'behavior'],
      description: 'Whether this column represents a static attribute or temporal behavior'
    },
    usage_hint: {
      type: 'string',
      description: 'Use for... sentence, only for non-obvious columns'
    }
  },
  required: ['column_name', 'description', 'classification'],
  additionalProperties: false
};

/**
 * JSON Schema for complete table description output.
 *
 * Defines the top-level structure returned by Claude when generating
 * descriptions for an entire table's columns.
 */
export const descriptionOutputSchema = {
  type: 'object',
  properties: {
    table_type: {
      type: 'string',
      enum: ['master', 'attribute', 'behavior'],
      description: 'Type of table (from TD Parent Segment schema)'
    },
    database: {
      type: 'string',
      description: 'Database name'
    },
    table: {
      type: 'string',
      description: 'Table name'
    },
    columns: {
      type: 'array',
      items: ColumnDescriptionSchema,
      description: 'Array of column descriptions'
    }
  },
  required: ['table_type', 'database', 'table', 'columns'],
  additionalProperties: false
};
