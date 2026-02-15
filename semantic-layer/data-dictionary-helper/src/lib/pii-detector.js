/**
 * PII Detection and Redaction Utility
 *
 * Provides regex-based pattern matching for common PII types and automatic
 * redaction for sample data protection.
 *
 * @module pii-detector
 */

/**
 * Regex patterns for common PII types.
 * These patterns are applied during redaction to protect sensitive data.
 */
export const PII_PATTERNS = {
  email: {
    regex: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    replacement: '[EMAIL_REDACTED]',
    type: 'email'
  },
  phone: {
    // Require either: +country code, parentheses, or dashes/dots/spaces between groups
    // to avoid matching plain 10-digit numbers like timestamps
    regex: /(\+\d{1,2}\s?\d{3}[-.\s]?\d{3}[-.\s]?\d{4}|\(\d{3}\)\s?\d{3}[-.\s]?\d{4}|\d{3}[-.\s]\d{3}[-.\s]\d{4})/g,
    replacement: '[PHONE_REDACTED]',
    type: 'phone'
  },
  ssn: {
    regex: /\b\d{3}-\d{2}-\d{4}\b/g,
    replacement: '[SSN_REDACTED]',
    type: 'ssn'
  },
  creditCard: {
    regex: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
    replacement: '[CARD_REDACTED]',
    type: 'creditCard'
  }
};

/**
 * Column name patterns for PII detection.
 * Used by detectPIIColumn to identify potentially sensitive columns by name.
 */
export const PII_COLUMN_PATTERNS = [
  'email', 'ssn', 'social_security', 'phone', 'mobile',
  'address', 'passport', 'driver_license', 'credit_card',
  'dob', 'birth_date', 'salary', 'wage'
];

/**
 * Content patterns for PII detection in sample values.
 * Used by detectPIIColumn for content-based PII detection.
 * Uses strict patterns with word boundaries per STATE.md decision (2026-01-28).
 */
export const PII_CONTENT_PATTERNS = {
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/,
  ssn: /\b\d{3}-\d{2}-\d{4}\b/,
  phone: /\b\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/  // Strict pattern per STATE.md decision
};

/**
 * Detects PII in data objects or strings.
 *
 * @param {Object|string} data - Data to scan for PII
 * @returns {Array<Object>} Array of detected PII instances with type, value, and field information
 *
 * @example
 * const data = {
 *   contact_email: 'user@example.com',
 *   phone_number: '555-123-4567',
 *   notes: 'Called John at 555-987-6543'
 * };
 * const detected = detectPII(data);
 * // Returns:
 * // [
 * //   { type: 'email', value: 'user@example.com', field: 'contact_email' },
 * //   { type: 'phone', value: '555-123-4567', field: 'phone_number' },
 * //   { type: 'phone', value: '555-987-6543', field: 'notes' }
 * // ]
 */
export function detectPII(data) {
  const detected = [];

  // Convert data to string for scanning if it's an object
  const isObject = typeof data === 'object' && data !== null;
  const scanData = isObject ? JSON.stringify(data, null, 2) : String(data);

  // Scan for each PII pattern type
  for (const [patternName, patternConfig] of Object.entries(PII_PATTERNS)) {
    const matches = scanData.matchAll(patternConfig.regex);

    for (const match of matches) {
      const value = match[0];

      // Try to find the field name if data is an object
      let field = null;
      if (isObject) {
        // Find which field contains this value
        for (const [key, val] of Object.entries(data)) {
          if (String(val).includes(value)) {
            field = key;
            break;
          }
        }
      }

      detected.push({
        type: patternConfig.type,
        value: value,
        field: field
      });
    }
  }

  return detected;
}

/**
 * Detects if a column likely contains PII based on column name and/or sample values.
 * Combines column name heuristics with content pattern matching for robust detection.
 *
 * @param {string} columnName - Name of the column to check
 * @param {Array<string>} sampleValues - Optional sample values from the column
 * @returns {boolean} True if column likely contains PII
 *
 * @example
 * detectPIIColumn('user_email');  // true (column name match)
 * detectPIIColumn('mobile_number');  // true (column name match)
 * detectPIIColumn('order_id');  // false (no match)
 * detectPIIColumn('contact', ['test@example.com']);  // true (content match)
 * detectPIIColumn('timestamp', ['2024-01-01 12:34:56']);  // false (strict regex avoids timestamps)
 */
export function detectPIIColumn(columnName, sampleValues = []) {
  // Check column name first (fast path)
  const colLower = columnName.toLowerCase();
  if (PII_COLUMN_PATTERNS.some(pattern => colLower.includes(pattern))) {
    return true;
  }

  // Check content patterns if samples provided (sample first 100)
  if (sampleValues && sampleValues.length > 0) {
    const samplesToCheck = sampleValues.slice(0, 100);
    for (const [patternName, regex] of Object.entries(PII_CONTENT_PATTERNS)) {
      for (const value of samplesToCheck) {
        if (value && regex.test(String(value))) {
          return true;
        }
      }
    }
  }

  return false;
}

/**
 * Redacts PII from data objects or strings by replacing with type-specific placeholders.
 *
 * @param {Object|string} data - Data to redact
 * @returns {Object|string} Same structure with PII replaced by placeholders
 *
 * @example
 * const data = {
 *   email: 'user@example.com',
 *   phone: '555-123-4567',
 *   ssn: '123-45-6789',
 *   card: '1234-5678-9012-3456'
 * };
 * const redacted = redactPII(data);
 * // Returns:
 * // {
 * //   email: '[EMAIL_REDACTED]',
 * //   phone: '[PHONE_REDACTED]',
 * //   ssn: '[SSN_REDACTED]',
 * //   card: '[CARD_REDACTED]'
 * // }
 *
 * @example
 * const text = 'Contact me at user@example.com or 555-123-4567';
 * const redacted = redactPII(text);
 * // Returns: 'Contact me at [EMAIL_REDACTED] or [PHONE_REDACTED]'
 */
export function redactPII(data) {
  // Handle null/undefined
  if (data == null) {
    return data;
  }

  const isObject = typeof data === 'object';

  // Convert to JSON string for processing
  let stringData = isObject ? JSON.stringify(data) : String(data);

  // Apply all PII pattern replacements
  for (const patternConfig of Object.values(PII_PATTERNS)) {
    stringData = stringData.replace(patternConfig.regex, patternConfig.replacement);
  }

  // Parse back to object if input was object, otherwise return string
  return isObject ? JSON.parse(stringData) : stringData;
}
