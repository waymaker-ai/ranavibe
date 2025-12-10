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

// Quality exports
export { QualityValidator, qualityValidator } from './quality/validator';

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
 * Generate code from a natural language description (all-in-one)
 *
 * This is the main entry point for code generation. It combines
 * intent parsing, planning, generation, and validation.
 *
 * @example
 * ```typescript
 * const result = await generate('User authentication with OAuth');
 *
 * console.log(result.files);      // Generated files
 * console.log(result.plan);       // Implementation plan
 * console.log(result.validation); // Quality check results
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
}> {
  // Step 1: Parse intent
  const intent = await parseIntent(description, config);

  // Step 2: Create plan
  const plan = await createPlan(intent, config);

  // Step 3: Generate code
  const files = await generateFromPlan(plan, config);

  // Step 4: Validate
  const validation = await validateCode(files, config);

  return { intent, plan, files, validation };
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
