import { GuardPipeline } from './middleware.js';
import { PIIInterceptor } from './interceptors/pii-interceptor.js';
import { InjectionInterceptor } from './interceptors/injection-interceptor.js';
import { CostInterceptor } from './interceptors/cost-interceptor.js';
import { ComplianceInterceptor } from './interceptors/compliance-interceptor.js';
import { ContentInterceptor } from './interceptors/content-interceptor.js';
import { AuditInterceptor } from './interceptors/audit-interceptor.js';
import { RateLimitInterceptor } from './interceptors/rate-limit-interceptor.js';
import type { GuardedAgentConfig, GuardedAgent, GuardedAgentResult, GuardConfig, GuardReport } from './types.js';

function buildPipeline(guards: GuardConfig): {
  pipeline: GuardPipeline;
  costInterceptor?: CostInterceptor;
  complianceInterceptor?: ComplianceInterceptor;
  contentInterceptor?: ContentInterceptor;
  auditInterceptor?: AuditInterceptor;
  rateLimitInterceptor?: RateLimitInterceptor;
} {
  const pipeline = new GuardPipeline();
  let costInterceptor: CostInterceptor | undefined;
  let complianceInterceptor: ComplianceInterceptor | undefined;
  let contentInterceptor: ContentInterceptor | undefined;
  let auditInterceptor: AuditInterceptor | undefined;
  let rateLimitInterceptor: RateLimitInterceptor | undefined;

  // Order matters: rate limit → injection → PII → compliance → content → cost → audit
  if (guards.rateLimit) {
    rateLimitInterceptor = new RateLimitInterceptor(guards.rateLimit);
    pipeline.use(rateLimitInterceptor);
  }

  if (guards.injection) {
    pipeline.use(new InjectionInterceptor(guards.injection));
  }

  if (guards.pii) {
    pipeline.use(new PIIInterceptor(guards.pii));
  }

  if (guards.compliance) {
    complianceInterceptor = new ComplianceInterceptor(guards.compliance);
    pipeline.use(complianceInterceptor);
  }

  if (guards.contentFilter) {
    contentInterceptor = new ContentInterceptor(guards.contentFilter);
    pipeline.use(contentInterceptor);
  }

  if (guards.cost) {
    costInterceptor = new CostInterceptor(guards.cost);
    pipeline.use(costInterceptor);
  }

  if (guards.audit) {
    auditInterceptor = new AuditInterceptor(guards.audit);
    pipeline.use(auditInterceptor);
  }

  return { pipeline, costInterceptor, complianceInterceptor, contentInterceptor, auditInterceptor, rateLimitInterceptor };
}

function resolveGuards(guards: GuardConfig | boolean): GuardConfig {
  if (guards === true) {
    return {
      pii: { mode: 'redact', onDetection: 'redact' },
      injection: { sensitivity: 'medium', onDetection: 'block' },
      cost: { budgetPeriod: 'day', warningThreshold: 0.8 },
      contentFilter: true,
      audit: { destination: 'console' },
      rateLimit: { maxRequests: 100, windowMs: 60000 },
    };
  }
  if (guards === false) {
    return {};
  }
  return guards;
}

export function createGuardedAgent(config: GuardedAgentConfig): GuardedAgent {
  const guardConfig = resolveGuards(config.guards);
  const { pipeline, costInterceptor, complianceInterceptor, contentInterceptor, auditInterceptor, rateLimitInterceptor } = buildPipeline(guardConfig);

  let totalInputTokens = 0;
  let totalOutputTokens = 0;

  const agent: GuardedAgent = {
    async run(input: string, context?: Record<string, unknown>): Promise<GuardedAgentResult> {
      // Guard the input
      const inputResult = await pipeline.processInput(input, { model: config.model });

      if (inputResult.blocked) {
        return {
          output: `[RANA Guard] Request blocked: ${inputResult.reason}`,
          blocked: true,
          violations: inputResult.violations,
          cost: costInterceptor?.totalCost || 0,
          tokensUsed: { input: 0, output: 0 },
          guardsApplied: pipeline.getInterceptorNames(),
        };
      }

      const processedInput = inputResult.transformed || input;

      // Try to use Anthropic Agent SDK if available
      let output: string;
      let inputTokens = 0;
      let outputTokens = 0;

      try {
        // Dynamic import to support optional peer dependency
        // @ts-ignore - optional peer dependency
        const sdk = await (Function('return import("@anthropic-ai/sdk")')()) as any;
        const AnthropicClass = sdk.default || sdk.Anthropic || sdk;
        const client = new AnthropicClass();

        const response = await client.messages.create({
          model: config.model,
          max_tokens: 4096,
          system: config.instructions || 'You are a helpful assistant.',
          messages: [{ role: 'user' as const, content: processedInput }],
        });

        inputTokens = (response as any).usage?.input_tokens || 0;
        outputTokens = (response as any).usage?.output_tokens || 0;

        output = ((response as any).content || [])
          .filter((b: any) => b.type === 'text')
          .map((b: any) => b.text)
          .join('\n');
      } catch {
        // Fallback: return a message indicating SDK is not available
        output = `[RANA Agent] Anthropic SDK not available. Input passed all guards: ${pipeline.getInterceptorNames().join(', ')}. Processed input (${processedInput.length} chars) is ready for your LLM provider.`;
        inputTokens = Math.ceil(processedInput.length / 4);
        outputTokens = Math.ceil(output.length / 4);
      }

      // Track cost
      if (costInterceptor) {
        costInterceptor.recordUsage(config.model, inputTokens, outputTokens);
      }

      totalInputTokens += inputTokens;
      totalOutputTokens += outputTokens;

      // Guard the output
      const outputResult = await pipeline.processOutput(output, { model: config.model });

      if (outputResult.blocked) {
        return {
          output: `[RANA Guard] Response blocked: ${outputResult.reason}`,
          blocked: true,
          violations: outputResult.violations,
          cost: costInterceptor?.totalCost || 0,
          tokensUsed: { input: inputTokens, output: outputTokens },
          guardsApplied: pipeline.getInterceptorNames(),
        };
      }

      const finalOutput = outputResult.transformed || output;

      return {
        output: finalOutput,
        blocked: false,
        violations: [...inputResult.violations, ...outputResult.violations],
        cost: costInterceptor?.totalCost || 0,
        tokensUsed: { input: inputTokens, output: outputTokens },
        guardsApplied: pipeline.getInterceptorNames(),
      };
    },

    getGuardReport(): GuardReport {
      const stats = pipeline.stats;
      return {
        totalRequests: stats.requests,
        totalCost: costInterceptor?.totalCost || 0,
        ppiDetections: pipeline.getViolations().filter((v) => v.interceptor === 'pii').length,
        ppiByType: {},
        injectionAttempts: pipeline.getViolations().filter((v) => v.interceptor === 'injection').length,
        complianceViolations: complianceInterceptor?.violationCount || 0,
        complianceByFramework: complianceInterceptor?.violationsByFramework || {},
        contentFiltered: contentInterceptor?.filteredCount || 0,
        rateLimitHits: rateLimitInterceptor?.hitCount || 0,
        auditEvents: auditInterceptor?.eventCount || 0,
        startedAt: stats.startedAt,
        lastActivityAt: stats.lastActivityAt,
      };
    },

    resetGuards(): void {
      rateLimitInterceptor?.reset();
    },
  };

  return agent;
}
