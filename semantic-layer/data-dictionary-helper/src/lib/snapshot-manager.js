/**
 * Snapshot Management for Write-Back Operations
 *
 * Provides before/after snapshot storage for table schemas to enable
 * rollback capability. Snapshots are stored as JSON files in ./snapshots/
 * directory with timestamp-based filenames for sorting and retrieval.
 *
 * Snapshot structure:
 * {
 *   segment: string,
 *   timestamp: ISO string,
 *   type: 'before' | 'after',
 *   tables: [{ database, name, schema }]
 * }
 *
 * @module snapshot-manager
 */

import fs from 'fs-extra';
import { join } from 'path';

const { ensureDir, writeJson, readJson, readdir } = fs;

/**
 * Create a snapshot of table schemas for a segment.
 *
 * Snapshots are stored in ./snapshots/ directory with format:
 * {segment}-{timestamp}.json
 *
 * Timestamp is ISO format with special characters replaced for filename safety.
 * Type field ('before' or 'after') stored in JSON for filtering during retrieval.
 *
 * @param {string} segment - Segment name (used in filename)
 * @param {Array<object>} tables - Array of table objects with database, name, schema
 * @param {string} [type='before'] - Snapshot type ('before' or 'after')
 * @returns {Promise<string>} Path to created snapshot file
 * @throws {Error} If directory creation or file write fails
 *
 * @example
 * const tables = [
 *   {
 *     database: 'prod_db',
 *     name: 'customers',
 *     schema: [
 *       ["customer_id", "string", "Unique identifier"],
 *       ["email", "string", "Email address"]
 *     ]
 *   }
 * ];
 *
 * const snapshotPath = await createSnapshot('Customer', tables, 'before');
 * // Creates: ./snapshots/Customer-2026-02-02T10-30-45-123Z.json
 */
export async function createSnapshot(segment, tables, type = 'before') {
  try {
    // Generate ISO timestamp and sanitize for filename
    // Replace colons and periods with hyphens for filesystem compatibility
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

    // Build snapshot path
    const snapshotPath = join('./snapshots', `${segment}-${timestamp}.json`);

    // Create snapshot structure
    const snapshot = {
      segment,
      timestamp: new Date().toISOString(), // Keep original ISO format in JSON
      type, // 'before' or 'after'
      tables: tables.map(table => ({
        database: table.database,
        name: table.name,
        schema: table.schema // [["col1","type","desc"], ...]
      }))
    };

    // Ensure snapshots directory exists
    await ensureDir('./snapshots');

    // Write snapshot with pretty formatting
    await writeJson(snapshotPath, snapshot, { spaces: 2 });

    return snapshotPath;
  } catch (error) {
    // Enhanced error messages for common failure modes
    if (error.code === 'EACCES') {
      throw new Error(
        `Permission denied creating snapshot.\n` +
        `Directory: ./snapshots\n` +
        `Ensure you have write permissions to this location.`
      );
    }

    throw new Error(
      `Failed to create snapshot for segment "${segment}".\n` +
      `Type: ${type}\n` +
      `Error: ${error.message}`
    );
  }
}

/**
 * Load the most recent snapshot of specified type for a segment.
 *
 * Searches ./snapshots/ directory for files matching {segment}-*.json,
 * sorts by filename (which contains timestamp), and returns the most
 * recent snapshot of the specified type.
 *
 * @param {string} segment - Segment name to search for
 * @param {string} [type='before'] - Snapshot type to load ('before' or 'after')
 * @returns {Promise<object>} Snapshot object with segment, timestamp, type, tables
 * @throws {Error} If no snapshots found for segment or no matching type
 *
 * @example
 * const beforeSnapshot = await loadMostRecentSnapshot('Customer', 'before');
 * // Returns: { segment: 'Customer', timestamp: '...', type: 'before', tables: [...] }
 *
 * const afterSnapshot = await loadMostRecentSnapshot('Customer', 'after');
 * // Returns most recent 'after' snapshot
 */
export async function loadMostRecentSnapshot(segment, type = 'before') {
  try {
    // Ensure snapshots directory exists (create if missing)
    await ensureDir('./snapshots');

    // Read all files in snapshots directory
    const snapshotFiles = await readdir('./snapshots');

    // Filter for this segment's snapshots and sort reverse (newest first)
    const segmentSnapshots = snapshotFiles
      .filter(f => f.startsWith(`${segment}-`) && f.endsWith('.json'))
      .sort()
      .reverse();

    if (segmentSnapshots.length === 0) {
      throw new Error(
        `No snapshots found for segment: ${segment}\n` +
        'Create a snapshot before attempting to load it.'
      );
    }

    // Find most recent snapshot of specified type
    for (const file of segmentSnapshots) {
      const snapshotPath = join('./snapshots', file);
      const snapshot = await readJson(snapshotPath);

      if (snapshot.type === type) {
        return snapshot;
      }
    }

    // No matching type found
    throw new Error(
      `No ${type} snapshot found for segment: ${segment}\n` +
      `Found ${segmentSnapshots.length} snapshot(s) but none match type "${type}".`
    );
  } catch (error) {
    // Re-throw errors from ensureDir/readdir/readJson with context
    if (error.message.includes('No snapshots found') || error.message.includes('No before') || error.message.includes('No after')) {
      throw error; // Already formatted
    }

    throw new Error(
      `Failed to load snapshot for segment "${segment}".\n` +
      `Type: ${type}\n` +
      `Error: ${error.message}`
    );
  }
}

/**
 * List all snapshots for a segment with metadata.
 *
 * Returns array of snapshot information sorted by timestamp (newest first).
 * Useful for displaying available snapshots to user or selecting specific snapshot.
 *
 * @param {string} segment - Segment name to list snapshots for
 * @returns {Promise<Array<object>>} Array of snapshot metadata objects
 * @throws {Error} If directory read fails
 *
 * @example
 * const snapshots = await listSnapshots('Customer');
 * // Returns:
 * // [
 * //   {
 * //     path: './snapshots/Customer-2026-02-02T11-00-00-000Z.json',
 * //     timestamp: '2026-02-02T11:00:00.000Z',
 * //     type: 'after',
 * //     tableCount: 5
 * //   },
 * //   {
 * //     path: './snapshots/Customer-2026-02-02T10-30-00-000Z.json',
 * //     timestamp: '2026-02-02T10:30:00.000Z',
 * //     type: 'before',
 * //     tableCount: 5
 * //   }
 * // ]
 */
export async function listSnapshots(segment) {
  try {
    // Ensure snapshots directory exists (create if missing)
    await ensureDir('./snapshots');

    // Read all files in snapshots directory
    const snapshotFiles = await readdir('./snapshots');

    // Filter for this segment's snapshots
    const segmentSnapshots = snapshotFiles
      .filter(f => f.startsWith(`${segment}-`) && f.endsWith('.json'))
      .sort()
      .reverse(); // Newest first

    // Load metadata from each snapshot
    const snapshots = await Promise.all(
      segmentSnapshots.map(async (file) => {
        const snapshotPath = join('./snapshots', file);
        const snapshot = await readJson(snapshotPath);

        return {
          path: snapshotPath,
          timestamp: snapshot.timestamp,
          type: snapshot.type,
          tableCount: snapshot.tables.length
        };
      })
    );

    return snapshots;
  } catch (error) {
    throw new Error(
      `Failed to list snapshots for segment "${segment}".\n` +
      `Error: ${error.message}`
    );
  }
}
