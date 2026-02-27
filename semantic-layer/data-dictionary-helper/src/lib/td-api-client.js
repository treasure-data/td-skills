/**
 * TD REST API Client
 *
 * Provides HTTP client wrapper for Treasure Data REST API with automatic
 * retry logic for transient failures (429, 500, 503 status codes).
 *
 * Uses axios with axios-retry for exponential backoff retry strategy:
 * - 3 retry attempts
 * - 300ms base delay with exponential backoff
 * - Retry on network errors and specific status codes
 *
 * @module td-api-client
 */

import axios from 'axios';
import axiosRetry from 'axios-retry';

/**
 * Create and configure axios instance for TD API communication.
 *
 * Configured with:
 * - Base URL: https://api.treasuredata.com
 * - Authorization header: TD1 {API_KEY}
 * - Content-Type: application/json
 * - Automatic retry with exponential backoff
 *
 * @returns {import('axios').AxiosInstance} Configured axios instance
 * @throws {Error} If TD_API_KEY environment variable is not set
 */
function createTdApiClient() {
  // Resolve API key: check TD_API_KEY first, then fall back to TDX_API_KEY env vars
  const apiKey = process.env.TD_API_KEY ||
    Object.entries(process.env).find(([k]) => k.startsWith('TDX_API_KEY__'))?.[1];

  if (!apiKey) {
    throw new Error(
      'TD_API_KEY environment variable not set.\n' +
      'Generate an API key at: https://console.treasuredata.com/users/current\n' +
      'Then set it in your environment:\n' +
      '  export TD_API_KEY=your-api-key-here'
    );
  }

  // Resolve API endpoint: EU01 if TDX env var contains EU01, otherwise US
  const isEU = Object.keys(process.env).some(k => k.startsWith('TDX_API_KEY__') && k.includes('EU'));
  const baseURL = isEU ? 'https://api.eu01.treasuredata.com' : 'https://api.treasuredata.com';

  // Create axios instance with TD API configuration
  const tdApiClient = axios.create({
    baseURL,
    headers: {
      'Authorization': `TD1 ${apiKey}`,
      'Content-Type': 'application/json'
    }
  });

  // Configure exponential backoff retry
  axiosRetry(tdApiClient, {
    retries: 3,
    retryDelay: (...arg) => axiosRetry.exponentialDelay(...arg, 300),
    retryCondition: (error) => {
      // Retry on network errors or specific status codes
      return axiosRetry.isNetworkOrIdempotentRequestError(error) ||
             (error.response && [429, 500, 503].includes(error.response.status));
    },
    onRetry: (retryCount, error, requestConfig) => {
      const status = error.response?.status || 'network error';
      console.log(`  Retry attempt ${retryCount} for ${requestConfig.url} (${status})`);
    }
  });

  return tdApiClient;
}

/**
 * Update table schema in Treasure Data via REST API.
 *
 * Sends full table schema to TD API /v3/table/update endpoint.
 * Schema format: [["column_name", "data_type", "description"], ...]
 *
 * IMPORTANT: TD API replaces entire schema, not a merge operation.
 * Always send complete schema with all columns to avoid data loss.
 *
 * @param {string} database - TD database name
 * @param {string} table - TD table name
 * @param {Array<[string, string, string]>} schema - Full table schema array
 * @returns {Promise<object>} API response data
 * @throws {Error} If API request fails (after retries)
 *
 * @example
 * const schema = [
 *   ["customer_id", "string", null, "Unique customer identifier"],
 *   ["email", "string", null, "Customer email address"],
 *   ["created_at", "long", null, "Account creation timestamp"]
 * ];
 *
 * const result = await updateTableSchema('prod_db', 'customers', schema);
 * // Returns: { database: 'prod_db', table: 'customers', type: 'log' }
 */
export async function updateTableSchema(database, table, schema) {
  try {
    const client = createTdApiClient();

    // POST to /v3/table/update-schema/{database}/{table}
    // Schema format: [name, type, alias, description]
    // - alias: SQL column alias (lowercase/digits/underscore only), set to null to keep existing
    // - description: free-text column description (no char restrictions)
    const params = new URLSearchParams();
    params.append('schema', JSON.stringify(schema));

    const response = await client.post(
      `/v3/table/update-schema/${database}/${table}`,
      params.toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    return response.data;
  } catch (error) {
    // Enhanced error message with status code and API response
    const status = error.response?.status;
    const apiError = error.response?.data;

    if (status === 401 || status === 403) {
      throw new Error(
        'TD API authentication failed. Check your TD_API_KEY.\n' +
        `Status: ${status}\n` +
        `Details: ${JSON.stringify(apiError)}`
      );
    }

    if (status === 404) {
      throw new Error(
        `Table not found: ${database}.${table}\n` +
        'Verify the database and table exist in Treasure Data.'
      );
    }

    if (status === 400) {
      throw new Error(
        `Invalid schema format for ${database}.${table}\n` +
        `Status: ${status}\n` +
        `Details: ${JSON.stringify(apiError)}\n` +
        'Schema must be array of arrays: [["col1","type","desc"], ...]'
      );
    }

    // Generic error with all available context
    throw new Error(
      `TD API request failed for ${database}.${table}\n` +
      `Status: ${status || 'unknown'}\n` +
      `Error: ${error.message}\n` +
      (apiError ? `API Response: ${JSON.stringify(apiError)}` : '')
    );
  }
}

/**
 * Test connection to TD API and validate API key.
 *
 * Makes a simple GET request to /v3/database/list to verify:
 * - TD_API_KEY environment variable is set
 * - API key is valid and not expired
 * - Network connectivity to TD API
 *
 * Use this before batch operations to fail fast on auth errors.
 *
 * @returns {Promise<boolean>} True if connection successful
 * @throws {Error} If API key missing, invalid, or network error
 *
 * @example
 * try {
 *   await testConnection();
 *   console.log('TD API connection OK');
 * } catch (error) {
 *   console.error('TD API connection failed:', error.message);
 *   process.exit(1);
 * }
 */
export async function testConnection() {
  try {
    const client = createTdApiClient();

    // Simple GET to database list endpoint (lightweight, always accessible)
    await client.get('/v3/database/list');

    return true;
  } catch (error) {
    const status = error.response?.status;

    if (status === 401 || status === 403) {
      throw new Error(
        'TD API authentication failed.\n' +
        'Your TD_API_KEY is invalid or expired.\n' +
        'Generate a new key at: https://console.treasuredata.com/users/current'
      );
    }

    throw new Error(
      `TD API connection test failed: ${error.message}\n` +
      'Check your network connection and TD_API_KEY.'
    );
  }
}
