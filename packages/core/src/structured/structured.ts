/**
 * Structured Output Implementation
 * Schema validation, retry logic, and partial parsing for LLM outputs
 */

import { EventEmitter } from 'events';
import type { LLMProvider, Message, RanaChatRequest } from '../types';
import type {
  SchemaDefinition,
  SchemaProperty,
  ValidationError,
  ValidationResult,
  PartialParseResult,
  OutputFormat,
  FormatOptions,
  RetryConfig,
  RetryResult,
  StructuredOutputConfig,
  GenerationRequest,
  GenerationResult,
  ZodSchema,
  ZodToJsonSchemaOptions,
} from './types';

// ============================================================================
// Schema Utilities
// ============================================================================

/**
 * Convert Zod schema to JSON Schema
 */
export function zodToJsonSchema(
  zodSchema: ZodSchema,
  options?: ZodToJsonSchemaOptions
): SchemaDefinition {
  const typeName = zodSchema._def?.typeName;

  // Basic type mapping
  const typeMap: Record<string, string> = {
    ZodString: 'string',
    ZodNumber: 'number',
    ZodBoolean: 'boolean',
    ZodArray: 'array',
    ZodObject: 'object',
    ZodNull: 'null',
    ZodEnum: 'enum',
    ZodUnion: 'union',
    ZodOptional: 'optional',
    ZodNullable: 'nullable',
  };

  // Try to extract shape for objects
  if (zodSchema.shape) {
    const properties: Record<string, SchemaProperty> = {};
    const required: string[] = [];

    for (const [key, value] of Object.entries(zodSchema.shape)) {
      const zodField = value as any;
      const isOptional = zodField._def?.typeName === 'ZodOptional';
      const innerType = isOptional ? zodField._def?.innerType : zodField;

      properties[key] = {
        type: typeMap[innerType?._def?.typeName] as any || 'string',
        description: innerType?._def?.description,
      };

      if (!isOptional) {
        required.push(key);
      }
    }

    return {
      type: 'object',
      title: options?.name,
      description: options?.description,
      properties,
      required,
    };
  }

  // Default to object
  return {
    type: 'object',
    title: options?.name,
    description: options?.description,
  };
}

/**
 * Generate TypeScript interface from JSON Schema
 */
export function jsonSchemaToTypeScript(
  schema: SchemaDefinition,
  name: string = 'GeneratedType'
): string {
  const lines: string[] = [];

  function generateType(prop: SchemaProperty | SchemaDefinition, indent: number = 0): string {
    const pad = '  '.repeat(indent);

    switch (prop.type) {
      case 'string':
        if (prop.enum) {
          return prop.enum.map(v => `'${v}'`).join(' | ');
        }
        return 'string';
      case 'number':
        return 'number';
      case 'boolean':
        return 'boolean';
      case 'null':
        return 'null';
      case 'array':
        const itemType = prop.items ? generateType(prop.items, indent) : 'unknown';
        return `${itemType}[]`;
      case 'object':
        if (!prop.properties) return 'Record<string, unknown>';
        const props = Object.entries(prop.properties).map(([key, value]) => {
          const optional = !(schema.required?.includes(key) ?? true) ? '?' : '';
          return `${pad}  ${key}${optional}: ${generateType(value as SchemaProperty, indent + 1)};`;
        });
        return `{\n${props.join('\n')}\n${pad}}`;
      default:
        return 'unknown';
    }
  }

  if (schema.description) {
    lines.push(`/** ${schema.description} */`);
  }

  lines.push(`export interface ${name} ${generateType(schema)}`);

  return lines.join('\n');
}

// ============================================================================
// Validation Implementation
// ============================================================================

export class SchemaValidator {
  private customValidators: Record<string, (value: any) => boolean | string>;

  constructor(customValidators?: Record<string, (value: any) => boolean | string>) {
    this.customValidators = customValidators || {};
  }

  /**
   * Validate data against a schema
   */
  validate<T>(data: unknown, schema: SchemaDefinition): ValidationResult<T> {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    try {
      const parsed = typeof data === 'string' ? JSON.parse(data) : data;
      this.validateValue(parsed, schema, [], errors, warnings);

      return {
        success: errors.length === 0,
        data: errors.length === 0 ? (parsed as T) : undefined,
        errors: errors.length > 0 ? errors : undefined,
        warnings: warnings.length > 0 ? warnings : undefined,
        raw: typeof data === 'string' ? data : JSON.stringify(data),
        parsed,
      };
    } catch (error) {
      return {
        success: false,
        errors: [{
          path: [],
          message: error instanceof Error ? error.message : 'Parse error',
          expected: 'valid JSON',
          received: typeof data,
          code: 'PARSE_ERROR',
        }],
        raw: typeof data === 'string' ? data : String(data),
        parsed: null,
      };
    }
  }

  /**
   * Validate with Zod schema
   */
  validateWithZod<T>(data: unknown, zodSchema: ZodSchema<T>): ValidationResult<T> {
    try {
      const parsed = typeof data === 'string' ? JSON.parse(data) : data;
      const result = zodSchema.safeParse(parsed);

      if (result.success) {
        return {
          success: true,
          data: result.data,
          raw: typeof data === 'string' ? data : JSON.stringify(data),
          parsed,
        };
      }

      // Convert Zod errors to our format
      const errors: ValidationError[] = (result.error as any).issues?.map((issue: any) => ({
        path: issue.path,
        message: issue.message,
        expected: issue.expected || 'valid value',
        received: issue.received || 'invalid',
        code: issue.code,
      })) || [];

      return {
        success: false,
        errors,
        raw: typeof data === 'string' ? data : JSON.stringify(data),
        parsed,
      };
    } catch (error) {
      return {
        success: false,
        errors: [{
          path: [],
          message: error instanceof Error ? error.message : 'Parse error',
          expected: 'valid JSON',
          received: typeof data,
          code: 'PARSE_ERROR',
        }],
        raw: typeof data === 'string' ? data : String(data),
        parsed: null,
      };
    }
  }

  /**
   * Partial parse - extract what we can
   */
  partialParse<T>(data: unknown, schema: SchemaDefinition): PartialParseResult<T> {
    const result: Partial<T> = {};
    const failed: string[] = [];
    const errors: Record<string, ValidationError> = {};

    try {
      const parsed = typeof data === 'string' ? JSON.parse(data) : data;

      if (schema.properties && typeof parsed === 'object' && parsed !== null) {
        const totalFields = Object.keys(schema.properties).length;
        let successCount = 0;

        for (const [key, prop] of Object.entries(schema.properties)) {
          const value = (parsed as any)[key];
          const fieldErrors: ValidationError[] = [];

          this.validateValue(value, prop as SchemaDefinition, [key], fieldErrors, []);

          if (fieldErrors.length === 0) {
            (result as any)[key] = value;
            successCount++;
          } else {
            failed.push(key);
            errors[key] = fieldErrors[0];
          }
        }

        return {
          parsed: result,
          failed,
          progress: successCount / totalFields,
          errors,
          usable: successCount > totalFields / 2,
        };
      }

      return {
        parsed: parsed as Partial<T>,
        failed: [],
        progress: 1,
        errors: {},
        usable: true,
      };
    } catch {
      return {
        parsed: {},
        failed: Object.keys(schema.properties || {}),
        progress: 0,
        errors: {},
        usable: false,
      };
    }
  }

  private validateValue(
    value: any,
    schema: SchemaDefinition | SchemaProperty,
    path: string[],
    errors: ValidationError[],
    warnings: ValidationError[]
  ): void {
    const types = Array.isArray(schema.type) ? schema.type : [schema.type];

    // Check null
    if (value === null) {
      if (!types.includes('null')) {
        errors.push({
          path,
          message: 'Expected non-null value',
          expected: types.join(' | '),
          received: 'null',
          code: 'INVALID_TYPE',
        });
      }
      return;
    }

    // Check undefined / required
    if (value === undefined) {
      if ((schema as SchemaProperty).required !== false) {
        errors.push({
          path,
          message: 'Required field is missing',
          expected: types.join(' | '),
          received: 'undefined',
          code: 'REQUIRED',
        });
      }
      return;
    }

    // Check types
    const actualType = this.getType(value);
    if (!types.includes(actualType as any) && !types.includes('object')) {
      errors.push({
        path,
        message: `Expected ${types.join(' | ')}, got ${actualType}`,
        expected: types.join(' | '),
        received: actualType,
        code: 'INVALID_TYPE',
      });
      return;
    }

    // Type-specific validation
    switch (actualType) {
      case 'string':
        this.validateString(value, schema as SchemaProperty, path, errors);
        break;
      case 'number':
        this.validateNumber(value, schema as SchemaProperty, path, errors);
        break;
      case 'array':
        this.validateArray(value, schema as SchemaProperty, path, errors, warnings);
        break;
      case 'object':
        this.validateObject(value, schema, path, errors, warnings);
        break;
    }

    // Check enum
    if (schema.enum && !schema.enum.includes(value)) {
      errors.push({
        path,
        message: `Value must be one of: ${schema.enum.join(', ')}`,
        expected: schema.enum.join(' | '),
        received: String(value),
        code: 'INVALID_ENUM',
      });
    }
  }

  private validateString(
    value: string,
    schema: SchemaProperty,
    path: string[],
    errors: ValidationError[]
  ): void {
    if (schema.minLength && value.length < schema.minLength) {
      errors.push({
        path,
        message: `String must be at least ${schema.minLength} characters`,
        expected: `length >= ${schema.minLength}`,
        received: `length ${value.length}`,
        code: 'MIN_LENGTH',
      });
    }

    if (schema.maxLength && value.length > schema.maxLength) {
      errors.push({
        path,
        message: `String must be at most ${schema.maxLength} characters`,
        expected: `length <= ${schema.maxLength}`,
        received: `length ${value.length}`,
        code: 'MAX_LENGTH',
      });
    }

    if (schema.pattern && !new RegExp(schema.pattern).test(value)) {
      errors.push({
        path,
        message: `String must match pattern: ${schema.pattern}`,
        expected: `pattern ${schema.pattern}`,
        received: value,
        code: 'PATTERN',
      });
    }

    if (schema.format) {
      const formatPatterns: Record<string, RegExp> = {
        email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        url: /^https?:\/\/.+/,
        date: /^\d{4}-\d{2}-\d{2}$/,
        datetime: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/,
        uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      };

      if (formatPatterns[schema.format] && !formatPatterns[schema.format].test(value)) {
        errors.push({
          path,
          message: `String must be a valid ${schema.format}`,
          expected: schema.format,
          received: value,
          code: 'FORMAT',
        });
      }
    }
  }

  private validateNumber(
    value: number,
    schema: SchemaProperty,
    path: string[],
    errors: ValidationError[]
  ): void {
    if (schema.minimum !== undefined && value < schema.minimum) {
      errors.push({
        path,
        message: `Number must be at least ${schema.minimum}`,
        expected: `>= ${schema.minimum}`,
        received: String(value),
        code: 'MINIMUM',
      });
    }

    if (schema.maximum !== undefined && value > schema.maximum) {
      errors.push({
        path,
        message: `Number must be at most ${schema.maximum}`,
        expected: `<= ${schema.maximum}`,
        received: String(value),
        code: 'MAXIMUM',
      });
    }

    if (schema.multipleOf && value % schema.multipleOf !== 0) {
      errors.push({
        path,
        message: `Number must be a multiple of ${schema.multipleOf}`,
        expected: `multiple of ${schema.multipleOf}`,
        received: String(value),
        code: 'MULTIPLE_OF',
      });
    }
  }

  private validateArray(
    value: any[],
    schema: SchemaProperty,
    path: string[],
    errors: ValidationError[],
    warnings: ValidationError[]
  ): void {
    if (schema.minItems && value.length < schema.minItems) {
      errors.push({
        path,
        message: `Array must have at least ${schema.minItems} items`,
        expected: `length >= ${schema.minItems}`,
        received: `length ${value.length}`,
        code: 'MIN_ITEMS',
      });
    }

    if (schema.maxItems && value.length > schema.maxItems) {
      errors.push({
        path,
        message: `Array must have at most ${schema.maxItems} items`,
        expected: `length <= ${schema.maxItems}`,
        received: `length ${value.length}`,
        code: 'MAX_ITEMS',
      });
    }

    if (schema.uniqueItems && new Set(value.map((v: any) => JSON.stringify(v))).size !== value.length) {
      errors.push({
        path,
        message: 'Array items must be unique',
        expected: 'unique items',
        received: 'duplicate items',
        code: 'UNIQUE_ITEMS',
      });
    }

    // Validate items
    if (schema.items) {
      value.forEach((item, index) => {
        this.validateValue(item, schema.items!, [...path, String(index)], errors, warnings);
      });
    }
  }

  private validateObject(
    value: Record<string, any>,
    schema: SchemaDefinition | SchemaProperty,
    path: string[],
    errors: ValidationError[],
    warnings: ValidationError[]
  ): void {
    if (!schema.properties) return;

    // Check required fields
    const required = (schema as SchemaDefinition).required || [];
    for (const field of required) {
      if (!(field in value)) {
        errors.push({
          path: [...path, field],
          message: `Required field "${field}" is missing`,
          expected: 'present',
          received: 'missing',
          code: 'REQUIRED',
        });
      }
    }

    // Validate properties
    for (const [key, prop] of Object.entries(schema.properties)) {
      if (key in value) {
        this.validateValue(value[key], prop as SchemaDefinition, [...path, key], errors, warnings);
      }
    }

    // Check additional properties
    if (schema.additionalProperties === false) {
      const allowedKeys = Object.keys(schema.properties);
      for (const key of Object.keys(value)) {
        if (!allowedKeys.includes(key)) {
          warnings.push({
            path: [...path, key],
            message: `Unknown property "${key}"`,
            expected: 'known property',
            received: key,
            code: 'ADDITIONAL_PROPERTY',
          });
        }
      }
    }
  }

  private getType(value: any): string {
    if (value === null) return 'null';
    if (Array.isArray(value)) return 'array';
    return typeof value;
  }
}

// ============================================================================
// Structured Output Generator
// ============================================================================

export class StructuredOutput extends EventEmitter {
  private config: StructuredOutputConfig;
  private validator: SchemaValidator;
  private chatFn: (request: RanaChatRequest) => Promise<any>;

  constructor(
    chatFn: (request: RanaChatRequest) => Promise<any>,
    config?: Partial<StructuredOutputConfig>
  ) {
    super();
    this.chatFn = chatFn;
    this.config = this.normalizeConfig(config || {});
    this.validator = new SchemaValidator(this.config.customValidators);
  }

  private normalizeConfig(config: Partial<StructuredOutputConfig>): StructuredOutputConfig {
    return {
      defaultFormat: config.defaultFormat || 'json',
      retry: config.retry || {
        maxRetries: 3,
        strategy: 'guided',
        includeErrors: true,
        includePartial: true,
        retryDelay: 100,
        exponentialBackoff: true,
      },
      strict: config.strict ?? false,
      allowPartial: config.allowPartial ?? true,
      coerceTypes: config.coerceTypes ?? true,
      stripUnknown: config.stripUnknown ?? true,
      cacheSchemaPrompts: config.cacheSchemaPrompts ?? true,
      generateTypes: config.generateTypes ?? false,
      debug: config.debug ?? false,
      ...config,
    };
  }

  /**
   * Generate structured output with validation
   */
  async generate<T>(request: GenerationRequest<T>): Promise<GenerationResult<T>> {
    const startTime = Date.now();
    const schema = this.normalizeSchema(request.schema);
    const formatOptions = { ...this.getDefaultFormatOptions(), ...request.format };
    const retryConfig = { ...this.config.retry, ...request.retry };

    // Build prompt with schema instructions
    const messages = this.buildMessages(request.messages, schema, formatOptions);

    let lastResult: ValidationResult<T> | null = null;
    const history: RetryResult<T>['history'] = [];
    let totalCost = 0;

    for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
      // Make LLM request
      const response = await this.chatFn({
        messages: attempt === 0 ? messages : this.buildRetryMessages(
          messages,
          lastResult!,
          retryConfig,
          attempt
        ),
        provider: request.provider,
        model: request.model,
        temperature: request.temperature ?? 0.1, // Low temp for structured output
        max_tokens: request.maxTokens,
      });

      totalCost += response.cost?.total_cost || 0;

      // Extract JSON from response
      const extracted = this.extractJson(response.content);

      // Validate
      const result = this.isZodSchema(request.schema)
        ? this.validator.validateWithZod<T>(extracted, request.schema as ZodSchema<T>)
        : this.validator.validate<T>(extracted, schema);

      history.push({
        attempt,
        result,
        errors: result.errors || [],
      });

      if (result.success) {
        return {
          data: result.data!,
          validation: result,
          raw: response.content,
          cost: totalCost,
          latency: Date.now() - startTime,
          provider: response.provider,
          model: response.model,
          retries: attempt > 0 ? {
            result,
            attempts: attempt + 1,
            history,
            totalCost,
            totalLatency: Date.now() - startTime,
          } : undefined,
        };
      }

      lastResult = result;

      // Wait before retry
      if (attempt < retryConfig.maxRetries) {
        const delay = retryConfig.exponentialBackoff
          ? retryConfig.retryDelay * Math.pow(2, attempt)
          : retryConfig.retryDelay;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    // All retries failed
    // Try partial parse if allowed
    if (this.config.allowPartial && lastResult) {
      const partial = this.validator.partialParse<T>(lastResult.raw, schema);
      if (partial.usable) {
        return {
          data: partial.parsed as T,
          validation: {
            success: false,
            data: partial.parsed as T,
            errors: lastResult.errors,
            warnings: [{
              path: [],
              message: 'Result is partial, some fields may be missing',
              expected: 'complete object',
              received: `${Math.round(partial.progress * 100)}% complete`,
              code: 'PARTIAL_RESULT',
            }],
            raw: lastResult.raw,
            parsed: partial.parsed,
          },
          raw: lastResult.raw,
          cost: totalCost,
          latency: Date.now() - startTime,
          provider: 'anthropic', // Default
          model: 'claude-3-5-sonnet-20241022',
          retries: {
            result: lastResult,
            attempts: retryConfig.maxRetries + 1,
            history,
            totalCost,
            totalLatency: Date.now() - startTime,
          },
        };
      }
    }

    throw new Error(
      `Failed to generate valid structured output after ${retryConfig.maxRetries + 1} attempts. ` +
      `Last errors: ${lastResult?.errors?.map(e => e.message).join(', ')}`
    );
  }

  /**
   * Extract structured data from text
   */
  async extract<T>(
    text: string,
    schema: SchemaDefinition | ZodSchema<T>,
    options?: { prompt?: string; examples?: any[] }
  ): Promise<T> {
    const result = await this.generate<T>({
      schema,
      messages: [
        {
          role: 'system',
          content: options?.prompt || 'Extract the requested information from the text.',
        },
        {
          role: 'user',
          content: text,
        },
      ],
    });

    return result.data;
  }

  /**
   * Validate existing data
   */
  validate<T>(data: unknown, schema: SchemaDefinition | ZodSchema<T>): ValidationResult<T> {
    if (this.isZodSchema(schema)) {
      return this.validator.validateWithZod<T>(data, schema as ZodSchema<T>);
    }
    return this.validator.validate<T>(data, schema as SchemaDefinition);
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private normalizeSchema(schema: any): SchemaDefinition {
    if (this.isZodSchema(schema)) {
      return zodToJsonSchema(schema);
    }
    return schema as SchemaDefinition;
  }

  private isZodSchema(schema: any): schema is ZodSchema {
    return schema && typeof schema.safeParse === 'function';
  }

  private getDefaultFormatOptions(): FormatOptions {
    return {
      format: this.config.defaultFormat,
      pretty: true,
      indent: 2,
      includeSchema: true,
      includeExamples: true,
    };
  }

  private buildMessages(
    messages: Message[],
    schema: SchemaDefinition,
    options: FormatOptions
  ): Message[] {
    const schemaInstructions = this.generateSchemaInstructions(schema, options);

    // Find system message or create one
    const hasSystem = messages.some(m => m.role === 'system');

    if (hasSystem) {
      return messages.map(m => {
        if (m.role === 'system') {
          return {
            ...m,
            content: `${m.content}\n\n${schemaInstructions}`,
          };
        }
        return m;
      });
    }

    return [
      { role: 'system', content: schemaInstructions },
      ...messages,
    ];
  }

  private generateSchemaInstructions(
    schema: SchemaDefinition,
    options: FormatOptions
  ): string {
    const parts: string[] = [];

    parts.push('You must respond with valid JSON that matches this schema:');
    parts.push('');
    parts.push('```json');
    parts.push(JSON.stringify(schema, null, 2));
    parts.push('```');
    parts.push('');
    parts.push('Important:');
    parts.push('- Respond ONLY with the JSON object, no other text');
    parts.push('- Ensure all required fields are present');
    parts.push('- Use the exact field names and types specified');
    parts.push('- Do not include comments in the JSON');

    if (schema.required?.length) {
      parts.push(`- Required fields: ${schema.required.join(', ')}`);
    }

    return parts.join('\n');
  }

  private buildRetryMessages(
    originalMessages: Message[],
    lastResult: ValidationResult,
    config: RetryConfig,
    attempt: number
  ): Message[] {
    const errorFeedback: string[] = [];

    if (config.includeErrors && lastResult.errors) {
      errorFeedback.push('Your previous response had validation errors:');
      for (const error of lastResult.errors) {
        errorFeedback.push(`- ${error.path.join('.')}: ${error.message}`);
      }
    }

    if (config.includePartial && lastResult.parsed) {
      errorFeedback.push('');
      errorFeedback.push('Your response was:');
      errorFeedback.push('```json');
      errorFeedback.push(JSON.stringify(lastResult.parsed, null, 2));
      errorFeedback.push('```');
    }

    errorFeedback.push('');
    errorFeedback.push('Please fix these issues and respond with valid JSON.');

    return [
      ...originalMessages,
      {
        role: 'assistant',
        content: lastResult.raw,
      },
      {
        role: 'user',
        content: errorFeedback.join('\n'),
      },
    ];
  }

  private extractJson(text: string): string {
    // Try to extract JSON from markdown code blocks
    const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (codeBlockMatch) {
      return codeBlockMatch[1].trim();
    }

    // Try to find JSON object/array
    const jsonMatch = text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    if (jsonMatch) {
      return jsonMatch[1].trim();
    }

    // Return as-is
    return text.trim();
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

let globalStructuredOutput: StructuredOutput | null = null;

/**
 * Create a structured output generator
 */
export function createStructuredOutput(
  chatFn: (request: RanaChatRequest) => Promise<any>,
  config?: Partial<StructuredOutputConfig>
): StructuredOutput {
  return new StructuredOutput(chatFn, config);
}

/**
 * Create a schema validator
 */
export function createSchemaValidator(
  customValidators?: Record<string, (value: any) => boolean | string>
): SchemaValidator {
  return new SchemaValidator(customValidators);
}

/**
 * Quick structured generation
 */
export async function generateStructured<T>(
  chatFn: (request: RanaChatRequest) => Promise<any>,
  schema: SchemaDefinition | ZodSchema<T>,
  messages: Message[],
  options?: Partial<GenerationRequest<T>>
): Promise<T> {
  const generator = new StructuredOutput(chatFn);
  const result = await generator.generate<T>({
    schema,
    messages,
    ...options,
  });
  return result.data;
}
