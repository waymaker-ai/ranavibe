/**
 * Extract - Structured data extraction helper
 *
 * @example
 * ```typescript
 * import { extract } from '@rana/helpers';
 *
 * // Simple extraction
 * const result = await extract(
 *   'Contact John at john@example.com or call 555-1234',
 *   { name: 'string', email: 'string', phone: 'string' }
 * );
 * console.log(result.data);
 * // { name: 'John', email: 'john@example.com', phone: '555-1234' }
 *
 * // Complex schema
 * const invoice = await extract(invoiceText, {
 *   invoiceNumber: 'string',
 *   date: 'string',
 *   total: 'number',
 *   items: 'array'
 * });
 * ```
 */

import { z } from 'zod';
import type { ExtractOptions, ExtractResult, SchemaType } from '../types';
import { callLLM, parseJSON } from './base';

type SimpleSchema = Record<string, SchemaType>;

/**
 * Extract structured data from text
 *
 * @param text - The text to extract data from
 * @param schema - Schema defining fields to extract
 * @param options - Extraction options
 * @returns Extracted data with completeness score
 */
export async function extract<T extends SimpleSchema>(
  text: string,
  schema: T,
  options: ExtractOptions = {}
): Promise<ExtractResult<ExtractedType<T>>> {
  const { strict = false, examples } = options;

  const schemaDescription = Object.entries(schema)
    .map(([key, type]) => {
      const typeStr = typeof type === 'string' ? type : 'object';
      return `  "${key}": ${typeStr}`;
    })
    .join(',\n');

  const examplesText = examples
    ? `\nExamples:\n${examples.map(e => `Input: ${e.input}\nOutput: ${JSON.stringify(e.output)}`).join('\n\n')}`
    : '';

  const systemPrompt = `You are a precise data extraction assistant. Extract structured information from the given text according to the schema.

Schema:
{
${schemaDescription}
}
${examplesText}

Guidelines:
- Extract only the information that is explicitly present in the text
- Use null for fields that cannot be found
- For arrays, extract all relevant items
- For numbers, parse them correctly (remove currency symbols, etc.)
${strict ? '- All fields are required; if any cannot be extracted, indicate an error' : '- Optional fields can be null if not found'}

Respond with a JSON object matching the schema exactly.`;

  const { result, metadata } = await callLLM(
    'extract',
    text,
    systemPrompt,
    options,
    parseJSON
  );

  const data = result as ExtractedType<T>;

  // Calculate completeness
  const fields = Object.keys(schema);
  const filledFields = fields.filter(key => {
    const value = (data as Record<string, unknown>)[key];
    return value !== null && value !== undefined && value !== '';
  });
  const completeness = fields.length > 0 ? filledFields.length / fields.length : 1;

  return {
    data,
    completeness,
    cached: metadata.cached,
    cost: metadata.cost,
    latencyMs: metadata.latencyMs,
  };
}

/**
 * Extract with Zod schema validation
 */
export async function extractWithZod<T extends z.ZodType>(
  text: string,
  schema: T,
  options: ExtractOptions = {}
): Promise<ExtractResult<z.infer<T>>> {
  const schemaShape = schema._def;

  const systemPrompt = `You are a precise data extraction assistant. Extract structured information from the given text.

The extracted data must conform to the following structure.
Return a valid JSON object that matches the expected schema.

Guidelines:
- Extract only information explicitly present in the text
- Use null for optional fields that cannot be found
- Ensure all required fields are populated
- Parse numbers, dates, and booleans correctly`;

  const { result, metadata } = await callLLM(
    'extract_zod',
    text,
    systemPrompt,
    options,
    parseJSON
  );

  // Validate with Zod
  const validated = schema.parse(result);

  return {
    data: validated,
    completeness: 1.0, // Zod validation passed
    cached: metadata.cached,
    cost: metadata.cost,
    latencyMs: metadata.latencyMs,
  };
}

/**
 * Extract entities (names, places, organizations, etc.)
 */
export async function extractEntities(
  text: string,
  entityTypes: string[] = ['person', 'organization', 'location', 'date', 'money'],
  options: ExtractOptions = {}
): Promise<ExtractResult<Record<string, string[]>>> {
  const schema = Object.fromEntries(
    entityTypes.map(type => [type, 'array'])
  ) as Record<string, 'array'>;

  return extract(text, schema, options) as Promise<ExtractResult<Record<string, string[]>>>;
}

/**
 * Batch extract from multiple texts
 */
export async function extractBatch<T extends SimpleSchema>(
  texts: string[],
  schema: T,
  options: ExtractOptions = {}
): Promise<ExtractResult<ExtractedType<T>>[]> {
  return Promise.all(texts.map(text => extract(text, schema, options)));
}

// Type helper for extracted data
type ExtractedType<T extends SimpleSchema> = {
  [K in keyof T]: T[K] extends 'string'
    ? string | null
    : T[K] extends 'number'
    ? number | null
    : T[K] extends 'boolean'
    ? boolean | null
    : T[K] extends 'array'
    ? unknown[]
    : T[K] extends 'object'
    ? Record<string, unknown> | null
    : unknown;
};
