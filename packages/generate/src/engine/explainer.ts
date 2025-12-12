/**
 * Explainability Module
 *
 * Provides human-readable explanations for code generation decisions.
 * Helps users understand why code was generated in a certain way.
 */

import {
  ParsedIntent,
  ImplementationPlan,
  GeneratedFile,
  ValidationResult,
  Step,
  Dependency,
  Constraint,
} from '../types';

// ============================================================================
// Types
// ============================================================================

export interface GenerationExplanation {
  summary: string;
  intent: IntentExplanation;
  plan: PlanExplanation;
  files: FileExplanation[];
  security: SecurityExplanation[];
  dependencies: DependencyExplanation[];
  alternatives: AlternativeExplanation[];
  tips: string[];
}

export interface IntentExplanation {
  feature: string;
  extractedEntities: string[];
  detectedActions: string[];
  inferredConstraints: string[];
  framework: string;
  frameworkReason: string;
}

export interface PlanExplanation {
  totalSteps: number;
  complexity: string;
  complexityReason: string;
  criticalPath: string[];
  estimatedTime: string;
}

export interface FileExplanation {
  path: string;
  purpose: string;
  keyDecisions: string[];
  patterns: string[];
}

export interface SecurityExplanation {
  decision: string;
  reason: string;
  reference?: string;
}

export interface DependencyExplanation {
  name: string;
  reason: string;
  alternatives?: string[];
}

export interface AlternativeExplanation {
  topic: string;
  chosen: string;
  alternatives: string[];
  reason: string;
}

// ============================================================================
// Explainer Class
// ============================================================================

export class GenerationExplainer {
  /**
   * Generate a complete explanation for code generation
   */
  explain(
    intent: ParsedIntent,
    plan: ImplementationPlan,
    files: GeneratedFile[],
    validation?: ValidationResult
  ): GenerationExplanation {
    return {
      summary: this.generateSummary(intent, plan, files),
      intent: this.explainIntent(intent),
      plan: this.explainPlan(plan),
      files: this.explainFiles(files, plan),
      security: this.explainSecurity(intent, plan, validation),
      dependencies: this.explainDependencies(plan.dependencies),
      alternatives: this.explainAlternatives(intent, plan),
      tips: this.generateTips(intent, plan, files, validation),
    };
  }

  /**
   * Generate a human-readable summary
   */
  private generateSummary(
    intent: ParsedIntent,
    plan: ImplementationPlan,
    files: GeneratedFile[]
  ): string {
    const entityNames = intent.entities.map(e => e.name).join(', ');
    const actionTypes = [...new Set(intent.actions.map(a => a.type))];

    return `Generated ${files.length} files for "${intent.feature}" feature. ` +
      `This includes ${entityNames ? `data models (${entityNames})` : 'components'} ` +
      `with ${actionTypes.join(', ')} operations. ` +
      `Estimated complexity: ${plan.estimatedComplexity}. ` +
      `Framework: ${intent.framework}.`;
  }

  /**
   * Explain how the intent was parsed
   */
  private explainIntent(intent: ParsedIntent): IntentExplanation {
    const frameworkReasons: Record<string, string> = {
      next: 'Next.js detected from keywords like "app router", "server component", or explicit mention',
      react: 'React detected from component-related keywords or JSX references',
      express: 'Express.js detected from API/backend related keywords',
      fastify: 'Fastify detected from explicit mention or performance-focused requirements',
      node: 'Generic Node.js chosen as default for backend tasks',
      unknown: 'Framework could not be determined, using defaults',
    };

    return {
      feature: intent.feature,
      extractedEntities: intent.entities.map(e =>
        `${e.name} (${e.fields.length} fields, ${e.relations.length} relations)`
      ),
      detectedActions: intent.actions.map(a =>
        `${a.name} (${a.type}): ${a.description}`
      ),
      inferredConstraints: intent.constraints.map(c =>
        `[${c.priority}] ${c.type}: ${c.requirement}`
      ),
      framework: intent.framework,
      frameworkReason: frameworkReasons[intent.framework] || 'Explicitly specified',
    };
  }

  /**
   * Explain the implementation plan
   */
  private explainPlan(plan: ImplementationPlan): PlanExplanation {
    const complexityReasons: Record<string, string> = {
      simple: 'Few files, basic CRUD operations, no external integrations',
      moderate: 'Multiple entities, some integrations, standard patterns',
      complex: 'Many entities, external services, authentication, or real-time features',
    };

    // Identify critical path (steps with most dependencies)
    const criticalPath = plan.steps
      .filter(s => s.dependencies.length > 0 || plan.steps.some(other => other.dependencies.includes(s.id)))
      .sort((a, b) => a.order - b.order)
      .slice(0, 5)
      .map(s => s.description);

    return {
      totalSteps: plan.steps.length,
      complexity: plan.estimatedComplexity,
      complexityReason: complexityReasons[plan.estimatedComplexity],
      criticalPath,
      estimatedTime: plan.estimatedTime,
    };
  }

  /**
   * Explain each generated file
   */
  private explainFiles(files: GeneratedFile[], plan: ImplementationPlan): FileExplanation[] {
    return files.map(file => {
      const step = plan.steps.find(s => s.files.includes(file.path));
      const patterns = this.detectPatterns(file.content);

      return {
        path: file.path,
        purpose: step?.description || this.inferPurpose(file),
        keyDecisions: this.extractKeyDecisions(file),
        patterns,
      };
    });
  }

  /**
   * Infer file purpose from path and content
   */
  private inferPurpose(file: GeneratedFile): string {
    const path = file.path.toLowerCase();

    if (path.includes('route.ts') || path.includes('/api/')) {
      return 'API endpoint for handling HTTP requests';
    }
    if (path.includes('page.tsx') || path.includes('page.ts')) {
      return 'Page component for routing';
    }
    if (path.includes('/components/')) {
      return 'Reusable UI component';
    }
    if (path.includes('.test.') || path.includes('.spec.')) {
      return 'Test file for ensuring code quality';
    }
    if (path.includes('schema.prisma')) {
      return 'Database schema definition';
    }
    if (path.includes('/lib/') || path.includes('/utils/')) {
      return 'Utility functions and helpers';
    }
    if (path.includes('types.ts')) {
      return 'TypeScript type definitions';
    }

    return 'Supporting file for the feature';
  }

  /**
   * Extract key decisions from file content
   */
  private extractKeyDecisions(file: GeneratedFile): string[] {
    const decisions: string[] = [];
    const content = file.content;

    // Check for validation
    if (content.includes('z.object') || content.includes('z.string')) {
      decisions.push('Using Zod for runtime validation to ensure type safety');
    }

    // Check for error handling
    if (content.includes('try {') && content.includes('catch')) {
      decisions.push('Comprehensive error handling with try/catch blocks');
    }

    // Check for accessibility
    if (content.includes('aria-') || content.includes('role=')) {
      decisions.push('ARIA attributes added for accessibility compliance');
    }

    // Check for memo
    if (content.includes('memo(') || content.includes('useMemo')) {
      decisions.push('Performance optimization with memoization');
    }

    // Check for loading states
    if (content.includes('isLoading') || content.includes('loading')) {
      decisions.push('Loading state management for better UX');
    }

    // Check for security patterns
    if (content.includes('withAuth') || content.includes('auth')) {
      decisions.push('Authentication middleware for protected resources');
    }

    if (content.includes('withRateLimit') || content.includes('rateLimit')) {
      decisions.push('Rate limiting to prevent abuse');
    }

    return decisions;
  }

  /**
   * Detect patterns used in the code
   */
  private detectPatterns(content: string): string[] {
    const patterns: string[] = [];

    if (content.includes('useState')) patterns.push('React useState hook');
    if (content.includes('useEffect')) patterns.push('React useEffect hook');
    if (content.includes('useCallback')) patterns.push('useCallback for performance');
    if (content.includes('useQuery') || content.includes('useMutation')) {
      patterns.push('TanStack Query for data fetching');
    }
    if (content.includes('useForm')) patterns.push('React Hook Form');
    if (content.includes('Server Component') || content.includes('async function') && content.includes('Page')) {
      patterns.push('React Server Components');
    }
    if (content.includes("'use client'")) patterns.push('Client Component');
    if (content.includes('NextRequest') || content.includes('NextResponse')) {
      patterns.push('Next.js App Router API');
    }

    return patterns;
  }

  /**
   * Explain security decisions
   */
  private explainSecurity(
    intent: ParsedIntent,
    plan: ImplementationPlan,
    validation?: ValidationResult
  ): SecurityExplanation[] {
    const explanations: SecurityExplanation[] = [];

    // Add explanations from constraints
    for (const constraint of intent.constraints.filter(c => c.type === 'security')) {
      explanations.push({
        decision: constraint.requirement,
        reason: `Required for ${constraint.priority === 'required' ? 'compliance' : 'best practice'}`,
        reference: this.getSecurityReference(constraint.requirement),
      });
    }

    // Add explanations from security notes
    for (const note of plan.securityNotes) {
      explanations.push({
        decision: note,
        reason: 'OWASP Top 10 compliance',
        reference: 'https://owasp.org/Top10/',
      });
    }

    // Add explanations from validation
    if (validation) {
      for (const error of validation.errors.filter(e => e.type.includes('security') || e.type.includes('injection'))) {
        explanations.push({
          decision: `Fixed: ${error.message}`,
          reason: 'Security vulnerability detected and addressed',
        });
      }
    }

    return explanations;
  }

  /**
   * Get security reference URL
   */
  private getSecurityReference(requirement: string): string | undefined {
    const lower = requirement.toLowerCase();

    if (lower.includes('sql injection')) {
      return 'https://owasp.org/Top10/A03_2021-Injection/';
    }
    if (lower.includes('xss') || lower.includes('cross-site')) {
      return 'https://owasp.org/Top10/A03_2021-Injection/';
    }
    if (lower.includes('authentication') || lower.includes('auth')) {
      return 'https://owasp.org/Top10/A07_2021-Identification_and_Authentication_Failures/';
    }
    if (lower.includes('rate limit')) {
      return 'https://owasp.org/Top10/A04_2021-Insecure_Design/';
    }
    if (lower.includes('csrf')) {
      return 'https://owasp.org/www-community/attacks/csrf';
    }

    return undefined;
  }

  /**
   * Explain dependency choices
   */
  private explainDependencies(dependencies: Dependency[]): DependencyExplanation[] {
    const alternatives: Record<string, string[]> = {
      'zod': ['yup', 'joi', 'io-ts'],
      'react-hook-form': ['formik', 'final-form'],
      '@tanstack/react-query': ['swr', 'rtk-query'],
      'zustand': ['redux', 'jotai', 'recoil'],
      '@prisma/client': ['drizzle-orm', 'typeorm', 'knex'],
      'next-auth': ['clerk', '@supabase/auth-helpers', 'lucia'],
      'vitest': ['jest', 'mocha'],
      'tailwindcss': ['styled-components', 'emotion', 'css-modules'],
    };

    return dependencies.map(dep => ({
      name: dep.name,
      reason: dep.reason,
      alternatives: alternatives[dep.name],
    }));
  }

  /**
   * Explain alternative approaches that could have been taken
   */
  private explainAlternatives(intent: ParsedIntent, plan: ImplementationPlan): AlternativeExplanation[] {
    const alternatives: AlternativeExplanation[] = [];

    // Framework alternatives
    if (intent.framework === 'next') {
      alternatives.push({
        topic: 'Framework',
        chosen: 'Next.js with App Router',
        alternatives: ['Remix', 'Astro', 'SvelteKit'],
        reason: 'Best React ecosystem support with server components and API routes',
      });
    }

    // State management alternatives
    if (plan.dependencies.some(d => d.name === 'zustand')) {
      alternatives.push({
        topic: 'State Management',
        chosen: 'Zustand',
        alternatives: ['Redux Toolkit', 'Jotai', 'React Context'],
        reason: 'Minimal boilerplate with good TypeScript support',
      });
    }

    // Database alternatives
    if (plan.dependencies.some(d => d.name === '@prisma/client')) {
      alternatives.push({
        topic: 'Database ORM',
        chosen: 'Prisma',
        alternatives: ['Drizzle ORM', 'TypeORM', 'Knex'],
        reason: 'Best TypeScript integration with auto-generated types',
      });
    }

    // Validation alternatives
    if (plan.dependencies.some(d => d.name === 'zod')) {
      alternatives.push({
        topic: 'Validation',
        chosen: 'Zod',
        alternatives: ['Yup', 'Joi', 'class-validator'],
        reason: 'TypeScript-first with excellent type inference',
      });
    }

    return alternatives;
  }

  /**
   * Generate helpful tips based on the generation
   */
  private generateTips(
    intent: ParsedIntent,
    plan: ImplementationPlan,
    files: GeneratedFile[],
    validation?: ValidationResult
  ): string[] {
    const tips: string[] = [];

    // Entity-specific tips
    if (intent.entities.length > 3) {
      tips.push('Consider using a monorepo structure for better organization with many entities');
    }

    // Security tips
    if (intent.actions.some(a => a.type === 'auth')) {
      tips.push('Remember to configure environment variables for auth secrets before deployment');
    }

    // Performance tips
    if (files.length > 10) {
      tips.push('Consider code splitting and lazy loading for optimal bundle size');
    }

    // Testing tips
    if (plan.tests.length > 0) {
      tips.push(`Generated ${plan.tests.reduce((sum, t) => sum + t.testCases.length, 0)} test cases - run them with 'npm test'`);
    }

    // Validation tips
    if (validation && !validation.passed) {
      tips.push(`Quality score: ${validation.score}/100 - review ${validation.errors.length} errors and ${validation.warnings.length} warnings`);
    }

    // General tips
    tips.push('Review the generated code before committing - AI-generated code should be verified');
    tips.push('Run the security audit with "rana security:check" after implementation');

    return tips;
  }

  /**
   * Format explanation as markdown
   */
  formatMarkdown(explanation: GenerationExplanation): string {
    let md = `# Code Generation Explanation\n\n`;
    md += `## Summary\n${explanation.summary}\n\n`;

    md += `## Intent Analysis\n`;
    md += `- **Feature**: ${explanation.intent.feature}\n`;
    md += `- **Framework**: ${explanation.intent.framework} (${explanation.intent.frameworkReason})\n`;
    md += `- **Entities**: ${explanation.intent.extractedEntities.join(', ') || 'None detected'}\n`;
    md += `- **Actions**: ${explanation.intent.detectedActions.join(', ')}\n\n`;

    md += `## Implementation Plan\n`;
    md += `- **Complexity**: ${explanation.plan.complexity} (${explanation.plan.complexityReason})\n`;
    md += `- **Steps**: ${explanation.plan.totalSteps}\n`;
    md += `- **Estimated Time**: ${explanation.plan.estimatedTime}\n`;
    md += `- **Critical Path**:\n${explanation.plan.criticalPath.map(p => `  1. ${p}`).join('\n')}\n\n`;

    md += `## Generated Files\n`;
    for (const file of explanation.files) {
      md += `### ${file.path}\n`;
      md += `**Purpose**: ${file.purpose}\n`;
      if (file.keyDecisions.length > 0) {
        md += `**Key Decisions**:\n${file.keyDecisions.map(d => `- ${d}`).join('\n')}\n`;
      }
      if (file.patterns.length > 0) {
        md += `**Patterns**: ${file.patterns.join(', ')}\n`;
      }
      md += '\n';
    }

    if (explanation.security.length > 0) {
      md += `## Security Decisions\n`;
      for (const sec of explanation.security) {
        md += `- **${sec.decision}**: ${sec.reason}`;
        if (sec.reference) md += ` ([reference](${sec.reference}))`;
        md += '\n';
      }
      md += '\n';
    }

    if (explanation.dependencies.length > 0) {
      md += `## Dependencies\n`;
      for (const dep of explanation.dependencies) {
        md += `- **${dep.name}**: ${dep.reason}`;
        if (dep.alternatives) md += ` (alternatives: ${dep.alternatives.join(', ')})`;
        md += '\n';
      }
      md += '\n';
    }

    if (explanation.alternatives.length > 0) {
      md += `## Alternative Approaches\n`;
      for (const alt of explanation.alternatives) {
        md += `### ${alt.topic}\n`;
        md += `- **Chosen**: ${alt.chosen}\n`;
        md += `- **Alternatives**: ${alt.alternatives.join(', ')}\n`;
        md += `- **Reason**: ${alt.reason}\n\n`;
      }
    }

    md += `## Tips\n`;
    for (const tip of explanation.tips) {
      md += `- ${tip}\n`;
    }

    return md;
  }

  /**
   * Format explanation as JSON
   */
  formatJSON(explanation: GenerationExplanation): string {
    return JSON.stringify(explanation, null, 2);
  }
}

// Export singleton instance
export const generationExplainer = new GenerationExplainer();
