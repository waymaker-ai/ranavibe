/**
 * Structured Output Module
 * Schema validation, retry logic, and partial parsing for LLM outputs
 *
 * @example
 * ```typescript
 * import { createStructuredOutput, generateStructured } from '@rana/core';
 * import { z } from 'zod';
 *
 * // Define schema with Zod
 * const PersonSchema = z.object({
 *   name: z.string(),
 *   age: z.number().min(0).max(150),
 *   email: z.string().email().optional(),
 *   skills: z.array(z.string()),
 * });
 *
 * // Or with JSON Schema
 * const jsonSchema = {
 *   type: 'object',
 *   properties: {
 *     name: { type: 'string' },
 *     age: { type: 'number', minimum: 0 },
 *     skills: { type: 'array', items: { type: 'string' } },
 *   },
 *   required: ['name', 'age'],
 * };
 *
 * // Create generator
 * const structured = createStructuredOutput(rana.chat.bind(rana), {
 *   retry: { maxRetries: 3, strategy: 'guided' },
 *   allowPartial: true,
 * });
 *
 * // Generate with automatic validation and retry
 * const result = await structured.generate({
 *   schema: PersonSchema,
 *   messages: [
 *     { role: 'user', content: 'Create a profile for John, a 30yo developer' },
 *   ],
 * });
 *
 * console.log(result.data); // { name: "John", age: 30, skills: [...] }
 *
 * // Quick extraction
 * const person = await structured.extract<Person>(
 *   "John Smith is 30 years old and knows TypeScript and Python",
 *   PersonSchema
 * );
 *
 * // One-liner with global function
 * const data = await generateStructured(
 *   rana.chat.bind(rana),
 *   PersonSchema,
 *   [{ role: 'user', content: 'Create a person profile' }]
 * );
 * ```
 */

// Main classes
export {
  StructuredOutput,
  SchemaValidator,
  createStructuredOutput,
  createSchemaValidator,
  generateStructured,
  zodToJsonSchema,
  jsonSchemaToTypeScript,
} from './structured';

// Types
export type {
  // Schema types
  SchemaType,
  SchemaProperty,
  SchemaDefinition,

  // Validation types
  ValidationError,
  ValidationResult,
  PartialParseResult,

  // Format types
  OutputFormat,
  FormatOptions,

  // Extraction types
  ExtractionField,
  ExtractionSchema,

  // Retry types
  RetryStrategy,
  RetryConfig,
  RetryResult,

  // Configuration types
  StructuredOutputConfig,

  // Generation types
  GenerationRequest,
  GenerationResult,

  // Zod integration types
  ZodSchema,
  ZodToJsonSchemaOptions,
} from './types';
