/**
 * Design System Quality Gate Checker
 * Enforces design system compliance in RANA projects
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';
import type { RanaConfig } from '../config';

export interface DesignSystemViolation {
  file: string;
  line?: number;
  rule: string;
  message: string;
  severity: 'error' | 'warning';
  autofix?: string;
}

export interface DesignSystemCheckResult {
  passed: boolean;
  violations: DesignSystemViolation[];
  componentsCovered: number;
  totalComponents: number;
  coveragePercent: number;
}

export class DesignSystemChecker {
  private config: RanaConfig;
  private designSystemPath: string;

  constructor(config: RanaConfig) {
    this.config = config;
    this.designSystemPath = config.standards?.design_system?.components?.path || 'src/components/ui';
  }

  /**
   * Run all design system checks
   */
  async check(): Promise<DesignSystemCheckResult> {
    const violations: DesignSystemViolation[] = [];

    // 1. Check for unauthorized HTML elements
    const htmlViolations = await this.checkUnauthorizedHTML();
    violations.push(...htmlViolations);

    // 2. Check for inline styles
    const inlineStyleViolations = await this.checkInlineStyles();
    violations.push(...inlineStyleViolations);

    // 3. Check for missing design system imports
    const importViolations = await this.checkDesignSystemImports();
    violations.push(...importViolations);

    // 4. Check color usage (must use CSS variables)
    const colorViolations = await this.checkColorUsage();
    violations.push(...colorViolations);

    // 5. Check spacing consistency
    const spacingViolations = await this.checkSpacingConsistency();
    violations.push(...spacingViolations);

    // Calculate coverage
    const coverage = await this.calculateCoverage();

    return {
      passed: violations.filter(v => v.severity === 'error').length === 0,
      violations,
      componentsCovered: coverage.covered,
      totalComponents: coverage.total,
      coveragePercent: coverage.percent,
    };
  }

  /**
   * Check for direct HTML elements that should use design system
   */
  private async checkUnauthorizedHTML(): Promise<DesignSystemViolation[]> {
    const violations: DesignSystemViolation[] = [];
    const files = await glob('src/**/*.{tsx,jsx}', { ignore: [this.designSystemPath + '/**'] });

    const unauthorizedElements = [
      { element: 'button', component: 'Button', path: '@/components/ui/button' },
      { element: 'input', component: 'Input', path: '@/components/ui/input' },
      { element: 'textarea', component: 'Textarea', path: '@/components/ui/textarea' },
      { element: 'select', component: 'Select', path: '@/components/ui/select' },
      { element: 'dialog', component: 'Dialog', path: '@/components/ui/dialog' },
    ];

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');
      const lines = content.split('\n');

      for (let i = 0; i < lines.length; i++) {
        for (const { element, component, path: componentPath } of unauthorizedElements) {
          // Check for <button className="...">
          const regex = new RegExp(`<${element}[^>]*className=`, 'g');
          if (regex.test(lines[i])) {
            violations.push({
              file,
              line: i + 1,
              rule: 'no-unauthorized-html',
              message: `Use <${component}> from '${componentPath}' instead of <${element}>`,
              severity: 'error',
              autofix: `import { ${component} } from '${componentPath}';`,
            });
          }
        }
      }
    }

    return violations;
  }

  /**
   * Check for inline styles (should use Tailwind classes from design system)
   */
  private async checkInlineStyles(): Promise<DesignSystemViolation[]> {
    const violations: DesignSystemViolation[] = [];
    const files = await glob('src/**/*.{tsx,jsx}', { ignore: [this.designSystemPath + '/**'] });

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');
      const lines = content.split('\n');

      for (let i = 0; i < lines.length; i++) {
        // Check for style={{...}}
        if (lines[i].match(/style=\{\{/)) {
          violations.push({
            file,
            line: i + 1,
            rule: 'no-inline-styles',
            message: 'Inline styles are not allowed. Use Tailwind classes or design system components.',
            severity: 'error',
          });
        }
      }
    }

    return violations;
  }

  /**
   * Check that components import from design system
   */
  private async checkDesignSystemImports(): Promise<DesignSystemViolation[]> {
    const violations: DesignSystemViolation[] = [];
    const files = await glob('src/features/**/*.{tsx,jsx}');
    const requiredImports = this.config.standards?.design_system?.components?.required_imports || [];

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');

      // Check if file uses UI components
      const usesUIComponents = /<[A-Z][a-zA-Z]*/.test(content);
      if (!usesUIComponents) continue;

      // Check for design system imports
      const hasDesignSystemImport = content.includes('@/components/ui/') || content.includes('../../../components/ui/');

      if (!hasDesignSystemImport) {
        violations.push({
          file,
          rule: 'missing-design-system-import',
          message: 'Component uses UI elements but does not import from design system',
          severity: 'warning',
          autofix: `import { ${requiredImports.join(', ')} } from '@/components/ui';`,
        });
      }
    }

    return violations;
  }

  /**
   * Check color usage (must use CSS variables or design tokens)
   */
  private async checkColorUsage(): Promise<DesignSystemViolation[]> {
    const violations: DesignSystemViolation[] = [];
    const files = await glob('src/**/*.{tsx,jsx,css}', { ignore: [this.designSystemPath + '/**'] });

    // Hardcoded colors to avoid
    const hardcodedColorPatterns = [
      /#[0-9a-fA-F]{3,6}/,  // Hex colors
      /rgb\(/,               // RGB colors
      /rgba\(/,              // RGBA colors
      /hsl\(/,               // HSL colors
    ];

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');
      const lines = content.split('\n');

      for (let i = 0; i < lines.length; i++) {
        for (const pattern of hardcodedColorPatterns) {
          if (pattern.test(lines[i]) && !lines[i].includes('var(--')) {
            // Exception: Allow in CSS variable definitions
            if (lines[i].includes('--')) continue;

            violations.push({
              file,
              line: i + 1,
              rule: 'no-hardcoded-colors',
              message: 'Use CSS variables (var(--color-*)) or Tailwind color classes from design system',
              severity: 'warning',
            });
          }
        }
      }
    }

    return violations;
  }

  /**
   * Check spacing consistency (must use design tokens)
   */
  private async checkSpacingConsistency(): Promise<DesignSystemViolation[]> {
    const violations: DesignSystemViolation[] = [];
    const files = await glob('src/**/*.{tsx,jsx}', { ignore: [this.designSystemPath + '/**'] });

    // Magic numbers in spacing (px values that aren't multiples of 4)
    const spacingPattern = /(?:margin|padding|gap|width|height).*?(\d+)px/g;

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');
      const lines = content.split('\n');

      for (let i = 0; i < lines.length; i++) {
        const matches = [...lines[i].matchAll(spacingPattern)];
        for (const match of matches) {
          const value = parseInt(match[1]);
          if (value % 4 !== 0) {
            violations.push({
              file,
              line: i + 1,
              rule: 'spacing-consistency',
              message: `Spacing value ${value}px is not a multiple of 4. Use design system spacing (4px grid).`,
              severity: 'warning',
            });
          }
        }
      }
    }

    return violations;
  }

  /**
   * Calculate design system coverage
   */
  private async calculateCoverage(): Promise<{ covered: number; total: number; percent: number }> {
    const files = await glob('src/**/*.{tsx,jsx}');
    let total = 0;
    let covered = 0;

    for (const file of files) {
      // Skip design system files themselves
      if (file.includes(this.designSystemPath)) continue;

      const content = fs.readFileSync(file, 'utf-8');

      // Check if file has UI components
      const hasUIComponents = /<[A-Z][a-zA-Z]*/.test(content);
      if (!hasUIComponents) continue;

      total++;

      // Check if uses design system
      const usesDesignSystem = content.includes('@/components/ui/');
      if (usesDesignSystem) {
        covered++;
      }
    }

    return {
      covered,
      total,
      percent: total > 0 ? Math.round((covered / total) * 100) : 100,
    };
  }

  /**
   * Generate design system compliance report
   */
  async generateReport(): Promise<string> {
    const result = await this.check();

    let report = '# Design System Compliance Report\n\n';
    report += `**Coverage**: ${result.componentsCovered}/${result.totalComponents} components (${result.coveragePercent}%)\n`;
    report += `**Status**: ${result.passed ? '✅ Passed' : '❌ Failed'}\n\n`;

    if (result.violations.length === 0) {
      report += '✅ No violations found!\n';
      return report;
    }

    // Group violations by severity
    const errors = result.violations.filter(v => v.severity === 'error');
    const warnings = result.violations.filter(v => v.severity === 'warning');

    if (errors.length > 0) {
      report += `## ❌ Errors (${errors.length})\n\n`;
      for (const violation of errors) {
        report += `### ${violation.file}${violation.line ? `:${violation.line}` : ''}\n`;
        report += `**Rule**: ${violation.rule}\n`;
        report += `**Message**: ${violation.message}\n`;
        if (violation.autofix) {
          report += `**Autofix**: \`${violation.autofix}\`\n`;
        }
        report += '\n';
      }
    }

    if (warnings.length > 0) {
      report += `## ⚠️ Warnings (${warnings.length})\n\n`;
      for (const violation of warnings) {
        report += `### ${violation.file}${violation.line ? `:${violation.line}` : ''}\n`;
        report += `**Rule**: ${violation.rule}\n`;
        report += `**Message**: ${violation.message}\n\n`;
      }
    }

    return report;
  }
}
