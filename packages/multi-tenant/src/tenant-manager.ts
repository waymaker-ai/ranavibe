import { TenantStorage } from './storage/interface';
import {
  APIKey,
  EvaluationFinding,
  EvaluationRequest,
  EvaluationResponse,
  PLAN_LIMITS,
  PolicyAssignment,
  Project,
  Tenant,
  TenantConfig,
  TenantReport,
  UsageRecord,
} from './types';

/**
 * Generate a random ID string
 */
function generateId(prefix: string = ''): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let id = '';
  for (let i = 0; i < 20; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return prefix ? `${prefix}_${id}` : id;
}

/**
 * Generate a random API key
 */
function generateApiKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let key = 'cofounder_';
  for (let i = 0; i < 40; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return key;
}

/**
 * Core business logic for multi-tenant policy management.
 */
export class TenantManager {
  constructor(private storage: TenantStorage) {}

  // --- Tenant Management ---

  async createTenant(params: {
    name: string;
    email: string;
    plan?: 'free' | 'pro' | 'enterprise';
  }): Promise<Tenant> {
    const plan = params.plan || 'free';
    const limits = PLAN_LIMITS[plan];
    const now = new Date().toISOString();

    const tenant: Tenant = {
      id: generateId('tenant'),
      name: params.name,
      email: params.email,
      plan,
      createdAt: now,
      updatedAt: now,
      config: {
        maxProjects: limits.maxProjects,
        maxEvaluationsPerMonth: limits.maxEvaluationsPerMonth,
        maxApiKeys: limits.maxApiKeys,
        rateLimitPerMinute: limits.rateLimitPerMinute,
      },
      active: true,
    };

    return this.storage.createTenant(tenant);
  }

  async getTenant(id: string): Promise<Tenant | null> {
    return this.storage.getTenant(id);
  }

  async updateTenant(
    id: string,
    updates: Partial<Pick<Tenant, 'name' | 'email' | 'plan' | 'config' | 'active'>>,
  ): Promise<Tenant | null> {
    // If plan changes, update config limits
    if (updates.plan) {
      const limits = PLAN_LIMITS[updates.plan];
      updates.config = {
        ...(updates.config || {}),
        maxProjects: limits.maxProjects,
        maxEvaluationsPerMonth: limits.maxEvaluationsPerMonth,
        maxApiKeys: limits.maxApiKeys,
        rateLimitPerMinute: limits.rateLimitPerMinute,
      } as TenantConfig;
    }
    return this.storage.updateTenant(id, updates);
  }

  // --- Project Management ---

  async createProject(
    tenantId: string,
    params: { name: string; description?: string },
  ): Promise<Project> {
    const tenant = await this.storage.getTenant(tenantId);
    if (!tenant) {
      throw new Error(`Tenant not found: ${tenantId}`);
    }
    if (!tenant.active) {
      throw new Error(`Tenant is not active: ${tenantId}`);
    }

    // Check project limit
    const existing = await this.storage.listProjects(tenantId);
    if (existing.length >= tenant.config.maxProjects) {
      throw new Error(
        `Project limit reached (${tenant.config.maxProjects}). Upgrade plan for more projects.`,
      );
    }

    const now = new Date().toISOString();
    const project: Project = {
      id: generateId('proj'),
      tenantId,
      name: params.name,
      description: params.description || '',
      createdAt: now,
      updatedAt: now,
      active: true,
    };

    return this.storage.createProject(project);
  }

  async getProject(id: string): Promise<Project | null> {
    return this.storage.getProject(id);
  }

  async listProjects(tenantId: string): Promise<Project[]> {
    return this.storage.listProjects(tenantId);
  }

  // --- Policy Assignment ---

  async assignPolicies(
    projectId: string,
    policies: Array<{ policyId: string; policyName: string; config?: Record<string, unknown> }>,
  ): Promise<PolicyAssignment[]> {
    const project = await this.storage.getProject(projectId);
    if (!project) {
      throw new Error(`Project not found: ${projectId}`);
    }

    const results: PolicyAssignment[] = [];
    const now = new Date().toISOString();

    for (const policy of policies) {
      const assignment: PolicyAssignment = {
        projectId,
        policyId: policy.policyId,
        policyName: policy.policyName,
        config: policy.config || {},
        assignedAt: now,
        active: true,
      };
      const result = await this.storage.assignPolicy(assignment);
      results.push(result);
    }

    // Record usage
    await this.storage.recordUsage({
      id: generateId('usage'),
      tenantId: project.tenantId,
      projectId,
      timestamp: now,
      action: 'policy-update',
      metadata: { policiesAssigned: policies.length },
    });

    return results;
  }

  async getProjectPolicies(projectId: string): Promise<PolicyAssignment[]> {
    return this.storage.getProjectPolicies(projectId);
  }

  // --- Content Evaluation ---

  async evaluateContent(
    projectId: string,
    request: EvaluationRequest,
  ): Promise<EvaluationResponse> {
    const startTime = Date.now();

    const project = await this.storage.getProject(projectId);
    if (!project) {
      throw new Error(`Project not found: ${projectId}`);
    }

    const tenant = await this.storage.getTenant(project.tenantId);
    if (!tenant || !tenant.active) {
      throw new Error('Tenant not found or inactive');
    }

    // Check monthly evaluation budget
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();
    const currentCount = await this.storage.getUsageCount(
      project.tenantId,
      monthStart,
      monthEnd,
    );

    if (currentCount >= tenant.config.maxEvaluationsPerMonth) {
      throw new Error(
        `Monthly evaluation limit reached (${tenant.config.maxEvaluationsPerMonth}). Upgrade plan for more evaluations.`,
      );
    }

    // Get project policies
    const policies = await this.storage.getProjectPolicies(projectId);

    // Evaluate content against each policy
    const findings: EvaluationFinding[] = [];
    const policiesApplied: string[] = [];

    for (const policy of policies) {
      policiesApplied.push(policy.policyName);

      // Apply policy-specific evaluation logic based on config
      const policyFindings = evaluateAgainstPolicy(request.content, policy);
      findings.push(...policyFindings);
    }

    const passed = findings.filter((f) => f.severity === 'high' || f.severity === 'critical').length === 0;
    const durationMs = Date.now() - startTime;

    // Record usage
    await this.storage.recordUsage({
      id: generateId('usage'),
      tenantId: project.tenantId,
      projectId,
      timestamp: new Date().toISOString(),
      action: 'evaluate',
      durationMs,
      passed,
      metadata: {
        findingsCount: findings.length,
        policiesApplied: policiesApplied.length,
      },
    });

    return { passed, findings, policiesApplied, durationMs };
  }

  // --- API Key Management ---

  async createApiKey(
    tenantId: string,
    params: { name: string; permissions?: Array<'read' | 'write' | 'evaluate' | 'admin'> },
  ): Promise<APIKey> {
    const tenant = await this.storage.getTenant(tenantId);
    if (!tenant) {
      throw new Error(`Tenant not found: ${tenantId}`);
    }

    // Check API key limit
    const existing = await this.storage.listApiKeys(tenantId);
    if (existing.length >= tenant.config.maxApiKeys) {
      throw new Error(
        `API key limit reached (${tenant.config.maxApiKeys}). Upgrade plan for more keys.`,
      );
    }

    const now = new Date().toISOString();
    const apiKey: APIKey = {
      id: generateId('key'),
      tenantId,
      key: generateApiKey(),
      name: params.name,
      permissions: params.permissions || ['read', 'evaluate'],
      createdAt: now,
      active: true,
    };

    const result = await this.storage.createApiKey(apiKey);

    await this.storage.recordUsage({
      id: generateId('usage'),
      tenantId,
      projectId: '',
      timestamp: now,
      action: 'key-generate',
      metadata: { keyName: params.name },
    });

    return result;
  }

  async validateApiKey(key: string): Promise<{ valid: boolean; tenantId?: string; permissions?: string[] }> {
    const apiKey = await this.storage.getApiKeyByKey(key);
    if (!apiKey || !apiKey.active) {
      return { valid: false };
    }

    // Check expiry
    if (apiKey.expiresAt && new Date(apiKey.expiresAt) < new Date()) {
      return { valid: false };
    }

    // Update last used timestamp
    await this.storage.updateApiKey(apiKey.id, {
      lastUsedAt: new Date().toISOString(),
    });

    return {
      valid: true,
      tenantId: apiKey.tenantId,
      permissions: apiKey.permissions,
    };
  }

  // --- Usage Reporting ---

  async getUsageReport(
    tenantId: string,
    from?: string,
    to?: string,
  ): Promise<TenantReport> {
    const tenant = await this.storage.getTenant(tenantId);
    if (!tenant) {
      throw new Error(`Tenant not found: ${tenantId}`);
    }

    const now = new Date();
    const periodFrom = from || new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const periodTo = to || now.toISOString();

    const usage = await this.storage.getUsage(tenantId, periodFrom, periodTo);
    const evaluations = usage.filter((r) => r.action === 'evaluate');

    // Calculate stats
    const totalEvaluations = evaluations.length;
    const passedEvaluations = evaluations.filter((r) => r.passed === true).length;
    const failedEvaluations = evaluations.filter((r) => r.passed === false).length;

    const durations = evaluations
      .map((r) => r.durationMs)
      .filter((d): d is number => d !== undefined);
    const averageDurationMs =
      durations.length > 0
        ? durations.reduce((a, b) => a + b, 0) / durations.length
        : 0;

    // Project breakdown
    const projects = await this.storage.listProjects(tenantId);
    const projectBreakdown = projects.map((project) => {
      const projectEvals = evaluations.filter((r) => r.projectId === project.id);
      return {
        projectId: project.id,
        projectName: project.name,
        evaluations: projectEvals.length,
        passed: projectEvals.filter((r) => r.passed === true).length,
        failed: projectEvals.filter((r) => r.passed === false).length,
      };
    });

    return {
      tenantId,
      tenantName: tenant.name,
      period: { from: periodFrom, to: periodTo },
      totalEvaluations,
      passedEvaluations,
      failedEvaluations,
      averageDurationMs: Math.round(averageDurationMs),
      projectBreakdown,
      budgetUsed: totalEvaluations,
      budgetLimit: tenant.config.maxEvaluationsPerMonth,
    };
  }
}

/**
 * Evaluate content against a policy assignment.
 * This is a basic pattern-matching implementation.
 * In production, this would integrate with CoFounder core detectors.
 */
function evaluateAgainstPolicy(
  content: string,
  policy: PolicyAssignment,
): EvaluationFinding[] {
  const findings: EvaluationFinding[] = [];
  const config = policy.config;

  // Check for blocked patterns if configured
  const blockedPatterns = (config.blockedPatterns as string[]) || [];
  for (const pattern of blockedPatterns) {
    try {
      const regex = new RegExp(pattern, 'gi');
      const matches = content.match(regex);
      if (matches) {
        for (const match of matches) {
          findings.push({
            policyId: policy.policyId,
            policyName: policy.policyName,
            type: 'blocked-pattern',
            severity: (config.severity as 'low' | 'medium' | 'high' | 'critical') || 'high',
            message: `Blocked pattern matched: "${pattern}"`,
            match,
          });
        }
      }
    } catch {
      // Invalid regex pattern, skip
    }
  }

  // Check for required patterns if configured
  const requiredPatterns = (config.requiredPatterns as string[]) || [];
  for (const pattern of requiredPatterns) {
    try {
      const regex = new RegExp(pattern, 'gi');
      if (!regex.test(content)) {
        findings.push({
          policyId: policy.policyId,
          policyName: policy.policyName,
          type: 'missing-required-pattern',
          severity: 'medium',
          message: `Required pattern not found: "${pattern}"`,
        });
      }
    } catch {
      // Invalid regex pattern, skip
    }
  }

  // Check max length if configured
  const maxLength = config.maxLength as number | undefined;
  if (maxLength && content.length > maxLength) {
    findings.push({
      policyId: policy.policyId,
      policyName: policy.policyName,
      type: 'length-exceeded',
      severity: 'low',
      message: `Content length (${content.length}) exceeds maximum (${maxLength})`,
    });
  }

  return findings;
}
