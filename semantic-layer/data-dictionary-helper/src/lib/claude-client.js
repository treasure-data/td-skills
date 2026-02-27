/**
 * Claude API Client with Structured Outputs
 *
 * Provides a wrapper for calling Claude API with guaranteed JSON schema conformance
 * using the structured outputs beta feature.
 *
 * @module claude-client
 */

import Anthropic from '@anthropic-ai/sdk';

/**
 * Call Claude API with structured output guarantee.
 *
 * Makes a request to Claude API that returns JSON conforming to the provided schema.
 * Uses the structured-outputs beta to ensure the response matches the schema exactly.
 *
 * @param {string} systemPrompt - System context for the model
 * @param {string} userPrompt - User message with task details
 * @param {Object} outputSchema - JSON Schema object defining the expected output structure
 * @returns {Promise<Object>} Parsed JSON response conforming to outputSchema
 * @throws {Error} If API call fails, model refuses, or response is invalid
 *
 * @example
 * import { callClaudeWithStructuredOutput } from './lib/claude-client.js';
 *
 * const schema = {
 *   type: 'object',
 *   properties: {
 *     name: { type: 'string' },
 *     age: { type: 'number' }
 *   },
 *   required: ['name', 'age']
 * };
 *
 * const result = await callClaudeWithStructuredOutput(
 *   'You are a data parser.',
 *   'Extract name and age from: John is 30 years old',
 *   schema
 * );
 * // Returns: { name: 'John', age: 30 }
 */
export async function callClaudeWithStructuredOutput(systemPrompt, userPrompt, outputSchema) {
  // Create Anthropic client (reads ANTHROPIC_API_KEY from env)
  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY
  });

  try {
    // Add explicit JSON instructions to the system prompt
    const jsonSystemPrompt = systemPrompt + `\n\nIMPORTANT: You MUST respond with ONLY valid JSON (no markdown, no code fences, no explanation).
The JSON must conform to this schema:
${JSON.stringify(outputSchema, null, 2)}`;

    // Call Claude API with standard messages endpoint
    const response = await client.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 16384,
      system: jsonSystemPrompt,
      messages: [
        {
          role: 'user',
          content: userPrompt + '\n\nRespond with ONLY valid JSON matching the schema. No markdown, no code fences.'
        }
      ]
    });

    // Handle stop reasons
    if (response.stop_reason === 'refusal') {
      throw new Error(
        'Claude refused to respond to this request.\n' +
        `Refusal reason: ${response.content[0]?.text || 'No details provided'}`
      );
    }

    if (response.stop_reason === 'max_tokens') {
      console.warn(
        'Warning: Claude response was truncated due to max_tokens limit.\n' +
        'The output may be incomplete. Consider increasing max_tokens if needed.'
      );
    }

    // Extract and parse JSON from response
    let jsonText = response.content[0]?.text;
    if (!jsonText) {
      throw new Error('No content returned from Claude API');
    }

    // Strip markdown code fences if present (```json ... ```)
    jsonText = jsonText.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();

    return JSON.parse(jsonText);

  } catch (error) {
    // Handle rate limiting (SDK auto-retries, but log if it happens)
    if (error.status === 429) {
      console.log('Rate limit hit - SDK is retrying automatically...');
      throw error; // Re-throw to let SDK retry logic handle it
    }

    // Enhanced error message for missing API key
    if (error.message?.includes('API key') || error.status === 401) {
      throw new Error(
        'Anthropic API authentication failed.\n' +
        'Ensure ANTHROPIC_API_KEY environment variable is set.\n' +
        'Get your API key from: https://console.anthropic.com/settings/keys'
      );
    }

    // Re-throw with context
    throw new Error(
      `Claude API call failed: ${error.message}\n` +
      `Model: claude-sonnet-4-5-20250929\n` +
      `Status: ${error.status || 'unknown'}`
    );
  }
}
