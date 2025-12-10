import {
  GeneratedFile,
  ValidationResult,
  ValidationError,
  ValidationWarning,
  SecurityIssue,
} from '../types';

// ============================================================================
// Quality Validator - Validates generated code against quality gates
// ============================================================================

export interface ValidatorConfig {
  securityChecks?: boolean;
  typeChecks?: boolean;
  accessibilityChecks?: boolean;
  performanceChecks?: boolean;
  minScore?: number;
}

export class QualityValidator {
  private config: ValidatorConfig;

  constructor(config: ValidatorConfig = {}) {
    this.config = {
      securityChecks: true,
      typeChecks: true,
      accessibilityChecks: true,
      performanceChecks: true,
      minScore: 80,
      ...config,
    };
  }

  /**
   * Validate all generated files
   */
  async validate(files: GeneratedFile[]): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    for (const file of files) {
      // Security validation
      if (this.config.securityChecks) {
        const securityResults = this.validateSecurity(file);
        errors.push(...securityResults.errors);
        warnings.push(...securityResults.warnings);
      }

      // Type validation
      if (this.config.typeChecks) {
        const typeResults = this.validateTypes(file);
        errors.push(...typeResults.errors);
        warnings.push(...typeResults.warnings);
      }

      // Accessibility validation
      if (this.config.accessibilityChecks && file.type === 'component') {
        const a11yResults = this.validateAccessibility(file);
        errors.push(...a11yResults.errors);
        warnings.push(...a11yResults.warnings);
      }

      // Performance validation
      if (this.config.performanceChecks) {
        const perfResults = this.validatePerformance(file);
        warnings.push(...perfResults.warnings);
      }
    }

    // Calculate score
    const score = this.calculateScore(errors, warnings, files.length);

    return {
      passed: errors.length === 0 && score >= this.config.minScore!,
      errors,
      warnings,
      score,
      suggestions: this.generateSuggestions(errors, warnings),
    };
  }

  /**
   * Security validation checks
   */
  private validateSecurity(file: GeneratedFile): { errors: ValidationError[]; warnings: ValidationWarning[] } {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const content = file.content;

    // SQL Injection checks
    const sqlInjectionPatterns = [
      /`.*\$\{.*\}.*(?:SELECT|INSERT|UPDATE|DELETE|DROP)/gi,
      /\+\s*['"].*(?:SELECT|INSERT|UPDATE|DELETE)/gi,
      /query\s*\(\s*['"`].*\+/gi,
    ];

    for (const pattern of sqlInjectionPatterns) {
      if (pattern.test(content)) {
        errors.push({
          type: 'sql-injection',
          file: file.path,
          message: 'Potential SQL injection vulnerability detected. Use parameterized queries.',
          severity: 'error',
          autoFixable: true,
        });
        break;
      }
    }

    // XSS checks
    const xssPatterns = [
      /dangerouslySetInnerHTML/g,
      /innerHTML\s*=/g,
      /document\.write/g,
      /eval\s*\(/g,
    ];

    for (const pattern of xssPatterns) {
      if (pattern.test(content)) {
        warnings.push({
          type: 'xss',
          file: file.path,
          message: 'Potential XSS vulnerability. Ensure content is properly sanitized.',
          severity: 'warning',
          suggestion: 'Use DOMPurify or similar library to sanitize HTML content.',
        });
        break;
      }
    }

    // Hardcoded secrets
    const secretPatterns = [
      /(?:api[_-]?key|apikey|secret|password|token|auth)\s*[:=]\s*['"][^'"]{8,}['"]/gi,
      /(?:sk|pk)_(?:test|live)_[a-zA-Z0-9]{20,}/g,
      /ghp_[a-zA-Z0-9]{36}/g,
      /xox[baprs]-[a-zA-Z0-9-]+/g,
    ];

    for (const pattern of secretPatterns) {
      if (pattern.test(content)) {
        errors.push({
          type: 'hardcoded-secrets',
          file: file.path,
          message: 'Hardcoded secrets detected. Use environment variables instead.',
          severity: 'error',
          autoFixable: false,
        });
        break;
      }
    }

    // Missing input validation
    if (file.type === 'api' && !content.includes('z.') && !content.includes('yup.') && !content.includes('joi.')) {
      warnings.push({
        type: 'missing-validation',
        file: file.path,
        message: 'API route may be missing input validation.',
        severity: 'warning',
        suggestion: 'Add Zod, Yup, or Joi schema validation for request bodies.',
      });
    }

    // CSRF check for state-changing operations
    if (file.type === 'api' && (content.includes('POST') || content.includes('PUT') || content.includes('DELETE'))) {
      if (!content.includes('csrf') && !content.includes('CSRF')) {
        warnings.push({
          type: 'missing-csrf',
          file: file.path,
          message: 'State-changing API may need CSRF protection.',
          severity: 'warning',
          suggestion: 'Consider adding CSRF token validation for non-GET requests.',
        });
      }
    }

    return { errors, warnings };
  }

  /**
   * TypeScript type validation
   */
  private validateTypes(file: GeneratedFile): { errors: ValidationError[]; warnings: ValidationWarning[] } {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const content = file.content;

    // Check for 'any' types
    const anyMatches = content.match(/:\s*any\b/g) || [];
    if (anyMatches.length > 0) {
      warnings.push({
        type: 'any-type',
        file: file.path,
        message: `Found ${anyMatches.length} usage(s) of 'any' type. Consider using specific types.`,
        severity: 'warning',
        suggestion: 'Replace any with specific types or use unknown.',
      });
    }

    // Check for missing return types on functions
    const funcWithoutReturn = /(?:function|const)\s+\w+\s*=?\s*(?:async\s*)?\([^)]*\)\s*(?:=>)?\s*{/g;
    const funcWithReturn = /(?:function|const)\s+\w+\s*=?\s*(?:async\s*)?\([^)]*\)\s*:\s*[^{]+{/g;

    const allFuncs = content.match(funcWithoutReturn)?.length || 0;
    const typedFuncs = content.match(funcWithReturn)?.length || 0;

    if (allFuncs > typedFuncs + 2) {
      warnings.push({
        type: 'missing-return-type',
        file: file.path,
        message: 'Some functions may be missing explicit return types.',
        severity: 'warning',
        suggestion: 'Add explicit return types for better type safety.',
      });
    }

    // Check for @ts-ignore
    if (content.includes('@ts-ignore') || content.includes('@ts-nocheck')) {
      warnings.push({
        type: 'ts-ignore',
        file: file.path,
        message: 'TypeScript ignore directive found. Consider fixing the underlying type issue.',
        severity: 'warning',
      });
    }

    return { errors, warnings };
  }

  /**
   * Accessibility validation for components
   */
  private validateAccessibility(file: GeneratedFile): { errors: ValidationError[]; warnings: ValidationWarning[] } {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const content = file.content;

    // Check for images without alt text
    if (content.includes('<img') && !content.includes('alt=')) {
      errors.push({
        type: 'missing-alt',
        file: file.path,
        message: 'Image elements must have alt attributes for accessibility.',
        severity: 'error',
        autoFixable: true,
      });
    }

    // Check for buttons without accessible names
    const buttonWithoutLabel = /<button[^>]*>(?:\s*<(?:svg|img)[^>]*>\s*)<\/button>/gi;
    if (buttonWithoutLabel.test(content)) {
      warnings.push({
        type: 'button-no-label',
        file: file.path,
        message: 'Buttons with only icons need aria-label for accessibility.',
        severity: 'warning',
        suggestion: 'Add aria-label to icon-only buttons.',
      });
    }

    // Check for form inputs without labels
    if (content.includes('<input') && !content.includes('<label') && !content.includes('aria-label')) {
      warnings.push({
        type: 'input-no-label',
        file: file.path,
        message: 'Form inputs should have associated labels.',
        severity: 'warning',
        suggestion: 'Add label elements or aria-label attributes.',
      });
    }

    // Check for onClick on non-interactive elements
    const onClickNonInteractive = /onClick\s*=.*(?:div|span|p|section)(?![^>]*role=)/gi;
    if (onClickNonInteractive.test(content)) {
      warnings.push({
        type: 'click-non-interactive',
        file: file.path,
        message: 'Click handlers on non-interactive elements need role and keyboard support.',
        severity: 'warning',
        suggestion: 'Add role="button" and onKeyDown handler, or use a button element.',
      });
    }

    // Check for proper heading hierarchy
    const headings = content.match(/<h[1-6]/gi) || [];
    if (headings.length > 1) {
      const levels = headings.map(h => parseInt(h.charAt(2)));
      for (let i = 1; i < levels.length; i++) {
        if (levels[i] > levels[i - 1] + 1) {
          warnings.push({
            type: 'heading-skip',
            file: file.path,
            message: 'Heading levels should not skip (e.g., h1 to h3).',
            severity: 'warning',
          });
          break;
        }
      }
    }

    return { errors, warnings };
  }

  /**
   * Performance validation
   */
  private validatePerformance(file: GeneratedFile): { warnings: ValidationWarning[] } {
    const warnings: ValidationWarning[] = [];
    const content = file.content;

    // Check for missing React.memo on potentially re-rendering components
    if (file.type === 'component' && content.includes('props') && !content.includes('memo(')) {
      // Only warn for components that receive callbacks or objects
      if (content.includes('onClick') || content.includes('onSubmit') || content.includes('data=')) {
        warnings.push({
          type: 'missing-memo',
          file: file.path,
          message: 'Consider using React.memo for components receiving callbacks or objects as props.',
          severity: 'warning',
          suggestion: 'Wrap component with React.memo to prevent unnecessary re-renders.',
        });
      }
    }

    // Check for inline object/array creation in JSX
    const inlineObjects = /(?:style|className|data)=\{\{/g;
    const matches = content.match(inlineObjects) || [];
    if (matches.length > 3) {
      warnings.push({
        type: 'inline-objects',
        file: file.path,
        message: 'Multiple inline object creations in JSX may cause unnecessary re-renders.',
        severity: 'warning',
        suggestion: 'Move inline objects to constants or useMemo.',
      });
    }

    // Check for missing useCallback on event handlers
    if (file.type === 'component') {
      const handlerFuncs = content.match(/const\s+handle\w+\s*=/g) || [];
      const useCallbacks = content.match(/useCallback/g) || [];

      if (handlerFuncs.length > 2 && useCallbacks.length < handlerFuncs.length - 1) {
        warnings.push({
          type: 'missing-useCallback',
          file: file.path,
          message: 'Event handlers in components should be wrapped in useCallback.',
          severity: 'warning',
          suggestion: 'Use useCallback for handler functions to prevent child re-renders.',
        });
      }
    }

    // Check for large bundle indicators
    if (content.includes("import * as") || content.includes("import _")) {
      warnings.push({
        type: 'large-import',
        file: file.path,
        message: 'Namespace imports may increase bundle size.',
        severity: 'warning',
        suggestion: 'Use named imports instead of namespace imports.',
      });
    }

    return { warnings };
  }

  /**
   * Calculate overall quality score
   */
  private calculateScore(errors: ValidationError[], warnings: ValidationWarning[], fileCount: number): number {
    // Start with 100 points
    let score = 100;

    // Deduct for errors (-10 per error, max -50)
    score -= Math.min(errors.length * 10, 50);

    // Deduct for warnings (-3 per warning, max -30)
    score -= Math.min(warnings.length * 3, 30);

    // Bonus for clean files (+2 per file with no issues, max +10)
    // This is approximated since we don't track per-file issues
    if (errors.length === 0 && warnings.length < 3) {
      score += Math.min(fileCount * 2, 10);
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Generate improvement suggestions
   */
  private generateSuggestions(errors: ValidationError[], warnings: ValidationWarning[]): string[] {
    const suggestions: string[] = [];

    // Security suggestions
    if (errors.some(e => e.type === 'sql-injection')) {
      suggestions.push('Use parameterized queries or an ORM like Prisma to prevent SQL injection.');
    }

    if (errors.some(e => e.type === 'hardcoded-secrets')) {
      suggestions.push('Move secrets to environment variables and use a .env file.');
    }

    // Type suggestions
    if (warnings.some(w => w.type === 'any-type')) {
      suggestions.push('Replace any types with specific types for better type safety.');
    }

    // Accessibility suggestions
    if (errors.some(e => e.type === 'missing-alt') || warnings.some(w => w.type === 'input-no-label')) {
      suggestions.push('Run axe-core or similar tool to check accessibility compliance.');
    }

    // Performance suggestions
    if (warnings.some(w => w.type === 'missing-memo' || w.type === 'missing-useCallback')) {
      suggestions.push('Consider using React DevTools Profiler to identify re-render issues.');
    }

    return suggestions;
  }
}

// Export singleton instance
export const qualityValidator = new QualityValidator();
