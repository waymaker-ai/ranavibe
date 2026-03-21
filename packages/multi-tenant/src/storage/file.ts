import * as fs from 'fs';
import * as path from 'path';
import {
  APIKey,
  PolicyAssignment,
  Project,
  Tenant,
  UsageRecord,
} from '../types';
import { TenantStorage } from './interface';

/**
 * File-based JSON storage for production without a database.
 * Stores data as JSON files in a specified directory.
 */
export class FileStorage implements TenantStorage {
  private dataDir: string;

  constructor(dataDir: string) {
    this.dataDir = dataDir;
    this.ensureDirectories();
  }

  private ensureDirectories(): void {
    const dirs = ['tenants', 'projects', 'policies', 'apikeys', 'usage'];
    for (const dir of dirs) {
      const dirPath = path.join(this.dataDir, dir);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
    }
  }

  private readJSON<T>(filePath: string): T | null {
    try {
      if (!fs.existsSync(filePath)) return null;
      const content = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(content) as T;
    } catch {
      return null;
    }
  }

  private writeJSON(filePath: string, data: unknown): void {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  }

  private listJSON<T>(dirPath: string): T[] {
    try {
      if (!fs.existsSync(dirPath)) return [];
      const files = fs.readdirSync(dirPath).filter((f) => f.endsWith('.json'));
      return files
        .map((f) => this.readJSON<T>(path.join(dirPath, f)))
        .filter((item): item is T => item !== null);
    } catch {
      return [];
    }
  }

  private deleteJSON(filePath: string): boolean {
    try {
      if (!fs.existsSync(filePath)) return false;
      fs.unlinkSync(filePath);
      return true;
    } catch {
      return false;
    }
  }

  // --- Tenants ---

  async createTenant(tenant: Tenant): Promise<Tenant> {
    const filePath = path.join(this.dataDir, 'tenants', `${tenant.id}.json`);
    this.writeJSON(filePath, tenant);
    return { ...tenant };
  }

  async getTenant(id: string): Promise<Tenant | null> {
    return this.readJSON<Tenant>(path.join(this.dataDir, 'tenants', `${id}.json`));
  }

  async updateTenant(id: string, updates: Partial<Tenant>): Promise<Tenant | null> {
    const tenant = await this.getTenant(id);
    if (!tenant) return null;
    const updated = { ...tenant, ...updates, id, updatedAt: new Date().toISOString() };
    await this.createTenant(updated);
    return updated;
  }

  async deleteTenant(id: string): Promise<boolean> {
    return this.deleteJSON(path.join(this.dataDir, 'tenants', `${id}.json`));
  }

  async listTenants(): Promise<Tenant[]> {
    return this.listJSON<Tenant>(path.join(this.dataDir, 'tenants'));
  }

  // --- Projects ---

  async createProject(project: Project): Promise<Project> {
    const filePath = path.join(this.dataDir, 'projects', `${project.id}.json`);
    this.writeJSON(filePath, project);
    return { ...project };
  }

  async getProject(id: string): Promise<Project | null> {
    return this.readJSON<Project>(path.join(this.dataDir, 'projects', `${id}.json`));
  }

  async updateProject(id: string, updates: Partial<Project>): Promise<Project | null> {
    const project = await this.getProject(id);
    if (!project) return null;
    const updated = { ...project, ...updates, id, updatedAt: new Date().toISOString() };
    await this.createProject(updated);
    return updated;
  }

  async deleteProject(id: string): Promise<boolean> {
    // Also clean up policy assignments
    this.deleteJSON(path.join(this.dataDir, 'policies', `${id}.json`));
    return this.deleteJSON(path.join(this.dataDir, 'projects', `${id}.json`));
  }

  async listProjects(tenantId: string): Promise<Project[]> {
    const all = this.listJSON<Project>(path.join(this.dataDir, 'projects'));
    return all.filter((p) => p.tenantId === tenantId);
  }

  // --- Policy Assignments ---

  async assignPolicy(assignment: PolicyAssignment): Promise<PolicyAssignment> {
    const filePath = path.join(this.dataDir, 'policies', `${assignment.projectId}.json`);
    const existing = this.readJSON<PolicyAssignment[]>(filePath) || [];
    const filtered = existing.filter((p) => p.policyId !== assignment.policyId);
    filtered.push(assignment);
    this.writeJSON(filePath, filtered);
    return { ...assignment };
  }

  async removePolicy(projectId: string, policyId: string): Promise<boolean> {
    const filePath = path.join(this.dataDir, 'policies', `${projectId}.json`);
    const existing = this.readJSON<PolicyAssignment[]>(filePath) || [];
    const filtered = existing.filter((p) => p.policyId !== policyId);
    if (filtered.length === existing.length) return false;
    this.writeJSON(filePath, filtered);
    return true;
  }

  async getProjectPolicies(projectId: string): Promise<PolicyAssignment[]> {
    const filePath = path.join(this.dataDir, 'policies', `${projectId}.json`);
    const policies = this.readJSON<PolicyAssignment[]>(filePath) || [];
    return policies.filter((p) => p.active);
  }

  async updatePolicyAssignment(
    projectId: string,
    policyId: string,
    updates: Partial<PolicyAssignment>,
  ): Promise<PolicyAssignment | null> {
    const filePath = path.join(this.dataDir, 'policies', `${projectId}.json`);
    const existing = this.readJSON<PolicyAssignment[]>(filePath) || [];
    const idx = existing.findIndex((p) => p.policyId === policyId);
    if (idx === -1) return null;
    const updated = { ...existing[idx], ...updates, projectId, policyId };
    existing[idx] = updated;
    this.writeJSON(filePath, existing);
    return { ...updated };
  }

  // --- API Keys ---

  async createApiKey(apiKey: APIKey): Promise<APIKey> {
    const filePath = path.join(this.dataDir, 'apikeys', `${apiKey.id}.json`);
    this.writeJSON(filePath, apiKey);
    return { ...apiKey };
  }

  async getApiKeyByKey(key: string): Promise<APIKey | null> {
    const all = this.listJSON<APIKey>(path.join(this.dataDir, 'apikeys'));
    return all.find((k) => k.key === key) || null;
  }

  async getApiKey(id: string): Promise<APIKey | null> {
    return this.readJSON<APIKey>(path.join(this.dataDir, 'apikeys', `${id}.json`));
  }

  async deleteApiKey(id: string): Promise<boolean> {
    return this.deleteJSON(path.join(this.dataDir, 'apikeys', `${id}.json`));
  }

  async listApiKeys(tenantId: string): Promise<APIKey[]> {
    const all = this.listJSON<APIKey>(path.join(this.dataDir, 'apikeys'));
    return all.filter((k) => k.tenantId === tenantId);
  }

  async updateApiKey(id: string, updates: Partial<APIKey>): Promise<APIKey | null> {
    const apiKey = await this.getApiKey(id);
    if (!apiKey) return null;
    const updated = { ...apiKey, ...updates, id };
    await this.createApiKey(updated);
    return updated;
  }

  // --- Usage Records ---

  async recordUsage(record: UsageRecord): Promise<UsageRecord> {
    const month = record.timestamp.slice(0, 7); // YYYY-MM
    const filePath = path.join(this.dataDir, 'usage', `${record.tenantId}-${month}.json`);
    const existing = this.readJSON<UsageRecord[]>(filePath) || [];
    existing.push(record);
    this.writeJSON(filePath, existing);
    return { ...record };
  }

  async getUsage(tenantId: string, from: string, to: string): Promise<UsageRecord[]> {
    const results: UsageRecord[] = [];
    const usageDir = path.join(this.dataDir, 'usage');

    if (!fs.existsSync(usageDir)) return results;

    const files = fs.readdirSync(usageDir)
      .filter((f) => f.startsWith(tenantId) && f.endsWith('.json'));

    for (const file of files) {
      const records = this.readJSON<UsageRecord[]>(path.join(usageDir, file)) || [];
      results.push(
        ...records.filter((r) => r.timestamp >= from && r.timestamp <= to),
      );
    }

    return results;
  }

  async getUsageCount(tenantId: string, from: string, to: string): Promise<number> {
    const records = await this.getUsage(tenantId, from, to);
    return records.filter((r) => r.action === 'evaluate').length;
  }
}
