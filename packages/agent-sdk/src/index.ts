// Core
export { createGuardedAgent } from './guarded-agent.js';
export { GuardPipeline } from './middleware.js';

// Factories
export { createHIPAAAgent, createFinancialAgent, createGDPRAgent, createSafeAgent } from './factories/index.js';

// Interceptors
export {
  PIIInterceptor,
  InjectionInterceptor,
  CostInterceptor,
  ComplianceInterceptor,
  ContentInterceptor,
  AuditInterceptor,
  RateLimitInterceptor,
} from './interceptors/index.js';

// Tools
export { guardTool } from './tools/index.js';

// Reporting
export { generateCostReport, formatCostReport, generateComplianceReport, formatComplianceReport } from './reporting/index.js';

// Types
export type {
  GuardConfig,
  GuardedAgentConfig,
  GuardedAgent,
  GuardedAgentResult,
  GuardReport,
  PIIConfig,
  InjectionConfig,
  CostConfig,
  ComplianceConfig,
  ContentFilterConfig,
  AuditConfig,
  RateLimitConfig,
  Interceptor,
  InterceptorResult,
  InterceptorContext,
  Violation,
  AuditEvent,
  CostEntry,
  ComplianceRule,
  ComplianceViolation,
  Severity,
} from './types.js';
