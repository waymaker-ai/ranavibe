/**
 * @aicofounder/multi-tenant - Types for multi-tenant policy management
 */

export interface Tenant {
  id: string;
  name: string;
  email: string;
  plan: 'free' | 'pro' | 'enterprise';
  createdAt: string;
  updatedAt: string;
  config: TenantConfig;
  active: boolean;
}

export interface TenantConfig {
  /** Maximum number of projects */
  maxProjects: number;
  /** Maximum evaluations per month */
  maxEvaluationsPerMonth: number;
  /** Maximum API keys */
  maxApiKeys: number;
  /** Rate limit (requests per minute) */
  rateLimitPerMinute: number;
  /** Custom metadata */
  metadata?: Record<string, string>;
}

export interface Project {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  active: boolean;
}

export interface PolicyAssignment {
  projectId: string;
  policyId: string;
  policyName: string;
  /** Policy configuration as JSON-serializable object */
  config: Record<string, unknown>;
  assignedAt: string;
  active: boolean;
}

export interface APIKey {
  id: string;
  tenantId: string;
  key: string;
  name: string;
  permissions: APIKeyPermission[];
  createdAt: string;
  expiresAt?: string;
  lastUsedAt?: string;
  active: boolean;
}

export type APIKeyPermission =
  | 'read'
  | 'write'
  | 'evaluate'
  | 'admin';

export interface UsageRecord {
  id: string;
  tenantId: string;
  projectId: string;
  timestamp: string;
  action: 'evaluate' | 'policy-update' | 'key-generate';
  /** Duration in ms for evaluations */
  durationMs?: number;
  /** Whether the evaluation passed */
  passed?: boolean;
  metadata?: Record<string, unknown>;
}

export interface TenantReport {
  tenantId: string;
  tenantName: string;
  period: { from: string; to: string };
  totalEvaluations: number;
  passedEvaluations: number;
  failedEvaluations: number;
  averageDurationMs: number;
  projectBreakdown: ProjectUsageSummary[];
  budgetUsed: number;
  budgetLimit: number;
}

export interface ProjectUsageSummary {
  projectId: string;
  projectName: string;
  evaluations: number;
  passed: number;
  failed: number;
}

export interface EvaluationRequest {
  content: string;
  context?: Record<string, unknown>;
}

export interface EvaluationResponse {
  passed: boolean;
  findings: EvaluationFinding[];
  policiesApplied: string[];
  durationMs: number;
}

export interface EvaluationFinding {
  policyId: string;
  policyName: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  match?: string;
}

export interface ServerConfig {
  /** Storage backend: 'memory' or 'file' */
  storage: 'memory' | 'file';
  /** Data directory for file storage */
  dataDir?: string;
  /** CORS allowed origins */
  corsOrigins?: string[];
  /** Default rate limit per minute */
  defaultRateLimit?: number;
}

export interface PlanLimits {
  maxProjects: number;
  maxEvaluationsPerMonth: number;
  maxApiKeys: number;
  rateLimitPerMinute: number;
}

export const PLAN_LIMITS: Record<string, PlanLimits> = {
  free: {
    maxProjects: 3,
    maxEvaluationsPerMonth: 1000,
    maxApiKeys: 2,
    rateLimitPerMinute: 30,
  },
  pro: {
    maxProjects: 20,
    maxEvaluationsPerMonth: 50000,
    maxApiKeys: 10,
    rateLimitPerMinute: 300,
  },
  enterprise: {
    maxProjects: 100,
    maxEvaluationsPerMonth: 1000000,
    maxApiKeys: 50,
    rateLimitPerMinute: 3000,
  },
};
