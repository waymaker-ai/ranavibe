import { describe, it, expect } from 'vitest';
import {
  SchemaValidator,
  createSchemaValidator,
  extractJSON,
  repairJSON,
  generateRetryPrompt,
} from '../index';
import type { JSONSchema, ValidationError } from '../types';

// ---------------------------------------------------------------------------
// extractJSON tests
// ---------------------------------------------------------------------------

describe('extractJSON', () => {
  it('should parse valid JSON directly', () => {
    const result = extractJSON('{"name": "test"}');
    expect(result).toEqual({ name: 'test' });
  });

  it('should extract JSON from markdown code blocks', () => {
    const text = 'Here is the result:\n```json\n{"name": "test"}\n```\nDone.';
    expect(extractJSON(text)).toEqual({ name: 'test' });
  });

  it('should extract JSON from code blocks without language tag', () => {
    const text = 'Result:\n```\n{"name": "test"}\n```';
    expect(extractJSON(text)).toEqual({ name: 'test' });
  });

  it('should extract JSON object from mixed text', () => {
    const text = 'The answer is: {"name": "test", "value": 42} and that is it.';
    expect(extractJSON(text)).toEqual({ name: 'test', value: 42 });
  });

  it('should extract JSON array from mixed text', () => {
    const text = 'Results: [1, 2, 3]';
    expect(extractJSON(text)).toEqual([1, 2, 3]);
  });

  it('should return null for non-JSON text', () => {
    expect(extractJSON('Hello world')).toBeNull();
  });

  it('should return null for empty input', () => {
    expect(extractJSON('')).toBeNull();
  });

  it('should return null for null input', () => {
    expect(extractJSON(null as any)).toBeNull();
  });

  it('should handle nested JSON objects', () => {
    const text = '{"user": {"name": "Alice", "age": 30}}';
    const result = extractJSON(text);
    expect(result).toEqual({ user: { name: 'Alice', age: 30 } });
  });
});

// ---------------------------------------------------------------------------
// repairJSON tests
// ---------------------------------------------------------------------------

describe('repairJSON', () => {
  it('should remove trailing commas', () => {
    const repaired = repairJSON('{"a": 1, "b": 2,}');
    expect(JSON.parse(repaired)).toEqual({ a: 1, b: 2 });
  });

  it('should replace single quotes with double quotes', () => {
    const repaired = repairJSON("{'name': 'test'}");
    expect(JSON.parse(repaired)).toEqual({ name: 'test' });
  });

  it('should add quotes to unquoted keys', () => {
    const repaired = repairJSON('{name: "test", age: 30}');
    expect(JSON.parse(repaired)).toEqual({ name: 'test', age: 30 });
  });

  it('should fix Python True/False/None', () => {
    const repaired = repairJSON('{"active": True, "name": None, "deleted": False}');
    expect(JSON.parse(repaired)).toEqual({ active: true, name: null, deleted: false });
  });

  it('should fix undefined values', () => {
    const repaired = repairJSON('{"value": undefined}');
    expect(JSON.parse(repaired)).toEqual({ value: null });
  });

  it('should close truncated JSON', () => {
    const repaired = repairJSON('{"name": "test", "items": [1, 2');
    expect(() => JSON.parse(repaired)).not.toThrow();
    const parsed = JSON.parse(repaired);
    expect(parsed.name).toBe('test');
  });

  it('should handle NaN and Infinity', () => {
    const repaired = repairJSON('{"a": NaN, "b": Infinity, "c": -Infinity}');
    expect(JSON.parse(repaired)).toEqual({ a: null, b: null, c: null });
  });

  it('should handle empty input', () => {
    expect(repairJSON('')).toBe('');
  });

  it('should not break valid JSON', () => {
    const valid = '{"name": "test", "value": 42}';
    expect(JSON.parse(repairJSON(valid))).toEqual({ name: 'test', value: 42 });
  });

  it('should handle trailing comma in array', () => {
    const repaired = repairJSON('[1, 2, 3,]');
    expect(JSON.parse(repaired)).toEqual([1, 2, 3]);
  });
});

// ---------------------------------------------------------------------------
// SchemaValidator.validate tests
// ---------------------------------------------------------------------------

describe('SchemaValidator', () => {
  describe('type validation', () => {
    it('should validate string type', () => {
      const validator = new SchemaValidator();
      const result = validator.validate('"hello"', { type: 'string' });
      expect(result.valid).toBe(true);
    });

    it('should reject wrong type', () => {
      const validator = new SchemaValidator();
      const result = validator.validate('42', { type: 'string' });
      expect(result.valid).toBe(false);
      expect(result.errors[0].rule).toBe('type');
    });

    it('should validate number type', () => {
      const validator = new SchemaValidator();
      expect(validator.validate('42', { type: 'number' }).valid).toBe(true);
      expect(validator.validate('3.14', { type: 'number' }).valid).toBe(true);
    });

    it('should validate integer type', () => {
      const validator = new SchemaValidator();
      expect(validator.validate('42', { type: 'integer' }).valid).toBe(true);
      expect(validator.validate('3.14', { type: 'integer' }).valid).toBe(false);
    });

    it('should validate boolean type', () => {
      const validator = new SchemaValidator();
      expect(validator.validate('true', { type: 'boolean' }).valid).toBe(true);
      expect(validator.validate('"true"', { type: 'boolean' }).valid).toBe(false);
    });

    it('should validate null type', () => {
      const validator = new SchemaValidator();
      expect(validator.validate('null', { type: 'null' }).valid).toBe(true);
    });

    it('should validate array type', () => {
      const validator = new SchemaValidator();
      expect(validator.validate('[1, 2, 3]', { type: 'array' }).valid).toBe(true);
    });

    it('should validate object type', () => {
      const validator = new SchemaValidator();
      expect(validator.validate('{"a": 1}', { type: 'object' }).valid).toBe(true);
    });

    it('should support union types', () => {
      const validator = new SchemaValidator();
      const schema: JSONSchema = { type: ['string', 'null'] };
      expect(validator.validate('"hello"', schema).valid).toBe(true);
      expect(validator.validate('null', schema).valid).toBe(true);
      expect(validator.validate('42', schema).valid).toBe(false);
    });
  });

  describe('object validation', () => {
    it('should validate required properties', () => {
      const validator = new SchemaValidator();
      const schema: JSONSchema = {
        type: 'object',
        properties: {
          name: { type: 'string' },
          age: { type: 'number' },
        },
        required: ['name'],
      };

      expect(validator.validate('{"name": "Alice"}', schema).valid).toBe(true);
      expect(validator.validate('{"age": 30}', schema).valid).toBe(false);
    });

    it('should validate nested objects', () => {
      const validator = new SchemaValidator();
      const schema: JSONSchema = {
        type: 'object',
        properties: {
          user: {
            type: 'object',
            properties: {
              name: { type: 'string' },
            },
            required: ['name'],
          },
        },
        required: ['user'],
      };

      const valid = '{"user": {"name": "Alice"}}';
      const invalid = '{"user": {"age": 30}}';
      expect(validator.validate(valid, schema).valid).toBe(true);
      expect(validator.validate(invalid, schema).valid).toBe(false);
    });

    it('should reject additional properties when configured', () => {
      const validator = new SchemaValidator();
      const schema: JSONSchema = {
        type: 'object',
        properties: { name: { type: 'string' } },
        additionalProperties: false,
      };

      expect(validator.validate('{"name": "Alice", "extra": true}', schema).valid).toBe(false);
    });

    it('should strip additional properties when configured', () => {
      const validator = new SchemaValidator({ stripAdditional: true });
      const schema: JSONSchema = {
        type: 'object',
        properties: { name: { type: 'string' } },
        additionalProperties: false,
      };

      const result = validator.validate('{"name": "Alice", "extra": true}', schema);
      expect(result.valid).toBe(true);
      expect((result.data as any).extra).toBeUndefined();
    });

    it('should validate minProperties and maxProperties', () => {
      const validator = new SchemaValidator();
      const schema: JSONSchema = { type: 'object', minProperties: 2, maxProperties: 3 };
      expect(validator.validate('{"a": 1}', schema).valid).toBe(false);
      expect(validator.validate('{"a": 1, "b": 2}', schema).valid).toBe(true);
      expect(validator.validate('{"a": 1, "b": 2, "c": 3, "d": 4}', schema).valid).toBe(false);
    });
  });

  describe('array validation', () => {
    it('should validate array items', () => {
      const validator = new SchemaValidator();
      const schema: JSONSchema = {
        type: 'array',
        items: { type: 'number' },
      };

      expect(validator.validate('[1, 2, 3]', schema).valid).toBe(true);
      expect(validator.validate('[1, "two", 3]', schema).valid).toBe(false);
    });

    it('should validate minItems and maxItems', () => {
      const validator = new SchemaValidator();
      const schema: JSONSchema = { type: 'array', minItems: 2, maxItems: 4 };

      expect(validator.validate('[1]', schema).valid).toBe(false);
      expect(validator.validate('[1, 2]', schema).valid).toBe(true);
      expect(validator.validate('[1, 2, 3, 4, 5]', schema).valid).toBe(false);
    });

    it('should validate uniqueItems', () => {
      const validator = new SchemaValidator();
      const schema: JSONSchema = { type: 'array', uniqueItems: true };

      expect(validator.validate('[1, 2, 3]', schema).valid).toBe(true);
      expect(validator.validate('[1, 2, 2]', schema).valid).toBe(false);
    });
  });

  describe('string validation', () => {
    it('should validate minLength and maxLength', () => {
      const validator = new SchemaValidator();
      const schema: JSONSchema = { type: 'string', minLength: 2, maxLength: 5 };

      expect(validator.validate('"ab"', schema).valid).toBe(true);
      expect(validator.validate('"a"', schema).valid).toBe(false);
      expect(validator.validate('"abcdef"', schema).valid).toBe(false);
    });

    it('should validate pattern', () => {
      const validator = new SchemaValidator();
      const schema: JSONSchema = { type: 'string', pattern: '^[a-z]+$' };

      expect(validator.validate('"hello"', schema).valid).toBe(true);
      expect(validator.validate('"Hello"', schema).valid).toBe(false);
    });

    it('should validate format as warning', () => {
      const validator = new SchemaValidator();
      const schema: JSONSchema = { type: 'string', format: 'email' };

      const valid = validator.validate('"test@example.com"', schema);
      expect(valid.warnings.length).toBe(0);

      const invalid = validator.validate('"not-an-email"', schema);
      expect(invalid.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('number validation', () => {
    it('should validate minimum and maximum', () => {
      const validator = new SchemaValidator();
      const schema: JSONSchema = { type: 'number', minimum: 0, maximum: 100 };

      expect(validator.validate('50', schema).valid).toBe(true);
      expect(validator.validate('-1', schema).valid).toBe(false);
      expect(validator.validate('101', schema).valid).toBe(false);
    });

    it('should validate exclusiveMinimum and exclusiveMaximum', () => {
      const validator = new SchemaValidator();
      const schema: JSONSchema = { type: 'number', exclusiveMinimum: 0, exclusiveMaximum: 10 };

      expect(validator.validate('5', schema).valid).toBe(true);
      expect(validator.validate('0', schema).valid).toBe(false);
      expect(validator.validate('10', schema).valid).toBe(false);
    });
  });

  describe('enum and const', () => {
    it('should validate enum values', () => {
      const validator = new SchemaValidator();
      const schema: JSONSchema = { enum: ['red', 'green', 'blue'] };

      expect(validator.validate('"red"', schema).valid).toBe(true);
      expect(validator.validate('"yellow"', schema).valid).toBe(false);
    });

    it('should validate const value', () => {
      const validator = new SchemaValidator();
      const schema: JSONSchema = { const: 42 };

      expect(validator.validate('42', schema).valid).toBe(true);
      expect(validator.validate('43', schema).valid).toBe(false);
    });
  });

  describe('anyOf, oneOf, allOf, not', () => {
    it('should validate anyOf', () => {
      const validator = new SchemaValidator();
      const schema: JSONSchema = {
        anyOf: [
          { type: 'string' },
          { type: 'number' },
        ],
      };

      expect(validator.validate('"hello"', schema).valid).toBe(true);
      expect(validator.validate('42', schema).valid).toBe(true);
      expect(validator.validate('true', schema).valid).toBe(false);
    });

    it('should validate oneOf', () => {
      const validator = new SchemaValidator();
      const schema: JSONSchema = {
        oneOf: [
          { type: 'string', minLength: 5 },
          { type: 'string', maxLength: 3 },
        ],
      };

      expect(validator.validate('"hi"', schema).valid).toBe(true);   // matches maxLength only
      expect(validator.validate('"hello world"', schema).valid).toBe(true); // matches minLength only
      expect(validator.validate('"abcd"', schema).valid).toBe(false); // matches neither
    });

    it('should validate not', () => {
      const validator = new SchemaValidator();
      const schema: JSONSchema = { not: { type: 'string' } };

      expect(validator.validate('42', schema).valid).toBe(true);
      expect(validator.validate('"hello"', schema).valid).toBe(false);
    });
  });

  describe('extraction and repair', () => {
    it('should extract JSON from text when enabled', () => {
      const validator = new SchemaValidator({ extractFromText: true });
      const schema: JSONSchema = { type: 'object', properties: { name: { type: 'string' } } };
      const result = validator.validate(
        'Here is the JSON: {"name": "Alice"}',
        schema
      );
      expect(result.valid).toBe(true);
      expect(result.extracted).toBe(true);
    });

    it('should repair JSON when enabled', () => {
      const validator = new SchemaValidator({ autoRepair: true });
      const schema: JSONSchema = { type: 'object' };
      const result = validator.validate("{'name': 'Alice',}", schema);
      expect(result.valid).toBe(true);
      expect(result.repaired).toBe(true);
    });

    it('should return parse error when extraction and repair fail', () => {
      const validator = new SchemaValidator();
      const result = validator.validate('not json at all', { type: 'object' });
      expect(result.valid).toBe(false);
      expect(result.errors[0].rule).toBe('parse_error');
    });
  });

  describe('coercion and defaults', () => {
    it('should coerce types when enabled', () => {
      const validator = new SchemaValidator({ coerceTypes: true });
      const schema: JSONSchema = {
        type: 'object',
        properties: { age: { type: 'number' } },
      };
      const result = validator.validate('{"age": "30"}', schema);
      expect(result.valid).toBe(true);
      expect((result.data as any).age).toBe(30);
    });

    it('should fill defaults when enabled', () => {
      const validator = new SchemaValidator({ useDefaults: true });
      const schema: JSONSchema = {
        type: 'object',
        properties: {
          name: { type: 'string' },
          role: { type: 'string', default: 'user' },
        },
        required: ['name', 'role'],
      };
      const result = validator.validate('{"name": "Alice"}', schema);
      expect(result.valid).toBe(true);
      expect((result.data as any).role).toBe('user');
    });
  });

  describe('generateRetryPrompt', () => {
    it('should generate a retry prompt with errors', () => {
      const errors: ValidationError[] = [
        { path: '$.name', message: 'Required property "name" is missing', rule: 'required', severity: 'error' },
        { path: '$.age', message: 'Expected number but got string', expected: 'number', actual: 'string', rule: 'type', severity: 'error' },
      ];
      const schema: JSONSchema = { type: 'object', properties: { name: { type: 'string' }, age: { type: 'number' } } };

      const prompt = generateRetryPrompt('{"age": "thirty"}', schema, errors);
      expect(prompt).toContain('Missing Required Fields');
      expect(prompt).toContain('Type Errors');
      expect(prompt).toContain('$.name');
      expect(prompt).toContain('$.age');
    });

    it('should include parse errors', () => {
      const errors: ValidationError[] = [
        { path: '$', message: 'Unable to parse output as JSON', rule: 'parse_error', severity: 'error' },
      ];
      const prompt = generateRetryPrompt('not json', { type: 'object' }, errors);
      expect(prompt).toContain('JSON Parse Error');
    });

    it('should include the schema', () => {
      const schema: JSONSchema = { type: 'object', properties: { name: { type: 'string' } } };
      const prompt = generateRetryPrompt('{}', schema, []);
      expect(prompt).toContain('"type": "object"');
    });
  });

  describe('factory function', () => {
    it('should create an instance', () => {
      const validator = createSchemaValidator();
      expect(validator).toBeInstanceOf(SchemaValidator);
    });

    it('should accept config', () => {
      const validator = createSchemaValidator({ coerceTypes: true });
      expect(validator).toBeInstanceOf(SchemaValidator);
    });
  });

  describe('instance methods', () => {
    it('should expose extractJSON as method', () => {
      const validator = new SchemaValidator();
      expect(validator.extractJSON('{"a": 1}')).toEqual({ a: 1 });
    });

    it('should expose repairJSON as method', () => {
      const validator = new SchemaValidator();
      const repaired = validator.repairJSON("{'a': 1,}");
      expect(JSON.parse(repaired)).toEqual({ a: 1 });
    });

    it('should expose generateRetryPrompt as method', () => {
      const validator = new SchemaValidator();
      const prompt = validator.generateRetryPrompt('{}', { type: 'object' }, []);
      expect(prompt).toBeTruthy();
    });
  });

  describe('custom formats', () => {
    it('should support custom format validators', () => {
      const validator = new SchemaValidator({
        formats: {
          'hex-color': (v: string) => /^#[0-9a-fA-F]{6}$/.test(v),
        },
      });
      const schema: JSONSchema = { type: 'string', format: 'hex-color' };

      const valid = validator.validate('"#ff0000"', schema);
      expect(valid.warnings.length).toBe(0);

      const invalid = validator.validate('"red"', schema);
      expect(invalid.warnings.length).toBeGreaterThan(0);
    });
  });
});
