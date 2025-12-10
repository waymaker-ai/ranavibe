import {
  GeneratedFile,
  ImplementationPlan,
  CodebaseContext,
  Step,
  FileType,
  Language,
} from '../types';
import { Template, getTemplate } from '../templates';

// ============================================================================
// Code Generator - Generates production-ready code from plans
// ============================================================================

export interface GeneratorConfig {
  llmProvider?: LLMProviderInterface;
  includeTests?: boolean;
  includeDocumentation?: boolean;
  securityAudit?: boolean;
}

export interface LLMProviderInterface {
  complete(prompt: string): Promise<string>;
}

const CODE_GENERATION_PROMPT = `You are an expert software engineer. Generate production-ready code for the following step.

STEP:
{step}

CONTEXT:
{context}

REQUIREMENTS:
- Use TypeScript with strict types (no 'any' types)
- Follow OWASP security best practices
- Include comprehensive error handling
- Make code accessible (WCAG 2.1 AA)
- Include JSDoc comments for public APIs
- Use modern ES2022+ features
- Follow the existing code style

Output the complete file content ready to be saved. Include imports at the top.
Do not include any markdown formatting or explanations - just the raw code.`;

const TEST_GENERATION_PROMPT = `Generate comprehensive tests for this code:

CODE:
{code}

REQUIREMENTS:
- Use {testFramework} testing framework
- Include unit tests for all functions
- Include integration tests for API endpoints
- Test error cases and edge cases
- Test accessibility for components
- Aim for 80%+ coverage

Output only the test file content, no explanations.`;

export class CodeGenerator {
  private config: GeneratorConfig;
  private llmProvider?: LLMProviderInterface;

  constructor(config: GeneratorConfig = {}) {
    this.config = {
      includeTests: true,
      includeDocumentation: true,
      securityAudit: true,
      ...config,
    };
    this.llmProvider = config.llmProvider;
  }

  /**
   * Generate code for an entire implementation plan
   */
  async generate(
    plan: ImplementationPlan,
    context?: CodebaseContext
  ): Promise<GeneratedFile[]> {
    const files: GeneratedFile[] = [];

    // Generate code for each step in order
    for (const step of plan.steps.sort((a, b) => a.order - b.order)) {
      const stepFiles = await this.generateStep(step, context, plan);
      files.push(...stepFiles);
    }

    // Post-processing
    const optimized = this.optimizeImports(files);
    const documented = this.config.includeDocumentation
      ? this.addDocumentation(optimized)
      : optimized;

    return documented;
  }

  /**
   * Generate code for a single step
   */
  async generateStep(
    step: Step,
    context?: CodebaseContext,
    plan?: ImplementationPlan
  ): Promise<GeneratedFile[]> {
    const files: GeneratedFile[] = [];

    for (const filePath of step.files) {
      const fileType = this.inferFileType(filePath);
      const language = this.inferLanguage(filePath);

      let content: string;

      // Try to use template first
      const template = this.findTemplate(step, fileType);
      if (template) {
        content = this.renderTemplate(template, step, context);
      } else if (this.llmProvider) {
        // Fall back to LLM generation
        content = await this.generateWithLLM(step, filePath, context);
      } else {
        // Fall back to basic generation
        content = this.generateBasicCode(step, filePath, fileType);
      }

      const file: GeneratedFile = {
        path: filePath,
        content,
        type: fileType,
        language,
      };

      // Generate tests if enabled
      if (this.config.includeTests && fileType !== 'test' && fileType !== 'config') {
        const tests = await this.generateTests(file, context);
        if (tests) {
          file.tests = tests;
        }
      }

      files.push(file);
    }

    return files;
  }

  /**
   * Generate code using LLM
   */
  private async generateWithLLM(
    step: Step,
    filePath: string,
    context?: CodebaseContext
  ): Promise<string> {
    const prompt = CODE_GENERATION_PROMPT
      .replace('{step}', JSON.stringify(step, null, 2))
      .replace('{context}', context ? this.summarizeContext(context) : 'No existing context');

    const response = await this.llmProvider!.complete(prompt);

    // Clean up response (remove markdown code blocks if present)
    return this.cleanCodeResponse(response);
  }

  /**
   * Generate basic code without LLM
   */
  private generateBasicCode(step: Step, filePath: string, fileType: FileType): string {
    switch (fileType) {
      case 'component':
        return this.generateBasicComponent(step, filePath);
      case 'api':
        return this.generateBasicApi(step, filePath);
      case 'schema':
        return this.generateBasicSchema(step);
      case 'util':
        return this.generateBasicUtil(step, filePath);
      default:
        return this.generateBasicFile(step, filePath);
    }
  }

  /**
   * Generate basic React component
   */
  private generateBasicComponent(step: Step, filePath: string): string {
    const componentName = this.extractComponentName(filePath);
    const isPage = filePath.includes('/app/') && filePath.includes('page.');

    if (isPage) {
      return `import { Suspense } from 'react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '${componentName}',
  description: '${step.description}',
};

/**
 * ${step.description}
 */
export default async function ${componentName}Page() {
  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">${componentName}</h1>
      <Suspense fallback={<div>Loading...</div>}>
        <${componentName}Content />
      </Suspense>
    </main>
  );
}

async function ${componentName}Content() {
  // TODO: Implement ${step.description}
  return (
    <div className="space-y-4">
      <p>Implement ${step.description}</p>
    </div>
  );
}
`;
    }

    return `'use client';

import { useState, useCallback } from 'react';

export interface ${componentName}Props {
  className?: string;
}

/**
 * ${step.description}
 */
export function ${componentName}({ className }: ${componentName}Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // TODO: Implement ${step.description}

  if (loading) {
    return (
      <div className={className} role="status" aria-label="Loading">
        <span className="animate-spin">Loading...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={className} role="alert">
        <p className="text-red-600">Error: {error.message}</p>
      </div>
    );
  }

  return (
    <div className={className}>
      <h2 className="text-xl font-semibold">${componentName}</h2>
      {/* Implement ${step.description} */}
    </div>
  );
}

export default ${componentName};
`;
  }

  /**
   * Generate basic API route
   */
  private generateBasicApi(step: Step, filePath: string): string {
    const isNextApp = filePath.includes('route.ts');

    if (isNextApp) {
      return `import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Validation schema
const RequestSchema = z.object({
  // Define your request schema here
});

/**
 * ${step.description}
 * @route GET /api/...
 */
export async function GET(request: NextRequest) {
  try {
    // TODO: Implement ${step.description}

    return NextResponse.json({
      success: true,
      data: [],
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * ${step.description}
 * @route POST /api/...
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const validated = RequestSchema.parse(body);

    // TODO: Implement ${step.description}

    return NextResponse.json({
      success: true,
      data: validated,
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    console.error('API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
`;
    }

    // Express-style API
    return `import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

// Validation schema
const RequestSchema = z.object({
  // Define your request schema here
});

/**
 * ${step.description}
 */
export async function handler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    switch (req.method) {
      case 'GET':
        // TODO: Implement GET ${step.description}
        return res.json({ success: true, data: [] });

      case 'POST':
        const validated = RequestSchema.parse(req.body);
        // TODO: Implement POST ${step.description}
        return res.status(201).json({ success: true, data: validated });

      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    next(error);
  }
}

export default handler;
`;
  }

  /**
   * Generate basic Prisma schema
   */
  private generateBasicSchema(step: Step): string {
    return `// ${step.description}
// Add to your existing schema.prisma file

model Entity {
  id        String   @id @default(cuid())
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // TODO: Add fields for ${step.description}
  name      String

  @@map("entities")
}
`;
  }

  /**
   * Generate basic utility file
   */
  private generateBasicUtil(step: Step, filePath: string): string {
    const utilName = this.extractUtilName(filePath);

    return `/**
 * ${step.description}
 * @module ${utilName}
 */

/**
 * Main utility function
 * TODO: Implement ${step.description}
 */
export function ${utilName}() {
  // Implementation here
}

/**
 * Helper function
 */
export function ${utilName}Helper() {
  // Implementation here
}

export default ${utilName};
`;
  }

  /**
   * Generate basic file content
   */
  private generateBasicFile(step: Step, filePath: string): string {
    return `/**
 * ${step.description}
 * File: ${filePath}
 */

// TODO: Implement ${step.description}

export {};
`;
  }

  /**
   * Generate tests for a file
   */
  async generateTests(file: GeneratedFile, context?: CodebaseContext): Promise<string | undefined> {
    const testFramework = context?.testingFramework || 'vitest';

    if (this.llmProvider) {
      const prompt = TEST_GENERATION_PROMPT
        .replace('{code}', file.content)
        .replace('{testFramework}', testFramework);

      const response = await this.llmProvider.complete(prompt);
      return this.cleanCodeResponse(response);
    }

    // Generate basic tests without LLM
    return this.generateBasicTests(file, testFramework);
  }

  /**
   * Generate basic tests without LLM
   */
  private generateBasicTests(file: GeneratedFile, testFramework: string): string {
    const isVitest = testFramework === 'vitest';
    const componentName = this.extractComponentName(file.path);

    if (file.type === 'component') {
      return `import { describe, it, expect${isVitest ? '' : ', jest'} } from '${testFramework}';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ${componentName} } from './${componentName}';

describe('${componentName}', () => {
  it('should render successfully', () => {
    render(<${componentName} />);
    expect(screen.getByRole('region')).toBeInTheDocument();
  });

  it('should handle loading state', () => {
    // TODO: Test loading state
  });

  it('should handle error state', () => {
    // TODO: Test error state
  });

  it('should be accessible', () => {
    render(<${componentName} />);
    // TODO: Add accessibility tests
  });
});
`;
    }

    if (file.type === 'api') {
      return `import { describe, it, expect, beforeEach${isVitest ? '' : ', jest'} } from '${testFramework}';

describe('API: ${file.path}', () => {
  beforeEach(() => {
    // Reset mocks
  });

  describe('GET', () => {
    it('should return data successfully', async () => {
      // TODO: Test GET endpoint
    });

    it('should handle errors', async () => {
      // TODO: Test error handling
    });
  });

  describe('POST', () => {
    it('should create resource successfully', async () => {
      // TODO: Test POST endpoint
    });

    it('should validate input', async () => {
      // TODO: Test validation
    });
  });
});
`;
    }

    return `import { describe, it, expect } from '${testFramework}';

describe('${file.path}', () => {
  it('should work correctly', () => {
    // TODO: Add tests
    expect(true).toBe(true);
  });
});
`;
  }

  /**
   * Find a matching template for the step
   */
  private findTemplate(step: Step, fileType: FileType): Template | null {
    // Try to find template by keywords in step description
    const keywords = step.description.toLowerCase();

    if (fileType === 'component') {
      if (keywords.includes('form')) return getTemplate('react-form');
      if (keywords.includes('table') || keywords.includes('list')) return getTemplate('react-table');
      if (keywords.includes('modal') || keywords.includes('dialog')) return getTemplate('react-modal');
    }

    if (fileType === 'api') {
      if (keywords.includes('crud')) return getTemplate('api-crud');
      if (keywords.includes('auth')) return getTemplate('api-auth');
    }

    return null;
  }

  /**
   * Render a template with variables
   */
  private renderTemplate(
    template: Template,
    step: Step,
    context?: CodebaseContext
  ): string {
    // Simple template variable replacement
    let code = template.code;

    // Replace common variables
    const componentName = this.extractComponentName(step.files[0]);
    code = code.replace(/\{\{componentName\}\}/g, componentName);
    code = code.replace(/\{\{description\}\}/g, step.description);

    return code;
  }

  /**
   * Optimize imports across generated files
   */
  private optimizeImports(files: GeneratedFile[]): GeneratedFile[] {
    return files.map(file => {
      // Remove duplicate imports
      const lines = file.content.split('\n');
      const imports = new Set<string>();
      const nonImports: string[] = [];

      for (const line of lines) {
        if (line.startsWith('import ')) {
          imports.add(line);
        } else {
          nonImports.push(line);
        }
      }

      const optimizedContent = [...imports, '', ...nonImports].join('\n');

      return {
        ...file,
        content: optimizedContent.replace(/\n{3,}/g, '\n\n'),
      };
    });
  }

  /**
   * Add documentation to generated files
   */
  private addDocumentation(files: GeneratedFile[]): GeneratedFile[] {
    return files.map(file => {
      // Add file header if not present
      if (!file.content.includes('/**')) {
        const header = `/**
 * @file ${file.path}
 * @description Auto-generated by RANA Code Generator
 * @generated
 */

`;
        return {
          ...file,
          content: header + file.content,
        };
      }

      return file;
    });
  }

  /**
   * Clean LLM response (remove markdown formatting)
   */
  private cleanCodeResponse(response: string): string {
    // Remove markdown code blocks
    let cleaned = response.replace(/```(?:typescript|javascript|tsx|jsx)?\n?/g, '');
    cleaned = cleaned.replace(/```\n?/g, '');

    // Trim whitespace
    cleaned = cleaned.trim();

    return cleaned;
  }

  /**
   * Infer file type from path
   */
  private inferFileType(filePath: string): FileType {
    const lower = filePath.toLowerCase();

    if (lower.includes('.test.') || lower.includes('.spec.') || lower.includes('__tests__')) {
      return 'test';
    }
    if (lower.includes('/components/') || lower.endsWith('.tsx') || lower.endsWith('.jsx')) {
      return 'component';
    }
    if (lower.includes('/api/') || lower.includes('route.ts') || lower.includes('routes/')) {
      return 'api';
    }
    if (lower.includes('schema.prisma') || lower.includes('/models/')) {
      return 'schema';
    }
    if (lower.includes('/lib/') || lower.includes('/utils/') || lower.includes('/helpers/')) {
      return 'util';
    }
    if (lower.includes('config') || lower.endsWith('.json') || lower.endsWith('.yaml')) {
      return 'config';
    }

    return 'util';
  }

  /**
   * Infer language from path
   */
  private inferLanguage(filePath: string): Language {
    if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) return 'typescript';
    if (filePath.endsWith('.js') || filePath.endsWith('.jsx')) return 'javascript';
    if (filePath.endsWith('.json')) return 'json';
    if (filePath.endsWith('.yaml') || filePath.endsWith('.yml')) return 'yaml';
    if (filePath.endsWith('.sql')) return 'sql';
    if (filePath.endsWith('.prisma')) return 'prisma';

    return 'typescript';
  }

  /**
   * Extract component name from file path
   */
  private extractComponentName(filePath: string): string {
    const fileName = filePath.split('/').pop() || '';
    const baseName = fileName.replace(/\.(tsx?|jsx?)$/, '');

    // Handle special files
    if (baseName === 'page' || baseName === 'route') {
      const parts = filePath.split('/');
      const dirName = parts[parts.length - 2] || 'Page';
      return this.pascalCase(dirName);
    }

    return this.pascalCase(baseName);
  }

  /**
   * Extract utility name from file path
   */
  private extractUtilName(filePath: string): string {
    const fileName = filePath.split('/').pop() || '';
    const baseName = fileName.replace(/\.(tsx?|jsx?)$/, '');
    return this.camelCase(baseName);
  }

  /**
   * Summarize context for prompts
   */
  private summarizeContext(context: CodebaseContext): string {
    return `
Framework: ${context.framework}
Style: ${context.styleGuide.indentation}, ${context.styleGuide.quotes} quotes
Testing: ${context.testingFramework}
State: ${context.stateManagement}
Existing Components: ${context.existingComponents.slice(0, 5).map(c => c.name).join(', ')}
    `.trim();
  }

  /**
   * Convert to PascalCase
   */
  private pascalCase(str: string): string {
    return str
      .split(/[\s_-]+/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('');
  }

  /**
   * Convert to camelCase
   */
  private camelCase(str: string): string {
    const pascal = this.pascalCase(str);
    return pascal.charAt(0).toLowerCase() + pascal.slice(1);
  }
}

// Export singleton instance
export const codeGenerator = new CodeGenerator();
