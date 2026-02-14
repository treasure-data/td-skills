/**
 * Context Builder for AI Prompt Generation
 *
 * Provides utilities for building AI prompts with business context for column
 * description generation. Includes inference from sample data and prompt assembly.
 *
 * @module context-builder
 */

/**
 * Infer business context from sample data column names.
 *
 * Scans sample data for domain-specific indicators (e-commerce, SaaS, healthcare,
 * financial) based on common column naming patterns. Returns human-readable
 * inferences that can be surfaced to users for confirmation.
 *
 * @param {Object} samples - Schema samples object with master/attributes/behaviors keys
 * @returns {string[]} Array of inference strings (e.g., "Looks like e-commerce data...")
 *
 * @example
 * const samples = {
 *   master: [
 *     { cart_value: 100, order_id: '123', product_id: 'ABC' }
 *   ]
 * };
 * const inferences = inferContextFromSamples(samples);
 * // Returns: ["Looks like e-commerce data (found cart/order/product columns)"]
 */
export function inferContextFromSamples(samples) {
  if (!samples || typeof samples !== 'object') {
    return [];
  }

  const inferences = [];

  // Collect all column names across master, attributes, and behaviors
  const allColumns = new Set();

  // Master table columns
  if (samples.master && Array.isArray(samples.master) && samples.master.length > 0) {
    Object.keys(samples.master[0]).forEach(col => allColumns.add(col.toLowerCase()));
  }

  // Attribute table columns
  if (samples.attributes && Array.isArray(samples.attributes)) {
    samples.attributes.forEach(attrSample => {
      if (Array.isArray(attrSample) && attrSample.length > 0) {
        Object.keys(attrSample[0]).forEach(col => allColumns.add(col.toLowerCase()));
      }
    });
  }

  // Behavior table columns
  if (samples.behaviors && Array.isArray(samples.behaviors)) {
    samples.behaviors.forEach(behaviorSample => {
      if (Array.isArray(behaviorSample) && behaviorSample.length > 0) {
        Object.keys(behaviorSample[0]).forEach(col => allColumns.add(col.toLowerCase()));
      }
    });
  }

  // Convert Set to array for easier checking
  const columnNames = Array.from(allColumns);

  // E-commerce indicators
  const ecommerceIndicators = ['cart_value', 'order_id', 'product_id', 'purchase_date', 'cart_total', 'order_total'];
  if (ecommerceIndicators.some(indicator => columnNames.includes(indicator))) {
    inferences.push('Looks like e-commerce data (found cart/order/product columns)');
  }

  // SaaS indicators
  const saasIndicators = ['subscription_id', 'plan_type', 'mrr', 'churn_date', 'trial_start', 'billing_cycle'];
  if (saasIndicators.some(indicator => columnNames.includes(indicator))) {
    inferences.push('Looks like SaaS/subscription data');
  }

  // Healthcare indicators
  const healthcareIndicators = ['patient_id', 'diagnosis', 'treatment', 'provider', 'claim_id'];
  if (healthcareIndicators.some(indicator => columnNames.includes(indicator))) {
    inferences.push('Looks like healthcare data');
  }

  // Financial indicators
  const financialIndicators = ['account_balance', 'transaction_amount', 'credit_score', 'loan_id'];
  if (financialIndicators.some(indicator => columnNames.includes(indicator))) {
    inferences.push('Looks like financial services data');
  }

  return inferences;
}

/**
 * Build system prompt for AI description generation.
 *
 * Creates a structured system prompt with business context, style requirements,
 * classification guidance, and AI agent hints. Follows Pattern 4 from RESEARCH.md
 * for business-first descriptions optimized for both humans and AI agents.
 *
 * @param {Object} context - Business context collected from user
 * @param {string} context.industry - Industry (e.g., "retail", "e-commerce")
 * @param {string} context.companyType - Company/business model description
 * @param {string} context.segmentPurpose - What the segment is used for
 * @param {string} context.primaryUseCases - Primary use cases (e.g., "marketing campaigns")
 * @param {string} [context.domainGlossary] - Optional domain-specific terminology
 * @param {string} [context.corrections] - Optional corrections to inferred context
 * @returns {string} System prompt string for Claude API
 *
 * @example
 * const context = {
 *   industry: 'retail',
 *   companyType: 'e-commerce marketplace',
 *   segmentPurpose: 'customer segmentation',
 *   primaryUseCases: 'email campaigns and personalization'
 * };
 * const systemPrompt = buildSystemPrompt(context);
 * // Returns multi-line prompt with role, audience, style, context
 */
export function buildSystemPrompt(context) {
  return `You are a data documentation expert creating column descriptions for a ${context.industry} company.

Your audience: Marketing analysts and AI agents (like TD Audience Agent) who need to understand what each column means for customer segmentation.

STYLE REQUIREMENTS:
- Business-first language: A marketing analyst should understand without asking engineering
- 2-3 sentences per description: purpose + typical values + AI-relevant context
- Embed usage hints naturally in prose, not as separate metadata
- Example format: "Customer age in years (range: 18-120, use for age-based segmentation)"
- Include "Use for..." sentences for non-obvious columns only
- Skip usage hints for self-explanatory columns like "email" or "first_name"

CLASSIFICATION:
- Attribute: Static or semi-static profile data (demographics, preferences, IDs)
- Behavior: Event-based data tracking actions over time (purchases, clicks, visits)

CONTEXT:
- Industry: ${context.industry}
- Company type: ${context.companyType}
- Segment purpose: ${context.segmentPurpose}
- Use cases: ${context.primaryUseCases}
${context.domainGlossary ? `- Domain terminology: ${context.domainGlossary}` : ''}
${context.corrections ? `- Context corrections: ${context.corrections}` : ''}

AI AGENT GUIDANCE:
Descriptions should prevent hallucination by AI agents. Be explicit about:
- What values mean (not just what they're called)
- Valid ranges or categories
- How the column should be used for segmentation
- Any columns that should NOT be used directly (e.g., internal IDs)`;
}

/**
 * Build user prompt for description generation with schema details.
 *
 * Constructs a prompt with database/table info, column list, and optional sample
 * data for AI to generate descriptions. Supports master, attribute, and behavior
 * table types with optional table indexing for multi-table segments.
 *
 * @param {Object} schema - Full schema object from Phase 1
 * @param {string} tableType - Table type: 'master', 'attribute', or 'behavior'
 * @param {Object} context - Business context (not currently used in prompt, reserved for future)
 * @param {number} [tableIndex=0] - Index for attribute/behavior arrays (default: 0)
 * @returns {string} User prompt string with table details and sample data
 *
 * @example
 * const schema = {
 *   master: {
 *     database: 'prod_db',
 *     table: 'customers',
 *     columns: [
 *       { name: 'customer_id', type: 'varchar' },
 *       { name: 'email', type: 'varchar' }
 *     ]
 *   },
 *   samples: {
 *     master: [
 *       { customer_id: 'C001', email: 'user@example.com' }
 *     ]
 *   }
 * };
 * const prompt = buildDescriptionPrompt(schema, 'master', {});
 * // Returns prompt with database, table, columns, and sample data
 */
export function buildDescriptionPrompt(schema, tableType, context, tableIndex = 0) {
  // Get table data based on type
  let table;
  if (tableType === 'master') {
    table = schema.master;
  } else if (tableType === 'attribute') {
    table = schema.attributes && schema.attributes[tableIndex];
  } else if (tableType === 'behavior') {
    table = schema.behaviors && schema.behaviors[tableIndex];
  }

  if (!table) {
    throw new Error(`No ${tableType} table found in schema at index ${tableIndex}`);
  }

  // Build base prompt
  let prompt = `Generate descriptions for the following ${tableType} table columns:

Database: ${table.database}
Table: ${table.table}

Columns:
${table.columns.map(c => `- ${c.name} (${c.type})`).join('\n')}
`;

  // Include sample data if available
  if (schema.samples) {
    let samples;
    if (tableType === 'master' && schema.samples.master) {
      samples = schema.samples.master;
    } else if (tableType === 'attribute' && schema.samples.attributes && schema.samples.attributes[tableIndex]) {
      samples = schema.samples.attributes[tableIndex];
    } else if (tableType === 'behavior' && schema.samples.behaviors && schema.samples.behaviors[tableIndex]) {
      samples = schema.samples.behaviors[tableIndex];
    }

    if (samples && Array.isArray(samples) && samples.length > 0) {
      const sampleSlice = samples.slice(0, 5);
      prompt += `\nSample data (${Math.min(5, samples.length)} rows, PII redacted):\n${JSON.stringify(sampleSlice, null, 2)}`;
    }
  }

  return prompt;
}
