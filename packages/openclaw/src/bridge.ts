// ---------------------------------------------------------------------------
// @cofounder/openclaw - Guard Bridge
// ---------------------------------------------------------------------------
// Standalone bridge that guards any OpenClaw agent's I/O without requiring
// the OpenClaw skill system. Can be used as middleware for webhook servers
// (Express, Fastify, etc.) or called directly.
// ---------------------------------------------------------------------------

import type {
  BridgeConfig,
  OpenClawSkillConfig,
  OpenClawContext,
  GuardResult,
  GuardReport,
  CostReport,
  ComplianceReport,
  ComplianceFramework,
  Violation,
  AuditEntry,
} from './types.js';
import { detectPII, redactPII, hasPII, detectInjection, detectToxicity, BudgetTracker } from './guards.js';
import { checkCompliance, getAvailableFrameworks } from './compliance.js';
import { formatGuardResult, formatGuardReport, formatCostReport, formatComplianceReport } from './reporter.js';

// =========================================================================
// Default Bridge Config
// =========================================================================

const DEFAULT_BRIDGE_CONFIG: Required<BridgeConfig> = {
  guardOptions: {
    pii: 'redact',
    injectionSensitivity: 'medium',
    injectionAction: 'block',
    toxicity: 'warn',
    compliance: [],
    budget: { limit: 10, period: 'day', warningThreshold: 0.8, onExceeded: 'warn' },
    model: 'gpt-4o',
    audit: { enabled: true, level: 'standard', maxEntries: 1000 },
    blockedMessage: 'This message was blocked by CoFounder guardrails.',
    guardToolCalls: true,
    allowedChannels: [],
  },
  policyPresets: [],
  dashboardEnabled: false,
  webhookUrl: '',
  auditEnabled: true,
};

// =========================================================================
// OpenClaw Bridge
// =========================================================================

/**
 * Standalone guard bridge for OpenClaw agents. Use this when you want to
 * add CoFounder guardrails without using the OpenClaw skill system.
 *
 * @example
 * ```typescript
 * import { OpenClawBridge } from '@cofounder/openclaw';
 *
 * const bridge = new OpenClawBridge({
 *   guardOptions: { pii: 'redact', compliance: ['hipaa'] },
 * });
 *
 * // Guard user input before sending to agent
 * const inputResult = bridge.guardInput('My SSN is 123-45-6789');
 * if (inputResult.blocked) {
 *   console.log('Input blocked:', inputResult.reason);
 * } else {
 *   const safeInput = inputResult.redactedContent || originalInput;
 *   // send safeInput to agent
 * }
 *
 * // Guard agent output before sending to user
 * const outputResult = bridge.guardOutput(agentResponse);
 * ```
 */
export class OpenClawBridge {
  private config: Required<BridgeConfig>;
  private guardConfig: Required<OpenClawSkillConfig>;
  private budgetTracker: BudgetTracker | null;
  private auditLog: AuditEntry[] = [];
  private maxAuditEntries: number;

  // Stats
  private stats = {
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

  constructor(config?: Partial<BridgeConfig>) {
    this.config = {
      ...DEFAULT_BRIDGE_CONFIG,
      ...config,
      guardOptions: {
        ...DEFAULT_BRIDGE_CONFIG.guardOptions,
        ...(config?.guardOptions || {}),
      },
    } as Required<BridgeConfig>;

    this.guardConfig = this.resolveGuardConfig();
    this.maxAuditEntries = this.guardConfig.audit?.maxEntries ?? 1000;

    // Merge policy presets into compliance frameworks
    if (this.config.policyPresets.length > 0) {
      const existing = new Set(this.guardConfig.compliance);
      for (const preset of this.config.policyPresets) {
        existing.add(preset);
      }
      this.guardConfig.compliance = [...existing];
    }

    // Budget tracker
    this.budgetTracker = this.guardConfig.budget !== false
      ? new BudgetTracker(this.guardConfig.budget as any)
      : null;
  }

  // =========================================================================
  // Public API
  // =========================================================================

  /**
   * Guard a message before sending it to the agent (input direction).
   */
  guardInput(message: string, context?: OpenClawContext): GuardResult {
    const result = this.guard(message, 'input', context);
    this.recordStats(result, 'input_guard', context);
    return result;
  }

  /**
   * Guard agent output before sending it to the user (output direction).
   */
  guardOutput(output: string, context?: OpenClawContext): GuardResult {
    const result = this.guard(output, 'output', context);
    this.recordStats(result, 'output_guard', context);
    return result;
  }

  /**
   * Guard a tool call's arguments and name.
   */
  guardToolCall(tool: string, args: unknown, context?: OpenClawContext): GuardResult {
    const argsText = typeof args === 'string' ? args : JSON.stringify(args ?? '');
    const fullText = `Tool: ${tool}\nArgs: ${argsText}`;
    const result = this.guard(fullText, 'input', context);
    this.recordStats(result, 'tool_guard', context);
    return result;
  }

  /**
   * Guard a tool call's result.
   */
  guardToolResult(tool: string, result: unknown, context?: OpenClawContext): GuardResult {
    const resultText = typeof result === 'string' ? result : JSON.stringify(result ?? '');
    const guardResult = this.guard(resultText, 'output', context);
    this.recordStats(guardResult, 'tool_guard', context);
    return guardResult;
  }

  /**
   * Get a comprehensive guard report.
   */
  getReport(): { cost: CostReport | null; security: GuardReport; compliance: ComplianceReport } {
    return {
      cost: this.getCostReport(),
      security: this.getSecurityReport(),
      compliance: this.getComplianceReport(),
    };
  }

  /**
   * Get a formatted guard report for chat display.
   */
  getFormattedReport(channel?: string): { cost: string; security: string; compliance: string } {
    const report = this.getReport();
    return {
      cost: report.cost ? formatCostReport(report.cost, channel) : 'Cost tracking not enabled.',
      security: formatGuardReport(report.security, channel),
      compliance: formatComplianceReport(report.compliance, channel),
    };
  }

  /**
   * Reset all stats and budget tracking.
   */
  reset(): void {
    this.stats = {
      totalChecks: 0,
      blocked: 0,
      warned: 0,
      passed: 0,
      redacted: 0,
      piiByType: {},
      injectionAttempts: 0,
      injectionByCategory: {},
      toxicityByCategory: {},
      complianceViolationsByFramework: {},
      startedAt: Date.now(),
      lastCheckAt: Date.now(),
    };
    this.auditLog = [];
    this.budgetTracker?.reset();
  }

  /**
   * Get the audit log.
   */
  getAuditLog(): AuditEntry[] {
    return [...this.auditLog];
  }

  /**
   * Express/Fastify compatible middleware that guards incoming webhook payloads.
   *
   * @example
   * ```typescript
   * const bridge = new OpenClawBridge({ guardOptions: { pii: 'redact' } });
   * app.use('/webhook', bridge.middleware());
   * ```
   */
  middleware(): (req: any, res: any, next: () => void) => void {
    return (req: any, res: any, next: () => void) => {
      const body = req.body;
      if (!body) {
        next();
        return;
      }

      // Extract message content from common webhook payload formats
      const message = this.extractMessage(body);
      if (!message) {
        next();
        return;
      }

      const context = this.extractContext(body);
      const result = this.guardInput(message, context);

      // Attach guard result to request
      req.cofounderGuard = result;

      if (result.blocked) {
        res.status(403);
        if (typeof res.json === 'function') {
          res.json({
            blocked: true,
            reason: result.reason,
            message: this.guardConfig.blockedMessage,
          });
        } else {
          res.end(JSON.stringify({
            blocked: true,
            reason: result.reason,
            message: this.guardConfig.blockedMessage,
          }));
        }
        return;
      }

      // If content was redacted, update the request body
      if (result.redactedContent) {
        this.updateMessage(body, result.redactedContent);
      }

      next();
    };
  }

  /**
   * Wrap a handler function with guard checks.
   *
   * @example
   * ```typescript
   * const guardedHandler = bridge.wrapHandler(async (message, context) => {
   *   return await agent.process(message);
   * });
   * ```
   */
  wrapHandler(
    handler: (message: string, context?: OpenClawContext) => Promise<string>
  ): (message: string, context?: OpenClawContext) => Promise<{ response: string; inputGuard: GuardResult; outputGuard: GuardResult }> {
    return async (message: string, context?: OpenClawContext) => {
      // Guard input
      const inputGuard = this.guardInput(message, context);
      if (inputGuard.blocked) {
        return {
          response: this.guardConfig.blockedMessage || 'Message blocked by CoFounder guardrails.',
          inputGuard,
          outputGuard: {
            allowed: true, blocked: false, violations: [], piiFindings: [],
            injectionFindings: [], toxicityFindings: [], complianceViolations: [], processingTimeMs: 0,
          },
        };
      }

      // Use redacted content if available
      const safeMessage = inputGuard.redactedContent || message;

      // Process through handler
      const response = await handler(safeMessage, context);

      // Guard output
      const outputGuard = this.guardOutput(response, context);
      const safeResponse = outputGuard.blocked
        ? (this.guardConfig.blockedMessage || 'Response blocked by CoFounder guardrails.')
        : outputGuard.redactedContent || response;

      return { response: safeResponse, inputGuard, outputGuard };
    };
  }

  // =========================================================================
  // Private Methods
  // =========================================================================

  private guard(text: string, direction: 'input' | 'output', context?: OpenClawContext): GuardResult {
    const startTime = Date.now();
    const violations: Violation[] = [];
    let blocked = false;
    let reason: string | undefined;
    let redactedContent: string | undefined;

    // PII
    const piiFindings = this.guardConfig.pii !== false ? detectPII(text) : [];
    if (piiFindings.length > 0) {
      if (this.guardConfig.pii === 'block') {
        blocked = true;
        reason = `PII detected: ${[...new Set(piiFindings.map((f) => f.type))].join(', ')}`;
        violations.push({ rule: 'pii-block', type: 'pii', severity: 'high', message: reason, action: 'block' });
      } else if (this.guardConfig.pii === 'redact') {
        const result = redactPII(text);
        redactedContent = result.redacted;
        violations.push({ rule: 'pii-redact', type: 'pii', severity: 'medium', message: `PII redacted: ${piiFindings.length} item(s)`, action: 'redact' });
      } else {
        violations.push({ rule: 'pii-detect', type: 'pii', severity: 'low', message: `PII detected: ${piiFindings.length} item(s)`, action: 'log' });
      }
    }

    // Injection
    const injectionResult = this.guardConfig.injectionAction !== false
      ? detectInjection(text, this.guardConfig.injectionSensitivity)
      : { score: 0, findings: [], blocked: false };

    if (injectionResult.findings.length > 0) {
      if (this.guardConfig.injectionAction === 'block' && injectionResult.blocked) {
        blocked = true;
        const msg = `Injection attempt detected (score: ${injectionResult.score})`;
        reason = reason ? `${reason}; ${msg}` : msg;
        violations.push({ rule: 'injection-block', type: 'injection', severity: 'critical', message: msg, action: 'block' });
      } else {
        violations.push({
          rule: 'injection-warn', type: 'injection', severity: 'high',
          message: `Injection patterns: ${injectionResult.findings.length}, score ${injectionResult.score}`,
          action: this.guardConfig.injectionAction === 'sanitize' ? 'sanitize' : 'warn',
        });
      }
    }

    // Toxicity
    const toxicityFindings = this.guardConfig.toxicity !== false ? detectToxicity(text) : [];
    if (toxicityFindings.length > 0) {
      if (this.guardConfig.toxicity === 'block') {
        const hasSevere = toxicityFindings.some((f) => f.severity === 'critical' || f.severity === 'high');
        if (hasSevere) {
          blocked = true;
          reason = reason ? `${reason}; Toxic content detected` : 'Toxic content detected';
        }
      }
      for (const f of toxicityFindings) {
        violations.push({
          rule: `toxicity-${f.category}`, type: 'toxicity', severity: f.severity,
          message: `Toxicity: ${f.category} (${f.severity})`,
          action: this.guardConfig.toxicity === 'block' ? 'block' : 'warn',
        });
      }
    }

    // Compliance
    const complianceResult = this.guardConfig.compliance.length > 0
      ? checkCompliance(text, this.guardConfig.compliance, direction)
      : { compliant: true, violations: [], frameworksChecked: [] as ComplianceFramework[] };

    if (!complianceResult.compliant) {
      const critical = complianceResult.violations.filter((v) => v.severity === 'critical');
      if (critical.length > 0) {
        blocked = true;
        const msg = `Compliance violation (${critical.map((v) => v.framework.toUpperCase()).join(', ')})`;
        reason = reason ? `${reason}; ${msg}` : msg;
      }
      for (const v of complianceResult.violations) {
        violations.push({ rule: v.rule, type: 'compliance', severity: v.severity, message: v.message, action: v.severity === 'critical' ? 'block' : 'warn' });
      }
    }

    // Budget
    let cost: GuardResult['cost'] = undefined;
    if (this.budgetTracker) {
      const model = context?.agent?.model || this.guardConfig.model;
      const tokens = this.budgetTracker.estimateTokens(text);
      if (direction === 'output') {
        this.budgetTracker.recordCost(model, 0, tokens);
      } else {
        this.budgetTracker.recordCost(model, tokens, 0);
      }
      cost = this.budgetTracker.estimateCost(model, tokens, 0);

      if (this.budgetTracker.isExceeded()) {
        if (this.budgetTracker.action === 'block') {
          blocked = true;
          reason = reason ? `${reason}; Budget exceeded` : 'Budget exceeded';
        }
        violations.push({
          rule: 'budget-exceeded', type: 'budget', severity: 'high',
          message: `Budget exceeded: $${this.budgetTracker.getSpent().toFixed(4)} / $${this.budgetTracker.limit.toFixed(2)}`,
          action: this.budgetTracker.action,
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

  private resolveGuardConfig(): Required<OpenClawSkillConfig> {
    const opts = this.config.guardOptions;
    return {
      pii: opts.pii ?? 'redact',
      injectionSensitivity: opts.injectionSensitivity ?? 'medium',
      injectionAction: opts.injectionAction ?? 'block',
      toxicity: opts.toxicity ?? 'warn',
      compliance: opts.compliance ?? [],
      budget: opts.budget ?? { limit: 10, period: 'day' as const, warningThreshold: 0.8, onExceeded: 'warn' as const },
      model: opts.model ?? 'gpt-4o',
      audit: opts.audit ?? { enabled: true, level: 'standard' as const, maxEntries: 1000 },
      blockedMessage: opts.blockedMessage ?? 'This message was blocked by CoFounder guardrails.',
      guardToolCalls: opts.guardToolCalls ?? true,
      allowedChannels: opts.allowedChannels ?? [],
    } as Required<OpenClawSkillConfig>;
  }

  private recordStats(result: GuardResult, action: AuditEntry['action'], context?: OpenClawContext): void {
    this.stats.totalChecks++;
    this.stats.lastCheckAt = Date.now();

    if (result.blocked) this.stats.blocked++;
    else if (result.violations.length > 0) this.stats.warned++;
    else this.stats.passed++;

    if (result.redactedContent) this.stats.redacted++;

    for (const f of result.piiFindings) {
      this.stats.piiByType[f.type] = (this.stats.piiByType[f.type] || 0) + 1;
    }
    if (result.injectionFindings.length > 0) {
      this.stats.injectionAttempts++;
      for (const f of result.injectionFindings) {
        this.stats.injectionByCategory[f.category] = (this.stats.injectionByCategory[f.category] || 0) + 1;
      }
    }
    for (const f of result.toxicityFindings) {
      this.stats.toxicityByCategory[f.category] = (this.stats.toxicityByCategory[f.category] || 0) + 1;
    }
    for (const v of result.complianceViolations) {
      this.stats.complianceViolationsByFramework[v.framework] = (this.stats.complianceViolationsByFramework[v.framework] || 0) + 1;
    }

    if (this.config.auditEnabled) {
      this.auditLog.push({
        timestamp: Date.now(),
        action,
        channel: context?.channel,
        userId: context?.user?.id,
        sessionId: context?.sessionId,
        result: result.blocked ? 'blocked' : result.redactedContent ? 'redacted' : result.violations.length > 0 ? 'warned' : 'allowed',
        violations: result.violations.length,
        processingTimeMs: result.processingTimeMs,
      });
      if (this.auditLog.length > this.maxAuditEntries) {
        this.auditLog.splice(0, this.auditLog.length - this.maxAuditEntries);
      }
    }
  }

  private getSecurityReport(): GuardReport {
    return {
      totalChecks: this.stats.totalChecks,
      blocked: this.stats.blocked,
      warned: this.stats.warned,
      passed: this.stats.passed,
      redacted: this.stats.redacted,
      piiByType: { ...this.stats.piiByType },
      injectionAttempts: this.stats.injectionAttempts,
      injectionByCategory: { ...this.stats.injectionByCategory },
      toxicityByCategory: { ...this.stats.toxicityByCategory },
      complianceViolationsByFramework: { ...this.stats.complianceViolationsByFramework },
      totalCost: this.budgetTracker?.getSpent() ?? 0,
      budgetRemaining: this.budgetTracker?.getRemaining() ?? 0,
      auditEntries: this.auditLog.length,
      startedAt: this.stats.startedAt,
      lastCheckAt: this.stats.lastCheckAt,
    };
  }

  private getCostReport(): CostReport | null {
    if (!this.budgetTracker) return null;
    return {
      totalSpent: this.budgetTracker.getSpent(),
      budgetLimit: this.budgetTracker.limit,
      budgetRemaining: this.budgetTracker.getRemaining(),
      period: this.budgetTracker.period,
      periodStart: this.budgetTracker.periodStartTime,
      entries: this.budgetTracker.getEntries(),
      byModel: this.budgetTracker.getByModel(),
    };
  }

  private getComplianceReport(): ComplianceReport {
    return {
      frameworks: this.guardConfig.compliance,
      totalChecks: this.stats.totalChecks,
      totalViolations: Object.values(this.stats.complianceViolationsByFramework).reduce((a, b) => a + b, 0),
      violationsByFramework: { ...this.stats.complianceViolationsByFramework },
      recentViolations: [],
      compliant: Object.values(this.stats.complianceViolationsByFramework).every((v) => v === 0),
    };
  }

  /** Extract message text from common webhook payload formats */
  private extractMessage(body: any): string | null {
    // OpenClaw standard format
    if (body?.message?.content) return body.message.content;
    if (body?.content) return body.content;
    if (body?.text) return body.text;

    // WhatsApp webhook
    if (body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.text?.body) {
      return body.entry[0].changes[0].value.messages[0].text.body;
    }

    // Telegram webhook
    if (body?.message?.text) return body.message.text;

    // Slack event
    if (body?.event?.text) return body.event.text;

    // Discord webhook
    if (body?.data?.content) return body.data.content;

    return null;
  }

  /** Extract context from common webhook payload formats */
  private extractContext(body: any): OpenClawContext {
    const context: OpenClawContext = {};

    // Try to extract user info
    if (body?.user) {
      context.user = { id: body.user.id || body.user, name: body.user.name };
    } else if (body?.message?.from) {
      context.user = { id: String(body.message.from.id || body.message.from), name: body.message.from.first_name };
    } else if (body?.event?.user) {
      context.user = { id: body.event.user };
    }

    // Try to detect channel
    if (body?.entry?.[0]?.changes) context.channel = 'whatsapp';
    else if (body?.message?.chat) context.channel = 'telegram';
    else if (body?.event?.channel) context.channel = 'slack';
    else if (body?.data?.channel_id) context.channel = 'discord';

    if (body?.sessionId) context.sessionId = body.sessionId;

    return context;
  }

  /** Update message in webhook payload */
  private updateMessage(body: any, newContent: string): void {
    if (body?.message?.content !== undefined) body.message.content = newContent;
    else if (body?.content !== undefined) body.content = newContent;
    else if (body?.text !== undefined) body.text = newContent;
    else if (body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.text?.body !== undefined) {
      body.entry[0].changes[0].value.messages[0].text.body = newContent;
    }
    else if (body?.message?.text !== undefined) body.message.text = newContent;
    else if (body?.event?.text !== undefined) body.event.text = newContent;
  }
}
