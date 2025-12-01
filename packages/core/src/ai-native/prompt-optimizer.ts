/**
 * Automatic Prompt Optimization
 *
 * Uses techniques like:
 * - Prompt compression to reduce tokens while maintaining meaning
 * - Chain-of-thought optimization
 * - Few-shot example selection
 * - Prompt caching and versioning
 */

// ============================================================================
// Types
// ============================================================================

export type OptimizationStrategy =
  | 'compress' // Reduce tokens while maintaining meaning
  | 'chain-of-thought' // Add structured reasoning steps
  | 'few-shot' // Add relevant examples
  | 'structured' // Convert to structured format
  | 'hybrid'; // Combine multiple strategies

export type OptimizationGoal = 'cost' | 'quality' | 'speed' | 'balanced';

export interface OptimizationResult {
  original: string;
  optimized: string;
  strategy: OptimizationStrategy;
  metrics: {
    originalTokens: number;
    optimizedTokens: number;
    tokenReduction: number;
    estimatedCostSaving: number;
    qualityScore: number;
  };
  metadata: {
    compressionRatio: number;
    appliedTechniques: string[];
    processingTime: number;
  };
}

export interface FewShotExample {
  input: string;
  output: string;
  score?: number;
  category?: string;
}

export interface PromptTemplate {
  id: string;
  name: string;
  template: string;
  variables: string[];
  defaultValues?: Record<string, string>;
  examples?: FewShotExample[];
  metadata?: Record<string, unknown>;
}

export interface PromptVersion {
  id: string;
  templateId: string;
  version: number;
  content: string;
  metrics: {
    avgTokens: number;
    avgLatency: number;
    avgQuality: number;
    usageCount: number;
  };
  createdAt: Date;
  isActive: boolean;
}

export interface PromptOptimizerConfig {
  defaultStrategy?: OptimizationStrategy;
  defaultGoal?: OptimizationGoal;
  maxTokenReduction?: number; // Maximum % of tokens to remove
  qualityThreshold?: number; // Minimum quality score (0-1)
  enableCaching?: boolean;
  cacheMaxSize?: number;
  enableVersioning?: boolean;
  embeddingProvider?: (text: string) => Promise<number[]>;
}

// ============================================================================
// Compression Utilities
// ============================================================================

const FILLER_WORDS = new Set([
  'please',
  'kindly',
  'just',
  'simply',
  'basically',
  'actually',
  'really',
  'very',
  'quite',
  'rather',
  'somewhat',
  'perhaps',
  'maybe',
  'probably',
  'possibly',
  'certainly',
  'definitely',
  'absolutely',
  'honestly',
  'frankly',
  'literally',
  'essentially',
]);

const REDUNDANT_PHRASES: Record<string, string> = {
  'in order to': 'to',
  'due to the fact that': 'because',
  'in the event that': 'if',
  'at this point in time': 'now',
  'for the purpose of': 'for',
  'in spite of the fact that': 'although',
  'with regard to': 'about',
  'in reference to': 'about',
  'in terms of': 'regarding',
  'on the basis of': 'based on',
  'in the case of': 'for',
  'as a result of': 'because of',
  'in addition to': 'besides',
  'in the absence of': 'without',
  'prior to': 'before',
  'subsequent to': 'after',
  'in close proximity to': 'near',
  'a large number of': 'many',
  'a small number of': 'few',
  'the majority of': 'most',
  'at the present time': 'now',
  'in the near future': 'soon',
  'on a regular basis': 'regularly',
  'in a timely manner': 'promptly',
};

function removeFillerWords(text: string): string {
  const words = text.split(/\s+/);
  const filtered = words.filter(
    (word) => !FILLER_WORDS.has(word.toLowerCase().replace(/[.,!?;:]/g, ''))
  );
  return filtered.join(' ');
}

function replaceRedundantPhrases(text: string): string {
  let result = text.toLowerCase();
  for (const [phrase, replacement] of Object.entries(REDUNDANT_PHRASES)) {
    result = result.replace(new RegExp(phrase, 'gi'), replacement);
  }
  return result;
}

function removeExcessiveWhitespace(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

function estimateTokens(text: string): number {
  // Rough estimation: ~4 characters per token for English
  return Math.ceil(text.length / 4);
}

// ============================================================================
// Chain of Thought Templates
// ============================================================================

const COT_TEMPLATES = {
  reasoning: `Let's approach this step by step:
1. First, understand the problem: {problem}
2. Identify key information: {key_info}
3. Apply relevant knowledge: {knowledge}
4. Form a conclusion: {conclusion}`,

  analysis: `Analyzing the request:
- Input: {input}
- Goal: {goal}
- Constraints: {constraints}
- Approach: {approach}`,

  problem_solving: `Problem-solving process:
Step 1: Define the problem
{problem_definition}

Step 2: Gather information
{information}

Step 3: Generate solutions
{solutions}

Step 4: Evaluate and select
{evaluation}

Step 5: Implement
{implementation}`,
};

// ============================================================================
// Prompt Optimizer Class
// ============================================================================

export class PromptOptimizer {
  private config: Required<PromptOptimizerConfig>;
  private cache: Map<string, OptimizationResult>;
  private templates: Map<string, PromptTemplate>;
  private versions: Map<string, PromptVersion[]>;
  private examples: Map<string, FewShotExample[]>;

  constructor(config: PromptOptimizerConfig = {}) {
    this.config = {
      defaultStrategy: config.defaultStrategy ?? 'hybrid',
      defaultGoal: config.defaultGoal ?? 'balanced',
      maxTokenReduction: config.maxTokenReduction ?? 0.5,
      qualityThreshold: config.qualityThreshold ?? 0.7,
      enableCaching: config.enableCaching ?? true,
      cacheMaxSize: config.cacheMaxSize ?? 1000,
      enableVersioning: config.enableVersioning ?? true,
      embeddingProvider:
        config.embeddingProvider ??
        (async () => {
          // Default: simple hash-based "embedding"
          return [];
        }),
    };

    this.cache = new Map();
    this.templates = new Map();
    this.versions = new Map();
    this.examples = new Map();
  }

  // --------------------------------------------------------------------------
  // Core Optimization
  // --------------------------------------------------------------------------

  async optimize(
    prompt: string,
    options: {
      strategy?: OptimizationStrategy;
      goal?: OptimizationGoal;
      preserveInstructions?: boolean;
      maxTokens?: number;
    } = {}
  ): Promise<OptimizationResult> {
    const startTime = Date.now();
    const strategy = options.strategy ?? this.config.defaultStrategy;
    const goal = options.goal ?? this.config.defaultGoal;

    // Check cache
    const cacheKey = `${prompt}:${strategy}:${goal}`;
    if (this.config.enableCaching && this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    const originalTokens = estimateTokens(prompt);
    let optimized: string;
    const appliedTechniques: string[] = [];

    switch (strategy) {
      case 'compress':
        optimized = this.compress(prompt, options.preserveInstructions);
        appliedTechniques.push(
          'filler_removal',
          'phrase_replacement',
          'whitespace_normalization'
        );
        break;

      case 'chain-of-thought':
        optimized = this.addChainOfThought(prompt);
        appliedTechniques.push('cot_structure', 'reasoning_steps');
        break;

      case 'few-shot':
        optimized = await this.addFewShotExamples(prompt);
        appliedTechniques.push('example_selection', 'semantic_matching');
        break;

      case 'structured':
        optimized = this.structurePrompt(prompt);
        appliedTechniques.push('structure_extraction', 'format_optimization');
        break;

      case 'hybrid':
      default:
        optimized = await this.hybridOptimize(prompt, goal);
        appliedTechniques.push('multi_strategy', 'goal_optimization');
        break;
    }

    const optimizedTokens = estimateTokens(optimized);
    const tokenReduction = (originalTokens - optimizedTokens) / originalTokens;
    const qualityScore = this.estimateQuality(prompt, optimized);

    const result: OptimizationResult = {
      original: prompt,
      optimized,
      strategy,
      metrics: {
        originalTokens,
        optimizedTokens,
        tokenReduction,
        estimatedCostSaving: tokenReduction * 0.002, // Rough cost per token
        qualityScore,
      },
      metadata: {
        compressionRatio: optimizedTokens / originalTokens,
        appliedTechniques,
        processingTime: Date.now() - startTime,
      },
    };

    // Cache result
    if (this.config.enableCaching) {
      this.cacheResult(cacheKey, result);
    }

    return result;
  }

  // --------------------------------------------------------------------------
  // Compression Strategy
  // --------------------------------------------------------------------------

  compress(prompt: string, preserveInstructions = true): string {
    let result = prompt;

    // Step 1: Replace redundant phrases
    result = replaceRedundantPhrases(result);

    // Step 2: Remove filler words (carefully, if not preserving instructions)
    if (!preserveInstructions) {
      result = removeFillerWords(result);
    }

    // Step 3: Normalize whitespace
    result = removeExcessiveWhitespace(result);

    // Step 4: Remove duplicate sentences
    result = this.removeDuplicateSentences(result);

    return result;
  }

  private removeDuplicateSentences(text: string): string {
    const sentences = text.split(/(?<=[.!?])\s+/);
    const seen = new Set<string>();
    const unique: string[] = [];

    for (const sentence of sentences) {
      const normalized = sentence.toLowerCase().trim();
      if (!seen.has(normalized)) {
        seen.add(normalized);
        unique.push(sentence);
      }
    }

    return unique.join(' ');
  }

  // --------------------------------------------------------------------------
  // Chain of Thought Strategy
  // --------------------------------------------------------------------------

  addChainOfThought(prompt: string): string {
    // Detect prompt type and add appropriate CoT structure
    const isQuestion = prompt.includes('?');
    const isInstruction = /^(write|create|generate|make|build)/i.test(prompt);
    const isAnalysis = /^(analyze|evaluate|assess|review|examine)/i.test(
      prompt
    );

    if (isQuestion) {
      return `${prompt}

Let's think through this step by step:
1. First, let me understand what is being asked
2. Then, I'll consider the relevant information
3. Finally, I'll formulate a clear answer`;
    }

    if (isAnalysis) {
      return `${prompt}

I'll analyze this systematically:
1. Key observations
2. Patterns and relationships
3. Implications and conclusions`;
    }

    if (isInstruction) {
      return `${prompt}

I'll approach this task methodically:
1. Understand the requirements
2. Plan the structure
3. Execute step by step
4. Review and refine`;
    }

    // Default CoT addition
    return `${prompt}

Let me think about this carefully and provide a well-reasoned response.`;
  }

  // --------------------------------------------------------------------------
  // Few-Shot Strategy
  // --------------------------------------------------------------------------

  async addFewShotExamples(prompt: string): Promise<string> {
    // Find relevant examples from stored examples
    const relevantExamples = await this.findRelevantExamples(prompt, 3);

    if (relevantExamples.length === 0) {
      return prompt;
    }

    const examplesText = relevantExamples
      .map(
        (ex, i) =>
          `Example ${i + 1}:
Input: ${ex.input}
Output: ${ex.output}`
      )
      .join('\n\n');

    return `Here are some examples of how to handle similar requests:

${examplesText}

Now, please handle this request:
${prompt}`;
  }

  private async findRelevantExamples(
    prompt: string,
    count: number
  ): Promise<FewShotExample[]> {
    const allExamples = Array.from(this.examples.values()).flat();

    if (allExamples.length === 0) {
      return [];
    }

    // Simple keyword matching (in production, use embeddings)
    const promptWords = new Set(prompt.toLowerCase().split(/\s+/));

    const scored = allExamples.map((example) => {
      const exampleWords = new Set(example.input.toLowerCase().split(/\s+/));
      const overlap = [...promptWords].filter((w) =>
        exampleWords.has(w)
      ).length;
      return { example, score: overlap / promptWords.size };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, count).map((s) => s.example);
  }

  // --------------------------------------------------------------------------
  // Structured Format Strategy
  // --------------------------------------------------------------------------

  structurePrompt(prompt: string): string {
    // Extract components
    const components = this.extractPromptComponents(prompt);

    // Build structured format
    const sections: string[] = [];

    if (components.context) {
      sections.push(`## Context\n${components.context}`);
    }

    if (components.task) {
      sections.push(`## Task\n${components.task}`);
    }

    if (components.constraints.length > 0) {
      sections.push(
        `## Constraints\n${components.constraints.map((c) => `- ${c}`).join('\n')}`
      );
    }

    if (components.format) {
      sections.push(`## Expected Format\n${components.format}`);
    }

    return sections.join('\n\n');
  }

  private extractPromptComponents(prompt: string): {
    context: string;
    task: string;
    constraints: string[];
    format: string;
  } {
    // Simple extraction based on common patterns
    const lines = prompt.split('\n');
    const context: string[] = [];
    const constraints: string[] = [];
    let task = '';
    let format = '';

    for (const line of lines) {
      const trimmed = line.trim();

      if (
        trimmed.startsWith('-') ||
        trimmed.startsWith('•') ||
        trimmed.startsWith('*')
      ) {
        constraints.push(trimmed.slice(1).trim());
      } else if (
        /^(must|should|cannot|don't|do not|always|never)/i.test(trimmed)
      ) {
        constraints.push(trimmed);
      } else if (/^(format|output|return|respond)/i.test(trimmed)) {
        format = trimmed;
      } else if (
        /^(write|create|generate|analyze|explain|summarize)/i.test(trimmed)
      ) {
        task = trimmed;
      } else {
        context.push(trimmed);
      }
    }

    return {
      context: context.join(' ').trim(),
      task: task || prompt.slice(0, 200),
      constraints,
      format,
    };
  }

  // --------------------------------------------------------------------------
  // Hybrid Strategy
  // --------------------------------------------------------------------------

  private async hybridOptimize(
    prompt: string,
    goal: OptimizationGoal
  ): Promise<string> {
    let result = prompt;

    switch (goal) {
      case 'cost':
        // Focus on compression
        result = this.compress(result, false);
        break;

      case 'quality':
        // Add CoT and structure
        result = this.structurePrompt(result);
        result = this.addChainOfThought(result);
        break;

      case 'speed':
        // Compress aggressively
        result = this.compress(result, false);
        result = removeExcessiveWhitespace(result);
        break;

      case 'balanced':
      default:
        // Light compression + structure
        result = this.compress(result, true);
        result = this.structurePrompt(result);
        break;
    }

    return result;
  }

  // --------------------------------------------------------------------------
  // Quality Estimation
  // --------------------------------------------------------------------------

  private estimateQuality(original: string, optimized: string): number {
    // Simple heuristic-based quality estimation

    // Factor 1: Length preservation (too short = information loss)
    const lengthRatio = optimized.length / original.length;
    const lengthScore = Math.min(lengthRatio, 1);

    // Factor 2: Key term preservation
    const originalTerms = this.extractKeyTerms(original);
    const optimizedTerms = this.extractKeyTerms(optimized);
    const termPreservation =
      [...originalTerms].filter((t) => optimizedTerms.has(t)).length /
      originalTerms.size;

    // Factor 3: Structure preservation
    const hasStructure =
      optimized.includes('\n') ||
      optimized.includes(':') ||
      optimized.includes('-');
    const structureBonus = hasStructure ? 0.1 : 0;

    // Weighted average
    const score = lengthScore * 0.3 + termPreservation * 0.6 + structureBonus;

    return Math.min(Math.max(score, 0), 1);
  }

  private extractKeyTerms(text: string): Set<string> {
    const stopWords = new Set([
      'the',
      'a',
      'an',
      'is',
      'are',
      'was',
      'were',
      'be',
      'been',
      'being',
      'have',
      'has',
      'had',
      'do',
      'does',
      'did',
      'will',
      'would',
      'could',
      'should',
      'may',
      'might',
      'must',
      'shall',
      'can',
      'need',
      'dare',
      'ought',
      'used',
      'to',
      'of',
      'in',
      'for',
      'on',
      'with',
      'at',
      'by',
      'from',
      'as',
      'into',
      'through',
      'during',
      'before',
      'after',
      'above',
      'below',
      'between',
      'under',
      'again',
      'further',
      'then',
      'once',
      'and',
      'but',
      'or',
      'nor',
      'so',
      'yet',
      'both',
      'either',
      'neither',
      'not',
      'only',
      'own',
      'same',
      'than',
      'too',
      'very',
      'just',
      'also',
    ]);

    const words = text.toLowerCase().match(/\b[a-z]{3,}\b/g) || [];
    return new Set(words.filter((w) => !stopWords.has(w)));
  }

  // --------------------------------------------------------------------------
  // Caching
  // --------------------------------------------------------------------------

  private cacheResult(key: string, result: OptimizationResult): void {
    if (this.cache.size >= this.config.cacheMaxSize) {
      // Remove oldest entry
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }
    this.cache.set(key, result);
  }

  clearCache(): void {
    this.cache.clear();
  }

  // --------------------------------------------------------------------------
  // Template Management
  // --------------------------------------------------------------------------

  registerTemplate(template: PromptTemplate): void {
    this.templates.set(template.id, template);
    if (template.examples) {
      this.examples.set(template.id, template.examples);
    }
  }

  getTemplate(id: string): PromptTemplate | undefined {
    return this.templates.get(id);
  }

  fillTemplate(
    id: string,
    variables: Record<string, string>
  ): string | undefined {
    const template = this.templates.get(id);
    if (!template) return undefined;

    let result = template.template;
    for (const [key, value] of Object.entries(variables)) {
      result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
    }

    // Fill defaults for missing variables
    if (template.defaultValues) {
      for (const [key, value] of Object.entries(template.defaultValues)) {
        result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
      }
    }

    return result;
  }

  // --------------------------------------------------------------------------
  // Example Management
  // --------------------------------------------------------------------------

  addExamples(category: string, examples: FewShotExample[]): void {
    const existing = this.examples.get(category) || [];
    this.examples.set(category, [...existing, ...examples]);
  }

  getExamples(category: string): FewShotExample[] {
    return this.examples.get(category) || [];
  }

  // --------------------------------------------------------------------------
  // Batch Optimization
  // --------------------------------------------------------------------------

  async optimizeBatch(
    prompts: string[],
    options: {
      strategy?: OptimizationStrategy;
      goal?: OptimizationGoal;
    } = {}
  ): Promise<OptimizationResult[]> {
    return Promise.all(prompts.map((prompt) => this.optimize(prompt, options)));
  }

  // --------------------------------------------------------------------------
  // Statistics
  // --------------------------------------------------------------------------

  getStats(): {
    cacheSize: number;
    templateCount: number;
    exampleCount: number;
  } {
    let exampleCount = 0;
    for (const examples of this.examples.values()) {
      exampleCount += examples.length;
    }

    return {
      cacheSize: this.cache.size,
      templateCount: this.templates.size,
      exampleCount,
    };
  }
}

// ============================================================================
// Factory Function
// ============================================================================

export function createPromptOptimizer(
  config?: PromptOptimizerConfig
): PromptOptimizer {
  return new PromptOptimizer(config);
}

// ============================================================================
// Convenience Functions
// ============================================================================

let globalOptimizer: PromptOptimizer | null = null;

export function getGlobalOptimizer(): PromptOptimizer {
  if (!globalOptimizer) {
    globalOptimizer = createPromptOptimizer();
  }
  return globalOptimizer;
}

export async function optimizePrompt(
  prompt: string,
  options?: {
    strategy?: OptimizationStrategy;
    goal?: OptimizationGoal;
  }
): Promise<OptimizationResult> {
  return getGlobalOptimizer().optimize(prompt, options);
}

export function compressPrompt(
  prompt: string,
  preserveInstructions = true
): string {
  return getGlobalOptimizer().compress(prompt, preserveInstructions);
}
