/**
 * @waymakerai/aicofounder-schema-validator - Type definitions
 */

/**
 * JSON Schema type definitions (subset of JSON Schema Draft 2020-12)
 */
export interface JSONSchema {
  /** Schema type */
  type?: JSONSchemaType | JSONSchemaType[];

  /** Object properties */
  properties?: Record<string, JSONSchema>;

  /** Required property names */
  required?: string[];

  /** Array item schema */
  items?: JSONSchema;

  /** Enum values */
  enum?: unknown[];

  /** Constant value */
  const?: unknown;

  /** String pattern (regex) */
  pattern?: string;

  /** Minimum number value */
  minimum?: number;

  /** Maximum number value */
  maximum?: number;

  /** Exclusive minimum */
  exclusiveMinimum?: number;

  /** Exclusive maximum */
  exclusiveMaximum?: number;

  /** Minimum string length */
  minLength?: number;

  /** Maximum string length */
  maxLength?: number;

  /** Minimum array items */
  minItems?: number;

  /** Maximum array items */
  maxItems?: number;

  /** Unique array items */
  uniqueItems?: boolean;

  /** Additional properties allowed */
  additionalProperties?: boolean | JSONSchema;

  /** anyOf schemas (union type) */
  anyOf?: JSONSchema[];

  /** oneOf schemas (discriminated union) */
  oneOf?: JSONSchema[];

  /** allOf schemas (intersection) */
  allOf?: JSONSchema[];

  /** Not schema (negation) */
  not?: JSONSchema;

  /** Default value */
  default?: unknown;

  /** Description */
  description?: string;

  /** Title */
  title?: string;

  /** Format (e.g., "email", "uri", "date-time") */
  format?: string;

  /** Property names schema */
  propertyNames?: JSONSchema;

  /** Minimum properties count */
  minProperties?: number;

  /** Maximum properties count */
  maxProperties?: number;

  /** Schema reference */
  $ref?: string;

  /** Schema definitions */
  $defs?: Record<string, JSONSchema>;
}

/**
 * JSON Schema primitive types
 */
export type JSONSchemaType =
  | 'string'
  | 'number'
  | 'integer'
  | 'boolean'
  | 'object'
  | 'array'
  | 'null';

/**
 * Validation error details
 */
export interface ValidationError {
  /** JSON path to the error (e.g., ".user.name") */
  path: string;

  /** Error message */
  message: string;

  /** Expected value/type */
  expected?: string;

  /** Actual value/type */
  actual?: string;

  /** The schema rule that was violated */
  rule: ValidationRule;

  /** Severity of the error */
  severity: 'error' | 'warning';
}

/**
 * Types of validation rules
 */
export type ValidationRule =
  | 'type'
  | 'required'
  | 'enum'
  | 'const'
  | 'pattern'
  | 'minimum'
  | 'maximum'
  | 'exclusiveMinimum'
  | 'exclusiveMaximum'
  | 'minLength'
  | 'maxLength'
  | 'minItems'
  | 'maxItems'
  | 'uniqueItems'
  | 'additionalProperties'
  | 'format'
  | 'anyOf'
  | 'oneOf'
  | 'allOf'
  | 'not'
  | 'minProperties'
  | 'maxProperties'
  | 'parse_error';

/**
 * Result of JSON validation
 */
export interface ValidationResult {
  /** Whether the output is valid */
  valid: boolean;

  /** The parsed data (if valid JSON) */
  data?: unknown;

  /** Validation errors */
  errors: ValidationError[];

  /** Warnings (non-blocking issues) */
  warnings: ValidationError[];

  /** Whether JSON was extracted from mixed text */
  extracted: boolean;

  /** Whether JSON was repaired before validation */
  repaired: boolean;

  /** The raw JSON string (after extraction/repair) */
  rawJSON?: string;
}

/**
 * Configuration for the schema validator
 */
export interface SchemaValidatorConfig {
  /** Whether to attempt JSON extraction from mixed text (default: true) */
  extractFromText?: boolean;

  /** Whether to attempt JSON repair (default: true) */
  autoRepair?: boolean;

  /** Whether to coerce types when possible (default: false) */
  coerceTypes?: boolean;

  /** Whether to strip additional properties instead of erroring (default: false) */
  stripAdditional?: boolean;

  /** Whether to fill in defaults for missing optional properties (default: false) */
  useDefaults?: boolean;

  /** Maximum depth for nested validation (default: 50) */
  maxDepth?: number;

  /** Custom format validators */
  formats?: Record<string, (value: string) => boolean>;
}
