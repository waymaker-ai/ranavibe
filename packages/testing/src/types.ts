/**
 * @rana/testing - Type Definitions
 * AI-native testing framework types
 */

/**
 * Test context passed to each test
 */
export interface AITestContext {
  /** Test name */
  name: string;
  /** Test file */
  file: string;
  /** Expect function with AI assertions */
  expect: AIExpect;
  /** Track cost for this test */
  trackCost: () => CostTracker;
  /** Track latency for this test */
  trackLatency: () => LatencyTracker;
}

/**
 * AI-enhanced expect function
 */
export interface AIExpect {
  (value: unknown): AIMatchers;
}

/**
 * AI-specific matchers
 */
export interface AIMatchers {
  // Standard matchers
  toBe(expected: unknown): void;
  toEqual(expected: unknown): void;
  toBeDefined(): void;
  toBeUndefined(): void;
  toBeTruthy(): void;
  toBeFalsy(): void;
  toContain(expected: string): void;
  toMatch(pattern: RegExp): void;
  toBeGreaterThan(expected: number): void;
  toBeLessThan(expected: number): void;
  toBeCloseTo(expected: number, precision?: number): void;
  toThrow(message?: string | RegExp): void;

  // AI-specific matchers (async)
  toSemanticMatch(expected: string, options?: SemanticMatchOptions): Promise<void>;
  toPassRegression(baselineId: string, options?: RegressionOptions): Promise<void>;
  toCostLessThan(maxCost: number): Promise<void>;
  toUseFewerTokensThan(maxTokens: number): Promise<void>;
  toRespondWithin(maxMs: number): Promise<void>;
  toMatchSchema(schema: JSONSchema): Promise<void>;
  toMostlyBe(expected: unknown, options?: StatisticalOptions): Promise<void>;
  toContainPII(): Promise<void>;
  toFollowSystemPrompt(): Promise<void>;
  toMatchSemanticSnapshot(snapshotId: string): Promise<void>;
  toBeFactuallyAccurate(options?: FactCheckOptions): Promise<void>;
  toHaveConfidenceAbove(threshold: number): Promise<void>;

  // Negation
  not: AIMatchers;
}

/**
 * Options for semantic matching
 */
export interface SemanticMatchOptions {
  /** Minimum similarity score (0-1), default 0.8 */
  similarity?: number;
  /** Embedding model to use */
  embeddingModel?: string;
  /** Whether to use cached embeddings */
  useCache?: boolean;
}

/**
 * Options for regression testing
 */
export interface RegressionOptions {
  /** Metrics to compare */
  metrics?: ('coherence' | 'coverage' | 'conciseness' | 'accuracy' | 'relevance')[];
  /** Minimum score threshold (0-1) */
  threshold?: number;
  /** Update baseline if test passes */
  updateBaseline?: boolean;
  /** Custom comparison function */
  compare?: (current: string, baseline: string) => Promise<number>;
}

/**
 * Options for statistical assertions
 */
export interface StatisticalOptions {
  /** Required pass rate (0-1), default 0.8 */
  threshold?: number;
  /** Number of runs if not already an array */
  runs?: number;
}

/**
 * Options for fact checking
 */
export interface FactCheckOptions {
  /** Sources to verify against */
  sources?: string[];
  /** Verification model */
  model?: string;
  /** Minimum confidence */
  minConfidence?: number;
}

/**
 * JSON Schema for structured output validation
 */
export interface JSONSchema {
  type?: string;
  properties?: Record<string, JSONSchema>;
  required?: string[];
  items?: JSONSchema;
  enum?: unknown[];
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  [key: string]: unknown;
}

/**
 * Cost tracking result
 */
export interface CostTracker {
  /** Total cost in USD */
  totalCost: number;
  /** Input tokens used */
  inputTokens: number;
  /** Output tokens used */
  outputTokens: number;
  /** Model used */
  model: string;
  /** Provider used */
  provider: string;
}

/**
 * Latency tracking result
 */
export interface LatencyTracker {
  /** Total time in ms */
  totalMs: number;
  /** Time to first token in ms */
  ttftMs?: number;
  /** Tokens per second */
  tokensPerSecond?: number;
}

/**
 * Test result
 */
export interface AITestResult {
  /** Test name */
  name: string;
  /** Test file */
  file: string;
  /** Pass/fail status */
  status: 'passed' | 'failed' | 'skipped';
  /** Duration in ms */
  duration: number;
  /** Error if failed */
  error?: Error;
  /** Cost information */
  cost?: CostTracker;
  /** Latency information */
  latency?: LatencyTracker;
  /** Assertions made */
  assertions: number;
}

/**
 * Test suite configuration
 */
export interface AITestConfig {
  /** Default model for tests */
  defaultModel?: string;
  /** Default provider */
  defaultProvider?: string;
  /** Semantic similarity threshold */
  semanticThreshold?: number;
  /** Maximum cost per test */
  maxCostPerTest?: number;
  /** Maximum cost for entire suite */
  maxTotalCost?: number;
  /** Test timeout in ms */
  timeout?: number;
  /** Number of retries for flaky tests */
  retries?: number;
  /** Model for evaluation/quality scoring */
  evalModel?: string;
  /** Where to store baselines */
  baselineDir?: string;
  /** Where to store snapshots */
  snapshotDir?: string;
  /** Reporter type */
  reporter?: 'default' | 'json' | 'junit' | 'github';
  /** Parallel test execution */
  parallel?: boolean;
  /** Max parallel tests */
  maxWorkers?: number;
}

/**
 * Eval set item
 */
export interface EvalItem {
  /** Input to the function */
  input: string;
  /** Expected output */
  expected: string;
  /** Comparison type */
  type: 'exact' | 'contains' | 'semantic' | 'regex' | 'custom';
  /** Custom comparison function */
  compare?: (actual: string, expected: string) => boolean | Promise<boolean>;
  /** Tags for filtering */
  tags?: string[];
  /** Weight for scoring */
  weight?: number;
}

/**
 * Eval set results
 */
export interface EvalResults {
  /** Pass rate (0-1) */
  passRate: number;
  /** Number passed */
  passed: number;
  /** Number failed */
  failed: number;
  /** Total items */
  total: number;
  /** Average latency */
  averageLatency: number;
  /** Total cost */
  totalCost: number;
  /** Individual results */
  results: EvalItemResult[];
}

/**
 * Individual eval item result
 */
export interface EvalItemResult {
  /** The eval item */
  item: EvalItem;
  /** Actual output */
  actual: string;
  /** Pass/fail */
  passed: boolean;
  /** Similarity score if semantic */
  similarity?: number;
  /** Latency in ms */
  latency: number;
  /** Cost in USD */
  cost: number;
}

/**
 * A/B test configuration
 */
export interface ABTestConfig {
  /** Variants to test */
  variants: Record<string, string>;
  /** Number of runs per variant */
  runs: number;
  /** Metrics to measure */
  metrics: ('quality' | 'cost' | 'latency')[];
  /** Statistical significance threshold */
  significanceLevel?: number;
}

/**
 * A/B test results
 */
export interface ABTestResults {
  /** Results per variant */
  variants: Record<string, {
    quality: number;
    cost: number;
    latency: number;
    runs: number;
  }>;
  /** Winner (if statistically significant) */
  winner?: string;
  /** Confidence level */
  confidence: number;
}

/**
 * Model comparison configuration
 */
export interface ModelComparisonConfig {
  /** Models to compare */
  models: string[];
  /** Number of runs per model */
  runs: number;
  /** Metrics to measure */
  metrics?: ('quality' | 'cost' | 'latency')[];
}

/**
 * Model comparison results
 */
export interface ModelComparisonResults {
  /** Results per model */
  models: Record<string, {
    quality: number;
    cost: number;
    latency: number;
    runs: number;
  }>;
  /** Recommended model */
  recommendation: {
    bestQuality: string;
    bestValue: string;
    fastest: string;
    cheapest: string;
  };
}

/**
 * Test function signature
 */
export type AITestFn = (ctx: AITestContext) => Promise<void> | void;

/**
 * Describe block options
 */
export interface DescribeOptions {
  /** Skip this suite */
  skip?: boolean;
  /** Only run this suite */
  only?: boolean;
  /** Timeout for all tests in suite */
  timeout?: number;
  /** Setup function */
  beforeAll?: () => Promise<void> | void;
  /** Teardown function */
  afterAll?: () => Promise<void> | void;
  /** Before each test */
  beforeEach?: () => Promise<void> | void;
  /** After each test */
  afterEach?: () => Promise<void> | void;
}
