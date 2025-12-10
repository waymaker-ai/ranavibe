import {
  ParsedIntent,
  ImplementationPlan,
  ImplementationPlanSchema,
  Step,
  Dependency,
  FileChange,
  TestPlan,
  Complexity,
  CodebaseContext,
} from '../types';

// ============================================================================
// Implementation Planner - Creates step-by-step implementation plans
// ============================================================================

export interface PlannerConfig {
  llmProvider?: LLMProviderInterface;
  maxSteps?: number;
  includeTests?: boolean;
  includeDocs?: boolean;
}

export interface LLMProviderInterface {
  complete(prompt: string): Promise<string>;
}

const PLANNING_PROMPT = `You are an expert software architect. Create a detailed implementation plan for the following feature.

FEATURE:
{intent}

EXISTING CODEBASE:
{context}

Create a step-by-step implementation plan that:
1. Breaks down the feature into atomic, testable steps
2. Orders steps by dependencies (what needs to be done first)
3. Identifies all files that need to be created or modified
4. Lists all npm dependencies needed
5. Estimates complexity and time
6. Includes test plans for each component
7. Notes any security considerations

Output ONLY valid JSON matching this schema:
{
  "steps": [
    {
      "id": "step-1",
      "description": "string",
      "type": "create|modify|delete",
      "files": ["path/to/file.ts"],
      "dependencies": ["step-id of steps this depends on"],
      "estimatedLines": number,
      "order": number
    }
  ],
  "dependencies": [
    { "name": "package-name", "version": "^1.0.0", "dev": boolean, "reason": "string" }
  ],
  "estimatedComplexity": "simple|moderate|complex",
  "files": [
    { "path": "string", "type": "create|modify|delete", "description": "string" }
  ],
  "tests": [
    {
      "file": "string",
      "testCases": [
        { "name": "string", "type": "unit|integration|e2e", "description": "string" }
      ],
      "coverage": number
    }
  ],
  "estimatedTime": "string (e.g., '2-3 hours')",
  "securityNotes": ["array of security considerations"]
}`;

export class ImplementationPlanner {
  private config: PlannerConfig;
  private llmProvider?: LLMProviderInterface;

  constructor(config: PlannerConfig = {}) {
    this.config = {
      maxSteps: 20,
      includeTests: true,
      includeDocs: true,
      ...config,
    };
    this.llmProvider = config.llmProvider;
  }

  /**
   * Create an implementation plan from parsed intent
   */
  async createPlan(
    intent: ParsedIntent,
    context?: CodebaseContext
  ): Promise<ImplementationPlan> {
    if (this.llmProvider) {
      return this.createPlanWithLLM(intent, context);
    }

    return this.createPlanFromPatterns(intent, context);
  }

  /**
   * Create plan using LLM for sophisticated planning
   */
  private async createPlanWithLLM(
    intent: ParsedIntent,
    context?: CodebaseContext
  ): Promise<ImplementationPlan> {
    const prompt = PLANNING_PROMPT
      .replace('{intent}', JSON.stringify(intent, null, 2))
      .replace('{context}', context ? JSON.stringify(this.summarizeContext(context), null, 2) : 'No existing codebase context');

    const response = await this.llmProvider!.complete(prompt);

    // Extract JSON from response
    const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, response];
    const jsonStr = jsonMatch[1]?.trim() || response.trim();

    try {
      const parsed = JSON.parse(jsonStr);
      return ImplementationPlanSchema.parse(parsed);
    } catch (error) {
      console.warn('LLM planning failed, falling back to pattern-based:', error);
      return this.createPlanFromPatterns(intent, context);
    }
  }

  /**
   * Create plan using pattern-based approach
   */
  private createPlanFromPatterns(
    intent: ParsedIntent,
    context?: CodebaseContext
  ): ImplementationPlan {
    const steps: Step[] = [];
    const dependencies: Dependency[] = [];
    const files: FileChange[] = [];
    const tests: TestPlan[] = [];
    const securityNotes: string[] = [];

    let stepOrder = 1;

    // Determine base paths based on framework
    const basePaths = this.getBasePaths(intent.framework, context);

    // Step 1: Create types/interfaces
    if (intent.entities.length > 0) {
      const typeFile = `${basePaths.types}/${intent.feature.toLowerCase().replace(/\s+/g, '-')}.types.ts`;
      steps.push({
        id: `step-${stepOrder}`,
        description: `Define TypeScript types and interfaces for ${intent.entities.map(e => e.name).join(', ')}`,
        type: 'create',
        files: [typeFile],
        dependencies: [],
        estimatedLines: intent.entities.length * 15,
        order: stepOrder++,
      });
      files.push({
        path: typeFile,
        type: 'create',
        description: 'Type definitions',
      });
    }

    // Step 2: Create database schema (if entities exist)
    if (intent.entities.length > 0) {
      const schemaFile = `prisma/schema.prisma`;
      steps.push({
        id: `step-${stepOrder}`,
        description: `Add Prisma models for ${intent.entities.map(e => e.name).join(', ')}`,
        type: 'modify',
        files: [schemaFile],
        dependencies: steps.length > 0 ? [`step-${stepOrder - 1}`] : [],
        estimatedLines: intent.entities.length * 20,
        order: stepOrder++,
      });
      files.push({
        path: schemaFile,
        type: 'modify',
        description: 'Database schema updates',
      });

      // Add Prisma dependency
      dependencies.push({
        name: '@prisma/client',
        version: '^5.0.0',
        dev: false,
        reason: 'Database ORM',
      });
      dependencies.push({
        name: 'prisma',
        version: '^5.0.0',
        dev: true,
        reason: 'Prisma CLI',
      });
    }

    // Step 3: Create API routes (for each action)
    for (const action of intent.actions) {
      if (['create', 'read', 'update', 'delete'].includes(action.type)) {
        const routeFile = this.getApiRoutePath(intent, action, basePaths);
        steps.push({
          id: `step-${stepOrder}`,
          description: `Create ${action.name} API endpoint`,
          type: 'create',
          files: [routeFile],
          dependencies: steps.length > 1 ? [`step-2`] : [],
          estimatedLines: 50,
          order: stepOrder++,
        });
        files.push({
          path: routeFile,
          type: 'create',
          description: `${action.name} API route`,
        });

        // Add test plan for API
        tests.push({
          file: routeFile.replace('.ts', '.test.ts'),
          testCases: [
            { name: `should ${action.type} successfully`, type: 'integration', description: `Test successful ${action.type} operation` },
            { name: `should handle validation errors`, type: 'unit', description: 'Test input validation' },
            { name: `should handle unauthorized access`, type: 'integration', description: 'Test authentication' },
          ],
          coverage: 85,
        });
      }
    }

    // Step 4: Create UI components (for React/Next.js)
    if (intent.framework === 'react' || intent.framework === 'next') {
      // Main page/component
      const componentFile = `${basePaths.components}/${this.pascalCase(intent.feature)}.tsx`;
      steps.push({
        id: `step-${stepOrder}`,
        description: `Create main ${intent.feature} component`,
        type: 'create',
        files: [componentFile],
        dependencies: steps.filter(s => s.files[0].includes('route') || s.files[0].includes('api')).map(s => s.id),
        estimatedLines: 150,
        order: stepOrder++,
      });
      files.push({
        path: componentFile,
        type: 'create',
        description: 'Main UI component',
      });

      // Add component test
      tests.push({
        file: componentFile.replace('.tsx', '.test.tsx'),
        testCases: [
          { name: 'should render correctly', type: 'unit', description: 'Test component renders' },
          { name: 'should handle user interactions', type: 'integration', description: 'Test user interactions' },
          { name: 'should be accessible', type: 'unit', description: 'Test accessibility' },
          { name: 'should handle loading state', type: 'unit', description: 'Test loading UI' },
          { name: 'should handle error state', type: 'unit', description: 'Test error handling' },
        ],
        coverage: 90,
      });

      // Add React dependencies if needed
      if (!context?.dependencies?.some(d => d.name === 'react')) {
        dependencies.push({
          name: 'react-hook-form',
          version: '^7.0.0',
          dev: false,
          reason: 'Form management',
        });
        dependencies.push({
          name: 'zod',
          version: '^3.22.0',
          dev: false,
          reason: 'Schema validation',
        });
        dependencies.push({
          name: '@hookform/resolvers',
          version: '^3.0.0',
          dev: false,
          reason: 'Zod resolver for react-hook-form',
        });
      }
    }

    // Step 5: Add authentication (if needed)
    if (intent.actions.some(a => a.type === 'auth') || intent.constraints.some(c => c.requirement.includes('Authentication'))) {
      const authFile = `${basePaths.lib}/auth.ts`;
      steps.push({
        id: `step-${stepOrder}`,
        description: 'Set up authentication middleware and utilities',
        type: 'create',
        files: [authFile],
        dependencies: [],
        estimatedLines: 100,
        order: stepOrder++,
      });
      files.push({
        path: authFile,
        type: 'create',
        description: 'Authentication utilities',
      });

      dependencies.push({
        name: 'next-auth',
        version: '^4.24.0',
        dev: false,
        reason: 'Authentication library',
      });

      securityNotes.push('Implement rate limiting on login endpoints');
      securityNotes.push('Use bcrypt for password hashing with cost factor ≥ 12');
      securityNotes.push('Implement CSRF protection for session-based auth');
    }

    // Step 6: Add integrations
    for (const integration of intent.integrations) {
      const integrationFile = `${basePaths.lib}/${integration.service.toLowerCase().replace(/\s+/g, '-')}.ts`;
      steps.push({
        id: `step-${stepOrder}`,
        description: `Set up ${integration.service} integration for ${integration.purpose}`,
        type: 'create',
        files: [integrationFile],
        dependencies: [],
        estimatedLines: 80,
        order: stepOrder++,
      });
      files.push({
        path: integrationFile,
        type: 'create',
        description: `${integration.service} integration`,
      });

      // Add integration-specific dependencies
      this.addIntegrationDependencies(integration.service, dependencies);
    }

    // Security notes based on constraints
    for (const constraint of intent.constraints) {
      if (constraint.type === 'security') {
        securityNotes.push(constraint.requirement);
      }
    }

    // Always add OWASP notes
    if (!securityNotes.some(n => n.includes('OWASP'))) {
      securityNotes.push('Validate all user inputs');
      securityNotes.push('Sanitize outputs to prevent XSS');
      securityNotes.push('Use parameterized queries to prevent SQL injection');
    }

    return {
      steps,
      dependencies: this.deduplicateDependencies(dependencies),
      estimatedComplexity: this.estimateComplexity(steps, intent),
      files,
      tests: this.config.includeTests ? tests : [],
      estimatedTime: this.estimateTime(steps),
      securityNotes,
    };
  }

  /**
   * Get base paths for the project structure
   */
  private getBasePaths(framework: string, context?: CodebaseContext) {
    // Try to infer from existing context
    if (context?.fileStructure) {
      // Check for common patterns
      const hasApp = this.hasPath(context.fileStructure, 'app');
      const hasSrc = this.hasPath(context.fileStructure, 'src');
      const hasPages = this.hasPath(context.fileStructure, 'pages');

      if (framework === 'next') {
        if (hasApp) {
          return {
            components: hasSrc ? 'src/components' : 'components',
            api: hasSrc ? 'src/app/api' : 'app/api',
            pages: hasSrc ? 'src/app' : 'app',
            lib: hasSrc ? 'src/lib' : 'lib',
            types: hasSrc ? 'src/types' : 'types',
          };
        }
        return {
          components: hasSrc ? 'src/components' : 'components',
          api: hasSrc ? 'src/pages/api' : 'pages/api',
          pages: hasSrc ? 'src/pages' : 'pages',
          lib: hasSrc ? 'src/lib' : 'lib',
          types: hasSrc ? 'src/types' : 'types',
        };
      }
    }

    // Default paths by framework
    const defaults: Record<string, Record<string, string>> = {
      next: {
        components: 'src/components',
        api: 'src/app/api',
        pages: 'src/app',
        lib: 'src/lib',
        types: 'src/types',
      },
      react: {
        components: 'src/components',
        api: 'src/api',
        pages: 'src/pages',
        lib: 'src/lib',
        types: 'src/types',
      },
      express: {
        components: 'src/controllers',
        api: 'src/routes',
        pages: 'src/views',
        lib: 'src/lib',
        types: 'src/types',
      },
      node: {
        components: 'src',
        api: 'src/routes',
        pages: 'src',
        lib: 'src/lib',
        types: 'src/types',
      },
    };

    return defaults[framework] || defaults.node;
  }

  /**
   * Check if path exists in file tree
   */
  private hasPath(tree: any, name: string): boolean {
    if (!tree) return false;
    if (tree.name === name) return true;
    if (tree.children) {
      return tree.children.some((child: any) => this.hasPath(child, name));
    }
    return false;
  }

  /**
   * Get API route path based on framework
   */
  private getApiRoutePath(intent: ParsedIntent, action: any, basePaths: any): string {
    const entityName = intent.entities[0]?.name?.toLowerCase() || intent.feature.toLowerCase().replace(/\s+/g, '-');

    if (intent.framework === 'next') {
      return `${basePaths.api}/${entityName}/route.ts`;
    }

    return `${basePaths.api}/${entityName}.ts`;
  }

  /**
   * Add dependencies for specific integrations
   */
  private addIntegrationDependencies(service: string, dependencies: Dependency[]) {
    const integrationDeps: Record<string, Dependency[]> = {
      'Stripe': [
        { name: 'stripe', version: '^14.0.0', dev: false, reason: 'Stripe SDK' },
        { name: '@stripe/stripe-js', version: '^2.0.0', dev: false, reason: 'Stripe.js' },
      ],
      'AWS S3': [
        { name: '@aws-sdk/client-s3', version: '^3.0.0', dev: false, reason: 'AWS S3 SDK' },
        { name: '@aws-sdk/s3-request-presigner', version: '^3.0.0', dev: false, reason: 'S3 presigned URLs' },
      ],
      'Google OAuth': [
        { name: 'next-auth', version: '^4.24.0', dev: false, reason: 'OAuth support' },
      ],
      'Redis': [
        { name: 'ioredis', version: '^5.0.0', dev: false, reason: 'Redis client' },
      ],
      'WebSocket': [
        { name: 'socket.io', version: '^4.0.0', dev: false, reason: 'WebSocket server' },
        { name: 'socket.io-client', version: '^4.0.0', dev: false, reason: 'WebSocket client' },
      ],
      'Supabase': [
        { name: '@supabase/supabase-js', version: '^2.0.0', dev: false, reason: 'Supabase client' },
      ],
    };

    const deps = integrationDeps[service];
    if (deps) {
      dependencies.push(...deps);
    }
  }

  /**
   * Deduplicate dependencies
   */
  private deduplicateDependencies(dependencies: Dependency[]): Dependency[] {
    const seen = new Map<string, Dependency>();

    for (const dep of dependencies) {
      if (!seen.has(dep.name)) {
        seen.set(dep.name, dep);
      }
    }

    return Array.from(seen.values());
  }

  /**
   * Estimate complexity based on steps and intent
   */
  private estimateComplexity(steps: Step[], intent: ParsedIntent): Complexity {
    const factors = {
      stepCount: steps.length,
      entityCount: intent.entities.length,
      integrationCount: intent.integrations.length,
      hasAuth: intent.actions.some(a => a.type === 'auth'),
      hasPayment: intent.actions.some(a => a.type === 'payment'),
      hasRealTime: intent.constraints.some(c => c.requirement.includes('Real-time')),
    };

    const score =
      factors.stepCount * 1 +
      factors.entityCount * 2 +
      factors.integrationCount * 3 +
      (factors.hasAuth ? 5 : 0) +
      (factors.hasPayment ? 10 : 0) +
      (factors.hasRealTime ? 5 : 0);

    if (score <= 10) return 'simple';
    if (score <= 25) return 'moderate';
    return 'complex';
  }

  /**
   * Estimate time based on steps
   */
  private estimateTime(steps: Step[]): string {
    const totalLines = steps.reduce((sum, s) => sum + s.estimatedLines, 0);

    if (totalLines < 200) return '1-2 hours';
    if (totalLines < 500) return '3-5 hours';
    if (totalLines < 1000) return '1-2 days';
    return '3-5 days';
  }

  /**
   * Summarize context for LLM prompt
   */
  private summarizeContext(context: CodebaseContext) {
    return {
      framework: context.framework,
      dependencies: context.dependencies.slice(0, 20).map(d => d.name),
      existingComponents: context.existingComponents.slice(0, 10).map(c => c.name),
      patterns: context.patterns.slice(0, 5).map(p => p.name),
      testingFramework: context.testingFramework,
      stateManagement: context.stateManagement,
    };
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
}

// Export singleton instance
export const implementationPlanner = new ImplementationPlanner();
