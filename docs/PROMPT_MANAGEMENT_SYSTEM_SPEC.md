# Prompt Management System Specification

## Executive Summary

**Feature**: Enterprise Prompt Management System for RANA Framework
**Priority**: P0 (Industry Standard Feature)
**Impact**: Prompt Engineering, Team Collaboration, Cost Optimization
**Timeline**: Q1 2025 (6-8 weeks)

This specification defines RANA's prompt management system with versioning, A/B testing, analytics, and collaborative editing. It enables teams to build, test, and optimize prompts systematically rather than through ad-hoc experimentation.

---

## Problem Statement

### Current State

RANA developers currently:
- Hardcode prompts directly in application code
- Have no systematic way to test prompt variations
- Cannot track which prompts perform best
- Lack version control for prompt iterations
- Have no collaboration tools for prompt engineering
- Cannot reuse prompts across projects
- Have limited visibility into prompt costs and performance

### Competitive Landscape

| Platform | Capability | RANA Gap |
|----------|-----------|----------|
| **LangSmith** | Prompt versioning & testing | ✗ No equivalent |
| **PromptLayer** | Prompt analytics & logging | ✗ No equivalent |
| **Helicone** | Prompt caching & optimization | ✗ No equivalent |
| **Humanloop** | Prompt IDE & collaboration | ✗ No equivalent |
| **Braintrust** | Prompt evaluation & testing | ✗ No equivalent |

### Target State

```typescript
// Define prompts in centralized registry
import { definePrompt, usePrompt } from '@rana/prompts';

// Define prompt with metadata
export const summarizeArticle = definePrompt({
  name: 'summarize-article',
  version: '2.1.0',
  description: 'Summarize article in bullet points',
  model: 'claude-sonnet-4',
  template: `
You are a professional editor. Summarize this article in 3-5 bullet points.

Article: {{article}}

Requirements:
- Focus on key insights
- Use clear, concise language
- Highlight actionable takeaways

Output format: Markdown bullet list
  `,
  variables: {
    article: { type: 'string', required: true, maxLength: 10000 },
  },
  examples: [
    {
      input: { article: 'Long article about AI...' },
      output: '• AI is transforming industries\n• Key challenges include...',
    },
  ],
  metadata: {
    tags: ['content', 'summarization'],
    owner: 'content-team',
    cost: 'low',
  },
});

// Use in application
function ArticleSummarizer({ article }) {
  const { generate, isLoading, cost } = usePrompt(summarizeArticle);

  const summary = await generate({ article });

  return <div>{summary}</div>;
}

// A/B test variants
const test = await abTest({
  variants: [
    summarizeArticle.v('2.0.0'), // Current version
    summarizeArticle.v('2.1.0'), // New version
  ],
  traffic: { '2.0.0': 0.5, '2.1.0': 0.5 },
  metrics: ['quality', 'cost', 'latency'],
  duration: '7 days',
});

// View analytics
rana prompts analytics summarize-article --last 30d

╭────────────────────────────────────────────╮
│ Prompt: summarize-article v2.1.0          │
├────────────────────────────────────────────┤
│ Executions: 12,847                        │
│ Success Rate: 98.3%                       │
│ Avg Latency: 1.2s                         │
│ Total Cost: $24.50                        │
│ Cost per Call: $0.0019                    │
│                                           │
│ Quality Metrics:                          │
│ • User feedback: 4.6/5.0                  │
│ • Output length: 142 chars (avg)          │
│ • Follow-up rate: 12%                     │
│                                           │
│ Top Variables:                            │
│ • article length: 500-2000 chars (85%)    │
│ • content type: news (62%), blog (28%)    │
│                                           │
│ Common Issues:                            │
│ • 1.2% exceeded max length                │
│ • 0.5% rate limit errors                  │
╰────────────────────────────────────────────╯
```

---

## Technical Architecture

### 1. Core Components

```
@rana/prompts
├── cli/
│   ├── create.ts             # Create new prompt
│   ├── test.ts               # Test prompt
│   ├── deploy.ts             # Deploy to production
│   ├── analytics.ts          # View analytics
│   └── compare.ts            # Compare versions
├── core/
│   ├── registry.ts           # Prompt registry
│   ├── executor.ts           # Execute prompts
│   ├── validator.ts          # Validate inputs/outputs
│   ├── versioning.ts         # Version management
│   └── caching.ts            # Prompt caching
├── testing/
│   ├── ab-test.ts            # A/B testing engine
│   ├── eval.ts               # Evaluation framework
│   ├── dataset.ts            # Test dataset management
│   └── metrics.ts            # Quality metrics
├── analytics/
│   ├── tracker.ts            # Track executions
│   ├── aggregator.ts         # Aggregate stats
│   ├── reporter.ts           # Generate reports
│   └── dashboard.ts          # Analytics dashboard
├── collaboration/
│   ├── workspace.ts          # Team workspaces
│   ├── comments.ts           # Comment on prompts
│   ├── reviews.ts            # Review flow
│   └── sharing.ts            # Share prompts
├── optimization/
│   ├── compressor.ts         # Prompt compression
│   ├── optimizer.ts          # Auto-optimization
│   ├── cost-analyzer.ts      # Cost analysis
│   └── suggestions.ts        # Improvement suggestions
└── integrations/
    ├── langsmith.ts          # LangSmith integration
    ├── helicone.ts           # Helicone integration
    └── custom.ts             # Custom integrations
```

### 2. Data Models

```typescript
// packages/prompts/src/core/types.ts

export interface PromptDefinition {
  // Identity
  id: string;                           // Unique identifier
  name: string;                         // Human-readable name
  version: string;                      // Semantic version
  description: string;                  // What this prompt does

  // Template
  template: string;                     // Prompt template (Handlebars)
  systemPrompt?: string;                // Optional system message
  variables: Record<string, Variable>;  // Input variables
  examples?: Example[];                 // Few-shot examples

  // Model Configuration
  model: string;                        // LLM model to use
  temperature?: number;                 // Sampling temperature
  maxTokens?: number;                   // Max response tokens
  topP?: number;                        // Nucleus sampling
  stopSequences?: string[];             // Stop sequences

  // Validation
  inputSchema?: JSONSchema;             // Validate inputs
  outputSchema?: JSONSchema;            // Validate outputs
  outputFormat?: 'text' | 'json' | 'markdown' | 'code';

  // Metadata
  metadata: {
    tags: string[];                     // Categorization
    owner: string;                      // Team/person responsible
    cost: 'low' | 'medium' | 'high';   // Estimated cost tier
    latency: 'fast' | 'medium' | 'slow'; // Expected latency
    quality: 'draft' | 'production';   // Quality level
    visibility: 'private' | 'team' | 'public';
  };

  // Analytics
  analytics?: {
    enabled: boolean;
    sampleRate: number;                 // 0-1, % of calls to track
    trackCost: boolean;
    trackLatency: boolean;
    trackQuality: boolean;
  };

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  deprecatedAt?: Date;
}

export interface Variable {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description: string;
  required: boolean;
  default?: any;
  validation?: {
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    pattern?: string;
    enum?: any[];
  };
}

export interface Example {
  description?: string;
  input: Record<string, any>;
  output: string;
  metadata?: {
    quality: 1 | 2 | 3 | 4 | 5;
    source: string;
  };
}

export interface PromptExecution {
  id: string;
  promptId: string;
  version: string;
  timestamp: Date;
  input: Record<string, any>;
  output: string;
  model: string;
  latency: number;                      // milliseconds
  tokens: {
    input: number;
    output: number;
    total: number;
  };
  cost: number;                         // USD
  success: boolean;
  error?: {
    type: string;
    message: string;
  };
  metadata?: {
    userId?: string;
    sessionId?: string;
    environment: 'dev' | 'staging' | 'prod';
    cached: boolean;
  };
  feedback?: {
    rating: 1 | 2 | 3 | 4 | 5;
    comment?: string;
  };
}

export interface PromptVersion {
  version: string;
  promptId: string;
  changes: string;                      // Changelog
  author: string;
  createdAt: Date;
  status: 'draft' | 'testing' | 'production' | 'deprecated';
  parentVersion?: string;
  metrics?: {
    executions: number;
    successRate: number;
    avgLatency: number;
    avgCost: number;
    avgQuality: number;
  };
}
```

### 3. Prompt Registry

```typescript
// packages/prompts/src/core/registry.ts

export class PromptRegistry {
  private prompts: Map<string, PromptDefinition> = new Map();
  private versions: Map<string, Map<string, PromptDefinition>> = new Map();

  /**
   * Register a new prompt
   */
  register(prompt: PromptDefinition): void {
    // Validate prompt definition
    this.validate(prompt);

    // Store latest version
    this.prompts.set(prompt.name, prompt);

    // Store in version map
    if (!this.versions.has(prompt.name)) {
      this.versions.set(prompt.name, new Map());
    }
    this.versions.get(prompt.name)!.set(prompt.version, prompt);

    // Persist to storage
    this.persist(prompt);
  }

  /**
   * Get prompt by name (latest version)
   */
  get(name: string): PromptDefinition | undefined {
    return this.prompts.get(name);
  }

  /**
   * Get specific version
   */
  getVersion(name: string, version: string): PromptDefinition | undefined {
    return this.versions.get(name)?.get(version);
  }

  /**
   * List all versions of a prompt
   */
  listVersions(name: string): PromptDefinition[] {
    const versions = this.versions.get(name);
    if (!versions) return [];

    return Array.from(versions.values()).sort((a, b) =>
      semver.compare(b.version, a.version)
    );
  }

  /**
   * Create new version from existing
   */
  createVersion(
    name: string,
    changes: Partial<PromptDefinition>,
    changelog: string
  ): PromptDefinition {
    const current = this.get(name);
    if (!current) throw new Error(`Prompt ${name} not found`);

    const newVersion = semver.inc(current.version, 'minor');
    const updated: PromptDefinition = {
      ...current,
      ...changes,
      version: newVersion!,
      updatedAt: new Date(),
    };

    // Store version metadata
    this.storeVersionMetadata({
      version: newVersion!,
      promptId: name,
      changes: changelog,
      author: this.getCurrentUser(),
      createdAt: new Date(),
      status: 'draft',
      parentVersion: current.version,
    });

    this.register(updated);
    return updated;
  }

  /**
   * Search prompts
   */
  search(query: {
    tags?: string[];
    owner?: string;
    cost?: 'low' | 'medium' | 'high';
    quality?: 'draft' | 'production';
  }): PromptDefinition[] {
    return Array.from(this.prompts.values()).filter((prompt) => {
      if (query.tags && !query.tags.some(t => prompt.metadata.tags.includes(t))) {
        return false;
      }
      if (query.owner && prompt.metadata.owner !== query.owner) {
        return false;
      }
      if (query.cost && prompt.metadata.cost !== query.cost) {
        return false;
      }
      if (query.quality && prompt.metadata.quality !== query.quality) {
        return false;
      }
      return true;
    });
  }

  /**
   * Export prompts for sharing
   */
  export(names?: string[]): string {
    const prompts = names
      ? names.map(n => this.get(n)).filter(Boolean)
      : Array.from(this.prompts.values());

    return JSON.stringify(prompts, null, 2);
  }

  /**
   * Import prompts from file
   */
  import(data: string): void {
    const prompts = JSON.parse(data) as PromptDefinition[];
    prompts.forEach(p => this.register(p));
  }
}

// Global registry instance
export const registry = new PromptRegistry();
```

### 4. Prompt Execution

```typescript
// packages/prompts/src/core/executor.ts

export class PromptExecutor {
  private cache: PromptCache;
  private analytics: AnalyticsTracker;

  /**
   * Execute a prompt
   */
  async execute<T = string>(
    prompt: PromptDefinition,
    variables: Record<string, any>,
    options?: ExecutionOptions
  ): Promise<PromptResult<T>> {
    const startTime = Date.now();

    try {
      // 1. Validate inputs
      this.validateInputs(prompt, variables);

      // 2. Check cache
      if (options?.cache !== false) {
        const cached = await this.cache.get(prompt, variables);
        if (cached) {
          return this.wrapResult(cached, { cached: true, latency: Date.now() - startTime });
        }
      }

      // 3. Render template
      const rendered = this.renderTemplate(prompt.template, variables);

      // 4. Execute LLM call
      const llm = this.getLLMClient(prompt.model);
      const response = await llm.complete({
        system: prompt.systemPrompt,
        prompt: rendered,
        temperature: prompt.temperature,
        maxTokens: prompt.maxTokens,
        topP: prompt.topP,
        stopSequences: prompt.stopSequences,
      });

      // 5. Validate output
      const validated = this.validateOutput(prompt, response.content);

      // 6. Cache result
      if (options?.cache !== false) {
        await this.cache.set(prompt, variables, validated);
      }

      // 7. Track analytics
      if (prompt.analytics?.enabled) {
        await this.analytics.track({
          promptId: prompt.name,
          version: prompt.version,
          timestamp: new Date(),
          input: variables,
          output: validated,
          model: prompt.model,
          latency: Date.now() - startTime,
          tokens: response.usage,
          cost: this.calculateCost(response.usage, prompt.model),
          success: true,
          metadata: {
            environment: options?.environment || 'production',
            cached: false,
          },
        });
      }

      return this.wrapResult(validated as T, {
        latency: Date.now() - startTime,
        tokens: response.usage,
        cost: this.calculateCost(response.usage, prompt.model),
      });
    } catch (error) {
      // Track failure
      if (prompt.analytics?.enabled) {
        await this.analytics.track({
          promptId: prompt.name,
          version: prompt.version,
          timestamp: new Date(),
          input: variables,
          output: '',
          model: prompt.model,
          latency: Date.now() - startTime,
          tokens: { input: 0, output: 0, total: 0 },
          cost: 0,
          success: false,
          error: {
            type: error.name,
            message: error.message,
          },
        });
      }

      throw error;
    }
  }

  /**
   * Render template with variables
   */
  private renderTemplate(template: string, variables: Record<string, any>): string {
    const compiled = Handlebars.compile(template);
    return compiled(variables);
  }

  /**
   * Validate inputs against schema
   */
  private validateInputs(prompt: PromptDefinition, variables: Record<string, any>): void {
    for (const [key, varDef] of Object.entries(prompt.variables)) {
      const value = variables[key];

      // Check required
      if (varDef.required && value === undefined) {
        throw new Error(`Missing required variable: ${key}`);
      }

      if (value === undefined) continue;

      // Type check
      if (typeof value !== varDef.type && varDef.type !== 'array' && varDef.type !== 'object') {
        throw new Error(`Invalid type for ${key}: expected ${varDef.type}, got ${typeof value}`);
      }

      // Validation rules
      if (varDef.validation) {
        if (varDef.type === 'string') {
          if (varDef.validation.minLength && value.length < varDef.validation.minLength) {
            throw new Error(`${key} is too short (min: ${varDef.validation.minLength})`);
          }
          if (varDef.validation.maxLength && value.length > varDef.validation.maxLength) {
            throw new Error(`${key} is too long (max: ${varDef.validation.maxLength})`);
          }
          if (varDef.validation.pattern && !new RegExp(varDef.validation.pattern).test(value)) {
            throw new Error(`${key} does not match pattern`);
          }
        }

        if (varDef.type === 'number') {
          if (varDef.validation.min !== undefined && value < varDef.validation.min) {
            throw new Error(`${key} is too small (min: ${varDef.validation.min})`);
          }
          if (varDef.validation.max !== undefined && value > varDef.validation.max) {
            throw new Error(`${key} is too large (max: ${varDef.validation.max})`);
          }
        }

        if (varDef.validation.enum && !varDef.validation.enum.includes(value)) {
          throw new Error(`${key} must be one of: ${varDef.validation.enum.join(', ')}`);
        }
      }
    }
  }

  /**
   * Validate output against schema
   */
  private validateOutput(prompt: PromptDefinition, output: string): any {
    // Parse based on output format
    let parsed: any = output;

    if (prompt.outputFormat === 'json') {
      try {
        parsed = JSON.parse(output);
      } catch (error) {
        throw new Error('Invalid JSON output');
      }
    }

    // Validate against schema if provided
    if (prompt.outputSchema) {
      const valid = validateJSONSchema(parsed, prompt.outputSchema);
      if (!valid) {
        throw new Error('Output does not match schema');
      }
    }

    return parsed;
  }

  /**
   * Calculate cost based on token usage
   */
  private calculateCost(usage: TokenUsage, model: string): number {
    const pricing = MODEL_PRICING[model];
    if (!pricing) return 0;

    return (
      (usage.input / 1000) * pricing.input +
      (usage.output / 1000) * pricing.output
    );
  }

  private wrapResult<T>(data: T, metadata: any): PromptResult<T> {
    return {
      data,
      metadata,
    };
  }
}
```

---

## React Hooks API

```typescript
// packages/prompts/src/react/hooks.ts

/**
 * Hook to execute a prompt
 */
export function usePrompt<T = string>(
  prompt: PromptDefinition,
  options?: UsePromptOptions
) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [result, setResult] = useState<T | null>(null);
  const [cost, setCost] = useState(0);
  const [latency, setLatency] = useState(0);

  const executor = useMemo(() => new PromptExecutor(), []);

  const execute = useCallback(
    async (variables: Record<string, any>) => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await executor.execute<T>(prompt, variables, options);
        setResult(result.data);
        setCost(result.metadata.cost);
        setLatency(result.metadata.latency);
        return result.data;
      } catch (err) {
        setError(err as Error);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [prompt, executor, options]
  );

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
    setCost(0);
    setLatency(0);
  }, []);

  return {
    execute,
    result,
    isLoading,
    error,
    cost,
    latency,
    reset,
  };
}

/**
 * Hook to stream prompt execution
 */
export function usePromptStream(
  prompt: PromptDefinition,
  options?: UsePromptOptions
) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [chunks, setChunks] = useState<string[]>([]);
  const [error, setError] = useState<Error | null>(null);

  const stream = useCallback(
    async (variables: Record<string, any>) => {
      setIsStreaming(true);
      setChunks([]);
      setError(null);

      try {
        const executor = new PromptExecutor();
        const stream = await executor.stream(prompt, variables, options);

        for await (const chunk of stream) {
          setChunks(prev => [...prev, chunk]);
        }
      } catch (err) {
        setError(err as Error);
      } finally {
        setIsStreaming(false);
      }
    },
    [prompt, options]
  );

  return {
    stream,
    chunks,
    isStreaming,
    error,
    fullText: chunks.join(''),
  };
}

/**
 * Hook to A/B test prompt variants
 */
export function usePromptABTest<T = string>(
  variants: Array<{ prompt: PromptDefinition; weight: number }>,
  options?: UsePromptOptions
) {
  const selectedVariant = useMemo(() => {
    const total = variants.reduce((sum, v) => sum + v.weight, 0);
    const random = Math.random() * total;

    let cumulative = 0;
    for (const variant of variants) {
      cumulative += variant.weight;
      if (random <= cumulative) {
        return variant.prompt;
      }
    }

    return variants[0].prompt;
  }, [variants]);

  const { execute, ...rest } = usePrompt<T>(selectedVariant, {
    ...options,
    metadata: {
      ...options?.metadata,
      abTestVariant: selectedVariant.version,
    },
  });

  return {
    execute,
    variant: selectedVariant.version,
    ...rest,
  };
}
```

---

## CLI Commands

### Create Prompt

```bash
# Interactive creation
rana prompts create

╭──────────────────────────────────────────╮
│ Create New Prompt                        │
╰──────────────────────────────────────────╯

Prompt name: summarize-article
Description: Summarize article in bullet points

Select template:
  ○ Blank
  ● Summarization
  ○ Classification
  ○ Extraction
  ○ Generation
  ○ Q&A

Model: claude-sonnet-4
Temperature: 0.3
Max tokens: 1000

Variables:
  article (string, required)

Opening editor for prompt template...

✓ Prompt created: summarize-article v1.0.0
✓ Saved to: .rana/prompts/summarize-article.yml

Next steps:
1. Test prompt: rana prompts test summarize-article
2. Add examples: rana prompts examples add summarize-article
3. Deploy: rana prompts deploy summarize-article
```

### Test Prompt

```bash
# Test with sample input
rana prompts test summarize-article --input article="Long article text..."

╭──────────────────────────────────────────╮
│ Testing: summarize-article v1.0.0        │
╰──────────────────────────────────────────╯

Rendering template...
✓ Template valid

Executing prompt...
✓ Response received (1.2s)

Output:
• AI is transforming industries
• Key challenges include data quality
• Future outlook is promising

Metrics:
• Latency: 1.2s
• Tokens: 245 (input: 180, output: 65)
• Cost: $0.0024
• Quality: Pass

Would you like to save this as an example? (Y/n)
```

### Deploy Prompt

```bash
# Deploy to production
rana prompts deploy summarize-article --env production

╭──────────────────────────────────────────╮
│ Deploy Prompt                            │
╰──────────────────────────────────────────╯

Prompt: summarize-article
Version: 2.1.0 → production

Pre-deployment checks:
✓ All tests passed (8/8)
✓ Quality score: 92/100
✓ No breaking changes detected
✓ Examples validated

Deployment strategy:
• Canary: 10% traffic for 1 hour
• Monitor metrics: latency, cost, errors
• Auto-rollback if error rate > 5%

Continue? (Y/n) y

Deploying...
✓ Version 2.1.0 deployed to production
✓ Canary rollout started (10% traffic)

Monitor: rana prompts monitor summarize-article
```

### Analytics

```bash
# View analytics
rana prompts analytics summarize-article --last 30d --breakdown

╭────────────────────────────────────────────╮
│ Prompt Analytics: summarize-article       │
│ Version: 2.1.0                            │
│ Period: Last 30 days                      │
├────────────────────────────────────────────┤
│ Executions                                │
│ ██████████████████████████ 12,847         │
│                                           │
│ Success Rate                              │
│ ████████████████████████ 98.3%            │
│                                           │
│ Avg Latency                               │
│ ██████ 1.2s                               │
│                                           │
│ Total Cost                                │
│ $24.50 (avg $0.0019/call)                 │
├────────────────────────────────────────────┤
│ Breakdown by Variable                     │
│                                           │
│ Article Length:                           │
│ • 0-500 chars:     15% (1,927 calls)      │
│ • 500-2000 chars:  70% (8,993 calls)      │
│ • 2000+ chars:     15% (1,927 calls)      │
│                                           │
│ Content Type:                             │
│ • news:            62% (7,965 calls)      │
│ • blog:            28% (3,597 calls)      │
│ • technical:       10% (1,285 calls)      │
├────────────────────────────────────────────┤
│ Quality Metrics                           │
│                                           │
│ User Feedback:    4.6/5.0 (234 ratings)   │
│ Output Length:    142 chars (avg)         │
│ Follow-up Rate:   12%                     │
│                                           │
│ Common Issues:                            │
│ • Max length exceeded:    1.2% (154)      │
│ • Rate limit errors:      0.5% (64)       │
│ • Invalid output format:  0.1% (13)       │
╰────────────────────────────────────────────╯

Export report? (csv/json/pdf)
```

### Compare Versions

```bash
# Compare two versions
rana prompts compare summarize-article 2.0.0 2.1.0

╭────────────────────────────────────────────╮
│ Comparing Versions                        │
│ summarize-article: 2.0.0 vs 2.1.0         │
╰────────────────────────────────────────────╯

Template Changes:
  - You are an editor. Summarize this article.
  + You are a professional editor. Summarize this article in 3-5 bullet points.

  + Requirements:
  + - Focus on key insights
  + - Use clear, concise language
  + - Highlight actionable takeaways

Performance Comparison (30 days):

                   v2.0.0    v2.1.0    Change
Executions         8,234     12,847    +56%
Success Rate       96.8%     98.3%     +1.5%
Avg Latency        1.4s      1.2s      -14%
Avg Cost           $0.0025   $0.0019   -24%
User Rating        4.2/5     4.6/5     +9.5%

Recommendation: Deploy v2.1.0 ✓
Reasons:
• Lower latency (-14%)
• Lower cost (-24%)
• Higher user satisfaction (+9.5%)
• Higher success rate (+1.5%)
```

---

## A/B Testing Framework

```typescript
// packages/prompts/src/testing/ab-test.ts

export interface ABTestConfig {
  name: string;
  description: string;
  variants: Array<{
    name: string;
    prompt: PromptDefinition;
    traffic: number;              // 0-1, percentage of traffic
  }>;
  metrics: ABTestMetric[];
  duration: string;               // e.g., "7 days"
  targetSampleSize?: number;
  successCriteria: ABTestCriteria;
}

export interface ABTestMetric {
  name: string;
  type: 'latency' | 'cost' | 'quality' | 'custom';
  aggregation: 'avg' | 'p50' | 'p95' | 'p99' | 'sum';
  goal?: 'minimize' | 'maximize';
}

export interface ABTestCriteria {
  primary: {
    metric: string;
    threshold: number;
    operator: '>' | '<' | '>=' | '<=' | '=';
  };
  secondary?: Array<{
    metric: string;
    threshold: number;
    operator: '>' | '<' | '>=' | '<=' | '=';
  }>;
}

export class ABTestRunner {
  async runTest(config: ABTestConfig): Promise<ABTestResult> {
    // 1. Validate config
    this.validateConfig(config);

    // 2. Start test
    const testId = await this.startTest(config);

    // 3. Run for specified duration
    await this.monitorTest(testId, config.duration);

    // 4. Analyze results
    const results = await this.analyzeResults(testId);

    // 5. Determine winner
    const winner = this.determineWinner(results, config.successCriteria);

    // 6. Generate report
    const report = this.generateReport(results, winner);

    return {
      testId,
      winner,
      results,
      report,
    };
  }

  private async monitorTest(testId: string, duration: string): Promise<void> {
    const endTime = this.parseDuration(duration);

    while (Date.now() < endTime) {
      // Check for early stopping conditions
      const current = await this.getCurrentResults(testId);

      if (this.shouldStopEarly(current)) {
        console.log('Stopping test early due to significant difference');
        break;
      }

      // Wait before next check
      await this.sleep(3600000); // Check every hour
    }
  }

  private determineWinner(
    results: ABTestResults,
    criteria: ABTestCriteria
  ): string {
    const variants = Object.keys(results.variants);

    // Check primary criteria
    const primaryMetric = criteria.primary.metric;
    const sorted = variants.sort((a, b) => {
      const aValue = results.variants[a].metrics[primaryMetric];
      const bValue = results.variants[b].metrics[primaryMetric];

      if (criteria.primary.operator.includes('>')) {
        return bValue - aValue;
      } else {
        return aValue - bValue;
      }
    });

    const winner = sorted[0];
    const winnerValue = results.variants[winner].metrics[primaryMetric];

    // Verify meets threshold
    const meetsThreshold = this.checkThreshold(
      winnerValue,
      criteria.primary.threshold,
      criteria.primary.operator
    );

    if (!meetsThreshold) {
      return 'none'; // No clear winner
    }

    // Check secondary criteria
    if (criteria.secondary) {
      for (const secondary of criteria.secondary) {
        const value = results.variants[winner].metrics[secondary.metric];
        if (!this.checkThreshold(value, secondary.threshold, secondary.operator)) {
          return 'none'; // Fails secondary criteria
        }
      }
    }

    return winner;
  }
}

// CLI command
export async function abTestCommand(args: ABTestArgs) {
  const config: ABTestConfig = {
    name: args.name,
    description: args.description,
    variants: [
      {
        name: 'control',
        prompt: registry.getVersion(args.promptName, args.controlVersion)!,
        traffic: 0.5,
      },
      {
        name: 'variant',
        prompt: registry.getVersion(args.promptName, args.variantVersion)!,
        traffic: 0.5,
      },
    ],
    metrics: [
      { name: 'latency', type: 'latency', aggregation: 'p95', goal: 'minimize' },
      { name: 'cost', type: 'cost', aggregation: 'avg', goal: 'minimize' },
      { name: 'quality', type: 'quality', aggregation: 'avg', goal: 'maximize' },
    ],
    duration: args.duration || '7 days',
    successCriteria: {
      primary: {
        metric: 'quality',
        threshold: 0.05,        // 5% improvement
        operator: '>',
      },
      secondary: [
        {
          metric: 'cost',
          threshold: 1.2,       // Max 20% cost increase
          operator: '<',
        },
      ],
    },
  };

  console.log('Starting A/B test...');
  const runner = new ABTestRunner();
  const result = await runner.runTest(config);

  console.log(`\nTest complete! Winner: ${result.winner}`);
  console.log(result.report);
}
```

---

## Prompt Optimization

```typescript
// packages/prompts/src/optimization/optimizer.ts

export class PromptOptimizer {
  /**
   * Automatically optimize a prompt for cost and latency
   */
  async optimize(prompt: PromptDefinition): Promise<OptimizationResult> {
    const strategies: OptimizationStrategy[] = [
      this.compressPrompt,
      this.simplifyInstructions,
      this.reduceExamples,
      this.optimizeModel,
      this.adjustTemperature,
    ];

    const results: PromptDefinition[] = [];

    for (const strategy of strategies) {
      const optimized = await strategy.call(this, prompt);
      results.push(optimized);
    }

    // Test all variants
    const testResults = await this.testVariants(results);

    // Find best based on cost/performance tradeoff
    const best = this.selectBest(testResults);

    return {
      original: prompt,
      optimized: best.prompt,
      improvements: {
        costReduction: this.calculateCostReduction(prompt, best.prompt),
        latencyReduction: this.calculateLatencyReduction(prompt, best.prompt),
        qualityChange: this.calculateQualityChange(prompt, best.prompt),
      },
      recommendations: this.generateRecommendations(best),
    };
  }

  /**
   * Compress prompt while maintaining quality
   */
  private async compressPrompt(prompt: PromptDefinition): Promise<PromptDefinition> {
    const compressed = await this.llm.complete(`
Compress this prompt to reduce token count while maintaining all key instructions:

${prompt.template}

Rules:
- Remove redundant words
- Use concise language
- Keep all requirements
- Maintain clarity

Output: Compressed prompt
    `);

    return {
      ...prompt,
      template: compressed,
    };
  }

  /**
   * Suggest cheaper model if quality is maintained
   */
  private async optimizeModel(prompt: PromptDefinition): Promise<PromptDefinition> {
    const currentModel = prompt.model;
    const cheaperModels = this.getCheaperModels(currentModel);

    for (const model of cheaperModels) {
      const testPrompt = { ...prompt, model };
      const quality = await this.testQuality(testPrompt);

      // If quality is similar, use cheaper model
      if (quality >= 0.95) {  // 95% of original quality
        return testPrompt;
      }
    }

    return prompt;
  }

  /**
   * Generate optimization suggestions
   */
  async suggest(prompt: PromptDefinition): Promise<string[]> {
    const suggestions: string[] = [];

    // Check template length
    const templateTokens = this.estimateTokens(prompt.template);
    if (templateTokens > 1000) {
      suggestions.push(
        `Template is long (${templateTokens} tokens). Consider compressing it.`
      );
    }

    // Check model
    if (prompt.model === 'claude-opus-4') {
      suggestions.push(
        'Using most expensive model. Test if claude-sonnet-4 maintains quality.'
      );
    }

    // Check examples
    if (prompt.examples && prompt.examples.length > 5) {
      suggestions.push(
        `Using ${prompt.examples.length} examples. Test with 2-3 examples to reduce cost.`
      );
    }

    // Check temperature
    if (prompt.temperature === undefined || prompt.temperature > 0.7) {
      suggestions.push(
        'Consider lowering temperature for more consistent outputs and caching benefits.'
      );
    }

    // Check caching
    if (!prompt.analytics?.enabled) {
      suggestions.push(
        'Enable analytics to identify optimization opportunities.'
      );
    }

    return suggestions;
  }
}
```

---

## Storage & Persistence

```typescript
// packages/prompts/src/storage/storage.ts

export interface PromptStorage {
  save(prompt: PromptDefinition): Promise<void>;
  load(name: string, version?: string): Promise<PromptDefinition>;
  list(): Promise<PromptDefinition[]>;
  delete(name: string, version?: string): Promise<void>;
  export(names?: string[]): Promise<string>;
  import(data: string): Promise<void>;
}

/**
 * File-based storage (default)
 */
export class FileStorage implements PromptStorage {
  private basePath: string;

  constructor(basePath: string = '.rana/prompts') {
    this.basePath = basePath;
  }

  async save(prompt: PromptDefinition): Promise<void> {
    const dir = path.join(this.basePath, prompt.name);
    await fs.ensureDir(dir);

    const filePath = path.join(dir, `${prompt.version}.yml`);
    const yaml = YAML.stringify(prompt);

    await fs.writeFile(filePath, yaml, 'utf-8');

    // Also save as latest
    await fs.writeFile(
      path.join(dir, 'latest.yml'),
      yaml,
      'utf-8'
    );
  }

  async load(name: string, version?: string): Promise<PromptDefinition> {
    const dir = path.join(this.basePath, name);
    const filePath = version
      ? path.join(dir, `${version}.yml`)
      : path.join(dir, 'latest.yml');

    const content = await fs.readFile(filePath, 'utf-8');
    return YAML.parse(content);
  }

  async list(): Promise<PromptDefinition[]> {
    const dirs = await fs.readdir(this.basePath);
    const prompts: PromptDefinition[] = [];

    for (const dir of dirs) {
      try {
        const prompt = await this.load(dir);
        prompts.push(prompt);
      } catch (error) {
        // Skip invalid prompts
      }
    }

    return prompts;
  }
}

/**
 * Database storage (for teams)
 */
export class DatabaseStorage implements PromptStorage {
  private db: Database;

  async save(prompt: PromptDefinition): Promise<void> {
    await this.db.prompts.upsert({
      where: {
        name_version: {
          name: prompt.name,
          version: prompt.version,
        },
      },
      update: prompt,
      create: prompt,
    });
  }

  async load(name: string, version?: string): Promise<PromptDefinition> {
    if (version) {
      return this.db.prompts.findUnique({
        where: { name_version: { name, version } },
      });
    } else {
      return this.db.prompts.findFirst({
        where: { name },
        orderBy: { createdAt: 'desc' },
      });
    }
  }

  // ... other methods
}

/**
 * Cloud storage (Waymaker Cloud)
 */
export class CloudStorage implements PromptStorage {
  private apiClient: WaymakerAPIClient;

  async save(prompt: PromptDefinition): Promise<void> {
    await this.apiClient.post('/prompts', prompt);
  }

  async load(name: string, version?: string): Promise<PromptDefinition> {
    const params = version ? { version } : {};
    return this.apiClient.get(`/prompts/${name}`, { params });
  }

  // ... other methods
}
```

---

## Collaboration Features

```typescript
// packages/prompts/src/collaboration/workspace.ts

export interface Workspace {
  id: string;
  name: string;
  description: string;
  members: WorkspaceMember[];
  prompts: string[];              // Prompt IDs
  settings: WorkspaceSettings;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkspaceMember {
  userId: string;
  email: string;
  role: 'owner' | 'admin' | 'editor' | 'viewer';
  joinedAt: Date;
}

export interface Comment {
  id: string;
  promptId: string;
  version: string;
  author: string;
  content: string;
  resolved: boolean;
  createdAt: Date;
  replies: Comment[];
}

export interface Review {
  id: string;
  promptId: string;
  version: string;
  reviewer: string;
  status: 'pending' | 'approved' | 'rejected' | 'changes-requested';
  comments: string;
  createdAt: Date;
}

// CLI commands
rana prompts workspace create --name "Content Team"
rana prompts workspace invite user@example.com --role editor
rana prompts comment add summarize-article "Consider adding character limits"
rana prompts review request summarize-article --reviewer john@example.com
```

---

## Implementation Plan

### Phase 1: Core Infrastructure (Weeks 1-2)

**Deliverables:**
- Prompt definition types
- Prompt registry
- File-based storage
- Template rendering (Handlebars)
- Basic CLI (create, test, list)

**Success Criteria:**
- Can define and execute prompts
- Prompts persist to filesystem
- Variables validated

### Phase 2: Execution & Analytics (Weeks 3-4)

**Deliverables:**
- Prompt executor with caching
- Analytics tracker
- React hooks (usePrompt)
- CLI analytics command
- Cost calculation

**Success Criteria:**
- Track all executions
- View analytics dashboard
- Cost attribution working

### Phase 3: Versioning & Testing (Weeks 5-6)

**Deliverables:**
- Version management
- A/B testing framework
- Comparison tool
- Deployment workflows
- CLI deploy/rollback

**Success Criteria:**
- Can version prompts
- A/B tests run successfully
- Canary deployments work

### Phase 4: Optimization & Collaboration (Weeks 7-8)

**Deliverables:**
- Prompt optimizer
- Suggestion engine
- Workspace management
- Comments & reviews
- Cloud storage option

**Success Criteria:**
- Auto-optimization reduces costs
- Teams can collaborate
- Cloud sync works

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Prompts under management | 100+ |
| Teams using workspaces | 20+ |
| Avg cost reduction via optimization | 30% |
| Prompt version count (avg) | 3+ |
| A/B tests run per month | 50+ |
| User satisfaction | 4.5/5 |

---

**Status**: Draft Specification
**Version**: 1.0
**Last Updated**: 2025-11-25
**Next Review**: After Phase 1 completion
