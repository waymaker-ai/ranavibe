import type {
  GuardOptions,
  CheckResult,
  Guard,
  GuardReport,
  Violation,
  PIIFinding,
  InjectionFinding,
  ToxicityFinding,
} from './types.js';
import { detectPII, redactPII } from './detectors/pii.js';
import { detectInjection } from './detectors/injection.js';
import { detectToxicity } from './detectors/toxicity.js';
import { BudgetEnforcer } from './enforcers/budget.js';
import { RateLimiter } from './enforcers/rate-limit.js';
import { ModelGate } from './enforcers/model-gate.js';
import { reportCheck, reportSummary } from './reporters/console.js';
import { JsonReporter } from './reporters/json.js';
import { WebhookReporter } from './reporters/webhook.js';
import { wrapClient } from './proxy.js';

interface InternalState {
  totalChecks: number;
  blocked: number;
  warned: number;
  passed: number;
  piiRedacted: number;
  piiByType: Record<string, number>;
  injectionAttempts: number;
  injectionByCategory: Record<string, number>;
  toxicityFound: number;
  toxicityByCategory: Record<string, number>;
  totalCost: number;
  rateLimitHits: number;
  modelDenials: number;
  startedAt: number;
  lastCheckAt: number;
}

export function createGuard(options: GuardOptions = {}): Guard {
  const opts: Required<GuardOptions> = {
    pii: options.pii ?? 'detect',
    injection: options.injection ?? 'block',
    toxicity: options.toxicity ?? 'block',
    budget: options.budget ?? false,
    rateLimit: options.rateLimit ?? false,
    models: options.models ?? false,
    reporter: options.reporter ?? false,
  };

  const budget = opts.budget ? new BudgetEnforcer(opts.budget) : null;
  const rateLimiter = opts.rateLimit ? new RateLimiter(opts.rateLimit) : null;
  const modelGate = opts.models ? new ModelGate(opts.models) : null;
  const jsonReporter = opts.reporter === 'json' ? new JsonReporter() : null;
  const webhookReporter =
    opts.reporter && typeof opts.reporter === 'object' && 'webhook' in opts.reporter
      ? new WebhookReporter(opts.reporter.webhook)
      : null;

  const state: InternalState = {
    totalChecks: 0,
    blocked: 0,
    warned: 0,
    passed: 0,
    piiRedacted: 0,
    piiByType: {},
    injectionAttempts: 0,
    injectionByCategory: {},
    toxicityFound: 0,
    toxicityByCategory: {},
    totalCost: 0,
    rateLimitHits: 0,
    modelDenials: 0,
    startedAt: Date.now(),
    lastCheckAt: Date.now(),
  };

  function check(
    text: string,
    checkOpts?: { model?: string; direction?: 'input' | 'output' }
  ): CheckResult {
    state.totalChecks++;
    state.lastCheckAt = Date.now();

    const warnings: string[] = [];
    const violations: Violation[] = [];
    let blocked = false;
    let reason: string | undefined;
    let piiFindings: PIIFinding[] = [];
    let injectionFindings: InjectionFinding[] = [];
    let toxicityFindings: ToxicityFinding[] = [];
    let redacted: string | undefined;

    // Rate limit check
    if (rateLimiter) {
      const rlResult = rateLimiter.check();
      if (!rlResult.allowed) {
        state.rateLimitHits++;
        blocked = true;
        reason = `Rate limit exceeded (${rlResult.remaining} remaining, resets in ${Math.ceil(rlResult.resetMs / 1000)}s)`;
        violations.push({ rule: 'rate_limit', type: 'exceeded', severity: 'high', message: reason, action: 'block' });
      }
      rateLimiter.record();
    }

    // Model gate check
    if (modelGate && checkOpts?.model) {
      const mgResult = modelGate.check(checkOpts.model);
      if (!mgResult.allowed) {
        state.modelDenials++;
        blocked = true;
        reason = mgResult.reason;
        violations.push({
          rule: 'model_gate',
          type: 'denied_model',
          severity: 'high',
          message: mgResult.reason || 'Model not approved',
          action: 'block',
        });
      }
    }

    // PII detection
    if (opts.pii && !blocked) {
      const piiResult = redactPII(text);
      piiFindings = piiResult.findings;

      if (piiFindings.length > 0) {
        for (const f of piiFindings) {
          state.piiByType[f.type] = (state.piiByType[f.type] || 0) + 1;
        }

        if (opts.pii === 'block') {
          blocked = true;
          reason = `PII detected: ${piiFindings.map((f) => f.type).join(', ')}`;
          violations.push({ rule: 'pii', type: 'detected', severity: 'high', message: reason, action: 'block' });
        } else if (opts.pii === 'redact') {
          redacted = piiResult.redacted;
          state.piiRedacted += piiFindings.length;
          warnings.push(`PII redacted: ${piiFindings.length} item(s)`);
        } else {
          warnings.push(`PII detected: ${piiFindings.map((f) => f.type).join(', ')}`);
        }
      }
    }

    // Injection detection
    if (opts.injection && !blocked) {
      const injResult = detectInjection(text, opts.injection === 'block' ? 'high' : 'medium');
      injectionFindings = injResult.findings;

      if (injResult.blocked) {
        state.injectionAttempts++;
        for (const f of injectionFindings) {
          state.injectionByCategory[f.category] = (state.injectionByCategory[f.category] || 0) + 1;
        }

        if (opts.injection === 'block') {
          blocked = true;
          reason = `Prompt injection detected (score: ${injResult.score}/100)`;
          violations.push({ rule: 'injection', type: 'detected', severity: 'critical', message: reason, action: 'block' });
        } else if (opts.injection === 'warn') {
          warnings.push(`Injection risk: score ${injResult.score}/100`);
        }
      }
    }

    // Toxicity detection
    if (opts.toxicity && !blocked) {
      toxicityFindings = detectToxicity(text);

      if (toxicityFindings.length > 0) {
        state.toxicityFound += toxicityFindings.length;
        for (const f of toxicityFindings) {
          state.toxicityByCategory[f.category] = (state.toxicityByCategory[f.category] || 0) + 1;
        }

        const hasCritical = toxicityFindings.some((f) => f.severity === 'critical' || f.severity === 'high');
        if (opts.toxicity === 'block' && hasCritical) {
          blocked = true;
          reason = `Toxic content detected: ${toxicityFindings.map((f) => f.category).join(', ')}`;
          violations.push({ rule: 'toxicity', type: 'detected', severity: 'critical', message: reason, action: 'block' });
        } else {
          warnings.push(`Toxicity detected: ${toxicityFindings.map((f) => f.category).join(', ')}`);
        }
      }
    }

    // Budget check
    if (budget && checkOpts?.model && !blocked) {
      const budgetState = budget.checkBudget(0);
      if (budget.isExceeded()) {
        if (budget.action === 'block') {
          blocked = true;
          reason = `Budget exceeded: $${budgetState.spent.toFixed(2)} / $${budgetState.limit.toFixed(2)}`;
          violations.push({ rule: 'budget', type: 'exceeded', severity: 'high', message: reason, action: 'block' });
        } else {
          warnings.push(`Budget exceeded: $${budgetState.spent.toFixed(2)} / $${budgetState.limit.toFixed(2)}`);
        }
      } else if (budgetState.warning) {
        warnings.push(`Budget warning: $${budgetState.spent.toFixed(2)} / $${budgetState.limit.toFixed(2)}`);
      }
    }

    if (blocked) {
      state.blocked++;
    } else if (warnings.length > 0) {
      state.warned++;
    } else {
      state.passed++;
    }

    const result: CheckResult = {
      safe: !blocked,
      blocked,
      reason,
      warnings,
      piiFindings: piiFindings,
      injectionFindings,
      toxicityFindings,
      redacted,
      cost: undefined,
      model: checkOpts?.model,
      violations,
    };

    // Report
    if (opts.reporter === 'console') reportCheck(result);
    if (jsonReporter) jsonReporter.logCheck(result);
    if (webhookReporter) webhookReporter.logCheck(result);

    return result;
  }

  function wrap<T extends object>(client: T): T {
    return wrapClient(client, { check, budget, modelGate, state });
  }

  function middleware() {
    return (req: any, res: any, next: () => void) => {
      if (req.method === 'POST' && req.body) {
        const body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
        const result = check(body, { direction: 'input' });
        if (result.blocked) {
          res.statusCode = 403;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Blocked by RANA Guard', reason: result.reason, violations: result.violations }));
          return;
        }
      }
      next();
    };
  }

  function report(): GuardReport {
    const budgetState = budget?.checkBudget();
    const r: GuardReport = {
      ...state,
      budgetRemaining: budgetState?.remaining ?? Infinity,
    };

    if (opts.reporter === 'console') reportSummary(r);
    if (jsonReporter) jsonReporter.logReport(r);
    if (webhookReporter) webhookReporter.logReport(r);

    return r;
  }

  function resetBudget(): void {
    budget?.reset();
  }

  return { check, wrap, middleware, report, resetBudget };
}

/** One-shot guard check with default settings */
export function guard(text: string, options?: GuardOptions): CheckResult {
  const g = createGuard(options);
  return g.check(text);
}
