import {
  APIKey,
  PolicyAssignment,
  Project,
  Tenant,
  UsageRecord,
} from '../types';

/**
 * Storage interface for multi-tenant data.
 * All methods are async to support both in-memory and persistent backends.
 */
export interface TenantStorage {
  // --- Tenants ---
  createTenant(tenant: Tenant): Promise<Tenant>;
  getTenant(id: string): Promise<Tenant | null>;
  updateTenant(id: string, updates: Partial<Tenant>): Promise<Tenant | null>;
  deleteTenant(id: string): Promise<boolean>;
  listTenants(): Promise<Tenant[]>;

  // --- Projects ---
  createProject(project: Project): Promise<Project>;
  getProject(id: string): Promise<Project | null>;
  updateProject(id: string, updates: Partial<Project>): Promise<Project | null>;
  deleteProject(id: string): Promise<boolean>;
  listProjects(tenantId: string): Promise<Project[]>;

  // --- Policy Assignments ---
  assignPolicy(assignment: PolicyAssignment): Promise<PolicyAssignment>;
  removePolicy(projectId: string, policyId: string): Promise<boolean>;
  getProjectPolicies(projectId: string): Promise<PolicyAssignment[]>;
  updatePolicyAssignment(
    projectId: string,
    policyId: string,
    updates: Partial<PolicyAssignment>,
  ): Promise<PolicyAssignment | null>;

  // --- API Keys ---
  createApiKey(apiKey: APIKey): Promise<APIKey>;
  getApiKeyByKey(key: string): Promise<APIKey | null>;
  getApiKey(id: string): Promise<APIKey | null>;
  deleteApiKey(id: string): Promise<boolean>;
  listApiKeys(tenantId: string): Promise<APIKey[]>;
  updateApiKey(id: string, updates: Partial<APIKey>): Promise<APIKey | null>;

  // --- Usage Records ---
  recordUsage(record: UsageRecord): Promise<UsageRecord>;
  getUsage(tenantId: string, from: string, to: string): Promise<UsageRecord[]>;
  getUsageCount(tenantId: string, from: string, to: string): Promise<number>;
}
