/**
 * Role-Based Access Control (RBAC)
 *
 * Enterprise access control capabilities:
 * - Role management
 * - Permission management
 * - Policy enforcement
 * - Resource-level access control
 * - Audit trail
 */

// ============================================================================
// Types
// ============================================================================

export type Permission = string; // e.g., 'agents:read', 'prompts:write', 'admin:*'
export type ResourceType = 'agent' | 'prompt' | 'model' | 'api_key' | 'user' | 'team' | 'organization' | 'billing' | '*';
export type Action = 'create' | 'read' | 'update' | 'delete' | 'execute' | 'manage' | '*';

export interface Role {
  id: string;
  name: string;
  description?: string;
  permissions: Permission[];
  inherits?: string[]; // Role IDs to inherit from
  isSystem?: boolean; // Built-in roles that can't be modified
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, unknown>;
}

export interface Policy {
  id: string;
  name: string;
  description?: string;
  effect: 'allow' | 'deny';
  resources: string[]; // Resource patterns, e.g., 'agents/*', 'prompts/123'
  actions: Action[];
  conditions?: PolicyCondition[];
  priority?: number; // Higher priority policies are evaluated first
}

export interface PolicyCondition {
  type: 'time_range' | 'ip_range' | 'attribute' | 'resource_attribute' | 'custom';
  operator: 'equals' | 'not_equals' | 'in' | 'not_in' | 'contains' | 'matches' | 'greater' | 'less';
  field: string;
  value: unknown;
}

export interface UserRoleAssignment {
  userId: string;
  roleId: string;
  scope?: string; // Optional scope (e.g., 'organization:123', 'team:456')
  expiresAt?: Date;
  grantedBy: string;
  grantedAt: Date;
}

export interface AccessCheckResult {
  allowed: boolean;
  matchedPolicy?: Policy;
  deniedBy?: Policy;
  reason?: string;
}

export interface RBACContext {
  userId: string;
  roles: string[];
  attributes?: Record<string, unknown>;
  ipAddress?: string;
  timestamp?: Date;
}

export interface AuditLogEntry {
  id: string;
  timestamp: Date;
  userId: string;
  action: string;
  resourceType: ResourceType;
  resourceId: string;
  allowed: boolean;
  deniedReason?: string;
  context: Record<string, unknown>;
}

export interface RBACConfig {
  defaultDenyAll?: boolean;
  enableAuditLog?: boolean;
  auditLogHandler?: (entry: AuditLogEntry) => Promise<void>;
  cacheEnabled?: boolean;
  cacheTTL?: number; // seconds
  storageAdapter?: RBACStorageAdapter;
}

export interface RBACStorageAdapter {
  getRoles(): Promise<Role[]>;
  getRole(id: string): Promise<Role | null>;
  createRole(role: Omit<Role, 'id' | 'createdAt' | 'updatedAt'>): Promise<Role>;
  updateRole(id: string, updates: Partial<Role>): Promise<Role>;
  deleteRole(id: string): Promise<void>;
  getPolicies(): Promise<Policy[]>;
  getPolicy(id: string): Promise<Policy | null>;
  createPolicy(policy: Omit<Policy, 'id'>): Promise<Policy>;
  updatePolicy(id: string, updates: Partial<Policy>): Promise<Policy>;
  deletePolicy(id: string): Promise<void>;
  getUserRoles(userId: string): Promise<UserRoleAssignment[]>;
  assignRole(assignment: Omit<UserRoleAssignment, 'grantedAt'>): Promise<UserRoleAssignment>;
  revokeRole(userId: string, roleId: string, scope?: string): Promise<void>;
}

// ============================================================================
// Built-in Roles
// ============================================================================

export const SYSTEM_ROLES: Omit<Role, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'super_admin',
    description: 'Full system access',
    permissions: ['*:*'],
    isSystem: true,
  },
  {
    name: 'admin',
    description: 'Organization administrator',
    permissions: [
      'agents:*',
      'prompts:*',
      'models:*',
      'api_keys:*',
      'users:read',
      'users:update',
      'teams:*',
      'billing:read',
    ],
    isSystem: true,
  },
  {
    name: 'developer',
    description: 'Developer with full agent access',
    permissions: [
      'agents:*',
      'prompts:*',
      'models:read',
      'api_keys:read',
      'api_keys:create',
    ],
    isSystem: true,
  },
  {
    name: 'analyst',
    description: 'Read-only access for analysis',
    permissions: [
      'agents:read',
      'prompts:read',
      'models:read',
    ],
    isSystem: true,
  },
  {
    name: 'viewer',
    description: 'Basic read-only access',
    permissions: [
      'agents:read',
    ],
    isSystem: true,
  },
];

// ============================================================================
// RBAC Manager Class
// ============================================================================

export class RBACManager {
  private config: Required<RBACConfig>;
  private storage: RBACStorageAdapter;
  private roleCache: Map<string, Role> = new Map();
  private policyCache: Policy[] = [];
  private permissionCache: Map<string, Set<Permission>> = new Map();
  private cacheTimestamp = 0;

  constructor(config: RBACConfig = {}) {
    this.config = {
      defaultDenyAll: config.defaultDenyAll ?? true,
      enableAuditLog: config.enableAuditLog ?? true,
      auditLogHandler: config.auditLogHandler ?? (async () => {}),
      cacheEnabled: config.cacheEnabled ?? true,
      cacheTTL: config.cacheTTL ?? 300,
      storageAdapter: config.storageAdapter ?? new MemoryRBACStorage(),
    };

    this.storage = this.config.storageAdapter;
  }

  // --------------------------------------------------------------------------
  // Access Control
  // --------------------------------------------------------------------------

  /**
   * Check if a user has access to perform an action on a resource
   */
  async checkAccess(
    context: RBACContext,
    action: Action,
    resource: { type: ResourceType; id?: string }
  ): Promise<AccessCheckResult> {
    await this.refreshCacheIfNeeded();

    const resourcePattern = resource.id
      ? `${resource.type}:${resource.id}`
      : `${resource.type}:*`;

    // Get all permissions for user's roles
    const permissions = await this.getUserPermissions(context.userId);

    // Check if any permission grants the action
    const hasPermission = this.matchPermission(
      permissions,
      resource.type,
      action
    );

    // Check policies
    const policies = await this.getApplicablePolicies(
      context,
      resourcePattern,
      action
    );

    // Sort by priority
    policies.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));

    // Evaluate policies
    let result: AccessCheckResult = {
      allowed: hasPermission && !this.config.defaultDenyAll,
    };

    for (const policy of policies) {
      const matches = this.evaluatePolicy(policy, context, resourcePattern, action);

      if (matches) {
        if (policy.effect === 'deny') {
          result = {
            allowed: false,
            deniedBy: policy,
            reason: `Denied by policy: ${policy.name}`,
          };
          break; // Deny takes precedence
        } else {
          result = {
            allowed: true,
            matchedPolicy: policy,
          };
        }
      }
    }

    // If no policy matched, fall back to permission check
    if (!result.matchedPolicy && !result.deniedBy) {
      result.allowed = hasPermission;
      if (!hasPermission) {
        result.reason = 'No matching permission';
      }
    }

    // Audit log
    if (this.config.enableAuditLog) {
      await this.logAccess(context, action, resource, result);
    }

    return result;
  }

  /**
   * Require access (throws if denied)
   */
  async requireAccess(
    context: RBACContext,
    action: Action,
    resource: { type: ResourceType; id?: string }
  ): Promise<void> {
    const result = await this.checkAccess(context, action, resource);

    if (!result.allowed) {
      const error = new Error(
        result.reason ?? `Access denied: ${action} on ${resource.type}`
      );
      (error as any).code = 'ACCESS_DENIED';
      (error as any).resource = resource;
      (error as any).action = action;
      throw error;
    }
  }

  /**
   * Check multiple permissions at once
   */
  async checkMultipleAccess(
    context: RBACContext,
    checks: Array<{ action: Action; resource: { type: ResourceType; id?: string } }>
  ): Promise<Map<string, AccessCheckResult>> {
    const results = new Map<string, AccessCheckResult>();

    for (const check of checks) {
      const key = `${check.action}:${check.resource.type}:${check.resource.id ?? '*'}`;
      results.set(key, await this.checkAccess(context, check.action, check.resource));
    }

    return results;
  }

  // --------------------------------------------------------------------------
  // Role Management
  // --------------------------------------------------------------------------

  /**
   * Create a new role
   */
  async createRole(
    role: Omit<Role, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Role> {
    // Validate permissions
    for (const permission of role.permissions) {
      this.validatePermission(permission);
    }

    const created = await this.storage.createRole(role);
    this.invalidateCache();

    return created;
  }

  /**
   * Update a role
   */
  async updateRole(
    roleId: string,
    updates: Partial<Omit<Role, 'id' | 'createdAt' | 'updatedAt' | 'isSystem'>>
  ): Promise<Role> {
    const existing = await this.storage.getRole(roleId);

    if (!existing) {
      throw new Error(`Role '${roleId}' not found`);
    }

    if (existing.isSystem) {
      throw new Error('Cannot modify system roles');
    }

    if (updates.permissions) {
      for (const permission of updates.permissions) {
        this.validatePermission(permission);
      }
    }

    const updated = await this.storage.updateRole(roleId, {
      ...updates,
      updatedAt: new Date(),
    });

    this.invalidateCache();

    return updated;
  }

  /**
   * Delete a role
   */
  async deleteRole(roleId: string): Promise<void> {
    const existing = await this.storage.getRole(roleId);

    if (!existing) {
      throw new Error(`Role '${roleId}' not found`);
    }

    if (existing.isSystem) {
      throw new Error('Cannot delete system roles');
    }

    await this.storage.deleteRole(roleId);
    this.invalidateCache();
  }

  /**
   * Get all roles
   */
  async getRoles(): Promise<Role[]> {
    return this.storage.getRoles();
  }

  /**
   * Get role by ID
   */
  async getRole(roleId: string): Promise<Role | null> {
    return this.storage.getRole(roleId);
  }

  // --------------------------------------------------------------------------
  // User Role Assignment
  // --------------------------------------------------------------------------

  /**
   * Assign a role to a user
   */
  async assignRole(
    userId: string,
    roleId: string,
    options?: {
      scope?: string;
      expiresAt?: Date;
      grantedBy: string;
    }
  ): Promise<UserRoleAssignment> {
    const role = await this.storage.getRole(roleId);

    if (!role) {
      throw new Error(`Role '${roleId}' not found`);
    }

    const assignment = await this.storage.assignRole({
      userId,
      roleId,
      scope: options?.scope,
      expiresAt: options?.expiresAt,
      grantedBy: options?.grantedBy ?? 'system',
    });

    this.invalidateCache();

    return assignment;
  }

  /**
   * Revoke a role from a user
   */
  async revokeRole(
    userId: string,
    roleId: string,
    scope?: string
  ): Promise<void> {
    await this.storage.revokeRole(userId, roleId, scope);
    this.invalidateCache();
  }

  /**
   * Get all roles assigned to a user
   */
  async getUserRoles(userId: string): Promise<UserRoleAssignment[]> {
    const assignments = await this.storage.getUserRoles(userId);

    // Filter out expired assignments
    const now = new Date();
    return assignments.filter(
      (a) => !a.expiresAt || a.expiresAt > now
    );
  }

  /**
   * Get all permissions for a user
   */
  async getUserPermissions(userId: string): Promise<Set<Permission>> {
    // Check cache
    const cacheKey = `user:${userId}`;
    if (this.config.cacheEnabled && this.permissionCache.has(cacheKey)) {
      return this.permissionCache.get(cacheKey)!;
    }

    const assignments = await this.getUserRoles(userId);
    const permissions = new Set<Permission>();

    for (const assignment of assignments) {
      const rolePermissions = await this.getRolePermissions(assignment.roleId);
      for (const permission of rolePermissions) {
        permissions.add(permission);
      }
    }

    // Cache
    if (this.config.cacheEnabled) {
      this.permissionCache.set(cacheKey, permissions);
    }

    return permissions;
  }

  /**
   * Get all permissions for a role (including inherited)
   */
  async getRolePermissions(roleId: string): Promise<Set<Permission>> {
    const role = await this.storage.getRole(roleId);

    if (!role) {
      return new Set();
    }

    const permissions = new Set<Permission>(role.permissions);

    // Add inherited permissions
    if (role.inherits?.length) {
      for (const inheritedRoleId of role.inherits) {
        const inheritedPermissions = await this.getRolePermissions(inheritedRoleId);
        for (const permission of inheritedPermissions) {
          permissions.add(permission);
        }
      }
    }

    return permissions;
  }

  // --------------------------------------------------------------------------
  // Policy Management
  // --------------------------------------------------------------------------

  /**
   * Create a policy
   */
  async createPolicy(policy: Omit<Policy, 'id'>): Promise<Policy> {
    const created = await this.storage.createPolicy(policy);
    this.invalidateCache();
    return created;
  }

  /**
   * Update a policy
   */
  async updatePolicy(
    policyId: string,
    updates: Partial<Omit<Policy, 'id'>>
  ): Promise<Policy> {
    const updated = await this.storage.updatePolicy(policyId, updates);
    this.invalidateCache();
    return updated;
  }

  /**
   * Delete a policy
   */
  async deletePolicy(policyId: string): Promise<void> {
    await this.storage.deletePolicy(policyId);
    this.invalidateCache();
  }

  /**
   * Get all policies
   */
  async getPolicies(): Promise<Policy[]> {
    return this.storage.getPolicies();
  }

  // --------------------------------------------------------------------------
  // Helper Methods
  // --------------------------------------------------------------------------

  private validatePermission(permission: Permission): void {
    const parts = permission.split(':');
    if (parts.length !== 2) {
      throw new Error(
        `Invalid permission format: ${permission}. Expected 'resource:action'`
      );
    }
  }

  private matchPermission(
    permissions: Set<Permission>,
    resource: ResourceType,
    action: Action
  ): boolean {
    // Check for wildcard permission
    if (permissions.has('*:*')) return true;

    // Check for resource wildcard
    if (permissions.has(`${resource}:*`)) return true;
    if (permissions.has(`*:${action}`)) return true;

    // Check exact match
    return permissions.has(`${resource}:${action}`);
  }

  private async getApplicablePolicies(
    _context: RBACContext,
    resourcePattern: string,
    action: Action
  ): Promise<Policy[]> {
    await this.refreshCacheIfNeeded();

    return this.policyCache.filter((policy) => {
      // Check if action matches
      if (!policy.actions.includes('*') && !policy.actions.includes(action)) {
        return false;
      }

      // Check if resource matches
      const matches = policy.resources.some((pattern) => {
        if (pattern === '*') return true;
        if (pattern.endsWith('*')) {
          const prefix = pattern.slice(0, -1);
          return resourcePattern.startsWith(prefix);
        }
        return pattern === resourcePattern;
      });

      return matches;
    });
  }

  private evaluatePolicy(
    policy: Policy,
    context: RBACContext,
    _resourcePattern: string,
    _action: Action
  ): boolean {
    // Evaluate conditions
    if (policy.conditions?.length) {
      for (const condition of policy.conditions) {
        if (!this.evaluateCondition(condition, context)) {
          return false;
        }
      }
    }

    return true;
  }

  private evaluateCondition(
    condition: PolicyCondition,
    context: RBACContext
  ): boolean {
    let value: unknown;

    if (condition.type === 'attribute') {
      value = context.attributes?.[condition.field];
    } else if (condition.type === 'time_range') {
      value = context.timestamp ?? new Date();
    } else if (condition.type === 'ip_range') {
      value = context.ipAddress;
    }

    switch (condition.operator) {
      case 'equals':
        return value === condition.value;
      case 'not_equals':
        return value !== condition.value;
      case 'in':
        return Array.isArray(condition.value) && condition.value.includes(value);
      case 'not_in':
        return Array.isArray(condition.value) && !condition.value.includes(value);
      case 'contains':
        return typeof value === 'string' && value.includes(String(condition.value));
      case 'matches':
        return typeof value === 'string' && new RegExp(String(condition.value)).test(value);
      default:
        return false;
    }
  }

  private async refreshCacheIfNeeded(): Promise<void> {
    if (!this.config.cacheEnabled) {
      await this.loadData();
      return;
    }

    const now = Date.now();
    if (now - this.cacheTimestamp > this.config.cacheTTL * 1000) {
      await this.loadData();
      this.cacheTimestamp = now;
    }
  }

  private async loadData(): Promise<void> {
    const [roles, policies] = await Promise.all([
      this.storage.getRoles(),
      this.storage.getPolicies(),
    ]);

    this.roleCache.clear();
    for (const role of roles) {
      this.roleCache.set(role.id, role);
    }

    this.policyCache = policies;
  }

  private invalidateCache(): void {
    this.cacheTimestamp = 0;
    this.permissionCache.clear();
  }

  private async logAccess(
    context: RBACContext,
    action: string,
    resource: { type: ResourceType; id?: string },
    result: AccessCheckResult
  ): Promise<void> {
    const entry: AuditLogEntry = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2)}`,
      timestamp: new Date(),
      userId: context.userId,
      action,
      resourceType: resource.type,
      resourceId: resource.id ?? '*',
      allowed: result.allowed,
      deniedReason: result.reason,
      context: {
        roles: context.roles,
        ipAddress: context.ipAddress,
        matchedPolicy: result.matchedPolicy?.name,
        deniedBy: result.deniedBy?.name,
      },
    };

    await this.config.auditLogHandler(entry);
  }
}

// ============================================================================
// Memory Storage Adapter (for development)
// ============================================================================

class MemoryRBACStorage implements RBACStorageAdapter {
  private roles: Map<string, Role> = new Map();
  private policies: Map<string, Policy> = new Map();
  private userRoles: Map<string, UserRoleAssignment[]> = new Map();

  constructor() {
    // Initialize with system roles
    for (const role of SYSTEM_ROLES) {
      const id = `role-${role.name}`;
      this.roles.set(id, {
        ...role,
        id,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  }

  async getRoles(): Promise<Role[]> {
    return Array.from(this.roles.values());
  }

  async getRole(id: string): Promise<Role | null> {
    return this.roles.get(id) ?? null;
  }

  async createRole(role: Omit<Role, 'id' | 'createdAt' | 'updatedAt'>): Promise<Role> {
    const id = `role-${Date.now()}-${Math.random().toString(36).substring(2)}`;
    const now = new Date();
    const created: Role = {
      ...role,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.roles.set(id, created);
    return created;
  }

  async updateRole(id: string, updates: Partial<Role>): Promise<Role> {
    const existing = this.roles.get(id);
    if (!existing) throw new Error('Role not found');

    const updated = { ...existing, ...updates, updatedAt: new Date() };
    this.roles.set(id, updated);
    return updated;
  }

  async deleteRole(id: string): Promise<void> {
    this.roles.delete(id);
  }

  async getPolicies(): Promise<Policy[]> {
    return Array.from(this.policies.values());
  }

  async getPolicy(id: string): Promise<Policy | null> {
    return this.policies.get(id) ?? null;
  }

  async createPolicy(policy: Omit<Policy, 'id'>): Promise<Policy> {
    const id = `policy-${Date.now()}-${Math.random().toString(36).substring(2)}`;
    const created: Policy = { ...policy, id };
    this.policies.set(id, created);
    return created;
  }

  async updatePolicy(id: string, updates: Partial<Policy>): Promise<Policy> {
    const existing = this.policies.get(id);
    if (!existing) throw new Error('Policy not found');

    const updated = { ...existing, ...updates };
    this.policies.set(id, updated);
    return updated;
  }

  async deletePolicy(id: string): Promise<void> {
    this.policies.delete(id);
  }

  async getUserRoles(userId: string): Promise<UserRoleAssignment[]> {
    return this.userRoles.get(userId) ?? [];
  }

  async assignRole(assignment: Omit<UserRoleAssignment, 'grantedAt'>): Promise<UserRoleAssignment> {
    const full: UserRoleAssignment = {
      ...assignment,
      grantedAt: new Date(),
    };

    const existing = this.userRoles.get(assignment.userId) ?? [];
    existing.push(full);
    this.userRoles.set(assignment.userId, existing);

    return full;
  }

  async revokeRole(userId: string, roleId: string, scope?: string): Promise<void> {
    const existing = this.userRoles.get(userId) ?? [];
    const filtered = existing.filter(
      (a) => !(a.roleId === roleId && a.scope === scope)
    );
    this.userRoles.set(userId, filtered);
  }
}

// ============================================================================
// Factory Function
// ============================================================================

export function createRBACManager(config?: RBACConfig): RBACManager {
  return new RBACManager(config);
}

// ============================================================================
// Convenience Exports
// ============================================================================

export { MemoryRBACStorage };
