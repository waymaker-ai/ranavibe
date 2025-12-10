import { z } from 'zod';

// ============================================================================
// Core Types
// ============================================================================

export type Framework = 'react' | 'next' | 'express' | 'fastify' | 'node' | 'unknown';
export type FileType = 'component' | 'api' | 'util' | 'test' | 'config' | 'schema' | 'style';
export type Language = 'typescript' | 'javascript' | 'json' | 'yaml' | 'sql' | 'prisma';
export type Complexity = 'simple' | 'moderate' | 'complex';

// ============================================================================
// Intent Parser Types
// ============================================================================

export interface Entity {
  name: string;
  fields: EntityField[];
  relations: EntityRelation[];
}

export interface EntityField {
  name: string;
  type: string;
  required: boolean;
  unique?: boolean;
  default?: string;
}

export interface EntityRelation {
  type: 'one-to-one' | 'one-to-many' | 'many-to-many';
  target: string;
  through?: string;
}

export interface Action {
  name: string;
  type: 'create' | 'read' | 'update' | 'delete' | 'auth' | 'payment' | 'upload' | 'custom';
  description: string;
}

export interface Constraint {
  type: 'security' | 'performance' | 'ux' | 'accessibility' | 'compliance';
  requirement: string;
  priority: 'required' | 'preferred' | 'optional';
}

export interface Integration {
  service: string;
  purpose: string;
  required: boolean;
}

export interface ParsedIntent {
  feature: string;
  description: string;
  entities: Entity[];
  actions: Action[];
  constraints: Constraint[];
  framework: Framework;
  integrations: Integration[];
  tags: string[];
}

// ============================================================================
// Implementation Planner Types
// ============================================================================

export interface Step {
  id: string;
  description: string;
  type: 'create' | 'modify' | 'delete';
  files: string[];
  dependencies: string[];
  estimatedLines: number;
  order: number;
}

export interface Dependency {
  name: string;
  version: string;
  dev: boolean;
  reason: string;
}

export interface FileChange {
  path: string;
  type: 'create' | 'modify' | 'delete';
  description: string;
}

export interface TestPlan {
  file: string;
  testCases: TestCase[];
  coverage: number;
}

export interface TestCase {
  name: string;
  type: 'unit' | 'integration' | 'e2e';
  description: string;
}

export interface ImplementationPlan {
  steps: Step[];
  dependencies: Dependency[];
  estimatedComplexity: Complexity;
  files: FileChange[];
  tests: TestPlan[];
  estimatedTime: string;
  securityNotes: string[];
}

// ============================================================================
// Code Generator Types
// ============================================================================

export interface GeneratedFile {
  path: string;
  content: string;
  type: FileType;
  language: Language;
  tests?: string;
  documentation?: string;
  securityNotes?: string[];
}

export interface GenerateRequest {
  intent: string;
  context?: CodebaseContext;
  constraints?: SecurityConstraints;
  style?: CodeStyle;
  framework?: Framework;
  options?: GenerateOptions;
}

export interface GenerateOptions {
  dryRun?: boolean;
  includeTests?: boolean;
  includeDocumentation?: boolean;
  securityAudit?: boolean;
  interactive?: boolean;
  provider?: string;
  model?: string;
  maxCost?: number;
}

export interface GenerateResponse {
  plan: ImplementationPlan;
  files: GeneratedFile[];
  tests: GeneratedFile[];
  documentation: string;
  securityNotes: string[];
  metrics: GenerationMetrics;
}

export interface GenerationMetrics {
  filesGenerated: number;
  linesOfCode: number;
  testsGenerated: number;
  securityScore: number;
  timeToGenerate: number;
  llmCalls: number;
  estimatedCost: number;
}

// ============================================================================
// Context Analyzer Types
// ============================================================================

export interface CodebaseContext {
  framework: Framework;
  dependencies: PackageInfo[];
  fileStructure: FileTree;
  existingComponents: Component[];
  styleGuide: StyleGuide;
  patterns: CodePattern[];
  testingFramework: TestingFramework;
  stateManagement: StateManagement;
}

export interface PackageInfo {
  name: string;
  version: string;
  type: 'dependency' | 'devDependency';
}

export interface FileTree {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileTree[];
}

export interface Component {
  name: string;
  path: string;
  props: ComponentProp[];
  exports: string[];
  imports: string[];
  patterns: string[];
}

export interface ComponentProp {
  name: string;
  type: string;
  required: boolean;
  default?: string;
}

export interface StyleGuide {
  indentation: 'tabs' | 'spaces';
  indentSize: number;
  quotes: 'single' | 'double';
  semicolons: boolean;
  trailingCommas: 'none' | 'es5' | 'all';
  componentStyle: 'function' | 'arrow' | 'class';
  namingConvention: 'camelCase' | 'PascalCase' | 'kebab-case' | 'snake_case';
  importStyle: 'named' | 'default' | 'mixed';
}

export interface CodePattern {
  name: string;
  type: 'component' | 'hook' | 'utility' | 'api' | 'test';
  description: string;
  example: string;
}

export type TestingFramework = 'jest' | 'vitest' | 'mocha' | 'playwright' | 'cypress' | 'unknown';
export type StateManagement = 'redux' | 'zustand' | 'jotai' | 'recoil' | 'context' | 'none' | 'unknown';

// ============================================================================
// Security Types
// ============================================================================

export interface SecurityConstraints {
  owaspCompliance: boolean;
  inputValidation: boolean;
  outputEncoding: boolean;
  csrfProtection: boolean;
  rateLimiting: boolean;
  auditLogging: boolean;
  encryption: boolean;
  customRules?: SecurityRule[];
}

export interface SecurityRule {
  id: string;
  name: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  check: string;
  fix?: string;
}

export interface SecurityValidation {
  passed: boolean;
  score: number;
  issues: SecurityIssue[];
  suggestions: string[];
}

export interface SecurityIssue {
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: string;
  file: string;
  line?: number;
  message: string;
  fix?: string;
}

// ============================================================================
// Code Style Types
// ============================================================================

export interface CodeStyle {
  formatting: FormattingOptions;
  naming: NamingConventions;
  documentation: DocumentationStyle;
  testing: TestingStyle;
}

export interface FormattingOptions {
  maxLineLength: number;
  indentStyle: 'tabs' | 'spaces';
  indentSize: number;
  quotes: 'single' | 'double';
  semicolons: boolean;
  trailingCommas: 'none' | 'es5' | 'all';
}

export interface NamingConventions {
  components: 'PascalCase';
  functions: 'camelCase';
  variables: 'camelCase';
  constants: 'UPPER_SNAKE_CASE';
  files: 'kebab-case' | 'PascalCase' | 'camelCase';
}

export interface DocumentationStyle {
  format: 'jsdoc' | 'tsdoc' | 'none';
  requireDescription: boolean;
  requireParams: boolean;
  requireReturns: boolean;
  requireExamples: boolean;
}

export interface TestingStyle {
  framework: TestingFramework;
  pattern: 'describe-it' | 'test';
  coverage: number;
  includeIntegration: boolean;
  includeE2E: boolean;
}

// ============================================================================
// Validation Types
// ============================================================================

export interface ValidationResult {
  passed: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  score: number;
  suggestions: string[];
}

export interface ValidationError {
  type: string;
  file: string;
  line?: number;
  message: string;
  severity: 'error';
  autoFixable: boolean;
}

export interface ValidationWarning {
  type: string;
  file: string;
  line?: number;
  message: string;
  severity: 'warning';
  suggestion?: string;
}

// ============================================================================
// Template Types
// ============================================================================

export interface Template {
  id: string;
  name: string;
  description: string;
  category: 'component' | 'api' | 'database' | 'auth' | 'payment' | 'utility' | 'security';
  framework: Framework[];
  tags: string[];
  code: string;
  tests: string;
  documentation: string;
  variables: TemplateVariable[];
  examples: TemplateExample[];
}

export interface TemplateVariable {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description: string;
  required: boolean;
  default?: unknown;
  validation?: string;
}

export interface TemplateExample {
  description: string;
  variables: Record<string, unknown>;
}

// ============================================================================
// LLM Provider Types
// ============================================================================

export interface LLMProvider {
  name: string;
  generate(request: LLMRequest): Promise<LLMResponse>;
  refine(feedback: string, previous: LLMResponse): Promise<LLMResponse>;
  explain(code: string): Promise<string>;
}

export interface LLMRequest {
  prompt: string;
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
  model?: string;
}

export interface LLMResponse {
  content: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string;
  cost: number;
}

// ============================================================================
// Integration Types
// ============================================================================

export interface IntegrationResult {
  placements: FilePlacement[];
  conflicts: FileConflict[];
  suggestions: string[];
}

export interface FilePlacement {
  file: GeneratedFile;
  path: string;
  imports: string[];
  exports: string[];
  modifications: FileModification[];
}

export interface FileModification {
  file: string;
  type: 'add-import' | 'add-export' | 'update-config' | 'update-route';
  content: string;
  location?: string;
}

export interface FileConflict {
  path: string;
  type: 'exists' | 'naming' | 'import';
  resolution: 'overwrite' | 'rename' | 'merge' | 'skip';
  message: string;
}

// ============================================================================
// Zod Schemas for Runtime Validation
// ============================================================================

export const ParsedIntentSchema = z.object({
  feature: z.string(),
  description: z.string(),
  entities: z.array(z.object({
    name: z.string(),
    fields: z.array(z.object({
      name: z.string(),
      type: z.string(),
      required: z.boolean(),
      unique: z.boolean().optional(),
      default: z.string().optional(),
    })),
    relations: z.array(z.object({
      type: z.enum(['one-to-one', 'one-to-many', 'many-to-many']),
      target: z.string(),
      through: z.string().optional(),
    })),
  })),
  actions: z.array(z.object({
    name: z.string(),
    type: z.enum(['create', 'read', 'update', 'delete', 'auth', 'payment', 'upload', 'custom']),
    description: z.string(),
  })),
  constraints: z.array(z.object({
    type: z.enum(['security', 'performance', 'ux', 'accessibility', 'compliance']),
    requirement: z.string(),
    priority: z.enum(['required', 'preferred', 'optional']),
  })),
  framework: z.enum(['react', 'next', 'express', 'fastify', 'node', 'unknown']),
  integrations: z.array(z.object({
    service: z.string(),
    purpose: z.string(),
    required: z.boolean(),
  })),
  tags: z.array(z.string()),
});

export const ImplementationPlanSchema = z.object({
  steps: z.array(z.object({
    id: z.string(),
    description: z.string(),
    type: z.enum(['create', 'modify', 'delete']),
    files: z.array(z.string()),
    dependencies: z.array(z.string()),
    estimatedLines: z.number(),
    order: z.number(),
  })),
  dependencies: z.array(z.object({
    name: z.string(),
    version: z.string(),
    dev: z.boolean(),
    reason: z.string(),
  })),
  estimatedComplexity: z.enum(['simple', 'moderate', 'complex']),
  files: z.array(z.object({
    path: z.string(),
    type: z.enum(['create', 'modify', 'delete']),
    description: z.string(),
  })),
  tests: z.array(z.object({
    file: z.string(),
    testCases: z.array(z.object({
      name: z.string(),
      type: z.enum(['unit', 'integration', 'e2e']),
      description: z.string(),
    })),
    coverage: z.number(),
  })),
  estimatedTime: z.string(),
  securityNotes: z.array(z.string()),
});
