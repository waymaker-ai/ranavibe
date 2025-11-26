# Natural Language Code Generation Specification

## Executive Summary

**Feature**: Natural Language Code Generation for RANA Framework
**Priority**: P0 (Critical Gap)
**Impact**: Developer Experience & Competitive Positioning
**Timeline**: Q1 2025 (8-10 weeks)

This specification defines how RANA will implement natural language code generation to compete with MetaGPT, Cursor, and v0.dev. The feature enables developers to generate production-ready code from plain English descriptions while maintaining RANA's enterprise security and quality standards.

---

## Problem Statement

### Current State

RANA developers must:
- Manually write all boilerplate code
- Switch to external AI tools (Cursor, Claude, ChatGPT) for code generation
- Copy/paste generated code without RANA's quality gates
- Miss out on RANA's security best practices during initial generation

### Competitive Landscape

| Tool | Capability | RANA Gap |
|------|-----------|----------|
| **MetaGPT** | Generate full apps from PRDs | ✗ No equivalent |
| **Cursor** | Inline code generation | ✗ No equivalent |
| **v0.dev** | UI component generation | ✗ No equivalent |
| **GitHub Copilot** | Context-aware autocomplete | ✗ No equivalent |

### Target State

```bash
# Generate complete features from natural language
rana generate "User authentication with email and Google OAuth, following OWASP best practices"

# Output: Generates secure auth implementation with:
# - Email/password registration with bcrypt
# - Google OAuth 2.0 integration
# - Session management with Redis
# - Rate limiting on login endpoints
# - CSRF protection
# - Input validation
# - Security audit annotations
```

---

## Technical Architecture

### 1. Core Components

```
@rana/generate
├── cli/
│   ├── generate.ts          # Main CLI command
│   ├── interactive.ts        # Interactive wizard
│   └── templates.ts          # Template registry
├── engine/
│   ├── parser.ts            # Parse natural language intent
│   ├── planner.ts           # Create implementation plan
│   ├── generator.ts         # Generate code from plan
│   ├── validator.ts         # Validate against quality gates
│   └── integrator.ts        # Integrate into existing codebase
├── providers/
│   ├── llm-provider.ts      # LLM abstraction layer
│   ├── claude-provider.ts   # Anthropic Claude integration
│   ├── openai-provider.ts   # OpenAI GPT-4 integration
│   └── local-provider.ts    # Ollama/local models
├── templates/
│   ├── react/               # React component templates
│   ├── api/                 # API endpoint templates
│   ├── database/            # Database schema templates
│   ├── auth/                # Authentication templates
│   └── security/            # Security pattern templates
└── quality/
    ├── security-rules.ts    # OWASP compliance checks
    ├── type-checker.ts      # TypeScript validation
    ├── test-generator.ts    # Auto-generate tests
    └── code-reviewer.ts     # AI code review
```

### 2. Data Flow

```
User Input (Natural Language)
    ↓
Intent Parser (Extract requirements)
    ↓
Planner (Create implementation steps)
    ↓
Context Analyzer (Scan existing codebase)
    ↓
Code Generator (Generate via LLM)
    ↓
Quality Gates (Security, Types, Tests)
    ↓
Integrator (Insert into codebase)
    ↓
Review & Iterate (Show diff, allow edits)
```

### 3. LLM Integration

```typescript
// packages/generate/src/providers/llm-provider.ts

export interface GenerateRequest {
  intent: string;
  context: CodebaseContext;
  constraints: SecurityConstraints;
  style: CodeStyle;
  framework: 'react' | 'next' | 'express' | 'fastify';
}

export interface GenerateResponse {
  plan: ImplementationPlan;
  files: GeneratedFile[];
  tests: GeneratedTest[];
  documentation: string;
  securityNotes: string[];
}

export interface LLMProvider {
  generate(request: GenerateRequest): Promise<GenerateResponse>;
  refine(feedback: string, previous: GenerateResponse): Promise<GenerateResponse>;
  explain(code: string): Promise<string>;
}

// Claude provider with extended context
export class ClaudeProvider implements LLMProvider {
  async generate(request: GenerateRequest): Promise<GenerateResponse> {
    const prompt = this.buildPrompt(request);

    const response = await this.client.messages.create({
      model: 'claude-sonnet-4',
      max_tokens: 8000,
      system: RANA_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: prompt }],
    });

    return this.parseResponse(response);
  }

  private buildPrompt(request: GenerateRequest): string {
    return `
You are a RANA code generator. Generate production-ready code following these requirements:

INTENT:
${request.intent}

EXISTING CODEBASE:
${this.summarizeContext(request.context)}

SECURITY REQUIREMENTS:
${this.formatConstraints(request.constraints)}

CODE STYLE:
${JSON.stringify(request.style, null, 2)}

Generate code that:
1. Follows OWASP Top 10 security best practices
2. Includes comprehensive TypeScript types
3. Has 80%+ test coverage
4. Includes JSDoc documentation
5. Uses RANA's hooks and utilities
6. Integrates seamlessly with existing code

Output format:
{
  "plan": { "steps": [...], "dependencies": [...] },
  "files": [{ "path": "...", "content": "...", "tests": "..." }],
  "documentation": "...",
  "securityNotes": [...]
}
`;
  }
}
```

---

## CLI Interface

### Command Syntax

```bash
# Basic generation
rana generate <description>

# With options
rana generate <description> \
  --framework react \
  --style functional \
  --tests \
  --security-audit \
  --dry-run

# Interactive mode
rana generate --interactive

# From file
rana generate --from requirements.md

# With custom provider
rana generate "..." --provider claude-opus

# Examples
rana generate "Stripe checkout flow with webhook handling"
rana generate "User profile page with avatar upload to S3"
rana generate "GraphQL API for blog posts with pagination"
rana generate "Real-time chat with WebSockets and Redis"
```

### Interactive Wizard

```
$ rana generate --interactive

╭─────────────────────────────────────────────────╮
│   RANA Code Generator                          │
│   Generate production-ready code from ideas    │
╰─────────────────────────────────────────────────╯

What do you want to build?
> User dashboard with analytics charts

What framework are you using?
  ○ React
  ● Next.js
  ○ Express
  ○ Fastify

What features should it include?
  [x] Authentication required
  [x] Real-time updates
  [ ] Offline support
  [x] Dark mode
  [ ] i18n support

Security requirements?
  [x] OWASP Top 10 compliance
  [x] CSRF protection
  [x] Rate limiting
  [x] Input validation
  [ ] SOC 2 audit trail

Analyzing codebase...
✓ Found existing auth system (src/auth/)
✓ Found design system (src/components/ui/)
✓ Found analytics setup (src/lib/analytics/)

Generating implementation plan...

╭─────────────────────────────────────────────────╮
│ Implementation Plan                             │
├─────────────────────────────────────────────────┤
│ 1. Create dashboard layout component           │
│ 2. Add analytics charts (Chart.js)             │
│ 3. Set up WebSocket connection                 │
│ 4. Add authentication middleware               │
│ 5. Create API endpoints                        │
│ 6. Add rate limiting                           │
│ 7. Generate tests (18 test cases)             │
│ 8. Add documentation                           │
├─────────────────────────────────────────────────┤
│ Files: 12 created, 3 modified                  │
│ Tests: 18 test cases (estimated 85% coverage) │
│ Security: OWASP compliant, 0 vulnerabilities  │
╰─────────────────────────────────────────────────╯

Proceed with generation? (Y/n) y

Generating code...
✓ src/app/dashboard/page.tsx (240 lines)
✓ src/components/dashboard/AnalyticsChart.tsx (180 lines)
✓ src/components/dashboard/RealtimeWidget.tsx (120 lines)
✓ src/app/api/dashboard/analytics/route.ts (95 lines)
✓ src/lib/websocket.ts (150 lines)
✓ src/tests/dashboard.test.tsx (210 lines)

Running quality gates...
✓ TypeScript compilation passed
✓ ESLint passed (0 errors, 2 warnings)
✓ Security audit passed (96/100)
✓ Tests passed (18/18)

Code generated successfully!

Next steps:
1. Review generated code: rana review --last-generated
2. Run tests: npm test
3. Start dev server: npm run dev
4. Customize components as needed

View diff? (Y/n) y
```

---

## Implementation Details

### 1. Intent Parser

```typescript
// packages/generate/src/engine/parser.ts

export interface ParsedIntent {
  feature: string;
  entities: Entity[];
  actions: Action[];
  constraints: Constraint[];
  framework: Framework;
  integrations: Integration[];
}

export class IntentParser {
  parse(description: string): ParsedIntent {
    // Use LLM to extract structured requirements
    const structured = await this.llm.extractIntent(description);

    // Validate against known patterns
    const validated = this.validateIntent(structured);

    // Enrich with context
    const enriched = this.enrichWithContext(validated);

    return enriched;
  }

  private async extractIntent(description: string): Promise<any> {
    const prompt = `
Extract structured requirements from this description:
"${description}"

Output JSON:
{
  "feature": "High-level feature name",
  "entities": [{"name": "...", "fields": [...], "relations": [...]}],
  "actions": [{"name": "...", "type": "CRUD|Auth|Payment|etc"}],
  "constraints": [{"type": "security|performance|ux", "requirement": "..."}],
  "framework": "react|next|express|etc",
  "integrations": [{"service": "stripe|aws|etc", "purpose": "..."}]
}
`;

    const response = await this.llm.complete(prompt);
    return JSON.parse(response);
  }
}
```

### 2. Implementation Planner

```typescript
// packages/generate/src/engine/planner.ts

export interface ImplementationPlan {
  steps: Step[];
  dependencies: Dependency[];
  estimatedComplexity: 'simple' | 'moderate' | 'complex';
  files: FileChange[];
  tests: TestPlan[];
}

export interface Step {
  id: string;
  description: string;
  type: 'create' | 'modify' | 'delete';
  files: string[];
  dependencies: string[];
  estimatedLines: number;
}

export class ImplementationPlanner {
  async createPlan(
    intent: ParsedIntent,
    context: CodebaseContext
  ): Promise<ImplementationPlan> {
    // Break down into atomic steps
    const steps = await this.decomposeFeature(intent);

    // Analyze dependencies
    const dependencies = this.analyzeDependencies(steps, context);

    // Estimate complexity
    const complexity = this.estimateComplexity(steps);

    // Plan file changes
    const files = this.planFileChanges(steps, context);

    // Generate test plan
    const tests = this.planTests(steps, intent);

    return { steps, dependencies, estimatedComplexity: complexity, files, tests };
  }

  private async decomposeFeature(intent: ParsedIntent): Promise<Step[]> {
    const prompt = `
Break down this feature into atomic implementation steps:
${JSON.stringify(intent, null, 2)}

Each step should:
- Be independently testable
- Have clear input/output
- Follow single responsibility
- Be ordered by dependencies

Output array of steps.
`;

    const response = await this.llm.complete(prompt);
    return JSON.parse(response);
  }
}
```

### 3. Code Generator

```typescript
// packages/generate/src/engine/generator.ts

export interface GeneratedFile {
  path: string;
  content: string;
  type: 'component' | 'api' | 'util' | 'test' | 'config';
  language: 'typescript' | 'javascript' | 'json';
  tests?: string;
  documentation?: string;
}

export class CodeGenerator {
  async generate(
    plan: ImplementationPlan,
    context: CodebaseContext
  ): Promise<GeneratedFile[]> {
    const files: GeneratedFile[] = [];

    for (const step of plan.steps) {
      const generated = await this.generateStep(step, context);
      files.push(...generated);
    }

    // Post-processing
    const optimized = this.optimizeImports(files);
    const formatted = await this.formatCode(optimized);
    const documented = this.addDocumentation(formatted);

    return documented;
  }

  private async generateStep(
    step: Step,
    context: CodebaseContext
  ): Promise<GeneratedFile[]> {
    // Select appropriate template
    const template = this.selectTemplate(step, context);

    // Generate code via LLM with template guidance
    const prompt = this.buildGenerationPrompt(step, template, context);
    const code = await this.llm.generateCode(prompt);

    // Parse response into files
    const files = this.parseGeneratedCode(code);

    // Validate syntax
    const validated = await this.validateSyntax(files);

    return validated;
  }

  private buildGenerationPrompt(
    step: Step,
    template: Template,
    context: CodebaseContext
  ): string {
    return `
Generate production-ready code for this step:

STEP:
${step.description}

TEMPLATE:
${template.code}

EXISTING CODE PATTERNS:
${this.extractPatterns(context)}

EXISTING COMPONENTS:
${this.listReusableComponents(context)}

STYLE GUIDE:
${context.styleGuide}

SECURITY REQUIREMENTS:
- Input validation on all user inputs
- Output encoding to prevent XSS
- Parameterized queries to prevent SQL injection
- CSRF tokens on state-changing operations
- Rate limiting on sensitive endpoints
- Proper error handling (no sensitive data in errors)

Requirements:
1. Use existing components where possible
2. Follow established patterns
3. Include comprehensive TypeScript types
4. Add JSDoc comments
5. Handle all error cases
6. Include loading and empty states
7. Make it accessible (WCAG 2.1 AA)
8. Optimize for performance

Output the complete file content ready to save.
`;
  }
}
```

### 4. Quality Gates Integration

```typescript
// packages/generate/src/quality/validator.ts

export interface ValidationResult {
  passed: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  score: number;
  suggestions: string[];
}

export class QualityValidator {
  async validate(files: GeneratedFile[]): Promise<ValidationResult> {
    const results = await Promise.all([
      this.validateTypeScript(files),
      this.validateSecurity(files),
      this.validateTests(files),
      this.validateAccessibility(files),
      this.validatePerformance(files),
    ]);

    return this.aggregateResults(results);
  }

  private async validateSecurity(files: GeneratedFile[]): Promise<SecurityValidation> {
    const issues: SecurityIssue[] = [];

    for (const file of files) {
      // SQL Injection check
      if (this.hasUnsafeQuery(file.content)) {
        issues.push({
          severity: 'critical',
          type: 'sql-injection',
          file: file.path,
          message: 'Potential SQL injection vulnerability',
          fix: 'Use parameterized queries',
        });
      }

      // XSS check
      if (this.hasUnsafeHTML(file.content)) {
        issues.push({
          severity: 'high',
          type: 'xss',
          file: file.path,
          message: 'Potential XSS vulnerability',
          fix: 'Use DOMPurify or proper escaping',
        });
      }

      // Secrets check
      if (this.hasHardcodedSecrets(file.content)) {
        issues.push({
          severity: 'critical',
          type: 'hardcoded-secrets',
          file: file.path,
          message: 'Hardcoded secrets detected',
          fix: 'Use environment variables',
        });
      }
    }

    return {
      passed: issues.filter(i => i.severity === 'critical').length === 0,
      issues,
      score: this.calculateSecurityScore(issues),
    };
  }

  private async validateTests(files: GeneratedFile[]): Promise<TestValidation> {
    const testFiles = files.filter(f => f.tests);
    const sourceFiles = files.filter(f => f.type !== 'test');

    // Check test coverage
    const coverage = testFiles.length / sourceFiles.length;

    // Check test quality
    const hasUnitTests = testFiles.some(f => f.tests?.includes('describe'));
    const hasIntegrationTests = testFiles.some(f => f.tests?.includes('test.integration'));
    const hasEdgeCases = testFiles.some(f =>
      f.tests?.includes('edge case') || f.tests?.includes('error')
    );

    return {
      passed: coverage >= 0.8 && hasUnitTests,
      coverage,
      hasUnitTests,
      hasIntegrationTests,
      hasEdgeCases,
      suggestions: this.generateTestSuggestions(coverage, hasUnitTests, hasIntegrationTests),
    };
  }
}
```

---

## Templates System

### Template Structure

```typescript
// packages/generate/src/templates/template.ts

export interface Template {
  id: string;
  name: string;
  description: string;
  category: 'component' | 'api' | 'database' | 'auth' | 'payment';
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
  default?: any;
  validation?: string;
}

// Example: React Form Template
export const reactFormTemplate: Template = {
  id: 'react-form',
  name: 'React Form Component',
  description: 'Accessible form with validation and error handling',
  category: 'component',
  framework: ['react', 'next'],
  tags: ['form', 'validation', 'accessibility', 'react-hook-form'],
  code: `
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const {{schemaName}} = z.object({
  {{#each fields}}
  {{name}}: z.{{type}}(){{#if required}}.min(1, '{{label}} is required'){{/if}},
  {{/each}}
});

type {{formType}} = z.infer<typeof {{schemaName}}>;

export function {{componentName}}() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<{{formType}}>({
    resolver: zodResolver({{schemaName}}),
  });

  const onSubmit = async (data: {{formType}}) => {
    try {
      {{submitLogic}}
    } catch (error) {
      {{errorHandling}}
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {{#each fields}}
      <div>
        <label htmlFor="{{name}}" className="block text-sm font-medium">
          {{label}}
        </label>
        <input
          id="{{name}}"
          type="{{inputType}}"
          {...register('{{name}}')}
          aria-invalid={errors.{{name}} ? 'true' : 'false'}
          aria-describedby="{{name}}-error"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
        />
        {errors.{{name}} && (
          <p id="{{name}}-error" className="mt-1 text-sm text-red-600">
            {errors.{{name}}.message}
          </p>
        )}
      </div>
      {{/each}}

      <button
        type="submit"
        disabled={isSubmitting}
        className="btn-primary"
      >
        {isSubmitting ? 'Submitting...' : '{{submitText}}'}
      </button>
    </form>
  );
}
  `,
  tests: `
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { {{componentName}} } from './{{componentName}}';

describe('{{componentName}}', () => {
  it('renders all form fields', () => {
    render(<{{componentName}} />);
    {{#each fields}}
    expect(screen.getByLabelText('{{label}}')).toBeInTheDocument();
    {{/each}}
  });

  it('validates required fields', async () => {
    render(<{{componentName}} />);
    const submitButton = screen.getByRole('button', { name: /submit/i });

    await userEvent.click(submitButton);

    {{#each fields}}
    {{#if required}}
    await waitFor(() => {
      expect(screen.getByText('{{label}} is required')).toBeInTheDocument();
    });
    {{/if}}
    {{/each}}
  });

  it('submits form with valid data', async () => {
    const onSubmit = jest.fn();
    render(<{{componentName}} onSubmit={onSubmit} />);

    {{#each fields}}
    await userEvent.type(screen.getByLabelText('{{label}}'), '{{testValue}}');
    {{/each}}

    await userEvent.click(screen.getByRole('button', { name: /submit/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        {{#each fields}}
        {{name}}: '{{testValue}}',
        {{/each}}
      });
    });
  });
});
  `,
  variables: [
    { name: 'componentName', type: 'string', description: 'Component name', required: true },
    { name: 'fields', type: 'array', description: 'Form fields', required: true },
    { name: 'submitText', type: 'string', description: 'Submit button text', required: false, default: 'Submit' },
  ],
  examples: [
    {
      description: 'Login form',
      variables: {
        componentName: 'LoginForm',
        fields: [
          { name: 'email', type: 'string', label: 'Email', inputType: 'email', required: true },
          { name: 'password', type: 'string', label: 'Password', inputType: 'password', required: true },
        ],
        submitText: 'Sign In',
      },
    },
  ],
};
```

### Template Categories

**1. Component Templates**
- React form components (with validation)
- Data tables (with sorting, filtering, pagination)
- Modal dialogs (accessible, keyboard navigable)
- Navigation menus (responsive, mobile-friendly)
- Charts and visualizations
- File upload widgets (with drag-drop, preview)

**2. API Templates**
- REST API endpoints (Express, Fastify, Next.js)
- GraphQL resolvers (with DataLoader)
- WebSocket handlers (with reconnection)
- Webhook receivers (with signature verification)
- Background jobs (with retry logic)
- Rate-limited endpoints

**3. Authentication Templates**
- Email/password auth (with bcrypt)
- OAuth 2.0 flows (Google, GitHub, etc.)
- Magic link authentication
- Two-factor authentication (TOTP)
- Session management (JWT, cookies)
- Permission systems (RBAC, ABAC)

**4. Database Templates**
- Prisma schemas
- Database migrations
- Query builders (with TypeScript)
- Seeding scripts
- Backup/restore utilities

**5. Security Templates**
- Input validation (Zod schemas)
- Output encoding (XSS prevention)
- CSRF protection
- Rate limiting
- Security headers
- Audit logging

---

## Integration with Existing Codebase

### Context Analysis

```typescript
// packages/generate/src/engine/context-analyzer.ts

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

export class ContextAnalyzer {
  async analyze(rootPath: string): Promise<CodebaseContext> {
    return {
      framework: await this.detectFramework(rootPath),
      dependencies: await this.analyzeDependencies(rootPath),
      fileStructure: await this.scanFileStructure(rootPath),
      existingComponents: await this.extractComponents(rootPath),
      styleGuide: await this.inferStyleGuide(rootPath),
      patterns: await this.detectPatterns(rootPath),
      testingFramework: await this.detectTestingFramework(rootPath),
      stateManagement: await this.detectStateManagement(rootPath),
    };
  }

  private async detectFramework(rootPath: string): Promise<Framework> {
    const packageJson = await this.readPackageJson(rootPath);

    if (packageJson.dependencies?.['next']) return 'next';
    if (packageJson.dependencies?.['react']) return 'react';
    if (packageJson.dependencies?.['express']) return 'express';
    if (packageJson.dependencies?.['fastify']) return 'fastify';

    return 'unknown';
  }

  private async extractComponents(rootPath: string): Promise<Component[]> {
    const components: Component[] = [];

    // Find all component files
    const files = await glob(`${rootPath}/**/*.{tsx,jsx}`, {
      ignore: ['**/node_modules/**', '**/*.test.*', '**/*.spec.*'],
    });

    for (const file of files) {
      const content = await fs.readFile(file, 'utf-8');
      const parsed = this.parseComponent(content);

      if (parsed) {
        components.push({
          name: parsed.name,
          path: file,
          props: parsed.props,
          exports: parsed.exports,
          imports: parsed.imports,
          patterns: this.detectComponentPatterns(parsed),
        });
      }
    }

    return components;
  }

  private async inferStyleGuide(rootPath: string): Promise<StyleGuide> {
    // Analyze existing code to infer style preferences
    const files = await this.sampleSourceFiles(rootPath, 20);

    return {
      indentation: this.detectIndentation(files),
      quotes: this.detectQuotes(files),
      semicolons: this.detectSemicolons(files),
      trailingCommas: this.detectTrailingCommas(files),
      componentStyle: this.detectComponentStyle(files), // function vs class
      namingConvention: this.detectNamingConvention(files),
      importStyle: this.detectImportStyle(files),
    };
  }
}
```

### Smart File Placement

```typescript
// packages/generate/src/engine/integrator.ts

export class CodebaseIntegrator {
  async integrate(
    files: GeneratedFile[],
    context: CodebaseContext
  ): Promise<IntegrationResult> {
    const placements: FilePlacement[] = [];

    for (const file of files) {
      const path = this.determineOptimalPath(file, context);
      const imports = this.generateImports(file, context);
      const exports = this.generateExports(file, context);

      placements.push({
        file,
        path,
        imports,
        exports,
        modifications: await this.detectRequiredModifications(file, context),
      });
    }

    return {
      placements,
      conflicts: this.detectConflicts(placements, context),
      suggestions: this.generateSuggestions(placements, context),
    };
  }

  private determineOptimalPath(
    file: GeneratedFile,
    context: CodebaseContext
  ): string {
    // Analyze existing file structure patterns
    const patterns = this.analyzeStructurePatterns(context.fileStructure);

    // Determine path based on file type and patterns
    switch (file.type) {
      case 'component':
        return this.findComponentPath(file, patterns);
      case 'api':
        return this.findApiPath(file, patterns);
      case 'util':
        return this.findUtilPath(file, patterns);
      case 'test':
        return this.findTestPath(file, patterns);
      default:
        return this.findDefaultPath(file, patterns);
    }
  }

  private findComponentPath(file: GeneratedFile, patterns: StructurePatterns): string {
    // Check if project uses feature-based or type-based organization
    if (patterns.organizationStyle === 'feature-based') {
      // Place in appropriate feature folder
      return `src/features/${file.feature}/${file.name}`;
    } else {
      // Place in components folder
      return `src/components/${file.category}/${file.name}`;
    }
  }
}
```

---

## Security & Quality Enforcement

### 1. Security Checklist

Every generated file must pass:

- [ ] **Input Validation**: All user inputs validated with Zod/Yup
- [ ] **Output Encoding**: HTML, SQL, and JS injection prevention
- [ ] **Authentication**: Proper auth checks on protected resources
- [ ] **Authorization**: Role-based access control where needed
- [ ] **CSRF Protection**: Tokens on state-changing operations
- [ ] **Rate Limiting**: Applied to sensitive endpoints
- [ ] **Error Handling**: No sensitive data in error messages
- [ ] **Logging**: Security events properly logged
- [ ] **Dependencies**: No known vulnerabilities (npm audit)
- [ ] **Secrets**: No hardcoded credentials

### 2. Code Quality Checklist

- [ ] **TypeScript**: 100% type coverage, no `any` types
- [ ] **Tests**: Minimum 80% code coverage
- [ ] **Documentation**: JSDoc comments on public APIs
- [ ] **Accessibility**: WCAG 2.1 AA compliance
- [ ] **Performance**: No unnecessary re-renders, optimized queries
- [ ] **Error Handling**: All errors caught and handled
- [ ] **Loading States**: UI feedback for async operations
- [ ] **Linting**: Passes ESLint with project config
- [ ] **Formatting**: Matches project Prettier config

### 3. Auto-Fix Capabilities

```typescript
// packages/generate/src/quality/auto-fixer.ts

export class AutoFixer {
  async fix(files: GeneratedFile[], issues: ValidationError[]): Promise<GeneratedFile[]> {
    const fixed = [...files];

    for (const issue of issues) {
      switch (issue.type) {
        case 'missing-types':
          fixed[issue.fileIndex] = await this.addTypes(fixed[issue.fileIndex]);
          break;
        case 'sql-injection':
          fixed[issue.fileIndex] = await this.fixSQLInjection(fixed[issue.fileIndex]);
          break;
        case 'xss':
          fixed[issue.fileIndex] = await this.fixXSS(fixed[issue.fileIndex]);
          break;
        case 'missing-tests':
          const testFile = await this.generateTests(fixed[issue.fileIndex]);
          fixed.push(testFile);
          break;
        case 'accessibility':
          fixed[issue.fileIndex] = await this.fixAccessibility(fixed[issue.fileIndex]);
          break;
      }
    }

    return fixed;
  }

  private async fixSQLInjection(file: GeneratedFile): Promise<GeneratedFile> {
    // Replace string concatenation with parameterized queries
    const prompt = `
Fix SQL injection vulnerabilities in this code:

${file.content}

Replace all string concatenation in SQL queries with parameterized queries.
Use prepared statements or query builders.

Return the fixed code.
`;

    const fixed = await this.llm.complete(prompt);
    return { ...file, content: fixed };
  }

  private async generateTests(file: GeneratedFile): Promise<GeneratedFile> {
    const prompt = `
Generate comprehensive tests for this code:

${file.content}

Include:
- Unit tests for all functions
- Integration tests for API endpoints
- Edge cases and error scenarios
- Accessibility tests for components
- Performance tests if relevant

Use ${this.testingFramework} and testing-library.
Aim for 80%+ coverage.

Return complete test file.
`;

    const tests = await this.llm.complete(prompt);

    return {
      path: file.path.replace(/\.(tsx?|jsx?)$/, '.test.$1'),
      content: tests,
      type: 'test',
      language: file.language,
    };
  }
}
```

---

## User Experience

### 1. Review & Iteration Flow

```
Generation Complete
    ↓
Show Summary
    - Files created/modified
    - Test coverage
    - Security score
    - Estimated completion time
    ↓
User Reviews Diff
    ↓
User Provides Feedback ──────────────┐
    ↓                                 ↓
Options:                         Regenerate
1. Accept all                    with feedback
2. Accept some                        │
3. Reject all                         │
4. Modify & regenerate ───────────────┘
5. Explain code
    ↓
Integrate into Codebase
    ↓
Run Tests
    ↓
Git Commit (optional)
```

### 2. Explainability

```bash
# Explain generated code
rana explain src/components/Dashboard.tsx

╭──────────────────────────────────────────╮
│ Dashboard Component Explanation          │
├──────────────────────────────────────────┤
│                                          │
│ Purpose:                                 │
│ Displays real-time analytics dashboard  │
│ with charts and metrics for admin users │
│                                          │
│ Key Features:                            │
│ • Real-time data via WebSocket           │
│ • Responsive chart layouts               │
│ • Dark mode support                      │
│ • WCAG 2.1 AA accessible                 │
│                                          │
│ Security:                                │
│ • Authentication required (middleware)   │
│ • Admin role check                       │
│ • Rate limited (100 req/min)             │
│ • CSRF protected                         │
│                                          │
│ Dependencies:                            │
│ • chart.js - Data visualization          │
│ • socket.io-client - WebSocket           │
│ • @/hooks/useAuth - Authentication       │
│                                          │
│ Performance:                             │
│ • Memoized chart components              │
│ • Virtualized long lists                 │
│ • Lazy loaded analytics data             │
│                                          │
│ Testing:                                 │
│ • 18 test cases (92% coverage)           │
│ • Unit, integration, and e2e tests       │
│ • Accessibility tests included           │
│                                          │
╰──────────────────────────────────────────╯

View detailed explanation? (Y/n)
```

### 3. Iterative Refinement

```bash
# Initial generation
rana generate "User profile page"

# Review and provide feedback
rana refine --feedback "Add avatar upload and social links"

# Further refinement
rana refine --feedback "Make avatar upload support drag and drop"

# Explain specific section
rana explain src/components/AvatarUpload.tsx --section "handleDrop"

# Regenerate specific file
rana regenerate src/components/AvatarUpload.tsx --prompt "Optimize image compression before upload"
```

---

## Performance & Cost Optimization

### 1. Caching Strategy

```typescript
// packages/generate/src/engine/cache.ts

export class GenerationCache {
  // Cache parsed intents
  async cacheIntent(description: string, intent: ParsedIntent): Promise<void> {
    const key = this.hashDescription(description);
    await this.cache.set(`intent:${key}`, intent, { ttl: 3600 });
  }

  // Cache implementation plans
  async cachePlan(intent: ParsedIntent, plan: ImplementationPlan): Promise<void> {
    const key = this.hashIntent(intent);
    await this.cache.set(`plan:${key}`, plan, { ttl: 3600 });
  }

  // Cache template selections
  async cacheTemplate(step: Step, template: Template): Promise<void> {
    const key = this.hashStep(step);
    await this.cache.set(`template:${key}`, template, { ttl: 86400 });
  }

  // Cache generated code for similar requests
  async cacheGeneration(
    prompt: string,
    code: GeneratedFile[]
  ): Promise<void> {
    const key = this.hashPrompt(prompt);
    await this.cache.set(`generation:${key}`, code, { ttl: 7200 });
  }
}
```

### 2. Model Selection

```typescript
// Use cheaper models for simple tasks
const MODEL_STRATEGY = {
  intentParsing: 'claude-haiku',      // Simple extraction
  planning: 'claude-sonnet',          // Moderate complexity
  codeGeneration: 'claude-sonnet',    // High quality needed
  testGeneration: 'claude-haiku',     // Pattern-based
  documentation: 'claude-haiku',      // Simple summarization
  refinement: 'claude-sonnet',        // Quality improvements
};

// Estimated costs per generation:
// - Simple component: $0.05 - $0.10
// - Complex feature: $0.20 - $0.50
// - Full application: $1.00 - $5.00
```

### 3. Batching

```typescript
// Batch multiple file generations in one LLM call
async generateBatch(steps: Step[]): Promise<GeneratedFile[]> {
  const prompt = `
Generate code for these ${steps.length} related files in one response:

${steps.map((step, i) => `
File ${i + 1}: ${step.description}
Path: ${step.files[0]}
`).join('\n')}

Output as JSON array of files.
`;

  const response = await this.llm.complete(prompt);
  return JSON.parse(response);
}
```

---

## Monitoring & Analytics

### 1. Usage Tracking

```typescript
// Track generation metrics
export interface GenerationMetrics {
  timestamp: Date;
  userId: string;
  intent: string;
  filesGenerated: number;
  linesOfCode: number;
  testsGenerated: number;
  securityScore: number;
  timeToGenerate: number;
  llmCalls: number;
  llmCost: number;
  userAccepted: boolean;
  iterationCount: number;
}

// Analytics dashboard
rana generate --analytics

╭────────────────────────────────────────────╮
│ Generation Analytics (Last 30 Days)       │
├────────────────────────────────────────────┤
│ Total Generations: 1,247                  │
│ Files Generated: 8,934                    │
│ Lines of Code: 287,450                    │
│ Average Security Score: 94/100            │
│ User Acceptance Rate: 87%                 │
│ Average Iterations: 1.3                   │
│ Total LLM Cost: $124.50                   │
│ Cost per Generation: $0.10                │
│                                           │
│ Most Generated:                           │
│ 1. React components (42%)                 │
│ 2. API endpoints (28%)                    │
│ 3. Database schemas (15%)                 │
│ 4. Auth flows (10%)                       │
│ 5. Tests (5%)                             │
│                                           │
│ Top Issues Fixed:                         │
│ 1. Missing TypeScript types (234)         │
│ 2. Accessibility issues (187)             │
│ 3. Missing tests (156)                    │
│ 4. Security vulnerabilities (34)          │
╰────────────────────────────────────────────╯
```

### 2. Quality Metrics

```typescript
export interface QualityMetrics {
  // Pre-generation
  intentClarityScore: number;         // How clear was the request?
  contextCompletenessScore: number;   // How much context was available?

  // Post-generation
  compilationSuccessRate: number;     // Does it compile?
  testPassRate: number;               // Do tests pass?
  securityScore: number;              // Security audit score
  accessibilityScore: number;         // A11y audit score
  performanceScore: number;           // Performance metrics

  // User feedback
  acceptanceRate: number;             // % of code accepted
  iterationCount: number;             // How many refinements?
  userSatisfaction: number;           // 1-5 rating
}
```

---

## Rollout Plan

### Phase 1: MVP (Weeks 1-4)

**Features:**
- Basic CLI command: `rana generate <description>`
- Support for React components only
- Single LLM provider (Claude)
- 5 component templates
- Basic validation (TypeScript, ESLint)
- Simple diff review

**Success Criteria:**
- Generate working React component from description
- 80% compilation success rate
- Security score > 85

### Phase 2: Expansion (Weeks 5-8)

**Features:**
- Interactive wizard mode
- Support for API endpoints
- Multiple LLM providers (Claude, OpenAI, local)
- 20 templates (components, API, database)
- Advanced validation (security, accessibility, tests)
- Auto-fix common issues
- Codebase context analysis

**Success Criteria:**
- Generate full features (frontend + backend)
- 90% compilation success rate
- Security score > 92
- 70% user acceptance rate

### Phase 3: Polish (Weeks 9-10)

**Features:**
- Iterative refinement flow
- Explainability features
- Cost optimization (caching, batching)
- Analytics dashboard
- Template marketplace
- Integration with CI/CD

**Success Criteria:**
- 95% compilation success rate
- Security score > 95
- 85% user acceptance rate
- Average cost < $0.15 per generation

### Phase 4: Advanced Features (Future)

**Features:**
- Full application generation from PRD
- Visual code editing (like v0.dev)
- AI pair programming mode
- Custom template creation
- Team template sharing
- Enterprise features (SOC 2 compliance, audit logs)

---

## Success Metrics

### Technical Metrics

| Metric | Target |
|--------|--------|
| Compilation success rate | > 95% |
| Test pass rate | > 90% |
| Security score | > 95/100 |
| Accessibility score | > 90/100 |
| Type coverage | 100% |
| Generation time | < 30 seconds |
| Cost per generation | < $0.15 |

### User Metrics

| Metric | Target |
|--------|--------|
| User acceptance rate | > 85% |
| Average iterations | < 2 |
| User satisfaction | > 4/5 |
| Time saved vs manual | > 70% |
| Feature adoption | > 50% of users |

### Business Metrics

| Metric | Target |
|--------|--------|
| Weekly active users | 1,000+ |
| Generations per user/week | 5+ |
| Waymaker conversion rate | 15% |
| NPS score | > 50 |

---

## Risks & Mitigations

### Risk 1: Low-Quality Generated Code

**Risk**: LLM generates code that doesn't compile or has bugs

**Mitigation**:
- Strict validation pipeline with auto-fix
- Template system provides structure
- Iterative refinement allows corrections
- Quality gates prevent bad code from being integrated
- User review before acceptance

### Risk 2: Security Vulnerabilities

**Risk**: Generated code introduces security issues

**Mitigation**:
- Security validation on every file
- Templates include security best practices
- Auto-fix for common vulnerabilities
- Security score must be > 85 to pass
- Optional manual security review

### Risk 3: High LLM Costs

**Risk**: Feature becomes too expensive to operate

**Mitigation**:
- Aggressive caching strategy
- Cheaper models for simple tasks
- Batch operations where possible
- Usage limits for free tier
- Template system reduces LLM calls

### Risk 4: Poor User Experience

**Risk**: Users find the feature frustrating or slow

**Mitigation**:
- Fast generation (< 30 seconds)
- Clear progress indicators
- Iterative refinement for corrections
- Explainability features
- Comprehensive documentation

### Risk 5: Low Adoption

**Risk**: Users prefer existing tools (Cursor, Copilot)

**Mitigation**:
- Differentiate with RANA integration (quality gates, security)
- Focus on enterprise features (compliance, audit)
- Waymaker services upsell
- Comprehensive templates
- Superior code quality

---

## Appendix

### A. Example Generations

**Example 1: Simple Component**

```bash
Input:
rana generate "Button component with loading state"

Output:
✓ src/components/Button.tsx (42 lines)
✓ src/components/Button.test.tsx (78 lines)

Security: 98/100
Tests: 95% coverage
Time: 12 seconds
Cost: $0.04
```

**Example 2: API Endpoint**

```bash
Input:
rana generate "REST API for blog posts with pagination and search"

Output:
✓ src/app/api/posts/route.ts (145 lines)
✓ src/lib/db/posts.ts (98 lines)
✓ src/types/post.ts (23 lines)
✓ src/tests/api/posts.test.ts (234 lines)

Security: 96/100
Tests: 88% coverage
Time: 28 seconds
Cost: $0.12
```

**Example 3: Full Feature**

```bash
Input:
rana generate "User authentication with email and Google OAuth"

Output:
✓ src/app/api/auth/[...nextauth]/route.ts (67 lines)
✓ src/lib/auth.ts (123 lines)
✓ src/components/LoginForm.tsx (145 lines)
✓ src/components/GoogleButton.tsx (52 lines)
✓ src/middleware.ts (34 lines)
✓ prisma/schema.prisma (modified, +45 lines)
✓ .env.example (modified, +8 lines)
✓ src/tests/auth/*.test.ts (8 files, 567 lines)

Security: 94/100 (⚠ Add rate limiting to login endpoint)
Tests: 92% coverage
Dependencies: +3 (next-auth, bcrypt, @prisma/client)
Time: 45 seconds
Cost: $0.23

Next steps:
1. Run migration: npx prisma migrate dev
2. Add env vars: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
3. Review security notes in src/lib/auth.ts:45
```

### B. Template Library

Initial template collection (20 templates):

**Components:**
1. Button (with variants, loading, disabled states)
2. Form (with validation, accessibility)
3. Modal (with focus trap, keyboard navigation)
4. Table (with sorting, filtering, pagination)
5. Card (with hover states, responsive)
6. Navigation (with mobile menu, active states)

**API Endpoints:**
7. REST CRUD (with validation, error handling)
8. GraphQL resolver (with DataLoader)
9. WebSocket handler (with reconnection)
10. Webhook receiver (with signature verification)
11. File upload (with validation, S3 integration)
12. Batch operations (with queue system)

**Authentication:**
13. Email/password auth (with bcrypt, session)
14. OAuth 2.0 flow (Google, GitHub, etc.)
15. Magic link (with expiration)
16. 2FA (with TOTP)

**Database:**
17. Prisma schema (with relations)
18. Database migration (with rollback)
19. Seed script (with fake data)
20. Query builder (with TypeScript)

### C. FAQ

**Q: How is this different from GitHub Copilot?**
A: Copilot provides autocomplete suggestions. RANA Generate creates complete, production-ready features with built-in security, tests, and documentation. It also integrates with RANA's quality gates.

**Q: Can I use my own LLM?**
A: Yes, RANA supports local models via Ollama and any OpenAI-compatible API.

**Q: What if the generated code has bugs?**
A: Use `rana refine --feedback "..."` to iteratively improve. All code goes through validation before integration.

**Q: Does this work with existing codebases?**
A: Yes, RANA analyzes your codebase to match existing patterns, styles, and conventions.

**Q: How much does it cost?**
A: Average $0.10 per generation. You can use local models for free (slower).

**Q: Can I create custom templates?**
A: Yes, create templates in `.rana/templates/` and share with your team.

**Q: Is generated code secure?**
A: All code passes OWASP security validation. We auto-fix common vulnerabilities and provide security notes for manual review.

---

**Status**: Draft Specification
**Version**: 1.0
**Last Updated**: 2025-11-25
**Next Review**: After Phase 1 MVP
**Feedback**: [GitHub Discussions](https://github.com/waymaker-ai/rana/discussions)
