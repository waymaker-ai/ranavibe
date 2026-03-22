import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  describe as aiDescribe,
  aiTest,
  it as aiIt,
  test as testAlias,
  beforeAll as aiBeforeAll,
  afterAll as aiAfterAll,
  beforeEach as aiBeforeEach,
  afterEach as aiAfterEach,
  run,
  reset,
  configure,
  getConfig,
  evalSet,
  abTest,
  compareModels,
  version,
} from '../index';
import type {
  AITestContext,
  AITestConfig,
  AITestResult,
  AIMatchers,
  SemanticMatchOptions,
  StatisticalOptions,
  JSONSchema,
} from '../types';

// Suppress console output from the test runner
vi.spyOn(console, 'log').mockImplementation(() => {});
vi.spyOn(console, 'warn').mockImplementation(() => {});

// ===========================================================================
// Configuration
// ===========================================================================

describe('Testing Framework - configure', () => {
  beforeEach(() => {
    reset();
  });

  it('should have sensible default configuration', () => {
    const config = getConfig();
    expect(config.defaultModel).toBe('gpt-4o-mini');
    expect(config.semanticThreshold).toBe(0.8);
    expect(config.timeout).toBe(30000);
    expect(config.retries).toBe(0);
    expect(config.reporter).toBe('default');
  });

  it('should update configuration', () => {
    configure({ timeout: 60000, retries: 3 });
    const config = getConfig();
    expect(config.timeout).toBe(60000);
    expect(config.retries).toBe(3);
  });

  it('should merge configuration without overwriting unset values', () => {
    configure({ timeout: 5000 });
    const config = getConfig();
    expect(config.timeout).toBe(5000);
    expect(config.defaultModel).toBe('gpt-4o-mini'); // unchanged
  });

  it('should configure baseline directory', () => {
    configure({ baselineDir: '/custom/baselines' });
    expect(getConfig().baselineDir).toBe('/custom/baselines');
  });

  it('should configure snapshot directory', () => {
    configure({ snapshotDir: '/custom/snapshots' });
    expect(getConfig().snapshotDir).toBe('/custom/snapshots');
  });

  it('should configure reporter type', () => {
    configure({ reporter: 'json' });
    expect(getConfig().reporter).toBe('json');
  });
});

// ===========================================================================
// Test Suite Registration
// ===========================================================================

describe('Testing Framework - describe/aiTest', () => {
  beforeEach(() => {
    reset();
  });

  it('should register a test suite with describe', () => {
    aiDescribe('My Suite', () => {
      aiTest('should pass', async () => {});
    });
    // No error means the suite was registered
  });

  it('should register tests within a suite', () => {
    aiDescribe('Suite', () => {
      aiTest('test 1', async () => {});
      aiTest('test 2', async () => {});
      aiTest('test 3', async () => {});
    });
    // Registration succeeds
  });

  it('should support it and test as aliases', () => {
    aiDescribe('Alias Suite', () => {
      aiIt('it alias', async () => {});
      testAlias('test alias', async () => {});
    });
  });

  it('should support skip option', () => {
    aiDescribe('Skip Suite', () => {
      aiTest.skip('skipped test', async () => {});
    });
  });

  it('should support only option', () => {
    aiDescribe('Only Suite', () => {
      aiTest.only('only test', async () => {});
    });
  });

  it('should support lifecycle hooks', () => {
    aiDescribe('Hook Suite', () => {
      aiBeforeAll(() => {});
      aiAfterAll(() => {});
      aiBeforeEach(() => {});
      aiAfterEach(() => {});
      aiTest('test with hooks', async () => {});
    });
  });
});

// ===========================================================================
// Test Execution
// ===========================================================================

describe('Testing Framework - run', () => {
  beforeEach(() => {
    reset();
  });

  it('should run all registered tests', async () => {
    aiDescribe('Run Suite', () => {
      aiTest('passing test', async ({ expect: e }) => {
        e(1 + 1).toBe(2);
      });
    });

    const results = await run();
    expect(results.passed).toBe(1);
    expect(results.failed).toBe(0);
    expect(results.totalDuration).toBeGreaterThan(0);
  });

  it('should track failed tests', async () => {
    aiDescribe('Failure Suite', () => {
      aiTest('failing test', async ({ expect: e }) => {
        e(1).toBe(2);
      });
    });

    const results = await run();
    expect(results.failed).toBe(1);
    expect(results.passed).toBe(0);
  });

  it('should handle skipped tests', async () => {
    aiDescribe('Skip Suite', () => {
      aiTest.skip('skipped', async () => {});
      aiTest('active', async () => {});
    });

    const results = await run();
    expect(results.skipped).toBe(1);
    expect(results.passed).toBe(1);
  });

  it('should return individual results', async () => {
    aiDescribe('Results Suite', () => {
      aiTest('test a', async () => {});
      aiTest('test b', async ({ expect: e }) => { e(true).toBe(false); });
    });

    const results = await run();
    expect(results.results).toHaveLength(2);
    expect(results.results[0].status).toBe('passed');
    expect(results.results[1].status).toBe('failed');
  });

  it('should track test durations', async () => {
    aiDescribe('Duration Suite', () => {
      aiTest('timed test', async () => {
        // Tiny delay
        await new Promise(resolve => setTimeout(resolve, 5));
      });
    });

    const results = await run();
    expect(results.results[0].duration).toBeGreaterThanOrEqual(0);
  });

  it('should run beforeAll and afterAll hooks', async () => {
    let setupRan = false;
    let teardownRan = false;

    aiDescribe('Hooks Suite', () => {
      aiBeforeAll(() => { setupRan = true; });
      aiAfterAll(() => { teardownRan = true; });
      aiTest('test', async () => {});
    });

    await run();
    expect(setupRan).toBe(true);
    expect(teardownRan).toBe(true);
  });

  it('should run beforeEach and afterEach hooks', async () => {
    let beforeCount = 0;
    let afterCount = 0;

    aiDescribe('Each Hooks Suite', () => {
      aiBeforeEach(() => { beforeCount++; });
      aiAfterEach(() => { afterCount++; });
      aiTest('test 1', async () => {});
      aiTest('test 2', async () => {});
    });

    await run();
    expect(beforeCount).toBe(2);
    expect(afterCount).toBe(2);
  });

  it('should handle test timeout', async () => {
    configure({ timeout: 100 });

    aiDescribe('Timeout Suite', () => {
      aiTest('slow test', async () => {
        await new Promise(resolve => setTimeout(resolve, 500));
      });
    });

    const results = await run();
    expect(results.failed).toBe(1);
    expect(results.results[0].error?.message).toContain('timeout');
  });

  it('should only run .only tests when present', async () => {
    aiDescribe('Only Suite', () => {
      aiTest('regular', async () => {});
      aiTest.only('only this', async () => {});
    });

    const results = await run();
    // The only test should run, the regular one should be skipped
    expect(results.passed).toBe(1);
  });
});

// ===========================================================================
// Standard Matchers (via createExpect)
// ===========================================================================

describe('Testing Framework - Standard Matchers', () => {
  beforeEach(() => {
    reset();
  });

  it('should support toBe', async () => {
    aiDescribe('toBe', () => {
      aiTest('equal values', async ({ expect: e }) => {
        e(42).toBe(42);
      });
    });
    const results = await run();
    expect(results.passed).toBe(1);
  });

  it('should fail on toBe mismatch', async () => {
    aiDescribe('toBe fail', () => {
      aiTest('unequal', async ({ expect: e }) => {
        e(1).toBe(2);
      });
    });
    const results = await run();
    expect(results.failed).toBe(1);
  });

  it('should support toEqual for deep comparison', async () => {
    aiDescribe('toEqual', () => {
      aiTest('deep equal', async ({ expect: e }) => {
        e({ a: 1, b: [2, 3] }).toEqual({ a: 1, b: [2, 3] });
      });
    });
    const results = await run();
    expect(results.passed).toBe(1);
  });

  it('should support toBeDefined', async () => {
    aiDescribe('toBeDefined', () => {
      aiTest('defined value', async ({ expect: e }) => {
        e('hello').toBeDefined();
      });
    });
    const results = await run();
    expect(results.passed).toBe(1);
  });

  it('should support toBeTruthy and toBeFalsy', async () => {
    aiDescribe('truthy/falsy', () => {
      aiTest('truthy', async ({ expect: e }) => {
        e(1).toBeTruthy();
        e(0).toBeFalsy();
      });
    });
    const results = await run();
    expect(results.passed).toBe(1);
  });

  it('should support toContain for strings', async () => {
    aiDescribe('toContain', () => {
      aiTest('contains substring', async ({ expect: e }) => {
        e('hello world').toContain('world');
      });
    });
    const results = await run();
    expect(results.passed).toBe(1);
  });

  it('should support toMatch for regex', async () => {
    aiDescribe('toMatch', () => {
      aiTest('regex match', async ({ expect: e }) => {
        e('abc-123').toMatch(/\w+-\d+/);
      });
    });
    const results = await run();
    expect(results.passed).toBe(1);
  });

  it('should support toBeGreaterThan and toBeLessThan', async () => {
    aiDescribe('numeric comparisons', () => {
      aiTest('comparisons', async ({ expect: e }) => {
        e(10).toBeGreaterThan(5);
        e(3).toBeLessThan(7);
      });
    });
    const results = await run();
    expect(results.passed).toBe(1);
  });

  it('should support toBeCloseTo', async () => {
    aiDescribe('toBeCloseTo', () => {
      aiTest('close values', async ({ expect: e }) => {
        e(0.1 + 0.2).toBeCloseTo(0.3, 5);
      });
    });
    const results = await run();
    expect(results.passed).toBe(1);
  });

  it('should support toThrow', async () => {
    aiDescribe('toThrow', () => {
      aiTest('throws error', async ({ expect: e }) => {
        e(() => { throw new Error('boom'); }).toThrow('boom');
      });
    });
    const results = await run();
    expect(results.passed).toBe(1);
  });

  it('should support .not negation', async () => {
    aiDescribe('not', () => {
      aiTest('negated assertions', async ({ expect: e }) => {
        e(1).not.toBe(2);
        e('hello').not.toContain('xyz');
      });
    });
    const results = await run();
    expect(results.passed).toBe(1);
  });
});

// ===========================================================================
// AI-Specific Matchers - toMatchSchema
// ===========================================================================

describe('Testing Framework - toMatchSchema', () => {
  beforeEach(() => {
    reset();
  });

  it('should validate object schema', async () => {
    aiDescribe('Schema', () => {
      aiTest('valid object', async ({ expect: e }) => {
        await e({ name: 'Alice', age: 30 }).toMatchSchema({
          type: 'object',
          required: ['name', 'age'],
          properties: {
            name: { type: 'string' },
            age: { type: 'number' },
          },
        });
      });
    });
    const results = await run();
    expect(results.passed).toBe(1);
  });

  it('should fail on missing required fields', async () => {
    aiDescribe('Schema Fail', () => {
      aiTest('missing field', async ({ expect: e }) => {
        await e({ name: 'Alice' }).toMatchSchema({
          type: 'object',
          required: ['name', 'age'],
        });
      });
    });
    const results = await run();
    expect(results.failed).toBe(1);
  });

  it('should validate array schema', async () => {
    aiDescribe('Array Schema', () => {
      aiTest('valid array', async ({ expect: e }) => {
        await e([1, 2, 3]).toMatchSchema({
          type: 'array',
          items: { type: 'number' },
        });
      });
    });
    const results = await run();
    expect(results.passed).toBe(1);
  });

  it('should validate primitive types', async () => {
    aiDescribe('Primitive Schema', () => {
      aiTest('string type', async ({ expect: e }) => {
        await e('hello').toMatchSchema({ type: 'string' });
      });
      aiTest('number type', async ({ expect: e }) => {
        await e(42).toMatchSchema({ type: 'number' });
      });
      aiTest('boolean type', async ({ expect: e }) => {
        await e(true).toMatchSchema({ type: 'boolean' });
      });
    });
    const results = await run();
    expect(results.passed).toBe(3);
  });
});

// ===========================================================================
// AI-Specific Matchers - toMostlyBe
// ===========================================================================

describe('Testing Framework - toMostlyBe', () => {
  beforeEach(() => {
    reset();
  });

  it('should pass when majority matches', async () => {
    aiDescribe('MostlyBe', () => {
      aiTest('majority match', async ({ expect: e }) => {
        const results = ['spam', 'spam', 'spam', 'spam', 'ham'];
        await e(results).toMostlyBe('spam', { threshold: 0.7 });
      });
    });
    const results = await run();
    expect(results.passed).toBe(1);
  });

  it('should fail when below threshold', async () => {
    aiDescribe('MostlyBe Fail', () => {
      aiTest('below threshold', async ({ expect: e }) => {
        const results = ['spam', 'ham', 'ham', 'ham', 'ham'];
        await e(results).toMostlyBe('spam', { threshold: 0.5 });
      });
    });
    const results = await run();
    expect(results.failed).toBe(1);
  });

  it('should throw when value is not an array', async () => {
    aiDescribe('MostlyBe Error', () => {
      aiTest('not array', async ({ expect: e }) => {
        await e('not-an-array').toMostlyBe('x');
      });
    });
    const results = await run();
    expect(results.failed).toBe(1);
  });
});

// ===========================================================================
// AI-Specific Matchers - toContainPII
// ===========================================================================

describe('Testing Framework - toContainPII', () => {
  beforeEach(() => {
    reset();
  });

  it('should detect email as PII', async () => {
    aiDescribe('PII', () => {
      aiTest('has email', async ({ expect: e }) => {
        await e('Contact john@example.com').toContainPII();
      });
    });
    const results = await run();
    expect(results.passed).toBe(1);
  });

  it('should detect phone as PII', async () => {
    aiDescribe('PII Phone', () => {
      aiTest('has phone', async ({ expect: e }) => {
        await e('Call 555-123-4567').toContainPII();
      });
    });
    const results = await run();
    expect(results.passed).toBe(1);
  });

  it('should detect SSN as PII', async () => {
    aiDescribe('PII SSN', () => {
      aiTest('has ssn', async ({ expect: e }) => {
        await e('SSN: 123-45-6789').toContainPII();
      });
    });
    const results = await run();
    expect(results.passed).toBe(1);
  });

  it('should pass with .not when no PII present', async () => {
    aiDescribe('No PII', () => {
      aiTest('clean text', async ({ expect: e }) => {
        await e('Normal text without personal data').not.toContainPII();
      });
    });
    const results = await run();
    expect(results.passed).toBe(1);
  });
});

// ===========================================================================
// evalSet
// ===========================================================================

describe('Testing Framework - evalSet', () => {
  it('should create an eval set with items', () => {
    const evals = evalSet([
      { input: 'hello', expected: 'greeting', type: 'contains' },
      { input: 'goodbye', expected: 'farewell', type: 'contains' },
    ]);
    expect(evals.items).toHaveLength(2);
  });

  it('should run eval set with exact matching', async () => {
    const evals = evalSet([
      { input: 'Paris', expected: 'Paris', type: 'exact' },
      { input: 'London', expected: 'Berlin', type: 'exact' },
    ]);

    const results = await evals.run(async (input) => input);
    expect(results.passed).toBe(1);
    expect(results.failed).toBe(1);
    expect(results.passRate).toBe(0.5);
  });

  it('should run eval set with contains matching', async () => {
    const evals = evalSet([
      { input: 'the capital is Paris', expected: 'paris', type: 'contains' },
    ]);

    const results = await evals.run(async (input) => input);
    expect(results.passed).toBe(1);
  });

  it('should run eval set with regex matching', async () => {
    const evals = evalSet([
      { input: 'order-12345', expected: 'order-\\d+', type: 'regex' },
    ]);

    const results = await evals.run(async (input) => input);
    expect(results.passed).toBe(1);
  });

  it('should handle empty eval set', async () => {
    const evals = evalSet([]);
    const results = await evals.run(async (input) => input);
    expect(results.passRate).toBe(0);
    expect(results.passed).toBe(0);
  });

  it('should default to contains matching', async () => {
    const evals = evalSet([
      { input: 'hello world', expected: 'world' },
    ]);

    const results = await evals.run(async (input) => input);
    expect(results.passed).toBe(1);
  });
});

// ===========================================================================
// A/B Testing
// ===========================================================================

describe('Testing Framework - abTest', () => {
  it('should compare variants', async () => {
    const results = await abTest(
      'prompt comparison',
      {
        variants: {
          formal: 'You are a formal assistant.',
          casual: 'You are a casual assistant.',
        },
        runs: 3,
        evaluate: (result) => result.length,
      },
      async (variant) => `Response from ${variant}`,
    );

    expect(results.results).toBeDefined();
    expect(results.results.formal).toBeDefined();
    expect(results.results.casual).toBeDefined();
    expect(results.results.formal.runs).toBe(3);
    expect(results.confidence).toBeDefined();
  });

  it('should calculate average scores', async () => {
    const results = await abTest(
      'scoring test',
      {
        variants: { a: 'variant-a', b: 'variant-b' },
        runs: 5,
        evaluate: () => 0.8,
      },
      async (variant) => variant,
    );

    expect(results.results.a.avgScore).toBeCloseTo(0.8);
    expect(results.results.b.avgScore).toBeCloseTo(0.8);
  });

  it('should track average latency', async () => {
    const results = await abTest(
      'latency test',
      {
        variants: { fast: 'fast' },
        runs: 2,
        evaluate: () => 1,
      },
      async () => 'result',
    );

    expect(results.results.fast.avgLatency).toBeGreaterThanOrEqual(0);
  });
});

// ===========================================================================
// Model Comparison
// ===========================================================================

describe('Testing Framework - compareModels', () => {
  it('should compare multiple models', async () => {
    const results = await compareModels(
      ['model-a', 'model-b', 'model-c'],
      async (model) => `Output from ${model}`,
      (result) => result.length,
      2,
    );

    expect(results.results['model-a']).toBeDefined();
    expect(results.results['model-b']).toBeDefined();
    expect(results.results['model-c']).toBeDefined();
    expect(results.recommendation.bestQuality).toBeDefined();
    expect(results.recommendation.fastest).toBeDefined();
  });

  it('should identify fastest model', async () => {
    let callCount = 0;
    const results = await compareModels(
      ['slow', 'fast'],
      async (model) => {
        if (model === 'slow') await new Promise(r => setTimeout(r, 20));
        return model;
      },
      () => 1,
      2,
    );

    expect(results.recommendation.fastest).toBe('fast');
  });
});

// ===========================================================================
// Version & Reset
// ===========================================================================

describe('Testing Framework - version and reset', () => {
  it('should export a version string', () => {
    expect(version).toBeDefined();
    expect(typeof version).toBe('string');
  });

  it('should reset state cleanly', () => {
    reset();
    // After reset, running should return empty results
  });
});
