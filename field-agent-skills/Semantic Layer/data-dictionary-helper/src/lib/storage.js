/**
 * Schema Storage Utility
 *
 * Provides file I/O operations for saving and loading extracted schemas
 * to/from the ./schemas directory.
 *
 * @module storage
 */

import fs from 'fs-extra';
import { join } from 'path';
import chalk from 'chalk';

const { ensureDir, writeJson, readJson } = fs;

/**
 * Save a schema to a JSON file in the schemas directory.
 *
 * Creates the output directory if it doesn't exist, then writes the schema
 * data as pretty-formatted JSON. Returns the filepath where the schema was saved.
 *
 * @param {string} segmentName - Name of the segment (used as filename)
 * @param {Object} schemaData - Schema data to save (just the schema, no wrapper metadata)
 * @param {string} [outputDir='./schemas'] - Output directory for schema files
 * @returns {Promise<string>} Filepath where schema was saved
 * @throws {Error} If directory creation or file write fails
 *
 * @example
 * import { saveSchema } from './lib/storage.js';
 *
 * const schema = {
 *   segment_name: 'Customer',
 *   master: { database: 'prod', table: 'customers', columns: [...] },
 *   attributes: [],
 *   behaviors: []
 * };
 *
 * const filepath = await saveSchema('Customer', schema);
 * // Saves to: ./schemas/Customer.json
 * // Logs: ✓ Schema saved: ./schemas/Customer.json
 */
export async function saveSchema(segmentName, schemaData, outputDir = './schemas') {
  try {
    // Ensure output directory exists
    await ensureDir(outputDir);

    // Build filepath
    const filepath = join(outputDir, `${segmentName}.json`);

    // Write JSON with pretty formatting (2 spaces indentation)
    await writeJson(filepath, schemaData, { spaces: 2 });

    // Log success with visual feedback
    console.log(chalk.green(`✓ Schema saved: ${filepath}`));

    return filepath;
  } catch (error) {
    // Enhanced error messages for common failure modes
    if (error.code === 'EACCES') {
      throw new Error(
        `Permission denied writing schema file.\n` +
        `Directory: ${outputDir}\n` +
        `Ensure you have write permissions to this location.`
      );
    }

    throw new Error(
      `Failed to save schema for segment "${segmentName}".\n` +
      `Output directory: ${outputDir}\n` +
      `Error: ${error.message}`
    );
  }
}

/**
 * Load a schema from a JSON file in the schemas directory.
 *
 * Reads and parses the JSON file for the specified segment name.
 * Throws descriptive errors if the file doesn't exist or contains invalid JSON.
 *
 * @param {string} segmentName - Name of the segment to load
 * @param {string} [outputDir='./schemas'] - Directory containing schema files
 * @returns {Promise<Object>} Parsed schema data
 * @throws {Error} If file not found, JSON parse fails, or permissions error
 *
 * @example
 * import { loadSchema } from './lib/storage.js';
 *
 * const schema = await loadSchema('Customer');
 * // Reads from: ./schemas/Customer.json
 * // Returns: { segment_name: 'Customer', master: {...}, ... }
 */
export async function loadSchema(segmentName, outputDir = './schemas') {
  // Build filepath
  const filepath = join(outputDir, `${segmentName}.json`);

  try {
    // Read and parse JSON
    const schemaData = await readJson(filepath);
    return schemaData;
  } catch (error) {
    // Enhanced error messages for common failure modes
    if (error.code === 'ENOENT') {
      throw new Error(
        `Schema not found: ${filepath}\n` +
        `Segment "${segmentName}" has not been extracted yet.\n` +
        `Run: dd-extract extract ${segmentName}`
      );
    }

    if (error.name === 'SyntaxError' || error.message.includes('JSON')) {
      throw new Error(
        `Invalid JSON in schema file: ${filepath}\n` +
        `The file may be corrupted. Try re-extracting the schema.\n` +
        `Parse error: ${error.message}`
      );
    }

    if (error.code === 'EACCES') {
      throw new Error(
        `Permission denied reading schema file: ${filepath}\n` +
        `Ensure you have read permissions for this file.`
      );
    }

    throw new Error(
      `Failed to load schema for segment "${segmentName}".\n` +
      `File: ${filepath}\n` +
      `Error: ${error.message}`
    );
  }
}
