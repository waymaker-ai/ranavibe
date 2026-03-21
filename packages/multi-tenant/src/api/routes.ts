import * as http from 'http';
import { TenantManager } from '../tenant-manager';
import {
  RequestContext,
  sendJSON,
  sendError,
  hasPermission,
  checkTenantAccess,
} from './middleware';

/**
 * POST /api/tenants - Create a new tenant
 */
export async function createTenant(
  req: http.IncomingMessage,
  res: http.ServerResponse,
  ctx: RequestContext,
  manager: TenantManager,
): Promise<void> {
  const body = ctx.body as { name?: string; email?: string; plan?: string } | undefined;

  if (!body || !body.name || !body.email) {
    sendError(res, 400, 'Missing required fields: name, email');
    return;
  }

  if (body.plan && !['free', 'pro', 'enterprise'].includes(body.plan)) {
    sendError(res, 400, 'Invalid plan. Must be: free, pro, or enterprise');
    return;
  }

  try {
    const tenant = await manager.createTenant({
      name: body.name,
      email: body.email,
      plan: (body.plan as 'free' | 'pro' | 'enterprise') || undefined,
    });
    sendJSON(res, 201, tenant);
  } catch (err) {
    sendError(res, 500, (err as Error).message);
  }
}

/**
 * GET /api/tenants/:id - Get tenant details
 */
export async function getTenant(
  req: http.IncomingMessage,
  res: http.ServerResponse,
  ctx: RequestContext,
  manager: TenantManager,
): Promise<void> {
  const { id } = ctx.params;

  // Enforce tenant isolation if authenticated
  if (ctx.tenantId && !checkTenantAccess(ctx, id)) {
    sendError(res, 403, 'Access denied: tenant isolation');
    return;
  }

  const tenant = await manager.getTenant(id);
  if (!tenant) {
    sendError(res, 404, 'Tenant not found');
    return;
  }

  sendJSON(res, 200, tenant);
}

/**
 * POST /api/tenants/:id/projects - Create a project
 */
export async function createProject(
  req: http.IncomingMessage,
  res: http.ServerResponse,
  ctx: RequestContext,
  manager: TenantManager,
): Promise<void> {
  const { id: tenantId } = ctx.params;
  const body = ctx.body as { name?: string; description?: string } | undefined;

  if (ctx.tenantId && !checkTenantAccess(ctx, tenantId)) {
    sendError(res, 403, 'Access denied: tenant isolation');
    return;
  }

  if (!hasPermission(ctx, 'write')) {
    sendError(res, 403, 'Insufficient permissions: write required');
    return;
  }

  if (!body || !body.name) {
    sendError(res, 400, 'Missing required field: name');
    return;
  }

  try {
    const project = await manager.createProject(tenantId, {
      name: body.name,
      description: body.description,
    });
    sendJSON(res, 201, project);
  } catch (err) {
    sendError(res, (err as Error).message.includes('not found') ? 404 : 400, (err as Error).message);
  }
}

/**
 * GET /api/tenants/:id/projects - List projects for a tenant
 */
export async function listProjects(
  req: http.IncomingMessage,
  res: http.ServerResponse,
  ctx: RequestContext,
  manager: TenantManager,
): Promise<void> {
  const { id: tenantId } = ctx.params;

  if (ctx.tenantId && !checkTenantAccess(ctx, tenantId)) {
    sendError(res, 403, 'Access denied: tenant isolation');
    return;
  }

  const projects = await manager.listProjects(tenantId);
  sendJSON(res, 200, projects);
}

/**
 * PUT /api/projects/:id/policies - Assign policies to a project
 */
export async function assignPolicies(
  req: http.IncomingMessage,
  res: http.ServerResponse,
  ctx: RequestContext,
  manager: TenantManager,
): Promise<void> {
  const { id: projectId } = ctx.params;
  const body = ctx.body as {
    policies?: Array<{ policyId: string; policyName: string; config?: Record<string, unknown> }>;
  } | undefined;

  if (!hasPermission(ctx, 'write')) {
    sendError(res, 403, 'Insufficient permissions: write required');
    return;
  }

  if (!body || !body.policies || !Array.isArray(body.policies)) {
    sendError(res, 400, 'Missing required field: policies (array)');
    return;
  }

  // Validate each policy entry
  for (const policy of body.policies) {
    if (!policy.policyId || !policy.policyName) {
      sendError(res, 400, 'Each policy must have policyId and policyName');
      return;
    }
  }

  // Check tenant isolation
  const project = await manager.getProject(projectId);
  if (!project) {
    sendError(res, 404, 'Project not found');
    return;
  }

  if (ctx.tenantId && !checkTenantAccess(ctx, project.tenantId)) {
    sendError(res, 403, 'Access denied: tenant isolation');
    return;
  }

  try {
    const assignments = await manager.assignPolicies(projectId, body.policies);
    sendJSON(res, 200, assignments);
  } catch (err) {
    sendError(res, 400, (err as Error).message);
  }
}

/**
 * GET /api/projects/:id/policies - Get policies for a project
 */
export async function getProjectPolicies(
  req: http.IncomingMessage,
  res: http.ServerResponse,
  ctx: RequestContext,
  manager: TenantManager,
): Promise<void> {
  const { id: projectId } = ctx.params;

  const project = await manager.getProject(projectId);
  if (!project) {
    sendError(res, 404, 'Project not found');
    return;
  }

  if (ctx.tenantId && !checkTenantAccess(ctx, project.tenantId)) {
    sendError(res, 403, 'Access denied: tenant isolation');
    return;
  }

  const policies = await manager.getProjectPolicies(projectId);
  sendJSON(res, 200, policies);
}

/**
 * POST /api/projects/:id/evaluate - Evaluate content against project policies
 */
export async function evaluateContent(
  req: http.IncomingMessage,
  res: http.ServerResponse,
  ctx: RequestContext,
  manager: TenantManager,
): Promise<void> {
  const { id: projectId } = ctx.params;
  const body = ctx.body as { content?: string; context?: Record<string, unknown> } | undefined;

  if (!hasPermission(ctx, 'evaluate')) {
    sendError(res, 403, 'Insufficient permissions: evaluate required');
    return;
  }

  if (!body || !body.content) {
    sendError(res, 400, 'Missing required field: content');
    return;
  }

  const project = await manager.getProject(projectId);
  if (!project) {
    sendError(res, 404, 'Project not found');
    return;
  }

  if (ctx.tenantId && !checkTenantAccess(ctx, project.tenantId)) {
    sendError(res, 403, 'Access denied: tenant isolation');
    return;
  }

  try {
    const result = await manager.evaluateContent(projectId, {
      content: body.content,
      context: body.context,
    });
    sendJSON(res, 200, result);
  } catch (err) {
    const message = (err as Error).message;
    const status = message.includes('limit reached') ? 429 : 400;
    sendError(res, status, message);
  }
}

/**
 * POST /api/keys - Generate an API key
 */
export async function createApiKey(
  req: http.IncomingMessage,
  res: http.ServerResponse,
  ctx: RequestContext,
  manager: TenantManager,
): Promise<void> {
  const body = ctx.body as {
    tenantId?: string;
    name?: string;
    permissions?: string[];
  } | undefined;

  if (!body || !body.tenantId || !body.name) {
    sendError(res, 400, 'Missing required fields: tenantId, name');
    return;
  }

  if (ctx.tenantId && !checkTenantAccess(ctx, body.tenantId)) {
    sendError(res, 403, 'Access denied: tenant isolation');
    return;
  }

  if (!hasPermission(ctx, 'admin')) {
    sendError(res, 403, 'Insufficient permissions: admin required');
    return;
  }

  const validPermissions = ['read', 'write', 'evaluate', 'admin'];
  if (body.permissions) {
    for (const perm of body.permissions) {
      if (!validPermissions.includes(perm)) {
        sendError(res, 400, `Invalid permission: ${perm}. Valid: ${validPermissions.join(', ')}`);
        return;
      }
    }
  }

  try {
    const apiKey = await manager.createApiKey(body.tenantId, {
      name: body.name,
      permissions: body.permissions as Array<'read' | 'write' | 'evaluate' | 'admin'>,
    });
    sendJSON(res, 201, apiKey);
  } catch (err) {
    sendError(res, 400, (err as Error).message);
  }
}

/**
 * GET /api/usage/:tenantId - Get usage report
 */
export async function getUsageReport(
  req: http.IncomingMessage,
  res: http.ServerResponse,
  ctx: RequestContext,
  manager: TenantManager,
): Promise<void> {
  const { tenantId } = ctx.params;

  if (ctx.tenantId && !checkTenantAccess(ctx, tenantId)) {
    sendError(res, 403, 'Access denied: tenant isolation');
    return;
  }

  try {
    const report = await manager.getUsageReport(
      tenantId,
      ctx.query.from,
      ctx.query.to,
    );
    sendJSON(res, 200, report);
  } catch (err) {
    sendError(res, (err as Error).message.includes('not found') ? 404 : 400, (err as Error).message);
  }
}
