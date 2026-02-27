/**
 * Column Classifier for Attribute vs Behavior Detection
 *
 * Provides heuristics to classify table columns as either attributes (static properties)
 * or behaviors (temporal events/actions). Table type from TD schema is authoritative;
 * heuristics only apply to master table columns.
 *
 * @module column-classifier
 */

/**
 * Indicators for attribute columns (static, descriptive properties).
 *
 * These represent stable characteristics of entities that don't change frequently
 * or represent state snapshots rather than time-series events.
 */
export const ATTRIBUTE_INDICATORS = {
  columns: [
    'first_name',
    'last_name',
    'email',
    'phone',
    'gender',
    'age',
    'birth_date',
    'address',
    'city',
    'state',
    'country',
    'zip',
    'customer_id',
    'account_id',
    'user_id',
    'profile_id',
    'subscription_plan',
    'membership_level',
    'segment'
  ],
  patterns: [
    /^is_/,        // is_active, is_verified
    /^has_/,       // has_subscription, has_account
    /_flag$/,      // active_flag, deleted_flag
    /_status$/,    // account_status, member_status
    /_type$/,      // customer_type, account_type
    /_tier$/       // service_tier, membership_tier
  ]
};

/**
 * Indicators for behavior columns (temporal events, actions, transactions).
 *
 * These represent time-series data, user actions, or event-based information
 * that accumulates over time.
 */
export const BEHAVIOR_INDICATORS = {
  columns: [
    'event_type',
    'action',
    'page_view',
    'click',
    'purchase',
    'session_id',
    'visit_id',
    'transaction_id',
    'order_id',
    'timestamp',
    'event_time',
    'created_at',
    'occurred_at'
  ],
  patterns: [
    /_count$/,     // purchase_count, login_count
    /_date$/,      // purchase_date, signup_date (events)
    /_at$/,        // created_at, updated_at, occurred_at
    /^last_/,      // last_purchase, last_login
    /^first_/,     // first_visit, first_purchase
    /_total$/      // revenue_total, orders_total
  ]
};

/**
 * Classify a column as 'attribute' or 'behavior'.
 *
 * Classification rules (in priority order):
 * 1. If tableType is 'attribute' or 'behavior', return that (table type is authoritative)
 * 2. For 'master' tables, apply heuristics:
 *    - Check column name against known attribute/behavior column names
 *    - Check column name against attribute/behavior regex patterns
 *    - Default to 'attribute' if no match
 *
 * @param {string} columnName - Name of the column to classify
 * @param {string} tableType - Type of parent table ('master' | 'attribute' | 'behavior')
 * @returns {'attribute' | 'behavior'} Classification result
 *
 * @example
 * // Table type is authoritative
 * classifyColumn('age', 'behavior'); // Returns 'behavior' (table type overrides)
 * classifyColumn('purchase_count', 'attribute'); // Returns 'attribute' (table type overrides)
 *
 * @example
 * // Heuristics for master table columns
 * classifyColumn('first_name', 'master'); // Returns 'attribute' (known attribute column)
 * classifyColumn('purchase_count', 'master'); // Returns 'behavior' (matches /_count$/ pattern)
 * classifyColumn('is_active', 'master'); // Returns 'attribute' (matches /^is_/ pattern)
 * classifyColumn('unknown_column', 'master'); // Returns 'attribute' (default)
 */
export function classifyColumn(columnName, tableType) {
  // Table type is authoritative - if specified, use it directly
  if (tableType === 'behavior') {
    return 'behavior';
  }

  if (tableType === 'attribute') {
    return 'attribute';
  }

  // For master tables, apply heuristics
  if (tableType === 'master') {
    const lowerColumnName = columnName.toLowerCase();

    // Check against known attribute column names
    if (ATTRIBUTE_INDICATORS.columns.some(col => lowerColumnName.includes(col))) {
      return 'attribute';
    }

    // Check against known behavior column names
    if (BEHAVIOR_INDICATORS.columns.some(col => lowerColumnName.includes(col))) {
      return 'behavior';
    }

    // Check against attribute patterns
    if (ATTRIBUTE_INDICATORS.patterns.some(pattern => pattern.test(columnName))) {
      return 'attribute';
    }

    // Check against behavior patterns
    if (BEHAVIOR_INDICATORS.patterns.some(pattern => pattern.test(columnName))) {
      return 'behavior';
    }

    // Default to attribute for master table columns
    return 'attribute';
  }

  // Fallback for unknown table types
  return 'attribute';
}
