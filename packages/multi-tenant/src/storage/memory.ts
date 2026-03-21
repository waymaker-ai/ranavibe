import {
  APIKey,
  PolicyAssignment,
  Project,
  Tenant,
  UsageRecord,
} from '../types';
import { TenantStorage } from './interface';

/**
 * In-memory storage implementation for development and testing.
 * Data is lost when the process exits.
 */
export class MemoryStorage implements TenantStorage {
  private tenants: Map<string, Tenant> = new Map();
  private projects: Map<string, Project> = new Map();
  private policies: Map<string, PolicyAssignment[]> = new Map();
  private apiKeys: Map<string, APIKey> = new Map();
  private apiKeysByKey: Map<string, APIKey> = new Map();
  private usage: UsageRecord[] = [];

  // --- Tenants ---

  async createTenant(tenant: Tenant): Promise<Tenant> {
    this.tenants.set(tenant.id, { ...tenant });
    return { ...tenant };
  }

  async getTenant(id: string): Promise<Tenant | null> {
    const tenant = this.tenants.get(id);
    return tenant ? { ...tenant } : null;
  }

  async updateTenant(id: string, updates: Partial<Tenant>): Promise<Tenant | null> {
    const tenant = this.tenants.get(id);
    if (!tenant) return null;
    const updated = { ...tenant, ...updates, id, updatedAt: new Date().toISOString() };
    this.tenants.set(id, updated);
    return { ...updated };
  }

  async deleteTenant(id: string): Promise<boolean> {
    return this.tenants.delete(id);
  }

  async listTenants(): Promise<Tenant[]> {
    return Array.from(this.tenants.values()).map((t) => ({ ...t }));
  }

  // --- Projects ---

  async createProject(project: Project): Promise<Project> {
    this.projects.set(project.id, { ...project });
    return { ...project };
  }

  async getProject(id: string): Promise<Project | null> {
    const project = this.projects.get(id);
    return project ? { ...project } : null;
  }

  async updateProject(id: string, updates: Partial<Project>): Promise<Project | null> {
    const project = this.projects.get(id);
    if (!project) return null;
    const updated = { ...project, ...updates, id, updatedAt: new Date().toISOString() };
    this.projects.set(id, updated);
    return { ...updated };
  }

  async deleteProject(id: string): Promise<boolean> {
    this.policies.delete(id);
    return this.projects.delete(id);
  }

  async listProjects(tenantId: string): Promise<Project[]> {
    return Array.from(this.projects.values())
      .filter((p) => p.tenantId === tenantId)
      .map((p) => ({ ...p }));
  }

  // --- Policy Assignments ---

  async assignPolicy(assignment: PolicyAssignment): Promise<PolicyAssignment> {
    const projectPolicies = this.policies.get(assignment.projectId) || [];
    // Remove existing assignment for same policy
    const filtered = projectPolicies.filter((p) => p.policyId !== assignment.policyId);
    filtered.push({ ...assignment });
    this.policies.set(assignment.projectId, filtered);
    return { ...assignment };
  }

  async removePolicy(projectId: string, policyId: string): Promise<boolean> {
    const projectPolicies = this.policies.get(projectId);
    if (!projectPolicies) return false;
    const before = projectPolicies.length;
    const filtered = projectPolicies.filter((p) => p.policyId !== policyId);
    this.policies.set(projectId, filtered);
    return filtered.length < before;
  }

  async getProjectPolicies(projectId: string): Promise<PolicyAssignment[]> {
    const policies = this.policies.get(projectId) || [];
    return policies.filter((p) => p.active).map((p) => ({ ...p }));
  }

  async updatePolicyAssignment(
    projectId: string,
    policyId: string,
    updates: Partial<PolicyAssignment>,
  ): Promise<PolicyAssignment | null> {
    const projectPolicies = this.policies.get(projectId);
    if (!projectPolicies) return null;
    const idx = projectPolicies.findIndex((p) => p.policyId === policyId);
    if (idx === -1) return null;
    const updated = { ...projectPolicies[idx], ...updates, projectId, policyId };
    projectPolicies[idx] = updated;
    return { ...updated };
  }

  // --- API Keys ---

  async createApiKey(apiKey: APIKey): Promise<APIKey> {
    this.apiKeys.set(apiKey.id, { ...apiKey });
    this.apiKeysByKey.set(apiKey.key, { ...apiKey });
    return { ...apiKey };
  }

  async getApiKeyByKey(key: string): Promise<APIKey | null> {
    const apiKey = this.apiKeysByKey.get(key);
    return apiKey ? { ...apiKey } : null;
  }

  async getApiKey(id: string): Promise<APIKey | null> {
    const apiKey = this.apiKeys.get(id);
    return apiKey ? { ...apiKey } : null;
  }

  async deleteApiKey(id: string): Promise<boolean> {
    const apiKey = this.apiKeys.get(id);
    if (apiKey) {
      this.apiKeysByKey.delete(apiKey.key);
    }
    return this.apiKeys.delete(id);
  }

  async listApiKeys(tenantId: string): Promise<APIKey[]> {
    return Array.from(this.apiKeys.values())
      .filter((k) => k.tenantId === tenantId)
      .map((k) => ({ ...k }));
  }

  async updateApiKey(id: string, updates: Partial<APIKey>): Promise<APIKey | null> {
    const apiKey = this.apiKeys.get(id);
    if (!apiKey) return null;
    const updated = { ...apiKey, ...updates, id };
    this.apiKeys.set(id, updated);
    if (apiKey.key !== updated.key) {
      this.apiKeysByKey.delete(apiKey.key);
    }
    this.apiKeysByKey.set(updated.key, updated);
    return { ...updated };
  }

  // --- Usage Records ---

  async recordUsage(record: UsageRecord): Promise<UsageRecord> {
    this.usage.push({ ...record });
    return { ...record };
  }

  async getUsage(tenantId: string, from: string, to: string): Promise<UsageRecord[]> {
    return this.usage
      .filter(
        (r) =>
          r.tenantId === tenantId &&
          r.timestamp >= from &&
          r.timestamp <= to,
      )
      .map((r) => ({ ...r }));
  }

  async getUsageCount(tenantId: string, from: string, to: string): Promise<number> {
    return this.usage.filter(
      (r) =>
        r.tenantId === tenantId &&
        r.action === 'evaluate' &&
        r.timestamp >= from &&
        r.timestamp <= to,
    ).length;
  }
}
