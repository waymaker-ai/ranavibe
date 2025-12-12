/**
 * @rana/generate - Natural Language Code Generation
 *
 * Generate production-ready code from natural language descriptions.
 *
 * @example
 * ```typescript
 * import { generate, parseIntent, createPlan } from '@rana/generate';
 *
 * // Quick generation
 * const files = await generate('User authentication with OAuth');
 *
 * // Step-by-step
 * const intent = await parseIntent('Add user dashboard with analytics');
 * const plan = await createPlan(intent);
 * const code = await generateFromPlan(plan);
 * ```
 *
 * @packageDocumentation
 */

// Engine exports
export { IntentParser, intentParser } from './engine/parser';
export { ImplementationPlanner, implementationPlanner } from './engine/planner';
export { ContextAnalyzer, contextAnalyzer } from './engine/context-analyzer';
export { CodeGenerator, codeGenerator } from './engine/generator';
export { GenerationExplainer, generationExplainer } from './engine/explainer';
export type { GenerationExplanation, FileExplanation, SecurityExplanation } from './engine/explainer';

// Quality exports
export { QualityValidator, qualityValidator } from './quality/validator';
export { AutoFixer, autoFixer } from './quality/auto-fixer';
export type { FixResult } from './quality/auto-fixer';

// Cache exports
export { LLMCache, createCachedProvider, llmCache } from './cache/llm-cache';
export type { CacheConfig, CacheStats, CachedLLMProvider } from './cache/llm-cache';

// Analytics exports
export { GenerationAnalytics, generationAnalytics } from './analytics/tracker';
export type { GenerationEvent, AnalyticsSummary, TrackerConfig } from './analytics/tracker';

// Template exports
export {
  getTemplate,
  getAllTemplates,
  getTemplatesByCategory,
  getTemplatesByFramework,
  getTemplatesByTags,
  searchTemplates,
} from './templates';

// Type exports
export type {
  // Core types
  Framework,
  FileType,
  Language,
  Complexity,

  // Intent types
  ParsedIntent,
  Entity,
  EntityField,
  EntityRelation,
  Action,
  Constraint,
  Integration,

  // Plan types
  ImplementationPlan,
  Step,
  Dependency,
  FileChange,
  TestPlan,
  TestCase,

  // Generation types
  GeneratedFile,
  GenerateRequest,
  GenerateOptions,
  GenerateResponse,
  GenerationMetrics,

  // Context types
  CodebaseContext,
  PackageInfo,
  FileTree,
  Component,
  ComponentProp,
  StyleGuide,
  CodePattern,
  TestingFramework,
  StateManagement,

  // Security types
  SecurityConstraints,
  SecurityRule,
  SecurityValidation,
  SecurityIssue,

  // Code style types
  CodeStyle,
  FormattingOptions,
  NamingConventions,
  DocumentationStyle,
  TestingStyle,

  // Validation types
  ValidationResult,
  ValidationError,
  ValidationWarning,

  // Template types
  Template,
  TemplateVariable,
  TemplateExample,

  // LLM types
  LLMProvider,
  LLMRequest,
  LLMResponse,

  // Integration types
  IntegrationResult,
  FilePlacement,
  FileModification,
  FileConflict,
} from './types';

// ============================================================================
// High-Level API
// ============================================================================

import { IntentParser } from './engine/parser';
import { ImplementationPlanner } from './engine/planner';
import { ContextAnalyzer } from './engine/context-analyzer';
import { CodeGenerator } from './engine/generator';
import { QualityValidator } from './quality/validator';
import { AutoFixer, FixResult } from './quality/auto-fixer';
import type {
  GeneratedFile,
  ParsedIntent,
  ImplementationPlan,
  CodebaseContext,
  GenerateOptions,
  ValidationResult,
} from './types';

export interface GenerateConfig {
  /** Working directory to analyze */
  cwd?: string;
  /** Target framework */
  framework?: 'react' | 'next' | 'express' | 'fastify' | 'node';
  /** Include test generation */
  includeTests?: boolean;
  /** Include documentation */
  includeDocs?: boolean;
  /** Run security audit */
  securityAudit?: boolean;
  /** Auto-fix issues after generation */
  autoFix?: boolean;
  /** Include detailed explanations of generation decisions */
  explain?: boolean;
  /** Track analytics for this generation (default: true) */
  trackAnalytics?: boolean;
  /** Enable LLM response caching for cost optimization */
  enableCache?: boolean;
  /** LLM provider for enhanced generation */
  llmProvider?: {
    complete(prompt: string): Promise<string>;
  };
}

/**
 * Parse a natural language description into structured intent
 *
 * @example
 * ```typescript
 * const intent = await parseIntent('User login form with validation');
 * console.log(intent.feature); // "User Login Form"
 * console.log(intent.entities); // [{ name: 'User', ... }]
 * ```
 */
export async function parseIntent(
  description: string,
  config?: GenerateConfig
): Promise<ParsedIntent> {
  const parser = new IntentParser({
    llmProvider: config?.llmProvider,
    defaultFramework: config?.framework,
  });

  return parser.parse(description);
}

/**
 * Create an implementation plan from parsed intent
 *
 * @example
 * ```typescript
 * const plan = await createPlan(intent);
 * console.log(plan.steps); // Step-by-step implementation
 * console.log(plan.dependencies); // npm packages needed
 * ```
 */
export async function createPlan(
  intent: ParsedIntent,
  config?: GenerateConfig
): Promise<ImplementationPlan> {
  let context: CodebaseContext | undefined;

  if (config?.cwd) {
    const analyzer = new ContextAnalyzer();
    context = await analyzer.analyze(config.cwd);
  }

  const planner = new ImplementationPlanner({
    llmProvider: config?.llmProvider,
    includeTests: config?.includeTests ?? true,
    includeDocs: config?.includeDocs ?? true,
  });

  return planner.createPlan(intent, context);
}

/**
 * Generate code from an implementation plan
 *
 * @example
 * ```typescript
 * const files = await generateFromPlan(plan);
 * for (const file of files) {
 *   console.log(file.path, file.content.length);
 * }
 * ```
 */
export async function generateFromPlan(
  plan: ImplementationPlan,
  config?: GenerateConfig
): Promise<GeneratedFile[]> {
  let context: CodebaseContext | undefined;

  if (config?.cwd) {
    const analyzer = new ContextAnalyzer();
    context = await analyzer.analyze(config.cwd);
  }

  const generator = new CodeGenerator({
    llmProvider: config?.llmProvider,
    includeTests: config?.includeTests ?? true,
    includeDocumentation: config?.includeDocs ?? true,
    securityAudit: config?.securityAudit ?? true,
  });

  return generator.generate(plan, context);
}

/**
 * Validate generated code against quality gates
 *
 * @example
 * ```typescript
 * const result = await validateCode(files);
 * console.log(result.passed); // true/false
 * console.log(result.score); // 0-100
 * ```
 */
export async function validateCode(
  files: GeneratedFile[],
  config?: GenerateConfig
): Promise<ValidationResult> {
  const validator = new QualityValidator({
    securityChecks: config?.securityAudit ?? true,
  });

  return validator.validate(files);
}

/**
 * Fix issues in generated code automatically
 *
 * @example
 * ```typescript
 * const validation = await validateCode(files);
 * if (!validation.passed) {
 *   const fixResults = await fixCode(files, validation);
 *   console.log(fixResults.map(r => r.changes));
 * }
 * ```
 */
export async function fixCode(
  files: GeneratedFile[],
  validation: ValidationResult,
  config?: GenerateConfig
): Promise<FixResult[]> {
  const fixer = new AutoFixer({
    llmProvider: config?.llmProvider,
  });

  return fixer.fix(files, validation.errors, validation.warnings);
}

/**
 * Generate code from a natural language description (all-in-one)
 *
 * This is the main entry point for code generation. It combines
 * intent parsing, planning, generation, validation, and optional auto-fixing.
 *
 * @example
 * ```typescript
 * const result = await generate('User authentication with OAuth', {
 *   autoFix: true, // Auto-fix any issues found
 *   explain: true, // Include explanations
 *   trackAnalytics: true, // Track generation analytics
 * });
 *
 * console.log(result.files);       // Generated files (possibly fixed)
 * console.log(result.plan);        // Implementation plan
 * console.log(result.validation);  // Quality check results
 * console.log(result.explanation); // Why decisions were made
 * console.log(result.fixes);       // Applied fixes (if autoFix enabled)
 * ```
 */
export async function generate(
  description: string,
  config?: GenerateConfig
): Promise<{
  intent: ParsedIntent;
  plan: ImplementationPlan;
  files: GeneratedFile[];
  validation: ValidationResult;
  explanation?: import('./engine/explainer').GenerationExplanation;
  fixes?: FixResult[];
  duration: number;
  cacheHit: boolean;
}> {
  const startTime = Date.now();
  let cacheHit = false;

  // Step 1: Parse intent
  const intent = await parseIntent(description, config);

  // Step 2: Create plan
  const plan = await createPlan(intent, config);

  // Step 3: Generate code
  let files = await generateFromPlan(plan, config);

  // Step 4: Validate
  let validation = await validateCode(files, config);

  // Step 5: Auto-fix if enabled and issues found
  let fixes: FixResult[] | undefined;
  if (config?.autoFix && !validation.passed) {
    fixes = await fixCode(files, validation, config);

    // Update files with fixed versions
    const fixedFiles = fixes.filter(f => f.fixed).map(f => f.file);
    if (fixedFiles.length > 0) {
      // Replace files with fixed versions
      files = files.map(file => {
        const fixed = fixedFiles.find(f => f.path === file.path);
        return fixed || file;
      });

      // Re-validate after fixes
      validation = await validateCode(files, config);
    }
  }

  // Step 6: Generate explanation if requested
  let explanation: import('./engine/explainer').GenerationExplanation | undefined;
  if (config?.explain) {
    const { GenerationExplainer } = await import('./engine/explainer');
    const explainer = new GenerationExplainer();
    explanation = explainer.explain(intent, plan, files, validation);
  }

  const duration = Date.now() - startTime;

  // Step 7: Track analytics if enabled
  if (config?.trackAnalytics !== false) {
    const { generationAnalytics } = await import('./analytics/tracker');
    await generationAnalytics.trackGeneration({
      description,
      framework: intent.framework,
      entities: intent.entities.map(e => e.name),
      filesGenerated: files.length,
      linesGenerated: files.reduce((sum, f) => sum + f.content.split('\n').length, 0),
      duration,
      success: validation.passed,
      validationScore: validation.score,
      errors: validation.errors.map(e => e.message),
      warnings: validation.warnings.map(w => w.message),
      cacheHit,
      estimatedCost: 0.05, // Estimate based on typical generation
    }).catch(() => {}); // Don't fail generation if analytics fails
  }

  return { intent, plan, files, validation, explanation, fixes, duration, cacheHit };
}

/**
 * Explain a previous generation result
 *
 * @example
 * ```typescript
 * const result = await generate('User login form');
 * const explanation = explainGeneration(result);
 * console.log(explanation.formatMarkdown());
 * ```
 */
export function explainGeneration(result: {
  intent: ParsedIntent;
  plan: ImplementationPlan;
  files: GeneratedFile[];
  validation?: ValidationResult;
}): import('./engine/explainer').GenerationExplanation {
  const { GenerationExplainer } = require('./engine/explainer');
  const explainer = new GenerationExplainer();
  return explainer.explain(result.intent, result.plan, result.files, result.validation);
}

/**
 * Get generation analytics summary
 *
 * @example
 * ```typescript
 * const stats = await getGenerationStats(30); // Last 30 days
 * console.log(stats.successRate);
 * console.log(stats.totalCost);
 * ```
 */
export async function getGenerationStats(days: number = 30): Promise<import('./analytics/tracker').AnalyticsSummary> {
  const { generationAnalytics } = await import('./analytics/tracker');
  return generationAnalytics.getSummary(days);
}

/**
 * Analyze an existing codebase
 *
 * @example
 * ```typescript
 * const context = await analyzeCodebase('./my-project');
 * console.log(context.framework); // 'next'
 * console.log(context.dependencies); // Package list
 * ```
 */
export async function analyzeCodebase(cwd: string): Promise<CodebaseContext> {
  const analyzer = new ContextAnalyzer();
  return analyzer.analyze(cwd);
}

// Default export
export default generate;
