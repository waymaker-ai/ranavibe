// ---------------------------------------------------------------------------
// @cofounder/openclaw - OpenClaw Skill
// ---------------------------------------------------------------------------
// The main CoFounder OpenClaw skill that registers with OpenClaw's skill system.
// OpenClaw skills export a manifest and handler functions. This skill adds
// guardrails (PII, injection, toxicity, compliance, cost) to any OpenClaw agent.
// ---------------------------------------------------------------------------

import type {
  OpenClawSkillConfig,
  OpenClawSkill,
  OpenClawMessage,
  OpenClawContext,
  SkillManifest,
  OpenClawHooks,
  HookResult,
  GuardResult,
  GuardReport,
  CostReport,
  ComplianceReport,
  Violation,
  AuditEntry,
} from './types.js';
import { detectPII, redactPII, hasPII, detectInjection, detectToxicity, hasToxicity, BudgetTracker } from './guards.js';
import { checkCompliance, getAvailableFrameworks } from './compliance.js';
import { formatGuardResult, formatGuardReport, formatCostReport, formatComplianceReport, formatScanResult } from './reporter.js';

// =========================================================================
// Default Configuration
// =========================================================================

const DEFAULT_CONFIG: Required<OpenClawSkillConfig> = {
  pii: 'redact',
  injectionSensitivity: 'medium',
  injectionAction: 'block',
  toxicity: 'warn',
  compliance: [],
  budget: { limit: 10, period: 'day', warningThreshold: 0.8, onExceeded: 'warn' },
  model: 'gpt-4o',
  audit: { enabled: true, level: 'standard', maxEntries: 1000 },
  blockedMessage: 'This message was blocked by CoFounder guardrails for safety reasons.',
  guardToolCalls: true,
  allowedChannels: [],
};

// =========================================================================
// Core Guard Function
// =========================================================================

function guardText(
  text: string,
  config: Required<OpenClawSkillConfig>,
  direction: 'input' | 'output',
  budgetTracker: BudgetTracker | null,
  context?: OpenClawContext
): GuardResult {
  const startTime = Date.now();
  const violations: Violation[] = [];
  let blocked = false;
  let reason: string | undefined;
  let redactedContent: string | undefined;

  // -- PII Detection --
  const piiFindings = config.pii !== false ? detectPII(text) : [];

  if (piiFindings.length > 0) {
    if (config.pii === 'block') {
      blocked = true;
      reason = `PII detected: ${[...new Set(piiFindings.map((f) => f.type))].join(', ')}`;
      violations.push({
        rule: 'pii-block',
        type: 'pii',
        severity: 'high',
        message: reason,
        action: 'block',
      });
    } else if (config.pii === 'redact') {
      const result = redactPII(text);
      redactedContent = result.redacted;
      violations.push({
        rule: 'pii-redact',
        type: 'pii',
        severity: 'medium',
        message: `PII redacted: ${piiFindings.length} item(s)`,
        action: 'redact',
      });
    } else {
      // detect only
      violations.push({
        rule: 'pii-detect',
        type: 'pii',
        severity: 'low',
        message: `PII detected: ${piiFindings.length} item(s)`,
        action: 'log',
      });
    }
  }

  // -- Injection Detection --
  const injectionResult = config.injectionAction !== false
    ? detectInjection(text, config.injectionSensitivity)
    : { score: 0, findings: [], blocked: false };

  if (injectionResult.findings.length > 0) {
    if (config.injectionAction === 'block' && injectionResult.blocked) {
      blocked = true;
      reason = reason
        ? `${reason}; Injection attempt detected (score: ${injectionResult.score})`
        : `Injection attempt detected (score: ${injectionResult.score})`;
      violations.push({
        rule: 'injection-block',
        type: 'injection',
        severity: 'critical',
        message: `Injection blocked: ${injectionResult.findings.length} pattern(s), score ${injectionResult.score}`,
        action: 'block',
      });
    } else {
      violations.push({
        rule: 'injection-warn',
        type: 'injection',
        severity: 'high',
        message: `Injection patterns: ${injectionResult.findings.length}, score ${injectionResult.score}`,
        action: config.injectionAction === 'sanitize' ? 'sanitize' : 'warn',
      });
    }
  }

  // -- Toxicity Detection --
  const toxicityFindings = config.toxicity !== false ? detectToxicity(text) : [];

  if (toxicityFindings.length > 0) {
    if (config.toxicity === 'block') {
      const hasSevere = toxicityFindings.some((f) => f.severity === 'critical' || f.severity === 'high');
      if (hasSevere) {
        blocked = true;
        reason = reason
          ? `${reason}; Toxic content detected`
          : 'Toxic content detected';
      }
    }
    for (const f of toxicityFindings) {
      violations.push({
        rule: `toxicity-${f.category}`,
        type: 'toxicity',
        severity: f.severity,
        message: `Toxicity: ${f.category} (${f.severity})`,
        action: config.toxicity === 'block' ? 'block' : 'warn',
      });
    }
  }

  // -- Compliance Checks --
  const complianceResult = config.compliance.length > 0
    ? checkCompliance(text, config.compliance, direction)
    : { compliant: true, violations: [], frameworksChecked: [] };

  if (!complianceResult.compliant) {
    const criticalViolations = complianceResult.violations.filter((v) => v.severity === 'critical');
    if (criticalViolations.length > 0) {
      blocked = true;
      reason = reason
        ? `${reason}; Compliance violation (${criticalViolations.map((v) => v.framework.toUpperCase()).join(', ')})`
        : `Compliance violation (${criticalViolations.map((v) => v.framework.toUpperCase()).join(', ')})`;
    }
    for (const v of complianceResult.violations) {
      violations.push({
        rule: v.rule,
        type: 'compliance',
        severity: v.severity,
        message: v.message,
        action: v.severity === 'critical' ? 'block' : 'warn',
      });
    }
  }

  // -- Budget Check --
  let cost: GuardResult['cost'] = undefined;
  if (budgetTracker) {
    const model = context?.agent?.model || config.model;
    const tokens = budgetTracker.estimateTokens(text);
    const estimate = budgetTracker.estimateCost(model, tokens, 0);

    if (direction === 'output') {
      // Record cost on output
      budgetTracker.recordCost(model, 0, tokens);
    } else {
      budgetTracker.recordCost(model, tokens, 0);
    }

    cost = estimate;

    if (budgetTracker.isExceeded()) {
      if (budgetTracker.action === 'block') {
        blocked = true;
        reason = reason
          ? `${reason}; Budget exceeded`
          : 'Budget exceeded';
      }
      violations.push({
        rule: 'budget-exceeded',
        type: 'budget',
        severity: 'high',
        message: `Budget exceeded: $${budgetTracker.getSpent().toFixed(4)} / $${budgetTracker.limit.toFixed(2)}`,
        action: budgetTracker.action,
      });
    }
  }

  return {
    allowed: !blocked,
    blocked,
    reason,
    redactedContent,
    violations,
    piiFindings,
    injectionFindings: injectionResult.findings,
    toxicityFindings,
    cost,
    complianceViolations: complianceResult.violations,
    processingTimeMs: Date.now() - startTime,
  };
}

// =========================================================================
// Skill Factory
// =========================================================================

/**
 * Create a CoFounder guardrails skill for OpenClaw.
 *
 * @example
 * ```typescript
 * import { createCoFounderSkill } from '@cofounder/openclaw';
 *
 * const cofounderSkill = createCoFounderSkill({
 *   pii: 'redact',
 *   injectionSensitivity: 'high',
 *   compliance: ['hipaa', 'gdpr'],
 *   budget: { limit: 5, period: 'day' },
 * });
 *
 * // Register with OpenClaw
 * agent.use(cofounderSkill);
 * ```
 */
export function createCoFounderSkill(config?: Partial<OpenClawSkillConfig>): OpenClawSkill {
  const mergedConfig: Required<OpenClawSkillConfig> = {
    ...DEFAULT_CONFIG,
    ...config,
    audit: { ...DEFAULT_CONFIG.audit, ...(config?.audit || {}) },
    budget: config?.budget === false ? false : { ...(DEFAULT_CONFIG.budget as object), ...(typeof config?.budget === 'object' ? config.budget : {}) },
  } as Required<OpenClawSkillConfig>;

  // Budget tracker
  const budgetTracker = mergedConfig.budget !== false
    ? new BudgetTracker(mergedConfig.budget)
    : null;

  // Audit log
  const auditLog: AuditEntry[] = [];
  const maxAuditEntries = mergedConfig.audit?.maxEntries ?? 1000;

  // Stats
  const stats = {
    totalChecks: 0,
    blocked: 0,
    warned: 0,
    passed: 0,
    redacted: 0,
    piiByType: {} as Record<string, number>,
    injectionAttempts: 0,
    injectionByCategory: {} as Record<string, number>,
    toxicityByCategory: {} as Record<string, number>,
    complianceViolationsByFramework: {} as Record<string, number>,
    startedAt: Date.now(),
    lastCheckAt: Date.now(),
  };

  // ---- Helper: record stats ----
  function recordStats(result: GuardResult, action: AuditEntry['action'], context?: OpenClawContext): void {
    stats.totalChecks++;
    stats.lastCheckAt = Date.now();

    if (result.blocked) {
      stats.blocked++;
    } else if (result.violations.length > 0) {
      stats.warned++;
    } else {
      stats.passed++;
    }

    if (result.redactedContent) {
      stats.redacted++;
    }

    for (const f of result.piiFindings) {
      stats.piiByType[f.type] = (stats.piiByType[f.type] || 0) + 1;
    }

    if (result.injectionFindings.length > 0) {
      stats.injectionAttempts++;
      for (const f of result.injectionFindings) {
        stats.injectionByCategory[f.category] = (stats.injectionByCategory[f.category] || 0) + 1;
      }
    }

    for (const f of result.toxicityFindings) {
      stats.toxicityByCategory[f.category] = (stats.toxicityByCategory[f.category] || 0) + 1;
    }

    for (const v of result.complianceViolations) {
      stats.complianceViolationsByFramework[v.framework] = (stats.complianceViolationsByFramework[v.framework] || 0) + 1;
    }

    // Audit log
    if (mergedConfig.audit?.enabled) {
      const entry: AuditEntry = {
        timestamp: Date.now(),
        action,
        channel: context?.channel,
        userId: context?.user?.id,
        sessionId: context?.sessionId,
        result: result.blocked ? 'blocked' : result.redactedContent ? 'redacted' : result.violations.length > 0 ? 'warned' : 'allowed',
        violations: result.violations.length,
        processingTimeMs: result.processingTimeMs,
      };

      if (mergedConfig.audit.level === 'verbose') {
        entry.details = {
          piiCount: result.piiFindings.length,
          injectionScore: result.injectionFindings.reduce((s, f) => s + f.score, 0),
          toxicityCount: result.toxicityFindings.length,
          complianceCount: result.complianceViolations.length,
        };
      }

      auditLog.push(entry);
      if (auditLog.length > maxAuditEntries) {
        auditLog.splice(0, auditLog.length - maxAuditEntries);
      }
    }
  }

  // ---- Helper: create hook result ----
  function createHookResult(result: GuardResult, config: Required<OpenClawSkillConfig>): HookResult {
    return {
      proceed: !result.blocked,
      modifiedContent: result.redactedContent,
      guardResult: result,
      userMessage: result.blocked ? (config.blockedMessage || DEFAULT_CONFIG.blockedMessage) : undefined,
    };
  }

  // =========================================================================
  // Manifest
  // =========================================================================

  const manifest: SkillManifest = {
    name: 'cofounder-guardrails',
    description: 'AI guardrails - PII detection, prompt injection blocking, compliance enforcement, cost tracking',
    version: '1.0.0',
    author: 'Waymaker',
    capabilities: [
      'input_guard',
      'output_guard',
      'pii_detection',
      'pii_redaction',
      'injection_blocking',
      'toxicity_detection',
      'compliance',
      'cost_tracking',
      'audit_logging',
    ],
    settings: {
      pii: {
        type: 'select',
        description: 'PII handling mode',
        default: 'redact',
        options: ['detect', 'redact', 'block', 'off'],
      },
      injectionSensitivity: {
        type: 'select',
        description: 'Injection detection sensitivity',
        default: 'medium',
        options: ['low', 'medium', 'high'],
      },
      injectionAction: {
        type: 'select',
        description: 'Action on injection detection',
        default: 'block',
        options: ['block', 'warn', 'sanitize'],
      },
      toxicity: {
        type: 'select',
        description: 'Toxicity handling mode',
        default: 'warn',
        options: ['block', 'warn', 'off'],
      },
      guardToolCalls: {
        type: 'boolean',
        description: 'Whether to guard tool/function calls',
        default: true,
      },
      budgetLimit: {
        type: 'number',
        description: 'Maximum budget per period (USD)',
        default: 10,
      },
      budgetPeriod: {
        type: 'select',
        description: 'Budget period',
        default: 'day',
        options: ['request', 'hour', 'day', 'month'],
      },
    },
  };

  // =========================================================================
  // Hooks
  // =========================================================================

  const hooks: OpenClawHooks = {
    beforeMessage: async (message: OpenClawMessage, context: OpenClawContext): Promise<HookResult> => {
      // Check channel restrictions
      if (mergedConfig.allowedChannels.length > 0 && context.channel) {
        if (!mergedConfig.allowedChannels.includes(context.channel)) {
          const result: GuardResult = {
            allowed: false,
            blocked: true,
            reason: `Channel '${context.channel}' is not in the allowed channels list`,
            violations: [{
              rule: 'channel-restriction',
              type: 'access',
              severity: 'high',
              message: `Channel '${context.channel}' not allowed`,
              action: 'block',
            }],
            piiFindings: [],
            injectionFindings: [],
            toxicityFindings: [],
            complianceViolations: [],
            processingTimeMs: 0,
          };
          recordStats(result, 'input_guard', context);
          return createHookResult(result, mergedConfig);
        }
      }

      const result = guardText(message.content, mergedConfig, 'input', budgetTracker, context);
      recordStats(result, 'input_guard', context);
      return createHookResult(result, mergedConfig);
    },

    afterMessage: async (message: OpenClawMessage, context: OpenClawContext): Promise<HookResult> => {
      const result = guardText(message.content, mergedConfig, 'output', budgetTracker, context);
      recordStats(result, 'output_guard', context);
      return createHookResult(result, mergedConfig);
    },

    beforeToolCall: async (tool: string, args: unknown, context: OpenClawContext): Promise<HookResult> => {
      if (!mergedConfig.guardToolCalls) {
        const passResult: GuardResult = {
          allowed: true,
          blocked: false,
          violations: [],
          piiFindings: [],
          injectionFindings: [],
          toxicityFindings: [],
          complianceViolations: [],
          processingTimeMs: 0,
        };
        return { proceed: true, guardResult: passResult };
      }

      // Serialize args to check for PII/injection in tool arguments
      const argsText = typeof args === 'string' ? args : JSON.stringify(args ?? '');
      const fullText = `Tool: ${tool}\nArgs: ${argsText}`;

      const result = guardText(fullText, mergedConfig, 'input', budgetTracker, context);
      recordStats(result, 'tool_guard', context);

      const hookResult = createHookResult(result, mergedConfig);
      if (result.redactedContent) {
        // Try to parse back the redacted args
        try {
          const redactedArgs = result.redactedContent.replace(/^Tool:.*\nArgs:\s*/, '');
          hookResult.modifiedArgs = typeof args === 'string' ? redactedArgs : JSON.parse(redactedArgs);
        } catch {
          hookResult.modifiedArgs = args;
        }
      }
      return hookResult;
    },

    afterToolCall: async (tool: string, result: unknown, context: OpenClawContext): Promise<HookResult> => {
      if (!mergedConfig.guardToolCalls) {
        const passResult: GuardResult = {
          allowed: true,
          blocked: false,
          violations: [],
          piiFindings: [],
          injectionFindings: [],
          toxicityFindings: [],
          complianceViolations: [],
          processingTimeMs: 0,
        };
        return { proceed: true, guardResult: passResult };
      }

      const resultText = typeof result === 'string' ? result : JSON.stringify(result ?? '');
      const guardResult = guardText(resultText, mergedConfig, 'output', budgetTracker, context);
      recordStats(guardResult, 'tool_guard', context);
      return createHookResult(guardResult, mergedConfig);
    },
  };

  // =========================================================================
  // Commands
  // =========================================================================

  const commands: OpenClawSkill['commands'] = {
    '/cofounder-status': async (context: OpenClawContext): Promise<string> => {
      const report: GuardReport = {
        totalChecks: stats.totalChecks,
        blocked: stats.blocked,
        warned: stats.warned,
        passed: stats.passed,
        redacted: stats.redacted,
        piiByType: { ...stats.piiByType },
        injectionAttempts: stats.injectionAttempts,
        injectionByCategory: { ...stats.injectionByCategory },
        toxicityByCategory: { ...stats.toxicityByCategory },
        complianceViolationsByFramework: { ...stats.complianceViolationsByFramework },
        totalCost: budgetTracker?.getSpent() ?? 0,
        budgetRemaining: budgetTracker?.getRemaining() ?? 0,
        auditEntries: auditLog.length,
        startedAt: stats.startedAt,
        lastCheckAt: stats.lastCheckAt,
      };

      recordStats({
        allowed: true, blocked: false, violations: [], piiFindings: [],
        injectionFindings: [], toxicityFindings: [], complianceViolations: [], processingTimeMs: 0,
      }, 'command', context);

      return formatGuardReport(report, context.channel);
    },

    '/cofounder-cost': async (context: OpenClawContext): Promise<string> => {
      if (!budgetTracker) {
        return 'Cost tracking is not enabled. Configure a budget to enable cost tracking.';
      }

      const report: CostReport = {
        totalSpent: budgetTracker.getSpent(),
        budgetLimit: budgetTracker.limit,
        budgetRemaining: budgetTracker.getRemaining(),
        period: budgetTracker.period,
        periodStart: budgetTracker.periodStartTime,
        entries: budgetTracker.getEntries(),
        byModel: budgetTracker.getByModel(),
      };

      return formatCostReport(report, context.channel);
    },

    '/cofounder-compliance': async (context: OpenClawContext): Promise<string> => {
      if (mergedConfig.compliance.length === 0) {
        return `No compliance frameworks configured. Available: ${getAvailableFrameworks().join(', ')}`;
      }

      const report: ComplianceReport = {
        frameworks: mergedConfig.compliance,
        totalChecks: stats.totalChecks,
        totalViolations: Object.values(stats.complianceViolationsByFramework).reduce((a, b) => a + b, 0),
        violationsByFramework: { ...stats.complianceViolationsByFramework },
        recentViolations: auditLog
          .filter((e) => e.details && (e.details as Record<string, unknown>).complianceCount)
          .slice(-10)
          .flatMap(() => []),  // Simplified - in production would store actual violations
        compliant: Object.values(stats.complianceViolationsByFramework).every((v) => v === 0),
      };

      return formatComplianceReport(report, context.channel);
    },

    '/cofounder-scan': async (context: OpenClawContext, text: string): Promise<string> => {
      if (!text || text.trim().length === 0) {
        return 'Usage: /cofounder-scan <text to scan>\nScans text for PII, injection attempts, toxicity, and compliance violations.';
      }

      const result = guardText(text, mergedConfig, 'input', null, context);
      return formatScanResult(result, text, context.channel);
    },
  };

  return { manifest, hooks, commands };
}
