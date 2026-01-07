/**
 * @rana/compliance - Compliance Enforcer
 */

import type {
  ComplianceRule,
  ComplianceContext,
  ComplianceEnforcerConfig,
  ComplianceEnforcementResult,
  ComplianceViolation,
  EnforcementAction,
} from './types';
import { getAllPresetRules } from './rules';

/**
 * ComplianceEnforcer - Enforce compliance rules on AI outputs
 */
export class ComplianceEnforcer {
  private rules: Map<string, ComplianceRule> = new Map();
  private violations: ComplianceViolation[] = [];
  private config: Required<ComplianceEnforcerConfig>;

  constructor(config: ComplianceEnforcerConfig = {}) {
    this.config = {
      rules: config.rules ?? [],
      enableAllPresets: config.enableAllPresets ?? false,
      onViolation: config.onViolation ?? (() => {}),
      onEnforcement: config.onEnforcement ?? (() => {}),
      strictMode: config.strictMode ?? false,
      logViolations: config.logViolations ?? true,
      storeViolations: config.storeViolations ?? true,
    };

    this.initialize();
  }

  private initialize(): void {
    // Add preset rules if enabled
    if (this.config.enableAllPresets) {
      const presets = getAllPresetRules();
      presets.forEach(rule => this.addRule(rule));
    }

    // Add custom rules
    this.config.rules.forEach(rule => this.addRule(rule));
  }

  /**
   * Add a compliance rule
   */
  addRule(rule: ComplianceRule): void {
    if (!rule.enabled && rule.enabled !== undefined) {
      return;
    }
    this.rules.set(rule.id, rule);
  }

  /**
   * Remove a rule
   */
  removeRule(id: string): void {
    this.rules.delete(id);
  }

  /**
   * Get rule by ID
   */
  getRule(id: string): ComplianceRule | undefined {
    return this.rules.get(id);
  }

  /**
   * Get all rules
   */
  getAllRules(): ComplianceRule[] {
    return Array.from(this.rules.values());
  }

  /**
   * Enforce compliance on output
   */
  async enforce(
    input: string,
    output: string,
    context: Partial<ComplianceContext> = {}
  ): Promise<ComplianceEnforcementResult> {
    const fullContext: ComplianceContext = {
      input,
      output,
      ...context,
    };

    const rulesChecked: ComplianceRule[] = [];
    const violations: ComplianceViolation[] = [];
    let finalOutput = output;
    let overallAction: EnforcementAction = 'allow';
    const warnings: string[] = [];

    // Check all rules
    for (const rule of this.rules.values()) {
      if (!rule.enabled && rule.enabled !== undefined) {
        continue;
      }

      rulesChecked.push(rule);

      try {
        const checkResult = await rule.check(input, output, fullContext);

        if (!checkResult.compliant) {
          const violation: ComplianceViolation = {
            rule,
            context: fullContext,
            checkResult,
            actionTaken: checkResult.action,
            timestamp: new Date(),
            userId: context.user?.id,
          };

          violations.push(violation);

          // Log violation
          if (this.config.logViolations) {
            console.warn(
              `[Compliance Violation] ${rule.name} (${rule.severity})`,
              {
                rule: rule.id,
                action: checkResult.action,
                message: checkResult.message,
                issues: checkResult.issues,
              }
            );
          }

          // Store violation
          if (this.config.storeViolations) {
            this.violations.push(violation);
          }

          // Trigger violation callback
          await this.config.onViolation(violation);

          // Apply enforcement action
          switch (checkResult.action) {
            case 'block':
              overallAction = 'block';
              finalOutput = '';
              warnings.push(`Response blocked due to: ${checkResult.message}`);
              break;

            case 'redact':
              if (checkResult.replacement) {
                finalOutput = checkResult.replacement;
                if (overallAction !== 'block') {
                  overallAction = 'redact';
                }
              }
              break;

            case 'append':
              if (checkResult.replacement) {
                finalOutput = checkResult.replacement;
                if (overallAction !== 'block') {
                  overallAction = 'append';
                }
              }
              break;

            case 'replace':
              if (checkResult.replacement) {
                finalOutput = checkResult.replacement;
                if (overallAction !== 'block') {
                  overallAction = 'replace';
                }
              }
              break;

            case 'warn':
              if (checkResult.message) {
                warnings.push(checkResult.message);
              }
              if (overallAction === 'allow') {
                overallAction = 'warn';
              }
              break;

            case 'escalate':
              warnings.push('Response requires human review');
              if (overallAction !== 'block') {
                overallAction = 'escalate';
              }
              break;
          }

          // In strict mode, block on any violation
          if (this.config.strictMode && checkResult.severity === 'critical') {
            overallAction = 'block';
            finalOutput = '';
            break;
          }
        }
      } catch (error) {
        console.error(`Error checking rule ${rule.id}:`, error);
        if (this.config.strictMode) {
          overallAction = 'block';
          finalOutput = '';
          warnings.push(`Rule check failed: ${rule.id}`);
        }
      }
    }

    const result: ComplianceEnforcementResult = {
      compliant: violations.length === 0,
      originalOutput: output,
      modifiedOutput: finalOutput !== output ? finalOutput : undefined,
      finalOutput,
      rulesChecked,
      violations,
      action: overallAction,
      warnings: warnings.length > 0 ? warnings : undefined,
      wasModified: finalOutput !== output,
    };

    // Trigger enforcement callback
    await this.config.onEnforcement(result);

    return result;
  }

  /**
   * Check compliance without enforcement (dry run)
   */
  async check(
    input: string,
    output: string,
    context: Partial<ComplianceContext> = {}
  ): Promise<ComplianceEnforcementResult> {
    // Save current config
    const originalStrictMode = this.config.strictMode;

    // Temporarily disable strict mode for dry run
    this.config.strictMode = false;

    const result = await this.enforce(input, output, context);

    // Restore original config
    this.config.strictMode = originalStrictMode;

    return result;
  }

  /**
   * Get violation history
   */
  getViolations(options?: {
    ruleId?: string;
    userId?: string;
    since?: Date;
    limit?: number;
  }): ComplianceViolation[] {
    let filtered = [...this.violations];

    if (options?.ruleId) {
      filtered = filtered.filter(v => v.rule.id === options.ruleId);
    }

    if (options?.userId) {
      filtered = filtered.filter(v => v.userId === options.userId);
    }

    if (options?.since) {
      filtered = filtered.filter(v => v.timestamp >= options.since!);
    }

    if (options?.limit) {
      filtered = filtered.slice(0, options.limit);
    }

    return filtered;
  }

  /**
   * Clear violation history
   */
  clearViolations(options?: { ruleId?: string; userId?: string }): void {
    if (!options) {
      this.violations = [];
      return;
    }

    this.violations = this.violations.filter(v => {
      if (options.ruleId && v.rule.id === options.ruleId) {
        return false;
      }
      if (options.userId && v.userId === options.userId) {
        return false;
      }
      return true;
    });
  }

  /**
   * Get compliance statistics
   */
  getStats(): {
    totalRules: number;
    enabledRules: number;
    totalViolations: number;
    violationsByRule: Record<string, number>;
    violationsBySeverity: Record<string, number>;
    recentViolations: ComplianceViolation[];
  } {
    const violationsByRule: Record<string, number> = {};
    const violationsBySeverity: Record<string, number> = {};

    for (const violation of this.violations) {
      // Count by rule
      violationsByRule[violation.rule.id] = (violationsByRule[violation.rule.id] ?? 0) + 1;

      // Count by severity
      violationsBySeverity[violation.rule.severity] =
        (violationsBySeverity[violation.rule.severity] ?? 0) + 1;
    }

    return {
      totalRules: this.rules.size,
      enabledRules: Array.from(this.rules.values()).filter(r => r.enabled !== false).length,
      totalViolations: this.violations.length,
      violationsByRule,
      violationsBySeverity,
      recentViolations: this.violations.slice(-10),
    };
  }

  /**
   * Export configuration
   */
  export(): { rules: ComplianceRule[] } {
    return {
      rules: Array.from(this.rules.values()),
    };
  }

  /**
   * Import configuration
   */
  import(config: { rules: ComplianceRule[] }): void {
    this.rules.clear();
    config.rules.forEach(rule => this.addRule(rule));
  }
}

/**
 * Create a compliance enforcer instance
 */
export function createComplianceEnforcer(config?: ComplianceEnforcerConfig): ComplianceEnforcer {
  return new ComplianceEnforcer(config);
}
