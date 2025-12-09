/**
 * @rana/agents/security
 * Comprehensive security utilities for agents and tools
 */

// PII Detection
export {
  PIIDetector,
  createPIIDetector,
  detectPII,
  redactPII,
} from './pii-detector';
export type { PIIMatch, PIIType, PIIDetectorConfig } from './pii-detector';

// Injection Detection
export {
  InjectionDetector,
  createInjectionDetector,
  detectInjection,
  checkForInjection,
} from './injection-detector';
export type {
  InjectionMatch,
  InjectionType,
  InjectionDetectorConfig,
} from './injection-detector';

// Output Validation
export {
  OutputValidator,
  createOutputValidator,
  validateOutput,
  sanitizeOutput,
} from './output-validator';
export type {
  OutputValidationResult,
  OutputViolation,
  ViolationType,
  OutputValidatorConfig,
} from './output-validator';

// Rate Limiting
export {
  RateLimiter,
  SlidingWindowRateLimiter,
  MemoryRateLimitStore,
  createRateLimiter,
  rateLimitPresets,
} from './rate-limiter';
export type {
  RateLimitConfig,
  RateLimitContext,
  RateLimitInfo,
  RateLimitResult,
  RateLimitStore,
} from './rate-limiter';

import { Tool, ToolContext, ToolResult } from '../types';
import { PIIDetector } from './pii-detector';
import { InjectionDetector } from './injection-detector';
import { OutputValidator } from './output-validator';
import { RateLimiter, rateLimitPresets } from './rate-limiter';

/**
 * Tool safety configuration
 */
export interface ToolSafetyConfig {
  requireAuth: boolean;
  auditLog: boolean;
  rateLimit?: { requests: number; windowMs: number };
  allowedRoles?: string[];
  allowedOrgs?: string[];
  maxInputSize?: number;
}

/**
 * Wrap a tool with safety checks
 */
export function wrapToolWithSafety(tool: Tool, config: ToolSafetyConfig): Tool {
  const rateLimiter = config.rateLimit
    ? new RateLimiter({
        maxRequests: config.rateLimit.requests,
        windowMs: config.rateLimit.windowMs,
      })
    : null;

  return {
    ...tool,
    requiresAuth: config.requireAuth || tool.requiresAuth,
    allowedRoles: config.allowedRoles || tool.allowedRoles,
    rateLimit: config.rateLimit || tool.rateLimit,

    async run(input, ctx: ToolContext): Promise<ToolResult> {
      // Check input size
      if (config.maxInputSize) {
        const inputSize = JSON.stringify(input).length;
        if (inputSize > config.maxInputSize) {
          logAudit(config, 'tool:blocked', { tool: tool.name, reason: 'input_too_large' });
          return { ok: false, error: 'Input too large' };
        }
      }

      // Auth check
      if (config.requireAuth && !ctx.user?.id) {
        logAudit(config, 'tool:blocked', { tool: tool.name, reason: 'auth_required' });
        return { ok: false, error: 'Authentication required' };
      }

      // Org check
      if (config.allowedOrgs?.length) {
        if (!config.allowedOrgs.includes(ctx.orgId)) {
          logAudit(config, 'tool:blocked', { tool: tool.name, reason: 'org_not_allowed' });
          return { ok: false, error: 'Organization not authorized' };
        }
      }

      // Role check
      if (config.allowedRoles?.length) {
        const hasRole = ctx.user?.roles?.some((r) => config.allowedRoles!.includes(r));
        if (!hasRole) {
          logAudit(config, 'tool:blocked', { tool: tool.name, reason: 'insufficient_roles' });
          return { ok: false, error: 'Insufficient permissions' };
        }
      }

      // Rate limit check
      if (rateLimiter) {
        const result = await rateLimiter.check({
          userId: ctx.user?.id,
          orgId: ctx.orgId,
          path: tool.name,
        });

        if (!result.allowed) {
          logAudit(config, 'tool:rate_limited', { tool: tool.name, userId: ctx.user?.id });
          return {
            ok: false,
            error: `Rate limit exceeded. Retry after ${result.info.retryAfter} seconds`,
          };
        }
      }

      // Execute tool
      const start = Date.now();
      const result = await tool.run(input, ctx);
      const durationMs = Date.now() - start;

      // Audit log
      logAudit(config, 'tool:call', {
        tool: tool.name,
        userId: ctx.user?.id,
        orgId: ctx.orgId,
        success: result.ok,
        durationMs,
        timestamp: new Date().toISOString(),
      });

      return result;
    },
  };
}

function logAudit(config: ToolSafetyConfig, event: string, data: Record<string, any>): void {
  if (config.auditLog) {
    console.log(JSON.stringify({ event, ...data }));
  }
}

/**
 * Security pipeline configuration
 */
export interface SecurityPipelineConfig {
  piiRedaction: boolean;
  promptInjectionDetection: boolean;
  outputValidation?: boolean;
  maxInputLength?: number;
  blockedPatterns?: RegExp[];
  piiTypes?: string[];
  injectionBlockSeverity?: 'low' | 'medium' | 'high' | 'critical';
}

export interface SecurityCheckResult {
  safe: boolean;
  processedInput: string;
  warnings: string[];
  blocked?: string;
  piiMatches?: any[];
  injectionMatches?: any[];
}

/**
 * Comprehensive security check for agent inputs
 */
export async function checkInput(
  input: string,
  config: SecurityPipelineConfig
): Promise<SecurityCheckResult> {
  const warnings: string[] = [];
  let processedInput = input;
  let piiMatches: any[] = [];
  let injectionMatches: any[] = [];

  // Check length
  if (config.maxInputLength && input.length > config.maxInputLength) {
    return {
      safe: false,
      processedInput: input,
      warnings: [],
      blocked: `Input exceeds maximum length (${input.length} > ${config.maxInputLength})`,
    };
  }

  // Check blocked patterns
  if (config.blockedPatterns) {
    for (const pattern of config.blockedPatterns) {
      pattern.lastIndex = 0;
      if (pattern.test(input)) {
        return {
          safe: false,
          processedInput: input,
          warnings: [],
          blocked: 'Input contains blocked pattern',
        };
      }
    }
  }

  // Prompt injection detection
  if (config.promptInjectionDetection) {
    const injectionDetector = new InjectionDetector({
      minSeverity: config.injectionBlockSeverity || 'high',
      blockOnDetection: true,
    });

    const injectionResult = injectionDetector.check(input);
    injectionMatches = injectionResult.matches;

    if (injectionResult.blocked) {
      const highestSeverity = injectionResult.matches[0]?.severity || 'unknown';
      return {
        safe: false,
        processedInput: input,
        warnings: [],
        blocked: `Prompt injection detected (severity: ${highestSeverity})`,
        injectionMatches,
      };
    }

    if (injectionResult.matches.length > 0) {
      warnings.push(
        `Potential prompt injection patterns detected: ${injectionResult.matches.length}`
      );
    }
  }

  // PII redaction
  if (config.piiRedaction) {
    const piiDetector = new PIIDetector({
      types: config.piiTypes as any,
    });

    const piiResult = piiDetector.redact(processedInput);
    piiMatches = piiResult.matches;

    if (piiMatches.length > 0) {
      processedInput = piiResult.redacted;
      warnings.push(
        `PII detected and redacted: ${piiMatches.map((m) => m.type).join(', ')}`
      );
    }
  }

  return {
    safe: true,
    processedInput,
    warnings,
    piiMatches,
    injectionMatches,
  };
}

/**
 * Validate agent output
 */
export async function checkOutput(
  output: string,
  config: { redactPII?: boolean; checkPromptLeak?: boolean; maxLength?: number } = {}
): Promise<{
  safe: boolean;
  sanitized: string;
  warnings: string[];
  violations: any[];
}> {
  const validator = new OutputValidator({
    checkPII: config.redactPII ?? true,
    redactPII: config.redactPII ?? true,
    checkPromptLeak: config.checkPromptLeak ?? true,
    maxLength: config.maxLength,
  });

  const result = validator.validate(output);

  return {
    safe: result.valid,
    sanitized: result.sanitized,
    warnings: result.warnings,
    violations: result.violations,
  };
}

/**
 * Common security presets
 */
export const securityPresets = {
  /** Strict security: full PII redaction, injection blocking, output validation */
  strict: {
    piiRedaction: true,
    promptInjectionDetection: true,
    outputValidation: true,
    maxInputLength: 10000,
    injectionBlockSeverity: 'medium' as const,
    blockedPatterns: [/(<script|javascript:|data:)/i, /(rm\s+-rf|sudo|chmod)/i],
  } as SecurityPipelineConfig,

  /** Standard security: PII redaction, injection detection */
  standard: {
    piiRedaction: true,
    promptInjectionDetection: true,
    outputValidation: true,
    maxInputLength: 50000,
    injectionBlockSeverity: 'high' as const,
  } as SecurityPipelineConfig,

  /** Minimal security: injection detection only */
  minimal: {
    piiRedaction: false,
    promptInjectionDetection: true,
    outputValidation: false,
    injectionBlockSeverity: 'critical' as const,
  } as SecurityPipelineConfig,

  /** Healthcare: strict PII handling */
  healthcare: {
    piiRedaction: true,
    promptInjectionDetection: true,
    outputValidation: true,
    maxInputLength: 50000,
    injectionBlockSeverity: 'high' as const,
    piiTypes: [
      'ssn',
      'date_of_birth',
      'phone',
      'email',
      'address',
      'name',
      'credit_card',
      'bank_account',
    ],
  } as SecurityPipelineConfig,

  /** Financial: strict data protection */
  financial: {
    piiRedaction: true,
    promptInjectionDetection: true,
    outputValidation: true,
    maxInputLength: 30000,
    injectionBlockSeverity: 'medium' as const,
    piiTypes: [
      'ssn',
      'credit_card',
      'bank_account',
      'phone',
      'email',
      'address',
    ],
  } as SecurityPipelineConfig,
};
