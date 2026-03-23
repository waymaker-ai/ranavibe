/**
 * @waymakerai/aicofounder-schema-validator - Structured Output Validation
 *
 * Validates LLM JSON outputs against schemas, extracts JSON from mixed text,
 * repairs malformed JSON, and generates retry prompts.
 */

import type {
  JSONSchema,
  JSONSchemaType,
  ValidationError,
  ValidationRule,
  ValidationResult,
  SchemaValidatorConfig,
} from './types';

// Re-export types
export type {
  JSONSchema,
  JSONSchemaType,
  ValidationError,
  ValidationRule,
  ValidationResult,
  SchemaValidatorConfig,
} from './types';

// ---------------------------------------------------------------------------
// Built-in format validators
// ---------------------------------------------------------------------------

const BUILT_IN_FORMATS: Record<string, (value: string) => boolean> = {
  email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
  uri: (v) => /^https?:\/\/[^\s]+$/.test(v),
  'date-time': (v) => !isNaN(Date.parse(v)) && /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}/.test(v),
  date: (v) => /^\d{4}-\d{2}-\d{2}$/.test(v) && !isNaN(Date.parse(v)),
  time: (v) => /^\d{2}:\d{2}(:\d{2})?([+-]\d{2}:?\d{2}|Z)?$/.test(v),
  uuid: (v) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v),
  ipv4: (v) => {
    const parts = v.split('.');
    return parts.length === 4 && parts.every(p => {
      const n = parseInt(p, 10);
      return n >= 0 && n <= 255 && String(n) === p;
    });
  },
  ipv6: (v) => /^([0-9a-f]{1,4}:){7}[0-9a-f]{1,4}$/i.test(v),
  hostname: (v) => /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z]{2,})+$/.test(v),
};

// ---------------------------------------------------------------------------
// JSON extraction
// ---------------------------------------------------------------------------

/**
 * Extract JSON from mixed text/JSON output
 */
export function extractJSON(text: string): object | null {
  if (!text || typeof text !== 'string') return null;

  const trimmed = text.trim();

  // Try direct parse first
  try {
    const parsed = JSON.parse(trimmed);
    if (typeof parsed === 'object' && parsed !== null) return parsed;
  } catch {
    // Continue to extraction
  }

  // Try extracting from markdown code blocks
  const codeBlockPatterns = [
    /```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/g,
    /`([\s\S]*?)`/g,
  ];

  for (const pattern of codeBlockPatterns) {
    let match: RegExpExecArray | null;
    const regex = new RegExp(pattern.source, pattern.flags);
    while ((match = regex.exec(text)) !== null) {
      try {
        const parsed = JSON.parse(match[1].trim());
        if (typeof parsed === 'object' && parsed !== null) return parsed;
      } catch {
        // Try next match
      }
    }
  }

  // Try to find JSON-like structure in the text (object or array)
  const jsonStart = findJSONBoundary(trimmed);
  if (jsonStart !== null) {
    const candidate = trimmed.slice(jsonStart.start, jsonStart.end + 1);
    try {
      const parsed = JSON.parse(candidate);
      if (typeof parsed === 'object' && parsed !== null) return parsed;
    } catch {
      // Try repair
      try {
        const repaired = repairJSON(candidate);
        const parsed = JSON.parse(repaired);
        if (typeof parsed === 'object' && parsed !== null) return parsed;
      } catch {
        // Give up on this candidate
      }
    }
  }

  return null;
}

/**
 * Find the boundaries of a JSON object or array in text
 */
function findJSONBoundary(text: string): { start: number; end: number } | null {
  // Find the first { or [
  let start = -1;
  let openChar = '';
  let closeChar = '';

  for (let i = 0; i < text.length; i++) {
    if (text[i] === '{') {
      start = i;
      openChar = '{';
      closeChar = '}';
      break;
    }
    if (text[i] === '[') {
      start = i;
      openChar = '[';
      closeChar = ']';
      break;
    }
  }

  if (start === -1) return null;

  // Find matching close bracket
  let depth = 0;
  let inString = false;
  let escape = false;

  for (let i = start; i < text.length; i++) {
    const ch = text[i];

    if (escape) {
      escape = false;
      continue;
    }

    if (ch === '\\') {
      escape = true;
      continue;
    }

    if (ch === '"') {
      inString = !inString;
      continue;
    }

    if (inString) continue;

    if (ch === openChar) depth++;
    if (ch === closeChar) {
      depth--;
      if (depth === 0) {
        return { start, end: i };
      }
    }
  }

  // If we didn't find the close, return the rest of the text
  // (it might be truncated)
  return { start, end: text.length - 1 };
}

// ---------------------------------------------------------------------------
// JSON repair
// ---------------------------------------------------------------------------

/**
 * Attempt to repair malformed JSON
 */
export function repairJSON(text: string): string {
  if (!text || typeof text !== 'string') return text;

  let repaired = text.trim();

  // Remove trailing commas before } or ]
  repaired = repaired.replace(/,\s*([}\]])/g, '$1');

  // Replace single quotes with double quotes (outside of double-quoted strings)
  repaired = replaceSingleQuotes(repaired);

  // Add quotes to unquoted keys
  repaired = repaired.replace(
    /(?<=^|[{,\n])\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/gm,
    '"$1":'
  );

  // Fix Python-style True/False/None
  repaired = repaired.replace(/\bTrue\b/g, 'true');
  repaired = repaired.replace(/\bFalse\b/g, 'false');
  repaired = repaired.replace(/\bNone\b/g, 'null');

  // Fix undefined
  repaired = repaired.replace(/\bundefined\b/g, 'null');

  // Fix NaN and Infinity
  repaired = repaired.replace(/\bNaN\b/g, 'null');
  repaired = repaired.replace(/-Infinity\b/g, 'null');
  repaired = repaired.replace(/\bInfinity\b/g, 'null');

  // Fix missing commas between properties (} followed by " or { followed by ")
  repaired = repaired.replace(/}(\s*"){/g, '},$1{');
  repaired = repaired.replace(/"(\s+)"/g, (match, space) => {
    // Only add comma if it looks like it's between values
    if (/\n/.test(space)) return match;
    return match;
  });

  // Handle truncated JSON: close unclosed brackets/braces
  repaired = closeTruncatedJSON(repaired);

  return repaired;
}

/**
 * Replace single quotes with double quotes, being careful about strings
 */
function replaceSingleQuotes(text: string): string {
  const chars: string[] = [];
  let inDouble = false;
  let inSingle = false;
  let escape = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];

    if (escape) {
      chars.push(ch);
      escape = false;
      continue;
    }

    if (ch === '\\') {
      chars.push(ch);
      escape = true;
      continue;
    }

    if (ch === '"' && !inSingle) {
      inDouble = !inDouble;
      chars.push(ch);
      continue;
    }

    if (ch === "'" && !inDouble) {
      // Check if this looks like it's being used as a JSON string delimiter
      if (!inSingle) {
        // Starting single-quoted string
        inSingle = true;
        chars.push('"');
        continue;
      } else {
        // Ending single-quoted string
        inSingle = false;
        chars.push('"');
        continue;
      }
    }

    // Inside a single-quoted string, escape any double quotes
    if (inSingle && ch === '"') {
      chars.push('\\"');
      continue;
    }

    chars.push(ch);
  }

  return chars.join('');
}

/**
 * Close unclosed brackets/braces in truncated JSON
 */
function closeTruncatedJSON(text: string): string {
  const stack: string[] = [];
  let inString = false;
  let escape = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];

    if (escape) {
      escape = false;
      continue;
    }

    if (ch === '\\') {
      escape = true;
      continue;
    }

    if (ch === '"') {
      inString = !inString;
      continue;
    }

    if (inString) continue;

    if (ch === '{') stack.push('}');
    else if (ch === '[') stack.push(']');
    else if (ch === '}' || ch === ']') {
      if (stack.length > 0 && stack[stack.length - 1] === ch) {
        stack.pop();
      }
    }
  }

  // If we're in a string, close it
  if (inString) {
    text += '"';
  }

  // Remove any trailing comma before we close
  text = text.replace(/,\s*$/, '');

  // Close remaining open brackets/braces
  while (stack.length > 0) {
    text += stack.pop();
  }

  return text;
}

// ---------------------------------------------------------------------------
// Schema validation
// ---------------------------------------------------------------------------

/**
 * Validate a value against a JSON Schema
 */
function validateValue(
  value: unknown,
  schema: JSONSchema,
  path: string,
  errors: ValidationError[],
  warnings: ValidationError[],
  config: Required<SchemaValidatorConfig>,
  depth: number
): unknown {
  if (depth > config.maxDepth) {
    errors.push({
      path,
      message: `Maximum validation depth ${config.maxDepth} exceeded`,
      rule: 'type',
      severity: 'error',
    });
    return value;
  }

  // Handle $ref (basic support)
  if (schema.$ref) {
    // Only support internal references like #/$defs/Name
    const refMatch = schema.$ref.match(/^#\/\$defs\/(.+)$/);
    if (refMatch && schema.$defs?.[refMatch[1]]) {
      return validateValue(value, schema.$defs[refMatch[1]], path, errors, warnings, config, depth);
    }
    warnings.push({
      path,
      message: `Unresolved $ref: ${schema.$ref}`,
      rule: 'type',
      severity: 'warning',
    });
    return value;
  }

  // Handle allOf
  if (schema.allOf) {
    for (const subSchema of schema.allOf) {
      value = validateValue(value, subSchema, path, errors, warnings, config, depth + 1);
    }
    return value;
  }

  // Handle anyOf
  if (schema.anyOf) {
    const anyOfErrors: ValidationError[][] = [];
    let matched = false;

    for (const subSchema of schema.anyOf) {
      const subErrors: ValidationError[] = [];
      const subWarnings: ValidationError[] = [];
      validateValue(value, subSchema, path, subErrors, subWarnings, config, depth + 1);
      if (subErrors.length === 0) {
        matched = true;
        break;
      }
      anyOfErrors.push(subErrors);
    }

    if (!matched) {
      errors.push({
        path,
        message: `Value does not match any of the schemas in anyOf`,
        expected: schema.anyOf.map(s => s.type ?? 'schema').join(' | '),
        actual: getType(value),
        rule: 'anyOf',
        severity: 'error',
      });
    }
    return value;
  }

  // Handle oneOf
  if (schema.oneOf) {
    let matchCount = 0;

    for (const subSchema of schema.oneOf) {
      const subErrors: ValidationError[] = [];
      const subWarnings: ValidationError[] = [];
      validateValue(value, subSchema, path, subErrors, subWarnings, config, depth + 1);
      if (subErrors.length === 0) {
        matchCount++;
      }
    }

    if (matchCount !== 1) {
      errors.push({
        path,
        message: matchCount === 0
          ? 'Value does not match any of the schemas in oneOf'
          : `Value matches ${matchCount} schemas in oneOf, expected exactly 1`,
        rule: 'oneOf',
        severity: 'error',
      });
    }
    return value;
  }

  // Handle not
  if (schema.not) {
    const subErrors: ValidationError[] = [];
    const subWarnings: ValidationError[] = [];
    validateValue(value, schema.not, path, subErrors, subWarnings, config, depth + 1);
    if (subErrors.length === 0) {
      errors.push({
        path,
        message: 'Value should not match the schema in "not"',
        rule: 'not',
        severity: 'error',
      });
    }
    return value;
  }

  // Handle const
  if (schema.const !== undefined) {
    if (!deepEqual(value, schema.const)) {
      errors.push({
        path,
        message: `Value must be ${JSON.stringify(schema.const)}`,
        expected: JSON.stringify(schema.const),
        actual: JSON.stringify(value),
        rule: 'const',
        severity: 'error',
      });
    }
    return value;
  }

  // Handle null with default
  if (value === null || value === undefined) {
    if (schema.default !== undefined && config.useDefaults) {
      return schema.default;
    }

    const types = Array.isArray(schema.type) ? schema.type : (schema.type ? [schema.type] : []);
    if (types.includes('null')) {
      return value;
    }

    if (value === undefined && schema.default !== undefined && config.useDefaults) {
      return schema.default;
    }

    // null is OK if no type restriction
    if (types.length === 0) return value;

    errors.push({
      path,
      message: `Expected ${types.join(' | ')} but got ${value === null ? 'null' : 'undefined'}`,
      expected: types.join(' | '),
      actual: value === null ? 'null' : 'undefined',
      rule: 'type',
      severity: 'error',
    });
    return value;
  }

  // Type checking
  const types = Array.isArray(schema.type) ? schema.type : (schema.type ? [schema.type] : []);
  const actualType = getType(value);

  if (types.length > 0) {
    let typeMatch = false;
    for (const t of types) {
      if (matchesType(value, t, config.coerceTypes)) {
        typeMatch = true;
        break;
      }
    }

    if (!typeMatch) {
      if (config.coerceTypes) {
        const coerced = coerceValue(value, types[0]);
        if (coerced !== undefined) {
          value = coerced;
        } else {
          errors.push({
            path,
            message: `Expected ${types.join(' | ')} but got ${actualType}`,
            expected: types.join(' | '),
            actual: actualType,
            rule: 'type',
            severity: 'error',
          });
          return value;
        }
      } else {
        errors.push({
          path,
          message: `Expected ${types.join(' | ')} but got ${actualType}`,
          expected: types.join(' | '),
          actual: actualType,
          rule: 'type',
          severity: 'error',
        });
        return value;
      }
    }
  }

  // Enum check
  if (schema.enum) {
    if (!schema.enum.some(e => deepEqual(value, e))) {
      errors.push({
        path,
        message: `Value must be one of: ${schema.enum.map(e => JSON.stringify(e)).join(', ')}`,
        expected: schema.enum.map(e => JSON.stringify(e)).join(' | '),
        actual: JSON.stringify(value),
        rule: 'enum',
        severity: 'error',
      });
    }
  }

  // String checks
  if (typeof value === 'string') {
    if (schema.minLength !== undefined && value.length < schema.minLength) {
      errors.push({
        path,
        message: `String length ${value.length} is less than minimum ${schema.minLength}`,
        expected: `>= ${schema.minLength} chars`,
        actual: `${value.length} chars`,
        rule: 'minLength',
        severity: 'error',
      });
    }
    if (schema.maxLength !== undefined && value.length > schema.maxLength) {
      errors.push({
        path,
        message: `String length ${value.length} exceeds maximum ${schema.maxLength}`,
        expected: `<= ${schema.maxLength} chars`,
        actual: `${value.length} chars`,
        rule: 'maxLength',
        severity: 'error',
      });
    }
    if (schema.pattern) {
      const regex = new RegExp(schema.pattern);
      if (!regex.test(value)) {
        errors.push({
          path,
          message: `String does not match pattern "${schema.pattern}"`,
          expected: `/${schema.pattern}/`,
          actual: JSON.stringify(value),
          rule: 'pattern',
          severity: 'error',
        });
      }
    }
    if (schema.format) {
      const formatValidator = config.formats[schema.format] ?? BUILT_IN_FORMATS[schema.format];
      if (formatValidator && !formatValidator(value)) {
        warnings.push({
          path,
          message: `String does not match format "${schema.format}"`,
          expected: schema.format,
          actual: JSON.stringify(value),
          rule: 'format',
          severity: 'warning',
        });
      }
    }
  }

  // Number checks
  if (typeof value === 'number') {
    if (schema.minimum !== undefined && value < schema.minimum) {
      errors.push({
        path,
        message: `Value ${value} is less than minimum ${schema.minimum}`,
        expected: `>= ${schema.minimum}`,
        actual: String(value),
        rule: 'minimum',
        severity: 'error',
      });
    }
    if (schema.maximum !== undefined && value > schema.maximum) {
      errors.push({
        path,
        message: `Value ${value} exceeds maximum ${schema.maximum}`,
        expected: `<= ${schema.maximum}`,
        actual: String(value),
        rule: 'maximum',
        severity: 'error',
      });
    }
    if (schema.exclusiveMinimum !== undefined && value <= schema.exclusiveMinimum) {
      errors.push({
        path,
        message: `Value ${value} must be greater than ${schema.exclusiveMinimum}`,
        expected: `> ${schema.exclusiveMinimum}`,
        actual: String(value),
        rule: 'exclusiveMinimum',
        severity: 'error',
      });
    }
    if (schema.exclusiveMaximum !== undefined && value >= schema.exclusiveMaximum) {
      errors.push({
        path,
        message: `Value ${value} must be less than ${schema.exclusiveMaximum}`,
        expected: `< ${schema.exclusiveMaximum}`,
        actual: String(value),
        rule: 'exclusiveMaximum',
        severity: 'error',
      });
    }
    if (types.includes('integer') && !Number.isInteger(value)) {
      errors.push({
        path,
        message: `Expected integer but got float ${value}`,
        expected: 'integer',
        actual: String(value),
        rule: 'type',
        severity: 'error',
      });
    }
  }

  // Array checks
  if (Array.isArray(value)) {
    if (schema.minItems !== undefined && value.length < schema.minItems) {
      errors.push({
        path,
        message: `Array has ${value.length} items, minimum is ${schema.minItems}`,
        expected: `>= ${schema.minItems} items`,
        actual: `${value.length} items`,
        rule: 'minItems',
        severity: 'error',
      });
    }
    if (schema.maxItems !== undefined && value.length > schema.maxItems) {
      errors.push({
        path,
        message: `Array has ${value.length} items, maximum is ${schema.maxItems}`,
        expected: `<= ${schema.maxItems} items`,
        actual: `${value.length} items`,
        rule: 'maxItems',
        severity: 'error',
      });
    }
    if (schema.uniqueItems) {
      const serialized = value.map(v => JSON.stringify(v));
      const unique = new Set(serialized);
      if (unique.size !== serialized.length) {
        errors.push({
          path,
          message: 'Array items must be unique',
          rule: 'uniqueItems',
          severity: 'error',
        });
      }
    }
    if (schema.items) {
      for (let i = 0; i < value.length; i++) {
        value[i] = validateValue(
          value[i],
          schema.items,
          `${path}[${i}]`,
          errors,
          warnings,
          config,
          depth + 1
        );
      }
    }
  }

  // Object checks
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    const obj = value as Record<string, unknown>;
    const keys = Object.keys(obj);

    // Required properties
    if (schema.required) {
      for (const required of schema.required) {
        if (!(required in obj)) {
          if (config.useDefaults && schema.properties?.[required]?.default !== undefined) {
            obj[required] = schema.properties[required].default;
          } else {
            errors.push({
              path: `${path}.${required}`,
              message: `Required property "${required}" is missing`,
              expected: 'present',
              actual: 'missing',
              rule: 'required',
              severity: 'error',
            });
          }
        }
      }
    }

    // Property validation
    if (schema.properties) {
      for (const [key, propSchema] of Object.entries(schema.properties)) {
        if (key in obj) {
          obj[key] = validateValue(
            obj[key],
            propSchema,
            `${path}.${key}`,
            errors,
            warnings,
            config,
            depth + 1
          );
        } else if (config.useDefaults && propSchema.default !== undefined) {
          obj[key] = propSchema.default;
        }
      }
    }

    // Additional properties
    if (schema.additionalProperties !== undefined) {
      const definedKeys = new Set(Object.keys(schema.properties ?? {}));
      const extraKeys = keys.filter(k => !definedKeys.has(k));

      if (schema.additionalProperties === false && extraKeys.length > 0) {
        if (config.stripAdditional) {
          for (const key of extraKeys) {
            delete obj[key];
          }
        } else {
          for (const key of extraKeys) {
            errors.push({
              path: `${path}.${key}`,
              message: `Additional property "${key}" is not allowed`,
              rule: 'additionalProperties',
              severity: 'error',
            });
          }
        }
      } else if (typeof schema.additionalProperties === 'object') {
        for (const key of extraKeys) {
          obj[key] = validateValue(
            obj[key],
            schema.additionalProperties,
            `${path}.${key}`,
            errors,
            warnings,
            config,
            depth + 1
          );
        }
      }
    }

    // Min/max properties
    if (schema.minProperties !== undefined && keys.length < schema.minProperties) {
      errors.push({
        path,
        message: `Object has ${keys.length} properties, minimum is ${schema.minProperties}`,
        expected: `>= ${schema.minProperties} properties`,
        actual: `${keys.length} properties`,
        rule: 'minProperties',
        severity: 'error',
      });
    }
    if (schema.maxProperties !== undefined && keys.length > schema.maxProperties) {
      errors.push({
        path,
        message: `Object has ${keys.length} properties, maximum is ${schema.maxProperties}`,
        expected: `<= ${schema.maxProperties} properties`,
        actual: `${keys.length} properties`,
        rule: 'maxProperties',
        severity: 'error',
      });
    }
  }

  return value;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getType(value: unknown): string {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (Array.isArray(value)) return 'array';
  return typeof value;
}

function matchesType(value: unknown, type: JSONSchemaType, coerce: boolean): boolean {
  switch (type) {
    case 'string': return typeof value === 'string';
    case 'number': return typeof value === 'number' && !isNaN(value);
    case 'integer': return typeof value === 'number' && Number.isInteger(value);
    case 'boolean': return typeof value === 'boolean';
    case 'object': return typeof value === 'object' && value !== null && !Array.isArray(value);
    case 'array': return Array.isArray(value);
    case 'null': return value === null;
    default: return false;
  }
}

function coerceValue(value: unknown, targetType: JSONSchemaType): unknown {
  switch (targetType) {
    case 'string':
      return String(value);
    case 'number': {
      const n = Number(value);
      return isNaN(n) ? undefined : n;
    }
    case 'integer': {
      const n = parseInt(String(value), 10);
      return isNaN(n) ? undefined : n;
    }
    case 'boolean':
      if (value === 'true' || value === 1) return true;
      if (value === 'false' || value === 0) return false;
      return undefined;
    default:
      return undefined;
  }
}

function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a === null || b === null) return false;
  if (typeof a !== typeof b) return false;

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((item, i) => deepEqual(item, b[i]));
  }

  if (typeof a === 'object' && typeof b === 'object') {
    const keysA = Object.keys(a as Record<string, unknown>);
    const keysB = Object.keys(b as Record<string, unknown>);
    if (keysA.length !== keysB.length) return false;
    return keysA.every(key =>
      deepEqual(
        (a as Record<string, unknown>)[key],
        (b as Record<string, unknown>)[key]
      )
    );
  }

  return false;
}

// ---------------------------------------------------------------------------
// Retry prompt generation
// ---------------------------------------------------------------------------

/**
 * Generate a retry prompt telling the LLM what was wrong with its output
 */
export function generateRetryPrompt(
  output: string,
  schema: JSONSchema,
  errors: ValidationError[]
): string {
  const parts: string[] = [];

  parts.push('Your previous response had the following issues:\n');

  // Group errors by type
  const parseErrors = errors.filter(e => e.rule === 'parse_error');
  const typeErrors = errors.filter(e => e.rule === 'type');
  const requiredErrors = errors.filter(e => e.rule === 'required');
  const constraintErrors = errors.filter(e =>
    !['parse_error', 'type', 'required'].includes(e.rule)
  );

  if (parseErrors.length > 0) {
    parts.push('**JSON Parse Error:**');
    parts.push('Your response was not valid JSON. Please ensure you output valid JSON only, with no surrounding text or markdown.');
    parts.push('');
  }

  if (typeErrors.length > 0) {
    parts.push('**Type Errors:**');
    for (const err of typeErrors) {
      parts.push(`- At \`${err.path}\`: ${err.message}`);
    }
    parts.push('');
  }

  if (requiredErrors.length > 0) {
    parts.push('**Missing Required Fields:**');
    for (const err of requiredErrors) {
      parts.push(`- ${err.message} at \`${err.path}\``);
    }
    parts.push('');
  }

  if (constraintErrors.length > 0) {
    parts.push('**Constraint Violations:**');
    for (const err of constraintErrors) {
      parts.push(`- At \`${err.path}\`: ${err.message}`);
    }
    parts.push('');
  }

  parts.push('Please fix these issues and provide a corrected JSON response that matches this schema:');
  parts.push('```json');
  parts.push(JSON.stringify(schema, null, 2));
  parts.push('```');

  return parts.join('\n');
}

// ---------------------------------------------------------------------------
// SchemaValidator class
// ---------------------------------------------------------------------------

export class SchemaValidator {
  private config: Required<SchemaValidatorConfig>;

  constructor(config?: SchemaValidatorConfig) {
    this.config = {
      extractFromText: config?.extractFromText ?? true,
      autoRepair: config?.autoRepair ?? true,
      coerceTypes: config?.coerceTypes ?? false,
      stripAdditional: config?.stripAdditional ?? false,
      useDefaults: config?.useDefaults ?? false,
      maxDepth: config?.maxDepth ?? 50,
      formats: config?.formats ?? {},
    };
  }

  /**
   * Validate JSON output against a schema
   */
  validate(output: string, schema: JSONSchema): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];
    let extracted = false;
    let repaired = false;
    let rawJSON: string | undefined;

    // Step 1: Try to parse as-is
    let data: unknown;
    let parsed = false;

    try {
      data = JSON.parse(output.trim());
      rawJSON = output.trim();
      parsed = true;
    } catch {
      // Not direct JSON
    }

    // Step 2: Try extraction from text
    if (!parsed && this.config.extractFromText) {
      const extractedObj = extractJSON(output);
      if (extractedObj !== null) {
        data = extractedObj;
        rawJSON = JSON.stringify(extractedObj);
        extracted = true;
        parsed = true;
        // Check if the extraction required repair (the raw text wasn't valid JSON)
        const boundary = findJSONBoundary(output);
        if (boundary) {
          const candidate = output.slice(boundary.start, boundary.end + 1).trim();
          try {
            JSON.parse(candidate);
          } catch {
            repaired = true;
          }
        }
      }
    }

    // Step 3: Try repair
    if (!parsed && this.config.autoRepair) {
      try {
        const repairedText = repairJSON(output);
        data = JSON.parse(repairedText);
        rawJSON = repairedText;
        repaired = true;
        parsed = true;
      } catch {
        // Still can't parse
      }
    }

    // Step 4: Try extract + repair
    if (!parsed && this.config.extractFromText && this.config.autoRepair) {
      const boundary = findJSONBoundary(output);
      if (boundary) {
        try {
          const candidate = output.slice(boundary.start, boundary.end + 1);
          const repairedText = repairJSON(candidate);
          data = JSON.parse(repairedText);
          rawJSON = repairedText;
          extracted = true;
          repaired = true;
          parsed = true;
        } catch {
          // Give up
        }
      }
    }

    if (!parsed) {
      return {
        valid: false,
        errors: [{
          path: '$',
          message: 'Unable to parse output as JSON',
          rule: 'parse_error',
          severity: 'error',
        }],
        warnings: [],
        extracted: false,
        repaired: false,
      };
    }

    // Step 5: Validate against schema
    data = validateValue(data, schema, '$', errors, warnings, this.config, 0);

    return {
      valid: errors.length === 0,
      data,
      errors,
      warnings,
      extracted,
      repaired,
      rawJSON,
    };
  }

  /**
   * Extract JSON from mixed text/JSON output
   */
  extractJSON(text: string): object | null {
    return extractJSON(text);
  }

  /**
   * Attempt to repair malformed JSON
   */
  repairJSON(text: string): string {
    return repairJSON(text);
  }

  /**
   * Validate with auto-retry prompt generation
   */
  generateRetryPrompt(
    output: string,
    schema: JSONSchema,
    errors: ValidationError[]
  ): string {
    return generateRetryPrompt(output, schema, errors);
  }
}

/**
 * Create a schema validator instance
 */
export function createSchemaValidator(config?: SchemaValidatorConfig): SchemaValidator {
  return new SchemaValidator(config);
}
