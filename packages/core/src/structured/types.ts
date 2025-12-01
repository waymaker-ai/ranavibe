/**
 * Structured Output Types
 * Schema validation, retry logic, and partial parsing for LLM outputs
 */

import type { LLMProvider, Message } from '../types';

// ============================================================================
// Schema Types
// ============================================================================

export type SchemaType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'array'
  | 'object'
  | 'null'
  | 'enum'
  | 'union';

export interface SchemaProperty {
  type: SchemaType | SchemaType[];
  description?: string;
  required?: boolean;
  default?: any;
  // String constraints
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  format?: 'email' | 'url' | 'date' | 'datetime' | 'uuid';
  // Number constraints
  minimum?: number;
  maximum?: number;
  multipleOf?: number;
  // Array constraints
  items?: SchemaDefinition;
  minItems?: number;
  maxItems?: number;
  uniqueItems?: boolean;
  // Object constraints
  properties?: Record<string, SchemaProperty>;
  additionalProperties?: boolean | SchemaProperty;
  // Enum
  enum?: any[];
  // Union
  oneOf?: SchemaDefinition[];
  anyOf?: SchemaDefinition[];
}

export interface SchemaDefinition {
  type: SchemaType | SchemaType[];
  title?: string;
  description?: string;
  properties?: Record<string, SchemaProperty>;
  required?: string[];
  additionalProperties?: boolean;
  items?: SchemaDefinition;
  enum?: any[];
  oneOf?: SchemaDefinition[];
  anyOf?: SchemaDefinition[];
  $ref?: string;
  definitions?: Record<string, SchemaDefinition>;
}

// ============================================================================
// Validation Types
// ============================================================================

export interface ValidationError {
  path: string[];
  message: string;
  expected: string;
  received: string;
  code: string;
}

export interface ValidationResult<T = any> {
  success: boolean;
  data?: T;
  errors?: ValidationError[];
  warnings?: ValidationError[];
  raw: string;
  parsed: any;
}

export interface PartialParseResult<T = any> {
  /** Successfully parsed fields */
  parsed: Partial<T>;
  /** Fields that failed to parse */
  failed: string[];
  /** Parse progress (0-1) */
  progress: number;
  /** Error details per field */
  errors: Record<string, ValidationError>;
  /** Whether result is usable */
  usable: boolean;
}

// ============================================================================
// Output Format Types
// ============================================================================

export type OutputFormat = 'json' | 'yaml' | 'xml' | 'markdown' | 'csv';

export interface FormatOptions {
  /** Output format */
  format: OutputFormat;
  /** Pretty print */
  pretty?: boolean;
  /** Indent size */
  indent?: number;
  /** Include schema in prompt */
  includeSchema?: boolean;
  /** Include examples in prompt */
  includeExamples?: boolean;
  /** Custom format instructions */
  formatInstructions?: string;
}

// ============================================================================
// Extraction Types
// ============================================================================

export interface ExtractionField<T = any> {
  name: string;
  type: SchemaType;
  description: string;
  required?: boolean;
  default?: T;
  examples?: T[];
  transform?: (value: any) => T;
  validate?: (value: T) => boolean | string;
}

export interface ExtractionSchema {
  name: string;
  description?: string;
  fields: ExtractionField[];
  examples?: any[];
}

// ============================================================================
// Retry Types
// ============================================================================

export type RetryStrategy = 'simple' | 'guided' | 'incremental' | 'fallback';

export interface RetryConfig {
  /** Maximum retry attempts */
  maxRetries: number;
  /** Retry strategy */
  strategy: RetryStrategy;
  /** Include error feedback in retry prompt */
  includeErrors: boolean;
  /** Include partial result in retry prompt */
  includePartial: boolean;
  /** Delay between retries (ms) */
  retryDelay: number;
  /** Exponential backoff */
  exponentialBackoff: boolean;
  /** Fallback schema (simplified) */
  fallbackSchema?: SchemaDefinition;
  /** Custom retry prompt generator */
  retryPromptGenerator?: (
    originalPrompt: string,
    errors: ValidationError[],
    attempt: number
  ) => string;
}

export interface RetryResult<T = any> {
  /** Final result */
  result: ValidationResult<T>;
  /** Number of attempts */
  attempts: number;
  /** Retry history */
  history: Array<{
    attempt: number;
    result: ValidationResult<T>;
    errors: ValidationError[];
  }>;
  /** Total cost */
  totalCost: number;
  /** Total latency */
  totalLatency: number;
}

// ============================================================================
// Structured Output Configuration
// ============================================================================

export interface StructuredOutputConfig {
  /** Default output format */
  defaultFormat: OutputFormat;
  /** Default retry config */
  retry: RetryConfig;
  /** Strict mode (fail on any error) */
  strict: boolean;
  /** Allow partial results */
  allowPartial: boolean;
  /** Auto-coerce types */
  coerceTypes: boolean;
  /** Strip unknown properties */
  stripUnknown: boolean;
  /** Cache schema prompts */
  cacheSchemaPrompts: boolean;
  /** Generate TypeScript types */
  generateTypes: boolean;
  /** Custom validators */
  customValidators?: Record<string, (value: any) => boolean | string>;
  /** Debug mode */
  debug: boolean;
}

// ============================================================================
// Generation Types
// ============================================================================

export interface GenerationRequest<T = any> {
  /** Schema to validate against */
  schema: SchemaDefinition | any; // Can be Zod schema
  /** Messages for LLM */
  messages: Message[];
  /** Provider override */
  provider?: LLMProvider;
  /** Model override */
  model?: string;
  /** Format options */
  format?: Partial<FormatOptions>;
  /** Retry options */
  retry?: Partial<RetryConfig>;
  /** Temperature override */
  temperature?: number;
  /** Max tokens override */
  maxTokens?: number;
  /** Additional context */
  context?: Record<string, any>;
}

export interface GenerationResult<T = any> {
  /** Parsed and validated data */
  data: T;
  /** Validation result */
  validation: ValidationResult<T>;
  /** Raw LLM response */
  raw: string;
  /** Cost */
  cost: number;
  /** Latency */
  latency: number;
  /** Provider used */
  provider: LLMProvider;
  /** Model used */
  model: string;
  /** Retry info */
  retries?: RetryResult<T>;
}

// ============================================================================
// Zod Integration Types
// ============================================================================

export interface ZodSchema<T = any> {
  parse: (data: unknown) => T;
  safeParse: (data: unknown) => { success: true; data: T } | { success: false; error: any };
  _def?: { typeName?: string };
  shape?: Record<string, any>;
}

export interface ZodToJsonSchemaOptions {
  name?: string;
  description?: string;
  errorMessages?: boolean;
}
