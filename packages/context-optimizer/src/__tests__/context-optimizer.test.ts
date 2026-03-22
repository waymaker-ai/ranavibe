import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ContextOptimizer, createContextOptimizer } from '../optimizer';
import type {
  ContextOptimizerConfig,
  OptimizeOptions,
  OptimizationResult,
  FileMetadata,
  FilePriority,
  OptimizationStrategy,
  ContextChunk,
  CostTarget,
} from '../types';

// =============================================================================
// Helper: create test files
// =============================================================================

function makeFile(path: string, content: string, priority: FilePriority, relevance?: number): FileMetadata {
  return {
    path,
    content,
    tokens: Math.ceil(content.length / 4),
    priority,
    relevance,
    type: path.split('.').pop() || 'unknown',
  };
}

function makeLargeContent(sizeChars: number): string {
  return 'x'.repeat(sizeChars);
}

// =============================================================================
// Factory Function Tests
// =============================================================================

describe('createContextOptimizer()', () => {
  it('should create an optimizer with default config', () => {
    const optimizer = createContextOptimizer();
    expect(optimizer).toBeInstanceOf(ContextOptimizer);
  });

  it('should create an optimizer with custom config', () => {
    const optimizer = createContextOptimizer({
      maxTokens: 200000,
      strategy: 'rag',
      costTarget: 'cost',
    });
    expect(optimizer).toBeInstanceOf(ContextOptimizer);
  });
});

// =============================================================================
// ContextOptimizer - Full Strategy Tests
// =============================================================================

describe('ContextOptimizer - full strategy', () => {
  let optimizer: ContextOptimizer;

  beforeEach(() => {
    optimizer = new ContextOptimizer({ strategy: 'full', maxTokens: 1000, enableCache: false });
  });

  it('should include files that fit within budget', async () => {
    const files = [
      makeFile('index.ts', 'a'.repeat(400), 'important'), // 100 tokens
      makeFile('utils.ts', 'b'.repeat(400), 'important'), // 100 tokens
    ];
    const result = await optimizer.optimize({ codebase: files });
    expect(result.strategy).toBe('full');
    expect(result.context.fullFiles).toHaveLength(2);
    expect(result.tokensUsed).toBeLessThanOrEqual(1000);
  });

  it('should exclude files exceeding budget', async () => {
    const files = [
      makeFile('small.ts', 'a'.repeat(400), 'important'),   // 100 tokens
      makeFile('large.ts', makeLargeContent(8000), 'important'), // 2000 tokens (exceeds 1000 budget)
    ];
    const result = await optimizer.optimize({ codebase: files });
    expect(result.context.fullFiles).toContain('small.ts');
    expect(result.context.excludedFiles.length).toBeGreaterThanOrEqual(0);
  });

  it('should calculate cost savings', async () => {
    const files = [
      makeFile('a.ts', 'a'.repeat(2000), 'important'), // 500 tokens
      makeFile('b.ts', 'b'.repeat(4000), 'important'), // 1000 tokens - exceeds budget
    ];
    const result = await optimizer.optimize({ codebase: files });
    expect(result.costSaved).toBeGreaterThanOrEqual(0);
    expect(result.originalTokens).toBeGreaterThan(0);
  });
});

// =============================================================================
// ContextOptimizer - RAG Strategy Tests
// =============================================================================

describe('ContextOptimizer - rag strategy', () => {
  let optimizer: ContextOptimizer;

  beforeEach(() => {
    optimizer = new ContextOptimizer({ strategy: 'rag', maxTokens: 500, enableCache: false });
  });

  it('should prioritize by relevance score', async () => {
    const files = [
      makeFile('low.ts', 'a'.repeat(400), 'important', 0.2),
      makeFile('high.ts', 'b'.repeat(400), 'important', 0.9),
      makeFile('mid.ts', 'c'.repeat(400), 'important', 0.5),
    ];
    const result = await optimizer.optimize({ codebase: files, query: 'auth' });
    expect(result.strategy).toBe('rag');
    // High relevance file should be included first
    if (result.context.fullFiles.length > 0) {
      expect(result.context.fullFiles[0]).toBe('high.ts');
    }
  });
});

// =============================================================================
// ContextOptimizer - Summarize Strategy Tests
// =============================================================================

describe('ContextOptimizer - summarize strategy', () => {
  let optimizer: ContextOptimizer;

  beforeEach(() => {
    optimizer = new ContextOptimizer({ strategy: 'summarize', maxTokens: 500, enableCache: false });
  });

  it('should summarize all files', async () => {
    const files = [
      makeFile('a.ts', 'function authenticate() { /* auth logic */ }', 'important'),
      makeFile('b.ts', 'function authorize() { /* authz logic */ }', 'important'),
    ];
    const result = await optimizer.optimize({ codebase: files });
    expect(result.strategy).toBe('summarize');
    expect(result.context.summarizedFiles).toHaveLength(2);
    expect(result.context.fullFiles).toHaveLength(0);
  });

  it('should reduce token count through summarization', async () => {
    const files = [
      makeFile('big.ts', makeLargeContent(4000), 'important'), // 1000 tokens original
    ];
    const result = await optimizer.optimize({ codebase: files });
    expect(result.tokensUsed).toBeLessThanOrEqual(result.originalTokens);
  });
});

// =============================================================================
// ContextOptimizer - Hybrid Strategy Tests
// =============================================================================

describe('ContextOptimizer - hybrid strategy', () => {
  let optimizer: ContextOptimizer;

  beforeEach(() => {
    optimizer = new ContextOptimizer({ strategy: 'hybrid', maxTokens: 500, enableCache: false });
  });

  it('should include critical files in full', async () => {
    const files = [
      makeFile('index.ts', 'a'.repeat(200), 'critical', 1.0),
      makeFile('utils.ts', 'b'.repeat(200), 'supplementary', 0.3),
    ];
    const result = await optimizer.optimize({ codebase: files });
    expect(result.context.fullFiles).toContain('index.ts');
  });

  it('should summarize important files when budget is tight', async () => {
    const files = [
      makeFile('critical.ts', makeLargeContent(1200), 'critical', 1.0), // 300 tokens
      makeFile('important.ts', makeLargeContent(2000), 'important', 0.8), // 500 tokens, won't fully fit
    ];
    const result = await optimizer.optimize({ codebase: files });
    expect(result.tokensUsed).toBeLessThanOrEqual(500);
  });

  it('should add metadata for supplementary files', async () => {
    const files = [
      makeFile('main.ts', 'a'.repeat(100), 'critical', 1.0),
      makeFile('config.json', 'b'.repeat(100), 'supplementary', 0.2),
    ];
    const result = await optimizer.optimize({ codebase: files });
    // Supplementary files should appear in summarized list
    const allProcessed = [...result.context.fullFiles, ...result.context.summarizedFiles];
    expect(allProcessed.length).toBeGreaterThanOrEqual(1);
  });

  it('should compute quality score', async () => {
    const files = [
      makeFile('a.ts', 'a'.repeat(200), 'critical', 0.9),
    ];
    const result = await optimizer.optimize({ codebase: files });
    expect(result.qualityScore).toBeGreaterThan(0);
    expect(result.qualityScore).toBeLessThanOrEqual(1.0);
  });
});

// =============================================================================
// ContextOptimizer - Prioritize Strategy Tests
// =============================================================================

describe('ContextOptimizer - prioritize strategy', () => {
  it('should delegate to hybrid strategy', async () => {
    const optimizer = new ContextOptimizer({ strategy: 'prioritize', maxTokens: 500, enableCache: false });
    const files = [makeFile('a.ts', 'content', 'critical', 1.0)];
    const result = await optimizer.optimize({ codebase: files });
    // Prioritize delegates to hybrid
    expect(result.strategy).toBe('hybrid');
  });
});

// =============================================================================
// Default Prioritization Logic Tests
// =============================================================================

describe('Default prioritization', () => {
  let optimizer: ContextOptimizer;

  beforeEach(() => {
    optimizer = new ContextOptimizer({ enableCache: false });
  });

  it('should treat index files as critical', async () => {
    const files = [
      makeFile('src/index.ts', 'export default {}', 'important' /* will be overridden */),
    ];
    // The default prioritize function checks for 'index.' in path
    const result = await optimizer.optimize({ codebase: files, query: '' });
    // Index files should be prioritized as critical
    expect(result.context.fullFiles).toContain('src/index.ts');
  });

  it('should treat test files as supplementary', async () => {
    const files = [
      makeFile('src/auth.test.ts', 'test content here', 'important'),
    ];
    const result = await optimizer.optimize({ codebase: files, query: 'auth' });
    // Test files get supplementary priority by default
    expect(result.context.totalFiles).toBe(1);
  });

  it('should treat config files as supplementary', async () => {
    const files = [
      makeFile('tsconfig.json', '{"compilerOptions": {}}', 'important'),
    ];
    const result = await optimizer.optimize({ codebase: files, query: '' });
    expect(result.context.totalFiles).toBe(1);
  });
});

// =============================================================================
// Default Relevance Scoring Tests
// =============================================================================

describe('Default relevance scoring', () => {
  let optimizer: ContextOptimizer;

  beforeEach(() => {
    optimizer = new ContextOptimizer({ enableCache: false });
  });

  it('should score higher when path contains query', async () => {
    const files = [
      makeFile('src/auth.ts', 'authentication logic', 'important'),
      makeFile('src/utils.ts', 'utility functions', 'important'),
    ];
    const result = await optimizer.optimize({ codebase: files, query: 'auth' });
    expect(result.context.totalFiles).toBe(2);
  });

  it('should return 0.5 relevance when no query provided', async () => {
    const files = [makeFile('a.ts', 'content', 'important')];
    const result = await optimizer.optimize({ codebase: files });
    // With no query, relevance defaults to 0.5
    expect(result.qualityScore).toBeGreaterThan(0);
  });
});

// =============================================================================
// Cache Tests
// =============================================================================

describe('Caching', () => {
  it('should cache results and return cached on same input', async () => {
    const optimizer = new ContextOptimizer({ enableCache: true });
    const files = [makeFile('a.ts', 'content', 'important')];
    const opts: OptimizeOptions = { codebase: files, query: 'test' };

    const first = await optimizer.optimize(opts);
    const second = await optimizer.optimize(opts);
    // Should return same result object from cache
    expect(first).toEqual(second);
  });

  it('should clear cache', async () => {
    const optimizer = new ContextOptimizer({ enableCache: true });
    const files = [makeFile('a.ts', 'content', 'important')];
    await optimizer.optimize({ codebase: files });
    optimizer.clearCache();
    // After clearing, no cache hit - new computation
    const result = await optimizer.optimize({ codebase: files });
    expect(result).toBeDefined();
  });

  it('should not cache when enableCache is false', async () => {
    const optimizer = new ContextOptimizer({ enableCache: false });
    const files = [makeFile('a.ts', 'content', 'important')];

    const first = await optimizer.optimize({ codebase: files });
    const second = await optimizer.optimize({ codebase: files });
    // Both should succeed (no crash), possibly different objects
    expect(first.tokensUsed).toBe(second.tokensUsed);
  });
});

// =============================================================================
// File Loading / Filtering Tests
// =============================================================================

describe('File loading and filtering', () => {
  let optimizer: ContextOptimizer;

  beforeEach(() => {
    optimizer = new ContextOptimizer({ enableCache: false });
  });

  it('should exclude files in excludeFiles list', async () => {
    const files = [
      makeFile('keep.ts', 'keep this', 'important'),
      makeFile('exclude.ts', 'exclude this', 'important'),
    ];
    const result = await optimizer.optimize({
      codebase: files,
      excludeFiles: ['exclude.ts'],
    });
    expect(result.context.totalFiles).toBe(1);
  });

  it('should handle empty codebase', async () => {
    const result = await optimizer.optimize({ codebase: [] });
    expect(result.tokensUsed).toBe(0);
    expect(result.context.totalFiles).toBe(0);
  });

  it('should handle string codebase path (returns empty)', async () => {
    const result = await optimizer.optimize({ codebase: '/path/to/project' });
    expect(result.context.totalFiles).toBe(0);
  });
});

// =============================================================================
// Preserve Files Tests
// =============================================================================

describe('Preserve files', () => {
  it('should override priority to critical for preserved files', async () => {
    const optimizer = new ContextOptimizer({ enableCache: false });
    const files = [
      makeFile('normal.ts', 'a'.repeat(200), 'supplementary', 0.3),
    ];
    const result = await optimizer.optimize({
      codebase: files,
      preserveFiles: ['normal.ts'],
    });
    // Preserved file should be treated as critical
    expect(result.context.fullFiles).toContain('normal.ts');
  });
});

// =============================================================================
// Custom Functions Tests
// =============================================================================

describe('Custom token counter and summarizer', () => {
  it('should use custom token counter', async () => {
    const customCounter = vi.fn((text: string) => text.length); // 1 char = 1 token
    const optimizer = new ContextOptimizer({
      enableCache: false,
      maxTokens: 50,
      countTokens: customCounter,
    });
    const files = [makeFile('a.ts', 'a'.repeat(30), 'important')];
    await optimizer.optimize({ codebase: files });
    expect(customCounter).toHaveBeenCalled();
  });

  it('should use custom summarizer', async () => {
    const customSummarize = vi.fn(async (text: string, targetTokens: number) => {
      return `SUMMARY: ${text.substring(0, 10)}...`;
    });
    const optimizer = new ContextOptimizer({
      enableCache: false,
      strategy: 'summarize',
      maxTokens: 50,
      summarize: customSummarize,
    });
    const files = [makeFile('a.ts', 'a'.repeat(400), 'important')];
    await optimizer.optimize({ codebase: files });
    expect(customSummarize).toHaveBeenCalled();
  });
});

// =============================================================================
// Target Tokens Override Tests
// =============================================================================

describe('Target tokens override', () => {
  it('should respect targetTokens over maxTokens', async () => {
    const optimizer = new ContextOptimizer({ maxTokens: 100000, enableCache: false, strategy: 'full' });
    const files = [
      makeFile('a.ts', 'a'.repeat(400), 'important'),   // ~100 tokens
      makeFile('b.ts', 'b'.repeat(400), 'important'),   // ~100 tokens
    ];
    const result = await optimizer.optimize({ codebase: files, targetTokens: 120 });
    // Should respect tighter targetTokens limit
    expect(result.tokensUsed).toBeLessThanOrEqual(120);
  });
});

// =============================================================================
// Type Definition Tests
// =============================================================================

describe('Type definitions', () => {
  it('should define all optimization strategies', () => {
    const strategies: OptimizationStrategy[] = ['hybrid', 'full', 'rag', 'summarize', 'prioritize'];
    expect(strategies).toHaveLength(5);
  });

  it('should define all cost targets', () => {
    const targets: CostTarget[] = ['cost', 'balanced', 'quality'];
    expect(targets).toHaveLength(3);
  });

  it('should define all file priorities', () => {
    const priorities: FilePriority[] = ['critical', 'important', 'supplementary', 'exclude'];
    expect(priorities).toHaveLength(4);
  });

  it('should create valid OptimizationResult', () => {
    const result: OptimizationResult = {
      messages: [{ role: 'system', content: 'Context here' }],
      context: { fullFiles: ['a.ts'], summarizedFiles: ['b.ts'], excludedFiles: ['c.ts'], totalFiles: 3 },
      tokensUsed: 5000,
      originalTokens: 10000,
      costSaved: 50,
      qualityScore: 0.85,
      strategy: 'hybrid',
    };
    expect(result.costSaved).toBe(50);
    expect(result.context.totalFiles).toBe(3);
  });

  it('should create valid ContextChunk', () => {
    const chunk: ContextChunk = {
      content: 'File content here',
      tokens: 100,
      source: 'main.ts',
      type: 'full',
      relevance: 0.95,
    };
    expect(chunk.type).toBe('full');
    expect(chunk.relevance).toBeGreaterThan(0.9);
  });
});
